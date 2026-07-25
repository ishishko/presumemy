export interface ConfiguracionNegocio {
  id: number
  nombre: string
  logoUrl?: string
  domicilio?: Record<string, any>
  contactoCanal?: string
  contactoValor?: string
  moneda: string
  cancelacionAuto: boolean
  diasEspera: number
  formatoFechaDashboard: 'relativo' | 'absoluto'
}
