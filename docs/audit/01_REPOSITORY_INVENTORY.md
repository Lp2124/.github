# 01 — Inventario del repositorio

## Resumen verificable

Repositorio pequeño, de **comercio electrónico web**, no aplicación móvil. Contiene 66 archivos rastreados antes de esta auditoría, una workspace npm (`apps/web`), dos migraciones Supabase y una herramienta CLI independiente no incluida en workspaces.

## Árbol lógico (generados excluidos)

- Raíz: `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, README y documentos comunitarios/seguridad.
- `apps/web`: Next.js App Router; configuración ESLint/PostCSS/Vitest/TypeScript; `src/app`, `src/components/payments`, `src/lib`, `src/types`; 7 archivos de prueba.
- `supabase/migrations`: dos SQL fechados 2026-05-26.
- `tools/card-format-validator`: paquete npm independiente, 6 fuentes TypeScript, 2 pruebas, lockfile propio.
- `config`: reglas de repolinter. `profile`: README comunitario.

## Tipos y artefactos

Código rastreado: TS/TSX/MJS/CSS/SQL/JSON/Markdown. No hay imágenes, iconos, fuentes, modelos ML, assets de app/store, binarios, seeds ni funciones Edge/backend separadas. No hay `android/`, `ios/`, Expo, React Native, manifest móvil, Gradle, CocoaPods, EAS ni CI workflows.

## Datos y backend

Las migraciones declaran `stores`, roles de tienda, configuración, categorías, productos, imágenes, clientes, pedidos, inventario, gastos, pagos, cupones, actividad y suscripciones. Backend presente: una ruta Next.js para Stripe y Supabase; no existe backend CamGuard.

## Entorno y lockfiles

`.env.example` declara nombre/URL, Supabase URL/anon/service role, cifrado, WhatsApp y Stripe. Hay `package-lock.json` raíz y otro para el CLI; no hay pnpm/Yarn/Bun. Directorios generados existentes y omitidos del detalle: `.git`, `node_modules`, `.next` y `dist`.
