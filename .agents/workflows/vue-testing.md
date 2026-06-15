---
description: Permite al desarrollador delegar la generación de pruebas de forma asíncrona asegurando el alcance exacto de la intervención.
---

# /vue-testing — Testing Continuo del MVP en Paralelo

## Steps
1. **Inicialización del Entorno Aislado:**
   - **Instrucción de Terminal:** El agente debe verificar si existe el directorio de configuración local `.agents/skills/vitest/`. De lo contrario, debe forzar su instalación ejecutando estrictamente el siguiente comando en la terminal aislada:
     ```bash
     if [ ! -d ".agents/skills/vitest" ]; then
       npx skills add https://github.com/onmax/nuxt-skills --skill vitest
     fi

     if [ ! -d ".agents/skills/vue-testing-best-practices" ]; then
       npx skills add https://github.com/hyf0/vue-skills --skill vue-testing-best-practices
     fi
     ```
   - **Punto de Control Obligatorio:** Una vez completadas las descargas, el agente **DEBE detener la ejecución** y mostrar un mensaje explícito en la UI: 
     > "Las mallas de contexto para Vitest y Vue han sido instaladas con éxito. Por favor, reinicie esta sesión o el orquestador de Antigravity para forzar el Discovery phase de las nuevas skills, y luego invoque la Fase 2."
2. **Definición y Validación del Scope (Fase Crítica):**
   - El subagente debe escanear el repositorio y cruzar el estado del código con el prompt del usuario.
   - **Obligatorio:** Generar un artefacto interno de tipo `Implementation Plan` que liste de manera explícita la **Matriz de Alcance del Test**. Esta matriz debe clasificar las acciones exactamente en tres listas:
     * `CREAR`: [Rutas de archivos de test nuevos a generar]
     * `MODIFICAR`: [Rutas de archivos de test existentes que requieren cambios]
     * `ELIMINAR`: [Rutas de archivos obsoletos a remover]
   - Si el flujo corre con intervención humana, el agente pausará aquí esperando confirmación. Si corre bajo el comando `/goal`, el agente usará esta matriz como su contrato estricto de ejecución.

3. **Generación Guiada por el Scope:**
   - El subagente procesará únicamente los archivos declarados en el paso anterior aplicando la skill `@mvp-continuous-testing`.
   - Se prohíbe terminantemente crear, alterar o eliminar cualquier archivo que no figure explícitamente en la lista de la Matriz de Alcance.

4. **Verificación Autónoma:**
   - Ejecutar la suite mediante la terminal aislada (ej. `vitest run`).
   - El agente debe autocorregir fallas de aserción sin salirse del alcance delimitado.
   - De ser necesario generar pruebas para archivos no declarados, deberá solicitar permiso al usuario mediante un nuevo `Implementation Plan` para su validació.

5. **Entrega de Artefacto:**
   - Consolidar los resultados en un componente de tipo `Walkthrough` para la unificación final en la GUI.