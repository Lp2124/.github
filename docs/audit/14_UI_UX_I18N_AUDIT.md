# 14 — UI, UX, accesibilidad e idiomas

UI real: storefront placeholder, cobro, resultado y laboratorio de pruebas. Next provee routing filesystem; no existe navegación móvil.

- **HIGH:** storefront incompleto muestra un TODO al usuario.
- **HIGH:** todas las pantallas CamGuard y sus estados no existen.
- **MEDIUM:** textos españoles hardcodeados; no hay i18n, catálogos, locale routing, RTL ni formateo regional sistemático.
- **MEDIUM:** sin suite de accesibilidad, lector de pantalla, contraste automatizado ni E2E; algunos labels/ARIA existen, pero no prueban conformidad WCAG.
- **LOW:** no se encontró dark mode funcional; diseño web usa colores fijos.
- **LOW:** safe areas, tamaños táctiles y adaptación móvil nativa no son evaluables; Tailwind responsive web aparece parcialmente.
- Estados loading/error existen en pago/resultados, pero no hay estados vacíos/producto completo.
- No se ejecutó auditoría visual en navegador porque no hubo cambio perceptible ni la app CamGuard existe.
