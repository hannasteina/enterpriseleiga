'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  bilar as initialBilar,
  samningar,
  getFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  getVirktThjonustuverk,
  virktThjonustuverk,
  type Bill,
  type BilaFlokkur,
  type VirktThjonustuverk,
  thpilaFlokkar,
  thpilaFlokkaLitir,
} from '@/lib/enterprise-demo-data';
import BilPanel from '@/components/BilPanel';
import NyBilModal from '@/components/NyBilModal';
import SetjaIThjonustuModal from '@/components/SetjaIThjonustuModal';
import ImageLightbox, { CarPlaceholderIcon } from '@/components/ImageLightbox';

type StatusFilter = 'allir' | 'í leigu' | 'laus' | 'í þjónustu' | 'skil_væntanleg';

const statusLabels: Record<string, string> = {
  'í leigu': 'Í útleigu',
  'laus': 'Laus',
  'í þjónustu': 'Í þjónustu',
  'uppseldur': 'Uppseldur',
};

function getDaysUntilExpiry(samningurId: string | null): number | null {
  if (!samningurId) return null;
  const samningur = samningar.find(s => s.id === samningurId);
  if (!samningur) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loka = new Date(samningur.lokadagur);
  loka.setHours(0, 0, 0, 0);
  const diff = Math.ceil((loka.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function BilarPage() {
  const [bilarList, setBilarList] = useState<Bill[]>([...initialBilar]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('allir');
  const [flokkurFilter, setFlokkurFilter] = useState<BilaFlokkur | 'allir'>('allir');
  const [search, setSearch] = useState('');
  const [selectedCar, setSelectedCar] = useState<Bill | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [thjonustuBill, setThjonustuBill] = useState<Bill | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const filteredBilar = useMemo(() => {
    return bilarList.filter((b) => {
      const statusMatch =
        statusFilter === 'allir' ||
        (statusFilter === 'í leigu' && b.status === 'í leigu') ||
        (statusFilter === 'laus' && b.status === 'laus') ||
        (statusFilter === 'í þjónustu' && b.status === 'í þjónustu') ||
        (statusFilter === 'skil_væntanleg' && b.samningurId && getDaysUntilExpiry(b.samningurId) !== null && getDaysUntilExpiry(b.samningurId)! <= 30 && getDaysUntilExpiry(b.samningurId)! > 0);

      const flokkurMatch = flokkurFilter === 'allir' || b.bilaFlokkur === flokkurFilter;

      const searchLower = search.trim().toLowerCase();
      const searchMatch =
        !searchLower ||
        b.numer.toLowerCase().includes(searchLower) ||
        b.tegund.toLowerCase().includes(searchLower) ||
        (b.fyrirtaekiId && getFyrirtaeki(b.fyrirtaekiId)?.nafn.toLowerCase().includes(searchLower)) ||
        (b.samningurId && b.samningurId.toLowerCase().includes(searchLower));

      return statusMatch && flokkurMatch && searchMatch;
    });
  }, [bilarList, statusFilter, flokkurFilter, search]);

  const stats = useMemo(() => {
    const total = bilarList.length;
    const iLeigu = bilarList.filter(b => b.status === 'í leigu').length;
    const lausir = bilarList.filter(b => b.status === 'laus').length;
    const iThjonustu = bilarList.filter(b => b.status === 'í þjónustu').length;
    const skilVaentanleg = bilarList.filter(b => {
      const d = getDaysUntilExpiry(b.samningurId);
      return d !== null && d > 0 && d <= 30;
    }).length;
    return { total, iLeigu, lausir, iThjonustu, skilVaentanleg };
  }, [bilarList]);

  function handleAddCar(newBill: Bill) {
    setBilarList((prev) => [newBill, ...prev]);
    setShowAddModal(false);
    showToast('Nýr bíll skráður');
  }

  function handleSetjaIThjonustu(verk: Omit<VirktThjonustuverk, 'id'>) {
    const newVerk: VirktThjonustuverk = { ...verk, id: `vt-${Date.now()}` };
    virktThjonustuverk.push(newVerk);
    setBilarList(prev => prev.map(b => b.id === verk.billId ? { ...b, status: 'í þjónustu' as const } : b));
    setThjonustuBill(null);
    showToast(`${bilarList.find(b => b.id === verk.billId)?.numer} sett í þjónustu`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bílar</h1>
          <p className="text-sm text-white/40 mt-1">
            Flotastjórnun – Yfirlit yfir allan bílaflotann
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Bæta við bíl
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('allir')}
          className={`group text-left rounded-xl border p-5 transition-all ${
            statusFilter === 'allir'
              ? 'bg-white/[0.06] border-white/15 ring-1 ring-white/10'
              : 'bg-[#161822] border-white/5 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/40">Heildarfjöldi bíla</div>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-white/60 transition-colors">
            <span>Sýna alla bíla</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('í leigu')}
          className={`group text-left rounded-xl border p-5 transition-all ${
            statusFilter === 'í leigu'
              ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
              : 'bg-[#161822] border-white/5 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/40">Í útleigu</div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
            {stats.iLeigu}
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-blue-400/60 transition-colors">
            {stats.skilVaentanleg > 0 ? (
              <span className="text-amber-400/70">{stats.skilVaentanleg} skil næstu 30 daga</span>
            ) : (
              <span>Sía eftir útleigu</span>
            )}
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('laus')}
          className={`group text-left rounded-xl border p-5 transition-all ${
            statusFilter === 'laus'
              ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20'
              : 'bg-[#161822] border-white/5 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/40">Lausir</div>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {stats.lausir}
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-green-400/60 transition-colors">
            <span>Tilbúnir til útleigu</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('í þjónustu')}
          className={`group text-left rounded-xl border p-5 transition-all ${
            statusFilter === 'í þjónustu'
              ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
              : 'bg-[#161822] border-white/5 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/40">Í þjónustu</div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.183A1.25 1.25 0 014.5 17.18V6.82a1.25 1.25 0 011.536-1.173l5.384 3.183m0 0a1.125 1.125 0 010 2.346m0-2.346a1.125 1.125 0 000 2.346m5.06-9.283A9.75 9.75 0 0121.75 12c0 1.875-.527 3.627-1.44 5.117" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
            {stats.iThjonustu}
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] font-medium text-white/30 group-hover:text-amber-400/60 transition-colors">
            <span>Skoða viðhaldsstöðu</span>
            <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Status filter */}
          <div>
            <div className="text-xs font-semibold text-white/50 mb-1.5 ml-1 uppercase tracking-wider">Staða</div>
            <div className="flex rounded-lg border border-white/5 overflow-hidden bg-[#161822]">
              {(['allir', 'í leigu', 'laus', 'í þjónustu', 'skil_væntanleg'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600/30 text-blue-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s === 'allir' ? 'Allir' : s === 'skil_væntanleg' ? 'Skil væntanleg' : statusLabels[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="text-xs font-semibold text-white/50 mb-1.5 ml-1 uppercase tracking-wider">Leit</div>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Bílnúmer, tegund, viðskiptavinur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#161822] border border-white/5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Flokkur filter pills */}
        <div>
          <div className="text-xs font-semibold text-white/50 mb-1.5 ml-1 uppercase tracking-wider">Flokkur</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFlokkurFilter('allir')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                flokkurFilter === 'allir'
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                  : 'bg-[#161822] text-white/60 border border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              Allir flokkar
            </button>
            {thpilaFlokkar.map((flokkur) => {
              const count = bilarList.filter(b => b.bilaFlokkur === flokkur).length;
              return (
                <button
                  key={flokkur}
                  onClick={() => setFlokkurFilter(flokkur)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${
                    flokkurFilter === flokkur
                      ? 'text-white'
                      : 'bg-[#161822] text-white/60 hover:text-white border-white/5 hover:bg-white/5'
                  }`}
                  style={flokkurFilter === flokkur ? {
                    backgroundColor: thpilaFlokkaLitir[flokkur] + '30',
                    borderColor: thpilaFlokkaLitir[flokkur] + '50',
                  } : undefined}
                >
                  {flokkur} <span className="text-white/30 ml-1">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Bílar
            <span className="text-white/30 font-normal ml-2">
              {filteredBilar.length} af {bilarList.length}
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 w-16">Mynd</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Bílnúmer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Tegund</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Flokkur</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Staða</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Fyrirtæki</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Akstur</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Verð/mán</th>
              </tr>
            </thead>
            <tbody>
              {filteredBilar.map((b) => {
                const fyrirtaekiData = b.fyrirtaekiId ? getFyrirtaeki(b.fyrirtaekiId) : null;
                const flokkurLitur = thpilaFlokkaLitir[b.bilaFlokkur] || '#6b7280';
                const daysUntilExpiry = getDaysUntilExpiry(b.samningurId);

                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedCar(b)}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group/row"
                  >
                    <td className="px-5 py-2.5">
                      {b.imageUrl ? (
                        <ImageLightbox
                          src={b.imageUrl}
                          alt={`${b.tegund} ${b.arsgerð}`}
                          thumbnailClassName="w-14 h-10 object-cover rounded-md"
                          thumbnailWidth={56}
                          thumbnailHeight={40}
                        />
                      ) : (
                        <CarPlaceholderIcon className="w-14 h-10" />
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/bilar/${b.id}`}
                        className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {b.numer}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-white/90">{b.tegund}</div>
                      <div className="text-xs text-white/40">{b.arsgerð} • {b.litur} • {b.skiptigerð}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: flokkurLitur + '20',
                          color: flokkurLitur,
                        }}
                      >
                        {b.bilaFlokkur}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {b.status === 'í þjónustu' ? (() => {
                          const verk = getVirktThjonustuverk(b.id);
                          return (
                            <div className="group relative">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium cursor-help"
                                style={{ backgroundColor: getStatusBg(b.status), color: getStatusColor(b.status) }}
                              >
                                {statusLabels[b.status]}
                              </span>
                              {verk && (
                                <div className="absolute bottom-full left-0 mb-2 w-56 p-3 rounded-lg bg-[#1a1d2e] border border-white/10 shadow-xl text-xs invisible group-hover:visible z-30">
                                  <div className="text-white/80 font-medium mb-1 capitalize">{verk.tegund}</div>
                                  <div className="text-white/50">{verk.stadur}</div>
                                  <div className="text-white/40 mt-1">Skil: {verk.aaetladurSkiladagur}</div>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: getStatusBg(b.status), color: getStatusColor(b.status) }}
                          >
                            {statusLabels[b.status] || b.status}
                          </span>
                        )}
                        {b.status === 'laus' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setThjonustuBill(b); }}
                            className="p-1 rounded-md opacity-0 group-hover/row:opacity-100 hover:bg-amber-500/15 text-white/30 hover:text-amber-400 transition-all"
                            title="Setja í þjónustu"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.183A1.25 1.25 0 014.5 17.18V6.82a1.25 1.25 0 011.536-1.173l5.384 3.183m0 0a1.125 1.125 0 010 2.346m0-2.346a1.125 1.125 0 000 2.346m5.06-9.283A9.75 9.75 0 0121.75 12c0 1.875-.527 3.627-1.44 5.117" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {fyrirtaekiData ? (
                        <Link
                          href={`/vidskiptavinir/${b.fyrirtaekiId}`}
                          className="text-sm text-white/90 hover:text-blue-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {fyrirtaekiData.nafn}
                        </Link>
                      ) : (
                        <span className="text-sm text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white/70">
                      {b.ekinkm.toLocaleString('is-IS')} km
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-white/70">{formatCurrency(b.verdFra)}</div>
                      {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                        <div className="text-xs text-amber-400 mt-0.5">
                          Skil eftir {daysUntilExpiry} daga
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBilar.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-white/30">
            Engir bílar fundust með þessum leitarskilyrðum.
          </div>
        )}
      </div>

      {selectedCar && (
        <BilPanel car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}

      {showAddModal && (
        <NyBilModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCar}
        />
      )}

      {thjonustuBill && (
        <SetjaIThjonustuModal
          bill={thjonustuBill}
          onClose={() => setThjonustuBill(null)}
          onSubmit={handleSetjaIThjonustu}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1d2e] border border-white/10 text-white text-sm px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
