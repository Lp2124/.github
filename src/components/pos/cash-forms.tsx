"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  closeCashShiftAction,
  openCashShiftAction,
  recordCashMovementAction,
  type PosActionState
} from "@/features/pos/actions/pos-actions";
import type { ActiveShift } from "@/features/pos/services/pos-service";

const initialState: PosActionState = { status: "idle", message: "" };

export function OpenShiftForm({ registers }: { registers: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(openCashShiftAction, initialState);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apertura de caja</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionMessage state={state} />
          <div className="space-y-2">
            <Label htmlFor="cashRegisterId">Caja</Label>
            <select
              id="cashRegisterId"
              name="cashRegisterId"
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {registers.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openingFloat">Fondo inicial</Label>
            <Input
              id="openingFloat"
              name="openingFloat"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
          <Button type="submit" disabled={pending || registers.length === 0}>
            {pending ? "Abriendo..." : "Abrir caja"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CashMovementForm({ shift }: { shift: ActiveShift }) {
  const [state, action, pending] = useActionState(recordCashMovementAction, initialState);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrada / salida de efectivo</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionMessage state={state} />
          <input type="hidden" name="cashShiftId" value={shift.id} />
          <select
            name="movementType"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
          <Input name="amount" type="number" min="0.01" step="0.01" required aria-label="Monto" />
          <textarea
            name="reason"
            required
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            aria-label="Motivo"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Registrando..." : "Registrar movimiento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CloseShiftForm({ shift }: { shift: ActiveShift }) {
  const [state, action, pending] = useActionState(closeCashShiftAction, initialState);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cierre de caja</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <ActionMessage state={state} />
          <input type="hidden" name="cashShiftId" value={shift.id} />
          <p className="text-sm text-muted-foreground">
            Efectivo esperado: ${shift.expectedCash.toFixed(2)}
          </p>
          <Input
            name="countedCash"
            type="number"
            min="0"
            step="0.01"
            required
            aria-label="Efectivo contado"
          />
          <textarea
            name="closingNotes"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            aria-label="Notas de cierre"
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
