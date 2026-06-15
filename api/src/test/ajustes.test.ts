import { describe, it, expect, vi } from 'vitest'
import app from '../index.js'
import { prisma } from '../lib/prisma.js'

describe('Endpoint: /api/ajustes', () => {
  describe('GET /api/ajustes/configuracion', () => {
    it('debería retornar 401 si no está autenticado', async () => {
      const res = await app.request('/api/ajustes/configuracion')
      expect(res.status).toBe(401)
    })

    it('debería retornar 404 si la configuración no existe', async () => {
      // Configuramos el mock de Prisma para que retorne null (no encontrado)
      vi.mocked(prisma.configuracionNegocio.findUnique).mockResolvedValueOnce(null)

      const res = await app.request('/api/ajustes/configuracion', {
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
      })
      expect(res.status).toBe(404)
      
      const data = await res.json()
      expect(data.error).toBe('Configuracion no encontrada')
    })

    it('debería retornar 200 y la configuración si existe', async () => {
      const mockConfig = {
        id: 1,
        nombre: 'MemyDeni Test',
        logoUrl: null,
        domicilio: null,
        contactoCanal: null,
        contactoValor: null,
        moneda: 'ARS',
        cancelacionAuto: false,
        diasEspera: 5,
      }

      // Configuramos el mock de Prisma para que retorne nuestra configuración simulada
      vi.mocked(prisma.configuracionNegocio.findUnique).mockResolvedValueOnce(mockConfig)

      const res = await app.request('/api/ajustes/configuracion', {
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data).toEqual(mockConfig)
      
      // Validamos que se haya consultado a Prisma con el ID correcto
      expect(prisma.configuracionNegocio.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
    })
  })
})
