# Setup de Playwright - Guía de Instalación

## 1. Instalación

### 1.1 Desde la raíz del proyecto

```bash
cd web
npm install -D @playwright/test
npx playwright install
```

### 1.2 Verificar instalación

```bash
npx playwright --version
# Debería mostrar: Version 1.40.0 o superior
```

### 1.3 Instalar navegadores (incluido en el paso anterior)

- Chromium
- Firefox
- WebKit

---

## 2. Configuración Inicial

### 2.1 Crear `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2.2 Estructura de carpetas

```
web/
├── playwright.config.ts          # ← Nuevo
├── specs/                         # ← Nuevo
│   ├── dashboard.spec.ts
│   ├── insumos.spec.ts
│   └── ...
├── helpers/                       # ← Nuevo
│   ├── auth.helper.ts
│   ├── navigation.helper.ts
│   └── ...
└── screenshots/                   # ← Nuevo
    ├── baseline/
    └── current/
```

### 2.3 Scripts en package.json

Agregar en `web/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:update": "playwright test --update-snapshots",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 3. Primer Test

### 3.1 Crear `specs/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Presumemi/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Iniciar sesión');
  });
});
```

### 3.2 Ejecutar tests

```bash
# Ejecutar todos los tests
npm run test:e2e

# Ejecutar con UI interactiva
npm run test:e2e:ui

# Ejecutar en modo headed (ver navegador)
npm run test:e2e:headed

# Ver reporte
npm run test:e2e:report
```

---

## 4. Autenticación Persistente

### 4.1 Crear `helpers/auth.setup.ts`

```typescript
import { test as setup, expect } from '@playwright/test';

const authFile = './playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[data-testid="email"]', 'shimbo@test.com');
  await page.fill('[data-testid="password"]', 'shimbo123');
  await page.click('[data-testid="login-button"]');
  
  await page.waitForURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  
  await page.context().storageState({ path: authFile });
});
```

### 4.2 Actualizar `playwright.config.ts`

```typescript
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

---

## 5. Variables de Entorno

### 5.1 Crear `.env.test` en `web/`

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://zhegcpjdmcjqodcmhlcc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_7pKDT9a3lZxueUoc5QHs-Q_n8ymupHt
```

### 5.2 Cargar en tests

```typescript
// helpers/env.helper.ts
export const TEST_CONFIG = {
  email: 'shimbo@test.com',
  password: 'shimbo123',
  baseUrl: process.env.VITE_API_URL || 'http://localhost:3000',
};
```

---

## 6. Troubleshooting

### 6.1 Error: "Cannot find module '@playwright/test'"

```bash
npm install -D @playwright/test
```

### 6.2 Error: "browserType.launch: Executable doesn't exist"

```bash
npx playwright install
```

### 6.3 Tests fallan por timeout

Aumentar timeout en `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 60000, // 60 segundos
  expect: {
    timeout: 10000, // 10 segundos para assertions
  },
});
```

### 6.4 Screenshots no se guardan

Verificar que la carpeta `screenshots/` existe:

```bash
mkdir -p screenshots/baseline
mkdir -p screenshots/current
```

---

## 7. Próximos Pasos

1. ✅ Instalación completada
2. ✅ Primer test ejecutado
3. → Crear helpers (auth, navigation, form)
4. → Documentar flujo de Dashboard
5. → Crear spec de Dashboard

---

## 8. Recursos

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Authentication](https://playwright.dev/docs/auth)
- [Screenshots](https://playwright.dev/docs/screenshots)
