import { vi, beforeEach, afterEach } from 'vitest'

// --- Mock de Prisma utilizando Proxies de ES6 ---
// Esto permite que cualquier modelo de Prisma y cualquier método (como findMany, create, etc.)
// devuelva una función mock (vi.fn()) por defecto sin tener que definir cada modelo explícitamente.
const createMockModel = () => {
  const model: any = {}
  return new Proxy(model, {
    get(target, prop) {
      if (typeof prop === 'symbol') return undefined
      if (prop === 'then') return undefined
      if (!target[prop]) {
        target[prop] = vi.fn().mockResolvedValue(null)
      }
      return target[prop]
    }
  })
}

const mockPrisma = new Proxy({} as any, {
  get(target, prop) {
    if (typeof prop === 'symbol') return undefined
    if (prop === 'then') return undefined
    if (prop === '$transaction') {
      if (!target[prop]) {
        target[prop] = vi.fn().mockImplementation((args) => {
          if (typeof args === 'function') {
            return args(mockPrisma)
          }
          return Promise.all(args)
        })
      }
      return target[prop]
    }
    if (!target[prop]) {
      target[prop] = createMockModel()
    }
    return target[prop]
  }
})

// Mockear el módulo prisma.ts para exportar nuestro proxy mock
vi.mock('../lib/prisma.js', () => ({
  prisma: mockPrisma
}))

// --- Mock de Fetch Global para Supabase Auth ---
const originalFetch = global.fetch

beforeEach(() => {
  vi.clearAllMocks()

  global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
    if (url.includes('/auth/v1/user')) {
      const headers = options?.headers || {}
      const authHeader = headers.Authorization || headers.authorization || ''
      const token = authHeader.replace('Bearer ', '')

      if (token === 'valid-test-token') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'mock-user-id-123',
            email: 'test@memydeni.com',
          })
        } as Response)
      }

      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Token inválido o expirado' })
      } as Response)
    }

    return Promise.reject(new Error(`Fetch no mockeado para la URL: ${url}`))
  })
})

afterEach(() => {
  global.fetch = originalFetch
})
