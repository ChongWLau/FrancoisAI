import { Link } from 'react-router-dom'
import type { RecipeListItem } from '@/hooks/useRecipes'

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
  const collections = recipe.recipe_collections ?? []

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {recipe.image_url ? (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-4xl">
          🍽
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 leading-snug">{recipe.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {totalTime > 0 && <span>{formatTime(totalTime)}</span>}
          {recipe.servings && <span>{recipe.servings} servings</span>}
          {!recipe.is_shared && (
            <span className="text-amber-600 font-medium">Private</span>
          )}
        </div>
        {(collections.length > 0 || recipe.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {collections.map(rc => (
              <span
                key={rc.collection_id}
                className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded-full text-xs font-medium"
              >
                {rc.collections.name}
              </span>
            ))}
            {recipe.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
