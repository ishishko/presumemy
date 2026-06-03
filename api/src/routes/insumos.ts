import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, badRequest, conflict } from '../utils/errors.js'
import {
  insumoSchema,
  insumoUpdateSchema,
  insumoProveedorSchema,
  paginationSchema,
} from '../types/insumos.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// GET /api/insumos — Lista con filtros
// =========================================================
route.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, estado, categoriaId } = c.req.valid('query')
  const offset = (page - 1) * limit

  const where: any = { activo: true }

  if (categoriaId) {
    where.categoriaId = categoriaId
  }

  if (estado !== 'todos') {
    const insumos = await prisma.insumo.findMany({
      where,
      include: {
        categoria: true,
        proveedores: {
          include: { proveedor: true },
          orderBy: [{ esPrincipal: 'desc' }],
        },
      },
      orderBy: { nombre: 'asc' },
    })

    const filtered = insumos.filter((i) => {
      const stock = Number(i.stock)
      const min = Number(i.stockMinimo)
      if (estado === 'critico') return stock < min * 0.5
      if (estado === 'bajo') return stock >= min * 0.5 && stock < min
      if (estado === 'ok') return stock >= min
      return true
    })

    return c.json({
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    })
  }

  const [insumos, total] = await Promise.all([
    prisma.insumo.findMany({
      where,
      include: {
        categoria: true,
        proveedores: {
          include: { proveedor: true },
          orderBy: [{ esPrincipal: 'desc' }],
        },
      },
      orderBy: { nombre: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.insumo.count({ where }),
  ])

  return c.json({
    data: insumos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// =========================================================
// GET /api/insumos/categorias — Lista categorias insumo
// =========================================================
route.get('/categorias', async (c) => {
  const categorias = await prisma.categoriaInsumo.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })
  return c.json({ data: categorias })
})

// =========================================================
// GET /api/insumos/:id — Detalle con proveedores
// =========================================================
route.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const insumo = await prisma.insumo.findUnique({
    where: { id, activo: true },
    include: {
      categoria: true,
      proveedores: {
        include: { proveedor: true },
        orderBy: [{ esPrincipal: 'desc' }],
      },
    },
  })

  if (!insumo) {
    throw notFound('Insumo no encontrado')
  }

  return c.json({ data: insumo })
})

// =========================================================
// POST /api/insumos — Crear insumo
// =========================================================
route.post('/', zValidator('json', insumoSchema), async (c) => {
  const data = c.req.valid('json')

  const costoUnitario = Number(data.costoPaquete) / Number(data.cantidadPack)

  const lastInsumo = await prisma.insumo.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  })

  const nextId = (lastInsumo?.id ?? 1000) + 1

  const insumo = await prisma.insumo.create({
    data: {
      nombre: data.nombre,
      codigo: `I-${nextId}`,
      categoriaId: data.categoriaId,
      unidad: data.unidad,
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      costoPaquete: data.costoPaquete,
      cantidadPack: data.cantidadPack,
      costoUnitario,
      notas: data.notas || null,
      fechaActualizacion: new Date(),
    },
    include: {
      categoria: true,
      proveedores: { include: { proveedor: true } },
    },
  })

  return c.json({ data: insumo }, 201)
})

// =========================================================
// PUT /api/insumos/:id — Actualizar insumo
// =========================================================
route.put('/:id', zValidator('json', insumoUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.insumo.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Insumo no encontrado')
  }

  const costoPaquete = data.costoPaquete ?? existing.costoPaquete
  const cantidadPack = data.cantidadPack ?? existing.cantidadPack
  const costoUnitario = Number(costoPaquete) / Number(cantidadPack)

  const insumo = await prisma.insumo.update({
    where: { id },
    data: {
      ...data,
      costoUnitario,
      fechaActualizacion: new Date(),
    },
    include: {
      categoria: true,
      proveedores: { include: { proveedor: true } },
    },
  })

  return c.json({ data: insumo })
})

// =========================================================
// DELETE /api/insumos/:id — Soft delete
// =========================================================
route.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.insumo.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Insumo no encontrado')
  }

  await prisma.insumo.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Insumo eliminado' })
})

// =========================================================
// POST /api/insumos/:id/proveedores — Agregar proveedor
// =========================================================
route.post('/:id/proveedores', zValidator('json', insumoProveedorSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.insumo.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Insumo no encontrado')
  }

  const count = await prisma.insumoProveedor.count({
    where: { insumoId: id },
  })

  if (count >= 3) {
    throw conflict('Maximo 3 proveedores por insumo')
  }

  if (data.esPrincipal) {
    await prisma.insumoProveedor.updateMany({
      where: { insumoId: id },
      data: { esPrincipal: false },
    })
  }

  const proveedor = await prisma.insumoProveedor.create({
    data: {
      insumoId: id,
      proveedorId: data.proveedorId,
      esPrincipal: data.esPrincipal,
      precio: data.precio,
    },
    include: { proveedor: true },
  })

  return c.json({ data: proveedor }, 201)
})

// =========================================================
// PUT /api/insumos/:id/proveedores/:provId — Actualizar proveedor
// =========================================================
route.put('/:id/proveedores/:provId', zValidator('json', insumoProveedorSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const provId = parseInt(c.req.param('provId'))
  const data = c.req.valid('json')

  const existing = await prisma.insumoProveedor.findUnique({
    where: { id: provId },
  })

  if (!existing || existing.insumoId !== id) {
    throw notFound('Proveedor no encontrado')
  }

  if (data.esPrincipal) {
    await prisma.insumoProveedor.updateMany({
      where: { insumoId: id, id: { not: provId } },
      data: { esPrincipal: false },
    })
  }

  const proveedor = await prisma.insumoProveedor.update({
    where: { id: provId },
    data: {
      proveedorId: data.proveedorId,
      esPrincipal: data.esPrincipal,
      precio: data.precio,
    },
    include: { proveedor: true },
  })

  return c.json({ data: proveedor })
})

// =========================================================
// DELETE /api/insumos/:id/proveedores/:provId — Eliminar proveedor
// =========================================================
route.delete('/:id/proveedores/:provId', async (c) => {
  const id = parseInt(c.req.param('id'))
  const provId = parseInt(c.req.param('provId'))

  const existing = await prisma.insumoProveedor.findUnique({
    where: { id: provId },
  })

  if (!existing || existing.insumoId !== id) {
    throw notFound('Proveedor no encontrado')
  }

  await prisma.insumoProveedor.delete({
    where: { id: provId },
  })

  return c.json({ message: 'Proveedor eliminado' })
})

export default route
