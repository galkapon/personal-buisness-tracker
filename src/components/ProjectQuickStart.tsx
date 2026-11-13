import { Project } from '@/pages/Dashboard'

interface ProjectQuickStartProps {
  project: Project
  isRunning: boolean
  onStart: () => void
  onStop: () => void
}

export function ProjectQuickStart({
  project,
  isRunning,
  onStart,
  onStop,
}: ProjectQuickStartProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition ${
        isRunning ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-100'
      }`}
    >
      <span className="text-sm font-semibold text-gray-900 flex-1 truncate">
        {project.name}
      </span>
      {isRunning ? (
        <button onClick={onStop} className="btn-primary px-2.5 py-1 text-xs">
          ■ Stop
        </button>
      ) : (
        <button onClick={onStart} className="btn-secondary px-2.5 py-1 text-xs">
          ▶ Start
        </button>
      )}
    </div>
  )
}
