/**
 * API pública del módulo Insumos.
 * Las páginas se importan directo desde el router (lazy chunks), no desde acá.
 */
export * from './types'
export * from './schema'
export * from './stock'
export { useInsumosStore } from './store'
export { default as InsumoDetalle } from './components/InsumoDetalle.vue'
export { default as StockBar } from './components/StockBar.vue'
