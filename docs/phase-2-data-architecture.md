# FASE 2 — Diseño completo de base de datos, modelo de dominio y arquitectura de datos

## Objetivo de la fase

Diseñar el modelo de datos empresarial para una plataforma SaaS de videollamadas privadas 1 a 1, orientada a usuarios adultos verificados, con membresías, matching por ubicación, reportes, bloqueos, administración, seguridad y auditoría. Esta fase no implementa controladores, servicios, frontend ni lógica de negocio; únicamente define el contrato de datos y la estrategia de persistencia.

## Análisis previo obligatorio

### Escalabilidad

- La base de datos principal será PostgreSQL y se diseña para crecer a millones de usuarios, pagos, eventos de seguridad, auditorías y sesiones históricas.
- Las tablas de crecimiento más rápido serán `audit_logs`, `security_events`, `matching_queue`, `match_sessions`, `call_sessions`, `call_participants`, `payments` y `reports`.
- `matching_queue` está optimizada para lecturas concurrentes por estado y ubicación mediante índices compuestos por `status`, `country`, `state`, `city` y `queued_at`.
- Las tablas históricas se diseñan con `created_at` y/o fechas de evento para permitir particionamiento futuro por rango temporal.

### Concurrencia

- El matching debe evitar doble asignación del mismo usuario. La estrategia recomendada es usar transacciones con bloqueo de filas y `FOR UPDATE SKIP LOCKED` en migraciones SQL o consultas controladas.
- `matching_queue.user_id` es único para impedir que un usuario tenga múltiples entradas activas o duplicadas en la cola.
- `call_participants` usa unicidad compuesta por `call_session_id` y `user_id` para evitar participantes duplicados.
- `blocks` usa unicidad compuesta por `blocker_id` y `blocked_user_id` para evitar bloqueos duplicados.
- `payments` usa unicidad por `provider` y `provider_reference` para idempotencia de webhooks.

### Seguridad

- Las contraseñas se guardan únicamente como `password_hash`.
- Los refresh tokens se guardan únicamente como `token_hash` y nunca como token en claro.
- Los tokens de recuperación de contraseña se guardan únicamente como `token_hash`.
- Las acciones administrativas se separan en `admin_actions` y también deben registrarse en `audit_logs`.
- Los eventos sensibles de seguridad se guardan en `security_events` con severidad y metadata limitada.

### Privacidad

- No se almacena ubicación exacta ni coordenadas GPS.
- `user_locations` guarda país, estado y ciudad lógica; `visibility_level` controla qué nivel puede mostrarse a otros usuarios.
- `security_events.ip_address`, `terms_acceptances.ip_address` y `user_agent` deben almacenar valores hasheados o truncados por política, aunque los nombres de columna mantengan compatibilidad con el requisito funcional.
- No se almacena contenido de videollamadas, audio, video ni capturas.
- `reports.description` y `resolution` tienen límites de longitud para reducir exposición y abuso.

### Rendimiento

- Las consultas críticas tienen índices compuestos dedicados.
- Las consultas de administración usan índices por estado, fecha y usuario objetivo.
- Las búsquedas de membresía activa usan `memberships(user_id, status, expires_at)`.
- La detección de bloqueos usa índices bidireccionales en `blocks`.
- La conciliación de pagos usa `payments(provider, provider_reference)`.

### Crecimiento a millones de registros

- `audit_logs`, `security_events`, `payments`, `match_sessions` y `call_sessions` son candidatas a particionamiento por mes o trimestre.
- Los datos efímeros de `matching_queue` deben tener limpieza automática de estados `EXPIRED`, `CANCELED` y locks vencidos.
- Los reportes y suspensiones se mantienen con retención más larga por seguridad y cumplimiento.

### Consultas frecuentes

- Login por email.
- Validar usuario activo y no suspendido.
- Validar membresía activa por usuario.
- Buscar candidatos de matching por ciudad, estado, país e internacional.
- Verificar bloqueos entre dos usuarios.
- Crear y consultar sesiones de llamada.
- Revisar reportes pendientes en admin.
- Consultar eventos de seguridad recientes.
- Rotar e invalidar refresh tokens.
- Conciliar pagos por proveedor.

### Cuellos de botella previstos

- Matching concurrente bajo alta demanda.
- Tablas de logs con crecimiento rápido.
- Consultas administrativas amplias sin filtros.
- Webhooks de pagos duplicados o fuera de orden.
- Reportes masivos o abuso del sistema de reportes.

## Modelo de dominio completo

El dominio se divide en los siguientes agregados:

1. **Identidad y cuenta**: `users`, `user_profiles`, `terms_acceptances`.
2. **Privacidad y ubicación**: `user_locations`, `user_preferences`.
3. **Membresía y pagos**: `subscription_plans`, `memberships`, `payments`.
4. **Matching**: `matching_queue`, `match_sessions`.
5. **Videollamadas**: `call_sessions`, `call_participants`.
6. **Seguridad y moderación**: `reports`, `blocks`, `account_suspensions`, `security_events`.
7. **Auditoría y administración**: `audit_logs`, `admin_actions`.
8. **Sesiones seguras**: `refresh_tokens`, `password_resets`.

## Diagrama entidad-relación en texto

```text
users 1 ── 0..1 user_profiles
users 1 ── 0..1 user_locations
users 1 ── 0..1 user_preferences
users 1 ── 0..N memberships
subscription_plans 1 ── 0..N memberships
users 1 ── 0..N payments
memberships 1 ── 0..N payments
users 1 ── 0..1 matching_queue
users 1 ── 0..N match_sessions as user_a
users 1 ── 0..N match_sessions as user_b
match_sessions 1 ── 0..1 call_sessions
call_sessions 1 ── 0..N call_participants
users 1 ── 0..N call_participants
users 1 ── 0..N reports as reporter
users 1 ── 0..N reports as reported_user
call_sessions 1 ── 0..N reports
users 1 ── 0..N blocks as blocker
users 1 ── 0..N blocks as blocked_user
users 1 ── 0..N account_suspensions
users 1 ── 0..N refresh_tokens
users 1 ── 0..N password_resets
users 1 ── 0..N terms_acceptances
users 1 ── 0..N audit_logs as actor
users 1 ── 0..N security_events
users 1 ── 0..N admin_actions as admin
users 1 ── 0..N admin_actions as target_user
```

## Enums del dominio

- `UserRole`: `USER`, `ADMIN`, `SUPER_ADMIN`.
- `UserStatus`: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `DELETED`.
- `Gender`: `WOMAN`, `MAN`, `NON_BINARY`, `OTHER`, `UNDISCLOSED`.
- `LocationVisibilityLevel`: `CITY`, `STATE`, `COUNTRY`, `HIDDEN`.
- `MembershipStatus`: `PENDING`, `ACTIVE`, `EXPIRED`, `CANCELED`, `PAST_DUE`, `SUSPENDED`.
- `PaymentStatus`: `PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`, `CHARGEBACK`, `CANCELED`.
- `QueueStatus`: `SEARCHING`, `LOCKED`, `MATCHED`, `CANCELED`, `EXPIRED`.
- `ReportStatus`: `PENDING`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`, `ESCALATED`.
- `ReportCategory`: `HARASSMENT`, `ABUSE`, `IMPERSONATION`, `PROHIBITED_BEHAVIOR`, `SUSPECTED_UNDERAGE`, `SPAM`, `SAFETY_RISK`, `OTHER`.
- `MatchScope`: `CITY`, `STATE`, `COUNTRY`, `INTERNATIONAL`.
- `CallProvider`: `LIVEKIT`.
- `CallTerminationReason`: `USER_ENDED`, `NEXT_USER`, `DISCONNECTED`, `TIMEOUT`, `MODERATION`, `SUSPENSION`, `SYSTEM_ERROR`.
- `SecurityEventType`: login, logout, token rotation, rate limit, suspicious matching activity, denied admin access and suspended-account login attempts.
- `SecuritySeverity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `SuspensionStatus`: `ACTIVE`, `EXPIRED`, `LIFTED`.

## Diseño tabla por tabla

### users

**Propósito:** identidad principal, autenticación y estado global de cuenta.

**Campos clave:** `id`, `email`, `password_hash`, `status`, `role`, `email_verified`, `last_login_at`, `created_at`, `updated_at`, `deleted_at`.

**Índices:**

- Primario: `id` UUID.
- Único: `email`.
- Secundarios: `(status, role)`, `last_login_at`, `created_at`.

**Restricciones:**

- `email` único y obligatorio.
- `password_hash` obligatorio.
- `status` y `role` controlados por enum.
- Relaciones de datos sensibles usan `RESTRICT` o `SET NULL` según auditoría.

**Consultas optimizadas:** login por email, filtros admin por estado/rol, usuarios recientes, usuarios activos.

### user_profiles

**Propósito:** datos de perfil visibles o semivisibles, separados de credenciales.

**Validaciones:** `display_name` máximo 80 caracteres, `biography` máximo 500, `avatar_url` máximo 2048, `birth_date` requerido para validaciones de edad en backend.

**Privacidad:** no contiene email, tokens, pagos ni ubicación. La fecha de nacimiento no debe exponerse públicamente.

**Índices:** `user_id` único, `display_name`, `language`.

**Optimización:** relación 1:1 permite cargar perfil solo cuando se necesita y no en cada validación de sesión.

### user_locations

**Propósito:** ubicación lógica para matching sin coordenadas exactas.

**Protección de ubicación:** `visibility_level` controla exposición pública. El matching puede usar ciudad/estado/país internamente aunque la UI oculte la ciudad.

**Índices:** `(country_code, state_name, city_name)`, `(country_code, state_name)`, `country_code`.

**Matching eficiente:** los índices siguen el orden de fallback: ciudad, estado, país e internacional.

### user_preferences

**Propósito:** preferencias de alcance geográfico y filtros de matching.

**Lógica:** `matching_scope` define alcance preferido y `allow_international` permite fallback internacional.

**Índices:** `(matching_scope, allow_international)`, `(preferred_country, preferred_state, preferred_city)`.

### subscription_plans

**Propósito:** catálogo de planes disponibles.

**Extensibilidad:** `duration_days` permite mensual, anual y futuros planes promocionales sin cambiar estructura.

**Índices:** `name` único, `active`.

**Restricciones:** no eliminar planes referenciados por membresías; usar desactivación con `active = false`.

### memberships

**Propósito:** estado de acceso premium por usuario.

**Validación rápida:** índice `(user_id, status, expires_at)` permite validar membresía activa por usuario con filtro de expiración.

**Índices:** `(user_id, status, expires_at)`, `(status, expires_at)`, `plan_id`.

**Restricciones:** `user_id` y `plan_id` con `RESTRICT` para preservar historial.

**Corrección de diseño:** no se usa `UNIQUE(user_id, status)` porque impediría múltiples membresías históricas expiradas; en producción se recomienda índice parcial único para membresías activas.

### payments

**Propósito:** historial financiero y conciliación con proveedor externo.

**Conciliación:** `UNIQUE(provider, provider_reference)` permite idempotencia de webhooks.

**Auditoría:** conserva pagos aunque una membresía se desvincule; `membership_id` usa `SET NULL`.

**Índices:** `(user_id, created_at)`, `membership_id`, `(status, paid_at)`, único `(provider, provider_reference)`.

### matching_queue

**Propósito:** cola actual de usuarios buscando match.

**Concurrencia:** `user_id` único evita duplicados; `status`, `locked_at` y `lock_expires_at` permiten locks temporales.

**Locks:** para seleccionar candidatos se recomienda transacción con `FOR UPDATE SKIP LOCKED` y expiración de lock.

**Índices:** `(status, country, state, city, queued_at)`, `(status, country, state, queued_at)`, `(status, country, queued_at)`, `(status, queued_at)`, `lock_expires_at`.

**Prevención de duplicados:** `UNIQUE(user_id)`.

### match_sessions

**Propósito:** historial lógico del emparejamiento antes o durante llamada.

**Métricas:** permite medir matches por alcance, duración, terminaciones, repetición y tasa de fallback.

**Índices:** `(user_a, started_at)`, `(user_b, started_at)`, `started_at`, `ended_at`.

**Restricciones:** referencias a usuarios con `RESTRICT` para preservar historial.

### call_sessions

**Propósito:** sesión de videollamada asociada a un match y a LiveKit.

**LiveKit:** `room_name` único y no adivinable; `provider = LIVEKIT` inicialmente.

**Limpieza:** `ended_at` permite jobs de cierre y limpieza de rooms huérfanas.

**Índices:** `room_name` único, `match_session_id` único, `(provider, started_at)`, `ended_at`.

### call_participants

**Propósito:** participación individual en una llamada.

**Índices:** único `(call_session_id, user_id)`, `(user_id, joined_at)`, `(call_session_id, joined_at)`.

**Uso:** permite calcular duración por usuario y detectar desconexiones.

### reports

**Propósito:** moderación y reportes de seguridad.

**Categorías:** acoso, abuso, suplantación, comportamiento prohibido, sospecha de menor de edad, spam, riesgo de seguridad y otros.

**Estados:** pendiente, en revisión, resuelto, descartado, escalado.

**Flujo:** usuario crea reporte; admin revisa; puede resolver, descartar, escalar o derivar en suspensión.

**Índices:** `(reported_user_id, status, created_at)`, `(reporter_id, created_at)`, `(status, created_at)`, `(category, status)`, `call_session_id`.

### blocks

**Propósito:** bloqueo entre usuarios.

**Prevención de matching:** antes de emparejar se consulta si existe bloqueo en cualquiera de las direcciones.

**Índices:** único `(blocker_id, blocked_user_id)`, `(blocked_user_id, blocker_id)`, `(blocker_id, created_at)`.

**Consultas eficientes:** el índice inverso optimiza saber quién bloqueó al usuario actual.

### account_suspensions

**Propósito:** suspensiones temporales o indefinidas.

**Índices:** `(user_id, status, expires_at)`, `(status, expires_at)`, `(suspended_by, suspended_at)`.

**Restricciones:** el admin que suspende usa `SET NULL` si se elimina; el usuario suspendido usa `CASCADE` ante hard delete.

### audit_logs

**Propósito:** bitácora inmutable de acciones críticas.

**Retención:** larga duración, particionable por `created_at`. No se debe editar desde lógica normal.

**Consulta:** por actor, acción, entidad y fecha.

**Índices:** `(actor_user_id, created_at)`, `(action_type, created_at)`, `(entity_type, entity_id, created_at)`, `created_at`.

**Cumplimiento:** metadata debe ser mínima y no contener secretos.

### security_events

**Propósito:** detección de abuso, alertas y trazabilidad de seguridad.

**Detección:** permite consultar eventos por usuario, IP hasheada, tipo, severidad y fecha.

**Índices:** `(user_id, created_at)`, `(event_type, created_at)`, `(severity, created_at)`, `(ip_address, created_at)`, `created_at`.

**Privacidad:** `ip_address` y `user_agent` deben almacenar hash o valor truncado.

### refresh_tokens

**Propósito:** sesiones persistentes seguras y rotación.

**Rotación:** cada refresh válido crea un nuevo token, revoca el anterior y puede registrar `replaced_by`.

**Invalidación:** `revoked_at` permite logout, revocación admin y detección de reutilización.

**Índices:** `token_hash` único, `(user_id, expires_at)`, `(user_id, revoked_at)`, `expires_at`.

### password_resets

**Propósito:** recuperación de contraseña.

**Seguridad:** token siempre hasheado, expiración corta y `used_at` para un solo uso.

**Índices:** `token_hash` único, `(user_id, expires_at)`, `(expires_at, used_at)`.

### terms_acceptances

**Propósito:** registro legal de mayoría de edad y aceptación de términos.

**Privacidad:** IP y user-agent deben guardarse hasheados o minimizados.

**Índices:** `(user_id, accepted_at)`, `(terms_version, accepted_at)`.

### admin_actions

**Propósito:** acciones administrativas normalizadas.

**Índices:** `(admin_user_id, created_at)`, `(target_user_id, created_at)`, `(action_type, created_at)`.

**Auditoría:** cada acción administrativa también debe producir un `audit_logs` asociado.

## Restricciones y checks recomendados en migraciones SQL

Prisma no expresa todos los checks avanzados ni índices parciales de PostgreSQL. Las siguientes restricciones deben añadirse en migraciones SQL controladas:

```sql
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_display_name_not_blank CHECK (length(trim(display_name)) >= 2),
  ADD CONSTRAINT user_profiles_birth_date_adult CHECK (birth_date <= (CURRENT_DATE - INTERVAL '18 years'));

ALTER TABLE subscription_plans
  ADD CONSTRAINT subscription_plans_duration_positive CHECK (duration_days > 0);

ALTER TABLE memberships
  ADD CONSTRAINT memberships_valid_period CHECK (expires_at > started_at),
  ADD CONSTRAINT memberships_cancelled_after_start CHECK (cancelled_at IS NULL OR cancelled_at >= started_at);

CREATE UNIQUE INDEX memberships_one_active_per_user
  ON memberships(user_id)
  WHERE status = 'ACTIVE' AND deleted_at IS NULL;

ALTER TABLE payments
  ADD CONSTRAINT payments_amount_non_negative CHECK (amount >= 0),
  ADD CONSTRAINT payments_currency_uppercase CHECK (currency = upper(currency));

ALTER TABLE matching_queue
  ADD CONSTRAINT matching_queue_country_uppercase CHECK (country = upper(country)),
  ADD CONSTRAINT matching_queue_lock_pair CHECK ((locked_at IS NULL AND lock_expires_at IS NULL) OR (locked_at IS NOT NULL AND lock_expires_at IS NOT NULL));

ALTER TABLE match_sessions
  ADD CONSTRAINT match_sessions_distinct_users CHECK (user_a <> user_b),
  ADD CONSTRAINT match_sessions_valid_period CHECK (ended_at IS NULL OR ended_at >= started_at);

ALTER TABLE call_sessions
  ADD CONSTRAINT call_sessions_valid_period CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at);

ALTER TABLE call_participants
  ADD CONSTRAINT call_participants_valid_period CHECK (left_at IS NULL OR joined_at IS NULL OR left_at >= joined_at);

ALTER TABLE reports
  ADD CONSTRAINT reports_distinct_users CHECK (reporter_id <> reported_user_id),
  ADD CONSTRAINT reports_description_not_blank CHECK (description IS NULL OR length(trim(description)) >= 10);

ALTER TABLE blocks
  ADD CONSTRAINT blocks_distinct_users CHECK (blocker_id <> blocked_user_id);

ALTER TABLE account_suspensions
  ADD CONSTRAINT account_suspensions_valid_period CHECK (expires_at IS NULL OR expires_at > suspended_at);
```

## Estrategia de auditoría

- `audit_logs` es la fuente principal de trazabilidad de acciones críticas.
- `admin_actions` especializa acciones administrativas para consultas rápidas y cumplimiento interno.
- No se deben guardar secretos, tokens, contraseñas, datos de tarjeta ni contenido de video en metadata.
- Las acciones críticas deben tener `actor_user_id`, `action_type`, `entity_type`, `entity_id`, `metadata` mínima y `created_at`.
- Para alto volumen, particionar `audit_logs` por mes o trimestre.

## Estrategia de logs

- `security_events` se usa para eventos operativos de seguridad.
- `audit_logs` se usa para trazabilidad de negocio y cumplimiento.
- Logs de aplicación deben correlacionarse con IDs, no con datos personales expuestos.
- IP y user-agent se almacenan hasheados o truncados por privacidad.

## Estrategia de archivado

- `matching_queue`: limpiar entradas expiradas o canceladas con jobs frecuentes.
- `security_events`: archivar eventos antiguos por rango temporal según política.
- `audit_logs`: archivar por particiones antiguas, conservando integridad.
- `payments`: conservar por requisitos financieros y conciliación.
- `reports` y `account_suspensions`: conservar según política de moderación y cumplimiento.

## Estrategia de borrado lógico

- `users`, `user_profiles`, `user_locations`, `memberships`, `reports` y `blocks` tienen `deleted_at` cuando aplica.
- El borrado lógico evita pérdida inmediata de trazabilidad, pero debe complementarse con anonimización bajo solicitud válida.
- Para datos estrictamente efímeros puede aplicarse hard delete mediante jobs controlados.

## Estrategia de privacidad

- No almacenar coordenadas GPS.
- No exponer `birth_date`, email, estado interno ni datos de pago a otros usuarios.
- `visibility_level` regula exposición de ubicación.
- No almacenar audio, video ni capturas.
- Hashear o truncar IP y user-agent.
- Minimizar `metadata` JSON.
- Usar respuestas API con DTOs que excluyan campos sensibles en fases posteriores.

## Estrategia de rendimiento

- Consultas críticas cubiertas por índices compuestos.
- Matching usa índices que reflejan orden geográfico: ciudad, estado, país, internacional.
- Validación de membresía usa `(user_id, status, expires_at)`.
- Admin y moderación filtran por estado y fecha.
- Logs y eventos usan índices por fecha y tipo.
- Evitar joins innecesarios en caminos calientes: auth, membership guard y matching.

## Estrategia de particionamiento futuro

Candidatas a partición por rango temporal:

- `audit_logs(created_at)` mensual o trimestral.
- `security_events(created_at)` mensual.
- `payments(created_at)` trimestral o anual.
- `match_sessions(started_at)` mensual.
- `call_sessions(created_at)` mensual.
- `reports(created_at)` trimestral si el volumen crece.

Candidatas a partición o sharding lógico futuro:

- `matching_queue(country)` si hay volumen internacional muy alto.
- `users` no debe particionarse inicialmente salvo crecimiento extremo.

## Convenciones Prisma

- Modelos en PascalCase y tablas en snake_case mediante `@@map`.
- Campos en camelCase y columnas en snake_case mediante `@map`.
- IDs UUID en todas las entidades.
- Fechas con `@db.Timestamptz(3)` salvo `birth_date`, que usa `@db.Date`.
- Cantidades monetarias con `Decimal @db.Decimal(12, 2)`.
- Enums expresan estados finitos del dominio.
- Relaciones explícitas con nombres cuando hay múltiples relaciones hacia `User`.

## Estrategia de migraciones

1. Crear migración inicial con Prisma Migrate.
2. Añadir migración SQL manual para checks, índices parciales y optimizaciones no soportadas por Prisma.
3. Ejecutar validación de schema antes de migrar.
4. Ejecutar migración en staging antes de producción.
5. Versionar seeds mínimos para `subscription_plans`.
6. Prohibir cambios manuales directos en producción sin migración versionada.
7. Usar backups antes de migraciones destructivas.

## Auditoría del modelo y correcciones aplicadas

### Hallazgo 1: duplicidad en matching queue

- **Riesgo:** un usuario podría aparecer múltiples veces en cola.
- **Corrección:** `matching_queue` usa `UNIQUE(user_id)` y estados explícitos.

### Hallazgo 2: pagos duplicados por webhook

- **Riesgo:** proveedores pueden reenviar webhooks.
- **Corrección:** `payments` usa `UNIQUE(provider, provider_reference)`.

### Hallazgo 3: múltiples membresías activas

- **Riesgo:** datos ambiguos si un usuario tiene más de una membresía activa.
- **Corrección:** se documenta índice parcial único `memberships_one_active_per_user` para migración SQL.

### Hallazgo 4: rematches con usuarios bloqueados

- **Riesgo:** consulta lenta si solo existe índice en una dirección.
- **Corrección:** `blocks` tiene índice único directo e índice inverso `(blocked_user_id, blocker_id)`.

### Hallazgo 5: privacidad de IP y user-agent

- **Riesgo:** IP y user-agent pueden ser datos personales.
- **Corrección:** se define que las columnas almacenen hash o valor truncado, no datos crudos.

### Hallazgo 6: checks no expresables en Prisma

- **Riesgo:** Prisma no cubre checks avanzados e índices parciales.
- **Corrección:** se documentó bloque SQL obligatorio para migraciones controladas.

## Estado final de la fase

- Modelo de dominio definido.
- Diagrama entidad-relación definido.
- Tablas obligatorias incluidas.
- Enums obligatorios incluidos.
- Relaciones Prisma completas creadas.
- Índices primarios, secundarios y compuestos definidos.
- Estrategias de auditoría, logs, privacidad, rendimiento, archivado, borrado lógico y particionamiento definidas.
- No se generaron controladores, servicios, API ni frontend.

## Siguiente fase recomendada

FASE 3 — Backend NestJS con autenticación, usuarios, membresías y seguridad base.
