import { ref } from 'vue'

export const createTrigger = ref<string | null>(null)

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
