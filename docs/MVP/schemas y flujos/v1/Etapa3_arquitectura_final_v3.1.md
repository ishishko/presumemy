# Arquitectura Final — Sistema de Gestión MemyDeni

## Modelo Relacional · Versión 3.1

**Documento de revisión arquitectónica — análisis campo por campo** *Mayo 2026*

---

## Cambios respecto a v3.0

| \# | Cambio | Detalle |
| :---: | :---- | :---- |
| 1 | **`tipos_insumo` → `categorias_insumo`** | Renombrada para mantener uniformidad con `categorias_producto` |
| 2 | **`precios_corte_cameo` eliminada** | Los 3 niveles de corte (Máximo / Medio / Bajo) pasan a ser insumos dentro de la tabla `insumos`. Módulo Productos pasa de 8 a 7 tablas |
| 3 | **`proveedores` ampliada** | Se agregan campos: `mail`, `canal` (ENUM), `direccion` |
| 4 | **`insumos` — campo agregado** | Se agrega `unidad_medida VARCHAR(30)` — estaba ausente del schema |
| 5 | **`insumos` — campo agregado** | Se agrega `categoria_insumo_id INT FK → categorias_insumo.id` — FK faltante |
| 6 | **`insumos` — renombre** | `precio_unitario` → `costo_paquete` (precio es valor de venta, esto es un costo) |
| 7 | **`insumos` — FK renombrada** | `tipo_insumo_id` → `categoria_insumo_id` (consistente con el renombre de la tabla) |
| 8 | **Gobernanza del valor de insumos** | `insumos.costo_unitario` es el valor canónico. `insumo_proveedor.precio_referencia` es la fuente de entrada — cuando cambia el proveedor principal, dispara actualización de `costo_paquete` en `insumos` |

---

## Regla de nomenclatura fijada en v3.1

**`costo_`** → valor que MemyDeni paga (insumos, producción) **`precio_`** → valor que MemyDeni cobra (exclusivo de productos y presupuestos)

---

## Ideas de pantallas registradas (pendientes de diseño)

Estas ideas surgieron durante el análisis de flujo de creación de insumos. No forman parte del schema pero se registran para no perderlas.

- **Pantalla de creación de insumos** — formulario completo en 6 pasos: identidad → compra → costo unitario → proveedores → notas → confirmación  
- **Flujo corto desde Finanzas** — al registrar una transacción de compra, permitir crear un insumo con campos reducidos sin pasar por el flujo completo del módulo Productos

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
| `categorias_insumo` | P2 | 8 categorías fijas de insumos (Papel, Papel Impreso, Pegamentos, Librería, Cortes, Embalaje, Mercería, Varios). Renombrada desde `tipos_insumo`. |
| `proveedores` | P2 | Entidades proveedoras de insumos. Datos de contacto y condiciones comerciales. |
| `insumos` | P1 | Materias primas con costo por pack, unidad de medida, categoría y fecha de actualización. |
| `insumo_proveedor` | P2 | Relación M:N entre insumos y proveedores. Máximo 3 proveedores por insumo. Incluye precio de referencia y flag de proveedor principal. |
| `productos` | P1 | Catálogo maestro con `porcentaje_ganancia`, `precio_calculado`, `precio_final`, `precio_ambientadora` y flag `validacion` (ok / error / sin\_precio). |
| `costo_producto_insumo` | P1 | Receta / BOM (Bill of Materials). Qué insumos usa cada producto y en qué cantidad. `tipo_costo` ENUM (insumo / cameo / embalaje / extra). |

**Nota:** Los 3 niveles de corte Cameo (Máximo / Medio / Bajo) son filas en `insumos` con `categoria_insumo_id` → categoría "Cortes". Se eliminó `precios_corte_cameo` como tabla separada.

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
| `clientes` | P2 | Datos del cliente. Sin campos B2B (CUIT, factura, condición tributaria). Canal de contacto y usuario de red social. |
| `presupuestos` | P1 | Cabecera del pedido. 3 estados (en\_curso / cerrado / cancelado) \+ flag `facturado`. Reemplaza la organización en carpetas de Drive. |
| `detalle_presupuesto` | P1 | Ítems del presupuesto. `precio_unitario` congelado al momento de emisión — cambios futuros en el catálogo no alteran presupuestos ya emitidos. |

**Relaciones internas del módulo:**

clientes ──► presupuestos ──► detalle\_presupuesto

**Dependencia cross-módulo:**

detalle\_presupuesto.producto\_id ──► Módulo Productos: productos.id

---

### MÓDULO 3 — Finanzas

*Todo lo relacionado con movimientos de dinero, distribución de ganancias y logística.*

| Tabla | Prioridad | Descripción |
| :---- | :---: | :---- |
| `socios` | P1 | Parametriza la distribución de ganancias (Meme 40%, Pety 30%). Crítico para la automatización contable al facturar. |
| `transacciones` | P1 | Registro de todos los movimientos de dinero. Partida simple categorizada. Reemplaza las hojas "Cuentas 2022/2023/2024/2025". |
| `ordenes_imprenta` | P2 | Pedidos a la imprenta tercerizada (Patri). Captura `valor_nuestro` vs `valor_patri` para detectar errores de estimación. |
| `envios` | P3 | Datos de destinatario y remitente para pedidos con `metodo_envio = 'envio'`. Implementación opcional en primera fase. |

**Relaciones internas del módulo:**

socios ◄── transacciones (distribución automática 40/30/30 al facturar)

presupuestos ──► transacciones

presupuestos ──► ordenes\_imprenta

presupuestos ──► envios

---

## Detalle de campos actualizados en v3.1

### `categorias_insumo` *(antes `tipos_insumo`)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(80) UNIQUE | 1-Papel, 2-Papel Impreso, 3-Pegamentos, 4-Librería, 5-Cortes, 6-Embalaje, 7-Mercería, 8-Varios |

---

### `proveedores` *(campos ampliados)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(120) | Nombre o razón social |
| `contacto` | VARCHAR(120) | Nombre de la persona de contacto |
| `telefono` | VARCHAR(30) | Número de contacto |
| `mail` | VARCHAR(120) | Correo electrónico — **nuevo en v3.1** |
| `canal` | ENUM | 'whatsapp' | 'instagram' | 'mail' | 'telefono' | 'otros' — **nuevo en v3.1** |
| `direccion` | VARCHAR(200) | Dirección física — **nuevo en v3.1** |
| `notas` | TEXT | Observaciones generales |
| `activo` | BOOLEAN | Borrado lógico |

---

### `insumos` *(campos corregidos y agregados)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `categoria_insumo_id` | INT FK | → `categorias_insumo.id` — **FK faltante, agregada en v3.1** |
| `nombre` | VARCHAR(150) | Ej: 'IMP. ilustración 300gr A3', 'Vaso polipapel' |
| `unidad_medida` | VARCHAR(30) | Cómo se consume: 'hoja', 'plancha', 'cm', 'ml', 'unidad' — **nuevo en v3.1** |
| `costo_paquete` | NUMERIC(12,2) | Lo que se paga al proveedor por el pack — **renombrado desde `precio_unitario`** |
| `cantidad_por_pack` | NUMERIC(10,3) | Unidades que trae el pack (ej: 100 hojas) |
| `costo_unitario` | NUMERIC(12,4) GENERATED | `costo_paquete ÷ cantidad_por_pack` — base de todo el costeo |
| `fecha_actualizacion` | DATE | Última actualización de precio |
| `activo` | BOOLEAN | Borrado lógico — protege historial |

**Gobernanza del valor:**

insumo\_proveedor.precio\_referencia  →  fuente de entrada (dato de compra por proveedor)

insumos.costo\_paquete               →  valor canónico operativo

insumos.costo\_unitario              →  valor calculado que usa la BOM

Cuando cambia el proveedor principal, su `precio_referencia` dispara la actualización de `costo_paquete`. El `costo_unitario` se recalcula automáticamente (GENERATED).

---

### `insumo_proveedor` *(sin cambios en v3.1)*

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `insumo_id` | INT FK | → `insumos.id` |
| `proveedor_id` | INT FK | → `proveedores.id` |
| `es_principal` | BOOLEAN | TRUE \= proveedor preferido para este insumo |
| `precio_referencia` | NUMERIC(10,2) | Precio que ofrece este proveedor para este insumo |

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

║                           ▼                ║

║              costo\_producto\_insumo         ║

║  (cameo \= insumo de categoría "Cortes") ──┘║

║                           ▼                ║

║                       productos            ║

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

---

## Resumen cuantitativo

| Módulo | Tablas v3.0 | Tablas v3.1 | Cambio |
| :---- | :---: | :---: | :---- |
| Productos | 8 | 7 | −1 (`precios_corte_cameo` eliminada) |
| Comercial | 3 | 3 | Sin cambios |
| Finanzas | 4 | 4 | Sin cambios |
| **Total** | **15** | **14** |  |

---

*Arquitectura Final · MemyDeni · v3.1 · Mayo 2026*  
