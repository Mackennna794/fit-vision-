export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'seller' | 'buyer'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'seller' | 'buyer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'seller' | 'buyer'
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          seller_id: string
          key: string
          tier: 'starter' | 'growth' | 'enterprise'
          is_active: boolean
          requests_count: number
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          key: string
          tier?: 'starter' | 'growth' | 'enterprise'
          is_active?: boolean
          requests_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          key?: string
          tier?: 'starter' | 'growth' | 'enterprise'
          is_active?: boolean
          requests_count?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string | null
          name: string
          category: 'top' | 'bottom' | 'headwear'
          price: number
          image_url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          seller_id?: string | null
          name: string
          category: 'top' | 'bottom' | 'headwear'
          price: number
          image_url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string | null
          name?: string
          category?: 'top' | 'bottom' | 'headwear'
          price?: number
          image_url?: string
          description?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductCategory = Product['category']
export type ApiKeyTier = ApiKey['tier']
export type UserRole = Profile['role']
