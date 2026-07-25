import { z } from 'zod'

export const movimientoSchema = z.object({
  fecha: z.string(),
  tipo: z.string(),
  cuenta: z.string(),
  monto: z.coerce.number(),
  detalle: z.string().optional(),
  nroFactura: z.string().optional(),
  presupuestoId: z.string().optional(),
})

export const ordenImprentaSchema = z.object({
  fecha: z.string(),
  presupuestoId: z.string().optional(),
  tematica: z.string().min(1, 'La tematica es requerida'),
  hojas: z.coerce.number().int().min(0),
  tipoHoja: z.string(),
  valorNuestro: z.coerce.number().min(0),
  valorPatri: z.coerce.number().min(0),
  metodoPago: z.string(),
  pagado: z.boolean().default(false),
})

export type MovimientoCreate = z.infer<typeof movimientoSchema>
export type OrdenImprentaCreate = z.infer<typeof ordenImprentaSchema>
