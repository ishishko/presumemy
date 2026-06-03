<script setup lang="ts">
import PageHead from '@/components/layout/PageHead.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const userName = authStore.user?.email?.split('@')[0] || 'Usuario'
</script>

<template>
  <div class="content">
    <PageHead :title="`Hola, ${userName}`" sub="Bienvenida a Presumemi" />

    <div class="dashboard-grid">
      <div class="card">
        <h3>Ingresos del mes</h3>
        <p class="kpi-value">$ 0.00</p>
      </div>
      <div class="card highlight">
        <h3>Por cobrar</h3>
        <p class="kpi-value">$ 0.00</p>
      </div>
      <div class="card">
        <h3>Insumos bajos</h3>
        <p class="kpi-value">0</p>
      </div>
    </div>
  </div>
</template>
