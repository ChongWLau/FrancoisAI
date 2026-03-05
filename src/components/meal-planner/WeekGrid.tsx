import { formatDayShort, isToday, toISODate } from '@/lib/dates'
import type { DayMealsMap } from '@/hooks/useMealEntries'

interface Props {
  weekDays: Date[]
  dayMealsMap: DayMealsMap
  onDayClick: (date: string) => void
  onViewRecipe: (recipeId: string) => void
}

export function WeekGrid({ weekDays, dayMealsMap, onDayClick, onViewRecipe }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dateStr = toISODate(day)
          const today = isToday(day)
          const meals = dayMealsMap.get(dateStr) ?? []

          return (
            <div key={dateStr} className="flex flex-col gap-1.5 min-h-[120px]">
              {/* Day header */}
              <div
                className={`text-center py-1 rounded-lg text-xs font-semibold ${
                  today ? 'bg-navy-800 text-white' : 'text-gray-500'
                }`}
              >
                {formatDayShort(day)}
              </div>

              {/* Meal cards */}
              {meals.map(meal => (
                <div
                  key={meal.id}
                  onClick={() => onDayClick(dateStr)}
                  className={`rounded-lg border px-2 py-1.5 text-left cursor-pointer transition-all hover:shadow-sm ${
                    today ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-[11px] font-semibold text-gray-500 truncate">{meal.name}</p>
                  {meal.recipes.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {meal.recipes.slice(0, 2).map(r => (
                        <div key={r.id} className="flex items-center gap-1">
                          <p className="text-[11px] text-gray-700 truncate flex-1">{r.title}</p>
                          <button
                            onClick={e => { e.stopPropagation(); onViewRecipe(r.recipe_id) }}
                            className="text-[10px] text-amber-600 hover:text-amber-800 font-medium shrink-0"
                          >
                            →
                          </button>
                        </div>
                      ))}
                      {meal.recipes.length > 2 && (
                        <p className="text-[10px] text-gray-400">+{meal.recipes.length - 2} more</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add button */}
              <button
                onClick={() => onDayClick(dateStr)}
                className={`rounded-lg border border-dashed px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors text-left ${
                  today ? 'border-amber-200 hover:bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                + Add
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
