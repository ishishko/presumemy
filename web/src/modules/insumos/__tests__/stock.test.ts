import { describe, it, expect } from 'vitest'
import { getNivel, nivelColapsado, getFillPct } from '../stock'

describe('getNivel', () => {
  it('identifica sin_unidades cuando stock es 0 o menor', () => {
    expect(getNivel(0, 10)).toBe('sin_unidades')
    expect(getNivel(-1, 10)).toBe('sin_unidades')
  })

  it('identifica critico cuando stock es <= 20% del minimo', () => {
    expect(getNivel(2, 10)).toBe('critico')
    expect(getNivel(1.5, 10)).toBe('critico')
  })

  it('identifica bajo cuando stock es menor al minimo pero > 20%', () => {
    expect(getNivel(5, 10)).toBe('bajo')
    expect(getNivel(9, 10)).toBe('bajo')
  })

  it('identifica ok cuando stock es mayor o igual al minimo', () => {
    expect(getNivel(10, 10)).toBe('ok')
    expect(getNivel(12, 10)).toBe('ok')
  })

  it('maneja minimo igual a 0', () => {
    expect(getNivel(0, 0)).toBe('sin_unidades')
    expect(getNivel(5, 0)).toBe('ok')
  })
})

describe('nivelColapsado', () => {
  it('colapsa sin_unidades a critico', () => {
    expect(nivelColapsado('sin_unidades')).toBe('critico')
  })

  it('mantiene otros estados intactos', () => {
    expect(nivelColapsado('critico')).toBe('critico')
    expect(nivelColapsado('bajo')).toBe('bajo')
    expect(nivelColapsado('ok')).toBe('ok')
  })
})

describe('getFillPct', () => {
  it('calcula porcentaje relativo correcto', () => {
    expect(getFillPct(5, 10)).toBe(50)
  })

  it('limita a un minimo de 2% para visibilidad', () => {
    expect(getFillPct(0.1, 10)).toBe(2)
  })

  it('limita a un maximo de 100%', () => {
    expect(getFillPct(15, 10)).toBe(100)
  })

  it('maneja minimo de 0', () => {
    expect(getFillPct(0, 0)).toBe(0)
    expect(getFillPct(5, 0)).toBe(100)
  })
})
