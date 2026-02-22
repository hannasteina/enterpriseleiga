'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import {
  type WidgetConfig,
  type WidgetId,
  loadWidgetPrefs,
  saveWidgetPrefs,
  toggleWidget,
  reorderWidgets,
} from '@/lib/dashboard-preferences';
import {
  fyrirtaeki,
  samningar,
  bilar,
  mal,
  solutaekifaeri,
  verkefni,
  thjonustuaminningar,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  getDashboardStats,
  getSamningarSemRennaUt,
  getNaestaThjonustur,
  getFyrirtaeki,
  type Svid,
  type Mal,
} from '@/lib/enterprise-demo-data';
import { useVerkefniStore } from '@/lib/verkefni-store';
import VerkefniDetailModal from '@/components/VerkefniDetailModal';
import MalModal from '@/components/MalModal';

type QuickFilter = 'allt' | 'langtimaleiga' | 'flotaleiga';
type MinVerkefniTab = 'uthlutad' | 'stofnad';

const MAX_ITEMS = 3;

export default function EnterpriseDemoDashboard() {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('allt');
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [expandedWidgets, setExpandedWidgets] = useState<Set<WidgetId>>(new Set());
  const [userName, setUserName] = useState<string>('');
  const [minVerkefniTab, setMinVerkefniTab] = useState<MinVerkefniTab>('uthlutad');
  const [selectedVerkefniId, setSelectedVerkefniId] = useState<string | null>(null);
  const [selectedMal, setSelectedMal] = useState<Mal | null>(null);
  const [malList, setMalList] = useState<Mal[]>(mal);
  const router = useRouter();
  const verkefniStore = useVerkefniStore();

  useEffect(() => {
    setWidgets(loadWidgetPrefs());
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function fetchUserName(user: { id: string; email?: string }) {
      const emailName = user.email?.split('@')[0] || '';
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      setUserName(profile?.display_name || emailName);
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user?: { id: string; email?: string } } | null } }) => {
      if (session?.user) fetchUserName(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: { user?: { id: string; email?: string } } | null) => {
      if (session?.user) {
        fetchUserName(session.user);
      } else {
        setUserName('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleToggle = useCallback((id: WidgetId) => {
    setWidgets(prev => {
      const next = toggleWidget(prev, id);
      saveWidgetPrefs(next);
      return next;
    });
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    setWidgets(prev => {
      const next = reorderWidgets(prev, from, to);
      saveWidgetPrefs(next);
      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex(w => w.id === active.id);
    const newIndex = widgets.findIndex(w => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      handleReorder(oldIndex, newIndex);
    }
  }

  const toggleExpand = useCallback((id: WidgetId) => {
    setExpandedWidgets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const stats = getDashboardStats();

  const filteredSamningar = useMemo(() => {
    if (quickFilter === 'allt') return samningar;
    return samningar.filter(s => s.tegund === quickFilter);
  }, [quickFilter]);

  const filteredBilar = useMemo(() => {
    if (quickFilter === 'allt') return bilar;
    const fyrirtaekiIds = fyrirtaeki.filter(f => f.svid === quickFilter).map(f => f.id);
    return bilar.filter(b => b.fyrirtaekiId && fyrirtaekiIds.includes(b.fyrirtaekiId));
  }, [quickFilter]);

  const rennaUt = useMemo(() => {
    const base = getSamningarSemRennaUt(30);
    if (quickFilter === 'allt') return base;
    return base.filter(s => s.tegund === quickFilter);
  }, [quickFilter]);

  const thjonustur14 = useMemo(() => getNaestaThjonustur(14), []);
  const nySolutaekifaeri = useMemo(() => solutaekifaeri.filter(s => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið'), []);
  const malIVinnslu = useMemo(() => malList.filter(m => m.status !== 'lokað'), [malList]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const verkefniDagsins = useMemo(() => {
    return verkefni.filter(v => v.status !== 'lokið' && v.deadline === today);
  }, [today]);

  const verkefniFramundan = useMemo(() => {
    const d = new Date();
    const in3Days = new Date(d); in3Days.setDate(d.getDate() + 3);
    const in3Str = in3Days.toISOString().split('T')[0];
    return verkefni
      .filter(v => v.status !== 'lokið' && v.deadline > today && v.deadline <= in3Str)
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [today]);

  const allVerkefniOpin = useMemo(() =>
    verkefni.filter(v => v.status !== 'lokið').sort((a, b) => a.deadline.localeCompare(b.deadline)),
  []);

  const verkefniIGangi = useMemo(() => allVerkefniOpin.filter(v => v.status === 'í gangi'), [allVerkefniOpin]);
  const verkefniOpin = useMemo(() => allVerkefniOpin.filter(v => v.status === 'opið'), [allVerkefniOpin]);
  const minVerkefniActive = minVerkefniTab === 'uthlutad' ? verkefniIGangi : verkefniOpin;

  const iLeigu = filteredBilar.filter(b => b.status === 'í leigu').length;
  const lausir = filteredBilar.filter(b => b.status === 'laus').length;
  const iThjonustu = filteredBilar.filter(b => b.status === 'í þjónustu').length;
  const virkirSamningar = filteredSamningar.filter(s => s.status === 'virkur' || s.status === 'rennur_ut');
  const manadalegurTekjur = virkirSamningar.reduce((sum, s) => sum + s.manadalegurKostnadur, 0);

  const selectedVerkefni = selectedVerkefniId
    ? verkefniStore.getVerkefniById(selectedVerkefniId) ?? null
    : null;

  const currentUser = userName || 'Kristján';

  const handleSendNotification = useCallback(async (verkefniId: string, tilNotandaId: string, skilabod: string) => {
    const v = verkefniStore.getVerkefniById(verkefniId);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verkefniTitill: v?.titill ?? '',
          tilNotandaId,
          fraNafn: currentUser,
          skilabod,
        }),
      });
    } catch { /* silent */ }
  }, [verkefniStore, currentUser]);

  const handleMalSave = useCallback((updatedMal: Mal) => {
    setMalList(prev => prev.map(m => m.id === updatedMal.id ? updatedMal : m));
    setSelectedMal(null);
  }, []);

  const visibleWidgets = widgets.filter(w => w.visible);

  const widgetContent: Record<WidgetId, React.ReactNode> = {
    minVerkefni: (
      <div>
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setMinVerkefniTab('uthlutad')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              minVerkefniTab === 'uthlutad'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Í gangi ({verkefniIGangi.length})
          </button>
          <button
            onClick={() => setMinVerkefniTab('stofnad')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              minVerkefniTab === 'stofnad'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Opin ({verkefniOpin.length})
          </button>
        </div>
        <WidgetList
          items={minVerkefniActive}
          maxItems={MAX_ITEMS}
          expanded={expandedWidgets.has('minVerkefni')}
          onToggle={() => toggleExpand('minVerkefni')}
          empty={minVerkefniTab === 'uthlutad' ? 'Engin verkefni í gangi' : 'Engin opin verkefni'}
          renderItem={v => {
            const checkDone = v.checklist.filter(c => c.lokid).length;
            const checkTotal = v.checklist.length;
            const progress = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;
            return (
              <div key={v.id} onClick={() => setSelectedVerkefniId(v.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
                <ItemIcon type={v.sjálfvirkt ? 'auto' : 'task'} color="#8b5cf6" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 truncate">{v.titill}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-white/30">{v.abyrgdaradili}</span>
                    {checkTotal > 0 && (
                      <span className="text-[10px] text-white/25">{checkDone}/{checkTotal}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}>
                    {v.status === 'í gangi' ? 'Í gangi' : v.status === 'opið' ? 'Stofnuð' : v.status}
                  </span>
                  {checkTotal > 0 && (
                    <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/60 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    ),

    verkefniDagsins: (
      <WidgetList
        items={verkefniDagsins}
        maxItems={MAX_ITEMS}
        expanded={expandedWidgets.has('verkefniDagsins')}
        onToggle={() => toggleExpand('verkefniDagsins')}
        empty="Engin verkefni í dag"
        renderItem={v => (
          <div key={v.id} onClick={() => setSelectedVerkefniId(v.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
            <ItemIcon type={v.sjálfvirkt ? 'auto' : 'task'} color="#3b82f6" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/80 truncate">{v.titill}</div>
              <div className="text-[11px] text-white/30">{v.abyrgdaradili}</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}>
              {v.status}
            </span>
          </div>
        )}
      />
    ),

    verkefniFramundan: (
      <WidgetList
        items={verkefniFramundan}
        maxItems={MAX_ITEMS}
        expanded={expandedWidgets.has('verkefniFramundan')}
        onToggle={() => toggleExpand('verkefniFramundan')}
        empty="Engin verkefni næstu 3 daga"
        renderItem={v => {
          const dagar = Math.ceil((new Date(v.deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          const dagLabel = dagar === 1 ? 'á morgun' : `eftir ${dagar}d`;
          return (
            <div key={v.id} onClick={() => setSelectedVerkefniId(v.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
              <ItemIcon type={v.sjálfvirkt ? 'auto' : 'task'} color="#f59e0b" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 truncate">{v.titill}</div>
                <div className="text-[11px] text-white/30">{v.abyrgdaradili} · {v.deadline}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${dagar <= 1 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {dagLabel}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}>
                  {v.status}
                </span>
              </div>
            </div>
          );
        }}
      />
    ),

    samningarRennaUt: (
      <WidgetList
        items={rennaUt}
        maxItems={MAX_ITEMS}
        expanded={expandedWidgets.has('samningarRennaUt')}
        onToggle={() => toggleExpand('samningarRennaUt')}
        empty="Engir samningar renna út"
        renderItem={s => {
          const f = getFyrirtaeki(s.fyrirtaekiId);
          const dagar = Math.ceil((new Date(s.lokadagur).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <div key={s.id} onClick={() => router.push('/samningar')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
              <ItemIcon type="contract" color={dagar <= 14 ? '#ef4444' : '#f59e0b'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{f?.nafn}</span>
                  <TypeBadge tegund={s.tegund} />
                </div>
                <div className="text-[11px] text-white/30">{s.bilanumer}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${dagar <= 14 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {dagar}d
              </span>
            </div>
          );
        }}
      />
    ),

    thjonustur: (
      <WidgetList
        items={thjonustur14}
        maxItems={MAX_ITEMS}
        expanded={expandedWidgets.has('thjonustur')}
        onToggle={() => toggleExpand('thjonustur')}
        empty="Engar þjónustur á næstunni"
        renderItem={t => {
          const bill = bilar.find(b => b.id === t.billId);
          const daysUntil = Math.ceil((new Date(t.dagsThjonustu).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <div key={t.id} onClick={() => router.push('/thjonusta')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
              <ItemIcon type="service" color="#14b8a6" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 truncate">{bill?.tegund}</div>
                <div className="text-[11px] text-white/30">{bill?.numer}</div>
              </div>
              <span className={`text-xs font-medium ${daysUntil <= 7 ? 'text-red-400' : 'text-amber-400'}`}>
                {daysUntil <= 0 ? 'Í dag' : `${daysUntil}d`}
              </span>
            </div>
          );
        }}
      />
    ),

    solutaekifaeri: (
      <WidgetList
        items={nySolutaekifaeri}
        maxItems={MAX_ITEMS}
        expanded={expandedWidgets.has('solutaekifaeri')}
        onToggle={() => toggleExpand('solutaekifaeri')}
        empty="Engin sölutækifæri"
        renderItem={s => {
          const f = getFyrirtaeki(s.fyrirtaekiId);
          return (
            <div key={s.id} onClick={() => router.push('/solutaekifaeri')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
              <ItemIcon type="sales" color="#22c55e" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{s.titill}</div>
                <div className="text-[11px] text-white/30">{f?.nafn}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-white">{formatCurrency(s.verdmaeti)}</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(s.stig), color: getStatusColor(s.stig) }}>
                  {s.stig}
                </span>
              </div>
            </div>
          );
        }}
      />
    ),

    malIVinnslu: (
      <WidgetList
        items={malIVinnslu}
        maxItems={MAX_ITEMS}
        expanded={expandedWidgets.has('malIVinnslu')}
        onToggle={() => toggleExpand('malIVinnslu')}
        empty="Engin opin mál"
        renderItem={m => {
          const f = getFyrirtaeki(m.fyrirtaekiId);
          return (
            <div key={m.id} onClick={() => setSelectedMal(m)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
              <ItemIcon type="case" color={m.forgangur === 'bráður' ? '#ef4444' : m.forgangur === 'hár' ? '#f59e0b' : '#3b82f6'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 truncate">{m.titill}</div>
                <div className="text-[11px] text-white/30">{f?.nafn} · {m.abyrgdaraðili}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: getStatusBg(m.status), color: getStatusColor(m.status) }}>
                {m.status}
              </span>
            </div>
          );
        }}
      />
    ),

    aminningar: (() => {
      const pending = thjonustuaminningar.filter(t => t.status === 'áætluð');
      const overdue = thjonustuaminningar.filter(t => {
        if (t.status === 'lokið') return false;
        const d = new Date(t.dagsThjonustu);
        d.setHours(0,0,0,0);
        const now = new Date();
        now.setHours(0,0,0,0);
        return d.getTime() < now.getTime();
      });
      const urgent = thjonustuaminningar.filter(t => {
        if (t.status === 'lokið') return false;
        const d = new Date(t.dagsThjonustu);
        d.setHours(0,0,0,0);
        const now = new Date();
        now.setHours(0,0,0,0);
        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      });
      const actionNeeded = thjonustuaminningar.filter(t => t.status === 'áætluð' && !t.sendtViðskiptavini && !t.innriTilkynning);

      return (
        <div className="divide-y divide-white/5">
          {/* Urgency summary */}
          <div className="px-4 py-3 space-y-2">
            {overdue.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-medium">{overdue.length} komnar fram yfir</span>
              </div>
            )}
            {urgent.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-400 font-medium">{urgent.length} innan 7 daga</span>
              </div>
            )}
            {actionNeeded.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-blue-400 font-medium">{actionNeeded.length} ósendar áminningar</span>
              </div>
            )}
            {overdue.length === 0 && urgent.length === 0 && actionNeeded.length === 0 && (
              <div className="text-xs text-white/30 text-center py-2">Allt í lagi</div>
            )}
          </div>
          {/* Counts */}
          <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">{pending.length}</div>
              <div className="text-[10px] text-white/30">Áætlaðar</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">{thjonustuaminningar.filter(t => t.status === 'áminning send').length}</div>
              <div className="text-[10px] text-white/30">Sendar</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{thjonustuaminningar.filter(t => t.status === 'lokið').length}</div>
              <div className="text-[10px] text-white/30">Lokið</div>
            </div>
          </div>
          {/* Next up items */}
          {[...overdue, ...urgent].slice(0, 3).map(t => {
            const bil = bilar.find(b => b.id === t.billId);
            const f = bil?.fyrirtaekiId ? getFyrirtaeki(bil.fyrirtaekiId) : null;
            const d = new Date(t.dagsThjonustu);
            d.setHours(0,0,0,0);
            const now = new Date();
            now.setHours(0,0,0,0);
            const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isOver = diff < 0;
            return (
              <Link
                key={t.id}
                href="/thjonusta"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
              >
                <ItemIcon type="reminder" color={isOver ? '#ef4444' : '#f59e0b'} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/80 truncate">{bil?.tegund} — {t.tegund}</div>
                  <div className="text-[10px] text-white/30">{f?.nafn ?? ''}</div>
                </div>
                <span className={`text-[10px] font-medium shrink-0 ${isOver ? 'text-red-400' : 'text-amber-400'}`}>
                  {isOver ? `${Math.abs(diff)}d seint` : `${diff}d`}
                </span>
              </Link>
            );
          })}
        </div>
      );
    })(),
  };

  const widgetMeta: Record<WidgetId, { badge?: number; badgeColor?: string; accentColor: string; link?: string; linkLabel?: string; totalItems?: number }> = {
    minVerkefni: { badge: allVerkefniOpin.length, badgeColor: '#8b5cf6', accentColor: '#8b5cf6', link: '/verkefnalisti', linkLabel: 'Sjá öll →', totalItems: minVerkefniActive.length },
    verkefniDagsins: { badge: verkefniDagsins.length, badgeColor: '#3b82f6', accentColor: '#3b82f6', link: '/verkefnalisti', linkLabel: 'Sjá öll →', totalItems: verkefniDagsins.length },
    verkefniFramundan: { badge: verkefniFramundan.length, badgeColor: '#f59e0b', accentColor: '#f59e0b', link: '/verkefnalisti', linkLabel: 'Sjá öll →', totalItems: verkefniFramundan.length },
    samningarRennaUt: { badge: rennaUt.length, badgeColor: '#ef4444', accentColor: '#ef4444', link: '/samningar', linkLabel: 'Sjá alla →', totalItems: rennaUt.length },
    thjonustur: { badge: thjonustur14.length, badgeColor: '#f59e0b', accentColor: '#14b8a6', link: '/thjonusta', linkLabel: 'Sjá allar →', totalItems: thjonustur14.length },
    solutaekifaeri: { accentColor: '#22c55e', link: '/solutaekifaeri', linkLabel: 'Sjá öll →', totalItems: nySolutaekifaeri.length },
    malIVinnslu: { badge: malIVinnslu.length, badgeColor: '#ef4444', accentColor: '#f43f5e', link: '/malaskraning', linkLabel: 'Sjá öll →', totalItems: malIVinnslu.length },
    aminningar: { badge: thjonustuaminningar.filter(t => t.status !== 'lokið').length, badgeColor: '#f59e0b', accentColor: '#f97316', link: '/thjonusta', linkLabel: 'Senda áminningu →' },
  };

  const widgetLabels: Record<WidgetId, string> = {
    minVerkefni: 'Mín verkefni',
    verkefniDagsins: 'Verkefni dagsins',
    verkefniFramundan: 'Verkefni framundan',
    samningarRennaUt: 'Samningar sem renna út',
    thjonustur: 'Þjónustur næstu 14 daga',
    solutaekifaeri: 'Ný sölutækifæri',
    malIVinnslu: 'Mál í vinnslu',
    aminningar: 'Þjónustuáminningar',
  };

  if (widgets.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Stjórnborð
          </h1>
          {userName ? (
            <p className="text-sm text-white/50 mt-0.5">Góðan daginn, {userName}</p>
          ) : (
            <p className="text-xs text-white/30 mt-0.5">Enterprise Bílaleiga – Vatnsmýrarvegur 10, Reykjavík</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
            {([
              { key: 'allt' as QuickFilter, label: 'Allt' },
              { key: 'langtimaleiga' as QuickFilter, label: 'Langtímaleiga' },
              { key: 'flotaleiga' as QuickFilter, label: 'Flotaleiga' },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setQuickFilter(f.key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  quickFilter === f.key
                    ? 'bg-blue-600/30 text-blue-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCustomizerOpen(true)}
            className="p-2 rounded-lg border border-white/5 bg-[#161822] text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            title="Sérsnið stjórnborð"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Virkir samningar" value={virkirSamningar.length.toString()} sub={formatCurrency(manadalegurTekjur) + '/m'} accent="#3b82f6" href="/samningar" />
        <StatCard label="Bílar í notkun" value={`${iLeigu}`} sub={`${lausir} lausir · ${iThjonustu} þjón.`} accent="#8b5cf6" href="/bilar" />
        <StatCard label="Skil 30d" value={rennaUt.length.toString()} sub={rennaUt.length > 0 ? 'Renna út' : 'Ekkert'} accent="#f59e0b" href="/samningar" />
        <StatCard label="Opin mál" value={malIVinnslu.length.toString()} sub={`${mal.filter(m => m.forgangur === 'hár' || m.forgangur === 'bráður').length} hár forg.`} accent="#ef4444" href="/malaskraning" />
        <StatCard label="Sölurás" value={formatCurrency(stats.pipalineVerdmaeti)} sub={`${nySolutaekifaeri.length} ný`} accent="#22c55e" href="/solutaekifaeri" />
      </div>

      {/* Widgets Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {visibleWidgets.map(w => {
              const meta = widgetMeta[w.id];
              return (
                <DashboardWidget
                  key={w.id}
                  id={w.id}
                  title={widgetLabels[w.id]}
                  badge={meta.badge}
                  badgeColor={meta.badgeColor}
                  accentColor={meta.accentColor}
                  link={meta.link}
                  linkLabel={meta.linkLabel}
                >
                  {widgetContent[w.id]}
                </DashboardWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Customizer Modal */}
      <DashboardCustomizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        widgets={widgets}
        onToggle={handleToggle}
        onReorder={handleReorder}
      />

      {/* Verkefni Detail Modal */}
      {selectedVerkefni && (
        <VerkefniDetailModal
          verkefni={selectedVerkefni}
          store={verkefniStore}
          currentUser={currentUser}
          onClose={() => setSelectedVerkefniId(null)}
          onSendNotification={handleSendNotification}
        />
      )}

      {/* Mál Modal */}
      {selectedMal && (
        <MalModal
          mal={selectedMal}
          onClose={() => setSelectedMal(null)}
          onSave={handleMalSave}
        />
      )}
    </div>
  );
}

/* ─── Compact StatCard ─── */

function StatCard({ label, value, sub, accent, href }: {
  label: string; value: string; sub: string; accent: string; href?: string;
}) {
  const content = (
    <>
      <div className="text-[11px] font-medium text-white/40 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] text-white/30 mt-1">{sub}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group bg-[#161822] rounded-xl border border-white/[0.08] px-4 py-3 hover:border-white/[0.15] transition-all shadow-sm shadow-black/20 block">
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-[#161822] rounded-xl border border-white/[0.08] px-4 py-3 shadow-sm shadow-black/20">
      {content}
    </div>
  );
}

/* ─── WidgetList with progressive disclosure ─── */

function WidgetList<T>({ items, maxItems, expanded, onToggle, empty, renderItem }: {
  items: T[];
  maxItems: number;
  expanded: boolean;
  onToggle: () => void;
  empty: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <div className="px-4 py-6 text-center text-sm text-white/20">{empty}</div>;
  }

  const shown = expanded ? items : items.slice(0, maxItems);
  const remaining = items.length - maxItems;

  return (
    <>
      {shown.map((item, i) => renderItem(item, i))}
      {remaining > 0 && (
        <button
          onClick={onToggle}
          className="w-full px-4 py-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-white/[0.02] transition-colors border-t border-white/5"
        >
          {expanded ? 'Fela' : `Sjá ${remaining} fleiri`}
        </button>
      )}
    </>
  );
}

/* ─── Type Badge ─── */

function TypeBadge({ tegund }: { tegund: Svid }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{
      backgroundColor: tegund === 'flotaleiga' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
      color: tegund === 'flotaleiga' ? '#a78bfa' : '#60a5fa'
    }}>
      {tegund === 'flotaleiga' ? 'Floti' : 'Langtíma'}
    </span>
  );
}

/* ─── Consistent Item Icon ─── */

const ICON_PATHS: Record<string, string> = {
  task: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  auto: 'M13 10V3L4 14h7v7l9-11h-7z',
  contract: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  service: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  sales: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  case: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  reminder: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

function ItemIcon({ type, color }: { type: string; color: string }) {
  return (
    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
      <svg className="w-3 h-3" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[type] || ICON_PATHS.task} />
      </svg>
    </div>
  );
}
