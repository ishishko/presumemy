<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Pencil, Trash2 } from '@lucide/vue'
import { del } from '@/services/api'
import { createTrigger } from '@/composables/useCreateTrigger'
import { useClientesStore } from '@/stores/clientes'
import ClienteDrawer from '@/components/drawers/ClienteDrawer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import type { Cliente, ClienteContacto } from '@/types'

const route = useRoute()
const store = useClientesStore()
const { toast } = useToast()

const showDrawer = ref(false)
const editingCliente = ref<Cliente | null>(null)
const showConfirmDelete = ref(false)
const deletingCliente = ref<Cliente | null>(null)

const showLoading = computed(() => !store.hasFetched)

const canalColors: Record<string, string> = {
  instagram: 'var(--canal-instagram)',
  whatsapp: 'var(--canal-whatsapp)',
  mail: 'var(--canal-mail)',
  otros: 'var(--canal-otros)',
}

const canalLabels: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
  otros: 'Otros',
}

const avatarPalette = [
  { bg: 'var(--lavender)', ink: 'var(--violet-700)' },
  { bg: 'var(--teal-100)', ink: 'var(--canal-mail)' },
  { bg: 'var(--pink-soft)', ink: 'var(--violet-700)' },
  { bg: 'var(--mint)', ink: 'var(--green-700)' },
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
    await store.fetch()
  } catch (e: any) {
    if (store.data.length === 0) {
      toast(e.message || 'Error al cargar clientes', 'error')
    }
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

function handleSaved(cliente: Cliente) {
  store.upsert(cliente)
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
    store.remove(c.id)
    toast('Cliente eliminado', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingCliente.value = null
}

onMounted(loadClientes)

watch(
  [() => route.query.edit, () => store.hasFetched],
  ([editVal, hasFetched]) => {
    if (editVal && hasFetched) {
      const c = store.data.find(item => item.codigo === editVal || String(item.id) === editVal)
      if (c) {
        handleEdit(c)
      }
    }
  },
  { immediate: true }
)

watch(createTrigger, (val) => {
  if (val === 'clientes') {
    handleCreate()
    createTrigger.value = null
  }
})
</script>

<template>
  <div class="content">
    <div v-if="showLoading" class="card"><p>Cargando clientes...</p></div>
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
          <tr v-for="c in store.data" :key="c.id">
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
          <tr v-if="store.data.length === 0">
            <td colspan="6" style="text-align: center; color: var(--ink-muted); padding: 24px 0">
              Sin clientes registrados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ClienteDrawer
      :open="showDrawer"
      :cliente="editingCliente"
      @close="showDrawer = false"
      @saved="handleSaved"
    />
    </template>
  </div>

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
