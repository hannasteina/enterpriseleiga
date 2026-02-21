'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { fyrirtaeki as allFyrirtaeki, type Solutaekifaeri } from '@/lib/enterprise-demo-data';

interface Profile {
  id: string;
  full_name: string | null;
  hlutverk: string | null;
}

export interface TaekifaeriFormData {
  titill: string;
  lysing: string;
  verdmaeti: number;
  stig: string;
  pipiTegund: string;
  naestiKontaktur: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (taekifaeri: Solutaekifaeri) => void;
  prefillData?: Partial<TaekifaeriFormData>;
  fyrirtaekiId?: string;
  fyrirtaekiNafn?: string;
}

const STIG_OPTIONS = [
  { value: 'lead', label: 'Ný tækifæri' },
  { value: 'tilboð sent', label: 'Tilboð sent' },
  { value: 'samningur í vinnslu', label: 'Samningur í vinnslu' },
];

const TEGUND_OPTIONS = [
  { value: 'floti', label: 'Flotaleiga' },
  { value: 'langtimaleiga', label: 'Langtímaleiga' },
  { value: 'vinnuferdir', label: 'Vinnuferðir' },
  { value: 'sendibilar', label: 'Sendibílar' },
  { value: 'serpantanir', label: 'Sérpantanir' },
];

const HLUTVERK_LABELS: Record<string, string> = {
  stjornandi: 'Stjórnandi',
  yfirmadur: 'Yfirmaður',
  soludmadur_langtima: 'Sölumaður (langtíma)',
  soludmadur_flota: 'Sölumaður (flota)',
  thjonustufulltrui: 'Þjónustufulltrúi',
  notandi: 'Notandi',
};

export default function StofnaTaekifaeriModal({ isOpen, onClose, onSuccess, prefillData, fyrirtaekiId, fyrirtaekiNafn }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [titill, setTitill] = useState(prefillData?.titill ?? '');
  const [lysing, setLysing] = useState(prefillData?.lysing ?? '');
  const [verdmaeti, setVerdmaeti] = useState<string>(prefillData?.verdmaeti?.toString() ?? '');
  const [stig, setStig] = useState(prefillData?.stig ?? 'lead');
  const [pipiTegund, setPipiTegund] = useState(prefillData?.pipiTegund ?? 'floti');
  const [abyrgdarmadurId, setAbyrgdarmadurId] = useState('');
  const [naestiKontaktur, setNaestiKontaktur] = useState(prefillData?.naestiKontaktur ?? nextWeek);

  const [selectedFyrirtaeki, setSelectedFyrirtaeki] = useState(fyrirtaekiId ?? '');
  const [validation, setValidation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setTitill(prefillData?.titill ?? '');
      setLysing(prefillData?.lysing ?? '');
      setVerdmaeti(prefillData?.verdmaeti?.toString() ?? '');
      setStig(prefillData?.stig ?? 'lead');
      setPipiTegund(prefillData?.pipiTegund ?? 'floti');
      setNaestiKontaktur(prefillData?.naestiKontaktur ?? nextWeek);
      setAbyrgdarmadurId('');
      setSelectedFyrirtaeki(fyrirtaekiId ?? '');
      setError(null);
      setValidation({});
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen, prefillData, nextWeek, fyrirtaekiId]);

  const fetchProfiles = useCallback(async () => {
    try {
      setProfilesLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, hlutverk')
        .order('full_name');
      if (fetchError) throw fetchError;
      setProfiles(data ?? []);
    } catch {
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchProfiles();
  }, [isOpen, fetchProfiles]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose();
  }

  function validate(): boolean {
    const errors: Record<string, boolean> = {};
    if (!titill.trim()) errors.titill = true;
    if (!verdmaeti || isNaN(Number(verdmaeti)) || Number(verdmaeti) <= 0) errors.verdmaeti = true;
    if (!stig) errors.stig = true;
    if (!pipiTegund) errors.pipiTegund = true;
    if (!abyrgdarmadurId) errors.abyrgdarmadurId = true;
    if (!fyrirtaekiId && !selectedFyrirtaeki) errors.fyrirtaeki = true;
    setValidation(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      const resolvedFyrirtaekiId = fyrirtaekiId || selectedFyrirtaeki;

      const nyttTaekifaeri: Solutaekifaeri = {
        id: `so-${Date.now()}`,
        fyrirtaekiId: resolvedFyrirtaekiId,
        tengiliðurId: '',
        titill: titill.trim(),
        lysing: lysing.trim(),
        stig: stig as Solutaekifaeri['stig'],
        pipalineStig: 1,
        verdmaeti: Number(verdmaeti),
        dagsetning: today,
        sidastiKontaktur: today,
        naestiKontaktur: naestiKontaktur,
        pipiTegund: pipiTegund as Solutaekifaeri['pipiTegund'],
        ferlSkrefs: [{
          id: `fs-${Date.now()}`,
          nafn: 'Tækifæri stofnað',
          lýsing: `Stofnað af ${profiles.find(p => p.id === abyrgdarmadurId)?.full_name ?? 'notanda'}`,
          status: 'lokið',
          dagsetning: today,
          sjálfvirkt: true,
        }],
      };

      if (resolvedFyrirtaekiId) {
        const insertData: Record<string, unknown> = {
          titill: titill.trim(),
          lysing: lysing.trim() || null,
          fyrirtaeki_id: resolvedFyrirtaekiId,
          stig,
          pipaline_stig: 1,
          pipi_tegund: pipiTegund,
          verdmaeti: Number(verdmaeti),
          dagsetning: today,
          sidasti_kontaktur: today,
          naesti_kontaktur: naestiKontaktur,
          abyrgdarmadur_id: abyrgdarmadurId,
          stofnandi_id: user?.id ?? null,
          updated_by: user?.id ?? null,
        };

        const { data: dbRow, error: insertError } = await supabase
          .from('solutaekifaeri')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError) throw insertError;

        if (dbRow) {
          nyttTaekifaeri.id = dbRow.id;
          await supabase
            .from('ferl_skref')
            .insert({
              solutaekifaeri_id: dbRow.id,
              nafn: 'Tækifæri stofnað',
              lysing: `Stofnað af ${profiles.find(p => p.id === abyrgdarmadurId)?.full_name ?? 'notanda'}`,
              status: 'lokið',
              dagsetning: today,
              sjalfvirkt: true,
              rod: 1,
            });
        }
      }

      onSuccess(nyttTaekifaeri);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Villa kom upp við að stofna tækifæri');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-200 ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
    >
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-[#1a1d23] shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">Stofna sölutækifæri</h2>
            {fyrirtaekiNafn && (
              <p className="text-xs text-white/40 mt-0.5">{fyrirtaekiNafn}</p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Fyrirtæki (only when not pre-set) */}
          {!fyrirtaekiId && (
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Fyrirtæki <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedFyrirtaeki}
                onChange={e => { setSelectedFyrirtaeki(e.target.value); setValidation(v => ({ ...v, fyrirtaeki: false })); }}
                className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${validation.fyrirtaeki ? 'border-red-500/50' : 'border-white/10'}`}
              >
                <option value="" className="bg-[#1a1d23]">Veldu fyrirtæki...</option>
                {allFyrirtaeki.map(f => (
                  <option key={f.id} value={f.id} className="bg-[#1a1d23]">{f.nafn}</option>
                ))}
              </select>
              {validation.fyrirtaeki && <p className="text-[11px] text-red-400 mt-1">Fyrirtæki er nauðsynlegt</p>}
            </div>
          )}

          {/* Titill */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Titill <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={titill}
              onChange={e => { setTitill(e.target.value); setValidation(v => ({ ...v, titill: false })); }}
              className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${validation.titill ? 'border-red-500/50' : 'border-white/10'}`}
              placeholder="T.d. Marel – Flotaleiga (20 bílar)"
            />
            {validation.titill && <p className="text-[11px] text-red-400 mt-1">Titill er nauðsynlegur</p>}
          </div>

          {/* Lýsing */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Lýsing</label>
            <textarea
              value={lysing}
              onChange={e => setLysing(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
              placeholder="Stutt lýsing á tækifærinu..."
            />
          </div>

          {/* Verðmæti + Stig */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Verðmæti (kr.) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={verdmaeti}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setVerdmaeti(val);
                  setValidation(v => ({ ...v, verdmaeti: false }));
                }}
                className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${validation.verdmaeti ? 'border-red-500/50' : 'border-white/10'}`}
                placeholder="0"
              />
              {verdmaeti && !isNaN(Number(verdmaeti)) && Number(verdmaeti) > 0 && (
                <p className="text-[11px] text-white/30 mt-1">{Number(verdmaeti).toLocaleString('is-IS')} kr.</p>
              )}
              {validation.verdmaeti && <p className="text-[11px] text-red-400 mt-1">Verðmæti er nauðsynlegt</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Stig <span className="text-red-400">*</span>
              </label>
              <select
                value={stig}
                onChange={e => { setStig(e.target.value); setValidation(v => ({ ...v, stig: false })); }}
                className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${validation.stig ? 'border-red-500/50' : 'border-white/10'}`}
              >
                {STIG_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#1a1d23]">{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tegund + Næsta snerting */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Tegund <span className="text-red-400">*</span>
              </label>
              <select
                value={pipiTegund}
                onChange={e => { setPipiTegund(e.target.value); setValidation(v => ({ ...v, pipiTegund: false })); }}
                className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${validation.pipiTegund ? 'border-red-500/50' : 'border-white/10'}`}
              >
                {TEGUND_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-[#1a1d23]">{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Næsta snerting</label>
              <input
                type="date"
                value={naestiKontaktur}
                onChange={e => setNaestiKontaktur(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Ábyrgðarmaður */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Ábyrgðarmaður <span className="text-red-400">*</span>
            </label>
            {profilesLoading ? (
              <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/30">
                Hleð notendum...
              </div>
            ) : (
              <select
                value={abyrgdarmadurId}
                onChange={e => { setAbyrgdarmadurId(e.target.value); setValidation(v => ({ ...v, abyrgdarmadurId: false })); }}
                className={`w-full px-3 py-2 rounded-lg bg-white/5 border text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${validation.abyrgdarmadurId ? 'border-red-500/50' : 'border-white/10'}`}
              >
                <option value="" className="bg-[#1a1d23]">Veldu ábyrgðarmann...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#1a1d23]">
                    {p.full_name ?? 'Ónefndur'}{p.hlutverk ? ` – ${HLUTVERK_LABELS[p.hlutverk] ?? p.hlutverk}` : ''}
                  </option>
                ))}
              </select>
            )}
            {validation.abyrgdarmadurId && <p className="text-[11px] text-red-400 mt-1">Ábyrgðarmaður er nauðsynlegur</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Hætta við
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Vista...
              </span>
            ) : 'Stofna tækifæri'}
          </button>
        </div>
      </div>
    </div>
  );
}
