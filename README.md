# Liora Ferretería De La O — MVP administrativo operativo

App administrativa multi-tenant para Ferretería De La O / Liora Admin construida con **Next.js App Router**, **TypeScript**, **Supabase Auth SSR**, **Supabase PostgreSQL**, **RLS**, server actions, roles por tienda y auditoría.

## Alcance implementado

### Fase 1 — Base de producción

- Supabase SSR Auth.
- Roles por tienda: `owner`, `admin`, `manager`, `staff`, `viewer`.
- Layout principal protegido.
- Dashboard Admin con datos reales.
- Administración de equipo/roles por tienda.
- Middleware/proxy de sesión y protección de rutas.
- Contexto multi-tenant por `store_id`.
- Configuración global editable por `owner/admin`.
- Audit logs para acciones críticas.
- Validación server-side con Zod.
- CSRF / same-origin validation en server actions que modifican datos.
- RLS compatible con Supabase.

### MVP operativo

- Productos y categorías.
- Inventario y movimientos.
- POS básico.
- Ventas / órdenes completadas.
- Caja: apertura, movimientos, cierre e historial.
- Clientes básicos.
- Reportes básicos.

No se usan mocks ni datos inventados. Las pantallas muestran datos reales de Supabase filtrados por `store_id`.

## Alcance excluido

No se implementa todavía:

- Facturación fiscal SAT real.
- Mercado Pago.
- Pagos online reales.
- E-commerce público.
- App móvil.
- Multi-sucursal avanzada.
- Devoluciones complejas.
- Contabilidad avanzada.

## Estructura

```text
apps/web/
  src/app/(auth)/login          Login SSR + server action
  src/app/(app)/dashboard       Dashboard protegido
  src/app/(app)/products        CRUD de productos y categorías
  src/app/(app)/inventory       Stock e historial de movimientos
  src/app/(app)/pos             POS básico con carrito y venta
  src/app/(app)/cash            Caja, apertura, cierre e historial
  src/app/(app)/customers       Clientes básicos
  src/app/(app)/reports         Reportes básicos
  src/app/(app)/team            Administración real de roles
  src/app/(app)/settings        Configuración global de tienda
  src/app/(app)/audit           Auditoría por tienda
  src/app/actions               Server actions validadas
  src/components                Shell, selector de tienda y controles UI
  src/lib/audit                 Escritura de eventos críticos
  src/lib/auth                  Sesión, roles y permisos
  src/lib/config                Validación de variables de entorno
  src/lib/operations            Esquemas Zod operativos
  src/lib/security              CSRF, redirects, rate limiting y UUIDs
  src/lib/supabase              Clientes Supabase SSR/browser/admin y tipos
  src/lib/tenant                Resolución de contexto store_id
supabase/migrations/
  202605300001_phase1_auth_roles_tenant.sql
  202606020001_mvp_operations.sql
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

`SUPABASE_SERVICE_ROLE_KEY` solo se usa en `server-only`; nunca debe exponerse al cliente.

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

La migración MVP crea:

- `product_categories`
- `products`
- `inventory_movements`
- `sales`
- `sale_items`
- `cash_register_sessions`
- `cash_movements`
- `customers`
- enums operativos
- RPC `complete_pos_sale`
- RPC `close_cash_session`
- índices, restricciones, triggers `updated_at` y políticas RLS

## Flujo operativo mínimo

1. Iniciar sesión en `/login`.
2. Seleccionar tienda activa si el usuario pertenece a varias tiendas.
3. Crear categorías y productos en `/products`.
4. Registrar stock inicial o compras en `/inventory/adjustments`.
5. Abrir caja en `/cash/open`.
6. Vender desde `/pos`.
7. Revisar caja en `/cash` y cerrar en `/cash/close`.
8. Consultar reportes en `/reports`.

## Seguridad

- Las rutas protegidas exigen usuario autenticado y tenant context.
- Toda query sensible filtra por `store_id`.
- RLS evita acceso cross-tenant.
- Server actions que modifican datos validan mismo origen, usuario, tenant, rol e input con Zod.
- Operaciones críticas registran `audit_logs`.
- POS usa RPC transaccional para crear venta, partidas y movimientos de inventario.
- Caja usa RPC para cierre consistente.
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
```
