<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useClientesStore } from '@/modules/clientes/store'
import { formatMoney } from '@/shared/lib/format'
import ClienteDrawer from './components/ClienteDrawer.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import { useToast } from '@/shared/lib/useToast'
import type { Cliente, ClienteContacto } from './types'

const route = useRoute()
const store = useClientesStore()
const { toast } = useToast()

const showDrawer = ref(false)
const editingCliente = ref<Cliente | null>(null)
const showConfirmDelete = ref(false)
const deletingCliente = ref<Cliente | null>(null)

const showLoading = computed(() => !store.hasFetched)

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
  { bg: '#DBA8CD', ink: '#8B2570' },
  { bg: '#D6F0F1', ink: '#2E6F70' },
  { bg: '#F9C2D2', ink: '#8B2570' },
  { bg: '#D0EADD', ink: '#1B7A4B' },
  { bg: '#ECD8E6', ink: '#8B2570' },
]

function getAvatarPalette(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length
  return avatarPalette[idx]
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

const principalContact = (cliente: Cliente): ClienteContacto | undefined => {
  return cliente.contactos?.find((c) => c.esPrincipal) || cliente.contactos?.[0]
}

const columns = [
  { key: 'nombre', label: 'Cliente' },
  { key: 'codigo', label: 'Código', width: '100px' },
  { key: 'ultimoPedido', label: 'Último pedido', width: '140px' },
  { key: 'pedidos', label: 'Pedidos', align: 'right' as const, width: '100px' },
  { key: 'total', label: 'Total facturado', align: 'right' as const, width: '160px' },
  { key: 'acciones', label: '', width: '80px' }
]

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
    await store.remove(c.id)
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
  <div class="p-6">
    <div v-if="showLoading" class="bg-surface border border-border rounded-lg p-5">
      <p class="text-14 text-ink-muted">Cargando clientes...</p>
    </div>
    <template v-else>
      <DataTable
        :columns="columns"
        :rows="store.data"
        empty-text="Sin clientes registrados."
      >
        <template #row="{ item: c }">
          <td class="px-4 py-3.5 align-middle">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-13 font-medium flex-shrink-0"
                :style="{ background: getAvatarPalette(c.nombre).bg, color: getAvatarPalette(c.nombre).ink }"
              >{{ getInitials(c.nombre) }}</div>
              <div class="flex flex-col gap-0.5">
                <span class="text-14 font-medium text-ink">{{ c.nombre }}</span>
                <span v-if="principalContact(c)" class="flex items-center gap-1.5 text-12 text-ink-muted">
                  <span
                    class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    :style="{ background: canalColors[principalContact(c)!.canal] || '#6B6270' }"
                  />
                  <span>{{ canalLabels[principalContact(c)!.canal] || principalContact(c)!.canal }}</span>
                  <span>{{ principalContact(c)!.valor }}</span>
                </span>
              </div>
            </div>
          </td>
          <td class="px-4 py-3.5 align-middle">
            <span class="font-mono text-12 text-ink-muted">{{ c.codigo }}</span>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink-muted">—</td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink text-right tabular-nums">{{ c.totalPedidos || 0 }}</td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium text-right tabular-nums">{{ formatMoney(c.totalGastado || 0) }}</td>
          <td class="px-4 py-3.5 align-middle">
            <RowActions
              @edit="handleEdit(c)"
              @delete="handleDeleteClick(c)"
            />
          </td>
        </template>
      </DataTable>

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
