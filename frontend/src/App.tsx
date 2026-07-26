import { LegalNotice } from './components/LegalNotice'

function App() {
  return (
    <main className="min-h-screen bg-neutral-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">
          Saldo virtual sin valor real.
        </p>
        <h1 className="text-5xl font-black tracking-tight text-white md:text-7xl">Private Vegas Club</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Casino social privado con saldo virtual sin valor real. No existen depósitos, retiros ni dinero real.
        </p>
        <div className="mt-8 w-full max-w-2xl">
          <LegalNotice />
        </div>
      </section>
    </main>
  )
}

export default App
