import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'

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
route.put('/configuracion', zValidator('json', configSchema), async (c) => {
  const data = c.req.valid('json')

  const config = await prisma.configuracionNegocio.update({
    where: { id: 1 },
    data,
  })

  return c.json({ data: config })
})

export default route
