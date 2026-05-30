# Fase 3: POS y corte de caja

## Diseño técnico

La Fase 3 agrega un POS real conectado a Supabase, inventario y caja. Las ventas solo se pueden crear cuando el cajero tiene una caja abierta. La operación crítica de venta, devolución, cancelación, entrada/salida de efectivo y cierre de caja se ejecuta mediante funciones PostgreSQL transaccionales con RLS y permisos.

## Base de datos afectada

La migración `20260602000000_pos_cash_phase_3.sql` agrega:

- `cash_shifts` para apertura/cierre de caja.
- `sales`, `sale_lines` y `sale_payments` para tickets y pagos mixtos.
- `sale_returns` y `sale_return_lines` para devoluciones.
- `cash_shift_movements` para entradas y salidas de efectivo.
- Enums de estado y métodos de pago.
- Índices por caja, cajero, fecha, venta y producto.
- Funciones RPC: `open_cash_shift`, `create_pos_sale`, `void_pos_sale`, `return_pos_sale`, `record_cash_shift_movement`, `close_cash_shift`.
- RLS de lectura por cajero, empresa visible o super admin.

## APIs afectadas

- `/pos` punto de venta.
- `/pos/caja` apertura, movimientos y cierre.
- `/pos/historial` ventas y cortes.
- `/pos/ventas/[id]` ticket.
- `/pos/cortes/[id]/reporte.pdf` reporte PDF de corte.

## Seguridad afectada

- Ventas bloqueadas sin caja abierta.
- Descuentos validados por permiso `pos.discount` en RPC.
- Cancelaciones requieren `pos.void`.
- Devoluciones requieren `pos.return`.
- Entradas/salidas de efectivo requieren `cash.move`.
- Cierre requiere `cash.close`.
- El descuento de inventario se ejecuta con locks `for update` sobre balances.
- Todas las acciones registran auditoría en `audit_log`.

## Riesgos

| Riesgo                       | Mitigación                                                               |
| ---------------------------- | ------------------------------------------------------------------------ |
| Venta sin caja abierta       | `create_pos_sale` exige `get_active_cash_shift`.                         |
| Stock negativo               | Balance bloqueado y validación de existencia antes de descontar.         |
| Pagos inconsistentes         | La suma de pagos debe igualar el total de venta.                         |
| Cancelación sin autorización | RPC valida permiso `pos.void`.                                           |
| Devolución sin autorización  | RPC valida permiso `pos.return`.                                         |
| Corte incorrecto             | `close_cash_shift` calcula diferencia desde efectivo esperado y contado. |

## Checklist de prueba

1. Aplicar migración de Fase 3.
2. Asignar permisos `pos.sell`, `cash.open_shift`, `cash.close` y los necesarios por rol.
3. Abrir `/pos` sin caja abierta y confirmar bloqueo de venta.
4. Abrir caja en `/pos/caja` con fondo inicial.
5. Buscar productos por nombre, SKU o código de barras.
6. Agregar productos al carrito y editar cantidades.
7. Intentar cobrar sin pagos completos y confirmar bloqueo del botón.
8. Cobrar en efectivo.
9. Cobrar con tarjeta.
10. Cobrar con transferencia.
11. Cobrar con pago mixto.
12. Confirmar ticket en `/pos/ventas/[id]`.
13. Confirmar descuento automático de inventario.
14. Registrar entrada de efectivo.
15. Registrar salida de efectivo.
16. Cancelar una venta con usuario autorizado.
17. Procesar devolución con usuario autorizado.
18. Cerrar caja con efectivo contado.
19. Validar diferencia de caja.
20. Descargar reporte PDF de corte.
21. Revisar historial en `/pos/historial`.
22. Ejecutar `npm run typecheck`.
23. Ejecutar `npm run test`.
24. Ejecutar `npm run lint`.
25. Ejecutar `npm run format:check`.
26. Ejecutar `npm audit --audit-level=moderate`.
27. Ejecutar `npm run build`.
