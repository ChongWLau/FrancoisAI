import { useRef, useState } from 'react'
import type { StapleItem } from '@/hooks/useStapleItems'

interface Props {
  staples: StapleItem[]
  onAdd: (name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function ManageStaplesSheet({ staples, onAdd, onDelete, onClose }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleAdd() {
    if (!inputValue.trim()) return
    setAdding(true)
    try {
      await onAdd(inputValue.trim())
      setInputValue('')
      inputRef.current?.focus()
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-base font-semibold text-gray-900">Staple Items</p>
            <p className="text-xs text-gray-400 mt-0.5">Auto-added at the start of each week</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Add input */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Eggs, Milk, Bread…"
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              onClick={handleAdd}
              disabled={!inputValue.trim() || adding}
              className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Staples list */}
        <div className="overflow-y-auto flex-1 px-5 py-3">
          {staples.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No staples yet. Add items you buy every week.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {staples.map(s => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-800">{s.name}</span>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-1 -mr-1 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                    aria-label={`Remove ${s.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
