import { ref, watch, onUnmounted } from 'vue'
import { get } from '@/services/api'

export interface SearchResult {
  tipo: 'insumo' | 'producto' | 'cliente' | 'presupuesto'
  id: number
  codigo: string
  titulo: string
  subtitulo: string
}

export function useGlobalSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  let timer: any = null
  let abortController: AbortController | null = null

  const performSearch = async (val: string) => {
    if (abortController) {
      abortController.abort()
    }

    const trimmed = val.trim()
    if (trimmed.length < 2) {
      results.value = []
      loading.value = false
      return
    }

    loading.value = true
    abortController = new AbortController()

    try {
      const res = await get<{ data: SearchResult[] }>(
        '/search',
        { q: trimmed },
        { signal: abortController.signal }
      )
      results.value = res.data
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err)
        results.value = []
      }
    } finally {
      if (abortController && !abortController.signal.aborted) {
        loading.value = false
      }
    }
  }

  watch(query, (newVal) => {
    if (timer) {
      clearTimeout(timer)
    }

    const trimmed = newVal.trim()
    if (trimmed.length < 2) {
      results.value = []
      loading.value = false
      return
    }

    loading.value = true
    timer = setTimeout(() => {
      performSearch(newVal)
    }, 300)
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    if (abortController) abortController.abort()
  })

  return {
    query,
    results,
    loading,
  }
}
