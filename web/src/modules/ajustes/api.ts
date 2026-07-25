import { get, put } from '@/shared/api/client'
import type { ConfiguracionNegocio } from './types'
import type { DistribucionGanancia } from '@/modules/finanzas/types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
const BASE = '/ajustes'

export function fetchConfiguracion() {
  return get<{ data: ConfiguracionNegocio }>(`${BASE}/configuracion`)
}

export function updateConfiguracion(payload: Partial<ConfiguracionNegocio>) {
  return put<ConfiguracionNegocio>(`${BASE}/configuracion`, 1, payload)
}

export function fetchDistribucion() {
  return get<{ data: DistribucionGanancia[] }>(`${BASE}/distribucion`)
}

export function updateDistribucion(items: Array<{ id: number; porcentaje: number }>) {
  return put<DistribucionGanancia[]>(`${BASE}/distribucion`, 0, { items })
}
