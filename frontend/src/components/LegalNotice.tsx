interface LegalNoticeProps {
  compact?: boolean
}

export function LegalNotice({ compact = false }: LegalNoticeProps) {
  return (
    <div className={compact ? 'rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100' : 'rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100'}>
      <strong>Saldo virtual sin valor real.</strong>{' '}
      Private Vegas Club opera exclusivamente con saldo virtual/play money sin valor real. No existen depósitos, retiros, premios reales, conversión a efectivo ni pasarela de pago.
    </div>
  )
}
