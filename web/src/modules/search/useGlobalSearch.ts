import { ref, watch, onUnmounted } from 'vue'
import { searchAll } from './search-api'
import type { SearchResult } from './types'

export function useGlobalSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null

  const isQueryTooShort = (val: string): boolean => {
    return val.trim().length < 2
  }

  const performSearch = async (val: string) => {
    if (abortController) {
      abortController.abort()
    }

    if (isQueryTooShort(val)) {
      results.value = []
      loading.value = false
      return
    }

    loading.value = true
    abortController = new AbortController()

    try {
      const res = await searchAll(val.trim(), abortController.signal)
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

    if (isQueryTooShort(newVal)) {
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
