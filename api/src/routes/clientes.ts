import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound } from '../utils/errors.js'
import { clienteSchema, clienteUpdateSchema, paginationSchema } from '../types/clientes.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// GET /api/clientes — Lista con filtros
// =========================================================
route.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, search } = c.req.valid('query')
  const offset = (page - 1) * limit

  const where: any = { activo: true }

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { codigo: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: {
        contactos: {
          where: { esPrincipal: true },
          take: 1,
        },
        presupuestos: {
          where: { activo: true },
          select: { id: true, total: true },
        },
      },
      orderBy: { nombre: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.cliente.count({ where }),
  ])

  const clientesConStats = clientes.map((cliente) => {
    const totalPedidos = cliente.presupuestos.length
    const totalGastado = cliente.presupuestos.reduce(
      (sum, p) => sum + Number(p.total),
      0
    )
    return {
      ...cliente,
      totalPedidos,
      totalGastado,
    }
  })

  return c.json({
    data: clientesConStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// =========================================================
// GET /api/clientes/:id — Detalle con contactos y presupuestos
// =========================================================
route.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const cliente = await prisma.cliente.findUnique({
    where: { id, activo: true },
    include: {
      contactos: {
        orderBy: [{ esPrincipal: 'desc' }],
      },
      presupuestos: {
        where: { activo: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!cliente) {
    throw notFound('Cliente no encontrado')
  }

  return c.json({ data: cliente })
})

// =========================================================
// POST /api/clientes — Crear cliente
// =========================================================
route.post('/', zValidator('json', clienteSchema), async (c) => {
  const data = c.req.valid('json')

  const lastCliente = await prisma.cliente.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  })

  const nextId = (lastCliente?.id ?? 0) + 1

  const cliente = await prisma.cliente.create({
    data: {
      nombre: data.nombre,
      codigo: `C-${nextId}`,
      domicilio: data.domicilio ?? Prisma.JsonNull,
      notas: data.notas || null,
      contactos: data.contactos ? {
        create: data.contactos.map((contacto, index) => ({
          canal: contacto.canal,
          valor: contacto.valor,
          esPrincipal: index === 0 ? true : contacto.esPrincipal,
        })),
      } : undefined,
    },
    include: {
      contactos: true,
    },
  })

  return c.json({ data: cliente }, 201)
})

// =========================================================
// PUT /api/clientes/:id — Actualizar cliente + contactos
// =========================================================
route.put('/:id', zValidator('json', clienteUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.cliente.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Cliente no encontrado')
  }

  const { contactos, ...clienteData } = data

  if (clienteData.domicilio === null) {
    clienteData.domicilio = Prisma.JsonNull as any
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      ...clienteData,
      contactos: contactos ? {
        deleteMany: {},
        create: contactos.map((contacto, index) => ({
          canal: contacto.canal,
          valor: contacto.valor,
          esPrincipal: index === 0 ? true : contacto.esPrincipal,
        })),
      } : undefined,
    },
    include: {
      contactos: true,
    },
  })

  return c.json({ data: cliente })
})

// =========================================================
// DELETE /api/clientes/:id — Soft delete
// =========================================================
route.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.cliente.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Cliente no encontrado')
  }

  await prisma.cliente.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Cliente eliminado' })
})

export default route
