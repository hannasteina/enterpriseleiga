'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getFyrirtaeki,
  getBill,
  getStatusColor,
  getStatusBg,
  getVirkirNotendur,
  hlutverkLysingar,
  type Verkefni,
  type Forgangur,
  type Notandi,
} from '@/lib/enterprise-demo-data';
import { useVerkefniStore } from '@/lib/verkefni-store';
import VerkefniDetailModal from '@/components/VerkefniDetailModal';
import NyttVerkefniModal from '@/components/NyttVerkefniModal';

type TabFilter = 'min' | 'deild' | 'lokin';
type DeildFilter = 'allt' | 'langtímaleiga' | 'flotaleiga' | 'þjónusta' | 'sala';
type ViewMode = 'kanban' | 'list';

const deildColors: Record<string, string> = {
  langtímaleiga: '#3b82f6',
  flotaleiga: '#8b5cf6',
  þjónusta: '#f59e0b',
  sala: '#22c55e',
};

const deildLabels: Record<string, string> = {
  langtímaleiga: 'Langtímaleiga',
  flotaleiga: 'Flotaleiga',
  þjónusta: 'Þjónusta',
  sala: 'Sala',
};

const statusLabels: Record<string, string> = {
  opið: 'Stofnuð',
  'í gangi': 'Í gangi',
  lokið: 'Lokið',
};

const statusIcons: Record<string, string> = {
  opið: '○',
  'í gangi': '◐',
  lokið: '●',
};

const forgangsColors: Record<Forgangur, { bg: string; text: string; border: string }> = {
  brýnt: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  hátt: { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: 'rgba(249,115,22,0.3)' },
  venjulegt: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  lágt: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', border: 'rgba(107,114,128,0.3)' },
};

const forgangsLabels: Record<Forgangur, string> = {
  brýnt: 'Brýnt',
  hátt: 'Hátt',
  venjulegt: 'Venjulegt',
  lágt: 'Lágt',
};

function getDeadlineInfo(deadline: string): { label: string; color: string; urgent: boolean } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });

  if (diffDays < 0) return { label: `${formatted} (seint)`, color: '#ef4444', urgent: true };
  if (diffDays === 0) return { label: `${formatted} (í dag)`, color: '#f59e0b', urgent: true };
  if (diffDays === 1) return { label: `${formatted} (á morgun)`, color: '#f59e0b', urgent: false };
  if (diffDays <= 3) return { label: `${formatted} (${diffDays} dagar)`, color: '#f97316', urgent: false };
  return { label: formatted, color: '', urgent: false };
}

function getChecklistProgress(v: Verkefni) {
  if (v.checklist.length === 0) return null;
  const done = v.checklist.filter((c) => c.lokid).length;
  return { done, total: v.checklist.length, pct: (done / v.checklist.length) * 100 };
}

const avatarColors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ─── Kanban Droppable Column ─────────────────────────────────────
function KanbanColumn({
  status,
  children,
  count,
}: {
  status: string;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  const statusColor = getStatusColor(status);

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] max-w-[420px] rounded-2xl transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-500/40 bg-blue-500/5' : ''
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
        <h3 className="text-sm font-semibold text-white">{statusLabels[status]}</h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/40">
          {count}
        </span>
      </div>
      <div className="space-y-3 px-1 pb-4 min-h-[200px]">{children}</div>
    </div>
  );
}

// ─── Draggable Kanban Card ───────────────────────────────────────
function KanbanCard({
  v,
  onClick,
  onAssign,
}: {
  v: Verkefni;
  onClick: () => void;
  onAssign: (nafn: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: v.id,
    data: { type: 'verkefni', status: v.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <VerkefniCard v={v} onClick={onClick} onAssign={onAssign} />
    </div>
  );
}

// ─── Assignee Dropdown ──────────────────────────────────────────
function AssigneeDropdown({
  currentName,
  onAssign,
}: {
  currentName: string;
  onAssign: (nafn: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notendur = useMemo(() => getVirkirNotendur(), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-white/[0.06] transition-colors group/assign"
        title="Úthluta á teymislið"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ backgroundColor: getAvatarColor(currentName) }}
        >
          {currentName[0]}
        </div>
        <span className="text-[11px] text-white/50 group-hover/assign:text-white/70 transition-colors">{currentName}</span>
        <svg className="w-3 h-3 text-white/20 group-hover/assign:text-white/40 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 bottom-full mb-2 w-56 bg-[#1a1d2e] border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Úthluta á</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto py-1">
            {notendur.map((n: Notandi) => {
              const firstName = n.nafn.split(' ')[0];
              const isActive = currentName === firstName || currentName === n.nafn;
              return (
                <button
                  key={n.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onAssign(firstName);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isActive ? 'bg-blue-500/10' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: getAvatarColor(firstName) }}
                  >
                    {firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${isActive ? 'text-blue-400' : 'text-white/80'}`}>
                      {n.nafn}
                    </div>
                    <div className="text-[10px] text-white/30 truncate">{hlutverkLysingar[n.hlutverk]?.label}</div>
                  </div>
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rich Task Card (shared between Kanban & Card overlay) ──────
function VerkefniCard({ v, onClick, onAssign }: { v: Verkefni; onClick: () => void; onAssign?: (nafn: string) => void }) {
  const fyrirtaeki = v.fyrirtaekiId ? getFyrirtaeki(v.fyrirtaekiId) : null;
  const bill = v.billId ? getBill(v.billId) : null;
  const progress = getChecklistProgress(v);
  const deadlineInfo = v.status !== 'lokið' ? getDeadlineInfo(v.deadline) : null;
  const forgangur = v.forgangur || 'venjulegt';
  const commentCount = (v.athugasemdir || []).length;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="bg-[#161822] rounded-xl border border-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer group hover:shadow-lg hover:shadow-black/20 relative overflow-hidden"
    >
      {/* Left color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: deildColors[v.deild] }}
      />

      <div className="pl-4 pr-4 py-4">
        {/* Top row: priority + auto badge */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: forgangsColors[forgangur].bg,
              color: forgangsColors[forgangur].text,
            }}
          >
            {forgangur === 'brýnt' && '⚑ '}
            {forgangur === 'hátt' && '▲ '}
            {forgangsLabels[forgangur]}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-medium"
            style={{
              backgroundColor: `${deildColors[v.deild]}15`,
              color: deildColors[v.deild],
            }}
          >
            {deildLabels[v.deild]}
          </span>
          {v.sjálfvirkt && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sjálfvirkt
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-[13px] font-semibold text-white mb-1.5 group-hover:text-blue-300 transition-colors leading-snug">
          {v.titill}
        </h4>

        {/* Description */}
        <p className="text-xs text-white/45 line-clamp-2 mb-3 leading-relaxed">{v.lýsing}</p>

        {/* Related info tags */}
        {(fyrirtaeki || bill) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {fyrirtaeki && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/50 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                {fyrirtaeki.nafn}
              </span>
            )}
            {bill && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/50 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.079-.481 1.04-1.099l-.52-8.742A1.125 1.125 0 0019.128 7.5H4.872a1.125 1.125 0 00-1.12 1.009l-.52 8.742c-.04.618.418 1.099 1.04 1.099H6" />
                </svg>
                {bill.numer}
              </span>
            )}
          </div>
        )}

        {/* Checklist progress */}
        {progress && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 bg-white/[0.06] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${progress.pct}%`,
                    backgroundColor:
                      progress.pct === 100 ? '#22c55e' : progress.pct >= 50 ? '#3b82f6' : '#f59e0b',
                  }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums">{progress.done}/{progress.total}</span>
            </div>
          </div>
        )}

        {/* Footer: avatar, deadline, comment count */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
          {/* Assignee avatar with dropdown */}
          {onAssign ? (
            <AssigneeDropdown currentName={v.abyrgdaradili} onAssign={onAssign} />
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: getAvatarColor(v.abyrgdaradili) }}
              >
                {v.abyrgdaradili[0]}
              </div>
              <span className="text-[11px] text-white/50">{v.abyrgdaradili}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Comment count */}
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                {commentCount}
              </span>
            )}

            {/* Deadline */}
            {deadlineInfo && (
              <span
                className="text-[10px] font-medium flex items-center gap-1"
                style={{ color: deadlineInfo.color || 'rgba(255,255,255,0.3)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {deadlineInfo.label}
              </span>
            )}
            {v.status === 'lokið' && (
              <span className="text-[10px] text-green-400/60 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lokið
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── List View Row ───────────────────────────────────────────────
function ListRow({ v, onClick }: { v: Verkefni; onClick: () => void }) {
  const progress = getChecklistProgress(v);
  const deadlineInfo = v.status !== 'lokið' ? getDeadlineInfo(v.deadline) : null;
  const forgangur = v.forgangur || 'venjulegt';

  return (
    <tr
      onClick={onClick}
      className="hover:bg-white/[0.03] transition-colors cursor-pointer group border-b border-white/[0.04] last:border-b-0"
    >
      {/* Priority */}
      <td className="py-3 px-3">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{
            backgroundColor: forgangsColors[forgangur].bg,
            color: forgangsColors[forgangur].text,
          }}
        >
          {forgangur === 'brýnt' && '⚑ '}
          {forgangur === 'hátt' && '▲ '}
          {forgangsLabels[forgangur]}
        </span>
      </td>

      {/* Title + description */}
      <td className="py-3 px-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate max-w-[280px]">
            {v.titill}
          </div>
          <div className="text-[11px] text-white/35 truncate max-w-[280px]">{v.lýsing}</div>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-3">
        <span
          className="text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
          style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}
        >
          {statusIcons[v.status]} {statusLabels[v.status]}
        </span>
      </td>

      {/* Department */}
      <td className="py-3 px-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap"
          style={{ backgroundColor: `${deildColors[v.deild]}15`, color: deildColors[v.deild] }}
        >
          {deildLabels[v.deild]}
        </span>
      </td>

      {/* Assignee */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: getAvatarColor(v.abyrgdaradili) }}
          >
            {v.abyrgdaradili[0]}
          </div>
          <span className="text-xs text-white/60">{v.abyrgdaradili}</span>
        </div>
      </td>

      {/* Deadline */}
      <td className="py-3 px-3">
        {deadlineInfo ? (
          <span className="text-[11px] font-medium" style={{ color: deadlineInfo.color || 'rgba(255,255,255,0.4)' }}>
            {deadlineInfo.label}
          </span>
        ) : v.status === 'lokið' ? (
          <span className="text-[11px] text-green-400/60">Lokið</span>
        ) : null}
      </td>

      {/* Progress */}
      <td className="py-3 px-3">
        {progress ? (
          <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 bg-white/[0.06] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${progress.pct}%`,
                  backgroundColor: progress.pct === 100 ? '#22c55e' : '#3b82f6',
                }}
              />
            </div>
            <span className="text-[10px] text-white/30 tabular-nums">{progress.done}/{progress.total}</span>
          </div>
        ) : (
          <span className="text-[10px] text-white/20">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function VerkefnalistiPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('min');
  const [deildFilter, setDeildFilter] = useState<DeildFilter>('allt');
  const [selectedVerkefniId, setSelectedVerkefniId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const currentUser = 'Anna';

  const store = useVerkefniStore();
  const { verkefniList } = store;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Stats
  const stats = useMemo(() => {
    const stofnud = verkefniList.filter((v) => v.status === 'opið').length;
    const iGangi = verkefniList.filter((v) => v.status === 'í gangi').length;
    const lokid = verkefniList.filter((v) => v.status === 'lokið').length;
    const sjalfvirk = verkefniList.filter((v) => v.sjálfvirkt).length;
    const total = verkefniList.length;
    const overdue = verkefniList.filter((v) => {
      if (v.status === 'lokið') return false;
      return new Date(v.deadline) < new Date();
    }).length;
    const completionPct = total > 0 ? Math.round((lokid / total) * 100) : 0;
    return { stofnud, iGangi, lokid, sjalfvirk, total, overdue, completionPct };
  }, [verkefniList]);

  // Filtering
  const filteredVerkefni = useMemo(() => {
    let filtered: Verkefni[] = [];

    if (activeTab === 'min') {
      filtered = verkefniList.filter((v) => v.abyrgdaradili === currentUser);
    } else if (activeTab === 'deild') {
      filtered = verkefniList.filter((v) => v.status !== 'lokið');
    } else if (activeTab === 'lokin') {
      filtered = verkefniList.filter((v) => v.status === 'lokið');
    }

    if (deildFilter !== 'allt') {
      filtered = filtered.filter((v) => v.deild === deildFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.titill.toLowerCase().includes(q) ||
          v.lýsing.toLowerCase().includes(q) ||
          v.abyrgdaradili.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [activeTab, deildFilter, currentUser, verkefniList, searchQuery]);

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, Verkefni[]> = { opið: [], 'í gangi': [], lokið: [] };
    filteredVerkefni.forEach((v) => groups[v.status]?.push(v));
    return groups;
  }, [filteredVerkefni]);

  const selectedVerkefni = selectedVerkefniId ? store.getVerkefniById(selectedVerkefniId) : null;

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const overId = over.id as string;
      let newStatus: Verkefni['status'] | null = null;

      if (overId.startsWith('column-')) {
        newStatus = overId.replace('column-', '') as Verkefni['status'];
      } else {
        const overVerkefni = store.getVerkefniById(overId);
        if (overVerkefni) newStatus = overVerkefni.status;
      }

      if (newStatus) {
        const activeVerkefni = store.getVerkefniById(active.id as string);
        if (activeVerkefni && activeVerkefni.status !== newStatus) {
          store.updateVerkefniStatus(active.id as string, newStatus);
        }
      }
    },
    [store]
  );

  const draggedVerkefni = dragActiveId ? store.getVerkefniById(dragActiveId) : null;

  async function handleSendNotification(verkefniId: string, tilNotandaId: string, skilabod: string) {
    const v = store.getVerkefniById(verkefniId);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verkefniTitill: v?.titill ?? '',
          tilNotandaId,
          fraNafn: currentUser,
          skilabod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(data.message);
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast('Villa við sendingu tilkynningar');
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Verkefni</h1>
          <p className="text-sm text-white/40 mt-0.5">Stjórnaðu verkefnum á einum stað</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shrink-0 shadow-lg shadow-blue-600/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nýtt verkefni
        </button>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Overall progress */}
        <div className="col-span-2 bg-[#161822] rounded-2xl border border-white/5 p-4 flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="#22c55e"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(stats.completionPct / 100) * 150.8} 150.8`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {stats.completionPct}%
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Framvinda</div>
            <div className="text-xs text-white/40">{stats.lokid} af {stats.total} verkefnum lokið</div>
          </div>
        </div>

        <StatCard label="Stofnuð" value={stats.stofnud} color="#3b82f6" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Í gangi" value={stats.iGangi} color="#8b5cf6" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        } />
        <StatCard label="Lokið" value={stats.lokid} color="#22c55e" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Útrunnið" value={stats.overdue} color={stats.overdue > 0 ? '#ef4444' : '#6b7280'} icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        } pulse={stats.overdue > 0} />
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Leita í verkefnum..."
            className="bg-[#161822] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-[220px]"
          />
        </div>

        {/* Tab filter */}
        <div className="flex rounded-xl border border-white/[0.06] overflow-hidden bg-[#161822]">
          {([
            { key: 'min' as const, label: 'Mín verkefni' },
            { key: 'deild' as const, label: 'Deildarverkefni' },
            { key: 'lokin' as const, label: 'Lokið' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Department filter */}
        <select
          value={deildFilter}
          onChange={(e) => setDeildFilter(e.target.value as DeildFilter)}
          className="bg-[#161822] border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          style={{ colorScheme: 'dark' }}
        >
          <option value="allt" style={{ background: '#1a1d2e', color: '#ffffff' }}>Allar deildir</option>
          <option value="langtímaleiga" style={{ background: '#1a1d2e', color: '#ffffff' }}>Langtímaleiga</option>
          <option value="flotaleiga" style={{ background: '#1a1d2e', color: '#ffffff' }}>Flotaleiga</option>
          <option value="þjónusta" style={{ background: '#1a1d2e', color: '#ffffff' }}>Þjónusta</option>
          <option value="sala" style={{ background: '#1a1d2e', color: '#ffffff' }}>Sala</option>
        </select>

        {/* View mode toggle */}
        <div className="flex rounded-xl border border-white/[0.06] overflow-hidden bg-[#161822] ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 transition-all ${
              viewMode === 'kanban' ? 'bg-blue-600/20 text-blue-400' : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
            }`}
            title="Kanban"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-all ${
              viewMode === 'list' ? 'bg-blue-600/20 text-blue-400' : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
            }`}
            title="Listi"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>

        {/* Notification bell */}
        {store.getUnreadCount() > 0 && (
          <button
            onClick={() => store.markAllNotificationsRead()}
            className="relative p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {store.getUnreadCount()}
            </span>
          </button>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {filteredVerkefni.length === 0 ? (
        <div className="bg-[#161822] rounded-2xl border border-white/5 p-16 text-center">
          <svg className="w-12 h-12 text-white/10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm text-white/30 mb-1">Engin verkefni fundust</p>
          <p className="text-xs text-white/20">Prófaðu að breyta síum eða búa til nýtt verkefni</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ── Kanban Board ──────────────────────────────── */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(['opið', 'í gangi', 'lokið'] as const).map((status) => (
              <KanbanColumn key={status} status={status} count={groupedByStatus[status].length}>
                {groupedByStatus[status].map((v) => (
                  <KanbanCard key={v.id} v={v} onClick={() => setSelectedVerkefniId(v.id)} onAssign={(nafn) => store.assignVerkefni(v.id, nafn)} />
                ))}
                {groupedByStatus[status].length === 0 && (
                  <div className="border-2 border-dashed border-white/[0.06] rounded-xl p-6 text-center">
                    <p className="text-xs text-white/20">Dragðu verkefni hingað</p>
                  </div>
                )}
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay>
            {draggedVerkefni && (
              <div className="opacity-90 rotate-2 scale-105">
                <VerkefniCard v={draggedVerkefni} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        /* ── List View ─────────────────────────────────── */
        <div className="bg-[#161822] rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Forgangur</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Verkefni</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Staða</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Deild</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Ábyrgð</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Frestur</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-3">Framvinda</th>
              </tr>
            </thead>
            <tbody>
              {filteredVerkefni.map((v) => (
                <ListRow key={v.id} v={v} onClick={() => setSelectedVerkefniId(v.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {selectedVerkefni && (
        <VerkefniDetailModal
          verkefni={selectedVerkefni}
          store={store}
          currentUser={currentUser}
          onClose={() => setSelectedVerkefniId(null)}
          onSendNotification={handleSendNotification}
        />
      )}

      {showNewForm && (
        <NyttVerkefniModal
          store={store}
          currentUser={currentUser}
          onClose={() => setShowNewForm(false)}
          onCreated={(v) => {
            setToast(`Verkefni "${v.titill}" stofnað`);
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-[#161822] border border-white/10 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/80">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/30 hover:text-white/60 ml-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon,
  pulse,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className="bg-[#161822] rounded-2xl border border-white/5 p-4 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pulse ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] font-medium text-white/35 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}
