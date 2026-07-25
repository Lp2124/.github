# 03 — Scripts y dependencias

## Raíz

`build`, `dev`, `lint`, `test` y `typecheck` delegan realmente a `@liora/web`. No son `echo`, no simulan éxito ni silencian el código de salida. No existe script para Expo, móvil, e2e, seguridad, formateo, migraciones o el CLI independiente.

## `apps/web/package.json`

- `build`: `next build` (real).
- `dev`: `next dev` (real; no ejecutado por ser persistente).
- `lint`: `eslint . --max-warnings=0` (real y warnings bloqueantes).
- `test`: `vitest run` (real).
- `typecheck`: `tsc --noEmit` (real).

## CLI independiente

`build`, `test` y `typecheck` son reales. `clean` usa borrado de `dist`, no se ejecutó por prohibición de eliminar archivos. El paquete no pertenece a `workspaces`, por lo que los scripts raíz no lo validan: brecha de gobernanza **HIGH**. Su `tsconfig.json` activa `skipLibCheck`, configuración expresamente incompatible con el criterio estricto solicitado (**HIGH**).

## Dependencias

El producto real depende de Stripe, Supabase, Next/React, Zod y Tailwind; ninguna dependencia tiene relación con CamGuard. Existen implementaciones duplicadas/divergentes de marca, máscara y validación de tarjetas entre web y CLI. No se ejecutó una herramienta automática de “unused dependencies” porque no está declarada y añadirla está prohibido.
