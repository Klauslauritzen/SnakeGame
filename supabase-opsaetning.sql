-- Opsætning af den fælles top-liste i Supabase.
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Alle må læse listen og tilføje spil. Ingen kan ændre eller slette spil (det kan kun du i Supabase).

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 1 and 12),
  score      integer not null default 0 check (score between 0 and 100000000),
  fruits     integer not null default 0 check (fruits between 0 and 1000),
  birds      integer not null default 0 check (birds between 0 and 1000),
  powerups   integer not null default 0 check (powerups between 0 and 1000),
  specials   integer not null default 0 check (specials between 0 and 1000),
  combo      integer not null default 0 check (combo between 0 and 2000),
  time       integer not null default 0 check (time between 0 and 36000)
);

-- Indeks til de fire lister
create index if not exists scores_score_idx  on public.scores (score desc);
create index if not exists scores_fruits_idx on public.scores (fruits desc);
create index if not exists scores_time_idx   on public.scores (time desc);
create index if not exists scores_combo_idx  on public.scores (combo desc);

-- Row Level Security: kun det, reglerne herunder tillader, er muligt
alter table public.scores enable row level security;

drop policy if exists "Alle kan se top-listen" on public.scores;
create policy "Alle kan se top-listen" on public.scores
  for select to anon using (true);

drop policy if exists "Alle kan tilføje et spil" on public.scores;
create policy "Alle kan tilføje et spil" on public.scores
  for insert to anon with check (true);

grant select, insert on public.scores to anon;

-- Tilføjet senere: telefon og computer har hver sin top-liste
alter table public.scores add column if not exists mobile boolean not null default false;
create index if not exists scores_mobile_score_idx on public.scores (mobile, score desc);
