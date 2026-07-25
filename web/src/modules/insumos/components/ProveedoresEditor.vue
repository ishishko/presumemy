<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Trash2, Plus } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useToast } from '@/shared/lib/useToast'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import { useInsumosStore } from '../store'

// Props & Models
const props = defineProps<{
  errors: Record<string, string>
}>()

// V-Models
const proveedores = defineModel<Array<{ proveedorId: number; precio: number; esPrincipal: boolean; nombreTemp?: string }>>({ required: true })

const { toast } = useToast()
const store = useInsumosStore()
/** Catálogo global de proveedores: lo administra el store del módulo. */
const { proveedores: proveedoresList } = storeToRefs(store)

const activeRowIdx = ref<number | null>(null)
const provTableRef = ref<HTMLElement | null>(null)

// Confirmación para eliminar proveedor permanentemente del catálogo
const showConfirmDeleteGlobal = ref(false)
const pendingDeleteProvId = ref<number | null>(null)
const pendingDeleteProvName = ref('')

function focusProviderInput(idx: number, isNewField = false) {
  nextTick(() => {
    const inputs = provTableRef.value?.querySelectorAll('input.cell-input')
    if (inputs && inputs.length > 0) {
      // Cada fila tiene 2 inputs (nombre y precio)
      const inputToFocus = inputs[idx * 2] as HTMLInputElement
      if (inputToFocus) {
        inputToFocus.focus()
        if (!isNewField) {
          inputToFocus.select()
        }
      }
    }
  })
}

function addProveedor() {
  if (proveedores.value.length >= 3) return
  proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: false, nombreTemp: '' })
  focusProviderInput(proveedores.value.length - 1, true)
}

function removeProveedor(idx: number) {
  proveedores.value.splice(idx, 1)
  if (proveedores.value.length === 0) {
    proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: true, nombreTemp: '' })
  }
  if (!proveedores.value.some(p => p.esPrincipal)) {
    proveedores.value[0].esPrincipal = true
  }
}

function setPrincipal(idx: number) {
  proveedores.value.forEach((p, i) => p.esPrincipal = i === idx)
}

function onProveedorChange(idx: number) {
  const row = proveedores.value[idx]
  if (!row.nombreTemp) return

  const nombreTrim = row.nombreTemp.trim()
  if (nombreTrim === '') {
    row.proveedorId = 0
    return
  }

  // Buscar si ya existe en la lista de proveedores del sistema
  const pr = proveedoresList.value.find(p => p.nombre.toLowerCase() === nombreTrim.toLowerCase())
  if (pr) {
    row.proveedorId = pr.id
    row.nombreTemp = pr.nombre
  }
}

async function onProveedorBlur(idx: number) {
  const row = proveedores.value[idx]
  if (!row.nombreTemp) return

  const nombreTrim = row.nombreTemp.trim()
  if (nombreTrim === '') {
    row.proveedorId = 0
    return
  }

  const pr = proveedoresList.value.find(p => p.nombre.toLowerCase() === nombreTrim.toLowerCase())
  if (!pr) {
    // Si no existe, lo creamos inline en el catálogo global de proveedores
    try {
      const nuevoProv = await store.createProveedor(nombreTrim)
      row.proveedorId = nuevoProv.id
      row.nombreTemp = nuevoProv.nombre
      toast(`Proveedor "${nuevoProv.nombre}" creado en el catálogo`, 'success')
    } catch (e: any) {
      toast(e.message || 'Error al crear proveedor en el catálogo', 'error')
    }
  }
}

function onCellEnter(idx: number) {
  const row = proveedores.value[idx]
  if (row.nombreTemp && row.nombreTemp.trim() !== '') {
    onProveedorChange(idx)
    onProveedorBlur(idx)
  }

  // Si presionan enter, vamos al siguiente campo o fila
  const inputs = provTableRef.value?.querySelectorAll('input.cell-input')
  if (inputs) {
    const activeEl = document.activeElement as HTMLInputElement
    const currentIdx = Array.from(inputs).indexOf(activeEl)
    if (currentIdx !== -1 && currentIdx < inputs.length - 1) {
      (inputs[currentIdx + 1] as HTMLInputElement).focus()
    } else if (currentIdx === inputs.length - 1 && proveedores.value.length < 3) {
      addProveedor()
    }
  }
}

function cleanupEmptyProveedores() {
  const kept = proveedores.value.filter(p => p.proveedorId > 0 || (p.nombreTemp && p.nombreTemp.trim() !== '') || p.precio > 0)
  proveedores.value = kept.length > 0 ? kept : [{ proveedorId: 0, precio: 0, esPrincipal: true, nombreTemp: '' }]
  if (!proveedores.value.some(p => p.esPrincipal)) {
    proveedores.value[0].esPrincipal = true
  }
}

function onProvTableFocusout(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null
  if (next && provTableRef.value?.contains(next)) return

  // Foco está fuera de la tabla de proveedores, hacemos la limpieza
  cleanupEmptyProveedores()
  activeRowIdx.value = null
}

function triggerDeleteGlobalProv(id: number, name: string) {
  // Desenfocar el input activo para evitar escritura fantasma
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  pendingDeleteProvId.value = id
  pendingDeleteProvName.value = name
  showConfirmDeleteGlobal.value = true
}

async function handleDeleteGlobalProvConfirm() {
  if (!pendingDeleteProvId.value) return
  const idToDelete = pendingDeleteProvId.value
  try {
    await store.removeProveedor(idToDelete)

    // Limpiar también en el array de proveedores seleccionados en la UI
    proveedores.value.forEach(row => {
      if (row.proveedorId === idToDelete) {
        row.proveedorId = 0
        row.nombreTemp = ''
      }
    })
    cleanupEmptyProveedores()
    toast('Proveedor eliminado del catálogo con éxito', 'success')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar el proveedor del catálogo', 'error')
  }
  showConfirmDeleteGlobal.value = false
  pendingDeleteProvId.value = null
  pendingDeleteProvName.value = ''
}
</script>

<template>
  <fieldset class="id-prov-card" aria-labelledby="title-prov">
    <div class="head">
      <h4 id="title-prov">Proveedores</h4>
      <span class="hint">Hasta 3 · marcá uno como principal</span>
    </div>

    <div ref="provTableRef" class="lines-spreadsheet" @focusout="onProvTableFocusout">
      <table>
        <colgroup>
          <col />
          <col style="width: 150px;" />
          <col style="width: 70px;" />
          <col style="width: 36px;" />
        </colgroup>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th class="num">Precio referencia</th>
            <th class="center">Principal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(p, idx) in proveedores"
            :key="idx"
            :class="['ln-row', activeRowIdx === idx && 'active']"
            @mousedown="activeRowIdx = idx"
          >
            <td>
              <div class="prov-cell-wrapper" style="position: relative; display: flex; align-items: center; width: 100%; height: 100%;">
                <input
                  class="cell-input"
                  style="padding-right: 28px;"
                  v-model="p.nombreTemp"
                  @focus="activeRowIdx = idx"
                  @keydown.prevent.enter="onCellEnter(idx)"
                  @change="onProveedorChange(idx)"
                  @blur="onProveedorBlur(idx)"
                  placeholder="Escribí o seleccioná"
                  list="prov-datalist"
                  :aria-label="'Proveedor ' + (idx + 1)"
                />
                <button
                  v-if="p.proveedorId > 0"
                  type="button"
                  class="prov-global-del-btn"
                  @click="triggerDeleteGlobalProv(p.proveedorId, p.nombreTemp || '')"
                  title="Eliminar este proveedor permanentemente del catálogo"
                  style="position: absolute; right: 6px; background: transparent; border: none; padding: 4px; cursor: pointer; color: var(--color-ink-muted); display: flex; align-items: center; justify-content: center; transition: color 120ms ease;"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
            </td>
            <td>
              <input
                class="cell-input num-input"
                type="number"
                min="0"
                step="0.01"
                v-model.number="p.precio"
                @focus="activeRowIdx = idx"
                @keydown.prevent.enter="onCellEnter(idx)"
                :aria-label="'Precio de referencia ' + (idx + 1)"
              />
            </td>
            <td class="center">
              <button
                type="button"
                class="w-[18px] h-[18px] p-0 rounded-full bg-surface cursor-pointer inline-grid place-items-center border-[1.5px] transition-colors hover:border-violet-700"
                :class="p.esPrincipal ? 'border-violet-700' : 'border-border-strong'"
                @click="setPrincipal(idx)"
                :title="p.esPrincipal ? 'Proveedor principal' : 'Marcar como principal'"
                role="radio"
                :aria-checked="p.esPrincipal"
              >
                <span v-if="p.esPrincipal" class="w-[9px] h-[9px] rounded-full bg-violet-700" />
              </button>
            </td>
            <td>
              <button
                class="del-btn"
                @click="removeProveedor(idx)"
                :disabled="proveedores.length <= 1"
                title="Eliminar proveedor"
              >
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <datalist id="prov-datalist">
        <option v-for="pr in proveedoresList" :key="pr.id" :value="pr.nombre" />
      </datalist>

      <button
        type="button"
        class="add-line-btn"
        @click="addProveedor"
        :disabled="proveedores.length >= 3"
      >
        <Plus :size="14" /> Agregar proveedor
      </button>
    </div>

    <div v-if="errors.proveedores" class="field-error" role="alert" style="margin-bottom: 6px;">
      {{ errors.proveedores }}
    </div>
  </fieldset>

  <!-- Diálogo para eliminar del catálogo global -->
  <ConfirmDialog
    :open="showConfirmDeleteGlobal"
    title="Eliminar proveedor del catálogo"
    :message="`Vas a eliminar permanentemente al proveedor '${pendingDeleteProvName}' del catálogo. Se removerá de este y otros insumos donde esté cargado. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar del catálogo"
    variant="danger"
    @confirm="handleDeleteGlobalProvConfirm"
    @cancel="showConfirmDeleteGlobal = false; pendingDeleteProvId = null; pendingDeleteProvName = ''"
  />
</template>
