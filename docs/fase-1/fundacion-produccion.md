# Fase 1: Fundación de producción - Ferretería De La O

## Alcance implementado

Esta fase materializa la arquitectura aprobada para iniciar desarrollo con una base productiva: Next.js App Router, TypeScript estricto, Tailwind, shadcn/ui, Supabase, PostgreSQL, ESLint, Prettier, Husky, variables de entorno seguras, arquitectura modular, RLS preparado y sistema de roles.

## Árbol completo de carpetas generado

```text
.
├── .env.example
├── .gitignore
├── .husky/
│   └── pre-commit
├── components.json
├── docs/
│   ├── arquitectura-ferreteria-de-la-o.md
│   └── fase-1/
│       └── fundacion-produccion.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   ├── confirm/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── update-password/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── forgot-password-form.tsx
│   │   │   ├── login-form.tsx
│   │   │   └── update-password-form.tsx
│   │   ├── dashboard/
│   │   │   └── dashboard-overview.tsx
│   │   ├── layout/
│   │   │   └── app-shell.tsx
│   │   └── ui/
│   │       ├── alert.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── label.tsx
│   ├── config/
│   │   ├── __tests__/
│   │   │   └── env.test.ts
│   │   └── env.ts
│   ├── features/
│   │   └── auth/
│   │       ├── actions/
│   │       │   └── auth-actions.ts
│   │       └── schemas/
│   │           ├── __tests__/
│   │           │   └── auth-schemas.test.ts
│   │           └── auth-schemas.ts
│   ├── lib/
│   │   ├── observability/
│   │   │   └── logger.ts
│   │   ├── security/
│   │   │   ├── __tests__/
│   │   │   │   └── hash.test.ts
│   │   │   ├── hash.ts
│   │   │   └── rate-limit.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── proxy.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   └── types/
│       └── database.ts
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20260530000000_initial_foundation.sql
├── tsconfig.json
├── vitest.config.ts
└── proxy.ts
```

## Variables de entorno requeridas

Las variables reales deben configurarse en el proveedor de despliegue o en `.env.local`, que está excluido de Git.

| Variable                               | Uso                                                                |
| -------------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL pública del proyecto Supabase.                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key de Supabase para operaciones cliente/SSR con RLS.  |
| `NEXT_PUBLIC_SITE_URL`                 | URL canónica usada en redirecciones de recuperación de contraseña. |

## Base de datos inicial

La migración inicial crea:

- Empresas, sucursales, almacenes y cajas.
- Perfiles de usuario ligados a `auth.users`.
- Roles, permisos, asignaciones de roles y relación rol-permiso.
- Categorías, productos e inventario base.
- Auditoría inicial.
- Triggers de `updated_at`.
- Trigger de alta de perfil al crear usuario de Supabase Auth.
- Funciones auxiliares para RLS y verificación de roles.
- Vista `user_role_assignments` para dashboard y administración futura.
- RLS habilitado y políticas de lectura iniciales por alcance.

## Flujo de autenticación

1. `/login` autentica con Supabase Auth mediante Server Actions.
2. `/forgot-password` solicita recuperación sin revelar si el correo existe.
3. `/auth/confirm` valida `token_hash` para recuperación segura con flujo SSR.
4. `/update-password` permite definir una nueva contraseña al usuario autenticado por el enlace de recuperación.
5. `/dashboard` está protegido por layout de servidor.
6. Cierre de sesión disponible desde el encabezado protegido.
7. `proxy.ts` mantiene la sesión SSR de Supabase actualizada con cookies seguras.

## Checklist de compilación y despliegue

1. Crear proyecto Supabase.
2. Configurar Site URL y Redirect URLs en Supabase Auth.
3. Aplicar migraciones con Supabase CLI o pipeline CI.
4. Configurar variables reales en el entorno de despliegue.
5. Ejecutar `npm ci`.
6. Ejecutar `npm run typecheck`.
7. Ejecutar `npm run lint`.
8. Ejecutar `npm run format:check`.
9. Ejecutar `npm run test`.
10. Ejecutar `npm run build`.
11. Crear usuario inicial en Supabase Auth.
12. Asignar roles iniciales mediante SQL administrativo controlado.
13. Verificar login, logout, recuperación de contraseña y dashboard en staging.
14. Activar protección de rama y CI obligatorio antes de producción.
15. Configurar backups PITR del proyecto Supabase.
16. Configurar monitoreo y alertas del despliegue.

## Correcciones de endurecimiento aplicadas

### Diseño técnico

La fundación evita pantallas desconectadas y datos simulados. El dashboard protegido consulta únicamente datos reales disponibles por las políticas RLS de Supabase. Las acciones de autenticación ejecutan validación de entrada, rate limiting transaccional en PostgreSQL y logging estructurado sin exponer contraseñas, tokens ni correos completos.

### Base de datos afectada

La migración inicial incluye roles y permisos de sistema alineados al blueprint aprobado, relación rol-permiso, tabla `auth_rate_limits`, función `consume_auth_rate_limit`, índices para bloqueos activos y RLS habilitado. La tabla de rate limiting no concede lectura ni escritura directa a `anon` o `authenticated`; el consumo se realiza mediante una función `security definer` con parámetros validados.

### APIs afectadas

No se agregaron endpoints vacíos. Las rutas y Server Actions afectadas son:

- `signInAction`: valida credenciales, aplica rate limit y autentica con Supabase.
- `requestPasswordResetAction`: valida correo, aplica rate limit y solicita recuperación con Supabase.
- `updatePasswordAction`: exige sesión activa, aplica rate limit por usuario y actualiza contraseña con Supabase.
- `/auth/confirm`: valida tokens de recuperación y restringe redirecciones a rutas permitidas.
- `/dashboard`: consulta datos reales desde Supabase respetando RLS.

### Seguridad afectada

- Rate limiting por acción, principal normalizado e IP de origen.
- Hash SHA-256 del identificador de rate limit para evitar almacenar correos o IPs en claro.
- Logging estructurado de eventos críticos sin secretos.
- Roles y permisos de sistema versionados en migración.
- Sin acceso directo a la tabla de rate limiting desde clientes.
- Sin métricas inventadas ni estados operativos falsos en dashboard.

### Riesgos controlados

| Riesgo                                | Control aplicado                                                       |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Fuerza bruta en login                 | `consume_auth_rate_limit` con ventana transaccional.                   |
| Abuso de recuperación de contraseña   | Rate limit específico por acción.                                      |
| Exposición de datos sensibles en logs | Logs sin contraseña, token, correo completo ni payloads de formulario. |
| Roles incompletos al iniciar          | Roles/permisos de sistema versionados y reproducibles.                 |
| Dashboard desconectado                | Consultas reales a Supabase protegidas por RLS.                        |
