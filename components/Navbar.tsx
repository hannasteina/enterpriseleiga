'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold text-lg">
            E
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Enterprise Leiga
          </span>
        </a>

        <div className="hidden sm:flex items-center gap-6">
          <a
            href="/"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Forsíða
          </a>
          <a
            href="/leiga"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Leiga
          </a>
          <a
            href="/um"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Um okkur
          </a>
          {user && (
            <a
              href="/dashboard"
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
            >
              Stjórnborð
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-[var(--border)]" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface)] transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[150px] truncate">
                  {user.email}
                </span>
                <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg">
                    <div className="px-4 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-[var(--muted)]">Innskráð/ur</p>
                    </div>
                    <a
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors"
                    >
                      Stjórnborð
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Útskráning
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <a
              href="/innskraning"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors"
            >
              Innskráning
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
