# Índice - Testing E2E Presumemi

Framework completo de pruebas end-to-end para validar el funcionamiento de la aplicación.

---

## 📖 Documentación

### Planificación y Setup
- **[00_plan_testing.md](./00_plan_testing.md)** - Plan maestro (arquitectura, fases, métricas)
- **[01_playwright_setup.md](./01_playwright_setup.md)** - Guía de instalación y configuración
- **[GUIA_RAPIDA.md](./GUIA_RAPIDA.md)** - Quick start y ejemplos prácticos

### Flujos de Prueba
Documentación detallada de cada módulo:

| Módulo | Documento | Estado |
|--------|-----------|--------|
| Dashboard | `flow_dashboard.md` | ⏳ Pendiente |
| **[Insumos](./02_flows/flow_insumos.md)** | Flujo CRUD completo | ✅ Ejemplo |
| Productos | `flow_productos.md` | ⏳ Pendiente |
| Clientes | `flow_clientes.md` | ⏳ Pendiente |
| Presupuestos | `flow_presupuestos.md` | ⏳ Pendiente |
| Finanzas | `flow_finanzas.md` | ⏳ Pendiente |
| Ajustes | `flow_ajustes.md` | ⏳ Pendiente |

### Scripts y Código
- **[specs/](./03_scripts/specs/)** - Tests de Playwright por módulo
  - [`insumos.spec.ts`](./03_scripts/specs/insumos.spec.ts) ✅ Ejemplo completo
- **[helpers/](./03_scripts/helpers/)** - Funciones reutilizables
  - [`auth.helper.ts`](./03_scripts/helpers/auth.helper.ts) - Login/logout
- **[utils/](./03_scripts/utils/)** - Utilidades
  - [`test-data.ts`](./03_scripts/utils/test-data.ts) - Datos de prueba

---

## 🎯 Estado Actual

### ✅ Completado
- [x] Plan maestro de testing
- [x] Guía de instalación de Playwright
- [x] Estructura de carpetas
- [x] Helpers básicos (auth, navigation)
- [x] Ejemplo completo: Módulo Insumos
  - [x] Documentación de flujo (13 pasos)
  - [x] Spec de Playwright con tests
  - [x] Datos de prueba
- [x] Guía rápida de uso
- [x] Índice de documentación

### ⏳ Pendiente
- [ ] Instalar Playwright en el proyecto
- [ ] Configurar playwright.config.ts
- [ ] Ejecutar primer test de Insumos
- [ ] Implementar módulos restantes:
  - [ ] Dashboard
  - [ ] Productos
  - [ ] Clientes
  - [ ] Presupuestos
  - [ ] Finanzas
  - [ ] Ajustes
- [ ] Configurar CI/CD con GitHub Actions
- [ ] Integrar axe-core para accesibilidad
- [ ] Configurar regresión visual con snapshots

---

## 🚀 Primeros Pasos

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

### 3. Ver Reporte
```bash
npm run test:e2e:report
```

---

## 📊 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Módulos documentados | 1/7 (14%) |
| Tests implementados | 13 (Insumos) |
| Helpers creados | 2 |
| Screenshots de referencia | 13 |

---

## 🎓 Cómo Contribuir

1. **Leer** la [Guía Rápida](./GUIA_RAPIDA.md)
2. **Elegir** un módulo pendiente
3. **Documentar** el flujo en `02_flows/`
4. **Implementar** tests en `03_scripts/specs/`
5. **Generar** screenshots de referencia
6. **Actualizar** este índice

---

## 🔗 Recursos Externos

- [Playwright Docs](https://playwright.dev/)
- [Playwright - Selectors](https://playwright.dev/docs/selectors)
- [Playwright - Assertions](https://playwright.dev/docs/test-assertions)
- [Playwright - Screenshots](https://playwright.dev/docs/screenshots)

---

## 📞 Soporte

- **Documentación:** Ver [00_plan_testing.md](./00_plan_testing.md)
- **Troubleshooting:** Ver [01_playwright_setup.md](./01_playwright_setup.md#troubleshooting)
- **Ejemplos:** Ver [02_flows/flow_insumos.md](./02_flows/flow_insumos.md)

---

**Última actualización:** 2026-07-20  
**Versión:** 1.0  
**Mantenimiento:** Equipo de Desarrollo
