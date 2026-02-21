'use client';

import { useState, useEffect, useRef } from 'react';
import {
  fyrirtaeki as allFyrirtaeki,
  bilar as allBilar,
  samningar as allSamningar,
  getVirkirNotendur,
  type Mal,
} from '@/lib/enterprise-demo-data';

type MalTegund = Mal['tegund'];
type MalStatus = Mal['status'];
type MalForgangur = Mal['forgangur'];

interface Props {
  mal?: Mal | null;
  onClose: () => void;
  onSave: (mal: Mal) => void;
  onDelete?: (id: string) => void;
}

export default function MalModal({ mal, onClose, onSave, onDelete }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isEdit = !!mal;
  const virkirNotendur = getVirkirNotendur();

  const [titill, setTitill] = useState(mal?.titill ?? '');
  const [lysing, setLysing] = useState(mal?.lýsing ?? '');
  const [tegund, setTegund] = useState<MalTegund>(mal?.tegund ?? 'fyrirspurn');
  const [status, setStatus] = useState<MalStatus>(mal?.status ?? 'opið');
  const [forgangur, setForgangur] = useState<MalForgangur>(mal?.forgangur ?? 'miðlungs');
  const [abyrgdaradili, setAbyrgdaradili] = useState(mal?.abyrgdaraðili ?? virkirNotendur[0]?.nafn.split(' ')[0] ?? '');
  const [fyrirtaekiId, setFyrirtaekiId] = useState(mal?.fyrirtaekiId ?? '');
  const [billId, setBillId] = useState(mal?.billId ?? '');
  const [samningurId, setSamningurId] = useState(mal?.samningurId ?? '');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    if (!fyrirtaekiId) {
      setError('Velja þarf fyrirtæki');
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    const saved: Mal = {
      id: mal?.id ?? `m${Date.now()}`,
      fyrirtaekiId,
      titill: titill.trim(),
      lýsing: lysing.trim(),
      tegund,
      status,
      forgangur,
      stofnad: mal?.stofnad ?? now,
      sidastUppfaert: now,
      abyrgdaraðili: abyrgdaradili,
      ...(billId ? { billId } : {}),
      ...(samningurId ? { samningurId } : {}),
      ...(mal?.fundur ? { fundur: mal.fundur } : {}),
    };

    onSave(saved);
    handleClose();
  }

  function handleDelete() {
    if (mal && onDelete) {
      onDelete(mal.id);
      handleClose();
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
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
            <h2 className="text-lg font-bold text-white">
              {isEdit ? 'Breyta máli' : 'Skrá nýtt mál'}
            </h2>
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
              placeholder="T.d. Dekkjaskipti á Hyundai I30W"
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
              placeholder="Stutt lýsing á málinu..."
              rows={3}
              className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Tegund + Forgangur */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Tegund</label>
              <select
                value={tegund}
                onChange={(e) => setTegund(e.target.value as MalTegund)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="fyrirspurn" style={{ background: '#1a1d2e', color: '#ffffff' }}>Fyrirspurn</option>
                <option value="kvörtun" style={{ background: '#1a1d2e', color: '#ffffff' }}>Kvörtun</option>
                <option value="þjónustubeiðni" style={{ background: '#1a1d2e', color: '#ffffff' }}>Þjónustubeiðni</option>
                <option value="tjón" style={{ background: '#1a1d2e', color: '#ffffff' }}>Tjón</option>
                <option value="breyting á samningi" style={{ background: '#1a1d2e', color: '#ffffff' }}>Breyting á samningi</option>
                <option value="annað" style={{ background: '#1a1d2e', color: '#ffffff' }}>Annað</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Forgangur</label>
              <select
                value={forgangur}
                onChange={(e) => setForgangur(e.target.value as MalForgangur)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="lágur" style={{ background: '#1a1d2e', color: '#ffffff' }}>Lágur</option>
                <option value="miðlungs" style={{ background: '#1a1d2e', color: '#ffffff' }}>Miðlungs</option>
                <option value="hár" style={{ background: '#1a1d2e', color: '#ffffff' }}>Hár</option>
                <option value="bráður" style={{ background: '#1a1d2e', color: '#ffffff' }}>Bráður</option>
              </select>
            </div>
          </div>

          {/* Status + Ábyrgðaraðili */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Staða</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MalStatus)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="opið" style={{ background: '#1a1d2e', color: '#ffffff' }}>Opið</option>
                <option value="í vinnslu" style={{ background: '#1a1d2e', color: '#ffffff' }}>Í vinnslu</option>
                <option value="bíður viðskiptavinar" style={{ background: '#1a1d2e', color: '#ffffff' }}>Bíður viðskiptavinar</option>
                <option value="lokað" style={{ background: '#1a1d2e', color: '#ffffff' }}>Lokað</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Ábyrgðaraðili</label>
              <select
                value={abyrgdaradili}
                onChange={(e) => setAbyrgdaradili(e.target.value)}
                className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ colorScheme: 'dark' }}
              >
                {virkirNotendur.map((n) => (
                  <option key={n.id} value={n.nafn.split(' ')[0]} style={{ background: '#1a1d2e', color: '#ffffff' }}>
                    {n.nafn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tengingar */}
          <div className="pt-2 border-t border-white/5">
            <label className="text-xs font-medium text-white/40 block mb-3">
              Tengingar
            </label>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-white/30 block mb-1">
                  Fyrirtæki <span className="text-red-400">*</span>
                </label>
                <select
                  value={fyrirtaekiId}
                  onChange={(e) => setFyrirtaekiId(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>-- Velja fyrirtæki --</option>
                  {allFyrirtaeki.map((f) => (
                    <option key={f.id} value={f.id} style={{ background: '#1a1d2e', color: '#ffffff' }}>{f.nafn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-white/30 block mb-1">Bíll</label>
                <select
                  value={billId}
                  onChange={(e) => setBillId(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>-- Enginn --</option>
                  {allBilar.map((b) => (
                    <option key={b.id} value={b.id} style={{ background: '#1a1d2e', color: '#ffffff' }}>
                      {b.numer} – {b.tegund}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-white/30 block mb-1">Samningur</label>
                <select
                  value={samningurId}
                  onChange={(e) => setSamningurId(e.target.value)}
                  className="w-full bg-[#161822] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>-- Enginn --</option>
                  {allSamningar.map((s) => (
                    <option key={s.id} value={s.id} style={{ background: '#1a1d2e', color: '#ffffff' }}>
                      {s.id} – {s.bilategund} ({s.bilanumer})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {isEdit ? 'Vista breytingar' : 'Skrá mál'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-white/5 text-white/60 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
            >
              Hætta við
            </button>
          </div>

          {/* Delete */}
          {isEdit && onDelete && (
            <div className="pt-2 border-t border-white/5">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Eyða máli...
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-400">Ertu viss?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Já, eyða
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-white/5 text-white/40 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
                  >
                    Hætta við
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
