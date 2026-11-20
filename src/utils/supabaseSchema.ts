// ============================================================================
// ADARSH MOTORS - UNIFIED SUPABASE DATABASE SCHEMA (CORRECTED & BULLETPROOF)
// Bridges Customer Website (https://adarsh-motors-site.netlify.app/)
// and Admin Management Panel (Adarsh Motors Elite Showroom)
// ============================================================================

export const UNIFIED_SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- ADARSH MOTORS - UNIFIED SUPABASE DATABASE SCHEMA (CORRECTED & BULLETPROOF)
-- Bridges Customer Website & Admin Panel (itmarysfybhcrmvnggyy)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 0: SAFE CLEANUP FOR ANY INCOMPATIBLE VIEWS OR OLD TABLES
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop views if any table was accidentally created as a view
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'invoices') THEN
    DROP VIEW public.invoices CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'accessories') THEN
    DROP VIEW public.accessories CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'customers') THEN
    DROP VIEW public.customers CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'leads') THEN
    DROP VIEW public.leads CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'bikes') THEN
    DROP VIEW public.bikes CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'site_settings') THEN
    DROP VIEW public.site_settings CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'branches') THEN
    DROP VIEW public.branches CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'staff_users') THEN
    DROP VIEW public.staff_users CASCADE;
  END IF;

  -- If accessories table exists but lacks "title", drop it cleanly so it recreates fresh
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accessories') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accessories' AND column_name = 'title') THEN
      DROP TABLE public.accessories CASCADE;
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. TABLE: bikes (Live Vehicle Fleet & Inventory for Customer Site & Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Superbikes',
  year INTEGER NOT NULL DEFAULT 2024,
  km TEXT NOT NULL DEFAULT '0 km',
  engine TEXT DEFAULT '998 cc WSBK Spec',
  hp TEXT DEFAULT '200 hp',
  price_raw NUMERIC DEFAULT 0,
  price TEXT NOT NULL DEFAULT '₹0',
  location TEXT NOT NULL DEFAULT 'Hyderabad – Main Showroom',
  image_url TEXT NOT NULL DEFAULT '/assets/aistudio/image_f4045ab9.png',
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  badge TEXT NOT NULL DEFAULT 'PRE-OWNED',
  fuel TEXT NOT NULL DEFAULT 'Petrol',
  fuel_type TEXT DEFAULT 'Petrol',
  acceleration TEXT NOT NULL DEFAULT '3.0s',
  displacement_cc TEXT DEFAULT '1000 cc',
  engine_type TEXT DEFAULT 'Inline-4 Engine',
  max_power TEXT DEFAULT '200 hp',
  tagline TEXT DEFAULT 'Pure performance motorcycle.',
  addon_name TEXT DEFAULT 'Ducati Corse Riding Leather',
  addon_price TEXT DEFAULT '₹38,500',
  addon_gear_name TEXT DEFAULT 'Ducati Corse Riding Leather',
  addon_gear_price NUMERIC DEFAULT 38500,
  colorways JSONB DEFAULT '[]'::jsonb,
  warranty_badge TEXT DEFAULT 'Adarsh Verified: 120-Point Inspection, Clear Title & 1-Year Engine Warranty.',
  status TEXT DEFAULT 'Available',
  purchase_cost NUMERIC DEFAULT 0,
  repair_cost NUMERIC DEFAULT 0,
  procurement_date DATE DEFAULT CURRENT_DATE,
  repairs_note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Upgrade existing bikes table if already created without dropping existing records:
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Superbikes';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2024;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS km TEXT DEFAULT '0 km';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS engine TEXT DEFAULT '998 cc WSBK Spec';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS hp TEXT DEFAULT '200 hp';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS price_raw NUMERIC DEFAULT 0;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS price TEXT DEFAULT '₹0';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Hyderabad – Main Showroom';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '/assets/aistudio/image_f4045ab9.png';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'PRE-OWNED';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS fuel TEXT DEFAULT 'Petrol';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS fuel_type TEXT DEFAULT 'Petrol';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS acceleration TEXT DEFAULT '3.0s';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS displacement_cc TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS engine_type TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS max_power TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS addon_name TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS addon_price TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS addon_gear_name TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS addon_gear_price NUMERIC DEFAULT 0;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS colorways JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS warranty_badge TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC DEFAULT 0;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS repair_cost NUMERIC DEFAULT 0;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS procurement_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS repairs_note TEXT;

-- ----------------------------------------------------------------------------
-- 2. TABLE: accessories (Standalone Superbike Accessories Inventory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accessories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  stock_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  initial_stock INTEGER DEFAULT 0,
  description TEXT,
  compatibility_models JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  is_visible_on_portal BOOLEAN DEFAULT true,
  warranty_badge TEXT,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS stock_count INTEGER DEFAULT 0;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 0;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS compatibility_models JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS is_visible_on_portal BOOLEAN DEFAULT true;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS warranty_badge TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS sku TEXT;

-- ----------------------------------------------------------------------------
-- 3. TABLE: customers (Customer KYC, Profiles & RTO Paper Transfer Status)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  alt_phone TEXT,
  address TEXT,
  city TEXT DEFAULT 'Hyderabad',
  kyc_status TEXT DEFAULT 'Pending',
  paper_transfer_status TEXT DEFAULT 'Pending',
  paper_transfer_notes TEXT,
  rto_application_no TEXT,
  rto_office TEXT,
  form_29_30_date DATE,
  transfer_completion_date DATE,
  timeline JSONB DEFAULT '[]'::jsonb,
  bike_purchases JSONB DEFAULT '[]'::jsonb,
  service_logs JSONB DEFAULT '[]'::jsonb,
  accessory_purchases JSONB DEFAULT '[]'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS alt_phone TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Hyderabad';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'Pending';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS paper_transfer_status TEXT DEFAULT 'Pending';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS paper_transfer_notes TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS rto_application_no TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS rto_office TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS form_29_30_date DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS transfer_completion_date DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS bike_purchases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS service_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS accessory_purchases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- ----------------------------------------------------------------------------
-- 4. TABLE: leads (Customer Website Inquiries: Test Ride, Exchange, Service, Loan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id BIGSERIAL PRIMARY KEY,
  type TEXT DEFAULT 'Inquiry',
  name TEXT,
  customer_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  bike_model TEXT,
  bike_interested TEXT,
  year TEXT,
  km TEXT,
  expected_price TEXT,
  condition TEXT,
  photos_count INTEGER DEFAULT 0,
  preferred_date TEXT,
  license_status TEXT,
  branch TEXT,
  service_type TEXT,
  loan_amount TEXT,
  tenure TEXT,
  employment_type TEXT,
  message TEXT,
  notes TEXT,
  status TEXT DEFAULT 'New',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Inquiry';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS bike_model TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS bike_interested TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New';

-- ----------------------------------------------------------------------------
-- 5. TABLE: invoices (Customer My Garage 2FA Lookup & Dealership Billing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  invoice_id TEXT,
  customer_name TEXT,
  owner TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT DEFAULT 'kannapavan30@gmail.com',
  vehicle TEXT NOT NULL DEFAULT '',
  reg_no TEXT,
  reg_number TEXT,
  vin TEXT,
  price NUMERIC DEFAULT 0,
  payment_mode TEXT DEFAULT 'UPI',
  delivery_date TEXT,
  warranty TEXT,
  last_service TEXT,
  next_service TEXT,
  service_advisor TEXT,
  has_echarger BOOLEAN DEFAULT false,
  echarger_details TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  delivery_note JSONB DEFAULT '{}'::jsonb,
  show_price_view BOOLEAN DEFAULT false,
  show_price_public BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS email TEXT DEFAULT 'kannapavan30@gmail.com';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reg_no TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reg_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'UPI';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_date TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS last_service TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS next_service TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS service_advisor TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS has_echarger BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS echarger_details TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_note JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS show_price_view BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS show_price_public BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- ----------------------------------------------------------------------------
-- 6. TABLE: branches (Showroom & Lounge Locations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  name TEXT,
  branch_name TEXT,
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '+91 9014540489',
  timings TEXT DEFAULT 'Mon – Sun: 10:00 AM – 8:30 PM',
  maps_url TEXT,
  maps_query TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS branch_name TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS maps_url TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS maps_query TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- ----------------------------------------------------------------------------
-- 7. TABLE: site_settings (Hero Carousel, Section Visibility Toggles & Contacts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  value JSONB,
  phone TEXT DEFAULT '+91 9014540489',
  instagram TEXT DEFAULT 'https://instagram.com/adarshmotors',
  hero_slides JSONB,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+91 9014540489';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_slides JSONB;

-- ----------------------------------------------------------------------------
-- 8. TABLE: staff_users (Staff Authentication, PINs & Permissions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  permissions JSONB DEFAULT '["leads", "inventory", "accessories", "customers", "sections"]'::jsonb,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- STEP 9: ROW LEVEL SECURITY (RLS) POLICIES
-- Enables bidirectional communication between Customer Netlify App and Admin Panel
-- ----------------------------------------------------------------------------
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Drop prior policies to avoid duplicate policy conflicts
DROP POLICY IF EXISTS "Anon bikes all" ON public.bikes;
DROP POLICY IF EXISTS "Anon accessories all" ON public.accessories;
DROP POLICY IF EXISTS "Anon customers all" ON public.customers;
DROP POLICY IF EXISTS "Anon leads all" ON public.leads;
DROP POLICY IF EXISTS "Anon invoices all" ON public.invoices;
DROP POLICY IF EXISTS "Anon branches all" ON public.branches;
DROP POLICY IF EXISTS "Anon site_settings all" ON public.site_settings;
DROP POLICY IF EXISTS "Anon staff_users all" ON public.staff_users;

DROP POLICY IF EXISTS "Allow anon for bikes" ON public.bikes;
DROP POLICY IF EXISTS "Allow anon for leads" ON public.leads;
DROP POLICY IF EXISTS "Allow anon for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow anon for branches" ON public.branches;
DROP POLICY IF EXISTS "Allow anon for site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anon for staff_users" ON public.staff_users;
DROP POLICY IF EXISTS "Allow anon for accessories" ON public.accessories;
DROP POLICY IF EXISTS "Allow anon for customers" ON public.customers;

DROP POLICY IF EXISTS "Public can view bikes" ON public.bikes;
DROP POLICY IF EXISTS "Public can view branches" ON public.branches;
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can lookup their invoice by phone" ON public.invoices;
DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;

-- Grant comprehensive anonymous read/write access for both web apps
CREATE POLICY "Anon bikes all" ON public.bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon accessories all" ON public.accessories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon customers all" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon leads all" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon invoices all" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon branches all" ON public.branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon site_settings all" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon staff_users all" ON public.staff_users FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- STEP 10: SEED OWNER ACCOUNT, SHOWROOM DATA & SECTION CONTROLS
-- ----------------------------------------------------------------------------
-- 10.1 Default Owner Staff Account (Phone: 9014540489, PIN: 2026)
INSERT INTO public.staff_users (name, phone, pin, role, permissions, status)
VALUES ('Kanna Pavan (Owner)', '9014540489', '2026', 'owner', '["leads", "inventory", "accessories", "customers", "sections", "billing", "settings"]'::jsonb, 'Active')
ON CONFLICT (phone) DO UPDATE SET
  pin = EXCLUDED.pin,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

-- 10.2 Default Website Section Visibility Settings & Hero Slides
INSERT INTO public.site_settings (key, phone, instagram, value, hero_slides)
VALUES (
  'global_config',
  '+91 9014540489',
  'https://instagram.com/adarshmotors',
  '{
    "enableInventoryFleet": true,
    "enableAccessoriesSection": true,
    "enableWorkshopBooking": true,
    "enableExchangeBike": true,
    "enableTestRide": true,
    "enableFinanceEmi": true,
    "enableCustomerDocHub": true,
    "enablePromoBanner": true,
    "enableShowroomBranches": true,
    "enableCommunityRides": true,
    "salesPhone": "+91 9014540489",
    "whatsapp": "+91 9014540489"
  }'::jsonb,
  '[
    {
      "id": "buy",
      "badge": "Certified Fleet · Live Inventory",
      "title": "Buy Your Dream Bike.",
      "description": "Handpicked, 150-point inspected premium superbikes. Guaranteed clean title, ready for instant physical inspection & delivery.",
      "image": "/assets/aistudio/image_f4045ab9.png"
    },
    {
      "id": "sell",
      "badge": "Fastest Two-Wheeler Valuation",
      "title": "Sell Your Bike in 15 Mins.",
      "description": "Best market price guaranteed. Submit your vehicle photos for quick valuation, instant bank transfer, and zero brokerage.",
      "image": "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png"
    },
    {
      "id": "service",
      "badge": "Factory-Trained Superbike Care",
      "title": "Get Your Superbike Serviced.",
      "description": "Specialized ECU diagnostics, suspension tuning, genuine OEM spares, and track-ready dyno service by certified master techs.",
      "image": "/assets/aistudio/image_b40a39bd.png"
    }
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- 10.3 Initial Superbike Accessories Seed
INSERT INTO public.accessories (id, title, brand, category, price, stock_count, description, compatibility_models, image_url, gallery_urls, is_visible_on_portal, warranty_badge, sku)
VALUES
  ('acc_1', 'Akrapovič Titanium Slip-On Racing Exhaust', 'Akrapovič', 'Exhaust & Performance', 185000, 4, 'Full titanium silencer with carbon fiber heat shield and end cap. Delivers +4.2 kW power boost and 3.8 kg weight reduction.', '["Ducati Diavel V4", "Ducati Panigale V2", "Kawasaki Ninja Z900", "BMW S1000RR M-Sport"]'::jsonb, '/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png', '["/assets/aistudio/Screenshot_2026-10-27_171108_18bf6569.png", "/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png"]'::jsonb, true, 'Official 2-Year Akrapovič Warranty', 'AKR-TIT-V4-RACE'),
  ('acc_2', 'Dainese Misano 2 D-Air Wireless Airbag Suit', 'Dainese', 'Riding Gear & Protection', 145000, 2, 'MotoGP-derived kangaroo leather suit with internal intelligent wireless airbag system, titanium shoulder plates, and replaceable knee sliders.', '["Universal Superbike", "Ducati Panigale V2", "BMW S1000RR M-Sport"]'::jsonb, '/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png', '["/assets/aistudio/Screenshot_2026-10-27_171123_5ece9d25.png"]'::jsonb, true, 'Certified FIM / MotoGP Airbag Tech', 'DAI-MIS-D-AIR-V2'),
  ('acc_3', 'Brembo GP4-RX Billet Radial Brake Calipers (Pair)', 'Brembo', 'Braking & Controls', 115000, 3, 'CNC-machined from aluminum billet with nickel-coating finish. Equipped with 4x32 mm pistons for phenomenal track-stopping power.', '["BMW S1000RR", "Ducati Panigale V4", "Kawasaki Ninja ZX-10R", "Aprilia RSV4"]'::jsonb, '/assets/aistudio/image_5cecd00f.png', '["/assets/aistudio/image_5cecd00f.png"]'::jsonb, true, 'Direct Factory Brembo Italy Guarantee', 'BRM-GP4-RX-NICKEL')
ON CONFLICT (id) DO NOTHING;

-- 10.4 Initial Customer KYC Profile with RTO Paper Transfer Record
INSERT INTO public.customers (id, name, mobile, email, alt_phone, address, city, kyc_status, paper_transfer_status, paper_transfer_notes, rto_application_no, rto_office, form_29_30_date, transfer_completion_date, timeline, bike_purchases, service_logs, accessory_purchases, internal_notes)
VALUES (
  'cust_1',
  'Kanna Pavan',
  '9014540489',
  'kannapavan30@gmail.com',
  '+91 9876543210',
  'Plot 42, Jubilee Hills, Road No. 36',
  'Hyderabad',
  'Verified',
  'In Progress',
  'Form 29/30 signed by previous owner. Submitted to RTO Khairatabad. Awaiting smartcard printing.',
  'TS09-RTO-2026-8812',
  'RTO Khairatabad (TS-09)',
  '2026-02-15',
  NULL,
  '[
    {"timestamp": "2026-02-15T11:00:00Z", "stage": "Documents Received", "note": "Received physical RC copy, insurance, and Form 29/30 from buyer", "by": "Admin"},
    {"timestamp": "2026-02-18T14:30:00Z", "stage": "RTO Submission", "note": "Submitted file to RTO Khairatabad agent. Application TS09-RTO-2026-8812 generated.", "by": "RTO Executive"}
  ]'::jsonb,
  '[{"id": "bp_1", "bike_name": "Kawasaki Ninja Z900 (Special Edition)", "reg_number": "TS 09 EG 7744", "purchase_price": 920000, "purchase_date": "2024-01-14", "invoice_number": "INV-2024-ADM-8492"}]'::jsonb,
  '[{"id": "srv_1", "date": "2024-02-22", "service_type": "First 1,000 KM Inspection & Motul 300V Flush", "odometer_km": 1050, "cost": 6500, "technician": "Vikram Reddy"}]'::jsonb,
  '[{"id": "acc_p1", "accessory_name": "Akrapovič Titanium Slip-On", "amount": 185000, "date": "2024-01-14"}]'::jsonb,
  'VIP customer. Prefers WhatsApp updates on RTO transfer.'
)
ON CONFLICT (id) DO NOTHING;

-- 10.5 Initial Showroom Fleet Seed (Live Inventory so customer site is immediately populated)
INSERT INTO public.bikes (id, name, brand, category, year, km, engine, hp, price_raw, price, location, image_url, badge, fuel, acceleration, tagline, addon_name, addon_price)
VALUES
  ('bike-1', 'KAWASAKI NINJA Z900', 'Kawasaki', 'Superbikes', 2024, '1,456 km', '948 cc Inline-4', '125 hp', 920000, '₹9,20,000', 'Hyderabad – Main Showroom', '/assets/aistudio/image_f4045ab9.png', 'PRE-OWNED', 'Petrol', '3.4s', 'Raw inline-4 symphony with Sugomi attitude.', 'KTM / Kawasaki Racing Jacket', '₹16,500'),
  ('bike-2', 'BMW S1000RR M-SPORT', 'BMW', 'Superbikes', 2024, '3,200 km', '999 cc ShiftCam', '205 hp', 2350000, '₹23,50,000', 'Hyderabad – Banjara Hills', '/assets/aistudio/Screenshot_2026-10-27_171056_6ccfcea2.png', 'PRE-OWNED', 'Petrol', '2.9s', 'Track weapon with aerodynamic carbon winglets.', 'BMW M Carbon Helmet', '₹42,000'),
  ('bike-3', 'DUCATI DIAVEL V4', 'Ducati', 'Superbikes', 2024, '1,112 km', 'V4 1158 cc Granturismo', '168 hp', 2890000, '₹28,90,000', 'Hyderabad – Main Showroom', '/assets/aistudio/image_b40a39bd.png', 'PRE-OWNED', 'Petrol', '3.1s', 'Muscular stance with superbike heart.', 'Ducati Corse Riding Leather', '₹38,500')
ON CONFLICT (id) DO NOTHING;

-- 10.6 Initial Showroom Branches Seed
INSERT INTO public.branches (id, name, branch_name, city, address, phone, timings, maps_query, maps_url)
VALUES
  ('hyd-main', 'Hyderabad – Main Superbike Showroom', 'Hyderabad – Main Superbike Showroom', 'Hyderabad', 'Plot 48, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033', '+91 9014540489', 'Mon – Sun: 10:00 AM – 8:30 PM (Valet lounge)', 'Adarsh+Motors+Jubilee+Hills+Hyderabad', 'https://maps.google.com/?q=Adarsh+Motors+Jubilee+Hills+Hyderabad'),
  ('hyd-banjara', 'Hyderabad – Banjara Hills Superbike Lounge', 'Hyderabad – Banjara Hills Superbike Lounge', 'Hyderabad', 'Road No. 12, MLA Colony, Banjara Hills, Hyderabad, Telangana 500034', '+91 9014540489', 'Mon – Sun: 10:30 AM – 8:00 PM', 'Adarsh+Motors+Banjara+Hills+Hyderabad', 'https://maps.google.com/?q=Adarsh+Motors+Banjara+Hills+Hyderabad')
ON CONFLICT (id) DO NOTHING;
`;
