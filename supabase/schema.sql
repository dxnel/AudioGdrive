-- AudioStream : schéma Supabase
-- À coller tel quel dans Supabase > SQL Editor > Run.
-- Toutes les tables ont RLS activé SANS policy : seul le serveur Nuxt
-- (clé service_role) peut y accéder. Le navigateur n'y touche jamais directement.

-- 1) Connexion Google Drive du propriétaire (refresh token chiffré côté serveur)
create table if not exists public.drive_connections (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  refresh_token_enc text not null,
  updated_at        timestamptz not null default now()
);

-- 2) Bibliothèques : un dossier racine du Drive choisi par le propriétaire
create table if not exists public.libraries (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  root_folder_id text not null,
  name           text not null,
  last_scan      timestamptz,
  created_at     timestamptz not null default now(),
  unique (owner_id, root_folder_id)
);

-- 3) Index de la bibliothèque : sous-dossiers contenant de l'audio + fichiers audio
--    (c'est la "mini base de données" sélectionnée dans le Drive)
create table if not exists public.library_items (
  id           bigint generated always as identity primary key,
  library_id   uuid not null references public.libraries(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  drive_id     text not null,
  parent_id    text,
  name         text not null,
  mime_type    text,
  is_folder    boolean not null default false,
  created_time timestamptz,
  size         bigint,
  path_ids     text[] not null default '{}',  -- ids des dossiers ancêtres (racine -> parent)
  unique (library_id, drive_id)
);
create index if not exists library_items_library_idx on public.library_items (library_id);
create index if not exists library_items_owner_drive_idx on public.library_items (owner_id, drive_id);
create index if not exists library_items_path_idx on public.library_items using gin (path_ids);

-- 4) Liens de partage d'un sous-dossier (et de tout ce qu'il contient)
create table if not exists public.shares (
  token      text primary key
             default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  library_id uuid not null references public.libraries(id) on delete cascade,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  folder_id  text not null,
  role       text not null default 'viewer' check (role in ('viewer', 'editor')),
  expires_at timestamptz,
  revoked    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shares_library_idx on public.shares (library_id, folder_id);

alter table public.drive_connections enable row level security;
alter table public.libraries         enable row level security;
alter table public.library_items     enable row level security;
alter table public.shares            enable row level security;
