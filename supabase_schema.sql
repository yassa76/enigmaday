-- ============================================================
--  EnigmaDay — Schema SQL per Supabase
--  Esegui questo script nell'editor SQL di Supabase
-- ============================================================

-- 1. TABELLA PROFILI UTENTE
--    (estende la tabella auth.users già creata da Supabase)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  nome        text not null,
  email       text not null,
  newsletter  boolean default false,
  preferenze  text[] default '{}',   -- es. ['Logica', 'Rebus']
  ruolo       text default 'utente', -- 'utente' | 'admin'
  created_at  timestamptz default now()
);

-- Rendi la tabella accessibile agli utenti autenticati
alter table public.profiles enable row level security;

create policy "Utenti vedono solo il proprio profilo"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Utenti aggiornano solo il proprio profilo"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin vede tutto (via service role — usato solo lato server)
create policy "Admin vede tutti i profili"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ruolo = 'admin'
    )
  );


-- 2. TABELLA ENIGMI
create table public.enigmi (
  id          uuid default gen_random_uuid() primary key,
  testo       text not null,
  soluzione   text not null,
  categoria   text not null,           -- Indovinello | Logica | Rebus | Matematica | Quiz
  difficolta  int default 2,           -- 1=facile, 2=medio, 3=difficile
  fonte       text,
  data_pub    date not null unique,    -- una sola data per enigma
  creato_da   uuid references auth.users(id),
  created_at  timestamptz default now()
);

alter table public.enigmi enable row level security;

-- Tutti possono leggere gli enigmi
create policy "Tutti leggono gli enigmi"
  on public.enigmi for select
  using (true);

-- Solo admin può inserire/modificare/eliminare
create policy "Solo admin gestisce gli enigmi"
  on public.enigmi for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ruolo = 'admin'
    )
  );


-- 3. TABELLA TENTATIVI
create table public.tentativi (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  enigma_id   uuid references public.enigmi(id) on delete cascade,
  risposta    text not null,
  corretto    boolean not null,
  created_at  timestamptz default now(),
  unique (user_id, enigma_id)  -- un solo tentativo "finale" per utente per enigma
);

alter table public.tentativi enable row level security;

create policy "Utenti vedono i propri tentativi"
  on public.tentativi for select
  using (auth.uid() = user_id);

create policy "Utenti inseriscono i propri tentativi"
  on public.tentativi for insert
  with check (auth.uid() = user_id);

create policy "Utenti aggiornano i propri tentativi"
  on public.tentativi for update
  using (auth.uid() = user_id);

-- Admin vede tutto
create policy "Admin vede tutti i tentativi"
  on public.tentativi for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ruolo = 'admin'
    )
  );


-- 4. VISTA: contatore solutori per enigma (pubblica, read-only)
create view public.enigmi_stats as
  select
    e.id,
    e.data_pub,
    count(t.id) filter (where t.corretto = true) as solutori
  from public.enigmi e
  left join public.tentativi t on t.enigma_id = e.id
  group by e.id, e.data_pub;


-- 5. DATI INIZIALI — 5 enigmi di esempio
insert into public.enigmi (testo, soluzione, categoria, difficolta, fonte, data_pub) values
  ('Ho città ma non case, montagne ma non alberi, acqua ma non pesce. Cosa sono?',
   'una mappa', 'Indovinello', 2, 'Tradizionale', current_date),

  ('Un contadino aveva 17 pecore. Tutte tranne 9 morirono. Quante ne rimangono?',
   '9', 'Logica', 1, 'Enigmistica classica', current_date + 1),

  ('Sono leggero come una piuma, ma anche l''uomo più forte del mondo non riesce a tenermi per più di pochi minuti. Cosa sono?',
   'il respiro', 'Indovinello', 3, 'Tradizionale', current_date + 2),

  ('Se ci sono 3 mele e ne prendi 2, quante mele hai tu?',
   '2', 'Logica', 1, 'Enigmistica moderna', current_date + 3),

  ('Più mi asciughi, più mi bagno. Cosa sono?',
   'un asciugamano', 'Rebus', 2, 'Enigmistica classica', current_date + 4);


-- 6. FUNZIONE per creare il profilo automaticamente dopo la registrazione
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Utente'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
