# Flujo de Creación de Cliente

## Módulo Comercial · MemyDeni

---

## Contexto

Un cliente es cualquier persona que realiza un pedido a MemyDeni. El modelo no contempla campos B2B (CUIT, razón social, condición tributaria). Los medios de contacto viven en una tabla separada `cliente_contactos` para soportar N canales sin alterar el schema (V12).

---

## Paso 1 — Datos de identidad

| Campo | Valor ejemplo | Notas |
| :---- | :---- | :---- |
| `nombre` | Valentina Gómez | Obligatorio. Nombre real o apodo operativo |
| `codigo_identificador` | P1041M | Generado automáticamente. Aparece en todos los presupuestos vinculados |
| `notas` | Clienta frecuente de fiestas infantiles. Siempre pide envío | Campo libre para observaciones operativas |
| `activo` | true | Se activa por defecto al crear. Se desactiva en lugar de eliminar |

---

## Paso 2 — Canales de contacto

Los contactos viven en `cliente_contactos` (relación 1:N). No hay límite fijo de contactos por cliente.

| `tipo` | `valor` | `es_principal` |
| :---- | :---- | :---- |
| instagram | @vale.gomez.fiestas | true |
| whatsapp | \+54 9 11 5523 4481 | false |

**ENUM de tipos disponibles:**

'instagram' | 'whatsapp' | 'mail' | 'otros'

**Reglas de operación:**

\- Solo puede haber un es\_principal \= true por cliente.

  Si se marca uno nuevo como principal, el anterior pasa a false.

\- No hay límite fijo de contactos por cliente.

\- Al crear un presupuesto, se sugiere el contacto con es\_principal \= true.

\- El ENUM es extensible — agregar un canal nuevo no requiere

  alterar la tabla clientes.

**Ejemplo de múltiples contactos del mismo tipo:**

cliente\_id  tipo        valor                 es\_principal

42          instagram   @vale.gomez.fiestas   true

42          whatsapp    \+54 9 11 5523 4481    false

42          instagram   @vale\_eventos         false

---

## Resultado final

| Campo | Valor |
| :---- | :---- |
| Código | P1041M |
| Nombre | Valentina Gómez |
| Canal preferido | Instagram · @vale.gomez.fiestas |
| Estado | Activo |

Desde aquí se puede crear un nuevo presupuesto directamente asociado a este cliente.

---

## Campos de auditoría

| Campo | Aplica | Justificación |
| :---- | :---: | :---- |
| `creado_en` | ✅ | Entidad de negocio que evoluciona |
| `actualizado_en` | ✅ | Ídem |

`cliente_contactos` no tiene campos de auditoría — dato simple que vive del ciclo de vida del cliente.

---

## Veto aplicado

**V12 — Sin columnas fijas de contacto en clientes:** Los campos estáticos (`instagram`, `facebook`, `whatsapp`, `email`) fueron eliminados de `clientes` y reemplazados por la tabla relacional `cliente_contactos`. Esto hace el sistema extensible sin alterar el schema ante nuevos canales.

---

## Pantalla pendiente de diseño

- **Pantalla de creación de cliente** — formulario mínimo (nombre \+ al menos un contacto) con sección expandible para agregar más contactos

---

*Flujo Creación Cliente · Módulo Comercial · MemyDeni · v3.6 · Mayo 2026*  
