# Módulo seguro de pagos

## Arquitectura

- `card-brand.ts`, `card-validation.ts` y `card-mask.ts` solo comprueban formato, longitud y checksum de Luhn. **No prueban que una tarjeta exista, tenga saldo o pertenezca a una persona.**
- `CardInput.tsx` es una ayuda local sin CVV, sin envío y sin persistencia. No se usa para cobrar.
- El cobro real usa Stripe Payment Element. PAN, fecha y CVC se introducen dentro del iframe de Stripe y no deben tocar el DOM controlado, backend, base de datos, analítica ni logs de Liora.
- `create-intent/route.ts` acepta exclusivamente monto en unidades menores, moneda, tienda e idempotency key. Requiere sesión Supabase válida y un rol autorizado para esa tienda.

## Configuración

Define `STRIPE_SECRET_KEY` solo en el servidor, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` para Stripe.js y `STRIPE_MODE` como `test` o `live`. Las claves deben coincidir con el modo declarado y la configuración completa se valida antes de iniciar o compilar Next.js. Usa únicamente tarjetas de prueba oficiales cuando `STRIPE_MODE=test`.

Abre `/admin/pos/payment?storeId=<uuid-de-tienda>` con una sesión Supabase autorizada. La aplicación debe desplegarse con HTTPS.

## Controles y límites

- Nunca almacenes PAN completo, CVC/CVV, track data ni PIN. PCI DSS prohíbe almacenar códigos de verificación después de la autorización, incluso cifrados.
- La aplicación entrega CSP, `nosniff`, protección de framing, política de referentes y Permissions Policy desde `next.config.ts`.
- Nunca registres cuerpos de solicitudes, `clientSecret`, PAN/CVV o respuestas completas del proveedor.
- El límite local de solicitudes protege una sola instancia. En un despliegue horizontal debe complementarse en CDN/WAF o con un almacén distribuido.
- El cliente propone un monto de POS, por lo que el operador autenticado debe confirmarlo. Para ecommerce, deriva el monto en servidor desde productos/orden y nunca confíes en el total del navegador.
- La confirmación definitiva y actualización de órdenes debe realizarse mediante un webhook de Stripe con firma verificada; no se debe confiar únicamente en el redirect del navegador.

## Pruebas

Ejecuta `npm test`, `npm run typecheck`, `npm run lint` y `npm run build`. Los tests contienen solamente números de prueba públicos de Stripe y no automatizan intentos contra el proveedor.

## Laboratorio local de QA

La ruta `/admin/pos/payment/lab` contiene dos herramientas deliberadamente aisladas del flujo de cobro:

- El identificador IIN/BIN acepta como máximo ocho dígitos y clasifica únicamente Visa, Mastercard, American Express o Discover y el rango público coincidente. No consulta servicios externos ni intenta inferir emisor, país, saldo, titular, producto o estado de la tarjeta.
- El laboratorio Stripe usa un catálogo cerrado e inmutable de valores de prueba publicados en la [documentación oficial de Stripe](https://docs.stripe.com/testing?testing-method=payment-methods). El botón de escenario aleatorio selecciona un elemento de ese catálogo: **no crea números nuevos**.

No se implementa un generador arbitrario de PAN con checksum Luhn. Aunque un checksum solo valida estructura matemática, generar PAN plausibles ampliaría innecesariamente el riesgo de pruebas no autorizadas. Para automatización, Stripe recomienda usar identificadores `PaymentMethod` de prueba en lugar de enviar números desde código de servidor.

Estas herramientas se ejecutan en el navegador, no tienen endpoint propio, no persisten entradas y no deben conectarse a analítica de sesión o grabadores del DOM. Los fixtures se deben usar exclusivamente en Stripe Sandbox o test mode; nunca con claves `live` ni para pruebas de carga.
