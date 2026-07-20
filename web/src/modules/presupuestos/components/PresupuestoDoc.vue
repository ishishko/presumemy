<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '@/shared/lib/format'
import type { ConfiguracionNegocio } from '@/types'

export interface PresupuestoDocLine {
  id?: number | string
  producto: string
  qty: string
  price: string
}

export interface PresupuestoDocData {
  folio: string
  cliente: string
  tematica?: string
  fFiesta?: string
  fEntrega?: string
  envio: 'retira' | 'envio'
  lugar?: string
  pago?: string
  sena: number
  resto: number
  lines: PresupuestoDocLine[]
  subtotal: number
  total: number
  notes?: string
  includeNotes: boolean
  /** fecha del documento (ISO); por defecto, hoy */
  fecha?: string
}

const props = defineProps<{
  doc: PresupuestoDocData
  config?: Pick<ConfiguracionNegocio, 'nombre' | 'logoUrl' | 'contactoCanal' | 'contactoValor' | 'moneda'> | null
}>()

const docDate = computed(() => {
  const d = props.doc.fecha ? new Date(props.doc.fecha) : new Date()
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
})

const negocio = computed(() => props.config?.nombre || 'MemyDeni')

const contactoLinea = computed(() => {
  if (props.config?.contactoValor) {
    return props.config.contactoCanal
      ? `${props.config.contactoCanal} · ${props.config.contactoValor}`
      : props.config.contactoValor
  }
  return 'hola@memydeni.mx · +52 55 1234 5678'
})

function money(n: number): string {
  return formatMoney(n)
}

function niceDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="preview-doc">
    <header class="doc-head">
      <img :src="config?.logoUrl || '/memydeni-logo.png'" :alt="negocio" />
      <div class="doc-meta">
        <div class="folio">{{ doc.folio }}</div>
        <div class="text-hint">{{ docDate }}</div>
      </div>
    </header>

    <div class="doc-customer">
      <div class="who-block">
        <small>Para</small>
        <div class="who">{{ doc.cliente || '—' }}</div>
        <div v-if="doc.tematica" class="text-hint">Temática · {{ doc.tematica }}</div>
      </div>
      <div class="doc-dates">
        <div v-if="doc.fFiesta">
          <small>Fiesta</small>
          <span>{{ niceDate(doc.fFiesta) }}</span>
        </div>
        <div v-if="doc.fEntrega">
          <small>Entrega</small>
          <span>{{ niceDate(doc.fEntrega) }}</span>
        </div>
      </div>
    </div>

    <table v-if="doc.lines.length > 0" class="doc-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th class="num">Cant.</th>
          <th class="num">Precio</th>
          <th class="num">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(l, i) in doc.lines" :key="l.id ?? i">
          <td>{{ l.producto }}</td>
          <td class="num">{{ l.qty }}</td>
          <td class="num">{{ money(parseFloat(l.price)) }}</td>
          <td class="num">{{ money((parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0)) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="doc-empty-rows">Sin productos aún.</div>

    <div class="doc-totals">
      <div class="r"><span>Subtotal</span><span class="num">{{ money(doc.subtotal) }}</span></div>
      <div class="r big"><span>Total</span><span class="num">{{ money(doc.total) }}</span></div>
      <div v-if="doc.sena > 0" class="doc-pay">
        <div class="r small">
          <span>Seña{{ doc.pago ? ` (${doc.pago})` : '' }}</span>
          <span class="num">{{ money(doc.sena) }}</span>
        </div>
        <div class="r small">
          <span>Resto a pagar</span>
          <span class="num">{{ money(doc.resto) }}</span>
        </div>
      </div>
    </div>

    <div class="doc-grid">
      <div class="doc-block">
        <small>Entrega</small>
        <div class="block-body">
          <template v-if="doc.envio === 'envio'">
            Envío a domicilio<br />
            <span class="text-hint">{{ doc.lugar || '—' }}</span>
          </template>
          <template v-else>Retira en tienda</template>
        </div>
      </div>
      <div class="doc-block">
        <small>Contacto</small>
        <div class="block-body">
          {{ negocio }} · Papelería para fiestas<br />
          <span class="text-hint">{{ contactoLinea }}</span>
        </div>
      </div>
    </div>

    <div v-if="doc.includeNotes && doc.notes" class="doc-notes">
      <small>Notas</small>
      <p>{{ doc.notes }}</p>
    </div>

    <footer class="doc-foot text-hint">
      Precios en {{ config?.moneda || 'ARS' }}. Vigencia 14 días. Gracias por confiar en {{ negocio }}
    </footer>
  </div>
</template>

