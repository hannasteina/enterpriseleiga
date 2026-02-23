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
import KvortunFerliModal from '@/components/KvortunFerliModal';

/* ─── Constants ─── */

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

const statusOrder: Mal['status'][] = ['opið', 'í vinnslu', 'bíður viðskiptavinar', 'lokað'];

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

const forgangurWeight: Record<string, number> = {
  bráður: 4,
  hár: 3,
  miðlungs: 2,
  lágur: 1,
};

const tegundColors: Record<string, string> = {
  tjón: '#ef4444',
  kvörtun: '#f59e0b',
  þjónustubeiðni: '#3b82f6',
  'breyting á samningi': '#8b5cf6',
  fyrirspurn: '#22c55e',
  annað: '#6b7280',
};

const statusIcons: Record<string, string> = {
  opið: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  'í vinnslu': 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  'bíður viðskiptavinar': 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  lokað: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

type QuickTab = 'all' | 'mine' | 'open' | 'urgent' | 'kvartanir' | 'closed';
type ViewMode = 'table' | 'kanban';
type SortField = 'titill' | 'tegund' | 'fyrirtaeki' | 'status' | 'forgangur' | 'sidastUppfaert' | 'stofnad';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [15, 30, 50, 100];
const CURRENT_USER = 'Helgi';

/* ─── Helpers ─── */

function relativeDate(d: string): string {
  const now = new Date();
  const date = new Date(d);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return 'á morgun';
    if (absDays <= 7) return `eftir ${absDays}d`;
    return date.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
  }
  if (diffDays === 0) return 'í dag';
  if (diffDays === 1) return 'í gær';
  if (diffDays < 7) return `${diffDays}d síðan`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}v síðan`;
  return date.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── InlineStatusPicker ─── */

function InlineStatusPicker({
  current,
  onChange,
}: {
  current: Mal['status'];
  onChange: (s: Mal['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium transition-all hover:ring-2 hover:ring-white/10 cursor-pointer"
        style={{
          backgroundColor: getStatusBg(current),
          color: getStatusColor(current),
        }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={statusIcons[current]} />
        </svg>
        {statusLabels[current]}
        <svg className={`w-2.5 h-2.5 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-2xl min-w-[180px] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {statusOrder.map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                s === current
                  ? 'bg-white/5 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: getStatusColor(s) }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={statusIcons[s]} />
              </svg>
              <span>{statusLabels[s]}</span>
              {s === current && (
                <svg className="w-3.5 h-3.5 ml-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── InlineForgangurPicker ─── */

function InlineForgangurPicker({
  current,
  onChange,
}: {
  current: Mal['forgangur'];
  onChange: (f: Mal['forgangur']) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allForgangur: Mal['forgangur'][] = ['bráður', 'hár', 'miðlungs', 'lágur'];

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors cursor-pointer group/fp"
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: forgangurColors[current] }} />
        {forgangurLabels[current]}
        <svg className="w-2.5 h-2.5 opacity-0 group-hover/fp:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-2xl min-w-[150px] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {allForgangur.map((f) => (
            <button
              key={f}
              onClick={(e) => { e.stopPropagation(); onChange(f); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
                f === current
                  ? 'bg-white/5 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: forgangurColors[f] }} />
              {forgangurLabels[f]}
              {f === current && (
                <svg className="w-3.5 h-3.5 ml-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SortableHeader ─── */

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th className="px-5 py-3 text-left">
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap ${
          isActive ? 'text-blue-400' : 'text-white/40 hover:text-white/60'
        }`}
      >
        {label}
        <div className="flex flex-col -space-y-1">
          <svg className={`w-2.5 h-2.5 ${isActive && currentDir === 'asc' ? 'text-blue-400' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <svg className={`w-2.5 h-2.5 ${isActive && currentDir === 'desc' ? 'text-blue-400' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    </th>
  );
}

/* ─── KanbanCard ─── */

function KanbanCard({
  m,
  onEdit,
  onForgangurChange,
  onOpenKvortun,
}: {
  m: Mal;
  onEdit: () => void;
  onForgangurChange: (f: Mal['forgangur']) => void;
  onOpenKvortun?: () => void;
}) {
  const fyrirtaeki = getFyrirtaeki(m.fyrirtaekiId);
  const bill = m.billId ? getBill(m.billId) : null;

  return (
    <div
      onClick={onEdit}
      className="bg-[#1a1d2e] border border-white/5 rounded-lg p-3.5 hover:border-white/15 transition-all cursor-pointer group hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {m.titill}
        </h4>
        <InlineForgangurPicker current={m.forgangur} onChange={onForgangurChange} />
      </div>

      <p className="text-xs text-white/40 line-clamp-2 mb-3 leading-relaxed">{m.lýsing}</p>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: tegundColors[m.tegund] + '20', color: tegundColors[m.tegund] }}
        >
          {tegundLabels[m.tegund]}
        </span>
        {m.tegund === 'kvörtun' && onOpenKvortun && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenKvortun(); }}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Ferli
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/30 pt-2.5 border-t border-white/5">
        <div className="flex items-center gap-3">
          {fyrirtaeki && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
              {fyrirtaeki.nafn}
            </span>
          )}
          {bill && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              {bill.numer}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-medium text-white/60">
            {m.abyrgdaraðili.charAt(0)}
          </div>
          <span>{relativeDate(m.sidastUppfaert)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── BulkActionBar ─── */

function BulkActionBar({
  count,
  onStatusChange,
  onForgangurChange,
  onClear,
}: {
  count: number;
  onStatusChange: (s: Mal['status']) => void;
  onForgangurChange: (f: Mal['forgangur']) => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d2e] border border-white/10 rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
          {count}
        </div>
        <span className="text-sm text-white/70">valin</span>
      </div>

      <div className="w-px h-6 bg-white/10" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-white/40 mr-1">Staða:</span>
        {statusOrder.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors hover:ring-1 hover:ring-white/10"
            style={{ backgroundColor: getStatusBg(s), color: getStatusColor(s) }}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-white/10" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-white/40 mr-1">Forgangur:</span>
        {(['bráður', 'hár', 'miðlungs', 'lágur'] as Mal['forgangur'][]).map((f) => (
          <button
            key={f}
            onClick={() => onForgangurChange(f)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: forgangurColors[f] }} />
            {forgangurLabels[f]}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-white/10" />

      <button
        onClick={onClear}
        className="text-xs text-white/40 hover:text-white transition-colors"
      >
        Hætta við
      </button>
    </div>
  );
}

/* ─── ColumnFilterDropdown ─── */

interface FilterOption {
  value: string;
  label: string;
  color?: string;
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
  const allSelected = selected.size === 0;

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenFilter(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, setOpenFilter]);

  function handleToggle(value: string) {
    if (allSelected) {
      const next = new Set(options.map((o) => o.value));
      next.delete(value);
      onChange(next.size === 0 ? new Set(['__none__']) : next);
    } else {
      const next = new Set(selected);
      next.delete('__none__');
      if (next.has(value)) {
        next.delete(value);
        onChange(next.size === 0 ? new Set(['__none__']) : next);
      } else {
        next.add(value);
        onChange(next.size === options.length ? new Set() : next);
      }
    }
  }

  const checkedCount = allSelected ? options.length : options.filter((o) => selected.has(o.value)).length;

  return (
    <th className="px-5 py-3 text-left relative" ref={ref}>
      <button
        onClick={() => setOpenFilter(isOpen ? null : columnId)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap ${
          hasFilter && !allSelected ? 'text-blue-400' : 'text-white/40 hover:text-white/60'
        }`}
      >
        {label}
        {hasFilter && !allSelected && (
          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1 rounded-full min-w-[16px] text-center leading-4">
            {checkedCount}
          </span>
        )}
        <svg className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-40 bg-[#1a1d2e] border border-white/10 rounded-lg shadow-xl min-w-[200px] py-1">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/5 mb-0.5">
            <button
              onClick={() => onChange(new Set())}
              className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                allSelected ? 'bg-blue-500/15 text-blue-400' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              Velja allt
            </button>
            <button
              onClick={() => onChange(new Set(['__none__']))}
              className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                selected.has('__none__') ? 'bg-blue-500/15 text-blue-400' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              Afvelja allt
            </button>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {options.map((opt) => {
              const checked = allSelected || selected.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleToggle(opt.value)}
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
                  {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
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

/* ─── Main Page ─── */

export default function MalaskraningPage() {
  const [malList, setMalList] = useState<Mal[]>([...initialMal]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTab, setQuickTab] = useState<QuickTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('sidastUppfaert');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tegundFilters, setTegundFilters] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [forgangurFilters, setForgangurFilters] = useState<Set<string>>(new Set());
  const [fyrirtaekiFilters, setFyrirtaekiFilters] = useState<Set<string>>(new Set());
  const [abyrgdaradiliFilters, setAbyrgdaradiliFilters] = useState<Set<string>>(new Set());
  const [openHeaderFilter, setOpenHeaderFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMal, setEditingMal] = useState<Mal | null>(null);
  const [kvortunMal, setKvortunMal] = useState<Mal | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* Filter options */
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

  /* Stats */
  const stats = useMemo(() => {
    const opin = malList.filter((m) => m.status === 'opið').length;
    const iVinnslu = malList.filter((m) => m.status === 'í vinnslu').length;
    const bidur = malList.filter((m) => m.status === 'bíður viðskiptavinar').length;
    const lokid = malList.filter((m) => m.status === 'lokað').length;
    const bradMal = malList.filter((m) => m.forgangur === 'bráður' && m.status !== 'lokað').length;
    const minMal = malList.filter((m) => m.abyrgdaraðili === CURRENT_USER && m.status !== 'lokað').length;
    const kvartanir = malList.filter((m) => m.tegund === 'kvörtun' && m.status !== 'lokað').length;
    return { opin, iVinnslu, bidur, lokid, bradMal, minMal, kvartanir, total: malList.length };
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
    setQuickTab('all');
    setPage(0);
  }

  /* Filtered + Sorted */
  const filteredMal = useMemo(() => {
    let list = malList;

    if (quickTab === 'mine') list = list.filter((m) => m.abyrgdaraðili === CURRENT_USER);
    else if (quickTab === 'open') list = list.filter((m) => m.status === 'opið' || m.status === 'í vinnslu');
    else if (quickTab === 'urgent') list = list.filter((m) => (m.forgangur === 'bráður' || m.forgangur === 'hár') && m.status !== 'lokað');
    else if (quickTab === 'kvartanir') list = list.filter((m) => m.tegund === 'kvörtun');
    else if (quickTab === 'closed') list = list.filter((m) => m.status === 'lokað');

    list = list.filter((m) => {
      const tegundMatch = tegundFilters.size === 0 || tegundFilters.has(m.tegund);
      const statusMatch = statusFilters.size === 0 || statusFilters.has(m.status);
      const forgangurMatch = forgangurFilters.size === 0 || forgangurFilters.has(m.forgangur);
      const fyrirtaekiMatch = fyrirtaekiFilters.size === 0 || fyrirtaekiFilters.has(m.fyrirtaekiId);
      const abyrgdaradiliMatch = abyrgdaradiliFilters.size === 0 || abyrgdaradiliFilters.has(m.abyrgdaraðili);
      const searchMatch =
        !searchQuery ||
        m.titill.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.lýsing.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.abyrgdaraðili.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (getFyrirtaeki(m.fyrirtaekiId)?.nafn ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      return tegundMatch && statusMatch && forgangurMatch && fyrirtaekiMatch && abyrgdaradiliMatch && searchMatch;
    });

    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'titill': return dir * a.titill.localeCompare(b.titill, 'is');
        case 'tegund': return dir * a.tegund.localeCompare(b.tegund, 'is');
        case 'fyrirtaeki': return dir * ((getFyrirtaeki(a.fyrirtaekiId)?.nafn ?? '').localeCompare(getFyrirtaeki(b.fyrirtaekiId)?.nafn ?? '', 'is'));
        case 'status': return dir * (statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
        case 'forgangur': return dir * (forgangurWeight[b.forgangur] - forgangurWeight[a.forgangur]);
        case 'sidastUppfaert': return dir * a.sidastUppfaert.localeCompare(b.sidastUppfaert);
        case 'stofnad': return dir * a.stofnad.localeCompare(b.stofnad);
        default: return 0;
      }
    });

    return list;
  }, [malList, quickTab, tegundFilters, statusFilters, forgangurFilters, fyrirtaekiFilters, abyrgdaradiliFilters, searchQuery, sortField, sortDir]);

  const totalPages = Math.ceil(filteredMal.length / pageSize);
  const paginatedMal = filteredMal.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => { setPage(0); }, [quickTab, searchQuery, tegundFilters, statusFilters, forgangurFilters, fyrirtaekiFilters, abyrgdaradiliFilters]);

  /* Handlers */
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function handleSave(saved: Mal) {
    setMalList((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    showToast(editingMal ? 'Máli breytt' : 'Nýtt mál skráð');
  }

  function handleDelete(id: string) {
    setMalList((prev) => prev.filter((m) => m.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    showToast('Máli eytt');
  }

  function handleStatusChange(id: string, status: Mal['status']) {
    setMalList((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status, sidastUppfaert: new Date().toISOString().split('T')[0] } : m
      )
    );
    showToast(`Staða breytt í: ${statusLabels[status]}`);
  }

  function handleForgangurChange(id: string, forgangur: Mal['forgangur']) {
    setMalList((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, forgangur, sidastUppfaert: new Date().toISOString().split('T')[0] } : m
      )
    );
    showToast(`Forgangur breyttur í: ${forgangurLabels[forgangur]}`);
  }

  function handleBulkStatusChange(status: Mal['status']) {
    setMalList((prev) =>
      prev.map((m) =>
        selectedIds.has(m.id) ? { ...m, status, sidastUppfaert: new Date().toISOString().split('T')[0] } : m
      )
    );
    showToast(`Staða breytt á ${selectedIds.size} málum`);
    setSelectedIds(new Set());
  }

  function handleBulkForgangurChange(forgangur: Mal['forgangur']) {
    setMalList((prev) =>
      prev.map((m) =>
        selectedIds.has(m.id) ? { ...m, forgangur, sidastUppfaert: new Date().toISOString().split('T')[0] } : m
      )
    );
    showToast(`Forgangur breyttur á ${selectedIds.size} málum`);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const pageIds = paginatedMal.map((m) => m.id);
    const allPageSelected = pageIds.every((id) => selectedIds.has(id));
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...pageIds]));
    }
  }

  function handleExportCSV() {
    const headers = ['Titill', 'Tegund', 'Fyrirtæki', 'Bíll', 'Staða', 'Forgangur', 'Ábyrgðaraðili', 'Stofnað', 'Síðast uppfært'];
    const rows = filteredMal.map((m) => {
      const fyrirtaeki = getFyrirtaeki(m.fyrirtaekiId);
      const bill = m.billId ? getBill(m.billId) : null;
      return [m.titill, tegundLabels[m.tegund] ?? m.tegund, fyrirtaeki?.nafn ?? '', bill?.numer ?? '', statusLabels[m.status] ?? m.status, forgangurLabels[m.forgangur] ?? m.forgangur, m.abyrgdaraðili, m.stofnad, m.sidastUppfaert];
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

  function openCreate() { setEditingMal(null); setShowModal(true); }
  function openEdit(m: Mal) {
    if (m.tegund === 'kvörtun') {
      setKvortunMal(m);
    } else {
      setEditingMal(m); setShowModal(true);
    }
  }
  function openEditDirect(m: Mal) { setEditingMal(m); setShowModal(true); }
  function handleKvortunMalUpdate(updated: Mal) {
    setMalList(prev => prev.map(m => m.id === updated.id ? updated : m));
    showToast('Mál uppfært');
  }

  const allPageSelected = paginatedMal.length > 0 && paginatedMal.every((m) => selectedIds.has(m.id));

  const quickTabs: { id: QuickTab; label: string; count: number; color?: string }[] = [
    { id: 'all', label: 'Öll mál', count: stats.total },
    { id: 'mine', label: 'Mín mál', count: stats.minMal, color: '#3b82f6' },
    { id: 'open', label: 'Opin', count: stats.opin + stats.iVinnslu, color: '#22c55e' },
    { id: 'urgent', label: 'Bráð', count: stats.bradMal, color: '#ef4444' },
    { id: 'kvartanir', label: 'Kvartanir', count: stats.kvartanir, color: '#f59e0b' },
    { id: 'closed', label: 'Lokið', count: stats.lokid, color: '#6b7280' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* ─ Header ─ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Málaskráning</h1>
          <p className="text-sm text-white/40 mt-1">
            Haltu utan um öll mál, kvartanir, tjón og þjónustubeiðnir
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              title="Tafla"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-1.5m1.5 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c0 .621-.504 1.125-1.125 1.125M21.375 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-19.5-3.75c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m19.5-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              title="Kanban"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Skrá nýtt mál
          </button>
        </div>
      </div>

      {/* ─ Stats Cards ─ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: 'Opin mál', count: stats.opin, icon: statusIcons['opið'], color: '#22c55e', statusKey: 'opið' as const },
          { label: 'Í vinnslu', count: stats.iVinnslu, icon: statusIcons['í vinnslu'], color: '#f59e0b', statusKey: 'í vinnslu' as const },
          { label: 'Bíður svars', count: stats.bidur, icon: statusIcons['bíður viðskiptavinar'], color: '#8b5cf6', statusKey: 'bíður viðskiptavinar' as const },
          { label: 'Lokið', count: stats.lokid, icon: statusIcons['lokað'], color: '#6b7280', statusKey: 'lokað' as const },
        ] as const).map((card) => (
          <button
            key={card.statusKey}
            onClick={() => {
              if (quickTab === 'all' && statusFilters.size === 1 && statusFilters.has(card.statusKey)) {
                setStatusFilters(new Set());
              } else {
                setQuickTab('all');
                setStatusFilters(new Set([card.statusKey]));
              }
            }}
            className={`bg-[#161822] rounded-xl border p-4 text-left transition-all group ${
              statusFilters.size === 1 && statusFilters.has(card.statusKey)
                ? 'border-white/20 shadow-lg'
                : 'border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/40">{card.label}</span>
              <svg className="w-4 h-4 opacity-40" style={{ color: card.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.count}</div>
            <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: stats.total > 0 ? `${(card.count / stats.total) * 100}%` : '0%',
                  backgroundColor: card.color,
                  opacity: 0.6,
                }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* ─ Quick Tabs + Search ─ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-[#161822] rounded-lg border border-white/5 p-1 overflow-x-auto">
          {quickTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setQuickTab(tab.id); setStatusFilters(new Set()); setPage(0); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                quickTab === tab.id
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 rounded-full min-w-[20px] text-center leading-4 ${
                  quickTab === tab.id ? 'bg-white/15 text-white' : 'bg-white/5 text-white/30'
                }`}
                style={quickTab === tab.id && tab.color ? { backgroundColor: tab.color + '25', color: tab.color } : {}}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Leita í málum, fyrirtækjum, lýsingum..."
            className="w-full bg-[#161822] border border-white/5 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
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

      {/* ─ TABLE VIEW ─ */}
      {viewMode === 'table' && (
        <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">
                Mál
                <span className="text-white/30 font-normal ml-2">
                  {filteredMal.length} {filteredMal.length !== malList.length && `af ${malList.length}`}
                </span>
              </h2>
              {selectedIds.size > 0 && (
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {selectedIds.size} valin
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="bg-transparent border border-white/10 rounded-md px-2 py-1 text-xs text-white/50 focus:outline-none"
                style={{ colorScheme: 'dark' }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} á síðu</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        allPageSelected ? 'bg-blue-600 border-blue-600' : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {allPageSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <SortableHeader label="Titill" field="titill" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                  <ColumnFilterDropdown label="Tegund" columnId="tegund" options={filterOptions.tegundOpts} selected={tegundFilters} onChange={setTegundFilters} openFilter={openHeaderFilter} setOpenFilter={setOpenHeaderFilter} />
                  <ColumnFilterDropdown label="Fyrirtæki" columnId="fyrirtaeki" options={filterOptions.fyrirtaekiOpts} selected={fyrirtaekiFilters} onChange={setFyrirtaekiFilters} openFilter={openHeaderFilter} setOpenFilter={setOpenHeaderFilter} />
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Bíll</th>
                  <SortableHeader label="Staða" field="status" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Forgangur" field="forgangur" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                  <ColumnFilterDropdown label="Ábyrgðaraðili" columnId="abyrgdaradili" options={filterOptions.abyrgdaradiliOpts} selected={abyrgdaradiliFilters} onChange={setAbyrgdaradiliFilters} openFilter={openHeaderFilter} setOpenFilter={setOpenHeaderFilter} />
                  <SortableHeader label="Uppfært" field="sidastUppfaert" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {paginatedMal.map((m) => {
                  const fyrirtaeki = getFyrirtaeki(m.fyrirtaekiId);
                  const bill = m.billId ? getBill(m.billId) : null;
                  const isSelected = selectedIds.has(m.id);
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-white/5 transition-colors group ${
                        isSelected ? 'bg-blue-500/5' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleSelect(m.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="text-left group/title flex-1 min-w-0"
                          >
                            <span className="text-sm font-medium text-white group-hover/title:text-blue-400 transition-colors">
                              {m.titill}
                            </span>
                            <span className="block text-[11px] text-white/30 mt-0.5 line-clamp-1 max-w-[300px]">
                              {m.lýsing}
                            </span>
                          </button>
                          {m.tegund === 'kvörtun' && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); setKvortunMal(m); }}
                                className="px-2 py-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition-colors flex items-center gap-1"
                                title="Opna kvörtunarferli"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                Ferli
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditDirect(m); }}
                                className="px-1.5 py-1 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-md transition-colors"
                                title="Breyta máli"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: tegundColors[m.tegund] + '20', color: tegundColors[m.tegund] }}
                        >
                          {tegundLabels[m.tegund]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-white/80">{fyrirtaeki?.nafn ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm ${bill ? 'text-white/80' : 'text-white/30'}`}>
                          {bill?.numer ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <InlineStatusPicker
                          current={m.status}
                          onChange={(s) => handleStatusChange(m.id, s)}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <InlineForgangurPicker
                          current={m.forgangur}
                          onChange={(f) => handleForgangurChange(m.id, f)}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium text-white/60 shrink-0">
                            {m.abyrgdaraðili.charAt(0)}
                          </div>
                          <span className="text-sm text-white/70">{m.abyrgdaraðili}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-white/40" title={formatDate(m.sidastUppfaert)}>
                          {relativeDate(m.sidastUppfaert)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMal.length === 0 && (
            <div className="px-5 py-16 text-center">
              <svg className="w-12 h-12 text-white/10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <div className="text-sm text-white/30 mb-3">Engin mál fundust</div>
              {(hasActiveFilters || searchQuery) && (
                <button onClick={clearAllFilters} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Hreinsa allar síur
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/30">
                Sýni {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredMal.length)} af {filteredMal.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  &#171;
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  &#8249;
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  &#8250;
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 rounded text-xs text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  &#187;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─ KANBAN VIEW ─ */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statusOrder.map((status) => {
            const colMal = filteredMal.filter((m) => m.status === status);
            return (
              <div key={status} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <svg className="w-4 h-4" style={{ color: getStatusColor(status) }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={statusIcons[status]} />
                  </svg>
                  <h3 className="text-sm font-semibold text-white">{statusLabels[status]}</h3>
                  <span className="text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
                    {colMal.length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 bg-white/[0.02] rounded-xl border border-white/5 p-2.5 min-h-[200px]">
                  {colMal.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-white/20">
                      Engin mál
                    </div>
                  )}
                  {colMal.map((m) => (
                    <KanbanCard
                      key={m.id}
                      m={m}
                      onEdit={() => openEdit(m)}
                      onForgangurChange={(f) => handleForgangurChange(m.id, f)}
                      onOpenKvortun={m.tegund === 'kvörtun' ? () => setKvortunMal(m) : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─ Bulk Actions ─ */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onStatusChange={handleBulkStatusChange}
          onForgangurChange={handleBulkForgangurChange}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* ─ Modal ─ */}
      {showModal && (
        <MalModal
          mal={editingMal}
          onClose={() => { setShowModal(false); setEditingMal(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* ─ Kvörtunarferli Modal ─ */}
      {kvortunMal && (
        <KvortunFerliModal
          mal={kvortunMal}
          onClose={() => setKvortunMal(null)}
          onMalUpdate={handleKvortunMalUpdate}
        />
      )}

      {/* ─ Toast ─ */}
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
