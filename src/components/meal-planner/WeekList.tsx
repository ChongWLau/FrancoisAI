import { formatDayLong, isToday, toISODate } from '@/lib/dates'
import type { MealType } from '@/types/supabase'
import type { EntryMap, MealEntryWithRecipe } from '@/hooks/useMealEntries'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

interface Props {
  weekDays: Date[]
  entryMap: EntryMap
  onSlotClick: (date: string, mealType: MealType, entry?: MealEntryWithRecipe) => void
  onViewRecipe: (recipeId: string) => void
}

export function WeekList({ weekDays, entryMap, onSlotClick, onViewRecipe }: Props) {
  return (
    <div className="space-y-3">
      {weekDays.map(day => {
        const dateStr = toISODate(day)
        const today = isToday(day)

        return (
          <div
            key={dateStr}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {/* Day header */}
            <div
              className={`px-4 py-2.5 border-b ${
                today ? 'bg-blue-600 border-blue-600' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <span className={`text-sm font-semibold ${today ? 'text-white' : 'text-gray-700'}`}>
                {formatDayLong(day)}
                {today && ' · Today'}
              </span>
            </div>

            {/* Meal slots */}
            <div className="divide-y divide-gray-100">
              {MEAL_TYPES.map(mealType => {
                const entry = entryMap.get(`${dateStr}_${mealType}`)
                const label = entry?.recipes?.title ?? entry?.custom_meal_text

                return (
                  <div
                    key={mealType}
                    onClick={() => onSlotClick(dateStr, mealType, entry)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-gray-400 w-20 shrink-0 uppercase tracking-wide">
                      {MEAL_LABELS[mealType]}
                    </span>
                    {label ? (
                      <span className="text-sm text-gray-800 truncate flex-1">{label}</span>
                    ) : (
                      <span className="text-sm text-gray-400 flex-1">+ Add</span>
                    )}
                    {entry?.recipe_id && (
                      <button
                        onClick={e => { e.stopPropagation(); onViewRecipe(entry.recipe_id!) }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium shrink-0"
                        aria-label={`View recipe ${label}`}
                      >
                        View →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
