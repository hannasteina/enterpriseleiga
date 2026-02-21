'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/innskraning'
        return
      }
      setUser(user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data as Profile | null)
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
          <p className="mt-4 text-sm text-[var(--muted)]">Hleð...</p>
        </div>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    user: 'Notandi',
    admin: 'Stjórnandi',
    super_admin: 'Ofurstjórnandi',
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Stjórnborð</h1>
        <p className="mt-2 text-[var(--muted)]">
          Velkomin/n, {profile?.full_name || user?.email}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Netfang</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Hlutverk</p>
              <p className="font-medium">
                {profile ? roleLabels[profile.role] || profile.role : 'Ekki skráð'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Skráð/ur síðan</p>
              <p className="font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('is-IS')
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {profile?.role === 'super_admin' && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Stjórnunarsvæði</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/dashboard/notendur"
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:shadow-lg hover:border-[var(--primary-light)] transition-all"
            >
              <h3 className="font-semibold group-hover:text-[var(--primary)]">Notendur</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Stjórna notendum og hlutverkum</p>
            </a>
            <a
              href="/dashboard/leiguvörur"
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:shadow-lg hover:border-[var(--primary-light)] transition-all"
            >
              <h3 className="font-semibold group-hover:text-[var(--primary)]">Leiguvörur</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Stjórna leiguvörum og verðum</p>
            </a>
            <a
              href="/dashboard/pantanir"
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:shadow-lg hover:border-[var(--primary-light)] transition-all"
            >
              <h3 className="font-semibold group-hover:text-[var(--primary)]">Pantanir</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Skoða og stjórna pöntunum</p>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
