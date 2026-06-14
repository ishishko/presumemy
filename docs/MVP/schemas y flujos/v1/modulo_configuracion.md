# Módulo Configuración — Documento Consolidado

## Presumemi · Sistema de Gestión MemyDeni

*Fuente de verdad única · v3.64 · Mayo 2026*

---

## Contexto

El módulo Configuración gestiona los datos del negocio, los usuarios del sistema, la distribución de ganancias y los parámetros operativos. Corresponde a la pantalla "Ajustes" en la UI. Gestionado vía Supabase Auth para usuarios y tabla `configuracion_negocio` para el resto.

---

## Tablas del módulo (1 tabla propia \+ delegación a Supabase)

configuracion\_negocio   ← tabla propia

usuarios                ← delegado a Supabase Auth

---

## Schema

### `configuracion_negocio`

Registro único por instancia. Siempre id \= 1\.

CREATE TABLE configuracion\_negocio (

  id                              INT           PRIMARY KEY DEFAULT 1,

  nombre\_negocio                  VARCHAR(200),

  logo\_url                        TEXT,           \-- Supabase Storage

  domicilio                       JSONB,

  contacto\_principal              JSONB,

  moneda                          VARCHAR(10)   DEFAULT 'ARS',

  cancelacion\_automatica\_activa   BOOLEAN       DEFAULT false,

  cancelacion\_dias\_espera         INT           DEFAULT 7,

  actualizado\_en                  TIMESTAMP     DEFAULT NOW(),

  CONSTRAINT solo\_una\_fila CHECK (id \= 1\)

);

**Upsert pattern:**

INSERT INTO configuracion\_negocio (id, nombre\_negocio, ...)

VALUES (1, ...)

ON CONFLICT (id) DO UPDATE SET

  nombre\_negocio \= EXCLUDED.nombre\_negocio,

  actualizado\_en \= NOW();

**Estructura JSONB de `domicilio`:**

{

  "calle": "",

  "numero": "",

  "piso\_depto": "",

  "ciudad": "",

  "provincia": "",

  "codigo\_postal": "",

  "pais": "",

  "referencia": ""

}

**Estructura JSONB de `contacto_principal`:**

{

  "canal": "instagram",

  "valor": "@memydeni"

}

### Campos y sus usos

| Campo | Usado en |
| :---- | :---- |
| `nombre_negocio` | Header de la app, PDFs de presupuesto |
| `logo_url` | Header, PDFs, pantalla de login |
| `domicilio` | Pie de PDF de presupuesto, datos de facturación |
| `contacto_principal` | Pie de PDF de presupuesto |
| `moneda` | Formateo de montos en toda la app |
| `cancelacion_automatica_activa` | Job de cancelación automática de presupuestos |
| `cancelacion_dias_espera` | Job de cancelación automática de presupuestos |

---

## Gestión de usuarios — Supabase Auth

Los usuarios son gestionados directamente por Supabase Auth. La aplicación usa la Supabase Admin API para:

- Listar usuarios activos  
- Activar / desactivar usuarios (enable/disable en Supabase)  
- Invitar nuevos usuarios (envío de email de invitación)

No hay tabla `usuarios` en la DB local — Supabase es la fuente de verdad.

**Perfil de usuario editable desde la app:**

- `nombre` → actualiza `user_metadata.full_name` en Supabase  
- `email` → solo lectura  
- Cambio de contraseña → flujo nativo de Supabase Auth

---

## Lógica de negocio

### Cancelación automática de presupuestos

El job evalúa diariamente:

SELECT id FROM presupuestos

WHERE estado \= 'enviado'

  AND actualizado\_en \< NOW() \- INTERVAL '? days'

    \-- ? \= configuracion\_negocio.cancelacion\_dias\_espera

Si `cancelacion_automatica_activa = true` y hay resultados:

1. Cambia `estado` a `'cancelado'`  
2. Escribe en `notas`: `Cancelado: Tiempo de confirmación excedido — [fecha]`

### Validación de distribución de ganancias

Al guardar cambios en `distribucion_ganancias`:

Σ(porcentaje WHERE activo \= true) debe ser \= 1.0000

Si \> 1.0000 → rechazar con error explícito

Si \< 1.0000 → advertencia pero permitir guardar

---

## UI — Pantalla Ajustes

**Posición en aside:** ítem flotante justo arriba del avatar del usuario, sin etiqueta de sección.

**Layout:** bloques apilados verticalmente. Cada bloque tiene su propio "Guardar cambios" — no hay guardado global.

### Bloque ① — Inicio

- Nombre del negocio (texto)  
- Logo (upload con preview — PNG/JPG 512×512 recomendado)  
- Domicilio del negocio (campos JSONB)  
- Contacto del negocio (canal \+ valor)  
- Moneda (selector: ARS / USD / EUR / Otra)  
- Sub-sección "Widgets del dashboard" — badge "Próximamente · V2" con controles visibles pero desactivados

### Bloque ② — Presupuestos

- Toggle "Cancelación automática por tiempo"  
- Campo "Días de espera" (visible solo si toggle activo)  
- Hint: "Los presupuestos en estado Enviado se cancelarán automáticamente luego de X días sin confirmación"

### Bloque ③ — Finanzas

Tabla editable de `distribucion_ganancias`:

- Columnas: Socio/Destino | Porcentaje | Activo  
- Validación en tiempo real: indicador verde si Σ \= 100%, coral si ≠ 100%

### Bloque ④ — Usuarios

Lista de usuarios de Supabase Auth:

- Columnas: Avatar \+ Nombre | Email | Estado (toggle activo/inactivo) | Rol  
- Botón "+ Invitar usuario"

### Bloque ⑤ — Cuenta

- Nombre del usuario (editable)  
- Email (solo lectura)  
- Botón "Cambiar contraseña" → flujo Supabase Auth  
- Sub-sección "Apariencia" — badge "Próximamente · V2" (tema oscuro)

---

## Aside del sistema — orden completo

OPERACIÓN

  Inicio

  Presupuestos

  Productos

  Insumos

  Finanzas

DATOS

  Clientes

─────────────

  Ajustes         ← sin etiqueta de sección

─────────────

  \[Avatar usuario\]

---

*Módulo Configuración · Presumemi · v3.64 · Mayo 2026*  
