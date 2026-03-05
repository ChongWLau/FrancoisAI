import { formatDayLong, isToday, toISODate } from '@/lib/dates'
import type { DayMealsMap } from '@/hooks/useMealEntries'

interface Props {
  weekDays: Date[]
  dayMealsMap: DayMealsMap
  onDayClick: (date: string) => void
  onViewRecipe: (recipeId: string) => void
}

export function WeekList({ weekDays, dayMealsMap, onDayClick, onViewRecipe }: Props) {
  return (
    <div className="space-y-3">
      {weekDays.map(day => {
        const dateStr = toISODate(day)
        const today = isToday(day)
        const meals = dayMealsMap.get(dateStr) ?? []

        return (
          <div key={dateStr} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Day header — tap to open sheet */}
            <button
              onClick={() => onDayClick(dateStr)}
              className={`w-full flex items-center justify-between px-4 py-2.5 border-b text-left ${
                today ? 'bg-navy-800 border-navy-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              } transition-colors`}
            >
              <span className={`text-sm font-semibold ${today ? 'text-white' : 'text-gray-700'}`}>
                {formatDayLong(day)}{today && ' · Today'}
              </span>
              <span className={`text-xs font-medium ${today ? 'text-navy-200' : 'text-gray-400'}`}>
                + Add
              </span>
            </button>

            {/* Meals */}
            {meals.length > 0 && (
              <div className="divide-y divide-gray-100">
                {meals.map(meal => (
                  <div
                    key={meal.id}
                    onClick={() => onDayClick(dateStr)}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {meal.name}
                    </p>
                    {meal.recipes.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No recipes yet</p>
                    ) : (
                      <div className="space-y-1">
                        {meal.recipes.map(r => (
                          <div key={r.id} className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 flex-1 truncate">{r.title}</span>
                            <button
                              onClick={e => { e.stopPropagation(); onViewRecipe(r.recipe_id) }}
                              className="text-xs text-amber-600 hover:text-amber-800 font-medium shrink-0"
                            >
                              View →
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
