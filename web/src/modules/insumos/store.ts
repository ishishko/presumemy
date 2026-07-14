import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, post, put, del, delWithBody } from '@/shared/api/client'
import type { Insumo, CategoriaInsumo, PaginationResult } from '@/types'

export const useInsumosStore = defineStore('insumos', () => {
  const data = ref<Insumo[]>([])
  const categorias = ref<CategoriaInsumo[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const [insumosRes, catsRes] = await Promise.all([
        get<PaginationResult<Insumo>>('/insumos', { page: 1, limit: 100 }),
        get<{ data: CategoriaInsumo[] }>('/insumos/categorias'),
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

  async function remove(id: number) {
    await del('/insumos', id)
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
    await post<CategoriaInsumo>('/insumos/categorias', { nombre })
    await fetch()
  }

  async function updateCategoria(id: number, nombre: string) {
    await put<CategoriaInsumo>('/insumos/categorias', id, { nombre })
    await fetch()
  }

  async function removeCategoria(id: number, reasignarA?: number) {
    await delWithBody('/insumos/categorias', id, { reasignarA })
    await fetch()
  }

  async function create(payload: any): Promise<Insumo> {
    const res = await post<Insumo>('/insumos', payload)
    upsert(res)
    return res
  }

  async function update(id: number, payload: any): Promise<Insumo> {
    const res = await put<Insumo>('/insumos', id, payload)
    upsert(res)
    return res
  }

  return {
    data,
    categorias,
    loading,
    hasFetched,
    lastFetched,
    fetch,
    remove,
    upsert,
    create,
    update,
    createCategoria,
    updateCategoria,
    removeCategoria,
  }
})
