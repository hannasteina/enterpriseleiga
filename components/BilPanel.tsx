'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  type Bill,
  type Samningur,
  type Fyrirtaeki,
  type ThjonustuFerillItem,
  type Thjonustuaminning,
  type SamningsSkjal,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  getFyrirtaeki,
  getSamningur,
  getThjonustuFerillBils,
  thjonustuaminningar,
  samningsSkjol,
  samningar,
  thpilaFlokkaLitir,
} from '@/lib/enterprise-demo-data';
import ImageLightbox from '@/components/ImageLightbox';

interface BilPanelProps {
  car: Bill;
  onClose: () => void;
}

function getDaysUntilDate(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function samningurStatus(s: Samningur) {
  const days = getDaysUntilDate(s.lokadagur);
  if (s.status === 'lokid') return { label: 'Lokið', color: '#6b7280' };
  if (s.status === 'uppsagt') return { label: 'Uppsagt', color: '#ef4444' };
  if (days <= 30) return { label: `Rennur út eftir ${days} daga`, color: '#f59e0b' };
  return { label: 'Virkur', color: '#22c55e' };
}

export default function BilPanel({ car, onClose }: BilPanelProps) {
  const fyrirtaeki: Fyrirtaeki | null = car.fyrirtaekiId ? getFyrirtaeki(car.fyrirtaekiId) ?? null : null;
  const samningur: Samningur | null = car.samningurId ? getSamningur(car.samningurId) ?? null : null;

  const thjonustuFerill: ThjonustuFerillItem[] = getThjonustuFerillBils(car.id)
    .sort((a, b) => new Date(b.dagsetning).getTime() - new Date(a.dagsetning).getTime());

  const carAminningar: Thjonustuaminning[] = thjonustuaminningar.filter(t => t.billId === car.id);
  const carSkjol: SamningsSkjal[] = car.samningurId
    ? samningsSkjol.filter(s => s.samningurId === car.samningurId)
    : [];

  const alleSamningar = samningar.filter(
    s => s.bilanumer === car.numer || (car.samningurId && s.id === car.samningurId)
  );

  const daysUntilService = car.naestiThjonusta ? getDaysUntilDate(car.naestiThjonusta) : null;
  const flokkurLitur = thpilaFlokkaLitir[car.bilaFlokkur] || '#6b7280';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0f1117] border-l border-white/10 z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-[#0f1117]/95 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: flokkurLitur + '20' }}>
              <svg className="w-5 h-5" style={{ color: flokkurLitur }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M21 12.75V6.375a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 6.375v6.375" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{car.numer}</h2>
              <p className="text-xs text-white/50">{car.tegund} • {car.arsgerð}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/bilar/${car.id}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Opna síðu →
            </Link>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Car image */}
          {car.imageUrl && (
            <div className="flex justify-center">
              <ImageLightbox
                src={car.imageUrl}
                alt={`${car.tegund} ${car.arsgerð}`}
                thumbnailClassName="w-full max-w-md h-40 object-contain rounded-xl"
                thumbnailWidth={400}
                thumbnailHeight={160}
              />
            </div>
          )}

          {/* Status + Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: getStatusBg(car.status), color: getStatusColor(car.status) }}>
              {car.status === 'í leigu' ? 'Í útleigu' : car.status === 'laus' ? 'Laus' : car.status === 'í þjónustu' ? 'Í þjónustu' : car.status}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: flokkurLitur + '20', color: flokkurLitur }}>
              {car.bilaFlokkur}
            </span>
          </div>

          {/* Yfirlit */}
          <div className="bg-[#161822] rounded-xl border border-white/5 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Yfirlit</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/40 text-xs block">Litur</span>
                <span className="text-white">{car.litur}</span>
              </div>
              <div>
                <span className="text-white/40 text-xs block">Skiptigerð</span>
                <span className="text-white">{car.skiptigerð}</span>
              </div>
              <div>
                <span className="text-white/40 text-xs block">Akstur</span>
                <span className="text-white">{car.ekinkm.toLocaleString('is-IS')} km</span>
              </div>
              <div>
                <span className="text-white/40 text-xs block">Verð frá</span>
                <span className="text-white">{formatCurrency(car.verdFra)}/mán</span>
              </div>
            </div>
          </div>

          {/* Leigjandi */}
          {fyrirtaeki && (
            <div className="bg-[#161822] rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Leigjandi</h3>
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/vidskiptavinir/${car.fyrirtaekiId}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {fyrirtaeki.nafn} →
                  </Link>
                  <p className="text-xs text-white/40 mt-1">{fyrirtaeki.kennitala}</p>
                  <p className="text-xs text-white/40">{fyrirtaeki.heimilisfang}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white/40 block">Bílar í leigu</span>
                  <span className="text-sm font-semibold text-white">{fyrirtaeki.bilar}</span>
                </div>
              </div>
              {fyrirtaeki.tengiliðir.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-white/30 block mb-2">Tengiliður</span>
                  {fyrirtaeki.tengiliðir.slice(0, 2).map(t => (
                    <div key={t.id} className="flex items-center gap-3 text-xs text-white/70 mb-1">
                      <span className="font-medium text-white/90">{t.nafn}</span>
                      <span className="text-white/40">{t.titill}</span>
                      {t.simi && <span className="text-white/40">{t.simi}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Samningur */}
          {samningur && (
            <div className="bg-[#161822] rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Samningur</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: samningurStatus(samningur).color + '20', color: samningurStatus(samningur).color }}>
                  {samningurStatus(samningur).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-white/40 text-xs block">Tímabil</span>
                  <span className="text-white text-xs">{formatDate(samningur.upphafsdagur)} – {formatDate(samningur.lokadagur)}</span>
                </div>
                <div>
                  <span className="text-white/40 text-xs block">Mánaðarkostnaður</span>
                  <span className="text-white font-medium">{formatCurrency(samningur.manadalegurKostnadur)}</span>
                </div>
                <div>
                  <span className="text-white/40 text-xs block">Tryggingar</span>
                  <span className="text-white">{samningur.tryggingarPakki}</span>
                </div>
                <div>
                  <span className="text-white/40 text-xs block">Akstur/mán</span>
                  <span className="text-white">{samningur.aksturKmManudir.toLocaleString('is-IS')} km</span>
                </div>
              </div>
              {samningur.athugasemdir && (
                <p className="text-xs text-white/50 mt-3 pt-3 border-t border-white/5 italic">
                  {samningur.athugasemdir}
                </p>
              )}
              {carSkjol.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-white/30 block mb-2">Skjöl ({carSkjol.length})</span>
                  {carSkjol.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs py-1">
                      <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="text-white/70 truncate">{s.nafn}</span>
                      <span className="text-white/30 ml-auto shrink-0">{s.staerd}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!fyrirtaeki && !samningur && (
            <SendCarInfoPanel car={car} />
          )}

          {/* Þjónusta */}
          <div className="bg-[#161822] rounded-xl border border-white/5 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Þjónusta</h3>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <span className="text-white/40 text-xs block">Næsta þjónusta</span>
                <span className={`text-sm ${daysUntilService !== null && daysUntilService <= 30 ? 'text-amber-400 font-medium' : 'text-white'}`}>
                  {car.naestiThjonusta ? formatDate(car.naestiThjonusta) : '—'}
                </span>
                {daysUntilService !== null && daysUntilService <= 30 && daysUntilService > 0 && (
                  <span className="text-[10px] text-amber-400 block">eftir {daysUntilService} daga</span>
                )}
              </div>
              <div>
                <span className="text-white/40 text-xs block">Síðasta þjónusta</span>
                <span className="text-white text-sm">{car.sidastaThjonusta ? formatDate(car.sidastaThjonusta) : '—'}</span>
              </div>
            </div>

            {carAminningar.length > 0 && (
              <div className="mb-3 pt-3 border-t border-white/5">
                <span className="text-xs text-white/30 block mb-2">Áminningar</span>
                {carAminningar.map(ta => (
                  <div key={ta.id} className="flex items-center gap-2 text-xs py-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: getStatusBg(ta.status), color: getStatusColor(ta.status) }}>
                      {ta.status}
                    </span>
                    <span className="text-white/70">{ta.tegund}</span>
                    <span className="text-white/40 ml-auto">{formatDate(ta.dagsThjonustu)}</span>
                  </div>
                ))}
              </div>
            )}

            {thjonustuFerill.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <span className="text-xs text-white/30 block mb-2">Þjónustuferill</span>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {thjonustuFerill.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-white/[0.02]">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 shrink-0" />
                      <span className="text-white/80 font-medium">{item.tegund}</span>
                      <span className="text-white/40">{formatDate(item.dagsetning)}</span>
                      {item.km > 0 && <span className="text-white/30 ml-auto">{item.km.toLocaleString('is-IS')} km</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {thjonustuFerill.length === 0 && carAminningar.length === 0 && (
              <p className="text-xs text-white/30 text-center py-2">Enginn þjónustuferill skráður</p>
            )}
          </div>

          {/* Allir samningar */}
          {alleSamningar.length > 1 && (
            <div className="bg-[#161822] rounded-xl border border-white/5 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                Allir samningar ({alleSamningar.length})
              </h3>
              <div className="space-y-2">
                {alleSamningar.map(s => {
                  const st = samningurStatus(s);
                  const f = getFyrirtaeki(s.fyrirtaekiId);
                  return (
                    <div key={s.id} className="flex items-center gap-3 text-xs py-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: st.color + '20', color: st.color }}>
                        {st.label}
                      </span>
                      <span className="text-white/70">{f?.nafn ?? '—'}</span>
                      <span className="text-white/40 ml-auto">{formatDate(s.upphafsdagur)} – {formatDate(s.lokadagur)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SendCarInfoPanel({ car }: { car: Bill }) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSend() {
    if (!email) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/send-car-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: email,
          toName: name,
          carNumber: car.numer,
          carType: car.tegund,
          carYear: car.arsgerð,
          carColor: car.litur,
          carMileage: car.ekinkm,
          carTransmission: car.skiptigerð,
          carCategory: car.bilaFlokkur,
          carPriceFrom: car.verdFra,
          carStatus: car.status,
          nextService: car.naestiThjonusta,
          lastService: car.sidastaThjonusta,
          imageUrl: car.imageUrl || undefined,
          personalMessage: message || undefined,
          senderName: 'Enterprise Bílaleiga',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ ok: true, message: data.message });
      } else {
        setResult({ ok: false, message: data.error || 'Villa við sendingu' });
      }
    } catch {
      setResult({ ok: false, message: 'Tengivilla — reyndu aftur' });
    } finally {
      setSending(false);
    }
  }

  function resetForm() {
    setEmail('');
    setName('');
    setMessage('');
    setResult(null);
    setShowForm(false);
  }

  if (result?.ok) {
    return (
      <div className="bg-[#161822] rounded-xl border border-green-500/20 p-5">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-green-400">Sent!</div>
            <div className="text-xs text-white/40 mt-1">{result.message}</div>
          </div>
          <button
            onClick={resetForm}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Senda á fleiri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
      {/* Available car banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-green-400">Bíll laus til útleigu</div>
          <div className="text-[11px] text-white/40">Verð frá {formatCurrency(car.verdFra)}/mán</div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Stofna samning */}
        <Link
          href={`/bilar/${car.id}?uthluta=true`}
          className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600/10 hover:bg-emerald-600/15 border border-emerald-500/20 rounded-lg text-left transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-600/15 flex items-center justify-center shrink-0">
            <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors">Stofna samning</div>
            <div className="text-[11px] text-white/40">Úthluta bíl og búa til leigusamning</div>
          </div>
          <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 hover:bg-blue-600/15 border border-blue-500/20 rounded-lg text-left transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">Senda upplýsingar í tölvupósti</div>
              <div className="text-[11px] text-white/40">Senda bílaupplýsingar á viðskiptavin eða áhugasama</div>
            </div>
            <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Senda bílaupplýsingar</h4>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview of what will be sent */}
            <div className="bg-white/5 rounded-lg p-3 space-y-2 text-xs">
              <div className="text-white/40 font-medium mb-1.5">Upplýsingar sem sendast:</div>
              {car.imageUrl && (
                <div className="flex items-center gap-2 text-white/50">
                  <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Mynd af bíl
                </div>
              )}
              <div className="flex justify-between"><span className="text-white/40">Bíll</span><span className="text-white/70">{car.tegund} ({car.arsgerð})</span></div>
              <div className="flex justify-between"><span className="text-white/40">Númer</span><span className="text-white/70">{car.numer}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Litur / Skipti</span><span className="text-white/70">{car.litur} · {car.skiptigerð}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Akstur</span><span className="text-white/70">{car.ekinkm.toLocaleString('is-IS')} km</span></div>
              <div className="flex justify-between"><span className="text-white/40">Verð frá</span><span className="text-green-400 font-medium">{formatCurrency(car.verdFra)}/mán</span></div>
              <div className="pt-1.5 mt-1.5 border-t border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white/50">
                  <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Innifalið í verði (9 liðir)
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Tryggingapakkar
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Samningsskilmálar
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Netfang viðtakanda *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jon@fyrirtaeki.is"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Nafn viðtakanda</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jón Jónsson"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Persónuleg skilaboð (valkvætt)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Hæ, ég vildi benda þér á þennan bíl..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none"
              />
            </div>

            {result && !result.ok && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-xs text-red-400">{result.message}</span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!email || sending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sendi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Senda tölvupóst
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
