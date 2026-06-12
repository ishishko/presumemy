import { z } from 'zod'

export const presupuestoSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
  tematica: z.string().optional(),
  tipoEntrega: z.enum(['retira', 'envio']).default('retira'),
  direccionEntrega: z.string().optional(),
  fechaFiesta: z.string().datetime().optional(),
  fechaEntrega: z.string().datetime().optional(),
  metodoPago: z.string().optional(),
  sena: z.coerce.number().min(0).default(0),
  notas: z.string().optional(),
  notasPublicas: z.boolean().optional(),
  detalles: z.array(z.object({
    productoId: z.coerce.number().int().positive(),
    descripcion: z.string().min(1, 'La descripcion es requerida'),
    cantidad: z.coerce.number().min(0.01),
    precioUnitario: z.coerce.number().min(0),
  })).min(1, 'Al menos un detalle es requerido'),
  estado: z.enum(['borrador', 'en_curso', 'facturado']).optional(),
})

export const presupuestoUpdateSchema = presupuestoSchema.partial()

export const estadoChangeSchema = z.object({
  estado: z.enum(['borrador', 'enviado', 'en_curso', 'cerrado', 'facturado', 'cancelado']),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.enum(['borrador', 'enviado', 'en_curso', 'cerrado', 'facturado', 'cancelado', 'todos']).default('todos'),
  clienteId: z.coerce.number().int().positive().optional(),
})

export type PresupuestoCreate = z.infer<typeof presupuestoSchema>
export type PresupuestoUpdate = z.infer<typeof presupuestoUpdateSchema>
