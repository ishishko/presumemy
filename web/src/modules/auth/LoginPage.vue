<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './store'
import { Mail, Lock, Loader2, ArrowRight } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = 'Iniciar sesión · presumemy'
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', 'Inicia sesión en presumemy, el microERP para administrar tu negocio.')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
    style="background: radial-gradient(circle at 10% 20%, rgba(170, 59, 255, 0.06) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(117, 204, 206, 0.08) 0%, transparent 50%), var(--color-page-bg)">
    <!-- Background blobs -->
    <div class="absolute w-87.5 h-87.5 rounded-full opacity-55 pointer-events-none"
      style="background: var(--color-violet-100); filter: blur(100px); top: -10%; left: -5%" />
    <div class="absolute w-112.5 h-112.5 rounded-full opacity-55 pointer-events-none"
      style="background: var(--color-teal-100); filter: blur(100px); bottom: -15%; right: -5%" />

    <!-- Card -->
    <div class="relative z-1 bg-white/82 backdrop-blur-xl border border-white/50 rounded-3xl shadow-pop p-10 px-9 w-full max-w-97.5 flex flex-col gap-6 animate-[card-appear_360ms_ease_both]">
      <div class="flex flex-col items-center gap-4">
        <img src="/memydeni-logo.png" alt="MemyDeni Logo" class="w-45 block transition-transform duration-300 hover:scale-102" />
        <h1 class="text-15 font-medium text-ink-muted text-center m-0 tracking-tight">Inicia sesión en tu cuenta</h1>
      </div>

      <form class="flex flex-col gap-4.5" @submit.prevent="handleLogin">
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-12 font-medium text-ink uppercase tracking-0.05em">Email</label>
          <div class="relative flex items-center">
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              required
              autocomplete="email"
              class="w-full font-sans text-14 text-ink bg-surface border border-border-strong rounded-[10px] py-2.5 px-3 pl-9.5 transition-colors transition-shadow duration-120 placeholder:text-ink-muted/70 focus:outline-none focus:border-teal-500 focus:shadow-focus-ring"
            />
            <Mail class="absolute left-3.5 w-4 h-4 text-ink-muted pointer-events-none transition-colors duration-120 peer-focus:text-teal-500" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-12 font-medium text-ink uppercase tracking-0.05em">Contraseña</label>
          <div class="relative flex items-center">
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Tu contraseña"
              required
              autocomplete="current-password"
              class="w-full font-sans text-14 text-ink bg-surface border border-border-strong rounded-[10px] py-2.5 px-3 pl-9.5 transition-colors transition-shadow duration-120 placeholder:text-ink-muted/70 focus:outline-none focus:border-teal-500 focus:shadow-focus-ring"
            />
            <Lock class="absolute left-3.5 w-4 h-4 text-ink-muted pointer-events-none transition-colors duration-120 peer-focus:text-teal-500" />
          </div>
        </div>

        <div v-if="error" class="bg-coral-50 rounded-lg py-2.5 px-3 border border-coral-500/15">
          <span class="text-12 text-coral-500 leading-1.4 block">{{ error }}</span>
        </div>

        <button type="submit" class="w-full flex justify-center items-center bg-teal-500 text-white font-sans font-medium py-2.75 px-4 rounded-[10px] cursor-pointer shadow-[0_4px_12px_rgba(46,111,112,0.15)] transition-transform transition-bg transition-shadow duration-120 hover:bg-teal-700 hover:shadow-[0_6px_16px_rgba(46,111,112,0.25)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" :disabled="loading">
          <span v-if="loading" class="inline-flex items-center gap-2">
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
            Iniciando sesión
          </span>
          <span v-else class="inline-flex items-center gap-2">
            Iniciar sesión
            <ArrowRight class="w-3.5 h-3.5 transition-transform duration-120 group-hover:translate-x-0.75" />
          </span>
        </button>
      </form>

      <div class="text-center text-12 text-ink-muted tracking-0.04em mt-1">
        microERP por <strong class="text-violet-700 font-medium tracking-tight">Presumemi</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes card-appear {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
