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
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'insumos', label: 'Insumos', icon: Layers },
  { id: 'finanzas', label: 'Finanzas', icon: Coins },
]

const navDatos = [
  { id: 'clientes', label: 'Clientes', icon: Users },
]
</script>

<template>
  <aside class="w-[240px] h-screen sticky top-0 bg-violet-700 text-white flex flex-col py-[20px] px-[14px] gap-[24px] box-border shrink-0 select-none">
    <div class="bg-surface rounded-[10px] py-[10px] px-[12px] flex items-center justify-center">
      <img src="/memydeni-logo.png" alt="MemyDeni" class="block w-[140px] h-auto" />
    </div>

    <div class="flex flex-col gap-[2px]">
      <div class="text-11 uppercase tracking-[0.08em] text-white/55 px-[10px] pb-[6px] font-medium select-none">Operación</div>
      <button
        v-for="item in navOperacion"
        :key="item.id"
        type="button"
        class="flex items-center gap-[10px] px-[10px] py-[9px] rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors text-left font-medium w-full cursor-pointer text-14 border border-transparent focus-visible:outline-none focus-visible:bg-white/8"
        :class="[currentRoute === item.id ? 'bg-white/12 border-white/20! text-white' : '']"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="18" :stroke-width="1.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="flex flex-col gap-[2px]">
      <div class="text-11 uppercase tracking-[0.08em] text-white/55 px-[10px] pb-[6px] font-medium select-none">Datos</div>
      <button
        v-for="item in navDatos"
        :key="item.id"
        type="button"
        class="flex items-center gap-[10px] px-[10px] py-[9px] rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors text-left font-medium w-full cursor-pointer text-14 border border-transparent focus-visible:outline-none focus-visible:bg-white/8"
        :class="[currentRoute === item.id ? 'bg-white/12 border-white/20! text-white' : '']"
        @click="emit('navigate', item.id)"
      >
        <component :is="item.icon" :size="18" :stroke-width="1.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="mt-auto flex flex-col gap-2 pt-3 border-t border-white/10">
      <button
        type="button"
        class="flex items-center gap-[10px] px-[10px] py-[9px] rounded-md text-white/85 hover:bg-white/8 hover:text-white transition-colors text-left font-medium w-full cursor-pointer text-14 border border-transparent focus-visible:outline-none focus-visible:bg-white/8"
        :class="[currentRoute === 'ajustes' ? 'bg-white/12 border-white/20! text-white' : '']"
        @click="emit('navigate', 'ajustes')"
      >
        <Settings :size="18" :stroke-width="1.5" />
        <span>Ajustes</span>
      </button>
      
      <div class="flex items-center gap-2.5 pt-2 border-t border-white/10">
        <div class="w-8 h-8 rounded-full bg-teal-500 text-white font-semibold text-13 grid place-items-center uppercase shrink-0">
          {{ userInitials }}
        </div>
        <div class="text-13 leading-snug min-w-0">
          <div class="font-medium truncate">{{ userName }}</div>
          <div class="text-11 text-white/65">Propietaria</div>
        </div>
        <div class="flex-1" />
        <button
          type="button"
          class="flex items-center justify-center p-1.5 w-7 h-7 rounded-md hover:bg-white/8 text-white/85 transition-colors border-0 bg-transparent cursor-pointer focus-visible:outline-none focus-visible:bg-white/8"
          title="Cerrar sesión"
          @click="emit('logout')"
        >
          <LogOut :size="16" :stroke-width="1.5" />
        </button>
      </div>
    </div>
  </aside>
</template>
