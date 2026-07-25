# 02 — Stack real

| Área | Evidencia real | Versión declarada / instalada |
|---|---|---|
| Runtime | Node, engines `>=20.9.0` | ejecutado `v24.15.0` |
| Gestor | npm + lockfile v3 | npm `11.4.2` |
| Web | Next.js App Router + React/React DOM | 16.2.7 / 19.2.7 (exactas) |
| Lenguaje | TypeScript | web 6.0.3; CLI declarado `^5.8.3`, instalado 5.9.3 |
| UI/CSS | Tailwind PostCSS | 4.3.0 |
| Navegación | rutas filesystem de Next | no navegación móvil |
| Estado | hooks locales React | sin store global |
| Backend | Next route handler | `/api/payments/create-intent` |
| Datos/Auth | Supabase JS/SSR + PostgreSQL migrations | 2.107.0 / 0.10.3; Auth Supabase parcial |
| Pagos | Stripe server + Stripe.js/React | 22.2.0 / 9.7.0 / 6.6.0 |
| Validación | Zod | 4.3.0 |
| Tests | Vitest web; `node:test` CLI | 4.1.8 |
| Lint | ESLint + config Next | instalado 9.39.4 / 16.2.7 |
| Build | Next/Turbopack; `tsc` CLI | sin build móvil |
| CI/CD | ausente | no verificable |
| Formateo | ausente | no script/config |
| Mobile | React Native/Expo/Android/iOS ausentes | no aplica |

`npm ls --all` resolvió el árbol sin dependencias obligatorias ausentes; mostró opcionales no instaladas. No existe persistencia local móvil, Firebase, Expo, React Native ni paquetes de sensores/cámara/red.
