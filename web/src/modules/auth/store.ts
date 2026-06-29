import { defineStore } from 'pinia'
import { createClient, type User } from '@supabase/supabase-js'
import { ref, computed } from 'vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (session?.access_token) {
      localStorage.setItem('sb-token', session.access_token)
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      if (session?.access_token) {
        localStorage.setItem('sb-token', session.access_token)
      } else {
        localStorage.removeItem('sb-token')
      }
    })

    loading.value = false
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    user.value = data.user
    if (data.session?.access_token) {
      localStorage.setItem('sb-token', data.session.access_token)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    localStorage.removeItem('sb-token')
  }

  return {
    user,
    loading,
    isAuthenticated,
    init,
    login,
    logout,
  }
})
