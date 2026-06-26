<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
  <div class="login-wrap">
    <div class="bg-blob-1" />
    <div class="bg-blob-2" />

    <div class="login-card">
      <div class="brand">
        <img src="/memydeni-logo.png" alt="MemyDeni Logo" class="brand-logo" />
        <h1 class="login-title">Inicia sesión en tu cuenta</h1>
      </div>

      <form class="login-form" @submit.prevent="handleLogin" id="login-form">
        <div class="field">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              required
              autocomplete="email"
              class="input-field"
            />
            <Mail class="input-icon" />
          </div>
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Tu contraseña"
              required
              autocomplete="current-password"
              class="input-field"
            />
            <Lock class="input-icon" />
          </div>
        </div>

        <div v-if="error" class="error-container">
          <span class="err" id="login-error-msg">{{ error }}</span>
        </div>

        <button type="submit" class="btn-login" id="btn-login-submit" :disabled="loading">
          <span v-if="loading" class="btn-content">
            <Loader2 class="spinner" />
            Iniciando sesión
          </span>
          <span v-else class="btn-content">
            Iniciar sesión
            <ArrowRight class="btn-arrow" />
          </span>
        </button>
      </form>

      <div class="by">
        microERP por <strong>Presumemi</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 10% 20%, rgba(170, 59, 255, 0.06) 0%, transparent 45%),
              radial-gradient(circle at 90% 80%, rgba(117, 204, 206, 0.08) 0%, transparent 50%),
              var(--page-bg);
  position: relative;
  overflow: hidden;
}

/* Background blobs */
.bg-blob-1,
.bg-blob-2 {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.55;
  pointer-events: none;
}

.bg-blob-1 {
  width: 350px;
  height: 350px;
  background: var(--violet-100);
  top: -10%;
  left: -5%;
}

.bg-blob-2 {
  width: 450px;
  height: 450px;
  background: var(--teal-100);
  bottom: -15%;
  right: -5%;
}

/* Glassmorphism Card */
.login-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 20px 40px -15px rgba(28, 26, 30, 0.06),
              0 1px 3px rgba(28, 26, 30, 0.02);
  padding: 40px 36px;
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: card-appear 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.brand-logo {
  width: 180px;
  height: auto;
  display: block;
  transition: transform 300ms ease;
}

.brand-logo:hover {
  transform: scale(1.02);
}

.login-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-muted);
  text-align: center;
  margin: 0;
  letter-spacing: -0.01em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Input wrappers with icons */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  padding: 10px 12px 10px 38px;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.input-field::placeholder {
  color: var(--ink-muted);
  opacity: 0.7;
}

.input-field:focus {
  outline: none;
  border-color: var(--teal-500);
  box-shadow: var(--focus-ring);
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 16px;
  height: 16px;
  color: var(--ink-muted);
  pointer-events: none;
  transition: color 120ms ease;
}

.input-field:focus ~ .input-icon {
  color: var(--teal-500);
}

/* Error Container */
.error-container {
  background: var(--coral-50);
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(234, 95, 60, 0.15);
}

.err {
  font-size: 12px;
  color: var(--coral-500);
  line-height: 1.4;
  display: block;
}

/* Premium Login Button */
.btn-login {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--teal-500);
  color: #fff;
  border: none;
  font-family: var(--font-sans);
  font-weight: 500;
  padding: 11px 16px;
  font-size: 14px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 111, 112, 0.15);
  transition: transform 80ms ease, background 120ms ease, box-shadow 120ms ease;
  line-height: 1;
}

.btn-login:hover:not(:disabled) {
  background: #276061;
  box-shadow: 0 6px 16px rgba(46, 111, 112, 0.25);
}

.btn-login:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  animation: spin 1s linear infinite;
  width: 14px;
  height: 14px;
}

.btn-arrow {
  width: 14px;
  height: 14px;
  transition: transform 120ms ease;
}

.btn-login:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.by {
  text-align: center;
  font-size: 12px;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
  margin-top: 4px;
}

.by strong {
  color: var(--violet-700);
  font-weight: 500;
  letter-spacing: -0.01em;
}
</style>
