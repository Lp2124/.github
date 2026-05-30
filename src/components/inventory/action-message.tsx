import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InventoryActionState } from "@/features/inventory/actions/inventory-actions";

export function ActionMessage({ state }: { state: InventoryActionState }) {
  if (state.status === "idle") return null;

  return (
    <Alert variant={state.status === "success" ? "success" : "destructive"}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
