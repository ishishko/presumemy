<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Trash2, Plus, GripVertical } from '@lucide/vue'
import { formatMoney } from '@/shared/lib/format'
import type { Insumo } from '@/types'

// Props & Models
const props = defineProps<{
  errors: Record<string, string>
  insumosList: Insumo[]
}>()

// V-Models
const bomLineas = defineModel<Array<{
  tipoLinea: 'insumo' | 'cameo' | 'embalaje' | 'extra'
  insumoId?: number
  descripcion: string
  cantidad: number
  costoUnitario: number
}>>({ required: true })

const activeRowIdx = ref<number | null>(null)
const recetaTableRef = ref<HTMLElement | null>(null)
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

const bomTotal = computed(() =>
  bomLineas.value.reduce((s, l) => s + (l.cantidad || 0) * (l.costoUnitario || 0), 0)
)

watch(() => props.insumosList, (newInsumos) => {
  if (newInsumos.length === 0) return
  bomLineas.value.forEach(l => {
    if (l.insumoId) {
      const ins = newInsumos.find(i => i.id === l.insumoId)
      if (ins) {
        l.costoUnitario = Number(ins.costoUnitario)
      }
    }
  })
}, { immediate: true })

function focusRecetaInput(idx: number) {
  nextTick(() => {
    const inputs = recetaTableRef.value?.querySelectorAll('input.cell-input, select.cell-select')
    if (inputs && inputs.length > 0) {
      // Cada fila tiene 1 select y 3 inputs (o 2 select y 2 inputs)
      // Buscamos el segundo control de la fila correspondiente (la descripción/insumo)
      const inputToFocus = inputs[idx * 3 + 1] as HTMLElement
      if (inputToFocus) {
        inputToFocus.focus()
      }
    }
  })
}

function addBomLinea() {
  bomLineas.value.push({
    tipoLinea: 'insumo',
    insumoId: undefined,
    cantidad: 1,
    descripcion: '',
    costoUnitario: 0,
  })
  focusRecetaInput(bomLineas.value.length - 1)
}

function removeBomLinea(idx: number) {
  bomLineas.value.splice(idx, 1)
  if (bomLineas.value.length === 0) addBomLinea()
}

function onInsumoChange(idx: number, insumoId: number) {
  const row = bomLineas.value[idx]
  if (insumoId === 0) {
    row.insumoId = undefined
    row.costoUnitario = 0
    return
  }

  const ins = props.insumosList.find(i => i.id === insumoId)
  if (ins) {
    row.insumoId = ins.id
    row.descripcion = ins.nombre
    row.costoUnitario = Number(ins.costoUnitario)
  }
}

function onInsumoSelectBlur(_idx?: number) {
  cleanupEmptyReceta()
}

function onCellEnter(_idx?: number) {
  const inputs = recetaTableRef.value?.querySelectorAll('input.cell-input, select.cell-select')
  if (inputs) {
    const activeEl = document.activeElement as HTMLElement
    const currentIdx = Array.from(inputs).indexOf(activeEl)
    if (currentIdx !== -1 && currentIdx < inputs.length - 1) {
      (inputs[currentIdx + 1] as HTMLElement).focus()
    } else if (currentIdx === inputs.length - 1) {
      addBomLinea()
    }
  }
}

function cleanupEmptyReceta() {
  const kept = bomLineas.value.filter(l => 
    (l.insumoId && l.insumoId > 0) || 
    (l.descripcion && l.descripcion.trim() !== '') || 
    l.cantidad > 0
  )
  bomLineas.value = kept.length > 0 ? kept : [{
    tipoLinea: 'insumo',
    insumoId: undefined,
    descripcion: '',
    cantidad: 1,
    costoUnitario: 0,
  }]
}

function onRecetaTableFocusout(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null
  if (next && recetaTableRef.value?.contains(next)) return

  cleanupEmptyReceta()
  activeRowIdx.value = null
}

// Drag & Drop
function onBomDragStart(idx: number) {
  dragIdx.value = idx
}

function onBomDragOver(event: DragEvent, idx: number) {
  event.preventDefault()
  if (dragIdx.value === null || dragIdx.value === idx) return
  dragOverIdx.value = idx
}

function onBomDrop(idx: number) {
  if (dragIdx.value === null || dragIdx.value === idx) return

  const lines = [...bomLineas.value]
  const [removed] = lines.splice(dragIdx.value, 1)
  lines.splice(idx, 0, removed)

  bomLineas.value = lines
}

function onBomDragEnd() {
  dragIdx.value = null
  dragOverIdx.value = null
}

function getInsumoUnit(insumoId?: number): string {
  if (!insumoId) return ''
  const ins = props.insumosList.find(i => i.id === insumoId)
  return ins?.unidad || ''
}

function money(n: number): string {
  return formatMoney(n)
}
</script>

<template>
  <section class="pd-bom">
    <div class="pd-bom-head">
      <h4>Receta · BOM</h4>
      <span class="text-hint" style="font-size: 12px">
        Costos aislados — editar el costo unitario acá no afecta a otros productos.
      </span>
    </div>

    <div ref="recetaTableRef" class="lines-spreadsheet pd-bom-table" @focusout="onRecetaTableFocusout">
      <table>
        <colgroup>
          <col style="width: 22px;" />
          <col style="width: 130px;" />
          <col />
          <col style="width: 100px;" />
          <col style="width: 130px;" />
          <col style="width: 120px;" />
          <col style="width: 36px;" />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Tipo</th>
            <th>Insumo / descripción</th>
            <th class="num">Cantidad</th>
            <th class="num">Costo unitario</th>
            <th class="num">Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(l, idx) in bomLineas"
            :key="idx"
            :class="[
              'ln-row',
              activeRowIdx === idx && 'active',
              dragIdx === idx && 'dragging',
              dragOverIdx === idx && dragIdx !== idx && 'drag-over'
            ]"
            draggable="true"
            @dragstart="onBomDragStart(idx)"
            @dragover="onBomDragOver($event, idx)"
            @drop="onBomDrop(idx)"
            @dragend="onBomDragEnd"
            @mousedown="activeRowIdx = idx"
          >
            <td class="grip" title="Arrastrar para reordenar">
              <GripVertical :size="14" />
            </td>
            <td>
              <select
                class="cell-select"
                v-model="l.tipoLinea"
                @focus="activeRowIdx = idx"
                @keydown.enter.prevent="onCellEnter(idx)"
              >
                <option value="insumo">Insumo</option>
                <option value="cameo">Cameo</option>
                <option value="embalaje">Embalaje</option>
                <option value="extra">Extra</option>
              </select>
            </td>
            <td>
              <select
                class="cell-input"
                :value="l.insumoId || 0"
                @change="onInsumoChange(idx, +($event.target as HTMLSelectElement).value)"
                @blur="onInsumoSelectBlur(idx)"
                @focus="activeRowIdx = idx"
                @keydown.enter.prevent="onCellEnter(idx)"
              >
                <option :value="0">Texto libre (ej. Mano de obra)</option>
                <option v-for="ins in insumosList" :key="ins.id" :value="ins.id">{{ ins.nombre }}</option>
              </select>
            </td>
            <td style="position: relative;">
              <input
                class="cell-input num-input"
                type="number"
                min="0"
                step="0.01"
                v-model.number="l.cantidad"
                @focus="activeRowIdx = idx"
                @keydown.enter.prevent="onCellEnter(idx)"
                style="padding-right: 45px; text-align: right;"
              />
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--ink-muted); pointer-events: none;">
                {{ getInsumoUnit(l.insumoId) }}
              </span>
            </td>
            <td style="position: relative;">
              <input
                class="cell-input num-input"
                type="number"
                min="0"
                step="0.01"
                v-model.number="l.costoUnitario"
                @focus="activeRowIdx = idx"
                @keydown.enter.prevent="onCellEnter(idx)"
                style="padding-right: 45px; text-align: right;"
                :disabled="!!l.insumoId"
              />
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--ink-muted); pointer-events: none;">
                {{ l.insumoId ? `/ ${getInsumoUnit(l.insumoId)}` : '' }}
              </span>
            </td>
            <td class="num cell-subtotal text-mono font-medium">
              {{ money(l.cantidad * l.costoUnitario) }}
            </td>
            <td>
              <button class="del-btn" @click="removeBomLinea(idx)" title="Eliminar línea">
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <button type="button" class="add-line-btn" @click="addBomLinea">
        <Plus :size="14" /> Agregar línea
      </button>
    </div>

    <div class="pd-bom-totals" style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding: 12px; background: var(--page-bg)/30; border: 1px solid var(--border); border-radius: var(--r-md);">
      <span class="text-12 text-ink-muted">Total receta BOM:</span>
      <span class="text-15 font-semibold text-ink font-mono">{{ money(bomTotal) }}</span>
    </div>

    <div v-if="errors.bomLineas" class="field-error" role="alert" style="margin-top: 6px;">
      {{ errors.bomLineas }}
    </div>
  </section>
</template>
