import { get, post, put, del, delWithBody } from '@/shared/api/client'
import type { Insumo, CategoriaInsumo, Proveedor } from './types'
import type { PaginationResult } from '@/shared/types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
const BASE = '/insumos'

export function fetchInsumos(page = 1, limit = 100) {
  return get<PaginationResult<Insumo>>(BASE, { page, limit })
}

export function createInsumo(payload: any) {
  return post<Insumo>(BASE, payload)
}

export function updateInsumo(id: number, payload: any) {
  return put<Insumo>(BASE, id, payload)
}

export function deleteInsumo(id: number) {
  return del(BASE, id)
}

export function fetchCategorias() {
  return get<{ data: CategoriaInsumo[] }>(`${BASE}/categorias`)
}

export function createCategoria(nombre: string) {
  return post<CategoriaInsumo>(`${BASE}/categorias`, { nombre })
}

export function updateCategoria(id: number, nombre: string) {
  return put<CategoriaInsumo>(`${BASE}/categorias`, id, { nombre })
}

export function deleteCategoria(id: number, reasignarA?: number) {
  return delWithBody(`${BASE}/categorias`, id, { reasignarA })
}

export function fetchProveedores() {
  return get<{ data: Proveedor[] }>(`${BASE}/proveedores`)
}

export function createProveedor(nombre: string) {
  return post<Proveedor>(`${BASE}/proveedores`, { nombre })
}

export function deleteProveedor(id: number) {
  return del(`${BASE}/proveedores`, id)
}
