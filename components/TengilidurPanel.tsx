'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getVirkirNotendur,
  DEFAULT_AHUGAMAL,
  type Tengiliður,
  type TengiliðurAthugasemd,
  type TengiliðurSamskipti,
} from '@/lib/enterprise-demo-data';

interface VerkefniFromSamskipti {
  titill: string;
  lysing: string;
  deadline: string;
  uthlutadA?: string;
}

interface Props {
  tengiliður: Tengiliður;
  onClose: () => void;
  onSave: (updated: Tengiliður) => void;
  onCreateVerkefni?: (data: VerkefniFromSamskipti) => void;
}

type Tab = 'upplysingar' | 'athugasemdir' | 'samskipti';

const SAMSKIPTI_TEGUNDIR: { key: TengiliðurSamskipti['tegund']; label: string; icon: string; color: string }[] = [
  { key: 'símtal', label: 'Símtal', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: '#22c55e' },
  { key: 'tölvupóstur', label: 'Tölvupóstur', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: '#3b82f6' },
  { key: 'fundur', label: 'Fundur', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#f59e0b' },
  { key: 'heimsókn', label: 'Heimsókn', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', color: '#8b5cf6' },
  { key: 'annað', label: 'Annað', icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z', color: '#6b7280' },
];

function formatDateTime(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TengilidurPanel({ tengiliður, onClose, onSave, onCreateVerkefni }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [activeTab, setActiveTab] = useState<Tab>('upplysingar');

  const [nafn, setNafn] = useState(tengiliður.nafn);
  const [titill, setTitill] = useState(tengiliður.titill);
  const [simi, setSimi] = useState(tengiliður.simi);
  const [netfang, setNetfang] = useState(tengiliður.netfang);
  const [adaltengiliður, setAdaltengiliður] = useState(tengiliður.aðaltengiliður);
  const [ahugamal, setAhugamal] = useState<string[]>(tengiliður.ahugamal ?? []);
  const [nyttAhugamal, setNyttAhugamal] = useState('');

  const [athugasemdir, setAthugasemdir] = useState<TengiliðurAthugasemd[]>(
    tengiliður.athugasemdir ?? []
  );
  const [nyAthugasemd, setNyAthugasemd] = useState('');

  const [samskipti, setSamskipti] = useState<TengiliðurSamskipti[]>(
    tengiliður.samskipti ?? []
  );
  const [showNyttSamskipti, setShowNyttSamskipti] = useState(false);
  const [nsTegund, setNsTegund] = useState<TengiliðurSamskipti['tegund']>('símtal');
  const [nsTitill, setNsTitill] = useState('');
  const [nsLysing, setNsLysing] = useState('');
  const [nsSetjaVerkefni, setNsSetjaVerkefni] = useState(false);
  const [nsDeadline, setNsDeadline] = useState('');
  const [nsUthlutadA, setNsUthlutadA] = useState('');

  const [toast, setToast] = useState('');
  const virkirNotendur = getVirkirNotendur();

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
        setTimeout(() => onCloseRef.current(), 200);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose();
  }

  function handleSave() {
    if (!nafn.trim() || !netfang.trim()) return;
    const updated: Tengiliður = {
      ...tengiliður,
      nafn: nafn.trim(),
      titill: titill.trim(),
      simi: simi.trim(),
      netfang: netfang.trim(),
      aðaltengiliður: adaltengiliður,
      ahugamal,
      athugasemdir,
      samskipti,
    };
    onSave(updated);
    setToast('Tengiliður vistaður');
  }

  function addAhugamal() {
    const val = nyttAhugamal.trim();
    if (!val || ahugamal.includes(val)) return;
    setAhugamal(prev => [...prev, val]);
    setNyttAhugamal('');
  }

  function removeAhugamal(idx: number) {
    setAhugamal(prev => prev.filter((_, i) => i !== idx));
  }

  function addAthugasemd() {
    const val = nyAthugasemd.trim();
    if (!val) return;
    const ny: TengiliðurAthugasemd = {
      id: `ath-${Date.now()}`,
      texti: val,
      dagsetning: new Date().toISOString().split('T')[0],
      hofundur: 'Þú',
    };
    setAthugasemdir(prev => [ny, ...prev]);
    setNyAthugasemd('');
  }

  function deleteAthugasemd(id: string) {
    setAthugasemdir(prev => prev.filter(a => a.id !== id));
  }

  function addSamskipti() {
    if (!nsTitill.trim()) return;
    const nySamskipti: TengiliðurSamskipti = {
      id: `ss-${Date.now()}`,
      tegund: nsTegund,
      titill: nsTitill.trim(),
      lysing: nsLysing.trim(),
      dagsetning: new Date().toISOString().split('T')[0],
      hofundur: 'Þú',
    };
    setSamskipti(prev => [nySamskipti, ...prev]);

    if (nsSetjaVerkefni && nsDeadline && onCreateVerkefni) {
      onCreateVerkefni({
        titill: nsTitill.trim(),
        lysing: nsLysing.trim(),
        deadline: nsDeadline,
        uthlutadA: nsUthlutadA || undefined,
      });
      const nafn = virkirNotendur.find(n => n.id === nsUthlutadA)?.nafn;
      setToast(nafn
        ? `Samskipti skráð og verkefni úthlutað á ${nafn}`
        : 'Samskipti skráð og verkefni stofnað');
    }

    setNsTitill('');
    setNsLysing('');
    setNsSetjaVerkefni(false);
    setNsDeadline('');
    setNsUthlutadA('');
    setShowNyttSamskipti(false);
  }

  function deleteSamskipti(id: string) {
    setSamskipti(prev => prev.filter(s => s.id !== id));
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'upplysingar', label: 'Upplýsingar' },
    { key: 'athugasemdir', label: 'Athugasemdir', count: athugasemdir.length },
    { key: 'samskipti', label: 'Samskipti', count: samskipti.length },
  ];

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-200 ${
        isVisible ? 'bg-black/60' : 'bg-black/0'
      }`}
    >
      <div
        className={`w-full max-w-2xl h-full overflow-y-auto bg-[#0f1117] border-l border-white/10 shadow-2xl transition-transform duration-200 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f1117] border-b border-white/5">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{tengiliður.nafn}</h2>
              <p className="text-sm text-white/40">{tengiliður.titill}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-white bg-white/5'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ===== TAB: Upplýsingar ===== */}
          {activeTab === 'upplysingar' && (
            <div className="space-y-5">
              {/* Edit fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Nafn</label>
                  <input
                    value={nafn}
                    onChange={e => setNafn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Titill / Starfsheiti</label>
                  <input
                    value={titill}
                    onChange={e => setTitill(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1">Sími</label>
                    <input
                      value={simi}
                      onChange={e => setSimi(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1">Netfang</label>
                    <input
                      value={netfang}
                      onChange={e => setNetfang(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                {/* Aðaltengiliður toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdaltengiliður(!adaltengiliður)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      adaltengiliður ? 'bg-amber-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        adaltengiliður ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-white/70">Aðaltengiliður</span>
                </div>
              </div>

              {/* Áhugamál */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Áhugamál / Athyglisvert</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ahugamal.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium"
                    >
                      {a}
                      <button
                        onClick={() => removeAhugamal(i)}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {ahugamal.length === 0 && (
                    <span className="text-xs text-white/30">Engin áhugamál skráð</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={nyttAhugamal}
                    onChange={e => setNyttAhugamal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAhugamal())}
                    placeholder="Bæta við áhugamáli..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={addAhugamal}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  >
                    +
                  </button>
                </div>
                {DEFAULT_AHUGAMAL.filter(a => !ahugamal.includes(a)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {DEFAULT_AHUGAMAL.filter(a => !ahugamal.includes(a)).map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAhugamal(prev => [...prev, a])}
                        className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-white/40 hover:border-teal-500/30 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                      >
                        + {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Vista breytingar
              </button>
            </div>
          )}

          {/* ===== TAB: Athugasemdir ===== */}
          {activeTab === 'athugasemdir' && (
            <div className="space-y-4">
              {/* Add new */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <textarea
                  value={nyAthugasemd}
                  onChange={e => setNyAthugasemd(e.target.value)}
                  rows={3}
                  placeholder="Skrifa athugasemd..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={addAthugasemd}
                    disabled={!nyAthugasemd.trim()}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    Bæta við
                  </button>
                </div>
              </div>

              {/* List */}
              {athugasemdir.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">Engar athugasemdir skráðar</p>
              ) : (
                <div className="space-y-3">
                  {athugasemdir.map(a => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-4 group"
                    >
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{a.texti}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <span>{a.hofundur}</span>
                          <span>·</span>
                          <span>{formatDateTime(a.dagsetning)}</span>
                        </div>
                        <button
                          onClick={() => deleteAthugasemd(a.id)}
                          className="text-xs text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Eyða
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: Samskipti ===== */}
          {activeTab === 'samskipti' && (
            <div className="space-y-4">
              {/* Add new */}
              {!showNyttSamskipti ? (
                <button
                  onClick={() => setShowNyttSamskipti(true)}
                  className="w-full py-3 rounded-xl border border-dashed border-white/10 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
                >
                  + Skrá ný samskipti
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {SAMSKIPTI_TEGUNDIR.map(st => (
                      <button
                        key={st.key}
                        onClick={() => setNsTegund(st.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          nsTegund === st.key
                            ? ''
                            : 'border-white/5 text-white/40 hover:text-white/60'
                        }`}
                        style={
                          nsTegund === st.key
                            ? {
                                backgroundColor: st.color + '20',
                                borderColor: st.color + '40',
                                color: st.color,
                              }
                            : undefined
                        }
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={st.icon} />
                        </svg>
                        {st.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={nsTitill}
                    onChange={e => setNsTitill(e.target.value)}
                    placeholder="Titill samskipta..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                  />
                  <textarea
                    value={nsLysing}
                    onChange={e => setNsLysing(e.target.value)}
                    rows={3}
                    placeholder="Lýsing / upplýsingar..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                  {/* Setja sem verkefni */}
                  <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nsSetjaVerkefni}
                        onChange={e => setNsSetjaVerkefni(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                      />
                      <span className="text-xs text-white/60">Setja sem verkefni</span>
                    </label>
                    {nsSetjaVerkefni && (
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-white/40 w-16 shrink-0">Úthluta á:</span>
                          <select
                            value={nsUthlutadA}
                            onChange={e => setNsUthlutadA(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                          >
                            <option value="">— Veldu teymismeðlim —</option>
                            {virkirNotendur.map(n => (
                              <option key={n.id} value={n.id}>{n.nafn}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-white/40 w-16 shrink-0">Deadline:</span>
                          <input
                            type="date"
                            value={nsDeadline}
                            onChange={e => setNsDeadline(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowNyttSamskipti(false)}
                      className="px-4 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/70 transition-colors"
                    >
                      Hætta við
                    </button>
                    <button
                      onClick={addSamskipti}
                      disabled={!nsTitill.trim() || (nsSetjaVerkefni && !nsDeadline)}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                    >
                      Vista
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {samskipti.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-8">Engin samskipti skráð</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />
                  <div className="space-y-4">
                    {samskipti.map(s => {
                      const tegundData = SAMSKIPTI_TEGUNDIR.find(t => t.key === s.tegund);
                      const color = tegundData?.color ?? '#6b7280';
                      return (
                        <div key={s.id} className="relative pl-10 group">
                          <div
                            className="absolute left-2 top-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: color + '20' }}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke={color}
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d={tegundData?.icon ?? ''}
                              />
                            </svg>
                          </div>
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: color + '20', color }}
                                  >
                                    {tegundData?.label ?? s.tegund}
                                  </span>
                                  <h4 className="text-sm font-medium text-white">{s.titill}</h4>
                                </div>
                                {s.lysing && (
                                  <p className="text-xs text-white/50 mt-1.5 whitespace-pre-wrap">
                                    {s.lysing}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => deleteSamskipti(s.id)}
                                className="text-xs text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              >
                                ×
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/30 mt-2">
                              <span>{s.hofundur}</span>
                              <span>·</span>
                              <span>{formatDateTime(s.dagsetning)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[60] bg-green-500/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
