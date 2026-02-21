import { createSupabaseServer } from './supabase-server'
import type { Profile, UserRole } from './types'

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data as Profile | null
}

export function hasRole(profile: Profile | null, roles: UserRole[]): boolean {
  if (!profile) return false
  return roles.includes(profile.role)
}

export function isAdmin(profile: Profile | null): boolean {
  return hasRole(profile, ['admin', 'super_admin'])
}

export function isSuperAdmin(profile: Profile | null): boolean {
  return hasRole(profile, ['super_admin'])
}
