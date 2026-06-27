-- ============================================================================
-- 010_content_batch_01.sql  —  Real authored course content (batch 1 of ~10)
-- Courses: virtual-assistant, chatgpt-for-work, data-entry, customer-support
--
-- Idempotent: each course block looks up its id by slug, wipes any existing
-- cms_* content for that course, then re-inserts. Sets the course to PUBLISHED
-- so it appears in the mobile app immediately. Run in the Supabase SQL editor.
-- Requires migrations 005–009 (cms_* tables + stage/chapter columns) applied.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- COURSE: Virtual Assistant
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare cid uuid; s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; q uuid;
begin
  select id into cid from public.courses where slug = 'virtual-assistant';
  if cid is null then raise notice 'skip virtual-assistant (not found)'; return; end if;

  delete from public.cms_questions where quiz_id in (select id from public.cms_quizzes where course_id = cid);
  delete from public.cms_quizzes where course_id = cid;
  delete from public.cms_lessons where course_id = cid;
  delete from public.cms_chapters where course_id = cid;
  delete from public.cms_stages where course_id = cid;
  update public.courses set status = 'published', ai_generated = true where id = cid;

  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Foundations', 'Understand the VA role and set up your tools.', 0) returning id into s1;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Core VA Services', 'The day-to-day work clients pay for.', 1) returning id into s2;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Working with Clients', 'Win clients, communicate well, and get paid.', 2) returning id into s3;

  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'What a Virtual Assistant Does', 0) returning id into c1;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'Setting Up Your VA Toolkit', 1) returning id into c2;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'Inbox & Email Management', 2) returning id into c3;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'Calendar & Scheduling', 3) returning id into c4;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s3, 'Finding & Pitching Clients', 4) returning id into c5;
  insert into public.cms_chapters (course_id, stage_id, title, is_milestone, order_index) values (cid, s3, 'Communication & Getting Paid', true, 5) returning id into c6;

  insert into public.cms_lessons (course_id, stage_id, chapter_id, title, type, body, xp_reward, duration_minutes, order_index, status) values
  (cid, s1, c1, 'What a Virtual Assistant Does', 'text', $md$## Key idea
A virtual assistant (VA) handles the recurring admin work that keeps a business running — so the owner can focus on growth. You work remotely, usually for clients abroad, billed hourly or on a monthly retainer.

## Common tasks
- Email and inbox triage
- Calendar and meeting scheduling
- Travel booking and research
- Data entry and simple reports
- Customer follow-ups

## In practice
Most VAs specialise. A "general VA" does a bit of everything; a "niche VA" (e.g. real-estate or e‑commerce) charges more because they know the client's tools and workflow.

## Tips
- Clients hire VAs to *save time*. Always frame your work as time given back.
- Reliability beats speed. Being predictable is your biggest selling point.$md$, 15, 6, 0, 'published'),

  (cid, s1, c2, 'Setting Up Your VA Toolkit', 'text', $md$## Key idea
You don't need expensive software to start. A free, reliable stack covers 90% of VA work.

## A starter toolkit
- **Google Workspace** (Gmail, Calendar, Docs, Sheets) — most clients already use it
- **A scheduler** like Calendly for booking calls
- **A password manager** (Bitwarden) — you'll handle client logins safely
- **A time tracker** (Clockify) — proves your hours for billing
- **A communication tool** — Slack or WhatsApp, plus Zoom

## In practice
Create a separate work email and a simple folder system. Keep one document per client with their logins (stored in the password manager, not the doc), preferences, and recurring tasks.

## Avoid
Never store client passwords in plain text or share them over chat.$md$, 15, 6, 1, 'published'),

  (cid, s2, c3, 'Inbox & Email Management', 'text', $md$## Key idea
"Inbox zero" isn't about reading everything — it's about making sure nothing important is missed and the client only sees what needs *them*.

## A simple system
1. **Triage** — scan new mail twice a day, not constantly.
2. **Label** — Action, Waiting, FYI, Done.
3. **Handle** — reply to anything you can answer; draft replies for the client to approve on the rest.
4. **Archive** — clear handled mail out of the inbox.

## In practice
Build a folder of saved reply templates (refunds, scheduling, "thanks, received"). Templates cut reply time by half and keep the tone consistent.

## Avoid
Don't mark something done until the client has what they need — a "sent" reply that bounced is not done.$md$, 15, 6, 2, 'published'),

  (cid, s2, c4, 'Calendar & Scheduling', 'text', $md$## Key idea
Scheduling is mostly about **time zones** and **buffers**. Get those right and you look like a pro.

## The essentials
- Always confirm the client's home time zone, then book in *their* zone.
- Add 10–15 minute buffers between meetings.
- Protect focus blocks — don't let the calendar fill every slot.
- Send a clear invite: title, video link, agenda, time zone.

## In practice
Use Calendly so clients pick from open slots automatically — it removes the back‑and‑forth and handles time zones for you. For VIPs, still confirm by message.

## Avoid
Double‑booking and "what time is that for me?" confusion. State the zone in every message (e.g. "3pm Nairobi / 12pm London").$md$, 15, 6, 3, 'published'),

  (cid, s3, c5, 'Finding & Pitching Clients', 'text', $md$## Key idea
You don't need hundreds of clients — you need 2–3 good ones. Most VAs find their first client on Upwork, OnlineJobs.ph, LinkedIn, or through referrals.

## A pitch that works
- Lead with the client's problem, not your CV.
- Name the exact tasks you'll take off their plate.
- Show one quick proof (a sample inbox system, a tidy spreadsheet).
- Propose a small paid trial week.

## In practice
A short Loom video walking through how you'd organise their inbox beats a long cover letter. It shows skill *and* communication at once.

## Avoid
Generic "I am hardworking and fast learner" pitches. Specific beats enthusiastic every time.$md$, 15, 6, 4, 'published'),

  (cid, s3, c6, 'Communication & Getting Paid', 'text', $md$## Key idea
Clear communication and clean invoicing are what turn a one‑off gig into steady income.

## Communication habits
- Send a short daily or end‑of‑task update.
- Ask questions in batches, not one at a time.
- Flag problems early — clients forgive mistakes, not surprises.

## Getting paid
- Agree the rate, scope, and pay date *before* starting.
- Track hours (Clockify) and send a simple invoice (Wave or a Google Doc).
- For Kenya/Africa, Wise, Payoneer, and PayPal are common ways to receive USD.

## Avoid
Starting work with no agreement. A two‑line written scope protects both sides.$md$, 15, 6, 5, 'published');

  insert into public.cms_quizzes (course_id, stage_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, s2, c4, 'Core VA Skills Quiz', 'chapter', 80, 50, 50) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$How often should a VA usually check a client inbox?$q$, '["Constantly, all day","Twice a day in focused passes","Once a week","Only when the client asks"]'::jsonb, 'Twice a day in focused passes', $q$Batching inbox time keeps you productive and avoids constant interruption.$q$, 0),
    (q, 'true_false', $q$You should always book meetings in the client home time zone.$q$, '["True","False"]'::jsonb, 'True', $q$Booking in the client zone prevents confusion and missed calls.$q$, 1),
    (q, 'multiple_choice', $q$What is the safest way to store a client password?$q$, '["In a shared Google Doc","In a password manager","In a chat message","On a sticky note"]'::jsonb, 'In a password manager', $q$A password manager encrypts credentials and is never plain text.$q$, 2),
    (q, 'fill_blank', $q$Adding a 10–15 minute ______ between meetings prevents back-to-back overload.$q$, '[]'::jsonb, 'buffer', $q$Buffers absorb overruns and give breathing room.$q$, 3),
    (q, 'scenario', $q$A client emails an angry customer complaint while away. Best first action?$q$, '["Ignore it until the client returns","Draft a calm reply and flag it for the client to approve","Delete it","Reply with a refund immediately"]'::jsonb, 'Draft a calm reply and flag it for the client to approve', $q$Draft and flag: you keep things moving without overstepping authority.$q$, 4);

  insert into public.cms_quizzes (course_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, c6, 'Virtual Assistant Final Assessment', 'final', 90, 300, 100) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$Why do most businesses hire a VA?$q$, '["To save the owner time","To replace the whole team","To do legal work","To invest their money"]'::jsonb, 'To save the owner time', $q$VAs take recurring admin off the owner so they can focus on growth.$q$, 0),
    (q, 'multiple_choice', $q$Which is the strongest first pitch to a client?$q$, '["I am hardworking and a fast learner","A short Loom showing how you would organise their inbox","A long list of your hobbies","A request for a high salary"]'::jsonb, 'A short Loom showing how you would organise their inbox', $q$Showing the work proves skill and communication at once.$q$, 1),
    (q, 'true_false', $q$An email reply that bounced still counts as a completed task.$q$, '["True","False"]'::jsonb, 'False', $q$It is only done when the client actually has what they need.$q$, 2),
    (q, 'multiple_choice', $q$Before starting work you should agree on...$q$, '["Rate, scope, and pay date","Nothing, just start","Only your hourly rate","The client favourite colour"]'::jsonb, 'Rate, scope, and pay date', $q$A clear agreement up front protects both sides.$q$, 3),
    (q, 'fill_blank', $q$Tools like Wise, Payoneer and ______ are common ways to receive USD payments.$q$, '[]'::jsonb, 'PayPal', $q$These services let VAs in Africa receive international payments.$q$, 4),
    (q, 'scenario', $q$You realise you made a mistake in a report already sent to the client. What is best?$q$, '["Say nothing and hope they miss it","Flag it immediately with a fix","Blame the software","Quietly resend without explanation"]'::jsonb, 'Flag it immediately with a fix', $q$Clients forgive mistakes, not surprises — flag early with a solution.$q$, 5);
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COURSE: ChatGPT for Work
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare cid uuid; s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; q uuid;
begin
  select id into cid from public.courses where slug = 'chatgpt-for-work';
  if cid is null then raise notice 'skip chatgpt-for-work (not found)'; return; end if;

  delete from public.cms_questions where quiz_id in (select id from public.cms_quizzes where course_id = cid);
  delete from public.cms_quizzes where course_id = cid;
  delete from public.cms_lessons where course_id = cid;
  delete from public.cms_chapters where course_id = cid;
  delete from public.cms_stages where course_id = cid;
  update public.courses set status = 'published', ai_generated = true where id = cid;

  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Getting Started', 'What ChatGPT is and your first useful prompts.', 0) returning id into s1;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Prompting for Real Work', 'Write prompts that get reliable results.', 1) returning id into s2;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Putting It to Work', 'Build a daily AI workflow you can sell.', 2) returning id into s3;

  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'What ChatGPT Is (and Isn''t)', 0) returning id into c1;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'Your First Useful Prompts', 1) returning id into c2;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'The Anatomy of a Great Prompt', 2) returning id into c3;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'Editing, Summarizing & Drafting', 3) returning id into c4;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s3, 'Research & Checking the Output', 4) returning id into c5;
  insert into public.cms_chapters (course_id, stage_id, title, is_milestone, order_index) values (cid, s3, 'Building a Daily AI Workflow', true, 5) returning id into c6;

  insert into public.cms_lessons (course_id, stage_id, chapter_id, title, type, body, xp_reward, duration_minutes, order_index, status) values
  (cid, s1, c1, 'What ChatGPT Is (and Isn''t)', 'text', $md$## Key idea
ChatGPT is a text assistant that predicts useful responses from patterns in language. It is brilliant at drafting, rewriting, summarising, and explaining — but it can confidently state wrong facts ("hallucinate").

## Good jobs for it
- Writing and rewriting (emails, posts, descriptions)
- Summarising long text
- Turning rough notes into clean documents
- Explaining concepts simply

## Weak spots
- Recent news and live data
- Exact numbers, citations, and legal/medical facts
- Anything where being wrong is costly without checking

## Tip
Treat it like a fast, eager junior assistant: great first drafts, always reviewed before they go out.$md$, 15, 6, 0, 'published'),

  (cid, s1, c2, 'Your First Useful Prompts', 'text', $md$## Key idea
A prompt is just an instruction. The clearer and more specific it is, the better the result.

## Try these
- "Rewrite this email to sound friendly and professional: [paste]"
- "Summarise these notes into 5 bullet points: [paste]"
- "Give me 10 subject lines for an email about [topic]"
- "Explain [concept] like I am 12 years old"

## In practice
Start a task, then refine: "shorter", "more formal", "add a call to action". You're having a conversation, not casting a spell.

## Avoid
One‑word prompts like "marketing". Vague in, vague out.$md$, 15, 6, 1, 'published'),

  (cid, s2, c3, 'The Anatomy of a Great Prompt', 'text', $md$## Key idea
Strong prompts have four parts: **Role, Task, Context, Format.**

## The R‑T‑C‑F formula
- **Role** — "You are an experienced customer‑support agent."
- **Task** — "Write a reply apologising for a late delivery."
- **Context** — "The customer ordered 5 days ago, paid for express, tone should be warm."
- **Format** — "Keep it under 120 words, friendly, end with a discount offer."

## In practice
Paste real examples of the style you want. "Match the tone of this: [paste]" is one of the most powerful prompts there is.

## Avoid
Cramming five unrelated requests into one prompt. Do one job well, then the next.$md$, 15, 6, 2, 'published'),

  (cid, s2, c4, 'Editing, Summarizing & Drafting', 'text', $md$## Key idea
The fastest wins at work are editing and summarising — tasks you do every day.

## Workhorse prompts
- "Proofread and fix grammar, keep my voice: [paste]"
- "Summarise this report in 3 bullets a busy manager would read: [paste]"
- "Turn these bullet points into a polished paragraph: [paste]"
- "Make this 50% shorter without losing meaning: [paste]"

## In practice
Draft → ChatGPT polish → your final review. You stay in control of accuracy and tone; it removes the blank‑page struggle.

## Avoid
Sending AI text straight out without reading it. Always do a final human pass.$md$, 15, 6, 3, 'published'),

  (cid, s3, c5, 'Research & Checking the Output', 'text', $md$## Key idea
ChatGPT is a great starting point for research and a poor finishing point. Use it to get oriented fast, then verify.

## A safe research flow
1. Ask for an overview: "Explain the key points of [topic]."
2. Ask for structure: "What questions should I be asking about this?"
3. **Verify** facts, numbers, and quotes from a real source.

## In practice
For anything you'll publish or send to a client, confirm specifics elsewhere. Ask ChatGPT to "list what I should double‑check" — it will flag its own risky claims.

## Avoid
Trusting names, dates, statistics, or citations without checking. This is where hallucinations hurt most.$md$, 15, 6, 4, 'published'),

  (cid, s3, c6, 'Building a Daily AI Workflow', 'text', $md$## Key idea
The people who get paid for "AI skills" aren't prompt wizards — they've built repeatable workflows that save hours.

## Build your own
- Keep a personal prompt library (a Google Doc of your best prompts).
- Standardise repeat tasks: weekly report, client email, social caption.
- Pair ChatGPT with your tools — paste from Sheets, draft in Docs.

## Sell it
Offer services like "AI‑assisted content", "inbox drafting", or "report summaries". Clients pay for the *time saved*, not the tool.

## Tip
Track how long a task took before and after. "I cut this from 2 hours to 30 minutes" is a powerful pitch.$md$, 15, 6, 5, 'published');

  insert into public.cms_quizzes (course_id, stage_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, s2, c4, 'Prompting Skills Quiz', 'chapter', 80, 50, 50) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$Which task is ChatGPT most reliable at?$q$, '["Reporting today''s news","Rewriting an email","Giving exact live stock prices","Citing exact legal cases"]'::jsonb, 'Rewriting an email', $q$Drafting and rewriting are its core strengths; live facts are not.$q$, 0),
    (q, 'multiple_choice', $q$The R-T-C-F prompt formula stands for...$q$, '["Role, Task, Context, Format","Read, Type, Copy, Finish","Run, Test, Check, Fix","Role, Time, Cost, Fee"]'::jsonb, 'Role, Task, Context, Format', $q$Role, Task, Context, Format gives the model everything it needs.$q$, 1),
    (q, 'true_false', $q$You should send ChatGPT output without reading it, to save time.$q$, '["True","False"]'::jsonb, 'False', $q$Always do a final human review for accuracy and tone.$q$, 2),
    (q, 'fill_blank', $q$When ChatGPT confidently states something false, it is called a ______.$q$, '[]'::jsonb, 'hallucination', $q$Hallucinations are why facts must be verified.$q$, 3),
    (q, 'scenario', $q$You need a client report summarised AND fact-checked. Best approach?$q$, '["Trust the summary fully","Use ChatGPT to summarise, then verify the facts yourself","Skip the summary","Ask it to invent sources"]'::jsonb, 'Use ChatGPT to summarise, then verify the facts yourself', $q$Great starting point, human finishing point.$q$, 4);

  insert into public.cms_quizzes (course_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, c6, 'ChatGPT for Work Final Assessment', 'final', 90, 300, 100) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$The best mental model for ChatGPT at work is...$q$, '["A perfect all-knowing oracle","A fast junior assistant whose work you review","A search engine","A calculator"]'::jsonb, 'A fast junior assistant whose work you review', $q$Great drafts, always reviewed before they go out.$q$, 0),
    (q, 'multiple_choice', $q$Which prompt will give the best result?$q$, '["marketing","Write 5 friendly subject lines for an email promoting a Canva design service to small businesses","help me","make it good"]'::jsonb, 'Write 5 friendly subject lines for an email promoting a Canva design service to small businesses', $q$Specific role, task and context beat vague prompts.$q$, 1),
    (q, 'true_false', $q$Pasting an example of the tone you want improves the output.$q$, '["True","False"]'::jsonb, 'True', $q$"Match this tone: [paste]" is one of the most effective prompts.$q$, 2),
    (q, 'multiple_choice', $q$What do clients actually pay AI-skilled workers for?$q$, '["Owning ChatGPT","The time and effort saved","Typing fast","The subscription"]'::jsonb, 'The time and effort saved', $q$You sell outcomes and saved hours, not the tool.$q$, 3),
    (q, 'fill_blank', $q$Keeping a document of your best reusable prompts is called a prompt ______.$q$, '[]'::jsonb, 'library', $q$A prompt library makes repeat tasks fast and consistent.$q$, 4),
    (q, 'scenario', $q$ChatGPT gives you a statistic for a client proposal. What should you do?$q$, '["Use it as-is","Verify it from a real source first","Make the number bigger","Delete the whole proposal"]'::jsonb, 'Verify it from a real source first', $q$Numbers and citations are exactly where hallucinations cause damage.$q$, 5);
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COURSE: Data Entry
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare cid uuid; s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; q uuid;
begin
  select id into cid from public.courses where slug = 'data-entry';
  if cid is null then raise notice 'skip data-entry (not found)'; return; end if;

  delete from public.cms_questions where quiz_id in (select id from public.cms_quizzes where course_id = cid);
  delete from public.cms_quizzes where course_id = cid;
  delete from public.cms_lessons where course_id = cid;
  delete from public.cms_chapters where course_id = cid;
  delete from public.cms_stages where course_id = cid;
  update public.courses set status = 'published', ai_generated = true where id = cid;

  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Foundations', 'What data entry work is and the basics.', 0) returning id into s1;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Accuracy & Speed', 'Be fast without making costly mistakes.', 1) returning id into s2;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Tools & Getting Work', 'The tools employers expect and where to find jobs.', 2) returning id into s3;

  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'What Data Entry Work Involves', 0) returning id into c1;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'Spreadsheet Basics', 1) returning id into c2;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'Accuracy: Avoiding Costly Errors', 2) returning id into c3;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'Speed: Shortcuts & Workflows', 3) returning id into c4;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s3, 'Common Tools (Excel, Sheets, Forms)', 4) returning id into c5;
  insert into public.cms_chapters (course_id, stage_id, title, is_milestone, order_index) values (cid, s3, 'Finding Data Entry Jobs', true, 5) returning id into c6;

  insert into public.cms_lessons (course_id, stage_id, chapter_id, title, type, body, xp_reward, duration_minutes, order_index, status) values
  (cid, s1, c1, 'What Data Entry Work Involves', 'text', $md$## Key idea
Data entry is taking information from one place and recording it accurately in another — forms, spreadsheets, CRMs, or databases. It is one of the easiest remote jobs to start, and accuracy matters more than speed.

## Typical jobs
- Typing details from invoices or receipts into a sheet
- Updating customer records in a CRM
- Cleaning up messy spreadsheets
- Transcribing forms or surveys

## Why employers value it
Bad data costs money — wrong addresses, duplicate records, mis‑typed prices. A careful data‑entry worker is genuinely valuable.

## Tip
Your reputation is "zero errors". Build it deliberately from day one.$md$, 15, 6, 0, 'published'),

  (cid, s1, c2, 'Spreadsheet Basics', 'text', $md$## Key idea
Most data entry happens in spreadsheets (Excel or Google Sheets). You only need a handful of basics to be productive.

## Must‑know basics
- **Rows and columns** — each row is a record, each column a field.
- **Cells** — click and type; press Tab to move right, Enter to move down.
- **Freeze the header row** so column titles stay visible.
- **Sort and filter** to find and check entries.
- **A simple formula**: =SUM(A2:A10) adds a column.

## In practice
Keep one piece of data per cell. Never put "Nairobi, Kenya" in one cell if the job asks for separate City and Country columns.

## Tip
Save often, and keep the original file untouched — work on a copy.$md$, 15, 6, 1, 'published'),

  (cid, s2, c3, 'Accuracy: Avoiding Costly Errors', 'text', $md$## Key idea
One wrong digit can send a payment to the wrong place. Accuracy systems beat "being careful".

## Build accuracy in
- **Double‑key check** — re‑type or re‑read critical fields like amounts and emails.
- **Use validation** — drop‑down lists and number formats stop bad entries.
- **Spot‑check** — review a random 10% of rows.
- **Match totals** — if a source says 250 records, your sheet should have 250.

## In practice
Turn on data validation in Sheets (Data → Data validation) so a "Status" column can only be "Paid" or "Unpaid" — no typos possible.

## Avoid
Rushing the last 10%. Errors cluster where attention drops.$md$, 15, 6, 2, 'published'),

  (cid, s2, c4, 'Speed: Shortcuts & Workflows', 'text', $md$## Key idea
Speed comes from keyboard shortcuts and removing repeated clicks — not from typing faster.

## Shortcuts that save hours
- **Ctrl/Cmd + C / V** — copy, paste
- **Tab / Enter** — move without the mouse
- **Ctrl + D** — fill down the cell above
- **Ctrl + ;** — insert today's date
- **Ctrl + Arrow** — jump to the edge of data

## Workflow tips
- Sort the source so it matches your entry order.
- Use copy‑paste for repeated values.
- Do similar fields in passes (all emails, then all phones) — batching is faster than row‑by‑row.

## Tip
Learn 5 shortcuts this week, 5 next week. Muscle memory compounds.$md$, 15, 6, 3, 'published'),

  (cid, s3, c5, 'Common Tools (Excel, Sheets, Forms)', 'text', $md$## Key idea
Employers expect comfort with Excel, Google Sheets, and online forms. They're similar — learn one well and the rest follow.

## The landscape
- **Excel** — powerful, common in established companies.
- **Google Sheets** — free, collaborative, used by startups and agencies.
- **Google Forms / Typeform** — collect data that lands straight in a sheet.
- **CRMs** (HubSpot, Zoho) — where customer records live.

## In practice
Practise importing a CSV, removing duplicates, and using Find & Replace to fix a repeated error across hundreds of rows in seconds.

## Tip
List your tools on your profile: "Excel, Google Sheets, basic CRM data entry." Specific tools attract specific jobs.$md$, 15, 6, 4, 'published'),

  (cid, s3, c6, 'Finding Data Entry Jobs', 'text', $md$## Key idea
Data entry is competitive, so you win on **reliability and proof**, not the lowest price.

## Where to look
- Upwork and Freelancer (start with small fixed jobs)
- OnlineJobs.ph and remote job boards
- Local businesses that still use paper records

## Stand out
- Offer a small free or paid sample to prove accuracy.
- Mention turnaround time and that you double‑check your work.
- Keep a simple portfolio: a before/after of a messy sheet you cleaned.

## Avoid
"Data entry" scams that ask you to pay a fee to start. Legit clients pay *you*. Never pay to work.$md$, 15, 6, 5, 'published');

  insert into public.cms_quizzes (course_id, stage_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, s2, c4, 'Accuracy & Speed Quiz', 'chapter', 80, 50, 50) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$In data entry, what matters most?$q$, '["Typing as fast as possible","Accuracy","Using the newest software","Working without breaks"]'::jsonb, 'Accuracy', $q$A fast worker who makes errors costs the client money.$q$, 0),
    (q, 'multiple_choice', $q$How should you store "Nairobi, Kenya" when City and Country are separate columns?$q$, '["Both in one cell","City in one cell, Country in another","In the header row","As a formula"]'::jsonb, 'City in one cell, Country in another', $q$One piece of data per cell keeps the sheet usable.$q$, 1),
    (q, 'true_false', $q$Data validation drop-downs help prevent typos.$q$, '["True","False"]'::jsonb, 'True', $q$Restricting a column to set values stops bad entries.$q$, 2),
    (q, 'fill_blank', $q$The shortcut Ctrl + ______ fills down the value from the cell above.$q$, '[]'::jsonb, 'D', $q$Ctrl + D copies the cell above into the selected cell.$q$, 3),
    (q, 'scenario', $q$Your source says 250 records but your sheet has 248. What do you do?$q$, '["Submit it anyway","Find the 2 missing records before submitting","Add 2 blank rows","Delete 2 more"]'::jsonb, 'Find the 2 missing records before submitting', $q$Matching totals is a core accuracy check.$q$, 4);

  insert into public.cms_quizzes (course_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, c6, 'Data Entry Final Assessment', 'final', 90, 300, 100) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$Why do employers value careful data entry?$q$, '["Bad data costs money","It looks nice","It is fun","It uses less electricity"]'::jsonb, 'Bad data costs money', $q$Wrong addresses, duplicates and mis-typed prices are expensive.$q$, 0),
    (q, 'multiple_choice', $q$Which is a real way to work faster?$q$, '["Typing without checking","Using keyboard shortcuts and batching similar fields","Skipping validation","Never saving"]'::jsonb, 'Using keyboard shortcuts and batching similar fields', $q$Speed comes from removing clicks, not rushing accuracy.$q$, 1),
    (q, 'true_false', $q$A legitimate client may ask you to pay a fee before you start a data-entry job.$q$, '["True","False"]'::jsonb, 'False', $q$Never pay to work — that is a scam. Real clients pay you.$q$, 2),
    (q, 'multiple_choice', $q$What is a good way to prove your accuracy to a new client?$q$, '["Promise you are perfect","Offer a small sample and a before/after of a cleaned sheet","Charge the most","Refuse a trial"]'::jsonb, 'Offer a small sample and a before/after of a cleaned sheet', $q$Proof beats promises when work is competitive.$q$, 3),
    (q, 'fill_blank', $q$Working on a ______ of the file keeps the original data safe.$q$, '[]'::jsonb, 'copy', $q$Always preserve the original; edit a copy.$q$, 4),
    (q, 'scenario', $q$You notice the same misspelling in 300 rows. Fastest fix?$q$, '["Edit each row by hand","Use Find & Replace","Delete the column","Ignore it"]'::jsonb, 'Use Find & Replace', $q$Find & Replace corrects repeated errors in seconds.$q$, 5);
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- COURSE: Customer Support
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare cid uuid; s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; q uuid;
begin
  select id into cid from public.courses where slug = 'customer-support';
  if cid is null then raise notice 'skip customer-support (not found)'; return; end if;

  delete from public.cms_questions where quiz_id in (select id from public.cms_quizzes where course_id = cid);
  delete from public.cms_quizzes where course_id = cid;
  delete from public.cms_lessons where course_id = cid;
  delete from public.cms_chapters where course_id = cid;
  delete from public.cms_stages where course_id = cid;
  update public.courses set status = 'published', ai_generated = true where id = cid;

  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Foundations', 'The role of remote customer support and its channels.', 0) returning id into s1;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Handling Conversations', 'Reply clearly and calm angry customers.', 1) returning id into s2;
  insert into public.cms_stages (course_id, title, description, order_index) values
    (cid, 'Tools & Career', 'Helpdesk tools, metrics, and getting hired.', 2) returning id into s3;

  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'The Role of Remote Customer Support', 0) returning id into c1;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s1, 'Channels: Email, Chat, Phone', 1) returning id into c2;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'Writing Clear, Friendly Replies', 2) returning id into c3;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s2, 'De-escalating Angry Customers', 3) returning id into c4;
  insert into public.cms_chapters (course_id, stage_id, title, order_index) values (cid, s3, 'Helpdesk Tools (Zendesk, Intercom)', 4) returning id into c5;
  insert into public.cms_chapters (course_id, stage_id, title, is_milestone, order_index) values (cid, s3, 'Metrics & Getting Hired', true, 5) returning id into c6;

  insert into public.cms_lessons (course_id, stage_id, chapter_id, title, type, body, xp_reward, duration_minutes, order_index, status) values
  (cid, s1, c1, 'The Role of Remote Customer Support', 'text', $md$## Key idea
Customer support is the voice of a company. Your job is to help people solve problems quickly and leave them feeling looked after — even when the answer is "no".

## What you'll do
- Answer questions about products and orders
- Fix or escalate problems
- Process refunds and returns
- Keep records of conversations

## Why it's a great remote starter
Demand is huge, the work is largely text‑based, and good written English plus patience can earn you a steady salary from anywhere.

## Tip
Every reply does two jobs: solve the problem *and* protect the relationship. Hold both in mind.$md$, 15, 6, 0, 'published'),

  (cid, s1, c2, 'Channels: Email, Chat, Phone', 'text', $md$## Key idea
Support happens across channels, and each has a different rhythm.

## The channels
- **Email** — detailed, not instant. Be thorough; one reply should fully resolve.
- **Live chat** — fast, casual, often several at once. Short, friendly messages.
- **Phone** — personal, high‑pressure. Tone of voice carries everything.
- **Social media** — public, so reputation is on the line.

## In practice
Most remote entry roles are email and chat. Master clear writing and you're ready for the majority of jobs.

## Tip
Match the customer's energy: a frustrated email needs warmth; a quick "where's my order?" chat needs speed.$md$, 15, 6, 1, 'published'),

  (cid, s2, c3, 'Writing Clear, Friendly Replies', 'text', $md$## Key idea
A great support reply is **clear, warm, and complete**. The customer should never have to ask a follow‑up.

## The structure
1. **Acknowledge** — "Thanks for reaching out, and sorry for the trouble."
2. **Answer** — give the solution in plain language.
3. **Next step** — tell them exactly what happens now.
4. **Close warmly** — "Happy to help further — just reply here."

## In practice
Use short sentences and avoid jargon. Read it aloud: if it sounds robotic, soften it. Templates save time but always personalise the first line.

## Avoid
Blaming the customer, over‑apologising, or hiding the answer in a wall of text.$md$, 15, 6, 2, 'published'),

  (cid, s2, c4, 'De-escalating Angry Customers', 'text', $md$## Key idea
Angry customers are usually frightened or frustrated, not evil. Your calm is contagious.

## The de‑escalation steps
- **Listen and acknowledge** the feeling: "I understand how frustrating this is."
- **Apologise** for the experience, not necessarily fault.
- **Take ownership** — "Let me sort this out for you."
- **Give a concrete next step and timeline.**
- **Follow through.**

## In practice
Never argue or go silent. If you can't fix it instantly, say what you *are* doing and when you'll update them.

## Avoid
Matching their anger, making promises you can't keep, or copying a cold template into a heated conversation.$md$, 15, 6, 3, 'published'),

  (cid, s3, c5, 'Helpdesk Tools (Zendesk, Intercom)', 'text', $md$## Key idea
Support teams work inside helpdesk software that organises every conversation as a "ticket".

## What to know
- **Tickets** — one per customer issue, with a status (open, pending, solved).
- **Macros / saved replies** — templates for common questions.
- **Tags** — label tickets to spot trends.
- **Common tools** — Zendesk, Intercom, Freshdesk, Help Scout, Gorgias.

## In practice
The skills transfer between tools: manage a queue, keep ticket status accurate, and use macros without sounding like a robot.

## Tip
Many tools offer free trials. Spend an hour clicking around Zendesk — being able to say "I've used Zendesk" helps you get hired.$md$, 15, 6, 4, 'published'),

  (cid, s3, c6, 'Metrics & Getting Hired', 'text', $md$## Key idea
Support teams measure quality. Knowing the metrics shows employers you understand the job.

## Key metrics
- **CSAT** — customer satisfaction score (the thumbs‑up after a chat).
- **First response time** — how fast you reply first.
- **Resolution time** — how long to fully solve.
- **Tickets per hour** — your throughput.

## Getting hired
- Highlight written English, patience, and reliability.
- Do a great job on the trial/assessment — many roles test with sample tickets.
- Mention any tool experience (Zendesk, chat support).

## Tip
In your application, answer a sample complaint in your own words. Showing the skill beats describing it.$md$, 15, 6, 5, 'published');

  insert into public.cms_quizzes (course_id, stage_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, s2, c4, 'Handling Conversations Quiz', 'chapter', 80, 50, 50) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$Every support reply should do two things:$q$, '["Solve the problem and protect the relationship","Be long and formal","Blame someone","Close the ticket fast at any cost"]'::jsonb, 'Solve the problem and protect the relationship', $q$You resolve the issue while keeping the customer feeling cared for.$q$, 0),
    (q, 'multiple_choice', $q$First step when a customer is angry?$q$, '["Argue back","Listen and acknowledge the feeling","Go silent","Send a cold template"]'::jsonb, 'Listen and acknowledge the feeling', $q$Acknowledging the emotion lowers the temperature.$q$, 1),
    (q, 'true_false', $q$A good email reply should leave the customer needing to ask a follow-up.$q$, '["True","False"]'::jsonb, 'False', $q$One thorough reply should fully resolve the issue.$q$, 2),
    (q, 'fill_blank', $q$In helpdesk tools, each customer issue is tracked as a ______.$q$, '[]'::jsonb, 'ticket', $q$Tickets organise conversations with a status like open or solved.$q$, 3),
    (q, 'scenario', $q$You cannot fix a problem instantly. What is best?$q$, '["Say nothing","Tell them what you are doing and when you will update them","Promise it is fixed already","Close the ticket"]'::jsonb, 'Tell them what you are doing and when you will update them', $q$Clear next steps and timelines keep trust during delays.$q$, 4);

  insert into public.cms_quizzes (course_id, chapter_id, title, kind, passing_score, xp_reward, order_index) values
    (cid, c6, 'Customer Support Final Assessment', 'final', 90, 300, 100) returning id into q;
  insert into public.cms_questions (quiz_id, type, prompt, options, answer, explanation, order_index) values
    (q, 'multiple_choice', $q$Which channels are most common for remote entry-level support?$q$, '["Email and live chat","Only phone","Only social media","Door to door"]'::jsonb, 'Email and live chat', $q$Most starter roles are text-based email and chat.$q$, 0),
    (q, 'multiple_choice', $q$A strong reply structure is...$q$, '["Acknowledge, answer, next step, close warmly","Just the answer","A long apology only","Ignore and close"]'::jsonb, 'Acknowledge, answer, next step, close warmly', $q$This structure leaves no follow-up needed.$q$, 1),
    (q, 'true_false', $q$CSAT measures customer satisfaction.$q$, '["True","False"]'::jsonb, 'True', $q$CSAT is the satisfaction score after an interaction.$q$, 2),
    (q, 'multiple_choice', $q$Best way to show a support skill in an application?$q$, '["Say you are good at it","Answer a sample complaint in your own words","List your hobbies","Demand a high salary"]'::jsonb, 'Answer a sample complaint in your own words', $q$Demonstrating the skill beats describing it.$q$, 3),
    (q, 'fill_blank', $q$Reusable templates for common questions in a helpdesk are called ______ or saved replies.$q$, '[]'::jsonb, 'macros', $q$Macros speed up replies to common questions.$q$, 4),
    (q, 'scenario', $q$A customer is furious about a late delivery they paid express for. Best opening?$q$, '["This is not our fault","I understand how frustrating this is, let me sort it out for you","Please calm down","I cannot help"]'::jsonb, 'I understand how frustrating this is, let me sort it out for you', $q$Acknowledge the feeling and take ownership to de-escalate.$q$, 5);
end $$;
