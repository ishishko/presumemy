import { get, post, put, del } from '@/shared/api/client'
import type { Transaccion, OrdenImprenta, DistribucionGanancia, FinanzasKPIs } from './types'
import type { PaginationResult } from '@/shared/types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
const BASE = '/finanzas'
const IMPRENTA = `${BASE}/ordenes-imprenta`

export function fetchTransacciones(mes: number, anio: number, page = 1, limit = 1000) {
  return get<PaginationResult<Transaccion> & { kpis: FinanzasKPIs }>(BASE, { page, limit, mes, anio })
}

export function createTransaccion(payload: any) {
  return post<Transaccion>(BASE, payload)
}

export function updateTransaccion(id: number, payload: any) {
  return put<Transaccion>(BASE, id, payload)
}

export function deleteTransaccion(id: number) {
  return del(BASE, id)
}

export function fetchOrdenes(mes: number, anio: number, page = 1, limit = 1000) {
  return get<PaginationResult<OrdenImprenta>>(IMPRENTA, { page, limit, mes, anio })
}

export function createOrden(payload: any) {
  return post<OrdenImprenta>(IMPRENTA, payload)
}

export function updateOrden(id: number, payload: any) {
  return put<OrdenImprenta>(IMPRENTA, id, payload)
}

export function deleteOrden(id: number) {
  return del(IMPRENTA, id)
}

export function fetchDistribucion() {
  return get<{ data: DistribucionGanancia[] }>(`${BASE}/distribucion`)
}
