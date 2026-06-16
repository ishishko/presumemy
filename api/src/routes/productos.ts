import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, conflict } from '../utils/errors.js'
import { productoSchema, productoUpdateSchema, paginationSchema, categoriaSchema } from '../types/productos.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// GET /api/productos — Lista con filtros
// =========================================================
route.get('/', zValidator('query', paginationSchema), async (c) => {
  const { page, limit, categoriaId } = c.req.valid('query')
  const offset = (page - 1) * limit

  const where: any = { activo: true }

  if (categoriaId) {
    where.categoriaId = categoriaId
  }

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        bomLineas: {
          include: { insumo: true },
        },
      },
      orderBy: { nombre: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.producto.count({ where }),
  ])

  return c.json({
    data: productos,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// =========================================================
// GET /api/productos/categorias — Lista categorias producto
// =========================================================
route.get('/categorias', async (c) => {
  const categorias = await prisma.categoriaProducto.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      activo: true,
      _count: {
        select: {
          productos: {
            where: { activo: true },
          },
        },
      },
    },
  })
  return c.json({ data: categorias })
})

// =========================================================
// POST /api/productos/categorias — Crear categoria producto
// =========================================================
route.post('/categorias', zValidator('json', categoriaSchema), async (c) => {
  const data = c.req.valid('json')

  const existing = await prisma.categoriaProducto.findFirst({
    where: {
      nombre: { equals: data.nombre, mode: 'insensitive' },
      activo: true,
    },
  })

  if (existing) {
    throw conflict('Ya existe una categoría con ese nombre')
  }

  const categoria = await prisma.categoriaProducto.create({
    data: {
      nombre: data.nombre,
    },
  })

  return c.json({ data: categoria }, 201)
})

// =========================================================
// PUT /api/productos/categorias/:id — Actualizar categoria producto
// =========================================================
route.put('/categorias/:id', zValidator('json', categoriaSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.categoriaProducto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Categoría no encontrada')
  }

  const duplicate = await prisma.categoriaProducto.findFirst({
    where: {
      id: { not: id },
      nombre: { equals: data.nombre, mode: 'insensitive' },
      activo: true,
    },
  })

  if (duplicate) {
    throw conflict('Ya existe otra categoría con ese nombre')
  }

  const categoria = await prisma.categoriaProducto.update({
    where: { id },
    data: {
      nombre: data.nombre,
    },
  })

  return c.json({ data: categoria })
})

// =========================================================
// DELETE /api/productos/categorias/:id — Eliminar categoria producto
// =========================================================
route.delete('/categorias/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.categoriaProducto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Categoría no encontrada')
  }

  const count = await prisma.producto.count({
    where: {
      categoriaId: id,
      activo: true,
    },
  })

  if (count > 0) {
    throw conflict(`No se puede eliminar: tiene ${count} elementos asociados`)
  }

  await prisma.categoriaProducto.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Categoría eliminada' })
})

// =========================================================
// GET /api/productos/:id — Detalle con BOM
// =========================================================
route.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const producto = await prisma.producto.findUnique({
    where: { id, activo: true },
    include: {
      categoria: true,
      bomLineas: {
        include: { insumo: true },
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!producto) {
    throw notFound('Producto no encontrado')
  }

  return c.json({ data: producto })
})

// =========================================================
// POST /api/productos — Crear producto con BOM
// =========================================================
route.post('/', zValidator('json', productoSchema), async (c) => {
  const data = c.req.valid('json')

  const lastProducto = await prisma.producto.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  })

  const nextId = (lastProducto?.id ?? 0) + 1

  const producto = await prisma.producto.create({
    data: {
      nombre: data.nombre,
      codigo: `P-${nextId}`,
      categoriaId: data.categoriaId,
      descripcion: data.descripcion || null,
      imagenUrl: data.imagenUrl || null,
      tieneBom: data.tieneBom,
      tipoGanancia: data.tipoGanancia,
      ganancia: data.ganancia,
      precio: data.precio,
      bomLineas: data.bomLineas ? {
        create: data.bomLineas.map((linea, index) => ({
          tipoLinea: linea.tipoLinea,
          insumo: linea.insumoId ? { connect: { id: linea.insumoId } } : undefined,
          descripcion: linea.descripcion || null,
          cantidad: linea.cantidad,
          costoUnitario: linea.costoUnitario,
          subtotal: linea.cantidad * linea.costoUnitario,
        })),
      } : undefined,
    },
    include: {
      categoria: true,
      bomLineas: { include: { insumo: true } },
    },
  })

  return c.json({ data: producto }, 201)
})

// =========================================================
// PUT /api/productos/:id — Actualizar producto + BOM
// =========================================================
route.put('/:id', zValidator('json', productoUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')

  const existing = await prisma.producto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Producto no encontrado')
  }

  const { bomLineas, ...productoData } = data

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      ...productoData,
      bomLineas: bomLineas ? {
        deleteMany: {},
        create: bomLineas.map((linea, index) => ({
          tipoLinea: linea.tipoLinea,
          insumo: linea.insumoId ? { connect: { id: linea.insumoId } } : undefined,
          descripcion: linea.descripcion || null,
          cantidad: linea.cantidad,
          costoUnitario: linea.costoUnitario,
          subtotal: linea.cantidad * linea.costoUnitario,
        })),
      } : undefined,
    },
    include: {
      categoria: true,
      bomLineas: { include: { insumo: true } },
    },
  })

  return c.json({ data: producto })
})

// =========================================================
// DELETE /api/productos/:id — Soft delete
// =========================================================
route.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.producto.findUnique({
    where: { id, activo: true },
  })

  if (!existing) {
    throw notFound('Producto no encontrado')
  }

  await prisma.producto.update({
    where: { id },
    data: { activo: false },
  })

  return c.json({ message: 'Producto eliminado' })
})

export default route
