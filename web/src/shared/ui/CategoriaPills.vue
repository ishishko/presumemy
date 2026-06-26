<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { Pencil, X, Plus } from '@lucide/vue'

interface Categoria {
  id: number
  nombre: string
  _count?: {
    insumos?: number
    productos?: number
  }
}

const props = withDefaults(
  defineProps<{
    categorias: Categoria[]
    modelValue: number | 'todas'
    allLabel?: string
  }>(),
  {
    allLabel: 'Todas',
  }
)

const emit = defineEmits<{
  'update:modelValue': [val: number | 'todas']
  'create': [nombre: string]
  'rename': [payload: { id: number; nombre: string }]
  'remove': [categoria: Categoria]
}>()

// Estados de edición
const editingId = ref<number | null>(null)
const editName = ref('')
const editInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

// Estados de creación
const isCreating = ref(false)
const createName = ref('')
const createInputRef = ref<HTMLInputElement | null>(null)

// Click sostenido (Long Press)
const activeActionsId = ref<number | null>(null)
let pressTimer: ReturnType<typeof setTimeout> | null = null
let isLongPress = false

function getCount(c: Categoria): number {
  if (!c._count) return 0
  return c._count.insumos ?? c._count.productos ?? 0
}

// Controladores para click sostenido (Long Press)
function handleMousedown(e: MouseEvent, c: Categoria) {
  if (e.button !== 0) return // Solo click izquierdo
  isLongPress = false

  pressTimer = setTimeout(() => {
    isLongPress = true
    activeActionsId.value = c.id
  }, 500)
}

function handleMouseup(c: Categoria) {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }

  if (!isLongPress) {
    // Click normal: toggle select
    toggleSelect(c.id)
  }
}

function handleMouseleave() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

// Toggle select: si ya está seleccionada, deselecciona a 'todas'
function toggleSelect(id: number) {
  activeActionsId.value = null
  if (props.modelValue === id) {
    emit('update:modelValue', 'todas')
  } else {
    emit('update:modelValue', id)
  }
}

// Iniciar renombrado
async function startRename(c: Categoria) {
  editingId.value = c.id
  editName.value = c.nombre
  activeActionsId.value = null
  await nextTick()
  const el = editInputRef.value
  if (el) {
    if (Array.isArray(el)) {
      el[0]?.focus()
    } else {
      el.focus()
    }
  }
}

// Guardar renombrado
function saveRename(id: number) {
  const name = editName.value.trim()
  if (name && name !== props.categorias.find(c => c.id === id)?.nombre) {
    emit('rename', { id, nombre: name })
  }
  editingId.value = null
  editName.value = ''
}

// Cancelar renombrado
function cancelRename() {
  editingId.value = null
  editName.value = ''
}

// Iniciar creación
async function startCreate() {
  if (props.categorias.length >= 12) return
  isCreating.value = true
  createName.value = ''
  await nextTick()
  createInputRef.value?.focus()
}

// Guardar creación
function saveCreate() {
  const name = createName.value.trim()
  if (name) {
    emit('create', name)
  }
  isCreating.value = false
  createName.value = ''
}

// Cancelar creación
function cancelCreate() {
  isCreating.value = false
  createName.value = ''
}

// Confirmar eliminación
function startRemove(c: Categoria) {
  emit('remove', c)
}

// Cerrar acciones al hacer click fuera
function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.editable-pill')) {
    activeActionsId.value = null
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
})
</script>

<template>
  <div class="flex flex-wrap gap-1.5 mb-5 select-none">
    <!-- Pill de Todos/Todas -->
    <button
      type="button"
      class="font-sans text-12 font-medium px-3 py-1.5 rounded-pill border border-border bg-transparent text-ink-muted cursor-pointer transition-colors duration-120 hover:text-ink hover:border-border-strong select-none focus-visible:outline-none focus-visible:shadow-focus-ring"
      :class="[modelValue === 'todas' ? 'bg-violet-50! text-violet-700! border-violet-100!' : '']"
      @click="emit('update:modelValue', 'todas')"
    >
      {{ allLabel }}
    </button>

    <!-- Lista de Categorías -->
    <template v-for="c in categorias" :key="c.id">
      <!-- Input de Edición Inline -->
      <div v-if="editingId === c.id" class="inline-flex items-center">
        <input
          ref="editInputRef"
          v-model="editName"
          type="text"
          class="font-sans text-13 font-medium text-ink bg-surface border border-teal-500 rounded-pill px-2.5 outline-none w-[100px] h-7 box-border shadow-focus-ring transition-all"
          maxlength="40"
          @keydown.enter="saveRename(c.id)"
          @keydown.esc="cancelRename"
          @blur="saveRename(c.id)"
        />
      </div>

      <!-- Pill normal con eventos de click y click sostenido -->
      <button
        v-else
        type="button"
        class="font-sans text-12 font-medium px-3 py-1.5 rounded-pill border border-border bg-transparent text-ink-muted cursor-pointer transition-colors duration-120 hover:text-ink hover:border-border-strong select-none focus-visible:outline-none focus-visible:shadow-focus-ring editable-pill"
        :class="[
          modelValue === c.id ? 'bg-violet-50! text-violet-700! border-violet-100!' : '',
          activeActionsId === c.id ? 'show-actions' : ''
        ]"
        @mousedown="handleMousedown($event, c)"
        @mouseup="handleMouseup(c)"
        @mouseleave="handleMouseleave"
      >
        <span class="white-space-nowrap">{{ c.nombre }}</span>
        <span v-if="getCount(c) > 0" class="text-11 opacity-60 font-mono tabular-nums">· {{ getCount(c) }}</span>
        
        <!-- Botones de Acción (lápiz y X) -->
        <span class="pill-actions" @mousedown.stop @mouseup.stop>
          <span class="action-btn" @click.stop="startRename(c)" title="Renombrar">
            <Pencil :size="12" />
          </span>
          <span class="action-btn danger" @click.stop="startRemove(c)" title="Eliminar">
            <X :size="12" />
          </span>
        </span>
      </button>
    </template>

    <!-- Input de Creación Inline -->
    <div v-if="isCreating" class="inline-flex items-center">
      <input
        ref="createInputRef"
        v-model="createName"
        type="text"
        class="font-sans text-13 font-medium text-ink bg-surface border border-teal-500 rounded-pill px-2.5 outline-none w-[100px] h-7 box-border shadow-focus-ring transition-all"
        placeholder="Nueva..."
        maxlength="40"
        @keydown.enter="saveCreate"
        @keydown.esc="cancelCreate"
        @blur="saveCreate"
      />
    </div>

    <!-- Botón de Agregar (+) -->
    <button
      v-else
      type="button"
      class="font-sans text-12 font-medium px-3 py-1.5 rounded-pill border border-border bg-transparent text-ink-muted cursor-pointer transition-colors duration-120 hover:text-ink hover:border-border-strong select-none focus-visible:outline-none focus-visible:shadow-focus-ring inline-flex items-center justify-center min-w-[32px] px-0"
      :disabled="categorias.length >= 12"
      :title="categorias.length >= 12 ? 'Máximo 12 categorías' : 'Agregar categoría'"
      @click="startCreate"
    >
      <Plus :size="14" />
    </button>
  </div>
</template>

<style scoped>
.editable-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pill-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  width: 0;
  overflow: hidden;
  opacity: 0;
  transition: width 120ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 120ms ease;
}

/* Se muestran solo cuando tiene la clase activa por click sostenido */
.editable-pill.show-actions .pill-actions {
  width: 32px;
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background 120ms ease, opacity 120ms ease;
}

.action-btn:hover {
  background: var(--color-border-strong);
  opacity: 1;
}

.action-btn.danger:hover {
  background: var(--color-coral-50);
  color: var(--color-coral-700);
  opacity: 1;
}
</style>
