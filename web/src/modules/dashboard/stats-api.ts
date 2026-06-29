import { get } from '@/shared/api/client'
import type { DashboardStats } from '@/types'

export function getDashboardStats() {
  return get<{ data: DashboardStats }>('/dashboard/stats')
}
