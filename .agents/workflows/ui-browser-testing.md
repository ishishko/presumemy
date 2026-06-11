---
description: Este flujo automatiza el arranque de la infraestructura del microERP Presumemi, abre una sesión del navegador controlada mediante Chrome DevTools (MCP) y valida los componentes visuales de Vue bajo las restricciones del Design System.
---

# /test-ui — Flujo Automático de Pruebas de Interfaz con Navegador

## Pasos del Workflow

1. **Paso 1: Inicialización de Infraestructura Local**
   - El agente debe abrir la consola y arrancar el backend en segundo plano:
     ```bash
     cd api && npm run dev
     ```
   - Acto seguido, debe levantar el servidor de desarrollo frontend de Vite en la carpeta web:
     ```bash
     cd web && npm run dev
     ```
   - El agente esperará a que Vite confirme que está escuchando peticiones en `http://localhost:5173`.

2. **Paso 2: Lanzamiento del Navegador e Inspección**
   - El agente utilizará la capacidad de automatización de navegación para abrir la dirección local: `http://localhost:5173`
   - Conectará de inmediato el servidor MCP de **Chrome DevTools** para monitorear la sesión en tiempo real.

3. **Paso 3: Auditoría y Verificación del Diseñó (Guardrails)**
   - El agente inspeccionará el DOM y la consola de JavaScript buscando activamente:
     - Errores o advertencias de renderizado de Vue o TypeScript.
     - **Validación Estricta:** Asegurarse de que no existan emojis inyectados en los textos y que los botones o etiquetas no contengan un punto final (`.`).
     - **Validación de Estilos:** Comprobar mediante las DevTools que las tablas de datos apliquen el formato CSS estipulado (encabezados en mayúsculas, fuente pequeña de 11px, espaciado `letter-spacing: 0.06em` y color `--ink-muted`).

4. **Paso 4: Entrega de Resultados Visuales**
   - Una vez completada la navegación por la vista solicitada, el agente consolidará un **Walkthrough Artifact**.
   - El reporte incluirá una bitácora detallada de los componentes analizados junto con capturas de pantalla (*screenshots*) automáticas generadas por el navegador para que puedas verificar los acabados visuales.