import { get } from '@/shared/api/client'
import type { SearchResult } from './types'

/**
 * Realiza la búsqueda de todas las entidades en el ERP con cancelación de request.
 * 
 * @param q Término de búsqueda
 * @param signal AbortSignal para cancelar la petición en vuelo
 */
export function searchAll(q: string, signal?: AbortSignal): Promise<{ data: SearchResult[] }> {
  return get<{ data: SearchResult[] }>('/search', { q }, { signal })
}
