# Liora Ferretería De La O — Fase 1

Reconstrucción de **Fase 1** para la plataforma administrativa de Ferretería De La O.

Esta fase entrega únicamente la base de producción para:

- Next.js App Router en `apps/web`.
- Supabase SSR Auth.
- Roles por tienda.
- Layout principal protegido.
- Dashboard Admin con datos reales.
- Middleware de sesión.
- Contexto multi-tenant por `store_id`.
- Configuración global por tienda.
- RLS compatible con Supabase.

> Esta PR **no** implementa POS, caja, pagos ni facturación.

## Estructura

```text
apps/web/
  src/app/                  App Router
  src/app/(auth)/login      Login SSR + server action
  src/app/(app)/dashboard   Dashboard protegido
  src/app/actions           Server actions de auth y tenant
  src/components            Shell y selector de tienda
  src/lib/auth              Sesión y roles
  src/lib/config            Validación de variables de entorno
  src/lib/security          Validaciones y rate limiting
  src/lib/supabase          Clientes Supabase SSR/browser/admin
  src/lib/tenant            Resolución de contexto store_id
supabase/migrations/
  202605300001_phase1_auth_roles_tenant.sql
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

`SUPABASE_SERVICE_ROLE_KEY` solo se usa en módulos server-only para operaciones administrativas futuras; nunca debe exponerse al cliente.

## Instalación

```bash
npm install
```

## Base de datos

Aplicar migraciones:

```bash
supabase db push
```

La migración de Fase 1 crea:

- `profiles`
- `stores`
- `store_memberships`
- `store_settings`
- `audit_logs`
- enum `store_role`
- función `is_store_member`
- trigger de perfil para usuarios nuevos
- índices, restricciones, triggers `updated_at` y políticas RLS

Todas las tablas operativas de Fase 1 usan `store_id` donde corresponde y aplican RLS por membresía activa.

## Desarrollo

```bash
npm run dev
```

## Validación

```bash
npm run typecheck
npm run test
npm run build
```

## Flujo de seguridad

1. Middleware refresca sesión Supabase y protege `/dashboard`.
2. Server Components llaman `requireUser()`.
3. El contexto tenant se resuelve desde `store_memberships` activas.
4. La tienda activa se guarda en cookie `httpOnly`, `sameSite=lax`.
5. Dashboard lee únicamente datos reales autorizados por RLS.
6. Server actions validan entrada con Zod y evitan redirects abiertos.
7. Login aplica rate limiting en memoria por IP como protección básica del runtime web.

## Alcance excluido

No se incluyen en Fase 1:

- POS.
- Caja.
- Pagos.
- Facturación.
- Productos, inventario, clientes u órdenes de Fase 2.
