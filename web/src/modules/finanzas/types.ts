export interface Transaccion {
  id: number
  tipo: TipoMovimiento
  cuenta: 'efectivo' | 'banco' | 'tarjeta' | 'billetera'
  monto: number
  fecha: string
  referencia?: string
  detalle?: string
  nroFactura?: string
  presupuestoId?: number
  presupuesto?: { id: number; folio: string }
  activo: boolean
  createdAt: string
}

export type TipoMovimiento =
  | 'venta_producto'
  | 'venta_presupuesto'
  | 'cobro_cliente'
  | 'compra_insumo'
  | 'pago_servicio'
  | 'pago_imprenta'
  | 'pago_alquiler'
  | 'pago_sueldo'
  | 'retiro_socio'
  | 'deposito'
  | 'ajuste_positivo'
  | 'ajuste_negativo'

export interface OrdenImprenta {
  id: number
  fecha: string
  presupuestoId?: number
  presupuesto?: { id: number; folio: string }
  productoId?: number
  producto?: { id: number; nombre: string }
  tematica?: string
  hojas: number
  tipoHoja: string
  valorUnitario: number
  valorTotal: number
  metodoPago: string
  pagado: boolean
  diferencia: number
  activo: boolean
}

export interface DistribucionGanancia {
  id: number
  nombre: string
  porcentaje: number
  activo: boolean
}

export interface FinanzasKPIs {
  ingresos: number
  egresos: number
  utilidad: number
}
