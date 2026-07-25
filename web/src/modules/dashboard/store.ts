import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { DashboardStats } from './types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const res = await api.fetchStats()
      stats.value = res.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return res.data
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, hasFetched, lastFetched, fetch }
})
