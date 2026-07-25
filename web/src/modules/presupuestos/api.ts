import { get, post, put, patch, del } from '@/shared/api/client'
import type { Presupuesto } from './types'
import type { PaginationResult } from '@/shared/types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
const BASE = '/presupuestos'

export function fetchPresupuestos(page = 1, limit = 1000) {
  return get<PaginationResult<Presupuesto>>(BASE, { page, limit })
}

export function fetchPresupuesto(id: number) {
  return get<{ data: Presupuesto }>(`${BASE}/${id}`)
}

export function createPresupuesto(payload: any) {
  return post<Presupuesto>(BASE, payload)
}

export function updatePresupuesto(id: number, payload: any) {
  return put<Presupuesto>(BASE, id, payload)
}

export function updateEstado(id: number, estado: string) {
  return patch<Presupuesto>(BASE, `${id}/estado`, { estado })
}

export function deletePresupuesto(id: number) {
  return del(BASE, id)
}

export function fetchPdfUrl(id: number) {
  return get<{ data: { url: string } }>(`${BASE}/${id}/pdf`)
}
