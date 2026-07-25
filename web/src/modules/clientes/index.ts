/**
 * API pública del módulo Clientes.
 * Las páginas se importan directo desde el router (lazy chunks), no desde acá.
 */
export * from './types'
export * from './schema'
export { useClientesStore } from './store'
export { default as ClienteDrawer } from './components/ClienteDrawer.vue'
