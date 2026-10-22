-- =====================================================================
-- The Begum Beauty: database schema
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: it uses "if not exists" / "or replace" where possible.
-- =====================================================================

-- ---------- admins ----------
-- A user is an admin when their auth user id is listed here.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- shared updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- catalogue ----------
create table if not exists public.brands (
  id text primary key,
  name text not null,
  note text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  blurb text not null default '',
  image text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,                                   -- URL slug, e.g. velvet-matte-lipstick
  type text not null check (type in ('product', 'bundle')),
  name text not null,
  brand_id text references public.brands (id) on update cascade on delete set null,
  category_id text references public.categories (id) on update cascade on delete set null,
  product_type text not null default '',
  kind text not null default '',
  price int not null check (price >= 0),                 -- PKR, whole rupees
  original_price int check (original_price is null or original_price >= 0),  -- products only; bundles have one price
  stock int not null default 0 check (stock >= 0),
  rating numeric(2, 1) not null default 0,
  reviews int not null default 0,
  added_at date not null default current_date,
  bestseller boolean not null default false,
  is_new boolean not null default false,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('published', 'draft')),
  description text not null default '',
  features text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  usage text not null default '',
  images text[] not null default '{}',
  shades jsonb not null default '[]'::jsonb,             -- [{ "name": "Rosewood", "hex": "#A64F5E" }]
  items jsonb not null default '[]'::jsonb,              -- bundles: [{ "name": "...", "image": "..." }]
  tone text not null default '',
  sku text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_type_status_idx on public.products (type, status);
create index if not exists products_category_idx on public.products (category_id);
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------- marketing content ----------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  rating smallint not null default 5 check (rating between 1 and 5),
  text text not null,
  image text not null default '',
  active boolean not null default true,
  sample boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.banners (
  key text primary key check (key in ('campaign', 'promoA', 'promoB')),
  title text not null default '',
  text text not null default '',
  cta text not null default '',
  link text not null default '',
  image text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Key/value settings: 'store' (contact details, SEO) and 'myo' (Make Your Own Deal offer)
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- orders ----------
create sequence if not exists public.order_no_seq start 10001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  notes text not null default '',
  subtotal int not null default 0,        -- at regular prices
  discount int not null default 0,        -- all savings, including Make Your Own Deal
  myo_discount int not null default 0,
  delivery int not null default 0,
  total int not null default 0,
  payment text not null default 'Cash on Delivery',
  payment_status text not null default 'Unpaid',
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  name text not null,
  qty int not null check (qty > 0),
  price int not null,
  shade text
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------- place_order: the only way customers create orders ----------
-- Prices, the Make Your Own Deal discount and stock are all taken from the database,
-- so a customer cannot change what they pay from the browser.
create or replace function public.place_order(customer jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_no text;
  v_regular int := 0;
  v_sub int := 0;
  v_units int := 0;
  v_base int := 0;
  v_myo jsonb;
  v_myo_save int := 0;
  v_phone text := regexp_replace(coalesce(customer ->> 'phone', ''), '[\s-]', '', 'g');
  it jsonb;
  p public.products%rowtype;
  v_qty int;
begin
  if length(trim(coalesce(customer ->> 'name', ''))) < 3 then raise exception 'invalid_name'; end if;
  if v_phone !~ '^(\+92|0092|92|0)3[0-9]{9}$' then raise exception 'invalid_phone'; end if;
  if length(trim(coalesce(customer ->> 'city', ''))) = 0 then raise exception 'invalid_city'; end if;
  if length(trim(coalesce(customer ->> 'address', ''))) < 10 then raise exception 'invalid_address'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 or jsonb_array_length(items) > 50 then
    raise exception 'invalid_items';
  end if;

  v_no := 'TBB-' || nextval('public.order_no_seq');
  insert into public.orders (order_no, customer_name, phone, city, address, notes)
  values (v_no, trim(customer ->> 'name'), v_phone, trim(customer ->> 'city'),
          trim(customer ->> 'address'), left(trim(coalesce(customer ->> 'notes', '')), 1000))
  returning id into v_order_id;

  for it in select * from jsonb_array_elements(items) loop
    v_qty := greatest(1, least(coalesce((it ->> 'qty')::int, 1), 20));
    select * into p from public.products where id = it ->> 'id' and status = 'published' for update;
    if not found then raise exception 'product_not_found:%', it ->> 'id'; end if;
    if p.stock < v_qty then raise exception 'out_of_stock:%', p.name; end if;

    update public.products set stock = stock - v_qty where id = p.id;
    insert into public.order_items (order_id, product_id, name, qty, price, shade)
    values (v_order_id, p.id, p.name, v_qty, p.price, nullif(it ->> 'shade', ''));

    v_sub := v_sub + p.price * v_qty;
    v_regular := v_regular + greatest(coalesce(p.original_price, 0), p.price) * v_qty;
    if p.type = 'product' then
      v_units := v_units + v_qty;
      v_base := v_base + p.price * v_qty;
    end if;
  end loop;

  select value into v_myo from public.settings where key = 'myo';
  if coalesce((v_myo ->> 'active')::boolean, false) and v_units >= coalesce((v_myo ->> 'min')::int, 2) then
    v_myo_save := round(v_base * coalesce((v_myo ->> 'percent')::numeric, 0) / 100);
  end if;

  update public.orders
     set subtotal = v_regular,
         discount = v_regular - v_sub + v_myo_save,
         myo_discount = v_myo_save,
         total = v_sub - v_myo_save
   where id = v_order_id;

  return jsonb_build_object('order_no', v_no, 'total', v_sub - v_myo_save, 'myo_discount', v_myo_save);
end;
$$;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- ---------- stock follows order cancellations ----------
-- Cancelling an order puts its items back in stock; un-cancelling takes them out again.
create or replace function public.order_stock_on_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Cancelled' and old.status <> 'Cancelled' then
    update public.products p set stock = p.stock + i.qty
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  elsif old.status = 'Cancelled' and new.status <> 'Cancelled' then
    update public.products p set stock = greatest(0, p.stock - i.qty)
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end;
$$;
drop trigger if exists orders_stock_on_status on public.orders;
create trigger orders_stock_on_status after update of status on public.orders
  for each row execute function public.order_stock_on_status();

-- ---------- Row Level Security ----------
alter table public.admins       enable row level security;
alter table public.brands       enable row level security;
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.testimonials enable row level security;
alter table public.banners      enable row level security;
alter table public.settings     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;

-- Public (logged-out shoppers) can read store content
drop policy if exists "public read brands" on public.brands;
create policy "public read brands" on public.brands for select using (true);
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products for select using (status = 'published' or public.is_admin());
drop policy if exists "public read active testimonials" on public.testimonials;
create policy "public read active testimonials" on public.testimonials for select using (active or public.is_admin());
drop policy if exists "public read banners" on public.banners;
create policy "public read banners" on public.banners for select using (true);
drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);

-- Admins can change everything
do $$
declare t text;
begin
  foreach t in array array['brands', 'categories', 'products', 'testimonials', 'banners', 'settings', 'orders', 'order_items'] loop
    execute format('drop policy if exists "admin write %1$s" on public.%1$I', t);
    execute format('create policy "admin write %1$s" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Orders are private: only admins can read them (customers create them through place_order)
drop policy if exists "admin read admins" on public.admins;
create policy "admin read admins" on public.admins for select using (user_id = auth.uid());

-- ---------- Storage: public bucket for product, category, banner and review images ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
