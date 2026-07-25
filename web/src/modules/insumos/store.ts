import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { Insumo, CategoriaInsumo, Proveedor } from './types'

export const useInsumosStore = defineStore('insumos', () => {
  const data = ref<Insumo[]>([])
  const categorias = ref<CategoriaInsumo[]>([])
  const proveedores = ref<Proveedor[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const [insumosRes, catsRes] = await Promise.all([
        api.fetchInsumos(),
        api.fetchCategorias(),
      ])
      data.value = insumosRes.data
      categorias.value = catsRes.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return { insumos: insumosRes.data, categorias: catsRes.data }
    } finally {
      loading.value = false
    }
  }

  /** Catálogos que necesita el overlay de detalle (categorías + proveedores). */
  async function fetchCatalogos() {
    const [catsRes, provsRes] = await Promise.all([
      api.fetchCategorias(),
      api.fetchProveedores(),
    ])
    categorias.value = catsRes.data
    proveedores.value = provsRes.data
    return { categorias: catsRes.data, proveedores: provsRes.data }
  }

  async function remove(id: number) {
    await api.deleteInsumo(id)
    data.value = data.value.filter(i => i.id !== id)
  }

  function upsert(insumo: Insumo) {
    const idx = data.value.findIndex(i => i.id === insumo.id)
    if (idx >= 0) {
      data.value[idx] = insumo
    } else {
      data.value.unshift(insumo)
    }
  }

  async function createCategoria(nombre: string) {
    await api.createCategoria(nombre)
    await fetch()
  }

  async function updateCategoria(id: number, nombre: string) {
    await api.updateCategoria(id, nombre)
    await fetch()
  }

  async function removeCategoria(id: number, reasignarA?: number) {
    await api.deleteCategoria(id, reasignarA)
    await fetch()
  }

  async function createProveedor(nombre: string): Promise<Proveedor> {
    const nuevo = await api.createProveedor(nombre)
    proveedores.value.push(nuevo)
    proveedores.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return nuevo
  }

  async function removeProveedor(id: number) {
    await api.deleteProveedor(id)
    proveedores.value = proveedores.value.filter(p => p.id !== id)
  }

  async function create(payload: any): Promise<Insumo> {
    const res = await api.createInsumo(payload)
    upsert(res)
    return res
  }

  async function update(id: number, payload: any): Promise<Insumo> {
    const res = await api.updateInsumo(id, payload)
    upsert(res)
    return res
  }

  return {
    data,
    categorias,
    proveedores,
    loading,
    hasFetched,
    lastFetched,
    fetch,
    fetchCatalogos,
    remove,
    upsert,
    create,
    update,
    createCategoria,
    updateCategoria,
    removeCategoria,
    createProveedor,
    removeProveedor,
  }
})
