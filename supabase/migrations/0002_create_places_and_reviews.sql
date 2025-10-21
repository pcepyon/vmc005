-- Migration: create places and reviews tables for restaurant review system
-- Ensures pgcrypto extension is available for UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. Create places table
-- ============================================================
-- Stores restaurant/place information from Naver Place API
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  naver_place_id varchar(255) not null unique,
  name varchar(255) not null,
  address text not null,
  phone varchar(50),
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  constraint chk_latitude_range check (latitude >= -90 and latitude <= 90),
  constraint chk_longitude_range check (longitude >= -180 and longitude <= 180)
);

comment on table public.places is 'Restaurant and place information cached from Naver Place API';
comment on column public.places.id is 'Unique place identifier (UUID)';
comment on column public.places.naver_place_id is 'Naver Place API unique identifier';
comment on column public.places.name is 'Restaurant/place name';
comment on column public.places.address is 'Full address';
comment on column public.places.phone is 'Contact phone number (optional)';
comment on column public.places.latitude is 'Latitude for map display';
comment on column public.places.longitude is 'Longitude for map display';

-- Indexes for places table
create index if not exists idx_places_naver_place_id on public.places(naver_place_id);
create index if not exists idx_places_location on public.places(latitude, longitude);

-- ============================================================
-- 2. Create reviews table
-- ============================================================
-- Stores user-generated reviews for places
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  author_name varchar(100) not null,
  rating integer not null,
  content text not null,
  password_hash varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  constraint chk_rating_range check (rating >= 1 and rating <= 5),
  constraint chk_content_length check (length(content) <= 500)
);

comment on table public.reviews is 'User-generated reviews for restaurants and places';
comment on column public.reviews.id is 'Unique review identifier (UUID)';
comment on column public.reviews.place_id is 'Foreign key to places table';
comment on column public.reviews.author_name is 'Review author name';
comment on column public.reviews.rating is 'Star rating (1-5)';
comment on column public.reviews.content is 'Review content (max 500 characters)';
comment on column public.reviews.password_hash is 'Hashed password for review modification/deletion (bcrypt)';

-- Indexes for reviews table
create index if not exists idx_reviews_place_id on public.reviews(place_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

-- ============================================================
-- 3. Create trigger function for updated_at timestamp
-- ============================================================
-- Automatically updates the updated_at column on record update
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.update_updated_at_column() is 'Trigger function to automatically update updated_at timestamp';

-- ============================================================
-- 4. Create triggers for updated_at columns
-- ============================================================
create trigger trigger_places_updated_at
  before update on public.places
  for each row
  execute function public.update_updated_at_column();

create trigger trigger_reviews_updated_at
  before update on public.reviews
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- 5. Row Level Security (RLS) Configuration
-- ============================================================
-- Disable RLS for public read/write access
-- Note: In production, consider enabling RLS with appropriate policies
alter table if exists public.places disable row level security;
alter table if exists public.reviews disable row level security;

-- ============================================================
-- 6. Seed data for development/testing (optional)
-- ============================================================
-- Sample place data for testing
insert into public.places (naver_place_id, name, address, phone, latitude, longitude)
values
  (
    'naver_test_gangnam',
    '강남 맛집',
    '서울특별시 강남구 테헤란로 152',
    '02-1234-5678',
    37.498095,
    127.027610
  ),
  (
    'naver_test_hongdae',
    '홍대 카페',
    '서울특별시 마포구 홍익로 3길 20',
    '02-8765-4321',
    37.557192,
    126.925381
  )
on conflict (naver_place_id) do nothing;

-- Sample review data for testing
-- Note: password_hash is bcrypt hash of "1234" for testing purposes
-- In production, use proper bcrypt hashing on the backend
insert into public.reviews (place_id, author_name, rating, content, password_hash)
select
  p.id,
  '홍길동',
  5,
  '정말 맛있어요! 서비스도 친절하고 분위기도 좋습니다. 강력 추천합니다.',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' -- bcrypt hash of "1234"
from public.places p
where p.naver_place_id = 'naver_test_gangnam'
on conflict do nothing;

insert into public.reviews (place_id, author_name, rating, content, password_hash)
select
  p.id,
  '김철수',
  4,
  '음식은 맛있는데 가격이 조금 비싼 편이에요.',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' -- bcrypt hash of "1234"
from public.places p
where p.naver_place_id = 'naver_test_gangnam'
on conflict do nothing;

insert into public.reviews (place_id, author_name, rating, content, password_hash)
select
  p.id,
  '이영희',
  5,
  '커피가 정말 맛있어요! 조용해서 작업하기도 좋습니다.',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' -- bcrypt hash of "1234"
from public.places p
where p.naver_place_id = 'naver_test_hongdae'
on conflict do nothing;
