'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useRef, useMemo, useEffect } from 'react';
import {
  bilar,
  samningsSkjol,
  thjonustuaminningar,
  fyrirtaeki as allFyrirtaeki,
  formatCurrency,
  getStatusColor,
  getStatusBg,
  getFyrirtaeki,
  getSamningur,
  getThjonustuFerillBils,
  type SamningsSkjal,
  type Svid,
} from '@/lib/enterprise-demo-data';

export default function BillDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const car = bilar.find(b => b.id === id);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sendPanelOpen, setSendPanelOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendName, setSendName] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendIncludeLease, setSendIncludeLease] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [assignPanelOpen, setAssignPanelOpen] = useState(false);
  const [assignFyrirtaekiId, setAssignFyrirtaekiId] = useState('');
  const [assignTegund, setAssignTegund] = useState<Svid>('langtimaleiga');
  const [assignUpphafsdagur, setAssignUpphafsdagur] = useState('');
  const [assignLokadagur, setAssignLokadagur] = useState('');
  const [assignKostnadur, setAssignKostnadur] = useState('');
  const [assignTryggingar, setAssignTryggingar] = useState<'Enterprise' | 'Plús' | 'Úrvals'>('Enterprise');
  const [assignAkstur, setAssignAkstur] = useState('1300');
  const [assignAthugasemdir, setAssignAthugasemdir] = useState('');
  const [assignResult, setAssignResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [assigned, setAssigned] = useState(false);

  const fyrirtaeki = car?.fyrirtaekiId ? getFyrirtaeki(car.fyrirtaekiId) : null;
  const samningur = car?.samningurId ? getSamningur(car.samningurId) : null;

  const contacts = useMemo(() => {
    if (!fyrirtaeki) return [];
    return fyrirtaeki.tengiliðir || [];
  }, [fyrirtaeki]);

  const shouldAutoOpenAssign = searchParams.get('uthluta') === 'true';
  const [autoOpenedAssign, setAutoOpenedAssign] = useState(false);

  useEffect(() => {
    if (shouldAutoOpenAssign && car && car.status === 'laus' && !assigned && !autoOpenedAssign) {
      setAutoOpenedAssign(true);
      const today = new Date().toISOString().split('T')[0];
      setAssignUpphafsdagur(today);
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      setAssignLokadagur(oneYear.toISOString().split('T')[0]);
      setAssignKostnadur(car.verdFra.toString());
      setAssignPanelOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoOpenAssign]);

  if (!car) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="" className="text-sm text-white/60 hover:text-white/80 transition-colors">
          ← Til baka
        </Link>
        <div className="bg-[#161822] rounded-xl border border-white/5 p-12 text-center">
          <p className="text-lg text-white/80">Bíll finnst ekki</p>
          <Link href="" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
            Fara til baka
          </Link>
        </div>
      </div>
    );
  }

  const thjonustuFerill = getThjonustuFerillBils(car.id).sort(
    (a, b) => new Date(b.dagsetning).getTime() - new Date(a.dagsetning).getTime()
  );
  const carAminningar = thjonustuaminningar.filter(t => t.billId === car.id);
  const carSamningsSkjol = car.samningurId
    ? samningsSkjol.filter(s => s.samningurId === car.samningurId)
    : [];

  const daysUntilNext = car.naestiThjonusta
    ? Math.ceil((new Date(car.naestiThjonusta).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleMockUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setTimeout(() => setUploading(false), 1500);
    }
    e.target.value = '';
  };

  const openSendPanel = () => {
    const primary = contacts.find(c => c.aðaltengiliður);
    if (primary) {
      setSendEmail(primary.netfang);
      setSendName(primary.nafn);
    }
    setSendResult(null);
    setSendPanelOpen(true);
  };

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setSendEmail(contact.netfang);
      setSendName(contact.nafn);
    }
  };

  const openAssignPanel = () => {
    setAssignFyrirtaekiId('');
    setAssignTegund('langtimaleiga');
    const today = new Date().toISOString().split('T')[0];
    setAssignUpphafsdagur(today);
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    setAssignLokadagur(oneYear.toISOString().split('T')[0]);
    setAssignKostnadur(car.verdFra.toString());
    setAssignTryggingar('Enterprise');
    setAssignAkstur('1300');
    setAssignAthugasemdir('');
    setAssignResult(null);
    setAssignPanelOpen(true);
  };

  const handleAssign = () => {
    if (!assignFyrirtaekiId || !assignUpphafsdagur || !assignLokadagur || !assignKostnadur) return;
    const fyrirtaekiNafn = allFyrirtaeki.find(f => f.id === assignFyrirtaekiId)?.nafn || '';
    setAssignResult({
      ok: true,
      message: `Bíll ${car.numer} hefur verið úthlutaður til ${fyrirtaekiNafn}`,
    });
    setAssigned(true);
  };

  const assignFormValid = assignFyrirtaekiId && assignUpphafsdagur && assignLokadagur && assignKostnadur;

  const handleSend = async () => {
    if (!sendEmail) return;
    setSending(true);
    setSendResult(null);
    try {
      const payload: Record<string, unknown> = {
        toEmail: sendEmail,
        toName: sendName,
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
        personalMessage: sendMessage || undefined,
        senderName: 'Enterprise Bílaleiga',
      };

      if (sendIncludeLease && samningur && fyrirtaeki) {
        payload.leaseInfo = {
          company: fyrirtaeki.nafn,
          monthlyRate: samningur.manadalegurKostnadur,
          startDate: samningur.upphafsdagur,
          endDate: samningur.lokadagur,
          insurancePackage: samningur.tryggingarPakki,
          kmPerMonth: samningur.aksturKmManudir,
        };
      }

      const res = await fetch('/api/send-car-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({ ok: true, message: data.message });
      } else {
        setSendResult({ ok: false, message: data.error || 'Villa við sendingu' });
      }
    } catch {
      setSendResult({ ok: false, message: 'Tengivilla — reyndu aftur' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <Link href="" className="text-sm text-white/60 hover:text-white/80 transition-colors inline-flex items-center gap-1">
        ← Til baka
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{car.numer}</h1>
          <p className="text-sm text-white/80 mt-0.5">
            {car.tegund} • {car.arsgerð} • {car.litur}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: getStatusBg(car.status), color: getStatusColor(car.status) }}
            >
              {car.status}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium bg-white/10 text-white/80"
            >
              {car.bilaFlokkur}
            </span>
            {fyrirtaeki && (
              <Link
                href={`/vidskiptavinir/${car.fyrirtaekiId}`}
                className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
              >
                {fyrirtaeki.nafn} →
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(car.status === 'laus' && !assigned) && (
            <button
              onClick={openAssignPanel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Úthluta bíl
            </button>
          )}
          <button
            onClick={openSendPanel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Senda á viðskiptavin
          </button>
        </div>
      </div>

      {/* Car Image */}
      {car.imageUrl && (
        <div className="bg-[#161822] rounded-xl border border-white/5 p-6 flex items-center justify-center">
          <Image
            src={car.imageUrl}
            alt={`${car.tegund} ${car.arsgerð}`}
            width={480}
            height={280}
            className="object-contain max-h-[280px] w-auto"
            unoptimized
          />
        </div>
      )}

      {/* Send Email Panel */}
      {sendPanelOpen && (
        <div className="bg-[#161822] rounded-xl border border-blue-500/20 overflow-hidden shadow-lg shadow-blue-500/5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-sm font-semibold text-white">Senda bílaupplýsingar</h2>
            </div>
            <button onClick={() => setSendPanelOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Contact picker */}
            {contacts.length > 0 && (
              <div>
                <label className="text-xs font-medium text-white/40 block mb-2">Tengiliður</label>
                <div className="flex flex-wrap gap-2">
                  {contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleContactSelect(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        sendEmail === c.netfang
                          ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                          : 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {c.nafn}
                      {c.aðaltengiliður && <span className="ml-1 text-[10px] text-blue-400/60">aðal</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email + Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Netfang *</label>
                <input
                  type="email"
                  value={sendEmail}
                  onChange={e => setSendEmail(e.target.value)}
                  placeholder="netfang@dæmi.is"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Nafn viðtakanda</label>
                <input
                  type="text"
                  value={sendName}
                  onChange={e => setSendName(e.target.value)}
                  placeholder="Nafn"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Personal message */}
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Skilaboð (valkvætt)</label>
              <textarea
                value={sendMessage}
                onChange={e => setSendMessage(e.target.value)}
                placeholder="Bættu persónulegum skilaboðum við ef þú vilt..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
              />
            </div>

            {/* Include lease toggle */}
            {samningur && (
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setSendIncludeLease(!sendIncludeLease)}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                    sendIncludeLease ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    sendIncludeLease ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
                <span className="text-sm text-white/60">Taka leiguupplýsingar með</span>
              </label>
            )}

            {/* What will be sent - preview */}
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <p className="text-[11px] font-medium text-white/30 mb-2 uppercase tracking-wide">Innihald tölvupósts</p>
              <div className="flex flex-wrap gap-1.5">
                {car.imageUrl && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Mynd af bíl</span>}
                {['Tegund & árgerð', 'Litur', 'Skiptigerð', 'Akstur (km)', 'Flokkur', 'Verð frá', 'Þjónustuupplýsingar'].map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">{tag}</span>
                ))}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Innifalið í verði</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Tryggingapakkar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Samningsskilmálar</span>
                {sendIncludeLease && samningur && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Leiguupplýsingar</span>
                )}
                {sendMessage && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Persónuleg skilaboð</span>
                )}
              </div>
            </div>

            {/* Result message */}
            {sendResult && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                sendResult.ok
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {sendResult.ok ? (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {sendResult.message}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSendPanelOpen(false)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Hætta við
              </button>
              <button
                onClick={handleSend}
                disabled={!sendEmail || sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
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
          </div>
        </div>
      )}

      {/* Assign Panel */}
      {assignPanelOpen && (
        <div className="bg-[#161822] rounded-xl border border-emerald-500/20 overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="text-sm font-semibold text-white">Úthluta bíl</h2>
            </div>
            <button onClick={() => setAssignPanelOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Fyrirtæki */}
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Fyrirtæki *</label>
              <select
                value={assignFyrirtaekiId}
                onChange={e => setAssignFyrirtaekiId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              >
                <option value="" className="bg-[#161822]">Veldu fyrirtæki...</option>
                {allFyrirtaeki.map(f => (
                  <option key={f.id} value={f.id} className="bg-[#161822]">{f.nafn}</option>
                ))}
              </select>
            </div>

            {/* Tegund samnings */}
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Tegund samnings *</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAssignTegund('langtimaleiga')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    assignTegund === 'langtimaleiga'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  Langtímaleiga
                </button>
                <button
                  onClick={() => setAssignTegund('flotaleiga')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    assignTegund === 'flotaleiga'
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  Flotaleiga
                </button>
              </div>
            </div>

            {/* Dagsetningar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Upphafsdagur *</label>
                <input
                  type="date"
                  value={assignUpphafsdagur}
                  onChange={e => setAssignUpphafsdagur(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Lokadagur *</label>
                <input
                  type="date"
                  value={assignLokadagur}
                  onChange={e => setAssignLokadagur(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Kostnaður og akstur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Mánaðarlegur kostnaður (kr.) *</label>
                <input
                  type="number"
                  value={assignKostnadur}
                  onChange={e => setAssignKostnadur(e.target.value)}
                  placeholder={car.verdFra.toString()}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 block mb-1.5">Akstur km/mán</label>
                <input
                  type="number"
                  value={assignAkstur}
                  onChange={e => setAssignAkstur(e.target.value)}
                  placeholder="1300"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Tryggingarpakki */}
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Tryggingarpakki</label>
              <div className="flex gap-2">
                {(['Enterprise', 'Plús', 'Úrvals'] as const).map(pakki => (
                  <button
                    key={pakki}
                    onClick={() => setAssignTryggingar(pakki)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      assignTryggingar === pakki
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {pakki}
                  </button>
                ))}
              </div>
            </div>

            {/* Athugasemdir */}
            <div>
              <label className="text-xs font-medium text-white/40 block mb-1.5">Athugasemdir</label>
              <textarea
                value={assignAthugasemdir}
                onChange={e => setAssignAthugasemdir(e.target.value)}
                placeholder="Athugasemdir við úthlutun..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors resize-none"
              />
            </div>

            {/* Samantekt */}
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
              <p className="text-[11px] font-medium text-white/30 mb-2 uppercase tracking-wide">Samantekt</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/40">Bíll:</span>
                  <span className="text-white ml-1">{car.numer} – {car.tegund}</span>
                </div>
                {assignFyrirtaekiId && (
                  <div>
                    <span className="text-white/40">Fyrirtæki:</span>
                    <span className="text-white ml-1">{allFyrirtaeki.find(f => f.id === assignFyrirtaekiId)?.nafn}</span>
                  </div>
                )}
                {assignKostnadur && (
                  <div>
                    <span className="text-white/40">Verð:</span>
                    <span className="text-white ml-1">{formatCurrency(Number(assignKostnadur))}/mán</span>
                  </div>
                )}
                <div>
                  <span className="text-white/40">Tryggingar:</span>
                  <span className="text-white ml-1">{assignTryggingar}</span>
                </div>
              </div>
            </div>

            {/* Result */}
            {assignResult && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                assignResult.ok
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {assignResult.ok ? (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {assignResult.message}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignPanelOpen(false)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Hætta við
              </button>
              <button
                onClick={handleAssign}
                disabled={!assignFormValid || assigned}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Úthluta bíl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Car details card */}
      <div className="bg-[#161822] rounded-xl border border-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Bílaupplýsingar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-white/40 block">Skiptigerð</span>
            <span className="text-white">{car.skiptigerð}</span>
          </div>
          <div>
            <span className="text-white/40 block">Verð frá</span>
            <span className="text-white">{formatCurrency(car.verdFra)}</span>
          </div>
          <div>
            <span className="text-white/40 block">Km</span>
            <span className="text-white">{car.ekinkm.toLocaleString('is-IS')} km</span>
          </div>
        </div>
        {fyrirtaeki && (
          <div>
            <span className="text-white/40 block text-xs">Fyrirtæki í leigu</span>
            <Link
              href={`/vidskiptavinir/${car.fyrirtaekiId}`}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {fyrirtaeki.nafn} →
            </Link>
          </div>
        )}
        {samningur && (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-white/40 block text-xs">Núverandi samningur</span>
            <div className="text-sm text-white/80 space-y-1">
              <div>{samningur.upphafsdagur} – {samningur.lokadagur}</div>
              <div>Mánaðarkostnaður: {formatCurrency(samningur.manadalegurKostnadur)}</div>
              <div>Tryggingar: {samningur.tryggingarPakki} • Akstur: {samningur.aksturKmManudir} km/mán</div>
            </div>
          </div>
        )}
      </div>

      {/* Þjónustuferill */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Þjónustuferill</h2>
        </div>
        {thjonustuFerill.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/40">Enginn þjónustuferill</div>
        ) : (
          <div className="divide-y divide-white/5">
            {thjonustuFerill.map((item) => (
              <div key={item.id} className="px-5 py-3 hover:bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-white">{item.tegund}</span>
                  <span className="text-xs text-white/40">{item.dagsetning}</span>
                  {item.km > 0 && (
                    <span className="text-xs text-white/40">{item.km.toLocaleString('is-IS')} km</span>
                  )}
                </div>
                {item.lysing && <div className="text-xs text-white/60 mt-1">{item.lysing}</div>}
                {item.stadur && <div className="text-xs text-white/40 mt-0.5">{item.stadur}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Næsta þjónusta */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-white">Næsta þjónusta</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/40 block text-xs">Næsta þjónusta</span>
              <span className="text-white">{car.naestiThjonusta}</span>
            </div>
            <div>
              <span className="text-white/40 block text-xs">Síðasta þjónusta</span>
              <span className="text-white">{car.sidastaThjonusta}</span>
            </div>
          </div>
          {daysUntilNext !== null && (
            <div className="text-sm">
              <span className="text-white/40">Dagar þar til næsta þjónusta: </span>
              <span className={daysUntilNext <= 30 ? 'text-amber-400 font-medium' : 'text-white'}>
                {daysUntilNext}
              </span>
            </div>
          )}
          {carAminningar.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <span className="text-white/40 block text-xs mb-2">Þjónustuáminningar</span>
              <div className="space-y-2">
                {carAminningar.map((ta) => (
                  <div key={ta.id} className="flex items-center gap-3 text-sm">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={{ backgroundColor: getStatusBg(ta.status), color: getStatusColor(ta.status) }}
                    >
                      {ta.status}
                    </span>
                    <span className="text-white/80">{ta.tegund}</span>
                    <span className="text-white/40">{ta.dagsThjonustu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Samningsskjöl */}
      <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Samningsskjöl</h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
            />
            <button
              onClick={handleMockUpload}
              disabled={uploading}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Hleð upp...' : 'Hlaða upp skjali'}
            </button>
          </div>
        </div>
        {carSamningsSkjol.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/40">
            Engin skjöl skráð. {!car.samningurId && '( Enginn virkur samningur )'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {carSamningsSkjol.map((skjal: SamningsSkjal) => (
              <div key={skjal.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{skjal.nafn}</div>
                  <div className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/10 text-white/60"
                    >
                      {skjal.tegund}
                    </span>
                    <span>{skjal.dagsett}</span>
                    <span>{skjal.staerd}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
