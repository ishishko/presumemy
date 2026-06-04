import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get } from '@/services/api'
import type { Presupuesto, PaginationResult } from '@/types'

export const usePresupuestosStore = defineStore('presupuestos', () => {
  const data = ref<Presupuesto[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const res = await get<PaginationResult<Presupuesto>>('/presupuestos', { page: 1, limit: 100 })
      data.value = res.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return res.data
    } finally {
      loading.value = false
    }
  }

  function remove(id: number) {
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

  return { data, loading, hasFetched, lastFetched, fetch, remove, upsert }
})
