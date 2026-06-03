import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'
import {
  transaccionSchema,
  transaccionUpdateSchema,
  ordenImprentaSchema,
  ordenImprentaUpdateSchema,
  distribucionSchema,
  paginationSchema,
} from '../types/finanzas.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// GET /api/transacciones — Lista con filtros + KPIs
// =========================================================
route.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, tipo, cuenta, mes, anio } = c.req.valid('query')
  const offset = (page - 1) * limit

  const where: any = { activo: true }

  if (tipo) {
    where.tipo = tipo
  }

  if (cuenta) {
    where.cuenta = cuenta
  }

  if (mes && anio) {
    const startDate = new Date(anio, mes - 1, 1)
    const endDate = new Date(anio, mes, 0, 23, 59, 59)
    where.fecha = {
      gte: startDate,
      lte: endDate,
    }
  }

  const [transacciones, total] = await Promise.all([
    prisma.transaccion.findMany({
      where,
      include: {
        presupuesto: {
          select: { id: true, folio: true },
        },
      },
      orderBy: { fecha: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.transaccion.count({ where }),
  ])

  const kpis = await getKpisForPeriod(mes, anio)

  return c.json({
    data: transacciones,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    kpis,
  })
})

// =========================================================
// POST /api/transacciones — Crear transaccion
// =========================================================
route.post('/', zValidator('json', transaccionSchema), async (c) => {
  const data = c.req.valid('json')

  const transaccion = await prisma.transaccion.create({
    data: {
      tipo: data.tipo,
      cuenta: data.cuenta,
      monto: data.monto,
      fecha: new Date(data.fecha),
      referencia: data.referencia || null,
      detalle: data.detalle || null,
      nroFactura: data.nroFactura || null,
      presupuestoId: data.presupuestoId || null,
    },
    include: {
      presupuesto: {
        select: { id: true, folio: true },
      },
    },
  })

  return c.json({ data: transaccion }, 201)
})

// =========================================================
// PUT /api/transacciones/:id — Actualizar transaccion
// =========================================================
route.put('/:id', zValidator('json', transaccionUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.transaccion.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Transaccion no encontrada')
  }

  const transaccion = await prisma.transaccion.update({
    where: { id },
    data,
    include: {
      presupuesto: {
        select: { id: true, folio: true },
      },
    },
  })

  return c.json({ data: transaccion })
})

// =========================================================
// DELETE /api/transacciones/:id — Soft delete
// =========================================================
route.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.transaccion.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Transaccion no encontrada')
  }

  await prisma.transaccion.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Transaccion eliminada' })
})

// =========================================================
// GET /api/ordenes-imprenta — Lista por periodo
// =========================================================
route.get('/ordenes-imprenta', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, mes, anio } = c.req.valid('query')
  const offset = (page - 1) * limit

  const where: any = { activo: true }

  if (mes && anio) {
    const startDate = new Date(anio, mes - 1, 1)
    const endDate = new Date(anio, mes, 0, 23, 59, 59)
    where.fecha = {
      gte: startDate,
      lte: endDate,
    }
  }

  const [ordenes, total] = await Promise.all([
    prisma.ordenImprenta.findMany({
      where,
      include: {
        presupuesto: {
          select: { id: true, folio: true },
        },
        producto: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { fecha: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.ordenImprenta.count({ where }),
  ])

  return c.json({
    data: ordenes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// =========================================================
// POST /api/ordenes-imprenta — Crear orden
// =========================================================
route.post('/ordenes-imprenta', zValidator('json', ordenImprentaSchema), async (c) => {
  const data = c.req.valid('json')

  const diferencia = data.pagado ? 0 : data.valorTotal

  const orden = await prisma.ordenImprenta.create({
    data: {
      fecha: new Date(data.fecha),
      presupuestoId: data.presupuestoId || null,
      productoId: data.productoId || null,
      tematica: data.tematica || null,
      hojas: data.hojas,
      tipoHoja: data.tipoHoja,
      valorUnitario: data.valorUnitario,
      valorTotal: data.valorTotal,
      metodoPago: data.metodoPago,
      pagado: data.pagado,
      diferencia,
    },
    include: {
      presupuesto: {
        select: { id: true, folio: true },
      },
      producto: {
        select: { id: true, nombre: true },
      },
    },
  })

  return c.json({ data: orden }, 201)
})

// =========================================================
// PUT /api/ordenes-imprenta/:id — Actualizar orden
// =========================================================
route.put('/ordenes-imprenta/:id', zValidator('json', ordenImprentaUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.ordenImprenta.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Orden no encontrada')
  }

  const diferencia = data.pagado !== undefined
    ? (data.pagado ? 0 : (data.valorTotal ?? existing.valorTotal))
    : (data.pagado ? 0 : existing.diferencia)

  const orden = await prisma.ordenImprenta.update({
    where: { id },
    data: {
      ...data,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
      diferencia,
    },
    include: {
      presupuesto: {
        select: { id: true, folio: true },
      },
      producto: {
        select: { id: true, nombre: true },
      },
    },
  })

  return c.json({ data: orden })
})

// =========================================================
// DELETE /api/ordenes-imprenta/:id — Soft delete
// =========================================================
route.delete('/ordenes-imprenta/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.ordenImprenta.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Orden no encontrada')
  }

  await prisma.ordenImprenta.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Orden eliminada' })
})

// =========================================================
// GET /api/distribucion — Distribucion actual
// =========================================================
route.get('/distribucion', async (c) => {
  const distribucion = await prisma.distribucionGanancia.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return c.json({ data: distribucion })
})

// =========================================================
// PUT /api/distribucion — Actualizar distribucion
// =========================================================
route.put('/distribucion', zValidator('json', distribucionSchema), async (c) => {
  const { items } = c.req.valid('json')

  const total = items.reduce((sum, item) => sum + item.porcentaje, 0)

  if (total > 100) {
    throw badRequest('La suma de porcentajes no puede superar 100%')
  }

  await Promise.all(
    items.map((item) =>
      prisma.distribucionGanancia.update({
        where: { id: item.id },
        data: { porcentaje: item.porcentaje },
      })
    )
  )

  const distribucion = await prisma.distribucionGanancia.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return c.json({ data: distribucion })
})

// =========================================================
// Helpers
// =========================================================
async function getKpisForPeriod(mes?: number | null, anio?: number | null) {
  const where: any = { activo: true }

  if (mes && anio) {
    const startDate = new Date(anio, mes - 1, 1)
    const endDate = new Date(anio, mes, 0, 23, 59, 59)
    where.fecha = {
      gte: startDate,
      lte: endDate,
    }
  }

  const transacciones = await prisma.transaccion.findMany({
    where,
    select: { tipo: true, monto: true },
  })

  const tiposIngreso = [
    'venta_producto', 'venta_presupuesto', 'cobro_cliente',
    'deposito', 'ajuste_positivo',
  ]

  const tiposEgreso = [
    'compra_insumo', 'pago_servicio', 'pago_imprenta',
    'pago_alquiler', 'pago_sueldo', 'retiro_socio', 'ajuste_negativo',
  ]

  const ingresos = transacciones
    .filter((t) => tiposIngreso.includes(t.tipo))
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const egresos = transacciones
    .filter((t) => tiposEgreso.includes(t.tipo))
    .reduce((sum, t) => sum + Number(t.monto), 0)

  return {
    ingresos,
    egresos,
    utilidad: ingresos - egresos,
  }
}

export default route
