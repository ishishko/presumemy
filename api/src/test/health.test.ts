import { describe, it, expect } from 'vitest'
import app from '../index.js'

describe('Endpoint: /health', () => {
  it('debería retornar 200 ok con un timestamp', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('ok', true)
    expect(data).toHaveProperty('timestamp')
    expect(typeof data.timestamp).toBe('string')
    
    // Verificar formato de fecha ISO
    expect(isNaN(Date.parse(data.timestamp))).toBe(false)
  })
})
