<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/modules/auth/store'
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
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'insumos', label: 'Insumos', icon: Layers },
  { id: 'finanzas', label: 'Finanzas', icon: Coins },
]

const navDatos = [
  { id: 'clientes', label: 'Clientes', icon: Users },
]
</script>

<template>
  <aside class="w-[240px] h-screen bg-violet-700 flex flex-col flex-shrink-0">
    <!-- Brand -->
    <div class="px-5 pt-5 pb-4">
      <img src="/memydeni-logo.png" alt="MemyDeni" class="w-full h-auto" />
    </div>

    <!-- Nav Operación -->
    <div class="px-3 mb-4">
      <div class="text-11 font-medium uppercase tracking-0.06em text-white/50 px-3 mb-2">Operación</div>
      <button
        v-for="item in navOperacion"
        :key="item.id"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-14 font-medium transition-colors cursor-pointer border-0',
          currentRoute === item.id
            ? 'bg-white/15 text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        ]"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="20" :stroke-width="1.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <!-- Nav Datos -->
    <div class="px-3 mb-4">
      <div class="text-11 font-medium uppercase tracking-0.06em text-white/50 px-3 mb-2">Datos</div>
      <button
        v-for="item in navDatos"
        :key="item.id"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-14 font-medium transition-colors cursor-pointer border-0',
          currentRoute === item.id
            ? 'bg-white/15 text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        ]"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="20" :stroke-width="1.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <!-- Footer -->
    <div class="mt-auto px-3 pb-4">
      <!-- Ajustes -->
      <button
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-14 font-medium transition-colors cursor-pointer border-0 mb-3',
          currentRoute === 'ajustes'
            ? 'bg-white/15 text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        ]"
        @click="emit('navigate', 'ajustes')"
      >
        <Settings :size="20" :stroke-width="1.5" />
        <span>Ajustes</span>
      </button>

      <!-- User info -->
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-12 font-medium text-white flex-shrink-0">
          {{ userInitials }}
        </div>
        <div class="flex flex-col min-w-0 flex-1">
          <div class="text-13 font-medium text-white truncate">{{ userName }}</div>
          <div class="text-11 text-white/50">Propietaria</div>
        </div>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer border-0 flex-shrink-0"
          title="Cerrar sesión"
          @click="emit('logout')"
        >
          <LogOut :size="16" :stroke-width="1.5" />
        </button>
      </div>
    </div>
  </aside>
</template>
