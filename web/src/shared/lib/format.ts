/**
 * Formatea un valor numérico a un formato de moneda consistente.
 * Formato base: $ 1,250.00
 * Con mxn = true: $ 1,250.00 MXN
 * 
 * @param value Valor numérico a formatear
 * @param opts Opciones de formateo (sufijo MXN, cantidad de decimales)
 */
export function formatMoney(value: number, opts: { mxn?: boolean; decimals?: number } = {}): string {
  const decimals = opts.decimals !== undefined ? opts.decimals : 2
  const base = `$ ${value.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  return opts.mxn ? `${base} MXN` : base
}

/**
 * Formatea una fecha o string de fecha a un formato consistente en español es-MX.
 * 
 * @param value Objeto Date o string de fecha
 * @param style Estilo de formato:
 *   - 'short': "25 jun 2026" (por defecto para tablas)
 *   - 'long': "25 de junio de 2026" (para documentos)
 *   - 'weekday': "jue, 25 jun" (para validez rápida)
 *   - 'time': "25 jun, 18:48" (para guardados recientes)
 */
export function formatDate(value: string | Date, style: 'short' | 'long' | 'weekday' | 'time' = 'short'): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return ''

  if (style === 'long') {
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  }
  if (style === 'weekday') {
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })
  }
  if (style === 'time') {
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
