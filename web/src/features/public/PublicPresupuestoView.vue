<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ofetch } from 'ofetch'
import { FileX, Printer } from '@lucide/vue'
import PresupuestoDoc, { type PresupuestoDocData } from '@/components/presupuestos/PresupuestoDoc.vue'
import type { ConfiguracionNegocio } from '@/types'

interface PublicPresupuestoDTO {
  folio: string
  createdAt: string
  estado: string
  cliente: string
  tematica?: string | null
  fechaFiesta?: string | null
  fechaEntrega?: string | null
  tipoEntrega: 'retira' | 'envio'
  direccionEntrega?: string | null
  metodoPago?: string | null
  sena: string | number
  total: string | number
  notas?: string | null
  detalles: Array<{ descripcion: string; cantidad: string | number; precioUnitario: string | number; subtotal: string | number }>
  config: Pick<ConfiguracionNegocio, 'nombre' | 'logoUrl' | 'domicilio' | 'contactoCanal' | 'contactoValor' | 'moneda'> | null
}

const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const doc = ref<PresupuestoDocData | null>(null)
const config = ref<PublicPresupuestoDTO['config']>(null)

// modo PDF: render limpio para Puppeteer (sin botones ni animación)
const isPdfMode = computed(() => route.query.pdf === '1')

onMounted(async () => {
  try {
    const res = await ofetch<{ data: PublicPresupuestoDTO }>(
      `${import.meta.env.VITE_API_URL || '/api'}/public/presupuestos/${route.params.token}`
    )
    const p = res.data
    const sena = Number(p.sena) || 0
    const total = Number(p.total) || 0

    doc.value = {
      folio: p.folio,
      cliente: p.cliente,
      tematica: p.tematica || undefined,
      fFiesta: p.fechaFiesta ? p.fechaFiesta.slice(0, 10) : undefined,
      fEntrega: p.fechaEntrega ? p.fechaEntrega.slice(0, 10) : undefined,
      envio: p.tipoEntrega,
      lugar: p.direccionEntrega || undefined,
      pago: p.metodoPago || undefined,
      sena,
      resto: Math.max(0, total - sena),
      lines: p.detalles.map((d) => ({
        producto: d.descripcion,
        qty: String(Number(d.cantidad)),
        price: String(Number(d.precioUnitario)),
      })),
      subtotal: total,
      total,
      notes: p.notas || undefined,
      includeNotes: !!p.notas,
      fecha: p.createdAt,
    }
    config.value = p.config
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

function handlePrint() {
  window.print()
}
</script>

<template>
  <div
    class="public-page"
    :class="{ 'pdf-mode': isPdfMode }"
    :data-doc-ready="!loading ? 'true' : undefined"
  >
    <div v-if="loading" class="public-state" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <p>Cargando presupuesto...</p>
    </div>

    <div v-else-if="notFound || !doc" class="public-state">
      <FileX :size="44" aria-hidden="true" />
      <p>Este presupuesto no está disponible</p>
      <small>El link puede haber expirado o el presupuesto ya no está vigente.</small>
    </div>

    <template v-else>
      <div v-if="!isPdfMode" class="public-toolbar no-print">
        <button class="btn btn-secondary" type="button" @click="handlePrint">
          <Printer :size="16" aria-hidden="true" />
          Imprimir
        </button>
      </div>
      <PresupuestoDoc :doc="doc" :config="config" />
    </template>
  </div>
</template>

<style scoped>
.public-page {
  min-height: 100vh;
  background: radial-gradient(circle at 50% 0%, rgba(139, 37, 112, 0.04), transparent 240px), var(--page-bg);
  padding: 32px 16px 48px;
}

.public-page.pdf-mode {
  padding: 0;
  background: var(--surface);
}

.public-toolbar {
  max-width: 620px;
  margin: 0 auto 16px;
  display: flex;
  justify-content: flex-end;
}

.public-toolbar .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.public-state {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--ink-muted);
  text-align: center;
  padding: 40px;
}

.public-state svg {
  color: var(--violet-700);
  opacity: 0.45;
  margin-bottom: 6px;
}

.public-state p {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.public-state small { font-size: 12px; }

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--teal-500);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<style>
/* render para PDF (Puppeteer): sin animación de entrada ni decoración de card */
.pdf-mode .preview-doc {
  animation: none;
  border: none;
  box-shadow: none;
  border-radius: 0;
}

@page {
  size: A4;
  margin: 14mm;
}

@media print {
  .no-print { display: none !important; }

  .public-page {
    padding: 0;
    background: #fff;
    min-height: auto;
  }

  .public-page .preview-doc {
    animation: none;
    border: none;
    box-shadow: none;
    border-radius: 0;
    max-width: none;
    padding: 0;
  }
}
</style>
