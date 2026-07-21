# Plan Maestro de Testing E2E - Presumemi

**Versión:** 1.0  
**Fecha:** 2026-07-20  
**Estado:** Propuesta

## 1. Objetivos

### 1.1 Propósito
Establecer un framework robusto de pruebas E2E que permita:
- Validar funcionalmente todos los flujos críticos de la aplicación
- Documentar el comportamiento esperado de cada módulo
- Detectar regresiones de forma automática
- Generar evidencia visual (screenshots) de cada estado
- Asegurar accesibilidad y usabilidad

### 1.2 Alcance
- **Módulos a cubrir:** Insumos, Productos, Clientes, Presupuestos, Finanzas, Ajustes, Dashboard
- **Tipos de pruebas:** Funcionales, de navegación, validación de formularios, accesibilidad, regresión visual
- **Herramientas:** Playwright (E2E), Vitest (unitarias - futuro)

### 1.3 Beneficios
- **Trazabilidad:** Cada flujo documentado tiene pruebas asociadas
- **Confianza:** Detección temprana de regresiones
- **Documentación viva:** Screenshots actualizados automáticamente
- **Onboarding:** Nuevos desarrolladores pueden ejecutar pruebas para entender la app

---

## 2. Arquitectura de Testing

### 2.1 Estructura de Carpetas

```
docs/MVP/testing/
├── 00_plan_testing.md                    # Este documento
├── 01_playwright_setup.md                # Guía de instalación y configuración
├── 02_flows/                             # Documentación de flujos de prueba
│   ├── flow_dashboard.md
│   ├── flow_insumos.md
│   ├── flow_productos.md
│   ├── flow_clientes.md
│   ├── flow_presupuestos.md
│   ├── flow_finanzas.md
│   └── flow_ajustes.md
├── 03_scripts/                           # Scripts de Playwright
│   ├── playwright.config.ts              # Configuración global
│   ├── package.json                      # Dependencias de testing
│   ├── helpers/
│   │   ├── auth.helper.ts                # Login/logout
│   │   ├── navigation.helper.ts          # Navegación entre módulos
│   │   ├── form.helper.ts                # Interacción con formularios
│   │   ├── assertions.helper.ts          # Asserts reutilizables
│   │   └── screenshot.helper.ts          # Gestión de screenshots
│   ├── specs/
│   │   ├── dashboard.spec.ts
│   │   ├── insumos.spec.ts
│   │   ├── productos.spec.ts
│   │   ├── clientes.spec.ts
│   │   ├── presupuestos.spec.ts
│   │   ├── finanzas.spec.ts
│   │   └── ajustes.spec.ts
│   └── utils/
│       ├── test-data.ts                  # Datos de prueba
│       └── selectors.ts                  # Selectores centralizados
└── 04_screenshots/                       # Capturas de referencia
    ├── baseline/                         # Screenshots de referencia (primera corrida)
    │   ├── dashboard/
    │   ├── insumos/
    │   ├── productos/
    │   ├── clientes/
    │   ├── presupuestos/
    │   ├── finanzas/
    │   └── ajustes/
    └── current/                          # Screenshots de corrida actual
        └── [misma estructura que baseline]
```

### 2.2 Flujo de Trabajo

```
1. Desarrollo de feature
   ↓
2. Ejecutar pruebas E2E
   ↓
3. ¿Fallan? → Debug y fix
   ↓
4. ¿Pasaron? → Generar screenshots actuales
   ↓
5. Comparar con baseline
   ↓
6. ¿Diferencias visuales? → Revisar si son intencionales
   ↓
7. Actualizar baseline si es necesario
   ↓
8. Commit con evidencia
```

---

## 3. Configuración Técnica

### 3.1 Instalación de Playwright

```bash
# En la raíz del proyecto
cd web
npm install -D @playwright/test
npx playwright install
```

### 3.2 Dependencias

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

### 3.3 Scripts en package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:update-snapshots": "playwright test --update-snapshots",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## 4. Flujos de Prueba por Módulo

Cada flujo se documenta en `02_flows/` y tiene su spec correspondiente en `03_scripts/specs/`.

### 4.1 Estructura de Documento de Flujo

```markdown
# Flujo: [Nombre del Flujo]
## Propósito
## Precondiciones
## Pasos
### Paso 1: [Acción]
**Objetivo:**  
**Pasos:**
1. 
2. 
**Validaciones:**
- [ ] 
**Screenshot:** `nombre_archivo.png`

### Paso 2: [Acción]
...

## Resultado Esperado
## Criterios de Aceptación
## Casos Borde
```

### 4.2 Módulos a Cubrir

| Módulo | Flujo | Spec | Screenshots |
|--------|-------|------|-------------|
| Dashboard | `flow_dashboard.md` | `dashboard.spec.ts` | 3-5 capturas |
| Insumos | `flow_insumos.md` | `insumos.spec.ts` | 8-10 capturas |
| Productos | `flow_productos.md` | `productos.spec.ts` | 8-10 capturas |
| Clientes | `flow_clientes.md` | `clientes.spec.ts` | 5-7 capturas |
| Presupuestos | `flow_presupuestos.md` | `presupuestos.spec.ts` | 10-12 capturas |
| Finanzas | `flow_finanzas.md` | `finanzas.spec.ts` | 6-8 capturas |
| Ajustes | `flow_ajustes.md` | `ajustes.spec.ts` | 4-6 capturas |

---

## 5. Helpers Reutilizables

### 5.1 auth.helper.ts

```typescript
export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'shimbo@test.com');
  await page.fill('[data-testid="password"]', 'shimbo123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page) {
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}
```

### 5.2 form.helper.ts

```typescript
export async function fillFormField(page: Page, fieldId: string, value: string) {
  await page.click(`[data-testid="${fieldId}"]`);
  await page.fill(`[data-testid="${fieldId}"]`, value);
  await page.keyboard.press('Tab');
}

export async function selectOption(page: Page, selectId: string, optionText: string) {
  await page.click(`[data-testid="${selectId}"]`);
  await page.click(`text=${optionText}`);
}
```

### 5.3 assertions.helper.ts

```typescript
export async function assertToast(page: Page, message: string) {
  await expect(page.locator('[data-testid="toast"]')).toContainText(message);
}

export async function assertOverlayOpen(page: Page) {
  await expect(page.locator('[data-testid="overlay"]')).toBeVisible();
}

export async function assertNoConsoleErrors(page: Page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  expect(errors).toHaveLength(0);
}
```

---

## 6. Screenshots y Regresión Visual

### 6.1 Estrategia

1. **Baseline:** Primera corrida exitosa genera screenshots de referencia
2. **Current:** Cada corrida genera screenshots actuales
3. **Comparación:** Playwright compara automáticamente
4. **Diferencias:** Se marcan en rojo en el reporte

### 6.2 Tipos de Capturas

| Tipo | Descripción | Uso |
|------|-------------|-----|
| **Full Page** | Página completa | Layout general |
| **Element** | Componente específico | Detalles de UI |
| **State** | Estado específico (ej: overlay abierto) | Validación de flujos |
| **Comparison** | Antes/después | Regresión visual |

### 6.3 Ejemplo de Uso

```typescript
test('Dashboard muestra KPIs correctamente', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard');
  
  // Captura full page
  await page.screenshot({ 
    path: 'screenshots/current/dashboard.png',
    fullPage: true 
  });
  
  // Captura de elemento específico
  const kpiSection = page.locator('[data-testid="kpi-section"]');
  await kpiSection.screenshot({ 
    path: 'screenshots/current/dashboard_kpis.png' 
  });
  
  // Validaciones
  await expect(page.locator('[data-testid="kpi-ingresos"]')).toBeVisible();
  await expect(page.locator('[data-testid="kpi-por-cobrar"]')).toBeVisible();
});
```

---

## 7. Accesibilidad (a11y)

### 7.1 Herramientas

- **Playwright:** Validación manual de navegación por teclado
- **axe-core:** Escaneo automático de problemas de accesibilidad

### 7.2 Validaciones

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('Insumos cumple con WCAG 2.1 AA', async ({ page }) => {
  await login(page);
  await page.goto('/insumos');
  
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

### 7.3 Criterios

| Criterio | Validación |
|----------|------------|
| **Contraste** | Ratio mínimo 4.5:1 (texto normal) |
| **Navegación por teclado** | Tab order lógico, focus visible |
| **ARIA labels** | Todos los inputs tienen labels |
| **Focus trap** | Overlays atrapan el focus |
| **Error messages** | Asociados a inputs con aria-describedby |

---

## 8. Datos de Prueba

### 8.1 Estrategia

- **Seed data:** Datos iniciales consistentes
- **Teardown:** Limpieza después de cada test
- **Isolation:** Cada test es independiente

### 8.2 Ejemplo

```typescript
// test-data.ts
export const TEST_INSUMO = {
  nombre: 'Papel Seda Blanco',
  categoria: 'Papel',
  unidad: 'pliego',
  stockActual: 50,
  stockMinimo: 20,
  costoPaquete: 100
};

export const TEST_CLIENTE = {
  nombre: 'Cliente Test',
  email: 'test@example.com',
  telefono: '1234567890'
};
```

---

## 9. Integración con CI/CD

### 9.1 GitHub Actions (Futuro)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd web && npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

### 9.2 Reportes

- **HTML Report:** Generado automáticamente por Playwright
- **Screenshots:** Adjuntos al reporte
- **Traces:** Capturados en caso de falla

---

## 10. Documentación de Uso

### 10.1 Propósito

Además de validar, las pruebas documentan cómo usar la aplicación:
- Cada paso de un flujo muestra la interacción esperada
- Screenshots ilustran el estado de la UI
- Validaciones muestran qué es correcto

### 10.2 Generación de Guías

A partir de los flujos de prueba, se pueden generar:
- **Guías de usuario** con screenshots reales
- **Tutoriales** paso a paso
- **FAQ** basado en casos borde

---

## 11. Roadmap

### Fase 1: Setup y Dashboard (Semana 1)
- [ ] Instalar Playwright
- [ ] Configurar estructura de carpetas
- [ ] Crear helpers básicos
- [ ] Documentar y probar Dashboard

### Fase 2: Módulos Core (Semanas 2-3)
- [ ] Insumos (CRUD completo)
- [ ] Productos (CRUD + BOM)
- [ ] Clientes (CRUD)

### Fase 3: Módulos Comerciales (Semana 4)
- [ ] Presupuestos (flujo completo)
- [ ] Finanzas (movimientos)
- [ ] Ajustes

### Fase 4: Accesibilidad y Regresión (Semana 5)
- [ ] Integrar axe-core
- [ ] Validar WCAG 2.1 AA
- [ ] Configurar regresión visual

### Fase 5: CI/CD (Semana 6)
- [ ] GitHub Actions
- [ ] Reportes automáticos
- [ ] Integración con PRs

---

## 12. Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| **Cobertura de flujos** | 100% de flujos críticos |
| **Tasa de éxito** | >95% de tests pasando |
| **Tiempo de ejecución** | <10 min (suite completa) |
| **Detección de regresiones** | 100% de bugs visuales |
| **Tiempo de onboarding** | <2 horas para nuevo dev |

---

## 13. Referencias

- [Playwright Docs](https://playwright.dev/)
- [Flujos v4](../schemas%20y%20flujos/v4/)
- [Design System](../design-system/)
- [Second Review](../mvp%20correcciones/refactor_plan/Stage_2/second_review/)

---

## 14. Conclusión

Este plan establece un framework de testing robusto que:
- ✅ Alinea pruebas con documentación de flujos
- ✅ Proporciona evidencia visual automática
- ✅ Asegura accesibilidad
- ✅ Facilita onboarding
- ✅ Detecta regresiones tempranamente

**Próximo paso:** Ejecutar Fase 1 (Setup y Dashboard)
