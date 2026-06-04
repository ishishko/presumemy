import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get } from '@/services/api'
import type { Cliente, PaginationResult } from '@/types'

export const useClientesStore = defineStore('clientes', () => {
  const data = ref<Cliente[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const res = await get<PaginationResult<Cliente>>('/clientes', { page: 1, limit: 100 })
      data.value = res.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return res.data
    } finally {
      loading.value = false
    }
  }

  function remove(id: number) {
    data.value = data.value.filter(c => c.id !== id)
  }

  function upsert(cliente: Cliente) {
    const idx = data.value.findIndex(c => c.id === cliente.id)
    if (idx >= 0) {
      data.value[idx] = cliente
    } else {
      data.value.unshift(cliente)
    }
  }

  return { data, loading, hasFetched, lastFetched, fetch, remove, upsert }
})
