/**
 * API pública del módulo Auth.
 * Las páginas se importan directo desde el router (lazy chunks), no desde acá.
 */
export * from './types'
export { useAuthStore } from './store'
