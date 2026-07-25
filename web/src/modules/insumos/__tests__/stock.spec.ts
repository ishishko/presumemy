import { describe, it, expect } from 'vitest'
import { getNivel, getFillPct, NIVEL_META } from '../stock'

describe('getNivel', () => {
  it('sin stock ni mínimo: el insumo no está bajo control de inventario', () => {
    expect(getNivel(0, 0)).toBe('sin_control')
    expect(NIVEL_META.sin_control.label).toBe('Sin control')
    expect(NIVEL_META.sin_control.tone).toBe('ok')
  })

  it('con stock y sin mínimo: siempre OK', () => {
    expect(getNivel(5, 0)).toBe('ok')
    expect(getNivel(0.5, 0)).toBe('ok')
  })

  it('sin stock pero con mínimo cargado: faltante', () => {
    expect(getNivel(0, 10)).toBe('sin_unidades')
  })

  it('mantiene el semáforo cuando hay mínimo', () => {
    expect(getNivel(1, 10)).toBe('critico')
    expect(getNivel(5, 10)).toBe('bajo')
    expect(getNivel(12, 10)).toBe('ok')
  })
})

describe('getFillPct', () => {
  it('sin mínimo la barra va llena, haya o no stock', () => {
    expect(getFillPct(0, 0)).toBe(100)
    expect(getFillPct(5, 0)).toBe(100)
  })

  it('con mínimo mide la proporción y no se pasa de 100', () => {
    expect(getFillPct(5, 10)).toBe(50)
    expect(getFillPct(20, 10)).toBe(100)
  })
})
