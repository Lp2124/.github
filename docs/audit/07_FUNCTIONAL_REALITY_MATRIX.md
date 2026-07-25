# 07 — Matriz de realidad funcional

| Función solicitada | Clasificación | Evidencia |
|---|---|---|
| Cámara, preview, captura, flash | NO EXISTE | sin librería/código/permisos |
| Detección óptica/lente/infrarroja | NO EXISTE | sin procesamiento de imagen/frames |
| Bluetooth/BLE/RSSI | NO EXISTE | sin librería ni permisos |
| Wi‑Fi/red local/mDNS/SSDP/Bonjour | NO EXISTE | sin implementación |
| Magnetómetro/acelerómetro/giroscopio | NO EXISTE | sin APIs de sensor |
| Proximidad/luz/orientación/barómetro/LiDAR | NO EXISTE | sin APIs |
| GPS/geolocalización | NO EXISTE | política web incluso deshabilita geolocation |
| IA/inferencia local | NO EXISTE | sin runtime/modelo/pipeline |
| Historial/reportes CamGuard | NO EXISTE | datos son ecommerce |
| Suscripciones | PARCIAL | tabla/RLS ecommerce; sin flujo CamGuard/paywall |
| Paywall/licencias | NO EXISTE | no UI/entitlement/licencia |
| Auth | PARCIAL | API consulta Supabase Auth; UI/flujo completo ausente |
| i18n | NO EXISTE | textos hardcodeados en español; sin framework/catálogos |
| Permisos Android/iOS | NO EXISTE | proyectos nativos ausentes |
| POS Stripe | PARCIAL | checkout/API reales; depende de servicios/config externos no ejercitados end-to-end |
| Clasificación/validación tarjetas | IMPLEMENTADA Y VERIFICABLE | 62 tests web y 12 CLI incluyen estas utilidades |
| Storefront ecommerce | PLACEHOLDER | pantalla declara TODO explícito |

No se clasifica ninguna función CamGuard como simulada: simplemente no existe. El branding/README sí declara otra aplicación, lo cual constituye conflicto crítico de producto.
