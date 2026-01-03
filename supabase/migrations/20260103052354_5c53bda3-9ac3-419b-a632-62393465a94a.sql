-- Create enum for user roles
create type public.app_role as enum ('admin', 'referee');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  birth_date date,
  afk_origin text,
  occupation text,
  license_level text check (license_level in ('level_1', 'level_2', 'level_3')),
  profile_photo_url text,
  license_photo_url text,
  ktp_photo_url text,
  is_profile_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Create events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  location text,
  category text,
  status text default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create honors table
create table public.honors (
  id uuid primary key default gen_random_uuid(),
  referee_id uuid references public.profiles(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete set null,
  amount integer not null,
  notes text,
  status text default 'draft' check (status in ('draft', 'submitted', 'verified', 'rejected')),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create event_assignments table
create table public.event_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  referee_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'referee',
  status text default 'pending' check (status in ('pending', 'confirmed', 'declined', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (event_id, referee_id)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.honors enable row level security;
alter table public.event_assignments enable row level security;

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  
  -- Default role is referee
  insert into public.user_roles (user_id, role)
  values (new.id, 'referee');
  
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_events_updated_at before update on public.events
  for each row execute function public.update_updated_at_column();

create trigger update_honors_updated_at before update on public.honors
  for each row execute function public.update_updated_at_column();

create trigger update_event_assignments_updated_at before update on public.event_assignments
  for each row execute function public.update_updated_at_column();

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
create policy "Everyone can view events"
  on public.events for select
  to authenticated
  using (true);

create policy "Admins can create events"
  on public.events for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update events"
  on public.events for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete events"
  on public.events for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for honors
create policy "Referees can view their own honors"
  on public.honors for select
  using (auth.uid() = referee_id);

create policy "Referees can create their own honors"
  on public.honors for insert
  with check (auth.uid() = referee_id);

create policy "Referees can update their own draft honors"
  on public.honors for update
  using (auth.uid() = referee_id and status = 'draft');

create policy "Referees can delete their own draft honors"
  on public.honors for delete
  using (auth.uid() = referee_id and status = 'draft');

create policy "Admins can view all honors"
  on public.honors for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all honors"
  on public.honors for update
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for event_assignments
create policy "Referees can view their own assignments"
  on public.event_assignments for select
  using (auth.uid() = referee_id);

create policy "Admins can view all assignments"
  on public.event_assignments for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage assignments"
  on public.event_assignments for all
  using (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

-- Storage policies for avatars (public read, authenticated write to own folder)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for documents (private, only owner can access)
create policy "Users can view their own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own documents"
  on storage.objects for update
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all documents
create policy "Admins can view all documents"
  on storage.objects for select
  using (bucket_id = 'documents' and public.has_role(auth.uid(), 'admin'));