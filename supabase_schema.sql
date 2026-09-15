create extension if not exists pgcrypto;

create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    email varchar(255) not null,
    phone varchar(30) not null unique,
    how_heard varchar(50) not null default 'unknown',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers(id) on delete cascade,
    status varchar(30) not null default 'waiting' check (status in ('waiting','called','in_service','completed','cancelled')),
    has_appointment boolean not null default false,
    checked_in_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.customers
    add column if not exists how_heard varchar(50) not null default 'unknown';

alter table public.check_ins
    add column if not exists has_appointment boolean not null default false;

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_checkins_status on public.check_ins(status);
create index if not exists idx_checkins_checked_in_at on public.check_ins(checked_in_at desc);

-- These tables contain customer PII and are accessed only by the backend with
-- its private service-role key. With RLS enabled and no public policies, the
-- anon and authenticated roles cannot read or modify the records directly.
alter table public.customers enable row level security;
alter table public.check_ins enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.check_ins from anon, authenticated;
