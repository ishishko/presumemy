<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, Check, Trash2, X, Plus, Lock, Image, GripVertical } from '@lucide/vue'
import { editorDirty } from '@/composables/useEditorMode'
import { get, post, put, del } from '@/services/api'
import { useToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import FloatingField from '@/components/ui/FloatingField.vue'
import FloatingSelect from '@/components/ui/FloatingSelect.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import type { Producto, CategoriaProducto, Insumo, PaginationResult } from '@/types'

const props = defineProps<{
  open: boolean
  producto?: Producto | null
}>()

const emit = defineEmits<{
  close: []
  saved: [producto: Producto]
  deleted: []
  'update:header': [{ mode: 'editor'; title: string; onSave: () => void; onClose: () => void } | { mode: 'normal' }]
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.producto)

const categorias = ref<CategoriaProducto[]>([])
const insumosList = ref<Insumo[]>([])

const nombre = ref('')
const categoriaId = ref(0)
const medida = ref('')
const descripcion = ref('')
const activo = ref(true)
const tieneBom = ref(true)
const precioManual = ref(false)
const tipoGanancia = ref<'porcentaje' | 'fijo'>('porcentaje')
const ganancia = ref(0)
const precio = ref(0)
const imagenes = ref<string[]>(['', '', ''])
const activeRowIdx = ref<number | null>(null)
const recetaTableRef = ref<HTMLElement | null>(null)
const overlayEl = ref<HTMLElement | null>(null)

const bomLineas = ref<Array<{
  tipoLinea: 'insumo' | 'cameo' | 'embalaje' | 'extra'
  insumoId?: number
  descripcion: string
  cantidad: number
  costoUnitario: number
}>>([])

const showConfirmDelete = ref(false)
const showConfirmExit = ref(false)

const bomTotal = computed(() =>
  bomLineas.value.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0)
)

const costoProducto = computed(() => bomTotal.value)

const precioCalculado = computed(() => {
  const v = parseFloat(String(ganancia.value)) || 0
  if (tipoGanancia.value === 'porcentaje') return costoProducto.value * (1 + v / 100)
  return costoProducto.value + v
})

const dirty = computed(() => {
  if (!props.producto) return true
  const p = props.producto
  const pImgs = p.imagenes || []
  const localImgs = imagenes.value
  const imgsChanged = localImgs[0] !== (pImgs[0] || '') ||
                      localImgs[1] !== (pImgs[1] || '') ||
                      localImgs[2] !== (pImgs[2] || '')
  return (
    nombre.value !== p.nombre ||
    categoriaId.value !== p.categoriaId ||
    medida.value !== (p.descripcion || '') ||
    descripcion.value !== (p.descripcion || '') ||
    activo.value !== p.activo ||
    precioManual.value !== p.precioManual ||
    tipoGanancia.value !== p.tipoGanancia ||
    Number(ganancia.value) !== Number(p.ganancia) ||
    Number(precio.value) !== Number(p.precio) ||
    imgsChanged
  )
})

function getInsumoUnit(insumoId?: number): string {
  if (!insumoId) return ''
  const ins = insumosList.value.find(i => i.id === insumoId)
  return ins?.unidad || ''
}

watch([precioCalculado, precioManual], ([newCalc, manual]) => {
  if (!manual) {
    precio.value = Number(Number(newCalc).toFixed(2))
  }
})

function money(n: number): string {
  return `$ ${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function reset() {
  nombre.value = ''
  categoriaId.value = 0
  medida.value = ''
  descripcion.value = ''
  activo.value = true
  tieneBom.value = true
  precioManual.value = false
  tipoGanancia.value = 'porcentaje'
  ganancia.value = 0
  precio.value = 0
  imagenes.value = ['', '', '']
  bomLineas.value = []
}

function syncBomLineasCosts() {
  if (insumosList.value.length === 0) return
  bomLineas.value.forEach(l => {
    if (l.tipoLinea === 'insumo' && l.insumoId) {
      const ins = insumosList.value.find(i => i.id === l.insumoId)
      if (ins) {
        l.costoUnitario = ins.costoUnitario
      }
    }
  })
}

watch(insumosList, () => {
  syncBomLineasCosts()
})

function loadProducto() {
  reset()
  if (props.producto) {
    const p = props.producto
    nombre.value = p.nombre
    categoriaId.value = p.categoriaId
    medida.value = ''
    descripcion.value = p.descripcion || ''
    activo.value = p.activo
    tieneBom.value = true
    precioManual.value = p.precioManual
    tipoGanancia.value = p.tipoGanancia
    ganancia.value = p.ganancia
    precio.value = p.precio
    const pImgs = p.imagenes || []
    imagenes.value = [pImgs[0] || '', pImgs[1] || '', pImgs[2] || '']
    cleanAndShiftImages()
    bomLineas.value = (p.bomLineas || []).map(b => ({
      tipoLinea: b.tipoLinea,
      insumoId: b.insumoId,
      descripcion: b.descripcion || '',
      cantidad: b.cantidad,
      costoUnitario: b.costoUnitario,
    }))
    syncBomLineasCosts()
  }
  if (tieneBom.value && bomLineas.value.length === 0) {
    addBomLinea()
  }
}


function addBomLinea() {
  bomLineas.value.push({
    tipoLinea: 'insumo',
    descripcion: '',
    cantidad: 0,
    costoUnitario: 0,
  })
}

function removeBomLinea(idx: number) {
  bomLineas.value.splice(idx, 1)
  if (bomLineas.value.length === 0) addBomLinea()
}

function onInsumoChange(idx: number, insumoId: number) {
  const ins = insumosList.value.find(i => i.id === insumoId)
  if (ins) {
    bomLineas.value[idx].insumoId = ins.id
    bomLineas.value[idx].descripcion = ins.nombre
    bomLineas.value[idx].costoUnitario = ins.costoUnitario
  }
}

async function handleSave() {
  if (!nombre.value.trim()) {
    toast('El nombre es requerido', 'error')
    return
  }
  if (!categoriaId.value || categoriaId.value <= 0) {
    toast('Debes seleccionar una categoría', 'error')
    return
  }

  const cleanedImagenes = imagenes.value.filter(img => img.trim() !== '')

  const payload: any = {
    nombre: nombre.value,
    categoriaId: categoriaId.value,
    descripcion: descripcion.value || undefined,
    imagenes: cleanedImagenes,
    tieneBom: true,
    precioManual: precioManual.value,
    tipoGanancia: tipoGanancia.value,
    ganancia: parseFloat(String(ganancia.value)) || 0,
    precio: parseFloat(String(precio.value)) || 0,
  }

  if (tieneBom.value) {
    payload.bomLineas = bomLineas.value
      .filter(l => l.descripcion && l.cantidad > 0)
      .map(l => ({
        tipoLinea: l.tipoLinea,
        insumoId: l.insumoId || undefined,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        costoUnitario: l.costoUnitario,
      }))
  }

  try {
    let res: Producto
    if (isEdit.value && props.producto) {
      res = await put<Producto>('/productos', props.producto.id, payload)
      toast('Producto actualizado')
    } else {
      res = await post<Producto>('/productos', payload)
      toast('Producto creado')
    }
    emit('saved', res)
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al guardar', 'error')
  }
}

async function handleDelete() {
  if (!props.producto) return
  try {
    await del('/productos', props.producto.id)
    toast('Producto eliminado', 'info')
    emit('deleted')
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
}

function handleBack() {
  if (dirty.value) {
    showConfirmExit.value = true
  } else {
    handleClose()
  }
}

function openOverlay() {
  emit('update:header', {
    mode: 'editor',
    title: isEdit.value ? (props.producto?.codigo || '') : 'Nuevo',
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

watch(dirty, (val) => {
  editorDirty.value = val
})

watch(() => props.open, async (open) => {
  if (open) {
    document.body.classList.add('no-scroll')
    loadProducto()
    openOverlay()
    editorDirty.value = dirty.value
    await nextTick()
    const nameInput = document.getElementById('pd-nombre-input') as HTMLInputElement | null
    nameInput?.focus()
    nameInput?.select()
  } else {
    document.body.classList.remove('no-scroll')
    closeOverlay()
    editorDirty.value = false
  }
}, { immediate: true })

watch(() => props.open, async (open) => {
  if (open && categorias.value.length === 0) {
    try {
      const [catsRes, insumosRes] = await Promise.all([
        get<{ data: CategoriaProducto[] }>('/productos/categorias'),
        get<PaginationResult<Insumo>>('/insumos', { page: 1, limit: 100 }),
      ])
      categorias.value = catsRes.data
      insumosList.value = insumosRes.data
    } catch (e: any) {
      toast('Error al cargar datos', 'error')
    }
  }
})

onUnmounted(() => {
  document.body.classList.remove('no-scroll')
})

function getImageUrl(path: string) {
  if (!path) return ''
  const token = localStorage.getItem('sb-token')
  return `${import.meta.env.VITE_API_URL || ''}/api${path}?token=${token}`
}

const draggedIndex = ref<number | null>(null)

function handleDragStart(index: number) {
  draggedIndex.value = index
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function cleanAndShiftImages() {
  const activeImgs = imagenes.value.filter(img => img && img.trim() !== '')
  while (activeImgs.length < 3) {
    activeImgs.push('')
  }
  imagenes.value = activeImgs
}

function handleDrop(index: number) {
  if (draggedIndex.value === null || draggedIndex.value === index) return
  
  const temp = imagenes.value[draggedIndex.value]
  imagenes.value[draggedIndex.value] = imagenes.value[index]
  imagenes.value[index] = temp
  
  draggedIndex.value = null
  cleanAndShiftImages()
}

function triggerFileInput(index: number) {
  const el = document.getElementById(`file-input-${index}`) as HTMLInputElement
  el?.click()
}

async function handleFileChange(event: Event, index: number) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return
  
  const file = files[0]
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const token = localStorage.getItem('sb-token')
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
    
    if (!res.ok) {
      throw new Error('Error al subir el archivo')
    }
    
    const data = await res.json()
    imagenes.value[index] = data.url
    cleanAndShiftImages()
    toast('Imagen subida correctamente')
  } catch (err: any) {
    toast(err.message || 'Error al subir imagen', 'error')
  } finally {
    target.value = ''
  }
}

function removeImage(index: number) {
  imagenes.value[index] = ''
  cleanAndShiftImages()
}

function focusCategory() {
  document.getElementById('pd-categoria')?.focus()
}

function getFocusable(): HTMLElement[] {
  if (!overlayEl.value) return []
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(overlayEl.value.querySelectorAll<HTMLElement>(sel))
    .filter(el => el.offsetParent !== null)
}

function focusAfterTable() {
  const table = recetaTableRef.value
  if (!table) return
  const focusables = getFocusable()
  const active = document.activeElement as HTMLElement
  const fromIdx = focusables.indexOf(active)
  const next = focusables.find((el, i) => i > fromIdx && !table.contains(el))
  next?.focus()
}

const dragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)

function onBomDragStart(idx: number) {
  dragId.value = idx
}

function onBomDragOver(event: DragEvent, idx: number) {
  event.preventDefault()
  dragOverId.value = idx
}

function onBomDrop(idx: number) {
  if (dragId.value === null || dragId.value === idx) {
    dragId.value = null
    dragOverId.value = null
    return
  }
  
  const from = dragId.value
  const to = idx
  const lines = [...bomLineas.value]
  const [moved] = lines.splice(from, 1)
  lines.splice(to, 0, moved)
  bomLineas.value = lines
  
  dragId.value = null
  dragOverId.value = null
}

function onBomDragEnd() {
  dragId.value = null
  dragOverId.value = null
}

function cleanupEmptyRecetaLineas() {
  nextTick(() => {
    const activeEl = document.activeElement
    if (recetaTableRef.value && activeEl && recetaTableRef.value.contains(activeEl)) {
      return
    }

    const kept = bomLineas.value.filter(l => 
      (l.insumoId && l.insumoId > 0) || 
      (l.descripcion && l.descripcion.trim() !== '') || 
      l.cantidad > 0
    )
    
    bomLineas.value = kept.length > 0 ? kept : [{
      tipoLinea: 'insumo',
      descripcion: '',
      cantidad: 0,
      costoUnitario: 0,
    }]
  })
}

function onRecetaTableFocusout(e: FocusEvent) {
  const next = e.relatedTarget as HTMLElement | null
  if (recetaTableRef.value && next && recetaTableRef.value.contains(next)) return
  activeRowIdx.value = null
  cleanupEmptyRecetaLineas()
}

function focusRecetaInput(idx: number, field: 'tipoLinea' | 'descripcion' | 'cantidad' | 'costoUnitario') {
  nextTick(() => {
    if (recetaTableRef.value) {
      const rows = recetaTableRef.value.querySelectorAll('tbody tr')
      const row = rows[idx]
      if (row) {
        const inputs = row.querySelectorAll('.cell-input, .cell-select')
        let targetInput: HTMLElement | null = null
        if (field === 'tipoLinea') {
          targetInput = inputs[0] as HTMLElement
        } else if (field === 'descripcion') {
          targetInput = inputs[1] as HTMLElement
        } else if (field === 'cantidad') {
          targetInput = inputs[2] as HTMLElement
        } else if (field === 'costoUnitario') {
          targetInput = inputs[3] as HTMLElement
        }
        targetInput?.focus()
      }
    }
  })
}

function onCellEnter(idx: number, field: 'tipoLinea' | 'descripcion' | 'cantidad' | 'costoUnitario') {
  const current = bomLineas.value[idx]
  const isCurrentEmpty = !current.descripcion?.trim() && !current.cantidad

  if (isCurrentEmpty) {
    focusAfterTable()
    return
  }

  const nextRow = bomLineas.value[idx + 1]
  if (nextRow) {
    focusRecetaInput(idx + 1, field)
    return
  }

  addBomLinea()
  focusRecetaInput(idx + 1, field)
}

defineExpose({ loadProducto })
</script>

<template>
  <Transition name="overlay">
    <div v-if="open" ref="overlayEl" class="pd-overlay">
        <div class="pd-body">
          <div class="pd-top">
            <!-- Bloque Izquierdo (60% del ancho) -->
            <div class="pd-left-block">
              <!-- Nombre del Producto (100% de ancho de este bloque) -->
              <div class="pd-name-header-card" style="padding: 14px 18px;">
                <div style="display: flex; align-items: flex-end; gap: 12px; width: 100%;">
                  <div style="flex: 1;">
                    <FloatingField
                      id="pd-nombre-input"
                      label="Nombre"
                      required
                      v-model="nombre"
                      placeholder="Nombre del producto"
                      class="pd-inline-name-ff"
                      @focus="($event.target as HTMLInputElement).select()"
                      @blur="nombre = nombre.trim()"
                      @keydown.enter.prevent="focusCategory"
                    />
                  </div>
                  <div v-if="isEdit" style="padding-bottom: 8px;">
                    <span class="pd-code-badge" title="Código autogenerado" style="flex-shrink: 0;">
                      <Lock :size="10" /> {{ producto!.codigo }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Dos sub-columnas debajo del Nombre -->
              <div class="pd-left-grid">
                <!-- Sub-columna 1: Fotos -->
                <section class="pd-card">
                  <!-- Foto Principal (slot 0) -->
                  <div
                    class="pd-photo-main"
                    draggable="true"
                    tabindex="0"
                    role="button"
                    aria-label="Foto principal. Presioná Enter o Espacio para cambiar o subir"
                    @dragstart="handleDragStart(0)"
                    @dragover="handleDragOver"
                    @drop="handleDrop(0)"
                    @click="triggerFileInput(0)"
                    @keydown.enter.prevent="triggerFileInput(0)"
                    @keydown.space.prevent="triggerFileInput(0)"
                  >
                    <img v-if="imagenes[0]" :src="getImageUrl(imagenes[0])" alt="Imagen principal" />
                    <div v-else class="pd-photo-placeholder">
                      <Image :size="40" />
                      <span class="text-hint" style="font-size: 11px; margin-top: 4px;">Arrastrá o hacé click para subir</span>
                    </div>
                    <button v-if="imagenes[0]" class="remove-img-btn" @click.stop="removeImage(0)">
                      <X :size="12" />
                    </button>
                  </div>

                  <!-- Miniaturas (slots 1 y 2) -->
                  <div class="pd-thumbnails-grid">
                    <div
                      v-for="idx in [1, 2]"
                      :key="idx"
                      class="pd-photo-thumb"
                      draggable="true"
                      tabindex="0"
                      role="button"
                      :aria-label="`Foto miniatura ${idx}. Presioná Enter o Espacio para cambiar o subir`"
                      @dragstart="handleDragStart(idx)"
                      @dragover="handleDragOver"
                      @drop="handleDrop(idx)"
                      @click="triggerFileInput(idx)"
                      @keydown.enter.prevent="triggerFileInput(idx)"
                      @keydown.space.prevent="triggerFileInput(idx)"
                    >
                      <img v-if="imagenes[idx]" :src="getImageUrl(imagenes[idx])" alt="Miniatura" />
                      <div v-else class="pd-photo-placeholder-thumb">
                        <Plus :size="16" />
                      </div>
                      <button v-if="imagenes[idx]" class="remove-img-btn" @click.stop="removeImage(idx)">
                        <X :size="10" />
                      </button>
                    </div>
                  </div>

                  <!-- Inputs de archivos ocultos -->
                  <input
                    v-for="idx in [0, 1, 2]"
                    :key="'input-' + idx"
                    :id="'file-input-' + idx"
                    type="file"
                    accept="image/*"
                    style="display: none;"
                    @change="handleFileChange($event, idx)"
                  />
                </section>

                <!-- Sub-columna 2: Identidad -->
                <section class="pd-card">
                  <div class="pd-field">
                    <FloatingSelect id="pd-categoria" label="Categoría" required v-model.number="categoriaId">
                      <option :value="0" disabled>Seleccionar</option>
                      <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                    </FloatingSelect>
                  </div>

                  <div class="pd-field">
                    <FloatingField id="pd-medida" label="Medida" v-model="medida" placeholder="Ej. 15×15 cm" />
                  </div>

                  <div class="pd-field">
                    <FloatingField
                      id="pd-descripcion"
                      label="Descripción"
                      multiline
                      v-model="descripcion"
                      placeholder="Detalles, terminaciones, materiales destacados"
                    />
                  </div>

                  <div class="pd-toggle-row">
                    <div class="lbl">
                      <span class="t">Producto activo</span>
                      <span class="h">Visible en catálogo y presupuestos</span>
                    </div>
                    <ToggleSwitch v-model="activo" aria-label="Producto activo" />
                  </div>
                </section>
              </div>
            </div>

            <!-- Bloque Derecho (40% del ancho) -->
            <div class="pd-right-block">
              <section class="pd-card">
                <div class="pd-card-head">
                  <h4>Precios</h4>
                </div>

                <div class="pd-toggle-row" style="margin-bottom: 12px; border-top: 0; padding-top: 0;">
                  <div class="lbl">
                    <span class="t">Precio automático</span>
                    <span class="h">Sincronizado con receta y margen</span>
                  </div>
                  <ToggleSwitch :modelValue="!precioManual" @update:modelValue="val => precioManual = !val" aria-label="Precio automático" />
                </div>

                <!-- Tipo de Ganancia: Flip Switch .checkbox-wrapper-10 en la misma línea -->
                <div class="pd-toggle-row" style="margin-bottom: 12px;">
                  <div class="lbl">
                    <span class="t">Tipo de ganancia</span>
                    <span class="h">Cálculo por porcentaje o monto fijo</span>
                  </div>
                  <div class="checkbox-wrapper-10" style="margin-bottom: 0;">
                    <input 
                      type="checkbox" 
                      id="cb-profit-type" 
                      class="tgl tgl-flip" 
                      :checked="tipoGanancia === 'fijo'" 
                      @change="tipoGanancia = ($event.target as HTMLInputElement).checked ? 'fijo' : 'porcentaje'"
                    />
                    <label for="cb-profit-type" data-tg-on="Fijo" data-tg-off="Porcentaje" class="tgl-btn" style="margin: 0;"></label>
                  </div>
                </div>

                <!-- Margen / Monto sobre costo en la misma línea -->
                <div class="pd-price-row">
                  <span class="pd-price-label">{{ tipoGanancia === 'porcentaje' ? 'Margen (%)' : 'Monto sobre costo' }}</span>
                  <input
                    class="pd-money-input"
                    type="number"
                    min="0"
                    step="1"
                    v-model.number="ganancia"
                    style="font-variant-numeric: tabular-nums; text-align: right;"
                  />
                </div>

                <div v-if="tieneBom" class="pd-price-row">
                  <span class="pd-price-label">Costo del producto <span style="margin-left: 6px; font-size: 10px; color: var(--ink-muted)">(desde BOM)</span></span>
                  <input class="pd-money-input readonly" :value="money(costoProducto)" readonly />
                </div>

                <div class="pd-price-row">
                  <span class="pd-price-label">Precio calculado</span>
                  <input
                    class="pd-money-input readonly"
                    :value="tieneBom ? money(precioCalculado) : '—'"
                    readonly
                    tabindex="-1"
                  />
                </div>

                <div class="pd-price-row grand">
                  <span class="pd-price-label">Precio final</span>
                  <input
                    class="pd-money-input"
                    :class="{ readonly: !precioManual }"
                    type="number"
                    min="0"
                    step="1"
                    v-model.number="precio"
                    :readonly="!precioManual"
                    style="font-size: 18px; font-weight: 500; color: var(--violet-700); width: 150px"
                  />
                </div>

                <div v-if="precio < precioCalculado" class="price-warning-banner">
                  ⚠️ El precio de venta final está por debajo del sugerido (costo de receta + margen)
                </div>
              </section>
            </div>
          </div>

          <section v-if="tieneBom" class="pd-bom">
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
                      dragId === idx && 'dragging',
                      dragOverId === idx && dragId !== idx && 'drag-over'
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
                        @keydown.enter.prevent="onCellEnter(idx, 'tipoLinea')"
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
                        @focus="activeRowIdx = idx"
                        @keydown.enter.prevent="onCellEnter(idx, 'descripcion')"
                      >
                        <option :value="0">Texto libre</option>
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
                        @keydown.enter.prevent="onCellEnter(idx, 'cantidad')"
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
                        step="0.5"
                        v-model.number="l.costoUnitario"
                        @focus="activeRowIdx = idx"
                        @keydown.enter.prevent="onCellEnter(idx, 'costoUnitario')"
                        style="padding-right: 45px; text-align: right;"
                      />
                      <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 11px; color: var(--ink-muted); pointer-events: none;">
                        {{ l.insumoId ? `/ ${getInsumoUnit(l.insumoId)}` : '' }}
                      </span>
                    </td>
                    <td class="num cell-subtotal">{{ money(l.cantidad * l.costoUnitario) }}</td>
                    <td>
                      <button class="del-btn" @click="removeBomLinea(idx)" title="Eliminar línea">
                        <X :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button class="add-line-btn" @click="addBomLinea">
                <Plus :size="14" /> Agregar línea
              </button>
            </div>

            <div class="pd-bom-total">
              <span class="lbl">Total BOM</span>
              <span class="val">{{ money(bomTotal) }}</span>
            </div>
          </section>
        </div>

        <div class="pd-foot">
          <button id="pd-back-btn" class="pd-back-btn" @click="handleBack">
            <ArrowLeft :size="16" /> Volver a productos
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
            <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
          </button>
        </div>

        <ConfirmDialog
          :open="showConfirmExit"
          title="¿Salir sin guardar?"
          :message="`Tenés cambios pendientes en ${nombre}. Si salís ahora, vas a perderlos.`"
          confirm-label="Salir sin guardar"
          cancel-label="Seguir editando"
          variant="danger"
          @confirm="handleClose(); showConfirmExit = false"
          @cancel="showConfirmExit = false"
        />

        <ConfirmDialog
          :open="showConfirmDelete"
          title="Eliminar producto"
          :message="`Vas a eliminar ${producto?.codigo} · ${nombre}. Esta acción no se puede deshacer.`"
          confirm-label="Eliminar"
          variant="danger"
          @confirm="handleDelete"
          @cancel="showConfirmDelete = false"
        />
      </div>
  </Transition>
</template>

<style scoped>
.pd-overlay {
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

.pd-body {
  overflow-y: auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pd-top {
  display: grid;
  grid-template-columns: 6fr 4fr;
  gap: 24px;
  align-items: start;
}

.pd-left-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pd-left-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.pd-name-header-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px 20px;
  box-shadow: var(--shadow-1);
}

.pd-right-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pd-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pd-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pd-card-head h4 {
  font-size: 11px;
  color: var(--ink-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.pd-photo-main {
  aspect-ratio: 4 / 3;
  width: 100%;
  background: #F0EEF4;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  color: rgba(28, 26, 30, 0.30);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px dashed var(--border-strong);
  transition: border-color 120ms ease;
}

.pd-photo-main:hover {
  border-color: var(--violet-700);
}

.pd-photo-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pd-photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  padding: 12px;
}

.pd-thumbnails-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.pd-photo-thumb {
  aspect-ratio: 4 / 3;
  width: 100%;
  background: #F0EEF4;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  color: rgba(28, 26, 30, 0.30);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px dashed var(--border-strong);
  transition: border-color 120ms ease;
}

.pd-photo-thumb:hover {
  border-color: var(--violet-700);
}

.pd-photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pd-photo-placeholder-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-img-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  border: 0;
  color: #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 120ms ease;
  z-index: 10;
}

.remove-img-btn:hover {
  background: var(--coral-600);
}

.pd-code-badge {
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

.pd-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pd-field > label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
}

/* Nombre unificado estéticamente pero con fuente grande (copiado de ins-nombre) */
.pd-inline-name-ff {
  --ff-rest-y: 26px;
}
:deep(.pd-inline-name-ff .ff-control) {
  font-size: 18px;
  font-weight: 500;
  padding: 18px 14px 10px 14px;
}
:deep(.pd-inline-name-ff .ff-label) {
  top: 14px;
}

.pd-id-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.pd-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 12px;
  border-top: 1px solid var(--border);
}

.pd-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
.pd-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--ink); }
.pd-toggle-row .lbl .h { font-size: 12px; color: var(--ink-muted); }

.pd-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid var(--border);
  font-size: 13px;
}

.pd-price-row.grand {
  border-top: 1px solid var(--border-strong);
  margin-top: 6px;
  padding-top: 14px;
}

.pd-price-label {
  font-size: 12px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pd-money-input {
  width: 130px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: right;
  padding: 8px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  background: var(--surface);
  color: var(--ink);
}

.pd-money-input:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: var(--focus-ring);
}

.pd-money-input.readonly {
  background: var(--page-bg);
  color: var(--ink-muted);
  border-color: var(--border);
}

.pd-bom {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pd-bom .pd-bom-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pd-bom .pd-bom-head h4 { font-size: 16px; color: var(--ink); font-weight: 500; }

.pd-bom-table {
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.pd-bom-table table { width: 100%; border-collapse: collapse; }

.pd-bom-table thead th {
  text-align: left;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  background: var(--page-bg);
  border-bottom: 1px solid var(--border);
}

.pd-bom-table thead th.num { text-align: right; }

.pd-bom-table tbody td {
  padding: 0;
  border-bottom: 1px solid var(--border);
}

.pd-bom-table tbody tr:last-child td { border-bottom: 0; }

.cell-select {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  padding: 11px 8px;
  outline: none;
  cursor: pointer;
}

.cell-select:focus { background: var(--teal-100); }

.cell-input {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--ink);
  padding: 11px 12px;
  outline: none;
}

.cell-input:focus { background: var(--teal-100); }
.cell-input.num-input { text-align: right; font-variant-numeric: tabular-nums; }

.cell-subtotal {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: 11px 12px !important;
}

.del-btn {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 8px;
  display: grid;
  place-items: center;
}

.del-btn:hover { color: var(--coral-500); }

.add-line-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: var(--surface);
  border: 0;
  border-top: 1px dashed var(--border-strong);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--violet-700);
  cursor: pointer;
  text-align: left;
  transition: background 120ms ease;
}

.add-line-btn:hover {
  background: var(--violet-50);
}

.pd-bom-total {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 16px;
  padding-top: 8px;
}

.pd-bom-total .lbl { font-size: 12px; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.pd-bom-total .val {
  font-size: 18px;
  font-weight: 500;
  color: var(--violet-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.pd-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.pd-back-btn {
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

.pd-back-btn:hover { background: var(--violet-50); }

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

.price-warning-banner {
  font-size: 12px;
  color: #D97706;
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 10px;
  line-height: 1.4;
}
</style>
