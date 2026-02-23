'use client';

import { useState, useCallback } from 'react';
import {
  solutaekifaeri as solutaekifaeriData,
  getFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  type Solutaekifaeri,
} from '@/lib/enterprise-demo-data';
import FinnaTaekifaeriPanel from '@/components/FinnaTaekifaeriPanel';
import StofnaTaekifaeriModal from '@/components/StofnaTaekifaeriModal';
import { useEnterpriseTheme } from '@/components/enterprise-theme-provider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

type ViewMode = 'kanban' | 'pie' | 'table';

const VIEW_OPTIONS: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'kanban', label: 'Kanban', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7' },
  { key: 'pie', label: 'Gröf', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
  { key: 'table', label: 'Tafla', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
];

const PIPELINE_COLUMNS: { stig: Solutaekifaeri['stig']; label: string; accent: string; icon: string }[] = [
  { stig: 'lead', label: 'Ný tækifæri', accent: '#3b82f6', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { stig: 'tilboð sent', label: 'Tilboð sent', accent: '#f59e0b', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { stig: 'samningur í vinnslu', label: 'Samningur í vinnslu', accent: '#8b5cf6', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { stig: 'lokað unnið', label: 'Lokað unnið', accent: '#22c55e', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { stig: 'lokað tapað', label: 'Lokað tapað', accent: '#ef4444', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

interface SalesTeamMember {
  id: string;
  nafn: string;
  titill: string;
  litur: string;
  initials: string;
}

const SALES_TEAM: SalesTeamMember[] = [
  { id: 'st1', nafn: 'Anna Sigríður', titill: 'Sölustjóri', litur: '#8b5cf6', initials: 'AS' },
  { id: 'st2', nafn: 'Kristján Már', titill: 'Söluráðgjafi', litur: '#3b82f6', initials: 'KM' },
  { id: 'st3', nafn: 'Sigurður Helgi', titill: 'Söluráðgjafi', litur: '#22c55e', initials: 'SH' },
  { id: 'st4', nafn: 'Helgi Björn', titill: 'Þjónustustjóri', litur: '#f59e0b', initials: 'HB' },
];

const OPPORTUNITY_OWNERS: Record<string, string> = {
  'so1': 'st2',
  'so2': 'st3',
  'so3': 'st1',
  'so4': 'st4',
  'so5': 'st1',
};

function getOwner(stId: string): SalesTeamMember | undefined {
  const ownerId = OPPORTUNITY_OWNERS[stId];
  return SALES_TEAM.find(m => m.id === ownerId);
}

function getDaysInStage(dagsetning: string): number {
  const created = new Date(dagsetning);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(naestiKontaktur: string): boolean {
  return new Date(naestiKontaktur) < new Date();
}

type Hitastig = 'heitt' | 'volgt' | 'kalt';

interface MarkhópurDef {
  key: string;
  label: string;
  color: string;
}

const DEFAULT_MARKHÓPAR: MarkhópurDef[] = [
  { key: 'flotakaupendur', label: 'Flotakaupendur', color: '#8b5cf6' },
  { key: 'langtímaleiga', label: 'Langtímaleiga', color: '#3b82f6' },
  { key: 'nýir_viðskiptavinir', label: 'Nýir viðskiptavinir', color: '#22c55e' },
  { key: 'endurnýjun', label: 'Endurnýjun', color: '#f59e0b' },
  { key: 'rafbílavæðing', label: 'Rafbílavæðing', color: '#06b6d4' },
];

const MARKHÓPUR_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const HITASTIG_OPTIONS: { key: Hitastig; label: string; color: string }[] = [
  { key: 'heitt', label: 'Heitt', color: '#ef4444' },
  { key: 'volgt', label: 'Volgt', color: '#f59e0b' },
  { key: 'kalt', label: 'Kalt', color: '#3b82f6' },
];

const VIP_COLOR = '#8b5cf6';

interface LeadTagState {
  [solutaekifaeriId: string]: {
    markhopar: string[];
    hitastig: Hitastig;
    vip: boolean;
    postlistar: string[];
  };
}

interface SimtalsSkraning {
  dagsetning: string;
  nidurstada: 'svarað' | 'ekki_svarað' | 'skilaboð' | 'aftur_seinna';
  athugasemdir: string;
  naestuSkref: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SolutaekifaeriPage() {
  const { theme } = useEnterpriseTheme();
  const isLight = theme === 'light';
  const [soList, setSoList] = useState<Solutaekifaeri[]>(solutaekifaeriData);
  const [selectedST, setSelectedST] = useState<Solutaekifaeri | null>(null);
  const [activePanel, setActivePanel] = useState<'detail' | 'email' | 'sima' | null>(null);
  const [showFinnaTaekifaeri, setShowFinnaTaekifaeri] = useState(false);
  const [showStofnaModal, setShowStofnaModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  type ActiveFilter = 'none' | 'opin' | 'unnid' | 'overdue' | 'eldest';
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('none');
  const [markhópar, setMarkhópar] = useState<MarkhópurDef[]>(DEFAULT_MARKHÓPAR);
  const [leadTags, setLeadTags] = useState<LeadTagState>(() => {
    const initial: LeadTagState = {};
    solutaekifaeriData.forEach(s => {
      initial[s.id] = {
        markhopar: s.stig === 'lead' ? ['nýir_viðskiptavinir'] : s.pipiTegund === 'floti' ? ['flotakaupendur'] : ['langtímaleiga'],
        hitastig: s.stig === 'lead' ? 'volgt' : s.stig === 'tilboð sent' ? 'heitt' : 'volgt',
        vip: false,
        postlistar: [],
      };
    });
    return initial;
  });

  const opinSolutaekifaeri = soList.filter(s => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið');
  const pipalineVerdmaeti = opinSolutaekifaeri.reduce((sum, s) => sum + s.verdmaeti, 0);

  const filteredSoList = (() => {
    switch (activeFilter) {
      case 'opin': return opinSolutaekifaeri;
      case 'unnid': return soList.filter(s => s.stig === 'lokað unnið');
      case 'overdue': return opinSolutaekifaeri.filter(s => isOverdue(s.naestiKontaktur));
      case 'eldest': return [...opinSolutaekifaeri].sort((a, b) => getDaysInStage(b.dagsetning) - getDaysInStage(a.dagsetning));
      default: return soList;
    }
  })();

  const toggleMarkhópur = (stId: string, mk: string) => {
    setLeadTags(prev => {
      const cur = prev[stId]?.markhopar || [];
      return { ...prev, [stId]: { ...prev[stId], markhopar: cur.includes(mk) ? cur.filter(m => m !== mk) : [...cur, mk] } };
    });
  };

  const addMarkhópur = useCallback((label: string) => {
    const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-záðéíóúýþæö_]/gi, '');
    if (markhópar.some(m => m.key === key)) return;
    const color = MARKHÓPUR_COLORS[markhópar.length % MARKHÓPUR_COLORS.length];
    setMarkhópar(prev => [...prev, { key, label, color }]);
  }, [markhópar]);

  const removeMarkhópur = useCallback((key: string) => {
    setMarkhópar(prev => prev.filter(m => m.key !== key));
    setLeadTags(prev => {
      const next = { ...prev };
      for (const id in next) {
        next[id] = { ...next[id], markhopar: next[id].markhopar.filter(mk => mk !== key) };
      }
      return next;
    });
  }, []);

  const editMarkhópur = useCallback((key: string, newLabel: string) => {
    setMarkhópar(prev => prev.map(m => m.key === key ? { ...m, label: newLabel } : m));
  }, []);

  const setHitastig = (stId: string, hs: Hitastig) => {
    setLeadTags(prev => ({
      ...prev,
      [stId]: { ...prev[stId], hitastig: hs },
    }));
  };

  const toggleVip = (stId: string) => {
    setLeadTags(prev => ({
      ...prev,
      [stId]: { ...prev[stId], vip: !prev[stId]?.vip },
    }));
  };

  const togglePostlisti = (stId: string, lista: string) => {
    setLeadTags(prev => {
      const cur = prev[stId]?.postlistar || [];
      return { ...prev, [stId]: { ...prev[stId], postlistar: cur.includes(lista) ? cur.filter(p => p !== lista) : [...cur, lista] } };
    });
  };

  const [editingST, setEditingST] = useState<Solutaekifaeri | null>(null);
  const [deletingST, setDeletingST] = useState<Solutaekifaeri | null>(null);

  const openDetail = (s: Solutaekifaeri) => { setSelectedST(s); setActivePanel('detail'); };
  const openEmail = (s: Solutaekifaeri) => { setSelectedST(s); setActivePanel('email'); };
  const openSima = (s: Solutaekifaeri) => { setSelectedST(s); setActivePanel('sima'); };
  const closePanel = useCallback(() => { setActivePanel(null); setSelectedST(null); }, []);

  const handleEyda = useCallback((st: Solutaekifaeri) => {
    setSoList(prev => prev.filter(s => s.id !== st.id));
    setLeadTags(prev => {
      const next = { ...prev };
      delete next[st.id];
      return next;
    });
    if (selectedST?.id === st.id) closePanel();
    setDeletingST(null);
  }, [selectedST, closePanel]);

  const handleBreyta = useCallback((updated: Solutaekifaeri) => {
    setSoList(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (selectedST?.id === updated.id) setSelectedST(updated);
    setEditingST(null);
  }, [selectedST]);

  const handleStofnaTaekifaeri = useCallback((nyttST: Solutaekifaeri) => {
    setSoList(prev => [...prev, nyttST]);
    setLeadTags(prev => ({
      ...prev,
      [nyttST.id]: {
        markhopar: ['nýir_viðskiptavinir'],
        hitastig: 'volgt',
        vip: false,
        postlistar: [],
      },
    }));
  }, []);

  const totalVerdmaeti = soList.reduce((sum, s) => sum + s.verdmaeti, 0);
  const wonVerdmaeti = soList.filter(s => s.stig === 'lokað unnið').reduce((sum, s) => sum + s.verdmaeti, 0);
  const winRate = totalVerdmaeti > 0 ? Math.round((wonVerdmaeti / totalVerdmaeti) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className={`enterprise-hero-gradient relative overflow-hidden rounded-2xl border ${isLight ? 'border-gray-200 shadow-sm' : 'border-white/5'}`} style={{ background: isLight ? 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)' : 'linear-gradient(135deg, #0f1729 0%, #1a1040 50%, #0f1729 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, #8b5cf6 0%, transparent 50%)' }} />
        <div className="relative px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Sölurás</h1>
              </div>
              <p className={`text-sm ml-[52px] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>Sölutækifæri, herferðir og viðskiptaþróun</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFinnaTaekifaeri(true)}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Finna ný tækifæri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Actionable KPIs */}
      {(() => {
        const overdueItems = opinSolutaekifaeri.filter(s => isOverdue(s.naestiKontaktur));
        const avgDays = opinSolutaekifaeri.length > 0
          ? Math.round(opinSolutaekifaeri.reduce((sum, s) => sum + getDaysInStage(s.dagsetning), 0) / opinSolutaekifaeri.length)
          : 0;

        const statCards: { id: ActiveFilter; label: string; value: string | number; sub: string; color: string; glowColor: string; iconPath: string; highlight?: boolean; suffix?: string }[] = [
          {
            id: 'opin', label: 'Verðmæti í rás', value: formatCurrency(pipalineVerdmaeti),
            sub: `${opinSolutaekifaeri.length} opin tækifæri`, color: '#22c55e', glowColor: '#22c55e',
            iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          },
          {
            id: 'unnid', label: 'Sigurhlutfall', value: `${winRate}%`,
            sub: `${formatCurrency(wonVerdmaeti)} unnið`, color: '#3b82f6', glowColor: '#3b82f6',
            iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
          },
          {
            id: 'eldest', label: 'Meðalaldur deals', value: avgDays,
            sub: 'Meðaltími í sölurás', color: '#8b5cf6', glowColor: '#8b5cf6',
            iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', suffix: 'dagar',
          },
          {
            id: 'overdue', label: 'Þarfnast athygli', value: overdueItems.length,
            sub: overdueItems.length > 0 ? 'Tímafrestur liðinn' : 'Allt á hreinu',
            color: overdueItems.length > 0 ? '#ef4444' : '#f59e0b',
            glowColor: overdueItems.length > 0 ? '#ef4444' : '#f59e0b',
            iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            highlight: overdueItems.length > 0,
          },
        ];

        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(card => {
                const isActive = activeFilter === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setActiveFilter(prev => prev === card.id ? 'none' : card.id)}
                    className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] text-left ${
                      isActive
                        ? 'ring-2 ring-offset-1 ring-offset-transparent'
                        : card.highlight
                          ? isLight ? 'border-red-200' : 'border-red-500/20'
                          : isLight ? 'border-gray-200' : 'border-white/5'
                    }`}
                    style={{
                      background: isLight
                        ? (card.highlight ? '#fff5f5' : '#ffffff')
                        : (card.highlight
                          ? 'linear-gradient(135deg, #1a1222 0%, #1c0f1f 100%)'
                          : 'linear-gradient(135deg, #161822 0%, #0f1729 100%)'),
                      ...(isActive ? { ringColor: card.color, borderColor: card.color + '60' } : {}),
                      borderColor: isActive ? card.color + '60' : undefined,
                      ...(isLight && !isActive ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : {}),
                    }}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: card.color + '20' }}>
                        <svg className="w-3 h-3" style={{ color: card.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6" style={{ background: `radial-gradient(circle, ${card.glowColor}, transparent)` }} />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color + '15' }}>
                          <svg className="w-4 h-4" style={{ color: card.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={card.iconPath} />
                          </svg>
                        </div>
                        <span className={`text-[11px] font-medium uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-white/40'}`}>{card.label}</span>
                      </div>
                      <div className="text-xl font-bold mb-1" style={{ color: card.color }}>
                        {card.value}
                        {card.suffix && <span className={`text-sm font-normal ml-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{card.suffix}</span>}
                      </div>
                      <div className={`text-[11px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{card.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {activeFilter !== 'none' && (
              <div className="flex items-center gap-2 px-1">
                <span className={`text-[11px] ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                  Sýnir: <span className={`font-medium ${isLight ? 'text-gray-700' : 'text-white/70'}`}>
                    {activeFilter === 'opin' ? 'Opin tækifæri' : activeFilter === 'unnid' ? 'Unnin tækifæri' : activeFilter === 'eldest' ? 'Raðað eftir aldri' : 'Tímafrestur liðinn'}
                  </span>
                  <span className={isLight ? 'text-gray-400' : 'text-white/30'}> · {filteredSoList.length} tækifæri</span>
                </span>
                <button
                  onClick={() => setActiveFilter('none')}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${isLight ? 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200' : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'}`}
                >
                  Hreinsa filter
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Pipeline Funnel + Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Funnel */}
        <div className={`lg:col-span-2 rounded-xl border px-5 py-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#161822] border-white/5'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Sölurás</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-white/40'}`}>{filteredSoList.length} tækifæri</span>
            </div>
          </div>
          <div className="space-y-2">
            {PIPELINE_COLUMNS.filter(col => col.stig !== 'lokað tapað').map((col, idx, arr) => {
              const items = filteredSoList.filter(s => s.stig === col.stig);
              const colValue = items.reduce((sum, s) => sum + s.verdmaeti, 0);
              const maxCount = Math.max(...arr.map(c => filteredSoList.filter(s => s.stig === c.stig).length), 1);
              const barWidth = Math.max((items.length / maxCount) * 100, 8);
              const nextCol = arr[idx + 1];
              const nextCount = nextCol ? filteredSoList.filter(s => s.stig === nextCol.stig).length : 0;
              const conversionRate = items.length > 0 && nextCol ? Math.round((nextCount / items.length) * 100) : null;

              return (
                <div key={col.stig}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: col.accent + '15' }}>
                      <svg className="w-3.5 h-3.5" style={{ color: col.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={col.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${isLight ? 'text-gray-700' : 'text-white/70'}`}>{col.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: col.accent + '15', color: col.accent }}>{items.length}</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400/80">{formatCurrency(colValue)}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, backgroundColor: col.accent }} />
                      </div>
                    </div>
                  </div>
                  {conversionRate !== null && (
                    <div className="flex items-center gap-2 ml-10 my-1">
                      <svg className={`w-3 h-3 ${isLight ? 'text-gray-300' : 'text-white/15'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/25'}`}>{conversionRate}% umbreyting</span>
                    </div>
                  )}
                </div>
              );
            })}
            {(() => {
              const lostItems = filteredSoList.filter(s => s.stig === 'lokað tapað');
              const lostCol = PIPELINE_COLUMNS.find(c => c.stig === 'lokað tapað');
              if (!lostCol || lostItems.length === 0) return null;
              return (
                <div className={`flex items-center gap-3 pt-2 mt-1 border-t ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: lostCol.accent + '15' }}>
                    <svg className="w-3.5 h-3.5" style={{ color: lostCol.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={lostCol.icon} />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-white/40'}`}>{lostCol.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: lostCol.accent + '15', color: lostCol.accent }}>{lostItems.length}</span>
                    <span className="text-xs text-red-400/60">{formatCurrency(lostItems.reduce((s, i) => s + i.verdmaeti, 0))}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Team Overview */}
        <div className={`rounded-xl border px-5 py-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#161822] border-white/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Söluliðið</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-white/40'}`}>{SALES_TEAM.length}</span>
          </div>
          <div className="space-y-3">
            {SALES_TEAM.map(member => {
              const memberOpps = soList.filter(s => OPPORTUNITY_OWNERS[s.id] === member.id);
              const memberOpen = memberOpps.filter(s => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið');
              const memberValue = memberOpen.reduce((sum, s) => sum + s.verdmaeti, 0);
              const memberOverdue = memberOpen.filter(s => isOverdue(s.naestiKontaktur));
              return (
                <div key={member.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${member.litur}, ${member.litur}aa)` }}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium truncate ${isLight ? 'text-gray-700' : 'text-white/80'}`}>{member.nafn}</span>
                      {memberOverdue.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 font-medium">{memberOverdue.length} seinkar</span>
                      )}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{member.titill}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-emerald-400/80">{formatCurrency(memberValue)}</div>
                    <div className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{memberOpen.length} opin</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Actions */}
      {(() => {
        const upcoming = [...opinSolutaekifaeri]
          .sort((a, b) => new Date(a.naestiKontaktur).getTime() - new Date(b.naestiKontaktur).getTime())
          .slice(0, 4);
        if (upcoming.length === 0) return null;
        return (
          <div className={`rounded-xl border px-5 py-4 ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#161822] border-white/5'}`}>
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Næstu aðgerðir</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {upcoming.map(s => {
                const f = getFyrirtaeki(s.fyrirtaekiId);
                const owner = getOwner(s.id);
                const overdue = isOverdue(s.naestiKontaktur);
                const col = PIPELINE_COLUMNS.find(c => c.stig === s.stig);
                return (
                  <div
                    key={s.id}
                    onClick={() => openDetail(s)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                      isLight
                        ? `hover:shadow-md ${overdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'}`
                        : `hover:shadow-lg hover:shadow-black/20 ${overdue ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/5 bg-white/[0.02]'}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${overdue ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {overdue ? 'Tímafrestur liðinn' : formatDate(s.naestiKontaktur)}
                      </span>
                      {col && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accent }} />}
                    </div>
                    <div className={`text-xs font-medium truncate mb-0.5 ${isLight ? 'text-gray-800' : 'text-white/80'}`}>{s.titill}</div>
                    <div className={`text-[10px] truncate mb-2 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{f?.nafn}</div>
                    {owner && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: owner.litur }}>
                          {owner.initials}
                        </div>
                        <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{owner.nafn}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Pipeline Views */}
      <div className={`rounded-xl border overflow-hidden ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#161822] border-white/5'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isLight ? 'text-gray-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h2 className={`text-sm font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Sölurás</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStofnaModal(true)}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
            >
              <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Stofna nýtt
            </button>
            <div className={`flex items-center gap-1 rounded-lg p-1 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
              {VIEW_OPTIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                    viewMode === v.key
                      ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400 shadow-sm'
                      : isLight ? 'text-gray-400 hover:text-gray-600 hover:bg-white/60' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.icon} />
                  </svg>
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-3 p-4">
            {PIPELINE_COLUMNS.map((col, colIdx) => {
              const items = filteredSoList.filter(s => s.stig === col.stig);
              const colValue = items.reduce((sum, s) => sum + s.verdmaeti, 0);
              return (
                <div
                  key={col.stig}
                  className="flex-shrink-0 w-[260px] flex flex-col rounded-xl overflow-hidden transition-all duration-300"
                  style={{
                    background: `linear-gradient(180deg, ${col.accent}08 0%, transparent 40%)`,
                    border: `1px solid ${col.accent}15`,
                  }}
                >
                  {/* Column header */}
                  <div className="px-3.5 py-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: col.accent + '15' }}>
                      <svg className="w-3.5 h-3.5" style={{ color: col.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={col.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{col.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: col.accent + '15', color: col.accent }}>{items.length}</span>
                      </div>
                      {items.length > 0 && (
                        <div className={`text-[10px] mt-0.5 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{formatCurrency(colValue)}</div>
                      )}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 min-h-[100px] px-2 pb-2 space-y-2 overflow-y-auto max-h-[500px]">
                    {items.map((s, idx) => {
                      const f = getFyrirtaeki(s.fyrirtaekiId);
                      const tags = leadTags[s.id];
                      const owner = getOwner(s.id);
                      const days = getDaysInStage(s.dagsetning);
                      const overdue = isOverdue(s.naestiKontaktur);
                      const tengiliður = f?.tengiliðir.find(t => t.id === s.tengiliðurId);
                      return (
                        <div
                          key={s.id}
                          onClick={() => openDetail(s)}
                          className={`group rounded-xl p-3.5 border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                            isLight
                              ? `bg-white hover:shadow-md ${overdue ? 'border-red-200 hover:border-red-300' : 'border-gray-200 hover:border-gray-300'}`
                              : `bg-[#161822] hover:shadow-lg hover:shadow-black/20 ${overdue ? 'border-red-500/20 hover:border-red-500/30' : 'border-white/5 hover:border-white/15'}`
                          }`}
                          style={{
                            animationDelay: `${colIdx * 60 + idx * 40}ms`,
                          }}
                        >
                          {/* Overdue warning */}
                          {overdue && (
                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-red-400 bg-red-500/10 rounded-md px-2 py-1 mb-2">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" /></svg>
                              Tímafrestur liðinn
                            </div>
                          )}

                          {/* Title & company */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate leading-tight ${isLight ? 'text-gray-800' : 'text-white'}`}>{s.titill}</div>
                              <div className={`text-[11px] mt-0.5 flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-white/40'}`}>
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: col.accent + '20', color: col.accent }}>
                                  {f?.nafn?.charAt(0) || '?'}
                                </span>
                                <span className="truncate">{f?.nafn}</span>
                              </div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md shrink-0 ${isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-white/30'}`}>{days}d</span>
                          </div>

                          {/* Contact person */}
                          {tengiliður && (
                            <div className={`text-[10px] mb-2 flex items-center gap-1 ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
                              <svg className={`w-3 h-3 ${isLight ? 'text-gray-300' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span className="truncate">{tengiliður.nafn} · {tengiliður.titill}</span>
                            </div>
                          )}

                          {/* Value + next contact */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-bold text-emerald-400">{formatCurrency(s.verdmaeti)}</div>
                            <div className={`flex items-center gap-1 text-[10px] ${overdue ? 'text-red-400' : isLight ? 'text-gray-400' : 'text-white/30'}`}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{formatDate(s.naestiKontaktur)}</span>
                            </div>
                          </div>

                          {/* Tags + Owner */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-wrap gap-1">
                              {tags && (() => {
                                const hsData = HITASTIG_OPTIONS.find(h => h.key === tags.hitastig);
                                return hsData ? <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: hsData.color + '15', color: hsData.color }}>{hsData.label}</span> : null;
                              })()}
                              {tags?.vip && <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: VIP_COLOR + '15', color: VIP_COLOR }}>VIP</span>}
                              {tags?.markhopar.slice(0, 1).map(mk => {
                                const mkData = markhópar.find(m => m.key === mk);
                                return mkData ? <span key={mk} className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: mkData.color + '10', color: mkData.color }}>{mkData.label}</span> : null;
                              })}
                            </div>
                            {owner && (
                              <div className="w-5 h-5 rounded flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{ backgroundColor: owner.litur }} title={owner.nafn}>
                                {owner.initials}
                              </div>
                            )}
                          </div>

                          {/* Quick actions */}
                          <div className={`flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pt-1 border-t ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
                            <button onClick={(e) => { e.stopPropagation(); openEmail(s); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-[10px] font-medium text-blue-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Póstur
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openSima(s); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors text-[10px] font-medium text-green-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              Hringja
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingST(s); }} className={`flex items-center justify-center p-1.5 rounded-lg transition-colors hover:bg-blue-500/15 hover:text-blue-400 ${isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-white/40'}`} title="Breyta">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingST(s); }} className={`flex items-center justify-center p-1.5 rounded-lg transition-colors hover:bg-red-500/15 hover:text-red-400 ${isLight ? 'bg-gray-100 text-gray-400' : 'bg-white/5 text-white/40'}`} title="Eyða">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className={`flex flex-col items-center justify-center py-8 ${isLight ? 'text-gray-300' : 'text-white/20'}`}>
                        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span className="text-[10px]">Ekkert hér</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Pie/Chart View */}
        {viewMode === 'pie' && (
          <ChartView soList={filteredSoList} columns={PIPELINE_COLUMNS} />
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <TableView soList={filteredSoList} columns={PIPELINE_COLUMNS} onSelect={openDetail} onEdit={setEditingST} onDelete={setDeletingST} />
        )}
      </div>

      {/* Detail Panel */}
      {selectedST && activePanel === 'detail' && (
        <DetailPanel
          st={selectedST}
          tags={leadTags[selectedST.id]}
          markhóparList={markhópar}
          onClose={closePanel}
          onToggleMarkhópur={(mk) => toggleMarkhópur(selectedST.id, mk)}
          onAddMarkhópur={addMarkhópur}
          onRemoveMarkhópur={removeMarkhópur}
          onEditMarkhópur={editMarkhópur}
          onSetHitastig={(hs) => setHitastig(selectedST.id, hs)}
          onToggleVip={() => toggleVip(selectedST.id)}
          onTogglePostlisti={(pl) => togglePostlisti(selectedST.id, pl)}
          onOpenEmail={() => setActivePanel('email')}
          onOpenSima={() => setActivePanel('sima')}
          onEdit={() => { setEditingST(selectedST); }}
          onDelete={() => { setDeletingST(selectedST); }}
        />
      )}

      {/* Email Panel */}
      {selectedST && activePanel === 'email' && (
        <EmailPanel st={selectedST} onClose={closePanel} onBack={() => setActivePanel('detail')} />
      )}

      {/* Símtal Panel */}
      {selectedST && activePanel === 'sima' && (
        <SimaPanel st={selectedST} onClose={closePanel} onBack={() => setActivePanel('detail')} />
      )}

      {/* Stofna nýtt sölutækifæri */}
      <StofnaTaekifaeriModal
        isOpen={showStofnaModal}
        onClose={() => setShowStofnaModal(false)}
        onSuccess={handleStofnaTaekifaeri}
      />

      {/* Finna ný tækifæri Panel */}
      {showFinnaTaekifaeri && (
        <FinnaTaekifaeriPanel
          onClose={() => setShowFinnaTaekifaeri(false)}
          onStofnaTaekifaeri={handleStofnaTaekifaeri}
        />
      )}

      {/* Eyða staðfesting */}
      {deletingST && (
        <DeleteConfirmDialog
          st={deletingST}
          onConfirm={() => handleEyda(deletingST)}
          onCancel={() => setDeletingST(null)}
        />
      )}

      {/* Breyta panel */}
      {editingST && (
        <EditPanel
          st={editingST}
          onSave={handleBreyta}
          onClose={() => setEditingST(null)}
        />
      )}
    </div>
  );
}

/* ===== CHART VIEW (PIE + BAR) ===== */
function ChartView({ soList, columns }: {
  soList: Solutaekifaeri[];
  columns: typeof PIPELINE_COLUMNS;
}) {
  const { theme } = useEnterpriseTheme();
  const isLight = theme === 'light';
  const stagePieData = columns.map(col => {
    const items = soList.filter(s => s.stig === col.stig);
    return { name: col.label, value: items.length, color: col.accent, amount: items.reduce((s, i) => s + i.verdmaeti, 0) };
  }).filter(d => d.value > 0);

  const stageValueData = columns.map(col => {
    const items = soList.filter(s => s.stig === col.stig);
    return { name: col.label, value: items.reduce((s, i) => s + i.verdmaeti, 0) / 1000000, color: col.accent };
  }).filter(d => d.value > 0);

  const typeColors: Record<string, string> = {
    floti: '#3b82f6', vinnuferdir: '#f59e0b', sendibilar: '#ef4444', serpantanir: '#8b5cf6', langtimaleiga: '#22c55e',
  };
  const typeLabels: Record<string, string> = {
    floti: 'Floti', vinnuferdir: 'Vinnuferðir', sendibilar: 'Sendibílar', serpantanir: 'Sérpantanir', langtimaleiga: 'Langtímaleiga',
  };
  const typePieData = Object.entries(
    soList.reduce<Record<string, { count: number; value: number }>>((acc, s) => {
      if (!acc[s.pipiTegund]) acc[s.pipiTegund] = { count: 0, value: 0 };
      acc[s.pipiTegund].count++;
      acc[s.pipiTegund].value += s.verdmaeti;
      return acc;
    }, {})
  ).map(([key, data]) => ({
    name: typeLabels[key] || key,
    value: data.count,
    color: typeColors[key] || '#6b7280',
    amount: data.value,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; amount?: number } }> }) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className={`border rounded-lg px-3 py-2 shadow-xl ${isLight ? 'bg-white border-gray-200' : 'bg-[#1a1c2e] border-white/10'}`}>
        <div className={`text-xs font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{d.name}</div>
        <div className={`text-[11px] ${isLight ? 'text-gray-600' : 'text-white/60'}`}>{d.value} {typeof d.value === 'number' && d.value < 100 ? 'tækifæri' : ''}</div>
        {d.amount && <div className="text-[11px] text-emerald-400">{formatCurrency(d.amount)}</div>}
      </div>
    );
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie: by stage count */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">Fjöldi eftir stigi</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={stagePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" stroke="none" paddingAngle={3}>
              {stagePieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {stagePieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} ({d.value})
            </div>
          ))}
        </div>
      </div>

      {/* Bar: value by stage */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">Verðmæti eftir stigi (m.kr.)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stageValueData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'} />
            <XAxis dataKey="name" tick={{ fill: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1a1c2e', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              labelStyle={{ color: isLight ? '#1a1f1c' : 'white', fontSize: 12 }}
              itemStyle={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', fontSize: 11 }}
              formatter={(value) => [`${Number(value).toFixed(1)} m.kr.`, 'Verðmæti']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {stageValueData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie: by type */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">Dreifing eftir tegund</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={typePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" stroke="none" paddingAngle={3}>
              {typePieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {typePieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name} ({d.value})
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-4">Yfirlit</h3>
        <div className="space-y-3">
          {[
            { label: 'Heildarverðmæti', value: formatCurrency(soList.reduce((s, i) => s + i.verdmaeti, 0)), color: '#22c55e' },
            { label: 'Meðalverðmæti', value: formatCurrency(Math.round(soList.reduce((s, i) => s + i.verdmaeti, 0) / (soList.length || 1))), color: '#3b82f6' },
            { label: 'Hæsta verðmæti', value: formatCurrency(Math.max(...soList.map(s => s.verdmaeti))), color: '#8b5cf6' },
            { label: 'Opin tækifæri', value: `${soList.filter(s => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið').length}`, color: '#f59e0b' },
            {
              label: 'Sigurhlutfall (verðmæti)',
              value: `${soList.reduce((s, i) => s + i.verdmaeti, 0) > 0
                ? Math.round((soList.filter(s => s.stig === 'lokað unnið').reduce((s, i) => s + i.verdmaeti, 0) / soList.reduce((s, i) => s + i.verdmaeti, 0)) * 100)
                : 0}%`,
              color: '#22c55e',
            },
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-xs text-white/40">{stat.label}</span>
              <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== TABLE VIEW ===== */
function TableView({ soList, columns, onSelect, onEdit, onDelete }: {
  soList: Solutaekifaeri[];
  columns: typeof PIPELINE_COLUMNS;
  onSelect: (s: Solutaekifaeri) => void;
  onEdit: (s: Solutaekifaeri) => void;
  onDelete: (s: Solutaekifaeri) => void;
}) {
  const [sortKey, setSortKey] = useState<'verdmaeti' | 'dagsetning' | 'stig' | 'titill'>('verdmaeti');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const stigOrder = Object.fromEntries(columns.map((c, i) => [c.stig, i]));
  const sorted = [...soList].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'verdmaeti': cmp = a.verdmaeti - b.verdmaeti; break;
      case 'dagsetning': cmp = new Date(a.dagsetning).getTime() - new Date(b.dagsetning).getTime(); break;
      case 'stig': cmp = (stigOrder[a.stig] ?? 0) - (stigOrder[b.stig] ?? 0); break;
      case 'titill': cmp = a.titill.localeCompare(b.titill, 'is'); break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const colMap = Object.fromEntries(columns.map(c => [c.stig, c]));

  const SortHeader = ({ label, field }: { label: string; field: typeof sortKey }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors">
      {label}
      {sortKey === field && (
        <svg className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left px-4 py-3"><SortHeader label="Tækifæri" field="titill" /></th>
            <th className="text-left px-4 py-3 hidden md:table-cell"><span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Fyrirtæki</span></th>
            <th className="text-left px-4 py-3"><SortHeader label="Stig" field="stig" /></th>
            <th className="text-right px-4 py-3"><SortHeader label="Verðmæti" field="verdmaeti" /></th>
            <th className="text-left px-4 py-3 hidden lg:table-cell"><SortHeader label="Dagsetning" field="dagsetning" /></th>
            <th className="text-left px-4 py-3 hidden lg:table-cell"><span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Næsta snerting</span></th>
            <th className="text-left px-4 py-3 hidden md:table-cell"><span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Ábyrgð</span></th>
            <th className="text-right px-4 py-3"><span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Aðgerðir</span></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => {
            const f = getFyrirtaeki(s.fyrirtaekiId);
            const col = colMap[s.stig];
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{s.titill}</div>
                  <div className="text-[10px] text-white/30 capitalize md:hidden">{f?.nafn}</div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: col?.accent + '15', color: col?.accent }}>
                      {f?.nafn?.charAt(0)}
                    </div>
                    <span className="text-xs text-white/60">{f?.nafn}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ backgroundColor: col?.accent + '15', color: col?.accent }}>
                    {col?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(s.verdmaeti)}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-white/40">{formatDate(s.dagsetning)}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`text-xs ${isOverdue(s.naestiKontaktur) ? 'text-red-400 font-medium' : 'text-orange-500'}`}>
                    {formatDate(s.naestiKontaktur)}
                    {isOverdue(s.naestiKontaktur) && <span className="text-[9px] ml-1 text-red-400/70">seint</span>}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {(() => {
                    const owner = getOwner(s.id);
                    if (!owner) return <span className="text-xs text-white/20">-</span>;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: owner.litur }}>{owner.initials}</div>
                        <span className="text-xs text-white/50">{owner.nafn.split(' ')[0]}</span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                      className="p-1.5 rounded-lg hover:bg-blue-500/15 text-white/40 hover:text-blue-400 transition-colors"
                      title="Breyta"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors"
                      title="Eyða"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ===== DETAIL PANEL ===== */
function DetailPanel({ st, tags, markhóparList, onClose, onToggleMarkhópur, onAddMarkhópur, onRemoveMarkhópur, onEditMarkhópur, onSetHitastig, onToggleVip, onTogglePostlisti, onOpenEmail, onOpenSima, onEdit, onDelete }: {
  st: Solutaekifaeri;
  tags: { markhopar: string[]; hitastig: Hitastig; vip: boolean; postlistar: string[] };
  markhóparList: MarkhópurDef[];
  onClose: () => void;
  onToggleMarkhópur: (mk: string) => void;
  onAddMarkhópur: (label: string) => void;
  onRemoveMarkhópur: (key: string) => void;
  onEditMarkhópur: (key: string, newLabel: string) => void;
  onSetHitastig: (hs: Hitastig) => void;
  onToggleVip: () => void;
  onTogglePostlisti: (pl: string) => void;
  onOpenEmail: () => void;
  onOpenSima: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const f = getFyrirtaeki(st.fyrirtaekiId);
  const tengiliður = f?.tengiliðir.find(t => t.id === st.tengiliðurId);
  const [tab, setTab] = useState<'yfirlit' | 'flokkar' | 'herferd'>('yfirlit');
  const [showAddMk, setShowAddMk] = useState(false);
  const [newMkLabel, setNewMkLabel] = useState('');
  const [editingMk, setEditingMk] = useState<string | null>(null);
  const [editMkLabel, setEditMkLabel] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        {/* Header with gradient */}
        <div className="sticky top-0 z-10 rounded-t-2xl overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${getStatusColor(st.stig)}15, transparent)` }} />
          <div className="relative bg-[#161822]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: getStatusColor(st.stig) + '20' }}>
                  <span className="text-sm font-bold" style={{ color: getStatusColor(st.stig) }}>{f?.nafn?.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{st.titill}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-white/40">{f?.nafn}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-sm font-semibold text-emerald-400">{formatCurrency(st.verdmaeti)}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: getStatusBg(st.stig), color: getStatusColor(st.stig) }}>{st.stig}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="text-white/40 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-500/10" title="Breyta">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={onDelete} className="text-white/40 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Eyða">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-1 border-b border-white/5">
          {([
            { key: 'yfirlit' as const, label: 'Yfirlit', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { key: 'flokkar' as const, label: 'Flokkar & Markhópar', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
            { key: 'herferd' as const, label: 'Herferðir & Póstlistar', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/70'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'yfirlit' && (
            <div className="space-y-6">
              {tengiliður && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs font-medium text-white/40 mb-3">Tengiliður</div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white' }}>{tengiliður.nafn.charAt(0)}</div>
                    <div>
                      <div className="text-sm font-medium text-white">{tengiliður.nafn}</div>
                      <div className="text-xs text-white/50">{tengiliður.titill}</div>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" /></svg>
                          {tengiliður.netfang}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {tengiliður.simi}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <div className="text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Verðmæti</div>
                  <div className="text-sm font-bold text-emerald-400">{formatCurrency(st.verdmaeti)}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <div className="text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Tegund</div>
                  <div className="text-sm font-semibold text-white/90 capitalize">{st.pipiTegund}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <div className="text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Síðustu samskipti</div>
                  <div className="text-sm font-semibold text-white/90">{formatDate(st.sidastiKontaktur)}</div>
                </div>
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <div className="text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wider">Næstu samskipti</div>
                  <div className="text-sm font-semibold text-amber-400">{formatDate(st.naestiKontaktur)}</div>
                </div>
              </div>

              {st.lysing && (
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  <div className="text-xs font-medium text-white/40 mb-1">Lýsing</div>
                  <div className="text-sm text-white/80">{st.lysing}</div>
                </div>
              )}

              {/* Ábyrgðaraðili */}
              {(() => {
                const owner = getOwner(st.id);
                if (!owner) return null;
                return (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs font-medium text-white/40 mb-3">Ábyrgðaraðili</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${owner.litur}, ${owner.litur}aa)` }}>{owner.initials}</div>
                      <div>
                        <div className="text-sm font-medium text-white">{owner.nafn}</div>
                        <div className="text-xs text-white/50">{owner.titill}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Staða og framvinda */}
              {st.ferlSkrefs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-medium text-white/40">Söluferli</div>
                    <div className="text-[10px] text-white/30">
                      {st.ferlSkrefs.filter(fs => fs.status === 'lokið').length}/{st.ferlSkrefs.length} skref lokið
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/5 mb-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(st.ferlSkrefs.filter(fs => fs.status === 'lokið').length / st.ferlSkrefs.length) * 100}%`,
                        background: `linear-gradient(90deg, ${getStatusColor(st.stig)}, ${getStatusColor(st.stig)}80)`,
                      }}
                    />
                  </div>
                  <div className="space-y-0 border-l-2 border-white/5 ml-2">
                    {st.ferlSkrefs.map((fs, idx) => {
                      const statusIcons: Record<string, string> = {
                        'lokið': 'M5 13l4 4L19 7',
                        'í gangi': 'M13 10V3L4 14h7v7l9-11h-7z',
                        'bíður': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                        'áætlað': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                      };
                      const statusLabels: Record<string, string> = {
                        'lokið': 'Lokið',
                        'í gangi': 'Í gangi',
                        'bíður': 'Bíður',
                        'áætlað': 'Áætlað',
                      };
                      return (
                        <div key={fs.id} className={`flex items-start gap-3 pl-4 py-2.5 relative ${idx === st.ferlSkrefs.length - 1 ? '' : ''}`}>
                          <div
                            className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors"
                            style={{ borderColor: getStatusColor(fs.status), backgroundColor: fs.status === 'lokið' ? getStatusColor(fs.status) : 'transparent' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${fs.status === 'lokið' ? 'text-white/70' : fs.status === 'í gangi' ? 'text-white' : 'text-white/35'}`}>{fs.nafn}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1" style={{ backgroundColor: getStatusColor(fs.status) + '15', color: getStatusColor(fs.status) }}>
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={statusIcons[fs.status] || ''} /></svg>
                                {statusLabels[fs.status] || fs.status}
                              </span>
                              {fs.sjálfvirkt && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400/70">Sjálfvirkt</span>}
                            </div>
                            {fs.lýsing && <div className="text-xs text-white/40 mt-0.5">{fs.lýsing}</div>}
                            {fs.dagsetning && <div className="text-[10px] text-white/25 mt-0.5">{formatDate(fs.dagsetning)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aldur og tímalína */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/5 text-center">
                  <div className="text-lg font-bold text-white/70">{getDaysInStage(st.dagsetning)}</div>
                  <div className="text-[10px] text-white/30">dagar í rás</div>
                </div>
                <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/5 text-center">
                  <div className="text-lg font-bold text-white/70">{st.ferlSkrefs.filter(fs => fs.status === 'lokið').length}</div>
                  <div className="text-[10px] text-white/30">skref lokið</div>
                </div>
                <div className={`rounded-xl px-3 py-2.5 border text-center ${isOverdue(st.naestiKontaktur) ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                  <div className={`text-lg font-bold ${isOverdue(st.naestiKontaktur) ? 'text-red-400' : 'text-amber-400'}`}>
                    {Math.abs(Math.floor((new Date(st.naestiKontaktur).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                  </div>
                  <div className="text-[10px] text-white/30">{isOverdue(st.naestiKontaktur) ? 'dagar seint' : 'dagar til næstu'}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onOpenEmail} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))', color: '#60a5fa' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Senda tölvupóst
                </button>
                <button onClick={onOpenSima} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))', color: '#4ade80' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Símtal
                </button>
              </div>
            </div>
          )}

          {tab === 'flokkar' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-medium text-white/40 mb-3">Hitastig tækifæris</div>
                <div className="flex gap-0 rounded-xl border border-white/5 overflow-hidden">
                  {HITASTIG_OPTIONS.map(hs => {
                    const active = tags.hitastig === hs.key;
                    return (
                      <button
                        key={hs.key}
                        onClick={() => onSetHitastig(hs.key)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors"
                        style={active ? { backgroundColor: hs.color + '20', color: hs.color } : undefined}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: hs.color }}>
                          {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hs.color }} />}
                        </span>
                        {hs.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-white/40 mb-3">VIP viðskiptavinur</div>
                <button
                  onClick={onToggleVip}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 w-full ${
                    tags.vip ? '' : 'border-white/5 text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                  style={tags.vip ? { backgroundColor: VIP_COLOR + '20', borderColor: VIP_COLOR + '40', color: VIP_COLOR } : undefined}
                >
                  <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors" style={{ borderColor: VIP_COLOR + '60', backgroundColor: tags.vip ? VIP_COLOR : 'transparent' }}>
                    {tags.vip && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                  VIP
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium text-white/40">Markhópar</div>
                  <button
                    onClick={() => setShowAddMk(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    + Bæta við markhóp
                  </button>
                </div>

                {showAddMk && (
                  <div className="flex gap-2 mb-3">
                    <input
                      autoFocus
                      value={newMkLabel}
                      onChange={e => setNewMkLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newMkLabel.trim()) {
                          onAddMarkhópur(newMkLabel.trim());
                          setNewMkLabel('');
                          setShowAddMk(false);
                        }
                        if (e.key === 'Escape') setShowAddMk(false);
                      }}
                      placeholder="Nafn markhóps..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={() => {
                        if (newMkLabel.trim()) {
                          onAddMarkhópur(newMkLabel.trim());
                          setNewMkLabel('');
                          setShowAddMk(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
                    >
                      Vista
                    </button>
                    <button
                      onClick={() => { setShowAddMk(false); setNewMkLabel(''); }}
                      className="px-2 py-1.5 rounded-lg text-white/40 hover:text-white/60 text-xs transition-colors"
                    >
                      Hætta við
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {markhóparList.map(mk => {
                    const active = tags.markhopar.includes(mk.key);
                    const isEditing = editingMk === mk.key;
                    return (
                      <div key={mk.key} className="relative group/mk">
                        {isEditing ? (
                          <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs" style={{ borderColor: mk.color + '40', backgroundColor: mk.color + '10' }}>
                            <input
                              autoFocus
                              value={editMkLabel}
                              onChange={e => setEditMkLabel(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && editMkLabel.trim()) {
                                  onEditMarkhópur(mk.key, editMkLabel.trim());
                                  setEditingMk(null);
                                }
                                if (e.key === 'Escape') setEditingMk(null);
                              }}
                              onBlur={() => {
                                if (editMkLabel.trim()) onEditMarkhópur(mk.key, editMkLabel.trim());
                                setEditingMk(null);
                              }}
                              className="bg-transparent text-xs font-medium w-24 focus:outline-none"
                              style={{ color: mk.color }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => onToggleMarkhópur(mk.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${active ? '' : 'border-white/5 text-white/50 hover:text-white/70 hover:bg-white/5'}`}
                            style={active ? { backgroundColor: mk.color + '20', borderColor: mk.color + '40', color: mk.color } : undefined}
                          >
                            <span className="w-3 h-3 rounded border flex items-center justify-center" style={{ borderColor: mk.color + '60', backgroundColor: active ? mk.color : 'transparent' }}>
                              {active && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </span>
                            {mk.label}
                          </button>
                        )}
                        {!isEditing && (
                          <div className="absolute -top-1 -right-1 hidden group-hover/mk:flex gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingMk(mk.key); setEditMkLabel(mk.label); }}
                              className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              title="Breyta"
                            >
                              <svg className="w-2 h-2 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveMarkhópur(mk.key); }}
                              className="w-4 h-4 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                              title="Eyða"
                            >
                              <svg className="w-2 h-2 text-white/60 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-white/50">Veldu hitastig og markhópa til að flokka tækifæri. Þetta nýtist í herferðir og póstlista. Hægri-smelltu á markhóp til að breyta eða eyða.</div>
              </div>
            </div>
          )}

          {tab === 'herferd' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-medium text-white/40 mb-3">Póstlistar og herferðir</div>
                <div className="space-y-2">
                  {['Rafbílaherferð 2026', 'Flotaviðburður mars', 'Nýársherferð', 'Viðburður í Hörpu'].map(lista => {
                    const active = tags.postlistar.includes(lista);
                    return (
                      <button key={lista} onClick={() => onTogglePostlisti(lista)} className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-all duration-200 text-left border border-white/5">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                          {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/80">{lista}</div>
                        </div>
                        {active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium shrink-0">Á lista</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xs font-medium text-white/60 mb-1">Herferðastjórnun</div>
                <div className="text-xs text-white/40">Settu tækifæri á póstlista til að taka þátt í herferðum. Tölvupóstar og viðburðaboð sendast sjálfkrafa samkvæmt herferðaáætlun.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== EMAIL PANEL ===== */
function EmailPanel({ st, onClose, onBack }: { st: Solutaekifaeri; onClose: () => void; onBack: () => void }) {
  const f = getFyrirtaeki(st.fyrirtaekiId);
  const tengiliður = f?.tengiliðir.find(t => t.id === st.tengiliðurId);

  const [to, setTo] = useState(tengiliður?.netfang || '');
  const [subject, setSubject] = useState(`Enterprise Bílaleiga - ${st.titill}`);
  const [body, setBody] = useState('');
  const [scheduled, setScheduled] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const company = getFyrirtaeki(st.fyrirtaekiId);
    const contact = company?.tengiliðir.find(t => t.id === st.tengiliðurId);
    if (contact) {
      if (!contact.samskipti) contact.samskipti = [];
      contact.samskipti.unshift({
        id: `ss-email-${Date.now()}`,
        tegund: 'tölvupóstur',
        titill: subject,
        lysing: body || `Tölvupóstur sendur á ${to}`,
        dagsetning: new Date().toISOString().split('T')[0],
        hofundur: 'Notandi',
      });
    }

    setSent(true);
    setTimeout(() => { setSent(false); onBack(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        <div className="sticky top-0 z-10 bg-[#161822] border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Senda tölvupóst</h2>
              <div className="text-xs text-white/40">{f?.nafn} · {st.titill}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))' }}>
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="text-sm font-medium text-white">Tölvupóstur {scheduled ? 'tímasettur' : 'sendur'}!</div>
              <div className="text-xs text-white/40 mt-1">{scheduled ? `Sendist ${scheduled}` : 'Sendur núna'}</div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Netfang viðtakanda</label>
                <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="netfang@fyrirtaeki.is" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all" />
              </div>

              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Efnislína</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all" />
              </div>

              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Skilaboð</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder={`Góðan daginn ${tengiliður?.nafn?.split(' ')[0] || ''},\n\nVið viljum kynna ykkur nýjustu tilboð okkar í ...\n\nKveðja,\nEnterprise Bílaleiga`} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Tímasetja sendingu (valfrjálst)</label>
                <input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all [color-scheme:dark]" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSend} disabled={!to || !subject} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  {scheduled ? 'Tímasetja sendingu' : 'Senda núna'}
                </button>
                <button onClick={onBack} className="px-4 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors">Hætta við</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== DELETE CONFIRM DIALOG ===== */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DeleteConfirmDialog({ st, onConfirm, onCancel }: {
  st: Solutaekifaeri;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const f = getFyrirtaeki(st.fyrirtaekiId);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/15">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Eyða sölutækifæri?</h3>
            <p className="text-xs text-white/40">Þessi aðgerð er óafturkræf</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-5">
          <div className="text-sm font-medium text-white">{st.titill}</div>
          <div className="text-xs text-white/40 mt-1">{f?.nafn} · {formatCurrency(st.verdmaeti)}</div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors">
            Hætta við
          </button>
          <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 border border-red-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eyða
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== EDIT PANEL ===== */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function EditPanel({ st, onSave, onClose }: {
  st: Solutaekifaeri;
  onSave: (updated: Solutaekifaeri) => void;
  onClose: () => void;
}) {
  const [titill, setTitill] = useState(st.titill);
  const [lysing, setLysing] = useState(st.lysing);
  const [stig, setStig] = useState(st.stig);
  const [verdmaeti, setVerdmaeti] = useState(st.verdmaeti.toString());
  const [dagsetning, setDagsetning] = useState(st.dagsetning);
  const [naestiKontaktur, setNaestiKontaktur] = useState(st.naestiKontaktur);
  const [pipiTegund, setPipiTegund] = useState(st.pipiTegund);

  const f = getFyrirtaeki(st.fyrirtaekiId);

  const handleSubmit = () => {
    const parsedValue = parseInt(verdmaeti.replace(/\D/g, ''), 10);
    if (!titill.trim() || isNaN(parsedValue)) return;
    onSave({
      ...st,
      titill: titill.trim(),
      lysing: lysing.trim(),
      stig,
      verdmaeti: parsedValue,
      dagsetning,
      naestiKontaktur,
      pipiTegund,
    });
  };

  const stigOptions: { value: Solutaekifaeri['stig']; label: string; color: string }[] = [
    { value: 'lead', label: 'Ný tækifæri', color: '#3b82f6' },
    { value: 'tilboð sent', label: 'Tilboð sent', color: '#f59e0b' },
    { value: 'samningur í vinnslu', label: 'Samningur í vinnslu', color: '#8b5cf6' },
    { value: 'lokað unnið', label: 'Lokað unnið', color: '#22c55e' },
    { value: 'lokað tapað', label: 'Lokað tapað', color: '#ef4444' },
  ];

  const tegundOptions: { value: Solutaekifaeri['pipiTegund']; label: string }[] = [
    { value: 'floti', label: 'Floti' },
    { value: 'vinnuferdir', label: 'Vinnuferðir' },
    { value: 'sendibilar', label: 'Sendibílar' },
    { value: 'serpantanir', label: 'Sérpantanir' },
    { value: 'langtimaleiga', label: 'Langtímaleiga' },
  ];

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        <div className="sticky top-0 z-10 bg-[#161822] border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Breyta sölutækifæri</h2>
              <div className="text-xs text-white/40">{f?.nafn}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/40 block mb-1.5">Titill</label>
            <input type="text" value={titill} onChange={e => setTitill(e.target.value)} className={inputClass} placeholder="Titill tækifæris..." />
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 block mb-1.5">Lýsing</label>
            <textarea value={lysing} onChange={e => setLysing(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Lýsing á tækifæri..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Stig</label>
              <div className="relative">
                <select value={stig} onChange={e => setStig(e.target.value as Solutaekifaeri['stig'])} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                  {stigOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#161822] text-white">{opt.label}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
              <div className="mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: (stigOptions.find(o => o.value === stig)?.color ?? '#6b7280') + '20', color: stigOptions.find(o => o.value === stig)?.color ?? '#6b7280' }}>
                  {stigOptions.find(o => o.value === stig)?.label}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Tegund</label>
              <div className="relative">
                <select value={pipiTegund} onChange={e => setPipiTegund(e.target.value as Solutaekifaeri['pipiTegund'])} className={`${inputClass} appearance-none cursor-pointer pr-10`}>
                  {tegundOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#161822] text-white">{opt.label}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 block mb-1.5">Verðmæti (kr.)</label>
            <input
              type="text"
              value={verdmaeti}
              onChange={e => setVerdmaeti(e.target.value.replace(/[^\d]/g, ''))}
              className={inputClass}
              placeholder="0"
            />
            {verdmaeti && !isNaN(parseInt(verdmaeti, 10)) && (
              <div className="text-xs text-emerald-400/70 mt-1">{formatCurrency(parseInt(verdmaeti, 10))}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Dagsetning</label>
              <input type="date" value={dagsetning} onChange={e => setDagsetning(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Næsti kontaktur</label>
              <input type="date" value={naestiKontaktur} onChange={e => setNaestiKontaktur(e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!titill.trim() || isNaN(parseInt(verdmaeti, 10))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Vista breytingar
            </button>
            <button onClick={onClose} className="px-4 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors">
              Hætta við
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== SÍMTAL PANEL ===== */
function SimaPanel({ st, onClose, onBack }: { st: Solutaekifaeri; onClose: () => void; onBack: () => void }) {
  const f = getFyrirtaeki(st.fyrirtaekiId);
  const tengiliður = f?.tengiliðir.find(t => t.id === st.tengiliðurId);

  const [nidurstada, setNidurstada] = useState<SimtalsSkraning['nidurstada']>('svarað');
  const [athugasemdir, setAthugasemdir] = useState('');
  const [naestuSkref, setNaestuSkref] = useState('');
  const [savedLogs, setSavedLogs] = useState<SimtalsSkraning[]>([]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const now = new Date().toISOString();
    setSavedLogs(prev => [...prev, {
      dagsetning: now,
      nidurstada,
      athugasemdir,
      naestuSkref,
    }]);

    const nidustodaLabel = nidurstodaOptions.find(o => o.key === nidurstada)?.label || nidurstada;
    const company = getFyrirtaeki(st.fyrirtaekiId);
    const contact = company?.tengiliðir.find(t => t.id === st.tengiliðurId);
    if (contact) {
      if (!contact.samskipti) contact.samskipti = [];
      contact.samskipti.unshift({
        id: `ss-sima-${Date.now()}`,
        tegund: 'símtal',
        titill: `Símtal – ${nidustodaLabel}`,
        lysing: [athugasemdir, naestuSkref ? `Næstu skref: ${naestuSkref}` : ''].filter(Boolean).join('\n'),
        dagsetning: now.split('T')[0],
        hofundur: 'Notandi',
      });
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setAthugasemdir('');
      setNaestuSkref('');
    }, 1500);
  };

  const nidurstodaOptions: { key: SimtalsSkraning['nidurstada']; label: string; color: string }[] = [
    { key: 'svarað', label: 'Svarað', color: '#22c55e' },
    { key: 'ekki_svarað', label: 'Ekki svarað', color: '#ef4444' },
    { key: 'skilaboð', label: 'Skilaboð skilið', color: '#f59e0b' },
    { key: 'aftur_seinna', label: 'Aftur seinna', color: '#3b82f6' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        <div className="sticky top-0 z-10 bg-[#161822] border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Símtal</h2>
              <div className="text-xs text-white/40">{f?.nafn} · {st.titill}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {tengiliður && (
            <div className="flex items-center gap-4 rounded-xl p-4 border border-white/5" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(16,185,129,0.05))' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))' }}>
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{tengiliður.nafn}</div>
                <div className="text-xs text-white/50">{tengiliður.titill}</div>
                <div className="text-sm font-bold text-green-400 mt-1">{tengiliður.simi}</div>
              </div>
            </div>
          )}

          {saved ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))' }}>
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="text-sm font-medium text-white">Símtal skráð!</div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-white/40 block mb-2">Hvernig gekk símtalið?</label>
                <div className="grid grid-cols-2 gap-2">
                  {nidurstodaOptions.map(opt => (
                    <button key={opt.key} onClick={() => setNidurstada(opt.key)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 ${nidurstada === opt.key ? '' : 'border-white/5 text-white/50 hover:bg-white/5'}`} style={nidurstada === opt.key ? { backgroundColor: opt.color + '15', borderColor: opt.color + '40', color: opt.color } : undefined}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Athugasemdir</label>
                <textarea value={athugasemdir} onChange={e => setAthugasemdir(e.target.value)} rows={4} placeholder="Hvernig gekk símtalið, hvað var rætt..." className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all resize-none" />
              </div>

              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Næstu skref</label>
                <textarea value={naestuSkref} onChange={e => setNaestuSkref(e.target.value)} rows={2} placeholder="T.d. bóka fund, senda tilboð, hringja aftur á föstudegi..." className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all resize-none" />
              </div>

              <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Skrá símtal
              </button>
            </>
          )}

          {savedLogs.length > 0 && (
            <div>
              <div className="text-xs font-medium text-white/40 mb-2">Skráð símtöl</div>
              <div className="space-y-2">
                {savedLogs.map((log, i) => {
                  const opt = nidurstodaOptions.find(o => o.key === log.nidurstada);
                  return (
                    <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt?.color }} />
                        <span className="text-xs font-medium" style={{ color: opt?.color }}>{opt?.label}</span>
                        <span className="text-xs text-white/30 ml-auto">{new Date(log.dagsetning).toLocaleString('is-IS')}</span>
                      </div>
                      {log.athugasemdir && <div className="text-xs text-white/60 mt-1">{log.athugasemdir}</div>}
                      {log.naestuSkref && <div className="text-xs text-blue-400/70 mt-1">Næstu skref: {log.naestuSkref}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
