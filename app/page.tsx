export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-light)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Enterprise Leiga
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Fagleg leiguþjónusta sem þú getur treyst. Einföld pöntun, 
              áreiðanleg þjónusta og samkeppnishæf verð.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <a
                href="/leiga"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[var(--primary-dark)] shadow-lg hover:bg-blue-50 transition-colors"
              >
                Skoða framboð
              </a>
              <a
                href="/um"
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Fræðast meira
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Af hverju Enterprise Leiga?
            </h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Við bjóðum upp á heildarlausn sem auðveldar leiguferlið.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="📋"
              title="Auðveld pöntun"
              description="Panta leiguvörur á einfaldan hátt í gegnum kerfið okkar."
            />
            <FeatureCard
              icon="🔒"
              title="Öryggi"
              description="Örugg meðhöndlun gagna og greiðslna."
            />
            <FeatureCard
              icon="📞"
              title="Þjónusta"
              description="Persónuleg þjónusta og stuðningur allan daginn."
            />
            <FeatureCard
              icon="💰"
              title="Samkeppnishæf verð"
              description="Hagstæð verð og gagnsæ verðlagning."
            />
            <FeatureCard
              icon="🚀"
              title="Hraðvirkt"
              description="Fljótleg afgreiðsla og skilvirkt ferli."
            />
            <FeatureCard
              icon="📊"
              title="Yfirsýn"
              description="Góð yfirsýn yfir pantanir og leigusögu."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tilbúin(n) að byrja?
            </h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Hafðu samband við okkur eða skráðu þig til að fá aðgang.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a
                href="/innskraning"
                className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Skrá mig
              </a>
              <a
                href="/hafa-samband"
                className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:bg-[var(--surface)] transition-colors"
              >
                Hafa samband
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:shadow-lg hover:border-[var(--primary-light)]">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}
