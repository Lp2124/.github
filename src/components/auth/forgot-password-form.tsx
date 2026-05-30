"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/features/auth/actions/auth-actions";
import { requestPasswordResetAction } from "@/features/auth/actions/auth-actions";

export function ForgotPasswordForm() {
  const initialState: AuthActionState = { status: "idle", message: "" };

  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Enviaremos instrucciones al correo si existe una cuenta activa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.status !== "idle" ? (
            <Alert variant={state.status === "success" ? "success" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Enviando..." : "Enviar instrucciones"}
          </Button>
          <Link
            className="block text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Volver a iniciar sesión
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
