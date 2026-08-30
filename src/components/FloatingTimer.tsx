import { useEffect, useState } from 'react'
import { TimeEntry } from '@/hooks/useTimer'

interface FloatingTimerProps {
  runningEntry: TimeEntry | null
  projectName: string | null
  onStop: () => void
}

export function FloatingTimer({
  runningEntry,
  projectName,
  onStop,
}: FloatingTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!runningEntry) return

    const interval = setInterval(() => {
      const started = new Date(runningEntry.started_at).getTime()
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - started) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [runningEntry])

  if (!runningEntry || !projectName) return null

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <div>
              <div className="text-sm font-semibold opacity-90">Recording</div>
              <div className="text-lg font-bold">{projectName}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <button
            onClick={onStop}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-lg"
          >
            ⏸ Stop
          </button>
        </div>
      </div>
    </div>
  )
}
