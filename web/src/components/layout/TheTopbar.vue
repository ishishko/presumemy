<script setup lang="ts">
import { Search, Bell } from '@lucide/vue'

defineProps<{
  crumbs: string[]
}>()
</script>

<template>
  <div class="topbar">
    <div class="crumbs">
      <template v-for="(crumb, i) in crumbs" :key="i">
        <span v-if="i > 0" class="crumb-sep">/</span>
        <strong v-if="i === crumbs.length - 1">{{ crumb }}</strong>
        <span v-else>{{ crumb }}</span>
      </template>
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
