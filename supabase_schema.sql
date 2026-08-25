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
    checked_in_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.customers
    add column if not exists how_heard varchar(50) not null default 'unknown';

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_checkins_status on public.check_ins(status);
create index if not exists idx_checkins_checked_in_at on public.check_ins(checked_in_at desc);
