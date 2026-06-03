import { z } from 'zod'

export const insumoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoriaId: z.coerce.number().int().positive(),
  unidad: z.string().min(1, 'La unidad es requerida'),
  stock: z.coerce.number().min(0).default(0),
  stockMinimo: z.coerce.number().min(0).default(0),
  costoPaquete: z.coerce.number().min(0).default(0),
  cantidadPack: z.coerce.number().min(0.01, 'Cantidad por pack debe ser mayor a 0'),
  notas: z.string().optional(),
})

export const insumoUpdateSchema = insumoSchema.partial()

export const insumoProveedorSchema = z.object({
  proveedorId: z.coerce.number().int().positive(),
  esPrincipal: z.boolean().default(false),
  precio: z.coerce.number().min(0).default(0),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.enum(['critico', 'bajo', 'ok', 'todos']).default('todos'),
  categoriaId: z.coerce.number().int().positive().optional(),
})

export type InsumoCreate = z.infer<typeof insumoSchema>
export type InsumoUpdate = z.infer<typeof insumoUpdateSchema>
