import { z } from 'zod'

export const transaccionSchema = z.object({
  tipo: z.enum([
    'venta_producto', 'venta_presupuesto', 'cobro_cliente',
    'compra_insumo', 'pago_servicio', 'pago_imprenta',
    'pago_alquiler', 'pago_sueldo', 'retiro_socio',
    'deposito', 'ajuste_positivo', 'ajuste_negativo',
  ]),
  cuenta: z.enum(['efectivo', 'banco', 'tarjeta', 'billetera']),
  monto: z.coerce.number().min(0.01),
  fecha: z.string().datetime(),
  referencia: z.string().optional(),
  detalle: z.string().optional(),
  nroFactura: z.string().optional(),
  presupuestoId: z.coerce.number().int().positive().optional(),
})

export const transaccionUpdateSchema = transaccionSchema.omit({ fecha: true }).partial()

export const ordenImprentaSchema = z.object({
  fecha: z.string().datetime(),
  presupuestoId: z.coerce.number().int().positive().optional(),
  productoId: z.coerce.number().int().positive().optional(),
  tematica: z.string().optional(),
  hojas: z.coerce.number().int().min(1),
  tipoHoja: z.string().min(1),
  valorUnitario: z.coerce.number().min(0),
  valorTotal: z.coerce.number().min(0),
  metodoPago: z.string().min(1),
  pagado: z.boolean().default(false),
})

export const ordenImprentaUpdateSchema = ordenImprentaSchema.partial()

export const distribucionSchema = z.object({
  items: z.array(z.object({
    id: z.coerce.number().int().positive(),
    porcentaje: z.coerce.number().min(0).max(100),
  })),
}).refine((data) => {
  const total = data.items.reduce((sum, item) => sum + item.porcentaje, 0)
  if (total > 100) {
    return { success: false, error: 'La suma de porcentajes no puede superar 100%' }
  }
  return { success: true }
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tipo: z.string().optional(),
  cuenta: z.string().optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  anio: z.coerce.number().int().min(2020).max(2030).optional(),
})

export type TransaccionCreate = z.infer<typeof transaccionSchema>
export type OrdenImprentaCreate = z.infer<typeof ordenImprentaSchema>
