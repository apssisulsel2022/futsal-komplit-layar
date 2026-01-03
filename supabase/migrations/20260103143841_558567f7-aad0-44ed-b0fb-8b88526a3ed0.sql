-- Insert Provinsi
INSERT INTO public.provinsi (name, code) VALUES 
('Sulawesi Selatan', '73');

-- Get provinsi ID and insert Kabupaten/Kota
INSERT INTO public.kabupaten_kota (name, code, provinsi_id)
SELECT name, code, (SELECT id FROM public.provinsi WHERE name = 'Sulawesi Selatan') as provinsi_id
FROM (VALUES 
  ('Kota Makassar', '7371'),
  ('Kabupaten Gowa', '7306'),
  ('Kabupaten Maros', '7309'),
  ('Kabupaten Takalar', '7305'),
  ('Kabupaten Bone', '7311')
) AS t(name, code);