'use client';

import { useState, useEffect } from 'react';
import {
  type Bill,
  type BilaFlokkur,
  thpilaFlokkar,
  thpilaFlokkaLitir,
  fyrirtaeki as allFyrirtaeki,
} from '@/lib/enterprise-demo-data';

interface NyBilModalProps {
  onClose: () => void;
  onSave: (bill: Bill) => void;
}

const defaultForm = {
  numer: '',
  tegund: '',
  arsgerð: new Date().getFullYear(),
  litur: '',
  ekinkm: 0,
  bilaFlokkur: 'Fólksbílar' as BilaFlokkur,
  skiptigerð: 'Sjálfskiptur' as Bill['skiptigerð'],
  verdFra: 0,
  fyrirtaekiId: '' as string,
  status: 'laus' as Bill['status'],
  imageUrl: '',
};

const litir = [
  'Hvítur', 'Svartur', 'Grár', 'Silfur', 'Dökk grár', 'Ljós grár',
  'Blár', 'Dökkblár', 'Ljósblár', 'Himínblár',
  'Rauður', 'Dökkrauður', 'Vínrauður',
  'Grænn', 'Dökkgrænn', 'Ólífugrænn',
  'Gulur', 'Appelsínugulur',
  'Brúnn', 'Beigebr.', 'Kaffibr.',
  'Fjólublár', 'Bleikur',
  'Perluhvítur', 'Kristalhvítur',
  'Grafítgrár', 'Títangrár', 'Málmgrár',
  'Miðnæturblámi', 'Atlasblár',
];
const statusOptions: { value: Bill['status']; label: string }[] = [
  { value: 'laus', label: 'Laus' },
  { value: 'í leigu', label: 'Í útleigu' },
  { value: 'í þjónustu', label: 'Í þjónustu' },
];

export default function NyBilModal({ onClose, onSave }: NyBilModalProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newBill: Bill = {
      id: 'b' + Date.now(),
      numer: form.numer,
      tegund: form.tegund,
      arsgerð: form.arsgerð,
      litur: form.litur,
      ekinkm: form.ekinkm,
      fyrirtaekiId: form.fyrirtaekiId || null,
      samningurId: null,
      naestiThjonusta: '',
      sidastaThjonusta: '',
      bilaFlokkur: form.bilaFlokkur,
      skiptigerð: form.skiptigerð,
      verdFra: form.verdFra,
      status: form.status,
      imageUrl: form.imageUrl || undefined,
    };
    onSave(newBill);
  }

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inputClass =
    'w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30';
  const labelClass = 'text-xs font-medium text-white/50 block mb-1.5';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 overflow-y-auto">
        <div className="bg-[#161822] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mb-12 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Bæta við bíl</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Flokkur */}
            <div>
              <label className={labelClass}>Flokkur bíls</label>
              <div className="flex flex-wrap gap-1.5">
                {thpilaFlokkar.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set('bilaFlokkur', f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      form.bilaFlokkur === f
                        ? 'text-white'
                        : 'text-white/50 border-white/10 hover:text-white hover:border-white/20'
                    }`}
                    style={form.bilaFlokkur === f ? {
                      backgroundColor: thpilaFlokkaLitir[f] + '30',
                      borderColor: thpilaFlokkaLitir[f] + '60',
                    } : undefined}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Tegund + Árgerð */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Tegund</label>
                <input
                  className={inputClass}
                  value={form.tegund}
                  onChange={(e) => set('tegund', e.target.value)}
                  placeholder="t.d. Kia Sportage PHEV"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Árgerð</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.arsgerð}
                  onChange={(e) => set('arsgerð', parseInt(e.target.value) || 2024)}
                  min={2018}
                  max={2027}
                />
              </div>
            </div>

            {/* Bílnúmer + Litur */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bílnúmer</label>
                <input
                  className={inputClass}
                  value={form.numer}
                  onChange={(e) => set('numer', e.target.value.toUpperCase())}
                  placeholder="t.d. KS-401"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Litur</label>
                <select
                  className={inputClass}
                  value={form.litur}
                  onChange={(e) => set('litur', e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>Veldu lit</option>
                  {litir.map((l) => (
                    <option key={l} value={l} style={{ background: '#1a1d2e', color: '#ffffff' }}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skiptigerð + Staða */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Skiptigerð</label>
                <select
                  className={inputClass}
                  value={form.skiptigerð}
                  onChange={(e) => set('skiptigerð', e.target.value)}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="Sjálfskiptur" style={{ background: '#1a1d2e', color: '#ffffff' }}>Sjálfskiptur</option>
                  <option value="Beinskiptur" style={{ background: '#1a1d2e', color: '#ffffff' }}>Beinskiptur</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Staða</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  style={{ colorScheme: 'dark' }}
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value} style={{ background: '#1a1d2e', color: '#ffffff' }}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Akstur + Verð frá */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Ekið km</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.ekinkm || ''}
                  onChange={(e) => set('ekinkm', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Verð frá (kr./mán)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.verdFra || ''}
                  onChange={(e) => set('verdFra', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Fyrirtæki */}
            <div>
              <label className={labelClass}>Fyrirtæki (ef í útleigu)</label>
              <select
                className={inputClass}
                value={form.fyrirtaekiId}
                onChange={(e) => set('fyrirtaekiId', e.target.value)}
                style={{ colorScheme: 'dark' }}
              >
                <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>Ekkert fyrirtæki — bíllinn er laus</option>
                {allFyrirtaeki.map((f) => (
                  <option key={f.id} value={f.id} style={{ background: '#1a1d2e', color: '#ffffff' }}>{f.nafn}</option>
                ))}
              </select>
            </div>

            {/* Mynd URL */}
            <div>
              <label className={labelClass}>Mynd (URL)</label>
              <input
                className={inputClass}
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Hætta við
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Vista bíl
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
