'use client';

import { useId, useMemo, useState } from 'react';
import { classifyIin } from '@/lib/payments/iin-classifier';

const BRAND_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover'
} as const;

export function IinClassifier() {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const resultId = `${inputId}-result`;
  const [value, setValue] = useState('');
  const result = useMemo(() => classifyIin(value), [value]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-6 text-white sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Clasificación local</p>
        <h2 className="mt-2 text-2xl font-bold">Identificador IIN/BIN</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Reconoce únicamente la red y el rango público a partir de un prefijo. No consulta bancos, titulares, saldo ni estado de cuentas.
        </p>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor={inputId}>Primeros 6 a 8 dígitos</label>
          <div className="mt-2 flex rounded-2xl border border-slate-300 bg-slate-50 p-1.5 shadow-inner focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-100">
            <span aria-hidden="true" className="flex items-center pl-3 text-slate-400">#</span>
            <input
              aria-describedby={`${helpId} ${resultId}`}
              aria-invalid={result.status === 'invalid'}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-lg tracking-[0.18em] text-slate-950 outline-none"
              id={inputId}
              inputMode="numeric"
              maxLength={8}
              onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="424242"
              spellCheck={false}
              type="text"
              value={value}
            />
            {value ? (
              <button className="rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-900" onClick={() => setValue('')} type="button">
                Limpiar
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500" id={helpId}>El campo está limitado a ocho dígitos para evitar capturar un número completo.</p>
        </div>

        <div aria-live="polite" className="rounded-2xl border border-slate-200 bg-slate-50 p-5" id={resultId}>
          {result.status === 'matched' ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <ResultMetric label="Marca estimada" value={BRAND_LABELS[result.brand]} />
              <ResultMetric label="Rango coincidente" value={result.range} />
              <ResultMetric label="Precisión" value={`${result.matchedPrefixLength} dígitos`} />
            </div>
          ) : null}
          {result.status === 'empty' ? <ResultMessage title="Listo para clasificar" text="Introduce un prefijo IIN/BIN, no una tarjeta completa." /> : null}
          {result.status === 'unknown' ? <ResultMessage title="Rango no reconocido" text="El prefijo no coincide con los rangos de Visa, Mastercard, Amex o Discover incluidos localmente." /> : null}
          {result.status === 'invalid' ? <ResultMessage title="Entrada no válida" text={result.message} tone="danger" /> : null}
        </div>

        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          Un IIN/BIN no demuestra que una tarjeta exista o esté activa. La clasificación puede cambiar y no identifica de forma fiable banco, país, producto o titular.
        </p>
      </div>
    </section>
  );
}

function ResultMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p></div>;
}

function ResultMessage({ title, text, tone = 'neutral' }: { readonly title: string; readonly text: string; readonly tone?: 'neutral' | 'danger' }) {
  return <div><p className={`font-bold ${tone === 'danger' ? 'text-red-800' : 'text-slate-900'}`}>{title}</p><p className={`mt-1 text-sm ${tone === 'danger' ? 'text-red-700' : 'text-slate-600'}`}>{text}</p></div>;
}
