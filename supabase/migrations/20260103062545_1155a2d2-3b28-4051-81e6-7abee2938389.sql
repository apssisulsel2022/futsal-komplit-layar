
-- First create kabupaten_kota table
CREATE TABLE IF NOT EXISTS public.kabupaten_kota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.kabupaten_kota ENABLE ROW LEVEL SECURITY;

-- Add kabupaten_kota_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kabupaten_kota_id UUID REFERENCES public.kabupaten_kota(id);
