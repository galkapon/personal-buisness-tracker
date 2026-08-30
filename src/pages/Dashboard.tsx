import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ProjectQuickStart } from '@/components/ProjectQuickStart'
import { FloatingTimer } from '@/components/FloatingTimer'
import { useAuth } from '@/hooks/useAuth'
import { useTimer } from '@/hooks/useTimer'

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
  started_at: string
  ended_at: string | null
  notes: string
  created_at: string
  user_id: string
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { runningEntry, startTimer, stopTimer, updateNotes } = useTimer(user?.id)

  const [projects, setProjects] = useState<Project[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntryForm, setNewEntryForm] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  })

  useEffect(() => {
    if (!user?.id) return
    fetchProjects()
    fetchTimeEntries()
  }, [user?.id])

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
      !selectedProjectId || entry.project_id === selectedProjectId
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

    const started = new Date(
      `${newEntryForm.date}T${newEntryForm.startTime}`
    ).toISOString()
    const ended = new Date(
      `${newEntryForm.date}T${newEntryForm.endTime}`
    ).toISOString()

    const { error } = await supabase.from('time_entries').insert({
      user_id: user.id,
      project_id: newEntryForm.project_id,
      started_at: started,
      ended_at: ended,
      notes: newEntryForm.notes,
    })

    if (error) {
      console.error('Error adding entry:', error)
    } else {
      setNewEntryForm({
        project_id: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        notes: '',
      })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 py-8 ${runningEntry ? 'pb-32' : 'pb-8'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Projects + Quick Start */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Projects
              </h2>

              <div className="space-y-2 mb-6">
                {loading ? (
                  <p className="text-sm text-gray-600">Loading...</p>
                ) : (
                  projects.map((project) => (
                    <ProjectQuickStart
                      key={project.id}
                      project={project}
                      isRunning={runningEntry?.project_id === project.id}
                      onStart={() => startTimer(project.id)}
                      onStop={() => stopTimer()}
                    />
                  ))
                )}
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition text-sm"
              >
                {showAddForm ? '✕ Cancel' : '+ Add Entry'}
              </button>

              {showAddForm && (
                <form onSubmit={addManualEntry} className="mt-4 space-y-3 p-3 bg-blue-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Project
                    </label>
                    <select
                      value={newEntryForm.project_id}
                      onChange={(e) =>
                        setNewEntryForm({ ...newEntryForm, project_id: e.target.value })
                      }
                      required
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newEntryForm.date}
                      onChange={(e) =>
                        setNewEntryForm({ ...newEntryForm, date: e.target.value })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start
                      </label>
                      <input
                        type="time"
                        value={newEntryForm.startTime}
                        onChange={(e) =>
                          setNewEntryForm({ ...newEntryForm, startTime: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End
                      </label>
                      <input
                        type="time"
                        value={newEntryForm.endTime}
                        onChange={(e) =>
                          setNewEntryForm({ ...newEntryForm, endTime: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={newEntryForm.notes}
                      onChange={(e) =>
                        setNewEntryForm({ ...newEntryForm, notes: e.target.value })
                      }
                      placeholder="Optional"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-2 rounded text-sm"
                  >
                    Save
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Main: Time Entries Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Project
                  </label>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) =>
                      setSelectedProjectId(e.target.value || null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Months</option>
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

              {/* Table */}
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : filteredEntries.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No time entries yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Date & Time
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Project
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Duration
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Notes
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-900">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => {
                        const project = projects.find(
                          (p) => p.id === entry.project_id
                        )
                        return (
                          <tr
                            key={entry.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {formatDateTime(entry.started_at)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                              {project?.name || '—'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-semibold text-blue-600">
                              {formatDuration(getEntryDuration(entry))}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {entry.notes || '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Total */}
                  <div className="mt-6 pt-6 border-t border-gray-200 text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      Total: {formatDuration(getTotalSeconds())}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <FloatingTimer
        runningEntry={runningEntry}
        projectName={runningProject?.name || null}
        onStop={() => stopTimer()}
      />
    </div>
  )
}
