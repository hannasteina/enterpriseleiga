import { getSupabaseBrowserClient } from './supabase-browser'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']
export type DbFyrirtaeki = Tables['fyrirtaeki']['Row']
export type DbBill = Tables['bilar']['Row']
export type DbSamningur = Tables['samningar']['Row']
export type DbTengilidir = Tables['tengilidir']['Row']
export type DbSolutaekifaeri = Tables['solutaekifaeri']['Row']
export type DbFerlSkref = Tables['ferl_skref']['Row']
export type DbMal = Tables['mal']['Row']
export type DbVerkefni = Tables['verkefni']['Row']
export type DbChecklistItem = Tables['checklist_items']['Row']
export type DbAthugasemd = Tables['athugasemdir']['Row']
export type DbThjonustuaminning = Tables['thjonustuaminningar']['Row']
export type DbThjonustuFerill = Tables['thjonustu_ferill']['Row']
export type DbFundur = Tables['fundir']['Row']
export type DbActivity = Tables['activities']['Row']
export type DbLeiguferill = Tables['leiguferill']['Row']
export type DbMarkhopur = Tables['markhopar']['Row']
export type DbHerferd = Tables['herferdir']['Row']
export type DbEmailTemplate = Tables['email_templates']['Row']
export type DbProfile = Tables['profiles']['Row']

function supabase() {
  return getSupabaseBrowserClient()
}

// ============ FYRIRTÆKI ============

export async function fetchFyrirtaeki() {
  const { data, error } = await supabase()
    .from('fyrirtaeki')
    .select('*')
    .order('nafn')
  if (error) throw error
  return data
}

export async function fetchFyrirtaekiById(id: string) {
  const { data, error } = await supabase()
    .from('fyrirtaeki')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchFyrirtaekiMedTengilidum() {
  const { data, error } = await supabase()
    .from('fyrirtaeki')
    .select(`
      *,
      tengilidir (*)
    `)
    .order('nafn')
  if (error) throw error
  return data
}

// ============ BÍLAR ============

export async function fetchBilar() {
  const { data, error } = await supabase()
    .from('bilar')
    .select('*')
    .order('numer')
  if (error) throw error
  return data
}

export async function fetchBillById(id: string) {
  const { data, error } = await supabase()
    .from('bilar')
    .select(`
      *,
      fyrirtaeki (*),
      samningar (*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchBilarByFyrirtaeki(fyrirtaekiId: string) {
  const { data, error } = await supabase()
    .from('bilar')
    .select('*')
    .eq('fyrirtaeki_id', fyrirtaekiId)
  if (error) throw error
  return data
}

// ============ SAMNINGAR ============

export async function fetchSamningar() {
  const { data, error } = await supabase()
    .from('samningar')
    .select(`
      *,
      fyrirtaeki (id, nafn)
    `)
    .order('lokadagur', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchSamningarByFyrirtaeki(fyrirtaekiId: string) {
  const { data, error } = await supabase()
    .from('samningar')
    .select('*')
    .eq('fyrirtaeki_id', fyrirtaekiId)
  if (error) throw error
  return data
}

export async function fetchExpiringContracts(days: number = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase()
    .from('samningar')
    .select(`*, fyrirtaeki (id, nafn)`)
    .in('status', ['virkur', 'rennur_ut'])
    .lte('lokadagur', futureDate.toISOString().split('T')[0])
    .gte('lokadagur', new Date().toISOString().split('T')[0])
  if (error) throw error
  return data
}

// ============ TENGILIÐIR ============

export async function fetchTengilidir() {
  const { data, error } = await supabase()
    .from('tengilidir')
    .select(`
      *,
      fyrirtaeki (id, nafn, svid),
      tengilidir_markhopar (markhopur_id),
      tengilidir_herferdir (herferd_id),
      tengilidir_athugasemdir (*),
      tengilidir_samskipti (*)
    `)
    .order('nafn')
  if (error) throw error
  return data
}

// ============ SÖLUTÆKIFÆRI ============

export async function fetchSolutaekifaeri() {
  const { data, error } = await supabase()
    .from('solutaekifaeri')
    .select(`
      *,
      fyrirtaeki (id, nafn),
      tengilidir (id, nafn),
      ferl_skref (*)
    `)
    .order('dagsetning', { ascending: false })
  if (error) throw error
  return data
}

// ============ MÁL ============

export async function fetchMal() {
  const { data, error } = await supabase()
    .from('mal')
    .select(`
      *,
      fyrirtaeki (id, nafn)
    `)
    .order('stofnad', { ascending: false })
  if (error) throw error
  return data
}

// ============ VERKEFNI ============

export async function fetchVerkefni() {
  const { data, error } = await supabase()
    .from('verkefni')
    .select(`
      *,
      fyrirtaeki (id, nafn),
      checklist_items (*),
      athugasemdir (*)
    `)
    .order('deadline', { ascending: true })
  if (error) throw error
  return data
}

// ============ ÞJÓNUSTUÁMINNINGAR ============

export async function fetchThjonustuaminningar() {
  const { data, error } = await supabase()
    .from('thjonustuaminningar')
    .select(`
      *,
      bilar (id, numer, tegund, fyrirtaeki_id)
    `)
    .order('dags_thjonustu', { ascending: true })
  if (error) throw error
  return data
}

// ============ ÞJÓNUSTUFERILL ============

export async function fetchThjonustuFerill(billId: string) {
  const { data, error } = await supabase()
    .from('thjonustu_ferill')
    .select('*')
    .eq('bill_id', billId)
    .order('dagsetning', { ascending: false })
  if (error) throw error
  return data
}

// ============ FUNDIR ============

export async function fetchFundir() {
  const { data, error } = await supabase()
    .from('fundir')
    .select(`
      *,
      fyrirtaeki (id, nafn)
    `)
    .order('dagsetning', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchUpcomingFundir() {
  const { data, error } = await supabase()
    .from('fundir')
    .select(`
      *,
      fyrirtaeki (id, nafn)
    `)
    .gte('dagsetning', new Date().toISOString())
    .order('dagsetning', { ascending: true })
    .limit(10)
  if (error) throw error
  return data
}

// ============ LEIGUFERILL ============

export async function fetchLeiguferill(samningurId: string) {
  const { data, error } = await supabase()
    .from('leiguferill')
    .select('*')
    .eq('samningur_id', samningurId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function updateLeiguferillStep(id: string, status: string) {
  const { data, error } = await supabase()
    .from('leiguferill')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============ ACTIVITIES ============

export async function fetchActivities(entityType?: string, entityId?: string) {
  let query = supabase()
    .from('activities')
    .select('*')
    .order('dagsetning', { ascending: false })
    .limit(50)

  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ============ MARKHOPAR & HERFERDIR ============

export async function fetchMarkhopar() {
  const { data, error } = await supabase()
    .from('markhopar')
    .select('*')
  if (error) throw error
  return data
}

export async function fetchHerferdir() {
  const { data, error } = await supabase()
    .from('herferdir')
    .select('*')
  if (error) throw error
  return data
}

// ============ EMAIL TEMPLATES ============

export async function fetchEmailTemplates() {
  const { data, error } = await supabase()
    .from('email_templates')
    .select('*')
  if (error) throw error
  return data
}

// ============ DASHBOARD STATS ============

export async function fetchDashboardStats() {
  const [
    { count: virkirSamningar },
    { count: rennurUt },
    { count: heildarBilar },
    { count: iLeigu },
    { count: lausir },
    { count: opinMal },
    { count: heildarFyrirtaeki },
  ] = await Promise.all([
    supabase().from('samningar').select('*', { count: 'exact', head: true }).in('status', ['virkur', 'rennur_ut']),
    supabase().from('samningar').select('*', { count: 'exact', head: true }).eq('status', 'rennur_ut'),
    supabase().from('bilar').select('*', { count: 'exact', head: true }),
    supabase().from('bilar').select('*', { count: 'exact', head: true }).eq('status', 'í leigu'),
    supabase().from('bilar').select('*', { count: 'exact', head: true }).in('status', ['laus', 'uppseldur']),
    supabase().from('mal').select('*', { count: 'exact', head: true }).neq('status', 'lokað'),
    supabase().from('fyrirtaeki').select('*', { count: 'exact', head: true }),
  ])

  return {
    virkirSamningar: virkirSamningar ?? 0,
    rennurUtSamningar: rennurUt ?? 0,
    heildarBilar: heildarBilar ?? 0,
    iLeigu: iLeigu ?? 0,
    lausir: lausir ?? 0,
    opinMal: opinMal ?? 0,
    heildarFyrirtaeki: heildarFyrirtaeki ?? 0,
  }
}

// ============ PROFILES ============

export async function fetchCurrentProfile() {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) return null

  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data
}

// ============ AUTOMATION (call from API routes) ============

export async function runCheckExpiringContracts() {
  const { data, error } = await supabase().rpc('check_expiring_contracts')
  if (error) throw error
  return data
}

export async function runCheckServiceReminders() {
  const { data, error } = await supabase().rpc('check_service_reminders')
  if (error) throw error
  return data
}
