<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '@/services/api'
import type { Producto, CategoriaProducto, PaginationResult } from '@/types'

const productos = ref<Producto[]>([])
const categorias = ref<CategoriaProducto[]>([])
const loading = ref(true)
const error = ref('')

const catFilter = ref('todas')

const filtered = computed(() => {
  if (catFilter.value === 'todas') return productos.value
  return productos.value.filter((p) => p.categoria?.nombre === catFilter.value)
})

function money(v: number): string {
  return `$ ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

onMounted(async () => {
  try {
    const [prodRes, catsRes] = await Promise.all([
      get<PaginationResult<Producto>>('/productos', { page: 1, limit: 100 }),
      get<{ data: CategoriaProducto[] }>('/productos/categorias'),
    ])
    productos.value = prodRes.data
    categorias.value = catsRes.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar productos'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="content">
    <div v-if="loading" class="card"><p>Cargando productos...</p></div>
    <div v-else-if="error" class="card"><p class="err">{{ error }}</p></div>

    <template v-else>
      <div class="pill-row">
        <button
          :class="['pill', catFilter === 'todas' && 'active']"
          @click="catFilter = 'todas'"
        >Todos</button>
        <button
          v-for="c in categorias"
          :key="c.id"
          :class="['pill', catFilter === c.nombre && 'active']"
          @click="catFilter = c.nombre"
        >{{ c.nombre }}</button>
      </div>

      <div v-if="filtered.length === 0" class="prod-empty">
        <p>No hay productos en esta categoría</p>
      </div>

      <div v-else class="prod-grid">
        <div
          v-for="p in filtered"
          :key="p.id"
          class="prod-card"
        >
          <div class="prod-thumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <div class="prod-name">{{ p.nombre }}</div>
          <div class="prod-meta-1">
            <span class="code">{{ p.codigo }}</span>
            <span class="sep" />
            <span>{{ p.categoria?.nombre }}</span>
          </div>
          <div class="prod-foot">
            <span class="stock">Stock: <strong>{{ p.bomLineas?.length || 0 }} insumos</strong></span>
            <span class="price">{{ money(p.precio) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
