import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, put } from '@/shared/api/client'
import type { ConfiguracionNegocio, DistribucionGanancia } from '@/types'

export const useAjustesStore = defineStore('ajustes', () => {
  const config = ref<ConfiguracionNegocio | null>(null)
  const socios = ref<DistribucionGanancia[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const [configRes, sociosRes] = await Promise.all([
        get<{ data: ConfiguracionNegocio }>('/ajustes/configuracion'),
        get<{ data: DistribucionGanancia[] }>('/ajustes/distribucion'),
      ])
      config.value = configRes.data
      socios.value = sociosRes.data
      hasFetched.value = true
    } finally {
      loading.value = false
    }
  }

  async function saveConfig(data: Partial<ConfiguracionNegocio>) {
    const res = await put<ConfiguracionNegocio>('/ajustes/configuracion', 1, data)
    config.value = res
    return res
  }

  async function saveSocios(items: { id: number; porcentaje: number }[]) {
    const res = await put<DistribucionGanancia[]>('/ajustes/distribucion', 0, { items })
    socios.value = res
    return res
  }

  return {
    config,
    socios,
    loading,
    hasFetched,
    fetch,
    saveConfig,
    saveSocios,
  }
})
