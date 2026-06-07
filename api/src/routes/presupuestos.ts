import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, forbidden } from '../utils/errors.js'
import { canTransition } from '../utils/fsm.js'
import {
  presupuestoSchema,
  presupuestoUpdateSchema,
  estadoChangeSchema,
  paginationSchema,
} from '../types/presupuestos.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// GET /api/presupuestos — Lista con filtros
// =========================================================
route.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, estado, clienteId } = c.req.valid('query')
  const offset = (page - 1) * limit

  const where: any = { activo: true }

  if (estado !== 'todos') {
    where.estado = estado
  }

  if (clienteId) {
    where.clienteId = clienteId
  }

  const [presupuestos, total] = await Promise.all([
    prisma.presupuesto.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true, codigo: true },
        },
        detalles: {
          include: { producto: true },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.presupuesto.count({ where }),
  ])

  return c.json({
    data: presupuestos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// =========================================================
// GET /api/presupuestos/:id — Detalle con lineas
// =========================================================
route.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id, activo: true },
    include: {
      cliente: true,
      detalles: {
        include: { producto: true },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (!presupuesto) {
    throw notFound('Presupuesto no encontrado')
  }

  return c.json({ data: presupuesto })
})

// =========================================================
// POST /api/presupuestos — Crear presupuesto
// =========================================================
route.post('/', zValidator('json', presupuestoSchema), async (c) => {
  const data = c.req.valid('json')

  const lastPresupuesto = await prisma.presupuesto.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  })

  const nextId = (lastPresupuesto?.id ?? 1000) + 1

  const total = data.detalles.reduce(
    (sum, d) => sum + Number(d.cantidad) * Number(d.precioUnitario),
    0
  )

  const presupuesto = await prisma.presupuesto.create({
    data: {
      folio: `P-${nextId}`,
      clienteId: data.clienteId,
      tematica: data.tematica || null,
      estado: 'borrador',
      tipoEntrega: data.tipoEntrega,
      direccionEntrega: data.direccionEntrega || null,
      fechaFiesta: data.fechaFiesta ? new Date(data.fechaFiesta) : null,
      fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : null,
      metodoPago: data.metodoPago || null,
      sena: data.sena,
      total,
      notas: data.notas || null,
      detalles: {
        create: data.detalles.map((detalle, index) => ({
          productoId: detalle.productoId,
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.cantidad * detalle.precioUnitario,
          orden: index,
        })),
      },
    },
    include: {
      cliente: true,
      detalles: { include: { producto: true } },
    },
  })

  return c.json({ data: presupuesto }, 201)
})

// =========================================================
// PUT /api/presupuestos/:id — Actualizar presupuesto
// =========================================================
route.put('/:id', zValidator('json', presupuestoUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.presupuesto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Presupuesto no encontrado')
  }

  if (existing.estado !== 'borrador') {
    throw forbidden('Solo se pueden editar presupuestos en estado borrador')
  }

  const { detalles, ...presupuestoData } = data

  const total = detalles
    ? detalles.reduce(
        (sum, d) => sum + Number(d.cantidad) * Number(d.precioUnitario),
        0
      )
    : existing.total

  const presupuesto = await prisma.presupuesto.update({
    where: { id },
    data: {
      ...presupuestoData,
      fechaFiesta: presupuestoData.fechaFiesta ? new Date(presupuestoData.fechaFiesta) : undefined,
      fechaEntrega: presupuestoData.fechaEntrega ? new Date(presupuestoData.fechaEntrega) : undefined,
      total,
      detalles: detalles ? {
        deleteMany: {},
        create: detalles.map((detalle, index) => ({
          productoId: detalle.productoId,
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.cantidad * detalle.precioUnitario,
          orden: index,
        })),
      } : undefined,
    },
    include: {
      cliente: true,
      detalles: { include: { producto: true } },
    },
  })

  return c.json({ data: presupuesto })
})

// =========================================================
// PATCH /api/presupuestos/:id/estado — Cambiar estado (FSM)
// =========================================================
route.patch('/:id/estado', zValidator('json', estadoChangeSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const { estado: nuevoEstado } = c.req.valid('json')

  const existing = await prisma.presupuesto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Presupuesto no encontrado')
  }

  if (!canTransition(existing.estado, nuevoEstado)) {
    throw forbidden(
      `No se puede cambiar de "${existing.estado}" a "${nuevoEstado}"`
    )
  }

  const presupuesto = await prisma.presupuesto.update({
    where: { id },
    data: { estado: nuevoEstado },
    include: {
      cliente: true,
      detalles: { include: { producto: true } },
    },
  })

  return c.json({ data: presupuesto })
})

// =========================================================
// DELETE /api/presupuestos/:id — Soft delete
// =========================================================
route.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.presupuesto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Presupuesto no encontrado')
  }

  await prisma.presupuesto.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Presupuesto eliminado' })
})

export default route
