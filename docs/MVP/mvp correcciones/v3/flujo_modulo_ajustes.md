# Flujo del Módulo de Ajustes
Configuración General · MemyDeni

## Contexto general
El módulo de Ajustes (o Configuración) centraliza los parámetros operativos, la identidad corporativa y las reglas de gobernanza del negocio MemyDeni. 

A través de este módulo, las propietarias configuran la información básica del negocio (que se inyecta dinámicamente en los documentos PDF e interfaces públicas de clientes), definen las reglas automáticas de vencimiento del ciclo comercial de los presupuestos, y configuran la matriz financiera de distribución de ingresos (reparto de utilidades por socio y fondos de reinversión) al momento de la facturación.

---

## Accesos y navegación
El acceso al módulo de Ajustes está integrado directamente en la barra lateral principal (sidebar):

* **Ubicación:** Botón "Ajustes" (icono de engranaje) ubicado al final de la barra lateral, justo encima del avatar del usuario activo.
* **Segmentación:** A diferencia de las vistas operativas, esta sección no se encuentra agrupada en un submenú, lo que brinda un acceso inmediato y rápido a la administración del ERP.

---

## Interfaz General y Diseño Bilateral
La pantalla de Ajustes está organizada en un diseño bilateral de dos columnas (`aj-stack`) que divide las responsabilidades operativas en bloques densos independientes. Cada bloque cuenta con su propio pie de página con control de guardado autónomo (`saveConfig` y `saveSocios`), lo que permite realizar modificaciones específicas sin interferir con las otras áreas.

![Interfaz General de Ajustes](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/ajustes_v3.png)

---

## Bloque 1 — Inicio (Identidad, Contacto y Moneda)
Define la información identitaria y la configuración regional básica del negocio. Sus valores se inyectan en toda la aplicación y en las cotizaciones emitidas a los clientes.

### Estructura de Campos de Identidad

| Campo | Componente UI | Valor Ejemplo | Reglas de Validación / Comportamiento |
| :--- | :--- | :--- | :--- |
| **Nombre del negocio** | `FloatingField` | MemyDeni | **Requerido.** Nombre público de la marca comercial. |
| **Moneda** | `FloatingSelect` | ARS — Peso argentino | Moneda base del sistema. Formatea los montos en toda la aplicación (tablas, reportes, totalizadores). |
| **Calle** | `FloatingField` | Calle Falsa | Nombre de la arteria vial del domicilio del negocio. |
| **Número** | `FloatingField` | 123 | Altura domiciliaria. |
| **Ciudad** | `FloatingField` | Almagro | Ciudad de radicación. |
| **Provincia** | `FloatingField` | Buenos Aires | Provincia / Estado federativo. |
| **Canal** | `FloatingSelect` | Instagram | Canal de contacto principal (Instagram, WhatsApp, Mail, Otros). |
| **Valor** | `FloatingField` | `@memydeni` | Identificador o número telefónico de contacto del canal elegido. |

> [!NOTE]
> **Dirty Tracking del Bloque:**
> Al modificar cualquier valor del bloque, se activa un chip en el encabezado que indica **Sin guardar** (`configDirty = true`) y habilita el botón **Guardar cambios** para enviar un `PUT` hacia `/api/ajustes/configuracion`.

---

## Bloque 2 — Presupuestos (Lógica de Cancelación por Vencimiento)
Establece la política de caducidad temporal de las cotizaciones emitidas para liberar existencias en taller.

### Cancelación Automática por Tiempo
Gestionado mediante un switch accesible (`ToggleSwitch`):
* **Estado Inactivo (`false`):** Los presupuestos enviados no tienen caducidad automática y permanecen válidos de forma indefinida en la base de datos.
* **Estado Activo (`true`):** Despliega dinámicamente un campo condicional para ingresar los **Días de espera**.

![Ajustes con Cancelación Activa](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/ajustes_condicional_v3.png)

### Lógica Condicional del Vencimiento:

| Campo Condicional | Control UI | Valor Ejemplo | Reglas y Efecto en FSM |
| :--- | :--- | :--- | :--- |
| **Días de espera** | Input numérico con unidad | `7` | **Requerido si el switch está activo.** Debe ser un entero positivo. Indica los días de validez de la oferta. |

> [!IMPORTANT]
> **Proceso en Segundo Plano (Cron Job):**
> Si la cancelación está activa, un proceso periódico en el backend evalúa diariamente los presupuestos en estado `enviado`. Si la diferencia entre la fecha actual y su última actualización supera los días de espera configurados, el sistema cambia automáticamente su estado a `cancelado` y añade la nota interna: *"Cancelado: Tiempo de confirmación excedido"*.

---

## Bloque 3 — Finanzas (Distribución de Socios y Fondos)
Este bloque gestiona los porcentajes de distribución automática de la utilidad neta de cada pedido al transicionar a estado `facturado`.

### Estructura de la Tabla de Distribución

| Campo / Columna | Control UI | Valor Ejemplo | Comportamiento en el ERP |
| :--- | :--- | :--- | :--- |
| **Socio / Destino** | Input texto nativo | Meme | Nombre del socio o destino (cuenta de gastos, reinversión, etc.). |
| **Porcentaje** | Input numérico nativo | `40%` | Porcentaje de la utilidad correspondiente. |
| **Activo** | Switch manual (`.aj-switch`) | `true` (Activo) | Define si la fila participa de la suma activa de reparto. |

### Reglas de Suma de Control y Validación:
Para asegurar la consistencia contable del ERP, el pie del bloque calcula la **Suma activa** en tiempo real:

$$\text{Suma activa} = \sum (\text{Porcentaje de destinos activos})$$

* **Suma Activa = 100%:** El indicador de suma se tiñe de verde (estado de validación correcto) y se habilita el botón **Guardar cambios** para persistir los porcentajes mediante un `PUT` hacia `/api/ajustes/distribucion`.
* **Suma Activa ≠ 100%:** El indicador se tiñe de color coral/rojo, despliega un aviso de advertencia y bloquea el botón de guardado para impedir estados de reparto inconsistentes.

---

## Bloque 4 — Cuenta (Perfil de Usuario y Sesión)
Muestra la información de sesión de la propietaria en la instancia activa del ERP. Sus campos se inicializan a partir de Supabase Auth metadata.

* **Nombre:** Nombre del administrador (se inyecta como `FloatingField` deshabilitado).
* **Email:** Correo de ingreso registrado en Supabase (campo de solo lectura, con float persistente y no enfocable).

---

## Verificación Visual y Multimedia

### Ajustes con Cambios Guardados
Una vez confirmados los cambios en la base de datos, los indicadores de "Sin guardar" desaparecen y la moneda base se actualiza de inmediato para formatear todos los montos monetarios en la sesión actual:

![Ajustes Guardados con Éxito](d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/ajustes_saved_v3.png)

### Video del Recorrido Completo (Walkthrough)
Se ha grabado un video interactivo que reproduce el caso de uso completo de administración:
1. Navegación a la sección de Ajustes.
2. Activación del switch de Cancelación Automática revelando el campo de días de espera y configurando `10` días.
3. Edición de la identidad comercial cambiando el nombre a *MemyDeni v3*.
4. Modificación de porcentajes de socios desactivando y reactivando la cuenta para comprobar las alertas de Suma de Control (70% inválido, 100% válido).
5. Guardado exitoso de los cambios de configuración y finanzas.

🎥 **Ver Video del Recorrido:** [flujo_modulo_ajustes.mp4](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/v3/media/flujo_modulo_ajustes.mp4)
