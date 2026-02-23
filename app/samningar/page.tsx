'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  samningar as baseSamningar,
  samningsSkjol,
  getFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  verkefni,
  innifaliðILeigu,
  bilar,
  type Samningur,
} from '@/lib/enterprise-demo-data';
import NySamningurModal from '@/components/NySamningurModal';

type TegundFilter = 'allir' | 'langtimaleiga' | 'flotaleiga';
type StatusFilter = 'allir' | 'virkir' | 'rennur_ut' | 'lokid';
type SortKey = 'fyrirtaeki' | 'tegund' | 'bill' | 'dagsetning' | 'kostnadur' | 'stada' | 'dagar';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'kanban';

const PAGE_SIZE = 15;

const statusLabels: Record<string, string> = {
  virkur: 'Virkur',
  rennur_ut: 'Rennur út',
  lokid: 'Lokið',
  uppsagt: 'Uppsagt',
};

function getDaysRemaining(lokadagur: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loka = new Date(lokadagur);
  loka.setHours(0, 0, 0, 0);
  return Math.ceil((loka.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getProgressPercent(upphafsdagur: string, lokadagur: string): number {
  const start = new Date(upphafsdagur).getTime();
  const end = new Date(lokadagur).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export default function SamningarPage() {
  const [tegundFilter, setTegundFilter] = useState<TegundFilter>('allir');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('allir');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSamningur, setSelectedSamningur] = useState<Samningur | null>(null);
  const [samningarList, setSamningarList] = useState<Samningur[]>([...baseSamningar]);
  const [sortKey, setSortKey] = useState<SortKey>('dagar');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showNySamningur, setShowNySamningur] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickActionRef.current && !quickActionRef.current.contains(e.target as Node)) {
        setQuickActionId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSamningar = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = samningarList.filter((s) => {
      const tegundMatch = tegundFilter === 'allir' || s.tegund === tegundFilter;
      const statusMatch =
        statusFilter === 'allir' ||
        (statusFilter === 'virkir' && s.status === 'virkur') ||
        (statusFilter === 'rennur_ut' && s.status === 'rennur_ut') ||
        (statusFilter === 'lokid' && (s.status === 'lokid' || s.status === 'uppsagt'));
      if (!tegundMatch || !statusMatch) return false;
      if (!q) return true;
      const f = getFyrirtaeki(s.fyrirtaekiId);
      return (
        (f?.nafn ?? '').toLowerCase().includes(q) ||
        s.bilategund.toLowerCase().includes(q) ||
        s.bilanumer.toLowerCase().includes(q) ||
        (statusLabels[s.status] ?? s.status).toLowerCase().includes(q) ||
        s.upphafsdagur.includes(q) ||
        s.lokadagur.includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'fyrirtaeki': {
          const fA = getFyrirtaeki(a.fyrirtaekiId)?.nafn ?? '';
          const fB = getFyrirtaeki(b.fyrirtaekiId)?.nafn ?? '';
          cmp = fA.localeCompare(fB, 'is');
          break;
        }
        case 'tegund':
          cmp = a.tegund.localeCompare(b.tegund, 'is');
          break;
        case 'bill':
          cmp = a.bilategund.localeCompare(b.bilategund, 'is');
          break;
        case 'dagsetning':
          cmp = a.upphafsdagur.localeCompare(b.upphafsdagur);
          break;
        case 'kostnadur':
          cmp = a.manadalegurKostnadur - b.manadalegurKostnadur;
          break;
        case 'stada': {
          const order: Record<string, number> = { rennur_ut: 0, virkur: 1, lokid: 2, uppsagt: 3 };
          cmp = (order[a.status] ?? 9) - (order[b.status] ?? 9);
          break;
        }
        case 'dagar': {
          const dA = getDaysRemaining(a.lokadagur) ?? 9999;
          const dB = getDaysRemaining(b.lokadagur) ?? 9999;
          cmp = dA - dB;
          break;
        }
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [samningarList, tegundFilter, statusFilter, searchQuery, sortKey, sortDir]);

  const stats = useMemo(() => {
    const active = samningarList.filter((s) => s.status === 'virkur' || s.status === 'rennur_ut');
    const monthlyRevenue = active.reduce((sum, s) => sum + s.manadalegurKostnadur, 0);
    const expiringIn30 = samningarList.filter((s) => {
      if (s.status === 'lokid' || s.status === 'uppsagt') return false;
      const d = getDaysRemaining(s.lokadagur);
      return d !== null && d > 0 && d <= 30;
    }).length;
    const avgRevenue = active.length > 0 ? Math.round(monthlyRevenue / active.length) : 0;
    const totalBilar = bilar.length;
    const iSamningi = bilar.filter((b) => b.samningurId !== null).length;
    const nyttingarhlutfall = totalBilar > 0 ? Math.round((iSamningi / totalBilar) * 100) : 0;
    return { monthlyRevenue, expiringIn30, avgRevenue, nyttingarhlutfall, activeCount: active.length };
  }, [samningarList]);

  useEffect(() => setPage(0), [searchQuery, tegundFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredSamningar.length / PAGE_SIZE);
  const pagedSamningar = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredSamningar.slice(start, start + PAGE_SIZE);
  }, [filteredSamningar, page]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'fyrirtaeki' || key === 'tegund' || key === 'bill' ? 'asc' : 'desc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedSamningar.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedSamningar.map((s) => s.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    const count = selectedIds.size;
    if (action === 'lokid') {
      setSamningarList((prev) =>
        prev.map((s) => (selectedIds.has(s.id) ? { ...s, status: 'lokid' as const } : s))
      );
      showToast(`${count} samningar merktir sem lokið`);
    } else if (action === 'tilkynning') {
      showToast(`Tilkynning send á ${count} viðskiptavini`);
    } else if (action === 'csv') {
      showToast(`${count} samningar fluttir út`);
    }
    setSelectedIds(new Set());
  };

  const warningItems = useMemo(() => {
    const items: { id: string; type: 'critical' | 'warning' | 'info' | 'neutral'; label: string; detail: string; samningurId: string }[] = [];
    samningarList.forEach((s) => {
      if (s.status === 'lokid' || s.status === 'uppsagt') return;
      const d = getDaysRemaining(s.lokadagur);
      if (d === null || d <= 0) return;
      const f = getFyrirtaeki(s.fyrirtaekiId);
      if (d <= 7) {
        items.push({ id: s.id, type: 'critical', label: `${f?.nafn ?? '?'} - ${s.bilategund}`, detail: `Rennur út eftir ${d} daga`, samningurId: s.id });
      } else if (d <= 30) {
        items.push({ id: s.id, type: 'warning', label: `${f?.nafn ?? '?'} - ${s.bilategund}`, detail: `Rennur út eftir ${d} daga`, samningurId: s.id });
      }
    });
    items.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, neutral: 3 };
      return order[a.type] - order[b.type];
    });
    return items;
  }, [samningarList]);

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    const cols = [
      { key: 'virkur', label: 'Virkir', color: '#22c55e', items: [] as Samningur[] },
      { key: 'rennur30', label: 'Renna út (30d)', color: '#f59e0b', items: [] as Samningur[] },
      { key: 'rennur90', label: 'Renna út (90d)', color: '#ea580c', items: [] as Samningur[] },
      { key: 'lokid', label: 'Lokið / Uppsagt', color: '#6b7280', items: [] as Samningur[] },
    ];
    filteredSamningar.forEach((s) => {
      if (s.status === 'lokid' || s.status === 'uppsagt') {
        cols[3].items.push(s);
      } else {
        const d = getDaysRemaining(s.lokadagur);
        if (d !== null && d <= 30) cols[1].items.push(s);
        else if (d !== null && d <= 90) cols[2].items.push(s);
        else cols[0].items.push(s);
      }
    });
    return cols;
  }, [filteredSamningar]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Samningar</h1>
          <p className="text-sm text-white/40 mt-1">Flota- og langtímaleiga · {samningarList.length} samningar</p>
        </div>
        <button
          onClick={() => setShowNySamningur(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nýr samningur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/40">Renna út (30 dagar)</div>
            {stats.expiringIn30 > 0 && (
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-bold" style={{ color: stats.expiringIn30 > 0 ? '#f59e0b' : '#ffffff' }}>
            {stats.expiringIn30}
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/30">
            <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {stats.expiringIn30 > 0 ? 'Þarfnast athygli' : 'Ekkert brýnt'}
          </div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
          <div className="text-xs font-medium text-white/40 mb-2">Mánaðartekjur</div>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {formatCurrency(stats.monthlyRevenue)}
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/30">
            <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 11l5 5L13 6m4 0l5 5" />
            </svg>
            Meðaltal: {formatCurrency(stats.avgRevenue)}/samning
          </div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
          <div className="text-xs font-medium text-white/40 mb-2">Nýttingarhlutfall flota</div>
          <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
            {stats.nyttingarhlutfall}%
          </div>
          <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.nyttingarhlutfall}%`, backgroundColor: '#8b5cf6' }}
            />
          </div>
          <div className="text-[10px] text-white/30 mt-1.5">
            {bilar.filter((b) => b.samningurId !== null).length} af {bilar.length} bílum
          </div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
          <div className="text-xs font-medium text-white/40 mb-2">Virkir samningar</div>
          <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
            {stats.activeCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px]">
            <span className="text-white/30">{samningarList.filter((s) => s.tegund === 'flotaleiga' && (s.status === 'virkur' || s.status === 'rennur_ut')).length} flota</span>
            <span className="text-white/10">·</span>
            <span className="text-white/30">{samningarList.filter((s) => s.tegund === 'langtimaleiga' && (s.status === 'virkur' || s.status === 'rennur_ut')).length} langtíma</span>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Leita í samningum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 w-64 rounded-lg bg-[#161822] border border-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
          {(['allir', 'langtimaleiga', 'flotaleiga'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTegundFilter(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tegundFilter === t ? 'bg-blue-600/30 text-blue-400' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'allir' ? 'Allir' : t === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
          {(['allir', 'virkir', 'rennur_ut', 'lokid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600/30 text-blue-400' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'allir' ? 'Allir' : s === 'virkir' ? 'Virkir' : s === 'rennur_ut' ? 'Renna út' : 'Lokið'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600/30 text-blue-400' : 'text-white/40 hover:text-white/60'}`}
            title="Tafla"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-2 transition-colors ${viewMode === 'kanban' ? 'bg-blue-600/30 text-blue-400' : 'text-white/40 hover:text-white/60'}`}
            title="Kanban"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-top-1">
          <span className="text-sm font-medium text-blue-400">{selectedIds.size} valdir</span>
          <div className="h-4 w-px bg-blue-500/20" />
          <button onClick={() => handleBulkAction('tilkynning')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600/15 text-amber-400 hover:bg-amber-600/25 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Senda tilkynningu
          </button>
          <button onClick={() => handleBulkAction('lokid')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Merkja lokið
          </button>
          <button onClick={() => handleBulkAction('csv')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Flytja út CSV
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-white/40 hover:text-white/60 transition-colors">
            Hreinsa val
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Samningar</h2>
                {(searchQuery || tegundFilter !== 'allir' || statusFilter !== 'allir') && (
                  <span className="text-xs text-white/40">{filteredSamningar.length} af {samningarList.length}</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={pagedSamningar.length > 0 && selectedIds.size === pagedSamningar.length}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
                        />
                      </th>
                      {([
                        { key: 'fyrirtaeki' as SortKey, label: 'Fyrirtæki' },
                        { key: 'tegund' as SortKey, label: 'Tegund' },
                        { key: 'bill' as SortKey, label: 'Bíll' },
                        { key: 'kostnadur' as SortKey, label: 'Kostnaður' },
                        { key: 'stada' as SortKey, label: 'Staða' },
                        { key: 'dagar' as SortKey, label: 'Framvinda' },
                      ]).map((col) => (
                        <th key={col.key} className="px-4 py-3 text-left">
                          <button
                            onClick={() => toggleSort(col.key)}
                            className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                              sortKey === col.key ? 'text-blue-400' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            {col.label}
                            {sortKey === col.key && (
                              <svg className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                        </th>
                      ))}
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSamningar.map((s) => {
                      const f = getFyrirtaeki(s.fyrirtaekiId);
                      const dagar = getDaysRemaining(s.lokadagur);
                      const progress = getProgressPercent(s.upphafsdagur, s.lokadagur);
                      const isSelected = selectedIds.has(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-600/[0.06]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(s.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3" onClick={() => setSelectedSamningur(s)}>
                            <span className="text-sm font-medium text-white">{f?.nafn ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3" onClick={() => setSelectedSamningur(s)}>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: s.tegund === 'flotaleiga' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
                                color: s.tegund === 'flotaleiga' ? '#a78bfa' : '#60a5fa',
                              }}
                            >
                              {s.tegund === 'flotaleiga' ? 'Flota' : 'Langtíma'}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={() => setSelectedSamningur(s)}>
                            <div className="text-sm text-white/90">{s.bilategund}</div>
                            <div className="text-xs text-white/40">{s.bilanumer}</div>
                          </td>
                          <td className="px-4 py-3" onClick={() => setSelectedSamningur(s)}>
                            <div className="text-sm font-medium text-white">{formatCurrency(s.manadalegurKostnadur)}</div>
                          </td>
                          <td className="px-4 py-3" onClick={() => setSelectedSamningur(s)}>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                              style={{ backgroundColor: getStatusBg(s.status), color: getStatusColor(s.status) }}
                            >
                              {statusLabels[s.status] ?? s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={() => setSelectedSamningur(s)}>
                            {s.status !== 'lokid' && s.status !== 'uppsagt' ? (
                              <div className="w-24">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-[10px] font-medium ${
                                    dagar !== null && dagar <= 14 ? 'text-red-400' : dagar !== null && dagar <= 30 ? 'text-orange-400' : 'text-white/50'
                                  }`}>
                                    {dagar !== null && dagar > 0 ? `${dagar}d` : '—'}
                                  </span>
                                  <span className="text-[10px] text-white/30">{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${progress}%`,
                                      backgroundColor: progress >= 90 ? '#ef4444' : progress >= 75 ? '#f59e0b' : '#22c55e',
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-white/30">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickActionId(quickActionId === s.id ? null : s.id);
                              }}
                              className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            {quickActionId === s.id && (
                              <div ref={quickActionRef} className="absolute right-0 top-full mt-1 w-48 bg-[#1e2030] border border-white/10 rounded-lg shadow-xl z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                <button onClick={() => { setSelectedSamningur(s); setQuickActionId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  Opna samning
                                </button>
                                <button onClick={() => { setQuickActionId(null); showToast('Samningur endurnýjaður'); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-400 hover:bg-white/5 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  Endurnýja
                                </button>
                                <button onClick={() => { setQuickActionId(null); showToast('Tilkynning send'); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-white/5 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                  Senda tilkynningu
                                </button>
                                <Link href={`/vidskiptavinir/${s.fyrirtaekiId}`} onClick={() => setQuickActionId(null)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                  Skoða viðskiptavin
                                </Link>
                                <Link href="/bilar" onClick={() => setQuickActionId(null)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/5 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25V6.375c0-.621.504-1.125 1.125-1.125h8.25M16.5 6.375V14.25" /></svg>
                                  Skoða bíl
                                </Link>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagedSamningar.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <div className="text-sm text-white/30">Engir samningar fundust</div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Hreinsa leit
                    </button>
                  )}
                </div>
              )}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Fyrri
                  </button>
                  <span className="text-xs text-white/30">
                    Síða {page + 1} af {totalPages} · {filteredSamningar.length} samningar
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Næsta
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kanbanColumns.map((col) => (
                <div key={col.key} className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-semibold text-white">{col.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 ml-auto">{col.items.length}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                    {col.items.map((s) => {
                      const f = getFyrirtaeki(s.fyrirtaekiId);
                      const progress = getProgressPercent(s.upphafsdagur, s.lokadagur);
                      const dagar = getDaysRemaining(s.lokadagur);
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSamningur(s)}
                          className="w-full text-left p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors"
                        >
                          <div className="text-xs font-medium text-white mb-1">{f?.nafn ?? '—'}</div>
                          <div className="text-[11px] text-white/60">{s.bilategund}</div>
                          <div className="text-[10px] text-white/40 mb-2">{s.bilanumer}</div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-medium text-green-400">{formatCurrency(s.manadalegurKostnadur)}</span>
                            {dagar !== null && dagar > 0 && s.status !== 'lokid' && s.status !== 'uppsagt' && (
                              <span className={`text-[10px] ${dagar <= 14 ? 'text-red-400' : dagar <= 30 ? 'text-orange-400' : 'text-white/40'}`}>{dagar}d</span>
                            )}
                          </div>
                          {s.status !== 'lokid' && s.status !== 'uppsagt' && (
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: progress >= 90 ? '#ef4444' : progress >= 75 ? '#f59e0b' : '#22c55e',
                                }}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {col.items.length === 0 && (
                      <div className="py-6 text-center text-[10px] text-white/20">Engir samningar</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Warnings */}
        <div>
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Samningaviðvaranir
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {warningItems.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <svg className="w-8 h-8 text-green-500/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-white/30">Engar viðvaranir</div>
                  <div className="text-xs text-white/20 mt-1">Allir samningar í góðu lagi</div>
                </div>
              ) : (
                warningItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const s = samningarList.find((s) => s.id === item.samningurId);
                      if (s) setSelectedSamningur(s);
                    }}
                    className="w-full px-5 py-3 hover:bg-white/[0.02] transition-colors text-left flex items-start gap-3"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: item.type === 'critical' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#3b82f6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 font-medium truncate">{item.label}</div>
                      <div className={`text-xs mt-0.5 ${item.type === 'critical' ? 'text-red-400' : item.type === 'warning' ? 'text-orange-400/70' : 'text-white/40'}`}>
                        {item.detail}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-white/20 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Recent activity mini-section */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden mt-4">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nýlegir samningar
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {samningarList
                .filter((s) => s.status === 'virkur')
                .sort((a, b) => b.upphafsdagur.localeCompare(a.upphafsdagur))
                .slice(0, 4)
                .map((s) => {
                  const f = getFyrirtaeki(s.fyrirtaekiId);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSamningur(s)}
                      className="w-full px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
                    >
                      <div className="text-xs text-white/70 font-medium">{f?.nafn} — {s.bilategund}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">
                        Hófst {s.upphafsdagur} · {formatCurrency(s.manadalegurKostnadur)}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSamningur && (
        <SamningurDetail
          samningur={selectedSamningur}
          onClose={() => setSelectedSamningur(null)}
          onUpdate={(updated) => {
            setSamningarList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setSelectedSamningur(updated);
          }}
        />
      )}

      {/* New Contract Modal */}
      {showNySamningur && (
        <NySamningurModal
          onClose={() => setShowNySamningur(false)}
          onSave={(newSamningur) => {
            setSamningarList((prev) => [newSamningur, ...prev]);
            setShowNySamningur(false);
            showToast('Samningur stofnaður');
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#1a1d2e] border border-white/10 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SamningurDetail — Contract detail modal with all tabs
   ═══════════════════════════════════════════════════════ */

function addMonthsToDate(from: string, months: number): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function SamningurDetail({ samningur, onClose, onUpdate }: { samningur: Samningur; onClose: () => void; onUpdate: (s: Samningur) => void }) {
  const f = getFyrirtaeki(samningur.fyrirtaekiId);
  const skjol = samningsSkjol.filter((s) => s.samningurId === samningur.id);
  const dagar = getDaysRemaining(samningur.lokadagur);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; date: string; blobUrl: string; mimeType: string }[]>([]);
  const [previewFile, setPreviewFile] = useState<{ name: string; blobUrl: string; mimeType: string; size: string; date: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'upplysingar' | 'fjarmal' | 'skjol' | 'afhending' | 'stjornun'>('upplysingar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionModal, setActionModal] = useState<'none' | 'endurnyja' | 'breyta' | 'senda' | 'uppsogn'>('none');
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [extraTimeline, setExtraTimeline] = useState<{ date: string; text: string; color: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [renewMonths, setRenewMonths] = useState(12);
  const [editKostnadur, setEditKostnadur] = useState(samningur.manadalegurKostnadur);
  const [editAkstur, setEditAkstur] = useState(samningur.aksturKmManudir);
  const [editTrygging, setEditTrygging] = useState<'Enterprise' | 'Plús' | 'Úrvals'>(samningur.tryggingarPakki);
  const [emailSubject, setEmailSubject] = useState(`Samningur ${samningur.bilanumer} - ${samningur.bilategund}`);
  const [emailBody, setEmailBody] = useState('');
  const [uppsognReason, setUppsognReason] = useState('');
  const [uppsognNotes, setUppsognNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const tengiliður = f?.tengiliðir?.find((t) => t.aðaltengiliður) ?? f?.tengiliðir?.[0];

  const showLocalToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 3000);
  };

  function handleRenew() {
    const newDate = addMonthsToDate(samningur.lokadagur, renewMonths);
    onUpdate({ ...samningur, lokadagur: newDate, status: 'virkur' });
    setExtraTimeline((prev) => [...prev, { date: today, text: `Samningur endurnýjaður um ${renewMonths} mánuði`, color: '#22c55e' }]);
    setActionModal('none');
    showLocalToast('Samningur endurnýjaður');
  }

  function handleEditTerms() {
    onUpdate({ ...samningur, manadalegurKostnadur: editKostnadur, aksturKmManudir: editAkstur, tryggingarPakki: editTrygging });
    setExtraTimeline((prev) => [...prev, { date: today, text: 'Samningsskilmálum breytt', color: '#3b82f6' }]);
    setActionModal('none');
    showLocalToast('Skilmálar uppfærðir');
  }

  function handleSendEmail() {
    setExtraTimeline((prev) => [...prev, { date: today, text: `Tilkynning send á ${f?.nafn ?? 'viðskiptavin'}`, color: '#f59e0b' }]);
    setActionModal('none');
    setEmailBody('');
    showLocalToast('Tilkynning send');
  }

  function handleTerminate() {
    onUpdate({ ...samningur, status: 'uppsagt' });
    setExtraTimeline((prev) => [...prev, { date: today, text: `Samningi sagt upp: ${uppsognReason}`, color: '#ef4444' }]);
    setActionModal('none');
    showLocalToast('Samningi sagt upp');
  }

  const tengdVerkefni = verkefni.filter((v) => v.samningurId === samningur.id);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = (files: FileList) => {
    const newFiles = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024 ? `${Math.round(f.size / 1024)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toISOString().split('T')[0],
      blobUrl: URL.createObjectURL(f),
      mimeType: f.type,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const totalTekjur = samningur.manadalegurKostnadur * Math.max(1, Math.ceil((new Date(samningur.lokadagur).getTime() - new Date(samningur.upphafsdagur).getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const progress = getProgressPercent(samningur.upphafsdagur, samningur.lokadagur);

  // Payment history (generated from contract data)
  const payments = useMemo(() => {
    const startDate = new Date(samningur.upphafsdagur);
    const endDate = new Date(samningur.lokadagur);
    const now = new Date();
    const result: { month: string; amount: number; status: 'greitt' | 'ógreitt' | 'framundan' }[] = [];
    const current = new Date(startDate);
    while (current <= endDate && result.length < 48) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const isPast = current < now;
      result.push({
        month: monthStr,
        amount: samningur.manadalegurKostnadur,
        status: isPast ? 'greitt' : current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear() ? 'ógreitt' : 'framundan',
      });
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [samningur]);

  const paidTotal = payments.filter((p) => p.status === 'greitt').reduce((sum, p) => sum + p.amount, 0);
  const remainingTotal = payments.filter((p) => p.status !== 'greitt').reduce((sum, p) => sum + p.amount, 0);

  // Afhending / Skil checklist items
  const [afhendingarChecklist, setAfhendingarChecklist] = useState([
    { id: 1, label: 'Ljósmyndir teknar af bíl', checked: true },
    { id: 2, label: 'Kílómetrastaða skráð', checked: true },
    { id: 3, label: 'Eldsneytisstaða skráð', checked: true },
    { id: 4, label: 'Ástandsskoðun lokið', checked: true },
    { id: 5, label: 'Samningur undirritaður', checked: true },
    { id: 6, label: 'Lyklar afhentir', checked: true },
  ]);
  const [skilaChecklist, setSkilaChecklist] = useState([
    { id: 1, label: 'Ljósmyndir teknar af bíl', checked: false },
    { id: 2, label: 'Kílómetrastaða skráð', checked: false },
    { id: 3, label: 'Eldsneytisstaða skráð', checked: false },
    { id: 4, label: 'Ástandsskoðun lokið', checked: false },
    { id: 5, label: 'Skaðaskráning gerð', checked: false },
    { id: 6, label: 'Lyklar skilaðir', checked: false },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#161822] border-b border-white/5 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">{samningur.bilategund}</h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: getStatusBg(samningur.status), color: getStatusColor(samningur.status) }}>
                  {statusLabels[samningur.status] ?? samningur.status}
                </span>
              </div>
              <div className="text-sm text-white/40 mt-0.5">{f?.nafn} · {samningur.bilanumer}</div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress bar in header */}
          {samningur.status !== 'lokid' && samningur.status !== 'uppsagt' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-white/40">{samningur.upphafsdagur}</span>
                <span className="text-white/40">{progress}% liðið</span>
                <span className="text-white/40">{samningur.lokadagur}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progress >= 90 ? '#ef4444' : progress >= 75 ? '#f59e0b' : '#22c55e' }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-1 border-b border-white/5 overflow-x-auto">
          {([
            { key: 'upplysingar' as const, label: 'Upplýsingar' },
            { key: 'fjarmal' as const, label: 'Fjármál' },
            { key: 'skjol' as const, label: 'Skjöl' },
            { key: 'afhending' as const, label: 'Afhending & Skil' },
            { key: 'stjornun' as const, label: 'Stjórnun' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ Tab: Upplýsingar ═══ */}
          {activeTab === 'upplysingar' && (
            <div className="space-y-6">
              {samningur.status === 'rennur_ut' && dagar !== null && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <svg className="w-5 h-5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-orange-500">Samningur rennur út eftir {dagar} daga</div>
                    <div className="text-xs text-orange-500/60 mt-0.5">Lokadagur: {samningur.lokadagur}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <InfoBox label="Tegund" value={samningur.tegund === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'} />
                <InfoBox label="Tryggingapakki" value={samningur.tryggingarPakki} />
                <InfoBox label="Upphafsdagur" value={samningur.upphafsdagur} />
                <InfoBox label="Lokadagur" value={samningur.lokadagur} />
                <InfoBox label="Mánaðarkostnaður" value={formatCurrency(samningur.manadalegurKostnadur)} accent="#22c55e" />
                <InfoBox label="Heildarverðmæti" value={formatCurrency(totalTekjur)} accent="#3b82f6" />
                <InfoBox label="Umsaminn akstur" value={`${samningur.aksturKmManudir.toLocaleString('is-IS')} km/mán`} />
                <InfoBox label="Bílnúmer" value={samningur.bilanumer} />
              </div>

              {samningur.athugasemdir && (
                <div className="bg-white/5 rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-white/40 mb-1">Athugasemdir</div>
                  <div className="text-sm text-white/80">{samningur.athugasemdir}</div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-white/40 mb-2">Innifalið í leigu</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {innifaliðILeigu.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                      <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {tengdVerkefni.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-white/40 mb-2">Tengd verkefni</div>
                  <div className="space-y-2">
                    {tengdVerkefni.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(v.status) }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/80 truncate">{v.titill}</div>
                          <div className="text-xs text-white/40">{v.abyrgdaradili}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Tab: Fjármál ═══ */}
          {activeTab === 'fjarmal' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-[10px] text-white/40 mb-1">Greitt</div>
                  <div className="text-sm font-bold text-green-400">{formatCurrency(paidTotal)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-[10px] text-white/40 mb-1">Eftirstöðvar</div>
                  <div className="text-sm font-bold text-amber-400">{formatCurrency(remainingTotal)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-[10px] text-white/40 mb-1">Heildarverðmæti</div>
                  <div className="text-sm font-bold text-blue-400">{formatCurrency(totalTekjur)}</div>
                </div>
              </div>

              {/* Revenue progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/40">Uppsafnaðar tekjur</span>
                  <span className="text-white/60">{Math.round((paidTotal / totalTekjur) * 100)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all" style={{ width: `${(paidTotal / totalTekjur) * 100}%` }} />
                </div>
              </div>

              {/* Renewal projection */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <div className="text-xs font-medium text-blue-400 mb-2">Framreiknuð tekjuáætlun við endurnýjun</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[12, 24, 36].map((m) => (
                    <div key={m} className="bg-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-white/40">{m} mán</div>
                      <div className="text-sm font-semibold text-blue-400 mt-1">{formatCurrency(samningur.manadalegurKostnadur * m)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment history */}
              <div>
                <div className="text-xs font-medium text-white/40 mb-3">Greiðslusaga</div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {payments.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'greitt' ? 'bg-green-400' : p.status === 'ógreitt' ? 'bg-amber-400' : 'bg-white/20'
                        }`}
                      />
                      <span className="text-xs text-white/60 w-20">{p.month}</span>
                      <span className="text-xs font-medium text-white/80 flex-1">{formatCurrency(p.amount)}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'greitt'
                            ? 'bg-green-500/15 text-green-400'
                            : p.status === 'ógreitt'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {p.status === 'greitt' ? 'Greitt' : p.status === 'ógreitt' ? 'Ógreitt' : 'Framundan'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra costs info */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs font-medium text-white/40 mb-2">Umframakstur og aukagjöld</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-white/30">Umsaminn akstur</div>
                    <div className="text-sm text-white/80">{samningur.aksturKmManudir.toLocaleString('is-IS')} km/mán</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/30">Gjald yfir mörk</div>
                    <div className="text-sm text-white/80">{samningur.tegund === 'flotaleiga' ? '25' : '18'} kr./km</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Tab: Skjöl (with drag-and-drop) ═══ */}
          {activeTab === 'skjol' && (
            <div className="space-y-5">
              {/* Drag-and-drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <svg className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div className="text-sm text-white/50 font-medium">
                  {isDragging ? 'Slepptu skjalinu hér' : 'Dragðu skjöl hingað eða smelltu til að velja'}
                </div>
                <div className="text-xs text-white/30 mt-1">PDF, Word, Excel, myndir</div>
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" multiple onChange={handleFileUpload} />
              </div>

              {/* Document categories */}
              {(skjol.length > 0 || uploadedFiles.length > 0) && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-white/40">Samningsskjöl</div>
                  <div className="space-y-2">
                    {skjol.map((sk) => (
                      <FileRow key={sk.id} name={sk.nafn} type={sk.tegund} date={sk.dagsett} size={sk.staerd} source="Taktikal" signed={sk.tegund === 'samningur'} />
                    ))}
                    {uploadedFiles.map((f, i) => (
                      <FileRow
                        key={`uploaded-${i}`}
                        name={f.name}
                        type="annað"
                        date={f.date}
                        size={f.size}
                        source="Hlaðið upp"
                        isNew
                        blobUrl={f.blobUrl}
                        mimeType={f.mimeType}
                        onPreview={() => setPreviewFile({ name: f.name, blobUrl: f.blobUrl, mimeType: f.mimeType, size: f.size, date: f.date })}
                        onRemove={() => {
                          URL.revokeObjectURL(f.blobUrl);
                          setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {skjol.length === 0 && uploadedFiles.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-sm text-white/30">Engin skjöl skráð</div>
                  <div className="text-xs text-white/20 mt-1">Hladdu upp eða dragðu skjöl í svæðið hér að ofan</div>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-white/60">Taktikal tenging</div>
                  <div className="text-xs text-white/40 mt-0.5">Hægt er að hlaða upp samningsskjölum beint úr Taktikal kerfinu. Skjölin vistast í skjalavistunarkerfi Enterprise.</div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Tab: Afhending & Skil ═══ */}
          {activeTab === 'afhending' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Afhending */}
                <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Afhending</div>
                      <div className="text-[10px] text-white/40">{samningur.upphafsdagur}</div>
                    </div>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Lokið</span>
                  </div>
                  <div className="space-y-2">
                    {afhendingarChecklist.map((item) => (
                      <label key={item.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            setAfhendingarChecklist((prev) =>
                              prev.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c))
                            )
                          }
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/30 focus:ring-offset-0"
                        />
                        <span className={`text-xs ${item.checked ? 'text-white/60' : 'text-white/40'}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Kílómetrastaða</span>
                      <span className="text-white/70">{(Math.round(Math.random() * 5000 + 10000)).toLocaleString('is-IS')} km</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Eldsneyti</span>
                      <span className="text-white/70">Fullt</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Ástand</span>
                      <span className="text-green-400">Gott</span>
                    </div>
                  </div>
                </div>

                {/* Skil */}
                <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Skil</div>
                      <div className="text-[10px] text-white/40">{samningur.lokadagur}</div>
                    </div>
                    {samningur.status === 'lokid' || samningur.status === 'uppsagt' ? (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Lokið</span>
                    ) : (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Bíður</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {skilaChecklist.map((item) => (
                      <label key={item.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            setSkilaChecklist((prev) =>
                              prev.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c))
                            )
                          }
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0"
                        />
                        <span className={`text-xs ${item.checked ? 'text-white/60' : 'text-white/40'}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-center">
                    <div className="text-xs text-white/30">Skilagögn skráð þegar bíll er skilað</div>
                  </div>
                </div>
              </div>

              {/* Comparison section */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-xs font-medium text-white/40 mb-3">Samanburður: Afhending vs Skil</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-white/30 mb-1">Atriði</div>
                    <div className="text-[10px] text-white/30">Kílómetrar</div>
                    <div className="text-[10px] text-white/30 mt-1">Eldsneyti</div>
                    <div className="text-[10px] text-white/30 mt-1">Ástand</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-green-400 mb-1">Afhending</div>
                    <div className="text-xs text-white/70">12.450 km</div>
                    <div className="text-xs text-white/70 mt-1">Fullt</div>
                    <div className="text-xs text-green-400 mt-1">Gott</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-400 mb-1">Skil</div>
                    <div className="text-xs text-white/40">—</div>
                    <div className="text-xs text-white/40 mt-1">—</div>
                    <div className="text-xs text-white/40 mt-1">—</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ Tab: Samningsstjórnun ═══ */}
          {activeTab === 'stjornun' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-white/40 mb-1">Staða</div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: getStatusBg(samningur.status), color: getStatusColor(samningur.status) }}>
                    {statusLabels[samningur.status] ?? samningur.status}
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-white/40 mb-1">Dagar eftir</div>
                  <div className={`text-lg font-bold ${dagar !== null && dagar <= 30 ? 'text-orange-500' : 'text-white'}`}>
                    {dagar !== null && dagar > 0 ? dagar : '—'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-white/40 mb-1">Skjöl</div>
                  <div className="text-lg font-bold text-white">{skjol.length + uploadedFiles.length}</div>
                </div>
              </div>

              {actionModal === 'none' ? (
                <>
                  <div>
                    <div className="text-xs font-medium text-white/40 mb-3">Aðgerðir</div>
                    <div className="space-y-2">
                      <ActionButton icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" label="Endurnýja samning" description="Framlengja eða endurnýja samningsskilmála" color="#22c55e" onClick={() => setActionModal('endurnyja')} />
                      <ActionButton icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" label="Breyta samningsskilmálum" description="Uppfæra akstur, tryggingar eða önnur skilyrði" color="#3b82f6" onClick={() => { setEditKostnadur(samningur.manadalegurKostnadur); setEditAkstur(samningur.aksturKmManudir); setEditTrygging(samningur.tryggingarPakki); setActionModal('breyta'); }} />
                      <ActionButton icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" label="Senda tilkynningu á viðskiptavin" description={`Senda tölvupóst á ${f?.nafn ?? 'viðskiptavin'}`} color="#f59e0b" onClick={() => setActionModal('senda')} />
                      {samningur.status !== 'lokid' && samningur.status !== 'uppsagt' && (
                        <ActionButton icon="M6 18L18 6M6 6l12 12" label="Segja upp samningi" description="Hefja uppsagnarferli á samningi" color="#ef4444" onClick={() => { setUppsognReason(''); setUppsognNotes(''); setActionModal('uppsogn'); }} />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white/40 mb-3">Saga samnings</div>
                    <div className="space-y-0 border-l-2 border-white/5 ml-2">
                      <TimelineItem date={samningur.upphafsdagur} text="Samningur undirritaður" color="#22c55e" />
                      {samningur.athugasemdir && <TimelineItem date="" text={samningur.athugasemdir} color="#3b82f6" />}
                      {extraTimeline.map((t, i) => (
                        <TimelineItem key={i} date={t.date} text={t.text} color={t.color} />
                      ))}
                      {samningur.status === 'rennur_ut' && <TimelineItem date={samningur.lokadagur} text="Samningur rennur út" color="#f59e0b" upcoming />}
                    </div>
                  </div>
                </>
              ) : actionModal === 'endurnyja' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Endurnýja samning</h3>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Núverandi lokadagur</span>
                      <span className="text-white/80">{samningur.lokadagur}</span>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-2 block">Framlengja um</label>
                      <div className="flex gap-2">
                        {[6, 12, 24, 36].map((m) => (
                          <button key={m} onClick={() => setRenewMonths(m)} className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${renewMonths === m ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'}`}>
                            {m} mán
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs pt-3 border-t border-white/5">
                      <span className="text-white/40">Nýr lokadagur</span>
                      <span className="text-green-400 font-semibold">{addMonthsToDate(samningur.lokadagur, renewMonths)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Áætlaðar tekjur</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(samningur.manadalegurKostnadur * renewMonths)}</span>
                    </div>
                  </div>
                  <button onClick={handleRenew} className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors">
                    Staðfesta endurnýjun
                  </button>
                </div>
              ) : actionModal === 'breyta' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Breyta samningsskilmálum</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Mánaðarkostnaður (kr.)</label>
                      <input type="number" value={editKostnadur} onChange={(e) => setEditKostnadur(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Akstur (km/mán)</label>
                      <input type="number" value={editAkstur} onChange={(e) => setEditAkstur(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Tryggingapakki</label>
                      <select value={editTrygging} onChange={(e) => setEditTrygging(e.target.value as 'Enterprise' | 'Plús' | 'Úrvals')} className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" style={{ colorScheme: 'dark' }}>
                        <option value="Enterprise" style={{ background: '#1a1d2e', color: '#ffffff' }}>Enterprise</option>
                        <option value="Plús" style={{ background: '#1a1d2e', color: '#ffffff' }}>Plús</option>
                        <option value="Úrvals" style={{ background: '#1a1d2e', color: '#ffffff' }}>Úrvals</option>
                      </select>
                    </div>
                  </div>
                  {(editKostnadur !== samningur.manadalegurKostnadur || editAkstur !== samningur.aksturKmManudir || editTrygging !== samningur.tryggingarPakki) && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1">
                      <div className="text-xs font-medium text-blue-400">Breytingar</div>
                      {editKostnadur !== samningur.manadalegurKostnadur && <div className="text-xs text-blue-400/70">Kostnaður: {formatCurrency(samningur.manadalegurKostnadur)} → {formatCurrency(editKostnadur)}</div>}
                      {editAkstur !== samningur.aksturKmManudir && <div className="text-xs text-blue-400/70">Akstur: {samningur.aksturKmManudir.toLocaleString('is-IS')} → {editAkstur.toLocaleString('is-IS')} km/mán</div>}
                      {editTrygging !== samningur.tryggingarPakki && <div className="text-xs text-blue-400/70">Trygging: {samningur.tryggingarPakki} → {editTrygging}</div>}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setActionModal('none')} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors">Hætta við</button>
                    <button onClick={handleEditTerms} disabled={editKostnadur === samningur.manadalegurKostnadur && editAkstur === samningur.aksturKmManudir && editTrygging === samningur.tryggingarPakki} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">Vista breytingar</button>
                  </div>
                </div>
              ) : actionModal === 'senda' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Senda tilkynningu</h3>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </div>
                    <div>
                      <div className="text-sm text-white/80 font-medium">{tengiliður?.nafn ?? f?.nafn}</div>
                      <div className="text-xs text-white/40">{tengiliður?.netfang ?? `${f?.nafn?.toLowerCase().replace(/ /g, '')}@fyrirtaeki.is`}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Sniðmát</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'renewal', label: 'Endurnýjun', text: `Kæri viðskiptavinur,\n\nSamningur um ${samningur.bilategund} (${samningur.bilanumer}) rennur út ${samningur.lokadagur}. Við viljum bjóða ykkur að endurnýja samninginn á hagstæðum kjörum.\n\nEndilega hafið samband.\n\nKveðja,\nEnterprise bílaútleiga` },
                        { id: 'payment', label: 'Greiðsla', text: `Kæri viðskiptavinur,\n\nHér er áminning um greiðslu samnings um ${samningur.bilategund} (${samningur.bilanumer}). Mánaðarleg greiðsla er ${formatCurrency(samningur.manadalegurKostnadur)}.\n\nKveðja,\nEnterprise bílaútleiga` },
                        { id: 'info', label: 'Upplýsingar', text: `Kæri viðskiptavinur,\n\nHér eru upplýsingar varðandi samning um ${samningur.bilategund} (${samningur.bilanumer}).\n\n` },
                      ].map((t) => (
                        <button key={t.id} onClick={() => setEmailBody(t.text)} className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors border border-white/5">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Efni</label>
                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Skilaboð</label>
                    <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} placeholder="Skrifaðu skilaboð eða veldu sniðmát..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                  </div>
                  <button onClick={handleSendEmail} disabled={!emailBody.trim()} className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Senda tilkynningu
                  </button>
                </div>
              ) : actionModal === 'uppsogn' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Segja upp samningi</h3>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-red-400">Þessi aðgerð er ekki afturkræf</div>
                      <div className="text-xs text-red-400/60 mt-0.5">Samningurinn verður merktur sem uppsagður.</div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/40">Samningur</span><span className="text-white/80">{samningur.bilategund} · {samningur.bilanumer}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Viðskiptavinur</span><span className="text-white/80">{f?.nafn}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Mánaðarkostnaður</span><span className="text-white/80">{formatCurrency(samningur.manadalegurKostnadur)}</span></div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Ástæða uppsagnar</label>
                    <select value={uppsognReason} onChange={(e) => setUppsognReason(e.target.value)} className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30" style={{ colorScheme: 'dark' }}>
                      <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>Veldu ástæðu...</option>
                      <option value="Vanefndir viðskiptavinar" style={{ background: '#1a1d2e', color: '#ffffff' }}>Vanefndir viðskiptavinar</option>
                      <option value="Samkomulag aðila" style={{ background: '#1a1d2e', color: '#ffffff' }}>Samkomulag aðila</option>
                      <option value="Samningur runninn út" style={{ background: '#1a1d2e', color: '#ffffff' }}>Samningur runninn út</option>
                      <option value="Viðskiptavinur óskar eftir uppsögn" style={{ background: '#1a1d2e', color: '#ffffff' }}>Viðskiptavinur óskar eftir uppsögn</option>
                      <option value="Annað" style={{ background: '#1a1d2e', color: '#ffffff' }}>Annað</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Athugasemdir (valkvætt)</label>
                    <textarea value={uppsognNotes} onChange={(e) => setUppsognNotes(e.target.value)} rows={3} placeholder="Frekari athugasemdir..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActionModal('none')} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors">Hætta við</button>
                    <button onClick={handleTerminate} disabled={!uppsognReason} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">Segja upp samningi</button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {localToast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#1a1d2e] border border-white/10 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {localToast}
        </div>
      )}

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════
   Shared UI components
   ═══════════════════════ */

function InfoBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-4 py-3">
      <div className="text-[10px] font-medium text-white/40 mb-1">{label}</div>
      <div className="text-sm font-semibold" style={{ color: accent || undefined }}>
        <span className={accent ? '' : 'text-white/90'}>{value}</span>
      </div>
    </div>
  );
}

function getFileTypeInfo(name: string, mimeType?: string): { icon: string; color: string; bgColor: string; label: string } {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || mimeType?.includes('pdf'))
    return { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: '#ef4444', bgColor: '#ef444415', label: 'PDF' };
  if (['doc', 'docx'].includes(ext) || mimeType?.includes('word'))
    return { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: '#3b82f6', bgColor: '#3b82f615', label: 'Word' };
  if (['xls', 'xlsx'].includes(ext) || mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
    return { icon: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0 0h-7.5', color: '#22c55e', bgColor: '#22c55e15', label: 'Excel' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mimeType?.startsWith('image/'))
    return { icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM10.5 8.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z', color: '#8b5cf6', bgColor: '#8b5cf615', label: 'Mynd' };
  return { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: '#6b7280', bgColor: '#6b728015', label: 'Skjal' };
}

function isPreviewable(name: string, mimeType?: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(ext) || mimeType?.startsWith('image/') || mimeType?.includes('pdf') || false;
}

function FileRow({ name, type, date, size, source, isNew, signed, blobUrl, mimeType, onPreview, onRemove }: {
  name: string; type: string; date: string; size: string; source?: string; isNew?: boolean; signed?: boolean;
  blobUrl?: string; mimeType?: string; onPreview?: () => void; onRemove?: () => void;
}) {
  const fileInfo = getFileTypeInfo(name, mimeType);
  const canPreview = blobUrl && isPreviewable(name, mimeType);
  const isImage = mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(name.split('.').pop()?.toLowerCase() || '');

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/[0.08] transition-all duration-200 ${blobUrl ? 'cursor-pointer hover:ring-1 hover:ring-white/10' : ''}`}
      onClick={blobUrl ? onPreview : undefined}
    >
      {isImage && blobUrl ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={blobUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: fileInfo.bgColor }}>
          <svg className="w-5 h-5" style={{ color: fileInfo.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={fileInfo.icon} />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/80 truncate font-medium">{name}</div>
        <div className="text-xs text-white/40 flex items-center gap-1.5">
          <span style={{ color: fileInfo.color }} className="font-medium">{fileInfo.label}</span>
          <span className="text-white/20">·</span>
          <span>{date}</span>
          <span className="text-white/20">·</span>
          <span>{size}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {signed && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Undirritað
          </span>
        )}
        {source && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isNew ? 'bg-green-500/15 text-green-400' : 'bg-purple-500/15 text-purple-400'}`}>
            {source}
          </span>
        )}
        {blobUrl && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canPreview && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreview?.(); }}
                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                title="Forskoða"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <a
              href={blobUrl}
              download={name}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              title="Hlaða niður"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </a>
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors"
                title="Eyða"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        {!blobUrl && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/5 text-white/40 capitalize">{type}</span>
        )}
      </div>
    </div>
  );
}

function FilePreviewModal({ file, onClose }: {
  file: { name: string; blobUrl: string; mimeType: string; size: string; date: string };
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const fileInfo = getFileTypeInfo(file.name, file.mimeType);
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType?.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) handleClose(); }}
      className={`fixed inset-0 z-[70] flex items-center justify-center p-6 transition-colors duration-200 ${isVisible ? 'bg-black/80' : 'bg-black/0'}`}
    >
      <div className={`relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-[#0f1117] rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: fileInfo.bgColor }}>
            <svg className="w-4.5 h-4.5" style={{ color: fileInfo.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={fileInfo.icon} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{file.name}</h3>
            <div className="text-xs text-white/40 flex items-center gap-2">
              <span style={{ color: fileInfo.color }}>{fileInfo.label}</span>
              <span className="text-white/20">·</span>
              <span>{file.size}</span>
              <span className="text-white/20">·</span>
              <span>{file.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={file.blobUrl}
              download={file.name}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Hlaða niður
            </a>
            <a
              href={file.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors"
              title="Opna í nýjum flipa"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
            <button
              onClick={handleClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto min-h-0">
          {isImage ? (
            <div className="flex items-center justify-center p-6 bg-[#080a0f]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.blobUrl}
                alt={file.name}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={file.blobUrl}
              className="w-full h-[70vh]"
              title={file.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: fileInfo.bgColor }}>
                <svg className="w-10 h-10" style={{ color: fileInfo.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={fileInfo.icon} />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-white mb-1">{file.name}</h4>
              <p className="text-sm text-white/40 mb-6">{fileInfo.label} · {file.size}</p>
              <div className="flex gap-3">
                <a
                  href={file.blobUrl}
                  download={file.name}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Hlaða niður
                </a>
                <a
                  href={file.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Opna í forriti
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, description, color, onClick }: {
  icon: string; label: string; description: string; color: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/[0.07] transition-colors text-left group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
        <svg className="w-4.5 h-4.5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function TimelineItem({ date, text, color, upcoming }: { date: string; text: string; color: string; upcoming?: boolean }) {
  return (
    <div className="flex items-start gap-3 pl-4 py-2 relative">
      <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2 h-2 rounded-full border-2" style={{ borderColor: color, backgroundColor: upcoming ? 'transparent' : color }} />
      <div className="flex-1">
        <div className={`text-sm ${upcoming ? 'text-white/50 italic' : 'text-white/70'}`}>{text}</div>
        {date && <div className="text-xs text-white/30 mt-0.5">{date}</div>}
      </div>
    </div>
  );
}
