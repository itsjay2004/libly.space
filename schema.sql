-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  library_name text,
  phone text
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, library_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'library_name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for libraries
create table libraries (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles not null,
  name text not null,
  total_seats integer not null
);
-- Add RLS to libraries table
alter table libraries
  enable row level security;
create policy "Users can view their own library." on libraries
  for select using (auth.uid() = owner_id);
create policy "Users can insert their own library." on libraries
  for insert with check (auth.uid() = owner_id);
create policy "Users can update their own library." on libraries
  for update using (auth.uid() = owner_id);

-- Create a table for students
create table students (
  id uuid default gen_random_uuid() primary key,
  library_id uuid references public.libraries not null,
  name text not null,
  phone text not null,
  email text,
  id_number text,
  address text,
  shift_id uuid references public.shifts (id),
  seat_number integer,
  status text NOT NULL DEFAULT 'active',
  join_date timestamp with time zone NOT NULL DEFAULT now()
);
-- Add RLS to students table
alter table students
  enable row level security;
create policy "Users can view students in their own library." on students
  for select using (exists (select 1 from libraries where libraries.id = students.library_id and libraries.owner_id = auth.uid()));
create policy "Users can insert students into their own library." on students
  for insert with check (exists (select 1 from libraries where libraries.id = students.library_id and libraries.owner_id = auth.uid()));
create policy "Users can update students in their own library." on students
  for update using (exists (select 1 from libraries where libraries.id = students.library_id and libraries.owner_id = auth.uid()));
create policy "Users can delete students from their own library." on students
  for delete using (exists (select 1 from libraries where libraries.id = students.library_id and libraries.owner_id = auth.uid()));

-- Create a table for seats
create table seats (
  id uuid default gen_random_uuid() primary key,
  library_id uuid references public.libraries not null,
  seat_number integer not null,
  student_id uuid references public.students,
  unique (library_id, seat_number)
);
-- Add RLS to seats table
alter table seats
  enable row level security;
create policy "Users can view seats in their own library." on seats
  for select using (exists (select 1 from libraries where libraries.id = seats.library_id and libraries.owner_id = auth.uid()));
create policy "Users can insert seats into their own library." on seats
  for insert with check (exists (select 1 from libraries where libraries.id = seats.library_id and libraries.owner_id = auth.uid()));
create policy "Users can update seats in their own library." on seats
  for update using (exists (select 1 from libraries where libraries.id = seats.library_id and libraries.owner_id = auth.uid()));

-- Create a table for shifts
create table shifts (
  id uuid default gen_random_uuid() primary key,
  library_id uuid references public.libraries not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  fee numeric(10, 2)
);
-- Add RLS to shifts table
alter table shifts
  enable row level security;
create policy "Users can view shifts in their own library." on shifts
  for select using (exists (select 1 from libraries where libraries.id = shifts.library_id and libraries.owner_id = auth.uid()));
create policy "Users can insert shifts into their own library." on shifts
  for insert with check (exists (select 1 from libraries where libraries.id = shifts.library_id and libraries.owner_id = auth.uid()));
create policy "Users can update shifts in their own library." on shifts
  for update using (exists (select 1 from libraries where libraries.id = shifts.library_id and libraries.owner_id = auth.uid()));

-- Create a table for payments
create table payments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students not null ON DELETE CASCADE,
  library_id uuid references public.libraries not null,
  amount numeric(10, 2) not null,
  payment_date date not null default current_date,
  due_date date,
  status text not null,
  for_month text not null
);
-- Add RLS to payments table
alter table payments
  enable row level security;
create policy "Users can view payments in their own library." on payments
  for select using (exists (select 1 from libraries where libraries.id = payments.library_id and libraries.owner_id = auth.uid()));
create policy "Users can insert payments in their own library." on payments
  for insert with check (exists (select 1 from libraries where libraries.id = payments.library_id and libraries.owner_id = auth.uid()));
create policy "Users can update payments in their own library." on payments
  for update using (exists (select 1 from libraries where libraries.id = payments.library_id and libraries.owner_id = auth.uid()));