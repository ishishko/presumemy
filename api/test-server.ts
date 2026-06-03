import { spawn } from 'child_process'
import http from 'http'

const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: process.cwd(),
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
})

server.stdout?.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`)
})

server.stderr?.on('data', (data) => {
  console.error(`[ERROR] ${data.toString().trim()}`)
})

function makeRequest(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${path}`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        console.log(`\n${path} → ${res.statusCode}`)
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(data)
        }
      })
    }).on('error', reject)
  })
}

async function runTests() {
  console.log('⏳ Esperando que el servidor arranque...')
  await new Promise((r) => setTimeout(r, 4000))

  try {
    console.log('\n🧪 Test 1: Health check')
    const health = await makeRequest('/health')
    console.log(JSON.stringify(health, null, 2))

    console.log('\n🧪 Test 2: GET /api/insumos (sin auth - deberia fallar)')
    const insumos = await makeRequest('/api/insumos?page=1&limit=3')
    console.log(JSON.stringify(insumos, null, 2))

    console.log('\n✅ Tests completados!')
  } catch (err) {
    console.error('❌ Error:', err)
  } finally {
    server.kill()
    process.exit(0)
  }
}

runTests()
