# 05 — Healthcheck real

| Check | Exit | Resultado/evidencia |
|---|---:|---|
| `npm ci` | 0 | instalación raíz reproducible; 5 high |
| `npm ci --prefix tools/card-format-validator` | 0 | reproducible; 0 vulnerabilidades |
| `npm run lint` | 0 | ESLint real, `--max-warnings=0`, sin diagnósticos |
| `npm run typecheck` | 0 | TypeScript web real |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | 0 | comprobación directa real |
| `npm run test` | 0 | 7 archivos, 62 pruebas web aprobadas |
| `npm run build` | no capturado | log completo: compilación, TS, 6 páginas y optimización finalizaron; el wrapper terminó antes de imprimir el exit solicitado. Por rigor se clasifica **NO VERIFICABLE/reproducibilidad fallida**, no pass |
| `npx expo-doctor` | N/A | no ejecutado: no hay Expo y `npx` intentaría adquirir una herramienta nueva, prohibido |
| CLI typecheck | 0 | real |
| CLI tests | 0 | 12/12 reales |
| CLI build | 0 | real |
| `npm audit` | 1 | 5 vulnerabilidades high |
| `npm audit --prefix ...` | 0 | 0 vulnerabilidades |

Warnings completos relevantes: npm repitió que `http-proxy` es una configuración desconocida y dejará de funcionar; Next informó telemetría anónima en el primer build. No hubo errores lint/typecheck/test. No hay unit/integration/e2e mobile porque no existe app móvil. No se sustituyó ninguna prueba por salida simulada.
