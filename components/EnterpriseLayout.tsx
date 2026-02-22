'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { searchBilar, type Bill } from '@/lib/enterprise-demo-data';
import { EnterpriseThemeProvider, useEnterpriseTheme } from '@/components/enterprise-theme-provider';

const navItems = [
  { href: '/', label: 'Yfirlit', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/bilar', label: 'Bílar', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M21 12.75V6.375a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 6.375v6.375' },
  { href: '/vidskiptavinir', label: 'Viðskiptavinir', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/samningar', label: 'Samningar', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  { href: '/solutaekifaeri', label: 'Sala', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { href: '/malaskraning', label: 'Málaskráning', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/thjonusta', label: 'Áminningar', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { href: '/verkefnalisti', label: 'Verkefni', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/skyrslur', label: 'Skýrslur', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/stillingar', label: 'Stillingar', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];


function BilaLeit({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Bill[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.trim().length >= 1) {
      setResults(searchBilar(val));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const go = (b: Bill) => {
    setQuery('');
    setOpen(false);
    onNavigate?.();
    router.push(`/bilar/${b.id}`);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Leita að bílnúmeri..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white placeholder:text-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e2030] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map(b => (
            <button
              key={b.id}
              onClick={() => go(b)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded bg-blue-600/20 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h17.25M21 12.75V6.375a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 6.375v6.375" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">{b.numer}</div>
                <div className="text-[10px] text-white/40 truncate">{b.tegund}</div>
              </div>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 shrink-0">{b.bilaFlokkur}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e2030] border border-white/10 rounded-lg shadow-xl z-50 px-3 py-4 text-center text-xs text-white/40">
          Enginn bíll fannst
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useEnterpriseTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors w-full"
      title={theme === 'dark' ? 'Skipta í ljóst þema' : 'Skipta í dökkt þema'}
    >
      {theme === 'dark' ? (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
      {theme === 'dark' ? 'Ljóst þema' : 'Dökkt þema'}
    </button>
  );
}

function EnterpriseDemoInner({ children }: { children: React.ReactNode }) {
  const { theme } = useEnterpriseTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isPublicRoute = pathname.startsWith('/golfmot');
  if (isPublicRoute) {
    return (
      <div data-enterprise-theme={theme} className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div data-enterprise-theme={theme} className="min-h-screen bg-[#0f1117] flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#161822] border-r border-white/5 z-50 transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-white/5">
            <Link href="/" className="block">
              <Image
                src="/enterprise-logo.svg"
                alt="Enterprise rent-a-car"
                width={200}
                height={40}
                className="w-auto h-8 object-contain"
                priority
              />
              <div className="flex items-center gap-3 mt-3 text-[10px] text-white/30">
                <span>519-9330</span>
                <span>•</span>
                <span>eleiga@eleiga.is</span>
              </div>
            </Link>
          </div>

          <div className="px-3 pt-3">
            <BilaLeit onNavigate={() => setSidebarOpen(false)} />
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 pt-0 border-t border-white/5">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-[#161822]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-white">Enterprise Bílaleiga</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnterpriseThemeProvider>
      <EnterpriseDemoInner>{children}</EnterpriseDemoInner>
    </EnterpriseThemeProvider>
  );
}
