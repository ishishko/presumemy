/**
 * API pública del módulo Presupuestos.
 * Las páginas se importan directo desde el router (lazy chunks), no desde acá.
 */
export * from './types'
export * from './schema'
export { usePresupuestosStore } from './store'
export { default as PresupuestoEditor } from './components/PresupuestoEditor.vue'
export { default as PresupuestoDoc } from './components/PresupuestoDoc.vue'
