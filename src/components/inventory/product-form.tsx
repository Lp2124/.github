"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryActionState } from "@/features/inventory/actions/inventory-actions";
import {
  createProductAction,
  updateProductAction
} from "@/features/inventory/actions/inventory-actions";
import type {
  CategoryOption,
  ProductDetail,
  SelectOption,
  CompanyOption
} from "@/features/inventory/services/inventory-service";

type ProductFormProps = {
  mode: "create" | "edit";
  product?: ProductDetail;
  companies: CompanyOption[];
  categories: CategoryOption[];
  brands: SelectOption[];
  suppliers: SelectOption[];
};

const initialState: InventoryActionState = { status: "idle", message: "" };

export function ProductForm({
  mode,
  product,
  companies,
  categories,
  brands,
  suppliers
}: ProductFormProps) {
  const updateAction = updateProductAction.bind(null, product?.id ?? "");
  const [state, formAction, isPending] = useActionState(
    mode === "create" ? createProductAction : updateAction,
    initialState
  );

  const selectedCompanyId = product?.companyId ?? companies[0]?.id ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Crear producto" : "Editar producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <ActionMessage state={state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyId">Empresa</Label>
            <select
              id="companyId"
              name="companyId"
              required
              defaultValue={selectedCompanyId}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU único</Label>
            <Input id="sku" name="sku" required defaultValue={product?.sku ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required defaultValue={product?.name ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoría</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandId">Marca</Label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={product?.brandId ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierId">Proveedor</Label>
            <select
              id="supplierId"
              name="supplierId"
              defaultValue={product?.supplierId ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sin proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Código de barras</Label>
            <Input id="barcode" name="barcode" defaultValue={product?.barcode ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitOfMeasure">Unidad de medida</Label>
            <Input
              id="unitOfMeasure"
              name="unitOfMeasure"
              required
              defaultValue={product?.unitOfMeasure ?? "pieza"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Costo</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={product?.costPrice ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salePrice">Precio de venta</Label>
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={product?.salePrice ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de imagen HTTPS</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={product?.imageUrl ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageAltText">Texto alternativo de imagen</Label>
            <Input
              id="imageAltText"
              name="imageAltText"
              defaultValue={product?.imageAltText ?? product?.name ?? ""}
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="trackInventory"
              name="trackInventory"
              type="checkbox"
              defaultChecked={product?.trackInventory ?? true}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="trackInventory">Controlar inventario de este producto</Label>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending || companies.length === 0}>
              {isPending ? "Guardando..." : "Guardar producto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
