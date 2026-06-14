# Arquitectura Final — Sistema de Gestión MemyDeni

## Modelo Relacional · Versión 3.5

**Documento de revisión arquitectónica — análisis campo por campo · Campos de auditoría** *Mayo 2026*

---

## Cambios respecto a v3.4

| \# | Alcance | Cambio | Detalle |
| :---: | :---- | :---- | :---- |
| 1 | Global | **Campos de auditoría estandarizados** | Se define criterio explícito para `creado_en` y `actualizado_en` en todas las tablas |
| 2 | Todas las tablas | **Campos agregados selectivamente** | Solo donde tiene sentido operativo — no en tablas de relación ni de datos fijos |
| 3 | Ideas pendientes | **Cancelación automática registrada** | Queda como idea suelta sin impacto en schema — criterio de tiempo a definir |

---

## Criterio de campos de auditoría

Se agregan `creado_en TIMESTAMP` y/o `actualizado_en TIMESTAMP` solo donde tiene sentido operativo. No se agregan en tablas de datos fijos ni en tablas de relación que viven del ciclo de vida de su entidad padre.

| Tabla | `creado_en` | `actualizado_en` | Justificación |
| :---- | :---: | :---: | :---- |
| `categorias_producto` | — | — | Datos fijos, no cambian |
| `categorias_insumo` | — | — | Datos fijos, no cambian |
| `proveedores` | ✅ | ✅ | Entidad de negocio que evoluciona |
| `insumos` | ✅ | ✅ | El precio cambia frecuentemente |
| `insumo_proveedor` | — | ✅ | Interesa saber cuándo cambió el precio de referencia |
| `productos` | ✅ | ✅ | El catálogo evoluciona |
| `costo_producto_insumo` | — | — | Depende del producto, no tiene vida propia |
| `clientes` | ✅ | ✅ | Entidad de negocio que evoluciona |
| `cliente_contactos` | — | — | Dato simple, vive del cliente |
| `presupuestos` | ✅ | ✅ | Ciclo de vida con estados |
| `detalle_presupuesto` | — | — | Vive del presupuesto |
| `socios` | — | ✅ | Interesa saber si cambió el porcentaje |
| `transacciones` | ✅ | — | Registro contable inmutable |
| `ordenes_imprenta` | ✅ | ✅ | Pedido con seguimiento |
| `envios` | ✅ | — | Registro de despacho inmutable |

---

## Idea pendiente — Cancelación automática de presupuestos

Sin impacto en schema actual. A definir en etapa de implementación.

- Criterio de tiempo a determinar (ej: X días sin actividad en estado `en_curso`)  
- La lógica la ejecuta la aplicación — no requiere trigger ni campo adicional en la tabla

---

## Regla de nomenclatura vigente

**`costo_`** → valor que MemyDeni paga (insumos, producción) **`precio_`** → valor que MemyDeni cobra (exclusivo de productos y presupuestos)

---

## Modelo de estados de `presupuestos`

                    ┌─────────────────┐

                    │    en\_curso     │  ← estado inicial al crear

                    └────────┬────────┘

                             │

              ┌──────────────┼──────────────┐

              │                             │

              ▼                             ▼

    ┌──────────────────┐         ┌──────────────────┐

    │    cancelado     │         │     cerrado      │

    │                  │         │  (cliente conf.) │

    └──────────────────┘         └────────┬─────────┘

                                          │

                                          ▼

                                ┌──────────────────┐

                                │    facturado     │

                                │ (diferenciación  │

                                │   contable)      │

                                └──────────────────┘

**Reglas de transición:**

en\_curso   → cancelado   (cliente rechaza o cancelación automática por tiempo)

en\_curso   → cerrado     (cliente confirma el pedido)

cerrado    → facturado   (se emite factura — diferenciación contable)

No es posible:

  facturado → ningún otro estado

  cancelado → ningún otro estado

  cerrado   → cancelado

**Pendiente de definición (no bloquea el schema):**

- Criterio de tiempo para cancelación automática desde `en_curso`  
- Si se necesita campo `fecha_ultima_actividad` para soportar esa lógica

---

## Ideas de pantallas registradas (pendientes de diseño)

Registradas durante el análisis de flujo. No forman parte del schema.

- **Ventana de creación de producto** — formulario con campos básicos de identidad  
- **Vista de producto** — incluye sección BOM con botón "+" para agregar materiales  
- **Modal de BOM** — modal emergente, fila editable con todos los campos de `costo_producto_insumo`. Autocompletado con precios editables localmente  
- **Pantalla de creación de insumos** — formulario completo en pasos: identidad → compra → costo unitario → proveedores → notas → confirmación  
- **Flujo corto desde Finanzas** — al registrar una transacción de compra, permitir crear un insumo con campos reducidos  
- **Pantalla de creación de cliente** — formulario mínimo (nombre \+ al menos un contacto) con sección expandible para agregar más contactos  
- **Vista de presupuesto** — cabecera \+ ítems \+ panel de pago \+ indicador de estado con transiciones disponibles

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
| `clientes` | P2 | Identidad del cliente. Sin campos de contacto fijos. |
| `cliente_contactos` | P2 | Medios de contacto del cliente. N contactos por cliente, con flag de principal. |
| `presupuestos` | P1 | Cabecera del pedido. 4 estados en ENUM único. |
| `detalle_presupuesto` | P1 | Ítems del presupuesto. Alimenta `presupuestos.total` vía Σ de subtotales. |

**Relaciones internas del módulo:**

clientes ──1:N──► cliente\_contactos

clientes ──────► presupuestos

presupuestos ──1:N──► detalle\_presupuesto

presupuestos.total \= Σ(detalle\_presupuesto.subtotal)

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

## Detalle de tablas modificadas en v3.4

### `presupuestos` *(modelo de estados redefinido)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `numero` | INT UNIQUE | Correlativo global incremental (ej: P1119) |
| `cliente_id` | INT FK | → `clientes.id` |
| `tematica` | VARCHAR(200) | Universo visual del evento (ej: Harry Potter, Kerastase) |
| `estado` | ENUM | `'en_curso'` | `'cancelado'` | `'cerrado'` | `'facturado'` — **redefinido en v3.4** |
| `fecha_fiesta` | DATE | Fecha del evento |
| `fecha_entrega` | DATE | Fecha acordada de entrega al cliente |
| `fecha_finalizacion` | DATE NULLABLE | Fecha real de cierre — se registra al pasar a `cerrado` |
| `metodo_envio` | ENUM | `'retira'` | `'envio'` |
| `lugar_envio` | TEXT NULLABLE | Obligatorio si `metodo_envio = 'envio'` |
| `metodo_pago` | VARCHAR(100) | Campo libre: MP, Efectivo, Transferencia, combinación |
| `monto_seña` | NUMERIC(12,2) | Depósito inicial acordado — ingreso manual |
| `monto_resto` | NUMERIC(12,2) | Saldo pendiente — ingreso manual independiente del total |
| `total` | NUMERIC(12,2) GENERATED | Σ de `detalle_presupuesto.subtotal` |
| `comprar_archivo` | BOOLEAN | El cliente adquiere el archivo de diseño para uso propio |
| `insumos_especiales` | BOOLEAN | El pedido requiere materiales fuera del catálogo habitual |
| `notas` | TEXT | Observaciones generales del pedido |
| `creado_en` | TIMESTAMP | Fecha de creación automática |
| `actualizado_en` | TIMESTAMP | Última modificación automática |

**Nota sobre `monto_seña` y `monto_resto`:**

Son campos independientes — no se calcula monto\_resto \= total − monto\_seña.

Esto permite registrar descuentos por pago en efectivo u otros acuerdos

sin que el sistema los rechace por no cuadrar con el total.

---

### `detalle_presupuesto` *(documentada formalmente en v3.4)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `presupuesto_id` | INT FK | → `presupuestos.id` |
| `producto_id` | INT FK NULLABLE | → `productos.id` · NULL \= ítem libre sin referencia al catálogo |
| `descripcion` | VARCHAR(200) | Nombre visible en el presupuesto (obligatorio para ítems libres) |
| `tematica_item` | VARCHAR(200) NULLABLE | Temática específica del ítem si difiere de la del presupuesto |
| `cantidad` | INT | Cantidad de unidades |
| `precio_unitario` | NUMERIC(12,2) | Precio congelado al momento de agregar el ítem |
| `subtotal` | NUMERIC(12,2) GENERATED | `cantidad × precio_unitario` |
| `observaciones` | TEXT NULLABLE | Notas internas del ítem |
| `orden` | INT | Orden de aparición en el presupuesto |

**Vínculo con `presupuestos.total`:**

presupuestos.total \= Σ(detalle\_presupuesto.subtotal)

                       WHERE presupuesto\_id \= presupuestos.id

El total se recalcula automáticamente cada vez que:

  \- Se agrega un ítem

  \- Se modifica cantidad o precio\_unitario de un ítem

  \- Se elimina un ítem

**Ítem libre (producto\_id \= NULL):**

Permite incluir servicios, fletes o extras sin darlos de alta en el catálogo.

Ejemplos: "Armado de mesa dulce", "Costo de envío", "Diseño especial".

El precio\_unitario se ingresa manualmente en estos casos.

---

## Detalle de tablas estables (sin cambios desde v3.3)

### `clientes`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `codigo_identificador` | VARCHAR(20) UNIQUE | Código interno generado automáticamente (ej: P1041M) |
| `nombre` | VARCHAR(200) | Nombre real o apodo operativo |
| `grupos` | VARCHAR(200) | Grupos de WhatsApp u otros grupos de contacto |
| `notas` | TEXT | Observaciones libres |
| `activo` | BOOLEAN | Borrado lógico |
| `creado_en` | TIMESTAMP | Fecha de alta automática |
| `actualizado_en` | TIMESTAMP | Última modificación automática |

### `cliente_contactos`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `cliente_id` | INT FK | → `clientes.id` |
| `tipo` | ENUM | `'instagram'` | `'whatsapp'` | `'mail'` | `'otros'` |
| `valor` | VARCHAR(200) | Usuario, número o dirección según el tipo |
| `es_principal` | BOOLEAN | TRUE \= canal preferido de contacto |

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
| `creado_en` | TIMESTAMP | Fecha de alta automática |
| `actualizado_en` | TIMESTAMP | Última modificación automática |

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
| `creado_en` | TIMESTAMP | Fecha de alta automática |
| `actualizado_en` | TIMESTAMP | Última modificación automática |

### `insumo_proveedor`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `insumo_id` | INT FK | → `insumos.id` |
| `proveedor_id` | INT FK | → `proveedores.id` |
| `es_principal` | BOOLEAN | TRUE \= proveedor preferido para este insumo |
| `precio_referencia` | NUMERIC(10,2) | Precio de referencia del proveedor para este insumo |
| `actualizado_en` | TIMESTAMP | Última modificación — registra cuándo cambió el precio de referencia |

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
| `creado_en` | TIMESTAMP | Fecha de alta automática |
| `actualizado_en` | TIMESTAMP | Última modificación automática |

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

║      └──► presupuestos               ║

║           \[en\_curso→cerrado→facturado║

║            en\_curso→cancelado\]       ║

║                │                     ║

║                └──1:N──► detalle\_presupuesto

║                          (total \= Σ subtotales)

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
| V7 | Sin boolean `facturado` independiente | El estado `facturado` es el 4to valor del ENUM `estado` — no un campo aparte |
| V8 | Sin triggers complejos | La lógica de distribución la ejecuta la aplicación |
| V9 | Sin MVCC agresivo | Sin bloqueos optimistas complejos |
| V10 | Sin tabla unificada de contactos | `clientes` y `proveedores` como tablas separadas para mantener autocontención |
| V11 | Sin propagación de precios BOM | Ediciones de precio en modal BOM son locales — no modifican `insumos.costo_unitario` |
| V12 | Sin columnas fijas de contacto en clientes | Los medios de contacto viven en `cliente_contactos` — extensible sin alterar schema |

---

## Resumen cuantitativo

| Módulo | Tablas v3.4 | Tablas v3.5 | Cambio |
| :---- | :---: | :---: | :---- |
| Productos | 7 | 7 | Sin cambios |
| Comercial | 4 | 4 | Sin cambios en cantidad — cambios internos en `presupuestos` y documentación de `detalle_presupuesto` |
| Finanzas | 4 | 4 | Sin cambios |
| **Total** | **15** | **15** |  |

---

*Arquitectura Final · MemyDeni · v3.5 · Mayo 2026*  
