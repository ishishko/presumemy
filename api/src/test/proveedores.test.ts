import { describe, it, expect, vi } from 'vitest'
import app from '../index.js'
import { prisma } from '../lib/prisma.js'

describe('Endpoints: Proveedores', () => {
  describe('DELETE /api/insumos/proveedores/:id', () => {
    it('debería retornar 401 si no está autenticado', async () => {
      const res = await app.request('/api/insumos/proveedores/1', {
        method: 'DELETE',
      })
      expect(res.status).toBe(401)
    })

    it('debería retornar 404 si el proveedor no existe', async () => {
      vi.mocked(prisma.proveedor.findUnique).mockResolvedValueOnce(null)

      const res = await app.request('/api/insumos/proveedores/999', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Proveedor no encontrado')
    })

    it('debería realizar el soft delete del proveedor y borrar relaciones si existe', async () => {
      const mockProveedor = { id: 1, nombre: 'Test Proveedor', contacto: null, activo: true }
      vi.mocked(prisma.proveedor.findUnique).mockResolvedValueOnce(mockProveedor)

      const res = await app.request('/api/insumos/proveedores/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.message).toBe('Proveedor eliminado')

      // Verificar que se llamaron a las funciones correspondientes de prisma
      expect(prisma.insumoProveedor.deleteMany).toHaveBeenCalledWith({
        where: { proveedorId: 1 }
      })
      expect(prisma.proveedor.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false }
      })
    })
  })
})
