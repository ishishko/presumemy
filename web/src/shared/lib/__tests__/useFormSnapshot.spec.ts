import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useFormSnapshot } from '../useFormSnapshot'

describe('useFormSnapshot', () => {
  it('no marca cambios antes de sincronizar', () => {
    const nombre = ref('Caja')
    const { dirty } = useFormSnapshot(() => ({ nombre: nombre.value }))
    expect(dirty.value).toBe(false)
  })

  it('marca cambios solo cuando el formulario difiere de lo sincronizado', () => {
    const nombre = ref('Caja')
    const { dirty, sincronizar } = useFormSnapshot(() => ({ nombre: nombre.value }))

    sincronizar()
    expect(dirty.value).toBe(false)

    nombre.value = 'Caja grande'
    expect(dirty.value).toBe(true)

    nombre.value = 'Caja'
    expect(dirty.value).toBe(false)
  })

  it('vuelve a limpio tras sincronizar de nuevo (guardado exitoso)', () => {
    const nombre = ref('Caja')
    const { dirty, sincronizar } = useFormSnapshot(() => ({ nombre: nombre.value }))
    sincronizar()

    nombre.value = 'Caja grande'
    expect(dirty.value).toBe(true)

    sincronizar()
    expect(dirty.value).toBe(false)
  })

  it('no se confunde por el orden de claves del objeto guardado', () => {
    // El caso que rompía productos: medidas venía de la BD como
    // {base, tipo, altura, unidad, profundidad} y el formulario lo rearmaba
    // como {tipo, base, altura, profundidad, unidad}. Comparando el
    // formulario contra sí mismo, el orden de la BD deja de importar.
    const medidasGuardadas: Record<string, unknown> = {
      base: 15, tipo: 'plano', altura: 12, unidad: 'cm', profundidad: null,
    }
    const tipo = ref(String(medidasGuardadas.tipo))
    const base = ref(Number(medidasGuardadas.base))
    const altura = ref(Number(medidasGuardadas.altura))

    const { dirty, sincronizar } = useFormSnapshot(() => ({
      medidas: { tipo: tipo.value, base: base.value, altura: altura.value, profundidad: null, unidad: 'cm' },
    }))
    sincronizar()

    expect(dirty.value).toBe(false)

    base.value = 20
    expect(dirty.value).toBe(true)
  })

  it('ignora lo que se excluye del snapshot (valores derivados)', () => {
    const ganancia = ref(100)
    const costo = ref(50)
    // El precio automático se deriva de costo y ganancia: no entra al snapshot.
    const { dirty, sincronizar } = useFormSnapshot(() => ({ ganancia: ganancia.value }))
    sincronizar()

    costo.value = 999
    expect(dirty.value).toBe(false)

    ganancia.value = 120
    expect(dirty.value).toBe(true)
  })
})
