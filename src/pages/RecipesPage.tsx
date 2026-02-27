import { Link } from 'react-router-dom'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipes/RecipeCard'

export function RecipesPage() {
  const { recipes, loading, error } = useRecipes()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Recipes</h1>
        <Link
          to="/recipes/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Recipe
        </Link>
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      )}

      {error && (
        <div className="text-center text-red-500 py-16 text-sm">{error}</div>
      )}

      {!loading && !error && recipes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-4">🍽</p>
          <p className="text-gray-500 text-sm mb-4">No recipes yet.</p>
          <Link
            to="/recipes/new"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Import your first recipe →
          </Link>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
