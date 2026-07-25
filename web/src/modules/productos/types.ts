import type { Insumo } from '@/modules/insumos/types'

export interface Producto {
  id: number
  nombre: string
  codigo: string
  categoriaId: number
  categoria?: CategoriaProducto
  descripcion?: string
  imagenes: string[]
  tieneBom: boolean
  favorito: boolean
  precioManual: boolean
  precioSugerido?: number
  costoBOM?: number
  desactualizado?: boolean
  tipoGanancia: 'porcentaje' | 'fijo'
  ganancia: number
  precio: number
  activo: boolean
  bomLineas?: CostoProductoInsumo[]
  medidas?: {
    tipo: 'plano' | 'cuerpo'
    base: number
    altura: number
    profundidad?: number | null
    unidad: string
  } | null
}

export interface CategoriaProducto {
  id: number
  nombre: string
  activo: boolean
  _count?: { productos: number }
}

/**
 * Cómo participa una línea de receta en el precio del producto.
 * - `normal`: entra al costo BOM y recibe el margen.
 * - `fijo`: no entra al costo BOM; se suma al precio ya con el margen aplicado.
 * - `extra`: no suma ni al costo ni al precio (informativo).
 */
export type ModoCalculoBOM = 'normal' | 'fijo' | 'extra'

export interface CostoProductoInsumo {
  id: number
  productoId: number
  tipoLinea: 'insumo' | 'cameo' | 'embalaje' | 'extra'
  modoCalculo: ModoCalculoBOM
  insumoId?: number
  insumo?: Insumo
  descripcion?: string
  cantidad: number
  costoUnitario: number
  subtotal: number
  orden: number
}
