<script setup lang="ts">
import { Search, Bell, Plus } from '@lucide/vue'

defineProps<{
  title: string
  showCreate?: boolean
}>()

defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="app-header">
    <div class="header-left">
      <h1>{{ title }}</h1>
      <button
        v-if="showCreate"
        class="btn btn-primary btn-sm"
        @click="$emit('create')"
      >
        <Plus :size="14" :stroke-width="2" />
        Nuevo
      </button>
    </div>
    <div class="search">
      <Search :size="16" :stroke-width="1.5" />
      <input placeholder="Buscar presupuestos, clientes, productos…" />
    </div>
    <button class="icon-btn" title="Notificaciones">
      <Bell :size="20" :stroke-width="1.5" />
    </button>
  </div>
</template>
