# 13 — Datos, Auth y RLS

## Modelo presente

Supabase/PostgreSQL ecommerce con tiendas, roles, settings, catálogo, clientes, órdenes/items, inventario, gastos, pagos, cupones, logs y suscripciones. Hay UUID/FK/checks, seis índices explícitos, funciones `current_user_is_super_admin`, `user_has_store_access`, `get_store_by_slug`, RLS en 15 tablas y políticas de storage privado.

## Hallazgos

- **CRITICAL conflicto de dominio:** todos los datos son tienda/POS; no hay scans, detecciones, evidencias CamGuard, dispositivos, sesiones de sensor ni reportes.
- **HIGH autorización:** políticas genéricas `for all` usan solo acceso a tienda, sin distinguir capacidades de owner/employee/customer; potencial escalada horizontal funcional.
- **HIGH no verificable:** no hay proyecto Supabase local/config, seed ni test SQL/RLS; migraciones no fueron aplicadas en PostgreSQL.
- **MEDIUM evolución conflictiva:** phase1 crea `store_users`, categorías/productos; phase2 crea `user_store_roles` y usa `create table if not exists`, dejando legado y sin migración explícita de membresías/esquema.
- **MEDIUM auditoría:** tabla `activity_logs` existe, pero no se observaron triggers que garanticen registrar acciones críticas.
- **MEDIUM:** no hay flujo completo de alta/baja/exportación de usuario ni eliminación de datos.

Auth solo está integrado en la autorización de una ruta de pagos. No hay UI de login, gestión de sesión, organización o licencias CamGuard.
