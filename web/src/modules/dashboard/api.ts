import { get } from '@/shared/api/client'
import type { DashboardStats } from './types'

/** Único punto del módulo que habla HTTP. Solo el store lo consume. */
export function fetchStats() {
  return get<{ data: DashboardStats }>('/dashboard/stats')
}
