import { get } from '@/shared/api/client'
import type { SearchResult } from './types'

/** Único punto del módulo que habla HTTP. */
export function search(q: string, signal?: AbortSignal) {
  return get<{ data: SearchResult[] }>('/search', { q }, { signal })
}
