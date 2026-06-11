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

  const estadoInicial = data.estado || 'borrador'

  if (estadoInicial === 'facturado') {
    // Fetch shares outside transaction to minimize transaction time
    const shares = await prisma.distribucionGanancia.findMany({
      where: { activo: true }
    })

    // Calculate BOM cost
    let costoInsumosTotal = 0
    const productIds = data.detalles.map(d => d.productoId).filter(Boolean)
    if (productIds.length > 0) {
      const products = await prisma.producto.findMany({
        where: { id: { in: productIds } },
        include: {
          bomLineas: {
            where: { tipoLinea: 'insumo' }
          }
        }
      })
      for (const d of data.detalles) {
        const p = products.find((prod: any) => prod.id === d.productoId)
        const qty = Number(d.cantidad)
        const bomCost = p?.bomLineas?.reduce((sum: number, line: any) => sum + Number(line.subtotal), 0) ?? 0
        costoInsumosTotal += qty * bomCost
      }
    }

    const gananciaNeta = total - costoInsumosTotal

    const budget = await prisma.$transaction(async (tx) => {
      // Create the budget
      const p = await tx.presupuesto.create({
        data: {
          folio: `P-${nextId}`,
          clienteId: data.clienteId,
          tematica: data.tematica || null,
          estado: 'facturado',
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

      // A. Create income transaction for the remainder (total - sena)
      const remainder = total - Number(data.sena)
      if (remainder > 0) {
        await tx.transaccion.create({
          data: {
            tipo: 'venta_presupuesto',
            cuenta: 'efectivo',
            monto: remainder,
            fecha: new Date(),
            referencia: p.folio,
            detalle: `Ingreso - saldo cobrado folio ${p.folio}`,
            presupuestoId: p.id
          }
        })
      }

      // B. Create egreso insumos transaction
      if (costoInsumosTotal > 0) {
        await tx.transaccion.create({
          data: {
            tipo: 'compra_insumo',
            cuenta: 'efectivo',
            monto: costoInsumosTotal,
            fecha: new Date(),
            referencia: p.folio,
            detalle: `Egreso - materiales del BOM folio ${p.folio}`,
            presupuestoId: p.id
          }
        })
      }

      // C. Create retiro socio transactions
      if (gananciaNeta > 0) {
        const finalShares = shares.length > 0 ? shares : [
          { nombre: 'Meme', porcentaje: new Prisma.Decimal(40) },
          { nombre: 'Pety', porcentaje: new Prisma.Decimal(30) },
          { nombre: 'Gastos', porcentaje: new Prisma.Decimal(30) }
        ]

        for (const share of finalShares) {
          const shareAmount = gananciaNeta * (Number(share.porcentaje) / 100)
          if (shareAmount > 0) {
            await tx.transaccion.create({
              data: {
                tipo: 'retiro_socio',
                cuenta: 'efectivo',
                monto: shareAmount,
                fecha: new Date(),
                referencia: p.folio,
                detalle: `Distribución - Retiro ${share.nombre} (${Number(share.porcentaje)}%) folio ${p.folio}`,
                presupuestoId: p.id
              }
            })
          }
        }
      }

      return p
    }, {
      maxWait: 15000,
      timeout: 30000
    })

    return c.json({ data: budget }, 201)
  }

  const presupuesto = await prisma.presupuesto.create({
    data: {
      folio: `P-${nextId}`,
      clienteId: data.clienteId,
      tematica: data.tematica || null,
      estado: estadoInicial,
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

  if (existing.estado !== 'borrador' && existing.estado !== 'en_curso') {
    throw forbidden('Solo se pueden editar presupuestos en estado borrador o en curso')
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

  // If state is transitioning to 'facturado', run the automatic distribution logic
  if (nuevoEstado === 'facturado') {
    // 1. Calculate cost of insumos
    const detailsWithBom = await prisma.detallePresupuesto.findMany({
      where: { presupuestoId: id },
      include: {
        producto: {
          include: {
            bomLineas: {
              where: { tipoLinea: 'insumo' }
            }
          }
        }
      }
    })

    let costoInsumosTotal = 0
    for (const d of detailsWithBom) {
      const qty = Number(d.cantidad)
      const bomCost = d.producto?.bomLineas?.reduce((sum, line) => sum + Number(line.subtotal), 0) ?? 0
      costoInsumosTotal += qty * bomCost
    }

    // 2. Calculate imprenta costs
    const imprentaOrders = await prisma.ordenImprenta.findMany({
      where: { presupuestoId: id, activo: true }
    })
    const costoImprentaTotal = imprentaOrders.reduce((sum, o) => sum + Number(o.valorTotal), 0)

    // 3. Calculate net profit
    const totalPresupuesto = Number(existing.total)
    const gananciaNeta = totalPresupuesto - costoInsumosTotal - costoImprentaTotal

    // Fetch shares outside transaction to minimize transaction time
    const shares = gananciaNeta > 0
      ? await prisma.distribucionGanancia.findMany({ where: { activo: true } })
      : []

    // Execute in transaction with increased timeout for remote DB
    const presupuesto = await prisma.$transaction(async (tx) => {
      // Update state to facturado
      const p = await tx.presupuesto.update({
        where: { id },
        data: { estado: 'facturado' },
        include: {
          cliente: true,
          detalles: { include: { producto: true } },
        },
      })

      // A. Create income transaction for the remainder (total - sena)
      const remainder = totalPresupuesto - Number(existing.sena)
      if (remainder > 0) {
        await tx.transaccion.create({
          data: {
            tipo: 'venta_presupuesto',
            cuenta: 'efectivo',
            monto: remainder,
            fecha: new Date(),
            referencia: p.folio,
            detalle: `Ingreso - saldo cobrado folio ${p.folio}`,
            presupuestoId: id
          }
        })
      }

      // B. Create egreso insumos transaction
      if (costoInsumosTotal > 0) {
        await tx.transaccion.create({
          data: {
            tipo: 'compra_insumo',
            cuenta: 'efectivo',
            monto: costoInsumosTotal,
            fecha: new Date(),
            referencia: p.folio,
            detalle: `Egreso - materiales del BOM folio ${p.folio}`,
            presupuestoId: id
          }
        })
      }

      // C. Create egreso imprenta transaction
      if (costoImprentaTotal > 0) {
        await tx.transaccion.create({
          data: {
            tipo: 'pago_imprenta',
            cuenta: 'efectivo',
            monto: costoImprentaTotal,
            fecha: new Date(),
            referencia: p.folio,
            detalle: `Egreso - costos de imprenta y plotter folio ${p.folio}`,
            presupuestoId: id
          }
        })
      }

      // D. Create retiro socio transactions
      if (gananciaNeta > 0) {
        const finalShares = shares.length > 0 ? shares : [
          { nombre: 'Meme', porcentaje: new Prisma.Decimal(40) },
          { nombre: 'Pety', porcentaje: new Prisma.Decimal(30) },
          { nombre: 'Gastos', porcentaje: new Prisma.Decimal(30) }
        ]

        for (const share of finalShares) {
          const shareAmount = gananciaNeta * (Number(share.porcentaje) / 100)
          if (shareAmount > 0) {
            await tx.transaccion.create({
              data: {
                tipo: 'retiro_socio',
                cuenta: 'efectivo',
                monto: shareAmount,
                fecha: new Date(),
                referencia: p.folio,
                detalle: `Distribución - Retiro ${share.nombre} (${Number(share.porcentaje)}%) folio ${p.folio}`,
                presupuestoId: id
              }
            })
          }
        }
      }

      return p
    }, {
      maxWait: 15000,
      timeout: 30000
    })

    return c.json({ data: presupuesto })
  } else {
    // Normal transitions
    const updateData: any = { estado: nuevoEstado }
    if (nuevoEstado === 'cerrado') {
      updateData.fechaFinalizacion = new Date()
    } else if (nuevoEstado === 'en_curso') {
      updateData.fechaFinalizacion = null
    }

    const presupuesto = await prisma.presupuesto.update({
      where: { id },
      data: updateData,
      include: {
        cliente: true,
        detalles: { include: { producto: true } },
      },
    })

    return c.json({ data: presupuesto })
  }
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
