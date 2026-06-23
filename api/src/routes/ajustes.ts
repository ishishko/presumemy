import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'
import { distribucionSchema } from '../types/finanzas.js'

const route = new Hono()

route.use('*', authMiddleware)

const configSchema = z.object({
  nombre: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
  domicilio: z.object({
    calle: z.string().optional(),
    numero: z.string().optional(),
    localidad: z.string().optional(),
    provincia: z.string().optional(),
  }).optional().nullable(),
  contactoCanal: z.string().optional().nullable(),
  contactoValor: z.string().optional().nullable(),
  moneda: z.string().optional(),
  cancelacionAuto: z.boolean().optional(),
  diasEspera: z.coerce.number().int().min(0).optional(),
  formatoFechaDashboard: z.enum(['relativo', 'absoluto']).optional(),
})

// =========================================================
// GET /api/configuracion — Obtener config
// =========================================================
route.get('/configuracion', async (c) => {
  const config = await prisma.configuracionNegocio.findUnique({
    where: { id: 1 },
  })

  if (!config) {
    throw notFound('Configuracion no encontrada')
  }

  return c.json({ data: config })
})

// =========================================================
// PUT /api/configuracion — Actualizar config
// =========================================================
route.put('/configuracion/:id', zValidator('json', configSchema), async (c) => {
  const data = c.req.valid('json')

  const prismaData: any = { ...data }
  if (prismaData.domicilio === null) {
    prismaData.domicilio = Prisma.JsonNull
  }

  const config = await prisma.configuracionNegocio.update({
    where: { id: 1 },
    data: prismaData,
  })

  return c.json({ data: config })
})

// =========================================================
// GET /api/ajustes/distribucion — Distribucion actual
// =========================================================
route.get('/distribucion', async (c) => {
  const distribucion = await prisma.distribucionGanancia.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return c.json({ data: distribucion })
})

// =========================================================
// PUT /api/ajustes/distribucion — Actualizar distribucion
// =========================================================
route.put('/distribucion/:id', zValidator('json', distribucionSchema), async (c) => {
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

export default route
