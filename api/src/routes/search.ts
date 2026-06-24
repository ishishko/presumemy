import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const route = new Hono()

route.use('*', authMiddleware)

route.get('/', async (c) => {
  const q = c.req.query('q') || ''
  if (!q || q.trim().length < 2) {
    return c.json({ data: [] })
  }

  const query = q.trim()

  const [insumos, productos, clientes, presupuestos] = await Promise.all([
    prisma.insumo.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { codigo: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
    prisma.producto.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { codigo: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
    prisma.cliente.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { codigo: { contains: query, mode: 'insensitive' } },
          { contactos: { some: { valor: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: {
        contactos: true,
      },
      take: 5,
    }),
    prisma.presupuesto.findMany({
      where: {
        activo: true,
        OR: [
          { folio: { contains: query, mode: 'insensitive' } },
          { tematica: { contains: query, mode: 'insensitive' } },
          { cliente: { nombre: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        cliente: { select: { nombre: true } },
      },
      take: 5,
    }),
  ])

  const results = [
    ...insumos.map((i) => ({
      tipo: 'insumo',
      id: i.id,
      codigo: i.codigo,
      titulo: i.nombre,
      subtitulo: `Stock: ${i.stock} ${i.unidad}`,
    })),
    ...productos.map((p) => ({
      tipo: 'producto',
      id: p.id,
      codigo: p.codigo,
      titulo: p.nombre,
      subtitulo: `Precio: $ ${Number(p.precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    })),
    ...clientes.map((c) => {
      const principal = c.contactos.find((con) => con.esPrincipal) || c.contactos[0]
      return {
        tipo: 'cliente',
        id: c.id,
        codigo: c.codigo,
        titulo: c.nombre,
        subtitulo: principal ? `${principal.canal.toLowerCase()}: ${principal.valor}` : 'Sin contactos',
      }
    }),
    ...presupuestos.map((pr) => ({
      tipo: 'presupuesto',
      id: pr.id,
      codigo: pr.folio,
      titulo: pr.tematica || 'Sin temática',
      subtitulo: `Cliente: ${pr.cliente.nombre} | ${pr.estado}`,
    })),
  ]

  return c.json({ data: results })
})

export default route
