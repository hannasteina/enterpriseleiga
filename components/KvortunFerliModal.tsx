'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getFyrirtaeki,
  getBill,
  getVirkirNotendur,
  getKvortunFerill,
  kvortunFerillar,
  KVORTUN_SKREF_NOFN,
  kvortunFlokkurLabels,
  kvortunAlvarleikiLabels,
  kvortunBaeturTegundLabels,
  type Mal,
  type KvortunFerill,
  type KvortunSamskipti,
  type KvortunBaetur,
  type KvortunGreining,
  type KvortunAnaegjumat,
  type KvortunFlokkur,
  type KvortunAlvarleiki,
  type KvortunBaeturTegund,
} from '@/lib/enterprise-demo-data';

type Tab = 'yfirlit' | 'samskipti' | 'greining' | 'urlausn' | 'eftirfylgni';

interface Props {
  mal: Mal;
  onClose: () => void;
  onMalUpdate?: (mal: Mal) => void;
}

function formatDateTime(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' kl. ' + date.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(d: string): string {
  return new Date(d).toLocaleDateString('is-IS', { day: 'numeric', month: 'short' });
}

const samskiptiTegundIcons: Record<string, { icon: string; color: string; label: string }> = {
  'símtal': {
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    color: '#22c55e',
    label: 'Símtal',
  },
  'tölvupóstur': {
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
    color: '#3b82f6',
    label: 'Tölvupóstur',
  },
  'fundur': {
    icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    color: '#8b5cf6',
    label: 'Fundur',
  },
  'innri athugasemd': {
    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    color: '#f59e0b',
    label: 'Innri athugasemd',
  },
};

export default function KvortunFerliModal({ mal, onClose, onMalUpdate }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [activeTab, setActiveTab] = useState<Tab>('yfirlit');

  const existingFerill = getKvortunFerill(mal.id);
  const [ferill, setFerill] = useState<KvortunFerill>(() => {
    if (existingFerill) return JSON.parse(JSON.stringify(existingFerill));
    return {
      malId: mal.id,
      skref: KVORTUN_SKREF_NOFN.map((nafn, i) => ({
        id: `ks-new-${i}`,
        nafn,
        lysing: '',
        status: i === 0 ? 'í gangi' as const : 'bíður' as const,
        dagsetning: i === 0 ? new Date().toISOString().split('T')[0] : undefined,
        notandi: i === 0 ? 'Sigurður' : undefined,
      })),
      samskipti: [],
      baetur: [],
    };
  });

  const [showAddSamskipti, setShowAddSamskipti] = useState(false);
  const [showAddBaetur, setShowAddBaetur] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fyrirtaeki = getFyrirtaeki(mal.fyrirtaekiId);
  const bill = mal.billId ? getBill(mal.billId) : undefined;
  const currentStepIndex = ferill.skref.findIndex(s => s.status === 'í gangi');
  const completedSteps = ferill.skref.filter(s => s.status === 'lokið').length;
  const progressPercent = (completedSteps / ferill.skref.length) * 100;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

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

  function advanceStep() {
    setFerill(prev => {
      const next = { ...prev, skref: [...prev.skref] };
      const currentIdx = next.skref.findIndex(s => s.status === 'í gangi');
      if (currentIdx >= 0) {
        next.skref[currentIdx] = {
          ...next.skref[currentIdx],
          status: 'lokið',
          dagsetning: next.skref[currentIdx].dagsetning || new Date().toISOString().split('T')[0],
          notandi: next.skref[currentIdx].notandi || 'Sigurður',
        };
        if (currentIdx + 1 < next.skref.length) {
          next.skref[currentIdx + 1] = {
            ...next.skref[currentIdx + 1],
            status: 'í gangi',
            dagsetning: new Date().toISOString().split('T')[0],
          };
        }
      }
      return next;
    });
    showToast('Skref lokið');
  }

  function addSamskipti(s: Omit<KvortunSamskipti, 'id'>) {
    setFerill(prev => ({
      ...prev,
      samskipti: [...prev.samskipti, { ...s, id: `kss-${Date.now()}` }],
    }));
    setShowAddSamskipti(false);
    showToast('Samskipti skráð');
  }

  function addBaetur(b: Omit<KvortunBaetur, 'id'>) {
    setFerill(prev => ({
      ...prev,
      baetur: [...prev.baetur, { ...b, id: `kb-${Date.now()}` }],
    }));
    setShowAddBaetur(false);
    showToast('Bætur skráðar');
  }

  function updateGreining(g: KvortunGreining) {
    setFerill(prev => ({ ...prev, greining: g }));
    showToast('Greining vistuð');
  }

  function updateAnaegjumat(a: KvortunAnaegjumat) {
    setFerill(prev => ({ ...prev, anaegjumat: a }));
    showToast('Ánægjumat vistað');
  }

  function saveFerill() {
    const existingIdx = kvortunFerillar.findIndex(k => k.malId === mal.id);
    if (existingIdx >= 0) {
      kvortunFerillar[existingIdx] = ferill;
    } else {
      kvortunFerillar.push(ferill);
    }

    const allDone = ferill.skref.every(s => s.status === 'lokið');
    if (allDone && onMalUpdate) {
      onMalUpdate({ ...mal, status: 'lokað', sidastUppfaert: new Date().toISOString().split('T')[0] });
    }
    showToast('Kvörtunarferli vistað');
  }

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'yfirlit', label: 'Yfirlit', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
    { id: 'samskipti', label: 'Samskipti', icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155', badge: ferill.samskipti.length },
    { id: 'greining', label: 'Greining', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
    { id: 'urlausn', label: 'Úrlausn & Bætur', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z', badge: ferill.baetur.length },
    { id: 'eftirfylgni', label: 'Eftirfylgni', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
  ];

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-200 ${isVisible ? 'bg-black/60' : 'bg-black/0'}`}
    >
      <div className={`w-full max-w-3xl h-full overflow-y-auto bg-[#0f1117] border-l border-white/10 shadow-2xl transition-transform duration-200 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f1117]/95 backdrop-blur-sm border-b border-white/5">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Kvörtunarferli</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400">
                      Kvörtun
                    </span>
                  </div>
                  <p className="text-sm text-white/40 mt-0.5">{mal.titill}</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Customer + Vehicle info bar */}
            <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
              {fyrirtaeki && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                  {fyrirtaeki.nafn}
                </span>
              )}
              {bill && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  {bill.tegund} ({bill.numer})
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {mal.abyrgdaraðili}
              </span>
            </div>

            {/* Progress stepper */}
            <div className="relative">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    background: progressPercent === 100 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #f59e0b, #8b5cf6)',
                  }}
                />
              </div>
              <div className="flex justify-between">
                {ferill.skref.map((skref, i) => {
                  const isDone = skref.status === 'lokið';
                  const isActive = skref.status === 'í gangi';
                  return (
                    <div key={skref.id} className="flex flex-col items-center group" style={{ width: `${100 / ferill.skref.length}%` }}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        isDone ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                        isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20' :
                        'bg-white/5 text-white/30 border border-white/10'
                      }`}>
                        {isDone ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-[10px] mt-1.5 text-center leading-tight transition-colors ${
                        isDone ? 'text-amber-400/80' :
                        isActive ? 'text-blue-400 font-medium' :
                        'text-white/25'
                      }`}>
                        {skref.nafn}
                      </span>
                      {skref.dagsetning && (
                        <span className="text-[9px] text-white/20 mt-0.5">{formatDateShort(skref.dagsetning)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex px-6 gap-1 border-t border-white/5 pt-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="text-[9px] bg-white/10 text-white/50 px-1.5 rounded-full min-w-[16px] text-center">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-5">
          {activeTab === 'yfirlit' && (
            <YfirlitTab
              mal={mal}
              ferill={ferill}
              fyrirtaeki={fyrirtaeki}
              bill={bill}
              currentStepIndex={currentStepIndex}
              onAdvanceStep={advanceStep}
            />
          )}
          {activeTab === 'samskipti' && (
            <SamskiptiTab
              samskipti={ferill.samskipti}
              showAdd={showAddSamskipti}
              onToggleAdd={() => setShowAddSamskipti(!showAddSamskipti)}
              onAdd={addSamskipti}
            />
          )}
          {activeTab === 'greining' && (
            <GreiningTab greining={ferill.greining} onSave={updateGreining} />
          )}
          {activeTab === 'urlausn' && (
            <UrlausnTab
              baetur={ferill.baetur}
              showAdd={showAddBaetur}
              onToggleAdd={() => setShowAddBaetur(!showAddBaetur)}
              onAdd={addBaetur}
            />
          )}
          {activeTab === 'eftirfylgni' && (
            <EftirfylgniTab anaegjumat={ferill.anaegjumat} onSave={updateAnaegjumat} />
          )}
        </div>

        {/* Bottom action bar */}
        <div className="sticky bottom-0 bg-[#0f1117]/95 backdrop-blur-sm border-t border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {completedSteps}/{ferill.skref.length} skref lokið
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Loka
            </button>
            <button
              onClick={saveFerill}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
              </svg>
              Vista ferli
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1a1d2e] border border-white/10 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── Yfirlit Tab ─── */

function YfirlitTab({
  mal, ferill, fyrirtaeki, bill, currentStepIndex, onAdvanceStep,
}: {
  mal: Mal;
  ferill: KvortunFerill;
  fyrirtaeki: ReturnType<typeof getFyrirtaeki>;
  bill: ReturnType<typeof getBill>;
  currentStepIndex: number;
  onAdvanceStep: () => void;
}) {
  const currentStep = currentStepIndex >= 0 ? ferill.skref[currentStepIndex] : null;
  const allDone = ferill.skref.every(s => s.status === 'lokið');

  return (
    <div className="space-y-5">
      {/* Current step card */}
      {currentStep && !allDone && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                {currentStepIndex + 1}
              </div>
              <h3 className="text-sm font-semibold text-white">Núverandi skref: {currentStep.nafn}</h3>
            </div>
            <button
              onClick={onAdvanceStep}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Klára skref
            </button>
          </div>
          <p className="text-xs text-white/50">
            {currentStep.nafn === 'Móttaka' && 'Staðfestu móttöku kvörtunarinnar. Viðurkenndu vandamálið og sendu viðskiptavini staðfestingu.'}
            {currentStep.nafn === 'Flokkun' && 'Flokkaðu kvörtunina eftir tegund og alvarleika. Mettu forgangsröðun.'}
            {currentStep.nafn === 'Rannsókn' && 'Kannaðu orsök vandamálsins. Safnaðu upplýsingum og greindu rót vandans.'}
            {currentStep.nafn === 'Úrlausn' && 'Leystu vandamálið. Framkvæmdu úrbætur og tilkynntu viðskiptavini.'}
            {currentStep.nafn === 'Bætur' && 'Bjóddu viðeigandi bætur ef við á. Afslátt, þjónustu eða annað.'}
            {currentStep.nafn === 'Eftirfylgni' && 'Fylgdu eftir og mettu ánægju viðskiptavinar. Lokaðu málinu.'}
          </p>
        </div>
      )}

      {allDone && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-amber-400 mb-1">Kvörtunarferli lokið</h3>
          <p className="text-xs text-white/40">Öll skref hafa verið kláruð</p>
        </div>
      )}

      {/* Step details - what was done in each step */}
      {ferill.skref.some(s => s.status !== 'bíður') && (
        <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Hvað var gert í hverju skrefi</h3>
          <div className="space-y-3">
            {ferill.skref.map((skref, i) => {
              const isDone = skref.status === 'lokið';
              const isActive = skref.status === 'í gangi';
              if (skref.status === 'bíður') return null;

              const stepDescriptions: Record<string, string> = {
                'Móttaka': 'Kvörtun móttekin og staðfest við viðskiptavin',
                'Flokkun': 'Kvörtun flokkuð eftir tegund og alvarleika',
                'Rannsókn': 'Orsök vandamáls rannsökuð og greind',
                'Úrlausn': 'Vandamál leyst og úrbætur framkvæmdar',
                'Bætur': 'Bætur metnar og boðnar viðskiptavini',
                'Eftirfylgni': 'Ánægja viðskiptavinar metin og máli lokað',
              };

              return (
                <div
                  key={skref.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isDone
                      ? 'border-amber-500/15 bg-amber-500/[0.03]'
                      : 'border-blue-500/20 bg-blue-500/[0.05]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isDone ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${isDone ? 'text-white' : 'text-blue-400'}`}>
                          {skref.nafn}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          isDone ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {isDone ? 'Lokið' : 'Í gangi'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {skref.lysing || stepDescriptions[skref.nafn] || (isActive ? 'Skref í vinnslu...' : '')}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-white/30">
                        {skref.notandi && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            {skref.notandi}
                          </span>
                        )}
                        {skref.dagsetning && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            {formatDateShort(skref.dagsetning)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Case details */}
      <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Upplýsingar um kvörtun</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-white/30 block mb-0.5">Viðskiptavinur</span>
              <span className="text-sm text-white">{fyrirtaeki?.nafn ?? '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/30 block mb-0.5">Bíll / Tæki</span>
              <span className="text-sm text-white">{bill ? `${bill.tegund} (${bill.numer})` : '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/30 block mb-0.5">Ábyrgðaraðili</span>
              <span className="text-sm text-white">{mal.abyrgdaraðili}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/30 block mb-0.5">Skráð</span>
              <span className="text-sm text-white">{formatDateShort(mal.stofnad)}</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-white/30 block mb-0.5">Lýsing</span>
            <p className="text-sm text-white/80 leading-relaxed">{mal.lýsing}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Tímalína</h3>
        <div className="space-y-0">
          {ferill.skref.map((skref, i) => {
            const isDone = skref.status === 'lokið';
            const isActive = skref.status === 'í gangi';
            const isLast = i === ferill.skref.length - 1;
            return (
              <div key={skref.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-amber-500' : isActive ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-white/5 border border-white/10'
                  }`}>
                    {isDone ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    ) : null}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 h-8 my-1 ${isDone ? 'bg-amber-500/30' : 'bg-white/5'}`} />
                  )}
                </div>
                <div className={`pb-4 ${isLast ? '' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDone ? 'text-white' : isActive ? 'text-blue-400' : 'text-white/30'}`}>
                      {skref.nafn}
                    </span>
                    {skref.notandi && (
                      <span className="text-[10px] text-white/30">— {skref.notandi}</span>
                    )}
                  </div>
                  {skref.dagsetning && (
                    <span className="text-[11px] text-white/25 block">{formatDateShort(skref.dagsetning)}</span>
                  )}
                  {skref.lysing && (
                    <p className="text-xs text-white/40 mt-0.5">{skref.lysing}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#161822] rounded-xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{ferill.samskipti.length}</div>
          <div className="text-[11px] text-white/30 mt-1">Samskipti</div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{ferill.baetur.length}</div>
          <div className="text-[11px] text-white/30 mt-1">Bætur</div>
        </div>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: ferill.anaegjumat ? '#f59e0b' : '#6b7280' }}>
            {ferill.anaegjumat ? `${ferill.anaegjumat.einkunn}/5` : '—'}
          </div>
          <div className="text-[11px] text-white/30 mt-1">Ánægja</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Samskipti Tab ─── */

function SamskiptiTab({
  samskipti, showAdd, onToggleAdd, onAdd,
}: {
  samskipti: KvortunSamskipti[];
  showAdd: boolean;
  onToggleAdd: () => void;
  onAdd: (s: Omit<KvortunSamskipti, 'id'>) => void;
}) {
  const [tegund, setTegund] = useState<KvortunSamskipti['tegund']>('símtal');
  const [titill, setTitill] = useState('');
  const [lysing, setLysing] = useState('');
  const [stefna, setStefna] = useState<KvortunSamskipti['stefna']>('út');
  const notendur = getVirkirNotendur();
  const [notandi, setNotandi] = useState(notendur[0]?.nafn.split(' ')[0] ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titill.trim() || !lysing.trim()) return;
    onAdd({
      tegund,
      titill: titill.trim(),
      lysing: lysing.trim(),
      dagsetning: new Date().toISOString(),
      notandi,
      stefna,
    });
    setTitill('');
    setLysing('');
  }

  const sorted = [...samskipti].sort((a, b) => b.dagsetning.localeCompare(a.dagsetning));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Samskiptasaga</h3>
        <button
          onClick={onToggleAdd}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Skrá samskipti
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Tegund</label>
              <select value={tegund} onChange={e => setTegund(e.target.value as KvortunSamskipti['tegund'])}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}>
                <option value="símtal">Símtal</option>
                <option value="tölvupóstur">Tölvupóstur</option>
                <option value="fundur">Fundur</option>
                <option value="innri athugasemd">Innri athugasemd</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Stefna</label>
              <select value={stefna} onChange={e => setStefna(e.target.value as KvortunSamskipti['stefna'])}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}>
                <option value="inn">Á móti okkur (inn)</option>
                <option value="út">Frá okkur (út)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Notandi</label>
              <select value={notandi} onChange={e => setNotandi(e.target.value)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}>
                {notendur.map(n => (
                  <option key={n.id} value={n.nafn.split(' ')[0]}>{n.nafn}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Titill</label>
            <input type="text" value={titill} onChange={e => setTitill(e.target.value)} placeholder="T.d. Hringt í viðskiptavin"
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Lýsing</label>
            <textarea value={lysing} onChange={e => setLysing(e.target.value)} placeholder="Hvað var rætt / gert..."
              rows={3}
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onToggleAdd} className="px-3 py-1.5 text-xs text-white/40 hover:text-white bg-white/5 rounded-lg transition-colors">Hætta við</button>
            <button type="submit" disabled={!titill.trim() || !lysing.trim()} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors">Vista</button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !showAdd && (
        <div className="text-center py-12">
          <svg className="w-10 h-10 text-white/10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <p className="text-xs text-white/30">Engin samskipti skráð ennþá</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(s => {
          const info = samskiptiTegundIcons[s.tegund];
          return (
            <div key={s.id} className="bg-[#161822] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: info.color + '15' }}>
                  <svg className="w-4 h-4" style={{ color: info.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={info.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{s.titill}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      s.stefna === 'inn' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {s.stefna === 'inn' ? '← Inn' : '→ Út'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-2">{s.lysing}</p>
                  <div className="flex items-center gap-3 text-[11px] text-white/25">
                    <span className="flex items-center gap-1">
                      <span style={{ color: info.color }}>{info.label}</span>
                    </span>
                    <span>{s.notandi}</span>
                    <span>{formatDateTime(s.dagsetning)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Greining Tab ─── */

function GreiningTab({ greining, onSave }: { greining?: KvortunGreining; onSave: (g: KvortunGreining) => void }) {
  const [flokkur, setFlokkur] = useState<KvortunFlokkur>(greining?.flokkur ?? 'þjónusta');
  const [orsok, setOrsok] = useState(greining?.orsok ?? '');
  const [alvarleiki, setAlvarleiki] = useState<KvortunAlvarleiki>(greining?.alvarleiki ?? 'miðlungs');
  const [ahrif, setAhrif] = useState(greining?.ahrif ?? '');
  const [forvarnaradgerdir, setForvarnaradgerdir] = useState(greining?.forvarnaradgerdir ?? '');

  function handleSave() {
    onSave({ flokkur, orsok, alvarleiki, ahrif, forvarnaradgerdir });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Orsakagreining</h3>
        {greining && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Greining lokið</span>
        )}
      </div>

      <div className="bg-[#161822] rounded-xl border border-white/5 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Flokkur kvörtunar</label>
            <select value={flokkur} onChange={e => setFlokkur(e.target.value as KvortunFlokkur)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ colorScheme: 'dark' }}>
              {Object.entries(kvortunFlokkurLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Alvarleiki</label>
            <select value={alvarleiki} onChange={e => setAlvarleiki(e.target.value as KvortunAlvarleiki)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ colorScheme: 'dark' }}>
              {Object.entries(kvortunAlvarleikiLabels).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Severity indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/30">Alvarleiki:</span>
          {(['lágur', 'miðlungs', 'hár', 'alvarlegt'] as KvortunAlvarleiki[]).map(a => (
            <div key={a} className={`h-2 flex-1 rounded-full transition-all ${
              (['lágur', 'miðlungs', 'hár', 'alvarlegt'].indexOf(a) <= ['lágur', 'miðlungs', 'hár', 'alvarlegt'].indexOf(alvarleiki))
                ? '' : 'opacity-20'
            }`} style={{ backgroundColor: kvortunAlvarleikiLabels[a].color }} />
          ))}
        </div>

        <div>
          <label className="text-[11px] text-white/40 block mb-1.5">Orsök vandamáls</label>
          <textarea value={orsok} onChange={e => setOrsok(e.target.value)}
            placeholder="Hvað olli kvörtuninni? Greindu rót vandans..."
            rows={3}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
        </div>

        <div>
          <label className="text-[11px] text-white/40 block mb-1.5">Áhrif á viðskiptavin</label>
          <textarea value={ahrif} onChange={e => setAhrif(e.target.value)}
            placeholder="Hver voru áhrifin á viðskiptavininn?"
            rows={2}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
        </div>

        <div>
          <label className="text-[11px] text-white/40 block mb-1.5">Forvarnaraðgerðir</label>
          <textarea value={forvarnaradgerdir} onChange={e => setForvarnaradgerdir(e.target.value)}
            placeholder="Hvernig getum við komið í veg fyrir að þetta endurtaki sig?"
            rows={2}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
        </div>

        <button onClick={handleSave}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
          Vista greiningu
        </button>
      </div>
    </div>
  );
}

/* ─── Úrlausn & Bætur Tab ─── */

function UrlausnTab({
  baetur, showAdd, onToggleAdd, onAdd,
}: {
  baetur: KvortunBaetur[];
  showAdd: boolean;
  onToggleAdd: () => void;
  onAdd: (b: Omit<KvortunBaetur, 'id'>) => void;
}) {
  const [tegund, setTegund] = useState<KvortunBaeturTegund>('afsláttur');
  const [lysing, setLysing] = useState('');
  const [verdmaeti, setVerdmaeti] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lysing.trim()) return;
    onAdd({
      tegund,
      lysing: lysing.trim(),
      verdmaeti: verdmaeti ? Number(verdmaeti) : undefined,
      samthykkt: false,
      dagsetning: new Date().toISOString().split('T')[0],
    });
    setLysing('');
    setVerdmaeti('');
  }

  const heildarBaetur = baetur.reduce((sum, b) => sum + (b.verdmaeti || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Bætur og úrlausn</h3>
        <button onClick={onToggleAdd}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Bæta við bótum
        </button>
      </div>

      {/* CRM guidance card */}
      <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/15 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-purple-400 mb-1">CRM ráðgjöf</h4>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Rannsakanir sýna að viðskiptavinur sem fær góða meðhöndlun á kvörtun verður oft tryggari en viðskiptavinur sem aldrei kvartaði.
              Bjóddu sanngjarnar bætur miðað við alvarleika og áhrif vandamálsins.
            </p>
          </div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Tegund bóta</label>
              <select value={tegund} onChange={e => setTegund(e.target.value as KvortunBaeturTegund)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}>
                {Object.entries(kvortunBaeturTegundLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/40 block mb-1">Verðmæti (kr.)</label>
              <input type="number" value={verdmaeti} onChange={e => setVerdmaeti(e.target.value)} placeholder="0"
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Lýsing</label>
            <textarea value={lysing} onChange={e => setLysing(e.target.value)} placeholder="Lýstu bótunum..."
              rows={2}
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onToggleAdd} className="px-3 py-1.5 text-xs text-white/40 hover:text-white bg-white/5 rounded-lg transition-colors">Hætta við</button>
            <button type="submit" disabled={!lysing.trim()} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors">Vista</button>
          </div>
        </form>
      )}

      {baetur.length === 0 && !showAdd && (
        <div className="text-center py-12">
          <svg className="w-10 h-10 text-white/10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-xs text-white/30">Engar bætur skráðar ennþá</p>
        </div>
      )}

      {baetur.length > 0 && (
        <>
          <div className="space-y-3">
            {baetur.map(b => (
              <div key={b.id} className="bg-[#161822] rounded-xl border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{kvortunBaeturTegundLabels[b.tegund]}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        b.samthykkt ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {b.samthykkt ? 'Samþykkt' : 'Í bið'}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{b.lysing}</p>
                    <span className="text-[11px] text-white/25 mt-1 block">{formatDateShort(b.dagsetning)}</span>
                  </div>
                  {b.verdmaeti && (
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">{b.verdmaeti.toLocaleString('is-IS')} kr.</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {heildarBaetur > 0 && (
            <div className="bg-[#161822] rounded-xl border border-white/5 p-4 flex items-center justify-between">
              <span className="text-xs text-white/40">Heildarbætur</span>
              <span className="text-lg font-bold text-white">{heildarBaetur.toLocaleString('is-IS')} kr.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Eftirfylgni Tab ─── */

function EftirfylgniTab({ anaegjumat, onSave }: { anaegjumat?: KvortunAnaegjumat; onSave: (a: KvortunAnaegjumat) => void }) {
  const [einkunn, setEinkunn] = useState(anaegjumat?.einkunn ?? 0);
  const [athugasemd, setAthugasemd] = useState(anaegjumat?.athugasemd ?? '');
  const [hoverStar, setHoverStar] = useState(0);

  function handleSave() {
    if (einkunn === 0) return;
    onSave({ einkunn, athugasemd, dagsetning: new Date().toISOString().split('T')[0] });
  }

  const einkunnLabels = ['', 'Mjög óánægð/ur', 'Óánægð/ur', 'Hlutlaus', 'Ánægð/ur', 'Mjög ánægð/ur'];
  const einkunnColors = ['', '#ef4444', '#f59e0b', '#6b7280', '#3b82f6', '#22c55e'];

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-white">Eftirfylgni og ánægjumat</h3>

      <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
        <div className="text-center mb-6">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Hversu ánægð/ur er viðskiptavinurinn?</h4>

          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(star => {
              const isActive = star <= (hoverStar || einkunn);
              const displayStar = hoverStar || einkunn;
              return (
                <button
                  key={star}
                  onClick={() => setEinkunn(star)}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-10 h-10 transition-colors ${isActive ? '' : 'text-white/10'}`}
                    style={isActive ? { color: einkunnColors[displayStar] } : {}}
                    fill={isActive ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              );
            })}
          </div>

          {(hoverStar || einkunn) > 0 && (
            <p className="text-sm font-medium transition-colors" style={{ color: einkunnColors[hoverStar || einkunn] }}>
              {einkunnLabels[hoverStar || einkunn]}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="text-[11px] text-white/40 block mb-1.5">Athugasemd viðskiptavinar</label>
          <textarea value={athugasemd} onChange={e => setAthugasemd(e.target.value)}
            placeholder="Hvað sagði viðskiptavinurinn um úrlausnina?"
            rows={3}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
        </div>

        <button onClick={handleSave} disabled={einkunn === 0}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors">
          Vista ánægjumat
        </button>
      </div>

      {anaegjumat && (
        <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className="w-4 h-4"
                  style={{ color: star <= anaegjumat.einkunn ? einkunnColors[anaegjumat.einkunn] : 'rgba(255,255,255,0.1)' }}
                  fill={star <= anaegjumat.einkunn ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-medium" style={{ color: einkunnColors[anaegjumat.einkunn] }}>
              {einkunnLabels[anaegjumat.einkunn]}
            </span>
            <span className="text-[11px] text-white/25 ml-auto">{formatDateShort(anaegjumat.dagsetning)}</span>
          </div>
          {anaegjumat.athugasemd && (
            <p className="text-xs text-white/50 italic">&quot;{anaegjumat.athugasemd}&quot;</p>
          )}
        </div>
      )}

      {/* Best practices */}
      <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Ráðleggingar fyrir eftirfylgni</h4>
        <div className="space-y-2.5">
          {[
            'Hringdu í viðskiptavin 2-3 dögum eftir úrlausn til að athuga ánægju',
            'Spyrðu hvort eitthvað megi bæta í þjónustunni okkar',
            'Þakkaðu viðskiptavini fyrir endurgjöfina – hún hjálpar okkur að bætast',
            'Skráðu niðurstöðu eftirfylgni og lokaðu málinu formlega',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-400">{i + 1}</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
