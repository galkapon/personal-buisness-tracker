import { useState } from 'react'
import type { Project, TimeEntry } from '@/pages/Dashboard'
import type { Subproject } from '@/hooks/useSubprojects'
import { sessionRange, toLocalDate, toLocalTime } from '@/lib/sessionTime'

export interface SessionChanges {
  title: string
  details: string
  project_id: string
  subproject_id: string | null
  started_at: string
  /** Left out for a running session so saving doesn't stop it. */
  ended_at?: string
}

interface SessionDetailsModalProps {
  session: TimeEntry
  projects: Project[]
  getSubprojects: (projectId: string) => Subproject[]
  onSave: (changes: SessionChanges) => Promise<string | null>
  onClose: () => void
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export function SessionDetailsModal({
  session,
  projects,
  getSubprojects,
  onSave,
  onClose,
}: SessionDetailsModalProps) {
  const isRunning = !session.ended_at
  const initial = (() => {
    const start = new Date(session.started_at)
    const end = session.ended_at ? new Date(session.ended_at) : new Date()
    return {
      title: session.title || '',
      details: session.details || '',
      project_id: session.project_id,
      subproject_id: session.subproject_id || '',
      date: toLocalDate(start),
      startTime: toLocalTime(start),
      endTime: toLocalTime(end),
    }
  })()

  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A running session's end time is just "now" and is never saved, so it can't make the form dirty.
  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some(
    (k) => !(isRunning && k === 'endTime') && form[k] !== initial[k]
  )

  const range = sessionRange(form.date, form.startTime, form.endTime)
  const durationSeconds = isRunning
    ? (Date.now() - new Date(range.started_at).getTime()) / 1000
    : (new Date(range.ended_at).getTime() - new Date(range.started_at).getTime()) / 1000
  const crossesMidnight = !isRunning && form.endTime <= form.startTime

  // Archived projects stay selectable only if this session already uses one.
  const projectOptions = projects.filter((p) => !p.archived || p.id === form.project_id)
  const subprojectOptions = getSubprojects(form.project_id)

  const handleClose = () => {
    if (dirty && !confirm('Discard your unsaved changes?')) return
    onClose()
  }

  const handleSave = async () => {
    if (!form.project_id) {
      setError('Pick a project')
      return
    }
    if (isRunning && new Date(range.started_at).getTime() > Date.now()) {
      setError('A running session can’t start in the future')
      return
    }
    setSaving(true)
    setError(null)
    const err = await onSave({
      title: form.title.trim(),
      details: form.details,
      project_id: form.project_id,
      subproject_id: form.subproject_id || null,
      started_at: range.started_at,
      ...(isRunning ? {} : { ended_at: range.ended_at }),
    })
    setSaving(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Untitled session"
              aria-label="Session title"
              className="w-full -mx-2 px-2 py-1 text-xl font-semibold text-gray-900 placeholder:text-gray-400 border-0 rounded-md bg-transparent hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-gray-200"
            />
            <p className="mt-1 text-sm text-gray-600 tabular-nums">
              {isRunning ? '● Running · ' : ''}
              {formatDuration(Math.max(0, durationSeconds))}
              {crossesMidnight && ' · ends the next day'}
            </p>
          </div>
          <button onClick={handleClose} className="btn-ghost px-2 py-1 text-lg leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
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
                {!form.project_id && <option value="">Select…</option>}
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
                disabled={subprojectOptions.length === 0}
                className="input disabled:opacity-60"
              >
                <option value="">
                  {subprojectOptions.length === 0 ? 'No mini-projects' : '— none —'}
                </option>
                {subprojectOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Start</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">End</label>
              {isRunning ? (
                <div className="input text-gray-500">Running</div>
              ) : (
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="input"
                />
              )}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Write longer notes about this session (optional)…"
              rows={10}
              className="input leading-relaxed"
            />
          </div>
          {error && <p className="text-sm text-gray-700">⚠ Couldn't save: {error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4">
          <button onClick={handleClose} className="btn-secondary">
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
