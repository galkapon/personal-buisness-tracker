import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Project } from '@/pages/Projects'
import { TimeEntry } from '@/hooks/useTimer'

interface ProjectDetailsProps {
  project: Project
  userId: string
  onBack: () => void
}

interface MonthlyTotal {
  month: string
  hours: number
  minutes: number
  entries: TimeEntry[]
}

export function ProjectDetails({ project, userId, onBack }: ProjectDetailsProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyTotal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimeEntries()
  }, [project.id, userId])

  const fetchTimeEntries = async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', project.id)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching time entries:', error)
      setLoading(false)
      return
    }

    const grouped = groupByMonth(data || [])
    setMonthlyData(grouped)
    setLoading(false)
  }

  const groupByMonth = (entries: TimeEntry[]): MonthlyTotal[] => {
    const map = new Map<string, TimeEntry[]>()

    entries.forEach((entry) => {
      if (!entry.ended_at) return
      const date = new Date(entry.started_at)
      const monthKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })

      if (!map.has(monthKey)) {
        map.set(monthKey, [])
      }
      map.get(monthKey)!.push(entry)
    })

    return Array.from(map.entries())
      .map(([month, entries]) => {
        let totalSeconds = 0
        entries.forEach((entry) => {
          if (entry.ended_at) {
            const start = new Date(entry.started_at).getTime()
            const end = new Date(entry.ended_at).getTime()
            totalSeconds += (end - start) / 1000
          }
        })

        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)

        return { month, hours, minutes, entries }
      })
      .sort((a, b) => new Date(b.month) - new Date(a.month))
  }

  const formatDuration = (entry: TimeEntry) => {
    if (!entry.ended_at) return '—'
    const start = new Date(entry.started_at).getTime()
    const end = new Date(entry.ended_at).getTime()
    const seconds = Math.floor((end - start) / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Back to Timer
      </button>

      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        {project.name} — History
      </h2>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : monthlyData.length === 0 ? (
        <p className="text-gray-600">No time entries yet.</p>
      ) : (
        <div className="space-y-8">
          {monthlyData.map((monthTotal) => (
            <div key={monthTotal.month} className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {monthTotal.month}
                </h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {monthTotal.hours}h {monthTotal.minutes}m
                  </div>
                  <div className="text-sm text-gray-600">
                    {monthTotal.entries.length} session
                    {monthTotal.entries.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {monthTotal.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(entry.started_at)}
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {formatDuration(entry)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-700">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
