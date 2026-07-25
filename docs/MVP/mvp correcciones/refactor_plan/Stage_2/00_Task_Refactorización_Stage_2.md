# Lista de Tareas — Refactorización Stage 2

## Fase 1: Restauración, Formato y Ajustes de Visualización

- [x] **Paso 1: Restaurar Categorías desde Master**
    - [x] Buscar `CategoriaPills.vue` y `CategoriaDeleteDialog.vue` en el historial Git de `master` / `main`.
    - [x] Copiar y ubicar los archivos restaurados en [web/src/shared/ui/](file:///d:/Desarrollando/presumemy/web/src/shared/ui/).
    - [x] Adaptar `CategoriaPills.vue` reemplazando `variant` por `allLabel` y generalizando el tipado de `Categoria`.
- [x] **Paso 2: Pruebas unitarias de format.ts y unificación ARS**
    - [x] Crear el archivo de pruebas [format.test.ts](file:///d:/Desarrollando/presumemy/web/src/shared/lib/__tests__/format.test.ts).
    - [x] Modificar [format.ts](file:///d:/Desarrollando/presumemy/web/src/shared/lib/format.ts) para usar `es-AR` y el sufijo `ARS` (`$ 1.250,00 ARS`).
    - [x] Ejecutar `npm run test` en la carpeta `web` y verificar que pase el test de formato.
- [x] **Paso 3: Limpieza de CSS Scoped en Drawers a Tailwind v4**
    - [x] Refactorizar [ClienteDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/modules/clientes/components/ClienteDrawer.vue) (remover `<style scoped>`, pasar a Tailwind v4 puro).
    - [x] Refactorizar [MovimientoDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/modules/finanzas/components/MovimientoDrawer.vue) (remover `<style scoped>`, pasar a Tailwind v4 puro).
    - [x] Refactorizar [ImprentaDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/modules/finanzas/components/ImprentaDrawer.vue) (remover `<style scoped>`, pasar a Tailwind v4 puro).
- [x] **Paso 4: Ajustes de posicionamiento de Overlays**
    - [x] Corregir [PresupuestoEditor.vue](file:///d:/Desarrollando/presumemy/web/src/modules/presupuestos/components/PresupuestoEditor.vue) a `position: fixed; top: 56px; left: 240px; right: 0; bottom: 0; z-index: 30;` con Tailwind v4.
    - [x] Ajustar envoltura de [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/components/InsumoDetalle.vue) a fixed con Tailwind v4.
    - [x] Ajustar envoltura de [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/ProductoDetalle.vue) a fixed con Tailwind v4.
- [x] **Paso 5: Remover botones de pie de página redundantes en overlays**
    - [x] Modificar `InsumoDetalle.vue` para remover botones "Guardar" y "Cancelar" del footer.
    - [x] Modificar `ProductoDetalle.vue` para remover botones del footer.
    - [x] Modificar `PresupuestoEditor.vue` para mantener solo acciones de exportación secundarias y remover guardar/cancelar.
- [x] **Paso 6: Inversión de Dependencias (DIP) - API a Stores**
    - [x] Trasladar llamadas HTTP directas en `InsumoDetalle.vue` a su Pinia `store.ts` (acciones de creación, actualización y borrado).
    - [x] Trasladar llamadas en `ProductoDetalle.vue` a su Pinia `store.ts`.
    - [x] Trasladar llamadas en `PresupuestoEditor.vue` a su Pinia `store.ts`.

---

## 🎯 Punto de Control Intermedio

- [x] **Paso 7: Verificación Funcional Intermedia**
    - [x] Ejecutar `npx vue-tsc -b` en `web/` sin errores de compilación ni tipos.
    - [x] Levantar backend y frontend e inspeccionar visualmente en el navegador:
        - [x] El posicionamiento de overlays a pantalla completa y drawers es correcto.
        - [x] El CRUD de categorías funciona inline en Insumos y Productos.
        - [x] No existen botones de guardado o cancelación duplicados.
        - [x] El formato de importes es `$ 1.250,00 ARS`.

---

## Fase 2: Componentización y Descomposición SOLID

- [x] **Paso 8: Extracción de Subcomponentes en Insumos**
    - [x] Crear [ProveedoresEditor.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/components/ProveedoresEditor.vue) y migrar la lógica de la tabla de proveedores.
    - [x] Crear [InsumoStockForm.vue](file:///d:/Desarrollando/presumemy/web/src/modules/insumos/components/InsumoStockForm.vue) y migrar el semáforo y lógica de stock.
    - [x] Limpiar estilos inline y simplificar `InsumoDetalle.vue`.
- [x] **Paso 9: Extracción de Subcomponentes en Productos**
    - [x] Crear [BomEditor.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/BomEditor.vue) y migrar la receta BOM.
    - [x] Crear [ProductoMedidasForm.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/ProductoMedidasForm.vue) y migrar el formulario de dimensiones.
    - [x] Simplificar [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/modules/productos/components/ProductoDetalle.vue).
- [x] **Paso 10: Extracción de Subcomponentes en Presupuestos**
    - [x] Crear [LinesSpreadsheet.vue](file:///d:/Desarrollando/presumemy/web/src/modules/presupuestos/components/LinesSpreadsheet.vue) y migrar la grilla interactiva.
    - [x] Crear [EditorTotals.vue](file:///d:/Desarrollando/presumemy/web/src/modules/presupuestos/components/EditorTotals.vue) y migrar la lógica de totales.
    - [x] Limpiar estilos inline y simplificar `PresupuestoEditor.vue`.
- [x] **Paso 11: Integración Final y Pruebas Visuales**
    - [x] Ejecutar typecheck final en `web/`.
    - [x] Ejecutar build de producción en `web/` (`npm run build`).
    - [ ] Validar flujos de guardado y comportamiento visual general.
