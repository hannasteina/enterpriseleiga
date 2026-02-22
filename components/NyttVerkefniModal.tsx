'use client';

import { useState, useEffect, useRef } from 'react';
import {
  type Verkefni,
  type Forgangur,
  fyrirtaeki as allFyrirtaeki,
  bilar as allBilar,
  samningar as allSamningar,
  getVirkirNotendur,
} from '@/lib/enterprise-demo-data';
import { useEnterpriseTheme } from '@/components/enterprise-theme-provider';
import type { VerkefniStore } from '@/lib/verkefni-store';

type Deild = Verkefni['deild'];
type Status = Verkefni['status'];

interface Props {
  store: VerkefniStore;
  currentUser: string;
  onClose: () => void;
  onCreated: (v: Verkefni) => void;
}

export default function NyttVerkefniModal({ store, currentUser, onClose, onCreated }: Props) {
  const { theme } = useEnterpriseTheme();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const virkirNotendur = getVirkirNotendur();

  const [titill, setTitill] = useState('');
  const [lysing, setLysing] = useState('');
  const [deild, setDeild] = useState<Deild>('langtímaleiga');
  const [status, setStatus] = useState<Status>('opið');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [forgangur, setForgangur] = useState<Forgangur>('venjulegt');
  const [abyrgdaradili, setAbyrgdaradili] = useState(currentUser);
  const [fyrirtaekiId, setFyrirtaekiId] = useState('');
  const [billId, setBillId] = useState('');
  const [samningurId, setSamningurId] = useState('');
  const [error, setError] = useState('');

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!titill.trim()) {
      setError('Titill er nauðsynlegur');
      return;
    }
    if (!lysing.trim()) {
      setError('Lýsing er nauðsynleg');
      return;
    }

    const newV = store.addVerkefni({
      titill: titill.trim(),
      lýsing: lysing.trim(),
      deild,
      status,
      forgangur,
      abyrgdaradili,
      stofnadAf: currentUser || abyrgdaradili,
      dagsetning: new Date().toISOString().split('T')[0],
      deadline: new Date().toISOString().split('T')[0],
      sjálfvirkt: false,
      athugasemdir: [],
      ...(fyrirtaekiId ? { fyrirtaekiId } : {}),
      ...(billId ? { billId } : {}),
      ...(samningurId ? { samningurId } : {}),
    });

    onCreated(newV);
    handleClose();
  }

  const selectStyle = theme === 'light' ? { color: '#1a1f1c', backgroundColor: '#f9faf6' } : undefined;

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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Nýtt verkefni</h2>
            <button
              onClick={handleClose}
              className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Titill */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-1.5">
              Titill <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={titill}
              onChange={(e) => setTitill(e.target.value)}
              placeholder="T.d. Samningur rennur út..."
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>

          {/* Lýsing */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-1.5">
              Lýsing <span className="text-red-400">*</span>
            </label>
            <textarea
              value={lysing}
              onChange={(e) => setLysing(e.target.value)}
              placeholder="Stutt lýsing á verkefninu..."
              rows={3}
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Deild + Staða + Forgangur */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">
                Deild <span className="text-red-400">*</span>
              </label>
              <select
                value={deild}
                onChange={(e) => setDeild(e.target.value as Deild)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
              >
                <option value="langtímaleiga" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Langtímaleiga</option>
                <option value="flotaleiga" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Flotaleiga</option>
                <option value="þjónusta" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Þjónusta</option>
                <option value="sala" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Sala</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Staða</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
              >
                <option value="opið" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Stofnuð</option>
                <option value="í gangi" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Í gangi</option>
                <option value="lokið" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Lokið</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Forgangur</label>
              <select
                value={forgangur}
                onChange={(e) => setForgangur(e.target.value as Forgangur)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
              >
                <option value="brýnt" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Brýnt</option>
                <option value="hátt" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Hátt</option>
                <option value="venjulegt" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Venjulegt</option>
                <option value="lágt" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>Lágt</option>
              </select>
            </div>
          </div>

          {/* Ábyrgðaraðili */}
          <div>
            <label className="text-xs font-medium text-white/40 block mb-1.5">
              Ábyrgðaraðili <span className="text-red-400">*</span>
            </label>
            <select
              value={abyrgdaradili}
              onChange={(e) => setAbyrgdaradili(e.target.value)}
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
            >
              {virkirNotendur.map((n) => (
                <option key={n.id} value={n.nafn.split(' ')[0]} style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>
                  {n.nafn}
                </option>
              ))}
            </select>
          </div>

          {/* Tengingar (valfrjálst) */}
          <div className="pt-2 border-t border-white/5">
            <label className="text-xs font-medium text-white/40 block mb-3">
              Tengingar <span className="text-white/20">(valfrjálst)</span>
            </label>

            <div className="space-y-4">
              {/* Fyrirtæki */}
              <div>
                <label className="text-[11px] text-white/30 block mb-1">Fyrirtæki</label>
                <select
                  value={fyrirtaekiId}
                  onChange={(e) => setFyrirtaekiId(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
                >
                  <option value="" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>-- Ekkert --</option>
                  {allFyrirtaeki.map((f) => (
                    <option key={f.id} value={f.id} style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>{f.nafn}</option>
                  ))}
                </select>
              </div>

              {/* Bíll */}
              <div>
                <label className="text-[11px] text-white/30 block mb-1">Bíll</label>
                <select
                  value={billId}
                  onChange={(e) => setBillId(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
                >
                  <option value="" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>-- Enginn --</option>
                  {allBilar.map((b) => (
                    <option key={b.id} value={b.id} style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>
                      {b.numer} – {b.tegund}
                    </option>
                  ))}
                </select>
              </div>

              {/* Samningur */}
              <div>
                <label className="text-[11px] text-white/30 block mb-1">Samningur</label>
                <select
                  value={samningurId}
                  onChange={(e) => setSamningurId(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={theme === 'light' ? { ...selectStyle, colorScheme: 'light' } : { colorScheme: 'dark' }}
                >
                  <option value="" style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>-- Enginn --</option>
                  {allSamningar.map((s) => (
                    <option key={s.id} value={s.id} style={theme === 'light' ? selectStyle : { background: '#1a1d2e', color: '#ffffff' }}>
                      {s.id} – {s.bilategund} ({s.bilanumer})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Stofna verkefni
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-white/5 text-white/60 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
            >
              Hætta við
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
