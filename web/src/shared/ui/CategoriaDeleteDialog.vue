<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import BaseButton from './BaseButton.vue'
import FloatingSelect from './FloatingSelect.vue'

interface Categoria {
  id: number
  nombre: string
  count?: number
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

const reasignarA = ref<number | ''>('')

// Resetear el valor seleccionado al abrir
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    reasignarA.value = ''
  }
})

const count = computed(() => {
  if (!props.categoria) return 0
  if (props.categoria.count !== undefined) return props.categoria.count
  if (!props.categoria._count) return 0
  return props.categoria._count.insumos ?? props.categoria._count.productos ?? 0
})

const otrasCategorias = computed(() => {
  if (!props.categoria) return []
  return props.categorias.filter(c => c.id !== props.categoria?.id)
})

const canConfirm = computed(() => {
  if (count.value === 0) return true
  return reasignarA.value !== ''
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
      <div v-if="open && categoria" class="fixed inset-0 grid place-items-center z-[90] bg-[rgba(28,26,30,0.30)]" @click="emit('cancel')">
        <div class="bg-surface rounded-lg p-[22px] w-[400px] shadow-2 border border-border flex flex-col gap-3.5" @click.stop>
          <h4 class="text-ink text-[17px] font-medium m-0">Eliminar categoría</h4>
          
          <!-- Caso 1: 0 asociados -> Confirmación simple -->
          <div v-if="count === 0" class="flex flex-col gap-2.5">
            <p class="text-13 text-ink-muted leading-snug m-0">¿Estás seguro de que deseas eliminar la categoría <strong>{{ categoria.nombre }}</strong>?</p>
            <p class="text-13 text-coral-700 font-semibold m-0">Esta acción no se puede deshacer.</p>
          </div>

          <!-- Caso 2: > 0 asociados y hay alternativas -> Reasignación -->
          <div v-else-if="otrasCategorias.length > 0" class="flex flex-col gap-2.5">
            <p class="text-13 text-ink-muted leading-snug m-0">La categoría <strong>{{ categoria.nombre }}</strong> tiene <strong>{{ count }}</strong> {{ count === 1 ? 'elemento asociado' : 'elementos asociados' }}.</p>
            <p class="text-13 text-ink-muted leading-snug m-0">Para poder eliminarla, debés mover sus elementos a otra categoría:</p>
            
            <div class="mt-2 w-full">
              <FloatingSelect
                id="reasignar-select"
                label="Categoría destino"
                v-model.number="reasignarA"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                <option
                  v-for="c in otrasCategorias"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.nombre }}
                </option>
              </FloatingSelect>
            </div>
          </div>

          <!-- Caso 3: > 0 asociados pero no hay alternativas -> Bloqueado -->
          <div v-else class="flex flex-col gap-2.5">
            <p class="text-13 text-ink-muted leading-snug m-0">La categoría <strong>{{ categoria.nombre }}</strong> tiene <strong>{{ count }}</strong> {{ count === 1 ? 'elemento asociado' : 'elementos asociados' }}.</p>
            <p class="text-13 text-coral-700 font-semibold p-3 bg-coral-50 rounded-sm border border-border m-0">
              No es posible eliminarla porque no existen otras categorías de destino. Por favor, creá otra categoría primero.
            </p>
          </div>

          <div class="flex gap-2 justify-end">
            <BaseButton
              variant="secondary"
              @click="emit('cancel')"
            >
              Cancelar
            </BaseButton>
            <BaseButton
              v-if="count === 0 || otrasCategorias.length > 0"
              variant="danger"
              :disabled="!canConfirm"
              @click="emit('confirm', reasignarA !== '' ? reasignarA : undefined)"
            >
              Eliminar
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
