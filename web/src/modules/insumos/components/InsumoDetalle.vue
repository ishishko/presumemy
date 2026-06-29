<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, Check, Trash2, Plus, Lock } from '@lucide/vue'
import { get, post, put, del } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import ToggleSwitch from '@/shared/ui/ToggleSwitch.vue'
import type { Insumo, CategoriaInsumo, Proveedor } from '@/types'

const props = defineProps<{
  open: boolean
  insumo?: Insumo | null
}>()

const emit = defineEmits<{
  close: []
  saved: [insumo: Insumo]
  deleted: []
  'update:header': [{ mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }]
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

const nivel = computed(() => {
  const s = parseFloat(String(stockActual.value)) || 0
  const m = parseFloat(String(stockMinimo.value)) || 0
  if (s === 0) return 'sin_unidades'
  if (m > 0) {
    if (s <= m * 0.2) return 'critico'
    if (s < m) return 'bajo'
  }
  return 'ok'
})

const nivelMeta: Record<string, { label: string; color: string; bg: string }> = {
  sin_unidades: { label: 'Sin unidades', color: 'var(--coral-700)', bg: 'var(--coral-50)' },
  critico: { label: 'Crítico', color: 'var(--orange-ink)', bg: 'var(--orange-50)' },
  bajo: { label: 'Bajo', color: 'var(--yellow-ink)', bg: 'var(--yellow)' },
  ok: { label: 'OK', color: 'var(--green-700)', bg: 'var(--green-50)' },
}

const fillPct = computed(() => {
  const s = parseFloat(String(stockActual.value)) || 0
  const m = parseFloat(String(stockMinimo.value)) || 0
  if (m <= 0) return s > 0 ? 100 : 0
  return Math.max(2, Math.min(100, (s / m) * 100))
})

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

function money(n: number): string {
  return `$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
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
    proveedores.value.push({ proveedorId: 0, precio: 0, esPrincipal: true, nombreTemp: '' })
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

  // Buscar coincidencia exacta (case-insensitive)
  const pr = proveedoresList.value.find(p => p.nombre.toLowerCase() === nombreTrim.toLowerCase())
  if (pr) {
    row.proveedorId = pr.id
    row.nombreTemp = pr.nombre // Normalizar mayúsculas/minúsculas
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

  // Buscar coincidencia exacta (case-insensitive)
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
  activeRowIdx.value = null // Quitar highlight de la fila activa en la tabla
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur() // Desenfocar el input activo para evitar escritura fantasma detrás del modal
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

    // Agregar a la lista de proveedores global
    proveedoresList.value.push(nuevoProv)
    proveedoresList.value.sort((a, b) => a.nombre.localeCompare(b.nombre))

    // Asignar a la fila
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

    // Remover de la lista autocompletable
    proveedoresList.value = proveedoresList.value.filter(p => p.id !== idToDelete)

    // Limpiar de las filas locales
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

  // No hay fila debajo (es la última fila actual)
  const current = proveedores.value[idx]
  const isCurrentEmpty = !current.nombreTemp?.trim() && !current.precio
  if (isCurrentEmpty) {
    // Foco fuera de la tabla (las notas)
    document.getElementById('ins-notes')?.focus()
  } else {
    // Si no está vacía y hay menos de 3, agregamos una nueva
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

    // Foco está fuera de la tabla de proveedores, hacemos la limpieza
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

  // Validar proveedores
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

import { editorDirty } from '@/shared/lib/editorMode'

function openOverlay() {
  emit('update:header', {
    mode: 'editor',
    title: isEdit.value ? (props.insumo?.codigo || '') : 'Nuevo',
    onSave: handleSave,
    onClose: handleClose,
  })
}

function closeOverlay() {
  emit('update:header', { mode: 'normal' })
  emit('close')
}

function handleClose() {
  closeOverlay()
}

function handleBack() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    handleClose()
  }
}

// Trap de foco para teclado (A11y)
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

watch(dirty, (val) => {
  editorDirty.value = val
})

watch(
  [() => props.open, () => props.insumo],
  async ([open]) => {
    if (open) {
      loadInsumo()
      openOverlay()
      editorDirty.value = dirty.value
      await nextTick()
      document.getElementById('ins-nombre')?.focus()
    } else {
      closeOverlay()
      editorDirty.value = false
    }
  }
)

watch(() => props.open, async (open) => {
  if (open) {
    document.body.classList.add('no-scroll')
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
  } else {
    document.body.classList.remove('no-scroll')
  }
}, { immediate: true })

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  if (props.open) {
    document.body.classList.add('no-scroll')
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
    openOverlay()
    editorDirty.value = dirty.value
    await nextTick()
    document.getElementById('ins-nombre')?.focus()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('no-scroll')
})

defineExpose({ loadInsumo })
</script>

<template>
  <Transition name="overlay">
    <div v-if="open" ref="overlayRef" class="id-overlay">
      <div class="id-body">
        <div class="id-body-grid">
          <!-- COLUMNA IZQUIERDA: Identidad, Costeo, y Control de Stock -->
          <fieldset class="id-card" aria-label="Datos del insumo" style="gap: 26px;">
            
            <!-- SECCIÓN 1: Nombre -->
            <section class="form-section">
              <div class="form-section-body">
                <!-- Fila 1: Nombre y Código -->
                <div class="id-name-container" style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                  <div class="id-name-row" style="display: flex; gap: 12px; align-items: flex-end;">
                    <div class="id-field" style="flex: 1;">
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
                    <div v-if="isEdit" style="padding-bottom: 8px;">
                      <span class="id-code-badge" title="Código autogenerado">
                        <Lock :size="10" /> {{ insumo!.codigo }}
                      </span>
                    </div>
                  </div>
                  <div v-if="errors.nombre" id="err-nombre" class="field-error" role="alert">
                    {{ errors.nombre }}
                  </div>
                </div>
              </div>
            </section>

            <!-- SECCIÓN 1b: Categorización -->
            <section class="form-section">
              <div class="form-section-body">
                <!-- Fila 2: Categoría e Insumo Activo -->
                <div class="form-row" style="align-items: center;">
                  <div class="field">
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
                    <div v-if="errors.categoriaId" id="err-categoriaId" class="field-error" role="alert">
                      {{ errors.categoriaId }}
                    </div>
                  </div>
                  
                  <div class="id-toggle-row-inline">
                    <div class="lbl">
                      <span class="t">Insumo activo</span>
                      <span class="h">Visible en autocompletados y reportes</span>
                    </div>
                    <ToggleSwitch v-model="activo" aria-label="Insumo activo" />
                  </div>
                </div>
              </div>
            </section>
            <hr class="id-section-divider">
            <!-- SECCIÓN 2: Costeo -->
            <section class="form-section">
              <div class="form-section-body">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span class="id-cost-label" style="font-size: 11px; font-weight: 500; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.06em;">Modalidad de costo</span>
                  <div class="checkbox-wrapper-10">
                    <input type="checkbox" id="cb-cost-type" class="tgl tgl-flip" v-model="esSimple">
                    <label for="cb-cost-type" data-tg-on="Simple" data-tg-off="Pack" class="tgl-btn"></label>
                  </div>
                </div>

                <!-- Grid de campos de costo -->
                <div :class="esSimple ? 'form-row' : 'id-grid-3'">
                  <div class="field">
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
                    <div v-if="errors.costoPaquete" id="err-costo-paquete" class="field-error" role="alert">
                      {{ errors.costoPaquete }}
                    </div>
                  </div>

                  <!-- Unidades por pack -->
                  <div v-if="!esSimple" class="field">
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
                    <div v-if="errors.cantidadPack" id="err-cantidad-pack" class="field-error" role="alert">
                      {{ errors.cantidadPack }}
                    </div>
                  </div>

                  <div class="field">
                    <FloatingField
                      id="ins-unidad"
                      label="Unidad de medida"
                      required
                      v-model="unidad"
                      placeholder="Ej. pliego, m, rollo"
                      :invalid="!!errors.unidad"
                      :describedby="errors.unidad ? 'err-unidad' : undefined"
                    />
                    <div v-if="errors.unidad" id="err-unidad" class="field-error" role="alert">
                      {{ errors.unidad }}
                    </div>
                  </div>
                </div>

                <!-- Costo unitario readonly destacado -->
                <div v-if="!esSimple" class="id-cost-row grand">
                  <span class="id-cost-label">Costo unitario calculado</span>
                  <span class="id-cost-value text-mono">
                    {{ money(costoUnitario) }} <span class="unit-ref">/ {{ unidad || 'u' }}</span>
                  </span>
                </div>
              </div>
            </section>
            <hr class="id-section-divider">
            <!-- SECCIÓN 3: Control de stock -->
            <section class="form-section">
              <div class="form-section-head" style="margin-bottom: 4px;">
                <h4 id="title-stock" style="font-size: 11px; color: var(--ink-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; margin: 0;">Control de stock</h4>
              </div>
              <div class="form-section-body">
                <div class="id-grid-stock" style="align-items: flex-end;">
                  <div class="field">
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
                    <div v-if="errors.stockActual" id="err-stock-actual" class="field-error" role="alert">
                      {{ errors.stockActual }}
                    </div>
                  </div>

                  <div class="field">
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
                    <div v-if="errors.stockMinimo" id="err-stock-minimo" class="field-error" role="alert">
                      {{ errors.stockMinimo }}
                    </div>
                  </div>

                  <!-- Bloque de nivel inline -->
                  <div class="id-level-block-inline">
                    <div class="row" style="display: flex; justify-content: space-between; align-items: center;">
                      <div class="id-level-stats-inline" style="text-align: left;">
                        <span>{{ stockMinimo > 0 ? Math.round((stockActual / stockMinimo) * 100) + '%' : 'sin mín.' }}</span>
                      </div>
                      <span
                        class="id-level-badge"
                        :style="{ background: nivelMeta[nivel].bg, color: nivelMeta[nivel].color }"
                      >
                        <span class="dot" /> {{ nivelMeta[nivel].label }}
                      </span>
                    </div>
                    <div class="id-level-bar" :class="{ 'sin_unidades': nivel === 'sin_unidades' }" style="margin-top: 4px;">
                      <div
                        class="fill"
                        :style="{ width: fillPct + '%', background: nivelMeta[nivel].color }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </fieldset>

          <!-- COLUMNA DERECHA: Proveedores y Notas -->
          <div class="id-col-right-stack">
            <!-- SECCIÓN PROVEEDORES -->
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
                            class="prov-global-del-btn"
                            @click="triggerDeleteGlobalProv(p.proveedorId, p.nombreTemp || '')"
                            title="Eliminar este proveedor permanentemente del catálogo"
                            style="position: absolute; right: 6px; background: transparent; border: none; padding: 4px; cursor: pointer; color: var(--ink-muted); display: flex; align-items: center; justify-content: center; transition: color 120ms ease;"
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
                          @keydown.enter.prevent="onCellEnter(idx)"
                          :aria-label="'Precio de referencia ' + (idx + 1)"
                        />
                      </td>
                      <td class="center">
                        <button
                          type="button"
                          :class="['id-radio', { checked: p.esPrincipal }]"
                          @click="setPrincipal(idx)"
                          :title="p.esPrincipal ? 'Proveedor principal' : 'Marcar como principal'"
                          role="radio"
                          :aria-checked="p.esPrincipal"
                        />
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

            <!-- SECCIÓN NOTAS -->
            <div class="id-notes-wrapper" style="display: flex; flex-direction: column; gap: 4px;">
              <FloatingField
                id="ins-notes"
                label="Notas"
                multiline
                v-model="notas"
                placeholder="Anotá variaciones de proveedor, tiempos de entrega, observaciones de calidad"
                rows="3"
                aria-describedby="notes-hint"
              />
              <span id="notes-hint" class="hint" style="font-size: 11px; color: var(--ink-muted); padding-left: 4px;">
                Información interna · solo visible para tu equipo
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="id-foot">
        <button class="id-back-btn" @click="handleBack">
          <ArrowLeft :size="16" /> Volver a insumos
        </button>
        <div class="spacer" />
        <button
          v-if="isEdit"
          class="btn btn-danger"
          @click="showConfirmDelete = true"
        >
          <Trash2 :size="16" /> Eliminar
        </button>
        <button
          class="btn btn-primary"
          @click="handleSave"
          :disabled="!dirty"
          :style="{ opacity: dirty ? 1 : 0.5, pointerEvents: dirty ? 'auto' : 'none' }"
        >
          <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear insumo' }}
        </button>
      </div>

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
    </div>
  </Transition>
</template>

<style scoped>
.id-section-divider{
  margin: 0px ;
}

.id-overlay {
  position: fixed;
  top: 56px;
  right: 0;
  bottom: 0;
  left: 240px;
  z-index: 30;
  background: var(--page-bg);
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
}

.id-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.id-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.id-title h2 {
  font-size: 22px;
  line-height: 1.1;
  margin: 0;
}

.dirty-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 12px;
  background: var(--yellow);
  color: var(--yellow-ink);
  border-radius: 999px;
}

.dirty-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--yellow-ink);
}

.id-body {
  overflow-y: auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.id-body-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
  align-items: start;
}

.id-col-right-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.id-card {
  /* background: var(--surface); */
  /* border: 1px solid var(--border); */
  border-radius: var(--r-lg);
  padding: 20px;
  /* box-shadow: var(--shadow-1); */
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0; /* Resetea márgenes de fieldsets */
}

.id-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.id-card-head h4 {
  font-size: 11px;
  color: var(--ink-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.id-code-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 3px 10px;
  background: var(--violet-100);
  color: var(--violet-700);
  border-radius: 999px;
}

.id-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.id-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.id-num-with-unit {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 100%;
}

.id-num-with-unit .ff-group { flex: 1; min-width: 0; }

.id-unit-pill {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: var(--ink-muted);
  background: var(--page-bg);
  border: 1.5px solid var(--border-strong);
  border-radius: var(--r-md);
  min-width: 64px;
  height: 43px; /* Mismo alto del input de FloatingField */
  box-sizing: border-box;
  justify-content: center;
  white-space: nowrap;
}

.id-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 12px;
  border-top: 1px solid var(--border);
}

.id-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
.id-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
.id-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }

.id-level-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.id-level-block .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.id-level-block .lbl {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  font-weight: 500;
}

.id-level-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 999px;
}

.id-level-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.id-level-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.id-level-bar > .fill {
  height: 100%;
  border-radius: 999px;
  transition: width 220ms cubic-bezier(0.2, 0.8, 0.2, 1), background 160ms ease;
}

.id-level-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: var(--ink-muted);
}

.id-level-stats .strong { color: var(--ink); font-weight: 500; font-variant-numeric: tabular-nums; }

.form-section-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.id-cost-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.id-cost-label {
  font-size: 11px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.id-cost-value {
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: 500;
  color: var(--violet-700);
  font-variant-numeric: tabular-nums;
}

.id-cost-value .unit-ref {
  color: var(--ink-muted);
  font-weight: 400;
  font-size: 13px;
}

.id-prov-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
}

.id-prov-card .head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.id-prov-card .head h4 { font-size: 16px; color: var(--ink); font-weight: 500; margin: 0; }
.id-prov-card .head .hint { font-size: 12px; color: var(--ink-muted); }



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




.id-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.id-back-btn {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--violet-700);
  transition: background 120ms ease;
}

.id-back-btn:hover { background: var(--violet-50); }

.field-error {
  font-size: 11px;
  color: var(--coral-700);
  margin-top: 4px;
  padding-left: 4px;
}

/* Nombre unificado estéticamente pero con fuente grande */
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

/* Transitions */
.overlay-enter-active {
  animation: overlay-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.overlay-leave-active {
  animation: overlay-out 200ms cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes overlay-in {
  from { transform: translateY(6px); opacity: 0.6; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes overlay-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(4px); opacity: 0.6; }
}

.id-switch:focus-visible {
  outline: 2px solid var(--violet-700);
  outline-offset: 2px;
}

.id-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.id-grid-stock {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 16px;
}

.id-level-block-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: flex-end;
  box-sizing: border-box;
  padding-bottom: 2px;
}

.id-level-stats-inline {
  font-size: 10px;
  color: var(--ink-muted);
  text-align: right;
}

.prov-global-del-btn:hover {
  color: var(--coral-500) !important;
}
</style>
