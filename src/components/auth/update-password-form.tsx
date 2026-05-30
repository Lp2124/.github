"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/features/auth/actions/auth-actions";
import { updatePasswordAction } from "@/features/auth/actions/auth-actions";

export function UpdatePasswordForm() {
  const initialState: AuthActionState = { status: "idle", message: "" };

  const [state, formAction, isPending] = useActionState(updatePasswordAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Actualizar contraseña</CardTitle>
        <CardDescription>Define una contraseña robusta para proteger tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.status !== "idle" ? (
            <Alert variant={state.status === "success" ? "success" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
          {state.status === "success" ? (
            <Link
              className="block text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              href="/dashboard"
            >
              Ir al dashboard
            </Link>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
