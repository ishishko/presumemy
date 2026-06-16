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

      it('debería retornar 201 y crear la categoría', async () => {
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
      it('debería retornar 409 si tiene insumos asociados', async () => {
        const mockCategoria = { id: 1, merge: true, nombre: 'Papel', activo: true }
        vi.mocked(prisma.categoriaInsumo.findUnique).mockResolvedValueOnce(mockCategoria)
        vi.mocked(prisma.insumo.count).mockResolvedValueOnce(3) // 3 insumos asociados

        const res = await app.request('/api/insumos/categorias/1', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer valid-test-token',
          },
        })

        expect(res.status).toBe(409)
        const body = await res.json()
        expect(body.error).toBe('No se puede eliminar: tiene 3 elementos asociados')
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
            Authorization: 'Bearer valid-test-token',
          },
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
