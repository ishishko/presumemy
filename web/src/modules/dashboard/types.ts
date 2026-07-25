import type { Presupuesto } from '@/modules/presupuestos/types'

export interface DashboardStats {
  kpis: {
    ingresosMes: number
    egresosMes: number
    utilidadMes: number
    porCobrar: number
  }
  presupuestosRecientes: Presupuesto[]
  proximosEntregar: Presupuesto[]
  statsPorEstado: Array<{
    estado: string
    _count: { id: number }
    _sum: { total: number | null }
  }>
}
