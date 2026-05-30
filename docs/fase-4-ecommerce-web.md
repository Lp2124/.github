# Fase 4: E-commerce web

## Diseño técnico

La Fase 4 agrega una tienda pública mobile-first conectada al catálogo e inventario real. El catálogo público lee productos activos mediante RLS para `anon`; el checkout exige sesión autenticada, stock disponible y Mercado Pago configurado. Si Mercado Pago no está configurado, el flujo se bloquea antes de crear pedidos para evitar checkout falso.

## Base de datos afectada

La migración `20260603000000_ecommerce_phase_4.sql` agrega:

- `customer_profiles`.
- `customer_addresses`.
- `customer_favorites`.
- `ecommerce_orders`.
- `ecommerce_order_lines`.
- `ecommerce_stock_reservations`.
- `ecommerce_payment_preferences`.
- Enums de estado de pedido y preferencia de pago.
- RPC `create_ecommerce_order` con validación de stock y reservas.
- Políticas públicas de lectura para catálogo activo.
- Políticas RLS de cliente para perfil, favoritos, pedidos y pagos.

## APIs afectadas

- `/tienda` home pública.
- `/tienda/catalogo` catálogo con filtros.
- `/tienda/productos/[id]` detalle de producto.
- `/tienda/carrito` carrito persistente local.
- `/tienda/checkout` creación de pedido y preferencia Mercado Pago.
- `/tienda/cuenta` perfil e historial de pedidos.
- `/tienda/favoritos` favoritos del cliente.

## Seguridad afectada

- Checkout bloqueado sin sesión autenticada.
- Checkout bloqueado si `MERCADO_PAGO_ACCESS_TOKEN` no está configurado.
- Productos públicos solo muestran productos activos.
- Pedidos y favoritos se limitan por `auth.uid()` mediante RLS.
- La creación de pedido se ejecuta en RPC transaccional y valida stock disponible.
- El carrito local no crea pedidos ni reservas hasta completar checkout autenticado.

## Riesgos

| Riesgo                  | Mitigación                                                 |
| ----------------------- | ---------------------------------------------------------- |
| Checkout sin cobro real | Bloqueo explícito si Mercado Pago no está configurado.     |
| Pedido sin stock        | RPC valida inventario disponible antes de crear el pedido. |
| Sobreventa durante pago | Se crean reservas de stock con expiración.                 |
| Exposición de pedidos   | RLS limita pedidos al cliente autenticado.                 |
| Filtros costosos        | Consultas limitadas a 100 productos y filtros server-side. |

## Checklist de prueba

1. Aplicar migración de Fase 4.
2. Verificar home pública `/tienda` sin sesión.
3. Verificar búsqueda por header.
4. Filtrar catálogo por categoría.
5. Filtrar catálogo por marca.
6. Filtrar por precio mínimo y máximo.
7. Filtrar productos con stock.
8. Abrir página de producto.
9. Agregar producto con stock al carrito.
10. Modificar cantidad en carrito.
11. Validar cálculo de subtotal, IVA y total.
12. Intentar checkout sin sesión y confirmar bloqueo.
13. Intentar checkout sin `MERCADO_PAGO_ACCESS_TOKEN` y confirmar bloqueo sin crear pedido.
14. Configurar Mercado Pago en staging.
15. Crear pedido con usuario autenticado.
16. Validar pedido en base de datos.
17. Validar preferencia de Mercado Pago.
18. Revisar historial en `/tienda/cuenta`.
19. Probar favoritos con cliente autenticado y perfil existente.
20. Ejecutar `npm run typecheck`.
21. Ejecutar `npm run test`.
22. Ejecutar `npm run lint`.
23. Ejecutar `npm run format:check`.
24. Ejecutar `npm audit --audit-level=moderate`.
25. Ejecutar `npm run build`.
