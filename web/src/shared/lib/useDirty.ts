import { ref, computed } from 'vue'

export function useDirty<T extends Record<string, any>>(initial: T) {
  const initialRef = ref<T>(JSON.parse(JSON.stringify(initial)))
  const current = ref<T>({ ...initial })

  const dirty = computed(() => {
    return JSON.stringify(current.value) !== JSON.stringify(initialRef.value)
  })

  function reset() {
    initialRef.value = JSON.parse(JSON.stringify(current.value))
  }

  function discard() {
    current.value = JSON.parse(JSON.stringify(initialRef.value))
  }

  return { current, initialRef, dirty, reset, discard }
}
