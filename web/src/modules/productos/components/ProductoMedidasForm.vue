<script setup lang="ts">
import FloatingField from '@/shared/ui/FloatingField.vue'

// Props
defineProps<{
  errors: Record<string, string>
}>()

// V-Models
const medidasTipo = defineModel<'plano' | 'cuerpo'>('medidasTipo', { required: true })
const medidasBase = defineModel<number | ''>('medidasBase', { required: true })
const medidasAltura = defineModel<number | ''>('medidasAltura', { required: true })
const medidasProfundidad = defineModel<number | ''>('medidasProfundidad', { required: true })
</script>

<template>
  <div class="pd-section-group" style="display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
      <label class="pd-label-group" style="margin-bottom: 0;">Medidas</label>
      <div class="medidas-toggle-group" style="margin-bottom: 0;">
        <input
          type="checkbox"
          id="cb-medidas-tipo"
          class="tgl tgl-flip"
          :checked="medidasTipo === 'cuerpo'"
          @change="medidasTipo = ($event.target as HTMLInputElement).checked ? 'cuerpo' : 'plano'"
        />
        <label for="cb-medidas-tipo" data-tg-on="Cuerpo" data-tg-off="Plano" class="tgl-btn" style="margin: 0;"></label>
      </div>
    </div>

    <div class="medidas-inputs-row">
      <div class="medida-input-col">
        <FloatingField
          id="prod-base"
          label="Base (ancho)"
          type="number"
          suffix="cm"
          v-model.number="medidasBase"
          min="0.1"
          step="0.1"
          :invalid="!!errors.medidasBase"
          :describedby="errors.medidasBase ? 'err-base' : undefined"
        />
      </div>
      <div class="medida-input-col">
        <FloatingField
          id="prod-altura"
          label="Altura (alto)"
          type="number"
          suffix="cm"
          v-model.number="medidasAltura"
          min="0.1"
          step="0.1"
          :invalid="!!errors.medidasAltura"
          :describedby="errors.medidasAltura ? 'err-altura' : undefined"
        />
      </div>
      <div v-if="medidasTipo === 'cuerpo'" class="medida-input-col">
        <FloatingField
          id="prod-profundidad"
          label="Profundidad"
          type="number"
          suffix="cm"
          v-model.number="medidasProfundidad"
          min="0.1"
          step="0.1"
          :invalid="!!errors.medidasProfundidad"
          :describedby="errors.medidasProfundidad ? 'err-profundidad' : undefined"
        />
      </div>
    </div>

    <!-- Mensajes de error individuales -->
    <div v-if="errors.medidasBase" id="err-base" class="field-error" role="alert">
      {{ errors.medidasBase }}
    </div>
    <div v-if="errors.medidasAltura" id="err-altura" class="field-error" role="alert">
      {{ errors.medidasAltura }}
    </div>
    <div v-if="medidasTipo === 'cuerpo' && errors.medidasProfundidad" id="err-profundidad" class="field-error" role="alert">
      {{ errors.medidasProfundidad }}
    </div>
  </div>
</template>
