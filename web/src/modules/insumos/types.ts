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
