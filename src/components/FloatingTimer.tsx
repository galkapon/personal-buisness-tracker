import { useEffect, useState } from 'react'
import { TimeEntry } from '@/hooks/useTimer'

interface FloatingTimerProps {
  runningEntry: TimeEntry | null
  projectName: string | null
  onStop: () => void
  onTitleChange: (title: string) => void
}

export function FloatingTimer({
  runningEntry,
  projectName,
  onStop,
  onTitleChange,
}: FloatingTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [title, setTitle] = useState('')

  useEffect(() => {
    setTitle(runningEntry?.title || '')
  }, [runningEntry?.id, runningEntry?.title])

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

  const commitTitle = () => {
    if (title !== (runningEntry.title || '')) onTitleChange(title)
  }

  const handleStop = () => {
    commitTitle()
    onStop()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold opacity-90">Recording</div>
            <div className="text-base font-bold truncate">{projectName}</div>
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          placeholder="Session title — what are you working on?"
          className="order-last sm:order-none basis-full sm:basis-auto flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/15 placeholder-white/70 text-white focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 outline-none"
        />

        <div className="flex items-center gap-4 ml-auto">
          <div className="text-3xl font-mono font-bold">{formatTime(elapsedSeconds)}</div>
          <button
            onClick={handleStop}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition shadow-lg"
          >
            ⏸ Stop
          </button>
        </div>
      </div>
    </div>
  )
}
