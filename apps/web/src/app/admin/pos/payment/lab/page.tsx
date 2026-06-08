import Link from 'next/link';
import { IinClassifier } from '@/components/payments/IinClassifier';
import { StripeTestCardLab } from '@/components/payments/StripeTestCardLab';

export default function PaymentLabPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#cffafe_0,_transparent_30%),radial-gradient(circle_at_top_right,_#e0e7ff_0,_transparent_32%),linear-gradient(#f8fafc,#eef2ff)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Navegación de pagos" className="mb-8 flex items-center justify-between gap-4">
          <Link className="text-sm font-bold text-slate-700 hover:text-slate-950" href="/admin/pos/payment">← Volver al cobro</Link>
          <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">Sin red · Sin persistencia</span>
        </nav>

        <header className="mb-9 max-w-3xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-indigo-700">Liora Payment QA</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Pruebas de pago seguras, claras y reproducibles.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Herramientas locales para reconocer rangos de red y elegir escenarios oficiales de Stripe sin consultar emisores ni crear números bancarios.</p>
        </header>

        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <IinClassifier />
          <StripeTestCardLab />
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Guardrail title="Datos mínimos" text="El clasificador acepta como máximo ocho dígitos y nunca solicita CVV, vencimiento o nombre." />
          <Guardrail title="Cero consultas" text="No existe endpoint para resolver banco, saldo, titular, estado o validez de una tarjeta." />
          <Guardrail title="Catálogo cerrado" text="El selector usa una lista inmutable de fixtures públicos; no calcula ni genera PAN por Luhn." />
        </section>
      </div>
    </main>
  );
}

function Guardrail({ title, text }: { readonly title: string; readonly text: string }) {
  return <article className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur"><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}
