import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { Cliente } from './types'

export const useClientesStore = defineStore('clientes', () => {
  const data = ref<Cliente[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const res = await api.fetchClientes()
      data.value = res.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    await api.deleteCliente(id)
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

  async function create(payload: any): Promise<Cliente> {
    const res = await api.createCliente(payload)
    upsert(res)
    return res
  }

  async function update(id: number, payload: any): Promise<Cliente> {
    const res = await api.updateCliente(id, payload)
    upsert(res)
    return res
  }

  return { data, loading, hasFetched, lastFetched, fetch, remove, upsert, create, update }
})
