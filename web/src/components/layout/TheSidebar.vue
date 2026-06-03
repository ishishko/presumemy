<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  FileText,
  Package,
  Layers,
  Coins,
  Users,
  Settings,
  LogOut,
} from '@lucide/vue'

const props = defineProps<{
  currentRoute: string
}>()

const emit = defineEmits<{
  navigate: [route: string]
  logout: []
}>()

const authStore = useAuthStore()

const userName = computed(() => {
  const email = authStore.user?.email || ''
  return email.split('@')[0] || 'Usuario'
})

const userInitials = computed(() => {
  const parts = userName.value.split('.')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return userName.value.substring(0, 2).toUpperCase()
})

const navOperacion = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'presupuestos', label: 'Presupuestos', icon: FileText },
  { id: 'catalogo', label: 'Productos', icon: Package },
  { id: 'insumos', label: 'Insumos', icon: Layers },
  { id: 'finanzas', label: 'Finanzas', icon: Coins },
]

const navDatos = [
  { id: 'clientes', label: 'Clientes', icon: Users },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img src="/memydeni-logo.png" alt="MemyDeni" />
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Operación</div>
      <button
        v-for="item in navOperacion"
        :key="item.id"
        :class="['nav-item', currentRoute === item.id && 'active']"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="20" :stroke-width="1.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Datos</div>
      <button
        v-for="item in navDatos"
        :key="item.id"
        :class="['nav-item', currentRoute === item.id && 'active']"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="20" :stroke-width="1.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="sidebar-foot">
      <button
        :class="['nav-item', 'sidebar-ajustes', currentRoute === 'ajustes' && 'active']"
        @click="emit('navigate', 'ajustes')"
      >
        <Settings :size="20" :stroke-width="1.5" />
        <span>Ajustes</span>
      </button>
      <div class="sidebar-foot-user">
        <div class="avatar">{{ userInitials }}</div>
        <div class="who">
          <div class="name">{{ userName }}</div>
          <div class="role">Propietaria</div>
        </div>
        <div class="spacer" />
        <button
          class="nav-item"
          style="padding: 6px; width: 28px; height: 28px; justify-content: center"
          title="Cerrar sesión"
          @click="emit('logout')"
        >
          <LogOut :size="16" :stroke-width="1.5" />
        </button>
      </div>
    </div>
  </aside>
</template>
