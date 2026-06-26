export interface SearchResult {
  tipo: 'insumo' | 'producto' | 'cliente' | 'presupuesto'
  id: number
  codigo: string
  titulo: string
  subtitulo: string
}
