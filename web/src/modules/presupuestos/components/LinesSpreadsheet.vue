<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Trash2, Plus, GripVertical } from '@lucide/vue'
import { formatMoney } from '@/shared/lib/format'
import type { Producto } from '@/types'

// Props & Models
const props = defineProps<{
  errors: Record<string, string>
  productosList: Producto[]
}>()

// V-Models
const lineas = defineModel<Array<{
  id: number
  producto: string
  productoId: number
  qty: string
  price: string
}>>({ required: true })

const activeRow = ref<number | null>(null)
const cellDirty = ref(false)
const dragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)
const idRef = ref(1000)
const mkId = () => ++idRef.value

const isRowEmpty = (l: { producto: string; qty: string; price: string }) =>
  !l.producto.trim() && !l.qty.trim() && !l.price.trim()

function updateLine(id: number, patch: Partial<{ producto: string; productoId: number; qty: string; price: string }>) {
  lineas.value = lineas.value.map(l => l.id === id ? { ...l, ...patch } : l)
}

function onCellInput(id: number, patch: Partial<{ qty: string; price: string }>) {
  cellDirty.value = true
  updateLine(id, patch)
}

function onCellFocus(id: number) {
  activeRow.value = id
  cellDirty.value = false
}

function removeLine(id: number) {
  lineas.value = lineas.value.filter(l => l.id !== id)
  if (lineas.value.length === 0) {
    lineas.value = [{ id: mkId(), producto: '', productoId: 0, qty: '', price: '' }]
  }
}

function handleProductChange(id: number, val: string) {
  cellDirty.value = true
  const line = lineas.value.find(l => l.id === id)
  const p = props.productosList.find(p => p.nombre === val)
  const patch: any = { producto: val }
  if (p) {
    patch.productoId = p.id
    patch.price = p.precio.toString()
    if (line && line.qty.trim() === '') patch.qty = '1'
  } else {
    patch.productoId = 0
  }
  updateLine(id, patch)
}

function focusRowFirstCell(rowId: number) {
  nextTick(() => {
    const row = document.querySelector(`.lines-spreadsheet tbody tr[data-id="${rowId}"]`) as HTMLElement | null
    const input = row?.querySelector('.cell-input') as HTMLInputElement | undefined
    input?.focus()
  })
}

function getFocusable(): HTMLElement[] {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(document.querySelectorAll<HTMLElement>(sel))
    .filter(el => el.offsetParent !== null)
}

function focusAfterTable() {
  const table = document.querySelector('.lines-spreadsheet') as HTMLElement | null
  if (!table) return
  const focusables = getFocusable()
  const active = document.activeElement as HTMLElement
  const fromIdx = focusables.indexOf(active)
  const next = focusables.find((el, i) => i > fromIdx && !table.contains(el))
  next?.focus()
}

function onCellEnter(rowId: number) {
  if (cellDirty.value) {
    cellDirty.value = false
    return
  }
  const idx = lineas.value.findIndex(l => l.id === rowId)
  const nextRow = lineas.value[idx + 1]
  if (nextRow) {
    focusRowFirstCell(nextRow.id)
    return
  }
  const current = lineas.value[idx]
  if (current && isRowEmpty(current)) {
    focusAfterTable()
  } else {
    handleAddLine()
  }
}

function onTableFocusout(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null
  const table = e.currentTarget as HTMLElement
  if (next && table.contains(next)) return
  activeRow.value = null
  cellDirty.value = false
  const kept = lineas.value.filter(l => !isRowEmpty(l))
  lineas.value = kept.length > 0 ? kept : [{ id: mkId(), producto: '', productoId: 0, qty: '', price: '' }]
}

function onDrop(id: number) {
  if (dragId.value == null || dragId.value === id) {
    dragId.value = null
    dragOverId.value = null
    return
  }
  const from = lineas.value.findIndex(l => l.id === dragId.value)
  const to = lineas.value.findIndex(l => l.id === id)
  if (from < 0 || to < 0) return
  const next = [...lineas.value]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  lineas.value = next
  dragId.value = null
  dragOverId.value = null
}

function handleAddLine() {
  lineas.value.push({ id: mkId(), producto: '', productoId: 0, qty: '', price: '' })
  nextTick(() => {
    const table = document.querySelector('.lines-spreadsheet') as HTMLElement | null
    const inputs = table?.querySelectorAll('tbody tr:last-child .cell-input') as NodeListOf<HTMLInputElement> | undefined
    inputs?.[0]?.focus()
  })
}

function money(n: number): string {
  return formatMoney(n)
}
</script>

<template>
  <div class="lines-spreadsheet shadow-sm" @focusout="onTableFocusout">
    <table>
      <colgroup>
        <col style="width: 22px;" />
        <col />
        <col style="width: 100px;" />
        <col style="width: 140px;" />
        <col style="width: 140px;" />
        <col style="width: 36px;" />
      </colgroup>
      <thead>
        <tr>
          <th></th>
          <th>Producto</th>
          <th class="num">Cantidad</th>
          <th class="num">Precio</th>
          <th class="num">Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="l in lineas"
          :key="l.id"
          :data-id="l.id"
          :class="[
            'ln-row',
            activeRow === l.id && 'active',
            dragId === l.id && 'dragging',
            dragOverId === l.id && dragId !== l.id && 'drag-over'
          ]"
          draggable="true"
          @dragstart="dragId = l.id"
          @dragover.prevent="dragOverId = l.id"
          @drop="onDrop(l.id)"
          @dragend="dragId = null; dragOverId = null"
        >
          <td class="grip" title="Arrastrar para reordenar">
            <GripVertical :size="14" />
          </td>
          <td>
            <input
              class="cell-input"
              :value="l.producto"
              @input="handleProductChange(l.id, ($event.target as HTMLInputElement).value)"
              @focus="onCellFocus(l.id)"
              @keydown.enter.prevent="onCellEnter(l.id)"
              placeholder="Producto, descripción..."
              list="prod-datalist"
              aria-label="Producto"
            />
          </td>
          <td>
            <input
              class="cell-input num-input"
              type="text"
              :value="l.qty"
              @input="onCellInput(l.id, { qty: ($event.target as HTMLInputElement).value })"
              @focus="onCellFocus(l.id)"
              @keydown.enter.prevent="onCellEnter(l.id)"
              placeholder="0"
              aria-label="Cantidad"
            />
          </td>
          <td>
            <input
              class="cell-input num-input"
              type="text"
              :value="l.price"
              @input="onCellInput(l.id, { price: ($event.target as HTMLInputElement).value })"
              @focus="onCellFocus(l.id)"
              @keydown.enter.prevent="onCellEnter(l.id)"
              placeholder="0.00"
              aria-label="Precio"
            />
          </td>
          <td class="num font-medium text-ink font-mono select-none">
            {{ (parseFloat(l.qty) > 0 && parseFloat(l.price) >= 0) ? money(parseFloat(l.qty) * parseFloat(l.price)) : '—' }}
          </td>
          <td>
            <button
              type="button"
              class="del-btn"
              @click="removeLine(l.id)"
              title="Eliminar partida"
            >
              <Trash2 :size="14" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <datalist id="prod-datalist">
      <option v-for="p in productosList" :key="p.id" :value="p.nombre" />
    </datalist>

    <button
      type="button"
      class="add-line-btn"
      @click="handleAddLine"
    >
      <Plus :size="14" /> Agregar partida
    </button>
  </div>
</template>
