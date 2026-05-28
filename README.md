# LIORA COMMERCE PLATFORM

Base arquitectónica real para evolucionar este repositorio a una plataforma SaaS multi-tenant ecommerce white-label.

## Auditoría del estado actual (2026-05-26)

Este repositorio (`/workspace/.github`) **no contiene actualmente una app Next.js completa**; era un repositorio de archivos comunitarios. Por eso esta iteración implementa la base técnica de arquitectura y datos sin romper funcionalidades existentes.

### Hallazgos
- No había `package.json`, pipeline de build frontend ni módulos ecommerce previos.
- No había esquema SQL productivo multi-tenant.
- No había validación de variables de entorno.
- No había middleware tenant ni helper de contexto de tienda.

## Implementación realizada por fases

### Fase 1 — Base multi-tenant segura
- Estructura monorepo base: `apps/`, `packages/`, `shared/`.
- Resolver tenant por `slug` con validación estricta.
- Middleware para inyectar `x-tenant-slug`.
- Helper compartido `getCurrentTenantSlug()` para evitar consultas sensibles sin tenant.
- `.env.example` y validación runtime con `zod`.

### Fase 2 — Modelo SQL ecommerce real
Migraciones en `supabase/migrations/`:
- `202605260001_liora_phase1_multi_tenant.sql`
- `202605260002_liora_phase2_core_ecommerce.sql`

Incluye tablas reales:
- `stores`, `store_settings`, `user_store_roles`
- `products`, `categories`, `product_images`
- `customers`, `orders`, `order_items`
- `inventory_movements`, `expenses`, `payments`, `coupons`
- `activity_logs`, `subscriptions`

Incluye además:
- columnas `store_id` en entidades de tienda
- `created_at`, `updated_at`, `deleted_at` cuando aplica
- enums de dominio
- índices y constraints
- funciones de seguridad `current_user_is_super_admin()` y `user_has_store_access()`
- RLS real tenant-aware
- buckets de Supabase Storage (`store-assets`, `product-images`) + políticas por `store_id`

## Variables de entorno
Usar `.env.example` como plantilla mínima.

Reglas:
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en cliente.
- `ENCRYPTION_KEY` mínimo 32 chars.
- Validar entorno al arranque con `apps/web/src/lib/env.ts`.

## Deploy (base)
1. Crear proyecto Supabase.
2. Ejecutar migraciones SQL en orden.
3. Configurar variables en `.env.local`.
4. Completar app Next.js App Router real dentro de `apps/web`.

## TODO REAL (no simulado)
- Implementar app Next.js completa con Tailwind + shadcn/ui.
- Implementar Supabase Auth SSR y autorización por rol (`super_admin`, `store_owner`, `employee`, `customer`).
- Implementar catálogo, carrito, checkout WhatsApp, órdenes y dashboard operando contra tablas reales.
- Implementar PWA instalable (manifest, service worker, offline básico, caching).
- Implementar panel super-admin para ciclo de vida de tiendas/suscripciones.
