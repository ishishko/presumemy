import { z } from 'zod'

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoriaId: z.coerce.number().int().positive(),
  descripcion: z.string().optional(),
  imagenUrl: z.string().optional(),
  tieneBom: z.boolean().default(false),
  tipoGanancia: z.enum(['porcentaje', 'fijo']).default('porcentaje'),
  ganancia: z.coerce.number().min(0).default(0),
  precio: z.coerce.number().min(0).default(0),
  bomLineas: z.array(z.object({
    tipoLinea: z.enum(['insumo', 'cameo', 'embalaje', 'extra']),
    insumoId: z.coerce.number().int().positive().optional(),
    descripcion: z.string().optional(),
    cantidad: z.coerce.number().min(0),
    costoUnitario: z.coerce.number().min(0),
  })).optional(),
})

export const productoUpdateSchema = productoSchema.partial()

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoriaId: z.coerce.number().int().positive().optional(),
})

export type ProductoCreate = z.infer<typeof productoSchema>
export type ProductoUpdate = z.infer<typeof productoUpdateSchema>

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(40),
})

