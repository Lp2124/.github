import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StoreHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/tienda" className="text-xl font-bold">
          Ferretería De La O
        </Link>
        <form action="/tienda/catalogo" className="flex flex-1 gap-2 md:max-w-xl">
          <Input name="q" aria-label="Buscar productos" />
          <Button type="submit">Buscar</Button>
        </form>
        <nav className="flex gap-3 text-sm">
          <Link href="/tienda/catalogo">Catálogo</Link>
          <Link href="/tienda/carrito">Carrito</Link>
          <Link href="/tienda/cuenta">Mi cuenta</Link>
        </nav>
      </div>
    </header>
  );
}
