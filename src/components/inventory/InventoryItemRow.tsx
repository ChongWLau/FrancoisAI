import { useRef, useState } from 'react'
import type { InventoryEntry } from '@/hooks/useInventory'
import type { StorageLocation } from '@/types/supabase'

const LOCATION_OPTIONS: { value: StorageLocation | ''; label: string }[] = [
  { value: '',        label: 'Unsorted' },
  { value: 'fridge',  label: 'Fridge' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'pantry',  label: 'Pantry' },
  { value: 'other',   label: 'Other' },
]

interface Props {
  item: InventoryEntry
  onDelete: () => void
  onSetLocation: (location: StorageLocation | null) => void
  onRename: (name: string) => void
}

export function InventoryItemRow({ item, onDelete, onSetLocation, onRename }: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditName(item.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  function commitEdit() {
    onRename(editName)
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white border-gray-200 group transition-colors">
      {/* Location dropdown */}
      <select
        value={item.location ?? ''}
        onChange={e => onSetLocation((e.target.value as StorageLocation) || null)}
        className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 shrink-0 focus:outline-none focus:ring-1 focus:ring-amber-300"
      >
        {LOCATION_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Name */}
      {editing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            else if (e.key === 'Escape') cancelEdit()
          }}
          className="flex-1 text-sm text-gray-800 bg-transparent border-b border-amber-400 outline-none py-0.5 min-w-0"
        />
      ) : (
        <span className="flex-1 text-sm text-gray-800 min-w-0 truncate">{item.name}</span>
      )}

      {/* Rename */}
      <button
        onClick={startEdit}
        className="text-gray-300 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        aria-label={`Rename ${item.name}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none shrink-0"
        aria-label={`Remove ${item.name}`}
      >
        ×
      </button>
    </div>
  )
}
