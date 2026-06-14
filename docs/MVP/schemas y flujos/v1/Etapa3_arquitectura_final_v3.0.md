# Arquitectura Final — Sistema de Gestión MemyDeni

## Modelo Relacional · Versión 3.0

**Documento de cierre de sesión de revisión arquitectónica** *Mayo 2026*

---

## Resumen de cambios respecto a Etapa 2

| Cambio | Descripción |
| :---- | :---- |
| **Reorganización de módulos** | De 4 módulos (Maestros, Catálogo, Comercial, Finanzas) a 3 módulos autocontenidos (Productos, Comercial, Finanzas) |
| **Eliminación del módulo Maestros** | Sus entidades se redistribuyeron al módulo donde realmente operan |
| **Módulo Catálogo → Módulo Productos** | Renombrado y ampliado para contener todas las entidades participantes del dominio de productos |
| **`categorias_producto` y `tipos_insumo`** | Movidas de Maestros a Productos (son clasificadores internos del módulo) |
| **`precios_corte_cameo`** | Movida de Maestros a Productos (es un costo de producción, no un parámetro global) |
| **`socios`** | Movida de Maestros a Finanzas (solo se usa en la distribución de ganancias al facturar) |
| **Nuevas entidades** | `proveedores` e `insumo_proveedor` agregadas al módulo Productos |

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
| `categorias_producto` | P2 | 9 categorías fijas del catálogo (Aplique, Banner, Tag, Letras, Golosinas, Papercraft, Box 3D, Merch, Varios). Sin recursividad. |
| `tipos_insumo` | P2 | 8 categorías fijas de insumos (Papel, Papel Impreso, Pegamentos, Librería, Cortes, Embalaje, Mercería, Varios). |
| `precios_corte_cameo` | P2 | Historial de precios de la máquina Cameo (Máximo / Medio / Bajo). Permite auditoría retroactiva del costeo. |
| `proveedores` | P2 | Entidades proveedoras de insumos. Datos de contacto y condiciones comerciales. |
| `insumos` | P1 | Materias primas con precio unitario, unidad de medida, proveedor y fecha de actualización. |
| `insumo_proveedor` | P2 | Relación entre insumos y proveedores. Máximo 3 proveedores por insumo. Incluye precio de referencia y flag de proveedor principal. |
| `productos` | P1 | Catálogo maestro con `porcentaje_ganancia`, `precio_calculado`, `precio_final`, `precio_ambientadora` y flag `validacion` (ok / error / sin\_precio). |
| `costo_producto_insumo` | P1 | Receta / BOM (Bill of Materials). Qué insumos usa cada producto y en qué cantidad. `tipo_costo` ENUM (insumo / cameo / embalaje / extra). |

**Relaciones internas del módulo:**

categorias\_producto ──► productos

tipos\_insumo        ──► insumos

proveedores ──M:N (vía insumo\_proveedor)──► insumos

insumos     ──M:N (vía costo\_producto\_insumo)──► productos

precios\_corte\_cameo  (referenciado en costo\_producto\_insumo cuando tipo\_costo \= 'cameo')

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

## Mapa relacional global

╔══════════════════════════════════════╗

║           MÓDULO PRODUCTOS           ║

║                                      ║

║  categorias\_producto                 ║

║         │                            ║

║         ▼                            ║

║  tipos\_insumo ──► insumos ◄── proveedores

║                      │    (insumo\_proveedor)

║                      ▼                ║

║            costo\_producto\_insumo      ║

║                      │                ║

║  precios\_corte\_cameo ┘                ║

║                      ▼                ║

║                  productos            ║

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

## Detalle de entidades nuevas

### `proveedores`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `nombre` | VARCHAR(120) | Nombre o razón social |
| `contacto` | VARCHAR(120) | Nombre de la persona de contacto |
| `telefono` | VARCHAR(30) | Número de contacto |
| `notas` | TEXT | Observaciones generales |
| `activo` | BOOLEAN | Borrado lógico |

### `insumo_proveedor`

| Columna | Tipo | Descripción |
| :---- | :---- | :---- |
| `id` | SERIAL PK | Identificador interno |
| `insumo_id` | INT FK | Referencia a `insumos.id` |
| `proveedor_id` | INT FK | Referencia a `proveedores.id` |
| `es_principal` | BOOLEAN | Indica si es el proveedor preferido para este insumo |
| `precio_referencia` | NUMERIC(10,2) | Precio de referencia del proveedor para este insumo |

**Restricción:** máximo 3 proveedores por insumo. Controlado en capa de aplicación.

---

## Vetos arquitectónicos vigentes (heredados de Etapa 2\)

| ID | Veto | Descripción |
| :---: | :---- | :---- |
| V1 | Sin contabilidad de partida doble | `plan_maestro_cuentas`, `asientos_diario` y `apuntes_contables` descartados |
| V2 | Sin SCD Type 2 | `historico_tarifas` descartada. El precio se congela en `detalle_presupuesto` |
| V3 | Sin recursividad de categorías | `categorias_producto.id_padre` descartado |
| V4 | Sin hard delete | Todas las entidades principales usan campo `activo` |
| V5 | Sin FLOAT / REAL | Todo valor monetario usa `NUMERIC(10,2)` o `NUMERIC(19,4)` |
| V6 | Sin campos B2B en clientes | Sin CUIT, razón social ni condición tributaria |
| V7 | Sin FSM de 5 estados | `presupuestos` usa 3 estados simples \+ flag `facturado` |
| V8 | Sin triggers complejos | La lógica de distribución la ejecuta la aplicación |
| V9 | Sin MVCC agresivo | Sin bloqueos optimistas complejos |
| V10 | Sin tabla unificada de contactos | `clientes` y `proveedores` como tablas separadas para mantener autocontenido |

---

## Resumen cuantitativo

| Módulo | Tablas | Prioridad dominante |
| :---- | :---: | :---- |
| Productos | 8 | P1 / P2 |
| Comercial | 3 | P1 / P2 |
| Finanzas | 4 | P1 / P2 / P3 |
| **Total** | **15** |  |

*Etapa 2 tenía 13 tablas en 4 módulos. Etapa 3 tiene 15 tablas en 3 módulos autocontenidos.*

---

*Arquitectura Final · MemyDeni · Mayo 2026*  
