import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-800">Ferretería De La O</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Acceso administrativo</h1>
          <p className="mt-2 text-sm text-slate-600">Autenticación SSR con Supabase y sesión segura por cookies.</p>
        </div>
        {params.error === 'no-store' ? (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tu usuario no tiene una tienda activa asignada. Contacta a un administrador.
          </p>
        ) : null}
        <Suspense fallback={<div className="rounded-2xl border bg-white p-6">Cargando formulario…</div>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
