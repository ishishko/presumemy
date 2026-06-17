import { describe, it, expect, vi } from 'vitest'
import app from '../index.js'
import { prisma } from '../lib/prisma.js'

describe('Endpoints: Categorías', () => {
  describe('Insumos Categorías', () => {
    describe('POST /api/insumos/categorias', () => {
      it('debería retornar 401 si no está autenticado', async () => {
        const res = await app.request('/api/insumos/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: 'Nueva' }),
        })
        expect(res.status).toBe(401)
      })

      it('debería retornar 409 si la categoría ya existe', async () => {
        const mockCategoria = { id: 1, nombre: 'Papel', activo: true }
        vi.mocked(prisma.categoriaInsumo.findFirst).mockResolvedValueOnce(mockCategoria)

        const res = await app.request('/api/insumos/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({ nombre: 'Papel' }),
        })

        expect(res.status).toBe(409)
        const body = await res.json()
        expect(body.error).toBe('Ya existe una categoría con ese nombre')
      })

      it('debería retornar 409 si ya se alcanzaron 12 categorías', async () => {
        vi.mocked(prisma.categoriaInsumo.count).mockResolvedValueOnce(12)

        const res = await app.request('/api/insumos/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({ nombre: 'Nueva' }),
        })

        expect(res.status).toBe(409)
        const body = await res.json()
        expect(body.error).toBe('Máximo 12 categorías por sección')
      })

      it('debería retornar 201 y crear la categoría', async () => {
        vi.mocked(prisma.categoriaInsumo.count).mockResolvedValueOnce(5)
        vi.mocked(prisma.categoriaInsumo.findFirst).mockResolvedValueOnce(null)
        vi.mocked(prisma.categoriaInsumo.create).mockResolvedValueOnce({
          id: 5,
          nombre: 'Nueva Cat',
          activo: true,
        })

        const res = await app.request('/api/insumos/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({ nombre: 'Nueva Cat' }),
        })

        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.data.nombre).toBe('Nueva Cat')
      })
    })

    describe('DELETE /api/insumos/categorias/:id', () => {
      it('debería retornar 400 si tiene insumos asociados y no se provee destino', async () => {
        const mockCategoria = { id: 1, nombre: 'Papel', activo: true }
        vi.mocked(prisma.categoriaInsumo.findUnique).mockResolvedValueOnce(mockCategoria)
        vi.mocked(prisma.insumo.count).mockResolvedValueOnce(3) // 3 insumos asociados

        const res = await app.request('/api/insumos/categorias/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({}),
        })

        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toBe('Indicá una categoría destino')
      })

      it('debería retornar 200 y reasignar insumos si se especifica una categoría destino válida', async () => {
        const mockCategoria = { id: 1, nombre: 'Papel', activo: true }
        const mockDestino = { id: 2, nombre: 'Kraft', activo: true }
        
        // Para mockear múltiples findUnique secuenciales:
        vi.mocked(prisma.categoriaInsumo.findUnique)
          .mockResolvedValueOnce(mockCategoria) // Para el 'existing'
          .mockResolvedValueOnce(mockDestino)    // Para el 'targetCat'
          
        vi.mocked(prisma.insumo.count).mockResolvedValueOnce(3) // 3 asociados
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([
          { count: 3 },
          { id: 1, nombre: 'Papel', activo: false }
        ])

        const res = await app.request('/api/insumos/categorias/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({ reasignarA: 2 }),
        })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.message).toBe('Categoría eliminada')
      })

      it('debería retornar 200 si la categoría está vacía', async () => {
        const mockCategoria = { id: 1, nombre: 'Papel Vacio', activo: true }
        vi.mocked(prisma.categoriaInsumo.findUnique).mockResolvedValueOnce(mockCategoria)
        vi.mocked(prisma.insumo.count).mockResolvedValueOnce(0) // 0 asociados
        vi.mocked(prisma.categoriaInsumo.update).mockResolvedValueOnce({
          id: 1,
          nombre: 'Papel Vacio',
          activo: false,
        })

        const res = await app.request('/api/insumos/categorias/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({}),
        })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.message).toBe('Categoría eliminada')
      })
    })
  })

  describe('Productos Categorías', () => {
    describe('PUT /api/productos/categorias/:id', () => {
      it('debería retornar 409 si el nuevo nombre ya existe en otra categoría', async () => {
        const mockCategoria = { id: 2, nombre: 'Mesa', activo: true }
        const mockDuplicate = { id: 3, nombre: 'Decoracion', activo: true }
        vi.mocked(prisma.categoriaProducto.findUnique).mockResolvedValueOnce(mockCategoria)
        vi.mocked(prisma.categoriaProducto.findFirst).mockResolvedValueOnce(mockDuplicate)

        const res = await app.request('/api/productos/categorias/2', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-test-token',
          },
          body: JSON.stringify({ nombre: 'Decoracion' }),
        })

        expect(res.status).toBe(409)
        const body = await res.json()
        expect(body.error).toBe('Ya existe otra categoría con ese nombre')
      })
    })
  })
})
