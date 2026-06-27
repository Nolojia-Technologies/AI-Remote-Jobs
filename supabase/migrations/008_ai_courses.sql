-- ============================================================================
-- 008_ai_courses.sql
-- Full course hierarchy for AI generation (stages → chapters → lessons/quizzes),
-- a generation audit table, and the launch catalog of 38 courses (draft shells
-- the admin fills via "Generate with AI"). Idempotent.
-- ============================================================================

-- ─── Hierarchy ──────────────────────────────────────────────────────────────
create table if not exists public.cms_stages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text default '',
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  stage_id uuid references public.cms_stages(id) on delete cascade,
  title text not null,
  description text default '',
  is_milestone boolean default false,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

alter table public.cms_lessons add column if not exists stage_id uuid references public.cms_stages(id) on delete cascade;
alter table public.cms_lessons add column if not exists chapter_id uuid references public.cms_chapters(id) on delete cascade;
alter table public.cms_quizzes add column if not exists stage_id uuid references public.cms_stages(id) on delete cascade;
alter table public.cms_quizzes add column if not exists chapter_id uuid references public.cms_chapters(id) on delete cascade;

create index if not exists idx_cms_stages_course on public.cms_stages(course_id);
create index if not exists idx_cms_chapters_course on public.cms_chapters(course_id);
create index if not exists idx_cms_lessons_chapter on public.cms_lessons(chapter_id);
create index if not exists idx_cms_quizzes_chapter on public.cms_quizzes(chapter_id);

-- ─── Generation audit ───────────────────────────────────────────────────────
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  kind text not null,                 -- course | stage | lesson | quiz
  provider text,                      -- openai | claude | gemini | scaffold
  model text,
  target_id uuid,
  status text not null default 'completed' check (status in ('pending','completed','failed')),
  prompt text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Course slug (idempotent catalog seeding) ───────────────────────────────
alter table public.courses add column if not exists slug text;
create unique index if not exists courses_slug_key on public.courses(slug);
-- Generation metadata on the course.
alter table public.courses add column if not exists job_category text;
alter table public.courses add column if not exists ai_generated boolean default false;

-- ─── RLS for the new tables (authenticated read, admin write) ───────────────
do $$
declare t text;
begin
  foreach t in array array['cms_stages','cms_chapters'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.role() = ''authenticated'');', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

alter table public.ai_generations enable row level security;
drop policy if exists ai_generations_admin on public.ai_generations;
create policy ai_generations_admin on public.ai_generations for all using (public.is_admin()) with check (public.is_admin());

-- ─── Launch catalog: 38 courses (draft shells, AI-fillable) ─────────────────
insert into public.courses (slug, title, description, category, difficulty, estimated_hours, xp_reward, required_level, tags, status, job_category)
values
  ('virtual-assistant','Virtual Assistant','Become a sought-after remote VA: inbox, calendar, travel, research & client comms.','admin','beginner',12,1000,1,'{"virtual-assistant","admin","remote"}','draft','virtual_assistant'),
  ('ai-prompt-engineering','AI Prompt Engineering','Write prompts that get reliable, high-quality results from AI tools.','ai','intermediate',12,1000,1,'{"prompt-engineering","ai"}','draft','ai_prompt_specialist'),
  ('chatgpt-for-work','ChatGPT for Work','Use ChatGPT to do real work faster: writing, analysis, automation.','ai','beginner',12,1000,1,'{"chatgpt","ai","productivity"}','draft','ai_assistant'),
  ('data-entry','Data Entry','Fast, accurate data entry workflows employers trust.','admin','beginner',10,1000,1,'{"data-entry","admin"}','draft','data_entry'),
  ('social-media-management','Social Media Management','Plan, create and grow social accounts for clients.','marketing','beginner',12,1000,1,'{"social-media","marketing"}','draft','social_media_manager'),
  ('customer-support','Customer Support','Deliver excellent remote customer support across channels.','support','beginner',12,1000,1,'{"customer-support","support"}','draft','customer_support'),
  ('email-management','Email Management','Own a client''s inbox: triage, templates, zero-inbox systems.','admin','beginner',8,800,1,'{"email","admin"}','draft','virtual_assistant'),
  ('calendar-management','Calendar Management','Scheduling, time zones and calendar systems for busy clients.','admin','beginner',8,800,1,'{"calendar","admin"}','draft','virtual_assistant'),
  ('canva-design','Canva Design','Design professional graphics for brands using Canva.','design','beginner',12,1000,1,'{"canva","design"}','draft','canva_designer'),
  ('content-writing','Content Writing','Write clear, engaging content that ranks and converts.','writing','beginner',12,1000,1,'{"content-writing","writing"}','draft','content_writer'),
  ('copywriting','Copywriting','Persuasive copy for ads, emails and landing pages.','writing','intermediate',12,1000,1,'{"copywriting","writing"}','draft','copywriter'),
  ('digital-marketing','Digital Marketing','Run effective digital marketing campaigns end to end.','marketing','intermediate',14,1200,1,'{"digital-marketing","marketing"}','draft','digital_marketer'),
  ('seo','SEO','Rank pages on Google with on-page and technical SEO.','marketing','intermediate',12,1000,1,'{"seo","marketing"}','draft','seo_specialist'),
  ('wordpress','WordPress','Build and manage WordPress sites for clients.','web','beginner',12,1000,1,'{"wordpress","web"}','draft','web_developer'),
  ('basic-web-development','Basic Web Development','HTML, CSS and the web fundamentals for remote work.','web','beginner',14,1200,1,'{"web","html","css"}','draft','web_developer'),
  ('frontend-development','Frontend Development','Build modern, responsive interfaces.','web','intermediate',16,1500,1,'{"frontend","web"}','draft','frontend_developer'),
  ('react','React','Build dynamic UIs with React, the industry standard.','web','intermediate',16,1500,2,'{"react","frontend"}','draft','frontend_developer'),
  ('javascript','JavaScript','Master JavaScript — the language of the web.','web','intermediate',16,1500,1,'{"javascript","web"}','draft','frontend_developer'),
  ('python-fundamentals','Python Fundamentals','Programming foundations with Python.','code','beginner',16,1500,1,'{"python","code"}','draft','developer'),
  ('excel-for-remote-work','Excel for Remote Work','Spreadsheets, formulas and dashboards employers need.','admin','beginner',12,1000,1,'{"excel","data"}','draft','data_entry'),
  ('google-sheets','Google Sheets','Collaborative spreadsheets, formulas and automation.','admin','beginner',10,1000,1,'{"google-sheets","data"}','draft','data_entry'),
  ('google-docs','Google Docs','Professional documents and collaboration.','admin','beginner',6,600,1,'{"google-docs","admin"}','draft','virtual_assistant'),
  ('notion','Notion','Build systems, wikis and dashboards in Notion.','productivity','beginner',8,800,1,'{"notion","productivity"}','draft','virtual_assistant'),
  ('transcription','Transcription','Accurate, fast transcription for remote clients.','admin','beginner',8,800,1,'{"transcription","admin"}','draft','transcriptionist'),
  ('lead-generation','Lead Generation','Find and qualify leads that close.','sales','intermediate',12,1000,1,'{"lead-gen","sales"}','draft','lead_gen_specialist'),
  ('linkedin-optimization','LinkedIn Optimization','Turn your LinkedIn into a client/job magnet.','career','beginner',6,600,1,'{"linkedin","career"}','draft','virtual_assistant'),
  ('freelancing','Freelancing','Start and run a profitable freelance business.','career','beginner',12,1000,1,'{"freelancing","career"}','draft','freelancer'),
  ('upwork-success','Upwork Success','Win clients and build a profile that converts on Upwork.','career','beginner',10,1000,1,'{"upwork","freelancing"}','draft','freelancer'),
  ('fiverr-success','Fiverr Success','Create gigs that sell and rank on Fiverr.','career','beginner',10,1000,1,'{"fiverr","freelancing"}','draft','freelancer'),
  ('remote-interview-skills','Remote Job Interview Skills','Ace remote interviews and assessments.','career','beginner',8,800,1,'{"interview","career"}','draft','virtual_assistant'),
  ('ai-tools-productivity','AI Tools for Productivity','Stack AI tools to 10x your output.','ai','beginner',10,1000,1,'{"ai","productivity"}','draft','ai_assistant'),
  ('automation-with-ai','Automation with AI','Automate repetitive work with AI + no-code tools.','ai','intermediate',12,1200,1,'{"automation","ai"}','draft','automation_specialist'),
  ('crm-basics','CRM Basics','Manage customer relationships with CRMs.','sales','beginner',8,800,1,'{"crm","sales"}','draft','customer_success'),
  ('project-management','Project Management','Plan and ship projects with proven PM methods.','business','intermediate',12,1200,1,'{"project-management","business"}','draft','project_manager'),
  ('customer-success','Customer Success','Retain and grow customers as a CS professional.','support','intermediate',12,1200,1,'{"customer-success","support"}','draft','customer_success'),
  ('bookkeeping-basics','Bookkeeping Basics','Track finances and books for small businesses.','finance','beginner',12,1000,1,'{"bookkeeping","finance"}','draft','bookkeeper'),
  ('youtube-automation','YouTube Automation','Build and run faceless/automated YouTube channels.','media','intermediate',12,1200,1,'{"youtube","media"}','draft','content_creator'),
  ('affiliate-marketing','Affiliate Marketing','Earn commissions promoting products online.','marketing','intermediate',12,1200,1,'{"affiliate","marketing"}','draft','affiliate_marketer')
on conflict (slug) do nothing;

