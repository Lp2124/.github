# 17 — Registro de hallazgos

| ID | Severidad | Título | Archivo/línea | Evidencia e impacto | Recomendación | Bloquea | Fase propuesta |
|---|---|---|---|---|---|---|---|
| CRT-001 | CRITICAL | Producto/dominio equivocado | `README.md:1-3` | Commerce SaaS, no CamGuard; objetivo íntegro ausente | decidir saneamiento/migración de dominio sin borrar evidencia | sí | saneamiento tras F0 |
| CRT-002 | CRITICAL | Aplicación móvil inexistente | `package.json:3-5` | workspace solo web; no RN/Expo/Android/iOS | diseñar arquitectura móvil en fase autorizada | sí | futura F1, no ahora |
| HIG-001 | HIGH | Cinco vulnerabilidades npm | `package-lock.json` | audit: brace-expansion, js-yaml, Next, PostCSS, sharp | evaluar advisories y actualizar de forma controlada | sí | saneamiento F0 |
| HIG-002 | HIGH | Capacidades CamGuard inexistentes | repositorio completo | cámara/óptica/BLE/LAN/sensores/IA ausentes | alinear alcance y criterios antes de implementación | sí | planificación posterior |
| HIG-003 | HIGH | Autorización RLS demasiado amplia | migration 002:363-483 | políticas `for all` por membresía, no capability | matriz de roles + pruebas negativas RLS | sí | saneamiento datos |
| HIG-004 | HIGH | SQL/RLS no probado | `supabase/migrations/*` | sin Supabase config/test/ejecución local | harness reproducible y pruebas multiusuario | sí | saneamiento F0 |
| HIG-005 | HIGH | CLI fuera de checks raíz | `package.json:3-5` | no es workspace; root green puede omitirlo | integrar gobernanza sin ocultar fallos | sí | saneamiento tooling |
| HIG-006 | HIGH | Comprobación de librerías omitida | `tools/.../tsconfig.json:19` | `skipLibCheck` activo | retirarlo y resolver errores en fase permitida | sí | saneamiento TS |
| HIG-007 | HIGH | Privacidad CamGuard ausente | repositorio completo | sin consentimiento/retención/borrado/exportación | threat/privacy model antes de sensores | sí | diseño privacidad |
| MED-001 | MEDIUM | Migraciones con modelos heredados | migrations 001/002 | `store_users` y `user_store_roles`; `if not exists` no migra | consolidar migración probada | sí | saneamiento datos |
| MED-002 | MEDIUM | Código de tarjeta duplicado/divergente | web/lib/payments vs tool/src | reglas Discover distintas | única fuente o contratos compartidos | sí | refactor futuro |
| MED-003 | MEDIUM | Storefront placeholder | `apps/web/src/app/[slug]/page.tsx:7` | TODO visible | retirar promesa o completar en fase autorizada | sí | producto |
| MED-004 | MEDIUM | Sin CI/CD | repositorio completo | no workflows/gates | pipeline lint/type/test/build/audit | sí | DevSecOps |
| MED-005 | MEDIUM | Sin pruebas E2E/accesibilidad/performance | `apps/web/tests` | solo unit/integration ligeras | agregar matrices reales | sí | QA futura |
| MED-006 | MEDIUM | Sin i18n | `apps/web/src` | strings español hardcodeadas | estrategia/catálogos/locale/RTL | sí | UX futura |
| MED-007 | MEDIUM | CSP permite inline | `apps/web/next.config.ts:23,38` | menor resistencia XSS | nonces/hashes tras análisis Stripe/Next | sí | seguridad |
| LOW-001 | LOW | Config npm desconocida | entorno npm | warning `http-proxy` repetido | sanear config de ejecución | sí | entorno |
| LOW-002 | LOW | Client secret en query | result page 12,18 | posible exposición operacional | revisar referrer/log redaction y flujo | no | seguridad |
| LOW-003 | LOW | Sin formateador | manifests | formato no gobernado | adoptar check sin bajar lint | no | tooling |
| LOW-004 | LOW | Sin dark mode verificable | UI/CSS | experiencia limitada | evaluar en diseño futuro | no | UX |
| LOW-005 | LOW | Dependencias desactualizadas | manifests | `npm outdated` lista 18 web + 2 CLI | actualización probada/advisory-driven | sí | dependencias |
| INF-001 | INFORMATIONAL | Checks web reales pasan | scripts/tests | lint, TS, 62 tests exit 0 | conservar | no | continuo |
| INF-002 | INFORMATIONAL | CLI checks pasan | tool tests | TS/build + 12 tests exit 0 | integrar en root/CI | no | continuo |
| INF-003 | INFORMATIONAL | Sin secretos reales detectados | `.env.example`, tests | solo placeholders/fixtures | mantener scanning | no | continuo |
| INF-004 | INFORMATIONAL | Sin assets/modelos | inventario | ninguna imagen/fuente/modelo | registrar requisitos futuros | no | futura |

## Totales

CRITICAL 2; HIGH 7; MEDIUM 7; LOW 5; INFORMATIONAL 4. Todo error/warning/riesgo sin resolver mantiene **NO-GO**.
