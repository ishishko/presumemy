import { get, post, put, del, delWithBody, patch } from '@/shared/api/client'
import type { Producto, CategoriaProducto } from './types'
import type { PaginationResult } from '@/shared/types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
const BASE = '/productos'

export function fetchProductos(page = 1, limit = 100) {
  return get<PaginationResult<Producto>>(BASE, { page, limit })
}

export function createProducto(payload: any) {
  return post<Producto>(BASE, payload)
}

export function updateProducto(id: number, payload: any) {
  return put<Producto>(BASE, id, payload)
}

export function deleteProducto(id: number) {
  return del(BASE, id)
}

export function toggleFavorito(id: number) {
  return patch<Producto>(BASE, `${id}/favorito`, {})
}

export function fetchCategorias() {
  return get<{ data: CategoriaProducto[] }>(`${BASE}/categorias`)
}

export function createCategoria(nombre: string) {
  return post<CategoriaProducto>(`${BASE}/categorias`, { nombre })
}

export function updateCategoria(id: number, nombre: string) {
  return put<CategoriaProducto>(`${BASE}/categorias`, id, { nombre })
}

export function deleteCategoria(id: number, reasignarA?: number) {
  return delWithBody(`${BASE}/categorias`, id, { reasignarA })
}
