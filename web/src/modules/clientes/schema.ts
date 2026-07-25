import { z } from 'zod'

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  domicilio: z.object({
    calle: z.string().optional(),
    numero: z.string().optional(),
    localidad: z.string().optional(),
    provincia: z.string().optional(),
  }).optional(),
  notas: z.string().optional(),
  contactos: z.array(z.object({
    canal: z.enum(['instagram', 'whatsapp', 'mail', 'otros']),
    valor: z.string().min(1, 'El valor es requerido'),
    esPrincipal: z.boolean().default(false),
  })).optional(),
})

export const clienteUpdateSchema = clienteSchema.partial()

export type ClienteCreate = z.infer<typeof clienteSchema>
export type ClienteUpdate = z.infer<typeof clienteUpdateSchema>
