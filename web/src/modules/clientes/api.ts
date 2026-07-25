import { get, post, put, del } from '@/shared/api/client'
import type { Cliente } from './types'
import type { PaginationResult } from '@/shared/types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
const BASE = '/clientes'

export function fetchClientes(page = 1, limit = 100) {
  return get<PaginationResult<Cliente>>(BASE, { page, limit })
}

export function createCliente(payload: any) {
  return post<Cliente>(BASE, payload)
}

export function updateCliente(id: number, payload: any) {
  return put<Cliente>(BASE, id, payload)
}

export function deleteCliente(id: number) {
  return del(BASE, id)
}
