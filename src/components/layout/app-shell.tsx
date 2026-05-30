import Link from "next/link";
import { Boxes, LayoutDashboard, Receipt, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  userEmail
}: Readonly<{ children: React.ReactNode; userEmail: string }>) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Ferretería De La O</p>
              <p className="text-xs text-muted-foreground">Fundación operativa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-muted-foreground sm:block">{userEmail}</p>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-2 rounded-xl border bg-background p-3 text-sm">
          <Link
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent"
            href="/dashboard"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
          <Link
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent"
            href="/inventario"
          >
            <Boxes className="h-4 w-4" aria-hidden="true" />
            Inventario
          </Link>
          <Link
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent"
            href="/pos"
          >
            <Receipt className="h-4 w-4" aria-hidden="true" />
            POS
          </Link>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
