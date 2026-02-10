create extension if not exists "uuid-ossp";

create table sections (
  id serial primary key,
  name text not null unique,
  grade_level integer not null check (grade_level between 7 and 12),
  created_at timestamptz default now()
);

create table partylists (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color_hex text not null default '#3B82F6',
  acronym text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table students (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  section_id integer not null references sections(id) on delete cascade,
  has_voted boolean default false,
  voted_at timestamptz,
  created_at timestamptz default now(),
  unique(full_name, section_id)
);

create table candidates (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  position text not null check (
    position in (
      'President',
      'Vice-President',
      'Secretary',
      'Treasurer',
      'Auditor',
      'Public Information Officer',
      'Protocol Officer',
      'Grade Level Representative'
    )
  ),
  partylist_id uuid not null references partylists(id) on delete cascade,
  target_grade_level integer check (
    (position = 'Grade Level Representative' and target_grade_level between 8 and 12)
    or (position != 'Grade Level Representative' and target_grade_level is null)
  ),
  photo_url text,
  platform text,
  created_at timestamptz default now(),
  unique(position, partylist_id, target_grade_level)
);

create table votes (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  section_id integer not null references sections(id) on delete cascade,
  created_at timestamptz default now()
);

create index idx_students_section on students(section_id);
create index idx_students_voted on students(has_voted);
create index idx_candidates_position on candidates(position);
create index idx_candidates_partylist on candidates(partylist_id);
create index idx_votes_candidate on votes(candidate_id);
create index idx_votes_section on votes(section_id);

create or replace function process_vote(
  p_student_id uuid,
  p_votes jsonb
)
returns json as $$
declare
  v_section_id integer;
  v_has_voted boolean;
  v_vote jsonb;
begin
  select section_id, has_voted into v_section_id, v_has_voted
  from students
  where id = p_student_id;

  if not found then
    return json_build_object('success', false, 'error', 'Student not found');
  end if;

  if v_has_voted then
    return json_build_object('success', false, 'error', 'Student has already voted');
  end if;

  for v_vote in select * from jsonb_array_elements(p_votes)
  loop
    insert into votes (candidate_id, student_id, section_id)
    values (
      (v_vote->>'candidate_id')::uuid,
      p_student_id,
      v_section_id
    );
  end loop;

  update students
  set has_voted = true, voted_at = now()
  where id = p_student_id;

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

create or replace view election_results as
select
  c.id,
  c.full_name,
  c.position,
  c.target_grade_level,
  p.name as partylist_name,
  p.color_hex,
  count(v.id) as vote_count
from candidates c
left join votes v on c.id = v.candidate_id
left join partylists p on c.partylist_id = p.id
group by c.id, c.full_name, c.position, c.target_grade_level, p.name, p.color_hex;

alter table sections enable row level security;
alter table partylists enable row level security;
alter table students enable row level security;
alter table candidates enable row level security;
alter table votes enable row level security;

create policy "Public read sections" on sections for select using (true);
create policy "Public read partylists" on partylists for select using (is_active = true);
create policy "Public read candidates" on candidates for select using (true);
create policy "Public read votes" on votes for select using (true);
create policy "Public read students" on students for select using (true);

create policy "Public write sections" on sections for insert with check (true);
create policy "Public update sections" on sections for update using (true);
create policy "Public delete sections" on sections for delete using (true);

create policy "Public write partylists" on partylists for insert with check (true);
create policy "Public update partylists" on partylists for update using (true);
create policy "Public delete partylists" on partylists for delete using (true);

create policy "Public write students" on students for insert with check (true);
create policy "Public update students" on students for update using (true);
create policy "Public delete students" on students for delete using (true);

create policy "Public write candidates" on candidates for insert with check (true);
create policy "Public update candidates" on candidates for update using (true);
create policy "Public delete candidates" on candidates for delete using (true);

create policy "Public write votes" on votes for insert with check (true);
create policy "Public delete votes" on votes for delete using (true);
