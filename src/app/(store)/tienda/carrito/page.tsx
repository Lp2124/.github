import { CartClient } from "@/components/store/cart-client";
import { getStoreProducts } from "@/features/store/services/store-service";
export default async function CartPage() {
  const products = await getStoreProducts({});
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Carrito</h1>
      <CartClient products={products} />
    </div>
  );
}
