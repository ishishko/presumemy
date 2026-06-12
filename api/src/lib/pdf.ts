import puppeteer, { type Browser } from 'puppeteer'
import { prisma } from './prisma.js'
import { supabaseAdmin, STORAGE_BUCKET } from './supabase.js'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

let browser: Browser | null = null
let bucketReady = false

// cola secuencial: un solo Chrome a la vez (Render free = 512 MB RAM)
let queue: Promise<unknown> = Promise.resolve()

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  return browser
}

async function ensureBucket(): Promise<void> {
  if (bucketReady) return
  const { data } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET)
  if (!data) {
    const { error } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, { public: false })
    if (error && !error.message.includes('already exists')) {
      throw new Error(`No se pudo crear el bucket ${STORAGE_BUCKET}: ${error.message}`)
    }
  }
  bucketReady = true
}

async function renderAndUpload(presupuestoId: number): Promise<string | null> {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: presupuestoId, activo: true },
    select: { folio: true, estado: true, publicToken: true },
  })

  if (
    !presupuesto ||
    !presupuesto.publicToken ||
    presupuesto.estado === 'borrador' ||
    presupuesto.estado === 'cancelado'
  ) {
    return null
  }

  await ensureBucket()

  const b = await getBrowser()
  const page = await b.newPage()
  let pdf: Uint8Array
  try {
    await page.goto(`${FRONTEND_URL}/p/${presupuesto.publicToken}?pdf=1`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })
    await page.waitForSelector('[data-doc-ready="true"]', { timeout: 15000 })
    await page.evaluateHandle('document.fonts.ready')
    pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
  } finally {
    await page.close().catch(() => {})
  }

  const path = `presupuestos/${presupuesto.folio}.pdf`
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, Buffer.from(pdf), { contentType: 'application/pdf', upsert: true })

  if (error) {
    throw new Error(`Error subiendo PDF a Storage: ${error.message}`)
  }

  // mismo timestamp en ambos: si no, @updatedAt quedaría unos ms después
  // de pdfGeneratedAt y el PDF se consideraría siempre desactualizado
  const ts = new Date()
  await prisma.presupuesto.update({
    where: { id: presupuestoId },
    data: { pdfPath: path, pdfGeneratedAt: ts, updatedAt: ts },
  })

  return path
}

/**
 * Genera el PDF del presupuesto navegando a su vista pública y lo sube a
 * Supabase Storage. No genera nada en estado borrador/cancelado.
 * Devuelve el path en Storage o null si no corresponde generar.
 */
export function generarPdfPresupuesto(presupuestoId: number): Promise<string | null> {
  const run = queue.then(() => renderAndUpload(presupuestoId))
  queue = run.catch(() => {})
  return run
}

/** Firma una URL temporal de descarga para un PDF ya almacenado. */
export async function signedPdfUrl(pdfPath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(pdfPath, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`No se pudo firmar la URL del PDF: ${error?.message ?? 'sin URL'}`)
  }
  return data.signedUrl
}
