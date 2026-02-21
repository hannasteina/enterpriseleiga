'use client';

import { useState } from 'react';
import {
  notendur,
  hlutverkLysingar,
  type Notandi,
  type Hlutverk,
  type Svid,
} from '@/lib/enterprise-demo-data';

const SVID_LABELS: Record<Svid, string> = {
  langtimaleiga: 'Langtímaleiga',
  flotaleiga: 'Flotaleiga',
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return 'Rétt í þessu';
  if (diffH < 24) return `${diffH} klst. síðan`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Í gær';
  return `${diffD} dögum síðan`;
}

export default function StillingarPage() {
  const [activeTab, setActiveTab] = useState<'notendur' | 'adgangur' | 'almennt'>('notendur');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [localNotendur, setLocalNotendur] = useState<Notandi[]>([...notendur]);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const tabs = [
    { id: 'notendur' as const, label: 'Notendur' },
    { id: 'adgangur' as const, label: 'Aðgangsstýring' },
    { id: 'almennt' as const, label: 'Almennt' },
  ];

  const toggleVirkur = (id: string) => {
    setLocalNotendur(prev => prev.map(n => n.id === id ? { ...n, virkur: !n.virkur } : n));
  };

  const updateHlutverk = (id: string, hlutverk: Hlutverk) => {
    const svidMap: Record<Hlutverk, Svid[]> = {
      stjornandi: ['flotaleiga', 'langtimaleiga'],
      yfirmaður: ['flotaleiga', 'langtimaleiga'],
      solumaður_flota: ['flotaleiga', 'langtimaleiga'],
      solumaður_langtima: ['langtimaleiga'],
      thjonustufulltrui: ['langtimaleiga'],
    };
    setLocalNotendur(prev => prev.map(n => n.id === id ? { ...n, hlutverk, svid: svidMap[hlutverk] } : n));
    setEditingUser(null);
  };

  const toggleSvid = (id: string, svid: Svid) => {
    setLocalNotendur(prev => prev.map(n => {
      if (n.id !== id) return n;
      const has = n.svid.includes(svid);
      const next = has ? n.svid.filter(s => s !== svid) : [...n.svid, svid];
      if (next.length === 0) return n;
      return { ...n, svid: next };
    }));
  };

  const deleteNotandi = (id: string) => {
    setLocalNotendur(prev => prev.filter(n => n.id !== id));
    setDeletingUser(null);
    setEditingUser(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Stillingar</h1>
        <p className="text-sm text-white/40 mt-1">Notendastjórnun og aðgangsstýringar</p>
      </div>

      <div className="flex rounded-lg border border-white/5 overflow-hidden bg-white/5 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-blue-600/30 text-blue-400' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'notendur' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Notendur ({localNotendur.length})</h2>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nýr notandi
            </button>
          </div>

          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {localNotendur.map(n => {
                const hl = hlutverkLysingar[n.hlutverk];
                return (
                  <div key={n.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${n.virkur ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-white/30'}`}>
                        {n.nafn.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${n.virkur ? 'text-white' : 'text-white/40 line-through'}`}>{n.nafn}</span>
                          {!n.virkur && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">Óvirkur</span>}
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">{n.netfang}</div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: hl.color + '20', color: hl.color }}>
                          {hl.label}
                        </span>
                        <div className="flex gap-1">
                          {n.svid.map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50">{SVID_LABELS[s]}</span>
                          ))}
                        </div>
                      </div>

                      <div className="hidden md:block text-right">
                        <div className="text-[10px] text-white/30">{timeAgo(n.sidastaInnskraning)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(editingUser === n.id ? null : n.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                          title="Breyta"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingUser(deletingUser === n.id ? null : n.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          title="Eyða"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleVirkur(n.id)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${n.virkur ? 'bg-green-600' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${n.virkur ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>

                    {/* SM: show role/svid below on mobile */}
                    <div className="sm:hidden flex items-center gap-2 mt-2 pl-14">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: hl.color + '20', color: hl.color }}>{hl.label}</span>
                      {n.svid.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50">{SVID_LABELS[s]}</span>
                      ))}
                    </div>

                    {deletingUser === n.id && (
                      <div className="mt-4 ml-14 p-4 bg-red-500/5 rounded-lg border border-red-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          <div>
                            <p className="text-sm text-red-400 font-medium">Eyða notanda?</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              <span className="text-white/60">{n.nafn}</span> verður fjarlægður úr kerfinu. Ekki er hægt að afturkalla þetta.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <button
                            onClick={() => setDeletingUser(null)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Hætta við
                          </button>
                          <button
                            onClick={() => deleteNotandi(n.id)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
                          >
                            Eyða
                          </button>
                        </div>
                      </div>
                    )}

                    {editingUser === n.id && (
                      <div className="mt-4 ml-14 p-4 bg-white/[0.02] rounded-lg border border-white/5 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-2">Hlutverk</label>
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(hlutverkLysingar) as Hlutverk[]).map(h => {
                              const info = hlutverkLysingar[h];
                              return (
                                <button
                                  key={h}
                                  onClick={() => updateHlutverk(n.id, h)}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    n.hlutverk === h
                                      ? 'border-blue-500/50 bg-blue-600/20 text-blue-400'
                                      : 'border-white/5 text-white/50 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {info.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-2">Aðgangur að sviðum</label>
                          <div className="flex gap-3">
                            {(['langtimaleiga', 'flotaleiga'] as Svid[]).map(s => (
                              <button
                                key={s}
                                onClick={() => toggleSvid(n.id, s)}
                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                  n.svid.includes(s)
                                    ? 'border-green-500/50 bg-green-600/20 text-green-400'
                                    : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${n.svid.includes(s) ? 'border-green-400 bg-green-400' : 'border-white/30'}`}>
                                  {n.svid.includes(s) && (
                                    <svg className="w-2 h-2 text-[#161822]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                {SVID_LABELS[s]}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-white/30 mt-2">
                            {n.svid.includes('langtimaleiga') && !n.svid.includes('flotaleiga')
                              ? '⚠ Þessi notandi sér EKKI flotaleigu gögn'
                              : n.svid.includes('flotaleiga')
                                ? '✓ Þessi notandi sér bæði svið'
                                : ''
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'adgangur' && (
        <div className="space-y-6">
          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Aðgangsstýringar – Reglur</h2>
              <p className="text-xs text-white/40 mt-1">Hvernig sviðaaðskilnaður virkar í kerfinu</p>
            </div>
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-600/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-semibold text-blue-400">Langtímaleiga</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span>Sér viðskiptavini á langtímaleigu</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span>Sér samninga tengda langtímaleigu</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span>Sér bíla sem eru á langtímasamningum</li>
                    <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span>Sér <strong className="text-white/80">EKKI</strong> flotaleigu gögn</li>
                    <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span>Tölvupóstur sendur á viðskiptavin þegar samningur rennur út</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-600/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <h3 className="text-sm font-semibold text-purple-400">Flotaleiga</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>Sér <strong className="text-white/80">bæði</strong> flota- og langtímaleigu gögn</li>
                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>Sér alla samninga og viðskiptavini</li>
                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>Sér alla bíla í kerfinu</li>
                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>Innri tilkynning þegar flotasamningur rennur út</li>
                    <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">•</span>Full yfirsýn yfir allt kerfið</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white mb-3">Hlutverka yfirlit</h3>
                <div className="space-y-3">
                  {(Object.entries(hlutverkLysingar) as [Hlutverk, typeof hlutverkLysingar[Hlutverk]][]).map(([key, val]) => {
                    const count = localNotendur.filter(n => n.hlutverk === key && n.virkur).length;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: val.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/80">{val.label}</span>
                            <span className="text-[10px] text-white/30">{count} virkir</span>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">{val.lysing}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#161822] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Aðgangsyfirlit notenda</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Notandi</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Hlutverk</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-white/40">Langtímaleiga</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-white/40">Flotaleiga</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-white/40">Staða</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {localNotendur.map(n => {
                    const hl = hlutverkLysingar[n.hlutverk];
                    return (
                      <tr key={n.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <div className="text-white/80">{n.nafn}</div>
                          <div className="text-xs text-white/30">{n.netfang}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: hl.color + '20', color: hl.color }}>
                            {hl.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {n.svid.includes('langtimaleiga') ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-red-400">✕</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {n.svid.includes('flotaleiga') ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-red-400">✕</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${n.virkur ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {n.virkur ? 'Virkur' : 'Óvirkur'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'almennt' && (
        <div className="space-y-6">
          <div className="bg-[#161822] rounded-xl border border-white/5 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Fyrirtækjaupplýsingar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1">Nafn fyrirtækis</label>
                <input defaultValue="Enterprise bílaleiga" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Sími</label>
                <input defaultValue="+354 519 9330" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Netfang</label>
                <input defaultValue="eleiga@eleiga.is" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Heimilisfang</label>
                <input defaultValue="Vatnsmýrarvegur 10, 101 Reykjavík" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
              </div>
            </div>
          </div>

          <div className="bg-[#161822] rounded-xl border border-white/5 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Sjálfvirkni stillingar</h2>
            <div className="space-y-3">
              {[
                { label: 'Sjálfvirk verkefni þegar samningur rennur út', desc: 'Stofna verkefni sjálfkrafa 1 mánuð fyrir samningslok', on: true },
                { label: 'Tölvupóstur á viðskiptavin (langtímaleiga)', desc: 'Senda tölvupóst á viðskiptavin þegar 1 mánuður er í skil', on: true },
                { label: 'Innri tilkynning (flotaleiga)', desc: 'Senda innri tilkynningu á stjórnanda þegar flotasamningur rennur út', on: true },
                { label: 'Þjónustuáminning 2 vikum fyrir', desc: 'Sjálfvirk áminning þegar þjónusta er áætluð', on: true },
                { label: 'Eftirfylgnipóstur eftir afhendingu', desc: 'Senda sjálfvirkan eftirfylgnipóst 1 viku eftir afhendingu bíls', on: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-white/80">{item.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
                  </div>
                  <div className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${item.on ? 'bg-green-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.on ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
