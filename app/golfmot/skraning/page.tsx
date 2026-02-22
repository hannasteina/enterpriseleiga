'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function SkraningForm() {
  const searchParams = useSearchParams();
  const prefillNafn = searchParams.get('nafn') ?? '';
  const prefillNetfang = searchParams.get('netfang') ?? '';
  const prefillFyrirtaeki = searchParams.get('fyrirtaeki') ?? '';

  const currentYear = new Date().getFullYear();

  const [nafn, setNafn] = useState(prefillNafn);
  const [netfang, setNetfang] = useState(prefillNetfang);
  const [simi, setSimi] = useState('');
  const [fyrirtaeki, setFyrirtaeki] = useState(prefillFyrirtaeki);
  const [forgjof, setForgjof] = useState('');
  const [athugasemdir, setAthugasemdir] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/golfmot-skraning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nafn,
          netfang,
          simi,
          fyrirtaeki,
          forgjof: forgjof ? Number(forgjof) : undefined,
          athugasemdir: athugasemdir || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Villa við skráningu');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Villa við tengingu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#1a4a2e] to-[#0d3320] text-white">
      {/* Decorative golf pattern overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 60% 80%, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: '60px 60px, 80px 80px, 50px 50px',
        }}
      />

      <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-6 px-6 flex items-center justify-center">
          <Image
            src="/enterprise-logo.svg"
            alt="Enterprise Bílaleiga"
            width={180}
            height={36}
            className="h-8 w-auto opacity-90"
            priority
          />
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-2xl">
            {/* Golf ball decorative element */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <span className="text-4xl">⛳</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Golfmót Enterprise
                <span className="block text-emerald-400 mt-1">{currentYear}</span>
              </h1>
              <p className="mt-4 text-lg text-white/70 max-w-md mx-auto">
                Þú ert boðin/n í árlegt golfmót Enterprise Bílaleigu.
                Skráðu þig hér að neðan.
              </p>
            </div>

            {/* Event details card */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2 p-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Dagsetning</p>
                    <p className="text-sm font-semibold text-white mt-0.5">15. júní {currentYear}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Staðsetning</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Grafarholtsvöllur</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 p-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Tími</p>
                    <p className="text-sm font-semibold text-white mt-0.5">08:30 – 17:00</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10">
                <h3 className="text-sm font-semibold text-emerald-400 mb-3">Dagskrá</h3>
                <div className="grid gap-2 text-sm">
                  {[
                    { time: '08:30', desc: 'Skráning og morgunverður' },
                    { time: '09:30', desc: 'Kynning á nýjum bílalínum' },
                    { time: '10:00', desc: 'Mótið hefst — Best ball, 4 manna teymi' },
                    { time: '15:00', desc: 'Hádegisverður og verðlaunaafhending' },
                    { time: '16:30', desc: 'Netþing og sýning á rafbílum' },
                  ].map(({ time, desc }) => (
                    <div key={time} className="flex items-start gap-3">
                      <span className="text-emerald-400/80 font-mono text-xs mt-0.5 w-10 shrink-0">{time}</span>
                      <span className="text-white/70">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Registration form / Success */}
            {success ? (
              <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-8 text-center animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-emerald-400 mb-2">Skráning móttekin!</h2>
                <p className="text-white/70 max-w-sm mx-auto">
                  Takk {nafn}! Þú ert skráð/ur á Golfmót Enterprise {currentYear}.
                  Við munum senda þér staðfestingu á <span className="text-white font-medium">{netfang}</span>.
                </p>
                <p className="text-white/40 text-sm mt-4">Sjáumst á vellinum! 🏌️</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5">
                <h2 className="text-xl font-bold text-white mb-1">Skráning</h2>
                <p className="text-sm text-white/50 -mt-3 mb-4">Keppnisgjald er innifalið — við sjáum um allan búnað ef þörf er á.</p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">Nafn *</label>
                    <input
                      type="text"
                      value={nafn}
                      onChange={(e) => setNafn(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      placeholder="Fullt nafn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">Netfang *</label>
                    <input
                      type="email"
                      value={netfang}
                      onChange={(e) => setNetfang(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      placeholder="nafn@fyrirtaeki.is"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">Sími</label>
                    <input
                      type="tel"
                      value={simi}
                      onChange={(e) => setSimi(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      placeholder="555-1234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1.5">Fyrirtæki *</label>
                    <input
                      type="text"
                      value={fyrirtaeki}
                      onChange={(e) => setFyrirtaeki(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      placeholder="Heiti fyrirtækis"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Forgjöf (handicap)</label>
                  <input
                    type="number"
                    value={forgjof}
                    onChange={(e) => setForgjof(e.target.value)}
                    min={0}
                    max={54}
                    className="w-full sm:w-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="t.d. 18"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Athugasemdir</label>
                  <textarea
                    value={athugasemdir}
                    onChange={(e) => setAthugasemdir(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                    placeholder="Sérstakar óskir, matarfælni o.þ.h."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>🏌️</span>
                      <span>Skrá mig á mótið</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <footer className="text-center mt-10 pb-8">
              <p className="text-xs text-white/30">
                Enterprise Bílaleiga &middot; Vatnsmýrarvegur 10, 101 Reykjavík &middot; 519-9330
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GolfmotSkraningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#1a4a2e] to-[#0d3320] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    }>
      <SkraningForm />
    </Suspense>
  );
}
