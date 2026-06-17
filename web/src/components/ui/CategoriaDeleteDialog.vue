<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

interface Categoria {
  id: number
  nombre: string
  _count?: {
    insumos?: number
    productos?: number
  }
}

const props = defineProps<{
  open: boolean
  categoria: Categoria | null
  categorias: Categoria[]
}>()

const emit = defineEmits<{
  confirm: [reasignarA?: number]
  cancel: []
}>()

const reasignarA = ref<number | null>(null)

// Resetear el valor seleccionado al abrir
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    reasignarA.value = null
  }
})

const count = computed(() => {
  if (!props.categoria?._count) return 0
  return props.categoria._count.insumos ?? props.categoria._count.productos ?? 0
})

const otrasCategorias = computed(() => {
  if (!props.categoria) return []
  return props.categorias.filter(c => c.id !== props.categoria?.id)
})

const canConfirm = computed(() => {
  if (count.value === 0) return true
  return reasignarA.value !== null
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('cancel')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="open && categoria" class="confirm-mask" @click="emit('cancel')">
        <div class="confirm-dialog" @click.stop>
          <h4>Eliminar categoría</h4>
          
          <!-- Caso 1: 0 asociados -> Confirmación simple -->
          <div v-if="count === 0" class="dialog-body">
            <p>¿Estás seguro de que deseas eliminar la categoría <strong>{{ categoria.nombre }}</strong>?</p>
            <p class="warning-text">Esta acción no se puede deshacer.</p>
          </div>

          <!-- Caso 2: > 0 asociados y hay alternativas -> Reasignación -->
          <div v-else-if="otrasCategorias.length > 0" class="dialog-body">
            <p>La categoría <strong>{{ categoria.nombre }}</strong> tiene <strong>{{ count }}</strong> {{ count === 1 ? 'elemento asociado' : 'elementos asociados' }}.</p>
            <p>Para poder eliminarla, debés mover sus elementos a otra categoría:</p>
            
            <div class="field mt-3">
              <label for="reasignar-select">Categoría destino</label>
              <select
                id="reasignar-select"
                v-model="reasignarA"
                class="select"
              >
                <option :value="null" disabled>Selecciona una categoría...</option>
                <option
                  v-for="c in otrasCategorias"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.nombre }}
                </option>
              </select>
            </div>
          </div>

          <!-- Caso 3: > 0 asociados pero no hay alternativas -> Bloqueado -->
          <div v-else class="dialog-body">
            <p>La categoría <strong>{{ categoria.nombre }}</strong> tiene <strong>{{ count }}</strong> {{ count === 1 ? 'elemento asociado' : 'elementos asociados' }}.</p>
            <p class="warning-text block-msg">
              No es posible eliminarla porque no existen otras categorías de destino. Por favor, creá otra categoría primero.
            </p>
          </div>

          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="emit('cancel')">
              Cancelar
            </button>
            <button
              v-if="count === 0 || otrasCategorias.length > 0"
              class="btn btn-danger"
              :disabled="!canConfirm"
              @click="emit('confirm', reasignarA ?? undefined)"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(28, 26, 30, 0.30);
  display: grid;
  place-items: center;
  z-index: 90;
}

.confirm-dialog {
  background: var(--surface);
  border-radius: var(--r-lg);
  padding: 22px;
  width: 400px;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.confirm-dialog h4 {
  font-size: 17px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.confirm-dialog p {
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.45;
}

.warning-text {
  color: var(--coral-700) !important;
  font-weight: 500;
}

.block-msg {
  padding: 8px 12px;
  background: var(--coral-50);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mt-3 {
  margin-top: 12px;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Transitions */
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 140ms ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
