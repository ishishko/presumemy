import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate } from '../format'

describe('formatMoney', () => {
  it('should format money to es-AR locale format by default', () => {
    // 1250.50 -> $ 1.250,50
    expect(formatMoney(1250.5)).toBe('$ 1.250,50')
    // 0 -> $ 0,00
    expect(formatMoney(0)).toBe('$ 0,00')
  })

  it('should format money with custom decimal places', () => {
    expect(formatMoney(1250.5, { decimals: 0 })).toBe('$ 1.251')
    expect(formatMoney(1250.5, { decimals: 3 })).toBe('$ 1.250,500')
  })

  it('should append ARS suffix when ars option is true', () => {
    expect(formatMoney(1250.5, { ars: true })).toBe('$ 1.250,50 ARS')
    expect(formatMoney(0, { ars: true })).toBe('$ 0,00 ARS')
  })
})

describe('formatDate', () => {
  it('should format dates to es-AR short format by default', () => {
    const date = new Date('2026-06-25T12:00:00')
    // 25 jun 2026 (or similar depending on platform, but should match es-AR outputs)
    const formatted = formatDate(date)
    expect(formatted).toContain('25')
    expect(formatted).toContain('jun')
    expect(formatted).toContain('2026')
  })

  it('should format dates to es-AR long format', () => {
    const date = new Date('2026-06-25T12:00:00')
    const formatted = formatDate(date, 'long')
    expect(formatted).toContain('25')
    expect(formatted).toContain('junio')
    expect(formatted).toContain('2026')
  })
})
