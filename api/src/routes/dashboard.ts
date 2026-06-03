import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// GET /api/dashboard/stats — KPIs agregados
// =========================================================
route.get('/stats', async (c) => {
  const now = new Date()
  const mesActual = now.getMonth() + 1
  const anioActual = now.getFullYear()

  const startDate = new Date(anioActual, mesActual - 1, 1)
  const endDate = new Date(anioActual, mesActual, 0, 23, 59, 59)

  const [
    presupuestosRecientes,
    insumosBajos,
    statsPresupuestos,
    statsFinanzas,
  ] = await Promise.all([
    prisma.presupuesto.findMany({
      where: { activo: true },
      include: {
        cliente: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.insumo.findMany({
      where: {
        activo: true,
        stock: { lt: prisma.insumo.fields.stockMinimo },
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        stock: true,
        stockMinimo: true,
        unidad: true,
      },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.presupuesto.groupBy({
      by: ['estado'],
      where: { activo: true },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.transaccion.findMany({
      where: {
        activo: true,
        fecha: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { tipo: true, monto: true },
    }),
  ])

  const tiposIngreso = [
    'venta_producto', 'venta_presupuesto', 'cobro_cliente',
    'deposito', 'ajuste_positivo',
  ]

  const tiposEgreso = [
    'compra_insumo', 'pago_servicio', 'pago_imprenta',
    'pago_alquiler', 'pago_sueldo', 'retiro_socio', 'ajuste_negativo',
  ]

  const ingresosMes = statsFinanzas
    .filter((t) => tiposIngreso.includes(t.tipo))
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const egresosMes = statsFinanzas
    .filter((t) => tiposEgreso.includes(t.tipo))
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const porCobrar = statsPresupuestos
    .filter((s) => ['enviado', 'en_curso'].includes(s.estado))
    .reduce((sum, s) => sum + Number(s._sum.total || 0), 0)

  return c.json({
    data: {
      kpis: {
        ingresosMes,
        egresosMes,
        utilidadMes: ingresosMes - egresosMes,
        porCobrar,
        insumosBajosCount: insumosBajos.length,
      },
      presupuestosRecientes,
      insumosBajos,
      statsPorEstado: statsPresupuestos,
    },
  })
})

export default route
