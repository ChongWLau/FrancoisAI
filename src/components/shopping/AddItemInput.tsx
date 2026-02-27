import { useEffect, useRef, useState } from 'react'

interface Props {
  onAdd: (name: string) => void
  getSuggestions: (query: string) => Promise<string[]>
  stapleNames: string[]
}

export function AddItemInput({ onAdd, getSuggestions, stapleNames }: Props) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(async () => {
      const historical = await getSuggestions(value)
      const stapleMatches = stapleNames
        .filter(n => n.toLowerCase().startsWith(value.toLowerCase()))
        .slice(0, 3)
      const combined = [...new Set([...stapleMatches, ...historical])].slice(0, 6)
      setSuggestions(combined)
      setShowDropdown(combined.length > 0)
    }, 200)
    return () => clearTimeout(timer)
  }, [value, getSuggestions, stapleNames])

  function handleAdd(name: string) {
    if (!name.trim()) return
    onAdd(name.trim())
    setValue('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd(value)
    if (e.key === 'Escape') setShowDropdown(false)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            setValue(e.target.value)
            if (e.target.value.trim()) setShowDropdown(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
          placeholder="Add item…"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          autoComplete="off"
        />
        <button
          onClick={() => handleAdd(value)}
          disabled={!value.trim()}
          className="px-5 py-3 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); handleAdd(s) }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
