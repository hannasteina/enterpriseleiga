'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  samningar,
  bilar,
  mal,
  solutaekifaeri,
  verkefni,
  samningsSkjol,
  getFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  type Tengiliður,
} from '@/lib/enterprise-demo-data';
import TengilidurPanel from '@/components/TengilidurPanel';

const SVID_LABELS: Record<string, string> = {
  langtimaleiga: 'Langtímaleiga',
  flotaleiga: 'Flotaleiga',
};

const PIPI_LABELS: Record<string, string> = {
  floti: 'Floti',
  vinnuferdir: 'Vinnuferðir',
  sendibilar: 'Sendibílar',
  serpantanir: 'Sérpantanir',
  langtimaleiga: 'Langtímaleiga',
};

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function FyrirtaekiDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const fyrirtaekiData = useMemo(
    () => (id ? getFyrirtaeki(id) : null),
    [id]
  );

  const [tengilidir, setTengilidir] = useState<Tengiliður[]>(
    fyrirtaekiData?.tengiliðir ?? []
  );
  const [selectedTengilidur, setSelectedTengilidur] = useState<Tengiliður | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tengiliðir: true,
    bilar: true,
    samningar: true,
    mal: true,
    solutaekifaeri: true,
    verkefni: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  function handleSaveTengilidur(updated: Tengiliður) {
    setTengilidir(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    setSelectedTengilidur(updated);
  }

  if (!id || !fyrirtaekiData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#161822] rounded-xl border border-white/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">Fyrirtæki fannst ekki</h2>
          <p className="text-white/60 mt-2">
            Engin skrá fannst með auðkenninu sem þú sóttir.
          </p>
          <Link
            href="/vidskiptavinir"
            className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Til baka
          </Link>
        </div>
      </div>
    );
  }

  const companyBilar = bilar.filter((b) => b.fyrirtaekiId === id);
  const companySamningar = samningar.filter((s) => s.fyrirtaekiId === id);
  const companyMal = mal.filter((m) => m.fyrirtaekiId === id);
  const companySolutaekifaeri = solutaekifaeri.filter((s) => s.fyrirtaekiId === id);
  const companyVerkefni = verkefni.filter((v) => v.fyrirtaekiId === id);
  const virkirSamningar = companySamningar.filter(
    (s) => s.status === 'virkur' || s.status === 'rennur_ut'
  );
  const totalManadlegurKostnadur = virkirSamningar.reduce(
    (sum, s) => sum + s.manadalegurKostnadur,
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/vidskiptavinir"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        ← Til baka
      </Link>

      {/* Header */}
      <header className="bg-[#161822] rounded-xl border border-white/5 p-6">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold text-white">{fyrirtaekiData.nafn}</h1>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${getStatusColor(fyrirtaekiData.svid)}20`,
              color: getStatusColor(fyrirtaekiData.svid),
            }}
          >
            {SVID_LABELS[fyrirtaekiData.svid] ?? fyrirtaekiData.svid}
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80"
          >
            {PIPI_LABELS[fyrirtaekiData.pipiTegund] ?? fyrirtaekiData.pipiTegund}
          </span>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p className="text-white/80">Kennitala: {fyrirtaekiData.kennitala}</p>
          <p className="text-white/80">{fyrirtaekiData.heimilisfang}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tengiliðir */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <button
            onClick={() => toggleSection('tengiliðir')}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">Tengiliðir ({tengilidir.length})</h2>
            <svg
              className={`w-5 h-5 text-white/40 transition-transform ${expandedSections.tengiliðir ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {expandedSections.tengiliðir && (
            <div className="px-5 pb-5 space-y-3">
              {tengilidir.map((t) => {
                const athCount = t.athugasemdir?.length ?? 0;
                const ssCount = t.samskipti?.length ?? 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTengilidur(t)}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{t.nafn}</span>
                          {t.aðaltengiliður && (
                            <span className="text-amber-400" title="Aðaltengiliður">
                              ★
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60">{t.titill}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-white/80">
                            <a
                              href={`mailto:${t.netfang}`}
                              className="hover:text-blue-400"
                              onClick={e => e.stopPropagation()}
                            >
                              {t.netfang}
                            </a>
                          </p>
                          <p className="text-sm text-white/80">
                            <a
                              href={`tel:${t.simi}`}
                              className="hover:text-blue-400"
                              onClick={e => e.stopPropagation()}
                            >
                              {t.simi}
                            </a>
                          </p>
                        </div>

                        {/* Extra info preview */}
                        <div className="flex items-center gap-3 mt-2">
                          {t.ahugamal && t.ahugamal.length > 0 && (
                            <div className="flex items-center gap-1">
                              {t.ahugamal.slice(0, 3).map((a, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400"
                                >
                                  {a}
                                </span>
                              ))}
                              {t.ahugamal.length > 3 && (
                                <span className="text-[10px] text-white/30">
                                  +{t.ahugamal.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          {athCount > 0 && (
                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                              </svg>
                              {athCount}
                            </span>
                          )}
                          {ssCount > 0 && (
                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                              </svg>
                              {ssCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTengilidur(t);
                        }}
                        className="text-white/20 group-hover:text-white/50 hover:!text-blue-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                        title="Breyta tengilið"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {tengilidir.length === 0 && (
                <p className="text-white/40 text-sm">Engir tengiliðir skráðir</p>
              )}
            </div>
          )}
        </div>

        {/* Bílar á samningi */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden lg:col-span-2">
          <button
            onClick={() => toggleSection('bilar')}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">
              Bílar á samningi ({companyBilar.length})
            </h2>
            <svg
              className={`w-5 h-5 text-white/40 transition-transform ${expandedSections.bilar ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {expandedSections.bilar && (
            <div className="px-5 pb-5">
              <div className="space-y-4">
                {companyBilar.map((bill) => {
                  const samningur = bill.samningurId
                    ? samningar.find((s) => s.id === bill.samningurId)
                    : null;
                  return (
                    <div
                      key={bill.id}
                      className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex flex-wrap gap-4 items-center justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/bilar/${bill.id}`}
                          className="font-mono font-semibold text-blue-400 hover:text-blue-300"
                        >
                          {bill.numer}
                        </Link>
                        <span className="text-white/80">{bill.tegund}</span>
                        <span className="text-white/40">({bill.arsgerð})</span>
                        <span className="text-white/60">{bill.bilaFlokkur}</span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: getStatusBg(bill.status),
                            color: getStatusColor(bill.status),
                          }}
                        >
                          {bill.status}
                        </span>
                        <span className="text-white/60">
                          {bill.ekinkm.toLocaleString('is-IS')} km
                        </span>
                      </div>
                      {samningur && (
                        <div className="text-sm text-white/60">
                          {formatCurrency(samningur.manadalegurKostnadur)}/mán · Loka{' '}
                          {formatDate(samningur.lokadagur)} · {samningur.tryggingarPakki}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {companyBilar.length > 0 && (
                <p className="mt-3 text-sm text-white/40">
                  Samtals {companyBilar.length} bíll{companyBilar.length !== 1 ? 'ar' : ''} á
                  samningi
                </p>
              )}
              {companyBilar.length === 0 && (
                <p className="text-white/40 text-sm">Engir bílar á samningi</p>
              )}
            </div>
          )}
        </div>

        {/* Samningar */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden lg:col-span-2">
          <button
            onClick={() => toggleSection('samningar')}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">
              Samningar ({companySamningar.length})
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">
                Mánaðarlegur kostnaður virkra:{' '}
                <span className="text-white font-medium">
                  {formatCurrency(totalManadlegurKostnadur)}
                </span>
              </span>
              <svg
                className={`w-5 h-5 text-white/40 transition-transform ${expandedSections.samningar ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
          {expandedSections.samningar && (
            <div className="px-5 pb-5 space-y-4">
              {companySamningar.map((s) => {
                const skjol = samningsSkjol.filter((sk) => sk.samningurId === s.id);
                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-white">{s.bilategund}</span>
                      <span className="font-mono text-white/80">{s.bilanumer}</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: getStatusBg(s.status),
                          color: getStatusColor(s.status),
                        }}
                      >
                        {s.status === 'virkur'
                          ? 'Virkur'
                          : s.status === 'rennur_ut'
                            ? 'Rennur út'
                            : s.status === 'lokid'
                              ? 'Lokið'
                              : s.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-white/60">
                      {formatDate(s.upphafsdagur)} – {formatDate(s.lokadagur)} ·{' '}
                      {formatCurrency(s.manadalegurKostnadur)}/mán · {s.tryggingarPakki}
                    </div>
                    {skjol.length > 0 && (
                      <div className="mt-2 text-xs text-white/40">
                        Skjöl: {skjol.map((sk) => sk.nafn).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
              {companySamningar.length === 0 && (
                <p className="text-white/40 text-sm">Engir samningar</p>
              )}
            </div>
          )}
        </div>

        {/* Opin mál */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <button
            onClick={() => toggleSection('mal')}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">Opin mál</h2>
            <svg
              className={`w-5 h-5 text-white/40 transition-transform ${expandedSections.mal ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {expandedSections.mal && (
            <div className="px-5 pb-5 space-y-3">
              {companyMal
                .filter((m) => m.status !== 'lokað')
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <p className="font-medium text-white">{m.titill}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: getStatusBg(m.status),
                          color: getStatusColor(m.status),
                        }}
                      >
                        {m.status}
                      </span>
                      <span className="text-white/60">{m.tegund}</span>
                      <span className="text-white/60">{m.forgangur}</span>
                      <span className="text-white/40">· {m.abyrgdaraðili}</span>
                    </div>
                  </div>
                ))}
              {companyMal.filter((m) => m.status !== 'lokað').length === 0 && (
                <p className="text-white/40 text-sm">Engin opin mál</p>
              )}
            </div>
          )}
        </div>

        {/* Sölutækifæri */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <button
            onClick={() => toggleSection('solutaekifaeri')}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">Sölutækifæri</h2>
            <svg
              className={`w-5 h-5 text-white/40 transition-transform ${expandedSections.solutaekifaeri ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {expandedSections.solutaekifaeri && (
            <div className="px-5 pb-5 space-y-3">
              {companySolutaekifaeri
                .filter((so) => so.stig !== 'lokað tapað' && so.stig !== 'lokað unnið')
                .map((so) => (
                  <div
                    key={so.id}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <p className="font-medium text-white">{so.titill}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: getStatusBg(so.stig),
                          color: getStatusColor(so.stig),
                        }}
                      >
                        {so.stig}
                      </span>
                      <span className="text-white/80 font-medium">
                        {formatCurrency(so.verdmaeti)}
                      </span>
                    </div>
                  </div>
                ))}
              {companySolutaekifaeri.filter(
                (so) => so.stig !== 'lokað tapað' && so.stig !== 'lokað unnið'
              ).length === 0 && (
                <p className="text-white/40 text-sm">Engin virk sölutækifæri</p>
              )}
            </div>
          )}
        </div>

        {/* Virk verkefni */}
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden lg:col-span-2">
          <button
            onClick={() => toggleSection('verkefni')}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">Virk verkefni</h2>
            <svg
              className={`w-5 h-5 text-white/40 transition-transform ${expandedSections.verkefni ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {expandedSections.verkefni && (
            <div className="px-5 pb-5 space-y-3">
              {companyVerkefni.filter((v) => v.status !== 'lokið').map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between flex-wrap gap-2"
                >
                  <p className="font-medium text-white">{v.titill}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: getStatusBg(v.status),
                        color: getStatusColor(v.status),
                      }}
                    >
                      {v.status}
                    </span>
                    {v.sjálfvirkt && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Sjálfvirkt
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {companyVerkefni.filter((v) => v.status !== 'lokið').length === 0 && (
                <p className="text-white/40 text-sm">Engin virk verkefni</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tengiliður Panel */}
      {selectedTengilidur && (
        <TengilidurPanel
          tengiliður={selectedTengilidur}
          onClose={() => setSelectedTengilidur(null)}
          onSave={handleSaveTengilidur}
        />
      )}
    </div>
  );
}
