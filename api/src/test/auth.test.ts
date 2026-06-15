import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

describe('Middleware: authMiddleware', () => {
  const testApp = new Hono()
  
  testApp.use('/protected', authMiddleware)
  testApp.get('/protected', (c) => c.json({ user: c.get('user') }))
  
  testApp.onError((err, c) => {
    const status = (err as any).status ?? 500
    return c.json({ error: err.message }, status)
  })

  it('debería retornar 401 si no hay cabecera Authorization', async () => {
    const res = await testApp.request('/protected')
    expect(res.status).toBe(401)
    
    const data = await res.json()
    expect(data.error).toBe('Token de autenticación requerido')
  })

  it('debería retornar 401 si el formato de Authorization no es Bearer', async () => {
    const res = await testApp.request('/protected', {
      headers: {
        Authorization: 'Basic invalidtoken'
      }
    })
    expect(res.status).toBe(401)
    
    const data = await res.json()
    expect(data.error).toBe('Token de autenticación requerido')
  })

  it('debería retornar 401 si el token es inválido', async () => {
    const res = await testApp.request('/protected', {
      headers: {
        Authorization: 'Bearer invalid-token'
      }
    })
    expect(res.status).toBe(401)
    
    const data = await res.json()
    expect(data.error).toBe('Token inválido o expirado')
  })

  it('debería inyectar el user payload en el contexto y retornar 200 con token válido', async () => {
    const res = await testApp.request('/protected', {
      headers: {
        Authorization: 'Bearer valid-test-token'
      }
    })
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.user).toEqual({
      id: 'mock-user-id-123',
      email: 'test@memydeni.com'
    })
  })
})
