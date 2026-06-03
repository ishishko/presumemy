<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { get, del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import ClienteDrawer from '@/components/drawers/ClienteDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import type { Cliente, ClienteContacto, PaginationResult } from '@/types'

const clientes = ref<Cliente[]>([])
const loading = ref(true)
const error = ref('')

const showDrawer = ref(false)
const editingCliente = ref<Cliente | null>(null)
const showConfirmDelete = ref(false)
const deletingCliente = ref<Cliente | null>(null)

const { toast } = useToast()

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

async function loadClientes() {
  try {
    const res = await get<PaginationResult<Cliente>>('/clientes', { page: 1, limit: 100 })
    clientes.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar clientes'
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  editingCliente.value = null
  showDrawer.value = true
}

function handleEdit(cliente: Cliente) {
  editingCliente.value = cliente
  showDrawer.value = true
}

function handleSaved() {
  loadClientes()
}

function handleDeleteClick(cliente: Cliente) {
  deletingCliente.value = cliente
  showConfirmDelete.value = true
}

async function handleDeleteConfirm() {
  if (!deletingCliente.value) return
  const c = deletingCliente.value
  try {
    await del('/clientes', c.id)
    toast('Cliente eliminado', 'info', async () => {
      await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: true }),
      })
      loadClientes()
    })
    clientes.value = clientes.value.filter(x => x.id !== c.id)
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingCliente.value = null
}

onMounted(loadClientes)

watch(createTrigger, (val) => {
  if (val === 'clientes') {
    handleCreate()
    createTrigger.value = null
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
              <th style="width: 80px"></th>
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
              <td>
                <div class="row-actions">
                  <button class="row-action-btn" @click="handleEdit(c)" title="Editar">
                    <Pencil :size="14" />
                  </button>
                  <button class="row-action-btn row-action-danger" @click="handleDeleteClick(c)" title="Eliminar">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="clientes.length === 0">
              <td colspan="6" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
                Sin clientes registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <ClienteDrawer
    :open="showDrawer"
    :cliente="editingCliente"
    @close="showDrawer = false"
    @saved="handleSaved"
  />

  <ConfirmDialog
    :open="showConfirmDelete"
    title="Eliminar cliente"
    :message="`Vas a eliminar a ${deletingCliente?.nombre}. Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="handleDeleteConfirm"
    @cancel="showConfirmDelete = false; deletingCliente = null"
  />
</template>

<style scoped>
.row-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.row-action-btn {
  background: transparent;
  border: 0;
  color: var(--ink-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  transition: background 120ms ease, color 120ms ease;
}

.row-action-btn:hover { background: var(--page-bg); color: var(--ink); }
.row-action-danger:hover { background: var(--coral-50); color: var(--coral-500); }
</style>
