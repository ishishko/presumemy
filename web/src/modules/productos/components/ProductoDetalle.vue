<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ArrowLeft, Check, Trash2, X, Plus, Lock, Image, GripVertical, Ruler } from '@lucide/vue'
import { get, post, put, del } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import ToggleSwitch from '@/shared/ui/ToggleSwitch.vue'
import OverlayShell from '@/shared/ui/OverlayShell.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { formatMoney } from '@/shared/lib/format'
import type { Producto, CategoriaProducto, Insumo, PaginationResult } from '@/types'

const props = defineProps<{
  open: boolean
  producto?: Producto | null
}>()

const emit = defineEmits<{
  close: []
  saved: [producto: Producto]
  deleted: []
}>()

const { toast } = useToast()

const isEdit = computed(() => !!props.producto)

const categorias = ref<CategoriaProducto[]>([])
const insumosList = ref<Insumo[]>([])

const nombre = ref('')
const categoriaId = ref(0)
const descripcion = ref('')
const activo = ref(true)

const medidasTipo = ref<'plano' | 'cuerpo'>('plano')
const medidasBase = ref<number | ''>('')
const medidasAltura = ref<number | ''>('')
const medidasProfundidad = ref<number | ''>('')

const medidasPayload = computed(() => {
  if (medidasBase.value === '' || medidasAltura.value === '') {
    return null
  }
  return {
    tipo: medidasTipo.value,
    base: Number(medidasBase.value),
    altura: Number(medidasAltura.value),
    profundidad: medidasTipo.value === 'cuerpo' && medidasProfundidad.value !== '' ? Number(medidasProfundidad.value) : null,
    unidad: 'cm',
  }
})

const localMedidasFormatted = computed(() => {
  if (medidasBase.value === '' || medidasAltura.value === '') return ''
  const suffix = medidasTipo.value === 'cuerpo' && medidasProfundidad.value !== '' ? ` × ${medidasProfundidad.value}` : ''
  return `${medidasBase.value} × ${medidasAltura.value}${suffix} cm`
})

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
    JSON.stringify(p.medidas || null) !== JSON.stringify(medidasPayload.value) ||
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

function reset() {
  nombre.value = ''
  categoriaId.value = 0
  descripcion.value = ''
  activo.value = true
  tieneBom.value = true
  precioManual.value = false
  tipoGanancia.value = 'porcentaje'
  ganancia.value = 0
  precio.value = 0
  imagenes.value = ['', '', '']
  bomLineas.value = []
  medidasTipo.value = 'plano'
  medidasBase.value = ''
  medidasAltura.value = ''
  medidasProfundidad.value = ''
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
    if (p.medidas) {
      medidasTipo.value = p.medidas.tipo
      medidasBase.value = p.medidas.base
      medidasAltura.value = p.medidas.altura
      medidasProfundidad.value = p.medidas.profundidad ?? ''
    } else {
      medidasTipo.value = 'plano'
      medidasBase.value = ''
      medidasAltura.value = ''
      medidasProfundidad.value = ''
    }
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

  if (medidasBase.value !== '' || medidasAltura.value !== '' || (medidasTipo.value === 'cuerpo' && medidasProfundidad.value !== '')) {
    if (medidasBase.value === '' || Number(medidasBase.value) <= 0) {
      toast('La base debe ser mayor a 0 y ser numérica', 'error')
      return
    }
    if (medidasAltura.value === '' || Number(medidasAltura.value) <= 0) {
      toast('La altura debe ser mayor a 0 y ser numérica', 'error')
      return
    }
    if (medidasTipo.value === 'cuerpo' && (medidasProfundidad.value === '' || Number(medidasProfundidad.value) <= 0)) {
      toast('La profundidad es requerida para objetos 3D (cuerpo) y debe ser mayor a 0', 'error')
      return
    }
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
    medidas: medidasPayload.value,
  }

  if (tieneBom.value) {
    payload.bomLineas = bomLineas.value
      .filter(l => l.descripcion && l.cantidad > 0)
      .map(l => ({
        tipoLinea: l.tipoLinea,
        insumoId: l.insumoId || undefined,
        descripcion: l.descripcion,
        fancyCosto: l.costoUnitario,
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

function handleClose() {
  emit('close')
}

watch(() => props.open, async (open) => {
  if (open) {
    loadProducto()
    await nextTick()
    const nameInput = document.getElementById('pd-nombre-input') as HTMLInputElement | null
    nameInput?.focus()
    nameInput?.select()
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
      fancyCosto: 0,
      cantidad: 0,
      costoUnitario: 0,
    } as any]
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
</script>

<template>
  <OverlayShell
    :open="open"
    :title="isEdit ? (producto?.codigo || '') : 'Nuevo'"
    :dirty="dirty"
    @close="handleClose"
    @save="handleSave"
  >
    <template #body>
      <div ref="overlayEl" class="p-7 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div class="grid grid-cols-1 lg:grid-cols-[6fr_4fr] gap-6 items-start">
          
          <!-- Bloque Izquierdo (60% del ancho) -->
          <div class="flex flex-col gap-6 min-w-0">
            <!-- Nombre del Producto -->
            <div class="p-4 bg-transparent border-0 rounded-lg">
              <div class="flex gap-3 items-end w-full">
                <div class="flex-1 min-w-0">
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
                <div v-if="isEdit" class="pb-2 flex gap-2 items-center flex-shrink-0">
                  <span v-if="localMedidasFormatted" class="inline-flex items-center gap-1.5 font-mono text-12 text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full animate-fade-in" title="Medidas">
                    <Ruler :size="10" /> {{ localMedidasFormatted }}
                  </span>
                  <span class="inline-flex items-center gap-1.5 font-mono text-12 text-violet-700 bg-violet-100 px-2.5 py-1 rounded-full" title="Código autogenerado">
                    <Lock :size="10" /> {{ producto!.codigo }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Dos sub-columnas debajo del Nombre -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <!-- Sub-columna 1: Fotos -->
              <section class="flex flex-col gap-4 bg-surface border border-border rounded-lg p-5">
                <!-- Foto Principal (slot 0) -->
                <div
                  class="relative aspect-video w-full bg-page-bg rounded-md flex flex-col items-center justify-center text-ink-muted/50 overflow-hidden cursor-pointer border border-dashed border-border-strong hover:border-violet-700 transition"
                  draggable="true"
                  tabindex="0"
                  role="button"
                  aria-label="Foto principal. Arrastrá o hacé click para subir"
                  @dragstart="handleDragStart(0)"
                  @dragover="handleDragOver"
                  @drop="handleDrop(0)"
                  @click="triggerFileInput(0)"
                  @keydown.enter.prevent="triggerFileInput(0)"
                  @keydown.space.prevent="triggerFileInput(0)"
                >
                  <img v-if="imagenes[0]" :src="getImageUrl(imagenes[0])" alt="Imagen principal" class="w-full h-full object-cover block" />
                  <div v-else class="flex flex-col items-center gap-1 text-center p-3">
                    <Image :size="32" class="text-ink-muted/30" />
                    <span class="text-11 text-ink-muted">Arrastrá o hacé click para subir</span>
                  </div>
                  <button v-if="imagenes[0]" class="absolute top-2 right-2 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-coral-600 transition" @click.stop="removeImage(0)">
                    <X :size="12" />
                  </button>
                </div>

                <!-- Miniaturas (slots 1 y 2) -->
                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="idx in [1, 2]"
                    :key="idx"
                    class="relative aspect-video w-full bg-page-bg rounded-md flex items-center justify-center text-ink-muted/50 overflow-hidden cursor-pointer border border-dashed border-border-strong hover:border-violet-700 transition"
                    draggable="true"
                    tabindex="0"
                    role="button"
                    :aria-label="`Foto miniatura ${idx}. Arrastrá o hacé click para subir`"
                    @dragstart="handleDragStart(idx)"
                    @dragover="handleDragOver"
                    @drop="handleDrop(idx)"
                    @click="triggerFileInput(idx)"
                    @keydown.enter.prevent="triggerFileInput(idx)"
                    @keydown.space.prevent="triggerFileInput(idx)"
                  >
                    <img v-if="imagenes[idx]" :src="getImageUrl(imagenes[idx])" alt="Miniatura" class="w-full h-full object-cover block" />
                    <div v-else class="flex items-center justify-center">
                      <Plus :size="16" class="text-ink-muted/30" />
                    </div>
                    <button v-if="imagenes[idx]" class="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-coral-600 transition" @click.stop="removeImage(idx)">
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
                  class="hidden"
                  @change="handleFileChange($event, idx)"
                />
              </section>

              <!-- Sub-columna 2: Identidad -->
              <section class="flex flex-col gap-6 bg-surface border border-border rounded-lg p-5">
                <div class="flex flex-col gap-1.5">
                  <FloatingSelect id="pd-categoria" label="Categoría" required v-model.number="categoriaId">
                    <option :value="0" disabled>Seleccionar</option>
                    <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
                  </FloatingSelect>
                </div>

                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <label class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em]">Medidas</label>
                    <div class="checkbox-wrapper-10">
                      <input
                        type="checkbox"
                        id="cb-medidas-tipo"
                        class="tgl tgl-flip"
                        :checked="medidasTipo === 'cuerpo'"
                        @change="medidasTipo = ($event.target as HTMLInputElement).checked ? 'cuerpo' : 'plano'"
                      />
                      <label for="cb-medidas-tipo" data-tg-on="Cuerpo" data-tg-off="Plano" class="tgl-btn"></label>
                    </div>
                  </div>
                  
                  <div class="flex gap-2">
                    <div class="flex-1 min-w-0">
                      <FloatingField
                        id="pd-base"
                        label="Base (cm)"
                        type="number"
                        min="0"
                        step="0.1"
                        v-model.number="medidasBase"
                        placeholder="0"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <FloatingField
                        id="pd-altura"
                        label="Altura (cm)"
                        type="number"
                        min="0"
                        step="0.1"
                        v-model.number="medidasAltura"
                        placeholder="0"
                      />
                    </div>
                    <div v-if="medidasTipo === 'cuerpo'" class="flex-1 min-w-0">
                      <FloatingField
                        id="pd-profundidad"
                        label="Prof. (cm)"
                        type="number"
                        min="0"
                        step="0.1"
                        v-model.number="medidasProfundidad"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <FloatingField
                    id="pd-descripcion"
                    label="Descripción"
                    multiline
                    v-model="descripcion"
                    placeholder="Detalles, terminaciones, materiales destacados"
                  />
                </div>

                <div class="flex items-center justify-between py-2.5 px-3 bg-page-bg/50 border border-border rounded-lg mt-1">
                  <div class="flex flex-col gap-0.5 text-left">
                    <span class="text-13 font-medium text-ink">Producto activo</span>
                    <span class="text-12 text-ink-muted">Visible en catálogo y presupuestos</span>
                  </div>
                  <ToggleSwitch v-model="activo" aria-label="Producto activo" />
                </div>
              </section>
            </div>
          </div>

          <!-- Bloque Derecho (40% del ancho) -->
          <div class="flex flex-col gap-6">
            <section class="flex flex-col gap-4 bg-surface border border-border rounded-lg shadow-sm p-5">
              <div class="flex items-center justify-between">
                <h4 class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em] m-0">Precios</h4>
              </div>

              <div class="flex items-center justify-between py-2.5 px-3 bg-page-bg/30 border border-border rounded-lg">
                <div class="flex flex-col gap-0.5 text-left">
                  <span class="text-13 font-medium text-ink">Precio automático</span>
                  <span class="text-12 text-ink-muted">Sincronizado con receta y margen</span>
                </div>
                <ToggleSwitch :modelValue="!precioManual" @update:modelValue="precioManual = !$event" aria-label="Precio automático" />
              </div>

              <div class="flex items-center justify-between py-2.5 px-3 bg-page-bg/30 border border-border rounded-lg">
                <div class="flex flex-col gap-0.5 text-left">
                  <span class="text-13 font-medium text-ink">Tipo de ganancia</span>
                  <span class="text-12 text-ink-muted">Margen porcentual o valor fijo</span>
                </div>
                <div class="checkbox-wrapper-10">
                  <input 
                    type="checkbox" 
                    id="cb-profit-type" 
                    class="tgl tgl-flip" 
                    :checked="tipoGanancia === 'fijo'" 
                    @change="tipoGanancia = ($event.target as HTMLInputElement).checked ? 'fijo' : 'porcentaje'"
                  />
                  <label for="cb-profit-type" data-tg-on="Fijo" data-tg-off="Porcentaje" class="tgl-btn"></label>
                </div>
              </div>

              <!-- Margen / Monto sobre costo -->
              <div class="flex items-center justify-between py-2 border-t border-border mt-1">
                <span class="text-12 font-medium text-ink-muted uppercase tracking-[0.06em]">{{ tipoGanancia === 'porcentaje' ? 'Margen (%)' : 'Monto sobre costo' }}</span>
                <input
                  class="w-[140px] text-14 text-right bg-surface border border-border-strong rounded-md px-3 py-2 font-mono focus:outline-none focus:border-teal-500 focus:shadow-focus-ring"
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="ganancia"
                />
              </div>

              <div v-if="tieneBom" class="flex items-center justify-between py-2 border-t border-border">
                <span class="text-12 font-medium text-ink-muted uppercase tracking-[0.06em]">Costo del producto <span class="text-10 text-ink-muted font-normal lowercase">(desde BOM)</span></span>
                <input class="w-[140px] text-14 text-right bg-page-bg text-ink-muted border border-border rounded-md px-3 py-2 font-mono" :value="formatMoney(costoProducto)" readonly />
              </div>

              <div class="flex items-center justify-between py-2 border-t border-border">
                <span class="text-12 font-medium text-ink-muted uppercase tracking-[0.06em]">Precio sugerido</span>
                <input
                  class="w-[140px] text-14 text-right bg-page-bg text-ink-muted border border-border rounded-md px-3 py-2 font-mono"
                  :value="tieneBom ? formatMoney(precioCalculado) : '—'"
                  readonly
                  tabindex="-1"
                />
              </div>

              <div class="flex items-center justify-between py-3 border-t border-border-strong mt-2">
                <span class="text-12 font-semibold text-ink-muted uppercase tracking-[0.06em]">Precio de venta</span>
                <input
                  class="w-[140px] text-18 font-semibold text-right bg-surface border border-border-strong rounded-md px-3 py-2 font-mono text-violet-700 focus:outline-none focus:border-teal-500 focus:shadow-focus-ring"
                  :class="{ '!bg-page-bg !text-ink-muted !border-border': !precioManual }"
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="precio"
                  :readonly="!precioManual"
                />
              </div>

              <div v-if="precio < precioCalculado" class="text-12 text-orange-ink bg-yellow/40 border border-yellow/60 p-3 rounded-lg leading-relaxed">
                El precio de venta final está por debajo del sugerido (costo de receta + margen)
              </div>
            </section>
          </div>
        </div>

        <section v-if="tieneBom" class="bg-surface border border-border rounded-lg shadow-sm p-5 flex flex-col gap-4 mt-2">
          <div class="flex items-center justify-between gap-3">
            <h4 class="text-16 font-semibold text-ink m-0">Receta · BOM</h4>
            <span class="text-12 text-ink-muted">Costos aislados — editar el costo unitario acá no afecta a otros productos</span>
          </div>

          <div ref="recetaTableRef" class="lines-spreadsheet overflow-x-auto" @focusout="onRecetaTableFocusout">
            <table class="w-full text-left border-collapse">
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
                <tr class="border-b border-border text-11 font-semibold text-ink-muted uppercase tracking-[0.06em] bg-page-bg/30">
                  <th class="py-2"></th>
                  <th class="py-2 pb-2">Tipo</th>
                  <th class="py-2 pb-2">Insumo / descripción</th>
                  <th class="py-2 pb-2 text-right">Cantidad</th>
                  <th class="py-2 pb-2 text-right">Costo unitario</th>
                  <th class="py-2 pb-2 text-right">Subtotal</th>
                  <th class="py-2 pb-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(l, idx) in bomLineas" 
                  :key="idx"
                  :class="[
                    'border-b border-border last:border-0 hover:bg-page-bg/50',
                    activeRowIdx === idx && 'bg-page-bg/80',
                    dragId === idx && 'opacity-50 bg-violet-50',
                    dragOverId === idx && dragId !== idx && 'border-t-2 border-violet-500'
                  ]"
                  draggable="true"
                  @dragstart="onBomDragStart(idx)"
                  @dragover="onBomDragOver($event, idx)"
                  @drop="onBomDrop(idx)"
                  @dragend="onBomDragEnd"
                  @mousedown="activeRowIdx = idx"
                >
                  <td class="py-2 text-center text-ink-muted/40 cursor-grab active:cursor-grabbing grip" title="Arrastrar para reordenar">
                    <GripVertical :size="14" />
                  </td>
                  <td class="py-2">
                    <select 
                      class="w-full bg-transparent text-13 text-ink focus:outline-none focus:bg-teal-100 py-1" 
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
                  <td class="py-2">
                    <select
                      class="w-full bg-transparent text-13 text-ink focus:outline-none focus:bg-teal-100 py-1 pr-6"
                      :value="l.insumoId || 0"
                      @change="onInsumoChange(idx, +($event.target as HTMLSelectElement).value)"
                      @focus="activeRowIdx = idx"
                      @keydown.enter.prevent="onCellEnter(idx, 'descripcion')"
                    >
                      <option :value="0">Texto libre</option>
                      <option v-for="ins in insumosList" :key="ins.id" :value="ins.id">{{ ins.nombre }}</option>
                    </select>
                  </td>
                  <td class="py-2 relative">
                    <input
                      class="w-full bg-transparent text-13 text-ink text-right focus:outline-none focus:bg-teal-100 py-1 font-mono num-input"
                      type="number"
                      min="0"
                      step="0.01"
                      v-model.number="l.cantidad"
                      @focus="activeRowIdx = idx"
                      @keydown.enter.prevent="onCellEnter(idx, 'cantidad')"
                      style="padding-right: 45px;"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-11 text-ink-muted pointer-events-none font-sans">
                      {{ getInsumoUnit(l.insumoId) }}
                    </span>
                  </td>
                  <td class="py-2 relative">
                    <input
                      class="w-full bg-transparent text-13 text-ink text-right focus:outline-none focus:bg-teal-100 py-1 font-mono num-input"
                      type="number"
                      min="0"
                      step="0.5"
                      v-model.number="l.costoUnitario"
                      @focus="activeRowIdx = idx"
                      @keydown.enter.prevent="onCellEnter(idx, 'costoUnitario')"
                      style="padding-right: 45px;"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-11 text-ink-muted pointer-events-none font-sans">
                      {{ l.insumoId ? `/ ${getInsumoUnit(l.insumoId)}` : '' }}
                    </span>
                  </td>
                  <td class="py-2 text-right font-medium text-13 font-mono">{{ formatMoney(l.cantidad * l.costoUnitario) }}</td>
                  <td class="py-2 text-center">
                    <button class="text-ink-muted hover:text-coral-500 cursor-pointer p-1 transition-colors" @click="removeBomLinea(idx)" title="Eliminar línea">
                      <X :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <button class="flex items-center gap-1.5 text-13 text-violet-700 hover:text-violet-800 font-medium cursor-pointer py-3 px-4 w-full border-t border-dashed border-border-strong hover:bg-violet-50 transition" @click="addBomLinea">
              <Plus :size="14" /> Agregar línea
            </button>
          </div>

          <div class="flex justify-end items-center gap-4 py-2 mt-1">
            <span class="text-11 font-semibold text-ink-muted uppercase tracking-[0.06em]">Total BOM</span>
            <span class="text-20 font-semibold text-violet-700 font-mono">{{ formatMoney(bomTotal) }}</span>
          </div>
        </section>
      </div>
    </template>

    <template #foot>
      <div class="flex items-center w-full">
        <BaseButton
          variant="ghost"
          class="flex items-center gap-2 text-violet-700 hover:bg-violet-50"
          @click="handleBack"
        >
          <ArrowLeft :size="16" /> Volver a productos
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
            <Check :size="16" /> {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
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
</template>

<style scoped>
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
</style>
