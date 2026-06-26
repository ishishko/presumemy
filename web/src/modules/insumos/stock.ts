export type Nivel = 'sin_unidades' | 'critico' | 'bajo' | 'ok'

/**
 * Determina el nivel de stock según el stock actual y el mínimo requerido.
 * Utiliza el modelo de semáforo de 4 niveles.
 * 
 * @param stock Cantidad de stock actual
 * @param minimo Mínimo de stock requerido
 */
export function getNivel(stock: number, minimo: number): Nivel {
  if (stock <= 0) return 'sin_unidades'
  if (minimo > 0 && stock <= minimo * 0.2) return 'critico'
  if (minimo > 0 && stock < minimo) return 'bajo'
  return 'ok'
}

/**
 * Metadata asociada a cada nivel de stock para su visualización.
 * Los tonos corresponden a estados semánticos del StatusBadge / StockBar.
 */
export const NIVEL_META: Record<Nivel, { label: string; tone: 'danger' | 'warning' | 'ok' | 'neutral' }> = {
  sin_unidades: { label: 'Sin unidades', tone: 'danger' },
  critico: { label: 'Crítico', tone: 'danger' },
  bajo: { label: 'Bajo', tone: 'warning' },
  ok: { label: 'OK', tone: 'ok' },
}

/**
 * Colapsa el nivel de stock a 3 estados para vistas densas (como tablas de listados).
 * Mapea 'sin_unidades' a 'critico'.
 * 
 * @param nivel Nivel original de 4 estados
 */
export function nivelColapsado(nivel: Nivel): 'critico' | 'bajo' | 'ok' {
  if (nivel === 'sin_unidades') return 'critico'
  return nivel
}

/**
 * Calcula el porcentaje de relleno para barras de progreso visuales del stock.
 * Asegura un valor mínimo de 2% para que sea visible y máximo de 100%.
 * 
 * @param stock Cantidad de stock actual
 * @param minimo Mínimo de stock requerido
 */
export function getFillPct(stock: number, minimo: number): number {
  if (minimo <= 0) return stock > 0 ? 100 : 0
  return Math.max(2, Math.min(100, (stock / minimo) * 100))
}
