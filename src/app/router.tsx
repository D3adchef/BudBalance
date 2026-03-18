import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import LoginPage from "../pages/LoginPage"
import SignupPage from "../pages/SignupPage"
import DashboardPage from "../pages/DashboardPage"
import TimelinePage from "../pages/TimelinePage"
import AddPurchasePage from "../pages/AddPurchasePage"
import PurchaseHistoryPage from "../pages/PurchaseHistoryPage"
import ToolsPage from "../pages/ToolsPage"
import FirstTimeAllotmentSetupPage from "../pages/FirstTimeAllotmentSetupPage"

import AppShell from "../components/AppShell"
import ProtectedRoute from "../components/ProtectedRoute"

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/first-time-allotment-setup"
          element={
            <ProtectedRoute>
              <FirstTimeAllotmentSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/timeline"
          element={
            <ProtectedRoute>
              <AppShell>
                <TimelinePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-purchase"
          element={
            <ProtectedRoute>
              <AppShell>
                <AddPurchasePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-history"
          element={
            <ProtectedRoute>
              <AppShell>
                <PurchaseHistoryPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <AppShell>
                <ToolsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}