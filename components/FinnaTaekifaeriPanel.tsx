'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  findaSolutaekifaeri,
  formatCurrency,
  fyrirtaeki as enterpriseFyrirtaeki,
  type TaekifaeriTillaga,
  type TaekifaeriFlokkadar,
  type Solutaekifaeri,
} from '@/lib/enterprise-demo-data';
import StofnaTaekifaeriModal, { type TaekifaeriFormData } from './StofnaTaekifaeriModal';

interface BilaflottinnCompany {
  n: string; // nafn
  h: string; // heimilisfang
  p: string; // postnumer
  b: number; // bilar (count)
  f: Record<string, number>; // bilaflokkar
  d: string; // nyjasta dagsetning
}

interface Props {
  onClose: () => void;
  onStofnaTaekifaeri: (taekifaeri: Solutaekifaeri) => void;
}

type TabKey = 'crm' | 'bilaflottinn';
type SortKey = 'nafn' | 'bilar' | 'postnumer';
type SortDir = 'asc' | 'desc';

const POSTNUMER_SVAEDI: Record<string, string> = {
  '1': 'Höfuðborgarsvæðið',
  '2': 'Suðurnes / Reykjanes',
  '3': 'Vesturland',
  '4': 'Vestfirðir',
  '5': 'Norðurland vestra',
  '6': 'Norðurland eystra',
  '7': 'Austurland',
  '8': 'Suðurland',
  '9': 'Suðurland / Vestmannaeyjar',
};

const ESB_LABELS: Record<string, string> = {
  'Fólksbifreið (M1)': 'Fólksbíll',
  'Sendibifreið (N1)': 'Sendibíll',
  'Hópbifreið (M2)': 'Hópbíll',
  'Hópbifreið (M3)': 'Stór hópbíll',
  'Vörubifreið (N2)': 'Vörubíll',
  'Vörubifreið (N3)': 'Stór vörubíll',
  'Dráttarvél (T)': 'Dráttarvél',
  'Bifhjól (L)': 'Bifhjól',
};

const BILALEIGA_PATTERNS = [
  'bílaleig', 'bilaleig', 'car rental', 'rent a car',
  'höldur', 'holdur', 'procar', 'blue car',
  'hertz', 'avis', 'europcar', 'sixt', 'budget',
  'lotus car', 'go car', 'lava car', 'ice rental',
  'sad car', 'geysir car', 'reykjavik cars', 'mycar',
];

const PAGE_SIZE = 30;

export default function FinnaTaekifaeriPanel({ onClose, onStofnaTaekifaeri }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [tab, setTab] = useState<TabKey>('bilaflottinn');

  // CRM tab state
  const [flokkar, setFlokkar] = useState<TaekifaeriFlokkadar[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [stofnud, setStofnud] = useState<Set<string>>(new Set());
  const [openFlokkar, setOpenFlokkar] = useState<Set<string>>(new Set());

  // Bílaflottinn tab state
  const [bfData, setBfData] = useState<BilaflottinnCompany[]>([]);
  const [bfLoading, setBfLoading] = useState(true);
  const [bfSearch, setBfSearch] = useState('');
  const [bfSvaedi, setBfSvaedi] = useState('all');
  const [bfFlokkur, setBfFlokkur] = useState('all');
  const [bfMinBilar, setBfMinBilar] = useState(1);
  const [bfShowOnlyNew, setBfShowOnlyNew] = useState(false);
  const [bfHideBilaleigur, setBfHideBilaleigur] = useState(true);
  const [bfSort, setBfSort] = useState<SortKey>('bilar');
  const [bfSortDir, setBfSortDir] = useState<SortDir>('desc');
  const [bfPage, setBfPage] = useState(0);
  const [bfSelectedCompany, setBfSelectedCompany] = useState<BilaflottinnCompany | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<Partial<TaekifaeriFormData>>({});
  const [modalFyrirtaekiId, setModalFyrirtaekiId] = useState<string | undefined>();
  const [modalFyrirtaekiNafn, setModalFyrirtaekiNafn] = useState<string | undefined>();
  const [pendingStofnudKey, setPendingStofnudKey] = useState<string | null>(null);

  const enterpriseNames = useMemo(() =>
    new Set(enterpriseFyrirtaeki.map(f => f.nafn.toLowerCase())),
  []);

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
    fetch('/bilaflottinn-companies.json')
      .then(r => r.json())
      .then((data: BilaflottinnCompany[]) => {
        setBfData(data);
        setBfLoading(false);
      })
      .catch(() => setBfLoading(false));
  }, []);

  const loadCrmData = useCallback(() => {
    if (flokkar.length > 0) return;
    setCrmLoading(true);
    setTimeout(() => {
      const data = findaSolutaekifaeri();
      setFlokkar(data);
      setOpenFlokkar(new Set(data.map(f => f.flokkur)));
      setCrmLoading(false);
    }, 400);
  }, [flokkar.length]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose();
  }

  const toggleFlokkur = useCallback((flokkur: string) => {
    setOpenFlokkar(prev => {
      const next = new Set(prev);
      if (next.has(flokkur)) next.delete(flokkur);
      else next.add(flokkur);
      return next;
    });
  }, []);

  function handleStofna(tillaga: TaekifaeriTillaga) {
    setModalPrefill({
      titill: tillaga.titill,
      lysing: tillaga.lysing,
      verdmaeti: tillaga.aetladVerdmaeti,
      stig: 'lead',
      pipiTegund: tillaga.pipiTegund,
    });
    setModalFyrirtaekiId(tillaga.fyrirtaekiId);
    setModalFyrirtaekiNafn(tillaga.fyrirtaekiNafn);
    setPendingStofnudKey(tillaga.id);
    setModalOpen(true);
  }

  function handleStofnaFromBf(company: BilaflottinnCompany) {
    const mainType = Object.entries(company.f).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const isFleet = company.b >= 5;
    const est = company.b * (isFleet ? 85000 : 65000);
    setModalPrefill({
      titill: `${company.n} – ${isFleet ? 'Flotaleiga' : 'Langtímaleiga'} (${company.b} bílar)`,
      lysing: `Fyrirtæki úr bílaflotaskrá. ${company.b} skráð ökutæki (${mainType}). Heimilisfang: ${company.h}, ${company.p}.`,
      verdmaeti: est,
      stig: 'lead',
      pipiTegund: isFleet ? 'floti' : 'langtimaleiga',
    });
    setModalFyrirtaekiId(undefined);
    setModalFyrirtaekiNafn(company.n);
    setPendingStofnudKey(`bf-${company.n}`);
    setModalOpen(true);
  }

  function handleModalSuccess(taekifaeri: Solutaekifaeri) {
    onStofnaTaekifaeri(taekifaeri);
    if (pendingStofnudKey) {
      setStofnud(prev => new Set(prev).add(pendingStofnudKey));
      setPendingStofnudKey(null);
    }
  }

  const allFlokkar = useMemo(() => {
    const set = new Set<string>();
    bfData.forEach(c => Object.keys(c.f).forEach(k => set.add(k)));
    return Array.from(set).sort();
  }, [bfData]);

  const filteredBf = useMemo(() => {
    let result = bfData;

    if (bfSearch.trim()) {
      const q = bfSearch.trim().toLowerCase();
      result = result.filter(c => c.n.toLowerCase().includes(q) || c.h.toLowerCase().includes(q));
    }

    if (bfSvaedi !== 'all') {
      result = result.filter(c => c.p.startsWith(bfSvaedi));
    }

    if (bfFlokkur !== 'all') {
      result = result.filter(c => c.f[bfFlokkur]);
    }

    if (bfMinBilar > 1) {
      result = result.filter(c => c.b >= bfMinBilar);
    }

    if (bfShowOnlyNew) {
      result = result.filter(c => !enterpriseNames.has(c.n.toLowerCase()));
    }

    if (bfHideBilaleigur) {
      result = result.filter(c => {
        const lower = c.n.toLowerCase();
        return !BILALEIGA_PATTERNS.some(p => lower.includes(p));
      });
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (bfSort) {
        case 'nafn': cmp = a.n.localeCompare(b.n, 'is'); break;
        case 'bilar': cmp = a.b - b.b; break;
        case 'postnumer': cmp = a.p.localeCompare(b.p); break;
      }
      return bfSortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [bfData, bfSearch, bfSvaedi, bfFlokkur, bfMinBilar, bfShowOnlyNew, bfHideBilaleigur, bfSort, bfSortDir, enterpriseNames]);

  useEffect(() => setBfPage(0), [bfSearch, bfSvaedi, bfFlokkur, bfMinBilar, bfShowOnlyNew, bfHideBilaleigur, bfSort, bfSortDir]);

  const pagedBf = useMemo(() => {
    const start = bfPage * PAGE_SIZE;
    return filteredBf.slice(start, start + PAGE_SIZE);
  }, [filteredBf, bfPage]);

  const totalPages = Math.ceil(filteredBf.length / PAGE_SIZE);

  const totalBilar = useMemo(() => filteredBf.reduce((s, c) => s + c.b, 0), [filteredBf]);

  const toggleBfSort = (key: SortKey) => {
    if (bfSort === key) setBfSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setBfSort(key); setBfSortDir(key === 'nafn' ? 'asc' : 'desc'); }
  };

  const isEnterprise = (name: string) => enterpriseNames.has(name.toLowerCase());

  const totalTillogur = flokkar.reduce((s, f) => s + f.tillogur.length, 0);

  return (
    <>
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-200 ${isVisible ? 'bg-black/60' : 'bg-black/0'}`}
    >
      <div className={`w-full max-w-3xl h-full overflow-y-auto bg-[#0f1117] border-l border-white/10 shadow-2xl transition-transform duration-200 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f1117] border-b border-white/5">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Finna ný tækifæri</h2>
              <p className="text-sm text-white/40 mt-0.5">Leita í bílaflotaskrá og CRM gögnum</p>
            </div>
            <button onClick={handleClose} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Tabs */}
          <div className="flex px-6 gap-1 border-t border-white/5">
            <button
              onClick={() => setTab('bilaflottinn')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'bilaflottinn' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/60'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Bílaflotaskrá
              {!bfLoading && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">{bfData.length.toLocaleString('is-IS')}</span>}
            </button>
            <button
              onClick={() => { setTab('crm'); loadCrmData(); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'crm' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/40 hover:text-white/60'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              CRM greining
              {totalTillogur > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400">{totalTillogur}</span>}
            </button>
          </div>
        </div>

        {/* ═══ Bílaflottinn Tab ═══ */}
        {tab === 'bilaflottinn' && (
          <div className="px-6 py-5 space-y-4">
            {bfLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm text-white/50">Hleð bílaflotaskrá...</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Leita að fyrirtæki eða heimilisfangi..."
                    value={bfSearch}
                    onChange={e => setBfSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select value={bfSvaedi} onChange={e => setBfSvaedi(e.target.value)} className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]">
                    <option value="all">Öll svæði</option>
                    {Object.entries(POSTNUMER_SVAEDI).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  <select value={bfFlokkur} onChange={e => setBfFlokkur(e.target.value)} className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]">
                    <option value="all">Allar tegundir</option>
                    {allFlokkar.map(f => (
                      <option key={f} value={f}>{ESB_LABELS[f] || f}</option>
                    ))}
                  </select>

                  <select value={bfMinBilar} onChange={e => setBfMinBilar(Number(e.target.value))} className="px-3 py-2 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark]">
                    <option value={1}>1+ bílar</option>
                    <option value={2}>2+ bílar</option>
                    <option value={3}>3+ bílar</option>
                    <option value={5}>5+ bílar</option>
                    <option value={10}>10+ bílar</option>
                    <option value={20}>20+ bílar</option>
                    <option value={50}>50+ bílar</option>
                  </select>

                  <button
                    onClick={() => setBfShowOnlyNew(!bfShowOnlyNew)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${bfShowOnlyNew ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70'}`}
                  >
                    {bfShowOnlyNew ? '✓ Aðeins ný' : 'Aðeins ný fyrirtæki'}
                  </button>

                  <button
                    onClick={() => setBfHideBilaleigur(!bfHideBilaleigur)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${bfHideBilaleigur ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/5 text-white/50 hover:text-white/70'}`}
                  >
                    {bfHideBilaleigur ? '✓ Án bílaleiga' : 'Fela bílaleigur'}
                  </button>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-3">
                    <span>{filteredBf.length.toLocaleString('is-IS')} fyrirtæki</span>
                    <span className="text-white/20">·</span>
                    <span>{totalBilar.toLocaleString('is-IS')} ökutæki samtals</span>
                  </div>
                  {(bfSearch || bfSvaedi !== 'all' || bfFlokkur !== 'all' || bfMinBilar > 1 || bfShowOnlyNew || !bfHideBilaleigur) && (
                    <button
                      onClick={() => { setBfSearch(''); setBfSvaedi('all'); setBfFlokkur('all'); setBfMinBilar(1); setBfShowOnlyNew(false); setBfHideBilaleigur(true); }}
                      className="text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Hreinsa síur
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="text-left px-4 py-2.5">
                          <button onClick={() => toggleBfSort('nafn')} className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors ${bfSort === 'nafn' ? 'text-blue-400' : 'text-white/40 hover:text-white/60'}`}>
                            Fyrirtæki
                            {bfSort === 'nafn' && <SortArrow dir={bfSortDir} />}
                          </button>
                        </th>
                        <th className="text-left px-4 py-2.5 hidden sm:table-cell">
                          <button onClick={() => toggleBfSort('postnumer')} className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors ${bfSort === 'postnumer' ? 'text-blue-400' : 'text-white/40 hover:text-white/60'}`}>
                            Svæði
                            {bfSort === 'postnumer' && <SortArrow dir={bfSortDir} />}
                          </button>
                        </th>
                        <th className="text-right px-4 py-2.5">
                          <button onClick={() => toggleBfSort('bilar')} className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ml-auto transition-colors ${bfSort === 'bilar' ? 'text-blue-400' : 'text-white/40 hover:text-white/60'}`}>
                            Bílar
                            {bfSort === 'bilar' && <SortArrow dir={bfSortDir} />}
                          </button>
                        </th>
                        <th className="text-center px-4 py-2.5 w-10">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Staða</span>
                        </th>
                        <th className="px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {pagedBf.map(c => {
                        const existing = isEnterprise(c.n);
                        const created = stofnud.has(`bf-${c.n}`);
                        return (
                          <tr
                            key={c.n}
                            onClick={() => setBfSelectedCompany(bfSelectedCompany?.n === c.n ? null : c)}
                            className={`border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors ${bfSelectedCompany?.n === c.n ? 'bg-blue-500/5' : ''}`}
                          >
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-white/80 text-sm truncate max-w-[240px]">{c.n}</div>
                              <div className="text-[10px] text-white/30 truncate max-w-[240px] sm:hidden">{c.h}</div>
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <div className="text-xs text-white/50 truncate max-w-[140px]">{c.h}</div>
                              <div className="text-[10px] text-white/30">{c.p}</div>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`text-sm font-bold ${c.b >= 10 ? 'text-blue-400' : c.b >= 3 ? 'text-white/70' : 'text-white/40'}`}>
                                {c.b}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {existing ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium whitespace-nowrap" title="Þegar í viðskiptum">Viðskiptavinur</span>
                              ) : created ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium whitespace-nowrap">Stofnað</span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400/60 font-medium whitespace-nowrap">Nýtt</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <svg className={`w-4 h-4 text-white/15 transition-transform ${bfSelectedCompany?.n === c.n ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {pagedBf.length === 0 && (
                    <div className="py-10 text-center text-sm text-white/30">Engin fyrirtæki fundust með þessum síum.</div>
                  )}

                  {/* Detail Row */}
                  {bfSelectedCompany && (
                    <CompanyDetail
                      company={bfSelectedCompany}
                      isExisting={isEnterprise(bfSelectedCompany.n)}
                      isCreated={stofnud.has(`bf-${bfSelectedCompany.n}`)}
                      onStofna={() => handleStofnaFromBf(bfSelectedCompany)}
                    />
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setBfPage(p => Math.max(0, p - 1))}
                      disabled={bfPage === 0}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Fyrri
                    </button>
                    <span className="text-xs text-white/30">
                      Síða {bfPage + 1} af {totalPages}
                    </span>
                    <button
                      onClick={() => setBfPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={bfPage >= totalPages - 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Næsta →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ CRM Tab ═══ */}
        {tab === 'crm' && (
          <div className="px-6 py-5 space-y-4">
            {crmLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-sm text-white/50">Greini CRM gögn...</p>
              </div>
            ) : totalTillogur === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/50">Engar tillögur fundust í núverandi gögnum.</p>
              </div>
            ) : (
              flokkar.map(flokkur => (
                <div key={flokkur.flokkur} className="rounded-xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => toggleFlokkur(flokkur.flokkur)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: flokkur.color + '20' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={flokkur.color} strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={flokkur.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-semibold text-white">{flokkur.label}</span>
                      <span className="text-xs text-white/40 ml-2">({flokkur.tillogur.length})</span>
                    </div>
                    <svg className={`w-4 h-4 text-white/30 transition-transform duration-200 ${openFlokkar.has(flokkur.flokkur) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFlokkar.has(flokkur.flokkur) && (
                    <div className="px-4 pb-3 space-y-2">
                      {flokkur.tillogur.map(tillaga => {
                        const erStofnud = stofnud.has(tillaga.id);
                        return (
                          <div key={tillaga.id} className={`rounded-lg border p-4 transition-colors ${erStofnud ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                {tillaga.fyrirtaekiNafn && (
                                  <p className="text-xs font-medium text-white/40 mb-0.5 uppercase tracking-wider">{tillaga.fyrirtaekiNafn}</p>
                                )}
                                <h4 className="text-sm font-semibold text-white truncate">{tillaga.titill}</h4>
                                <p className="text-xs text-white/50 mt-1 line-clamp-2">{tillaga.lysing}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs font-medium" style={{ color: flokkur.color }}>~{formatCurrency(tillaga.aetladVerdmaeti)}/ár</span>
                                  <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5">{tillaga.pipiTegund}</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {erStofnud ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium px-3 py-1.5 rounded-lg bg-green-500/10">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    Stofnað
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStofna(tillaga)}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                    style={{ backgroundColor: flokkur.color + '30', color: flokkur.color }}
                                  >
                                    Stofna tækifæri
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
    <StofnaTaekifaeriModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      onSuccess={handleModalSuccess}
      prefillData={modalPrefill}
      fyrirtaekiId={modalFyrirtaekiId}
      fyrirtaekiNafn={modalFyrirtaekiNafn}
    />
    </>
  );
}

function SortArrow({ dir }: { dir: SortDir }) {
  return (
    <svg className={`w-3 h-3 transition-transform ${dir === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CompanyDetail({ company, isExisting, isCreated, onStofna }: {
  company: BilaflottinnCompany;
  isExisting: boolean;
  isCreated: boolean;
  onStofna: () => void;
}) {
  const flokkar = Object.entries(company.f).sort((a, b) => b[1] - a[1]);
  const totalBilar = flokkar.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="border-t border-blue-500/20 bg-blue-500/[0.03] px-5 py-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{company.n}</h3>
          <p className="text-xs text-white/40 mt-0.5">{company.h}{company.p ? `, ${company.p}` : ''}</p>
        </div>
        {isExisting ? (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 font-medium">Þegar viðskiptavinur</span>
        ) : isCreated ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium px-3 py-1.5 rounded-lg bg-green-500/10">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Tækifæri stofnað
          </span>
        ) : (
          <button
            onClick={onStofna}
            className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            Stofna sölutækifæri
          </button>
        )}
      </div>

      {/* Vehicle breakdown */}
      <div>
        <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">Ökutæki ({totalBilar})</div>
        <div className="flex flex-wrap gap-2">
          {flokkar.map(([flokkur, count]) => {
            const pct = Math.round((count / totalBilar) * 100);
            return (
              <div key={flokkur} className="bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                <div className="text-xs font-medium text-white/70">{ESB_LABELS[flokkur] || flokkur}</div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-sm font-bold text-blue-400">{count}</span>
                  <span className="text-[10px] text-white/30">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual bar */}
      <div className="flex rounded-full overflow-hidden h-2 bg-white/5">
        {flokkar.map(([flokkur, count], i) => {
          const pct = (count / totalBilar) * 100;
          const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
          return (
            <div
              key={flokkur}
              className="transition-all first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
              title={`${ESB_LABELS[flokkur] || flokkur}: ${count}`}
            />
          );
        })}
      </div>

      {!isExisting && !isCreated && (
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="text-[10px] text-white/40">
            {company.b >= 10
              ? `Stórt fyrirtæki með ${company.b} skráð ökutæki – mikil sölumöguleiki í flotaleiguþjónustu.`
              : company.b >= 3
                ? `Meðalstórt fyrirtæki – mögulegt markmið fyrir langtímaleigusamning.`
                : `Lítið fyrirtæki – gæti hentað í einstaklingssamning.`
            }
          </div>
        </div>
      )}
    </div>
  );
}
