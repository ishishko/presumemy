/**
 * API pública del módulo Productos.
 * Las páginas se importan directo desde el router (lazy chunks), no desde acá.
 */
export * from './types'
export * from './schema'
export { useProductosStore } from './store'
export { default as ProductoDetalle } from './components/ProductoDetalle.vue'
