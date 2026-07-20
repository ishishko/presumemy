<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { Trash2, X, Plus, Lock, Image, Ruler } from '@lucide/vue'
import { editorDirty } from '@/shared/lib/editorMode'
import { get } from '@/shared/api/client'
import { useToast } from '@/shared/lib/useToast'
import { formatMoney } from '@/shared/lib/format'
import { useProductosStore } from '../store'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FloatingField from '@/shared/ui/FloatingField.vue'
import FloatingSelect from '@/shared/ui/FloatingSelect.vue'
import ToggleSwitch from '@/shared/ui/ToggleSwitch.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Producto, CategoriaProducto, Insumo, PaginationResult } from '@/types'

import ProductoMedidasForm from './ProductoMedidasForm.vue'
import BomEditor from './BomEditor.vue'

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
const store = useProductosStore()

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
const errors = ref<Record<string, string>>({})

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


watch([precioCalculado, precioManual], ([newCalc, manual]) => {
  if (!manual) {
    precio.value = Number(Number(newCalc).toFixed(2))
  }
})

function money(n: number): string {
  return formatMoney(n, { decimals: 0 })
}

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
  bomLineas.value = [{ tipoLinea: 'insumo', insumoId: undefined, descripcion: '', cantidad: 1, costoUnitario: 0 }]
  medidasTipo.value = 'plano'
  medidasBase.value = ''
  medidasAltura.value = ''
  medidasProfundidad.value = ''
}

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
      tipoLinea: b.tipoLinea || 'insumo',
      insumoId: b.insumoId || undefined,
      descripcion: b.descripcion || '',
      cantidad: Number(b.cantidad),
      costoUnitario: Number(b.costoUnitario),
    }))
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
    bomLineas.value = [{ tipoLinea: 'insumo', insumoId: undefined, descripcion: '', cantidad: 1, costoUnitario: 0 }]
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
        cantidad: l.cantidad,
        costoUnitario: l.costoUnitario,
      }))
  }

  try {
    let res: Producto
    if (isEdit.value && props.producto) {
      res = await store.update(props.producto.id, payload)
      toast('Producto actualizado')
    } else {
      res = await store.create(payload)
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
    await store.remove(props.producto.id)
    toast('Producto eliminado', 'info')
    emit('deleted')
    emit('close')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
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

defineExpose({ loadProducto })
</script>

<template>
  <Transition name="overlay">
    <div v-if="open" ref="overlayEl" class="fixed top-[56px] right-0 bottom-0 left-[240px] z-30 bg-page-bg flex flex-col overflow-hidden">
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
                  <div v-if="isEdit" style="padding-bottom: 8px; display: flex; gap: 6px; align-items: center;">
                    <span v-if="localMedidasFormatted" class="pd-code-badge" title="Medidas" style="flex-shrink: 0; background: var(--color-violet-50); color: var(--color-violet-700)">
                      <Ruler :size="10" /> {{ localMedidasFormatted }}
                    </span>
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

                  <ProductoMedidasForm
                    v-model:medidasTipo="medidasTipo"
                    v-model:medidasBase="medidasBase"
                    v-model:medidasAltura="medidasAltura"
                    v-model:medidasProfundidad="medidasProfundidad"
                    :errors="errors"
                  />

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
                  <span class="pd-price-label">Costo del producto <span style="margin-left: 6px; font-size: 10px; color: var(--color-ink-muted)">(desde BOM)</span></span>
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
                    style="font-size: 18px; font-weight: 500; color: var(--color-violet-700); width: 150px"
                  />
                </div>

                <div v-if="precio < precioCalculado" class="price-warning-banner">
                  ⚠️ El precio de venta final está por debajo del sugerido (costo de receta + margen)
                </div>
              </section>
            </div>
          </div>

          <BomEditor
            v-if="tieneBom"
            v-model="bomLineas"
            :insumosList="insumosList"
            :errors="errors"
          />
        </div>

        <div class="flex items-center justify-between border-t border-border px-5.5 py-3.5 bg-surface min-h-[56px] select-none shrink-0">
          <div class="flex-1"></div>
          <div class="flex items-center gap-2">
            <BaseButton
              v-if="isEdit"
              variant="danger"
              @click="showConfirmDelete = true"
            >
              <Trash2 :size="16" /> Eliminar
            </BaseButton>
          </div>
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
  background: var(--color-page-bg);
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
  /* gap: 20px; */
}

.pd-left-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.pd-name-header-card {
  /* background: var(--color-surface); */
  /* border: 1px solid var(--color-border); */
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  /* box-shadow: var(--shadow-1); */
}

.pd-right-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pd-card {
  /* background: var(--color-surface); */
  /* border: 1px solid var(--color-border); */
  /* border-radius: var(--radius-lg); */
  padding: 20px;
  /* box-shadow: var(--shadow-1); */
  display: flex;
  flex-direction: column;
  /* gap: 16px; */
}

.pd-left-grid .pd-card:first-of-type {
  gap: 16px;
}

.pd-left-grid .pd-card:last-of-type {
  gap: 26px;
}

.pd-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pd-card-head h4 {
  font-size: 11px;
  color: var(--color-ink-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.pd-photo-main {
  aspect-ratio: 4 / 3;
  width: 100%;
  background: #F0EEF4;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  color: rgba(28, 26, 30, 0.30);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px dashed var(--color-border-strong);
  transition: border-color 120ms ease;
}

.pd-photo-main:hover {
  border-color: var(--color-violet-700);
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
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  color: rgba(28, 26, 30, 0.30);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px dashed var(--color-border-strong);
  transition: border-color 120ms ease;
}

.pd-photo-thumb:hover {
  border-color: var(--color-violet-700);
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
  background: var(--color-coral-700);
}

.pd-code-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 3px 10px;
  background: var(--color-violet-100);
  color: var(--color-violet-700);
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
  color: var(--color-ink-muted);
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
  border-top: 1px solid var(--color-border);
}

.pd-toggle-row .lbl { display: flex; flex-direction: column; gap: 2px; }
.pd-toggle-row .lbl .t { font-size: 13px; font-weight: 500; color: var(--color-ink); }
.pd-toggle-row .lbl .h { font-size: 12px; color: var(--color-ink-muted); }

.pd-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
}

.pd-price-row.grand {
  border-top: 1px solid var(--color-border-strong);
  margin-top: 6px;
  padding-top: 14px;
}

.pd-price-label {
  font-size: 12px;
  color: var(--color-ink-muted);
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
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
}

.pd-money-input:focus {
  outline: none;
  border-color: var(--color-teal-500);
  box-shadow: var(--shadow-focus-ring);
}

.pd-money-input.readonly {
  background: var(--color-page-bg);
  color: var(--color-ink-muted);
  border-color: var(--color-border);
}

.pd-bom {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
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

.pd-bom .pd-bom-head h4 { font-size: 16px; color: var(--color-ink); font-weight: 500; }

.pd-bom-table {
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
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
  color: var(--color-ink-muted);
  background: var(--color-page-bg);
  border-bottom: 1px solid var(--color-border);
}

.pd-bom-table thead th.num { text-align: right; }

.pd-bom-table tbody td {
  padding: 0;
  border-bottom: 1px solid var(--color-border);
}

.pd-bom-table tbody tr:last-child td { border-bottom: 0; }

.cell-select {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-ink);
  padding: 11px 8px;
  outline: none;
  cursor: pointer;
}

.cell-select:focus { background: var(--color-teal-100); }

.cell-input {
  width: 100%;
  border: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-ink);
  padding: 11px 12px;
  outline: none;
}

.cell-input:focus { background: var(--color-teal-100); }
.cell-input.num-input { text-align: right; font-variant-numeric: tabular-nums; }

.cell-subtotal {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: 11px 12px !important;
}

.del-btn {
  background: transparent;
  border: 0;
  color: var(--color-ink-muted);
  cursor: pointer;
  padding: 8px;
  display: grid;
  place-items: center;
}

.del-btn:hover { color: var(--color-coral-500); }

.add-line-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 0;
  border-top: 1px dashed var(--color-border-strong);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-violet-700);
  cursor: pointer;
  text-align: left;
  transition: background 120ms ease;
}

.add-line-btn:hover {
  background: var(--color-violet-50);
}

.pd-bom-total {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 16px;
  padding-top: 8px;
}

.pd-bom-total .lbl { font-size: 12px; color: var(--color-ink-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.pd-bom-total .val {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-violet-700);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.pd-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
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
  color: var(--color-violet-700);
  transition: background 120ms ease;
}

.pd-back-btn:hover { background: var(--color-violet-50); }

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


.medidas-inputs-row {
  display: flex;
  gap: 8px;
}

.medida-input-col {
  flex: 1;
  min-width: 0;
}

.pd-label-group {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink-muted);
  font-weight: 500;
  margin-bottom: 6px;
}
</style>
