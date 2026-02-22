'use client';

import { useState, useEffect, useRef } from 'react';
import { type Bill, type VirktThjonustuverk } from '@/lib/enterprise-demo-data';
import { useEnterpriseTheme } from '@/components/enterprise-theme-provider';

type ThjonustuTegund = VirktThjonustuverk['tegund'];

const TEGUNDIR: { value: ThjonustuTegund; label: string }[] = [
  { value: 'þjónustuskoðun', label: 'Þjónustuskoðun' },
  { value: 'dekkjaskipti', label: 'Dekkjaskipti' },
  { value: 'smurþjónusta', label: 'Smurþjónusta' },
  { value: 'olíuskipti', label: 'Olíuskipti' },
  { value: 'hefðbundið viðhald', label: 'Hefðbundið viðhald' },
  { value: 'viðgerð', label: 'Viðgerð' },
];

interface Props {
  bill: Bill;
  onClose: () => void;
  onSubmit: (verk: Omit<VirktThjonustuverk, 'id'>) => void;
}

export default function SetjaIThjonustuModal({ bill, onClose, onSubmit }: Props) {
  const { theme } = useEnterpriseTheme();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const today = new Date().toISOString().split('T')[0];
  const defaultSkila = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [tegund, setTegund] = useState<ThjonustuTegund>('þjónustuskoðun');
  const [lysing, setLysing] = useState('');
  const [stadur, setStadur] = useState('');
  const [dagsInni, setDagsInni] = useState(today);
  const [aaetladurSkiladagur, setAaetladurSkiladagur] = useState(defaultSkila);
  const [kostnadur, setKostnadur] = useState('');
  const [km, setKm] = useState(bill.ekinkm.toString());
  const [athugasemdir, setAthugasemdir] = useState('');
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

    if (!lysing.trim()) {
      setError('Lýsing á þjónustu er nauðsynleg');
      return;
    }
    if (!stadur.trim()) {
      setError('Staður (verkstæði) er nauðsynlegur');
      return;
    }

    onSubmit({
      billId: bill.id,
      tegund,
      lysing: lysing.trim(),
      stadur: stadur.trim(),
      dagsInni,
      aaetladurSkiladagur,
      ...(kostnadur ? { kostnadur: parseInt(kostnadur) } : {}),
      ...(km ? { km: parseInt(km) } : {}),
      ...(athugasemdir.trim() ? { athugasemdir: athugasemdir.trim() } : {}),
    });
    handleClose();
  }

  const isDark = theme !== 'light';
  const inputCls = isDark
    ? 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50'
    : 'w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50';
  const labelCls = isDark ? 'block text-xs font-medium text-white/50 mb-1.5' : 'block text-xs font-medium text-stone-500 mb-1.5';
  const selectStyle = isDark ? { colorScheme: 'dark' as const } : { color: '#1a1f1c', backgroundColor: '#f9faf6' };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      data-enterprise-theme={theme}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-200 ${
        isVisible ? 'bg-black/60' : 'bg-black/0'
      }`}
    >
      <div
        className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl transition-all duration-200 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${isDark ? 'bg-[#161822] border border-white/10' : 'bg-white border border-stone-200'}`}
      >
        <form onSubmit={handleSubmit}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-stone-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.183A1.25 1.25 0 014.5 17.18V6.82a1.25 1.25 0 011.536-1.173l5.384 3.183a1.25 1.25 0 010 2.346zM21.75 12a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-1.277 1.557" />
                </svg>
              </div>
              <div>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-stone-800'}`}>Setja í þjónustu</h2>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-stone-400'}`}>{bill.tegund} · {bill.numer}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={`ml-auto p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-white/40' : 'hover:bg-stone-100 text-stone-400'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tegund þjónustu</label>
                <select
                  value={tegund}
                  onChange={e => setTegund(e.target.value as ThjonustuTegund)}
                  className={inputCls}
                  style={selectStyle}
                >
                  {TEGUNDIR.map(t => (
                    <option key={t.value} value={t.value} style={isDark ? { background: '#1a1d2e', color: '#fff' } : undefined}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Staður / verkstæði</label>
                <input
                  value={stadur}
                  onChange={e => setStadur(e.target.value)}
                  placeholder="t.d. Hekla Verkstæði"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Lýsing á verkinu</label>
              <textarea
                value={lysing}
                onChange={e => setLysing(e.target.value)}
                placeholder="Hvað á að gera við bílinn?"
                rows={3}
                className={inputCls + ' resize-none'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Dagsetning inn</label>
                <input
                  type="date"
                  value={dagsInni}
                  onChange={e => setDagsInni(e.target.value)}
                  className={inputCls}
                  style={selectStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Áætlaður skiladagur</label>
                <input
                  type="date"
                  value={aaetladurSkiladagur}
                  onChange={e => setAaetladurSkiladagur(e.target.value)}
                  className={inputCls}
                  style={selectStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Áætlaður kostnaður (kr.)</label>
                <input
                  type="number"
                  value={kostnadur}
                  onChange={e => setKostnadur(e.target.value)}
                  placeholder="Valkvætt"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Km-staða</label>
                <input
                  type="number"
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Athugasemdir</label>
              <textarea
                value={athugasemdir}
                onChange={e => setAthugasemdir(e.target.value)}
                placeholder="Viðbótarupplýsingar..."
                rows={2}
                className={inputCls + ' resize-none'}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>

          <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-white/5' : 'border-stone-100'}`}>
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              Hætta við
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.183A1.25 1.25 0 014.5 17.18V6.82a1.25 1.25 0 011.536-1.173l5.384 3.183a1.25 1.25 0 010 2.346z" />
              </svg>
              Setja í þjónustu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
