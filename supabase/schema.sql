-- ==============================================================================
-- FITVISION & AURAMART — COMPLETE SUPABASE SCHEMA
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

-- 1. PROFILES & ROLE-BASED ACCESS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('seller', 'buyer')) DEFAULT 'buyer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. B2B MERCHANT API KEYS (FITVISION)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  tier TEXT CHECK (tier IN ('starter', 'growth', 'enterprise')) DEFAULT 'growth',
  is_active BOOLEAN DEFAULT true,
  requests_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DYNAMIC STORE PRODUCT CATALOG (AURAMART)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('top', 'bottom', 'headwear')) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PRE-SEEDED TEST DATA (GUARANTEED PRESENTATION STABILITY)
INSERT INTO public.products (id, name, category, price, image_url, description)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Oversized Minimalist Tee', 'top', 48.00, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', 'Heavyweight organic cotton jersey with dropped shoulders.'),
  ('22222222-2222-2222-2222-222222222222', 'Monochrome Street Hoodie', 'top', 95.00, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', 'Structured loopback French terry with relaxed fit.'),
  ('33333333-3333-3333-3333-333333333333', 'Titanium Aviator Sunglasses', 'headwear', 120.00, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80', 'Ultralight titanium frame with polarized gradient lenses.')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED DEFAULT DEMO USER & API KEY
-- NOTE: Inserting directly into auth.users is not recommended in production.
-- Instead, sign up via Supabase Auth UI or the dashboard and then manually set the role.
-- The demo key below can be used immediately for hackathon demos.
INSERT INTO public.api_keys (seller_id, key, tier, is_active) 
VALUES (NULL, 'fv_live_demo_hackathon_2026', 'enterprise', true) 
ON CONFLICT DO NOTHING;

-- 6. AUTOMATED USER PROFILE TRIGGER
-- Auto-creates a profile row whenever a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- API Keys: sellers can only read their own keys
CREATE POLICY "Sellers can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Products: anyone can read; sellers can manage their own
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Sellers can insert products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

-- 8. PUBLIC STORAGE FOR CUSTOM UPLOADS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Policy" ON storage.objects 
  FOR ALL USING (bucket_id = 'product-images') 
  WITH CHECK (bucket_id = 'product-images');
