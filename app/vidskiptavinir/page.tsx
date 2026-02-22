'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  fyrirtaeki,
  markhópar as allMarkhópar,
  DEFAULT_AHUGAMAL,
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

  // Tengiliðir filters
  const [tSvidFilter, setTSvidFilter] = useState<Svid | 'all'>('all');
  const [starfsheitiFilter, setStarfsheitiFilter] = useState('all');
  const [markhopurFilter, setMarkhopurFilter] = useState('all');
  const [ahugamalFilter, setAhugamalFilter] = useState('all');

  // Selection & actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendTemplate, setSendTemplate] = useState<'none' | 'golfmot'>('none');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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
    const source = tSvidFilter === 'all' ? fyrirtaeki : fyrirtaeki.filter(f => f.svid === tSvidFilter);
    for (const f of source) {
      for (const t of f.tengiliðir) {
        const updated = tengiliðirUpdates[t.id] ?? t;
        const q = search.trim().toLowerCase();
        const matchSearch = !q ||
          updated.nafn.toLowerCase().includes(q) ||
          updated.netfang.toLowerCase().includes(q) ||
          updated.titill.toLowerCase().includes(q) ||
          f.nafn.toLowerCase().includes(q);
        const matchStarfsheiti = starfsheitiFilter === 'all' || updated.titill === starfsheitiFilter;
        const matchMarkhópur = markhopurFilter === 'all' || (updated.markhópar?.includes(markhopurFilter) ?? false);
        const matchAhugamal = ahugamalFilter === 'all' || (updated.ahugamal?.includes(ahugamalFilter) ?? false);
        if (matchSearch && matchStarfsheiti && matchMarkhópur && matchAhugamal) {
          contacts.push({ tengiliður: updated, fyrirtaeki: f });
        }
      }
    }
    return contacts.sort((a, b) =>
      a.tengiliður.nafn.localeCompare(b.tengiliður.nafn, 'is-IS'),
    );
  }, [tengiliðirUpdates, search, tSvidFilter, starfsheitiFilter, markhopurFilter, ahugamalFilter]);

  const uniqueAhugamal = useMemo(() => {
    const set = new Set<string>();
    for (const f of fyrirtaeki) {
      for (const t of f.tengiliðir) {
        const updated = tengiliðirUpdates[t.id] ?? t;
        for (const a of (updated.ahugamal ?? [])) set.add(a);
      }
    }
    for (const a of DEFAULT_AHUGAMAL) set.add(a);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'is-IS'));
  }, [tengiliðirUpdates]);

  const uniqueStarfsheiti = useMemo(() => {
    const set = new Set<string>();
    for (const f of fyrirtaeki) {
      for (const t of f.tengiliðir) {
        const updated = tengiliðirUpdates[t.id] ?? t;
        if (updated.titill) set.add(updated.titill);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'is-IS'));
  }, [tengiliðirUpdates]);

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === allContacts.length) return new Set();
      return new Set(allContacts.map(c => c.tengiliður.id));
    });
  }, [allContacts]);

  const selectedContacts = useMemo(
    () => allContacts.filter(c => selectedIds.has(c.tengiliður.id)),
    [allContacts, selectedIds],
  );

  async function handleExportExcel() {
    const { utils, writeFile } = await import('xlsx');
    const rows = (selectedContacts.length > 0 ? selectedContacts : allContacts).map(({ tengiliður: t, fyrirtaeki: f }) => ({
      'Nafn': t.nafn,
      'Starfsheiti': t.titill,
      'Fyrirtæki': f.nafn,
      'Svið': SVID_LABELS[f.svid],
      'Netfang': t.netfang,
      'Sími': t.simi,
      'Aðaltengiliður': t.aðaltengiliður ? 'Já' : 'Nei',
      'Staða': t.staða ?? 'virkur',
      'Markhópar': (t.markhópar ?? []).map(id => allMarkhópar.find(m => m.id === id)?.nafn ?? id).join(', '),
      'Áhugamál': (t.ahugamal ?? []).join(', '),
    }));
    const ws = utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r] ?? '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Tengiliðir');
    writeFile(wb, `tengilidir_${new Date().toISOString().split('T')[0]}.xlsx`);
    setToast(`${rows.length} tengiliðir fluttir út í Excel`);
  }

  async function handleSendEmail() {
    const isGolf = sendTemplate === 'golfmot';
    if (!isGolf && (!sendSubject.trim() || !sendBody.trim())) return;
    if (selectedContacts.length === 0) return;
    setSendLoading(true);
    try {
      const res = await fetch('/api/send-bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: selectedContacts.map(({ tengiliður: t, fyrirtaeki: f }) => ({
            email: t.netfang,
            name: t.nafn,
            fyrirtaeki: f.nafn,
          })),
          subject: isGolf ? '' : sendSubject,
          body: isGolf ? '' : sendBody,
          templateId: isGolf ? 'golfmot' : undefined,
        }),
      });
      const data = await res.json();
      setToast(data.message || `Sent á ${selectedContacts.length} tengiliði`);
      setShowSendModal(false);
      setSendSubject('');
      setSendBody('');
      setSendTemplate('none');
    } catch {
      setToast('Villa við sendingu');
    } finally {
      setSendLoading(false);
    }
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
            placeholder={viewMode === 'fyrirtaeki' ? 'Leita að fyrirtæki...' : 'Leita að nafni, fyrirtæki eða starfsheiti...'}
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
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors border ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border-blue-500/20 cursor-pointer'
                      : 'alphabet-inactive border-white/10 cursor-default'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Company cards grouped by letter */}
          <div className="grid grid-cols-3 gap-3">
            {IS_ALPHABET.filter((letter) => grouped.has(letter)).map((letter) => {
              const companies = grouped.get(letter)!;
              return (
                <div key={letter} className="contents">
                  <div
                    id={`letter-${letter}`}
                    className="col-span-3 scroll-mt-4 flex items-center gap-2 pt-1 first:pt-0"
                  >
                    <span className="text-sm font-bold w-5 text-center text-blue-400">{letter}</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-white/30">{companies.length}</span>
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
          {/* Tengiliðir filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tSvidFilter}
              onChange={e => setTSvidFilter(e.target.value as Svid | 'all')}
              className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]"
            >
              <option value="all">Öll svið</option>
              <option value="langtimaleiga">Langtímaleiga</option>
              <option value="flotaleiga">Flotaleiga</option>
            </select>

            <select
              value={starfsheitiFilter}
              onChange={e => setStarfsheitiFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]"
            >
              <option value="all">Öll starfsheiti</option>
              {uniqueStarfsheiti.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={markhopurFilter}
              onChange={e => setMarkhopurFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]"
            >
              <option value="all">Allir markhópar</option>
              {allMarkhópar.map(m => (
                <option key={m.id} value={m.id}>{m.nafn}</option>
              ))}
            </select>

            <select
              value={ahugamalFilter}
              onChange={e => setAhugamalFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]"
            >
              <option value="all">Öll áhugamál</option>
              {uniqueAhugamal.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {(tSvidFilter !== 'all' || starfsheitiFilter !== 'all' || markhopurFilter !== 'all' || ahugamalFilter !== 'all') && (
              <button
                onClick={() => { setTSvidFilter('all'); setStarfsheitiFilter('all'); setMarkhopurFilter('all'); setAhugamalFilter('all'); }}
                className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hreinsa síur
              </button>
            )}
          </div>

          {/* Summary + actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group/check">
                <input
                  type="checkbox"
                  checked={selectedIds.size === allContacts.length && allContacts.length > 0}
                  ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < allContacts.length; }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                />
                <span className="text-xs text-white/40 group-hover/check:text-white/60 transition-colors">
                  {selectedIds.size > 0 ? `${selectedIds.size} af ${allContacts.length} valdir` : `${allContacts.length} tengiliðir`}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/15 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-600/25 transition-colors"
                title={selectedIds.size > 0 ? `Flytja ${selectedIds.size} valda út` : 'Flytja alla út'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Excel
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-600/25 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Senda á {selectedIds.size} valda
                </button>
              )}
            </div>
          </div>

          {/* Contacts list */}
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
                const isChecked = selectedIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={`bg-[#161822] rounded-xl border transition-all cursor-pointer group p-4 ${isChecked ? 'border-blue-500/30 bg-blue-500/[0.03]' : 'border-white/5 hover:border-white/15'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(t.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => setSelectedTengilidur(t)}>
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
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                          {(t.markhópar ?? []).map(mId => {
                            const mh = allMarkhópar.find(m => m.id === mId);
                            if (!mh) return null;
                            return (
                              <span
                                key={mId}
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: mh.litur + '20', color: mh.litur }}
                              >
                                {mh.nafn}
                              </span>
                            );
                          })}
                          {(t.ahugamal ?? []).map(a => (
                            <span
                              key={a}
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-teal-500/10 text-teal-400"
                            >
                              {a}
                            </span>
                          ))}
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

      {/* Send email modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setShowSendModal(false); setSendTemplate('none'); }}>
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Senda tölvupóst</h3>
                <p className="text-xs text-white/40 mt-0.5">Á {selectedContacts.length} valda tengiliði</p>
              </div>
              <button onClick={() => { setShowSendModal(false); setSendTemplate('none'); }} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {selectedContacts.map(({ tengiliður: t }) => (
                  <span key={t.id} className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                    {t.nafn} &lt;{t.netfang}&gt;
                  </span>
                ))}
              </div>

              {/* Template picker */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Sniðmát</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendTemplate('none')}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                      sendTemplate === 'none'
                        ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
                    }`}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    Eigin póstur
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTemplate('golfmot')}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                      sendTemplate === 'golfmot'
                        ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base block mb-0.5">⛳</span>
                    Golfmót {new Date().getFullYear()}
                  </button>
                </div>
              </div>

              {sendTemplate === 'golfmot' ? (
                /* Golf template preview */
                <div className="rounded-xl border border-emerald-500/20 overflow-hidden">
                  <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 px-5 py-4 text-center">
                    <span className="text-3xl">⛳</span>
                    <h4 className="text-white font-bold text-sm mt-2">Golfmót Enterprise {new Date().getFullYear()}</h4>
                    <p className="text-emerald-300/80 text-[10px] mt-1 uppercase tracking-wider">Boðsmiði með skráningarhnappi</p>
                  </div>
                  <div className="bg-emerald-500/[0.04] px-5 py-4 space-y-3">
                    <p className="text-xs text-white/60 leading-relaxed">
                      Hver viðtakandi fær persónulegan póst með sínu nafni og
                      skráningarhnappi sem opnar skráningarsíðu með fyrirfylltum upplýsingum.
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Persónulegur
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Skráningarhnappur
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Myndrænt
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-[10px] text-white/40 space-y-1.5">
                      <div className="flex gap-2"><span className="text-emerald-400 font-mono w-9 shrink-0">08:30</span><span>Skráning og morgunverður</span></div>
                      <div className="flex gap-2"><span className="text-emerald-400 font-mono w-9 shrink-0">09:30</span><span>Kynning á nýjum bílalínum</span></div>
                      <div className="flex gap-2"><span className="text-emerald-400 font-mono w-9 shrink-0">10:00</span><span>Mótið hefst — Best ball, 4 manna teymi</span></div>
                      <div className="flex gap-2"><span className="text-emerald-400 font-mono w-9 shrink-0">15:00</span><span>Hádegisverður og verðlaunaafhending</span></div>
                      <div className="flex gap-2"><span className="text-emerald-400 font-mono w-9 shrink-0">16:30</span><span>Netþing og sýning á rafbílum</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom email form */
                <>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1">Efni</label>
                    <input
                      value={sendSubject}
                      onChange={e => setSendSubject(e.target.value)}
                      placeholder="Efni tölvupósts..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1">
                      Meginmál <span className="text-white/30 font-normal">({'{{nafn}}'} = nafn viðtakanda)</span>
                    </label>
                    <textarea
                      value={sendBody}
                      onChange={e => setSendBody(e.target.value)}
                      rows={6}
                      placeholder="Sæll/sæl {{nafn}},&#10;&#10;..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => { setShowSendModal(false); setSendTemplate('none'); }}
                className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Hætta við
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendLoading || (sendTemplate === 'none' && (!sendSubject.trim() || !sendBody.trim()))}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${
                  sendTemplate === 'golfmot'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {sendLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : sendTemplate === 'golfmot' ? (
                  <span>⛳</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
                {sendTemplate === 'golfmot' ? 'Senda golfmótsboð' : 'Senda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-green-500/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
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
    <div className="bg-[#161822] rounded-lg border border-white/5 overflow-hidden">
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/vidskiptavinir/${f.id}`} className="hover:text-blue-400 transition-colors min-w-0">
            <h2 className="text-sm font-semibold text-white truncate hover:text-blue-400">{f.nafn}</h2>
          </Link>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: styles.bg, color: styles.text }}
          >
            {SVID_LABELS[f.svid]}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>KT: {f.kennitala}</span>
          <span className="text-white/20">|</span>
          <span className="truncate">{f.heimilisfang}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-white/70">
            <span className="font-medium text-white">{f.virktSamningar}</span> samn.
          </span>
          <span className="text-white/70">
            <span className="font-medium text-white">{f.bilar}</span> bílar
          </span>
          <span className="text-white/40 ml-auto text-[10px]">
            {formatDate(f.stofnad)}
          </span>
        </div>

        {/* Contacts toggle */}
        <div className="pt-1.5 border-t border-white/5">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
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
            <ul className="mt-2 space-y-1.5">
              {f.tengiliðir.map((origT) => {
                const t = getTengilidur(origT);
                return (
                  <li
                    key={t.id}
                    onClick={() => onSelectTengilidur(t)}
                    className="text-xs rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all cursor-pointer p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white text-xs">{t.nafn}</span>
                          {t.aðaltengiliður && (
                            <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-white/40 text-[10px] truncate">{t.titill}</p>
                      </div>
                      <a
                        href={`mailto:${t.netfang}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-white/40 hover:text-blue-400 transition-colors shrink-0"
                      >
                        {t.netfang}
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
