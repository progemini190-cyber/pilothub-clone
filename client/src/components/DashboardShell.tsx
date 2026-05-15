import { ReactNode, useLayoutEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, MessageSquare, Settings, Users, Key, FileText,
  LogOut, CreditCard, Zap, Lightbulb, DollarSign, Menu, X, ChevronRight, Globe, Megaphone, Bot
} from "lucide-react";

import { PILOTHUB_LOGO_URL as LOGO_URL } from "@/lib/siteAssets";

interface DashboardShellProps {
  children: ReactNode;
  title?: string;
  activeTab?: string;
  isAdminShell?: boolean;
}

export function DashboardShell({ children, title, activeTab, isAdminShell }: DashboardShellProps) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();
  const adminLogout = trpc.admin.logout.useMutation();

  const isAdmin = isAdminShell || user?.role === "admin";

  const userStatus = (user as { status?: string | null } | null)?.status ?? "";
  const statusLower = userStatus.toLowerCase();
  const isApprovedUser =
    isAdmin ||
    statusLower === "active" ||
    statusLower === "approved" ||
    userStatus === "APPROVED";
  const isPendingUser = statusLower === "pending";

  // Approval gate: send unapproved users to login-required as early as possible (before paint when cached).
  useLayoutEffect(() => {
    if (isAdminShell) return;
    if (user && isPendingUser && !isApprovedUser) {
      window.location.replace(
        `/login-required?reason=pending&email=${encodeURIComponent(String((user as { email?: string | null }).email ?? ""))}`,
      );
    }
  }, [user, isAdminShell, isPendingUser, isApprovedUser]);

  // Render-time guard: show nothing while checking or if pending
  if (!isAdminShell && (loading || (user && isPendingUser && !isApprovedUser))) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(12% 0.03 220)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(72% 0.18 162 / 0.4)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const handleLogout = async () => {
    if (isAdminShell) {
      await adminLogout.mutateAsync();
      setLocation("/admin/login");
    } else {
      await logoutMutation.mutateAsync();
      setLocation("/");
    }
  };

  const userNavItems = [
    { label: "Dashboard", href: "/app", icon: LayoutDashboard, tab: "dashboard" },
    { label: "BizPilot", href: "/app/bizpilot", icon: Zap, tab: "bizpilot", glow: "blue" },
    { label: "FounderPilot", href: "/app/founderpilot", icon: Lightbulb, tab: "founderpilot", glow: "gold" },
    { label: "Profile", href: "/app/profile", icon: Settings, tab: "profile" },
    { label: "Billing", href: "/app/billing", icon: CreditCard, tab: "billing" },
  ];

  const adminNavItems = [
    { label: "Users", href: "/admin/users", icon: Users, tab: "users" },
    { label: "Applications", href: "/admin/applications", icon: FileText, tab: "applications" },
    { label: "Payments", href: "/admin/payments", icon: DollarSign, tab: "payments" },
    { label: "AI Models", href: "/admin/models", icon: Zap, tab: "models" },
    { label: "Prompts", href: "/admin/prompts", icon: FileText, tab: "prompts" },
    { label: "API Keys", href: "/admin/keys", icon: Key, tab: "keys" },
    { label: "External API", href: "/admin/external-api", icon: Globe, tab: "external-api" },
    { label: "Announcements", href: "/admin/announcements", icon: Megaphone, tab: "announcements" },
    { label: "Telegram Bots", href: "/admin/telegram-bots", icon: Bot, tab: "telegram-bots" },
  ];

  const navItems = isAdminShell ? adminNavItems : userNavItems;
  const currentTab = activeTab || location.split("/").pop() || "dashboard";

  const getGlowColor = (glow?: string) =>
    glow === "blue" ? "oklch(65% 0.22 250)" :
    glow === "gold" ? "oklch(78% 0.12 75)" :
    "oklch(72% 0.18 162)";

  const NavItem = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.tab || location === item.href;
    const glowColor = getGlowColor((item as any).glow);

    return (
      <button
        key={item.href}
        onClick={() => { setLocation(item.href); onClick?.(); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
        style={isActive ? {
          background: "oklch(72% 0.18 162 / 0.12)",
          border: "1px solid oklch(72% 0.18 162 / 0.25)",
          color: "white",
        } : {
          background: "transparent",
          border: "1px solid transparent",
          color: "oklch(60% 0.03 220)",
        }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={isActive ? {
            background: (item as any).glow === "blue"
              ? "oklch(65% 0.22 250 / 0.2)"
              : (item as any).glow === "gold"
              ? "oklch(78% 0.12 75 / 0.2)"
              : "oklch(72% 0.18 162 / 0.2)",
          } : { background: "oklch(20% 0.04 220)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: isActive ? glowColor : "oklch(55% 0.03 220)" }} />
        </div>
        <span className="font-medium text-sm">{item.label}</span>
        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "oklch(72% 0.18 162)" }} />}
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(12% 0.03 220)" }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-56 flex-col flex-shrink-0"
        style={{ background: "oklch(15% 0.04 220)", borderRight: "1px solid oklch(22% 0.04 220)" }}>

        {/* Logo */}
        <div className="p-4 flex items-center gap-2.5 min-w-0"
          style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}>
          <div className="relative cursor-pointer flex-shrink-0" onClick={() => setLocation(isAdminShell ? "/admin/users" : "/")}>
            <div
              className="ph-logo-frame ph-logo-frame--nav w-9 h-9 rounded-xl"
              style={{ border: "1px solid oklch(72% 0.18 162 / 0.2)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 12px oklch(72% 0.18 162 / 0.2)" }}
            >
              <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.6))" }} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-sm leading-none truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
          </div>
          {isAdminShell && (
            <span className="ml-auto px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: "oklch(60% 0.22 25 / 0.2)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(60% 0.22 25 / 0.3)" }}>
              ADMIN
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => <NavItem key={item.href} item={item} />)}
        </nav>

        {/* User info + logout */}
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid oklch(22% 0.04 220)" }}>
          {!isAdminShell && user && (
            <div className="px-3 py-2 rounded-xl"
              style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
              <p className="text-xs mb-0.5" style={{ color: "oklch(50% 0.03 220)" }}>Logged in as</p>
              <p className="text-xs font-semibold text-white truncate">{user.name || user.email}</p>
            </div>
          )}
          {isAdminShell && (
            <div className="px-3 py-2 rounded-xl"
              style={{ background: "oklch(60% 0.22 25 / 0.08)", border: "1px solid oklch(60% 0.22 25 / 0.2)" }}>
              <p className="text-xs font-semibold" style={{ color: "oklch(75% 0.18 25)" }}>Admin Control Center</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition"
            style={{ background: "oklch(22% 0.05 220)", color: "oklch(60% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
            <LogOut className="w-3.5 h-3.5" />
            {isAdminShell ? "Admin Logout" : "Logout"}
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay Menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "oklch(5% 0.02 220 / 0.8)" }} />
          <div className="absolute left-0 top-0 bottom-0 w-56 sm:w-64 flex flex-col"
            style={{ background: "oklch(15% 0.04 220)", borderRight: "1px solid oklch(22% 0.04 220)" }}
            onClick={e => e.stopPropagation()}>
            {/* Logo */}
            <div className="p-4 flex items-center gap-2.5 min-w-0"
              style={{ borderBottom: "1px solid oklch(22% 0.04 220)" }}>
              <div
                className="ph-logo-frame ph-logo-frame--nav w-9 h-9 rounded-xl flex-shrink-0 cursor-pointer"
                style={{ border: "1px solid oklch(72% 0.18 162 / 0.2)", background: "oklch(18% 0.05 220)", boxShadow: "0 0 12px oklch(72% 0.18 162 / 0.2)" }}
                onClick={() => setLocation(isAdminShell ? "/admin/users" : "/")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLocation(isAdminShell ? "/admin/users" : "/"); } }}
              >
                <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-lg" style={{ filter: "drop-shadow(0 0 8px oklch(72% 0.18 162 / 0.6))" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-sm leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(72% 0.18 162)" }}>by ChatPilot</p>
              </div>
              <button className="ml-auto" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" style={{ color: "oklch(55% 0.03 220)" }} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => <NavItem key={item.href} item={item} onClick={() => setMobileMenuOpen(false)} />)}
            </nav>
            <div className="p-3 space-y-2" style={{ borderTop: "1px solid oklch(22% 0.04 220)" }}>
              {!isAdminShell && user && (
                <div className="px-3 py-2 rounded-xl"
                  style={{ background: "oklch(18% 0.05 220)", border: "1px solid oklch(25% 0.04 220)" }}>
                  <p className="text-xs font-semibold text-white truncate">{user.name || user.email}</p>
                </div>
              )}
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition"
                style={{ background: "oklch(22% 0.05 220)", color: "oklch(60% 0.03 220)", border: "1px solid oklch(28% 0.04 220)" }}>
                <LogOut className="w-3.5 h-3.5" />
                {isAdminShell ? "Admin Logout" : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile + Desktop Header */}
        <div className="flex items-center px-3 sm:px-4 py-3 flex-shrink-0 gap-2 w-full min-w-0"
          style={{ borderBottom: "1px solid oklch(22% 0.04 220)", background: "oklch(14% 0.04 220)" }}>
          {/* Mobile menu button */}
          <button type="button" className="md:hidden p-1.5 rounded-lg flex-shrink-0"
            style={{ background: "oklch(20% 0.04 220)", color: "oklch(65% 0.03 220)" }}
            onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          {/* Mobile: brand only when no page title (e.g. chat pilots) */}
          {!title && (
            <div className="flex items-center gap-2 md:hidden min-w-0 flex-1">
              <div
                className="ph-logo-frame ph-logo-frame--nav w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0"
                style={{ border: "1px solid oklch(72% 0.18 162 / 0.2)", background: "oklch(18% 0.05 220)" }}
              >
                <img src={LOGO_URL} alt="PilotHub" className="ph-logo-frame__img rounded-md" style={{ filter: "drop-shadow(0 0 6px oklch(72% 0.18 162 / 0.5))" }} />
              </div>
              <span className="font-bold text-white text-xs sm:text-sm truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PilotHub</span>
            </div>
          )}
          {title && (
            <h1 className="md:hidden flex-1 min-w-0 text-sm sm:text-base font-semibold text-white truncate pr-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h1>
          )}
          {title && (
            <h1 className="hidden md:block text-base font-bold text-white flex-1 min-w-0 ml-1 truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h1>
          )}
          {isAdminShell && (
            <span className="hidden md:inline-flex flex-shrink-0 ml-auto px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold"
              style={{ background: "oklch(60% 0.22 25 / 0.2)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(60% 0.22 25 / 0.3)" }}>
              ADMIN
            </span>
          )}
          {isAdminShell && (
            <span className="md:hidden flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "oklch(60% 0.22 25 / 0.2)", color: "oklch(75% 0.18 25)", border: "1px solid oklch(60% 0.22 25 / 0.3)" }}>
              Admin
            </span>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
