import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { notFound } from '../utils/errors.js'

const route = new Hono()

// =========================================================
// GET /api/public/presupuestos/:token — Vista pública por token
// Sin auth. Solo visible fuera de borrador/cancelado.
// DTO acotado: sin ids internos, costos ni datos sensibles del cliente.
// =========================================================
route.get('/presupuestos/:token', async (c) => {
  const token = c.req.param('token')

  const presupuesto = await prisma.presupuesto.findFirst({
    where: { publicToken: token, activo: true },
    include: {
      cliente: { select: { nombre: true } },
      detalles: {
        select: { descripcion: true, cantidad: true, precioUnitario: true, subtotal: true },
        orderBy: { orden: 'asc' },
      },
    },
  })

  if (!presupuesto || presupuesto.estado === 'borrador' || presupuesto.estado === 'cancelado') {
    throw notFound('Presupuesto no encontrado')
  }

  const config = await prisma.configuracionNegocio.findUnique({ where: { id: 1 } })

  return c.json({
    data: {
      folio: presupuesto.folio,
      createdAt: presupuesto.createdAt,
      estado: presupuesto.estado,
      cliente: presupuesto.cliente.nombre,
      tematica: presupuesto.tematica,
      fechaFiesta: presupuesto.fechaFiesta,
      fechaEntrega: presupuesto.fechaEntrega,
      tipoEntrega: presupuesto.tipoEntrega,
      direccionEntrega: presupuesto.direccionEntrega,
      metodoPago: presupuesto.metodoPago,
      sena: presupuesto.sena,
      total: presupuesto.total,
      notas: presupuesto.notasPublicas ? presupuesto.notas : null,
      detalles: presupuesto.detalles,
      config: config
        ? {
            nombre: config.nombre,
            logoUrl: config.logoUrl,
            domicilio: config.domicilio,
            contactoCanal: config.contactoCanal,
            contactoValor: config.contactoValor,
            moneda: config.moneda,
          }
        : null,
    },
  })
})

export default route
