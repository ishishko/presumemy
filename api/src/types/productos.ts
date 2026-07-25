import { z } from 'zod'

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoriaId: z.coerce.number().int().positive(),
  descripcion: z.string().optional(),
  imagenes: z.array(z.string()).default([]),
  tieneBom: z.boolean().default(true),
  favorito: z.boolean().optional().default(false),
  precioManual: z.boolean().optional().default(false),
  tipoGanancia: z.enum(['porcentaje', 'fijo']).default('porcentaje'),
  ganancia: z.coerce.number().min(0).default(0),
  precio: z.coerce.number().min(0).default(0),
  bomLineas: z.array(z.object({
    tipoLinea: z.enum(['insumo', 'cameo', 'embalaje', 'extra']),
    modoCalculo: z.enum(['normal', 'fijo', 'extra']).default('normal'),
    insumoId: z.coerce.number().int().positive().optional(),
    descripcion: z.string().optional(),
    cantidad: z.coerce.number().min(0),
    costoUnitario: z.coerce.number().min(0),
  })).optional(),
  medidas: z.object({
    tipo: z.enum(['plano', 'cuerpo']),
    base: z.coerce.number().positive('La base debe ser mayor a 0'),
    altura: z.coerce.number().positive('La altura debe ser mayor a 0'),
    profundidad: z.coerce.number().positive('La profundidad debe ser mayor a 0').optional().nullable(),
    unidad: z.string().default('cm'),
  }).optional().nullable().superRefine((data, ctx) => {
    if (data && data.tipo === 'cuerpo' && (data.profundidad === undefined || data.profundidad === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La profundidad es requerida para objetos 3D (cuerpo)',
        path: ['profundidad']
      })
    }
  }),
})

export const productoUpdateSchema = productoSchema.partial()

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
  categoriaId: z.coerce.number().int().positive().optional(),
})

export type ProductoCreate = z.infer<typeof productoSchema>
export type ProductoUpdate = z.infer<typeof productoUpdateSchema>

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(40),
})

export const categoriaDeleteSchema = z.object({
  reasignarA: z.coerce.number().int().positive().optional(),
})

