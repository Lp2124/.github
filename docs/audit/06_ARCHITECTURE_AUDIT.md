# 06 — Auditoría de arquitectura

## Realidad

Arquitectura web vertical de pagos: páginas/componentes → librerías de pago → Stripe/Supabase. Hay utilidades de tenant y dos migraciones ecommerce. No existen capas de dominio/aplicación/infraestructura/presentación para CamGuard.

## Hallazgos

- **CRITICAL:** dominio completo equivocado: ecommerce/POS/tarjetas frente a seguridad/cámaras.
- **HIGH:** repositorio carece de aplicación móvil y de toda arquitectura Android/iOS/RN/Expo.
- **HIGH:** CLI queda fuera del workspace y de checks raíz.
- **MEDIUM:** lógica de tarjeta duplicada entre `apps/web/src/lib/payments` y `tools/card-format-validator/src`, con reglas divergentes (p.ej. longitudes Discover).
- **MEDIUM:** migración “phase2” redefine tablas ya creadas en phase1 con `create table if not exists`; ese patrón no transforma columnas/constraints existentes y conserva entidades heredadas (`store_users`) junto a `user_store_roles`.
- **MEDIUM:** UI importa directamente utilidades/proveedor de pagos del mismo feature; adecuado para prototipo pequeño pero no hay frontera de aplicación consistente.
- Componentes máximos observados: 113 líneas; no se encontró componente gigante. Hooks locales tienen alcance acotado.
- No se detectaron ciclos por inspección de imports. ESLint/TS no informaron imports sin uso.
- Código huérfano probable: CLI no integrado y tipos/infra ecommerce ajenos al objetivo.

No se ejecutó analizador de ciclos/unused dedicado porque no está instalado y no se permiten dependencias nuevas.
