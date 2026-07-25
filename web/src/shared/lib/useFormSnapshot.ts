import { computed, ref } from 'vue'

/**
 * Detección de cambios sin guardar por snapshot.
 *
 * En vez de comparar campo por campo el formulario contra el registro —que se
 * rompe ante cualquier diferencia de forma: orden de claves en un JSON, un
 * Decimal serializado como string, un valor derivado que se recalcula al
 * abrir— se fotografía el formulario recién cargado y se lo compara contra sí
 * mismo. Los dos lados salen de la misma función, así que no pueden diferir
 * por representación.
 *
 * Regla del snapshot: incluir solo lo que el usuario edita. Lo derivado (un
 * precio automático, el costo que baja de un insumo) queda afuera, porque
 * cambia solo y no es un cambio del usuario.
 *
 * Uso: `sincronizar()` al terminar de cargar el formulario y de nuevo después
 * de guardar con éxito.
 */
export function useFormSnapshot<T>(snapshot: () => T) {
  const guardado = ref<string | null>(null)

  const actual = computed(() => JSON.stringify(snapshot()))

  const dirty = computed(() => guardado.value !== null && actual.value !== guardado.value)

  /** Fija el estado actual como "lo último guardado". */
  function sincronizar() {
    guardado.value = actual.value
  }

  return { dirty, sincronizar }
}
