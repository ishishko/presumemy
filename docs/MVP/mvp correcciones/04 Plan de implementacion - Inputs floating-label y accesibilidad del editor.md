# Plan de Implementación — Inputs floating-label, sombras de estado y accesibilidad del editor de presupuestos (V4)

Este plan detalla la modernización del formulario de presupuestos: un componente de input reutilizable con *floating label*, retroalimentación de estado por color (sombras tenues), una capa completa de accesibilidad sobre el editor, la reestructuración de las secciones del formulario, la reubicación del badge de estado al topbar y la normalización de fin de línea del repositorio.

El objetivo transversal es que el usuario **identifique rápida y sutilmente el estado del formulario sin saturación visual**, manteniendo coherencia con el Design System de Presumemi.

---

## User Review Required

> [!IMPORTANT]
> **Decisiones tomadas con el usuario durante la sesión:**
> - **Fechas**: se mantiene el `<input type="date">` nativo. El formato (mm/dd/yyyy vs dd/mm/yyyy) depende del idioma del navegador y NO se fuerza por ahora.
> - **Modo solo-lectura** (Facturado/Cerrado/Cancelado): el rediseño completo queda **pendiente** (fase aparte a conversar). En esta entrega solo se logra que los campos deshabilitados se **vean** deshabilitados.
> - **Color del label flotante**: es **siempre el color fuerte del estado vigente** (celeste/verde/rojo). **Solo en focus el label es violeta**.
> - **Verde = carga correcta**: tener contenido no alcanza; si el valor es incorrecto (incluyendo vacío en campos requeridos), el campo se marca en **rojo** (evaluado en el blur).
> - **Encabezados de sección**: se eliminan en *Cliente y evento*, *Pago*, *Productos* y *Notas*. **Entrega conserva su encabezado.**
> - **Orden de secciones**: *Pago* sube por encima de *Entrega*.
> - **Tokens nuevos**: se crean variantes dark/fuertes y la familia verde (no existía en el DS).

---

## Proposed Changes

### Componente: Design System (tokens)

#### [MODIFY] [tokens.css](file:///D:/Desarrollando/presumemy/web/src/assets/css/tokens.css)
- Agregar variantes fuertes ("ink") legibles como texto sobre fondo claro y la familia verde inexistente:
  ```
  --teal-700:   #2E6F70;   /* celeste fuerte */
  --coral-700:  #C24524;   /* coral fuerte */
  --violet-900: #6E1D59;   /* violeta oscuro (focus) */
  --green-50:   #E7F4EC;   /* tint verde */
  --green-500:  #34A56C;   /* acento / sombra de estado válido */
  --green-700:  #1B7A4B;   /* verde fuerte (texto label) */
  ```

### Componente: Frontend Web

#### [NEW] [FloatingField.vue](file:///D:/Desarrollando/presumemy/web/src/components/ui/FloatingField.vue)
- Input reutilizable con *floating label* tipo pill, re-pintado con tokens del DS (no se copia el CSS crudo de uiverse).
- El estado flotante se deriva en Vue (`focus || hasValue || alwaysFloat`), **no** con `:valid` (que rompe en campos opcionales).
- **Sombras tenues por estado** (ring de 3px): celeste = vacío, verde = correcto, rojo = incorrecto/bloqueante, **violeta en focus**.
- **Color del texto del label**: siempre el fuerte del estado (`--teal-700`/`--green-700`/`--coral-700`); violeta (`--violet-900`) en focus.
- **Máquina de estados (precedencia focus > rojo > verde > celeste)**:
  - `focus` → violeta.
  - no-focus + `invalid` **o** (`required` && vacío && `touched`) → rojo.
  - no-focus + con valor correcto → verde.
  - no-focus + opcional && vacío → celeste.
  - `touched` se activa en el blur (un requerido vacío sin tocar arranca celeste, no rojo).
- Props: `id`, `label`, `v-model`, `placeholder`, `list`, `autocomplete`, `disabled`, `readonly`, `required`, `invalid`, `describedby`, `type` (`text|date|number`), `multiline` (textarea), `prefix` (ej. `$`), `floatSize` (`16px|14px|13px`), `alwaysFloat`.
- Conserva los placeholders de ejemplo: el label oficia de placeholder en reposo y el ejemplo aparece al enfocar.

#### [MODIFY] [PresupuestoEditor.vue](file:///D:/Desarrollando/presumemy/web/src/components/editors/PresupuestoEditor.vue)
- **Reestructura de secciones**: nuevo orden *Cliente y evento → Pago → Entrega → Productos → Notas*. Se eliminan los `form-section-head` salvo el de *Entrega*.
- **Swap de inputs a FloatingField**:
  - `Cliente` → `floatSize="16px"`, `required`, `invalid` cuando hay texto sin cliente real (`clienteId === 0`).
  - `Temática` → renombrado a **Evento**.
  - `Fecha de fiesta` / `Fecha de entrega` → `type="date"` + `alwaysFloat`. Se elimina el ícono Calendar superpuesto.
  - `Método de pago` → estética de Cliente.
  - `Seña` → `type="number"`, `prefix="$"`, `floatSize="13px"`, `invalid` si NaN/negativo.
  - `Resto` → `prefix="$"`, `readonly`, `alwaysFloat`, sin animación (campo calculado siempre con contenido → verde).
  - `Lugar de envío` → FloatingField default.
  - `Notas` → FloatingField `multiline` (textarea).
- **Entrega**: el label "Método de envío" pasa a ser **subtítulo inline del encabezado** (`<h4>Entrega</h4> <span class="form-subhead">…</span>`). El `segmented` queda debajo a la izquierda y `Lugar de envío` llena el resto.
- **Productos**: la palabra **"Producto" en negrita** en el `<th>` para señalar el inicio de la tabla. El flujo interno de filas queda pendiente.
- **Badge de estado reubicado al topbar** mediante `<Teleport to="#editor-header-status">`, manteniendo en el editor toda su lógica (transiciones, dropdown, accesibilidad).
- **Accesibilidad del editor**:
  - Overlay como `role="dialog"` + `aria-modal` + `aria-label`; **focus-trap** (Tab/Shift+Tab circular), foco inicial al primer campo y restauración del foco al cerrar; **Escape** dispara el cierre con confirmación.
  - **Validación inline** por campo (Cliente, Productos) con `role="alert"` + `aria-invalid`/`aria-describedby` (se conserva el toast como refuerzo).
  - `aria-label` en botones de íconos (estado, eliminar línea) e íconos decorativos con `aria-hidden`.
  - Segmented *Retira/Envío* como `radiogroup` con `aria-checked`, roving `tabindex` y navegación por flechas.
  - Status dropdown con `aria-haspopup`/`aria-expanded` y `role="menu"`/`menuitem`.
- **Espaciado**: `form-section-body` gap 12→18px y `form-row` `align-items: end → start` (evita que el error inline desalinee la fila).

#### [MODIFY] [AppHeader.vue](file:///D:/Desarrollando/presumemy/web/src/components/layout/AppHeader.vue)
- Agregar el destino del Teleport `#editor-header-status` en `header-left`, después del botón cerrar.
- `.header-status-slot:empty { display: none }` para que no genere gap fantasma cuando no hay editor abierto.

#### [MODIFY] [components.css](file:///D:/Desarrollando/presumemy/web/src/assets/css/components.css)
- Reglas reales para `.input:disabled` / `[readonly]` (fondo `--page-bg`, texto muted, `cursor: not-allowed`) y `:focus-visible` en botones/radios/menuitems.
- `.err` general (mensaje de error fuera de `.field`).

### Componente: Configuración del repositorio

#### [NEW] [.gitattributes](file:///D:/Desarrollando/presumemy/.gitattributes)
- `* text=auto eol=lf` + binarios marcados como `binary`, para que el repo guarde **siempre LF** en cualquier SO y se elimine el churn CRLF en `git status`.
- Renormalización única de los blobs que estaban en CRLF.

---

## Verification Plan

### Automated Verification
- Validar tipos: `cd web && npx vue-tsc -b` → cero errores.

### Manual Verification
1. **Floating label y estados**:
   - Abrir `/presupuestos` → "Nuevo presupuesto".
   - Cliente: el label sube a 16px (pill); en focus label+ring violeta; al perder foco toma el color del estado (vacío = celeste, con texto válido = verde, sin cliente real = rojo).
   - Seña: prefijo `$`, label 13px, rojo si negativa. Resto: `$`, readonly, verde estático sin animación.
2. **Reestructura**:
   - Orden Cliente/evento → Pago → Entrega → Productos → Notas.
   - Entrega conserva título con "Método de envío" inline; Productos sin título con "Producto" en negrita.
3. **Badge en topbar**:
   - En un presupuesto existente, el badge de estado aparece en el topbar junto a la X; el dropdown se despliega sin recortes.
   - En un presupuesto nuevo no aparece badge.
4. **Accesibilidad por teclado**:
   - Tab entra al primer campo; Escape cierra (con confirmación si hay cambios); el foco no escapa del dialog; las flechas mueven el segmented.
   - Intentar crear sin cliente → error inline visible + `aria-invalid`.
5. **Solo lectura**:
   - Abrir un presupuesto **facturado**: los campos disabled se ven bloqueados (sin colores de estado).
6. **Fin de línea**:
   - `git status` queda limpio (sin churn de ~60 archivos) tras el commit de normalización.

---

## Pendientes (próxima iteración)
- Rediseño completo del **modo solo-lectura** (documento tipo factura / banner + acciones / duplicar / campos como texto).
- **Otros casos no contemplados** en la carga de datos.
- **Flujo interno de la tabla de productos** (edición de filas).
- Formato de fecha en español (requiere componente propio; hoy se deja nativo).
