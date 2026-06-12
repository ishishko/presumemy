import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

import insumosRoutes from './routes/insumos.js'
import productosRoutes from './routes/productos.js'
import clientesRoutes from './routes/clientes.js'
import presupuestosRoutes from './routes/presupuestos.js'
import finanzasRoutes from './routes/finanzas.js'
import dashboardRoutes from './routes/dashboard.js'
import ajustesRoutes from './routes/ajustes.js'
import publicRoutes from './routes/public.js'

const app = new Hono()

// Middleware global
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.NETLIFY_URL ? [process.env.NETLIFY_URL] : []),
  ...(process.env.CUSTOM_DOMAIN ? [process.env.CUSTOM_DOMAIN] : []),
]

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    if (allowedOrigins.includes(origin)) return origin
    if (origin.endsWith('.netlify.app')) return origin
    return ''
  },
  credentials: true,
}))
app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }))

// Rutas de la API
app.route('/api/insumos', insumosRoutes)
app.route('/api/productos', productosRoutes)
app.route('/api/clientes', clientesRoutes)
app.route('/api/presupuestos', presupuestosRoutes)
app.route('/api/finanzas', finanzasRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/ajustes', ajustesRoutes)
app.route('/api/public', publicRoutes) // sin auth: acceso por token aleatorio

// 404 handler
app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404))

// Error handler
app.onError((err, c) => {
  console.error('❌ Error:', err)
  const status = (err as any).status ?? 500
  return c.json({ error: err.message ?? 'Error interno del servidor' }, status)
})

// Start server
const port = parseInt(process.env.PORT || '3000', 10)

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${info.port}`)
})

export default app
