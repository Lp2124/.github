# Liora Ferretería De La O — Fase 1 estable

App administrativa multi-tenant para Ferretería De La O / Liora Admin construida con **Next.js App Router**, **TypeScript**, **Supabase Auth SSR**, **Supabase PostgreSQL**, **RLS**, server actions, roles por tienda y auditoría.

## Checkpoint actual

Este checkpoint mantiene **Fase 1** estable y añade únicamente el módulo de **Productos**. No incluye inventario, POS, caja, clientes, reportes, pagos ni facturación.

### Fase 1 incluida

- Supabase SSR Auth.
- Roles por tienda: `owner`, `admin`, `manager`, `staff`, `viewer`.
- Layout principal protegido.
- Dashboard Admin con datos reales.
- Administración de equipo/roles por tienda.
- Proxy de sesión y protección de rutas.
- Contexto multi-tenant por `store_id`.
- Configuración global editable por `owner/admin`.
- Audit logs para acciones críticas.
- Validación server-side con Zod.
- CSRF / same-origin validation en server actions que modifican datos.
- RLS compatible con Supabase.

### Productos incluido

- Tabla `product_categories`.
- Tabla `products`.
- Rutas `/products`, `/products/new` y `/products/[id]`.
- Creación, edición y desactivación de productos con server actions.
- Búsqueda básica por nombre o SKU.
- RLS multi-tenant por `store_id`.
- Audit logs en create/update/deactivate.

### Fuera de este checkpoint

No se implementa en esta rama de rescate:

- Inventario.
- POS / punto de venta.
- Caja / cortes.
- Clientes.
- Reportes operativos.
- Facturación fiscal SAT real.
- Mercado Pago.
- Pagos online reales.
- E-commerce público.
- App móvil.

## Estructura activa

```text
apps/web/
  src/app/(auth)/login          Login SSR + server action
  src/app/(app)/dashboard       Dashboard protegido
  src/app/(app)/products        Catálogo de productos
  src/app/(app)/team            Administración real de roles
  src/app/(app)/settings        Configuración global de tienda
  src/app/(app)/audit           Auditoría por tienda
  src/app/actions               Server actions validadas de Fase 1 y Productos
  src/components                Shell, selector de tienda y controles UI
  src/lib/audit                 Escritura de eventos críticos
  src/lib/auth                  Sesión, roles y permisos
  src/lib/config                Validación de variables de entorno
  src/lib/security              CSRF, redirects, rate limiting y UUIDs
  src/lib/supabase              Clientes Supabase SSR/browser/admin y tipos
  src/lib/tenant                Resolución de contexto store_id
supabase/migrations/
  202605300001_phase1_auth_roles_tenant.sql
  202606020001_products.sql
```

## Requisitos

- Node.js 22 o superior.
- Proyecto Supabase con Auth habilitado.
- Variables de entorno locales en `apps/web/.env.local` (no commitear):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key-solo-servidor
```

`SUPABASE_SERVICE_ROLE_KEY` solo se usa en módulos `server-only`; nunca debe exponerse al cliente.

## Instalación

```bash
npm install
```

## Base de datos

Aplicar migraciones en Supabase:

```bash
supabase db push
```

La migración de Fase 1 crea `profiles`, `stores`, `store_memberships`, `store_settings`, `audit_logs`, enum `store_role`, función `is_store_member`, triggers, índices y RLS.

La migración de Productos crea `product_categories` y `products` con `store_id`, llaves foráneas, índices, triggers `updated_at`, RLS y políticas por rol.

## Rutas funcionales

- `/login`
- `/dashboard`
- `/products`
- `/products/new`
- `/products/[id]`
- `/team`
- `/settings`
- `/audit`

La navegación del `AppShell` solo apunta a rutas reales disponibles en este checkpoint.

## Seguridad

- Las rutas protegidas exigen usuario autenticado y tenant context.
- Toda query sensible filtra por `store_id`.
- RLS evita acceso cross-tenant.
- Server actions que modifican datos validan mismo origen, usuario, tenant, rol e input con Zod.
- Operaciones críticas registran `audit_logs`.
- No hay service role en cliente.

## Nota de seguridad de dependencias

El proyecto fija `next` y `eslint-config-next` en `16.3.0-canary.35` para mantener `npm audit --audit-level=moderate` en cero vulnerabilidades mientras se monitorean releases estables seguros.

## Desarrollo

```bash
npm run dev
```

## Validación

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
npm run test:security
```
