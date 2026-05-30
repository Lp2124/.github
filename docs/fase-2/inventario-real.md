# Fase 2: Inventario real - Ferretería De La O

## Diseño técnico

La Fase 2 implementa inventario real sobre la fundación Next.js + Supabase. El módulo está dividido en:

- Migración SQL de catálogo e inventario.
- Tipos TypeScript del esquema público de Supabase.
- Validaciones server-side con Zod.
- Servicios de lectura conectados a Supabase y RLS.
- Server Actions para escritura validada.
- RPC transaccional para movimientos de inventario.
- Pantallas administrativas protegidas por sesión.
- Exportación CSV desde datos reales visibles por RLS.

## Base de datos afectada

La migración `20260601000000_inventory_phase_2.sql` agrega o extiende:

- `brands`.
- `suppliers`.
- `products` con marca, proveedor, unidad, costo, precio y control de inventario.
- `product_barcodes`.
- `product_images`.
- `inventory_balances` con stock mínimo y máximo.
- `inventory_movements` como kardex auditable.
- Tipo `inventory_movement_type`.
- Función `current_user_has_permission`.
- Función `register_inventory_movement` para entradas, salidas, ajustes, mermas, devoluciones y traspasos.
- Vista `low_inventory_alerts`.
- Índices para búsqueda operativa, historial y bajo inventario.
- RLS para marcas, proveedores, códigos de barras, imágenes y movimientos.
- Políticas de escritura para categorías, productos y balances.

## APIs afectadas

No se agregan endpoints vacíos. Las superficies de escritura son Server Actions:

- `createProductAction`.
- `updateProductAction`.
- `deactivateProductAction`.
- `createCategoryAction`.
- `createBrandAction`.
- `createSupplierAction`.
- `updateStockSettingsAction`.
- `registerMovementAction`.

La exportación CSV se entrega con `GET /inventario/export.csv` y consulta productos reales visibles por RLS.

## Seguridad afectada

- Todas las escrituras validan entrada con Zod en servidor.
- Supabase aplica JWT y sesión SSR existente.
- RLS limita lectura y escritura por empresa visible y permisos.
- Movimientos usan RPC `security definer` con validaciones explícitas de usuario, permisos, empresa, almacenes y stock suficiente.
- El historial de movimientos no se actualiza desde UI; solo se inserta por la función transaccional.
- Cada movimiento registra entrada en `audit_log`.
- Export CSV no usa service role y respeta RLS.

## Riesgos

| Riesgo                          | Mitigación                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Stock negativo por concurrencia | `register_inventory_movement` bloquea balance con `for update` antes de modificar stock. |
| SKU o barcode duplicado         | Restricciones únicas por empresa en productos y códigos de barras.                       |
| Movimiento sin autorización     | Verificación de permisos por tipo de movimiento dentro de RPC.                           |
| Traspaso inconsistente          | Origen y destino se actualizan en una sola transacción dentro de la función.             |
| Alertas incorrectas             | Vista `low_inventory_alerts` se calcula desde balances reales y productos activos.       |
| CSV con datos no autorizados    | Exportación usa el cliente Supabase SSR del usuario autenticado y RLS.                   |

## Checklist de prueba

1. Aplicar migraciones en Supabase.
2. Crear empresa, sucursal y almacén reales.
3. Asignar a un usuario rol con permisos de catálogo e inventario.
4. Crear categoría principal.
5. Crear subcategoría asociada a la categoría principal.
6. Crear marca.
7. Crear proveedor.
8. Crear producto con SKU único, código de barras e imagen HTTPS.
9. Intentar crear producto con SKU repetido y confirmar rechazo.
10. Configurar stock mínimo y máximo por almacén.
11. Registrar entrada y validar incremento de stock.
12. Registrar salida y validar decremento de stock.
13. Intentar salida mayor al stock disponible y confirmar rechazo.
14. Registrar ajuste, merma y devolución.
15. Registrar traspaso entre almacenes distintos y validar origen/destino.
16. Confirmar historial auditable en `/inventario/movimientos`.
17. Confirmar alertas de bajo inventario al quedar por debajo del mínimo.
18. Ejecutar exportación CSV desde `/inventario/export.csv`.
19. Ejecutar `npm run typecheck`.
20. Ejecutar `npm run test`.
21. Ejecutar `npm run lint`.
22. Ejecutar `npm run format:check`.
23. Ejecutar `npm audit --audit-level=moderate`.
24. Ejecutar `npm run build` con variables de entorno reales del ambiente.
