import { defineStore } from 'pinia'
import { ref } from 'vue'
import { get, post, put, delWithBody } from '@/services/api'
import type { Producto, CategoriaProducto, PaginationResult } from '@/types'

export const useProductosStore = defineStore('productos', () => {
  const data = ref<Producto[]>([])
  const categorias = ref<CategoriaProducto[]>([])
  const loading = ref(false)
  const hasFetched = ref(false)
  const lastFetched = ref<number>(0)

  async function fetch() {
    loading.value = !hasFetched.value
    try {
      const [prodRes, catsRes] = await Promise.all([
        get<PaginationResult<Producto>>('/productos', { page: 1, limit: 100 }),
        get<{ data: CategoriaProducto[] }>('/productos/categorias'),
      ])
      data.value = prodRes.data
      categorias.value = catsRes.data
      hasFetched.value = true
      lastFetched.value = Date.now()
      return { productos: prodRes.data, categorias: catsRes.data }
    } finally {
      loading.value = false
    }
  }

  function remove(id: number) {
    data.value = data.value.filter(p => p.id !== id)
  }

  function upsert(producto: Producto) {
    const idx = data.value.findIndex(p => p.id === producto.id)
    if (idx >= 0) {
      data.value[idx] = producto
    } else {
      data.value.unshift(producto)
    }
  }

  async function createCategoria(nombre: string) {
    await post<CategoriaProducto>('/productos/categorias', { nombre })
    await fetch()
  }

  async function updateCategoria(id: number, nombre: string) {
    await put<CategoriaProducto>('/productos/categorias', id, { nombre })
    await fetch()
  }

  async function removeCategoria(id: number, reasignarA?: number) {
    await delWithBody('/productos/categorias', id, { reasignarA })
    await fetch()
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
    createCategoria,
    updateCategoria,
    removeCategoria,
  }
})
