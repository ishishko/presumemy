import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api'
import type { Producto, CategoriaProducto } from './types'

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
        api.fetchProductos(),
        api.fetchCategorias(),
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

  /** Categorías sueltas: las necesita el overlay de detalle sin recargar la grilla. */
  async function fetchCategorias() {
    const catsRes = await api.fetchCategorias()
    categorias.value = catsRes.data
    return catsRes.data
  }

  async function remove(id: number) {
    await api.deleteProducto(id)
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

  async function toggleFavorito(id: number): Promise<Producto> {
    const res = await api.toggleFavorito(id)
    upsert(res)
    return res
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

  async function create(payload: any): Promise<Producto> {
    const res = await api.createProducto(payload)
    upsert(res)
    return res
  }

  async function update(id: number, payload: any): Promise<Producto> {
    const res = await api.updateProducto(id, payload)
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
    fetchCategorias,
    remove,
    upsert,
    create,
    update,
    toggleFavorito,
    createCategoria,
    updateCategoria,
    removeCategoria,
  }
})
