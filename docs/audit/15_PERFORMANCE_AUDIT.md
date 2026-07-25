# 15 — Rendimiento

No hay cámara, frames, Bluetooth, sensores o modelos; su consumo no puede medirse. Los componentes son pequeños y usan `useMemo` selectivamente. `PaymentResult` limpia su efecto mediante bandera de cancelación; no se observaron timers/listeners/suscripciones persistentes.

Riesgos: no hay métricas Web Vitals, presupuesto de bundle, profiling, load/performance tests ni CI. El build produjo 6 rutas pero no reportó tamaños de bundle. Dependencias web/Stripe/Supabase son sustanciales para una base con storefront placeholder. No hay imágenes/assets que optimizar. Rendimiento móvil, startup, memoria, batería y background: **NO PUEDE VERIFICARSE**.
