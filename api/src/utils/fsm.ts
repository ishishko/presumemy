export type EstadoPresupuesto =
  | 'borrador'
  | 'enviado'
  | 'en_curso'
  | 'cerrado'
  | 'facturado'
  | 'cancelado'

export const TRANSITIONS: Record<EstadoPresupuesto, EstadoPresupuesto[]> = {
  borrador: ['en_curso', 'cancelado'],
  enviado: ['en_curso', 'cancelado'],
  en_curso: ['cerrado', 'cancelado'],
  cerrado: ['facturado', 'en_curso'],
  facturado: [],
  cancelado: [],
}

export function canTransition(
  from: EstadoPresupuesto,
  to: EstadoPresupuesto
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function getAvailableTransitions(
  from: EstadoPresupuesto
): EstadoPresupuesto[] {
  return TRANSITIONS[from] ?? []
}
