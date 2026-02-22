'use client';

import { useState, useMemo } from 'react';
import {
  fyrirtaeki,
  bilar,
  formatCurrency,
  type Fyrirtaeki,
  type Bill,
  type Samningur,
  type Svid,
} from '@/lib/enterprise-demo-data';

interface NySamningurModalProps {
  onClose: () => void;
  onSave: (samningur: Samningur) => void;
}

type Step = 1 | 2 | 3 | 4;

const stepLabels = ['Viðskiptavinur', 'Bíll', 'Skilmálar', 'Staðfesting'];

export default function NySamningurModal({ onClose, onSave }: NySamningurModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState('');
  const [carSearch, setCarSearch] = useState('');
  const [selectedFyrirtaeki, setSelectedFyrirtaeki] = useState<Fyrirtaeki | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [tegund, setTegund] = useState<Svid>('langtimaleiga');
  const [months, setMonths] = useState(12);
  const [akstur, setAkstur] = useState(1300);
  const [trygging, setTrygging] = useState<'Enterprise' | 'Plús' | 'Úrvals'>('Enterprise');
  const [kostnadur, setKostnadur] = useState(0);
  const [athugasemdir, setAthugasemdir] = useState('');

  const filteredFyrirtaeki = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return fyrirtaeki;
    return fyrirtaeki.filter(
      (f) =>
        f.nafn.toLowerCase().includes(q) ||
        f.kennitala.includes(q) ||
        f.heimilisfang.toLowerCase().includes(q)
    );
  }, [search]);

  const availableCars = useMemo(() => {
    const q = carSearch.toLowerCase().trim();
    const free = bilar.filter((b) => b.status === 'laus');
    if (!q) return free;
    return free.filter(
      (b) =>
        b.tegund.toLowerCase().includes(q) ||
        b.numer.toLowerCase().includes(q) ||
        b.bilaFlokkur.toLowerCase().includes(q)
    );
  }, [carSearch]);

  function handleSelectCar(car: Bill) {
    setSelectedBill(car);
    setKostnadur(car.verdFra);
    setStep(3);
  }

  function handleSave() {
    if (!selectedFyrirtaeki || !selectedBill) return;
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + months);
    const newSamningur: Samningur = {
      id: `s-new-${Date.now()}`,
      fyrirtaekiId: selectedFyrirtaeki.id,
      tegund,
      bilanumer: selectedBill.numer,
      bilategund: selectedBill.tegund,
      upphafsdagur: today.toISOString().split('T')[0],
      lokadagur: endDate.toISOString().split('T')[0],
      manadalegurKostnadur: kostnadur,
      tryggingarPakki: trygging,
      aksturKmManudir: akstur,
      status: 'virkur',
      athugasemdir,
    };
    onSave(newSamningur);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#161822] border-b border-white/5 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Nýr samningur</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => {
              const stepNum = (i + 1) as Step;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isDone
                          ? 'bg-green-500/20 text-green-400'
                          : isActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : isDone ? 'text-green-400' : 'text-white/30'}`}>
                      {label}
                    </span>
                  </div>
                  {i < 3 && <div className={`h-px flex-1 ${isDone ? 'bg-green-500/30' : 'bg-white/5'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select company */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Leita að fyrirtæki..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {filteredFyrirtaeki.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFyrirtaeki(f);
                      setStep(2);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      selectedFyrirtaeki?.id === f.id
                        ? 'bg-blue-600/15 border border-blue-500/30'
                        : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-400">{f.nafn.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{f.nafn}</div>
                      <div className="text-xs text-white/40">{f.kennitala} · {f.virktSamningar} samningar</div>
                    </div>
                    <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
                {filteredFyrirtaeki.length === 0 && (
                  <div className="py-8 text-center text-sm text-white/30">Ekkert fyrirtæki fannst</div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select car */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep(1)} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm text-white/60">
                  Valið: <span className="text-white font-medium">{selectedFyrirtaeki?.nafn}</span>
                </div>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Leita í lausum bílum..."
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
              </div>
              {availableCars.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/30">Engir lausir bílar fundust</div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                  {availableCars.map((car) => (
                    <button
                      key={car.id}
                      onClick={() => handleSelectCar(car)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25V6.375c0-.621.504-1.125 1.125-1.125h8.25M16.5 6.375V14.25" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{car.tegund}</div>
                        <div className="text-xs text-white/40">{car.numer} · {car.arsgerð} · {car.litur} · {car.bilaFlokkur}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-medium text-green-400">frá {formatCurrency(car.verdFra)}</div>
                        <div className="text-xs text-white/40">{car.ekinkm.toLocaleString('is-IS')} km</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Terms */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep(2)} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm text-white/60">
                  {selectedFyrirtaeki?.nafn} · <span className="text-white font-medium">{selectedBill?.tegund}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-2 block">Tegund samnings</label>
                <div className="flex gap-2">
                  {(['langtimaleiga', 'flotaleiga'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTegund(t)}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        tegund === t
                          ? t === 'flotaleiga'
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {t === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-2 block">Samningstími</label>
                <div className="flex gap-2">
                  {[6, 12, 24, 36, 48].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonths(m)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        months === m
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {m} mán
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Mánaðarkostnaður (kr.)</label>
                  <input
                    type="number"
                    value={kostnadur}
                    onChange={(e) => setKostnadur(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Akstur (km/mán)</label>
                  <input
                    type="number"
                    value={akstur}
                    onChange={(e) => setAkstur(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-2 block">Tryggingapakki</label>
                <div className="flex gap-2">
                  {(['Enterprise', 'Plús', 'Úrvals'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrygging(t)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        trygging === t
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Athugasemdir (valfrjálst)</label>
                <textarea
                  value={athugasemdir}
                  onChange={(e) => setAthugasemdir(e.target.value)}
                  rows={2}
                  placeholder="Sérstakar athugasemdir..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              <button
                onClick={() => setStep(4)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Áfram í staðfestingu
              </button>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep(3)} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-sm font-semibold text-white">Yfirlit og staðfesting</h3>
              </div>

              <div className="bg-white/5 rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Viðskiptavinur</span>
                  <span className="text-white font-medium">{selectedFyrirtaeki?.nafn}</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Bíll</span>
                  <span className="text-white font-medium">{selectedBill?.tegund} ({selectedBill?.numer})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Tegund</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: tegund === 'flotaleiga' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
                      color: tegund === 'flotaleiga' ? '#a78bfa' : '#60a5fa',
                    }}
                  >
                    {tegund === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'}
                  </span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Samningstími</span>
                  <span className="text-white">{months} mánuðir</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Mánaðarkostnaður</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(kostnadur)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Akstur</span>
                  <span className="text-white">{akstur.toLocaleString('is-IS')} km/mán</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Tryggingapakki</span>
                  <span className="text-white">{trygging}</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Heildarverðmæti</span>
                  <span className="text-blue-400 font-bold text-base">{formatCurrency(kostnadur * months)}</span>
                </div>
              </div>

              {athugasemdir && (
                <div className="bg-white/5 rounded-lg px-4 py-3">
                  <div className="text-xs text-white/40 mb-1">Athugasemdir</div>
                  <div className="text-sm text-white/80">{athugasemdir}</div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors"
                >
                  Til baka
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Stofna samning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
