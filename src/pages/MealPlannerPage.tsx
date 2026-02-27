import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { addDays, formatWeekRange, getWeekStart, toISODate } from '@/lib/dates'
import { useMealEntries, type MealEntryWithRecipe } from '@/hooks/useMealEntries'
import { WeekGrid } from '@/components/meal-planner/WeekGrid'
import { WeekList } from '@/components/meal-planner/WeekList'
import { MealEntrySheet, type SelectedSlot } from '@/components/meal-planner/MealEntrySheet'
import type { MealType } from '@/types/supabase'

function getThisWeekStart() {
  return getWeekStart(new Date())
}

export function MealPlannerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState<Date>(getThisWeekStart)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)

  const { entryMap, loading, saveEntry, deleteEntry } = useMealEntries(weekStart)

  const weekDays = useMemo<Date[]>(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const thisWeekStr = toISODate(getThisWeekStart())
  const isCurrentWeek = toISODate(weekStart) === thisWeekStr

  function goToPrevWeek() {
    setWeekStart(prev => addDays(prev, -7))
  }

  function goToNextWeek() {
    setWeekStart(prev => addDays(prev, 7))
  }

  function goToToday() {
    setWeekStart(getThisWeekStart())
  }

  function handleSlotClick(date: string, mealType: MealType, entry?: MealEntryWithRecipe) {
    setSelectedSlot({ date, mealType, existingEntry: entry })
  }

  async function handleSave(recipeId: string | null, customText: string | null) {
    if (!selectedSlot || !user) return
    await saveEntry(
      selectedSlot.date,
      selectedSlot.mealType,
      { recipe_id: recipeId, custom_meal_text: customText },
      user.id,
      selectedSlot.existingEntry?.id,
    )
    setSelectedSlot(null)
  }

  async function handleDelete() {
    if (!selectedSlot?.existingEntry) return
    await deleteEntry(selectedSlot.existingEntry.id)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Week navigation header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
          aria-label="Previous week"
        >
          ←
        </button>

        <div className="flex-1 text-center">
          <p className="text-base font-semibold text-gray-900">{formatWeekRange(weekStart)}</p>
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
          aria-label="Next week"
        >
          →
        </button>

        {!isCurrentWeek && (
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop grid */}
          <div className="hidden md:block">
            <WeekGrid
              weekDays={weekDays}
              entryMap={entryMap}
              onSlotClick={handleSlotClick}
              onViewRecipe={id => navigate(`/recipes/${id}`)}
            />
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            <WeekList
              weekDays={weekDays}
              entryMap={entryMap}
              onSlotClick={handleSlotClick}
              onViewRecipe={id => navigate(`/recipes/${id}`)}
            />
          </div>
        </>
      )}

      {/* Slide-up entry sheet */}
      <MealEntrySheet
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
