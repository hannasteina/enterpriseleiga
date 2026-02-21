'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  bilar, samningar, fyrirtaeki, getFyrirtaeki, formatCurrency,
  thpilaFlokkar, thpilaFlokkaLitir, solutaekifaeri,
} from '@/lib/enterprise-demo-data';

type ReportTab = 'yfirlit' | 'tekjur' | 'bilar' | 'samningar' | 'vidskiptavinir';

const MANUDIR = ['Jan', 'Feb', 'Mar', 'Apr', 'Maí', 'Jún', 'Júl', 'Ág', 'Sep', 'Okt', 'Nóv', 'Des'];
const AVAILABLE_YEARS = [2024, 2025, 2026];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#ec4899'];

const TABS: { id: ReportTab; label: string; icon: string }[] = [
  { id: 'yfirlit', label: 'Yfirlit', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'tekjur', label: 'Tekjuyfirlit', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'bilar', label: 'Bílafloti', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10' },
  { id: 'samningar', label: 'Samningar', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'vidskiptavinir', label: 'Viðskiptavinir', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

function generateMonthlyRevenue() {
  const months: { name: string; shortName: string; month: number; year: number; flotaleiga: number; langtimaleiga: number; total: number }[] = [];
  for (let year = 2024; year <= 2026; year++) {
    const maxMonth = year === 2026 ? 2 : 12;
    for (let month = 0; month < maxMonth; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      let flotaRev = 0;
      let langtimRev = 0;
      samningar.forEach((s) => {
        const start = new Date(s.upphafsdagur);
        const end = new Date(s.lokadagur);
        if (start <= monthEnd && end >= monthStart && s.status !== 'uppsagt') {
          if (s.tegund === 'flotaleiga') flotaRev += s.manadalegurKostnadur;
          else langtimRev += s.manadalegurKostnadur;
        }
      });
      months.push({
        name: `${MANUDIR[month]} ${year}`,
        shortName: MANUDIR[month],
        month: month + 1,
        year,
        flotaleiga: flotaRev,
        langtimaleiga: langtimRev,
        total: flotaRev + langtimRev,
      });
    }
  }
  return months;
}

function formatCompact(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}þ`;
  return v.toString();
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2030] border border-white/10 rounded-lg p-3 shadow-2xl">
      <p className="text-white/50 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white/70">{entry.name}:</span>
          <span className="text-white font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

async function exportToExcel(data: Record<string, unknown>[], filename: string) {
  try {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Skýrsla');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    return true;
  } catch {
    return false;
  }
}

function exportToPDF(title: string, content: string) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a2e;max-width:900px;margin:0 auto}
    h1{font-size:24px;border-bottom:2px solid #3b82f6;padding-bottom:12px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin:16px 0}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e5e7eb}
    th{background:#f8fafc;font-weight:600;font-size:13px;color:#475569}td{font-size:13px;color:#334155}
    .kpi{display:inline-block;background:#f1f5f9;border-radius:12px;padding:16px 24px;margin:8px;min-width:160px}
    .kpi-label{font-size:12px;color:#64748b;margin-bottom:4px}.kpi-value{font-size:22px;font-weight:700;color:#1e293b}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#94a3b8;text-align:center}
    @media print{body{padding:20px}}</style></head><body>
    <h1>${title}</h1>${content}
    <div class="footer">Enterprise Leiga CRM · Skýrsla útbúin ${new Date().toLocaleDateString('is-IS')} kl. ${new Date().toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}</div>
    <script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
  w.document.close();
  return true;
}

export default function SkyrslurPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('yfirlit');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [compareYear, setCompareYear] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  const allMonthlyData = useMemo(() => generateMonthlyRevenue(), []);

  const yearData = useMemo(() => allMonthlyData.filter((m) => m.year === selectedYear), [allMonthlyData, selectedYear]);
  const prevYearData = useMemo(() => allMonthlyData.filter((m) => m.year === selectedYear - 1), [allMonthlyData, selectedYear]);

  const kpi = useMemo(() => {
    const virkir = samningar.filter((s) => s.status === 'virkur' || s.status === 'rennur_ut');
    const rennurUt = samningar.filter((s) => s.status === 'rennur_ut');
    const manTekjur = virkir.reduce((sum, s) => sum + s.manadalegurKostnadur, 0);
    const arsTekjur = manTekjur * 12;
    const iLeigu = bilar.filter((b) => b.status === 'í leigu').length;
    const lausir = bilar.filter((b) => b.status === 'laus').length;
    const pipeline = solutaekifaeri
      .filter((s) => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið')
      .reduce((sum, s) => sum + s.verdmaeti, 0);

    const currentYearTotal = yearData.reduce((s, m) => s + m.total, 0);
    const prevYearTotal = prevYearData.reduce((s, m) => s + m.total, 0);
    const yoyChange = prevYearTotal > 0 ? ((currentYearTotal - prevYearTotal) / prevYearTotal) * 100 : 0;

    return { virkir: virkir.length, rennurUt: rennurUt.length, manTekjur, arsTekjur, iLeigu, lausir, heildar: bilar.length, pipeline, yoyChange };
  }, [yearData, prevYearData]);

  const carDistribution = useMemo(() =>
    thpilaFlokkar.map((f) => ({
      name: f,
      value: bilar.filter((b) => b.bilaFlokkur === f).length,
      color: thpilaFlokkaLitir[f],
    })).filter((d) => d.value > 0), []);

  const carStatus = useMemo(() => {
    const statuses = ['í leigu', 'laus', 'í þjónustu'] as const;
    const labels: Record<string, string> = { 'í leigu': 'Í leigu', 'laus': 'Laus', 'í þjónustu': 'Í þjónustu' };
    const colors: Record<string, string> = { 'í leigu': '#3b82f6', 'laus': '#22c55e', 'í þjónustu': '#f59e0b' };
    return statuses.map((s) => ({ name: labels[s], value: bilar.filter((b) => b.status === s).length, color: colors[s] }));
  }, []);

  const contractsByType = useMemo(() => {
    const flota = samningar.filter((s) => s.tegund === 'flotaleiga');
    const langtim = samningar.filter((s) => s.tegund === 'langtimaleiga');
    return [
      { name: 'Flotaleiga', value: flota.length, revenue: flota.filter((s) => s.status === 'virkur' || s.status === 'rennur_ut').reduce((sum, s) => sum + s.manadalegurKostnadur, 0), color: '#8b5cf6' },
      { name: 'Langtímaleiga', value: langtim.length, revenue: langtim.filter((s) => s.status === 'virkur' || s.status === 'rennur_ut').reduce((sum, s) => sum + s.manadalegurKostnadur, 0), color: '#3b82f6' },
    ];
  }, []);

  const contractsByStatus = useMemo(() => {
    const statusMap: Record<string, { label: string; color: string }> = {
      virkur: { label: 'Virkur', color: '#22c55e' },
      rennur_ut: { label: 'Rennur út', color: '#f59e0b' },
      lokid: { label: 'Lokið', color: '#6b7280' },
      uppsagt: { label: 'Uppsagt', color: '#ef4444' },
    };
    return Object.entries(statusMap).map(([key, { label, color }]) => ({
      name: label,
      value: samningar.filter((s) => s.status === key).length,
      color,
    }));
  }, []);

  const insuranceBreakdown = useMemo(() => {
    const virkir = samningar.filter((s) => s.status === 'virkur' || s.status === 'rennur_ut');
    return [
      { name: 'Enterprise', value: virkir.filter((s) => s.tryggingarPakki === 'Enterprise').length, color: '#3b82f6' },
      { name: 'Plús', value: virkir.filter((s) => s.tryggingarPakki === 'Plús').length, color: '#8b5cf6' },
      { name: 'Úrvals', value: virkir.filter((s) => s.tryggingarPakki === 'Úrvals').length, color: '#f59e0b' },
    ];
  }, []);

  const customerRevenue = useMemo(() =>
    fyrirtaeki.map((f) => {
      const sam = samningar.filter((s) => s.fyrirtaekiId === f.id && (s.status === 'virkur' || s.status === 'rennur_ut'));
      return { name: f.nafn, revenue: sam.reduce((sum, s) => sum + s.manadalegurKostnadur, 0), contracts: sam.length, bilar: bilar.filter((b) => b.fyrirtaekiId === f.id).length };
    }).sort((a, b) => b.revenue - a.revenue), []);

  const revenueByCategory = useMemo(() =>
    thpilaFlokkar.map((f) => {
      const carsInCat = bilar.filter((b) => b.bilaFlokkur === f);
      const rev = carsInCat.reduce((sum, b) => {
        const s = samningar.find((s) => s.bilanumer === b.numer && (s.status === 'virkur' || s.status === 'rennur_ut'));
        return sum + (s?.manadalegurKostnadur ?? 0);
      }, 0);
      return { name: f, revenue: rev, color: thpilaFlokkaLitir[f] };
    }).filter((d) => d.revenue > 0).sort((a, b) => b.revenue - a.revenue), []);

  const comparisonData = useMemo(() => {
    if (!compareYear) return yearData;
    return yearData.map((m) => {
      const prev = prevYearData.find((p) => p.month === m.month);
      return { ...m, fyrraAr: prev?.total ?? 0 };
    });
  }, [yearData, prevYearData, compareYear]);

  const openEmailModal = useCallback(() => {
    const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? 'Yfirlit';
    setEmailSubject(`Skýrsla – ${tabLabel} – ${new Date().toLocaleDateString('is-IS')}`);
    setEmailBody(`Góðan daginn,\n\nMeðfylgjandi er skýrsla frá Enterprise Leiga CRM.\n\nTegund: ${tabLabel}\nDagsetning: ${new Date().toLocaleDateString('is-IS')}\n\nKveðja,\nEnterprise Leiga`);
    setShowEmailModal(true);
  }, [activeTab]);

  const handleSendEmail = useCallback(async () => {
    if (!emailTo.trim()) return;
    setEmailSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setEmailSending(false);
    setShowEmailModal(false);
    setEmailTo('');
    setToast({ message: `Skýrsla send á ${emailTo}`, type: 'success' });
  }, [emailTo]);

  const handleExportExcel = useCallback(async () => {
    let data: Record<string, unknown>[] = [];
    let filename = 'skyrsla';
    if (activeTab === 'tekjur' || activeTab === 'yfirlit') {
      data = yearData.map((m) => ({ Mánuður: m.name, Flotaleiga: m.flotaleiga, Langtímaleiga: m.langtimaleiga, Samtals: m.total }));
      filename = `tekjuyfirlit_${selectedYear}`;
    } else if (activeTab === 'bilar') {
      data = bilar.map((b) => ({ Númer: b.numer, Tegund: b.tegund, Flokkur: b.bilaFlokkur, Staða: b.status, Verð: b.verdFra }));
      filename = 'bilafloti';
    } else if (activeTab === 'samningar') {
      data = samningar.map((s) => { const f = getFyrirtaeki(s.fyrirtaekiId); return { Fyrirtæki: f?.nafn ?? '', Tegund: s.tegund, Bíll: s.bilategund, MánaðarKostnaður: s.manadalegurKostnadur, Staða: s.status, Trygging: s.tryggingarPakki }; });
      filename = 'samningar';
    } else {
      data = customerRevenue.map((c) => ({ Fyrirtæki: c.name, MánaðarTekjur: c.revenue, Samningar: c.contracts, Bílar: c.bilar }));
      filename = 'vidskiptavinir';
    }
    const ok = await exportToExcel(data, filename);
    setToast({ message: ok ? 'Excel skrá hlaðið niður' : 'Villa við útflutning', type: ok ? 'success' : 'error' });
  }, [activeTab, yearData, selectedYear, customerRevenue]);

  const handleExportPDF = useCallback(() => {
    const tabLabel = TABS.find((t) => t.id === activeTab)?.label ?? 'Yfirlit';
    let content = '';

    content += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">`;
    content += `<div class="kpi"><div class="kpi-label">Mánaðartekjur</div><div class="kpi-value">${formatCurrency(kpi.manTekjur)}</div></div>`;
    content += `<div class="kpi"><div class="kpi-label">Virkir samningar</div><div class="kpi-value">${kpi.virkir}</div></div>`;
    content += `<div class="kpi"><div class="kpi-label">Bílafloti</div><div class="kpi-value">${kpi.heildar}</div></div>`;
    content += `<div class="kpi"><div class="kpi-label">Renna út</div><div class="kpi-value">${kpi.rennurUt}</div></div>`;
    content += `</div>`;

    if (activeTab === 'tekjur' || activeTab === 'yfirlit') {
      content += `<h2>Mánaðarlegt tekjuyfirlit – ${selectedYear}</h2><table><thead><tr><th>Mánuður</th><th>Flotaleiga</th><th>Langtímaleiga</th><th>Samtals</th></tr></thead><tbody>`;
      yearData.forEach((m) => { content += `<tr><td>${m.shortName}</td><td>${formatCurrency(m.flotaleiga)}</td><td>${formatCurrency(m.langtimaleiga)}</td><td><strong>${formatCurrency(m.total)}</strong></td></tr>`; });
      content += `</tbody></table>`;
    }
    if (activeTab === 'bilar' || activeTab === 'yfirlit') {
      content += `<h2>Bílafloti eftir flokkum</h2><table><thead><tr><th>Flokkur</th><th>Fjöldi</th><th>Hlutfall</th></tr></thead><tbody>`;
      carDistribution.forEach((c) => { content += `<tr><td>${c.name}</td><td>${c.value}</td><td>${((c.value / bilar.length) * 100).toFixed(1)}%</td></tr>`; });
      content += `</tbody></table>`;
    }
    if (activeTab === 'vidskiptavinir' || activeTab === 'yfirlit') {
      content += `<h2>Tekjur eftir viðskiptavinum</h2><table><thead><tr><th>Fyrirtæki</th><th>Mánaðartekjur</th><th>Samningar</th><th>Bílar</th></tr></thead><tbody>`;
      customerRevenue.forEach((c) => { content += `<tr><td>${c.name}</td><td>${formatCurrency(c.revenue)}</td><td>${c.contracts}</td><td>${c.bilar}</td></tr>`; });
      content += `</tbody></table>`;
    }

    const ok = exportToPDF(`Enterprise Leiga – ${tabLabel}`, content);
    if (!ok) setToast({ message: 'Ekki tókst að opna PDF forskoðun', type: 'error' });
  }, [activeTab, kpi, yearData, selectedYear, carDistribution, customerRevenue]);

  const totalYearRevenue = yearData.reduce((s, m) => s + m.total, 0);
  const totalPrevYearRevenue = prevYearData.reduce((s, m) => s + m.total, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Skýrslur</h1>
          <p className="text-sm text-white/40 mt-1">Yfirlit, greining og gagnaútflutningur</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          <button type="button" onClick={handleExportPDF} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PDF
          </button>
          <button type="button" onClick={openEmailModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Senda skýrslu
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative bg-[#161822] rounded-xl border border-white/5 p-5 overflow-hidden group hover:border-blue-500/20 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600" />
          <div className="text-xs font-medium text-white/40 mb-1">Mánaðartekjur</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(kpi.manTekjur)}</div>
          <div className="text-xs text-white/40 mt-1">Árstekjur: {formatCurrency(kpi.arsTekjur)}</div>
          {kpi.yoyChange !== 0 && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${kpi.yoyChange > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={kpi.yoyChange > 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
              </svg>
              {Math.abs(kpi.yoyChange).toFixed(1)}% milli ára
            </div>
          )}
        </div>

        <div className="relative bg-[#161822] rounded-xl border border-white/5 p-5 overflow-hidden hover:border-purple-500/20 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-purple-600" />
          <div className="text-xs font-medium text-white/40 mb-1">Virkir samningar</div>
          <div className="text-2xl font-bold text-white">{kpi.virkir}</div>
          <div className="text-xs text-white/40 mt-1">{samningar.length} samningar alls</div>
          {kpi.rennurUt > 0 && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {kpi.rennurUt} renna út
            </div>
          )}
        </div>

        <div className="relative bg-[#161822] rounded-xl border border-white/5 p-5 overflow-hidden hover:border-emerald-500/20 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
          <div className="text-xs font-medium text-white/40 mb-1">Bílafloti</div>
          <div className="text-2xl font-bold text-white">{kpi.heildar}</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-blue-400">{kpi.iLeigu} í leigu</span>
            <span className="text-xs text-emerald-400">{kpi.lausir} lausir</span>
          </div>
          <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(kpi.iLeigu / kpi.heildar) * 100}%` }} />
          </div>
        </div>

        <div className="relative bg-[#161822] rounded-xl border border-white/5 p-5 overflow-hidden hover:border-amber-500/20 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-amber-600" />
          <div className="text-xs font-medium text-white/40 mb-1">Sölulína</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(kpi.pipeline)}</div>
          <div className="text-xs text-white/40 mt-1">{solutaekifaeri.filter((s) => s.stig !== 'lokað tapað' && s.stig !== 'lokað unnið').length} opin tækifæri</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-[#161822] rounded-xl p-1.5 border border-white/5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================== YFIRLIT TAB =================== */}
      {activeTab === 'yfirlit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue trend */}
            <div className="lg:col-span-2 bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tekjuþróun – {selectedYear}</h3>
              <div className="h-[280px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearData}>
                      <defs>
                        <linearGradient id="gFlota" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gLangtim" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="shortName" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="flotaleiga" name="Flotaleiga" stroke="#8b5cf6" fill="url(#gFlota)" strokeWidth={2} />
                      <Area type="monotone" dataKey="langtimaleiga" name="Langtímaleiga" stroke="#3b82f6" fill="url(#gLangtim)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Revenue split donut */}
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tekjuskipting</h3>
              <div className="h-[200px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={contractsByType} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="revenue" paddingAngle={4} strokeWidth={0}>
                        {contractsByType.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 mt-2">
                {contractsByType.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-white/70">{c.name}</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div className="text-sm font-semibold text-white">Stærsti viðskiptavinur</div>
              </div>
              <div className="text-lg font-bold text-white">{customerRevenue[0]?.name}</div>
              <div className="text-sm text-white/50 mt-1">{formatCurrency(customerRevenue[0]?.revenue ?? 0)} / mánuði</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div className="text-sm font-semibold text-white">Stærsti bílaflokkur</div>
              </div>
              <div className="text-lg font-bold text-white">{carDistribution[0]?.name}</div>
              <div className="text-sm text-white/50 mt-1">{carDistribution[0]?.value} bílar · {((carDistribution[0]?.value / bilar.length) * 100).toFixed(0)}% af flota</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl border border-emerald-500/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-sm font-semibold text-white">Nýtingarhlutfall</div>
              </div>
              <div className="text-lg font-bold text-white">{((kpi.iLeigu / kpi.heildar) * 100).toFixed(0)}%</div>
              <div className="text-sm text-white/50 mt-1">{kpi.iLeigu} af {kpi.heildar} bílum í leigu</div>
            </div>
          </div>

          {/* Top customers table */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Efstu viðskiptavinir eftir tekjum</h3>
            </div>
            <div className="divide-y divide-white/5">
              {customerRevenue.slice(0, 5).map((c, i) => (
                <div key={c.name} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-white/30 font-mono text-sm w-6">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{c.name}</div>
                    <div className="text-xs text-white/40">{c.contracts} samningar · {c.bilar} bílar</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatCurrency(c.revenue)}</div>
                    <div className="text-xs text-white/40">/ mánuði</div>
                  </div>
                  <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(c.revenue / (customerRevenue[0]?.revenue || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================== TEKJUYFIRLIT TAB =================== */}
      {activeTab === 'tekjur' && (
        <div className="space-y-6">
          {/* Year selector & controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-1 bg-[#161822] rounded-lg p-1 border border-white/5">
              {AVAILABLE_YEARS.map((y) => (
                <button key={y} type="button" onClick={() => setSelectedYear(y)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedYear === y ? 'bg-blue-500/20 text-blue-400' : 'text-white/50 hover:text-white/70'}`}>
                  {y}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer select-none">
              <input type="checkbox" checked={compareYear} onChange={(e) => setCompareYear(e.target.checked)} className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50" />
              Bera saman við {selectedYear - 1}
            </label>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <div className="text-xs font-medium text-white/40 mb-1">Heildartekjur {selectedYear}</div>
              <div className="text-xl font-bold text-white">{formatCurrency(totalYearRevenue)}</div>
              {totalPrevYearRevenue > 0 && (
                <div className={`text-xs mt-1 ${totalYearRevenue >= totalPrevYearRevenue ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalYearRevenue >= totalPrevYearRevenue ? '↑' : '↓'} {Math.abs(((totalYearRevenue - totalPrevYearRevenue) / totalPrevYearRevenue) * 100).toFixed(1)}% frá {selectedYear - 1}
                </div>
              )}
            </div>
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <div className="text-xs font-medium text-white/40 mb-1">Flotaleiga {selectedYear}</div>
              <div className="text-xl font-bold text-purple-400">{formatCurrency(yearData.reduce((s, m) => s + m.flotaleiga, 0))}</div>
              <div className="text-xs text-white/40 mt-1">{totalYearRevenue > 0 ? ((yearData.reduce((s, m) => s + m.flotaleiga, 0) / totalYearRevenue) * 100).toFixed(0) : 0}% af heild</div>
            </div>
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <div className="text-xs font-medium text-white/40 mb-1">Langtímaleiga {selectedYear}</div>
              <div className="text-xl font-bold text-blue-400">{formatCurrency(yearData.reduce((s, m) => s + m.langtimaleiga, 0))}</div>
              <div className="text-xs text-white/40 mt-1">{totalYearRevenue > 0 ? ((yearData.reduce((s, m) => s + m.langtimaleiga, 0) / totalYearRevenue) * 100).toFixed(0) : 0}% af heild</div>
            </div>
          </div>

          {/* Main area chart */}
          <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Mánaðarlegar tekjur – {selectedYear}</h3>
            <div className="h-[350px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonData}>
                    <defs>
                      <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="shortName" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" name={`Samtals ${selectedYear}`} stroke="#10b981" fill="url(#gTotal)" strokeWidth={2.5} />
                    {compareYear && <Area type="monotone" dataKey="fyrraAr" name={`Samtals ${selectedYear - 1}`} stroke="#6b7280" fill="transparent" strokeWidth={1.5} strokeDasharray="6 3" />}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bar chart side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Flotaleiga vs Langtímaleiga</h3>
              <div className="h-[300px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="shortName" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="flotaleiga" name="Flotaleiga" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="langtimaleiga" name="Langtímaleiga" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tekjur eftir bílaflokki</h3>
              <div className="h-[300px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByCategory} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} width={130} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" name="Mánaðartekjur" radius={[0, 4, 4, 0]}>
                        {revenueByCategory.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Monthly detail table */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Mánaðarleg sundurliðun – {selectedYear}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Mánuður</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-white/40">Flotaleiga</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-white/40">Langtímaleiga</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-white/40">Samtals</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-white/40 hidden sm:table-cell">Hlutfall flota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {yearData.map((m) => (
                    <tr key={m.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white/80 font-medium">{m.shortName}</td>
                      <td className="px-5 py-3 text-right text-purple-400">{formatCurrency(m.flotaleiga)}</td>
                      <td className="px-5 py-3 text-right text-blue-400">{formatCurrency(m.langtimaleiga)}</td>
                      <td className="px-5 py-3 text-right text-white font-semibold">{formatCurrency(m.total)}</td>
                      <td className="px-5 py-3 text-right text-white/50 hidden sm:table-cell">{m.total > 0 ? ((m.flotaleiga / m.total) * 100).toFixed(0) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/[0.02]">
                    <td className="px-5 py-3 text-white font-semibold">Samtals</td>
                    <td className="px-5 py-3 text-right text-purple-400 font-semibold">{formatCurrency(yearData.reduce((s, m) => s + m.flotaleiga, 0))}</td>
                    <td className="px-5 py-3 text-right text-blue-400 font-semibold">{formatCurrency(yearData.reduce((s, m) => s + m.langtimaleiga, 0))}</td>
                    <td className="px-5 py-3 text-right text-white font-bold">{formatCurrency(totalYearRevenue)}</td>
                    <td className="px-5 py-3 text-right text-white/50 hidden sm:table-cell">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================== BÍLAR TAB =================== */}
      {activeTab === 'bilar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Dreifing eftir flokkum</h3>
              <div className="h-[300px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={carDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3} strokeWidth={0} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {carDistribution.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Staða bíla</h3>
              <div className="h-[300px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={carStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={4} strokeWidth={0}>
                        {carStatus.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {carStatus.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-white/60">{s.name}</span>
                    <span className="text-white font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category detail bars */}
          <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Yfirlit eftir flokkum</h3>
            <div className="space-y-4">
              {carDistribution.sort((a, b) => b.value - a.value).map((cat) => {
                const pct = (cat.value / bilar.length) * 100;
                const carsInCat = bilar.filter((b) => b.bilaFlokkur === cat.name);
                const iLeigu = carsInCat.filter((b) => b.status === 'í leigu').length;
                const lausir = carsInCat.filter((b) => b.status === 'laus').length;
                return (
                  <div key={cat.name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-medium text-white">{cat.name}</span>
                        <span className="text-xs text-white/40">({cat.value} bílar)</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-blue-400">{iLeigu} í leigu</span>
                        <span className="text-emerald-400">{lausir} lausir</span>
                        <span className="text-white/50 font-medium">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fleet value */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Verðmæti bílaflota eftir flokkum</h3>
            </div>
            <div className="h-[300px] p-5">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={carDistribution.map((c) => {
                    const cars = bilar.filter((b) => b.bilaFlokkur === c.name);
                    return { name: c.name, value: cars.reduce((sum, b) => sum + b.verdFra, 0), color: c.color };
                  })} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Verðmæti" radius={[6, 6, 0, 0]}>
                      {carDistribution.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================== SAMNINGAR TAB =================== */}
      {activeTab === 'samningar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contract type donut */}
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tegund samninga</h3>
              <div className="h-[220px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={contractsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={6} strokeWidth={0}>
                        {contractsByType.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 mt-2">
                {contractsByType.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} /><span className="text-white/70">{c.name}</span></div>
                    <span className="text-white font-medium">{c.value} samningar</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Staða samninga</h3>
              <div className="h-[220px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={contractsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4} strokeWidth={0}>
                        {contractsByStatus.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 mt-2">
                {contractsByStatus.filter((s) => s.value > 0).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-white/70">{s.name}</span></div>
                    <span className="text-white font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insurance breakdown */}
            <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tryggingarpakkar</h3>
              <div className="h-[220px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={insuranceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={6} strokeWidth={0}>
                        {insuranceBreakdown.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e2030', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 mt-2">
                {insuranceBreakdown.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-white/70">{p.name}</span></div>
                    <span className="text-white font-medium">{p.value} samningar</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue by contract type bar chart */}
          <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Mánaðartekjur eftir samningi</h3>
            <div className="h-[350px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={samningar
                      .filter((s) => s.status === 'virkur' || s.status === 'rennur_ut')
                      .sort((a, b) => b.manadalegurKostnadur - a.manadalegurKostnadur)
                      .map((s) => ({ name: s.bilategund, value: s.manadalegurKostnadur, company: getFyrirtaeki(s.fyrirtaekiId)?.nafn ?? '', type: s.tegund }))}
                    margin={{ bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                    <YAxis tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Mánaðarkostnaður" radius={[4, 4, 0, 0]}>
                      {samningar
                        .filter((s) => s.status === 'virkur' || s.status === 'rennur_ut')
                        .sort((a, b) => b.manadalegurKostnadur - a.manadalegurKostnadur)
                        .map((s, i) => (<Cell key={i} fill={s.tegund === 'flotaleiga' ? '#8b5cf6' : '#3b82f6'} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-white/50">Flotaleiga</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-white/50">Langtímaleiga</span></div>
            </div>
          </div>

          {/* Contracts expiring soon */}
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Samningar sem renna út bráðlega</h3>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">{samningar.filter((s) => s.status === 'rennur_ut').length} samningar</span>
            </div>
            <div className="divide-y divide-white/5">
              {samningar.filter((s) => s.status === 'rennur_ut').map((s) => {
                const f = getFyrirtaeki(s.fyrirtaekiId);
                const daysLeft = Math.ceil((new Date(s.lokadagur).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${daysLeft < 14 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {daysLeft}d
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{f?.nafn ?? '—'}</div>
                      <div className="text-xs text-white/40">{s.bilategund} · {s.bilanumer}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{formatCurrency(s.manadalegurKostnadur)}</div>
                      <div className="text-xs text-white/40">Rennur út {new Date(s.lokadagur).toLocaleDateString('is-IS')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================== VIÐSKIPTAVINIR TAB =================== */}
      {activeTab === 'vidskiptavinir' && (
        <div className="space-y-6">
          {/* Customer revenue chart */}
          <div className="bg-[#161822] rounded-xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Mánaðartekjur eftir viðskiptavinum</h3>
            <div className="h-[350px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerRevenue} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tickFormatter={formatCompact} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Mánaðartekjur" radius={[0, 6, 6, 0]}>
                      {customerRevenue.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Customer cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerRevenue.map((c, i) => {
              const f = fyrirtaeki.find((f) => f.nafn === c.name);
              const totalRev = customerRevenue.reduce((s, x) => s + x.revenue, 0);
              const pct = totalRev > 0 ? (c.revenue / totalRev) * 100 : 0;
              return (
                <div key={c.name} className="bg-[#161822] rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${PIE_COLORS[i % PIE_COLORS.length]}20`, color: PIE_COLORS[i % PIE_COLORS.length] }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{c.name}</div>
                        <div className="text-xs text-white/40">{f?.heimilisfang}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f?.svid === 'flotaleiga' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {f?.svid === 'flotaleiga' ? 'Flotaleiga' : 'Langtímaleiga'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                      <div className="text-xs text-white/40">Tekjur/mán</div>
                      <div className="text-sm font-bold text-white mt-0.5">{formatCurrency(c.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Samningar</div>
                      <div className="text-sm font-bold text-white mt-0.5">{c.contracts}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Bílar</div>
                      <div className="text-sm font-bold text-white mt-0.5">{c.bilar}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>Hlutfall af tekjum</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================== EMAIL MODAL =================== */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="relative bg-[#1e2030] rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Senda skýrslu á tölvupóst</h3>
                  <p className="text-xs text-white/40">Skýrslan verður send sem PDF viðhengi</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowEmailModal(false)} className="text-white/40 hover:text-white/60 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Viðtakandi</label>
                <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="netfang@fyrirtaeki.is"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Efni</label>
                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Skilaboð</label>
                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex items-center gap-3 text-sm text-white/50 bg-white/[0.03] rounded-lg px-4 py-3 border border-white/5">
                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span>Skýrsla verður meðfylgjandi sem PDF skjal</span>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors">
                Hætta við
              </button>
              <button type="button" onClick={handleSendEmail} disabled={emailSending || !emailTo.trim()}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {emailSending ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sendi...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Senda</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== TOAST =================== */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-bottom-2 ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {toast.type === 'success'
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          </svg>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
