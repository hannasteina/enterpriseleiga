'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  fyrirtaeki,
  type Fyrirtaeki,
  type Svid,
  type Tengiliður,
} from '@/lib/enterprise-demo-data';
import TengilidurPanel from '@/components/TengilidurPanel';

const SVID_LABELS: Record<Svid, string> = {
  langtimaleiga: 'Langtímaleiga',
  flotaleiga: 'Flotaleiga',
};

const SVID_STYLES: Record<Svid, { bg: string; text: string }> = {
  langtimaleiga: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  flotaleiga: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
};

const IS_ALPHABET = [
  'A','Á','B','D','Ð','E','É','F','G','H','I','Í',
  'J','K','L','M','N','O','Ó','P','R','S','T','U',
  'Ú','V','X','Y','Ý','Þ','Æ','Ö',
];

function normalizeFirstLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  if (IS_ALPHABET.includes(first)) return first;
  return '#';
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function scrollToLetter(letter: string) {
  const el = document.getElementById(`letter-${letter}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

type ViewMode = 'fyrirtaeki' | 'tengilidir';

export default function VidskiptavinirPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('fyrirtaeki');
  const [svidFilter, setSvidFilter] = useState<Svid | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedTengilidur, setSelectedTengilidur] = useState<Tengiliður | null>(null);
  const [tengiliðirUpdates, setTengiliðirUpdates] = useState<Record<string, Tengiliður>>({});

  const filtered = fyrirtaeki.filter((f) => {
    const matchSvid = svidFilter === 'all' || f.svid === svidFilter;
    const matchSearch =
      !search.trim() ||
      f.nafn.toLowerCase().includes(search.trim().toLowerCase());
    return matchSvid && matchSearch;
  });

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.nafn.localeCompare(b.nafn, 'is-IS')),
    [filtered],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Fyrirtaeki[]>();
    for (const f of sorted) {
      const letter = normalizeFirstLetter(f.nafn);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(f);
    }
    return map;
  }, [sorted]);

  const activeLetters = useMemo(() => new Set(grouped.keys()), [grouped]);

  const allContacts = useMemo(() => {
    const contacts: { tengiliður: Tengiliður; fyrirtaeki: Fyrirtaeki }[] = [];
    for (const f of filtered) {
      for (const t of f.tengiliðir) {
        const updated = tengiliðirUpdates[t.id] ?? t;
        const q = search.trim().toLowerCase();
        if (
          !q ||
          updated.nafn.toLowerCase().includes(q) ||
          updated.netfang.toLowerCase().includes(q) ||
          f.nafn.toLowerCase().includes(q)
        ) {
          contacts.push({ tengiliður: updated, fyrirtaeki: f });
        }
      }
    }
    return contacts.sort((a, b) =>
      a.tengiliður.nafn.localeCompare(b.tengiliður.nafn, 'is-IS'),
    );
  }, [filtered, tengiliðirUpdates, search]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function handleSaveTengilidur(updated: Tengiliður) {
    setTengiliðirUpdates(prev => ({ ...prev, [updated.id]: updated }));
    setSelectedTengilidur(updated);
  }

  function getTengilidur(t: Tengiliður): Tengiliður {
    return tengiliðirUpdates[t.id] ?? t;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Viðskiptavinir</h1>
          <p className="text-sm text-white/40 mt-1">
            Fyrirtæki og tengiliðir í bílaleigukerfinu
          </p>
        </div>
      </div>

      {/* View mode + Filter tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-white/5 overflow-hidden bg-white/5">
          <button
            onClick={() => setViewMode('fyrirtaeki')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === 'fyrirtaeki'
                ? 'bg-blue-600/30 text-blue-400'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Fyrirtæki
          </button>
          <button
            onClick={() => setViewMode('tengilidir')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              viewMode === 'tengilidir'
                ? 'bg-blue-600/30 text-blue-400'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Tengiliðir
          </button>
        </div>

        {viewMode === 'fyrirtaeki' && (
          <div className="flex rounded-lg border border-white/5 overflow-hidden bg-white/5">
            {(['all', 'langtimaleiga', 'flotaleiga'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSvidFilter(v)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  svidFilter === v
                    ? 'bg-blue-600/30 text-blue-400'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {v === 'all' ? 'Allir' : SVID_LABELS[v]}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder={viewMode === 'fyrirtaeki' ? 'Leita að fyrirtæki...' : 'Leita að tengilið...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#161822] border border-white/5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {viewMode === 'fyrirtaeki' ? (
        <>
          {/* Alphabet navigation */}
          <div className="flex flex-wrap items-center gap-0.5">
            {IS_ALPHABET.map((letter) => {
              const isActive = activeLetters.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => isActive && scrollToLetter(letter)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/20'
                      : 'text-white/25 hover:text-white/40 border border-transparent'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Company cards in continuous 2-column grid */}
          <div className="grid grid-cols-2 gap-4">
            {IS_ALPHABET.filter((letter) => grouped.has(letter)).map((letter) => {
              const companies = grouped.get(letter)!;
              return (
                <div key={letter} className="contents">
                  <div
                    id={`letter-${letter}`}
                    className="col-span-2 scroll-mt-4 flex items-center gap-3 pt-2 first:pt-0"
                  >
                    <span className="text-base font-bold w-6 text-center text-blue-400">{letter}</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-xs text-white/30">{companies.length}</span>
                  </div>
                  {companies.map((f) => (
                    <CompanyCard
                      key={f.id}
                      f={f}
                      expanded={expandedCards.has(f.id)}
                      onToggle={() => toggleCard(f.id)}
                      onSelectTengilidur={(t) => setSelectedTengilidur(getTengilidur(t))}
                      getTengilidur={getTengilidur}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-white/40">Engin fyrirtæki fundust með þessum leitarskilyrðum.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Contacts list */}
          <div className="text-xs text-white/40">
            {allContacts.length} tengiliðir
          </div>
          {allContacts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-white/40">Engir tengiliðir fundust.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allContacts.map(({ tengiliður: t, fyrirtaeki: f }) => {
                const styles = SVID_STYLES[f.svid];
                const ssCount = t.samskipti?.length ?? 0;
                const athCount = t.athugasemdir?.length ?? 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTengilidur(t)}
                    className="bg-[#161822] rounded-xl border border-white/5 hover:border-white/15 transition-all cursor-pointer group p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{t.nafn}</span>
                          {t.aðaltengiliður && (
                            <span className="text-amber-400" title="Aðaltengiliður">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </span>
                          )}
                          {t.staða && t.staða !== 'virkur' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              t.staða === 'óvirkur' ? 'bg-red-500/10 text-red-400' :
                              t.staða === 'lead' ? 'bg-green-500/10 text-green-400' :
                              'bg-white/5 text-white/40'
                            }`}>
                              {t.staða}
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-xs mt-0.5">{t.titill}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Link
                            href={`/vidskiptavinir/${f.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-white/40 hover:text-blue-400 transition-colors"
                          >
                            {f.nafn}
                          </Link>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: styles.bg, color: styles.text }}
                          >
                            {SVID_LABELS[f.svid]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <a
                            href={`mailto:${t.netfang}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-white/50 hover:text-blue-400 transition-colors block"
                          >
                            {t.netfang}
                          </a>
                          <a
                            href={`tel:${t.simi}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-white/50 hover:text-blue-400 transition-colors block mt-0.5"
                          >
                            {t.simi}
                          </a>
                        </div>
                        {(ssCount > 0 || athCount > 0) && (
                          <div className="flex items-center gap-2">
                            {ssCount > 0 && (
                              <span className="text-[10px] text-white/30 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                                </svg>
                                {ssCount}
                              </span>
                            )}
                            {athCount > 0 && (
                              <span className="text-[10px] text-white/30 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                </svg>
                                {athCount}
                              </span>
                            )}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTengilidur(t); }}
                          className="text-white/20 group-hover:text-white/50 hover:!text-blue-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                          title="Opna / breyta"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

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

function CompanyCard({
  f,
  expanded,
  onToggle,
  onSelectTengilidur,
  getTengilidur,
}: {
  f: Fyrirtaeki;
  expanded: boolean;
  onToggle: () => void;
  onSelectTengilidur: (t: Tengiliður) => void;
  getTengilidur: (t: Tengiliður) => Tengiliður;
}) {
  const styles = SVID_STYLES[f.svid];

  return (
    <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/vidskiptavinir/${f.id}`} className="hover:text-blue-400 transition-colors">
            <h2 className="text-lg font-semibold text-white truncate hover:text-blue-400">{f.nafn}</h2>
          </Link>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: styles.bg, color: styles.text }}
          >
            {SVID_LABELS[f.svid]}
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-white/80">KT: {f.kennitala}</p>
          <p className="text-white/60 truncate">{f.heimilisfang}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/80">
            <span className="font-medium text-white">{f.virktSamningar}</span>{' '}
            virkt samningar
          </span>
          <span className="text-white/80">
            <span className="font-medium text-white">{f.bilar}</span> bílar
          </span>
        </div>

        <p className="text-xs text-white/40">
          Stofnað: {formatDate(f.stofnad)}
        </p>

        {/* Contacts section - expandable */}
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Tengiliðir ({f.tengiliðir.length})
          </button>

          {expanded && (
            <ul className="mt-3 space-y-3">
              {f.tengiliðir.map((origT) => {
                const t = getTengilidur(origT);
                const latestSamskipti = (t.samskipti ?? [])
                  .sort((a, b) => b.dagsetning.localeCompare(a.dagsetning))
                  .slice(0, 2);
                const ssCount = t.samskipti?.length ?? 0;
                const athCount = t.athugasemdir?.length ?? 0;
                return (
                  <li
                    key={t.id}
                    onClick={() => onSelectTengilidur(t)}
                    className="text-sm rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all cursor-pointer group overflow-hidden"
                  >
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{t.nafn}</span>
                            {t.aðaltengiliður && (
                              <span className="text-amber-400" title="Aðaltengiliður">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-xs mt-0.5">{t.titill}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <a
                              href={`mailto:${t.netfang}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-white/60 hover:text-blue-400 transition-colors"
                            >
                              {t.netfang}
                            </a>
                            <a
                              href={`tel:${t.simi}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-white/60 hover:text-blue-400 transition-colors"
                            >
                              {t.simi}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectTengilidur(t); }}
                          className="text-white/20 group-hover:text-white/50 hover:!text-blue-400 p-1.5 rounded-lg hover:bg-white/5 transition-all shrink-0"
                          title="Opna / breyta"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>

                      {t.ahugamal && t.ahugamal.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {t.ahugamal.map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}

                      {(ssCount > 0 || athCount > 0) && (
                        <div className="flex items-center gap-3 mt-2">
                          {ssCount > 0 && (
                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                              </svg>
                              {ssCount} samskipti
                            </span>
                          )}
                          {athCount > 0 && (
                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                              </svg>
                              {athCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {latestSamskipti.length > 0 && (
                      <div className="border-t border-white/5 px-4 py-2 bg-white/[0.01]">
                        <div className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Síðustu samskipti</div>
                        <div className="space-y-1.5">
                          {latestSamskipti.map((s) => {
                            const iconColor = s.tegund === 'símtal' ? '#22c55e' : s.tegund === 'tölvupóstur' ? '#3b82f6' : s.tegund === 'fundur' ? '#f59e0b' : '#6b7280';
                            return (
                              <div key={s.id} className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: iconColor + '20' }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: iconColor }} />
                                </div>
                                <span className="text-[11px] text-white/60 truncate flex-1">{s.titill}</span>
                                <span className="text-[10px] text-white/25 shrink-0">{s.dagsetning}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="pt-3 border-t border-white/5">
          <Link
            href={`/vidskiptavinir/${f.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 text-sm font-medium hover:bg-blue-600/20 transition-colors"
          >
            Skoða fyrirtæki →
          </Link>
        </div>
      </div>
    </div>
  );
}
