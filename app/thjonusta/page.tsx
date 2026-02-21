'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  thjonustuaminningar as initialAminningar,
  bilar,
  getFyrirtaeki,
  getStatusColor,
  getStatusBg,
  type Thjonustuaminning,
  type Bill,
  type Fyrirtaeki,
} from '@/lib/enterprise-demo-data';

type StatusFilter =
  | 'allar'
  | 'áætluð'
  | 'áminning send'
  | 'lokið'
  | 'seinkað';

type SendingType = 'email' | 'sms' | 'innri';

interface SendingLog {
  id: string;
  aminningId: string;
  tegund: SendingType;
  dagsetning: string;
  motttakandi: string;
  skilabod: string;
  sjalfvirkt: boolean;
}

interface WorkflowSkref {
  id: string;
  rod: number;
  dagarFyrir: number;
  adgerd: SendingType;
  skilabodSnidmat: string;
  sjalfvirkt: boolean;
}

interface WorkflowSnidmat {
  id: string;
  nafn: string;
  lysing: string;
  tegundThjonustu: string[];
  virkt: boolean;
  skref: WorkflowSkref[];
}

function getDaysUntilService(dagsThjonustu: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const serviceDate = new Date(dagsThjonustu);
  serviceDate.setHours(0, 0, 0, 0);
  return Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_LABELS: Record<string, string> = {
  'áætluð': 'Áætluð',
  'áminning send': 'Áminning send',
  'lokið': 'Lokið',
  'seinkað': 'Seinkað',
};

const TEGUND_OPTIONS: Thjonustuaminning['tegund'][] = [
  'þjónustuskoðun',
  'dekkjaskipti',
  'smurþjónusta',
  'olíuskipti',
  'hefðbundið viðhald',
];

const ADGERD_LABELS: Record<SendingType, string> = {
  email: 'Tölvupóstur',
  sms: 'SMS',
  innri: 'Innri áminning',
};

const ADGERD_COLORS: Record<SendingType, string> = {
  email: '#3b82f6',
  sms: '#22c55e',
  innri: '#f59e0b',
};

const DEFAULT_WORKFLOWS: WorkflowSnidmat[] = [
  {
    id: 'wf1',
    nafn: 'Staðlað þjónustuferli',
    lysing: 'Sjálfvirkt ferli sem sendir áminningar á ákveðnum tímapunktum fyrir þjónustu',
    tegundThjonustu: ['þjónustuskoðun', 'hefðbundið viðhald'],
    virkt: true,
    skref: [
      { id: 'ws1', rod: 1, dagarFyrir: 30, adgerd: 'innri', skilabodSnidmat: 'Innri áminning: {{tegund}} á {{bil}} ({{numer}}) hjá {{fyrirtaeki}} eftir 30 daga.', sjalfvirkt: true },
      { id: 'ws2', rod: 2, dagarFyrir: 14, adgerd: 'email', skilabodSnidmat: 'Góðan daginn,\n\nVið viljum minna á að {{bil}} ({{numer}}) á að fara í {{tegund}} þann {{dags_thjonustu}}.\n\nKveðja,\nEnterprise Leiga', sjalfvirkt: true },
      { id: 'ws3', rod: 3, dagarFyrir: 7, adgerd: 'sms', skilabodSnidmat: 'Enterprise Leiga: {{bil}} ({{numer}}) á í {{tegund}} {{dags_thjonustu}}. Hafðu samband.', sjalfvirkt: true },
      { id: 'ws4', rod: 4, dagarFyrir: 1, adgerd: 'innri', skilabodSnidmat: 'BRÁÐ áminning: {{bil}} ({{numer}}) á í {{tegund}} á morgun!', sjalfvirkt: true },
    ],
  },
  {
    id: 'wf2',
    nafn: 'Dekkjaskiptaferli',
    lysing: 'Áminningar fyrir dekkjaskipti',
    tegundThjonustu: ['dekkjaskipti'],
    virkt: false,
    skref: [
      { id: 'ws5', rod: 1, dagarFyrir: 21, adgerd: 'innri', skilabodSnidmat: 'Dekkjaskipti áætlað fyrir {{bil}} ({{numer}}) eftir 3 vikur.', sjalfvirkt: true },
      { id: 'ws6', rod: 2, dagarFyrir: 7, adgerd: 'email', skilabodSnidmat: 'Góðan daginn,\n\n{{bil}} ({{numer}}) á dekkjaskipti þann {{dags_thjonustu}}.\n\nKveðja,\nEnterprise Leiga', sjalfvirkt: true },
    ],
  },
  {
    id: 'wf3',
    nafn: 'Smurþjónustuferli',
    lysing: 'Áminningar fyrir smurþjónustu og olíuskipti',
    tegundThjonustu: ['smurþjónusta', 'olíuskipti'],
    virkt: false,
    skref: [
      { id: 'ws7', rod: 1, dagarFyrir: 14, adgerd: 'innri', skilabodSnidmat: 'Smurþjónusta/olíuskipti áætlað fyrir {{bil}} eftir 2 vikur.', sjalfvirkt: true },
      { id: 'ws8', rod: 2, dagarFyrir: 3, adgerd: 'email', skilabodSnidmat: 'Góðan daginn,\n\n{{bil}} ({{numer}}) á í smurþjónustu/olíuskipti {{dags_thjonustu}}.\n\nKveðja,\nEnterprise Leiga', sjalfvirkt: true },
    ],
  },
];

export default function ThjonustaPage() {
  const [aminningar, setAminningar] = useState<Thjonustuaminning[]>([...initialAminningar]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('allar');
  const [sendingModal, setSendingModal] = useState<{
    aminning: Thjonustuaminning;
    bill: Bill | undefined;
    fyrirtaeki: Fyrirtaeki | null;
  } | null>(null);
  const [sendingLogs, setSendingLogs] = useState<SendingLog[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [nyAminningOpen, setNyAminningOpen] = useState(false);
  const [workflowModal, setWorkflowModal] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowSnidmat[]>(DEFAULT_WORKFLOWS);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowSnidmat | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const stats = useMemo(() => ({
    áætlaðar: aminningar.filter((t) => t.status === 'áætluð').length,
    aminningSendar: aminningar.filter((t) => t.status === 'áminning send').length,
    lokid: aminningar.filter((t) => t.status === 'lokið').length,
    seinkad: aminningar.filter((t) => t.status === 'seinkað').length,
  }), [aminningar]);

  const filteredAminningar = useMemo(() => {
    const list = statusFilter === 'allar' ? aminningar : aminningar.filter((t) => t.status === statusFilter);
    return list.sort((a, b) => new Date(a.dagsThjonustu).getTime() - new Date(b.dagsThjonustu).getTime());
  }, [aminningar, statusFilter]);

  function handleStatusChange(id: string, newStatus: Thjonustuaminning['status']) {
    setAminningar(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    showToast(`Staða breytt í: ${STATUS_LABELS[newStatus]}`);
  }

  function openSendingModal(a: Thjonustuaminning) {
    const bill = bilar.find(b => b.id === a.billId);
    const fyrirtaeki = bill?.fyrirtaekiId ? getFyrirtaeki(bill.fyrirtaekiId) ?? null : null;
    setSendingModal({ aminning: a, bill, fyrirtaeki });
  }

  function handleSending(aminningId: string, tegund: SendingType, motttakandi: string, skilabod: string) {
    const log: SendingLog = {
      id: `sl-${Date.now()}`,
      aminningId,
      tegund,
      dagsetning: new Date().toISOString().split('T')[0],
      motttakandi,
      skilabod,
      sjalfvirkt: false,
    };
    setSendingLogs(prev => [log, ...prev]);

    setAminningar(prev => prev.map(a => {
      if (a.id !== aminningId) return a;
      if (tegund === 'email') return { ...a, sendtViðskiptavini: true, status: 'áminning send' as const };
      if (tegund === 'innri') return { ...a, innriTilkynning: true, status: 'áminning send' as const };
      return { ...a, status: 'áminning send' as const };
    }));

    const labels: Record<SendingType, string> = {
      email: 'Tölvupóstur sendur',
      sms: 'SMS sent',
      innri: 'Innri áminning send',
    };
    showToast(`${labels[tegund]} til ${motttakandi}`);
    setSendingModal(null);
  }

  function handleCreateAminning(newA: Thjonustuaminning) {
    setAminningar(prev => [...prev, newA]);
    setNyAminningOpen(false);
    showToast('Ný áminning stofnuð');
  }

  function handleToggleWorkflow(id: string) {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, virkt: !w.virkt } : w));
    const wf = workflows.find(w => w.id === id);
    showToast(wf?.virkt ? `${wf.nafn} gert óvirkt` : `${wf?.nafn} virkjað`);
  }

  function handleSaveWorkflow(wf: WorkflowSnidmat) {
    setWorkflows(prev => {
      const exists = prev.find(w => w.id === wf.id);
      if (exists) return prev.map(w => w.id === wf.id ? wf : w);
      return [...prev, wf];
    });
    setEditingWorkflow(null);
    setWorkflowModal(false);
    showToast(workflows.find(w => w.id === wf.id) ? 'Ferli uppfært' : 'Nýtt ferli stofnað');
  }

  function handleDeleteWorkflow(id: string) {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    showToast('Ferli eytt');
  }

  function getLogsForAminning(id: string) {
    return sendingLogs.filter(l => l.aminningId === id);
  }

  const activeWorkflows = workflows.filter(w => w.virkt);

  const filterTabs: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'allar', label: 'Allar', count: aminningar.length },
    { value: 'áætluð', label: 'Áætlaðar', count: stats.áætlaðar },
    { value: 'áminning send', label: 'Áminning send', count: stats.aminningSendar },
    { value: 'lokið', label: 'Lokið', count: stats.lokid },
    { value: 'seinkað', label: 'Seinkaðar', count: stats.seinkad },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Þjónustuáminningar</h1>
          <p className="text-sm text-white/40 mt-1">Bílaþjónusta, áminningar og sendingarstjórnun</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWorkflowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors text-sm font-medium border border-purple-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sjálfvirk ferli
            {activeWorkflows.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300">
                {activeWorkflows.length} virk
              </span>
            )}
          </button>
          <button
            onClick={() => setNyAminningOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ný áminning
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Áætlaðar þjónustur', value: stats.áætlaðar, color: '#3b82f6' },
          { label: 'Áminningar sendar', value: stats.aminningSendar, color: '#f59e0b' },
          { label: 'Lokið', value: stats.lokid, color: '#22c55e' },
          { label: 'Seinkaðar', value: stats.seinkad, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="bg-[#161822] rounded-xl border border-white/5 p-5">
            <div className="text-xs font-medium text-white/40 mb-2">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.value
                ? 'bg-blue-600/30 text-blue-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Þjónustuáminningar
                <span className="text-white/30 font-normal ml-2">{filteredAminningar.length}</span>
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {filteredAminningar.map((a) => {
                const bil = bilar.find((b) => b.id === a.billId);
                const fyrirtaeki = bil?.fyrirtaekiId ? getFyrirtaeki(bil.fyrirtaekiId) : null;
                const dagarTil = getDaysUntilService(a.dagsThjonustu);
                const logs = getLogsForAminning(a.id);
                const isExpanded = expandedRow === a.id;
                const isUrgent = dagarTil <= 7 && dagarTil >= 0 && a.status !== 'lokið';
                const isOverdue = dagarTil < 0 && a.status !== 'lokið';

                return (
                  <div key={a.id} className={`transition-colors ${isUrgent ? 'bg-amber-500/[0.03]' : isOverdue ? 'bg-red-500/[0.03]' : ''}`}>
                    {/* Main row */}
                    <div
                      className="px-5 py-4 hover:bg-white/[0.02] cursor-pointer flex items-center gap-4"
                      onClick={() => setExpandedRow(isExpanded ? null : a.id)}
                    >
                      <svg
                        className={`w-4 h-4 text-white/20 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/bilar/${a.billId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                          >
                            {bil?.tegund ?? '—'}
                          </Link>
                          <span className="text-xs text-white/30">{bil?.numer} • {bil?.litur}</span>
                          {fyrirtaeki && (
                            <span className="text-xs text-white/50">{fyrirtaeki.nafn}</span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {a.tegund} • Þjónusta: {formatDate(a.dagsThjonustu)}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {a.status !== 'lokið' && (
                          <span className={`text-sm font-semibold ${
                            isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white/50'
                          }`}>
                            {isOverdue ? `${Math.abs(dagarTil)}d síðan` : `${dagarTil}d`}
                          </span>
                        )}
                      </div>

                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ backgroundColor: getStatusBg(a.status), color: getStatusColor(a.status) }}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0 w-14">
                        {a.sendtViðskiptavini && (
                          <span className="text-blue-400" title="Tölvupóstur sendur">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </span>
                        )}
                        {a.innriTilkynning && (
                          <span className="text-amber-400" title="Innri tilkynning">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); openSendingModal(a); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors font-medium shrink-0"
                      >
                        Senda
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pl-14 space-y-4 animate-in slide-in-from-top-1 duration-150">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openSendingModal(a)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/15 text-blue-400 text-xs font-medium hover:bg-blue-600/25 transition-colors border border-blue-500/20"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Senda tölvupóst / SMS / áminningu
                          </button>
                          {a.status !== 'lokið' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'lokið')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/15 text-green-400 text-xs font-medium hover:bg-green-600/25 transition-colors border border-green-500/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Merkja lokið
                            </button>
                          )}
                          {a.status === 'áætluð' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'seinkað')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/15 text-red-400 text-xs font-medium hover:bg-red-600/25 transition-colors border border-red-500/20"
                            >
                              Merkja seinkað
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            <span className="text-white/40 text-xs block">Tegund</span>
                            <span className="text-white">{a.tegund}</span>
                          </div>
                          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            <span className="text-white/40 text-xs block">Áminningardagur</span>
                            <span className="text-white">{formatDate(a.dagsAminningar)}</span>
                          </div>
                          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            <span className="text-white/40 text-xs block">Þjónustudagur</span>
                            <span className="text-white">{formatDate(a.dagsThjonustu)}</span>
                          </div>
                          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            <span className="text-white/40 text-xs block">Fyrirtæki</span>
                            <span className="text-white">{fyrirtaeki?.nafn ?? 'Enginn leigjandi'}</span>
                          </div>
                        </div>

                        {/* Workflow match indicator */}
                        {activeWorkflows.some(w => w.tegundThjonustu.includes(a.tegund)) && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/[0.05] border border-purple-500/10">
                            <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-xs text-purple-300">
                              Sjálfvirkt ferli virkt: {activeWorkflows.find(w => w.tegundThjonustu.includes(a.tegund))?.nafn}
                            </span>
                          </div>
                        )}

                        {logs.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Sendingarferill</div>
                            <div className="space-y-1.5">
                              {logs.map(log => (
                                <div key={log.id} className="flex items-center gap-3 text-xs bg-white/[0.02] rounded-lg p-2.5 border border-white/5">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                    log.tegund === 'email' ? 'bg-blue-500/20' : log.tegund === 'sms' ? 'bg-green-500/20' : 'bg-amber-500/20'
                                  }`}>
                                    {log.tegund === 'email' && (
                                      <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {log.tegund === 'sms' && (
                                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {log.tegund === 'innri' && (
                                      <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-white/70">
                                      {log.tegund === 'email' ? 'Tölvupóstur' : log.tegund === 'sms' ? 'SMS' : 'Innri áminning'}
                                    </span>
                                    <span className="text-white/30"> → {log.motttakandi}</span>
                                    {log.sjalfvirkt && (
                                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">sjálfvirkt</span>
                                    )}
                                  </div>
                                  <span className="text-white/25 shrink-0">{log.dagsetning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {filteredAminningar.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-white/30">
                Engar þjónustuáminningar fundust
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active workflows summary */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Sjálfvirk ferli</h2>
              <button
                onClick={() => setWorkflowModal(true)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Stjórna
              </button>
            </div>
            <div className="p-5 space-y-3">
              {workflows.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Engin ferli skilgreind</p>
              ) : (
                workflows.map(wf => (
                  <div
                    key={wf.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      wf.virkt
                        ? 'bg-purple-500/[0.05] border-purple-500/15'
                        : 'bg-white/[0.02] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-sm font-medium ${wf.virkt ? 'text-purple-300' : 'text-white/50'}`}>
                        {wf.nafn}
                      </span>
                      <button
                        onClick={() => handleToggleWorkflow(wf.id)}
                        className={`w-9 h-5 rounded-full flex items-center shrink-0 transition-colors border ${
                          wf.virkt
                            ? 'bg-purple-500/40 border-purple-500/30 justify-end'
                            : 'bg-white/10 border-white/10 justify-start'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full mx-0.5 shadow-sm transition-colors ${
                          wf.virkt ? 'bg-white' : 'bg-white/50'
                        }`} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {wf.tegundThjonustu.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{t}</span>
                      ))}
                    </div>
                    <div className="text-[11px] text-white/30">
                      {wf.skref.length} skref • {wf.skref.map(s => `${s.dagarFyrir}d`).join(' → ')}
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => {
                  setEditingWorkflow(null);
                  setWorkflowModal(true);
                }}
                className="w-full py-2.5 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nýtt ferli
              </button>
            </div>
          </div>

          {/* Recent sendings */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Nýlegar sendingar</h2>
            </div>
            <div className="p-5">
              {sendingLogs.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Engar sendingar enn</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sendingLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="text-xs p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.tegund === 'email' ? 'bg-blue-400' : log.tegund === 'sms' ? 'bg-green-400' : 'bg-amber-400'
                        }`} />
                        <span className="text-white/70 font-medium">
                          {log.tegund === 'email' ? 'Tölvupóstur' : log.tegund === 'sms' ? 'SMS' : 'Innri'}
                        </span>
                        {log.sjalfvirkt && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300">auto</span>
                        )}
                        <span className="text-white/25 ml-auto">{log.dagsetning}</span>
                      </div>
                      <p className="text-white/40 mt-1 truncate">{log.motttakandi}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Reminder Modal */}
      {nyAminningOpen && (
        <NyAminningModal
          onClose={() => setNyAminningOpen(false)}
          onCreate={handleCreateAminning}
        />
      )}

      {/* Sending Modal */}
      {sendingModal && (
        <SendingModal
          aminning={sendingModal.aminning}
          bill={sendingModal.bill}
          fyrirtaeki={sendingModal.fyrirtaeki}
          onClose={() => setSendingModal(null)}
          onSend={handleSending}
        />
      )}

      {/* Workflow Modal */}
      {workflowModal && (
        <WorkflowModal
          workflows={workflows}
          editingWorkflow={editingWorkflow}
          onClose={() => { setWorkflowModal(false); setEditingWorkflow(null); }}
          onSave={handleSaveWorkflow}
          onToggle={handleToggleWorkflow}
          onEdit={setEditingWorkflow}
          onDelete={handleDeleteWorkflow}
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

/* ─── New Reminder Modal ──────────────────────────────────────────────────── */

function NyAminningModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (a: Thjonustuaminning) => void;
}) {
  const [billId, setBillId] = useState('');
  const [tegund, setTegund] = useState<Thjonustuaminning['tegund']>('þjónustuskoðun');
  const [dagsThjonustu, setDagsThjonustu] = useState('');
  const [dagsAminningar, setDagsAminningar] = useState('');
  const [billSearch, setBillSearch] = useState('');

  const filteredBilar = useMemo(() => {
    if (!billSearch) return bilar.slice(0, 10);
    const q = billSearch.toLowerCase();
    return bilar.filter(b =>
      b.tegund.toLowerCase().includes(q) ||
      b.numer.toLowerCase().includes(q) ||
      b.litur.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [billSearch]);

  const selectedBil = bilar.find(b => b.id === billId);
  const selectedFyrirtaeki = selectedBil?.fyrirtaekiId ? getFyrirtaeki(selectedBil.fyrirtaekiId) : null;

  function handleSubmit() {
    if (!billId || !dagsThjonustu) return;
    const aminningarDags = dagsAminningar || (() => {
      const d = new Date(dagsThjonustu);
      d.setDate(d.getDate() - 14);
      return d.toISOString().split('T')[0];
    })();

    onCreate({
      id: `ta-${Date.now()}`,
      billId,
      tegund,
      dagsAminningar: aminningarDags,
      dagsThjonustu,
      status: 'áætluð',
      sendtViðskiptavini: false,
      innriTilkynning: false,
    });
  }

  const isValid = billId && dagsThjonustu;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mb-12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Ný þjónustuáminning</h2>
              <p className="text-xs text-white/40 mt-0.5">Stofna nýja áminningu handvirkt</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Car selector */}
            <div>
              <label className="text-xs font-medium text-white/50 block mb-1.5">Bíll</label>
              {selectedBil ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/[0.05] border border-blue-500/20">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{selectedBil.tegund}</div>
                    <div className="text-xs text-white/40">{selectedBil.numer} • {selectedBil.litur} {selectedFyrirtaeki ? `• ${selectedFyrirtaeki.nafn}` : ''}</div>
                  </div>
                  <button onClick={() => setBillId('')} className="text-white/30 hover:text-white/60 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Leita eftir bíl..."
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                    className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-white/5 bg-[#0f1117] p-1.5">
                    {filteredBilar.map(b => {
                      const f = b.fyrirtaekiId ? getFyrirtaeki(b.fyrirtaekiId) : null;
                      return (
                        <button
                          key={b.id}
                          onClick={() => { setBillId(b.id); setBillSearch(''); }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">{b.tegund}</div>
                            <div className="text-xs text-white/30">{b.numer} • {b.litur} {f ? `• ${f.nafn}` : ''}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            b.status === 'í leigu' ? 'bg-blue-500/20 text-blue-400' :
                            b.status === 'laus' ? 'bg-green-500/20 text-green-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {b.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Service type */}
            <div>
              <label className="text-xs font-medium text-white/50 block mb-1.5">Tegund þjónustu</label>
              <div className="grid grid-cols-1 gap-1.5">
                {TEGUND_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTegund(t)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      tegund === t
                        ? 'border-blue-500/30 bg-blue-500/[0.05] text-blue-400'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/[0.01] text-white/70'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Service date */}
            <div>
              <label className="text-xs font-medium text-white/50 block mb-1.5">Þjónustudagur</label>
              <input
                type="date"
                value={dagsThjonustu}
                onChange={(e) => setDagsThjonustu(e.target.value)}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
              />
            </div>

            {/* Reminder date */}
            <div>
              <label className="text-xs font-medium text-white/50 block mb-1.5">
                Áminningardagur
                <span className="text-white/30 font-normal ml-1">(sjálfgefið 14 dögum fyrir)</span>
              </label>
              <input
                type="date"
                value={dagsAminningar}
                onChange={(e) => setDagsAminningar(e.target.value)}
                placeholder="Sjálfgefið 14 dögum fyrir þjónustu"
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Hætta við
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Stofna áminningu
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Workflow Modal ──────────────────────────────────────────────────────── */

function WorkflowModal({
  workflows,
  editingWorkflow,
  onClose,
  onSave,
  onToggle,
  onEdit,
  onDelete,
}: {
  workflows: WorkflowSnidmat[];
  editingWorkflow: WorkflowSnidmat | null;
  onClose: () => void;
  onSave: (wf: WorkflowSnidmat) => void;
  onToggle: (id: string) => void;
  onEdit: (wf: WorkflowSnidmat) => void;
  onDelete: (id: string) => void;
}) {
  const [showEditor, setShowEditor] = useState(!!editingWorkflow);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[4vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl mb-12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">
                {showEditor ? (editingWorkflow ? 'Breyta ferli' : 'Nýtt sjálfvirkt ferli') : 'Sjálfvirk ferli'}
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                {showEditor
                  ? 'Skilgreindu skref sem fara af stað sjálfkrafa á ákveðnum tímapunktum'
                  : 'Stjórna sjálfvirkum áminningarferlum'}
              </p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {showEditor ? (
            <WorkflowEditor
              workflow={editingWorkflow}
              onSave={(wf) => { onSave(wf); setShowEditor(false); }}
              onCancel={() => { setShowEditor(false); onEdit(null as unknown as WorkflowSnidmat); }}
            />
          ) : (
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
                Sjálfvirk ferli senda áminningar sjálfkrafa á ákveðnum tímapunktum áður en þjónusta á að fara fram.
                Hvert ferli getur innihaldið mörg skref (t.d. innri tilkynning 30 dögum fyrir, tölvupóstur 14 dögum fyrir, o.s.frv.).
              </p>

              <div className="space-y-3">
                {workflows.map(wf => (
                  <div
                    key={wf.id}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      wf.virkt
                        ? 'border-purple-500/20 bg-purple-500/[0.03]'
                        : 'border-white/5 bg-white/[0.01]'
                    }`}
                  >
                    <div className="px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${wf.virkt ? 'text-purple-300' : 'text-white/60'}`}>
                            {wf.nafn}
                          </span>
                          {wf.virkt && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">Virkt</span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{wf.lysing}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {wf.tegundThjonustu.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { onEdit(wf); setShowEditor(true); }}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-colors"
                          title="Breyta"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(wf.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                          title="Eyða"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onToggle(wf.id)}
                          className={`w-10 h-5.5 rounded-full flex items-center transition-colors border ${
                            wf.virkt
                              ? 'bg-purple-500/40 border-purple-500/30 justify-end'
                              : 'bg-white/10 border-white/10 justify-start'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full mx-0.5 shadow-sm ${wf.virkt ? 'bg-white' : 'bg-white/50'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Steps timeline */}
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-1">
                        {wf.skref.sort((a, b) => b.dagarFyrir - a.dagarFyrir).map((s, i) => (
                          <div key={s.id} className="flex items-center gap-1">
                            {i > 0 && <div className="w-4 h-px bg-white/10" />}
                            <div
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]"
                              style={{ backgroundColor: ADGERD_COLORS[s.adgerd] + '15', color: ADGERD_COLORS[s.adgerd] }}
                            >
                              <span className="font-semibold">{s.dagarFyrir}d</span>
                              <span className="opacity-70">{ADGERD_LABELS[s.adgerd]}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-1 ml-1">
                          <div className="w-4 h-px bg-white/10" />
                          <div className="px-2 py-1 rounded-md text-[11px] bg-green-500/10 text-green-400 font-medium">
                            Þjónusta
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowEditor(true)}
                className="w-full py-3 rounded-xl border border-dashed border-white/10 text-sm text-white/50 hover:text-white/70 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Stofna nýtt ferli
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Workflow Editor ─────────────────────────────────────────────────────── */

function WorkflowEditor({
  workflow,
  onSave,
  onCancel,
}: {
  workflow: WorkflowSnidmat | null;
  onSave: (wf: WorkflowSnidmat) => void;
  onCancel: () => void;
}) {
  const [nafn, setNafn] = useState(workflow?.nafn ?? '');
  const [lysing, setLysing] = useState(workflow?.lysing ?? '');
  const [tegundThjonustu, setTegundThjonustu] = useState<string[]>(workflow?.tegundThjonustu ?? []);
  const [skref, setSkref] = useState<WorkflowSkref[]>(
    workflow?.skref ?? [
      { id: `ws-${Date.now()}`, rod: 1, dagarFyrir: 14, adgerd: 'innri', skilabodSnidmat: '', sjalfvirkt: true },
    ]
  );

  function toggleTegund(t: string) {
    setTegundThjonustu(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  function addSkref() {
    const maxRod = Math.max(0, ...skref.map(s => s.rod));
    setSkref(prev => [...prev, {
      id: `ws-${Date.now()}`,
      rod: maxRod + 1,
      dagarFyrir: 7,
      adgerd: 'email',
      skilabodSnidmat: '',
      sjalfvirkt: true,
    }]);
  }

  function updateSkref(id: string, updates: Partial<WorkflowSkref>) {
    setSkref(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  function removeSkref(id: string) {
    setSkref(prev => prev.filter(s => s.id !== id));
  }

  function handleSave() {
    if (!nafn || tegundThjonustu.length === 0 || skref.length === 0) return;
    onSave({
      id: workflow?.id ?? `wf-${Date.now()}`,
      nafn,
      lysing,
      tegundThjonustu,
      virkt: workflow?.virkt ?? true,
      skref: skref.sort((a, b) => b.dagarFyrir - a.dagarFyrir).map((s, i) => ({ ...s, rod: i + 1 })),
    });
  }

  const isValid = nafn && tegundThjonustu.length > 0 && skref.length > 0;
  const sortedSkref = [...skref].sort((a, b) => b.dagarFyrir - a.dagarFyrir);

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Name */}
      <div>
        <label className="text-xs font-medium text-white/50 block mb-1.5">Heiti ferlis</label>
        <input
          type="text"
          value={nafn}
          onChange={(e) => setNafn(e.target.value)}
          placeholder="t.d. Staðlað þjónustuferli"
          className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-white/50 block mb-1.5">Lýsing</label>
        <input
          type="text"
          value={lysing}
          onChange={(e) => setLysing(e.target.value)}
          placeholder="Stutt lýsing á ferlinu..."
          className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30"
        />
      </div>

      {/* Service types */}
      <div>
        <label className="text-xs font-medium text-white/50 block mb-1.5">Tegundir þjónustu sem ferli gildir um</label>
        <div className="flex flex-wrap gap-2">
          {TEGUND_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => toggleTegund(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                tegundThjonustu.includes(t)
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                  : 'bg-white/[0.02] border-white/5 text-white/50 hover:border-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-white/50">Skref í ferli</label>
          <button
            onClick={addSkref}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Bæta við skrefi
          </button>
        </div>

        <div className="space-y-3">
          {sortedSkref.map((s, idx) => (
            <div key={s.id} className="relative">
              {/* Timeline connector */}
              {idx < sortedSkref.length - 1 && (
                <div className="absolute left-[18px] top-[56px] bottom-[-12px] w-px bg-white/10" />
              )}

              <div className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-3 shrink-0">
                  <div
                    className="w-[10px] h-[10px] rounded-full border-2"
                    style={{ borderColor: ADGERD_COLORS[s.adgerd], backgroundColor: ADGERD_COLORS[s.adgerd] + '30' }}
                  />
                </div>

                {/* Step content */}
                <div className="flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white/50">Skref {idx + 1}</span>
                    {skref.length > 1 && (
                      <button
                        onClick={() => removeSkref(s.id)}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">Dagar fyrir þjónustu</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={s.dagarFyrir}
                        onChange={(e) => updateSkref(s.id, { dagarFyrir: parseInt(e.target.value) || 1 })}
                        className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">Aðgerð</label>
                      <select
                        value={s.adgerd}
                        onChange={(e) => updateSkref(s.id, { adgerd: e.target.value as SendingType })}
                        className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      >
                        <option value="innri">Innri áminning</option>
                        <option value="email">Tölvupóstur</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-white/40 block mb-1">
                      Skilaboðasniðmát
                      <span className="text-white/25 ml-1">{'(notaðu {{bil}}, {{numer}}, {{tegund}}, {{fyrirtaeki}}, {{dags_thjonustu}})'}</span>
                    </label>
                    <textarea
                      value={s.skilabodSnidmat}
                      onChange={(e) => updateSkref(s.id, { skilabodSnidmat: e.target.value })}
                      rows={2}
                      placeholder="Skilaboð sem verða send sjálfkrafa..."
                      className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* End marker */}
          <div className="flex gap-3 pl-[13px]">
            <div className="w-[10px] h-[10px] rounded-full bg-green-500/30 border-2 border-green-500 mt-1" />
            <span className="text-xs text-green-400 font-medium">Þjónustudagur</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          Til baka
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {workflow ? 'Vista breytingar' : 'Stofna ferli'}
        </button>
      </div>
    </div>
  );
}

/* ─── Sending Modal ───────────────────────────────────────────────────────── */

function SendingModal({
  aminning,
  bill,
  fyrirtaeki,
  onClose,
  onSend,
}: {
  aminning: Thjonustuaminning;
  bill: Bill | undefined;
  fyrirtaeki: Fyrirtaeki | null;
  onClose: () => void;
  onSend: (aminningId: string, tegund: SendingType, motttakandi: string, skilabod: string) => void;
}) {
  const [tegund, setTegund] = useState<SendingType>('email');
  const [sending, setSending] = useState(false);

  const tengilidur = fyrirtaeki?.tengiliðir.find(t => t.aðaltengiliður) ?? fyrirtaeki?.tengiliðir[0];

  const defaultMessages: Record<SendingType, string> = {
    email: `Góðan daginn${tengilidur ? ` ${tengilidur.nafn.split(' ')[0]}` : ''},\n\nVið viljum minna á að ${bill?.tegund ?? 'bíll'} (${bill?.numer ?? ''}) á að fara í ${aminning.tegund} þann ${formatDate(aminning.dagsThjonustu)}.\n\nVinsamlegast hafið samband til að staðfesta tíma.\n\nKveðja,\nEnterprise Leiga`,
    sms: `Enterprise Leiga: Áminning - ${bill?.tegund ?? 'Bíll'} (${bill?.numer ?? ''}) á í ${aminning.tegund} ${formatDate(aminning.dagsThjonustu)}. Hafðu samband til að staðfesta.`,
    innri: `Þjónustuáminning: ${bill?.tegund ?? 'Bíll'} (${bill?.numer ?? ''}) hjá ${fyrirtaeki?.nafn ?? 'enginn leigjandi'} á í ${aminning.tegund} ${formatDate(aminning.dagsThjonustu)}. Vinsamlegast fylgist með.`,
  };

  const [skilabod, setSkilabod] = useState(defaultMessages.email);

  function handleTegundChange(t: SendingType) {
    setTegund(t);
    setSkilabod(defaultMessages[t]);
  }

  const motttakandi = tegund === 'email'
    ? tengilidur?.netfang ?? 'Enginn tengiliður'
    : tegund === 'sms'
      ? tengilidur?.simi ?? 'Enginn símanúmer'
      : 'Þjónustudeild';

  async function handleSend() {
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    onSend(aminning.id, tegund, motttakandi, skilabod);
    setSending(false);
  }

  const TYPES: { key: SendingType; label: string; icon: string; color: string; desc: string }[] = [
    {
      key: 'email',
      label: 'Tölvupóstur',
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: '#3b82f6',
      desc: 'Senda tölvupóst á tengilið viðskiptavinar',
    },
    {
      key: 'sms',
      label: 'SMS',
      icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
      color: '#22c55e',
      desc: 'Senda SMS á símanúmer tengiliðar',
    },
    {
      key: 'innri',
      label: 'Innri áminning',
      icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      color: '#f59e0b',
      desc: 'Senda áminningu á starfsmann (tölvupóstur + forsíðuyfirlit)',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mb-12 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Senda áminningu</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {bill?.tegund ?? 'Bíll'} ({bill?.numer}) — {fyrirtaeki?.nafn ?? 'Enginn leigjandi'}
              </p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              {TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTegundChange(t.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    tegund === t.key
                      ? 'border-white/20 bg-white/[0.03]'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: t.color + '20' }}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke={t.color} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{t.label}</div>
                    <div className="text-[11px] text-white/40">{t.desc}</div>
                  </div>
                  {tegund === t.key && (
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={t.color} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-white/50 block mb-1.5">Móttakandi</label>
              <div className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80">
                {motttakandi}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/50 block mb-1.5">Skilaboð</label>
              <textarea
                value={skilabod}
                onChange={(e) => setSkilabod(e.target.value)}
                rows={6}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Hætta við
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !skilabod.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sendi...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Senda
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
