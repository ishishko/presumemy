import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { Presupuesto } from './types'

export const usePresupuestosStore = defineStore('presupuestos', () => {
  const data = ref<Presupuesto[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const res = await api.fetchPresupuestos()
      data.value = res.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    await api.deletePresupuesto(id)
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
    const res = await api.createPresupuesto(payload)
    upsert(res)
    return res
  }

  async function update(id: number, payload: any): Promise<Presupuesto> {
    const res = await api.updatePresupuesto(id, payload)
    upsert(res)
    return res
  }

  async function updateStatus(id: number, estado: string): Promise<Presupuesto> {
    const res = await api.updateEstado(id, estado)
    upsert(res)
    return res
  }

  /** Detalle completo (incluye líneas y token público). */
  async function fetchById(id: number): Promise<Presupuesto> {
    const res = await api.fetchPresupuesto(id)
    upsert(res.data)
    return res.data
  }

  async function getPdfUrl(id: number): Promise<string> {
    const res = await api.fetchPdfUrl(id)
    return res.data.url
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
    fetchById,
    getPdfUrl,
  }
})
