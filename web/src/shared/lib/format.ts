/**
 * Formatea un valor numérico a un formato de moneda consistente.
 * Formato base: $ 1.250,00
 * Con ars = true: $ 1.250,00 ARS
 * 
 * @param value Valor numérico a formatear
 * @param opts Opciones de formateo (sufijo ARS, cantidad de decimales)
 */
export function formatMoney(value: number, opts: { ars?: boolean; decimals?: number } = {}): string {
  const decimals = opts.decimals !== undefined ? opts.decimals : 2
  const n = Number(value) || 0
  const base = `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  return opts.ars ? `${base} ARS` : base
}

/**
 * Formatea una fecha o string de fecha a un formato consistente en español es-AR.
 * 
 * @param value Objeto Date o string de fecha
 * @param style Estilo de formato:
 *   - 'short': "25 jun. 2026" (por defecto para tablas)
 *   - 'long': "25 de junio de 2026" (para documentos)
 *   - 'weekday': "jue., 25 jun." (para validez rápida)
 *   - 'time': "25 jun., 18:48" (para guardados recientes)
 */
export function formatDate(value: string | Date, style: 'short' | 'long' | 'weekday' | 'time' = 'short'): string {
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return ''

  if (style === 'long') {
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  }
  if (style === 'weekday') {
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
  }
  if (style === 'time') {
    return d.toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

