import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { writeFile, readFile } from 'fs/promises'

import insumosRoutes from './routes/insumos.js'
import productosRoutes from './routes/productos.js'
import clientesRoutes from './routes/clientes.js'
import presupuestosRoutes from './routes/presupuestos.js'
import finanzasRoutes from './routes/finanzas.js'
import dashboardRoutes from './routes/dashboard.js'
import ajustesRoutes from './routes/ajustes.js'
import publicRoutes from './routes/public.js'
import { verifySupabaseToken, authMiddleware } from './middleware/auth.js'

// Asegurar que la carpeta de subidas existe localmente
try {
  fs.mkdirSync('./uploads', { recursive: true })
} catch (err: any) {
  if (err.code !== 'EEXIST') throw err
}


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

// Middleware de acceso seguro a la carpeta de uploads (subidas de imagen)
app.use('/api/uploads/*', async (c, next) => {
  const token = c.req.query('token') || c.req.header('Authorization')?.split(' ')[1]
  if (!token) {
    return c.json({ error: 'Token de autenticación requerido' }, 401)
  }
  try {
    await verifySupabaseToken(token)
    await next()
  } catch {
    return c.json({ error: 'Token de autenticación inválido o expirado' }, 401)
  }
})

// Servir las imágenes subidas de forma segura desde la carpeta ./uploads
app.get('/api/uploads/:filename', async (c) => {
  const filename = c.req.param('filename')
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return c.json({ error: 'Nombre de archivo inválido' }, 400)
  }
  const filePath = path.join('./uploads', filename)
  try {
    const fileBuffer = await readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.webp') contentType = 'image/webp'
    
    return c.body(fileBuffer, 200, {
      'Content-Type': contentType,
    })
  } catch (err) {
    return c.json({ error: 'Archivo no encontrado' }, 404)
  }
})

// Endpoint de subida autenticado
app.post('/api/upload', authMiddleware, async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No se subió ningún archivo o formato inválido' }, 400)
  }
  
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const fileExt = path.extname(file.name)
  const fileName = `${crypto.randomUUID()}${fileExt}`
  const filePath = path.join('./uploads', fileName)
  
  await writeFile(filePath, buffer)
  
  return c.json({
    url: `/uploads/${fileName}`
  }, 201)
})

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

if (process.env.NODE_ENV !== 'test') {
  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  }, (info) => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${info.port}`)
  })
}

export default app
