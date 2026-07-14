import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, post, put, patch, del } from '@/shared/api/client'
import type { Presupuesto, PaginationResult } from '@/types'

export const usePresupuestosStore = defineStore('presupuestos', () => {
  const data = ref<Presupuesto[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const res = await get<PaginationResult<Presupuesto>>('/presupuestos', { page: 1, limit: 1000 })
      data.value = res.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    await del('/presupuestos', id)
    data.value = data.value.filter(p => p.id !== id)
  }

  function upsert(presupuesto: Presupuesto) {
    const idx = data.value.findIndex(p => p.id === presupuesto.id)
    if (idx >= 0) {
      data.value[idx] = presupuesto
    } else {
      data.value.unshift(presupuesto)
    }
  }

  async function create(payload: any): Promise<Presupuesto> {
    const res = await post<Presupuesto>('/presupuestos', payload)
    upsert(res)
    return res
  }

  async function update(id: number, payload: any): Promise<Presupuesto> {
    const res = await put<Presupuesto>('/presupuestos', id, payload)
    upsert(res)
    return res
  }

  async function updateStatus(id: number, estado: string): Promise<Presupuesto> {
    const res = await patch<Presupuesto>('/presupuestos', `${id}/estado`, { estado })
    upsert(res)
    return res
  }

  return {
    data,
    loading,
    hasFetched,
    lastFetched,
    fetch,
    remove,
    upsert,
    create,
    update,
    updateStatus,
  }
})
