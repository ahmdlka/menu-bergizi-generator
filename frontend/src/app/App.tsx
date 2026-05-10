import { BrowserRouter, Route, Routes } from "react-router";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CompleteProfilePage } from "./pages/CompleteProfilePage";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { MealPlanProvider } from "./lib/mealPlanStore";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route
          element={
            <RequireAuth>
              <MealPlanProvider>
                <AppShell />
              </MealPlanProvider>
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
