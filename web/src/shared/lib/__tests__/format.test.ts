import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate } from '../format'

describe('formatMoney', () => {
  it('formatea montos con 2 decimales por defecto', () => {
    expect(formatMoney(1250)).toBe('$ 1,250.00')
    expect(formatMoney(1250.55)).toBe('$ 1,250.55')
    expect(formatMoney(0)).toBe('$ 0.00')
  })

  it('formatea montos con el sufijo MXN', () => {
    expect(formatMoney(1250, { mxn: true })).toBe('$ 1,250.00 MXN')
    expect(formatMoney(0, { mxn: true })).toBe('$ 0.00 MXN')
  })

  it('permite personalizar la cantidad de decimales', () => {
    expect(formatMoney(1250.456, { decimals: 0 })).toBe('$ 1,250')
    expect(formatMoney(1250.4, { decimals: 1 })).toBe('$ 1,250.4')
  })
})

describe('formatDate', () => {
  it('formatea fechas en estilo short por defecto', () => {
    const date = new Date(2026, 5, 25) // 25 de junio de 2026 (mes 0-indexado)
    expect(formatDate(date)).toMatch(/25\s+jun\s+2026/i)
  })

  it('formatea fechas en estilo long', () => {
    const date = new Date(2026, 5, 25)
    expect(formatDate(date, 'long')).toMatch(/25\s+de\s+junio\s+de\s+2026/i)
  })

  it('formatea fechas en estilo weekday', () => {
    const date = new Date(2026, 5, 25) // Jueves
    expect(formatDate(date, 'weekday')).toMatch(/(jue|jue\.)\s+25\s+(de\s+)?jun/i)
  })

  it('retorna string vacío para fechas inválidas', () => {
    expect(formatDate('fecha-invalida')).toBe('')
  })
})
