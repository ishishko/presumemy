---
trigger: always_on
---

# Reglas de Convivencia y Desarrollo — Presumemi microERP

## 1. Contexto Global del Proyecto
- **Proyecto:** Presumemi (microERP minimalista para MemyDeni, negocio artesanal de artículos de papel).
- **Stack Tecnológico:** Vue 3 + Vite + TypeScript + Tailwind v4 (Frontend SPA en `/web`) y Hono + Prisma v6 + Supabase PostgreSQL (Backend API en `/api`).
- **Ecosistema Multi-Agente Activo:** Este repositorio es trabajado en paralelo por **Antigravity 2.0** (este agente), **Claude Code** (CLI/Terminal) y **Opencode** (Editor de Código).

## 2. Protocolo de Coexistencia de Agentes (¡Crucial!)
Para evitar colisiones de Git, bloqueos de archivos (*file locks*) y pérdidas de código, Antigravity debe seguir estrictamente estas pautas operativas:
- **Respeto a Configuraciones Ajenas:** Nunca modificar, sobreescribir ni borrar los archivos `CLAUDE.md`, `AGENTS.md` u `opencode.json`. Son las fuentes de verdad de las otras herramientas.
- **Flujo de Trabajo Aislado:** Al realizar modificaciones de código masivas o refactorizaciones, priorizar siempre la ejecución en **New Worktree Mode** o generar **Artifacts** estructurados para que el usuario valide los cambios antes de fusionar. Esto permite que Claude Code y Opencode sigan operando en la rama activa sin conflictos.
- **Políticas de Acceso de Opencode:** Respetar los límites definidos en `opencode.json`. Toda la ruta `./docs/Sessions/**/*` está estrictamente protegida (`deny`) tanto para lectura como para edición.

## 3. Comandos de Verificación e Infraestructura
Al interactuar con el entorno local o la terminal embebida, utiliza únicamente los comandos estándar del proyecto:
- **Frontend (`/web`):**
  - Levantar entorno: `npm run dev` (puerto 5173). Tiene `usePolling: true` para compatibilidad WSL.
  - Compilación/Validación de Tipos: `npm run build` o `npx vue-tsc -b` (para typecheck rápido sin compilar).
- **Backend (`/api`):**
  - Levantar entorno: `npm run dev` (puerto 3000, usando tsx watch).
  - Base de Datos y ORM: `npm run db:migrate` para nuevas migraciones, `npm run db:studio` para explorar datos, y `npm run db:seed` para insertar los datos iniciales de prueba.

## 4. Reglas de Oro del Sistema de Diseño (Design System)
Cualquier código generado para el Frontend (`/web`) debe basarse estrictamente en los tokens estáticos declarados en `docs/MVP/design-system/project/`. **No inventar clases, estilos ni componentes nuevos.**

### Restricciones Estrictas de Interfaz (UI) e Idioma:
- **Prohibición de Emojis:** Está terminantemente prohibido usar emojis en cualquier parte de la interfaz de usuario del producto. Nunca los incluyas.
- **Puntuación en la UI:** No colocar punto final (`.`) en textos de botones, elementos de menú, celdas de tablas ni etiquetas (*labels*).
- **Sentence Case:** Todo el contenido de texto debe usar *Sentence case* (solo la primera letra en mayúscula). Las MAYÚSCULAS se reservan únicamente para elementos pequeños de tipo *eyebrow* (`h6` menores o iguales a 12px) o encabezados de tablas.
- **Idioma y Tono:** Español (es-MX / neutro latinoamericano). Tratamiento en segunda persona del singular o "tuteo" (`tu`), excepto cuando el sistema realiza una acción automatizada, donde se usa la primera persona del plural (`"guardamos tus cambios"`).

### Especificaciones de Componentes Visuales:
- **Traducción de Componentes:** La referencia interactiva del sistema de diseño está escrita en React (`.jsx`) dentro de `docs/MVP/design-system/project/ui_kits/presumemi/`. Antigravity debe traducir esa lógica visual a componentes de Vue 3 Single File Components (`Vue SFC`) usando `<script setup>` con TypeScript. No se debe inyectar código JSX o de React en la carpeta `/web`.
- **Formato de Moneda:** En cualquier sección financiera o de reportes, mostrar los montos con el formato estricto `$ 1,250.00 MXN`. La abreviación `MXN` solo puede omitirse en tablas de datos de alta densidad donde el espacio sea crítico.
- **Tablas de Datos:** Los encabezados de las tablas (`thead`) deben ir siempre en mayúsculas (`uppercase`), con un tamaño de fuente pequeño (11px), color `--ink-muted` y un espaciado de letras expandido (`letter-spacing: 0.06em`). Las celdas del cuerpo usan una fuente de 13px y el hover de la fila debe aplicar el fondo `--page-bg`.
- **Estilos con Tailwind v4:** No busques ni crees un archivo `tailwind.config.js`. En Tailwind v4 las extensiones del tema y variables se declalan directamente en el archivo CSS principal (usualmente `colors_and_type.css` o `styles.css`) usando la directiva `@theme`.
- **Transiciones:** Las transiciones entre páginas/rutas dentro de la SPA deben ser **instantáneas** (sin animaciones fluidas ni delays). Las micro-animaciones en componentes (como menús desplegables o drawers) tienen un límite estricto de entrada de 180ms (`cubic-bezier(0.2, 0.8, 0.2, 1)`) y los hovers comunes duran 120ms (`ease`).

## 5. Capacidades y Habilidades Extra (`Skills`)
- Antigravity cuenta con extensiones de conocimiento adicionales almacenadas en la ruta local `./.agents/skills/`. 
- El agente evaluará los metadatos de dichas carpetas bajo el patrón de *Progressive Disclosure* y activará las instrucciones de cada habilidad de forma autónoma cuando la tarea del usuario lo requiera.