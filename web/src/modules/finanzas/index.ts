/**
 * API pública del módulo Finanzas.
 * Las páginas se importan directo desde el router (lazy chunks), no desde acá.
 */
export * from './types'
export * from './schema'
export { useFinanzasStore } from './store'
export { default as MovimientoDrawer } from './components/MovimientoDrawer.vue'
export { default as ImprentaDrawer } from './components/ImprentaDrawer.vue'
