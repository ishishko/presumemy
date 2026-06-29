<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ofetch } from 'ofetch'
import { FileX, Printer } from '@lucide/vue'
import PresupuestoDoc, { type PresupuestoDocData } from './components/PresupuestoDoc.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
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
    class="min-h-screen p-8 pb-12"
    :class="isPdfMode ? 'p-0 bg-surface' : ''"
    :style="!isPdfMode ? { background: 'radial-gradient(circle at 50% 0%, rgba(139, 37, 112, 0.04), transparent 240px), var(--color-page-bg)' } : {}"
    :data-doc-ready="!loading ? 'true' : undefined"
  >
    <div v-if="loading" class="min-h-60vh flex flex-col items-center justify-center gap-2.5 text-ink-muted text-center p-10" aria-live="polite">
      <div class="w-5.5 h-5.5 border-2 border-border-strong border-t-teal-500 rounded-full animate-spin" aria-hidden="true"></div>
      <p class="text-14">Cargando presupuesto...</p>
    </div>

    <div v-else-if="notFound || !doc" class="min-h-60vh flex flex-col items-center justify-center gap-2.5 text-ink-muted text-center p-10">
      <FileX :size="44" class="text-violet-700 opacity-45 mb-1.5" aria-hidden="true" />
      <p class="text-15 font-medium text-ink m-0">Este presupuesto no está disponible</p>
      <small class="text-12">El link puede haber expirado o el presupuesto ya no está vigente.</small>
    </div>

    <template v-else>
      <div v-if="!isPdfMode" class="max-w-155 mx-auto mb-4 flex justify-end no-print">
        <BaseButton variant="secondary" type="button" @click="handlePrint">
          <Printer :size="16" aria-hidden="true" />
          Imprimir
        </BaseButton>
      </div>
      <PresupuestoDoc :doc="doc" :config="config" />
    </template>
  </div>
</template>

<style>
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
