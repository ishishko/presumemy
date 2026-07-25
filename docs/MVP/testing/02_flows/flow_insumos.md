# Flujo: Gestión de Insumos

**Módulo:** Inventario  
**Ruta:** `/insumos`  
**Componente principal:** `InsumosPage.vue`  
**Overlay:** `InsumoDetalle.vue`

---

## Propósito

Validar el ciclo de vida completo de un insumo: creación, edición, filtrado, validaciones y eliminación.

---

## Precondiciones

- Usuario autenticado (ver `auth.setup.ts`)
- Servidor backend corriendo en `http://localhost:3000`
- Servidor frontend corriendo en `http://localhost:5173`
- Base de datos con datos seed iniciales

---

## Pasos del Flujo

### Paso 1: Navegación al Módulo

**Objetivo:** Verificar que el módulo de Insumos carga correctamente  
**Pasos:**
1. Hacer click en "Insumos" en el sidebar
2. Esperar a que cargue la tabla

**Validaciones:**
- [ ] URL cambia a `/insumos`
- [ ] Sidebar resalta "Insumos"
- [ ] Tabla de insumos es visible
- [ ] Filtros de stock (Todos, OK, Bajo, Crítico, Sin unidades) son visibles
- [ ] Filtros de categoría son visibles
- [ ] Botón "Crear nuevo" es visible

**Screenshot:** `01_insumos_list.png`

---

### Paso 2: Listado de Insumos

**Objetivo:** Verificar que los datos se muestran correctamente  
**Pasos:**
1. Verificar que la tabla muestra columnas correctas
2. Verificar formato de moneda en "Costo unitario"
3. Verificar que StockBar muestra niveles de color

**Validaciones:**
- [ ] Columnas: Insumo, Categoría, Stock, Mínimo, Costo unitario, Nivel, Acciones
- [ ] Costo unitario tiene formato `$ X,XX` (ej: `$ 8,80`)
- [ ] StockBar muestra colores según nivel (verde/amarillo/rojo)
- [ ] Cada fila tiene botones Editar y Eliminar

**Screenshot:** `02_insumos_table.png`

---

### Paso 3: Filtros de Stock

**Objetivo:** Verificar que los filtros de stock funcionan correctamente  
**Pasos:**
1. Click en pill "OK"
2. Verificar que solo se muestran insumos con stock >= mínimo
3. Click en pill "Bajo"
4. Verificar que solo se muestran insumos con stock bajo
5. Click en pill "Todos" para resetear

**Validaciones:**
- [ ] Pill "OK" filtra correctamente (badge verde activo)
- [ ] Pill "Bajo" filtra correctamente (badge amarillo activo)
- [ ] Pill "Crítico" filtra correctamente (badge rojo activo)
- [ ] Pill "Sin unidades" filtra correctamente
- [ ] Pill "Todos" resetea el filtro

**Screenshots:** 
- `03_filtro_ok.png`
- `04_filtro_bajo.png`

---

### Paso 4: Filtros de Categoría

**Objetivo:** Verificar que los filtros de categoría funcionan  
**Pasos:**
1. Verificar que las categorías muestran formato correcto (ej: "Cortes · 3")
2. Click en categoría "Papel"
3. Verificar que solo se muestran insumos de papel
4. Click en "Todas" para resetear

**Validaciones:**
- [ ] Categorías muestran separador "·" (no caracteres rotos)
- [ ] Click en categoría filtra la tabla
- [ ] Badge de categoría se activa
- [ ] Click en "Todas" resetea el filtro

**Screenshot:** `05_filtro_categoria.png`

---

### Paso 5: Abrir Overlay de Creación

**Objetivo:** Verificar que el overlay de creación se abre correctamente  
**Pasos:**
1. Click en botón "Crear nuevo" (header)
2. Esperar a que se abra el overlay

**Validaciones:**
- [ ] Overlay se abre a pantalla completa
- [ ] Overlay está anclado a `left: 240px` (sin gap con sidebar)
- [ ] Header muestra "Nuevo"
- [ ] Header muestra botones Guardar y Cerrar
- [ ] Formulario tiene todos los campos vacíos
- [ ] Campo "Nombre" está enfocado

**Screenshot:** `06_overlay_create.png`

---

### Paso 6: Completar Formulario de Creación

**Objetivo:** Verificar que el formulario acepta datos correctamente  
**Pasos:**
1. Completar campo "Nombre": "Papel Seda Blanco"
2. Seleccionar categoría: "Papel"
3. Seleccionar unidad: "pliego"
4. Ingresar stock actual: 50
5. Ingresar stock mínimo: 20
6. Ingresar costo paquete: 100

**Validaciones:**
- [ ] Todos los campos aceptan input
- [ ] Dropdown de categorías muestra opciones
- [ ] Labels flotan correctamente al enfocar
- [ ] No hay errores de validación
- [ ] Barra de stock se actualiza en tiempo real
- [ ] Badge de nivel muestra "OK" (verde)

**Screenshot:** `07_form_filled.png`

---

### Paso 7: Validaciones de Formulario

**Objetivo:** Verificar que las validaciones funcionan  
**Pasos:**
1. Limpiar campo "Nombre"
2. Intentar guardar (click en "Guardar")
3. Verificar mensaje de error
4. Volver a completar nombre

**Validaciones:**
- [ ] Campo "Nombre" es requerido
- [ ] Campo "Categoría" es requerido
- [ ] Campo "Unidad" es requerido
- [ ] Mensajes de error se muestran en rojo
- [ ] Iconos de error aparecen en los campos
- [ ] Botón "Guardar" se deshabilita si hay errores

**Screenshot:** `08_validation_errors.png`

---

### Paso 8: Guardar Insumo

**Objetivo:** Verificar que el insumo se guarda correctamente  
**Pasos:**
1. Click en "Guardar"
2. Esperar toast de confirmación
3. Verificar que el overlay se cierra
4. Verificar que el insumo aparece en la tabla

**Validaciones:**
- [ ] Toast muestra "Insumo creado"
- [ ] Overlay se cierra automáticamente
- [ ] Tabla muestra el nuevo insumo
- [ ] Código se genera automáticamente (ej: "I-1020")
- [ ] Fila del nuevo insumo tiene highlight temporal

**Screenshot:** `09_insumo_created.png`

---

### Paso 9: Abrir Overlay de Edición

**Objetivo:** Verificar que el overlay de edición carga datos  
**Pasos:**
1. Click en botón "Editar" del insumo creado
2. Esperar a que se abra el overlay

**Validaciones:**
- [ ] Overlay se abre con datos precargados
- [ ] Campo "Nombre" muestra "Papel Seda Blanco"
- [ ] Categoría está seleccionada
- [ ] Stock actual muestra 50
- [ ] Stock mínimo muestra 20
- [ ] Costo paquete muestra 100
- [ ] Código muestra "I-1020"

**Screenshot:** `10_overlay_edit.png`

---

### Paso 10: Editar y Guardar Cambios

**Objetivo:** Verificar que las ediciones se guardan  
**Pasos:**
1. Modificar stock actual: 75
2. Modificar costo paquete: 120
3. Click en "Guardar"

**Validaciones:**
- [ ] Campos se pueden modificar
- [ ] Barra de stock se actualiza
- [ ] Badge de nivel cambia si es necesario
- [ ] Toast muestra "Insumo actualizado"
- [ ] Overlay se cierra
- [ ] Tabla muestra valores actualizados

**Screenshot:** `11_insumo_updated.png`

---

### Paso 11: Dirty Tracking

**Objetivo:** Verificar que el sistema detecta cambios sin guardar  
**Pasos:**
1. Abrir overlay de edición
2. Modificar un campo (ej: stock actual)
3. Intentar cerrar sin guardar

**Validaciones:**
- [ ] Botón "Guardar" se habilita al hacer cambios
- [ ] Al intentar cerrar aparece diálogo de confirmación
- [ ] Diálogo pregunta "¿Salir sin guardar?"
- [ ] Click en "Cancelar" mantiene el overlay abierto
- [ ] Click en "Salir" cierra sin guardar

**Screenshot:** `12_dirty_tracking.png`

---

### Paso 12: Eliminar Insumo

**Objetivo:** Verificar que la eliminación funciona  
**Pasos:**
1. Abrir overlay de edición
2. Click en botón "Eliminar"
3. Confirmar eliminación

**Validaciones:**
- [ ] Botón "Eliminar" es visible en modo edición
- [ ] Click muestra diálogo de confirmación
- [ ] Diálogo pregunta "¿Eliminar insumo?"
- [ ] Click en "Cancelar" mantiene el insumo
- [ ] Click en "Eliminar" elimina el insumo
- [ ] Toast muestra "Insumo eliminado"
- [ ] Overlay se cierra
- [ ] Insumo desaparece de la tabla

**Screenshot:** `13_delete_confirm.png`

---

## Resultado Esperado

Al completar todos los pasos, el usuario debe poder:
- ✅ Navegar al módulo de Insumos
- ✅ Filtrar por stock y categoría
- ✅ Crear un nuevo insumo con todos los campos
- ✅ Validar que las validaciones funcionan
- ✅ Editar un insumo existente
- ✅ Verificar que los cambios se guardan
- ✅ Confirmar que el dirty tracking funciona
- ✅ Eliminar un insumo con confirmación

---

## Criterios de Aceptación

- [ ] Todos los tests pasan sin errores
- [ ] No hay errores en consola del navegador
- [ ] Screenshots coinciden con baseline (o diferencias son intencionales)
- [ ] Tiempo de ejecución < 60 segundos
- [ ] Formulario es accesible por teclado

---

## Casos Borde

### Caso 1: Crear insumo con nombre duplicado
**Resultado esperado:** Sistema debe rechazar o advertir

### Caso 2: Stock actual menor que stock mínimo
**Resultado esperado:** Badge muestra "Bajo" o "Crítico"

### Caso 3: Costo paquete negativo
**Resultado esperado:** Validación rechaza el valor

### Caso 4: Cerrar navegador con cambios sin guardar
**Resultado esperado:** Navegador muestra advertencia nativa

---

## Dependencias

- `auth.helper.ts` - Login/logout
- `navigation.helper.ts` - Navegación entre módulos
- `form.helper.ts` - Interacción con formularios
- `assertions.helper.ts` - Assertions reutilizables

---

## Screenshots Generados

| # | Nombre | Descripción |
|---|--------|-------------|
| 01 | `insumos_list.png` | Listado inicial |
| 02 | `insumos_table.png` | Tabla con datos |
| 03 | `filtro_ok.png` | Filtro "OK" activo |
| 04 | `filtro_bajo.png` | Filtro "Bajo" activo |
| 05 | `filtro_categoria.png` | Filtro por categoría |
| 06 | `overlay_create.png` | Overlay de creación |
| 07 | `form_filled.png` | Formulario completado |
| 08 | `validation_errors.png` | Errores de validación |
| 09 | `insumo_created.png` | Insumo creado en tabla |
| 10 | `overlay_edit.png` | Overlay de edición |
| 11 | `insumo_updated.png` | Insumo actualizado |
| 12 | `dirty_tracking.png` | Diálogo dirty tracking |
| 13 | `delete_confirm.png` | Diálogo eliminar |

---

## Referencias

- [Flujo v4](../../schemas%20y%20flujos/v4/flujo_creacion_insumo.md)
- [Componente: InsumosPage.vue](../../../web/src/modules/insumos/InsumosPage.vue)
- [Componente: InsumoDetalle.vue](../../../web/src/modules/insumos/components/InsumoDetalle.vue)
- [Spec: insumos.spec.ts](../03_scripts/specs/insumos.spec.ts)
