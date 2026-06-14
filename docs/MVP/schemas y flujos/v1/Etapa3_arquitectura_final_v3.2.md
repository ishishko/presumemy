# Arquitectura Final — Sistema de Gestión MemyDeni

## Modelo Relacional · Versión 3.2

**Documento de revisión arquitectónica — análisis campo por campo · Módulo Productos** *Mayo 2026*

---

## Cambios respecto a v3.1

| \# | Tabla | Cambio | Detalle |
| :---: | :---- | :---- | :---- |
| 1 | `productos` | **Campo separado** | `medida` y `descripcion` son ahora campos independientes |
| 2 | `productos` | **Renombre y split** | `porcentaje_ganancia` → `tipo_ganancia` ENUM \+ `valor_ganancia` NUMERIC |
| 3 | `productos` | **Campo nuevo** | `tiene_bom` BOOLEAN — controla el modo de cálculo de `costo_producto` |
| 4 | `productos` | **Renombre y modo dual** | `costo_total_calculado` → `costo_producto` con comportamiento condicional |
| 5 | `costo_producto_insumo` | **Regla de aislamiento** | Edición de precio en el modal BOM es local al producto — no propaga a `insumos` |

---

## Regla de nomenclatura vigente

**`costo_`** → valor que MemyDeni paga (insumos, producción) **`precio_`** → valor que MemyDeni cobra (exclusivo de productos y presupuestos)

---

## Ideas de pantallas registradas (pendientes de diseño)

Registradas durante el análisis de flujo. No forman parte del schema.

- **Ventana de creación de producto** — formulario con campos básicos de identidad (Paso 1 del flujo)  
- **Vista de producto** — incluye sección BOM con botón "+" para agregar materiales  
- **Modal de BOM** — modal emergente al presionar "+", muestra fila editable con todos los campos de `costo_producto_insumo`. Soporta autocompletado de insumos con precios editables localmente  
- **Pantalla de creación de insumos** — formulario completo en pasos: identidad → compra → costo unitario → proveedores → notas → confirmación  
- **Flujo corto desde Finanzas** — al registrar una transacción de compra, permitir crear un insumo con campos reducidos

---

## Principio arquitectónico aplicado

Cada módulo debe ser **autocontenido**: contener todas las entidades que necesita para funcionar sin depender de entidades de otro módulo.

---

## Arquitectura Final — 3 Módulos · 14 Tablas

---

### MÓDULO 1 — Productos

*Todo lo relacionado con qué se fabrica, con qué y a qué costo.*

| Tabla | Prioridad | Descripción |
| :---- | :---: | :---- |
| `categorias_producto` | P2 | 9 categorías fijas del catálogo (Aplique, Banner, Tag, Letras, Golosinas, Papercraft, Box 3D, Merch, Varios). Sin recursividad. |
| `categorias_insumo` | P2 | 8 categorías fijas de insumos (Papel, Papel Impreso, Pegamentos, Librería, Cortes, Embalaje, Mercería, Varios). Renombrada desde `tipos_insumo` en v3.1. |
| `proveedores` | P2 | Entidades proveedoras de insumos. Datos de contacto y condiciones comerciales. |
| `insumos` | P1 | Materias primas con costo por pack, unidad de medida, categoría y fecha de actualización. |
| `insumo_proveedor` | P2 | Relación M:N entre insumos y proveedores. Máximo 3 proveedores por insumo. |
| `productos` | P1 | Catálogo maestro con ganancia configurable, precio calculado, precio final y flag de validación. |
| `costo_producto_insumo` | P1 | Receta / BOM. Qué insumos usa cada producto, en qué cantidad y a qué costo local. |

**Relaciones internas del módulo:**

categorias\_producto ──► productos

categorias\_insumo   ──► insumos

proveedores ──M:N (vía insumo\_proveedor)──► insumos

insumos     ──M:N (vía costo\_producto\_insumo)──► productos

---

### MÓDULO 2 — Comercial

*Todo lo relacionado con la operación de venta y presupuestación.*

| Tabla | Prioridad | Descripción |
| :---- | :---: | :---- |
| `clientes` | P2 | Datos del cliente. Sin campos B2B. Canal de contacto y usuario de red social. |
| `presupuestos` | P1 | Cabecera del pedido. 3 estados (en\_curso / cerrado / cancelado) \+ flag `facturado`. |
| `detalle_presupuesto` | P1 | Ítems del presupuesto. `precio_unitario` congelado al momento de emisión. |

**Relaciones internas del módulo:**

clientes ──► presupuestos ──► detalle\_presupuesto

**Dependencia cross-módulo:**

detalle\_presupuesto.producto\_id ──► Módulo Productos: productos.id

---

### MÓDULO 3 — Finanzas

*Todo lo relacionado con movimientos de dinero, distribución de ganancias y logística.*

| Tabla | Prioridad | Descripción |
| :---- | :---: | :---- |
| `socios` | P1 | Parametriza la distribución de ganancias (Meme 40%, Pety 30%). |
| `transacciones` | P1 | Registro de todos los movimientos de dinero. Partida simple categorizada. |
| `ordenes_imprenta` | P2 | Pedidos a Patri. Captura `valor_nuestro` vs `valor_patri`. |
| `envios` | P3 | Datos de despacho. Implementación opcional en primera fase. |

**Relaciones internas del módulo:**

socios ◄── transacciones (distribución automática 40/30/30 al facturar)

presupuestos ──► transacciones

presupuestos ──► ordenes\_imprenta

presupuestos ──► envios

---

## Detalle de tablas modificadas en v3.2

### `productos` *(campos actualizados)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `codigo` | INT UNIQUE | Generado automáticamente: prefijo\_categoria \+ correlativo |
| `nombre` | VARCHAR(150) | Nombre descriptivo del producto |
| `categoria_id` | INT FK | → `categorias_producto.id` |
| `medida` | VARCHAR(60) | Dimensiones físicas — **separado en v3.2** |
| `descripcion` | TEXT | Texto libre explicativo — **separado en v3.2** |
| `tiene_bom` | BOOLEAN | `true` \= costo calculado desde BOM · `false` \= costo manual — **nuevo en v3.2** |
| `tipo_ganancia` | ENUM | `'porcentaje'` | `'absoluto'` — **nuevo en v3.2, reemplaza `porcentaje_ganancia`** |
| `valor_ganancia` | NUMERIC(10,2) | Número de la ganancia según el tipo — **nuevo en v3.2** |
| `costo_producto` | NUMERIC(12,2) | Si `tiene_bom=false`: ingreso manual · Si `tiene_bom=true`: Σ subtotales BOM — **renombrado en v3.2** |
| `precio_calculado` | NUMERIC(12,2) GENERATED | Si `tipo='porcentaje'`: `costo_producto × (1 + valor/100)` · Si `tipo='absoluto'`: `costo_producto + valor` |
| `precio_final` | NUMERIC(12,2) | Precio de venta aprobado manualmente |
| `precio_ambientadora` | NUMERIC(12,2) | Variante para canal de venta alternativo |
| `validacion` | ENUM GENERATED | `'ok'` | `'error'` | `'sin_precio'` — automático |
| `activo` | BOOLEAN | Borrado lógico |

**Lógica de `costo_producto`:**

tiene\_bom \= false  →  costo\_producto se ingresa manualmente

tiene\_bom \= true   →  costo\_producto \= Σ(subtotal) de costo\_producto\_insumo

                       (no editable directamente, se recalcula al modificar la BOM)

**Lógica de `precio_calculado`:**

tipo\_ganancia \= 'porcentaje'  →  costo\_producto × (1 \+ valor\_ganancia / 100\)

tipo\_ganancia \= 'absoluto'    →  costo\_producto \+ valor\_ganancia

**Lógica de `validacion`:**

precio\_final IS NULL OR \= 0         →  'sin\_precio'

precio\_final \< precio\_calculado     →  'error'

precio\_final \>= precio\_calculado    →  'ok'

---

### `costo_producto_insumo` *(regla de aislamiento agregada)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador |
| `producto_id` | INT FK | → `productos.id` |
| `insumo_id` | INT FK NULLABLE | → `insumos.id` (null para tipo `extra`) |
| `cantidad_usada` | NUMERIC(10,4) | Fracción o unidades del insumo por pieza |
| `costo_unitario_local` | NUMERIC(12,4) | Costo del insumo al momento de cargar la BOM — **editable localmente** |
| `subtotal` | NUMERIC(12,2) GENERATED | `cantidad_usada × costo_unitario_local` |
| `tipo_costo` | ENUM | `'insumo'` | `'cameo'` | `'embalaje'` | `'extra'` |

**Regla de aislamiento (v3.2):**

El campo costo\_unitario\_local se inicializa con insumos.costo\_unitario

al momento de agregar el insumo desde el modal BOM.

Ediciones posteriores en el modal afectan SOLO a esta fila.

No se propagan a insumos.costo\_unitario ni a otros productos

que usen el mismo insumo.

---

## Detalle de tablas estables (sin cambios desde v3.1)

### `categorias_insumo`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(80) UNIQUE | 1-Papel, 2-Papel Impreso, 3-Pegamentos, 4-Librería, 5-Cortes, 6-Embalaje, 7-Mercería, 8-Varios |

### `proveedores`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(120) | Nombre o razón social |
| `contacto` | VARCHAR(120) | Nombre de la persona de contacto |
| `telefono` | VARCHAR(30) | Número de contacto |
| `mail` | VARCHAR(120) | Correo electrónico |
| `canal` | ENUM | `'whatsapp'` | `'instagram'` | `'mail'` | `'telefono'` | `'otros'` |
| `direccion` | VARCHAR(200) | Dirección física |
| `notas` | TEXT | Observaciones generales |
| `activo` | BOOLEAN | Borrado lógico |

### `insumos`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `categoria_insumo_id` | INT FK | → `categorias_insumo.id` |
| `nombre` | VARCHAR(150) | Nombre descriptivo del insumo |
| `unidad_medida` | VARCHAR(30) | Cómo se consume: 'hoja', 'plancha', 'cm', 'ml', 'unidad' |
| `costo_paquete` | NUMERIC(12,2) | Lo que se paga al proveedor por el pack |
| `cantidad_por_pack` | NUMERIC(10,3) | Unidades que trae el pack |
| `costo_unitario` | NUMERIC(12,4) GENERATED | `costo_paquete ÷ cantidad_por_pack` |
| `fecha_actualizacion` | DATE | Última actualización de precio |
| `activo` | BOOLEAN | Borrado lógico |

### `insumo_proveedor`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `insumo_id` | INT FK | → `insumos.id` |
| `proveedor_id` | INT FK | → `proveedores.id` |
| `es_principal` | BOOLEAN | TRUE \= proveedor preferido para este insumo |
| `precio_referencia` | NUMERIC(10,2) | Precio de referencia del proveedor para este insumo |

**Restricción:** máximo 3 proveedores por insumo. Controlado en capa de aplicación.

---

## Mapa relacional global

╔══════════════════════════════════════╗

║           MÓDULO PRODUCTOS           ║

║                                      ║

║  categorias\_producto                 ║

║         │                            ║

║         ▼                            ║

║  categorias\_insumo ──► insumos ◄── proveedores

║                           │    (insumo\_proveedor)

║                           ▼                  ║

║              costo\_producto\_insumo            ║

║   (costo\_unitario\_local \= copia aislada)      ║

║                           ▼                  ║

║                       productos              ║

║         (costo\_producto: manual o BOM)        ║

╚══════════════════════════════════════╝

                    │

                    │ producto\_id

                    ▼

╔══════════════════════════════════════╗

║          MÓDULO COMERCIAL            ║

║                                      ║

║  clientes ──► presupuestos           ║

║                    │                 ║

║                    ▼                 ║

║           detalle\_presupuesto        ║

╚══════════════════════════════════════╝

                    │

                    │ presupuesto\_id

                    ▼

╔══════════════════════════════════════╗

║           MÓDULO FINANZAS            ║

║                                      ║

║  socios ◄── transacciones            ║

║             ordenes\_imprenta         ║

║             envios                   ║

╚══════════════════════════════════════╝

---

## Vetos arquitectónicos vigentes

| ID | Veto | Descripción |
| :---: | :---- | :---- |
| V1 | Sin contabilidad de partida doble | `plan_maestro_cuentas`, `asientos_diario` y `apuntes_contables` descartados |
| V2 | Sin SCD Type 2 | `historico_tarifas` descartada. El precio se congela en `detalle_presupuesto` |
| V3 | Sin recursividad de categorías | `categorias_producto.id_padre` descartado |
| V4 | Sin hard delete | Todas las entidades principales usan campo `activo` |
| V5 | Sin FLOAT / REAL | Todo valor monetario usa `NUMERIC(10,2)` o `NUMERIC(12,4)` |
| V6 | Sin campos B2B en clientes | Sin CUIT, razón social ni condición tributaria |
| V7 | Sin FSM de 5 estados | `presupuestos` usa 3 estados simples \+ flag `facturado` |
| V8 | Sin triggers complejos | La lógica de distribución la ejecuta la aplicación |
| V9 | Sin MVCC agresivo | Sin bloqueos optimistas complejos |
| V10 | Sin tabla unificada de contactos | `clientes` y `proveedores` como tablas separadas para mantener autocontención |
| V11 | Sin propagación de precios BOM | Ediciones de precio en modal BOM son locales al producto — no modifican `insumos.costo_unitario` |

---

## Resumen cuantitativo

| Módulo | Tablas v3.1 | Tablas v3.2 | Cambio |
| :---- | :---: | :---: | :---- |
| Productos | 7 | 7 | Sin cambios en cantidad — cambios internos en `productos` y `costo_producto_insumo` |
| Comercial | 3 | 3 | Sin cambios |
| Finanzas | 4 | 4 | Sin cambios |
| **Total** | **14** | **14** |  |

---

*Arquitectura Final · MemyDeni · v3.2 · Mayo 2026*  
