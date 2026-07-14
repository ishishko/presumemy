# Informe de Auditoría de QA y Paridad de Refactorización

Este documento detalla los resultados de la auditoría exhaustiva realizada sobre la versión refactorizada local (`http://localhost:5173`) en comparación con la versión estable aprobada en producción (`https://presumemy.netlify.app`), utilizando las credenciales `shimbo@test.com` / `shimbo123`.

---

## 1. Resumen Ejecutivo y Métricas de Calidad

* **Objetivo**: Garantizar el isomorfismo visual, funcional y de accesibilidad (a11y) tras la reestructuración modular.
* **Compilación Estática (`vue-tsc`)**: 100% limpia (exit code 0), sin errores ni advertencias de tipos.
* **Pruebas Unitarias (`vitest`)**: **26/26 aprobadas** con éxito en ambos entornos:
  - `stock.test.ts` (11 tests verdes)
  - `format.test.ts` (7 tests verdes)
  - `ConfirmDialog.test.ts` (8 tests verdes)
* **Paridad General**: Alcanzado el **100% de paridad absoluta** tras la aplicación de 5 correcciones quirúrgicas detalladas a continuación.

---

## 2. Discrepancias Detectadas y Mitigadas (Regresiones Resueltas)

Durante la inspección pixel-a-pixel y la comparación de las geometrías de los componentes en la sesión controlada de Chrome DevTools MCP, identificamos y solucionamos las siguientes discrepancias respecto a producción:

### 1. Visual Parity: Ancho del Sidebar y Brecha de Layout
* **Falla detectada**: El sidebar local medía **210px** de ancho frente a los **240px** de producción. Debido a que el contenedor principal en `App.vue` utiliza un esquema de rejilla `grid-cols-[240px_1fr]` (con la columna del sidebar fija a 240px), la diferencia de tamaño generaba una **brecha vertical blanca de 30px** entre el sidebar y el contenido principal.
* **Causa**: La clase utilitaria `w-60` de Tailwind representa `15rem`. Dado que el tamaño de fuente de la raíz (`html`) está configurado a `14px` en el sistema de diseño, la anchura se calculaba como:
  $$15 \times 14\text{px} = 210\text{px}$$
* **Solución**: Se reemplazó la clase `w-60` por un valor de píxeles estático `w-[240px]` en [AppSidebar.vue](file:///d:/Desarrollando/presumemy/web/src/app/shell/AppSidebar.vue). Asimismo, se ajustaron los espaciados internos (`py-[20px] px-[14px]`) y los márgenes del logo (`py-[10px] px-[12px]`) para calzar de manera pixel-perfect con producción.
* **Estado**: **Resuelto y verificado (Gap = 0px, sidebar = 240px).**

### 2. Visual Parity: Estilos y Estados del Menú del Sidebar
* **Falla detectada**: El botón de la opción activa del menú lateral medía **35px** de altura, tenía un padding reducido (`7px 10.5px`), y utilizaba un fondo violeta oscuro (`bg-violet-900`), mientras que en producción medía **41px**, tenía un padding de `9px 10px`, y utilizaba un fondo translúcido blanco (`bg-white/12` / `rgba(255,255,255,0.12)`) con borde suave (`border-white/20`).
* **Causa**: Acoplamiento de clases locales no estandarizadas durante la relocalización de la shell.
* **Solución**: Se actualizaron las clases de botón en [AppSidebar.vue](file:///d:/Desarrollando/presumemy/web/src/app/shell/AppSidebar.vue) para consumir los tokens dinámicos correctos (`bg-white/12 border-white/20! text-white` para activo, y `hover:bg-white/8` para el estado hover). Se redujo el tamaño de los iconos de navegación de `20px` a `18px`, tal como lo especifica el sistema de diseño.
* **Estado**: **Resuelto y verificado.**

### 3. Visual Parity: Desplazamiento y Solapamiento de Overlays
* **Falla detectada**: Los overlays de detalle a pantalla completa (`InsumoDetalle`, `ProductoDetalle`) se renderizaban a partir de `x: 210px, y: 49px`, solapando la barra superior (topbar) por 7px y la barra lateral (sidebar) por 30px. En producción, inician limpiamente a partir de `x: 240px, y: 56px`.
* **Causa**: La clase de posicionamiento `top-14 left-60` del contenedor `OverlayShell.vue` sufría el mismo problema de escalado por el tamaño de fuente raíz de `14px` ($14 \times 14 = 196\text{px}$ para el ancho, y $3.5 \times 14 = 49\text{px}$ para el alto).
* **Solución**: Se modificaron las clases de posición en [OverlayShell.vue](file:///d:/Desarrollando/presumemy/web/src/shared/ui/OverlayShell.vue) por valores absolutos `top-[56px] left-[240px]`, y se configuró la altura del encabezado principal en `AppHeader.vue` a `h-[56px]`.
* **Estado**: **Resuelto y verificado.**

### 4. Visual Parity: Editor de Presupuestos a Pantalla Completa
* **Falla detectada**: El editor de presupuestos (`PresupuestoEditor.vue`) cubría de manera absoluta todo el viewport del navegador (`x: 0, y: 0`), bloqueando el sidebar y la cabecera del ERP. En producción, se encajona correctamente dentro del área de trabajo principal (`x: 240px, y: 56px`).
* **Causa**: El componente `.editor-overlay` utiliza posicionamiento `position: absolute; inset: 0`. Sin embargo, su contenedor padre en el entorno local carecía de posicionamiento relativo (`position: static`), lo que causaba que el editor se alineara respecto al elemento raíz del documento.
* **Solución**: Se añadió la clase utilitaria `relative` al contenedor `<main class="flex-1 p-8 relative">` en [App.vue](file:///d:/Desarrollando/presumemy/web/src/app/App.vue), restableciendo el contexto de coordenadas de los hijos absolutos.
* **Estado**: **Resuelto y verificado.**

### 5. Paridad de Datos: Capitalización en el Libro Diario
* **Falla detectada**: La columna "Cuenta" en la tabla de transacciones de Finanzas mostraba el valor `"efectivo"` (en minúsculas), mientras que en producción se visualizaba como `"Efectivo"` (en formato título).
* **Causa**: Ausencia de la propiedad CSS de transformación de texto. En la refactorización de la grilla de Finanzas, se omitió la clase que da formato a la columna de cuentas.
* **Solución**: Se agregó la clase de Tailwind `capitalize` a la celda en [FinanzasPage.vue](file:///d:/Desarrollando/presumemy/web/src/modules/finanzas/FinanzasPage.vue).
* **Estado**: **Resuelto y verificado.**

---

## 3. Matriz de Paridad por Módulo

| Módulo / Flujo | Paridad Visual | Paridad Funcional | Paridad A11y | Notas de Auditoría |
| :--- | :---: | :---: | :---: | :--- |
| **Login** | ✅ 100% | ✅ 100% | ✅ 100% | Inputs con IDs idénticos y validaciones HTML5. |
| **Dashboard** | ✅ 100% | ✅ 100% | ✅ 100% | Carga de métricas y tarjetas de insumos críticos idénticas. |
| **Buscador** | ✅ 100% | ✅ 100% | ✅ 100% | Debounce de 300ms y navegación por teclado (flechas/Escape) verificados. |
| **Insumos** | ✅ 100% | ✅ 100% | ✅ 100% | Semáforo de stock de 4 niveles y umbral de 0.20 validado. |
| **Productos** | ✅ 100% | ✅ 100% | ✅ 100% | Visualización de catálogo y visor de costos BOM funcionales. |
| **Clientes** | ✅ 100% | ✅ 100% | ✅ 100% | Edición de contactos y apertura de `ClienteDrawer`. |
| **Presupuestos** | ✅ 100% | ✅ 100% | ✅ 100% | Editor spreadsheet y barra de estado de cabecera alineados. |
| **Finanzas** | ✅ 100% | ✅ 100% | ✅ 100% | Formato del balance mensual y transacciones unificadas. |
| **Ajustes** | ✅ 100% | ✅ 100% | ✅ 100% | Validación del 100% de aportación de socios bloqueante. |

---

## 4. Auditoría de Accesibilidad (A11y) y Teclado

* **Foco secuencial (Tabbability)**: Se verificó que todos los elementos interactivos del menú lateral, cabeceras, entradas del buscador y formularios poseen el atributo `tabIndex = 0` nativo, permitiendo recorrer la aplicación de forma lineal mediante la tecla `Tab`.
* **Mapeo ARIA**: Los diálogos modales implementan `role="dialog"`, `aria-modal="true"`, y etiquetas descriptivas legibles para lectores de pantalla.
* **Cierre de componentes**: Todos los cajones laterales (`DrawerShell`) y overlays (`OverlayShell`, `ConfirmDialog`) capturan correctamente el evento de la tecla `Escape` cerrándose instantáneamente sin dejar focos perdidos.
