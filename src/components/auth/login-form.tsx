"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/features/auth/actions/auth-actions";
import { signInAction } from "@/features/auth/actions/auth-actions";

export function LoginForm() {
  const initialState: AuthActionState = { status: "idle", message: "" };

  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Accede al panel operativo de Ferretería De La O.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Validando..." : "Entrar"}
          </Button>
          <Link
            className="block text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            href="/forgot-password"
          >
            Recuperar contraseña
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
