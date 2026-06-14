# Arquitectura Final — Sistema de Gestión MemyDeni

## Modelo Relacional · Versión 3.3

**Documento de revisión arquitectónica — análisis campo por campo · Módulo Comercial** *Mayo 2026*

---

## Cambios respecto a v3.2

| \# | Tabla | Cambio | Detalle |
| :---: | :---- | :---- | :---- |
| 1 | `clientes` | **Campos eliminados** | Se eliminan todos los campos de contacto fijos (`instagram`, `facebook`, `whatsapp`, `email`, `canal_preferido`, `usuario_grupo`) — reemplazados por la tabla `cliente_contactos` |
| 2 | `clientes` | **Campo renombrado** | `usuario_grupo` desaparece como columna y pasa a ser un tipo dentro de `cliente_contactos` |
| 3 | `cliente_contactos` | **Tabla nueva** | Relación 1:N entre `clientes` y sus medios de contacto. Soporta N contactos por cliente sin límite fijo |
| 4 | Módulo Comercial | **Tabla agregada** | Pasa de 3 a 4 tablas |

---

## Regla de nomenclatura vigente

**`costo_`** → valor que MemyDeni paga (insumos, producción) **`precio_`** → valor que MemyDeni cobra (exclusivo de productos y presupuestos)

---

## Ideas de pantallas registradas (pendientes de diseño)

Registradas durante el análisis de flujo. No forman parte del schema.

- **Ventana de creación de producto** — formulario con campos básicos de identidad  
- **Vista de producto** — incluye sección BOM con botón "+" para agregar materiales  
- **Modal de BOM** — modal emergente, fila editable con todos los campos de `costo_producto_insumo`. Autocompletado con precios editables localmente  
- **Pantalla de creación de insumos** — formulario completo en pasos: identidad → compra → costo unitario → proveedores → notas → confirmación  
- **Flujo corto desde Finanzas** — al registrar una transacción de compra, permitir crear un insumo con campos reducidos  
- **Pantalla de creación de cliente** — formulario mínimo (nombre \+ al menos un contacto) con sección expandible para agregar más contactos

---

## Principio arquitectónico aplicado

Cada módulo debe ser **autocontenido**: contener todas las entidades que necesita para funcionar sin depender de entidades de otro módulo.

---

## Arquitectura Final — 3 Módulos · 15 Tablas

---

### MÓDULO 1 — Productos

*Todo lo relacionado con qué se fabrica, con qué y a qué costo.*

| Tabla | Prioridad | Descripción |
| :---- | :---: | :---- |
| `categorias_producto` | P2 | 9 categorías fijas del catálogo. Sin recursividad. |
| `categorias_insumo` | P2 | 8 categorías fijas de insumos. |
| `proveedores` | P2 | Entidades proveedoras de insumos. |
| `insumos` | P1 | Materias primas con costo por pack, unidad de medida y categoría. |
| `insumo_proveedor` | P2 | Relación M:N entre insumos y proveedores. Máx. 3 por insumo. |
| `productos` | P1 | Catálogo maestro con ganancia configurable y flag de validación. |
| `costo_producto_insumo` | P1 | Receta / BOM con precios locales aislados. |

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
| `clientes` | P2 | Identidad del cliente. Sin campos de contacto fijos — estos viven en `cliente_contactos`. |
| `cliente_contactos` | P2 | Medios de contacto del cliente. N contactos por cliente, con flag de principal. — **nueva en v3.3** |
| `presupuestos` | P1 | Cabecera del pedido. 3 estados \+ flag `facturado`. |
| `detalle_presupuesto` | P1 | Ítems del presupuesto con precio congelado al momento de emisión. |

**Relaciones internas del módulo:**

clientes ──1:N──► cliente\_contactos

clientes ──────► presupuestos ──► detalle\_presupuesto

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

## Detalle de tablas modificadas en v3.3

### `clientes` *(campos de contacto eliminados)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `codigo_identificador` | VARCHAR(20) UNIQUE | Código interno generado automáticamente (ej: P1041M) |
| `nombre` | VARCHAR(200) | Nombre real o apodo operativo |
| `grupos` | VARCHAR(200) | Grupos de WhatsApp u otros grupos de contacto asociados |
| `notas` | TEXT | Observaciones libres |
| `activo` | BOOLEAN | Borrado lógico |
| `creado_en` | TIMESTAMP | Fecha de alta automática |

---

### `cliente_contactos` *(tabla nueva)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `cliente_id` | INT FK | → `clientes.id` |
| `tipo` | ENUM | `'instagram'` | `'whatsapp'` | `'mail'` | `'otros'` |
| `valor` | VARCHAR(200) | El usuario, número o dirección según el tipo |
| `es_principal` | BOOLEAN | TRUE \= canal preferido de contacto |

**Reglas de operación:**

\- Solo puede haber un registro con es\_principal \= true por cliente.

  Si se marca uno nuevo como principal, el anterior pasa a false.

\- No hay límite fijo de contactos por cliente.

\- Al crear un presupuesto, se sugiere el contacto con es\_principal \= true.

\- El campo tipo ENUM es extensible — agregar un canal nuevo

  no requiere alterar la tabla clientes.

**Ejemplos de filas para un mismo cliente:**

cliente\_id  tipo        valor                    es\_principal

──────────  ──────────  ───────────────────────  ────────────

42          instagram   @vale.gomez.fiestas      true

42          whatsapp    \+54 9 11 5523 4481       false

42          instagram   @vale\_eventos            false

---

## Detalle de tablas estables (sin cambios desde v3.2)

### `categorias_producto`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(80) UNIQUE | Aplique, Banner, Tag, Letras, Golosinas, Papercraft, Box 3D, Merch, Varios |
| `prefijo_codigo` | VARCHAR(3) | Prefijo numérico de 3 dígitos para generación de código de producto |

### `categorias_insumo`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(80) UNIQUE | Papel, Papel Impreso, Pegamentos, Librería, Cortes, Embalaje, Mercería, Varios |

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
| `unidad_medida` | VARCHAR(30) | 'hoja', 'plancha', 'cm', 'ml', 'unidad' |
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

### `productos`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `codigo` | INT UNIQUE | Generado automáticamente: prefijo\_categoria \+ correlativo |
| `nombre` | VARCHAR(150) | Nombre descriptivo del producto |
| `categoria_id` | INT FK | → `categorias_producto.id` |
| `medida` | VARCHAR(60) | Dimensiones físicas |
| `descripcion` | TEXT | Texto libre explicativo |
| `tiene_bom` | BOOLEAN | `true` \= costo calculado desde BOM · `false` \= costo manual |
| `tipo_ganancia` | ENUM | `'porcentaje'` | `'absoluto'` |
| `valor_ganancia` | NUMERIC(10,2) | Número de la ganancia según el tipo |
| `costo_producto` | NUMERIC(12,2) | Manual si `tiene_bom=false`, calculado si `tiene_bom=true` |
| `precio_calculado` | NUMERIC(12,2) GENERATED | Según fórmula de tipo\_ganancia |
| `precio_final` | NUMERIC(12,2) | Precio de venta aprobado manualmente |
| `precio_ambientadora` | NUMERIC(12,2) | Variante para canal alternativo |
| `validacion` | ENUM GENERATED | `'ok'` | `'error'` | `'sin_precio'` |
| `activo` | BOOLEAN | Borrado lógico |

### `costo_producto_insumo`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador |
| `producto_id` | INT FK | → `productos.id` |
| `insumo_id` | INT FK NULLABLE | → `insumos.id` (null para tipo `extra`) |
| `cantidad_usada` | NUMERIC(10,4) | Fracción o unidades del insumo por pieza |
| `costo_unitario_local` | NUMERIC(12,4) | Costo local aislado — editable sin propagar a `insumos` |
| `subtotal` | NUMERIC(12,2) GENERATED | `cantidad_usada × costo_unitario_local` |
| `tipo_costo` | ENUM | `'insumo'` | `'cameo'` | `'embalaje'` | `'extra'` |

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

║                           ▼                  ║

║                       productos              ║

╚══════════════════════════════════════╝

                    │

                    │ producto\_id

                    ▼

╔══════════════════════════════════════╗

║          MÓDULO COMERCIAL            ║

║                                      ║

║  clientes ──1:N──► cliente\_contactos ║

║      │                               ║

║      └──────► presupuestos           ║

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
| V11 | Sin propagación de precios BOM | Ediciones de precio en modal BOM son locales — no modifican `insumos.costo_unitario` |
| V12 | Sin columnas fijas de contacto en clientes | Los medios de contacto viven en `cliente_contactos` — extensible sin alterar schema |

---

## Resumen cuantitativo

| Módulo | Tablas v3.2 | Tablas v3.3 | Cambio |
| :---- | :---: | :---: | :---- |
| Productos | 7 | 7 | Sin cambios |
| Comercial | 3 | 4 | \+1 (`cliente_contactos`) |
| Finanzas | 4 | 4 | Sin cambios |
| **Total** | **14** | **15** |  |

---

*Arquitectura Final · MemyDeni · v3.3 · Mayo 2026*  
