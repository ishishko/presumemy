# Guía Rápida de Testing E2E

## 🎯 ¿Qué es esto?

Un framework de pruebas end-to-end que:
- ✅ Valida que la aplicación funciona correctamente
- ✅ Genera screenshots automáticos
- ✅ Detecta regresiones visuales
- ✅ Documenta el comportamiento esperado

## 🚀 Empezar en 5 Minutos

### 1. Instalar Playwright

```bash
cd web
npm install -D @playwright/test
npx playwright install
```

### 2. Ejecutar Tests de Ejemplo

```bash
npm run test:e2e
```

Esto ejecutará los tests de Insumos como ejemplo.

### 3. Ver Resultados

```bash
npm run test:e2e:report
```

Se abrirá un reporte HTML con:
- Tests que pasaron ❌/✅
- Screenshots capturados
- Videos (si hay fallos)
- Tiempos de ejecución

---

## 📝 Crear un Nuevo Test

### Paso 1: Documentar el Flujo

Crear `02_flows/flow_[modulo].md` con:

```markdown
# Flujo: [Nombre del Módulo]

## Objetivo
Qué quiere validar este flujo.

## Pasos
### Paso 1: [Acción]
**Qué hacer:**
1. Click en...
2. Completar...

**Validar:**
- [ ] Campo X está visible
- [ ] Toast muestra "Mensaje"

**Screenshot:** `01_estado_inicial.png`
```

### Paso 2: Crear el Spec

Crear `03_scripts/specs/[modulo].spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth.helper';

test.describe('Módulo [Nombre]', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/[ruta]');
  });

  test('Paso 1: Descripción', async ({ page }) => {
    // Acción
    await page.getByRole('button', { name: 'Crear' }).click();
    
    // Validación
    await expect(page.locator('.overlay')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: 'screenshots/current/01_estado.png' });
  });
});
```

### Paso 3: Ejecutar

```bash
# Solo este test
npm run test:e2e [nombre-archivo]

# Con navegador visible
npm run test:e2e:headed [nombre-archivo]

# Modo debug
npm run test:e2e:debug [nombre-archivo]
```

---

## 🧰 Helpers Útiles

### Login/Logout

```typescript
import { login, logout } from '../helpers/auth.helper';

// Login automático
await login(page);

// Con credenciales custom
await login(page, 'otro@email.com', 'password123');

// Logout
await logout(page);
```

### Datos de Prueba

```typescript
import { TEST_INSUMO, TEST_CLIENTE, uniqueName } from '../utils/test-data';

// Usar datos predefinidos
await page.fill('[name="nombre"]', TEST_INSUMO.nombre);

// Generar nombre único
const nombreUnico = uniqueName('Producto Test');
```

### Navegación

```typescript
// Ir a módulo
await page.goto('/insumos');

// Esperar carga
await page.waitForSelector('table');

// Validar URL
await expect(page).toHaveURL('/insumos');
```

### Formularios

```typescript
// Llenar campo
await page.getByLabel('Nombre').fill('Valor');

// Seleccionar opción
await page.getByLabel('Categoría').selectOption({ label: 'Papel' });

// Submit
await page.getByRole('button', { name: 'Guardar' }).click();
```

### Validaciones

```typescript
// Elemento visible
await expect(page.locator('.toast')).toBeVisible();

// Texto contenido
await expect(page.locator('.toast')).toContainText('Creado');

// Valor de input
await expect(page.getByLabel('Nombre')).toHaveValue('Papel');

// Conteo de elementos
const rows = page.locator('tbody tr');
expect(await rows.count()).toBeGreaterThan(0);
```

---

## 📸 Screenshots

### Captura Manual

```typescript
// Full page
await page.screenshot({ 
  path: 'screenshots/current/01_list.png',
  fullPage: true 
});

// Elemento específico
await page.locator('.card').screenshot({ 
  path: 'screenshots/current/02_card.png' 
});
```

### Comparar con Baseline

```typescript
// Captura y compara automáticamente
await expect(page.locator('.dashboard'))
  .toHaveScreenshot('dashboard.png');
```

### Actualizar Baseline

```bash
npm run test:e2e:update
```

---

## 🐛 Debugging

### Ver Navegador

```bash
# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar en modo debug (pausa en cada paso)
npm run test:e2e:debug
```

### Logs en Consola

```typescript
test('Mi test', async ({ page }) => {
  // Escuchar console.log de la app
  page.on('console', msg => console.log('APP:', msg.text()));
  
  await page.goto('/insumos');
});
```

### Esperas Explícitas

```typescript
// Esperar elemento
await page.waitForSelector('.overlay');

// Esperar URL
await page.waitForURL('/dashboard');

// Esperar timeout
await page.waitForTimeout(2000); // 2 segundos
```

---

## 📊 Reportes

### Ver Reporte HTML

```bash
npm run test:e2e:report
```

Incluye:
- Lista de tests (pasados/fallados)
- Screenshots de cada paso
- Videos (si hay fallos)
- Tiempos de ejecución
- Trazas de error

### Reporte en CI

En GitHub Actions se genera automáticamente y se sube como artifact.

---

## 🎯 Buenas Prácticas

### ✅ Hacer

- Usar `data-testid` para selectores estables
- Documentar cada flujo antes de testear
- Generar screenshots en cada paso clave
- Usar helpers para código repetitivo
- Mantener tests independientes entre sí

### ❌ No Hacer

- Depender de order entre tests
- Usar selectores frágiles (ej: `div > div > button`)
- Ignorar fallos de tests
- No actualizar screenshots cuando cambia UI
- Crear tests que dependan de datos específicos

---

## 🔍 Selectores Recomendados

### Prioridad (mejor a peor)

1. **data-testid** (más estable)
```typescript
await page.getByTestId('save-button').click();
```

2. **Role + name** (accesible)
```typescript
await page.getByRole('button', { name: 'Guardar' }).click();
```

3. **Label** (formularios)
```typescript
await page.getByLabel('Nombre').fill('Valor');
```

4. **Text** (contenido)
```typescript
await page.getByText('Cancelar').click();
```

5. **CSS** (último recurso)
```typescript
await page.locator('.custom-class').click();
```

---

## 📚 Recursos

- [Documentación completa](./00_plan_testing.md)
- [Setup de Playwright](./01_playwright_setup.md)
- [Ejemplo: Insumos](./02_flows/flow_insumos.md)
- [Playwright Docs](https://playwright.dev/)

---

## ❓ Preguntas Frecuentes

### ¿Dónde se guardan los screenshots?

En `web/screenshots/`:
- `baseline/` - Referencia
- `current/` - Corrida actual

### ¿Cómo ejecuto solo un test?

```bash
npm run test:e2e -- -g "nombre del test"
```

### ¿Qué hago si un test falla?

1. Ver el screenshot capturado
2. Revisar el video (si está habilitado)
3. Ejecutar en modo debug
4. Verificar que la app esté funcionando manualmente

### ¿Cómo agrego datos de prueba?

Editar `03_scripts/utils/test-data.ts` y agregar nuevos objetos.

---

**¿Necesitas ayuda?** Revisa la [documentación completa](./00_plan_testing.md) o pregunta en el canal del equipo.
