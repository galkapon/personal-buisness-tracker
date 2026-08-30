import { useState, useEffect } from 'react'
import { Project } from '@/pages/Projects'
import { TimeEntry } from '@/hooks/useTimer'

interface TimerProps {
  project: Project
  runningEntry: TimeEntry | null
  onStart: () => void
  onStop: () => void
  onUpdateNotes: (notes: string) => void
}

export function Timer({
  project,
  runningEntry,
  onStart,
  onStop,
  onUpdateNotes,
}: TimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!runningEntry) {
      setElapsedSeconds(0)
      setNotes('')
      return
    }

    setNotes(runningEntry.notes)

    const interval = setInterval(() => {
      const started = new Date(runningEntry.started_at).getTime()
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - started) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [runningEntry])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    onUpdateNotes(newNotes)
  }

  const isRunning = runningEntry !== null

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">{project.name}</h2>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-blue-600 mb-6">
          {formatTime(elapsedSeconds)}
        </div>

        <div className="flex gap-4 justify-center">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition text-lg"
            >
              ▶ Start
            </button>
          ) : (
            <button
              onClick={onStop}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition text-lg"
            >
              ⏸ Stop
            </button>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="border-t pt-8">
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-3">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="What are you working on?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
        />
      </div>

      {isRunning && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            ⏱️ Timer is running for <strong>{project.name}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
