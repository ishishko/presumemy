<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '@/services/api'
import type { Cliente, ClienteContacto, PaginationResult } from '@/types'

const clientes = ref<Cliente[]>([])
const loading = ref(true)
const error = ref('')

const canalColors: Record<string, string> = {
  instagram: '#D7548C',
  whatsapp: '#1F8A5B',
  mail: '#2E6F70',
  otros: '#6B6270',
}

const canalLabels: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
  otros: 'Otros',
}

const avatarPalette = [
  { bg: 'var(--lavender)', ink: 'var(--violet-700)' },
  { bg: 'var(--teal-100)', ink: '#2E6F70' },
  { bg: 'var(--pink-soft)', ink: '#8B2570' },
  { bg: 'var(--mint)', ink: '#1F5A3E' },
  { bg: 'var(--violet-100)', ink: 'var(--violet-700)' },
]

function getAvatarPalette(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length
  return avatarPalette[idx]
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const principalContact = (cliente: Cliente): ClienteContacto | undefined => {
  return cliente.contactos?.find((c) => c.esPrincipal) || cliente.contactos?.[0]
}

onMounted(async () => {
  try {
    const res = await get<PaginationResult<Cliente>>('/clientes', { page: 1, limit: 100 })
    clientes.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar clientes'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando clientes...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

    <template v-else>
      <div class="table-wrap">
        <table class="data-table clientes-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th style="width: 100px">Código</th>
              <th style="width: 140px">Último pedido</th>
              <th class="num" style="width: 100px">Pedidos</th>
              <th class="num" style="width: 160px">Total facturado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clientes" :key="c.id">
              <td>
                <div class="clientes-name-cell">
                  <div
                    class="clientes-avatar"
                    :style="{ background: getAvatarPalette(c.nombre).bg, color: getAvatarPalette(c.nombre).ink }"
                  >{{ getInitials(c.nombre) }}</div>
                  <div class="clientes-name-block">
                    <span class="name">{{ c.nombre }}</span>
                    <span v-if="principalContact(c)" class="contact">
                      <span
                        class="canal-dot"
                        :style="{ background: canalColors[principalContact(c)!.canal] || '#6B6270' }"
                      />
                      <span class="canal-lbl">{{ canalLabels[principalContact(c)!.canal] || principalContact(c)!.canal }}</span>
                      <span class="canal-val">{{ principalContact(c)!.valor }}</span>
                    </span>
                  </div>
                </div>
              </td>
              <td><span class="clientes-code">{{ c.codigo }}</span></td>
              <td style="color: var(--ink-muted)">—</td>
              <td class="num" style="font-variant-numeric: tabular-nums">{{ c.totalPedidos || 0 }}</td>
              <td class="num" style="font-weight: 500; font-variant-numeric: tabular-nums">{{ money(c.totalGastado || 0) }}</td>
            </tr>
            <tr v-if="clientes.length === 0">
              <td colspan="5" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
                Sin clientes registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
