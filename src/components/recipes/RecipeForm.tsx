import { useEffect, useState } from 'react'

export interface RecipeFormData {
  title: string
  description: string
  servings: string
  prep_time_minutes: string
  cook_time_minutes: string
  image_url: string
  source_url: string
  tags: string        // comma-separated for easy editing
  is_shared: boolean
  ingredients: string[]
  steps: string[]
}

export const EMPTY_FORM: RecipeFormData = {
  title: '',
  description: '',
  servings: '',
  prep_time_minutes: '',
  cook_time_minutes: '',
  image_url: '',
  source_url: '',
  tags: '',
  is_shared: true,
  ingredients: [''],
  steps: [''],
}

interface Props {
  initialData?: RecipeFormData
  onSave: (data: RecipeFormData) => Promise<void>
  onCancel?: () => void
  saving: boolean
}

export function RecipeForm({ initialData, onSave, onCancel, saving }: Props) {
  const [form, setForm] = useState<RecipeFormData>(initialData ?? EMPTY_FORM)

  useEffect(() => {
    if (initialData) setForm(initialData)
  }, [initialData])

  const set = <K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  function updateIngredient(i: number, value: string) {
    const next = [...form.ingredients]
    next[i] = value
    set('ingredients', next)
  }

  function removeIngredient(i: number) {
    set('ingredients', form.ingredients.filter((_, idx) => idx !== i))
  }

  function updateStep(i: number, value: string) {
    const next = [...form.steps]
    next[i] = value
    set('steps', next)
  }

  function removeStep(i: number) {
    set('steps', form.steps.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image preview */}
      {form.image_url && (
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
          <img src={form.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Recipe name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="A short description of the recipe"
        />
      </div>

      {/* Servings + times */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
          <input
            type="number"
            min="1"
            value={form.servings}
            onChange={e => set('servings', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prep (min)</label>
          <input
            type="number"
            min="0"
            value={form.prep_time_minutes}
            onChange={e => set('prep_time_minutes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cook (min)</label>
          <input
            type="number"
            min="0"
            value={form.cook_time_minutes}
            onChange={e => set('cook_time_minutes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <input
          type="text"
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Italian, Pasta, Quick (comma-separated)"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
        <input
          type="url"
          value={form.image_url}
          onChange={e => set('image_url', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      {/* Source URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
        <input
          type="url"
          value={form.source_url}
          onChange={e => set('source_url', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      {/* Shared toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={form.is_shared}
            onChange={e => set('is_shared', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
        </div>
        <span className="text-sm text-gray-700">Share with the other user</span>
      </label>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
        <div className="space-y-2">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={ing}
                onChange={e => updateIngredient(i, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2 cups all-purpose flour"
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={form.ingredients.length === 1}
                className="px-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set('ingredients', [...form.ingredients, ''])}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add ingredient
        </button>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
        <div className="space-y-3">
          {form.steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-2.5 text-sm font-medium text-gray-400 w-5 shrink-0 text-right">
                {i + 1}.
              </span>
              <textarea
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe this step…"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                disabled={form.steps.length === 1}
                className="mt-2 px-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set('steps', [...form.steps, ''])}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add step
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !form.title.trim()}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save Recipe'}
        </button>
      </div>
    </form>
  )
}
