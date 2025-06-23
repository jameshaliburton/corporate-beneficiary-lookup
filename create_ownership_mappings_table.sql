-- Create ownership_mappings table
CREATE TABLE IF NOT EXISTS ownership_mappings (
  id SERIAL PRIMARY KEY,
  brand_name TEXT NOT NULL UNIQUE,
  regional_entity TEXT,
  intermediate_entity TEXT,
  ultimate_owner_name TEXT NOT NULL,
  ultimate_owner_country TEXT NOT NULL,
  ultimate_owner_flag TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for efficient case-insensitive brand name search
CREATE INDEX IF NOT EXISTS idx_ownership_mappings_brand_name 
ON ownership_mappings USING gin(to_tsvector('english', brand_name));

-- Add a simple text index for exact matches
CREATE INDEX IF NOT EXISTS idx_ownership_mappings_brand_name_exact 
ON ownership_mappings (LOWER(brand_name));

-- Insert some sample data for testing
INSERT INTO ownership_mappings (brand_name, regional_entity, intermediate_entity, ultimate_owner_name, ultimate_owner_country, ultimate_owner_flag, notes) VALUES
('Kit Kat', 'Nestlé Japan', 'Nestlé Japan Ltd.', 'Nestlé S.A.', 'Switzerland', '🇨🇭', 'Nestlé Japan subsidiary'),
('Nestlé Toll House', 'Nestlé USA', 'Nestlé USA Inc.', 'Nestlé S.A.', 'Switzerland', '🇨🇭', 'US chocolate chip brand'),
('Coca-Cola', 'Coca-Cola Company', 'The Coca-Cola Company', 'The Coca-Cola Company', 'United States', '🇺🇸', 'Direct ownership'),
('Pepsi', 'PepsiCo', 'PepsiCo Inc.', 'PepsiCo Inc.', 'United States', '🇺🇸', 'Direct ownership'),
('Doritos', 'PepsiCo', 'Frito-Lay (PepsiCo)', 'PepsiCo Inc.', 'United States', '🇺🇸', 'Frito-Lay subsidiary'),
('Lay''s', 'PepsiCo', 'Frito-Lay (PepsiCo)', 'PepsiCo Inc.', 'United States', '🇺🇸', 'Frito-Lay subsidiary'),
('Snickers', 'Mars', 'Mars Inc.', 'Mars Inc.', 'United States', '🇺🇸', 'Direct ownership'),
('M&M''s', 'Mars', 'Mars Inc.', 'Mars Inc.', 'United States', '🇺🇸', 'Direct ownership'),
('Twix', 'Mars', 'Mars Inc.', 'Mars Inc.', 'United States', '🇺🇸', 'Direct ownership'),
('Skittles', 'Mars', 'Mars Inc.', 'Mars Inc.', 'United States', '🇺🇸', 'Direct ownership'),
('Cadbury', 'Mondelez', 'Mondelez International', 'Mondelez International', 'United States', '🇺🇸', 'Kraft Foods spin-off'),
('Oreo', 'Mondelez', 'Mondelez International', 'Mondelez International', 'United States', '🇺🇸', 'Kraft Foods spin-off'),
('Milka', 'Mondelez', 'Mondelez International', 'Mondelez International', 'United States', '🇺🇸', 'Kraft Foods spin-off'),
('Toblerone', 'Mondelez', 'Mondelez International', 'Mondelez International', 'United States', '🇺🇸', 'Kraft Foods spin-off'),
('Hershey''s', 'Hershey Company', 'The Hershey Company', 'The Hershey Company', 'United States', '🇺🇸', 'Direct ownership'),
('Reese''s', 'Hershey Company', 'The Hershey Company', 'The Hershey Company', 'United States', '🇺🇸', 'Direct ownership'),
('Kinder', 'Ferrero', 'Ferrero Group', 'Ferrero Group', 'Italy', '🇮🇹', 'Direct ownership'),
('Nutella', 'Ferrero', 'Ferrero Group', 'Ferrero Group', 'Italy', '🇮🇹', 'Direct ownership'),
('Ferrero Rocher', 'Ferrero', 'Ferrero Group', 'Ferrero Group', 'Italy', '🇮🇹', 'Direct ownership'),
('Lindt', 'Lindt & Sprüngli', 'Lindt & Sprüngli AG', 'Lindt & Sprüngli AG', 'Switzerland', '🇨🇭', 'Direct ownership'); 