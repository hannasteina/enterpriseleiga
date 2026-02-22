'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  samningar,
  bilar,
  mal,
  solutaekifaeri,
  verkefni,
  thjonustuaminningar,
  samningsSkjol,
  getFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  type Tengiliður,
  type Mal,
} from '@/lib/enterprise-demo-data';
import TengilidurPanel from '@/components/TengilidurPanel';
import VerkefniDetailModal from '@/components/VerkefniDetailModal';
import { useVerkefniStore } from '@/lib/verkefni-store';
import MalModal from '@/components/MalModal';

const SVID_META: Record<string, { label: string; color: string }> = {
  langtimaleiga: { label: 'Langtímaleiga', color: '#3b82f6' },
  flotaleiga: { label: 'Flotaleiga', color: '#8b5cf6' },
};

const PIPI_META: Record<string, { label: string; icon: string }> = {
  floti: { label: 'Floti', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  vinnuferdir: { label: 'Vinnuferðir', icon: 'M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64' },
  sendibilar: { label: 'Sendibílar', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  serpantanir: { label: 'Sérpantanir', icon: 'M11.42 15.17l-5.1-2.66a1 1 0 010-1.76l5.1-2.66a1 1 0 01.84 0l5.1 2.66a1 1 0 010 1.76l-5.1 2.66a1 1 0 01-.84 0zM3.84 12.25l5.1 2.66a1 1 0 00.84 0l5.1-2.66' },
  langtimaleiga: { label: 'Langtímaleiga', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const STATUS_LABELS: Record<string, string> = {
  virkur: 'Virkur',
  rennur_ut: 'Rennur út',
  lokid: 'Lokið',
  uppsagt: 'Uppsagt',
};

function formatDateShort(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('is-IS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysRemaining(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function contractProgress(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function FyrirtaekiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const fyrirtaekiData = useMemo(() => (id ? getFyrirtaeki(id) : null), [id]);

  const [tengilidir, setTengilidir] = useState<Tengiliður[]>(fyrirtaekiData?.tengiliðir ?? []);
  const [selectedTengilidur, setSelectedTengilidur] = useState<Tengiliður | null>(null);
  const [selectedVerkefniId, setSelectedVerkefniId] = useState<string | null>(null);
  const [selectedMal, setSelectedMal] = useState<Mal | null>(null);
  const [malList, setMalList] = useState<Mal[]>(mal);

  const verkefniStore = useVerkefniStore();
  const currentUser = 'Kristján';

  const handleSendNotification = useCallback(async (verkefniId: string, tilNotandaId: string, skilabod: string) => {
    const v = verkefniStore.getVerkefniById(verkefniId);
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verkefniTitill: v?.titill ?? '', tilNotandaId, fraNafn: currentUser, skilabod }),
      });
    } catch { /* silent */ }
  }, [verkefniStore, currentUser]);

  const handleMalSave = useCallback((updated: Mal) => {
    setMalList(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelectedMal(null);
  }, []);

  function handleSaveTengilidur(updated: Tengiliður) {
    setTengilidir(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    setSelectedTengilidur(updated);
  }

  if (!id || !fyrirtaekiData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#161822] rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Fyrirtæki fannst ekki</h2>
          <p className="text-white/50 mt-2 text-sm">Engin skrá fannst með þessu auðkenni.</p>
          <Link href="/vidskiptavinir" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors">
            ← Til baka
          </Link>
        </div>
      </div>
    );
  }

  const companyBilar = bilar.filter(b => b.fyrirtaekiId === id);
  const companySamningar = samningar.filter(s => s.fyrirtaekiId === id);
  const companyMal = malList.filter(m => m.fyrirtaekiId === id);
  const openMal = companyMal.filter(m => m.status !== 'lokað');
  const companySolutaekifaeri = solutaekifaeri.filter(s => s.fyrirtaekiId === id);
  const activeSolutaekifaeri = companySolutaekifaeri.filter(s => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið');
  const companyVerkefni = verkefni.filter(v => v.fyrirtaekiId === id);
  const activeVerkefni = companyVerkefni.filter(v => v.status !== 'lokið');
  const virkirSamningar = companySamningar.filter(s => s.status === 'virkur' || s.status === 'rennur_ut');
  const totalManadlegur = virkirSamningar.reduce((sum, s) => sum + s.manadalegurKostnadur, 0);
  const selectedVerkefni = selectedVerkefniId ? verkefniStore.getVerkefniById(selectedVerkefniId) ?? null : null;
  const companyThjonustur = thjonustuaminningar.filter(t => {
    const bill = bilar.find(b => b.id === t.billId);
    return bill?.fyrirtaekiId === id && t.status !== 'lokið';
  });

  const svidMeta = SVID_META[fyrirtaekiData.svid] ?? { label: fyrirtaekiData.svid, color: '#6b7280' };
  const pipiMeta = PIPI_META[fyrirtaekiData.pipiTegund] ?? { label: fyrirtaekiData.pipiTegund, icon: '' };
  const primaryContact = tengilidir.find(t => t.aðaltengiliður) ?? tengilidir[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/vidskiptavinir" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Viðskiptavinir
      </Link>

      {/* ═══ HERO HEADER ═══ */}
      <header className="relative bg-[#161822] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${svidMeta.color}, ${svidMeta.color}80, transparent)` }} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${svidMeta.color}30, ${svidMeta.color}10)`, color: svidMeta.color }}>
              {getInitials(fyrirtaekiData.nafn)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{fyrirtaekiData.nafn}</h1>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${svidMeta.color}20`, color: svidMeta.color }}>
                  {svidMeta.label}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.06] text-white/70">
                  {pipiMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                  {fyrirtaekiData.kennitala}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {fyrirtaekiData.heimilisfang}
                </span>
              </div>

              {/* Quick actions */}
              {primaryContact && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <a href={`mailto:${primaryContact.netfang}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/10 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    Senda tölvupóst
                  </a>
                  <a href={`tel:${primaryContact.simi}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/10 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    Hringja
                  </a>
                  <button onClick={() => router.push('/samningar')}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-sm text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Nýr samningur
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/[0.04] bg-white/[0.01]">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04]">
            <StatCell label="Virkir samningar" value={virkirSamningar.length.toString()} color="#3b82f6" />
            <StatCell label="Bílar á samningi" value={companyBilar.length.toString()} color="#8b5cf6" />
            <StatCell label="Mánaðarlegur kostn." value={formatCurrency(totalManadlegur)} color="#22c55e" />
            <StatCell label="Opin mál" value={openMal.length.toString()} color={openMal.length > 0 ? '#f59e0b' : '#6b7280'} />
          </div>
        </div>
      </header>

      {/* ═══ MAIN GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── TENGILIÐIR ── */}
        <Section title="Tengiliðir" count={tengilidir.length} accentColor="#3b82f6"
          icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.16V17c0-2.012 1.14-3.747 2.786-4.603m8.428.603A3 3 0 1015 6.803a3 3 0 00-.786 4.197m0 0a3 3 0 01-5.428 0M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25">
          <div className="p-3 space-y-2">
            {tengilidir.map(t => (
              <div key={t.id} onClick={() => setSelectedTengilidur(t)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: t.aðaltengiliður ? 'linear-gradient(135deg, #f59e0b30, #f59e0b10)' : 'rgba(255,255,255,0.04)', color: t.aðaltengiliður ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}>
                  {getInitials(t.nafn)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{t.nafn}</span>
                    {t.aðaltengiliður && <span className="text-amber-400 text-xs">★</span>}
                  </div>
                  <p className="text-xs text-white/40 truncate">{t.titill}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`mailto:${t.netfang}`} onClick={e => e.stopPropagation()} title="Tölvupóstur"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-blue-400 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </a>
                  <a href={`tel:${t.simi}`} onClick={e => e.stopPropagation()} title="Hringja"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-green-400 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
            {tengilidir.length === 0 && <EmptyState text="Engir tengiliðir skráðir" />}
          </div>
        </Section>

        {/* ── OPIN MÁL + SÖLUTÆKIFÆRI ── */}
        <div className="space-y-6">
          <Section title="Opin mál" count={openMal.length} accentColor="#ef4444"
            icon="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4">
            <div className="p-3 space-y-2">
              {openMal.map(m => (
                <div key={m.id} onClick={() => setSelectedMal(m)}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{m.titill}</p>
                    <PriorityBadge priority={m.forgangur} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(m.status), color: getStatusColor(m.status) }}>
                      {m.status}
                    </span>
                    <span className="text-[11px] text-white/30">{m.tegund}</span>
                    <span className="text-[11px] text-white/30">· {m.abyrgdaraðili}</span>
                  </div>
                </div>
              ))}
              {openMal.length === 0 && <EmptyState text="Engin opin mál" icon="check" />}
            </div>
          </Section>

          <Section title="Sölutækifæri" count={activeSolutaekifaeri.length} accentColor="#22c55e"
            icon="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941">
            <div className="p-3 space-y-2">
              {activeSolutaekifaeri.map(so => (
                <div key={so.id} onClick={() => router.push('/solutaekifaeri')}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{so.titill}</p>
                    <span className="text-sm font-bold text-green-400 shrink-0">{formatCurrency(so.verdmaeti)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(so.stig), color: getStatusColor(so.stig) }}>
                      {so.stig}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500/60 transition-all" style={{ width: `${so.pipalineStig}%` }} />
                    </div>
                    <span className="text-[10px] text-white/30">{so.pipalineStig}%</span>
                  </div>
                </div>
              ))}
              {activeSolutaekifaeri.length === 0 && <EmptyState text="Engin virk sölutækifæri" />}
            </div>
          </Section>
        </div>

        {/* ── BÍLAR Á SAMNINGI ── */}
        <Section title="Bílar á samningi" count={companyBilar.length} accentColor="#8b5cf6"
          icon="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12">
          <div className="p-3 space-y-2">
            {companyBilar.map(bill => {
              const samn = bill.samningurId ? samningar.find(s => s.id === bill.samningurId) : null;
              const prog = samn ? contractProgress(samn.upphafsdagur, samn.lokadagur) : 0;
              const remaining = samn ? daysRemaining(samn.lokadagur) : 0;
              return (
                <Link key={bill.id} href={`/bilar/${bill.id}`}
                  className="block p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-violet-400 font-mono">{bill.numer.split('-')[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">{bill.numer}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(bill.status), color: getStatusColor(bill.status) }}>
                            {bill.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 truncate">{bill.tegund} ({bill.arsgerð})</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-white/60">{bill.ekinkm.toLocaleString('is-IS')} km</div>
                      {samn && <div className="text-[10px] text-white/30 mt-0.5">{formatCurrency(samn.manadalegurKostnadur)}/mán</div>}
                    </div>
                  </div>
                  {samn && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-white/30">{formatDateShort(samn.upphafsdagur)}</span>
                        <span className={remaining <= 30 ? 'text-amber-400 font-medium' : 'text-white/30'}>
                          {remaining <= 0 ? 'Útrunnið' : `${remaining}d eftir`}
                        </span>
                        <span className="text-white/30">{formatDateShort(samn.lokadagur)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${prog}%`,
                            background: remaining <= 30
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : `linear-gradient(90deg, ${svidMeta.color}80, ${svidMeta.color}40)`,
                          }} />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
            {companyBilar.length === 0 && <EmptyState text="Engir bílar á samningi" />}
          </div>
        </Section>
      </div>

      {/* ═══ SAMNINGAR (full width) ═══ */}
      <Section title="Samningar" count={companySamningar.length} accentColor="#3b82f6"
        icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        badge={`${formatCurrency(totalManadlegur)}/mán`}>
        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {companySamningar.map(s => {
              const prog = contractProgress(s.upphafsdagur, s.lokadagur);
              const remaining = daysRemaining(s.lokadagur);
              const skjol = samningsSkjol.filter(sk => sk.samningurId === s.id);
              return (
                <div key={s.id} onClick={() => router.push('/samningar')}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{s.bilategund}</span>
                        <span className="font-mono text-xs text-white/50">{s.bilanumer}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(s.status), color: getStatusColor(s.status) }}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/50">{s.tryggingarPakki}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-white">{formatCurrency(s.manadalegurKostnadur)}</div>
                      <div className="text-[10px] text-white/30">/mánuður</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-white/30">
                    <span>{formatDateShort(s.upphafsdagur)}</span>
                    <span className={remaining <= 30 ? 'text-amber-400 font-medium' : ''}>
                      {remaining <= 0 ? 'Útrunnið' : remaining <= 30 ? `${remaining}d eftir` : `${remaining}d`}
                    </span>
                    <span>{formatDateShort(s.lokadagur)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${prog}%`,
                      background: remaining <= 30 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f680, #3b82f640)',
                    }} />
                  </div>

                  {skjol.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-white/25">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
                      {skjol.map(sk => sk.nafn).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {companySamningar.length === 0 && <EmptyState text="Engir samningar" />}
        </div>
      </Section>

      {/* ═══ VERKEFNI + ÞJÓNUSTUR (2 col) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Virk verkefni" count={activeVerkefni.length} accentColor="#f59e0b"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
          <div className="p-3 space-y-2">
            {activeVerkefni.map(v => {
              const checkDone = v.checklist.filter(c => c.lokid).length;
              const checkTotal = v.checklist.length;
              const deadlineDays = daysRemaining(v.deadline);
              return (
                <div key={v.id} onClick={() => setSelectedVerkefniId(v.id)}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">{v.titill}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: getStatusBg(v.status), color: getStatusColor(v.status) }}>
                          {v.status === 'í gangi' ? 'Í gangi' : v.status === 'opið' ? 'Opið' : v.status}
                        </span>
                        {v.sjálfvirkt && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Sjálfvirkt</span>
                        )}
                        {checkTotal > 0 && (
                          <span className="text-[10px] text-white/30">{checkDone}/{checkTotal}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-medium ${deadlineDays <= 1 ? 'text-red-400' : deadlineDays <= 3 ? 'text-amber-400' : 'text-white/30'}`}>
                        {deadlineDays <= 0 ? 'Í dag' : deadlineDays === 1 ? 'Á morgun' : `${deadlineDays}d`}
                      </span>
                    </div>
                  </div>
                  {checkTotal > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/60 transition-all" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
            {activeVerkefni.length === 0 && <EmptyState text="Engin virk verkefni" icon="check" />}
          </div>
        </Section>

        {/* ÞJÓNUSTUÁMINNINGAR */}
        <Section title="Þjónustuáminningar" count={companyThjonustur.length} accentColor="#14b8a6"
          icon="M11.42 15.17l-5.1-2.66a1 1 0 010-1.76l5.1-2.66a1 1 0 01.84 0l5.1 2.66a1 1 0 010 1.76l-5.1 2.66a1 1 0 01-.84 0z">
          <div className="p-3 space-y-2">
            {companyThjonustur.map(t => {
              const bill = bilar.find(b => b.id === t.billId);
              const days = daysRemaining(t.dagsThjonustu);
              return (
                <div key={t.id} onClick={() => router.push('/thjonusta')}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">{bill?.tegund ?? '—'}</span>
                        <span className="font-mono text-xs text-white/40">{bill?.numer}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 font-medium">{t.tegund}</span>
                        <span className="text-[10px] text-white/30">{formatDateShort(t.dagsThjonustu)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${days <= 0 ? 'text-red-400' : days <= 7 ? 'text-amber-400' : 'text-white/40'}`}>
                      {days <= 0 ? 'Tímabært' : `${days}d`}
                    </span>
                  </div>
                </div>
              );
            })}
            {companyThjonustur.length === 0 && <EmptyState text="Engar þjónustuáminningar" icon="check" />}
          </div>
        </Section>
      </div>

      {/* ═══ MODALS ═══ */}
      {selectedTengilidur && (
        <TengilidurPanel
          tengiliður={selectedTengilidur}
          onClose={() => setSelectedTengilidur(null)}
          onSave={handleSaveTengilidur}
        />
      )}

      {selectedVerkefni && (
        <VerkefniDetailModal
          verkefni={selectedVerkefni}
          store={verkefniStore}
          currentUser={currentUser}
          onClose={() => setSelectedVerkefniId(null)}
          onSendNotification={handleSendNotification}
        />
      )}

      {selectedMal && (
        <MalModal
          mal={selectedMal}
          onClose={() => setSelectedMal(null)}
          onSave={handleMalSave}
        />
      )}
    </div>
  );
}

/* ═══ HELPER COMPONENTS ═══ */

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="px-5 py-4 text-center sm:text-left">
      <div className="text-[11px] font-medium text-white/35 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

function Section({ title, count, accentColor, icon, badge, children }: {
  title: string;
  count?: number;
  accentColor: string;
  icon: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#161822] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
            <svg className="w-3.5 h-3.5" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {count !== undefined && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
              {count}
            </span>
          )}
        </div>
        {badge && <span className="text-xs font-medium text-white/50">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    bráður: { color: '#ef4444', label: 'Bráður' },
    hár: { color: '#f59e0b', label: 'Hár' },
    miðlungs: { color: '#3b82f6', label: 'Miðlungs' },
    lágur: { color: '#6b7280', label: 'Lágur' },
  };
  const c = config[priority] ?? config.miðlungs;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ backgroundColor: `${c.color}15`, color: c.color }}>
      {c.label}
    </span>
  );
}

function EmptyState({ text, icon }: { text: string; icon?: 'check' | 'default' }) {
  return (
    <div className="py-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-2">
        {icon === 'check' ? (
          <svg className="w-5 h-5 text-green-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
          </svg>
        )}
      </div>
      <p className="text-xs text-white/25">{text}</p>
    </div>
  );
}
