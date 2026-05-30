import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getInventoryOptions,
  getLowInventoryAlerts,
  getProducts
} from "@/features/inventory/services/inventory-service";

type InventoryPageProps = {
  searchParams: Promise<{ q?: string; companyId?: string; lowStock?: string }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const [options, products, alerts] = await Promise.all([
    getInventoryOptions(),
    getProducts({
      query: params.q,
      companyId: params.companyId,
      lowStockOnly: params.lowStock === "1"
    }),
    getLowInventoryAlerts()
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Productos, stock por almacén y alertas conectadas a Supabase.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/inventario/productos/nuevo">Nuevo producto</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/inventario/catalogos">Catálogos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/inventario/movimientos">Movimientos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/inventario/export.csv">Exportar CSV</Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
              aria-label="Buscar por SKU o nombre"
            />
            <select
              name="companyId"
              defaultValue={params.companyId ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filtrar por empresa"
            >
              <option value="">Todas las empresas visibles</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <select
              name="lowStock"
              defaultValue={params.lowStock ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filtrar bajo inventario"
            >
              <option value="">Todo el inventario</option>
              <option value="1">Solo bajo inventario</option>
            </select>
            <Button type="submit" variant="secondary">
              Aplicar filtros
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Productos activos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{products.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas de bajo inventario</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{alerts.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Empresas visibles</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{options.companies.length}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4">Código de barras</th>
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2 pr-4">Marca</th>
                <th className="py-2 pr-4">Stock</th>
                <th className="py-2 pr-4">Mínimo</th>
                <th className="py-2 pr-4">Máximo</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="py-3 pr-4 font-medium">{product.sku}</td>
                  <td className="py-3 pr-4">{product.name}</td>
                  <td className="py-3 pr-4">{product.barcode ?? "No registrado"}</td>
                  <td className="py-3 pr-4">{product.categoryName ?? "Sin categoría"}</td>
                  <td className="py-3 pr-4">{product.brandName ?? "Sin marca"}</td>
                  <td className="py-3 pr-4">{product.totalStock}</td>
                  <td className="py-3 pr-4">{product.minStock}</td>
                  <td className="py-3 pr-4">{product.maxStock}</td>
                  <td className="py-3 pr-4">
                    <Link
                      className="text-primary underline-offset-4 hover:underline"
                      href={`/inventario/productos/${product.id}/editar`}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No hay productos visibles para los filtros actuales.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de bajo inventario</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Sucursal</th>
                <th className="py-2 pr-4">Almacén</th>
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4">Stock</th>
                <th className="py-2 pr-4">Mínimo</th>
                <th className="py-2 pr-4">Faltante</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b">
                  <td className="py-3 pr-4">{alert.branchName}</td>
                  <td className="py-3 pr-4">{alert.warehouseName}</td>
                  <td className="py-3 pr-4 font-medium">{alert.sku}</td>
                  <td className="py-3 pr-4">{alert.productName}</td>
                  <td className="py-3 pr-4">{alert.quantity}</td>
                  <td className="py-3 pr-4">{alert.minStock}</td>
                  <td className="py-3 pr-4">{alert.shortageQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {alerts.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No hay alertas de bajo inventario visibles.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
