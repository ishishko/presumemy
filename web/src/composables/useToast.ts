import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  undo?: () => void
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function toast(message: string, type: Toast['type'] = 'success', undo?: () => void) {
    const id = nextId++
    toasts.value.push({ id, message, type, undo })
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000)
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx >= 0) toasts.value.splice(idx, 1)
  }

  function undo(id: number) {
    const t = toasts.value.find(t => t.id === id)
    if (t?.undo) {
      t.undo()
      dismiss(id)
    }
  }

  return { toasts, toast, dismiss, undo }
}
