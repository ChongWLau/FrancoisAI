import { formatDayShort, isToday, toISODate } from '@/lib/dates'
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

export function WeekGrid({ weekDays, entryMap, onSlotClick, onViewRecipe }: Props) {
  return (
    /* Horizontally scrollable so it works on smaller desktop windows too */
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Day header row */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 mb-1.5">
          <div /> {/* empty corner */}
          {weekDays.map(day => {
            const today = isToday(day)
            return (
              <div
                key={toISODate(day)}
                className={`text-center py-1 rounded-lg text-xs font-semibold ${
                  today ? 'bg-navy-800 text-white' : 'text-gray-500'
                }`}
              >
                {formatDayShort(day)}
              </div>
            )
          })}
        </div>

        {/* Meal rows */}
        {MEAL_TYPES.map(mealType => (
          <div key={mealType} className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 mb-1.5">
            {/* Meal label */}
            <div className="flex items-center justify-end pr-2">
              <span className="text-xs font-medium text-gray-400">{MEAL_LABELS[mealType]}</span>
            </div>

            {/* Slot for each day */}
            {weekDays.map(day => {
              const dateStr = toISODate(day)
              const entry = entryMap.get(`${dateStr}_${mealType}`)
              const label = entry?.recipes?.title ?? entry?.custom_meal_text
              const today = isToday(day)

              return (
                <div
                  key={dateStr}
                  onClick={() => onSlotClick(dateStr, mealType, entry)}
                  className={`rounded-lg border px-2 py-2 min-h-[52px] flex flex-col justify-between text-left transition-all cursor-pointer ${
                    label
                      ? today
                        ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                        : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      : today
                        ? 'border-amber-200 border-dashed hover:bg-amber-50'
                        : 'border-gray-200 border-dashed hover:bg-gray-50'
                  }`}
                >
                  {label ? (
                    <>
                      <span className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug">
                        {label}
                      </span>
                      {entry?.recipe_id && (
                        <button
                          onClick={e => { e.stopPropagation(); onViewRecipe(entry.recipe_id!) }}
                          className="mt-1 self-end text-[10px] text-amber-600 hover:text-amber-800 font-medium"
                          aria-label={`View recipe ${label}`}
                        >
                          View →
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">+ Add</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
