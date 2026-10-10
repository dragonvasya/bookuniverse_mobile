-- ==============================================================================
-- СХЕМА БАЗЫ ДАННЫХ ДЛЯ BOOK UNIVERSE (SUPABASE)
-- ==============================================================================
-- Выполните этот скрипт в панели управления Supabase -> раздел "SQL Editor" -> "New query" -> "Run".

-- 1. Таблица профилей пользователей
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  telegram_id bigint unique,
  telegram_username text,
  avatar text default '📚',
  bio text default 'Исследую книжные миры',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Таблица полок пользователей (прочитанные книги и книги в планах)
create table if not exists public.user_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_key text not null,
  status text not null check (status in ('read', 'want')),
  title text not null,
  author text not null,
  cover_url text,
  date_added timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, book_key)
);

-- Индексы для быстрого поиска
create index if not exists idx_user_books_user_id on public.user_books(user_id);
create index if not exists idx_user_books_book_key on public.user_books(book_key);
create index if not exists idx_profiles_telegram_id on public.profiles(telegram_id);

-- 3. Включение Row Level Security (RLS) для защиты данных
alter table public.profiles enable row level security;
alter table public.user_books enable row level security;

-- 4. Политики безопасности для таблицы Profiles
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- 5. Политики безопасности для таблицы User Books
create policy "Users can view own books" 
  on public.user_books for select 
  using (auth.uid() = user_id);

create policy "Users can insert own books" 
  on public.user_books for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own books" 
  on public.user_books for update 
  using (auth.uid() = user_id);

create policy "Users can delete own books" 
  on public.user_books for delete 
  using (auth.uid() = user_id);

-- 6. Триггер для автоматического создания профиля при регистрации через Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'Читатель'),
    coalesce(new.raw_user_meta_data->>'avatar', '📚')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
