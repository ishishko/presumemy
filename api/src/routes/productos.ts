import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, badRequest, conflict } from '../utils/errors.js'
import { productoSchema, productoUpdateSchema, paginationSchema, categoriaSchema, categoriaDeleteSchema } from '../types/productos.js'

const route = new Hono()

route.use('*', authMiddleware)

// =========================================================
// HELPER FUNCTIONS FOR CALCULATING VIRTUALS
// =========================================================
function calculateProductoVirtuals(producto: any) {
  let costoBOM = 0
  for (const l of producto.bomLineas || []) {
    const cantidad = Number(l.cantidad)
    const costoUnit = (l.tipoLinea === 'insumo' && l.insumo)
      ? Number(l.insumo.costoUnitario)
      : Number(l.costoUnitario)
    costoBOM += cantidad * costoUnit
  }

  const ganancia = Number(producto.ganancia)
  let precioSugerido = costoBOM
  if (producto.tipoGanancia === 'porcentaje') {
    precioSugerido = costoBOM * (1 + ganancia / 100)
  } else {
    precioSugerido = costoBOM + ganancia
  }

  const finalPrecioManual = producto.precioManual
  const finalPrecio = finalPrecioManual ? Number(producto.precio) : precioSugerido
  const desactualizado = finalPrecioManual ? (finalPrecio < precioSugerido) : false

  return {
    ...producto,
    costoBOM,
    precioSugerido,
    precio: finalPrecio,
    desactualizado,
  }
}

async function calculatePrecioForPayload(data: any) {
  const insumoIds = data.bomLineas
    ? data.bomLineas.filter((l: any) => l.tipoLinea === 'insumo' && l.insumoId).map((l: any) => l.insumoId as number)
    : []

  const insumos = insumoIds.length > 0
    ? await prisma.insumo.findMany({ where: { id: { in: insumoIds } } })
    : []

  const insumosMap = new Map(insumos.map(i => [i.id, Number(i.costoUnitario)]))

  let costoBOM = 0
  if (data.bomLineas) {
    for (const l of data.bomLineas) {
      const cantidad = Number(l.cantidad)
      let costoUnit = Number(l.costoUnitario)
      if (l.tipoLinea === 'insumo' && l.insumoId) {
        costoUnit = insumosMap.get(l.insumoId) ?? costoUnit
      }
      costoBOM += cantidad * costoUnit
    }
  }

  let calculatedPrecio = Number(data.precio)
  if (!data.precioManual) {
    const ganancia = Number(data.ganancia)
    if (data.tipoGanancia === 'porcentaje') {
      calculatedPrecio = costoBOM * (1 + ganancia / 100)
    } else {
      calculatedPrecio = costoBOM + ganancia
    }
  }

  return calculatedPrecio
}

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

  const mappedProductos = productos.map(p => calculateProductoVirtuals(p))

  return c.json({
    data: mappedProductos,
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

  const total = await prisma.categoriaProducto.count({ where: { activo: true } })
  if (total >= 12) {
    throw conflict('Máximo 12 categorías por sección')
  }

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
route.delete('/categorias/:id', zValidator('json', categoriaDeleteSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = c.req.valid('json')

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
    if (!body.reasignarA) {
      throw badRequest('Indicá una categoría destino')
    }
    const targetCat = await prisma.categoriaProducto.findUnique({
      where: { id: body.reasignarA, activo: true },
    })
    if (!targetCat) {
      throw notFound('Categoría destino no encontrada')
    }
    if (body.reasignarA === id) {
      throw badRequest('No podés reasignar a la misma categoría que estás eliminando')
    }

    // Reasignar e inactivar en transacción
    await prisma.$transaction([
      prisma.producto.updateMany({
        where: { categoriaId: id, activo: true },
        data: { categoriaId: body.reasignarA },
      }),
      prisma.categoriaProducto.update({
        where: { id },
        data: { activo: false },
      }),
    ])
  } else {
    await prisma.categoriaProducto.update({
      where: { id },
      data: { activo: false },
    })
  }

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

  return c.json({ data: calculateProductoVirtuals(producto) })
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

  const calculatedPrecio = await calculatePrecioForPayload(data)

  const producto = await prisma.producto.create({
    data: {
      nombre: data.nombre,
      codigo: `P-${nextId}`,
      categoriaId: data.categoriaId,
      descripcion: data.descripcion || null,
      imagenes: data.imagenes || [],
      tieneBom: true, // Force to true since BOM is always active
      favorito: data.favorito ?? false,
      precioManual: data.precioManual ?? false,
      tipoGanancia: data.tipoGanancia,
      ganancia: data.ganancia,
      precio: calculatedPrecio,
      medidas: data.medidas === null ? Prisma.JsonNull : data.medidas,
      bomLineas: data.bomLineas ? {
        create: data.bomLineas.map((linea) => ({
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

  return c.json({ data: calculateProductoVirtuals(producto) }, 201)
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

  // Merge payload with existing to compute calculatedPrecio properly
  const mergedData = {
    ...existing,
    ...data,
    precio: Number(data.precio ?? existing.precio),
    ganancia: Number(data.ganancia ?? existing.ganancia),
  }

  const calculatedPrecio = await calculatePrecioForPayload(mergedData)

  const { bomLineas, ...productoData } = data

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      ...productoData,
      tieneBom: true, // Force to true since BOM is always active
      precio: calculatedPrecio,
      medidas: data.medidas === undefined ? undefined : (data.medidas === null ? Prisma.JsonNull : data.medidas),
      bomLineas: bomLineas ? {
        deleteMany: {},
        create: bomLineas.map((linea) => ({
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

  return c.json({ data: calculateProductoVirtuals(producto) })
})

// =========================================================
// PATCH /api/productos/:id/favorito — Alternar favorito
// =========================================================
route.patch('/:id/favorito', async (c) => {
  const id = parseInt(c.req.param('id'))

  const existing = await prisma.producto.findUnique({
    where: { id, activo: true },
    include: {
      categoria: true,
      bomLineas: {
        include: { insumo: true },
      },
    },
  })

  if (!existing) {
    throw notFound('Producto no encontrado')
  }

  const updated = await prisma.producto.update({
    where: { id },
    data: { favorito: !existing.favorito },
    include: {
      categoria: true,
      bomLineas: {
        include: { insumo: true },
      },
    },
  })

  return c.json({ data: calculateProductoVirtuals(updated) })
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
