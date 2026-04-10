-- =============================================
-- かずさや発注アプリ Supabase スキーマ定義
-- Supabase SQL Editor で実行してください
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- テーブル作成
-- =============================================

-- 管理者テーブル
create table admins (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 取引先テーブル
create table partners (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text not null,
  login_id text unique not null,
  email text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 商品マスタ
create table products (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  spec text,
  price integer,
  kana text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 取引先別表示商品（ユニーク制約付き）
create table partner_products (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  display_order integer default 0,
  created_at timestamptz default now(),
  unique(partner_id, product_id)
);

-- 受注ヘッダ
create table orders (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid not null references partners(id),
  order_date date not null,
  note text,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 受注明細
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  case_qty integer default 0,
  unit_qty integer default 0
);

-- =============================================
-- updated_at 自動更新トリガー
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- =============================================
-- Row Level Security (RLS) ポリシー
-- =============================================

alter table admins enable row level security;
alter table partners enable row level security;
alter table products enable row level security;
alter table partner_products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- 管理者判定ヘルパー関数
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admins
    where auth_user_id = auth.uid()
    and is_active = true
  );
$$ language sql security definer;

-- 取引先判定ヘルパー関数
create or replace function get_partner_id()
returns uuid as $$
  select id from partners
  where auth_user_id = auth.uid()
  and is_active = true
  limit 1;
$$ language sql security definer;

-- admins ポリシー
create policy "admins_select" on admins for select using (is_admin());

-- partners ポリシー
create policy "partners_admin_all" on partners for all using (is_admin());
create policy "partners_self_select" on partners for select
  using (auth_user_id = auth.uid());

-- products ポリシー
create policy "products_admin_all" on products for all using (is_admin());
create policy "products_authenticated_select" on products for select
  using (auth.role() = 'authenticated' and is_active = true);

-- partner_products ポリシー
create policy "pp_admin_all" on partner_products for all using (is_admin());
create policy "pp_partner_select" on partner_products for select
  using (partner_id = get_partner_id());

-- orders ポリシー
create policy "orders_admin_all" on orders for all using (is_admin());
create policy "orders_partner_insert" on orders for insert
  with check (partner_id = get_partner_id());
create policy "orders_partner_select" on orders for select
  using (partner_id = get_partner_id());

-- order_items ポリシー
create policy "items_admin_all" on order_items for all using (is_admin());
create policy "items_partner_insert" on order_items for insert
  with check (
    exists (
      select 1 from orders
      where id = order_id
      and partner_id = get_partner_id()
    )
  );
create policy "items_partner_select" on order_items for select
  using (
    exists (
      select 1 from orders
      where id = order_id
      and partner_id = get_partner_id()
    )
  );
