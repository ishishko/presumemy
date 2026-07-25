<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Trash2, Plus, GripVertical } from '@lucide/vue'
import { formatMoney } from '@/shared/lib/format'
import type { Insumo } from '@/modules/insumos'
import type { ModoCalculoBOM } from '../types'

// Props & Models
const props = defineProps<{
  errors: Record<string, string>
  insumosList: Insumo[]
}>()

// V-Models
const bomLineas = defineModel<Array<{
  tipoLinea: 'insumo' | 'cameo' | 'embalaje' | 'extra'
  modoCalculo: ModoCalculoBOM
  insumoId?: number
  descripcion: string
  cantidad: number
  costoUnitario: number
}>>({ required: true })

const MODOS: Array<{ id: ModoCalculoBOM; label: string; hint: string }> = [
  { id: 'normal', label: 'Normal', hint: 'Entra al costo de receta y recibe el margen' },
  { id: 'fijo', label: 'Fijo', hint: 'No entra al costo: se suma al precio ya con margen' },
  { id: 'extra', label: 'Extra', hint: 'No suma al costo ni al precio' },
]

const activeRowIdx = ref<number | null>(null)
const recetaTableRef = ref<HTMLElement | null>(null)
const dragIdx = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function subtotalDe(l: { cantidad: number; costoUnitario: number }) {
  return (l.cantidad || 0) * (l.costoUnitario || 0)
}

/** Solo las líneas normales: es lo que se muestra como "Total receta BOM". */
const bomTotal = computed(() =>
  bomLineas.value
    .filter(l => (l.modoCalculo || 'normal') === 'normal')
    .reduce((s, l) => s + subtotalDe(l), 0)
)

const fijosTotal = computed(() =>
  bomLineas.value
    .filter(l => l.modoCalculo === 'fijo')
    .reduce((s, l) => s + subtotalDe(l), 0)
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

/**
 * Enfoca el campo de insumo de la fila. Se busca dentro de la propia fila en
 * vez de contar controles sobre la lista plana de la tabla: esa aritmética se
 * desincroniza cada vez que la fila gana o pierde una columna.
 */
function focusRecetaInput(idx: number) {
  nextTick(() => {
    const fila = recetaTableRef.value?.querySelector(`tbody tr[data-idx="${idx}"]`)
    const campo = fila?.querySelector('input.cell-input') as HTMLElement | null
    campo?.focus()
  })
}

function addBomLinea() {
  bomLineas.value.push({
    tipoLinea: 'insumo',
    modoCalculo: 'normal',
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

/**
 * El campo es de texto libre con autocompletado sobre el catálogo de insumos:
 * si lo escrito coincide con un insumo se engancha la referencia y su costo;
 * si no, la línea queda como descripción suelta con costo editable.
 */
function onInsumoInput(idx: number, valor: string) {
  const row = bomLineas.value[idx]
  row.descripcion = valor

  const ins = props.insumosList.find(
    i => i.nombre.toLowerCase() === valor.trim().toLowerCase()
  )
  if (ins) {
    row.insumoId = ins.id
    row.descripcion = ins.nombre
    row.costoUnitario = Number(ins.costoUnitario)
  } else if (row.insumoId) {
    // Se despegó del insumo: conserva el costo como punto de partida editable.
    row.insumoId = undefined
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

/**
 * Una línea existe si nombra algo: un insumo del catálogo o una descripción
 * suelta. La cantidad no alcanza — las filas nuevas nacen con cantidad 1, así
 * que tomarla como señal dejaba vivas todas las filas en blanco.
 */
function lineaTieneContenido(l: { insumoId?: number; descripcion: string }) {
  return (!!l.insumoId && l.insumoId > 0) || (l.descripcion || '').trim() !== ''
}

function cleanupEmptyReceta() {
  const kept = bomLineas.value.filter(lineaTieneContenido)
  bomLineas.value = kept.length > 0 ? kept : [{
    tipoLinea: 'insumo',
    modoCalculo: 'normal',
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

/**
 * Inicial de la unidad: en la grilla el número es lo que importa, y la unidad
 * completa ("pliego", "rollo") le comía el ancho a la columna de costo.
 * La unidad entera queda en el title.
 */
function unidadAbrev(insumoId?: number): string {
  return getInsumoUnit(insumoId).trim().charAt(0)
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
          <col style="width: 110px;" />
          <col style="width: 84px;" />
          <col style="width: 150px;" />
          <col style="width: 120px;" />
          <col style="width: 36px;" />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Tipo</th>
            <th>Insumo / descripción</th>
            <th>Calculado</th>
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
            :data-idx="idx"
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
              <input
                class="cell-input"
                :value="l.descripcion"
                @input="onInsumoInput(idx, ($event.target as HTMLInputElement).value)"
                @blur="onInsumoSelectBlur(idx)"
                @focus="activeRowIdx = idx"
                @keydown.enter.prevent="onCellEnter(idx)"
                placeholder="Insumo, descripción..."
                list="bom-insumos-datalist"
                :aria-label="'Insumo o descripción ' + (idx + 1)"
              />
            </td>
            <td>
              <select
                class="cell-select"
                v-model="l.modoCalculo"
                @focus="activeRowIdx = idx"
                @keydown.enter.prevent="onCellEnter(idx)"
                :title="MODOS.find(m => m.id === l.modoCalculo)?.hint"
                :aria-label="'Tipo de cálculo ' + (idx + 1)"
              >
                <option v-for="m in MODOS" :key="m.id" :value="m.id">{{ m.label }}</option>
              </select>
            </td>
            <td>
              <div class="flex items-center">
                <input
                  class="cell-input num-input"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="l.cantidad"
                  @focus="activeRowIdx = idx"
                  @keydown.enter.prevent="onCellEnter(idx)"
                />
                <span
                  v-if="unidadAbrev(l.insumoId)"
                  class="shrink-0 pr-2 text-11 text-ink-muted pointer-events-none"
                  :title="getInsumoUnit(l.insumoId)"
                >{{ unidadAbrev(l.insumoId) }}</span>
              </div>
            </td>
            <td>
              <div class="flex items-center">
                <input
                  class="cell-input num-input"
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="l.costoUnitario"
                  @focus="activeRowIdx = idx"
                  @keydown.enter.prevent="onCellEnter(idx)"
                  :disabled="!!l.insumoId"
                />
                <span
                  v-if="l.insumoId && getInsumoUnit(l.insumoId)"
                  class="shrink-0 pr-2 text-11 text-ink-muted pointer-events-none whitespace-nowrap"
                >/ {{ getInsumoUnit(l.insumoId) }}</span>
              </div>
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

      <datalist id="bom-insumos-datalist">
        <option v-for="ins in insumosList" :key="ins.id" :value="ins.nombre" />
      </datalist>

      <button type="button" class="add-line-btn" @click="addBomLinea">
        <Plus :size="14" /> Agregar línea
      </button>
    </div>

    <div class="pd-bom-totals" style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding: 12px; background: var(--color-page-bg)/30; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
      <span class="text-12 text-ink-muted">Total receta BOM:</span>
      <span class="text-15 font-semibold text-ink font-mono">{{ money(bomTotal) }}</span>
    </div>

    <div v-if="fijosTotal > 0" class="flex justify-between items-center mt-1.5 px-3 py-2 text-12 text-ink-muted">
      <span>Cargos fijos (se suman al precio, sin margen):</span>
      <span class="font-mono text-ink">{{ money(fijosTotal) }}</span>
    </div>

    <div v-if="errors.bomLineas" class="field-error" role="alert" style="margin-top: 6px;">
      {{ errors.bomLineas }}
    </div>
  </section>
</template>
