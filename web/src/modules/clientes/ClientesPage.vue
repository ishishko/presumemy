<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { createTrigger } from '@/shared/lib/createTrigger'
import { useClientesStore } from './store'
import { formatMoney } from '@/shared/lib/format'
import ClienteDrawer from './components/ClienteDrawer.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import DataTable from '@/shared/ui/DataTable.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import { useToast } from '@/shared/lib/useToast'
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
  instagram: 'bg-[#E1306C]',
  whatsapp: 'bg-[#25D366]',
  mail: 'bg-violet-600',
  otros: 'bg-ink-muted',
}

const canalLabels: Record<string, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  mail: 'Mail',
  otros: 'Otros',
}

const avatarPalette = [
  { bg: 'bg-violet-50 text-violet-700' },
  { bg: 'bg-teal-50 text-teal-700' },
  { bg: 'bg-rose-50 text-rose-750' },
  { bg: 'bg-teal-100 text-teal-800' },
  { bg: 'bg-violet-100 text-violet-850' },
]

function getAvatarClass(name: string): string {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarPalette.length
  return avatarPalette[idx].bg
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function money(v: number): string {
  return formatMoney(v)
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
    await store.remove(c.id)
    toast('Cliente eliminado', 'info')
  } catch (e: any) {
    toast(e.message || 'Error al eliminar', 'error')
  }
  showConfirmDelete.value = false
  deletingCliente.value = null
}

const columns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'codigo', label: 'Código', width: '100px' },
  { key: 'ultimoPedido', label: 'Último pedido', width: '140px' },
  { key: 'pedidos', label: 'Pedidos', align: 'right' as const, width: '100px' },
  { key: 'totalGastado', label: 'Total facturado', align: 'right' as const, width: '160px' },
  { key: 'acciones', label: '', width: '80px' }
]

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
  <div class="w-full">
    <div v-if="showLoading" class="border border-border rounded-lg bg-surface p-6">
      <p class="text-14 text-ink-muted">Cargando clientes...</p>
    </div>
    <template v-else>
      <DataTable
        :columns="columns"
        :rows="store.data"
        empty-text="Sin clientes registrados."
      >
        <template #row="{ item: c }">
          <td class="px-4 py-3.5 align-middle" @dblclick="handleEdit(c)">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-12 select-none shrink-0"
                :class="getAvatarClass(c.nombre)"
              >
                {{ getInitials(c.nombre) }}
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-13 text-ink font-medium">{{ c.nombre }}</span>
                <span v-if="principalContact(c)" class="text-11 text-ink-muted flex items-center gap-1.5 mt-0.5">
                  <span
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="[canalColors[principalContact(c)!.canal] || 'bg-ink-muted']"
                  />
                  <span>{{ canalLabels[principalContact(c)!.canal] || principalContact(c)!.canal }}:</span>
                  <span class="font-mono">{{ principalContact(c)!.valor }}</span>
                </span>
              </div>
            </div>
          </td>
          <td class="px-4 py-3.5 align-middle text-13 font-mono text-ink-muted select-none" @dblclick="handleEdit(c)">
            {{ c.codigo }}
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink-muted select-none" @dblclick="handleEdit(c)">
            —
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink text-right tabular-nums select-none" @dblclick="handleEdit(c)">
            {{ c.totalPedidos || 0 }}
          </td>
          <td class="px-4 py-3.5 align-middle text-13 text-ink font-medium text-right tabular-nums select-none" @dblclick="handleEdit(c)">
            {{ money(c.totalGastado || 0) }}
          </td>
          <td class="px-4 py-3.5 align-middle w-[80px]">
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
