import { useState } from 'react'
import { Tag } from '@/hooks/useTags'
import { tagColor } from '@/lib/tagColors'

interface TagPickerProps {
  tags: Tag[]
  selectedTagIds: string[]
  onAdd: (tagId: string) => Promise<string | null>
  onCreateAndAdd: (name: string) => Promise<string | null>
  onDeleteTag: (tagId: string) => Promise<string | null>
  onClose: () => void
}

export function TagPicker({
  tags,
  selectedTagIds,
  onAdd,
  onCreateAndAdd,
  onDeleteTag,
  onClose,
}: TagPickerProps) {
  const [newTagName, setNewTagName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const available = tags.filter((t) => !selectedTagIds.includes(t.id))

  const run = async (action: () => Promise<string | null>) => {
    setSaving(true)
    setError(null)
    const err = await action()
    setSaving(false)
    if (err) setError(err)
    return err
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    const err = await run(() => onCreateAndAdd(newTagName))
    if (!err) setNewTagName('')
  }

  const handleDelete = (tag: Tag) => {
    if (!confirm(`Delete the tag "${tag.name}" from all sessions?`)) return
    run(() => onDeleteTag(tag.id))
  }

  return (
    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((tag) => (
            <span
              key={tag.id}
              style={{ backgroundColor: tagColor(tag.color).chip }}
              className="inline-flex items-center rounded text-xs text-gray-900"
            >
              <button
                onClick={() => run(() => onAdd(tag.id))}
                disabled={saving}
                className="pl-2 pr-1 py-0.5 hover:underline"
              >
                {tag.name}
              </button>
              <button
                onClick={() => handleDelete(tag)}
                disabled={saving}
                title="Delete this tag everywhere"
                className="pr-1.5 pl-0.5 py-0.5 text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-1.5">
        <input
          type="text"
          autoFocus
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag…"
          className="input py-1 text-xs"
        />
        <button
          type="submit"
          disabled={saving || !newTagName.trim()}
          className="btn-primary px-2.5 py-1 text-xs"
        >
          Add
        </button>
        <button type="button" onClick={onClose} className="btn-ghost px-2.5 py-1 text-xs">
          Done
        </button>
      </form>

      {error && <p className="text-xs text-gray-700">⚠ Couldn't save: {error}</p>}
    </div>
  )
}
