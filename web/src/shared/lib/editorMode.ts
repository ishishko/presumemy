import { ref } from 'vue'

export const EDITOR_STATUS_SLOT_ID = 'editor-header-status'

export const editorMode = ref(false)
export const editorTitle = ref('')
export const editorSaveHandler = ref<(() => void) | null>(null)
export const editorCloseHandler = ref<(() => void) | null>(null)
export const editorDirty = ref(false)

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
  editorDirty.value = false
}
