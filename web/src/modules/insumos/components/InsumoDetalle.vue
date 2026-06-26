<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, Check, Trash2, Plus, Lock } from '@lucide/vue'
import { get, post, put, del } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import ToggleSwitch from '@/shared/ui/ToggleSwitch.vue'
import OverlayShell from '@/shared/ui/OverlayShell.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { formatMoney } from '@/shared/lib/format'
import { getNivel, getFillPct } from '../stock'
import type { Insumo, CategoriaInsumo, Proveedor } from '@/types'

const props = defineProps<{
  open: boolean
  insumo?: Insumo | null
}>()

const emit = defineEmits<{
  close: []
  saved: [insumo: Insumo]
  deleted: []
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.insumo)

const categorias = ref<CategoriaInsumo[]>([])
const proveedoresList = ref<Proveedor[]>([])

const nombre = ref('')
const categoriaId = ref(0)
const unidad = ref('')
const stockActual = ref(0)
const stockMinimo = ref(0)
const activo = ref(true)
const costoPaquete = ref(0)
const cantidadPack = ref(1)
const esSimple = ref(false)
const notas = ref('')

const proveedores = ref<Array<{ proveedorId: number; precio: number; esPrincipal: boolean; nombreTemp?: string }>>([])

const showConfirmDelete = ref(false)
const showConfirmExit = ref(false)
const errors = ref<Record<string, string>>({})

const overlayRef = ref<HTMLElement | null>(null)
const provTableRef = ref<HTMLElement | null>(null)
const activeRowIdx = ref<number | null>(null)
const isConfirmingProv = ref(false)
const showConfirmCreateProv = ref(false)
const pendingProvIdx = ref<number | null>(null)
const pendingProvName = ref('')

const showConfirmDeleteGlobalProv = ref(false)
const pendingDeleteProvId = ref<number | null>(null)
const pendingDeleteProvName = ref('')

const nivel = computed(() => getNivel(Number(stockActual.value), Number(stockMinimo.value)))

const fillPct = computed(() => getFillPct(Number(stockActual.value), Number(stockMinimo.value)))

const customNivelMeta: Record<string, { label: string; color: string; bg: string }> = {
  sin_unidades: { label: 'Sin unidades', color: 'var(--coral-700)', bg: 'var(--coral-50)' },
  critico: { label: 'Crítico', color: 'var(--orange-ink)', bg: 'var(--orange-50)' },
  bajo: { label: 'Bajo', color: 'var(--yellow-ink)', bg: 'var(--yellow)' },
  ok: { label: 'OK', color: 'var(--green-700)', bg: 'var(--green-50)' },
}

const costoUnitario = computed(() => {
  if (esSimple.value) {
    return parseFloat(String(costoPaquete.value)) || 0
  }
  const c = parseFloat(String(costoPaquete.value)) || 0
  const q = parseFloat(String(cantidadPack.value)) || 0
  return q > 0 ? c / q : 0
})

const dirty = computed(() => {
  if (!props.insumo) return true
  const i = props.insumo
  const matchesNombre = nombre.value === i.nombre
  const matchesCategoria = categoriaId.value === i.categoriaId
  const matchesUnidad = unidad.value === i.unidad
  const matchesStock = Number(stockActual.value) === Number(i.stock)
  const matchesStockMin = Number(stockMinimo.value) === Number(i.stockMinimo)
  const matchesActivo = activo.value === i.activo
  const matchesNotas = notas.value === (i.notas || '')
  
  let matchesCosteo = false
  if (esSimple.value) {
    matchesCosteo = Number(i.cantidadPack) === 1 && Number(costoPaquete.value) === Number(i.costoPaquete)
  } else {
    matchesCosteo = Number(costoPaquete.value) === Number(i.costoPaquete) && Number(cantidadPack.value) === Number(i.cantidadPack)
  }

  const matchesProvs = JSON.stringify(proveedores.value) === JSON.stringify((i.proveedores || []).map(p => ({
    proveedorId: p.proveedorId,
    precio: p.precio,
    esPrincipal: p.esPrincipal,
  })))

  return !(
    matchesNombre &&
    matchesCategoria &&
    matchesUnidad &&
    matchesStock &&
    matchesStockMin &&
    matchesActivo &&
    matchesNotas &&
    matchesCosteo &&
    matchesProvs
  )
})

function reset() {
  nombre.value = ''
  categoriaId.value = 0
  unidad.value = ''
  stockActual.value = 0
  stockMinimo.value = 0
  activo.value = true
  costoPaquete.value = 0
  cantidadPack.value = 1
  esSimple.value = false
  notas.value = ''
  proveedores.value = []
  errors.value = {}
}

function loadInsumo() {
  reset()
  if (props.insumo) {
    const i = props.insumo
    nombre.value = i.nombre
    categoriaId.value = i.categoriaId
    unidad.value = i.unidad
    stockActual.value = Number(i.stock)
    stockMinimo.value = Number(i.stockMinimo)
    activo.value = i.activo
    notas.value = i.notas || ''
    proveedores.value = (i.proveedores || []).map(p => ({
      proveedorId: p.proveedorId,
      precio: p.precio,
      esPrincipal: p.esPrincipal,
      nombreTemp: p.proveedor?.nombre || '',
    }))

    costoPaquete.value = Number(i.costoPaquete)
    cantidadPack.value = Number(i.cantidadPack)
    esSimple.value = Number(i.cantidadPack) === 1
  }
  if (proveedores.value.length === 0) {
    proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: true, placeholder: true } as any)
  }
}

watch(esSimple, (simpleVal) => {
  if (simpleVal) {
    cantidadPack.value = 1
  }
})

function focusProviderInput(idx: number, isPrice = false) {
  nextTick(() => {
    if (provTableRef.value) {
      const rows = provTableRef.value.querySelectorAll('tbody tr')
      const row = rows[idx]
      if (row) {
        const selector = isPrice ? '.num-input' : '.cell-input'
        const input = row.querySelector(selector) as HTMLInputElement | null
        input?.focus()
      }
    }
  })
}

function addProveedor() {
  if (proveedores.value.length >= 3) return
  proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: false, nombreTemp: '' })
  focusProviderInput(proveedores.value.length - 1, false)
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
  const nombreTrim = row.nombreTemp?.trim() || ''
  if (!nombreTrim) {
    row.proveedorId = 0
    return
  }

  const pr = proveedoresList.value.find(p => p.nombre.toLowerCase() === nombreTrim.toLowerCase())
  if (pr) {
    row.proveedorId = pr.id
    row.nombreTemp = pr.nombre
  } else {
    row.proveedorId = 0
  }
}

function onProveedorBlur(idx: number) {
  const row = proveedores.value[idx]
  const nombreTrim = row.nombreTemp?.trim() || ''
  if (!nombreTrim) {
    row.proveedorId = 0
    cleanupEmptyProveedores()
    return
  }

  const pr = proveedoresList.value.find(p => p.nombre.toLowerCase() === nombreTrim.toLowerCase())
  if (pr) {
    row.proveedorId = pr.id
    row.nombreTemp = pr.nombre
    cleanupEmptyProveedores()
    return
  }

  isConfirmingProv.value = true
  pendingProvIdx.value = idx
  pendingProvName.value = nombreTrim
  activeRowIdx.value = null
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  showConfirmCreateProv.value = true
}

async function handleCreateProvConfirm() {
  showConfirmCreateProv.value = false
  const idx = pendingProvIdx.value
  const nombreTrim = pendingProvName.value
  if (idx === null || !nombreTrim) {
    isConfirmingProv.value = false
    clearPendingProv()
    return
  }

  const row = proveedores.value[idx]
  try {
    const nuevoProv = await post<Proveedor>('/insumos/proveedores', { nombre: nombreTrim })

    proveedoresList.value.push(nuevoProv)
    proveedoresList.value.sort((a, b) => a.nombre.localeCompare(b.nombre))

    if (row) {
      row.proveedorId = nuevoProv.id
      row.nombreTemp = nuevoProv.nombre
    }
    toast('Proveedor creado con éxito', 'success')
    focusProviderInput(idx, true)
  } catch (e: any) {
    toast(e.message || 'Error al crear el proveedor', 'error')
    if (row) {
      row.nombreTemp = ''
      row.proveedorId = 0
    }
    focusProviderInput(idx, false)
  } finally {
    isConfirmingProv.value = false
    clearPendingProv()
    cleanupEmptyProveedores()
  }
}

function handleCreateProvCancel() {
  showConfirmCreateProv.value = false
  const idx = pendingProvIdx.value
  if (idx !== null) {
    const row = proveedores.value[idx]
    if (row) {
      row.nombreTemp = ''
      row.proveedorId = 0
    }
    focusProviderInput(idx, false)
  }
  isConfirmingProv.value = false
  clearPendingProv()
  cleanupEmptyProveedores()
}

function clearPendingProv() {
  pendingProvIdx.value = null
  pendingProvName.value = ''
}

function triggerDeleteGlobalProv(id: number, name: string) {
  pendingDeleteProvId.value = id
  pendingDeleteProvName.value = name
  activeRowIdx.value = null
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  isConfirmingProv.value = true
  showConfirmDeleteGlobalProv.value = true
}

async function handleDeleteGlobalProvConfirm() {
  showConfirmDeleteGlobalProv.value = false
  const idToDelete = pendingDeleteProvId.value
  if (idToDelete === null) {
    isConfirmingProv.value = false
    clearPendingDeleteProv()
    return
  }

  try {
    await del('/insumos/proveedores', idToDelete)

    proveedoresList.value = proveedoresList.value.filter(p => p.id !== idToDelete)

    proveedores.value.forEach(row => {
      if (row.proveedorId === idToDelete) {
        row.proveedorId = 0
        row.nombreTemp = ''
      }
    })

    toast('Proveedor eliminado del catálogo con éxito', 'success')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar el proveedor del catálogo', 'error')
  } finally {
    isConfirmingProv.value = false
    clearPendingDeleteProv()
    cleanupEmptyProveedores()
  }
}

function handleDeleteGlobalProvCancel() {
  showConfirmDeleteGlobalProv.value = false
  isConfirmingProv.value = false
  clearPendingDeleteProv()
  cleanupEmptyProveedores()
}

function clearPendingDeleteProv() {
  pendingDeleteProvId.value = null
  pendingDeleteProvName.value = ''
}

function onCellEnter(idx: number) {
  const nextRow = proveedores.value[idx + 1]
  if (nextRow) {
    focusProviderInput(idx + 1, false)
    return
  }

  const current = proveedores.value[idx]
  const isCurrentEmpty = !current.nombreTemp?.trim() && !current.precio
  if (isCurrentEmpty) {
    document.getElementById('ins-notes')?.focus()
  } else {
    if (proveedores.value.length < 3) {
      addProveedor()
    } else {
      document.getElementById('ins-notes')?.focus()
    }
  }
}

function cleanupEmptyProveedores() {
  nextTick(() => {
    const activeEl = document.activeElement
    if (provTableRef.value && activeEl && provTableRef.value.contains(activeEl)) {
      return
    }

    const kept = proveedores.value.filter(p => p.proveedorId > 0 || (p.nombreTemp && p.nombreTemp.trim() !== '') || p.precio > 0)
    proveedores.value = kept.length > 0 ? kept : [{ proveedorId: 0, precio: 0, esPrincipal: true, nombreTemp: '' }]

    if (!proveedores.value.some(p => p.esPrincipal)) {
      proveedores.value[0].esPrincipal = true
    }
  })
}

function onProvTableFocusout(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null
  if (provTableRef.value && next && provTableRef.value.contains(next)) return

  activeRowIdx.value = null

  if (isConfirmingProv.value) return

  const kept = proveedores.value.filter(p => p.proveedorId > 0 || (p.nombreTemp && p.nombreTemp.trim() !== '') || p.precio > 0)
  proveedores.value = kept.length > 0 ? kept : [{ proveedorId: 0, precio: 0, esPrincipal: true, nombreTemp: '' }]

  if (!proveedores.value.some(p => p.esPrincipal)) {
    proveedores.value[0].esPrincipal = true
  }
}

function validate(): boolean {
  errors.value = {}
  if (!nombre.value.trim()) {
    errors.value.nombre = 'El nombre es requerido'
  }
  if (categoriaId.value <= 0) {
    errors.value.categoriaId = 'La categoría es requerida'
  }
  if (!unidad.value.trim()) {
    errors.value.unidad = 'La unidad de medida es requerida'
  }
  if (costoPaquete.value < 0) {
    errors.value.costoPaquete = esSimple.value ? 'El costo unitario no puede ser negativo' : 'El costo de la presentación no puede ser negativo'
  }
  if (!esSimple.value && cantidadPack.value <= 0) {
    errors.value.cantidadPack = 'La cantidad por presentación debe ser mayor a 0'
  }
  if (stockActual.value < 0) {
    errors.value.stockActual = 'El stock actual no puede ser negativo'
  }
  if (stockMinimo.value < 0) {
    errors.value.stockMinimo = 'El stock mínimo no puede ser negativo'
  }

  const selectedProvs = proveedores.value.filter(p => p.proveedorId > 0)
  if (selectedProvs.length > 0) {
    const ids = selectedProvs.map(p => p.proveedorId)
    const hasDuplicates = ids.some((val, i) => ids.indexOf(val) !== i)
    if (hasDuplicates) {
      errors.value.proveedores = 'No podés seleccionar el mismo proveedor más de una vez'
    }
  }

  const valid = Object.keys(errors.value).length === 0
  if (!valid) {
    const firstErrKey = Object.keys(errors.value)[0]
    let targetId = ''
    if (firstErrKey === 'nombre') targetId = 'ins-nombre'
    else if (firstErrKey === 'categoriaId') targetId = 'ins-categoria'
    else if (firstErrKey === 'unidad') targetId = 'ins-unidad'
    else if (firstErrKey === 'costoPaquete') targetId = 'ins-costo-paquete'
    else if (firstErrKey === 'cantidadPack') targetId = 'ins-cantidad-pack'
    else if (firstErrKey === 'stockActual') targetId = 'ins-stock-actual'
    else if (firstErrKey === 'stockMinimo') targetId = 'ins-stock-minimo'

    if (targetId) {
      document.getElementById(targetId)?.focus()
    }
  }
  return valid
}

async function handleSave() {
  if (!validate()) return

  const payload: any = {
    nombre: nombre.value,
    categoriaId: categoriaId.value,
    unidad: unidad.value,
    stock: parseFloat(String(stockActual.value)) || 0,
    stockMinimo: parseFloat(String(stockMinimo.value)) || 0,
    costoPaquete: parseFloat(String(costoPaquete.value)) || 0,
    cantidadPack: esSimple.value ? 1 : (parseFloat(String(cantidadPack.value)) || 1),
    notas: notas.value || undefined,
    proveedores: proveedores.value
      .filter((p) => p.proveedorId > 0)
      .map((p) => ({
        proveedorId: p.proveedorId,
        precio: parseFloat(String(p.precio)) || 0,
        esPrincipal: p.esPrincipal,
      })),
  }

  try {
    let res: Insumo
    if (isEdit.value && props.insumo) {
      res = await put<Insumo>('/insumos', props.insumo.id, payload)
      toast('Insumo actualizado')
    } else {
      res = await post<Insumo>('/insumos', payload)
      toast('Insumo creado')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

async function handleDelete() {
  if (!props.insumo) return
  try {
    await del('/insumos', props.insumo.id)
    toast('Insumo eliminado', 'info')
    emit('deleted')
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
}

function handleClose() {
  emit('close')
}

function handleBack() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    handleClose()
  }
}

function handleTabKey(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key !== 'Tab') return

  const container = overlayRef.value
  if (!container) return

  const focusables = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (focusables.length === 0) return

  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (e.shiftKey) {
    if (document.activeElement === first) {
      last.focus()
      e.preventDefault()
    }
  } else {
    if (document.activeElement === last) {
      first.focus()
      e.preventDefault()
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') {
    handleBack()
  } else if (e.key === 'Tab') {
    handleTabKey(e)
  }
}

watch(
  [() => props.open, () => props.insumo],
  async ([open]) => {
    if (open) {
      loadInsumo()
      await nextTick()
      document.getElementById('ins-nombre')?.focus()
    }
  }
)

watch(() => props.open, async (open) => {
  if (open) {
    if (categorias.value.length === 0 || proveedoresList.value.length === 0) {
      try {
        const [catsRes, provsRes] = await Promise.all([
          get<{ data: CategoriaInsumo[] }>('/insumos/categorias'),
          get<{ data: Proveedor[] }>('/insumos/proveedores'),
        ])
        categorias.value = catsRes.data
        proveedoresList.value = provsRes.data
      } catch (e: any) {
        toast('Error al cargar datos', 'error')
      }
    }
  }
}, { immediate: true })

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  if (props.open) {
    if (categorias.value.length === 0 || proveedoresList.value.length === 0) {
      try {
        const [catsRes, provsRes] = await Promise.all([
          get<{ data: CategoriaInsumo[] }>('/insumos/categorias'),
          get<{ data: Proveedor[] }>('/insumos/proveedores'),
        ])
        categorias.value = catsRes.data
        proveedoresList.value = provsRes.data
      } catch (e: any) {
        toast('Error al cargar datos', 'error')
      }
    }
    loadInsumo()
    await nextTick()
    document.getElementById('ins-nombre')?.focus()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

defineExpose({ loadInsumo })
</script>

<template>
  <OverlayShell
    :open="open"
    :title="isEdit ? (insumo?.codigo || '') : 'Nuevo'"
    :dirty="dirty"
    @close="handleClose"
    @save="handleSave"
  >
    <template #body>
      <div ref="overlayRef" class="p-7 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          
          <!-- COLUMNA IZQUIERDA: Identidad, Costeo, y Control de Stock -->
          <fieldset class="flex flex-col gap-6 m-0 border-0 p-0 min-w-0" aria-label="Datos del insumo">
            
            <!-- SECCIÓN 1: Nombre -->
            <section class="flex flex-col gap-4">
              <div class="flex flex-col gap-1 w-full">
                <div class="flex gap-3 items-end">
                  <div class="flex-1 min-w-0">
                    <FloatingField
                      id="ins-nombre"
                      label="Nombre"
                      required
                      v-model="nombre"
                      placeholder="Nombre del insumo"
                      class="id-inline-name-ff"
                      :invalid="!!errors.nombre"
                      :describedby="errors.nombre ? 'err-nombre' : undefined"
                    />
                  </div>
                  <div v-if="isEdit" class="pb-2 flex-shrink-0">
                    <span class="inline-flex items-center gap-1.5 font-mono text-12 text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full" title="Código autogenerado">
                      <Lock :size="10" /> {{ insumo!.codigo }}
                    </span>
                  </div>
                </div>
                <div v-if="errors.nombre" id="err-nombre" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                  {{ errors.nombre }}
                </div>
              </div>
            </section>

            <!-- SECCIÓN 1b: Categorización -->
            <section class="flex flex-col gap-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div class="flex flex-col gap-1">
                  <FloatingSelect
                    id="ins-categoria"
                    label="Categoría"
                    required
                    v-model.number="categoriaId"
                    :invalid="!!errors.categoriaId"
                    :describedby="errors.categoriaId ? 'err-categoriaId' : undefined"
                  >
                    <option :value="0" disabled>Seleccionar</option>
                    <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </FloatingSelect>
                  <div v-if="errors.categoriaId" id="err-categoriaId" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                    {{ errors.categoriaId }}
                  </div>
                </div>
                
                <div class="flex items-center justify-between py-2.5 px-3 bg-surface border border-border rounded-lg">
                  <div class="flex flex-col gap-0.5 text-left">
                    <span class="text-13 font-medium text-ink">Insumo activo</span>
                    <span class="text-12 text-ink-muted">Visible en autocompletados y reportes</span>
                  </div>
                  <ToggleSwitch v-model="activo" aria-label="Insumo activo" />
                </div>
              </div>
            </section>

            <hr class="my-0 border-t border-border" />

            <!-- SECCIÓN 2: Costeo -->
            <section class="flex flex-col gap-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em]">Modalidad de costo</span>
                <div class="checkbox-wrapper-10">
                  <input type="checkbox" id="cb-cost-type" class="tgl tgl-flip" v-model="esSimple">
                  <label for="cb-cost-type" data-tg-on="Simple" data-tg-off="Pack" class="tgl-btn"></label>
                </div>
              </div>

              <div :class="esSimple ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'">
                <div class="flex flex-col gap-1">
                  <FloatingField
                    id="ins-costo-paquete"
                    :label="esSimple ? 'Costo unitario' : 'Costo pack'"
                    type="number"
                    prefix="$"
                    v-model.number="costoPaquete"
                    min="0"
                    step="0.01"
                    :invalid="!!errors.costoPaquete"
                    :describedby="errors.costoPaquete ? 'err-costo-paquete' : undefined"
                  />
                  <div v-if="errors.costoPaquete" id="err-costo-paquete" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                    {{ errors.costoPaquete }}
                  </div>
                </div>

                <div v-if="!esSimple" class="flex flex-col gap-1">
                  <FloatingField
                    id="ins-cantidad-pack"
                    label="Unidades por pack"
                    type="number"
                    v-model.number="cantidadPack"
                    min="0.01"
                    step="0.01"
                    :invalid="!!errors.cantidadPack"
                    :describedby="errors.cantidadPack ? 'err-cantidad-pack' : undefined"
                  />
                  <div v-if="errors.cantidadPack" id="err-cantidad-pack" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                    {{ errors.cantidadPack }}
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <FloatingField
                    id="ins-unidad"
                    label="Unidad de medida"
                    required
                    v-model="unidad"
                    placeholder="Ej. pliego, m, rollo"
                    :invalid="!!errors.unidad"
                    :describedby="errors.unidad ? 'err-unidad' : undefined"
                  />
                  <div v-if="errors.unidad" id="err-unidad" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                    {{ errors.unidad }}
                  </div>
                </div>
              </div>

              <!-- Costo unitario readonly destacado -->
              <div v-if="!esSimple" class="flex items-center justify-between text-13 bg-violet-50/50 border border-violet-100/50 rounded-lg p-3">
                <span class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em]">Costo unitario calculado</span>
                <span class="font-mono text-18 font-semibold text-violet-700">
                  {{ formatMoney(costoUnitario) }} <span class="text-ink-muted font-normal text-13">/ {{ unidad || 'u' }}</span>
                </span>
              </div>
            </section>

            <hr class="my-0 border-t border-border" />

            <!-- SECCIÓN 3: Control de stock -->
            <section class="flex flex-col gap-3">
              <h4 id="title-stock" class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em] m-0">Control de stock</h4>
              <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-4 items-end">
                <div class="flex flex-col gap-1">
                  <FloatingField
                    id="ins-stock-actual"
                    label="Stock actual"
                    type="number"
                    v-model.number="stockActual"
                    min="0"
                    step="1"
                    :invalid="!!errors.stockActual"
                    :describedby="errors.stockActual ? 'err-stock-actual' : undefined"
                  />
                  <div v-if="errors.stockActual" id="err-stock-actual" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                    {{ errors.stockActual }}
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <FloatingField
                    id="ins-stock-minimo"
                    label="Stock mínimo"
                    type="number"
                    v-model.number="stockMinimo"
                    min="0"
                    step="1"
                    :invalid="!!errors.stockMinimo"
                    :describedby="errors.stockMinimo ? 'err-stock-minimo' : undefined"
                  />
                  <div v-if="errors.stockMinimo" id="err-stock-minimo" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                    {{ errors.stockMinimo }}
                  </div>
                </div>

                <!-- Bloque de nivel inline -->
                <div class="flex flex-col gap-1.5 justify-end pb-1.5">
                  <div class="flex justify-between items-center gap-2">
                    <div class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em] text-left">
                      <span>{{ stockMinimo > 0 ? Math.round((stockActual / stockMinimo) * 100) + '%' : 'sin mín.' }}</span>
                    </div>
                    <span
                      class="inline-flex items-center gap-1.5 text-12 font-semibold px-2.5 py-1 rounded-full"
                      :style="{ background: customNivelMeta[nivel].bg, color: customNivelMeta[nivel].color }"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-current" /> {{ customNivelMeta[nivel].label }}
                    </span>
                  </div>
                  <div class="h-2 rounded-full bg-border overflow-hidden mt-1">
                    <div
                      class="h-full rounded-full transition-all duration-220 ease-out"
                      :style="{ width: fillPct + '%', background: customNivelMeta[nivel].color }"
                    />
                  </div>
                </div>
              </div>
            </section>

          </fieldset>

          <!-- COLUMNA DERECHA: Proveedores y Notas -->
          <div class="flex flex-col gap-6">
            <!-- SECCIÓN PROVEEDORES -->
            <fieldset class="bg-surface border border-border rounded-lg shadow-sm p-5 flex flex-col gap-3.5 m-0 min-w-0" aria-labelledby="title-prov">
              <div class="flex items-center justify-between gap-3">
                <h4 id="title-prov" class="text-16 font-semibold text-ink m-0">Proveedores</h4>
                <span class="text-12 text-ink-muted">Hasta 3 · marcá uno como principal</span>
              </div>

              <div ref="provTableRef" class="lines-spreadsheet overflow-x-auto" @focusout="onProvTableFocusout">
                <table class="w-full text-left border-collapse">
                  <colgroup>
                    <col />
                    <col style="width: 150px;" />
                    <col style="width: 70px;" />
                    <col style="width: 36px;" />
                  </colgroup>
                  <thead>
                    <tr class="border-b border-border text-11 font-semibold text-ink-muted uppercase tracking-[0.06em]">
                      <th class="pb-2">Proveedor</th>
                      <th class="pb-2 text-right">Precio referencia</th>
                      <th class="pb-2 text-center">Principal</th>
                      <th class="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(p, idx) in proveedores"
                      :key="idx"
                      :class="['border-b border-border last:border-0 hover:bg-page-bg/50', activeRowIdx === idx && 'bg-page-bg/80']"
                      @mousedown="activeRowIdx = idx"
                    >
                      <td class="py-2.5">
                        <div class="relative flex items-center w-full h-full">
                          <input
                            class="w-full bg-transparent text-13 text-ink focus:outline-none pr-7 py-1"
                            v-model="p.nombreTemp"
                            @focus="activeRowIdx = idx"
                            @keydown.enter.prevent="onCellEnter(idx)"
                            @change="onProveedorChange(idx)"
                            @blur="onProveedorBlur(idx)"
                            placeholder="Escribí o seleccioná"
                            list="prov-datalist"
                            :aria-label="'Proveedor ' + (idx + 1)"
                          />
                          <button
                            v-if="p.proveedorId > 0"
                            type="button"
                            class="absolute right-1 text-ink-muted hover:text-coral-500 transition-colors p-1"
                            @click="triggerDeleteGlobalProv(p.proveedorId, p.nombreTemp || '')"
                            title="Eliminar este proveedor permanentemente del catálogo"
                          >
                            <Trash2 :size="12" />
                          </button>
                        </div>
                      </td>
                      <td class="py-2.5">
                        <input
                          class="w-full bg-transparent text-13 text-ink text-right focus:outline-none py-1 font-mono num-input"
                          type="number"
                          min="0"
                          step="0.01"
                          v-model.number="p.precio"
                          @focus="activeRowIdx = idx"
                          @keydown.enter.prevent="onCellEnter(idx)"
                          :aria-label="'Precio de referencia ' + (idx + 1)"
                        />
                      </td>
                      <td class="py-2.5 text-center">
                        <button
                          type="button"
                          :class="['id-radio', { checked: p.esPrincipal }]"
                          @click="setPrincipal(idx)"
                          :title="p.esPrincipal ? 'Proveedor principal' : 'Marcar como principal'"
                          role="radio"
                          :aria-checked="p.esPrincipal"
                        />
                      </td>
                      <td class="py-2.5 text-right">
                        <button
                          class="text-ink-muted hover:text-coral-500 disabled:opacity-30 disabled:pointer-events-none p-1 transition-colors"
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
                  class="mt-3 inline-flex items-center gap-1.5 text-13 text-violet-700 hover:text-violet-800 font-medium cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  @click="addProveedor"
                  :disabled="proveedores.length >= 3"
                >
                  <Plus :size="14" /> Agregar proveedor
                </button>
              </div>

              <div v-if="errors.proveedores" class="text-11 text-coral-700 mt-1 pl-1" role="alert">
                {{ errors.proveedores }}
              </div>
            </fieldset>

            <!-- SECCIÓN NOTAS -->
            <div class="flex flex-col gap-1">
              <FloatingField
                id="ins-notes"
                label="Notas"
                multiline
                v-model="notas"
                placeholder="Anotá variaciones de proveedor, tiempos de entrega, observaciones de calidad"
                rows="3"
                aria-describedby="notes-hint"
              />
              <span id="notes-hint" class="text-11 text-ink-muted pl-1">
                Información interna · solo visible para tu equipo
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #foot>
      <div class="flex items-center w-full">
        <BaseButton
          variant="ghost"
          class="flex items-center gap-2 text-violet-700 hover:bg-violet-50"
          @click="handleBack"
        >
          <ArrowLeft :size="16" /> Volver a insumos
        </BaseButton>
        <div class="flex-1" />
        <div class="flex gap-2">
          <BaseButton
            v-if="isEdit"
            variant="danger"
            class="flex items-center gap-2"
            @click="showConfirmDelete = true"
          >
            <Trash2 :size="16" /> Eliminar
          </BaseButton>
          <BaseButton
            variant="primary"
            class="flex items-center gap-2"
            @click="handleSave"
            :disabled="!dirty"
          >
            <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear insumo' }}
          </BaseButton>
        </div>
      </div>
    </template>
  </OverlayShell>

  <ConfirmDialog
    :open="showConfirmExit"
    title="¿Salir sin guardar?"
    :message="`Tenés cambios pendientes en ${nombre}. Si salís ahora, vas a perderlos.`"
    confirm-label="Salir sin guardar"
    cancel-label="Seguir editando"
    variant="danger"
    @confirm="emit('close'); showConfirmExit = false"
    @cancel="showConfirmExit = false"
  />

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar insumo"
    :message="`Vas a eliminar ${insumo?.codigo} · ${nombre}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDelete"
    @cancel="showConfirmDelete = false"
  />

  <ConfirmDialog
    :open="showConfirmCreateProv"
    title="Crear nuevo proveedor"
    :message="`El proveedor '${pendingProvName}' no existe. ¿Querés crearlo?`"
    confirm-label="Crear proveedor"
    cancel-label="Cancelar"
    @confirm="handleCreateProvConfirm"
    @cancel="handleCreateProvCancel"
  />

  <ConfirmDialog
    :open="showConfirmDeleteGlobalProv"
    title="Eliminar proveedor de catálogo"
    :message="`Vas a eliminar permanentemente al proveedor '${pendingDeleteProvName}' del catálogo. Se removerá de este y otros insumos donde esté cargado. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    cancel-label="Cancelar"
    variant="danger"
    @confirm="handleDeleteGlobalProvConfirm"
    @cancel="handleDeleteGlobalProvCancel"
  />
</template>

<style scoped>
.id-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--surface);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  transition: border-color 120ms ease;
  padding: 0;
}

.id-radio:hover { border-color: var(--violet-700); }
.id-radio.checked { border-color: var(--violet-700); }

.id-radio.checked::after {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--violet-700);
}

.id-inline-name-ff {
  --ff-rest-y: 26px;
}
:deep(.id-inline-name-ff .ff-control) {
  font-size: 18px;
  font-weight: 500;
  padding: 18px 14px 10px 14px;
}
:deep(.id-inline-name-ff .ff-label) {
  top: 14px;
}
</style>
