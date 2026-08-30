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
      className={`p-3 rounded-lg border-2 transition ${
        isRunning
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-gray-50 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-900 flex-1 truncate">
          {project.name}
        </span>
        {!isRunning ? (
          <button
            onClick={onStart}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition flex-shrink-0"
          >
            ▶ Start
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition flex-shrink-0"
          >
            ⏸ Stop
          </button>
        )}
      </div>
    </div>
  )
}
