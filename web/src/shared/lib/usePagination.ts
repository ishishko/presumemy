import { ref, computed, watch } from 'vue'

export function usePagination<T>(items: { value: T[] } | (() => T[]), initialPageSize = 10) {
  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)

  const rawItems = computed(() => {
    if (typeof items === 'function') {
      return items()
    }
    return items.value
  })

  const totalItems = computed(() => rawItems.value.length)

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return rawItems.value.slice(start, end)
  })

  const startIndex = computed(() => {
    if (totalItems.value === 0) return 0
    return (currentPage.value - 1) * pageSize.value + 1
  })

  const endIndex = computed(() => {
    return Math.min(currentPage.value * pageSize.value, totalItems.value)
  })

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  // Reset to first page when items change
  watch(totalItems, () => {
    currentPage.value = 1
  })

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
    prevPage,
    nextPage,
    goToPage,
  }
}
