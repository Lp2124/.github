'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { createClient } from '@/lib/supabase/server';
import { checkFixedWindowRateLimit } from '@/lib/security/rate-limit';
import { assertSafeRedirect, emailSchema, getClientIp, passwordSchema } from '@/lib/security/validation';

export type AuthActionState = { error?: string };

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  await assertSameOriginRequest();
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const limited = checkFixedWindowRateLimit(`login:${ip}`, 5, 60_000);

  if (!limited.allowed) {
    return { error: 'Demasiados intentos. Espera un minuto antes de volver a intentar.' };
  }

  const email = emailSchema.safeParse(formData.get('email'));
  const password = passwordSchema.safeParse(formData.get('password'));

  if (!email.success || !password.success) {
    return { error: 'Correo o contraseña inválidos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });

  if (error) {
    return { error: 'No fue posible iniciar sesión con esas credenciales.' };
  }

  redirect(assertSafeRedirect(formData.get('redirectTo')));
}

export async function signOutAction() {
  await assertSameOriginRequest();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
