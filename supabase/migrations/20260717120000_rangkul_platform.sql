-- Rangkul platform expansion. Additive migration; do not edit the donor baseline.
create type public.app_role as enum ('family_member_caregiver', 'professional', 'admin');
create type public.person_access_level as enum ('owner', 'caregiver', 'professional', 'viewer');
create type public.journal_modality as enum ('text', 'voice', 'face_behavior', 'movement_video', 'photo', 'milestone');
create type public.roadmap_lifecycle as enum ('draft', 'active', 'paused', 'completed', 'archived');
create type public.automated_trend as enum ('observed_positive_trend', 'stable_observation', 'needs_professional_review', 'insufficient_data');

alter table public.profiles add column if not exists role public.app_role not null default 'family_member_caregiver';

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'professional' then 'professional'::public.app_role else 'family_member_caregiver'::public.app_role end)
  on conflict(id) do update set display_name=excluded.display_name;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create table public.person_access (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.person_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level public.person_access_level not null,
  journal_shared boolean not null default false,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(person_id, user_id)
);

create table public.support_needs (
  code text primary key check (code in ('communication','sensory','mobility','daily_living','learning','behavioral_support','social_interaction','therapy_support')),
  label text not null,
  description text not null,
  sort_order integer not null
);

create table public.person_support_needs (
  person_id uuid not null references public.person_profiles(id) on delete cascade,
  support_need_code text not null references public.support_needs(code),
  priority smallint not null default 2 check (priority between 1 and 3),
  notes text,
  primary key(person_id, support_need_code)
);

create table public.consent_settings (
  person_id uuid primary key references public.person_profiles(id) on delete cascade,
  journal_visibility text not null default 'family_only' check (journal_visibility in ('private','family_only','shared_professionals')),
  media_analysis_consent boolean not null default false,
  professional_sharing boolean not null default false,
  raw_media_retention boolean not null default false,
  personalized_ai_context boolean not null default false,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries add column if not exists modality public.journal_modality not null default 'text';
alter table public.journal_entries add column if not exists title text;
alter table public.journal_entries add column if not exists visibility text not null default 'family_only';
alter table public.journal_entries add column if not exists media_preview_path text;

create table public.professional_recommendations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.person_profiles(id) on delete cascade,
  professional_id uuid not null references auth.users(id),
  title text not null,
  guidance text not null,
  task_code text,
  target_metric text,
  review_date date,
  status text not null default 'active' check (status in ('draft','active','completed','withdrawn')),
  created_at timestamptz not null default now()
);

create table public.journal_analyses (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  person_id uuid not null references public.person_profiles(id) on delete cascade,
  recommendation_id uuid references public.professional_recommendations(id) on delete set null,
  modality text not null check (modality in ('voice','face_behavior','movement_video')),
  task_code text not null,
  captured_at timestamptz not null default now(),
  quality jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  feature_vector jsonb not null default '[]'::jsonb,
  event_segments jsonb not null default '[]'::jsonb,
  model_info jsonb not null default '{}'::jsonb,
  automated_trend public.automated_trend not null default 'insufficient_data',
  ai_summary jsonb,
  reference_version text,
  raw_media_path text,
  raw_media_delete_after timestamptz,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(quality) = 'object'),
  check (jsonb_typeof(metrics) = 'object'),
  check (jsonb_typeof(feature_vector) = 'array')
);

create table public.professional_reviews (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.journal_analyses(id) on delete cascade,
  professional_id uuid not null references auth.users(id),
  decision text not null check (decision in ('acknowledged','recommendation_created','recapture_requested')),
  notes text not null,
  created_at timestamptz not null default now(),
  unique(analysis_id, professional_id)
);

alter table public.roadmaps add column if not exists status public.roadmap_lifecycle not null default 'active';
alter table public.roadmaps add column if not exists title text not null default 'Roadmap dukungan';
alter table public.roadmaps add column if not exists review_date date;

create table public.roadmap_goals (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  title text not null,
  description text,
  target_metric text,
  target_value numeric,
  current_value numeric not null default 0,
  status public.roadmap_lifecycle not null default 'active',
  recommendation_id uuid references public.professional_recommendations(id) on delete set null,
  review_date date,
  created_at timestamptz not null default now()
);

create table public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.roadmap_goals(id) on delete cascade,
  title text not null,
  weekday smallint check (weekday between 0 and 6),
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(), title text not null, publisher text not null,
  official_url text not null, reviewed_at date not null, active boolean not null default true
);
create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  topic text not null, title text not null, body text not null, version text not null default '1'
);
create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  content text not null, search_vector tsvector generated always as (to_tsvector('simple', content)) stored
);
create index knowledge_chunks_search_idx on public.knowledge_chunks using gin(search_vector);

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid references public.person_profiles(id) on delete set null, title text not null default 'Percakapan baru',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.chat_messages add column if not exists conversation_id uuid references public.chat_conversations(id) on delete cascade;

create table public.facilities (
  id uuid primary key default gen_random_uuid(), name text not null, category text not null,
  city text not null, address text not null, latitude double precision, longitude double precision,
  services text[] not null default '{}', accepts_bpjs boolean not null default false,
  accessibility text[] not null default '{}', phone text, official_url text, is_demo boolean not null default true,
  active boolean not null default true, created_at timestamptz not null default now()
);
create table public.saved_facilities (
  user_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, facility_id)
);
create table public.aid_programs (
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
  category text not null, provider text not null, summary text not null, official_url text not null,
  rules jsonb not null default '{}'::jsonb, requirements jsonb not null default '[]'::jsonb,
  rules_version text not null default '1', is_demo boolean not null default true, active boolean not null default true
);
create table public.aid_assessments (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.person_profiles(id) on delete cascade, answers jsonb not null,
  rules_version text not null, created_at timestamptz not null default now()
);
create table public.aid_assessment_results (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.aid_assessments(id) on delete cascade,
  program_id uuid not null references public.aid_programs(id), status text not null,
  explanation text not null, missing_requirements jsonb not null default '[]'::jsonb
);
create table public.aid_applications (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.person_profiles(id) on delete cascade,
  program_id uuid not null references public.aid_programs(id), status text not null default 'preparing',
  next_step text, updated_at timestamptz not null default now()
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.person_profiles(id) on delete cascade,
  created_by uuid not null references auth.users(id), title text not null, starts_at timestamptz not null,
  facility_id uuid references public.facilities(id), notes text
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);

create or replace function public.has_role(required_role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = required_role)
$$;
create or replace function public.can_access_person(target_person uuid, minimum_level public.person_access_level default 'viewer') returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.person_profiles p where p.id = target_person and p.owner_id = auth.uid()
    union all
    select 1 from public.person_access pa where pa.person_id = target_person and pa.user_id = auth.uid()
  )
$$;
revoke all on function public.has_role(public.app_role) from public;
revoke all on function public.can_access_person(uuid, public.person_access_level) from public;
grant execute on function public.has_role(public.app_role), public.can_access_person(uuid, public.person_access_level) to authenticated;

-- RLS is explicit: catalogs are authenticated-readable; private rows require a person relationship.
alter table public.person_access enable row level security;
alter table public.person_support_needs enable row level security;
alter table public.consent_settings enable row level security;
alter table public.professional_recommendations enable row level security;
alter table public.journal_analyses enable row level security;
alter table public.professional_reviews enable row level security;
alter table public.roadmap_goals enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.saved_facilities enable row level security;
alter table public.aid_assessments enable row level security;
alter table public.aid_assessment_results enable row level security;
alter table public.aid_applications enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.support_needs enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.facilities enable row level security;
alter table public.aid_programs enable row level security;

create policy person_access_read on public.person_access for select to authenticated using (public.can_access_person(person_id));
create policy person_access_owner_write on public.person_access for all to authenticated using (exists(select 1 from public.person_profiles p where p.id=person_id and p.owner_id=auth.uid())) with check (exists(select 1 from public.person_profiles p where p.id=person_id and p.owner_id=auth.uid()));
create policy needs_access on public.person_support_needs for all to authenticated using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy consent_access on public.consent_settings for all to authenticated using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy recommendations_read on public.professional_recommendations for select to authenticated using (public.can_access_person(person_id));
create policy recommendations_professional_write on public.professional_recommendations for insert to authenticated with check (professional_id=auth.uid() and public.has_role('professional') and public.can_access_person(person_id));
create policy analyses_read on public.journal_analyses for select to authenticated using (public.can_access_person(person_id));
create policy reviews_read on public.professional_reviews for select to authenticated using (exists(select 1 from public.journal_analyses a where a.id=analysis_id and public.can_access_person(a.person_id)));
create policy reviews_professional_write on public.professional_reviews for insert to authenticated with check (professional_id=auth.uid() and public.has_role('professional') and exists(select 1 from public.journal_analyses a where a.id=analysis_id and public.can_access_person(a.person_id)));
create policy goals_access on public.roadmap_goals for all to authenticated using (exists(select 1 from public.roadmaps r where r.id=roadmap_id and public.can_access_person(r.person_profile_id))) with check (exists(select 1 from public.roadmaps r where r.id=roadmap_id and public.can_access_person(r.person_profile_id)));
create policy tasks_access on public.roadmap_tasks for all to authenticated using (exists(select 1 from public.roadmap_goals g join public.roadmaps r on r.id=g.roadmap_id where g.id=goal_id and public.can_access_person(r.person_profile_id))) with check (exists(select 1 from public.roadmap_goals g join public.roadmaps r on r.id=g.roadmap_id where g.id=goal_id and public.can_access_person(r.person_profile_id)));
create policy conversations_own on public.chat_conversations for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid() and (person_id is null or public.can_access_person(person_id)));
create policy saved_own on public.saved_facilities for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy assessments_own on public.aid_assessments for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid() and public.can_access_person(person_id));
create policy assessment_results_own on public.aid_assessment_results for select to authenticated using (exists(select 1 from public.aid_assessments a where a.id=assessment_id and a.owner_id=auth.uid()));
create policy applications_own on public.aid_applications for all to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid() and public.can_access_person(person_id));
create policy appointments_access on public.appointments for all to authenticated using (public.can_access_person(person_id)) with check (public.can_access_person(person_id));
create policy notifications_own on public.notifications for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy authenticated_read_support_needs on public.support_needs for select to authenticated using (true);
create policy authenticated_read_knowledge_sources on public.knowledge_sources for select to authenticated using (active);
create policy authenticated_read_knowledge_documents on public.knowledge_documents for select to authenticated using (true);
create policy authenticated_read_knowledge_chunks on public.knowledge_chunks for select to authenticated using (true);
create policy authenticated_read_facilities on public.facilities for select to authenticated using (active);
create policy authenticated_read_aid_programs on public.aid_programs for select to authenticated using (active);
create policy admin_manage_support_needs on public.support_needs for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy admin_manage_facilities on public.facilities for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy admin_manage_aid_programs on public.aid_programs for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy admin_manage_knowledge on public.knowledge_sources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create index person_access_user_idx on public.person_access(user_id, person_id);
create index analyses_person_task_date_idx on public.journal_analyses(person_id, task_code, captured_at desc);
create index recommendations_person_idx on public.professional_recommendations(person_id, status);
create index goals_roadmap_idx on public.roadmap_goals(roadmap_id);
create index tasks_goal_idx on public.roadmap_tasks(goal_id);
create index facilities_filter_idx on public.facilities(city, category, accepts_bpjs);
create index aid_applications_owner_idx on public.aid_applications(owner_id, updated_at desc);

grant select on public.support_needs, public.knowledge_sources, public.knowledge_documents, public.knowledge_chunks, public.facilities, public.aid_programs to authenticated;
grant select, insert, update, delete on public.person_access, public.person_support_needs, public.consent_settings, public.professional_recommendations, public.journal_analyses, public.professional_reviews, public.roadmap_goals, public.roadmap_tasks, public.chat_conversations, public.saved_facilities, public.aid_assessments, public.aid_assessment_results, public.aid_applications, public.appointments, public.notifications to authenticated;
grant all on all tables in schema public to service_role;

-- Private buckets. Raw checkpoint media is temporary unless consent explicitly permits retention.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']),
 ('journal-previews','journal-previews',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('checkpoint-temp','checkpoint-temp',false,52428800,array['audio/webm','audio/mpeg','video/webm','video/mp4','image/jpeg','image/png']),
 ('checkpoint-retained','checkpoint-retained',false,52428800,array['audio/webm','audio/mpeg','video/webm','video/mp4']),
 ('knowledge-assets','knowledge-assets',false,10485760,null)
on conflict(id) do nothing;

create policy private_checkpoint_upload on storage.objects for insert to authenticated
with check (bucket_id in ('avatars','journal-previews','checkpoint-temp','checkpoint-retained') and (storage.foldername(name))[1]=auth.uid()::text);
create policy private_checkpoint_read on storage.objects for select to authenticated
using (bucket_id in ('avatars','journal-previews','checkpoint-temp','checkpoint-retained') and (storage.foldername(name))[1]=auth.uid()::text);
create policy private_checkpoint_delete on storage.objects for delete to authenticated
using (bucket_id in ('checkpoint-temp','checkpoint-retained') and (storage.foldername(name))[1]=auth.uid()::text);
