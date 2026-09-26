-- Allbooks v0.1: executar UMA VEZ em um projeto Supabase dedicado.
-- Nenhuma tabela de outros aplicativos é modificada.
begin;
create table public.ebook_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.ebook_projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 book jsonb not null check (jsonb_typeof(book)='object'),
 status text not null default 'draft' check (status in ('draft','reviewed','published')),
 revision integer not null default 1 check (revision>0),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index ebook_projects_owner_idx on public.ebook_projects(owner_id,updated_at desc);
create table public.ebook_publications (
 id uuid primary key references public.ebook_projects(id) on delete cascade,
 title text not null, author text not null, niche text not null, summary text not null,
 storage_path text not null,
 revision integer not null,
 published_at timestamptz not null default now()
);
create table public.ebook_generation_runs (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'reserved' check(status in('reserved','completed','failed')),
 model text,
 created_at timestamptz not null default now(),
 finished_at timestamptz
);
create index ebook_generation_runs_owner_date_idx on public.ebook_generation_runs(owner_id,created_at);
alter table public.ebook_admins enable row level security;
alter table public.ebook_projects enable row level security;
alter table public.ebook_publications enable row level security;
alter table public.ebook_generation_runs enable row level security;
revoke all on public.ebook_admins, public.ebook_projects, public.ebook_publications, public.ebook_generation_runs from anon, authenticated;
grant all on public.ebook_admins, public.ebook_projects, public.ebook_publications, public.ebook_generation_runs to service_role;
-- Leitura/escrita acontecem somente nas funções de servidor que verificam Auth,
-- ebook_admins e o proprietário. Nenhuma política pública é criada para rascunhos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ebooks','ebooks',false,10485760,array['application/pdf']);
-- Não criar políticas públicas de leitura dos objetos. Downloads publicados usam URL assinada.

create function public.ebook_reserve_generation(p_owner uuid,p_limit integer)
returns uuid language plpgsql security invoker set search_path='' as $$
declare used integer; run_id uuid;
begin
 if p_limit<1 or p_limit>100 then raise exception 'Limite de geração inválido.'; end if;
 if not exists(select 1 from public.ebook_admins where user_id=p_owner) then raise exception 'Editor não autorizado.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 select count(*) into used from public.ebook_generation_runs
 where owner_id=p_owner and created_at >= (date_trunc('day',now() at time zone 'UTC') at time zone 'UTC');
 if used>=p_limit then raise exception 'Limite diário de geração alcançado. Tente novamente amanhã (UTC).'; end if;
 insert into public.ebook_generation_runs(owner_id) values(p_owner) returning id into run_id;
 return run_id;
end;
$$;
create function public.ebook_publish(p_id uuid,p_revision integer,p_owner uuid,p_path text)
returns setof public.ebook_projects language plpgsql security invoker set search_path='' as $$
declare project public.ebook_projects%rowtype;
begin
 if not exists(select 1 from public.ebook_admins where user_id=p_owner) then raise exception 'Editor não autorizado.'; end if;
 select * into project from public.ebook_projects where id=p_id and owner_id=p_owner for update;
 if not found or project.revision<>p_revision or project.status not in('reviewed','published') or project.reviewed_at is null then
   raise exception 'O material foi alterado. Revise a versão atual antes de publicar.';
 end if;
 if p_path not like p_id::text||'/%' then raise exception 'Arquivo inválido.'; end if;
 insert into public.ebook_publications(id,title,author,niche,summary,storage_path,revision)
 values(project.id,project.book->>'title',project.book->>'author',project.book->>'niche',project.book->>'summary',p_path,p_revision)
 on conflict(id) do update set title=excluded.title,author=excluded.author,niche=excluded.niche,summary=excluded.summary,
 storage_path=excluded.storage_path,revision=excluded.revision,published_at=now();
 return query update public.ebook_projects set status='published',updated_at=now(),revision=revision+1 where id=p_id returning *;
end;
$$;
revoke all on function public.ebook_reserve_generation(uuid,integer) from public,anon,authenticated;
revoke all on function public.ebook_publish(uuid,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.ebook_reserve_generation(uuid,integer) to service_role;
grant execute on function public.ebook_publish(uuid,integer,uuid,text) to service_role;
commit;

-- Após criar/confirmar seu usuário no Supabase Auth, conceda acesso pelo SQL Editor:
-- insert into public.ebook_admins(user_id) select id from auth.users where email='SEU_EMAIL';
-- A chave secreta fica somente no ambiente de servidor da Vercel.
