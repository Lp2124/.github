# 04 — Auditoría de dependencias

## Instalación reproducible

- `npm ci` raíz: exit 0, 494 paquetes añadidos, 496 auditados; **5 vulnerabilidades high**.
- `npm ci --prefix tools/card-format-validator`: exit 0, 3 paquetes añadidos, 4 auditados; 0 vulnerabilidades.
- Ambos lockfiles permanecieron sin cambios.

## Seguridad

`npm audit` raíz terminó 1: vulnerabilidades high en `brace-expansion`, `js-yaml`, `next`, `postcss` y `sharp`; avisos asociados incluyen DoS, SSRF, XSS, lectura/path traversal, bypass de proxy y disclosure. No se aplicó ninguna corrección. Auditoría CLI: exit 0, 0 vulnerabilidades.

## Obsolescencia y resolución

`npm outdated` terminó 1 (resultado esperado al hallar versiones): 18 paquetes web con versiones wanted/latest posteriores; CLI: `@types/node` y TypeScript tienen versiones posteriores. `npm ls --all` terminó 0; opcionales ausentes no se clasifican como errores obligatorios. React 19.2.7 coincide con React DOM 19.2.7 y peer dependencies observadas; no existe Expo/RN que compatibilizar.

## Warnings

Todos los comandos npm emitieron `Unknown env config "http-proxy"`; queda evaluado como warning del entorno/npm y bloquea reproducibilidad hasta sanear configuración. No se instalaron ni actualizaron dependencias fuera de `npm ci` conforme a lockfiles.
