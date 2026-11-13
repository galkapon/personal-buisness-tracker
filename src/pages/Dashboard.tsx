import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ProjectQuickStart } from '@/components/ProjectQuickStart'
import { FloatingTimer } from '@/components/FloatingTimer'
import { SessionDetailsModal, SessionChanges } from '@/components/SessionDetailsModal'
import { TagPicker } from '@/components/TagPicker'
import { SubprojectList } from '@/components/SubprojectList'
import { useAuth } from '@/hooks/useAuth'
import { useTimer } from '@/hooks/useTimer'
import { useTags } from '@/hooks/useTags'
import { useSubprojects } from '@/hooks/useSubprojects'
import { AppHeader } from '@/components/AppHeader'
import { tagColor } from '@/lib/tagColors'
import { sessionRange, toLocalDate } from '@/lib/sessionTime'

export interface Project {
  id: string
  user_id: string
  name: string
  created_at: string
  archived: boolean
}

export interface TimeEntry {
  id: string
  project_id: string
  subproject_id?: string | null
  started_at: string
  ended_at: string | null
  title: string
  details?: string
  created_at: string
  user_id: string
}

const blankEntryForm = () => ({
  project_id: '',
  subproject_id: '',
  date: toLocalDate(new Date()),
  startTime: '09:00',
  endTime: '10:00',
  title: '',
})

export function Dashboard() {
  const { user } = useAuth()
  const { runningEntry, startTimer, stopTimer, updateTitle, syncRunningEntry } = useTimer(user?.id)
  const {
    tags,
    getSessionTags,
    addTagToSession,
    removeTagFromSession,
    createTag,
    deleteTag,
    ensureDefaultTags,
  } = useTags(user?.id)
  const { subprojects, addSubproject, renameSubproject, deleteSubproject, getSubprojects } =
    useSubprojects(user?.id)

  const [projects, setProjects] = useState<Project[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [detailsSessionId, setDetailsSessionId] = useState<string | null>(null)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectError, setProjectError] = useState<string | null>(null)
  const [selectedSessionForTags, setSelectedSessionForTags] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedSubprojectId, setSelectedSubprojectId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntryForm, setNewEntryForm] = useState(blankEntryForm)

  useEffect(() => {
    if (!user?.id) return
    fetchProjects()
    fetchTimeEntries()
    ensureDefaultTags()
  }, [user?.id])

  useEffect(() => {
    if (user?.id) fetchTimeEntries()
  }, [runningEntry?.id])

  const fetchProjects = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })

    setProjects(data || [])
  }

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newProjectName.trim()
    if (!user?.id || !name) return

    const { error } = await supabase.from('projects').insert({ user_id: user.id, name })
    if (error) {
      setProjectError(
        error.code === '23505' ? `You already have a project called "${name}"` : error.message
      )
      return
    }
    setProjectError(null)
    setNewProjectName('')
    setAddingProject(false)
    fetchProjects()
  }

  const fetchTimeEntries = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    setTimeEntries(data || [])
    setLoading(false)
  }

  const filteredEntries = timeEntries.filter((entry) => {
    const matchesProject =
      (!selectedProjectId || entry.project_id === selectedProjectId) &&
      (!selectedSubprojectId || entry.subproject_id === selectedSubprojectId)
    const entryMonth = new Date(entry.started_at).toISOString().slice(0, 7)
    const matchesMonth = !selectedMonth || entryMonth === selectedMonth

    return matchesProject && matchesMonth
  })

  const getTotalSeconds = () => {
    return filteredEntries.reduce((sum, entry) => {
      if (!entry.ended_at) return sum
      const start = new Date(entry.started_at).getTime()
      const end = new Date(entry.ended_at).getTime()
      return sum + (end - start) / 1000
    }, 0)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEntryDuration = (entry: TimeEntry) => {
    if (!entry.ended_at) return 0
    const start = new Date(entry.started_at).getTime()
    const end = new Date(entry.ended_at).getTime()
    return (end - start) / 1000
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Error deleting entry:', error)
    } else {
      fetchTimeEntries()
    }
  }

  const addManualEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !newEntryForm.project_id) return

    const { started_at, ended_at } = sessionRange(
      newEntryForm.date,
      newEntryForm.startTime,
      newEntryForm.endTime
    )

    const { error } = await supabase.from('time_entries').insert({
      user_id: user.id,
      project_id: newEntryForm.project_id,
      ...(newEntryForm.subproject_id ? { subproject_id: newEntryForm.subproject_id } : {}),
      started_at,
      ended_at,
      title: newEntryForm.title,
    })

    if (error) {
      console.error('Error adding entry:', error)
      alert(`Couldn't save: ${error.message}`)
    } else {
      setNewEntryForm(blankEntryForm())
      setShowAddForm(false)
      fetchTimeEntries()
    }
  }

  const uniqueMonths = Array.from(
    new Set(
      timeEntries
        .map((e) => new Date(e.started_at).toISOString().slice(0, 7))
        .filter(Boolean)
    )
  ).sort()
    .reverse()

  const runningProject = projects.find(
    (p) => p.id === runningEntry?.project_id
  )
  const runningSubproject = subprojects.find(
    (s) => s.id === runningEntry?.subproject_id
  )

  const saveSession = async (sessionId: string, changes: SessionChanges) => {
    const original = timeEntries.find((t) => t.id === sessionId)
    // Only send subproject_id when mini-projects are involved, so saving still
    // works on a database that hasn't had the subproject column added.
    const { subproject_id, ...rest } = changes
    const touchesSubproject = !!(subproject_id || original?.subproject_id)
    const update = touchesSubproject ? { ...rest, subproject_id } : rest

    const { error } = await supabase.from('time_entries').update(update).eq('id', sessionId)
    if (error) return error.message
    setTimeEntries((prev) =>
      prev
        .map((t) => (t.id === sessionId ? { ...t, ...update } : t))
        .sort((a, b) => b.started_at.localeCompare(a.started_at))
    )
    if (sessionId === runningEntry?.id) syncRunningEntry(sessionId, update)
    return null
  }

  const saveRunningTitle = async (title: string) => {
    await updateTitle(title)
    fetchTimeEntries()
  }

  const detailsSession = timeEntries.find((t) => t.id === detailsSessionId)

  const createAndAddTag = async (sessionId: string, name: string) => {
    const { tag, error } = await createTag(name)
    if (!tag) return error || 'Unknown error'
    return addTagToSession(sessionId, tag.id)
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className={`max-w-6xl mx-auto px-4 py-6 sm:py-8 ${runningEntry ? 'pb-40' : 'pb-12'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
          {/* Sidebar: projects, mini-projects, manual entry */}
          <aside className="card p-4 lg:sticky lg:top-6 space-y-4">
            <div>
              <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Projects
              </h2>

              <div className="space-y-1">
                {loading ? (
                  <p className="px-1 text-sm text-gray-600">Loading…</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id}>
                      <ProjectQuickStart
                        project={project}
                        isRunning={
                          runningEntry?.project_id === project.id &&
                          !runningEntry?.subproject_id
                        }
                        onStart={() => startTimer(project.id)}
                        onStop={() => stopTimer()}
                      />
                      <SubprojectList
                        subprojects={getSubprojects(project.id)}
                        runningSubprojectId={runningEntry?.subproject_id || null}
                        onStart={(subId) => startTimer(project.id, subId)}
                        onStop={() => stopTimer()}
                        onAdd={(name) => addSubproject(project.id, name)}
                        onRename={renameSubproject}
                        onDelete={deleteSubproject}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="mt-2 px-1">
                {addingProject ? (
                  <form onSubmit={addProject} className="flex gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="input py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={!newProjectName.trim()}
                      className="btn-primary px-2.5 py-1.5"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingProject(false)
                        setNewProjectName('')
                        setProjectError(null)
                      }}
                      className="btn-ghost px-2 py-1.5"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button onClick={() => setAddingProject(true)} className="link-quiet text-sm">
                    + New project
                  </button>
                )}
                {projectError && (
                  <p className="mt-1 text-xs text-gray-700">⚠ Couldn't save: {projectError}</p>
                )}
              </div>
            </div>

            <div id="entry-form" className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-secondary w-full"
              >
                {showAddForm ? 'Cancel' : '+ Add session manually'}
              </button>

              {showAddForm && (
                <form onSubmit={addManualEntry} className="mt-3 space-y-3">
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text"
                      value={newEntryForm.title}
                      onChange={(e) =>
                        setNewEntryForm({ ...newEntryForm, title: e.target.value })
                      }
                      placeholder="What did you work on?"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Project</label>
                    <select
                      value={newEntryForm.project_id}
                      onChange={(e) =>
                        setNewEntryForm({
                          ...newEntryForm,
                          project_id: e.target.value,
                          subproject_id: '',
                        })
                      }
                      required
                      className="input"
                    >
                      <option value="">Select…</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {getSubprojects(newEntryForm.project_id).length > 0 && (
                    <div>
                      <label className="label">Mini-project</label>
                      <select
                        value={newEntryForm.subproject_id}
                        onChange={(e) =>
                          setNewEntryForm({ ...newEntryForm, subproject_id: e.target.value })
                        }
                        className="input"
                      >
                        <option value="">— none —</option>
                        {getSubprojects(newEntryForm.project_id).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      value={newEntryForm.date}
                      onChange={(e) =>
                        setNewEntryForm({ ...newEntryForm, date: e.target.value })
                      }
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Start</label>
                      <input
                        type="time"
                        value={newEntryForm.startTime}
                        onChange={(e) =>
                          setNewEntryForm({ ...newEntryForm, startTime: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">End</label>
                      <input
                        type="time"
                        value={newEntryForm.endTime}
                        onChange={(e) =>
                          setNewEntryForm({ ...newEntryForm, endTime: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <button type="submit" className="btn-primary w-full">
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </aside>

          {/* Sessions */}
          <section className="min-w-0">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Sessions</h1>
                <p className="text-sm text-gray-600">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'session' : 'sessions'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total
                </div>
                <div className="text-2xl font-semibold tabular-nums text-gray-900">
                  {formatDuration(getTotalSeconds())}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div>
                <label className="label">Project</label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value || null)
                    setSelectedSubprojectId(null)
                  }}
                  className="input"
                >
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mini-project</label>
                <select
                  value={selectedSubprojectId || ''}
                  onChange={(e) => setSelectedSubprojectId(e.target.value || null)}
                  className="input"
                >
                  <option value="">All mini-projects</option>
                  {(selectedProjectId
                    ? projects.filter((p) => p.id === selectedProjectId)
                    : projects
                  ).map((p) =>
                    getSubprojects(p.id).length > 0 ? (
                      <optgroup key={p.id} label={p.name}>
                        {getSubprojects(p.id).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null
                  )}
                </select>
              </div>

              <div>
                <label className="label">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input"
                >
                  <option value="">All months</option>
                  {uniqueMonths.map((month) => (
                    <option key={month} value={month}>
                      {new Date(month + '-01').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-600">Loading…</p>
            ) : filteredEntries.length === 0 ? (
              <div className="card py-12 text-center text-sm text-gray-600">
                No sessions match these filters.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => {
                  const project = projects.find((p) => p.id === entry.project_id)
                  const subproject = subprojects.find((s) => s.id === entry.subproject_id)
                  const entryTags = getSessionTags(entry.id)
                  const color = entryTags.length > 0 ? tagColor(entryTags[0].color) : null

                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border px-4 py-3"
                      style={{
                        backgroundColor: color ? color.tint : '#FFFFFF',
                        borderColor: color ? color.border : '#EDEDEB',
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p
                            className={`text-[15px] leading-snug line-clamp-2 ${
                              entry.title ? 'font-semibold text-gray-900' : 'italic text-gray-500'
                            }`}
                          >
                            {entry.title || 'Untitled'}
                          </p>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {formatDateTime(entry.started_at)}
                            <span className="mx-1.5 text-gray-400">·</span>
                            <span className="text-gray-800">{project?.name || '—'}</span>
                            {subproject && <span> › {subproject.name}</span>}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-[15px] font-semibold tabular-nums text-gray-900">
                          {entry.ended_at ? (
                            formatDuration(getEntryDuration(entry))
                          ) : (
                            <span className="text-sm font-medium text-gray-600">● Running</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {entryTags.map((tag) => (
                          <span
                            key={tag.id}
                            style={{ backgroundColor: tagColor(tag.color).chip }}
                            className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded text-xs text-gray-900"
                          >
                            {tag.name}
                            <button
                              onClick={() => removeTagFromSession(entry.id, tag.id)}
                              title="Remove tag"
                              className="text-gray-500 hover:text-gray-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {selectedSessionForTags !== entry.id && (
                          <button
                            onClick={() => setSelectedSessionForTags(entry.id)}
                            className="link-quiet"
                          >
                            + Tag
                          </button>
                        )}
                        <button
                          onClick={() => setDetailsSessionId(entry.id)}
                          className={entry.details ? 'text-xs font-medium text-gray-800 hover:text-gray-900 underline decoration-gray-300 underline-offset-2' : 'link-quiet'}
                        >
                          {entry.details ? 'View full' : '+ Details'}
                        </button>
                        <div className="ml-auto flex gap-3">
                          <button onClick={() => setDetailsSessionId(entry.id)} className="link-quiet">
                            Edit
                          </button>
                          <button onClick={() => deleteEntry(entry.id)} className="link-quiet">
                            Delete
                          </button>
                        </div>
                      </div>

                      {selectedSessionForTags === entry.id && (
                        <TagPicker
                          tags={tags}
                          selectedTagIds={entryTags.map((t) => t.id)}
                          onAdd={(tagId) => addTagToSession(entry.id, tagId)}
                          onCreateAndAdd={(name) => createAndAddTag(entry.id, name)}
                          onDeleteTag={deleteTag}
                          onClose={() => setSelectedSessionForTags(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <FloatingTimer
        runningEntry={runningEntry}
        projectName={
          runningProject
            ? runningSubproject
              ? `${runningProject.name} › ${runningSubproject.name}`
              : runningProject.name
            : null
        }
        onStop={() => stopTimer()}
        onTitleChange={saveRunningTitle}
      />

      {detailsSession && (
        <SessionDetailsModal
          key={detailsSession.id}
          session={detailsSession}
          projects={projects}
          getSubprojects={getSubprojects}
          onSave={(changes) => saveSession(detailsSession.id, changes)}
          onClose={() => setDetailsSessionId(null)}
        />
      )}
    </div>
  )
}
