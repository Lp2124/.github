"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateCustomerProfileAction,
  type StoreActionState
} from "@/features/store/actions/store-actions";

const initialState: StoreActionState = { status: "idle", message: "" };

export function CustomerProfileForm({
  fullName,
  phone,
  email
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateCustomerProfileAction, initialState);
  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      <ActionMessage state={state} />
      <div className="space-y-2">
        <Label htmlFor="email">Correo de acceso</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={phone} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando perfil..." : "Guardar perfil"}
      </Button>
    </form>
  );
}
