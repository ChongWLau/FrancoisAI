import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RecipeFormData } from './RecipeForm'

interface Props {
  onImported: (data: RecipeFormData) => void
}

export function UrlImportBar({ onImported }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.functions.invoke('scrape-recipe', {
      body: { url: url.trim() },
    })

    if (error || data?.error) {
      setError(data?.error ?? error?.message ?? 'Failed to import recipe')
    } else {
      onImported(normalizeToFormData(data))
      setUrl('')
    }

    setLoading(false)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-sm font-medium text-blue-900 mb-3">Import from a website</p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleImport()}
          placeholder="https://www.allrecipes.com/recipe/..."
          className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
          disabled={loading}
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}

function normalizeToFormData(raw: any): RecipeFormData {
  return {
    title: raw.title ?? '',
    description: raw.description ?? '',
    servings: raw.servings?.toString() ?? '',
    prep_time_minutes: raw.prep_time_minutes?.toString() ?? '',
    cook_time_minutes: raw.cook_time_minutes?.toString() ?? '',
    image_url: raw.image_url ?? '',
    source_url: raw.source_url ?? '',
    tags: (raw.tags ?? []).join(', '),
    is_shared: true,
    ingredients: (raw.ingredients ?? []).map((i: any) => i.name ?? ''),
    steps: (raw.steps ?? []).map((s: any) => s.instruction ?? ''),
  }
}
