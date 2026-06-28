import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";

import {
  LoginPage,
  Dashboard,
  TradersPage,
  TraderDetailPage,
  TraderEditPage,
  TraderRegistrationPage,
  FinancePage,
  InspectionsPage,
  ComplaintsPage,
  ArchivePage,
  ReportsPage,
  NotificationsPage,
  UsersPage,
  SettingsPage,
  NotFound,
} from "./pages";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-id="0rn4wtog7"
        data-path="src/App.tsx"
      >
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
          data-id="uy1pv2s5w"
          data-path="src/App.tsx"
        ></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace data-id="ei2k2ox77" data-path="src/App.tsx" />
  );
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-id="mq2yu2ezr"
        data-path="src/App.tsx"
      >
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
          data-id="4bdea3p0u"
          data-path="src/App.tsx"
        ></div>
      </div>
    );
  }

  return !isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate
      to="/dashboard"
      replace
      data-id="k95po2qvw"
      data-path="src/App.tsx"
    />
  );
}

function AppRoutes() {
  return (
    <Routes data-id="i983waa44" data-path="src/App.tsx">
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute data-id="yc840oype" data-path="src/App.tsx">
            <LoginPage data-id="9odqvnmuu" data-path="src/App.tsx" />
          </PublicRoute>
        }
        data-id="ib57t12xi"
        data-path="src/App.tsx"
      />

      <Route
        path="/"
        element={
          <PublicRoute data-id="84ngdx3xx" data-path="src/App.tsx">
            <LoginPage data-id="gutnnsp9c" data-path="src/App.tsx" />
          </PublicRoute>
        }
        data-id="fxqgzvjvo"
        data-path="src/App.tsx"
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute data-id="qs8378pjz" data-path="src/App.tsx">
            <Layout data-id="u98l29eoe" data-path="src/App.tsx" />
          </ProtectedRoute>
        }
        data-id="40tdjnt43"
        data-path="src/App.tsx"
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="traders/register" element={<TraderRegistrationPage />} />
        <Route path="traders/:id/edit" element={<TraderEditPage />} />
        <Route path="traders/:id" element={<TraderDetailPage />} />
        <Route path="traders" element={<TradersPage />} />
        <Route path="businesses" element={<Navigate to="/traders" replace />} />
        <Route path="licenses" element={<Navigate to="/traders" replace />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all route */}
      <Route
        path="*"
        element={<NotFound data-id="6u5dynb9d" data-path="src/App.tsx" />}
        data-id="5rf2xij96"
        data-path="src/App.tsx"
      />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider
    client={queryClient}
    data-id="t05dmonz4"
    data-path="src/App.tsx"
  >
    <TooltipProvider data-id="mobcb0b0n" data-path="src/App.tsx">
      <AuthProvider data-id="l2tksbrmp" data-path="src/App.tsx">
        <BrowserRouter data-id="lopawu7zf" data-path="src/App.tsx">
          <AppRoutes data-id="uqfa9bkfo" data-path="src/App.tsx" />
        </BrowserRouter>
      </AuthProvider>
      <Toaster data-id="u7pxvax50" data-path="src/App.tsx" />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
