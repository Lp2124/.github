# 19 — Recuperación de la fuente correcta

## 1. Resumen

**Resultado: `SOURCE_ARCHIVE_NOT_FOUND_NO_GO`.** La búsqueda local autorizada no encontró `hidden-camera-locator-playstore-ready.zip` ni otro ZIP cuyo nombre coincidiera con los patrones de cámara oculta, CamGuard o Liora. Por ello no se validó, copió ni extrajo ningún archivo y no se creó un workspace de recuperación.

## 2. Identidad del repositorio equivocado

- Ruta absoluta confirmada por `pwd` y `git rev-parse --show-toplevel`: `/workspace/.github`.
- Rama: `work`.
- Commit de auditoría al iniciar esta ejecución: `15fc207 docs: add strict phase 0 red-team audit`.
- Estado inicial: limpio; `git status --short` no produjo salida.
- Identidad real: plataforma web ecommerce/POS basada en Next.js, Stripe y Supabase; no corresponde a Liora CamGuard.

## 3. Evidencia del conflicto de dominio

La auditoría previa verificó la ausencia de React Native, Expo, Android, iOS, cámara móvil, óptica, Bluetooth/BLE, descubrimiento LAN, sensores y runtime de IA. En cambio, el repositorio contiene pagos Stripe, validación de tarjetas, tiendas, catálogo, pedidos, suscripciones y migraciones Supabase ecommerce. Este repositorio no debe convertirse, renombrarse, mezclarse ni reutilizarse como CamGuard.

## 4. Rutas examinadas

Se realizaron búsquedas acotadas, sin recorrer `/`, pseudo-filesystems ni ubicaciones sensibles:

1. `..` desde `/workspace/.github`, con profundidad máxima 4 (ámbito efectivo bajo `/workspace`).
2. `/workspace`, profundidad máxima 4.
3. `/workspaces`, profundidad máxima 4; la ruta no está disponible en este entorno y sus diagnósticos se redirigieron según el comando solicitado.
4. `/mnt/data`, profundidad máxima 4; la ruta no está disponible en este entorno y sus diagnósticos se redirigieron según el comando solicitado.
5. `/tmp`, profundidad máxima 4.

## 5. Archivos candidatos encontrados

Ninguno. Ambas búsquedas terminaron con salida de candidatos vacía. Los patrones evaluados fueron:

- nombre exacto `hidden-camera-locator-playstore-ready.zip`;
- `*hidden*camera*.zip`;
- `*camguard*.zip`;
- `*liora*.zip`.

## 6. Hashes

No aplica: no se encontró ningún candidato sobre el que calcular SHA-256. No se inventó ningún hash ni ruta.

## 7. Validación ZIP

No aplica. Al no existir candidato, no fue posible ni correcto ejecutar `file`, `sha256sum`, `unzip -t` o `unzip -l`. No se extrajo contenido.

## 8. Fuente seleccionada o motivo de rechazo

No se seleccionó fuente. Motivo: el archivo requerido no existe en las rutas accesibles examinadas. No se usó el ecommerce como sustituto y no se intentó reconstruir el proyecto.

## 9. Workspace separado

No creado. Sin una fuente existente, íntegra y validada, crear `liora-camguard-recovery/` produciría una recuperación vacía o engañosa. Tampoco existen `00_SOURCE_ARCHIVE`, `01_ORIGINAL_EXTRACTED`, `02_WORKING_COPY`, `03_AUDIT` o `04_BACKUPS`.

## 10. Integridad del ecommerce

No se modificó código productivo, configuración, dependencias, lockfiles, migraciones, RLS, branding ni los reportes `00`–`18`. El único archivo añadido es este reporte autorizado.

## 11. Resultado

# SOURCE ARCHIVE NOT FOUND

Estado de la puerta de calidad: **`SOURCE_ARCHIVE_NOT_FOUND_NO_GO`**.

Bloqueadores:

1. Falta `hidden-camera-locator-playstore-ready.zip`.
2. No se puede verificar tipo, SHA-256 ni integridad ZIP.
3. No se puede demostrar evidencia de una aplicación móvil.
4. No se puede crear una copia original inmutable ni una copia de trabajo legítima.
5. No se puede generar `ORIGINAL_SHA256SUMS.txt`.
6. No se puede iniciar una nueva auditoría Fase 0 sobre `02_WORKING_COPY`.

## 12. Próxima acción

Colocar el archivo exacto en:

```text
/mnt/data/hidden-camera-locator-playstore-ready.zip
```

Alternativamente, colocarlo en la raíz accesible `/workspace/hidden-camera-locator-playstore-ready.zip`. Después se debe repetir esta recuperación, validar el ZIP sin extraerlo primero y, únicamente si es íntegro y corresponde a la app móvil, preparar el workspace separado. Luego se ejecutará nuevamente la Fase 0 sobre `02_WORKING_COPY`. **No iniciar Fase 1.**

## Comandos ejecutados

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status --short
git log -1 --oneline
find . -maxdepth 3 -type f | sort | sed 's#^\./##'
find .. -maxdepth 4 -type f \( -iname 'hidden-camera-locator-playstore-ready.zip' -o -iname '*hidden*camera*.zip' -o -iname '*camguard*.zip' -o -iname '*liora*.zip' \) -print
find /workspace /workspaces /mnt/data /tmp -maxdepth 4 -type f \( -iname 'hidden-camera-locator-playstore-ready.zip' -o -iname '*hidden*camera*.zip' -o -iname '*camguard*.zip' -o -iname '*liora*.zip' \) -print 2>/dev/null
```
