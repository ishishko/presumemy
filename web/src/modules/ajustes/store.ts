import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { ConfiguracionNegocio } from './types'
import type { DistribucionGanancia } from '@/modules/finanzas/types'

export const useAjustesStore = defineStore('ajustes', () => {
  const config = ref<ConfiguracionNegocio | null>(null)
  const socios = ref<DistribucionGanancia[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)

  /** Configuración del negocio: la consumen varias vistas, se cachea. */
  async function fetchConfig(force = false): Promise<ConfiguracionNegocio | null> {
    if (config.value && !force) return config.value
    const res = await api.fetchConfiguracion()
    config.value = res.data
    return config.value
  }

  async function fetchAll() {
    loading.value = !hasFetched.value
    try {
      const [configRes, sociosRes] = await Promise.all([
        api.fetchConfiguracion(),
        api.fetchDistribucion(),
      ])
      config.value = configRes.data
      socios.value = sociosRes.data
      hasFetched.value = true
      return { config: configRes.data, socios: sociosRes.data }
    } finally {
      loading.value = false
    }
  }

  async function saveConfig(payload: Partial<ConfiguracionNegocio>) {
    await api.updateConfiguracion(payload)
    if (config.value) {
      config.value = { ...config.value, ...payload }
    }
  }

  async function saveDistribucion(items: Array<{ id: number; porcentaje: number }>) {
    await api.updateDistribucion(items)
  }

  return { config, socios, loading, hasFetched, fetchConfig, fetchAll, saveConfig, saveDistribucion }
})
