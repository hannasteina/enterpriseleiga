export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          entity_id: string
          entity_type: string
          id: string
          lysing: string | null
          notandi: string | null
          tegund: string
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          entity_id: string
          entity_type: string
          id?: string
          lysing?: string | null
          notandi?: string | null
          tegund: string
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          lysing?: string | null
          notandi?: string | null
          tegund?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      athugasemdir: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          hofundur: string
          id: string
          texti: string
          verkefni_id: string
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          hofundur: string
          id?: string
          texti: string
          verkefni_id: string
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          hofundur?: string
          id?: string
          texti?: string
          verkefni_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athugasemdir_verkefni_id_fkey"
            columns: ["verkefni_id"]
            isOneToOne: false
            referencedRelation: "verkefni"
            referencedColumns: ["id"]
          },
        ]
      }
      bilar: {
        Row: {
          arsger: number | null
          bila_flokkur: string | null
          created_at: string | null
          ekinkm: number | null
          fyrirtaeki_id: string | null
          id: string
          image_url: string | null
          litur: string | null
          naesti_thjonusta: string | null
          numer: string
          samningur_id: string | null
          sidasta_thjonusta: string | null
          skiptigerd: string | null
          status: string | null
          tegund: string
          updated_at: string | null
          verd_fra: number | null
        }
        Insert: {
          arsger?: number | null
          bila_flokkur?: string | null
          created_at?: string | null
          ekinkm?: number | null
          fyrirtaeki_id?: string | null
          id?: string
          image_url?: string | null
          litur?: string | null
          naesti_thjonusta?: string | null
          numer: string
          samningur_id?: string | null
          sidasta_thjonusta?: string | null
          skiptigerd?: string | null
          status?: string | null
          tegund: string
          updated_at?: string | null
          verd_fra?: number | null
        }
        Update: {
          arsger?: number | null
          bila_flokkur?: string | null
          created_at?: string | null
          ekinkm?: number | null
          fyrirtaeki_id?: string | null
          id?: string
          image_url?: string | null
          litur?: string | null
          naesti_thjonusta?: string | null
          numer?: string
          samningur_id?: string | null
          sidasta_thjonusta?: string | null
          skiptigerd?: string | null
          status?: string | null
          tegund?: string
          updated_at?: string | null
          verd_fra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bilar_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bilar_samningur_id_fkey"
            columns: ["samningur_id"]
            isOneToOne: false
            referencedRelation: "samningar"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          lokad_af: string | null
          lokid: boolean | null
          rod: number | null
          skilabod: string | null
          texti: string
          uthlutad_a: string | null
          verkefni_id: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          lokad_af?: string | null
          lokid?: boolean | null
          rod?: number | null
          skilabod?: string | null
          texti: string
          uthlutad_a?: string | null
          verkefni_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          lokad_af?: string | null
          lokid?: boolean | null
          rod?: number | null
          skilabod?: string | null
          texti?: string
          uthlutad_a?: string | null
          verkefni_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_verkefni_id_fkey"
            columns: ["verkefni_id"]
            isOneToOne: false
            referencedRelation: "verkefni"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          efni: string
          flokkur: string | null
          id: string
          lysing: string | null
          nafn: string
          texti: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          efni: string
          flokkur?: string | null
          id?: string
          lysing?: string | null
          nafn: string
          texti: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          efni?: string
          flokkur?: string | null
          id?: string
          lysing?: string | null
          nafn?: string
          texti?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ferl_skref: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          id: string
          lysing: string | null
          nafn: string
          rod: number | null
          sjalfvirkt: boolean | null
          solutaekifaeri_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          id?: string
          lysing?: string | null
          nafn: string
          rod?: number | null
          sjalfvirkt?: boolean | null
          solutaekifaeri_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          id?: string
          lysing?: string | null
          nafn?: string
          rod?: number | null
          sjalfvirkt?: boolean | null
          solutaekifaeri_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferl_skref_solutaekifaeri_id_fkey"
            columns: ["solutaekifaeri_id"]
            isOneToOne: false
            referencedRelation: "solutaekifaeri"
            referencedColumns: ["id"]
          },
        ]
      }
      fundir: {
        Row: {
          abyrgdaradili: string | null
          created_at: string | null
          dagsetning: string
          fyrirtaeki_id: string | null
          id: string
          lokadagsetning: string | null
          lysing: string | null
          mal_id: string | null
          samningur_id: string | null
          solutaekifaeri_id: string | null
          stadsetning: string | null
          tegund: string | null
          titill: string
          updated_at: string | null
        }
        Insert: {
          abyrgdaradili?: string | null
          created_at?: string | null
          dagsetning: string
          fyrirtaeki_id?: string | null
          id?: string
          lokadagsetning?: string | null
          lysing?: string | null
          mal_id?: string | null
          samningur_id?: string | null
          solutaekifaeri_id?: string | null
          stadsetning?: string | null
          tegund?: string | null
          titill: string
          updated_at?: string | null
        }
        Update: {
          abyrgdaradili?: string | null
          created_at?: string | null
          dagsetning?: string
          fyrirtaeki_id?: string | null
          id?: string
          lokadagsetning?: string | null
          lysing?: string | null
          mal_id?: string | null
          samningur_id?: string | null
          solutaekifaeri_id?: string | null
          stadsetning?: string | null
          tegund?: string | null
          titill?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundir_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundir_mal_id_fkey"
            columns: ["mal_id"]
            isOneToOne: false
            referencedRelation: "mal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundir_samningur_id_fkey"
            columns: ["samningur_id"]
            isOneToOne: false
            referencedRelation: "samningar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fundir_solutaekifaeri_id_fkey"
            columns: ["solutaekifaeri_id"]
            isOneToOne: false
            referencedRelation: "solutaekifaeri"
            referencedColumns: ["id"]
          },
        ]
      }
      fyrirtaeki: {
        Row: {
          created_at: string | null
          heimilisfang: string | null
          id: string
          kennitala: string | null
          nafn: string
          pipi_tegund: string | null
          stofnad: string | null
          svid: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          heimilisfang?: string | null
          id?: string
          kennitala?: string | null
          nafn: string
          pipi_tegund?: string | null
          stofnad?: string | null
          svid: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          heimilisfang?: string | null
          id?: string
          kennitala?: string | null
          nafn?: string
          pipi_tegund?: string | null
          stofnad?: string | null
          svid?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      herferdir: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          id: string
          litur: string | null
          lysing: string | null
          nafn: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          id?: string
          litur?: string | null
          lysing?: string | null
          nafn: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          id?: string
          litur?: string | null
          lysing?: string | null
          nafn?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leiguferill: {
        Row: {
          aetlad_dagsetning: string | null
          athugasemd: string | null
          created_at: string | null
          id: string
          raunveruleg_dagsetning: string | null
          samningur_id: string
          sjalfvirkt: boolean | null
          status: string | null
          stig: string
          updated_at: string | null
        }
        Insert: {
          aetlad_dagsetning?: string | null
          athugasemd?: string | null
          created_at?: string | null
          id?: string
          raunveruleg_dagsetning?: string | null
          samningur_id: string
          sjalfvirkt?: boolean | null
          status?: string | null
          stig: string
          updated_at?: string | null
        }
        Update: {
          aetlad_dagsetning?: string | null
          athugasemd?: string | null
          created_at?: string | null
          id?: string
          raunveruleg_dagsetning?: string | null
          samningur_id?: string
          sjalfvirkt?: boolean | null
          status?: string | null
          stig?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leiguferill_samningur_id_fkey"
            columns: ["samningur_id"]
            isOneToOne: false
            referencedRelation: "samningar"
            referencedColumns: ["id"]
          },
        ]
      }
      mal: {
        Row: {
          abyrgdaradili: string | null
          bill_id: string | null
          created_at: string | null
          forgangur: string | null
          fyrirtaeki_id: string
          id: string
          lysing: string | null
          samningur_id: string | null
          sidast_uppfaert: string | null
          status: string | null
          stofnad: string | null
          tegund: string | null
          titill: string
          updated_at: string | null
        }
        Insert: {
          abyrgdaradili?: string | null
          bill_id?: string | null
          created_at?: string | null
          forgangur?: string | null
          fyrirtaeki_id: string
          id?: string
          lysing?: string | null
          samningur_id?: string | null
          sidast_uppfaert?: string | null
          status?: string | null
          stofnad?: string | null
          tegund?: string | null
          titill: string
          updated_at?: string | null
        }
        Update: {
          abyrgdaradili?: string | null
          bill_id?: string | null
          created_at?: string | null
          forgangur?: string | null
          fyrirtaeki_id?: string
          id?: string
          lysing?: string | null
          samningur_id?: string | null
          sidast_uppfaert?: string | null
          status?: string | null
          stofnad?: string | null
          tegund?: string | null
          titill?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mal_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bilar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mal_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mal_samningur_id_fkey"
            columns: ["samningur_id"]
            isOneToOne: false
            referencedRelation: "samningar"
            referencedColumns: ["id"]
          },
        ]
      }
      markhopar: {
        Row: {
          created_at: string | null
          id: string
          litur: string | null
          lysing: string | null
          nafn: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          litur?: string | null
          lysing?: string | null
          nafn: string
        }
        Update: {
          created_at?: string | null
          id?: string
          litur?: string | null
          lysing?: string | null
          nafn?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          hlutverk: string | null
          id: string
          role: string
          svid: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          hlutverk?: string | null
          id: string
          role?: string
          svid?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          hlutverk?: string | null
          id?: string
          role?: string
          svid?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      samningar: {
        Row: {
          akstur_km_manudir: number | null
          athugasemdir: string | null
          bilanumer: string | null
          bilategund: string | null
          created_at: string | null
          fyrirtaeki_id: string
          id: string
          lokadagur: string
          manadalegur_kostnadur: number | null
          status: string | null
          tegund: string
          tryggingar_pakki: string | null
          updated_at: string | null
          upphafsdagur: string
        }
        Insert: {
          akstur_km_manudir?: number | null
          athugasemdir?: string | null
          bilanumer?: string | null
          bilategund?: string | null
          created_at?: string | null
          fyrirtaeki_id: string
          id?: string
          lokadagur: string
          manadalegur_kostnadur?: number | null
          status?: string | null
          tegund: string
          tryggingar_pakki?: string | null
          updated_at?: string | null
          upphafsdagur: string
        }
        Update: {
          akstur_km_manudir?: number | null
          athugasemdir?: string | null
          bilanumer?: string | null
          bilategund?: string | null
          created_at?: string | null
          fyrirtaeki_id?: string
          id?: string
          lokadagur?: string
          manadalegur_kostnadur?: number | null
          status?: string | null
          tegund?: string
          tryggingar_pakki?: string | null
          updated_at?: string | null
          upphafsdagur?: string
        }
        Relationships: [
          {
            foreignKeyName: "samningar_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
        ]
      }
      samnings_skjol: {
        Row: {
          created_at: string | null
          dagsett: string | null
          file_url: string | null
          id: string
          nafn: string
          samningur_id: string
          staerd: string | null
          tegund: string | null
        }
        Insert: {
          created_at?: string | null
          dagsett?: string | null
          file_url?: string | null
          id?: string
          nafn: string
          samningur_id: string
          staerd?: string | null
          tegund?: string | null
        }
        Update: {
          created_at?: string | null
          dagsett?: string | null
          file_url?: string | null
          id?: string
          nafn?: string
          samningur_id?: string
          staerd?: string | null
          tegund?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "samnings_skjol_samningur_id_fkey"
            columns: ["samningur_id"]
            isOneToOne: false
            referencedRelation: "samningar"
            referencedColumns: ["id"]
          },
        ]
      }
      solutaekifaeri: {
        Row: {
          abyrgdarmadur_id: string | null
          created_at: string | null
          dagsetning: string | null
          fyrirtaeki_id: string
          id: string
          lysing: string | null
          naesti_kontaktur: string | null
          pipaline_stig: number | null
          pipi_tegund: string | null
          sidasti_kontaktur: string | null
          stig: string | null
          stofnandi_id: string | null
          tengilidir_id: string | null
          titill: string
          updated_at: string | null
          updated_by: string | null
          verdmaeti: number | null
        }
        Insert: {
          abyrgdarmadur_id?: string | null
          created_at?: string | null
          dagsetning?: string | null
          fyrirtaeki_id: string
          id?: string
          lysing?: string | null
          naesti_kontaktur?: string | null
          pipaline_stig?: number | null
          pipi_tegund?: string | null
          sidasti_kontaktur?: string | null
          stig?: string | null
          stofnandi_id?: string | null
          tengilidir_id?: string | null
          titill: string
          updated_at?: string | null
          updated_by?: string | null
          verdmaeti?: number | null
        }
        Update: {
          abyrgdarmadur_id?: string | null
          created_at?: string | null
          dagsetning?: string | null
          fyrirtaeki_id?: string
          id?: string
          lysing?: string | null
          naesti_kontaktur?: string | null
          pipaline_stig?: number | null
          pipi_tegund?: string | null
          sidasti_kontaktur?: string | null
          stig?: string | null
          stofnandi_id?: string | null
          tengilidir_id?: string | null
          titill?: string
          updated_at?: string | null
          updated_by?: string | null
          verdmaeti?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solutaekifaeri_abyrgdarmadur_id_fkey"
            columns: ["abyrgdarmadur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutaekifaeri_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutaekifaeri_stofnandi_id_fkey"
            columns: ["stofnandi_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutaekifaeri_tengilidir_id_fkey"
            columns: ["tengilidir_id"]
            isOneToOne: false
            referencedRelation: "tengilidir"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutaekifaeri_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tengilidir: {
        Row: {
          adaltengilidir: boolean | null
          ahugamal: string[] | null
          created_at: string | null
          fyrirtaeki_id: string | null
          id: string
          nafn: string
          netfang: string | null
          simi: string | null
          stada: string | null
          titill: string | null
          updated_at: string | null
        }
        Insert: {
          adaltengilidir?: boolean | null
          ahugamal?: string[] | null
          created_at?: string | null
          fyrirtaeki_id?: string | null
          id?: string
          nafn: string
          netfang?: string | null
          simi?: string | null
          stada?: string | null
          titill?: string | null
          updated_at?: string | null
        }
        Update: {
          adaltengilidir?: boolean | null
          ahugamal?: string[] | null
          created_at?: string | null
          fyrirtaeki_id?: string | null
          id?: string
          nafn?: string
          netfang?: string | null
          simi?: string | null
          stada?: string | null
          titill?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tengilidir_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
        ]
      }
      tengilidir_athugasemdir: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          hofundur: string
          id: string
          tengilidir_id: string
          texti: string
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          hofundur: string
          id?: string
          tengilidir_id: string
          texti: string
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          hofundur?: string
          id?: string
          tengilidir_id?: string
          texti?: string
        }
        Relationships: [
          {
            foreignKeyName: "tengilidir_athugasemdir_tengilidir_id_fkey"
            columns: ["tengilidir_id"]
            isOneToOne: false
            referencedRelation: "tengilidir"
            referencedColumns: ["id"]
          },
        ]
      }
      tengilidir_herferdir: {
        Row: {
          herferd_id: string
          tengilidir_id: string
        }
        Insert: {
          herferd_id: string
          tengilidir_id: string
        }
        Update: {
          herferd_id?: string
          tengilidir_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tengilidir_herferdir_herferd_id_fkey"
            columns: ["herferd_id"]
            isOneToOne: false
            referencedRelation: "herferdir"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tengilidir_herferdir_tengilidir_id_fkey"
            columns: ["tengilidir_id"]
            isOneToOne: false
            referencedRelation: "tengilidir"
            referencedColumns: ["id"]
          },
        ]
      }
      tengilidir_markhopar: {
        Row: {
          markhopur_id: string
          tengilidir_id: string
        }
        Insert: {
          markhopur_id: string
          tengilidir_id: string
        }
        Update: {
          markhopur_id?: string
          tengilidir_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tengilidir_markhopar_markhopur_id_fkey"
            columns: ["markhopur_id"]
            isOneToOne: false
            referencedRelation: "markhopar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tengilidir_markhopar_tengilidir_id_fkey"
            columns: ["tengilidir_id"]
            isOneToOne: false
            referencedRelation: "tengilidir"
            referencedColumns: ["id"]
          },
        ]
      }
      tengilidir_samskipti: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          hofundur: string
          id: string
          lysing: string | null
          tegund: string
          tengilidir_id: string
          titill: string
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          hofundur: string
          id?: string
          lysing?: string | null
          tegund: string
          tengilidir_id: string
          titill: string
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          hofundur?: string
          id?: string
          lysing?: string | null
          tegund?: string
          tengilidir_id?: string
          titill?: string
        }
        Relationships: [
          {
            foreignKeyName: "tengilidir_samskipti_tengilidir_id_fkey"
            columns: ["tengilidir_id"]
            isOneToOne: false
            referencedRelation: "tengilidir"
            referencedColumns: ["id"]
          },
        ]
      }
      thjonustu_ferill: {
        Row: {
          bill_id: string
          created_at: string | null
          dagsetning: string
          id: string
          km: number | null
          kostnadur: number | null
          lysing: string | null
          stadur: string | null
          tegund: string | null
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          dagsetning: string
          id?: string
          km?: number | null
          kostnadur?: number | null
          lysing?: string | null
          stadur?: string | null
          tegund?: string | null
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          dagsetning?: string
          id?: string
          km?: number | null
          kostnadur?: number | null
          lysing?: string | null
          stadur?: string | null
          tegund?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thjonustu_ferill_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bilar"
            referencedColumns: ["id"]
          },
        ]
      }
      thjonustuaminningar: {
        Row: {
          bill_id: string
          created_at: string | null
          dags_aminningar: string | null
          dags_thjonustu: string
          id: string
          innri_tilkynning: boolean | null
          sendt_vidskiptavini: boolean | null
          status: string | null
          tegund: string | null
          updated_at: string | null
        }
        Insert: {
          bill_id: string
          created_at?: string | null
          dags_aminningar?: string | null
          dags_thjonustu: string
          id?: string
          innri_tilkynning?: boolean | null
          sendt_vidskiptavini?: boolean | null
          status?: string | null
          tegund?: string | null
          updated_at?: string | null
        }
        Update: {
          bill_id?: string
          created_at?: string | null
          dags_aminningar?: string | null
          dags_thjonustu?: string
          id?: string
          innri_tilkynning?: boolean | null
          sendt_vidskiptavini?: boolean | null
          status?: string | null
          tegund?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thjonustuaminningar_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bilar"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_usage: {
        Row: {
          id: string
          tool_id: string
          tool_name: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          tool_id: string
          tool_name: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          tool_id?: string
          tool_name?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_logins: {
        Row: {
          id: string
          ip_address: string | null
          logged_in_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          logged_in_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          logged_in_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          disabled_at: string | null
          disabled_reason: string | null
          display_name: string | null
          is_disabled: boolean | null
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          display_name?: string | null
          is_disabled?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          display_name?: string | null
          is_disabled?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tool_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          tool_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          tool_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: []
      }
      verkefni: {
        Row: {
          abyrgdaradili: string | null
          bill_id: string | null
          created_at: string | null
          dagsetning: string | null
          deadline: string | null
          deild: string | null
          fyrirtaeki_id: string | null
          id: string
          lysing: string | null
          samningur_id: string | null
          sjalfvirkt: boolean | null
          status: string | null
          stofnad_af: string | null
          titill: string
          updated_at: string | null
        }
        Insert: {
          abyrgdaradili?: string | null
          bill_id?: string | null
          created_at?: string | null
          dagsetning?: string | null
          deadline?: string | null
          deild?: string | null
          fyrirtaeki_id?: string | null
          id?: string
          lysing?: string | null
          samningur_id?: string | null
          sjalfvirkt?: boolean | null
          status?: string | null
          stofnad_af?: string | null
          titill: string
          updated_at?: string | null
        }
        Update: {
          abyrgdaradili?: string | null
          bill_id?: string | null
          created_at?: string | null
          dagsetning?: string | null
          deadline?: string | null
          deild?: string | null
          fyrirtaeki_id?: string | null
          id?: string
          lysing?: string | null
          samningur_id?: string | null
          sjalfvirkt?: boolean | null
          status?: string | null
          stofnad_af?: string | null
          titill?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verkefni_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bilar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verkefni_fyrirtaeki_id_fkey"
            columns: ["fyrirtaeki_id"]
            isOneToOne: false
            referencedRelation: "fyrirtaeki"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verkefni_samningur_id_fkey"
            columns: ["samningur_id"]
            isOneToOne: false
            referencedRelation: "samningar"
            referencedColumns: ["id"]
          },
        ]
      }
      verkefni_notifications: {
        Row: {
          created_at: string | null
          dagsetning: string | null
          fra_nafn: string | null
          id: string
          lesid: boolean | null
          skilabod: string | null
          tegund: string | null
          til_notanda_id: string | null
          verkefni_id: string
        }
        Insert: {
          created_at?: string | null
          dagsetning?: string | null
          fra_nafn?: string | null
          id?: string
          lesid?: boolean | null
          skilabod?: string | null
          tegund?: string | null
          til_notanda_id?: string | null
          verkefni_id: string
        }
        Update: {
          created_at?: string | null
          dagsetning?: string | null
          fra_nafn?: string | null
          id?: string
          lesid?: boolean | null
          skilabod?: string | null
          tegund?: string | null
          til_notanda_id?: string | null
          verkefni_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verkefni_notifications_til_notanda_id_fkey"
            columns: ["til_notanda_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verkefni_notifications_verkefni_id_fkey"
            columns: ["verkefni_id"]
            isOneToOne: false
            referencedRelation: "verkefni"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expiring_contracts: { Args: never; Returns: Json }
      check_service_reminders: { Args: never; Returns: Json }
      get_admin_users_list: {
        Args: never
        Returns: {
          disabled_at: string
          display_name: string
          email: string
          is_admin: boolean
          is_disabled: boolean
          last_login: string
          last_sign_in_at: string
          login_count: number
          registered_at: string
          tool_usage_count: number
          user_id: string
        }[]
      }
      get_user_svid: { Args: never; Returns: string[] }
      get_user_tool_access: {
        Args: { check_user_id: string }
        Returns: {
          granted_at: string
          tool_id: string
        }[]
      }
      has_tool_access: {
        Args: { check_tool_id: string; check_user_id: string }
        Returns: boolean
      }
      is_admin_or_super: { Args: never; Returns: boolean }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      set_user_tool_access: {
        Args: {
          granting_user_id: string
          target_user_id: string
          tool_ids: string[]
        }
        Returns: number
      }
      user_has_svid: { Args: { check_svid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
