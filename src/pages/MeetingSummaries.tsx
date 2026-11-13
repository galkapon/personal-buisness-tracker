import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { useSubprojects } from '@/hooks/useSubprojects'
import { AppHeader } from '@/components/AppHeader'
import type { Project } from '@/pages/Dashboard'

export interface MeetingSummary {
  id: string
  user_id: string
  title: string
  date: string
  attendees: string
  summary: string
  // Legacy field: no longer edited. The schema migration folds it into `summary`.
  notes?: string
  project_id?: string | null
  subproject_id?: string | null
  created_at: string
}

const blankForm = () => ({
  title: '',
  date: new Date().toISOString().split('T')[0],
  attendees: '',
  summary: '',
  project_id: '',
  subproject_id: '',
})

export function MeetingSummaries() {
  const { user } = useAuth()
  const { subprojects, getSubprojects } = useSubprojects(user?.id)
  const [summaries, setSummaries] = useState<MeetingSummary[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState(blankForm)

  useEffect(() => {
    if (!user?.id) return
    fetchSummaries()
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => setProjects(data || []))
  }, [user?.id])

  const fetchSummaries = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    setSummaries(data || [])
    setLoading(false)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setSaveError(null)
    setForm(blankForm())
  }

  const saveSummary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !form.title.trim()) return

    const { project_id, subproject_id, ...fields } = form
    const original = editingId ? summaries.find((s) => s.id === editingId) : undefined
    // Only send the project columns when they're actually used, so meetings
    // still save before the project_id/subproject_id migration has been run.
    const touchesProject = !!(project_id || subproject_id || original?.project_id || original?.subproject_id)
    const payload = {
      ...fields,
      ...(touchesProject
        ? { project_id: project_id || null, subproject_id: subproject_id || null }
        : {}),
    }

    const { error } = editingId
      ? await supabase.from('meeting_summaries').update(payload).eq('id', editingId)
      : await supabase.from('meeting_summaries').insert({ user_id: user.id, ...payload })

    if (error) {
      console.error('Error saving summary:', error)
      setSaveError(error.message)
      return
    }
    closeForm()
    fetchSummaries()
  }

  const deleteSummary = async (id: string) => {
    if (!confirm('Delete this meeting summary?')) return
    const { error } = await supabase
      .from('meeting_summaries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting summary:', error)
    } else {
      fetchSummaries()
    }
  }

  const startEdit = (summary: MeetingSummary) => {
    setForm({
      title: summary.title,
      date: summary.date,
      attendees: summary.attendees,
      summary: summary.summary,
      project_id: summary.project_id || '',
      subproject_id: summary.subproject_id || '',
    })
    setEditingId(summary.id)
    setSaveError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Archived projects stay selectable only if this meeting already uses one.
  const projectOptions = projects.filter((p) => !p.archived || p.id === form.project_id)
  const formSubprojects = getSubprojects(form.project_id)

  const describeProject = (s: MeetingSummary) => {
    const project = projects.find((p) => p.id === s.project_id)
    const subproject = subprojects.find((sp) => sp.id === s.subproject_id)
    return [project?.name, subproject?.name].filter(Boolean).join(' › ')
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Meetings</h1>
            <p className="text-sm text-gray-600">
              {summaries.length} {summaries.length === 1 ? 'summary' : 'summaries'}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true)
                setEditingId(null)
                setSaveError(null)
                setForm(blankForm())
              }}
              className="btn-primary"
            >
              + New meeting
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={saveSummary} className="card p-5 mb-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">
              {editingId ? 'Edit meeting' : 'New meeting'}
            </h2>

            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Client kickoff"
                required
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Project</label>
                <select
                  value={form.project_id}
                  onChange={(e) =>
                    setForm({ ...form, project_id: e.target.value, subproject_id: '' })
                  }
                  className="input"
                >
                  <option value="">— none —</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.archived ? ' (archived)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Mini-project</label>
                <select
                  value={form.subproject_id}
                  onChange={(e) => setForm({ ...form, subproject_id: e.target.value })}
                  disabled={formSubprojects.length === 0}
                  className="input disabled:opacity-60"
                >
                  <option value="">
                    {form.project_id && formSubprojects.length === 0
                      ? 'No mini-projects'
                      : '— none —'}
                  </option>
                  {formSubprojects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Attendees</label>
                <input
                  type="text"
                  value={form.attendees}
                  onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                  placeholder="e.g. John, Sarah, Mike"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Summary</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Key discussion points and outcomes"
                rows={8}
                className="input leading-relaxed"
              />
            </div>

            {saveError && <p className="text-sm text-gray-700">⚠ Couldn't save: {saveError}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Save changes' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : summaries.length === 0 ? (
          <div className="card py-12 text-center text-sm text-gray-600">
            No meeting summaries yet.
          </div>
        ) : (
          <div className="space-y-3">
            {summaries.map((s) => {
              const projectLabel = describeProject(s)
              return (
                <article key={s.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900">{s.title}</h3>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {projectLabel && (
                          <>
                            <span className="mx-1.5 text-gray-400">·</span>
                            <span className="text-gray-800">{projectLabel}</span>
                          </>
                        )}
                        {s.attendees && (
                          <>
                            <span className="mx-1.5 text-gray-400">·</span>
                            {s.attendees}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <button onClick={() => startEdit(s)} className="link-quiet">
                        Edit
                      </button>
                      <button onClick={() => deleteSummary(s.id)} className="link-quiet">
                        Delete
                      </button>
                    </div>
                  </div>

                  {s.summary && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {s.summary}
                    </p>
                  )}

                  {/* Until the schema migration folds old notes into the summary, still show them. */}
                  {s.notes && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      <span className="font-medium">Notes:</span> {s.notes}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
