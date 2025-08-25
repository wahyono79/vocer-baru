import { createClient } from '@supabase/supabase-js'

// Gunakan import.meta.env, bukan process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Cek konfigurasi Supabase
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.includes('supabase.co') &&
    typeof supabaseKey === 'string' &&
    supabaseKey.length > 100 // JWT tokens are longer than 100 characters
  )
}

// Tipe Database tetap sama
export type Database = {
  public: {
    Tables: {
      sales: {
        Row: {
          id: string
          tanggal: string
          nama_pelanggan: string
          paket: '24 Jam' | '7 Hari' | '15 Hari' | '30 Hari'
          harga: number
          kode_voucher: string
          fee_penjual: number
          setoran_bersih: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tanggal: string
          nama_pelanggan: string
          paket: '24 Jam' | '7 Hari' | '15 Hari' | '30 Hari'
          harga: number
          kode_voucher: string
          fee_penjual: number
          setoran_bersih: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tanggal?: string
          nama_pelanggan?: string
          paket?: '24 Jam' | '7 Hari' | '15 Hari' | '30 Hari'
          harga?: number
          kode_voucher?: string
          fee_penjual?: number
          setoran_bersih?: number
          created_at?: string
          updated_at?: string
        }
      }
      history: {
        Row: {
          id: string
          sales_id: string | null
          tanggal: string
          nama_pelanggan: string
          paket: string
          harga: number
          kode_voucher: string
          fee_penjual: number
          setoran_bersih: number
          tanggal_setor: string
          created_at: string
        }
        Insert: {
          id?: string
          sales_id?: string | null
          tanggal: string
          nama_pelanggan: string
          paket: string
          harga: number
          kode_voucher: string
          fee_penjual: number
          setoran_bersih: number
          tanggal_setor: string
          created_at?: string
        }
        Update: {
          id?: string
          sales_id?: string | null
          tanggal?: string
          nama_pelanggan?: string
          paket?: string
          harga?: number
          kode_voucher?: string
          fee_penjual?: number
          setoran_bersih?: number
          tanggal_setor?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          message: string
          type: 'success' | 'error' | 'info'
          timestamp: string
          read: boolean
        }
        Insert: {
          id?: string
          message: string
          type: 'success' | 'error' | 'info'
          timestamp?: string
          read?: boolean
        }
        Update: {
          id?: string
          message?: string
          type?: 'success' | 'error' | 'info'
          timestamp?: string
          read?: boolean
        }
      }
    }
  }
}
