import { useState } from 'react'
import { Subproject } from '@/hooks/useSubprojects'

interface SubprojectListProps {
  subprojects: Subproject[]
  runningSubprojectId: string | null
  onStart: (subprojectId: string) => void
  onStop: () => void
  onAdd: (name: string) => Promise<string | null>
  onRename: (subprojectId: string, name: string) => Promise<string | null>
  onDelete: (subprojectId: string) => Promise<string | null>
}

export function SubprojectList({
  subprojects,
  runningSubprojectId,
  onStart,
  onStop,
  onAdd,
  onRename,
  onDelete,
}: SubprojectListProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const err = await onAdd(name)
    setError(err)
    if (!err) {
      setName('')
      setAdding(false)
    }
  }

  const startRename = (sub: Subproject) => {
    setRenamingId(sub.id)
    setRenameText(sub.name)
    setError(null)
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameText('')
    setError(null)
  }

  const handleRename = async (e: React.FormEvent, sub: Subproject) => {
    e.preventDefault()
    if (!renameText.trim() || renameText.trim() === sub.name) {
      cancelRename()
      return
    }
    const err = await onRename(sub.id, renameText)
    setError(err)
    if (!err) cancelRename()
  }

  const handleDelete = async (sub: Subproject) => {
    if (!confirm(`Delete mini-project "${sub.name}"? Its sessions stay under the main project.`)) return
    setError(await onDelete(sub.id))
  }

  return (
    <div className="ml-3 pl-3 border-l border-gray-200 space-y-0.5">
      {subprojects.map((sub) => {
        const isRunning = runningSubprojectId === sub.id

        if (renamingId === sub.id) {
          return (
            <form
              key={sub.id}
              onSubmit={(e) => handleRename(e, sub)}
              className="flex gap-1 py-1"
            >
              <input
                type="text"
                autoFocus
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && cancelRename()}
                onFocus={(e) => e.target.select()}
                aria-label="Mini-project name"
                className="input py-1 text-xs"
              />
              <button type="submit" disabled={!renameText.trim()} className="btn-primary px-2 py-1 text-xs">
                Save
              </button>
              <button type="button" onClick={cancelRename} className="btn-ghost px-2 py-1 text-xs">
                ✕
              </button>
            </form>
          )
        }

        return (
          <div
            key={sub.id}
            className={`group flex items-center gap-2 pl-2 pr-1 py-1 rounded-md ${
              isRunning ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-100'
            }`}
          >
            <span
              onDoubleClick={() => startRename(sub)}
              title="Double-click to rename"
              className="flex-1 truncate text-sm text-gray-700"
            >
              {sub.name}
            </span>
            <button
              onClick={() => startRename(sub)}
              title="Rename mini-project"
              className="text-gray-400 hover:text-gray-900 text-xs px-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              ✎
            </button>
            <button
              onClick={() => handleDelete(sub)}
              title="Delete mini-project"
              className="text-gray-400 hover:text-gray-900 text-sm px-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              ×
            </button>
            {isRunning ? (
              <button onClick={onStop} className="btn-primary px-2 py-0.5 text-xs">
                ■
              </button>
            ) : (
              <button
                onClick={() => onStart(sub.id)}
                title="Start timer"
                className="btn-secondary px-2 py-0.5 text-xs"
              >
                ▶
              </button>
            )}
          </div>
        )
      })}

      {adding ? (
        <form onSubmit={handleAdd} className="flex gap-1 py-1">
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mini-project name"
            className="input py-1 text-xs"
          />
          <button type="submit" disabled={!name.trim()} className="btn-primary px-2 py-1 text-xs">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setName('')
              setError(null)
            }}
            className="btn-ghost px-2 py-1 text-xs"
          >
            ✕
          </button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="link-quiet px-2 py-1">
          + mini-project
        </button>
      )}

      {error && <p className="text-xs text-gray-700 px-2">⚠ Couldn't save: {error}</p>}
    </div>
  )
}
