export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">{slug}</h1>
      <p>TODO REAL: conectar catálogo, branding y checkout WhatsApp con Supabase.</p>
    </main>
  );
}
