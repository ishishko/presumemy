import { computed, onUnmounted, ref, watch, type Ref } from 'vue'

/**
 * Punto de montaje en el header donde el editor abierto pone sus controles
 * (título, estado, guardar, cerrar).
 *
 * El overlay es dueño de sus propios controles y los teletransporta acá. Antes
 * la app los dibujaba por él: el overlay avisaba a la página, la página a
 * `App.vue`, y `App.vue` guardaba título, estado sucio y callbacks en refs
 * globales para pasárselos al header. Ese ida y vuelta hacía que el estado del
 * editor viviera fuera del editor.
 */
export const EDITOR_SLOT_ID = 'editor-header-slot'

const abiertos = ref(0)

/** El header lo usa para ocultar "Crear nuevo" mientras se está editando. */
export const hayEditorAbierto = computed(() => abiertos.value > 0)

/**
 * Marca el editor como abierto mientras lo esté, y lo libera al desmontarse.
 * Es lo único que el shell necesita saber del editor.
 */
export function useEditorSlot(abierto: Ref<boolean> | (() => boolean)) {
  const leer = typeof abierto === 'function' ? abierto : () => abierto.value
  let registrado = false

  function sincronizar(valor: boolean) {
    if (valor === registrado) return
    abiertos.value += valor ? 1 : -1
    registrado = valor
  }

  watch(leer, sincronizar, { immediate: true })
  onUnmounted(() => sincronizar(false))
}
