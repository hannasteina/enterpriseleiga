'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  samningar,
  samningsSkjol,
  getFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  verkefni,
  innifaliðILeigu,
  type Samningur,
} from '@/lib/enterprise-demo-data';

type TegundFilter = 'allir' | 'langtimaleiga' | 'flotaleiga';
type StatusFilter = 'allir' | 'virkir' | 'rennur_ut' | 'lokid';

const statusLabels: Record<string, string> = {
  virkur: 'Virkur',
  rennur_ut: 'Rennur út',
  lokid: 'Lokið',
  uppsagt: 'Uppsagt',
};

function getDaysRemaining(lokadagur: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loka = new Date(lokadagur);
  loka.setHours(0, 0, 0, 0);
  const diff = Math.ceil((loka.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function SamningarPage() {
  const [tegundFilter, setTegundFilter] = useState<TegundFilter>('allir');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('allir');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSamningur, setSelectedSamningur] = useState<Samningur | null>(null);
  const [samningarList, setSamningarList] = useState<Samningur[]>([...samningar]);

  const filteredSamningar = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return samningarList.filter((s) => {
      const tegundMatch =
        tegundFilter === 'allir' || s.tegund === tegundFilter;
      const statusMatch =
        statusFilter === 'allir' ||
        (statusFilter === 'virkir' && s.status === 'virkur') ||
        (statusFilter === 'rennur_ut' && s.status === 'rennur_ut') ||
        (statusFilter === 'lokid' && s.status === 'lokid');
      if (!tegundMatch || !statusMatch) return false;
      if (!q) return true;
      const f = getFyrirtaeki(s.fyrirtaekiId);
      return (
        (f?.nafn ?? '').toLowerCase().includes(q) ||
        s.bilategund.toLowerCase().includes(q) ||
        s.bilanumer.toLowerCase().includes(q) ||
        (statusLabels[s.status] ?? s.status).toLowerCase().includes(q) ||
        s.upphafsdagur.includes(q) ||
        s.lokadagur.includes(q)
      );
    });
  }, [samningarList, tegundFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = samningarList.length;
    const monthlyRevenue = samningarList
      .filter((s) => s.status === 'virkur' || s.status === 'rennur_ut')
      .reduce((sum, s) => sum + s.manadalegurKostnadur, 0);
    const fleetCount = samningarList.filter((s) => s.tegund === 'flotaleiga').length;
    const longTermCount = samningarList.filter((s) => s.tegund === 'langtimaleiga').length;
    return { total, monthlyRevenue, fleetCount, longTermCount };
  }, [samningarList]);

  const verkefniBradlega = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    return verkefni.filter((v) => {
      if (!v.samningurId) return false;
      const samningur = samningar.find((s) => s.id === v.samningurId);
      if (!samningur) return false;
      const loka = new Date(samningur.lokadagur);
      return loka <= in30Days && loka >= now;
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Samningar</h1>
        <p className="text-sm text-white/40 mt-1">Flota- og langtímaleiga</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/vidskiptavinir" className="group bg-[#161822] rounded-xl border border-white/5 p-5 hover:bg-white/5 transition-colors block">
          <div className="text-xs font-medium text-white/40 mb-2">Heildarfjöldi samninga</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-white/60 transition-colors">
            <span>Viðskiptavinir</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
        <Link href="/skyrslur" className="group bg-[#161822] rounded-xl border border-white/5 p-5 hover:bg-white/5 transition-colors block">
          <div className="text-xs font-medium text-white/40 mb-2">Mánaðartekjur</div>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {formatCurrency(stats.monthlyRevenue)}
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-white/60 transition-colors">
            <span>Skýrslur</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
        <Link href="/bilar" className="group bg-[#161822] rounded-xl border border-white/5 p-5 hover:bg-white/5 transition-colors block">
          <div className="text-xs font-medium text-white/40 mb-2">Flotasamningar</div>
          <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
            {stats.fleetCount}
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-white/60 transition-colors">
            <span>Bílar</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
        <Link href="/vidskiptavinir" className="group bg-[#161822] rounded-xl border border-white/5 p-5 hover:bg-white/5 transition-colors block">
          <div className="text-xs font-medium text-white/40 mb-2">Langtímasamningar</div>
          <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
            {stats.longTermCount}
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-white/60 transition-colors">
            <span>Viðskiptavinir</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Leita í samningum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 w-64 rounded-lg bg-[#161822] border border-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
          {(['allir', 'langtimaleiga', 'flotaleiga'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTegundFilter(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tegundFilter === t
                  ? 'bg-blue-600/30 text-blue-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'allir' ? 'Allir' : t === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
          {(['allir', 'virkir', 'rennur_ut', 'lokid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600/30 text-blue-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'allir' ? 'Allir' : s === 'virkir' ? 'Virkir' : s === 'rennur_ut' ? 'Renna út' : 'Lokið'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Samningar</h2>
              {(searchQuery || tegundFilter !== 'allir' || statusFilter !== 'allir') && (
                <span className="text-xs text-white/40">
                  {filteredSamningar.length} af {samningarList.length}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Fyrirtæki</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Tegund</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Bíll</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Dagsetningar</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Mánaðarkostnaður</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Staða</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Dagar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSamningar.map((s) => {
                    const f = getFyrirtaeki(s.fyrirtaekiId);
                    const dagar = getDaysRemaining(s.lokadagur);
                    return (
                      <tr key={s.id} onClick={() => setSelectedSamningur(s)} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {s.status === 'rennur_ut' && (
                              <span className="text-amber-400" title="Rennur út bráðum">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                            <span className="text-sm font-medium text-white">{f?.nafn ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: s.tegund === 'flotaleiga' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
                              color: s.tegund === 'flotaleiga' ? '#a78bfa' : '#60a5fa',
                            }}
                          >
                            {s.tegund === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm text-white/90">{s.bilategund}</div>
                          <div className="text-xs text-white/40">{s.bilanumer}</div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-white/70">
                          {s.upphafsdagur} – {s.lokadagur}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-white">
                          {formatCurrency(s.manadalegurKostnadur)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: getStatusBg(s.status),
                              color: getStatusColor(s.status),
                            }}
                          >
                            {statusLabels[s.status] ?? s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {dagar !== null && s.status !== 'lokid' && s.status !== 'uppsagt' ? (
                            <span
                              className={`text-xs font-medium ${
                                dagar <= 0 ? 'text-white/40' : dagar <= 14 ? 'text-red-400' : 'text-amber-400'
                              }`}
                            >
                              {dagar <= 0 ? '—' : `${dagar} dagar`}
                            </span>
                          ) : (
                            <span className="text-xs text-white/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredSamningar.length === 0 && (
              <div className="px-5 py-12 text-center">
                <div className="text-sm text-white/30">Engir samningar fundust</div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Hreinsa leit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Verkefni tengd samningum sem renna út innan 30 daga
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {verkefniBradlega.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-white/30">
                  Engin verkefni tengd samningum sem renna út bráðum
                </div>
              ) : (
                verkefniBradlega.map((v) => (
                  <div key={v.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-2">
                      {v.sjálfvirkt && (
                        <svg
                          className="w-4 h-4 text-blue-400 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 font-medium">{v.titill}</div>
                        <div className="text-xs text-white/40 mt-0.5">{v.lýsing}</div>
                        <span
                          className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: getStatusBg(v.status),
                            color: getStatusColor(v.status),
                          }}
                        >
                          {v.status === 'opið' ? 'Opna' : v.status === 'í gangi' ? 'Í gangi' : 'Lokið'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedSamningur && (
        <SamningurDetail
          samningur={selectedSamningur}
          onClose={() => setSelectedSamningur(null)}
          onUpdate={(updated) => {
            setSamningarList(prev => prev.map(s => s.id === updated.id ? updated : s));
            setSelectedSamningur(updated);
          }}
        />
      )}
    </div>
  );
}

function addMonthsToDate(from: string, months: number): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function SamningurDetail({ samningur, onClose, onUpdate }: { samningur: Samningur; onClose: () => void; onUpdate: (s: Samningur) => void }) {
  const f = getFyrirtaeki(samningur.fyrirtaekiId);
  const skjol = samningsSkjol.filter(s => s.samningurId === samningur.id);
  const dagar = getDaysRemaining(samningur.lokadagur);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; date: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'upplysingar' | 'skjol' | 'stjornun'>('upplysingar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionModal, setActionModal] = useState<'none' | 'endurnyja' | 'breyta' | 'senda' | 'uppsogn'>('none');
  const [localToast, setLocalToast] = useState<string | null>(null);
  const [extraTimeline, setExtraTimeline] = useState<{ date: string; text: string; color: string }[]>([]);

  const [renewMonths, setRenewMonths] = useState(12);
  const [editKostnadur, setEditKostnadur] = useState(samningur.manadalegurKostnadur);
  const [editAkstur, setEditAkstur] = useState(samningur.aksturKmManudir);
  const [editTrygging, setEditTrygging] = useState<'Enterprise' | 'Plús' | 'Úrvals'>(samningur.tryggingarPakki);
  const [emailSubject, setEmailSubject] = useState(`Samningur ${samningur.bilanumer} - ${samningur.bilategund}`);
  const [emailBody, setEmailBody] = useState('');
  const [uppsognReason, setUppsognReason] = useState('');
  const [uppsognNotes, setUppsognNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const tengiliður = f?.tengiliðir?.find(t => t.aðaltengiliður) ?? f?.tengiliðir?.[0];

  const showLocalToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 3000);
  };

  function handleRenew() {
    const newDate = addMonthsToDate(samningur.lokadagur, renewMonths);
    onUpdate({ ...samningur, lokadagur: newDate, status: 'virkur' });
    setExtraTimeline(prev => [...prev, { date: today, text: `Samningur endurnýjaður um ${renewMonths} mánuði`, color: '#22c55e' }]);
    setActionModal('none');
    showLocalToast('Samningur endurnýjaður');
  }

  function handleEditTerms() {
    onUpdate({ ...samningur, manadalegurKostnadur: editKostnadur, aksturKmManudir: editAkstur, tryggingarPakki: editTrygging });
    setExtraTimeline(prev => [...prev, { date: today, text: 'Samningsskilmálum breytt', color: '#3b82f6' }]);
    setActionModal('none');
    showLocalToast('Skilmálar uppfærðir');
  }

  function handleSendEmail() {
    setExtraTimeline(prev => [...prev, { date: today, text: `Tilkynning send á ${f?.nafn ?? 'viðskiptavin'}`, color: '#f59e0b' }]);
    setActionModal('none');
    setEmailBody('');
    showLocalToast('Tilkynning send');
  }

  function handleTerminate() {
    onUpdate({ ...samningur, status: 'uppsagt' });
    setExtraTimeline(prev => [...prev, { date: today, text: `Samningi sagt upp: ${uppsognReason}`, color: '#ef4444' }]);
    setActionModal('none');
    showLocalToast('Samningi sagt upp');
  }

  const tengdVerkefni = verkefni.filter(v => v.samningurId === samningur.id);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      size: f.size < 1024 * 1024 ? `${Math.round(f.size / 1024)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      date: new Date().toISOString().split('T')[0],
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const totalTekjur = samningur.manadalegurKostnadur * Math.max(1, Math.ceil(
    (new Date(samningur.lokadagur).getTime() - new Date(samningur.upphafsdagur).getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-full overflow-y-auto bg-[#161822] rounded-2xl border border-white/10 shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#161822] border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">{samningur.bilategund}</h2>
              <span
                className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: getStatusBg(samningur.status), color: getStatusColor(samningur.status) }}
              >
                {samningur.status === 'virkur' ? 'Virkur' : samningur.status === 'rennur_ut' ? 'Rennur út' : samningur.status === 'lokid' ? 'Lokið' : 'Uppsagt'}
              </span>
            </div>
            <div className="text-sm text-white/40 mt-0.5">{f?.nafn} · {samningur.bilanumer}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-1 border-b border-white/5">
          {([
            { key: 'upplysingar' as const, label: 'Upplýsingar' },
            { key: 'skjol' as const, label: 'Skjöl' },
            { key: 'stjornun' as const, label: 'Samningsstjórnun' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'upplysingar' && (
            <div className="space-y-6">
              {/* Status banner */}
              {samningur.status === 'rennur_ut' && dagar !== null && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <svg className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-amber-400">Samningur rennur út eftir {dagar} daga</div>
                    <div className="text-xs text-amber-400/60 mt-0.5">Lokadagur: {samningur.lokadagur}</div>
                  </div>
                </div>
              )}

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoBox label="Tegund" value={samningur.tegund === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'} />
                <InfoBox label="Tryggingapakki" value={samningur.tryggingarPakki} />
                <InfoBox label="Upphafsdagur" value={samningur.upphafsdagur} />
                <InfoBox label="Lokadagur" value={samningur.lokadagur} />
                <InfoBox label="Mánaðarkostnaður" value={formatCurrency(samningur.manadalegurKostnadur)} accent="#22c55e" />
                <InfoBox label="Heildarverðmæti samnings" value={formatCurrency(totalTekjur)} accent="#3b82f6" />
                <InfoBox label="Umsaminn akstur" value={`${samningur.aksturKmManudir.toLocaleString('is-IS')} km/mán`} />
                <InfoBox label="Bílnúmer" value={samningur.bilanumer} />
              </div>

              {samningur.athugasemdir && (
                <div className="bg-white/5 rounded-lg px-4 py-3">
                  <div className="text-xs font-medium text-white/40 mb-1">Athugasemdir</div>
                  <div className="text-sm text-white/80">{samningur.athugasemdir}</div>
                </div>
              )}

              {/* Innifalið */}
              <div>
                <div className="text-xs font-medium text-white/40 mb-2">Innifalið í leigu</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {innifaliðILeigu.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                      <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tengd verkefni */}
              {tengdVerkefni.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-white/40 mb-2">Tengd verkefni</div>
                  <div className="space-y-2">
                    {tengdVerkefni.map(v => (
                      <div key={v.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(v.status) }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/80 truncate">{v.titill}</div>
                          <div className="text-xs text-white/40">{v.abyrgdaradili}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skjol' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">Samningsskjöl</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Hlaða upp skjali
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" multiple onChange={handleFileUpload} />
              </div>

              {/* Existing docs */}
              {skjol.length > 0 && (
                <div className="space-y-2">
                  {skjol.map(sk => (
                    <FileRow key={sk.id} name={sk.nafn} type={sk.tegund} date={sk.dagsett} size={sk.staerd} source="Taktikal" />
                  ))}
                </div>
              )}

              {/* Uploaded docs */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-white/40">Nýlega hlaðið upp</div>
                  {uploadedFiles.map((f, i) => (
                    <FileRow key={i} name={f.name} type="annað" date={f.date} size={f.size} source="Hlaðið upp" isNew />
                  ))}
                </div>
              )}

              {skjol.length === 0 && uploadedFiles.length === 0 && (
                <div className="text-center py-10">
                  <svg className="w-10 h-10 text-white/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-white/30">Engin skjöl skráð</div>
                  <div className="text-xs text-white/20 mt-1">Hladdu upp samningsskjölum frá Taktikal eða úr tölvunni</div>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <div>
                  <div className="text-xs font-medium text-white/60">Taktikal tenging</div>
                  <div className="text-xs text-white/40 mt-0.5">Hægt er að hlaða upp samningsskjölum beint úr Taktikal kerfinu. Skjölin vistast í skjalavistunarkerfi Enterprise.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stjornun' && (
            <div className="space-y-5">
              {/* Status overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-white/40 mb-1">Staða</div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: getStatusBg(samningur.status), color: getStatusColor(samningur.status) }}>
                    {samningur.status === 'virkur' ? 'Virkur' : samningur.status === 'rennur_ut' ? 'Rennur út' : samningur.status === 'lokid' ? 'Lokið' : 'Uppsagt'}
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-white/40 mb-1">Dagar eftir</div>
                  <div className={`text-lg font-bold ${dagar !== null && dagar <= 30 ? 'text-amber-400' : 'text-white'}`}>
                    {dagar !== null && dagar > 0 ? dagar : '—'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-white/40 mb-1">Skjöl</div>
                  <div className="text-lg font-bold text-white">{skjol.length + uploadedFiles.length}</div>
                </div>
              </div>

              {actionModal === 'none' ? (
                <>
                  {/* Actions */}
                  <div>
                    <div className="text-xs font-medium text-white/40 mb-3">Aðgerðir</div>
                    <div className="space-y-2">
                      <ActionButton
                        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        label="Endurnýja samning"
                        description="Framlengja eða endurnýja samningsskilmála"
                        color="#22c55e"
                        onClick={() => setActionModal('endurnyja')}
                      />
                      <ActionButton
                        icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        label="Breyta samningsskilmálum"
                        description="Uppfæra akstur, tryggingar eða önnur skilyrði"
                        color="#3b82f6"
                        onClick={() => { setEditKostnadur(samningur.manadalegurKostnadur); setEditAkstur(samningur.aksturKmManudir); setEditTrygging(samningur.tryggingarPakki); setActionModal('breyta'); }}
                      />
                      <ActionButton
                        icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        label="Hlaða upp úr Taktikal"
                        description="Sækja samningsskjöl úr Taktikal kerfinu"
                        color="#8b5cf6"
                        onClick={() => setActiveTab('skjol')}
                      />
                      <ActionButton
                        icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        label="Senda tilkynningu á viðskiptavin"
                        description={`Senda tölvupóst á ${f?.nafn ?? 'viðskiptavin'}`}
                        color="#f59e0b"
                        onClick={() => setActionModal('senda')}
                      />
                      {samningur.status !== 'lokid' && samningur.status !== 'uppsagt' && (
                        <ActionButton
                          icon="M6 18L18 6M6 6l12 12"
                          label="Segja upp samningi"
                          description="Hefja uppsagnarferli á samningi"
                          color="#ef4444"
                          onClick={() => { setUppsognReason(''); setUppsognNotes(''); setActionModal('uppsogn'); }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Timeline / log */}
                  <div>
                    <div className="text-xs font-medium text-white/40 mb-3">Saga samnings</div>
                    <div className="space-y-0 border-l-2 border-white/5 ml-2">
                      <TimelineItem date={samningur.upphafsdagur} text="Samningur undirritaður" color="#22c55e" />
                      {samningur.athugasemdir && (
                        <TimelineItem date="" text={samningur.athugasemdir} color="#3b82f6" />
                      )}
                      {extraTimeline.map((t, i) => (
                        <TimelineItem key={i} date={t.date} text={t.text} color={t.color} />
                      ))}
                      {samningur.status === 'rennur_ut' && (
                        <TimelineItem date={samningur.lokadagur} text="Samningur rennur út" color="#f59e0b" upcoming />
                      )}
                    </div>
                  </div>
                </>
              ) : actionModal === 'endurnyja' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Endurnýja samning</h3>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Núverandi lokadagur</span>
                      <span className="text-white/80">{samningur.lokadagur}</span>
                    </div>

                    <div>
                      <label className="text-xs text-white/40 mb-2 block">Framlengja um</label>
                      <div className="flex gap-2">
                        {[6, 12, 24, 36].map(m => (
                          <button
                            key={m}
                            onClick={() => setRenewMonths(m)}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              renewMonths === m
                                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                            }`}
                          >
                            {m} mán
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs pt-3 border-t border-white/5">
                      <span className="text-white/40">Nýr lokadagur</span>
                      <span className="text-green-400 font-semibold">{addMonthsToDate(samningur.lokadagur, renewMonths)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Áætlaðar tekjur</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(samningur.manadalegurKostnadur * renewMonths)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleRenew}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Staðfesta endurnýjun
                  </button>
                </div>
              ) : actionModal === 'breyta' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Breyta samningsskilmálum</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Mánaðarkostnaður (kr.)</label>
                      <input
                        type="number"
                        value={editKostnadur}
                        onChange={(e) => setEditKostnadur(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Akstur (km/mán)</label>
                      <input
                        type="number"
                        value={editAkstur}
                        onChange={(e) => setEditAkstur(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Tryggingapakki</label>
                      <select
                        value={editTrygging}
                        onChange={(e) => setEditTrygging(e.target.value as 'Enterprise' | 'Plús' | 'Úrvals')}
                        className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="Enterprise" style={{ background: '#1a1d2e', color: '#ffffff' }}>Enterprise</option>
                        <option value="Plús" style={{ background: '#1a1d2e', color: '#ffffff' }}>Plús</option>
                        <option value="Úrvals" style={{ background: '#1a1d2e', color: '#ffffff' }}>Úrvals</option>
                      </select>
                    </div>
                  </div>

                  {(editKostnadur !== samningur.manadalegurKostnadur || editAkstur !== samningur.aksturKmManudir || editTrygging !== samningur.tryggingarPakki) && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1">
                      <div className="text-xs font-medium text-blue-400">Breytingar</div>
                      {editKostnadur !== samningur.manadalegurKostnadur && (
                        <div className="text-xs text-blue-400/70">Kostnaður: {formatCurrency(samningur.manadalegurKostnadur)} → {formatCurrency(editKostnadur)}</div>
                      )}
                      {editAkstur !== samningur.aksturKmManudir && (
                        <div className="text-xs text-blue-400/70">Akstur: {samningur.aksturKmManudir.toLocaleString('is-IS')} → {editAkstur.toLocaleString('is-IS')} km/mán</div>
                      )}
                      {editTrygging !== samningur.tryggingarPakki && (
                        <div className="text-xs text-blue-400/70">Trygging: {samningur.tryggingarPakki} → {editTrygging}</div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionModal('none')}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors"
                    >
                      Hætta við
                    </button>
                    <button
                      onClick={handleEditTerms}
                      disabled={editKostnadur === samningur.manadalegurKostnadur && editAkstur === samningur.aksturKmManudir && editTrygging === samningur.tryggingarPakki}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Vista breytingar
                    </button>
                  </div>
                </div>
              ) : actionModal === 'senda' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Senda tilkynningu</h3>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-white/80 font-medium">{tengiliður?.nafn ?? f?.nafn}</div>
                      <div className="text-xs text-white/40">{tengiliður?.netfang ?? `${f?.nafn?.toLowerCase().replace(/ /g, '')}@fyrirtaeki.is`}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Sniðmát</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'renewal', label: 'Endurnýjun', text: `Kæri viðskiptavinur,\n\nSamningur um ${samningur.bilategund} (${samningur.bilanumer}) rennur út ${samningur.lokadagur}. Við viljum bjóða ykkur að endurnýja samninginn á hagstæðum kjörum.\n\nEndilega hafið samband við okkur til að ræða möguleikana.\n\nBestu kveðjur,\nEnterprise bílaútleiga` },
                        { id: 'payment', label: 'Greiðsla', text: `Kæri viðskiptavinur,\n\nHér með er send áminning um greiðslu samnings um ${samningur.bilategund} (${samningur.bilanumer}). Mánaðarleg greiðsla er ${formatCurrency(samningur.manadalegurKostnadur)}.\n\nVinsamlegast sjáið til þess að greiðsla berist sem allra fyrst.\n\nBestu kveðjur,\nEnterprise bílaútleiga` },
                        { id: 'info', label: 'Upplýsingar', text: `Kæri viðskiptavinur,\n\nHér eru upplýsingar varðandi samning ykkar um ${samningur.bilategund} (${samningur.bilanumer}).\n\n` },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setEmailBody(t.text); }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors border border-white/5"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Efni</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Skilaboð</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={6}
                      placeholder="Skrifaðu skilaboð eða veldu sniðmát..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSendEmail}
                    disabled={!emailBody.trim()}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Senda tilkynningu
                  </button>
                </div>
              ) : actionModal === 'uppsogn' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActionModal('none')} className="text-white/40 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-sm font-semibold text-white">Segja upp samningi</h3>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-red-400">Þessi aðgerð er ekki afturkræf</div>
                      <div className="text-xs text-red-400/60 mt-0.5">Samningurinn verður merktur sem uppsagður og ekki er hægt að endurheimta hann.</div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/40">Samningur</span><span className="text-white/80">{samningur.bilategund} · {samningur.bilanumer}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Viðskiptavinur</span><span className="text-white/80">{f?.nafn}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Mánaðarkostnaður</span><span className="text-white/80">{formatCurrency(samningur.manadalegurKostnadur)}</span></div>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Ástæða uppsagnar</label>
                    <select
                      value={uppsognReason}
                      onChange={(e) => setUppsognReason(e.target.value)}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" style={{ background: '#1a1d2e', color: '#ffffff' }}>Veldu ástæðu...</option>
                      <option value="Vanefndir viðskiptavinar" style={{ background: '#1a1d2e', color: '#ffffff' }}>Vanefndir viðskiptavinar</option>
                      <option value="Samkomulag aðila" style={{ background: '#1a1d2e', color: '#ffffff' }}>Samkomulag aðila</option>
                      <option value="Samningur runninn út" style={{ background: '#1a1d2e', color: '#ffffff' }}>Samningur runninn út</option>
                      <option value="Viðskiptavinur óskar eftir uppsögn" style={{ background: '#1a1d2e', color: '#ffffff' }}>Viðskiptavinur óskar eftir uppsögn</option>
                      <option value="Annað" style={{ background: '#1a1d2e', color: '#ffffff' }}>Annað</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Athugasemdir (valkvætt)</label>
                    <textarea
                      value={uppsognNotes}
                      onChange={(e) => setUppsognNotes(e.target.value)}
                      rows={3}
                      placeholder="Frekari athugasemdir..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionModal('none')}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors"
                    >
                      Hætta við
                    </button>
                    <button
                      onClick={handleTerminate}
                      disabled={!uppsognReason}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Segja upp samningi
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {localToast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#1a1d2e] border border-white/10 text-white text-sm px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {localToast}
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-4 py-3">
      <div className="text-[10px] font-medium text-white/40 mb-1">{label}</div>
      <div className="text-sm font-semibold" style={{ color: accent || undefined }}>
        <span className={accent ? '' : 'text-white/90'}>{value}</span>
      </div>
    </div>
  );
}

function FileRow({ name, type, date, size, source, isNew }: {
  name: string; type: string; date: string; size: string; source?: string; isNew?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/[0.07] transition-colors">
      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/80 truncate">{name}</div>
        <div className="text-xs text-white/40">{date} · {size}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {source && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isNew ? 'bg-green-500/15 text-green-400' : 'bg-purple-500/15 text-purple-400'}`}>
            {source}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/5 text-white/40 capitalize">{type}</span>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, description, color, onClick }: {
  icon: string; label: string; description: string; color: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/[0.07] transition-colors text-left group"
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
        <svg className="w-4.5 h-4.5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function TimelineItem({ date, text, color, upcoming }: { date: string; text: string; color: string; upcoming?: boolean }) {
  return (
    <div className="flex items-start gap-3 pl-4 py-2 relative">
      <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2 h-2 rounded-full border-2" style={{ borderColor: color, backgroundColor: upcoming ? 'transparent' : color }} />
      <div className="flex-1">
        <div className={`text-sm ${upcoming ? 'text-white/50 italic' : 'text-white/70'}`}>{text}</div>
        {date && <div className="text-xs text-white/30 mt-0.5">{date}</div>}
      </div>
    </div>
  );
}
