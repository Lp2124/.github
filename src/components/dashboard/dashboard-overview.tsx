import { Building2, Database, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardOverviewProps = {
  userEmail: string;
  roleNames: string[];
  companyCount: number;
  branchCount: number;
};

export function DashboardOverview({
  userEmail,
  roleNames,
  companyCount,
  branchCount
}: DashboardOverviewProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard base</p>
        <h1 className="text-3xl font-bold tracking-tight">Fundación de producción</h1>
        <p className="max-w-3xl text-muted-foreground">
          Sesión autenticada con Supabase, arquitectura modular, RLS preparado y sistema de roles
          listo para asignaciones operativas.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuario autenticado</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles asignados</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{roleNames.length}</p>
            <p className="text-xs text-muted-foreground">
              {roleNames.length > 0 ? roleNames.join(", ") : "Asignación administrativa requerida"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas registradas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{companyCount}</p>
            <p className="text-xs text-muted-foreground">Visible según políticas RLS.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucursales visibles</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{branchCount}</p>
            <p className="text-xs text-muted-foreground">Base para inventario, POS y caja.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
