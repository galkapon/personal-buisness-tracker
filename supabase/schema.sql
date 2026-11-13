-- Safe to run repeatedly: tables/columns use IF NOT EXISTS, policies are dropped and recreated.

-- ========== Tables ==========

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.subprojects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  title text DEFAULT '',
  details text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS subproject_id uuid REFERENCES public.subprojects(id) ON DELETE SET NULL;

-- Sessions used to have a single "notes" field; existing notes become the session title.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.time_entries RENAME COLUMN notes TO title;
  END IF;
END $$;

ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS details text DEFAULT '';

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT 'bg-gray-200',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.session_tags (
  session_id uuid NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (session_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  date text NOT NULL,
  attendees text DEFAULT '',
  summary text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.meeting_summaries
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.meeting_summaries
  ADD COLUMN IF NOT EXISTS subproject_id uuid REFERENCES public.subprojects(id) ON DELETE SET NULL;

-- Meetings no longer have a separate "Notes & action items" field. Existing notes are
-- appended to the end of the summary (under a "Notes:" line) so nothing is lost; the
-- notes column is kept but emptied, which also makes this safe to re-run.
UPDATE public.meeting_summaries
SET summary = CASE
    WHEN coalesce(trim(summary), '') = '' THEN notes
    ELSE summary || E'\n\nNotes:\n' || notes
  END,
  notes = ''
WHERE coalesce(trim(notes), '') <> '';

CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  due_date date
);

-- ========== Indexes ==========

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON public.projects(archived);
CREATE INDEX IF NOT EXISTS idx_subprojects_user_id ON public.subprojects(user_id);
CREATE INDEX IF NOT EXISTS idx_subprojects_project_id ON public.subprojects(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_subproject_id ON public.time_entries(subproject_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_ended_at ON public.time_entries(ended_at);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_session_id ON public.session_tags(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_tag_id ON public.session_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_user_id ON public.meeting_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_project_id ON public.meeting_summaries(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON public.todos(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);

-- ========== Row Level Security ==========

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subprojects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Subprojects
DROP POLICY IF EXISTS "Users can view own subprojects" ON public.subprojects;
CREATE POLICY "Users can view own subprojects" ON public.subprojects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create subprojects" ON public.subprojects;
CREATE POLICY "Users can create subprojects" ON public.subprojects FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.projects WHERE projects.id = subprojects.project_id AND projects.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update own subprojects" ON public.subprojects;
CREATE POLICY "Users can update own subprojects" ON public.subprojects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own subprojects" ON public.subprojects;
CREATE POLICY "Users can delete own subprojects" ON public.subprojects FOR DELETE USING (auth.uid() = user_id);

-- Time entries
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
CREATE POLICY "Users can view own time entries" ON public.time_entries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create time entries" ON public.time_entries;
CREATE POLICY "Users can create time entries" ON public.time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
CREATE POLICY "Users can update own time entries" ON public.time_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.time_entries;
CREATE POLICY "Users can delete own time entries" ON public.time_entries FOR DELETE USING (auth.uid() = user_id);

-- Tags
DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create tags" ON public.tags;
CREATE POLICY "Users can create tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Session tags
DROP POLICY IF EXISTS "Users can view session tags for own sessions" ON public.session_tags;
CREATE POLICY "Users can view session tags for own sessions" ON public.session_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.time_entries WHERE time_entries.id = session_tags.session_id AND time_entries.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can add tags to own sessions" ON public.session_tags;
CREATE POLICY "Users can add tags to own sessions" ON public.session_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.time_entries WHERE time_entries.id = session_tags.session_id AND time_entries.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.tags WHERE tags.id = session_tags.tag_id AND tags.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can delete tags from own sessions" ON public.session_tags;
CREATE POLICY "Users can delete tags from own sessions" ON public.session_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.time_entries WHERE time_entries.id = session_tags.session_id AND time_entries.user_id = auth.uid())
);

-- Meeting summaries
DROP POLICY IF EXISTS "Users can view own meeting summaries" ON public.meeting_summaries;
CREATE POLICY "Users can view own meeting summaries" ON public.meeting_summaries FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create meeting summaries" ON public.meeting_summaries;
CREATE POLICY "Users can create meeting summaries" ON public.meeting_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own meeting summaries" ON public.meeting_summaries;
CREATE POLICY "Users can update own meeting summaries" ON public.meeting_summaries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own meeting summaries" ON public.meeting_summaries;
CREATE POLICY "Users can delete own meeting summaries" ON public.meeting_summaries FOR DELETE USING (auth.uid() = user_id);

-- Todos
DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create todos" ON public.todos;
CREATE POLICY "Users can create todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- Make the API see new columns immediately (avoids "column not found in the schema cache").
NOTIFY pgrst, 'reload schema';
