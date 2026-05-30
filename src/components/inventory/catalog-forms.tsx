"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryActionState } from "@/features/inventory/actions/inventory-actions";
import {
  createBrandAction,
  createCategoryAction,
  createSupplierAction
} from "@/features/inventory/actions/inventory-actions";
import type {
  CategoryOption,
  CompanyOption
} from "@/features/inventory/services/inventory-service";

const initialState: InventoryActionState = { status: "idle", message: "" };

function CompanySelect({ companies }: { companies: CompanyOption[] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="companyId">Empresa</Label>
      <select
        id="companyId"
        name="companyId"
        required
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CatalogForms({
  companies,
  categories
}: {
  companies: CompanyOption[];
  categories: CategoryOption[];
}) {
  const [categoryState, categoryAction, categoryPending] = useActionState(
    createCategoryAction,
    initialState
  );
  const [brandState, brandAction, brandPending] = useActionState(createBrandAction, initialState);
  const [supplierState, supplierAction, supplierPending] = useActionState(
    createSupplierAction,
    initialState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Categoría o subcategoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={categoryAction} className="space-y-4">
            <ActionMessage state={categoryState} />
            <CompanySelect companies={companies} />
            <div className="space-y-2">
              <Label htmlFor="parentId">Categoría padre</Label>
              <select
                id="parentId"
                name="parentId"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Categoría principal</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre</Label>
              <Input id="categoryName" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categorySlug">Slug</Label>
              <Input id="categorySlug" name="slug" required />
            </div>
            <Button type="submit" disabled={categoryPending || companies.length === 0}>
              {categoryPending ? "Guardando..." : "Crear categoría"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={brandAction} className="space-y-4">
            <ActionMessage state={brandState} />
            <CompanySelect companies={companies} />
            <div className="space-y-2">
              <Label htmlFor="brandName">Nombre</Label>
              <Input id="brandName" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandSlug">Slug</Label>
              <Input id="brandSlug" name="slug" required />
            </div>
            <Button type="submit" disabled={brandPending || companies.length === 0}>
              {brandPending ? "Guardando..." : "Crear marca"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={supplierAction} className="space-y-4">
            <ActionMessage state={supplierState} />
            <CompanySelect companies={companies} />
            <div className="space-y-2">
              <Label htmlFor="supplierName">Nombre</Label>
              <Input id="supplierName" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">RFC</Label>
              <Input id="taxId" name="taxId" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contacto</Label>
              <Input id="contactName" name="contactName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" />
            </div>
            <Button type="submit" disabled={supplierPending || companies.length === 0}>
              {supplierPending ? "Guardando..." : "Crear proveedor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
