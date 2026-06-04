import { ref } from 'vue'

export const editorMode = ref(false)
export const editorTitle = ref('')
export const editorSaveHandler = ref<(() => void) | null>(null)
export const editorCloseHandler = ref<(() => void) | null>(null)

export function setEditorMode(active: boolean, title: string, onSave: () => void, onClose: () => void) {
  editorMode.value = active
  editorTitle.value = title
  editorSaveHandler.value = active ? onSave : null
  editorCloseHandler.value = active ? onClose : null
}

export function resetEditorMode() {
  editorMode.value = false
  editorTitle.value = ''
  editorSaveHandler.value = null
  editorCloseHandler.value = null
}
