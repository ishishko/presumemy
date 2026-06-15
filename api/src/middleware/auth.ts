import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { unauthorized } from '../utils/errors.js'

export interface UserPayload {
  id: string
  email?: string
}

declare module 'hono' {
  interface ContextVariableMap {
    user: UserPayload
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw unauthorized('Token de autenticación requerido')
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      throw unauthorized('Configuración de Supabase incompleta')
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceKey,
      },
    })

    if (!response.ok) {
      throw unauthorized('Token inválido o expirado')
    }

    const user = await response.json()

    c.set('user', {
      id: user.id,
      email: user.email,
    })

    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error('❌ Error no controlado en authMiddleware:', error)
    throw unauthorized('Error de autenticación')
  }
})
