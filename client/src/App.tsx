import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Apply from "./pages/Apply";
import Dashboard from "./pages/Dashboard";
import BizPilot from "./pages/BizPilot";
import FounderPilot from "./pages/FounderPilot";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import AdminUsers from "./pages/AdminUsers";
import AdminModels from "./pages/AdminModels";
import AdminAPIKeys from "./pages/AdminAPIKeys";
import AdminPrompts from "./pages/AdminPrompts";
import AdminLogin from "./pages/AdminLogin";
import AdminPayments from "./pages/AdminPayments";
import AdminApplications from "./pages/AdminApplications";
import AdminExternalAPI from "./pages/AdminExternalAPI";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminTelegramBots from "./pages/AdminTelegramBots";
import LoginRequired from "./pages/LoginRequired";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

function isPublicMarketingPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/admin/login") return true;
  return /^\/(pricing|apply|login-required|404)(\/|$)/.test(pathname);
}

function Router() {
  const [location] = useLocation();
  const { loading } = useAuth();

  // Never block the marketing shell on session bootstrap — avoids infinite spinner if /api/trpc hangs.
  const blockRouterOnSession = loading && !isPublicMarketingPath(location);

  if (blockRouterOnSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(12% 0.03 220)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(72% 0.18 162)" }} />
      </div>
    );
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/apply"} component={Apply} />
      <Route path={"/app"} component={Dashboard} />
      <Route path={"/app/bizpilot"} component={BizPilot} />
      <Route path={"/app/founderpilot"} component={FounderPilot} />
      <Route path={"/app/profile"} component={Profile} />
      <Route path={"/app/billing"} component={Billing} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/admin/models"} component={AdminModels} />
      <Route path={"/admin/keys"} component={AdminAPIKeys} />
      <Route path={"/admin/prompts"} component={AdminPrompts} />
      <Route path={"/admin/payments"} component={AdminPayments} />
      <Route path={"/admin/applications"} component={AdminApplications} />
      <Route path={"/admin/external-api"} component={AdminExternalAPI} />
      <Route path={"/admin/announcements"} component={AdminAnnouncements} />
      <Route path={"/admin/telegram-bots"} component={AdminTelegramBots} />
      <Route path={"/login-required"} component={LoginRequired} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
