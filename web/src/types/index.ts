export interface User {
  id: string
  email?: string
}

export interface Insumo {
  id: number
  nombre: string
  codigo: string
  categoriaId: number
  categoria?: CategoriaInsumo
  unidad: string
  stock: number
  stockMinimo: number
  costoPaquete: number
  cantidadPack: number
  costoUnitario: number
  activo: boolean
  notas?: string
  fechaActualizacion?: string
  proveedores?: InsumoProveedor[]
}

export interface CategoriaInsumo {
  id: number
  nombre: string
  activo: boolean
  _count?: { insumos: number }
}

export interface InsumoProveedor {
  id: number
  insumoId: number
  proveedorId: number
  esPrincipal: boolean
  precio: number
  proveedor?: Proveedor
}

export interface Proveedor {
  id: number
  nombre: string
  contacto?: string
  activo: boolean
}

export interface Producto {
  id: number
  nombre: string
  codigo: string
  categoriaId: number
  categoria?: CategoriaProducto
  descripcion?: string
  imagenUrl?: string
  tieneBom: boolean
  tipoGanancia: 'porcentaje' | 'fijo'
  ganancia: number
  precio: number
  activo: boolean
  bomLineas?: CostoProductoInsumo[]
}

export interface CategoriaProducto {
  id: number
  nombre: string
  activo: boolean
  _count?: { productos: number }
}

export interface CostoProductoInsumo {
  id: number
  productoId: number
  tipoLinea: 'insumo' | 'cameo' | 'embalaje' | 'extra'
  insumoId?: number
  insumo?: Insumo
  descripcion?: string
  cantidad: number
  costoUnitario: number
  subtotal: number
  orden: number
}

export interface Cliente {
  id: number
  nombre: string
  codigo: string
  domicilio?: Record<string, any>
  notas?: string
  activo: boolean
  contactos?: ClienteContacto[]
  totalPedidos?: number
  totalGastado?: number
}

export interface ClienteContacto {
  id: number
  clienteId: number
  canal: 'instagram' | 'whatsapp' | 'mail' | 'otros'
  valor: string
  esPrincipal: boolean
}

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

export interface ConfiguracionNegocio {
  id: number
  nombre: string
  logoUrl?: string
  domicilio?: Record<string, any>
  contactoCanal?: string
  contactoValor?: string
  moneda: string
  cancelacionAuto: boolean
  diasEspera: number
}

export interface DashboardStats {
  kpis: {
    ingresosMes: number
    egresosMes: number
    utilidadMes: number
    porCobrar: number
    insumosBajosCount: number
  }
  presupuestosRecientes: Presupuesto[]
  insumosBajos: Pick<Insumo, 'id' | 'nombre' | 'codigo' | 'stock' | 'stockMinimo' | 'unidad'>[]
  statsPorEstado: Array<{
    estado: string
    _count: { id: number }
    _sum: { total: number | null }
  }>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FinanzasKPIs {
  ingresos: number
  egresos: number
  utilidad: number
}
