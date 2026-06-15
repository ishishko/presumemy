import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, './src/test/setup.ts')],
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://mock-supabase-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
      DATABASE_URL: 'postgresql://mock_user:mock_password@localhost:5432/mock_db?schema=public',
    },
  },
})
