<script setup lang="ts">
import { Search, Bell, Plus, Save, X } from '@lucide/vue'

defineProps<{
  title: string
  showCreate?: boolean
  editorMode?: boolean
  editorTitle?: string
}>()

defineEmits<{
  create: []
  editorSave: []
  editorClose: []
}>()
</script>

<template>
  <div class="app-header">
    <template v-if="editorMode">
      <div class="header-left">
        <button class="icon-btn" @click="$emit('editorClose')" title="Volver">
          <X :size="18" />
        </button>
        <span class="editor-mode-title">{{ editorTitle || 'Nuevo' }}</span>
        <button
          class="icon-btn"
          @click="$emit('editorSave')"
          title="Guardar borrador"
        >
          <Save :size="18" />
        </button>
      </div>
      <div class="search-wrap">
        <div class="search">
          <Search :size="16" :stroke-width="1.5" />
          <input placeholder="Buscar presupuestos, clientes, productos…" />
        </div>
      </div>
      <div class="header-right">
        <button class="icon-btn" title="Notificaciones">
          <Bell :size="20" :stroke-width="1.5" />
        </button>
      </div>
    </template>
    <template v-else>
      <div class="header-left">
        <h1>{{ title }}</h1>
        <button
          v-if="showCreate"
          class="btn btn-primary btn-icon"
          :title="`Crear nuevo`"
          @click="$emit('create')"
        >
          <Plus :size="16" :stroke-width="2" />
        </button>
      </div>
      <div class="search-wrap">
        <div class="search">
          <Search :size="16" :stroke-width="1.5" />
          <input placeholder="Buscar presupuestos, clientes, productos…" />
        </div>
      </div>
      <div class="header-right">
        <button class="icon-btn" title="Notificaciones">
          <Bell :size="20" :stroke-width="1.5" />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editor-mode-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--violet-700);
  letter-spacing: -0.01em;
}
</style>
