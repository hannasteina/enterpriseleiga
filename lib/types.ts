export type UserRole = 'user' | 'admin' | 'super_admin'

export type Hlutverk = 'stjornandi' | 'yfirmadur' | 'soludmadur_langtima' | 'soludmadur_flota' | 'thjonustufulltrui' | 'notandi'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  svid: string[]
  hlutverk: Hlutverk
  created_at: string
  updated_at: string
}

export type LeiguferillStig =
  | 'samningur_undirritadur'
  | 'bill_afhentur'
  | 'eftirfylgnipostur_sendur'
  | 'konnun_send'
  | 'thjonusta'
  | 'skil_a_bil'
  | 'samningur_lokid'

export type LeiguferillStatus = 'lokið' | 'í gangi' | 'bíður' | 'áætlað' | 'sleppt'

export interface Leiguferill {
  id: string
  samningurId: string
  stig: LeiguferillStig
  status: LeiguferillStatus
  aetladDagsetning: string | null
  raunverulegDagsetning: string | null
  sjalfvirkt: boolean
  athugasemd: string | null
}

export interface Fundur {
  id: string
  fyrirtaekiId: string | null
  malId: string | null
  solutaekifaeriId: string | null
  samningurId: string | null
  titill: string
  lysing: string | null
  dagsetning: string
  lokadagsetning: string | null
  stadsetning: string | null
  tegund: 'fundur' | 'símtal' | 'viðburður' | 'kynning' | 'annað'
  abyrgdaradili: string | null
}
