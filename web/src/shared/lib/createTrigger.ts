import { ref } from 'vue'

export const createTrigger = ref<string | null>(null)

/**
 * Señal del shell a la página activa: "volvé a tu vista base".
 * La emite el aside cuando se clickea el módulo en el que ya estamos parados,
 * caso en el que el router no navega y la página no se entera por sí sola.
 */
export const resetViewTrigger = ref<string | null>(null)

export function useCreateTrigger() {
  function trigger(route: string) {
    createTrigger.value = route
  }

  function consume(expectedRoute: string): boolean {
    if (createTrigger.value === expectedRoute) {
      createTrigger.value = null
      return true
    }
    return false
  }

  return { createTrigger, trigger, consume }
}
