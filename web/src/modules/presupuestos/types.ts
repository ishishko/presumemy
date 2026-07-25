import type { Cliente } from '@/modules/clientes/types'
import type { Producto } from '@/modules/productos/types'

export interface Presupuesto {
  id: number
  folio: string
  clienteId: number
  cliente?: Cliente
  tematica?: string
  estado: 'borrador' | 'enviado' | 'en_curso' | 'cerrado' | 'facturado' | 'cancelado'
  tipoEntrega: 'retira' | 'envio'
  direccionEntrega?: string
  fechaFiesta?: string
  fechaEntrega?: string
  metodoPago?: string
  sena: number
  total: number
  notas?: string
  notasPublicas?: boolean
  publicToken?: string | null
  pdfPath?: string | null
  pdfGeneratedAt?: string | null
  activo: boolean
  createdAt: string
  updatedAt?: string
  detalles?: DetallePresupuesto[]
}

export interface DetallePresupuesto {
  id: number
  presupuestoId: number
  productoId: number
  producto?: Producto
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  orden: number
}
