# Documento técnico de arquitectura: Ferretería De La O

## 0. Propósito y alcance

Ferretería De La O será una plataforma empresarial omnicanal para operar una ferretería real con venta en sucursal, punto de venta, inventario multi-almacén, compras, proveedores, facturación CFDI, e-commerce, aplicación móvil, reportes operativos y capacidades de crecimiento hacia ERP completo. La plataforma se inspira funcionalmente en retailers de mejora del hogar, pero debe mantener identidad, procesos, datos, UX y código propios.

Este documento define el blueprint técnico para iniciar desarrollo sin escribir código de aplicación. Su alcance cubre arquitectura, monorepo, módulos, carpetas, modelo de datos, relaciones, seguridad, autenticación, inventario, POS, corte de caja, CFDI, e-commerce, móvil, despliegue, backups, escalabilidad, riesgos y roadmap.

## 1. Principios rectores de arquitectura

1. **Dominio primero:** el sistema se organiza por capacidades de negocio, no por capas técnicas aisladas.
2. **Modular monolith evolutivo:** iniciar con un backend modular estrictamente separado por dominios; extraer microservicios solo cuando existan señales reales de escala, equipo o aislamiento operativo.
3. **Consistencia transaccional donde importa:** ventas, pagos, inventario, corte de caja y facturación requieren límites transaccionales claros.
4. **Event-driven interno:** publicar eventos de dominio para auditoría, inventario, notificaciones, reportes y e-commerce sin acoplar módulos.
5. **Offline-first para POS crítico:** el POS debe seguir vendiendo ante pérdida temporal de internet bajo límites controlados.
6. **Seguridad por diseño:** mínimo privilegio, trazabilidad, cifrado, segregación de funciones, auditoría inmutable y protección contra fraude interno.
7. **Multi-sucursal desde el día uno:** sucursales, almacenes, cajas, usuarios, inventario y reportes deben modelarse con alcance organizacional.
8. **Cumplimiento fiscal desacoplado:** CFDI debe estar aislado tras una capa anticorrupción para cambiar PAC, reglas SAT o catálogos sin contaminar ventas.
9. **Observabilidad obligatoria:** logs estructurados, métricas, trazas, alertas y auditoría operativa.
10. **Escalabilidad pragmática:** optimizar primero por confiabilidad, mantenibilidad y exactitud operativa; escalar horizontalmente después.

## 2. Arquitectura completa del sistema

### 2.1 Vista de alto nivel

La plataforma se divide en los siguientes canales y servicios internos:

| Capa | Responsabilidad |
| --- | --- |
| Aplicación web administrativa | Operación ERP, catálogo, inventario, compras, reportes, usuarios, configuración fiscal. |
| POS web/PWA | Venta en mostrador, caja, pagos, devoluciones, arqueos y operación offline controlada. |
| E-commerce web | Catálogo público, carrito, checkout, pagos, cuentas de cliente, pickup/entrega. |
| App móvil | Consulta de catálogo, pedidos, cliente frecuente, notificaciones, escaneo y operaciones ligeras. |
| API backend modular | Orquestación de dominios, reglas de negocio, seguridad, transacciones y APIs. |
| Motor de eventos | Publicación de eventos de dominio, outbox, jobs y sincronización. |
| Base de datos transaccional | Datos maestros, ventas, inventario, pagos, facturación, auditoría. |
| Cache y sesiones | Cache de catálogo, permisos, rate limits, locks y colas ligeras. |
| Bus/cola de trabajos | Facturación, emails, sincronización e-commerce, reportes, conciliación y tareas largas. |
| Almacenamiento de objetos | XML/PDF CFDI, tickets, imágenes de producto, reportes exportados, respaldos. |
| Integraciones externas | PAC CFDI, pasarela de pago, SMS/email, mensajería, mapas, ERP contable externo si aplica. |

### 2.2 Estilo recomendado

**Fase inicial:** modular monolith con arquitectura hexagonal por dominio.

**Evolución:** separar servicios solo para dominios con carga o riesgo independiente:

1. Facturación CFDI.
2. Catálogo/búsqueda.
3. E-commerce checkout.
4. Reportes/BI.
5. Sincronización POS offline.

### 2.3 Dominios principales

| Dominio | Capacidades |
| --- | --- |
| Identidad y acceso | Usuarios, roles, permisos, sesiones, MFA, auditoría de acceso. |
| Organización | Empresa, sucursales, almacenes, cajas, terminales, configuración. |
| Catálogo | Productos, variantes, categorías, marcas, códigos SAT, códigos de barras, imágenes. |
| Precios y promociones | Listas de precios, descuentos, promociones, precios por sucursal, impuestos. |
| Inventario | Existencias, movimientos, transferencias, conteos, apartados, ajustes, lotes opcionales. |
| Compras | Proveedores, órdenes de compra, recepciones, costos, cuentas por pagar base. |
| POS | Tickets, ventas, pagos, cancelaciones, devoluciones, descuentos autorizados. |
| Caja | Sesiones de caja, fondos iniciales, ingresos/retiros, arqueo, corte, diferencias. |
| Clientes | Clientes fiscales, clientes e-commerce, direcciones, crédito futuro, historial. |
| CFDI | Timbrado, cancelación, notas de crédito, factura global, XML/PDF, catálogos SAT. |
| E-commerce | Catálogo online, carrito, pedidos, pagos online, envíos, pickup, estado de pedido. |
| Notificaciones | Email, SMS, WhatsApp opcional, push móvil, plantillas. |
| Reportes | Ventas, márgenes, inventario, compras, cortes, auditoría, fiscal. |
| Auditoría | Bitácora inmutable de operaciones críticas y eventos de seguridad. |

### 2.4 Comunicación interna

1. **HTTP/JSON interno** para comandos síncronos desde canales a API.
2. **Eventos de dominio** para efectos secundarios: `sale.completed`, `inventory.reserved`, `cash.shift.closed`, `cfdi.stamped`, `order.paid`.
3. **Outbox transaccional** para garantizar que un cambio en base de datos y su evento se publiquen de manera confiable.
4. **Jobs idempotentes** para procesos largos o reintentables: timbrado, generación PDF, emails, sincronización, conciliación.
5. **Webhooks entrantes** para pasarelas de pago y PAC, siempre validados con firma y replay protection.

## 3. Monorepo recomendado

### 3.1 Stack base recomendado

| Área | Tecnología recomendada | Motivo |
| --- | --- | --- |
| Lenguaje | TypeScript estricto | Tipado compartido entre web, API, POS y móvil. |
| Monorepo | pnpm workspaces + Turborepo o Nx | Builds incrementales, dependencias centralizadas, límites entre paquetes. |
| Backend | Node.js con framework modular empresarial | Alto ecosistema, productividad y tipado. |
| Base de datos | PostgreSQL | Integridad transaccional, índices avanzados, JSONB controlado, particiones. |
| ORM/migraciones | ORM tipado con migraciones explícitas | Consistencia de schema y evolución controlada. |
| Cache/locks | Redis | Sesiones, rate limiting, cache, locks distribuidos. |
| Cola | PostgreSQL queue inicial o broker dedicado | Jobs confiables; evolucionar a RabbitMQ/Kafka según escala. |
| Web admin/e-commerce | React/Next.js | SSR/SEO para e-commerce y panel administrativo robusto. |
| POS | PWA instalada | Offline controlado, periféricos vía navegador/servicios locales. |
| Móvil | React Native/Expo empresarial o nativo | Reutilización TypeScript y rapidez de entrega. |
| Observabilidad | OpenTelemetry + logs JSON + métricas | Diagnóstico extremo a extremo. |
| Infra | Contenedores + IaC | Reproducibilidad y despliegues controlados. |

### 3.2 Estrategia de paquetes

El monorepo debe imponer límites:

1. `apps/*` consume casos de uso vía API o SDKs.
2. `services/api` contiene módulos de dominio y adaptadores.
3. `packages/domain-*` contiene tipos, políticas y contratos compartidos cuando sea seguro compartirlos.
4. `packages/ui-*` no conoce reglas de negocio críticas.
5. `packages/config-*` centraliza configuración validada.
6. Ningún paquete de UI accede directo a base de datos.
7. Ningún módulo puede importar otro módulo saltándose sus puertos públicos.

## 4. Estructura exacta de carpetas propuesta

```text
ferreteria-de-la-o/
├── apps/
│   ├── admin-web/
│   ├── ecommerce-web/
│   ├── pos-pwa/
│   └── mobile-app/
├── services/
│   ├── api/
│   │   ├── src/
│   │   │   ├── bootstrap/
│   │   │   ├── config/
│   │   │   ├── modules/
│   │   │   │   ├── identity/
│   │   │   │   ├── organization/
│   │   │   │   ├── catalog/
│   │   │   │   ├── pricing/
│   │   │   │   ├── inventory/
│   │   │   │   ├── purchasing/
│   │   │   │   ├── pos/
│   │   │   │   ├── cash-management/
│   │   │   │   ├── customers/
│   │   │   │   ├── cfdi/
│   │   │   │   ├── ecommerce/
│   │   │   │   ├── payments/
│   │   │   │   ├── notifications/
│   │   │   │   ├── reports/
│   │   │   │   └── audit/
│   │   │   ├── shared/
│   │   │   │   ├── application/
│   │   │   │   ├── domain/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── security/
│   │   │   └── main/
│   │   ├── migrations/
│   │   └── tests/
│   ├── worker/
│   └── sync-gateway/
├── packages/
│   ├── api-contracts/
│   ├── domain-events/
│   ├── validation-schemas/
│   ├── auth-client/
│   ├── ui-admin/
│   ├── ui-storefront/
│   ├── ui-pos/
│   ├── eslint-config/
│   ├── tsconfig/
│   ├── test-utils/
│   └── observability/
├── database/
│   ├── schema/
│   ├── seeds/
│   ├── fixtures/
│   └── backups/
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   ├── monitoring/
│   └── runbooks/
├── docs/
│   ├── architecture/
│   ├── security/
│   ├── database/
│   ├── operations/
│   ├── compliance/
│   └── adr/
├── scripts/
├── .github/
│   └── workflows/
└── tooling/
```

## 5. Diseño de base de datos

### 5.1 Convenciones

1. Todas las tablas transaccionales usan `id` UUID o ULID, `created_at`, `updated_at` y, donde aplique, `deleted_at`.
2. Entidades críticas incluyen `created_by_user_id`, `updated_by_user_id` y campos de auditoría.
3. Dinero se almacena en enteros menores o `numeric(18,6)` según cálculo fiscal; nunca en flotante.
4. Existencias usan cantidades decimales controladas por unidad de medida.
5. Toda referencia crítica usa foreign keys.
6. Movimientos de inventario y caja son apéndice contable: no se actualizan destructivamente.
7. Tablas de alto volumen se particionan por fecha y/o sucursal cuando crezcan.
8. Catálogos SAT se versionan y no se sobrescriben sin trazabilidad.

### 5.2 Tablas principales por dominio

#### Organización

| Tabla | Propósito |
| --- | --- |
| `companies` | Datos legales, fiscales y operativos de la empresa. |
| `branches` | Sucursales físicas y canales operativos. |
| `warehouses` | Almacenes por sucursal o centro de distribución. |
| `cash_registers` | Cajas físicas o virtuales por sucursal. |
| `terminals` | Dispositivos POS autorizados. |
| `business_settings` | Configuraciones versionadas por empresa/sucursal. |

#### Identidad y acceso

| Tabla | Propósito |
| --- | --- |
| `users` | Usuarios internos. |
| `user_profiles` | Datos personales no sensibles para operación. |
| `roles` | Roles asignables por alcance. |
| `permissions` | Permisos atómicos. |
| `role_permissions` | Relación rol-permiso. |
| `user_roles` | Usuario-rol con alcance empresa/sucursal/almacén. |
| `sessions` | Sesiones activas y revocables. |
| `mfa_factors` | Factores MFA registrados. |
| `password_credentials` | Hashes y metadatos de contraseña. |
| `login_attempts` | Intentos de acceso y señales de riesgo. |

#### Catálogo

| Tabla | Propósito |
| --- | --- |
| `products` | Producto maestro. |
| `product_variants` | Variantes por presentación, medida o empaque. |
| `categories` | Árbol jerárquico. |
| `brands` | Marcas. |
| `units_of_measure` | Unidades base y equivalencias. |
| `product_barcodes` | Códigos de barras múltiples. |
| `product_images` | Imágenes y orden visual. |
| `product_attributes` | Atributos definibles. |
| `product_attribute_values` | Valores por producto/variante. |
| `sat_product_service_codes` | Catálogo SAT de productos/servicios. |
| `sat_unit_codes` | Catálogo SAT de unidades. |

#### Precios e impuestos

| Tabla | Propósito |
| --- | --- |
| `price_lists` | Listas de precio por canal o cliente. |
| `price_list_items` | Precio por variante. |
| `tax_categories` | Clasificación fiscal. |
| `tax_rates` | Tasas vigentes por impuesto. |
| `promotions` | Reglas promocionales. |
| `promotion_conditions` | Condiciones de aplicación. |
| `promotion_rewards` | Beneficios o descuentos. |

#### Inventario

| Tabla | Propósito |
| --- | --- |
| `inventory_balances` | Existencia actual por variante y almacén. |
| `inventory_movements` | Kardex inmutable. |
| `inventory_reservations` | Apartados para ventas, e-commerce y transferencias. |
| `stock_transfers` | Transferencias entre almacenes. |
| `stock_transfer_lines` | Detalle de transferencia. |
| `stock_counts` | Conteos físicos. |
| `stock_count_lines` | Detalle contado vs sistema. |
| `inventory_adjustments` | Ajustes autorizados. |
| `inventory_adjustment_lines` | Detalle del ajuste. |
| `reorder_rules` | Mínimos, máximos y punto de reorden. |

#### Compras

| Tabla | Propósito |
| --- | --- |
| `suppliers` | Proveedores. |
| `supplier_contacts` | Contactos. |
| `purchase_orders` | Órdenes de compra. |
| `purchase_order_lines` | Detalle solicitado. |
| `goods_receipts` | Recepciones. |
| `goods_receipt_lines` | Detalle recibido. |
| `supplier_invoices` | Facturas de proveedor. |
| `supplier_payments` | Pagos a proveedor. |

#### POS, ventas y pagos

| Tabla | Propósito |
| --- | --- |
| `sales` | Venta consolidada. |
| `sale_lines` | Partidas de venta. |
| `sale_discounts` | Descuentos aplicados. |
| `sale_payments` | Pagos asociados. |
| `payment_methods` | Métodos de pago. |
| `payment_transactions` | Transacciones con terminal bancaria o pasarela. |
| `sale_returns` | Devoluciones. |
| `sale_return_lines` | Detalle devuelto. |
| `voided_sales` | Cancelaciones internas con motivo y autorización. |
| `pos_offline_batches` | Lotes sincronizados desde POS offline. |

#### Caja

| Tabla | Propósito |
| --- | --- |
| `cash_shifts` | Sesiones de caja por cajero/caja. |
| `cash_shift_movements` | Entradas, salidas, retiros, fondos y gastos. |
| `cash_counts` | Arqueos por denominación. |
| `cash_count_lines` | Denominaciones contadas. |
| `cash_closures` | Corte final. |
| `cash_closure_differences` | Diferencias justificadas y aprobadas. |

#### Clientes y e-commerce

| Tabla | Propósito |
| --- | --- |
| `customers` | Cliente único. |
| `customer_tax_profiles` | Datos fiscales por cliente. |
| `customer_addresses` | Direcciones. |
| `customer_accounts` | Acceso digital del cliente. |
| `carts` | Carritos activos. |
| `cart_lines` | Detalle de carrito. |
| `orders` | Pedidos e-commerce. |
| `order_lines` | Detalle de pedido. |
| `order_fulfillments` | Envío, pickup o entrega parcial. |
| `shipments` | Guías y transportistas. |
| `pickup_reservations` | Apartado para recoger en sucursal. |

#### CFDI

| Tabla | Propósito |
| --- | --- |
| `cfdi_issuers` | Configuración fiscal del emisor. |
| `cfdi_certificates` | Certificados CSD cifrados y metadatos. |
| `cfdi_documents` | CFDI emitidos. |
| `cfdi_document_lines` | Conceptos fiscales. |
| `cfdi_related_documents` | Relaciones entre CFDI. |
| `cfdi_stamping_attempts` | Intentos de timbrado. |
| `cfdi_cancellations` | Solicitudes y estatus de cancelación. |
| `cfdi_global_invoices` | Factura global de tickets. |
| `cfdi_catalog_versions` | Versiones de catálogos SAT importadas. |

#### Auditoría y eventos

| Tabla | Propósito |
| --- | --- |
| `audit_log` | Bitácora inmutable de acciones críticas. |
| `security_events` | Eventos de seguridad. |
| `domain_events` | Eventos persistidos. |
| `outbox_messages` | Eventos pendientes de publicación. |
| `idempotency_keys` | Protección contra duplicados. |
| `webhook_events` | Webhooks recibidos y procesados. |

### 5.3 Relaciones principales

1. `companies` 1:N `branches`.
2. `branches` 1:N `warehouses`.
3. `branches` 1:N `cash_registers`.
4. `cash_registers` 1:N `cash_shifts`.
5. `users` N:M `roles` mediante `user_roles` con alcance.
6. `roles` N:M `permissions` mediante `role_permissions`.
7. `products` 1:N `product_variants`.
8. `categories` 1:N `products` y auto-relación para jerarquía.
9. `product_variants` 1:N `product_barcodes`.
10. `product_variants` N:M `warehouses` mediante `inventory_balances`.
11. `inventory_movements` referencia `product_variant_id`, `warehouse_id` y documento origen.
12. `sales` 1:N `sale_lines`.
13. `sales` 1:N `sale_payments`.
14. `sales` N:1 `customers`, opcional para venta mostrador genérica.
15. `sales` N:1 `cash_shifts` cuando la venta se realiza en POS.
16. `sale_lines` genera `inventory_movements` al confirmar venta.
17. `orders` 1:N `order_lines` y 1:N `order_fulfillments`.
18. `orders` puede convertirse o relacionarse con `sales` al facturar/cobrar/despachar.
19. `cfdi_documents` referencia `sales`, `orders` o factura global.
20. `cfdi_global_invoices` agrupa múltiples `sales` elegibles.
21. `purchase_orders` 1:N `purchase_order_lines`.
22. `goods_receipts` 1:N `goods_receipt_lines` y genera movimientos de inventario.
23. `stock_transfers` 1:N `stock_transfer_lines` y genera salida/entrada por almacén.
24. `cash_closures` 1:1 `cash_shifts`.
25. `audit_log` referencia usuario, entidad, acción y metadatos.

### 5.4 Índices mínimos

1. `users.email` único normalizado.
2. `branches.company_id`.
3. `warehouses.branch_id`.
4. `product_variants.sku` único por empresa.
5. `product_barcodes.barcode` único por empresa.
6. `products.category_id`, `products.brand_id`.
7. Índice full-text para búsqueda de productos por nombre, SKU, marca y códigos.
8. `inventory_balances(warehouse_id, product_variant_id)` único.
9. `inventory_movements(warehouse_id, product_variant_id, occurred_at)`.
10. `inventory_reservations(status, expires_at)`.
11. `sales(branch_id, sold_at)`.
12. `sales(status, channel)`.
13. `sale_payments(sale_id)`.
14. `cash_shifts(cash_register_id, status)`.
15. `orders(customer_id, created_at)`.
16. `orders(status, fulfillment_status)`.
17. `cfdi_documents(uuid)` único cuando exista timbre.
18. `cfdi_documents(status, issued_at)`.
19. `audit_log(actor_user_id, occurred_at)`.
20. `outbox_messages(status, available_at)`.

## 6. Roles y permisos

### 6.1 Roles base

| Rol | Alcance | Responsabilidad |
| --- | --- | --- |
| Super Administrador | Empresa | Configuración total, usuarios críticos, seguridad. |
| Director General | Empresa | Reportes ejecutivos, márgenes, autorización estratégica. |
| Gerente de Sucursal | Sucursal | Operación, inventario local, cortes, autorizaciones. |
| Jefe de Inventario | Sucursal/almacén | Ajustes, conteos, transferencias, recepciones. |
| Compras | Empresa/sucursal | Proveedores, órdenes, recepciones, costos. |
| Cajero | Caja/sucursal | Ventas POS, cobros, devoluciones limitadas, corte propio. |
| Vendedor | Sucursal | Cotizaciones, ventas asistidas, consulta de inventario. |
| Facturación | Empresa/sucursal | Emisión, cancelación, factura global, notas de crédito. |
| E-commerce Manager | Canal online | Pedidos, catálogo online, promociones, fulfillment. |
| Soporte | Empresa | Diagnóstico limitado, sin ver secretos ni datos fiscales completos. |
| Auditor | Empresa | Lectura de reportes, bitácoras y evidencia; sin modificación. |
| Cliente | Cuenta digital | Pedidos propios, facturación propia, direcciones. |

### 6.2 Permisos atómicos recomendados

1. `users.read`, `users.create`, `users.update`, `users.disable`.
2. `roles.assign`, `roles.manage`.
3. `catalog.read`, `catalog.create`, `catalog.update`, `catalog.delete`.
4. `pricing.read`, `pricing.update`, `promotions.manage`.
5. `inventory.read`, `inventory.adjust`, `inventory.transfer`, `inventory.count`, `inventory.receive`.
6. `purchasing.read`, `purchasing.create`, `purchasing.approve`, `purchasing.receive`.
7. `pos.sell`, `pos.discount`, `pos.void`, `pos.return`, `pos.offline_sync`.
8. `cash.open_shift`, `cash.move`, `cash.count`, `cash.close`, `cash.approve_difference`.
9. `cfdi.issue`, `cfdi.cancel`, `cfdi.global_invoice`, `cfdi.download`.
10. `orders.read`, `orders.update`, `orders.fulfill`, `orders.refund`.
11. `reports.sales`, `reports.inventory`, `reports.cash`, `reports.fiscal`, `reports.audit`.
12. `settings.manage`, `security.manage`, `audit.read`.

### 6.3 Segregación de funciones

1. Un cajero no debe aprobar sus propias devoluciones superiores al umbral.
2. Un usuario que ajusta inventario no debe aprobar ajustes de alto valor sin segundo factor.
3. Un operador de facturación no debe modificar datos fiscales de emisor sin rol administrativo.
4. Soporte no debe ver certificados CSD, contraseñas, tokens ni datos sensibles completos.
5. Corte de caja con diferencia requiere autorización de gerente y evidencia.

## 7. Arquitectura de seguridad

### 7.1 Controles principales

1. Autenticación fuerte con MFA para roles administrativos y operaciones críticas.
2. Autorización RBAC con alcance por empresa, sucursal, almacén y caja.
3. Validación de entrada en borde y dominio.
4. Sanitización de salidas visibles en web y tickets.
5. Protección XSS mediante escaping, CSP y restricción de HTML dinámico.
6. Protección CSRF para sesiones web con cookies.
7. Protección SQL Injection mediante consultas parametrizadas/ORM seguro.
8. Rate limiting por IP, usuario, ruta y riesgo.
9. Hash de contraseñas con algoritmo moderno resistente a GPU.
10. Cifrado en tránsito con TLS obligatorio.
11. Cifrado en reposo para secretos, certificados, tokens y respaldos.
12. Gestión de secretos fuera del repositorio.
13. Auditoría inmutable para cambios críticos.
14. Alertas por patrones de fraude: descuentos excesivos, devoluciones repetidas, cortes con diferencias, intentos fallidos.
15. Hardening de headers HTTP.
16. Política de CORS por origen explícito.
17. Dependencias auditadas y actualizadas.
18. Principio de mínimo privilegio en base de datos e infraestructura.

### 7.2 Datos sensibles

| Dato | Control |
| --- | --- |
| Contraseñas | Hash irreversible, pepper opcional en gestor de secretos. |
| Certificados CSD | Cifrado envelope, acceso solo por servicio CFDI. |
| Tokens de pago | No almacenar PAN; usar tokenización de pasarela. |
| RFC/datos fiscales | Acceso auditado, enmascaramiento parcial en vistas no fiscales. |
| Teléfono/email | Cifrado o controles de acceso según sensibilidad. |
| Backups | Cifrado, retención, restauración probada. |

### 7.3 Auditoría

Cada operación crítica debe registrar:

1. Actor.
2. Rol efectivo.
3. Alcance operativo.
4. Acción.
5. Entidad afectada.
6. Estado previo y posterior cuando aplique.
7. IP, dispositivo y terminal.
8. Correlación de request.
9. Resultado.
10. Motivo y autorización si aplica.

## 8. Arquitectura de autenticación

### 8.1 Usuarios internos

1. Login con email/usuario y contraseña.
2. MFA obligatorio para administradores, gerentes, facturación y ajustes críticos.
3. Sesiones web con cookies `HttpOnly`, `Secure`, `SameSite`.
4. Tokens de corta vida para APIs y refresh tokens rotables.
5. Revocación centralizada de sesión.
6. Bloqueo progresivo por intentos fallidos.
7. Detección de dispositivos nuevos.
8. Políticas de contraseña y bloqueo por riesgo.

### 8.2 Clientes e-commerce

1. Cuenta con email/teléfono verificado.
2. Inicio de sesión tradicional y opción passwordless futura.
3. Separación completa entre identidad de cliente e identidad interna.
4. Acceso limitado solo a pedidos, direcciones y facturas propias.

### 8.3 Terminales POS

1. Registro de terminal con autorización administrativa.
2. Identidad de dispositivo independiente del cajero.
3. Vinculación caja-terminal-sucursal.
4. Certificado o secreto rotativo por terminal.
5. Modo offline con token de operación limitado en tiempo, caja y monto.
6. Sincronización firmada para prevenir lotes manipulados.

## 9. Arquitectura de inventario

### 9.1 Modelo operativo

1. Inventario por variante y almacén.
2. Kardex inmutable como fuente de verdad histórica.
3. Balance actual derivado y protegido transaccionalmente.
4. Reservas para POS, e-commerce, apartados, transferencias y pedidos pendientes.
5. Reglas de reorden por sucursal/almacén.
6. Conteos físicos cíclicos y generales.
7. Ajustes con autorización y motivo.
8. Transferencias con estados: borrador, solicitada, enviada, recibida parcial, recibida total, cancelada.

### 9.2 Estados de inventario

| Estado | Significado |
| --- | --- |
| Disponible | Puede venderse o apartarse. |
| Reservado | Separado para orden o venta pendiente. |
| En tránsito | Transferido, aún no recibido. |
| Dañado | No vendible. |
| Cuarentena | Requiere revisión. |
| Merma | Baja por pérdida/daño. |

### 9.3 Flujo de venta

1. POS consulta disponibilidad local.
2. Al agregar partida, crea reserva temporal si la operación lo requiere.
3. Al cobrar, se confirma la venta.
4. Se descuenta inventario mediante movimiento de salida.
5. Se libera cualquier reserva temporal.
6. Se emite evento para reportes, e-commerce y auditoría.

### 9.4 Prevención de inconsistencias

1. Locks por variante-almacén en confirmaciones críticas.
2. Idempotency keys para ventas y sincronización offline.
3. Reconciliación periódica entre `inventory_balances` y `inventory_movements`.
4. Alertas por inventario negativo.
5. Regla explícita: permitir o bloquear venta con inventario negativo por rol/sucursal.

## 10. Arquitectura de POS

### 10.1 Capacidades

1. Búsqueda rápida por SKU, descripción y código de barras.
2. Venta por lector de código de barras.
3. Descuentos con límites por rol.
4. Pagos mixtos.
5. Tickets.
6. Devoluciones con referencia a venta original.
7. Cancelaciones con autorización.
8. Precios por sucursal/lista.
9. Clientes fiscales para facturación posterior.
10. Operación offline limitada.

### 10.2 Offline controlado

El POS debe poder operar sin conexión solo si:

1. La terminal está autorizada.
2. Existe una sesión de caja abierta.
3. El usuario cuenta con token offline vigente.
4. Existe snapshot local de catálogo, precios e inventario aproximado.
5. Se respetan límites de monto, descuentos y número de tickets.
6. Cada ticket offline se firma localmente y se sincroniza después.
7. El backend valida idempotencia, secuencia y consistencia al reconectar.

### 10.3 Periféricos

1. Impresora térmica mediante integración compatible con navegador o servicio local.
2. Lector de código de barras como entrada HID.
3. Cajón de dinero ligado a impresora/terminal.
4. Terminal bancaria integrada por proveedor o conciliada manualmente.
5. Báscula futura para productos a granel si aplica.

## 11. Arquitectura de corte de caja

### 11.1 Flujo de caja

1. Apertura de turno con fondo inicial.
2. Registro de ventas y pagos por método.
3. Movimientos manuales autorizados: entrada, retiro, gasto, cambio de fondo.
4. Arqueos intermedios opcionales.
5. Cierre de turno por cajero.
6. Conteo por denominación.
7. Cálculo esperado por método de pago.
8. Diferencias y justificación.
9. Aprobación de gerente si excede tolerancia.
10. Cierre definitivo inmutable.

### 11.2 Reglas críticas

1. No puede haber dos turnos abiertos en la misma caja si la política lo prohíbe.
2. Una venta POS siempre pertenece a un turno abierto.
3. Una vez cerrado el corte, no se modifican ventas; se crean ajustes/devoluciones posteriores.
4. Diferencias de caja generan evento de auditoría.
5. Retiros de efectivo requieren motivo y autorización según umbral.

## 12. Arquitectura de facturación CFDI

### 12.1 Enfoque fiscal

El sistema debe soportar CFDI 4.0 como versión vigente para factura electrónica en México, considerando que el SAT indica que desde el 1 de abril de 2023 la única versión válida es CFDI 4.0 para facturación electrónica. Esta sección debe validarse nuevamente antes de producción contra documentación vigente del SAT y del PAC seleccionado.

Fuentes oficiales consultadas para este blueprint:

1. SAT, Servicio de facturación CFDI versión 4.0: https://wwwmat.sat.gob.mx/aplicacion/75169/servicio-de-facturacion-cfdi-version-4.0-%28vigente-a-partir-del-1-de-enero-de-2022%29
2. SAT, portal de factura electrónica: https://wwwmat.sat.gob.mx/empresas/factura-electronica

### 12.2 Capa anticorrupción PAC

El módulo CFDI no debe depender directamente de un PAC específico. Debe existir un puerto común:

1. Timbrar CFDI.
2. Cancelar CFDI.
3. Consultar estatus.
4. Descargar acuse.
5. Validar credenciales.
6. Manejar errores normalizados.

Cada PAC se implementa como adaptador reemplazable.

### 12.3 Flujos CFDI

| Flujo | Descripción |
| --- | --- |
| Factura de venta | CFDI de ingreso asociado a venta o pedido pagado. |
| Factura posterior | Cliente factura ticket elegible dentro de política fiscal. |
| Factura global | Agrupa tickets al público en general según periodicidad aplicable. |
| Nota de crédito | CFDI de egreso por devolución o ajuste fiscal. |
| Cancelación | Solicitud de cancelación con motivo, relación y seguimiento. |
| Reemisión | Nuevo CFDI relacionado cuando corresponda. |

### 12.4 Datos mínimos de receptor

Para CFDI 4.0 se debe capturar y validar, como mínimo operativo:

1. RFC.
2. Nombre, denominación o razón social.
3. Régimen fiscal.
4. Código postal del domicilio fiscal.
5. Uso de CFDI.
6. Método y forma de pago.
7. Régimen y datos fiscales del emisor.

### 12.5 Seguridad CFDI

1. CSD cifrado en reposo.
2. Contraseña de CSD en gestor de secretos o cifrado envelope.
3. Acceso solo por servicio de facturación.
4. Auditoría de timbrado, cancelación y descarga.
5. XML original inmutable.
6. PDFs regenerables, pero versión emitida archivada.
7. Catálogos SAT versionados.
8. Reintentos idempotentes para timbrado.

## 13. Arquitectura de e-commerce

### 13.1 Capacidades

1. Catálogo público con SEO.
2. Búsqueda por texto, categoría, marca, atributos y disponibilidad.
3. Precios por canal online.
4. Inventario visible por sucursal o disponibilidad agregada.
5. Carrito persistente.
6. Checkout con cliente invitado o registrado.
7. Pago online.
8. Pickup en sucursal.
9. Envío a domicilio.
10. Facturación desde pedido.
11. Notificaciones de estado.
12. Devoluciones solicitadas online.

### 13.2 Separación de inventario online

1. Inventario online no debe vender todo el stock físico sin protección.
2. Reservas online deben expirar.
3. Pedido pagado crea reserva firme.
4. Pedido cancelado libera reserva.
5. Fulfillment descuenta o confirma movimiento según flujo operativo.

### 13.3 Checkout

1. Validar precios y promociones en backend.
2. Recalcular impuestos en backend.
3. Crear orden pendiente.
4. Crear intento de pago.
5. Confirmar por webhook firmado de pasarela.
6. Reservar inventario.
7. Emitir notificación.
8. Preparar fulfillment.

## 14. Arquitectura de aplicación móvil

### 14.1 App cliente

1. Catálogo y búsqueda.
2. Escaneo de código de barras para consultar producto.
3. Carrito y pedidos.
4. Seguimiento de pedido.
5. Facturas propias.
6. Notificaciones push.
7. Direcciones y perfil.
8. Promociones y cliente frecuente futuro.

### 14.2 App operativa futura

1. Conteos físicos con escaneo.
2. Recepción de mercancía.
3. Transferencias.
4. Picking de pedidos e-commerce.
5. Consulta rápida de inventario.
6. Evidencias fotográficas para merma o recepción.

### 14.3 Seguridad móvil

1. Tokens de corta vida.
2. Almacenamiento seguro del refresh token.
3. Certificate pinning evaluado para app operativa.
4. Bloqueo por dispositivo comprometido cuando sea viable.
5. No almacenar datos fiscales sensibles sin cifrado.

## 15. Estrategia de despliegue

### 15.1 Ambientes

1. Local.
2. Desarrollo compartido.
3. QA.
4. Staging con datos anonimizados.
5. Producción.
6. DR/recuperación.

### 15.2 Pipeline CI/CD

1. Validación de formato.
2. Lint.
3. Typecheck.
4. Pruebas unitarias.
5. Pruebas de integración.
6. Escaneo de dependencias.
7. Escaneo SAST.
8. Build reproducible.
9. Migraciones verificadas.
10. Deploy progresivo.
11. Smoke tests.
12. Rollback automático o manual documentado.

### 15.3 Infraestructura inicial

1. Contenedores para API, worker, web admin, e-commerce y POS.
2. PostgreSQL administrado.
3. Redis administrado.
4. Object storage compatible S3.
5. CDN para imágenes y e-commerce.
6. WAF delante de aplicaciones públicas.
7. Observabilidad centralizada.
8. VPN o acceso zero-trust para administración interna.

## 16. Estrategia de backups

### 16.1 Objetivos

| Tipo de dato | RPO | RTO |
| --- | --- | --- |
| Base transaccional | 15 minutos o menor | 2 horas inicial, mejorar a 30 minutos. |
| XML/PDF CFDI | 15 minutos | 2 horas. |
| Imágenes de producto | 24 horas | 8 horas. |
| Configuración/secrets | 24 horas y rotación controlada | 4 horas. |
| Logs/auditoría | 15 minutos | 4 horas. |

### 16.2 Política

1. Backups completos diarios.
2. WAL/point-in-time recovery para PostgreSQL.
3. Retención diaria, semanal, mensual y anual según requisitos fiscales/operativos.
4. Cifrado en reposo.
5. Replicación cross-region o al menos cross-zone.
6. Prueba de restauración mensual.
7. Runbook documentado de desastre.
8. Separación de permisos entre operación y eliminación de backups.
9. Protección contra ransomware con retención inmutable cuando sea posible.

## 17. Estrategia de escalabilidad

### 17.1 Escalabilidad técnica

1. API stateless escalable horizontalmente.
2. Workers escalables por tipo de job.
3. Cache para catálogo, permisos y sesiones.
4. Índices y particiones por tablas de alto volumen.
5. Read replicas para reportes.
6. Search engine externo cuando PostgreSQL full-text no sea suficiente.
7. CDN para e-commerce e imágenes.
8. Separación futura de reportes/BI.
9. Event streaming si la cantidad de eventos supera la cola inicial.

### 17.2 Escalabilidad organizacional

1. Límites de módulos en monorepo.
2. Ownership por dominio.
3. ADRs obligatorios para decisiones mayores.
4. Contratos API versionados.
5. Estrategia de migraciones backwards-compatible.
6. Feature flags para despliegues graduales.

### 17.3 Señales para extraer servicios

1. Facturación requiere disponibilidad o despliegue independiente.
2. E-commerce tiene picos de tráfico que afectan POS.
3. Reportes degradan transacciones.
4. Búsqueda requiere motor especializado.
5. Integraciones externas cambian con frecuencia y rompen despliegues del core.

## 18. Riesgos técnicos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Inconsistencia de inventario | Muy alto | Kardex inmutable, locks, reservas, reconciliación, alertas. |
| POS sin internet | Alto | Offline limitado, snapshots, sincronización idempotente. |
| Errores CFDI/PAC | Alto | Capa anticorrupción, reintentos, validaciones, monitoreo. |
| Fraude interno | Alto | RBAC granular, auditoría, segregación, alertas. |
| Corte de caja incorrecto | Alto | Flujos inmutables, arqueo por denominación, autorización. |
| Catálogo duplicado o sucio | Medio | SKUs únicos, códigos de barras únicos, governance de datos. |
| Promociones mal calculadas | Medio | Motor centralizado, pruebas exhaustivas, límites. |
| Deuda por monolito sin límites | Alto | Módulos estrictos, puertos, revisiones de arquitectura. |
| Reportes lentos | Medio | Réplicas, agregados, jobs, BI separado. |
| Dependencia de proveedor de pagos/PAC | Medio | Adaptadores, contratos y contingencia manual. |
| Cambios fiscales | Alto | Catálogos versionados, validación regulatoria, módulo aislado. |
| Seguridad de CSD/secrets | Muy alto | Cifrado, vault, mínimo privilegio, auditoría. |

## 19. Roadmap por fases

### Fase 0: Fundaciones

1. Definición de dominios y ADRs iniciales.
2. Monorepo.
3. CI/CD base.
4. Observabilidad base.
5. Modelo de datos inicial.
6. Autenticación y RBAC.
7. Infraestructura de desarrollo/staging.
8. Estándares de seguridad.

### Fase 1: Catálogo, organización e inventario base

1. Empresa, sucursales, almacenes y cajas.
2. Usuarios, roles y permisos.
3. Productos, variantes, categorías, marcas y códigos de barras.
4. Precios base e impuestos.
5. Inventario por almacén.
6. Movimientos de inventario.
7. Recepciones y ajustes simples.
8. Reportes básicos de inventario.

### Fase 2: POS y caja

1. POS online.
2. Apertura y cierre de caja.
3. Ventas, pagos mixtos y tickets.
4. Descuentos controlados.
5. Devoluciones y cancelaciones.
6. Corte de caja con arqueo.
7. Auditoría operativa.
8. Primer piloto en sucursal.

### Fase 3: CFDI

1. Configuración fiscal de emisor.
2. Clientes fiscales.
3. Integración PAC.
4. Timbrado CFDI ingreso.
5. Descarga XML/PDF.
6. Cancelación.
7. Nota de crédito.
8. Factura global.
9. Reportes fiscales.

### Fase 4: Compras y control avanzado de inventario

1. Proveedores.
2. Órdenes de compra.
3. Recepciones parciales.
4. Costos y márgenes.
5. Transferencias entre almacenes.
6. Conteos físicos.
7. Reglas de reorden.
8. Alertas de stock.

### Fase 5: E-commerce

1. Storefront público.
2. Catálogo online y SEO.
3. Carrito.
4. Checkout.
5. Pagos online.
6. Pickup en sucursal.
7. Envío a domicilio.
8. Facturación de pedidos.
9. Notificaciones.

### Fase 6: App móvil

1. App cliente.
2. Pedidos y seguimiento.
3. Facturas propias.
4. Notificaciones push.
5. Escaneo de productos.
6. App operativa para inventario si el negocio lo requiere.

### Fase 7: Escala empresarial

1. POS offline robusto.
2. BI y data warehouse.
3. Motor avanzado de promociones.
4. CRM y fidelización.
5. Crédito a clientes.
6. Integraciones contables.
7. Multi-región/DR avanzado.
8. Automatización de compras.

## 20. Definición de listo para iniciar desarrollo

Antes de iniciar implementación se debe confirmar:

1. RFC y régimen fiscal del negocio.
2. PAC objetivo y contrato de timbrado.
3. Pasarela de pago objetivo.
4. Políticas de inventario negativo.
5. Políticas de devoluciones y cancelaciones.
6. Umbrales de descuento por rol.
7. Umbrales de diferencia en caja.
8. Sucursales, almacenes y cajas iniciales.
9. Catálogo inicial y estructura de categorías.
10. Reglas de precios e impuestos.
11. Requerimientos de periféricos POS.
12. Estrategia de hosting y presupuesto operativo.
13. Requisitos legales/fiscales revisados por contador o asesor fiscal.

## 21. Criterios de calidad y pruebas para el desarrollo futuro

1. Pruebas unitarias por política de dominio.
2. Pruebas de integración por caso de uso crítico.
3. Pruebas E2E para POS, corte, inventario y e-commerce.
4. Pruebas de seguridad: autenticación, autorización, inyección, XSS, CSRF, rate limit.
5. Pruebas de concurrencia para inventario y caja.
6. Pruebas de idempotencia para pagos, CFDI y offline sync.
7. Pruebas de recuperación de backups.
8. Pruebas de carga para catálogo, ventas y checkout.
9. Pruebas de migraciones con rollback lógico.
10. Revisión de accesibilidad en aplicaciones públicas.

## 22. Resultado arquitectónico final

La recomendación profesional es construir Ferretería De La O como un monorepo TypeScript con backend modular, PostgreSQL transaccional, Redis, workers, outbox/eventos, POS PWA offline controlado, e-commerce separado por canal, app móvil evolutiva y módulo CFDI aislado por adaptadores PAC. Este diseño permite operar una ferretería real desde la primera sucursal y crecer hacia múltiples sucursales, venta online, control fiscal, BI y automatización sin reescribir el núcleo.
