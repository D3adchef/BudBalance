import { HashRouter, Routes, Route, Navigate } from "react-router-dom"

import SplashPage from "../pages/SplashPage"
import LoginPage from "../pages/LoginPage"
import SignupPage from "../pages/SignupPage"
import ForgotPasswordPage from "../pages/ForgotPasswordPage"
import ResetPasswordPage from "../pages/ResetPasswordPage"
import DashboardPage from "../pages/DashboardPage"
import SmartPlannerPage from "../pages/SmartPlannerPage"
import AddPurchasePage from "../pages/AddPurchasePage"
import PurchaseHistoryPage from "../pages/PurchaseHistoryPage"
import ToolsPage from "../pages/ToolsPage"
import FirstTimeAllotmentSetupPage from "../pages/FirstTimeAllotmentSetupPage"

import AppShell from "../components/AppShell"
import ProtectedRoute from "../components/ProtectedRoute"

import { useAuthStore } from "../features/auth/authStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

function SetupProtectedApp({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const hasCompletedInitialSetup = useAllotmentStore(
    (state) => state.allotment.hasCompletedInitialSetup
  )

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!hasCompletedInitialSetup) {
    return <Navigate to="/first-time-allotment-setup" replace />
  }

  return <>{children}</>
}

function SetupPageGuard() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const hasCompletedInitialSetup = useAllotmentStore(
    (state) => state.allotment.hasCompletedInitialSetup
  )

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (hasCompletedInitialSetup) {
    return <Navigate to="/dashboard" replace />
  }

  return <FirstTimeAllotmentSetupPage />
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/first-time-allotment-setup"
          element={
            <ProtectedRoute>
              <SetupPageGuard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SetupProtectedApp>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </SetupProtectedApp>
            </ProtectedRoute>
          }
        />

        <Route
          path="/smart-planner"
          element={
            <ProtectedRoute>
              <SetupProtectedApp>
                <AppShell>
                  <SmartPlannerPage />
                </AppShell>
              </SetupProtectedApp>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-purchase"
          element={
            <ProtectedRoute>
              <SetupProtectedApp>
                <AppShell>
                  <AddPurchasePage />
                </AppShell>
              </SetupProtectedApp>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-history"
          element={
            <ProtectedRoute>
              <SetupProtectedApp>
                <AppShell>
                  <PurchaseHistoryPage />
                </AppShell>
              </SetupProtectedApp>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <SetupProtectedApp>
                <AppShell>
                  <ToolsPage />
                </AppShell>
              </SetupProtectedApp>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </HashRouter>
  )
}