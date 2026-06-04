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
  detalles: z.array(z.object({
    productoId: z.coerce.number().int().positive(),
    descripcion: z.string().min(1, 'La descripcion es requerida'),
    cantidad: z.coerce.number().min(0.01),
    precioUnitario: z.coerce.number().min(0),
  })).min(1, 'Al menos un detalle es requerido'),
})

export const presupuestoUpdateSchema = presupuestoSchema.partial()

export type PresupuestoCreate = z.infer<typeof presupuestoSchema>
export type PresupuestoUpdate = z.infer<typeof presupuestoUpdateSchema>
