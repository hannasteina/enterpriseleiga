'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  mal as initialMal,
  getFyrirtaeki,
  getStatusColor,
  getStatusBg,
  getBill,
  type Mal,
} from '@/lib/enterprise-demo-data';
import MalModal from '@/components/MalModal';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

const tegundLabels: Record<string, string> = {
  tjón: 'Tjón',
  kvörtun: 'Kvörtun',
  þjónustubeiðni: 'Þjónustubeiðni',
  'breyting á samningi': 'Breyting á samningi',
  fyrirspurn: 'Fyrirspurn',
  annað: 'Annað',
};

const statusLabels: Record<string, string> = {
  opið: 'Opið',
  'í vinnslu': 'Í vinnslu',
  'bíður viðskiptavinar': 'Bíður viðskiptavinar',
  lokað: 'Lokið',
};

const forgangurLabels: Record<string, string> = {
  bráður: 'Bráður',
  hár: 'Hár',
  miðlungs: 'Miðlungs',
  lágur: 'Lágur',
};

const forgangurColors: Record<string, string> = {
  bráður: '#ef4444',
  hár: '#f59e0b',
  miðlungs: '#3b82f6',
  lágur: '#6b7280',
};

const tegundColors: Record<string, string> = {
  tjón: '#ef4444',
  kvörtun: '#f59e0b',
  þjónustubeiðni: '#3b82f6',
  'breyting á samningi': '#8b5cf6',
  fyrirspurn: '#22c55e',
  annað: '#6b7280',
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'short',
  });
}

function RowActionMenu({
  mal,
  onEdit,
  onStatusChange,
  onForgangurChange,
}: {
  mal: Mal;
  onEdit: () => void;
  onStatusChange: (status: Mal['status']) => void;
  onForgangurChange: (forgangur: Mal['forgangur']) => void;
}) {
  const [open, setOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<'none' | 'status' | 'forgangur'>('none');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSubMenu('none');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const allStatuses: Mal['status'][] = ['opið', 'í vinnslu', 'bíður viðskiptavinar', 'lokað'];
  const allForgangur: Mal['forgangur'][] = ['lágur', 'miðlungs', 'hár', 'bráður'];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen(!open); setSubMenu('none'); }}
        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-xl min-w-[180px] py-1">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Breyta máli
          </button>

          <div className="relative">
            <button
              onClick={() => setSubMenu(subMenu === 'status' ? 'none' : 'status')}
              className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Breyta stöðu
              </span>
              <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {subMenu === 'status' && (
              <div className="absolute left-full top-0 ml-1 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-xl min-w-[170px] py-1">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setOpen(false); setSubMenu('none'); }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      s === mal.status
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getStatusColor(s) }}
                    />
                    {statusLabels[s]}
                    {s === mal.status && (
                      <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setSubMenu(subMenu === 'forgangur' ? 'none' : 'forgangur')}
              className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Breyta forgang
              </span>
              <svg className="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {subMenu === 'forgangur' && (
              <div className="absolute left-full top-0 ml-1 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-xl min-w-[150px] py-1">
                {allForgangur.map((f) => (
                  <button
                    key={f}
                    onClick={() => { onForgangurChange(f); setOpen(false); setSubMenu('none'); }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      f === mal.forgangur
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: forgangurColors[f] }}
                    />
                    {forgangurLabels[f]}
                    {f === mal.forgangur && (
                      <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 my-1" />

          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Skoða nánar
          </button>
        </div>
      )}
    </div>
  );
}

function ColumnFilterDropdown({
  label,
  columnId,
  options,
  selected,
  onChange,
  openFilter,
  setOpenFilter,
}: {
  label: string;
  columnId: string;
  options: FilterOption[];
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  openFilter: string | null;
  setOpenFilter: (id: string | null) => void;
}) {
  const ref = useRef<HTMLTableHeaderCellElement>(null);
  const isOpen = openFilter === columnId;
  const hasFilter = selected.size > 0;

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, setOpenFilter]);

  return (
    <th className="px-5 py-3 text-left relative" ref={ref}>
      <button
        onClick={() => setOpenFilter(isOpen ? null : columnId)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap ${
          hasFilter ? 'text-blue-400' : 'text-white/40 hover:text-white/60'
        }`}
      >
        {label}
        {hasFilter && (
          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1 rounded-full min-w-[16px] text-center leading-4">
            {selected.size}
          </span>
        )}
        <svg className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-40 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-xl min-w-[200px] py-1">
          {hasFilter && (
            <button
              onClick={() => onChange(new Set())}
              className="w-full px-3 py-1.5 text-left text-[11px] text-blue-400 hover:bg-white/5 transition-colors border-b border-white/5 mb-0.5"
            >
              Hreinsa val
            </button>
          )}
          <div className="max-h-[250px] overflow-y-auto">
            {options.map((opt) => {
              const checked = selected.size === 0 || selected.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = new Set(selected);
                    if (selected.size === 0) {
                      options.forEach((o) => { if (o.value !== opt.value) next.add(o.value); });
                    } else if (next.has(opt.value)) {
                      next.delete(opt.value);
                    } else {
                      next.add(opt.value);
                    }
                    if (next.size === 0 || next.size === options.length) {
                      onChange(new Set());
                    } else {
                      onChange(next);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-white/20 bg-transparent'
                  }`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {opt.color && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                  )}
                  <span className="text-xs text-white/80 whitespace-nowrap">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </th>
  );
}

export default function MalaskraningPage() {
  const [malList, setMalList] = useState<Mal[]>([...initialMal]);
  const [tegundFilters, setTegundFilters] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [forgangurFilters, setForgangurFilters] = useState<Set<string>>(new Set());
  const [fyrirtaekiFilters, setFyrirtaekiFilters] = useState<Set<string>>(new Set());
  const [abyrgdaradiliFilters, setAbyrgdaradiliFilters] = useState<Set<string>>(new Set());
  const [openHeaderFilter, setOpenHeaderFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMal, setEditingMal] = useState<Mal | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const filterOptions = useMemo(() => {
    const tegundOpts: FilterOption[] = Object.entries(tegundLabels).map(([value, label]) => ({
      value, label, color: tegundColors[value],
    }));
    const statusOpts: FilterOption[] = Object.entries(statusLabels).map(([value, label]) => ({
      value, label, color: getStatusColor(value),
    }));
    const forgangurOpts: FilterOption[] = Object.entries(forgangurLabels).map(([value, label]) => ({
      value, label, color: forgangurColors[value],
    }));
    const fyrirtaekiIds = [...new Set(malList.map((m) => m.fyrirtaekiId))];
    const fyrirtaekiOpts: FilterOption[] = fyrirtaekiIds
      .map((id) => ({ value: id, label: getFyrirtaeki(id)?.nafn ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'is'));
    const abyrgdaradiliOpts: FilterOption[] = [...new Set(malList.map((m) => m.abyrgdaraðili))]
      .sort((a, b) => a.localeCompare(b, 'is'))
      .map((name) => ({ value: name, label: name }));
    return { tegundOpts, statusOpts, forgangurOpts, fyrirtaekiOpts, abyrgdaradiliOpts };
  }, [malList]);

  const hasActiveFilters = tegundFilters.size > 0 || statusFilters.size > 0 || forgangurFilters.size > 0 || fyrirtaekiFilters.size > 0 || abyrgdaradiliFilters.size > 0;

  function clearAllFilters() {
    setTegundFilters(new Set());
    setStatusFilters(new Set());
    setForgangurFilters(new Set());
    setFyrirtaekiFilters(new Set());
    setAbyrgdaradiliFilters(new Set());
    setSearchQuery('');
    setOpenHeaderFilter(null);
  }

  const filteredMal = useMemo(() => {
    return malList.filter((m) => {
      const tegundMatch = tegundFilters.size === 0 || tegundFilters.has(m.tegund);
      const statusMatch = statusFilters.size === 0 || statusFilters.has(m.status);
      const forgangurMatch = forgangurFilters.size === 0 || forgangurFilters.has(m.forgangur);
      const fyrirtaekiMatch = fyrirtaekiFilters.size === 0 || fyrirtaekiFilters.has(m.fyrirtaekiId);
      const abyrgdaradiliMatch = abyrgdaradiliFilters.size === 0 || abyrgdaradiliFilters.has(m.abyrgdaraðili);
      const searchMatch =
        !searchQuery ||
        m.titill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.lýsing.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.abyrgdaraðili.toLowerCase().includes(searchQuery.toLowerCase());
      return tegundMatch && statusMatch && forgangurMatch && fyrirtaekiMatch && abyrgdaradiliMatch && searchMatch;
    });
  }, [malList, tegundFilters, statusFilters, forgangurFilters, fyrirtaekiFilters, abyrgdaradiliFilters, searchQuery]);

  const stats = useMemo(() => {
    const opin = malList.filter((m) => m.status === 'opið').length;
    const iVinnslu = malList.filter((m) => m.status === 'í vinnslu').length;
    const bidurVidskiptavinar = malList.filter(
      (m) => m.status === 'bíður viðskiptavinar'
    ).length;
    const lokid = malList.filter((m) => m.status === 'lokað').length;
    return { opin, iVinnslu, bidurVidskiptavinar, lokid };
  }, [malList]);

  function handleSave(saved: Mal) {
    setMalList((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    showToast(editingMal ? 'Máli breytt' : 'Nýtt mál skráð');
  }

  function handleDelete(id: string) {
    setMalList((prev) => prev.filter((m) => m.id !== id));
    showToast('Máli eytt');
  }

  function handleStatusChange(id: string, status: Mal['status']) {
    setMalList((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status, sidastUppfaert: new Date().toISOString().split('T')[0] }
          : m
      )
    );
    showToast(`Staða breytt í: ${statusLabels[status]}`);
  }

  function handleForgangurChange(id: string, forgangur: Mal['forgangur']) {
    setMalList((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, forgangur, sidastUppfaert: new Date().toISOString().split('T')[0] }
          : m
      )
    );
    showToast(`Forgangur breyttur í: ${forgangurLabels[forgangur]}`);
  }

  function handleExportCSV() {
    const headers = ['Titill', 'Tegund', 'Fyrirtæki', 'Bíll', 'Staða', 'Forgangur', 'Ábyrgðaraðili', 'Síðast uppfært'];
    const rows = filteredMal.map((m) => {
      const fyrirtaeki = getFyrirtaeki(m.fyrirtaekiId);
      const bill = m.billId ? getBill(m.billId) : null;
      return [
        m.titill,
        tegundLabels[m.tegund] ?? m.tegund,
        fyrirtaeki?.nafn ?? '',
        bill?.numer ?? '',
        statusLabels[m.status] ?? m.status,
        forgangurLabels[m.forgangur] ?? m.forgangur,
        m.abyrgdaraðili,
        m.sidastUppfaert,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malaskraning-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV skrá sótt');
  }

  function openCreate() {
    setEditingMal(null);
    setShowModal(true);
  }

  function openEdit(m: Mal) {
    setEditingMal(m);
    setShowModal(true);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Málaskráning</h1>
          <p className="text-sm text-white/40 mt-1">
            Tjón, kvartanir og þjónustubeiðnir
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Sækja CSV
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Skrá nýtt mál
          </button>
        </div>
      </div>

      {/* Search + Clear filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Leita í málum..."
            className="w-full bg-[#161822] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {(hasActiveFilters || searchQuery) && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-2.5 text-xs text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Hreinsa síur
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilters(statusFilters.size === 1 && statusFilters.has('opið') ? new Set() : new Set(['opið']))}
          className={`bg-[#161822] rounded-xl border p-5 text-left transition-colors ${
            statusFilters.size === 1 && statusFilters.has('opið') ? 'border-blue-500/40' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="text-xs font-medium text-white/40 mb-2">Opin mál</div>
          <div className="text-2xl font-bold text-white">{stats.opin}</div>
        </button>
        <button
          onClick={() => setStatusFilters(statusFilters.size === 1 && statusFilters.has('í vinnslu') ? new Set() : new Set(['í vinnslu']))}
          className={`bg-[#161822] rounded-xl border p-5 text-left transition-colors ${
            statusFilters.size === 1 && statusFilters.has('í vinnslu') ? 'border-yellow-500/40' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="text-xs font-medium text-white/40 mb-2">Í vinnslu</div>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
            {stats.iVinnslu}
          </div>
        </button>
        <button
          onClick={() => setStatusFilters(statusFilters.size === 1 && statusFilters.has('bíður viðskiptavinar') ? new Set() : new Set(['bíður viðskiptavinar']))}
          className={`bg-[#161822] rounded-xl border p-5 text-left transition-colors ${
            statusFilters.size === 1 && statusFilters.has('bíður viðskiptavinar') ? 'border-purple-500/40' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="text-xs font-medium text-white/40 mb-2">
            Bíður viðskiptavinar
          </div>
          <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
            {stats.bidurVidskiptavinar}
          </div>
        </button>
        <button
          onClick={() => setStatusFilters(statusFilters.size === 1 && statusFilters.has('lokað') ? new Set() : new Set(['lokað']))}
          className={`bg-[#161822] rounded-xl border p-5 text-left transition-colors ${
            statusFilters.size === 1 && statusFilters.has('lokað') ? 'border-gray-500/40' : 'border-white/5 hover:border-white/10'
          }`}
        >
          <div className="text-xs font-medium text-white/40 mb-2">Lokið</div>
          <div className="text-2xl font-bold" style={{ color: '#6b7280' }}>
            {stats.lokid}
          </div>
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Mál
            <span className="text-white/30 font-normal ml-2">
              {filteredMal.length} af {malList.length}
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">
                  Titill
                </th>
                <ColumnFilterDropdown
                  label="Tegund"
                  columnId="tegund"
                  options={filterOptions.tegundOpts}
                  selected={tegundFilters}
                  onChange={setTegundFilters}
                  openFilter={openHeaderFilter}
                  setOpenFilter={setOpenHeaderFilter}
                />
                <ColumnFilterDropdown
                  label="Fyrirtæki"
                  columnId="fyrirtaeki"
                  options={filterOptions.fyrirtaekiOpts}
                  selected={fyrirtaekiFilters}
                  onChange={setFyrirtaekiFilters}
                  openFilter={openHeaderFilter}
                  setOpenFilter={setOpenHeaderFilter}
                />
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">
                  Bíll
                </th>
                <ColumnFilterDropdown
                  label="Staða"
                  columnId="status"
                  options={filterOptions.statusOpts}
                  selected={statusFilters}
                  onChange={setStatusFilters}
                  openFilter={openHeaderFilter}
                  setOpenFilter={setOpenHeaderFilter}
                />
                <ColumnFilterDropdown
                  label="Forgangur"
                  columnId="forgangur"
                  options={filterOptions.forgangurOpts}
                  selected={forgangurFilters}
                  onChange={setForgangurFilters}
                  openFilter={openHeaderFilter}
                  setOpenFilter={setOpenHeaderFilter}
                />
                <ColumnFilterDropdown
                  label="Ábyrgðaraðili"
                  columnId="abyrgdaradili"
                  options={filterOptions.abyrgdaradiliOpts}
                  selected={abyrgdaradiliFilters}
                  onChange={setAbyrgdaradiliFilters}
                  openFilter={openHeaderFilter}
                  setOpenFilter={setOpenHeaderFilter}
                />
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">
                  Síðast uppfært
                </th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMal.map((m) => {
                const fyrirtaeki = getFyrirtaeki(m.fyrirtaekiId);
                const bill = m.billId ? getBill(m.billId) : null;
                return (
                  <tr
                    key={m.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(m)}
                        className="flex items-center gap-2 text-left group/title"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: forgangurColors[m.forgangur],
                          }}
                        />
                        <span className="text-sm font-medium text-white group-hover/title:text-blue-400 transition-colors">
                          {m.titill}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: tegundColors[m.tegund] + '20',
                          color: tegundColors[m.tegund],
                        }}
                      >
                        {tegundLabels[m.tegund] ?? m.tegund}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-white/90">
                        {fyrirtaeki?.nafn ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {bill ? (
                        <span className="text-sm text-white/90">
                          {bill.numer}
                        </span>
                      ) : (
                        <span className="text-sm text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: getStatusBg(m.status),
                          color: getStatusColor(m.status),
                        }}
                      >
                        {statusLabels[m.status] ?? m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: forgangurColors[m.forgangur],
                          }}
                        />
                        <span className="text-xs text-white/70">
                          {forgangurLabels[m.forgangur] ?? m.forgangur}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-white/70">
                        {m.abyrgdaraðili}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-white/70">
                        {formatDate(m.sidastUppfaert)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <RowActionMenu
                        mal={m}
                        onEdit={() => openEdit(m)}
                        onStatusChange={(s) => handleStatusChange(m.id, s)}
                        onForgangurChange={(f) => handleForgangurChange(m.id, f)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMal.length === 0 && (
          <div className="px-5 py-12 text-center">
            <div className="text-sm text-white/30 mb-3">Engin mál fundust</div>
            {(hasActiveFilters || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Hreinsa allar síur
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <MalModal
          mal={editingMal}
          onClose={() => { setShowModal(false); setEditingMal(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1d2e] border border-white/10 text-white text-sm px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
