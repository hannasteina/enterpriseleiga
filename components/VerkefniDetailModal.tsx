'use client';

import { useState, useEffect, useRef } from 'react';
import {
  type Verkefni,
  type ChecklistItem,
  getFyrirtaeki,
  getBill,
  getSamningur,
  getVirkirNotendur,
  getStatusColor,
  getStatusBg,
} from '@/lib/enterprise-demo-data';
import type { VerkefniStore } from '@/lib/verkefni-store';
import { useEnterpriseTheme } from '@/components/enterprise-theme-provider';

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

const statusOptions: { value: Verkefni['status']; label: string }[] = [
  { value: 'opið', label: 'Opið' },
  { value: 'í gangi', label: 'Í gangi' },
  { value: 'lokið', label: 'Lokið' },
];

interface Props {
  verkefni: Verkefni;
  store: VerkefniStore;
  currentUser: string;
  onClose: () => void;
  onSendNotification: (verkefniId: string, tilNotandaId: string, skilabod: string) => void;
}

export default function VerkefniDetailModal({
  verkefni: initialVerkefni,
  store,
  currentUser,
  onClose,
  onSendNotification,
}: Props) {
  const [newChecklistText, setNewChecklistText] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSent, setNotifSent] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const [assignMessage, setAssignMessage] = useState('');
  const [assignPerson, setAssignPerson] = useState('');
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { theme } = useEnterpriseTheme();

  const v = store.getVerkefniById(initialVerkefni.id) ?? initialVerkefni;

  const fyrirtaeki = v.fyrirtaekiId ? getFyrirtaeki(v.fyrirtaekiId) : null;
  const bill = v.billId ? getBill(v.billId) : null;
  const samningur = v.samningurId ? getSamningur(v.samningurId) : null;
  const virkirNotendur = getVirkirNotendur();

  const checklistDone = v.checklist.filter((c) => c.lokid).length;
  const checklistTotal = v.checklist.length;
  const checklistProgress = checklistTotal > 0 ? (checklistDone / checklistTotal) * 100 : 0;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
        setTimeout(() => onCloseRef.current(), 200);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose();
  }

  function handleAddChecklist() {
    const text = newChecklistText.trim();
    if (!text) return;
    store.addChecklistItem(v.id, text);
    setNewChecklistText('');
  }

  function handleAssign(nafn: string) {
    const oldAssignee = v.abyrgdaradili;
    store.assignVerkefni(v.id, nafn);

    if (nafn !== oldAssignee) {
      const notandi = virkirNotendur.find((n) => n.nafn.startsWith(nafn));
      if (notandi) {
        store.addNotification({
          verkefniId: v.id,
          tilNotandaId: notandi.id,
          fraNafn: currentUser,
          tegund: 'assignment',
          skilabod: `${currentUser} úthlutaði þér verkefnið "${v.titill}"`,
        });
      }
    }
  }

  function handleStatusChange(status: Verkefni['status']) {
    store.updateVerkefniStatus(v.id, status);
  }

  async function handleSendNotification() {
    const notandi = virkirNotendur.find((n) => n.nafn.startsWith(v.abyrgdaradili));
    if (!notandi) return;

    setSendingNotif(true);
    try {
      await onSendNotification(v.id, notandi.id, `Áminning um verkefni: "${v.titill}"`);
      store.addNotification({
        verkefniId: v.id,
        tilNotandaId: notandi.id,
        fraNafn: currentUser,
        tegund: 'aminning',
        skilabod: `${currentUser} sendi þér áminningu um "${v.titill}"`,
      });
      setNotifSent(true);
      setTimeout(() => setNotifSent(false), 3000);
    } catch {
      // handled silently
    } finally {
      setSendingNotif(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      data-enterprise-theme={theme}
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
        <div className="sticky top-0 z-10 bg-[#0f1117] border-b border-white/5 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {v.sjálfvirkt && (
                  <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{
                    backgroundColor: `${deildColors[v.deild]}20`,
                    color: deildColors[v.deild],
                  }}
                >
                  {deildLabels[v.deild]}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{v.titill}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-2">Staða</label>
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    v.status === opt.value
                      ? 'ring-1 ring-offset-1 ring-offset-[#0f1117]'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: getStatusBg(opt.value),
                    color: getStatusColor(opt.value),
                    ...(v.status === opt.value
                      ? { ringColor: getStatusColor(opt.value) }
                      : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lýsing */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-2">Lýsing</label>
            <p className="text-sm text-white/70 leading-relaxed">{v.lýsing}</p>
          </div>

          {/* Tengd gögn */}
          {(fyrirtaeki || bill || samningur) && (
            <div className="bg-[#161822] rounded-xl border border-white/5 p-4 space-y-2">
              <label className="text-xs font-medium text-white/40 block mb-1">Tengd gögn</label>
              {fyrirtaeki && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                  <span className="text-white/50">Fyrirtæki:</span>
                  <span className="text-white/80">{fyrirtaeki.nafn}</span>
                </div>
              )}
              {bill && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.079-.481 1.04-1.099l-.52-8.742A1.125 1.125 0 0019.128 7.5H4.872a1.125 1.125 0 00-1.12 1.009l-.52 8.742c-.04.618.418 1.099 1.04 1.099H6" />
                  </svg>
                  <span className="text-white/50">Bíll:</span>
                  <span className="text-white/80">{bill.numer} – {bill.tegund}</span>
                </div>
              )}
              {samningur && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-white/50">Samningur:</span>
                  <span className="text-white/80">{samningur.id} – {samningur.bilategund}</span>
                </div>
              )}
            </div>
          )}

          {/* Ábyrgðaraðili / Assignment */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-2">Ábyrgðaraðili</label>
            <div className="flex items-center gap-3">
              <select
                value={v.abyrgdaradili}
                onChange={(e) => handleAssign(e.target.value)}
                className="bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                style={theme === 'light' ? { color: '#1a1f1c', backgroundColor: '#f9faf6', colorScheme: 'light' } : { colorScheme: 'dark' }}
              >
                {virkirNotendur.map((n) => (
                  <option
                    key={n.id}
                    value={n.nafn.split(' ')[0]}
                    style={theme === 'light' ? { color: '#1a1f1c', background: '#f9faf6' } : { background: '#1a1d2e', color: '#ffffff' }}
                  >
                    {n.nafn}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSendNotification}
                disabled={sendingNotif}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {sendingNotif ? 'Sendir...' : 'Senda tilkynningu'}
              </button>
            </div>
            {notifSent && (
              <p className="text-xs text-green-400 mt-2">Tilkynning send!</p>
            )}
          </div>

          {/* Tékklisti */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-white/40">
                Tékklisti ({checklistDone}/{checklistTotal})
              </label>
              {checklistTotal > 0 && (
                <span className="text-xs text-white/30">{Math.round(checklistProgress)}%</span>
              )}
            </div>

            {checklistTotal > 0 && (
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-4">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${checklistProgress}%`,
                    backgroundColor: checklistProgress === 100 ? '#22c55e' : '#3b82f6',
                  }}
                />
              </div>
            )}

            <div className="space-y-1">
              {v.checklist.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  verkefniId={v.id}
                  store={store}
                  currentUser={currentUser}
                  virkirNotendur={virkirNotendur}
                  assigningItemId={assigningItemId}
                  setAssigningItemId={setAssigningItemId}
                  assignPerson={assignPerson}
                  setAssignPerson={setAssignPerson}
                  assignMessage={assignMessage}
                  setAssignMessage={setAssignMessage}
                  editingDeadlineId={editingDeadlineId}
                  setEditingDeadlineId={setEditingDeadlineId}
                  theme={theme}
                />
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                placeholder="Bæta við atriði..."
                className="flex-1 bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={handleAddChecklist}
                disabled={!newChecklistText.trim()}
                className="px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Athugasemdir */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-3">Athugasemdir</label>

            {(v.athugasemdir || []).length > 0 && (
              <div className="space-y-3 mb-4">
                {(v.athugasemdir || []).map((ath) => (
                  <div key={ath.id} className="bg-[#161822] rounded-lg border border-white/5 px-4 py-3 group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-400">{ath.hofundur[0]}</span>
                        </div>
                        <span className="text-xs font-medium text-white/70">{ath.hofundur}</span>
                        <span className="text-[10px] text-white/25">
                          {new Date(ath.dagsetning).toLocaleDateString('is-IS', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        onClick={() => store.removeAthugasemd(v.id, ath.id)}
                        className="text-white/0 group-hover:text-white/30 hover:!text-red-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-white/60 whitespace-pre-wrap">{ath.texti}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Skrifa athugasemd..."
                rows={3}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const text = newComment.trim();
                    if (!text) return;
                    store.addAthugasemd(v.id, text, currentUser);
                    setNewComment('');
                  }}
                  disabled={!newComment.trim()}
                  className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors disabled:opacity-30"
                >
                  Senda
                </button>
              </div>
            </div>
          </div>

          {/* Dagsetning */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>
                Stofnað:{' '}
                {new Date(v.dagsetning).toLocaleDateString('is-IS', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              {v.deadline && (
                <>
                  <span className="text-white/10">·</span>
                  <span className={v.deadline < new Date().toISOString().split('T')[0] ? 'text-red-400' : v.deadline === new Date().toISOString().split('T')[0] ? 'text-amber-400' : ''}>
                    Deadline:{' '}
                    {new Date(v.deadline).toLocaleDateString('is-IS', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
  if (diffDays < 0) return `${formatted} (útrunnið)`;
  if (diffDays === 0) return `${formatted} (í dag)`;
  if (diffDays === 1) return `${formatted} (á morgun)`;
  return formatted;
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

interface ChecklistRowProps {
  item: ChecklistItem;
  verkefniId: string;
  store: VerkefniStore;
  currentUser: string;
  virkirNotendur: { id: string; nafn: string }[];
  assigningItemId: string | null;
  setAssigningItemId: (id: string | null) => void;
  assignPerson: string;
  setAssignPerson: (v: string) => void;
  assignMessage: string;
  setAssignMessage: (v: string) => void;
  editingDeadlineId: string | null;
  setEditingDeadlineId: (id: string | null) => void;
  theme: string;
}

function ChecklistRow({
  item,
  verkefniId,
  store,
  currentUser,
  virkirNotendur,
  assigningItemId,
  setAssigningItemId,
  assignPerson,
  setAssignPerson,
  assignMessage,
  setAssignMessage,
  editingDeadlineId,
  setEditingDeadlineId,
  theme,
}: ChecklistRowProps) {
  const isAssigning = assigningItemId === item.id;
  const isEditingDeadline = editingDeadlineId === item.id;

  return (
    <div className="group">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
        <button
          onClick={() => store.toggleChecklistItem(verkefniId, item.id, currentUser)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            item.lokid
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'border-white/20 hover:border-white/40'
          }`}
        >
          {item.lokid && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <span className={`text-sm block ${item.lokid ? 'text-white/30 line-through' : 'text-white/80'}`}>
            {item.texti}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {item.uthlutadA && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                → {item.uthlutadA}
              </span>
            )}
            {item.deadline && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                item.lokid
                  ? 'bg-white/5 text-white/25'
                  : isOverdue(item.deadline)
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-amber-500/15 text-amber-400'
              }`}>
                {formatDeadline(item.deadline)}
              </span>
            )}
            {item.skilabod && (
              <span className="text-[10px] text-white/25 italic truncate max-w-[160px]">
                &quot;{item.skilabod}&quot;
              </span>
            )}
          </div>
        </div>

        {item.lokadAf && (
          <span className="text-[10px] text-white/20 shrink-0">{item.lokadAf}</span>
        )}

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              if (isEditingDeadline) {
                setEditingDeadlineId(null);
              } else {
                setEditingDeadlineId(item.id);
                setAssigningItemId(null);
              }
            }}
            className="p-1 text-white/30 hover:text-amber-400 transition-colors"
            title="Setja frest"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (isAssigning) {
                setAssigningItemId(null);
              } else {
                setAssigningItemId(item.id);
                setEditingDeadlineId(null);
                setAssignPerson(item.uthlutadA || virkirNotendur[0]?.nafn.split(' ')[0] || '');
                setAssignMessage(item.skilabod || '');
              }
            }}
            className="p-1 text-white/30 hover:text-purple-400 transition-colors"
            title="Úthluta"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
          <button
            onClick={() => store.removeChecklistItem(verkefniId, item.id)}
            className="p-1 text-white/30 hover:text-red-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {isEditingDeadline && (
        <div className="ml-11 mr-3 mb-2 p-3 bg-[#161822] rounded-lg border border-white/10 space-y-2">
          <label className="text-[10px] font-medium text-white/40 block">Frestur</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={item.deadline || ''}
              onChange={(e) => {
                store.updateChecklistDeadline(verkefniId, item.id, e.target.value || undefined);
              }}
              className="flex-1 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              style={theme === 'light' ? { colorScheme: 'light' } : { colorScheme: 'dark' }}
            />
            {item.deadline && (
              <button
                onClick={() => {
                  store.updateChecklistDeadline(verkefniId, item.id, undefined);
                }}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Hreinsa
              </button>
            )}
            <button
              onClick={() => setEditingDeadlineId(null)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Loka
            </button>
          </div>
        </div>
      )}

      {isAssigning && (
        <div className="ml-11 mr-3 mb-2 p-3 bg-[#161822] rounded-lg border border-white/10 space-y-2">
          <label className="text-[10px] font-medium text-white/40 block">Úthluta á</label>
          <select
            value={assignPerson}
            onChange={(e) => setAssignPerson(e.target.value)}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            style={theme === 'light' ? { color: '#1a1f1c', backgroundColor: '#f9faf6', colorScheme: 'light' } : { colorScheme: 'dark' }}
          >
            {virkirNotendur.map((n) => (
              <option key={n.id} value={n.nafn.split(' ')[0]} style={theme === 'light' ? { color: '#1a1f1c', background: '#f9faf6' } : { background: '#1a1d2e', color: '#ffffff' }}>
                {n.nafn}
              </option>
            ))}
          </select>
          <textarea
            value={assignMessage}
            onChange={(e) => setAssignMessage(e.target.value)}
            placeholder="Skilaboð (valkvætt)..."
            rows={2}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
          />
          <div className="flex justify-end gap-2">
            {item.uthlutadA && (
              <button
                onClick={() => {
                  store.assignChecklistItem(verkefniId, item.id, undefined, undefined);
                  setAssigningItemId(null);
                }}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1"
              >
                Fjarlægja
              </button>
            )}
            <button
              onClick={() => setAssigningItemId(null)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1"
            >
              Hætta við
            </button>
            <button
              onClick={() => {
                store.assignChecklistItem(verkefniId, item.id, assignPerson, assignMessage.trim() || undefined);
                const notandi = virkirNotendur.find((n) => n.nafn.startsWith(assignPerson));
                if (notandi) {
                  store.addNotification({
                    verkefniId,
                    tilNotandaId: notandi.id,
                    fraNafn: currentUser,
                    tegund: 'assignment',
                    skilabod: `${currentUser} úthlutaði þér: "${item.texti}"${assignMessage.trim() ? ` — ${assignMessage.trim()}` : ''}`,
                  });
                }
                setAssigningItemId(null);
                setAssignMessage('');
              }}
              className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-600/30 transition-colors"
            >
              Senda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
