import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { Transaccion, OrdenImprenta, DistribucionGanancia, FinanzasKPIs } from './types'

export const useFinanzasStore = defineStore('finanzas', () => {
  const transacciones = ref<Transaccion[]>([])
  const ordenes = ref<OrdenImprenta[]>([])
  const distribucion = ref<DistribucionGanancia[]>([])
  const kpis = ref<FinanzasKPIs>({ ingresos: 0, egresos: 0, utilidad: 0 })
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)
  const currentPeriod = ref<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  })

  async function fetch(period?: { year: number; month: number }) {
    const p = period || currentPeriod.value
    currentPeriod.value = p
    loading.value = !hasFetched.value
    try {
      const [transRes, ordRes, distRes] = await Promise.all([
        api.fetchTransacciones(p.month, p.year),
        api.fetchOrdenes(p.month, p.year),
        api.fetchDistribucion(),
      ])
      transacciones.value = transRes.data
      ordenes.value = ordRes.data
      distribucion.value = distRes.data
      kpis.value = transRes.kpis || { ingresos: 0, egresos: 0, utilidad: 0 }
      hasFetched.value = true
      lastFetched.value = Date.now()
      return { transacciones: transRes.data, ordenes: ordRes.data, distribucion: distRes.data, kpis: kpis.value }
    } finally {
      loading.value = false
    }
  }

  async function removeTransaccion(id: number) {
    await api.deleteTransaccion(id)
    transacciones.value = transacciones.value.filter(t => t.id !== id)
  }

  async function createTransaccion(payload: any): Promise<Transaccion> {
    const res = await api.createTransaccion(payload)
    upsertTransaccion(res)
    return res
  }

  async function updateTransaccion(id: number, payload: any): Promise<Transaccion> {
    const res = await api.updateTransaccion(id, payload)
    upsertTransaccion(res)
    return res
  }

  function upsertTransaccion(transaccion: Transaccion) {
    const idx = transacciones.value.findIndex(t => t.id === transaccion.id)
    if (idx >= 0) {
      transacciones.value[idx] = transaccion
    } else {
      transacciones.value.unshift(transaccion)
    }
  }

  async function removeOrden(id: number) {
    await api.deleteOrden(id)
    ordenes.value = ordenes.value.filter(o => o.id !== id)
  }

  async function createOrden(payload: any): Promise<OrdenImprenta> {
    const res = await api.createOrden(payload)
    upsertOrden(res)
    return res
  }

  async function updateOrden(id: number, payload: any): Promise<OrdenImprenta> {
    const res = await api.updateOrden(id, payload)
    upsertOrden(res)
    return res
  }

  function upsertOrden(orden: OrdenImprenta) {
    const idx = ordenes.value.findIndex(o => o.id === orden.id)
    if (idx >= 0) {
      ordenes.value[idx] = orden
    } else {
      ordenes.value.unshift(orden)
    }
  }

  return {
    transacciones,
    ordenes,
    distribucion,
    kpis,
    loading,
    hasFetched,
    lastFetched,
    currentPeriod,
    fetch,
    removeTransaccion,
    upsertTransaccion,
    createTransaccion,
    updateTransaccion,
    removeOrden,
    upsertOrden,
    createOrden,
    updateOrden,
  }
})
