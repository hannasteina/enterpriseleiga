'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  solutaekifaeri as solutaekifaeriData,
  mal,
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
  const [soList, setSoList] = useState<Solutaekifaeri[]>(solutaekifaeriData);
  const [selectedST, setSelectedST] = useState<Solutaekifaeri | null>(null);
  const [activePanel, setActivePanel] = useState<'detail' | 'email' | 'sima' | null>(null);
  const [showFinnaTaekifaeri, setShowFinnaTaekifaeri] = useState(false);
  const [showStofnaModal, setShowStofnaModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
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
  const opinMal = mal.filter(m => m.status !== 'lokað');

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
      <div className="enterprise-hero-gradient relative overflow-hidden rounded-2xl border border-white/5" style={{ background: 'linear-gradient(135deg, #0f1729 0%, #1a1040 50%, #0f1729 100%)' }}>
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
                <h1 className="text-2xl font-bold text-white tracking-tight">Sölurás</h1>
              </div>
              <p className="text-sm text-white/40 ml-[52px]">Sölutækifæri, herferðir og viðskiptaþróun</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStofnaModal(true)}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
              >
                <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Stofna nýtt
              </button>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/samningar" className="enterprise-stat-gradient group relative overflow-hidden rounded-xl border border-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/5 block" style={{ background: 'linear-gradient(135deg, #161822 0%, #0f1729 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 transition-transform group-hover:scale-125" style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Sölurás</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mb-1">{formatCurrency(pipalineVerdmaeti)}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30 group-hover:text-emerald-400/60 transition-colors">
              <span>Skoða samninga</span>
              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/vidskiptavinir" className="enterprise-stat-gradient group relative overflow-hidden rounded-xl border border-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/5 block" style={{ background: 'linear-gradient(135deg, #161822 0%, #0f1729 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 transition-transform group-hover:scale-125" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Opin tækifæri</span>
            </div>
            <div className="text-xl font-bold text-blue-400 mb-1">{opinSolutaekifaeri.length}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30 group-hover:text-blue-400/60 transition-colors">
              <span>Viðskiptavinir</span>
              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/malaskraning" className="enterprise-stat-gradient group relative overflow-hidden rounded-xl border border-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/5 block" style={{ background: 'linear-gradient(135deg, #161822 0%, #0f1729 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 transition-transform group-hover:scale-125" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Opin mál</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mb-1">{opinMal.length}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30 group-hover:text-amber-400/60 transition-colors">
              <span>Málaskráning</span>
              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>

        <Link href="/skyrslur" className="enterprise-stat-gradient group relative overflow-hidden rounded-xl border border-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/5 block" style={{ background: 'linear-gradient(135deg, #161822 0%, #0f1729 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 transition-transform group-hover:scale-125" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Á póstlistum</span>
            </div>
            <div className="text-xl font-bold text-purple-400 mb-1">{Object.values(leadTags).filter(lt => lt.postlistar.length > 0).length}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30 group-hover:text-purple-400/60 transition-colors">
              <span>Skýrslur</span>
              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="bg-[#161822] rounded-xl border border-white/5 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Söluferill</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{soList.length} tækifæri</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Sigurhlutfall:</span>
              <span className="font-semibold text-emerald-400">{winRate}%</span>
            </div>
          </div>
        </div>
        <div className="flex rounded-full overflow-hidden h-2 bg-white/5">
          {PIPELINE_COLUMNS.map(col => {
            const count = soList.filter(s => s.stig === col.stig).length;
            const pct = soList.length > 0 ? (count / soList.length) * 100 : 0;
            return pct > 0 ? (
              <div
                key={col.stig}
                className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: col.accent }}
                title={`${col.label}: ${count}`}
              />
            ) : null;
          })}
        </div>
        <div className="flex gap-4 mt-2.5">
          {PIPELINE_COLUMNS.map(col => {
            const count = soList.filter(s => s.stig === col.stig).length;
            return (
              <div key={col.stig} className="flex items-center gap-1.5 text-[10px] text-white/40">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.accent }} />
                <span>{col.label}</span>
                <span className="font-semibold text-white/60">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Views */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Sölurás</h2>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {VIEW_OPTIONS.map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  viewMode === v.key
                    ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
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

        {/* Kanban View */}
        {viewMode === 'kanban' && (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-3 p-4">
            {PIPELINE_COLUMNS.map((col, colIdx) => {
              const items = soList.filter(s => s.stig === col.stig);
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
                        <span className="text-xs font-semibold text-white">{col.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: col.accent + '15', color: col.accent }}>{items.length}</span>
                      </div>
                      {items.length > 0 && (
                        <div className="text-[10px] text-white/30 mt-0.5">{formatCurrency(colValue)}</div>
                      )}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 min-h-[100px] px-2 pb-2 space-y-2 overflow-y-auto max-h-[500px]">
                    {items.map((s, idx) => {
                      const f = getFyrirtaeki(s.fyrirtaekiId);
                      const tags = leadTags[s.id];
                      return (
                        <div
                          key={s.id}
                          onClick={() => openDetail(s)}
                          className="group bg-[#161822] rounded-xl p-3.5 border border-white/5 hover:border-white/15 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                          style={{
                            animationDelay: `${colIdx * 60 + idx * 40}ms`,
                          }}
                        >
                          {/* Title & company */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate leading-tight">{s.titill}</div>
                              <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: col.accent + '20', color: col.accent }}>
                                  {f?.nafn?.charAt(0) || '?'}
                                </span>
                                <span className="truncate">{f?.nafn}</span>
                              </div>
                            </div>
                          </div>

                          {/* Value */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-bold text-emerald-400">{formatCurrency(s.verdmaeti)}</div>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-1.5 text-[10px] text-white/30 mb-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(s.naestiKontaktur)}</span>
                          </div>

                          {/* Tags */}
                          {tags && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(() => {
                                const hsData = HITASTIG_OPTIONS.find(h => h.key === tags.hitastig);
                                return hsData ? <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: hsData.color + '15', color: hsData.color }}>{hsData.label}</span> : null;
                              })()}
                              {tags.vip && <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: VIP_COLOR + '15', color: VIP_COLOR }}>VIP</span>}
                              {tags.markhopar.slice(0, 2).map(mk => {
                                const mkData = markhópar.find(m => m.key === mk);
                                return mkData ? <span key={mk} className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: mkData.color + '10', color: mkData.color }}>{mkData.label}</span> : null;
                              })}
                            </div>
                          )}

                          {/* Quick actions */}
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pt-1 border-t border-white/5">
                            <button onClick={(e) => { e.stopPropagation(); openEmail(s); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-[10px] font-medium text-blue-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Póstur
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openSima(s); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors text-[10px] font-medium text-green-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              Hringja
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingST(s); }} className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/15 transition-colors text-white/40 hover:text-blue-400" title="Breyta">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingST(s); }} className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 transition-colors text-white/40 hover:text-red-400" title="Eyða">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-white/20">
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
          <ChartView soList={soList} columns={PIPELINE_COLUMNS} />
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <TableView soList={soList} columns={PIPELINE_COLUMNS} onSelect={openDetail} onEdit={setEditingST} onDelete={setDeletingST} />
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
                  <span className="text-xs text-amber-400/70">{formatDate(s.naestiKontaktur)}</span>
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

              {st.ferlSkrefs.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-white/40 mb-3">Söluferill</div>
                  <div className="space-y-0 border-l-2 border-white/5 ml-2">
                    {st.ferlSkrefs.map(fs => (
                      <div key={fs.id} className="flex items-start gap-3 pl-4 py-2 relative">
                        <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors" style={{ borderColor: getStatusColor(fs.status), backgroundColor: fs.status === 'lokið' ? getStatusColor(fs.status) : 'transparent' }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${fs.status === 'bíður' ? 'text-white/40' : 'text-white/70'}`}>{fs.nafn}</span>
                            {fs.sjálfvirkt && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400">Sjálfvirkt</span>}
                          </div>
                          {fs.lýsing && <div className="text-xs text-white/40 mt-0.5">{fs.lýsing}</div>}
                          {fs.dagsetning && <div className="text-xs text-white/30 mt-0.5">{formatDate(fs.dagsetning)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
