import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { saveRecipe } from '@/hooks/useRecipes'
import { UrlImportBar } from '@/components/recipes/UrlImportBar'
import { RecipeForm, EMPTY_FORM, type RecipeFormData } from '@/components/recipes/RecipeForm'

export function RecipesNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState<RecipeFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(data: RecipeFormData) {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      const id = await saveRecipe(data, user.id)
      navigate(`/recipes/${id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save recipe')
      setSaving(false)
    }
  }

  function handleImported(data: RecipeFormData) {
    setFormData(data)
    // Scroll to form so user can review the pre-filled fields
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/recipes')}
          className="text-gray-400 hover:text-gray-900 transition-colors text-lg"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">New Recipe</h1>
      </div>

      <div className="space-y-6">
        <UrlImportBar onImported={handleImported} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-3 text-xs text-gray-400">or fill in manually</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <RecipeForm
          key={JSON.stringify(formData)}
          initialData={formData}
          onSave={handleSave}
          onCancel={() => navigate('/recipes')}
          saving={saving}
        />
      </div>
    </div>
  )
}
