# 12 — Seguridad y privacidad

## Evidencia favorable

No se encontraron secretos reales: `.env.example` contiene marcadores, tests usan claves sintéticas y el código valida entorno. La API limita body, valida esquema/origen/content-type/idempotencia y autorización Supabase; Stripe Element evita PAN/CVV en servidor. Migraciones habilitan RLS y buckets privados.

## Riesgos

- **HIGH:** 5 vulnerabilidades npm high sin corregir (DoS, SSRF, XSS/path/file disclosure y bypass asociados a dependencias).
- **HIGH:** no existe modelo de privacidad CamGuard: consentimiento fotográfico/sensores/LAN, retención, borrado, exportación y disclosure de procesamiento están ausentes.
- **HIGH:** `user_has_store_access` concede acceso amplio por membresía y las políticas `for all` no diferencian roles; un rol `customer`/`employee` parece poder escribir entidades sensibles si tiene membresía. Requiere prueba real contra Supabase.
- **MEDIUM:** `SUPABASE_SERVICE_ROLE_KEY` se exige/acepta en configuración aunque no se observó uso; aumenta superficie de secreto operacional.
- **MEDIUM:** CSP permite scripts y estilos inline; reduce protección XSS.
- **MEDIUM:** no hay CI, secret scanning/SAST/DAST, dependency gate ni evidencia de pruebas RLS/migraciones.
- **LOW:** `clientSecret` de PaymentIntent viaja en query de retorno, patrón de Stripe habitual pero sensible a historial/logs/referrers; requiere revisión operacional.
- **LOW:** warning npm `http-proxy` afecta higiene de configuración.

No hay fotos/ubicación CamGuard que evaluar, precisamente porque la app no existe. No se mostraron secretos completos.
