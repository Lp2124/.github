'use client';

import { useMemo, useState } from 'react';
import {
  formatStripeTestCardNumber,
  STRIPE_TEST_CARD_FIXTURES,
  STRIPE_TESTING_DOCS_URL,
  type StripeTestCardFixture
} from '@/lib/payments/stripe-test-cards';

const OUTCOME_STYLES = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  decline: 'bg-red-50 text-red-800 ring-red-600/20',
  insufficient_funds: 'bg-amber-50 text-amber-900 ring-amber-600/20',
  authentication_required: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20'
} as const;

const OUTCOME_LABELS = {
  success: 'Aprobado',
  decline: 'Rechazado',
  insufficient_funds: 'Fondos insuficientes',
  authentication_required: 'Requiere 3DS'
} as const;

export function StripeTestCardLab() {
  const [selectedId, setSelectedId] = useState(STRIPE_TEST_CARD_FIXTURES[0].id);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const selected = useMemo(
    () => STRIPE_TEST_CARD_FIXTURES.find((fixture) => fixture.id === selectedId) ?? STRIPE_TEST_CARD_FIXTURES[0],
    [selectedId]
  );

  function selectFixture(fixture: StripeTestCardFixture) {
    setSelectedId(fixture.id);
    setCopyState('idle');
  }

  function selectRandomFixture() {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    selectFixture(STRIPE_TEST_CARD_FIXTURES[randomValues[0] % STRIPE_TEST_CARD_FIXTURES.length]);
  }

  async function copySelectedNumber() {
    try {
      await navigator.clipboard.writeText(selected.number);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 p-1 shadow-2xl shadow-indigo-950/20">
      <div className="rounded-[1.35rem] bg-slate-950 px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-300/20">Sandbox only</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-white/10">Fixtures oficiales</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Laboratorio de tarjetas Stripe</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Selecciona escenarios publicados por Stripe. No se generan PAN nuevos y esta pantalla no realiza solicitudes de pago.</p>
          </div>
          <button className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-cyan-300/30" onClick={selectRandomFixture} type="button">
            Escenario aleatorio
          </button>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {STRIPE_TEST_CARD_FIXTURES.map((fixture) => {
            const active = fixture.id === selected.id;
            return (
              <button
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-cyan-300/30 ${active ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'}`}
                key={fixture.id}
                onClick={() => selectFixture(fixture)}
                type="button"
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-bold text-white">{fixture.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{fixture.description}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold ring-1 ring-inset ${OUTCOME_STYLES[fixture.outcome]}`}>{OUTCOME_LABELS[fixture.outcome]}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Número de prueba seleccionado</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all font-mono text-xl font-bold tracking-wider text-cyan-200 sm:text-2xl">{formatStripeTestCardNumber(selected.number)}</code>
            <button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/30" onClick={copySelectedNumber} type="button">
              {copyState === 'copied' ? 'Copiado' : 'Copiar número'}
            </button>
          </div>
          <p aria-live="polite" className={`mt-3 text-xs ${copyState === 'error' ? 'text-red-300' : 'text-slate-400'}`}>
            {copyState === 'error' ? 'El navegador bloqueó el portapapeles. Selecciona y copia el valor manualmente.' : 'Usa cualquier fecha futura y el CVC de prueba indicado por Stripe, exclusivamente con claves test.'}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Prohibido usar datos reales, claves live, automatización de intentos o pruebas de carga contra Stripe.</p>
          <a className="shrink-0 font-bold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200" href={STRIPE_TESTING_DOCS_URL} rel="noreferrer" target="_blank">Ver documentación oficial ↗</a>
        </div>
      </div>
    </section>
  );
}
