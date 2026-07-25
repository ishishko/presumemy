# Testing E2E - Presumemi

Framework completo de pruebas end-to-end para la aplicación Presumemi, basado en Playwright.

## 📋 Contenido

- [00_plan_testing.md](./00_plan_testing.md) - Plan maestro de testing (arquitectura, roadmap, métricas)
- [01_playwright_setup.md](./01_playwright_setup.md) - Guía de instalación y configuración
- [02_flows/](./02_flows/) - Documentación detallada de flujos de prueba por módulo
- [03_scripts/](./03_scripts/) - Scripts de Playwright, helpers y utilidades

## 🚀 Quick Start

### 1. Instalación

```bash
cd web
npm install -D @playwright/test
npx playwright install
```

### 2. Ejecutar Tests

```bash
# Todos los tests
npm run test:e2e

# Con UI interactiva
npm run test:e2e:ui

# Un módulo específico
npm run test:e2e insumos

# Ver reporte
npm run test:e2e:report
```

### 3. Primer Test

Ver [01_playwright_setup.md](./01_playwright_setup.md) para crear tu primer test.

## 📁 Estructura

```
testing/
├── 00_plan_testing.md          # Plan maestro
├── 01_playwright_setup.md      # Guía de instalación
├── 02_flows/                   # Documentación de flujos
│   ├── flow_insumos.md        # Flujo completo de Insumos (ejemplo)
│   ├── flow_productos.md      # (pendiente)
│   ├── flow_clientes.md       # (pendiente)
│   └── ...
├── 03_scripts/                 # Scripts de Playwright
│   ├── specs/                  # Tests por módulo
│   │   ├── insumos.spec.ts    # Tests de Insumos (ejemplo)
│   │   └── ...
│   ├── helpers/                # Funciones reutilizables
│   │   ├── auth.helper.ts     # Login/logout
│   │   ├── navigation.helper.ts
│   │   └── ...
│   └── utils/                  # Utilidades
│       └── test-data.ts       # Datos de prueba
└── README.md                   # Este archivo
```

## 🎯 Módulos Cubiertos

| Módulo | Flujo | Spec | Estado |
|--------|-------|------|--------|
| Dashboard | `flow_dashboard.md` | `dashboard.spec.ts` | ⏳ Pendiente |
| Insumos | [`flow_insumos.md`](./02_flows/flow_insumos.md) | [`insumos.spec.ts`](./03_scripts/specs/insumos.spec.ts) | ✅ Ejemplo |
| Productos | `flow_productos.md` | `productos.spec.ts` | ⏳ Pendiente |
| Clientes | `flow_clientes.md` | `clientes.spec.ts` | ⏳ Pendiente |
| Presupuestos | `flow_presupuestos.md` | `presupuestos.spec.ts` | ⏳ Pendiente |
| Finanzas | `flow_finanzas.md` | `finanzas.spec.ts` | ⏳ Pendiente |
| Ajustes | `flow_ajustes.md` | `ajustes.spec.ts` | ⏳ Pendiente |

## 📚 Documentación de Flujos

Cada flujo está documentado con:
- **Objetivo** del flujo
- **Precondiciones** necesarias
- **Pasos** detallados con validaciones
- **Screenshots** de cada estado
- **Casos borde** a considerar

Ejemplo: [`flow_insumos.md`](./02_flows/flow_insumos.md)

## 🔧 Helpers Disponibles

### auth.helper.ts

```typescript
import { login, logout } from '../helpers/auth.helper';

// Login automático
await login(page);

// Logout
await logout(page);
```

### test-data.ts

```typescript
import { TEST_INSUMO, TEST_CLIENTE } from '../utils/test-data';

// Usar datos de prueba
await page.fill('[name="nombre"]', TEST_INSUMO.nombre);
```

## 📸 Screenshots

Los screenshots se generan automáticamente en:
- `screenshots/baseline/` - Referencia (primera corrida exitosa)
- `screenshots/current/` - Corrida actual

Para actualizar baseline:
```bash
npm run test:e2e:update
```

## ♿ Accesibilidad

Los tests incluyen validaciones de accesibilidad:
- Navegación por teclado
- Contraste de colores
- Labels ARIA
- Focus management

## 📊 Reportes

Playwright genera reportes HTML automáticamente:

```bash
npm run test:e2e:report
```

## 🔄 CI/CD

Configuración de GitHub Actions (pendiente):

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd web && npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 🎓 Cómo Contribuir

### Agregar un Nuevo Test

1. **Documentar el flujo** en `02_flows/flow_[modulo].md`
2. **Crear el spec** en `03_scripts/specs/[modulo].spec.ts`
3. **Agregar helpers** si son necesarios
4. **Generar screenshots** de referencia
5. **Actualizar** este README

### Convenciones

- Nombres de archivos: `kebab-case.spec.ts`
- Nombres de tests: Descriptivos en español
- Screenshots: `NN_descripcion.png` (ej: `01_insumos_list.png`)
- Commits: `test(modulo): descripción`

## 🔗 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Plan Maestro](./00_plan_testing.md)
- [Flujos v4](../schemas%20y%20flujos/v4/)
- [Design System](../design-system/)

## 📞 Soporte

Para dudas o problemas:
1. Revisar [01_playwright_setup.md](./01_playwright_setup.md#troubleshooting)
2. Consultar documentación de Playwright
3. Revisar ejemplos en `03_scripts/specs/`

---

**Estado actual:** Framework inicializado con ejemplo de Insumos  
**Próximo paso:** Implementar módulos pendientes según roadmap
