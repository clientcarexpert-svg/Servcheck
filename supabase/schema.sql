-- ServCheck Supabase schema v2 -- generated from current 35 entities
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- ========== profiles (replaces Base44 built-in User) ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'user',
  credits numeric default 0,
  invite_code text,
  referral_claimed boolean default false,
  referral_count numeric default 0,
  suburb text,
  state text,
  notifications_enabled boolean default false,
  is_premium boolean default false,
  premium_expires_at text,
  premium_cancel_scheduled boolean default false,
  savings_total numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (true);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();


-- Helper: current logged-in user's email (used as default + in RLS policies)
create or replace function public.current_user_email() returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles where id = auth.uid()
$$;

-- ========== AccountDeletion ==========
create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  user_email text,
  user_full_name text,
  deletion_reason text,
  deleted_at text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.account_deletions enable row level security;
create policy "account_deletions_select_own" on public.account_deletions for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "account_deletions_insert_own" on public.account_deletions for insert with check (user_email = public.current_user_email());
create policy "account_deletions_update_own" on public.account_deletions for update using (user_email = public.current_user_email());
create policy "account_deletions_delete_own" on public.account_deletions for delete using (user_email = public.current_user_email());

-- ========== AppStats ==========
create table public.app_stats (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  key text,
  value_number numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.app_stats enable row level security;
create policy "app_stats_select_own" on public.app_stats for select using (created_by = public.current_user_email());
create policy "app_stats_insert_own" on public.app_stats for insert with check (created_by = public.current_user_email());
create policy "app_stats_update_own" on public.app_stats for update using (created_by = public.current_user_email());
create policy "app_stats_delete_own" on public.app_stats for delete using (created_by = public.current_user_email());

-- ========== CarListing ==========
create table public.car_listings (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  car_make text,
  car_model text,
  car_year text,
  odometer numeric,
  asking_price numeric,
  state text,
  suburb text,
  transmission text,
  service_history text,
  condition text,
  description text,
  photo_urls jsonb,
  valuation_id text,
  market_price_low numeric,
  market_price_high numeric,
  market_price_average numeric,
  price_verdict text,
  is_active boolean default true,
  seller_email text,
  views_count numeric default 0,
  inquiries_count numeric default 0,
  listed_date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.car_listings enable row level security;
create policy "car_listings_select_own" on public.car_listings for select using (created_by = public.current_user_email());
create policy "car_listings_insert_own" on public.car_listings for insert with check (created_by = public.current_user_email());
create policy "car_listings_update_own" on public.car_listings for update using (created_by = public.current_user_email());
create policy "car_listings_delete_own" on public.car_listings for delete using (created_by = public.current_user_email());

-- ========== CarProfile ==========
create table public.car_profiles (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  profile_name text,
  car_make text,
  car_model text,
  car_year text,
  variant text,
  rego text,
  color text,
  state text,
  suburb text,
  transmission text,
  fuel_type text,
  service_history text,
  known_issues text,
  last_service_date text,
  last_service_odometer numeric,
  notes text,
  last_odometer numeric,
  last_valuation numeric,
  valuation_low numeric,
  valuation_high numeric,
  last_valuation_date text,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.car_profiles enable row level security;
create policy "car_profiles_select_own" on public.car_profiles for select using (created_by = public.current_user_email());
create policy "car_profiles_insert_own" on public.car_profiles for insert with check (created_by = public.current_user_email());
create policy "car_profiles_update_own" on public.car_profiles for update using (created_by = public.current_user_email());
create policy "car_profiles_delete_own" on public.car_profiles for delete using (created_by = public.current_user_email());

-- ========== CommunityPost ==========
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  state text,
  suburb text,
  service_type text,
  mechanic_name text,
  price_paid numeric,
  car_make text,
  car_model text,
  car_year text,
  is_verified boolean default false,
  receipt_url text,
  status text default 'approved',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.community_posts enable row level security;
create policy "community_posts_select_own" on public.community_posts for select using (created_by = public.current_user_email());
create policy "community_posts_insert_own" on public.community_posts for insert with check (created_by = public.current_user_email());
create policy "community_posts_update_own" on public.community_posts for update using (created_by = public.current_user_email());
create policy "community_posts_delete_own" on public.community_posts for delete using (created_by = public.current_user_email());

-- ========== CreditTransaction ==========
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  user_email text,
  action text,
  amount numeric,
  reason text,
  admin_email text,
  status text default 'success',
  stripe_payment_intent_id text,
  stripe_session_id text,
  amount_paid_aud numeric,
  stripe_refund_id text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.credit_transactions enable row level security;
create policy "credit_transactions_select_own" on public.credit_transactions for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "credit_transactions_insert_own" on public.credit_transactions for insert with check (user_email = public.current_user_email());
create policy "credit_transactions_update_own" on public.credit_transactions for update using (user_email = public.current_user_email());
create policy "credit_transactions_delete_own" on public.credit_transactions for delete using (user_email = public.current_user_email());

-- ========== DealerLead ==========
create table public.dealer_leads (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  quote_check_id text,
  dealer_id text,
  dealer_profile_id text,
  dealer_business_name text,
  user_email text,
  user_full_name text,
  car_make text,
  car_model text,
  car_year text,
  service_type text,
  suburb text,
  state text,
  quoted_price numeric,
  verdict text,
  credits_spent numeric default 10,
  user_notified boolean default false,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.dealer_leads enable row level security;
create policy "dealer_leads_select_own" on public.dealer_leads for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "dealer_leads_insert_own" on public.dealer_leads for insert with check (user_email = public.current_user_email());
create policy "dealer_leads_update_own" on public.dealer_leads for update using (user_email = public.current_user_email());
create policy "dealer_leads_delete_own" on public.dealer_leads for delete using (user_email = public.current_user_email());

-- ========== DealerProfile ==========
create table public.dealer_profiles (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  dealer_id text,
  user_email text,
  business_name text,
  abn text,
  address text,
  suburb text,
  state text,
  phone text,
  contact_name text,
  dealer_credits numeric default 20,
  is_verified boolean default false,
  is_active boolean default true,
  specialties jsonb,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.dealer_profiles enable row level security;
create policy "dealer_profiles_select_own" on public.dealer_profiles for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "dealer_profiles_insert_own" on public.dealer_profiles for insert with check (user_email = public.current_user_email());
create policy "dealer_profiles_update_own" on public.dealer_profiles for update using (user_email = public.current_user_email());
create policy "dealer_profiles_delete_own" on public.dealer_profiles for delete using (user_email = public.current_user_email());

-- ========== DiagnosticOffer ==========
create table public.diagnostic_offers (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  diagnostic_request_id text,
  mechanic_profile_id text,
  mechanic_email text,
  mechanic_business_name text,
  mechanic_suburb text,
  mechanic_type text,
  mechanic_phone text,
  user_email text,
  flat_fee numeric,
  message text,
  status text default 'pending',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.diagnostic_offers enable row level security;
create policy "diagnostic_offers_select_own" on public.diagnostic_offers for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "diagnostic_offers_insert_own" on public.diagnostic_offers for insert with check (user_email = public.current_user_email());
create policy "diagnostic_offers_update_own" on public.diagnostic_offers for update using (user_email = public.current_user_email());
create policy "diagnostic_offers_delete_own" on public.diagnostic_offers for delete using (user_email = public.current_user_email());

-- ========== DiagnosticRequest ==========
create table public.diagnostic_requests (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  user_email text,
  user_full_name text,
  car_make text,
  car_model text,
  car_year text,
  problem_description text,
  suburb text,
  state text,
  status text default 'open',
  accepted_mechanic_id text,
  accepted_mechanic_name text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.diagnostic_requests enable row level security;
create policy "diagnostic_requests_select_own" on public.diagnostic_requests for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "diagnostic_requests_insert_own" on public.diagnostic_requests for insert with check (user_email = public.current_user_email());
create policy "diagnostic_requests_update_own" on public.diagnostic_requests for update using (user_email = public.current_user_email());
create policy "diagnostic_requests_delete_own" on public.diagnostic_requests for delete using (user_email = public.current_user_email());

-- ========== DirectoryClick ==========
create table public.directory_clicks (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  business_name text,
  suburb text,
  state text,
  maps_url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.directory_clicks enable row level security;
create policy "directory_clicks_select_own" on public.directory_clicks for select using (created_by = public.current_user_email());
create policy "directory_clicks_insert_own" on public.directory_clicks for insert with check (created_by = public.current_user_email());
create policy "directory_clicks_update_own" on public.directory_clicks for update using (created_by = public.current_user_email());
create policy "directory_clicks_delete_own" on public.directory_clicks for delete using (created_by = public.current_user_email());

-- ========== FranchisePricing ==========
create table public.franchise_pricings (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  franchise text,
  service_type text,
  state text,
  suburb text,
  postcode text,
  advertised_price_aud numeric,
  price_includes text,
  source_url text,
  scraped_at text,
  car_make text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.franchise_pricings enable row level security;
create policy "franchise_pricings_select_own" on public.franchise_pricings for select using (created_by = public.current_user_email());
create policy "franchise_pricings_insert_own" on public.franchise_pricings for insert with check (created_by = public.current_user_email());
create policy "franchise_pricings_update_own" on public.franchise_pricings for update using (created_by = public.current_user_email());
create policy "franchise_pricings_delete_own" on public.franchise_pricings for delete using (created_by = public.current_user_email());

-- ========== HistoricalPricing ==========
create table public.historical_pricings (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  service_type text,
  suburb text,
  state text,
  total_quoted numeric,
  suggested_total numeric,
  bs_meter numeric,
  line_items jsonb,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.historical_pricings enable row level security;
create policy "historical_pricings_select_own" on public.historical_pricings for select using (created_by = public.current_user_email());
create policy "historical_pricings_insert_own" on public.historical_pricings for insert with check (created_by = public.current_user_email());
create policy "historical_pricings_update_own" on public.historical_pricings for update using (created_by = public.current_user_email());
create policy "historical_pricings_delete_own" on public.historical_pricings for delete using (created_by = public.current_user_email());

-- ========== LogbookEntry ==========
create table public.logbook_entrys (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  car_make text,
  car_model text,
  car_year text,
  rego text,
  odometer numeric,
  service_date text,
  service_type text,
  mechanic_name text,
  cost numeric,
  parts_replaced jsonb,
  notes text,
  next_service_km numeric,
  next_service_months numeric,
  state text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.logbook_entrys enable row level security;
create policy "logbook_entrys_select_own" on public.logbook_entrys for select using (created_by = public.current_user_email());
create policy "logbook_entrys_insert_own" on public.logbook_entrys for insert with check (created_by = public.current_user_email());
create policy "logbook_entrys_update_own" on public.logbook_entrys for update using (created_by = public.current_user_email());
create policy "logbook_entrys_delete_own" on public.logbook_entrys for delete using (created_by = public.current_user_email());

-- ========== MechanicBooking ==========
create table public.mechanic_bookings (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  mechanic_profile_id text,
  mechanic_email text,
  lead_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  car_make text,
  car_model text,
  car_year text,
  car_variant text,
  fuel_type text,
  odometer numeric,
  service_type text,
  booking_date text,
  booking_time text,
  estimated_duration_hours numeric default 1,
  agreed_price numeric,
  notes text,
  status text default 'scheduled',
  suburb text,
  state text,
  invoice_notes text,
  final_price numeric,
  completed_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.mechanic_bookings enable row level security;
create policy "mechanic_bookings_select_own" on public.mechanic_bookings for select using (created_by = public.current_user_email());
create policy "mechanic_bookings_insert_own" on public.mechanic_bookings for insert with check (created_by = public.current_user_email());
create policy "mechanic_bookings_update_own" on public.mechanic_bookings for update using (created_by = public.current_user_email());
create policy "mechanic_bookings_delete_own" on public.mechanic_bookings for delete using (created_by = public.current_user_email());

-- ========== MechanicDirectory ==========
create table public.mechanic_directorys (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  business_name text,
  address text,
  suburb text,
  state text,
  phone_number text,
  google_rating numeric,
  review_count numeric,
  maps_url text,
  last_scraped_at text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.mechanic_directorys enable row level security;
create policy "mechanic_directorys_select_own" on public.mechanic_directorys for select using (created_by = public.current_user_email());
create policy "mechanic_directorys_insert_own" on public.mechanic_directorys for insert with check (created_by = public.current_user_email());
create policy "mechanic_directorys_update_own" on public.mechanic_directorys for update using (created_by = public.current_user_email());
create policy "mechanic_directorys_delete_own" on public.mechanic_directorys for delete using (created_by = public.current_user_email());

-- ========== MechanicLead ==========
create table public.mechanic_leads (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  quote_check_id text,
  state text,
  area_type text,
  service_type text,
  is_major_service boolean default false,
  is_quick_job boolean default false,
  target_mechanic_types jsonb,
  car_make text,
  car_model text,
  car_year text,
  car_variant text,
  fuel_type text,
  transmission_type text,
  quoted_price numeric,
  verdict text,
  available_until text,
  featured_exclusive_until text,
  status text default 'available',
  claimed_by_profile_id text,
  claimed_by_email text,
  user_email text,
  user_full_name text,
  user_phone text,
  odometer numeric,
  quote_notes text,
  hidden_by_mechanic boolean default false,
  description text,
  job_completed boolean default false,
  agreed_price numeric,
  completed_at text,
  app_fair_price_low numeric,
  app_fair_price_high numeric,
  app_fair_price_average numeric,
  app_verdict text,
  app_bs_meter numeric,
  mechanic_offer_price numeric,
  mechanic_offer_reasoning text,
  mechanic_can_match boolean,
  suburb text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.mechanic_leads enable row level security;
create policy "mechanic_leads_select_own" on public.mechanic_leads for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "mechanic_leads_insert_own" on public.mechanic_leads for insert with check (user_email = public.current_user_email());
create policy "mechanic_leads_update_own" on public.mechanic_leads for update using (user_email = public.current_user_email());
create policy "mechanic_leads_delete_own" on public.mechanic_leads for delete using (user_email = public.current_user_email());

-- ========== MechanicNotification ==========
create table public.mechanic_notifications (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  mechanic_email text,
  mechanic_profile_id text,
  title text,
  message text,
  type text default 'quote_request',
  is_read boolean default false,
  quote_request_id text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.mechanic_notifications enable row level security;
create policy "mechanic_notifications_select_own" on public.mechanic_notifications for select using (created_by = public.current_user_email());
create policy "mechanic_notifications_insert_own" on public.mechanic_notifications for insert with check (created_by = public.current_user_email());
create policy "mechanic_notifications_update_own" on public.mechanic_notifications for update using (created_by = public.current_user_email());
create policy "mechanic_notifications_delete_own" on public.mechanic_notifications for delete using (created_by = public.current_user_email());

-- ========== MechanicProfile ==========
create table public.mechanic_profiles (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  mechanic_id text,
  user_email text,
  business_name text,
  mechanic_type text,
  abn text,
  address text,
  suburb text,
  postcode text,
  state text,
  phone text,
  bio text,
  specialties jsonb,
  service_radius_km numeric,
  turnaround_preference text default 'all',
  pref_job_types jsonb,
  pref_fuel_types jsonb,
  pref_car_makes jsonb,
  pref_max_odometer numeric,
  subscription_tier text default 'free',
  subscription_cancel_at text,
  is_active boolean default true,
  accepting_bookings boolean default true,
  unavailable_until text,
  estimated_turnaround_days numeric default 0,
  available_time_slots jsonb,
  mechanic_credits numeric default 0,
  free_leads_used numeric default 0,
  free_leads_reset_date text,
  mvri_licence_number text,
  mvri_licence_type text,
  utility_bill_url text,
  verification_status text default 'pending',
  verification_notes text,
  otp_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.mechanic_profiles enable row level security;
create policy "mechanic_profiles_select_own" on public.mechanic_profiles for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "mechanic_profiles_insert_own" on public.mechanic_profiles for insert with check (user_email = public.current_user_email());
create policy "mechanic_profiles_update_own" on public.mechanic_profiles for update using (user_email = public.current_user_email());
create policy "mechanic_profiles_delete_own" on public.mechanic_profiles for delete using (user_email = public.current_user_email());

-- ========== PartsPricing ==========
create table public.parts_pricings (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  part_name text,
  part_category text,
  car_make text,
  car_model text,
  car_year_from text,
  car_year_to text,
  retailer text,
  retailer_sku text,
  retail_price_aud numeric,
  was_price_aud numeric,
  product_url text,
  scraped_at text,
  brand text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.parts_pricings enable row level security;
create policy "parts_pricings_select_own" on public.parts_pricings for select using (created_by = public.current_user_email());
create policy "parts_pricings_insert_own" on public.parts_pricings for insert with check (created_by = public.current_user_email());
create policy "parts_pricings_update_own" on public.parts_pricings for update using (created_by = public.current_user_email());
create policy "parts_pricings_delete_own" on public.parts_pricings for delete using (created_by = public.current_user_email());

-- ========== PromptInsight ==========
create table public.prompt_insights (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  service_type text,
  state text,
  car_make text,
  pattern text,
  avg_quoted numeric,
  avg_estimated numeric,
  sample_count numeric,
  suggestion text,
  analysed_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.prompt_insights enable row level security;
create policy "prompt_insights_select_own" on public.prompt_insights for select using (created_by = public.current_user_email());
create policy "prompt_insights_insert_own" on public.prompt_insights for insert with check (created_by = public.current_user_email());
create policy "prompt_insights_update_own" on public.prompt_insights for update using (created_by = public.current_user_email());
create policy "prompt_insights_delete_own" on public.prompt_insights for delete using (created_by = public.current_user_email());

-- ========== QuoteCheck ==========
create table public.quote_checks (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  car_make text,
  car_model text,
  car_year text,
  service_type text,
  quoted_price numeric,
  dealership_price numeric,
  mechanic_price numeric,
  state text,
  suburb text,
  odometer numeric,
  last_service_km numeric,
  last_service_months numeric,
  quote_notes text,
  verdict text,
  price_low numeric,
  price_high numeric,
  price_average numeric,
  whats_included jsonb,
  skip_analysis jsonb,
  savings_followup_sent boolean default false,
  counter_offer numeric,
  counter_offer_reasoning text,
  summary text,
  bs_meter numeric,
  bs_meter_reasoning text,
  mechanic_questions jsonb,
  acl_warning boolean,
  acl_warning_text text,
  service_necessary boolean,
  service_necessary_reasoning text,
  feedback text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.quote_checks enable row level security;
create policy "quote_checks_select_own" on public.quote_checks for select using (created_by = public.current_user_email());
create policy "quote_checks_insert_own" on public.quote_checks for insert with check (created_by = public.current_user_email());
create policy "quote_checks_update_own" on public.quote_checks for update using (created_by = public.current_user_email());
create policy "quote_checks_delete_own" on public.quote_checks for delete using (created_by = public.current_user_email());

-- ========== QuoteRequest ==========
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  mechanic_email text,
  mechanic_profile_id text,
  mechanic_business_name text,
  user_email text,
  car_make text,
  car_model text,
  car_year text,
  service_type text,
  suburb text,
  state text,
  original_quoted_price numeric,
  odometer numeric,
  notes text,
  status text default 'pending',
  mechanic_response text,
  mechanic_quote numeric,
  user_reply text,
  mechanic_followup text,
  conversation jsonb,
  hidden_by_user boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.quote_requests enable row level security;
create policy "quote_requests_select_own" on public.quote_requests for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "quote_requests_insert_own" on public.quote_requests for insert with check (user_email = public.current_user_email());
create policy "quote_requests_update_own" on public.quote_requests for update using (user_email = public.current_user_email());
create policy "quote_requests_delete_own" on public.quote_requests for delete using (user_email = public.current_user_email());

-- ========== ReceiptAudit ==========
create table public.receipt_audits (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  user_email text,
  receipt_hash text,
  month text,
  credits_awarded numeric default 0,
  awarded_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.receipt_audits enable row level security;
create policy "receipt_audits_select_own" on public.receipt_audits for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "receipt_audits_insert_own" on public.receipt_audits for insert with check (user_email = public.current_user_email());
create policy "receipt_audits_update_own" on public.receipt_audits for update using (user_email = public.current_user_email());
create policy "receipt_audits_delete_own" on public.receipt_audits for delete using (user_email = public.current_user_email());

-- ========== ReceiptVerification ==========
create table public.receipt_verifications (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  community_post_id text,
  user_email text,
  receipt_url text,
  status text default 'pending',
  verification_notes text,
  verified_by_email text,
  verified_at text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.receipt_verifications enable row level security;
create policy "receipt_verifications_select_own" on public.receipt_verifications for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "receipt_verifications_insert_own" on public.receipt_verifications for insert with check (user_email = public.current_user_email());
create policy "receipt_verifications_update_own" on public.receipt_verifications for update using (user_email = public.current_user_email());
create policy "receipt_verifications_delete_own" on public.receipt_verifications for delete using (user_email = public.current_user_email());

-- ========== SavingsReport ==========
create table public.savings_reports (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  quote_check_id text,
  amount_saved numeric,
  comment text,
  user_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.savings_reports enable row level security;
create policy "savings_reports_select_own" on public.savings_reports for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "savings_reports_insert_own" on public.savings_reports for insert with check (user_email = public.current_user_email());
create policy "savings_reports_update_own" on public.savings_reports for update using (user_email = public.current_user_email());
create policy "savings_reports_delete_own" on public.savings_reports for delete using (user_email = public.current_user_email());

-- ========== ScrapeQueue ==========
create table public.scrape_queues (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  state text,
  area_type text,
  service_type text,
  car_make text,
  car_model text,
  car_variant text,
  status text default 'pending',
  priority numeric default 0,
  attempts numeric default 0,
  error_message text,
  cache_key text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.scrape_queues enable row level security;
create policy "scrape_queues_select_own" on public.scrape_queues for select using (created_by = public.current_user_email());
create policy "scrape_queues_insert_own" on public.scrape_queues for insert with check (created_by = public.current_user_email());
create policy "scrape_queues_update_own" on public.scrape_queues for update using (created_by = public.current_user_email());
create policy "scrape_queues_delete_own" on public.scrape_queues for delete using (created_by = public.current_user_email());

-- ========== ServicePriceCache ==========
create table public.service_price_caches (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  cache_key text,
  car_make text,
  car_model text,
  car_variant text,
  service_type text,
  state text,
  area_type text,
  source text default 'ai_batch',
  scraped_at text,
  last_updated text,
  hit_count numeric default 0,
  price_low numeric,
  price_high numeric,
  price_average numeric,
  parts_cost_low numeric,
  parts_cost_high numeric,
  labour_cost_low numeric,
  labour_cost_high numeric,
  labour_hours numeric,
  labour_rate_metro numeric,
  labour_rate_regional numeric,
  typical_markup_pct numeric,
  parts_list jsonb,
  whats_included jsonb,
  counter_offer numeric,
  counter_offer_reasoning text,
  summary text,
  mechanic_questions jsonb,
  service_necessary boolean,
  service_necessary_reasoning text,
  high_variance_caveat text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.service_price_caches enable row level security;
create policy "service_price_caches_select_own" on public.service_price_caches for select using (created_by = public.current_user_email());
create policy "service_price_caches_insert_own" on public.service_price_caches for insert with check (created_by = public.current_user_email());
create policy "service_price_caches_update_own" on public.service_price_caches for update using (created_by = public.current_user_email());
create policy "service_price_caches_delete_own" on public.service_price_caches for delete using (created_by = public.current_user_email());

-- ========== SignupLog ==========
create table public.signup_logs (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  user_email text,
  ip_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.signup_logs enable row level security;
create policy "signup_logs_select_own" on public.signup_logs for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "signup_logs_insert_own" on public.signup_logs for insert with check (user_email = public.current_user_email());
create policy "signup_logs_update_own" on public.signup_logs for update using (user_email = public.current_user_email());
create policy "signup_logs_delete_own" on public.signup_logs for delete using (user_email = public.current_user_email());

-- ========== SuburbWaitlist ==========
create table public.suburb_waitlists (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  suburb text,
  state text,
  user_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.suburb_waitlists enable row level security;
create policy "suburb_waitlists_select_own" on public.suburb_waitlists for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "suburb_waitlists_insert_own" on public.suburb_waitlists for insert with check (user_email = public.current_user_email());
create policy "suburb_waitlists_update_own" on public.suburb_waitlists for update using (user_email = public.current_user_email());
create policy "suburb_waitlists_delete_own" on public.suburb_waitlists for delete using (user_email = public.current_user_email());

-- ========== SymptomDiagnosis ==========
create table public.symptom_diagnosis (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  car_make text,
  car_model text,
  car_year text,
  fuel_type text,
  transmission text,
  odometer numeric,
  state text,
  suburb text,
  symptoms_selected jsonb,
  symptom_answers jsonb,
  recent_repairs text,
  still_driving text,
  urgency_level text,
  ranked_causes jsonb,
  repair_cost_low numeric,
  repair_cost_high numeric,
  ai_assessment text,
  general_guidance text,
  diy_tips jsonb,
  mechanic_questions jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.symptom_diagnosis enable row level security;
create policy "symptom_diagnosis_select_own" on public.symptom_diagnosis for select using (created_by = public.current_user_email());
create policy "symptom_diagnosis_insert_own" on public.symptom_diagnosis for insert with check (created_by = public.current_user_email());
create policy "symptom_diagnosis_update_own" on public.symptom_diagnosis for update using (created_by = public.current_user_email());
create policy "symptom_diagnosis_delete_own" on public.symptom_diagnosis for delete using (created_by = public.current_user_email());

-- ========== UsedCarCheck ==========
create table public.used_car_checks (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  car_make text,
  car_model text,
  car_year text,
  odometer numeric,
  asking_price numeric,
  state text,
  rego_expiry text,
  service_history text,
  known_issues text,
  num_owners numeric,
  transmission text,
  price_verdict text,
  market_price_low numeric,
  market_price_high numeric,
  market_price_average numeric,
  upcoming_costs jsonb,
  total_upcoming_low numeric,
  total_upcoming_high numeric,
  red_flags jsonb,
  green_flags jsonb,
  inspection_checklist jsonb,
  overall_score numeric,
  summary text,
  recommendation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.used_car_checks enable row level security;
create policy "used_car_checks_select_own" on public.used_car_checks for select using (created_by = public.current_user_email());
create policy "used_car_checks_insert_own" on public.used_car_checks for insert with check (created_by = public.current_user_email());
create policy "used_car_checks_update_own" on public.used_car_checks for update using (created_by = public.current_user_email());
create policy "used_car_checks_delete_own" on public.used_car_checks for delete using (created_by = public.current_user_email());

-- ========== UserAcceptances ==========
create table public.user_acceptances (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  user_email text,
  privacy_policy_accepted boolean default false,
  terms_accepted boolean default false,
  privacy_policy_version text,
  terms_version text,
  accepted_at text,
  camera_permission text default 'pending',
  install_source text default 'web',
  ip_address text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.user_acceptances enable row level security;
create policy "user_acceptances_select_own" on public.user_acceptances for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "user_acceptances_insert_own" on public.user_acceptances for insert with check (user_email = public.current_user_email());
create policy "user_acceptances_update_own" on public.user_acceptances for update using (user_email = public.current_user_email());
create policy "user_acceptances_delete_own" on public.user_acceptances for delete using (user_email = public.current_user_email());

-- ========== Workshop ==========
create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  created_by text default public.current_user_email(),
  business_name text,
  abn text,
  user_email text,
  landline_number text,
  address text,
  suburb text,
  state text,
  specialties jsonb,
  subscription_tier text default 'free',
  profile_views numeric default 0,
  legal_accepted boolean,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.workshops enable row level security;
create policy "workshops_select_own" on public.workshops for select using (user_email = public.current_user_email() or auth.role() = 'service_role');
create policy "workshops_insert_own" on public.workshops for insert with check (user_email = public.current_user_email());
create policy "workshops_update_own" on public.workshops for update using (user_email = public.current_user_email());
create policy "workshops_delete_own" on public.workshops for delete using (user_email = public.current_user_email());

-- NOTE: Several tables need broader-than-owner READ access (public directory
-- browsing, cross-user marketplace reads). Review and replace select policies
-- for these after import:
--   mechanic_directorys, workshops, community_posts, car_listings, historical_pricings,
--   franchise_pricings, parts_pricings, service_price_caches -> public read
--   mechanic_leads, diagnostic_requests, diagnostic_offers, mechanic_bookings
--     -> readable by both the customer AND the matched/claiming mechanic, not owner-only
-- Admin/system operations (broadcasts, credit grants, moderation) must run
-- server-side via Edge Functions using the service_role key, which bypasses RLS.
