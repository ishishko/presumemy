import { get } from './api'
import type { DashboardStats } from '@/types'

export function getDashboardStats() {
  return get<{ data: DashboardStats }>('/dashboard/stats')
}
