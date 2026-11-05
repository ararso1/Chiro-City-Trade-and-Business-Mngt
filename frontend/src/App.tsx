import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
  const { isAuthenticated, isLoading, hasPermission, homePath, user, logout, refreshProfile } = useAuth();
  const location = useLocation();

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

  const permissions: Record<string, string[]> = {
    "/dashboard": ["dashboard.view"],
    "/traders": ["traders.read"],
    "/traders/register": ["traders.create"],
    "/finance": ["payments.read", "finance.read"],
    "/inspections": ["inspections.read"],
    "/complaints": ["complaints.read"],
    "/archive": ["documents.read"],
    "/reports": ["reports.read"],
    "/admin/users": ["users.read", "roles.read"],
    "/admin/settings": ["settings.read"],
  };
  if (isAuthenticated && location.pathname === "/no-access") {
    if (homePath !== "/no-access") return <Navigate to={homePath} replace />;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg space-y-4 rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Access has not been granted</h1>
          <p>Signed in as <strong>{user?.email}</strong> (role: {user?.role}).</p>
          <p className="text-muted-foreground">Your account has no page permissions. Ask a CCTBM administrator to grant permissions to your role in User Management.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void refreshProfile()}>Check access again</Button>
            <Button variant="outline" onClick={logout}>Sign out / switch account</Button>
          </div>
        </div>
      </div>
    );
  }
  if (
    isAuthenticated &&
    location.pathname === "/dashboard" &&
    !hasPermission("dashboard.view") &&
    homePath !== "/dashboard"
  )
    return <Navigate to={homePath} replace />;
  const needed =
    permissions[location.pathname] ??
    (location.pathname.startsWith("/traders/")
      ? [
          location.pathname.endsWith("/edit")
            ? "traders.update"
            : "traders.read",
        ]
      : undefined);
  if (isAuthenticated && needed && !needed.some(hasPermission))
    return (
      <div className="p-8">You do not have permission to open this page.</div>
    );
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace data-id="ei2k2ox77" data-path="src/App.tsx" />
  );
}

// Public Route Component (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, homePath } = useAuth();

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
      to={homePath}
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
