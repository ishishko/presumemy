export type Nivel = 'sin_control' | 'sin_unidades' | 'critico' | 'bajo' | 'ok'

/**
 * Determina el nivel de stock según el stock actual y el mínimo requerido.
 *
 * Modelo de semáforo de 4 niveles, más un quinto estado neutro: con stock y
 * mínimo en 0 el insumo no está bajo control de inventario, así que no se
 * reporta como faltante hasta que se cargue alguno de los dos campos.
 *
 * @param stock Cantidad de stock actual
 * @param minimo Mínimo de stock requerido
 */
export function getNivel(stock: number, minimo: number): Nivel {
  if (stock <= 0 && minimo <= 0) return 'sin_control'
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
  sin_control: { label: 'Sin control', tone: 'ok' },
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
  if (nivel === 'sin_control') return 'ok'
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
  // Sin mínimo cargado no hay contra qué medir: la barra se muestra llena
  // (sea "sin control" o stock libre), nunca vacía ni en rojo.
  if (minimo <= 0) return 100
  return Math.max(2, Math.min(100, (stock / minimo) * 100))
}
