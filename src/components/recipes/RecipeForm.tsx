import { useEffect, useRef, useState } from 'react'

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
  const [imageError, setImageError] = useState(false)
  const [editingImage, setEditingImage] = useState(!initialData?.image_url)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setForm(initialData)
      setImageError(false)
      setEditingImage(!initialData.image_url)
    }
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
      {/* Image */}
      <div>
        {form.image_url && !editingImage ? (
          <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden group">
            {imageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18" />
                </svg>
                <span className="text-sm">Image failed to load</span>
              </div>
            ) : (
              <img
                src={form.image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => { setEditingImage(true); setTimeout(() => imageInputRef.current?.focus(), 50) }}
                className="px-3 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Change image
              </button>
              <button
                type="button"
                onClick={() => { set('image_url', ''); setImageError(false) }}
                className="px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            {imageError && form.image_url && (
              <p className="text-xs text-red-500 mb-1">The current image URL didn't load — paste a new one below.</p>
            )}
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                type="url"
                value={form.image_url}
                onChange={e => { set('image_url', e.target.value); setImageError(false) }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Image URL (https://…)"
              />
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setEditingImage(false)}
                  className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Italian, Pasta, Quick (comma-separated)"
        />
      </div>

      {/* Source URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
        <input
          type="url"
          value={form.source_url}
          onChange={e => set('source_url', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-amber-600 peer-focus:ring-2 peer-focus:ring-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
          className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
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
          className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save Recipe'}
        </button>
      </div>
    </form>
  )
}
