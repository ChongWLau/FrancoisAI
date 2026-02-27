import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { RecipesNewPage } from '@/pages/RecipesNewPage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { MealPlannerPage } from '@/pages/MealPlannerPage'
import { ShoppingListPage } from '@/pages/ShoppingListPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ChatPage } from '@/pages/ChatPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/recipes" replace />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/new" element={<RecipesNewPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/planner" element={<MealPlannerPage />} />
              <Route path="/shopping" element={<ShoppingListPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
