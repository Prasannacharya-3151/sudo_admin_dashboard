import {
  LayoutDashboard,
  Building2,
  Monitor,
  Settings,
  LogOut,
  X,
  Loader2,
  CreditCard,
  ReceiptText,
  Cpu,
  BarChart3,
  History,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";
import { toast } from "sonner";

import { useSudoAuth } from "../context/SudoAuthContext";

import WhiteLogo from "../assets/logo-variation-white.png";

// ==========================================
// TYPES
// ==========================================

interface SudoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ==========================================
// MAIN NAVIGATION
// ==========================================

const mainNavigation = [
  {
    name: "Dashboard",
    path: "/sudo/dashboard",
    icon: LayoutDashboard,
  },
];

// ==========================================
// PLATFORM NAVIGATION
// ==========================================

const platformNavigation = [
  {
    name: "Institutions",
    path: "/sudo/institutions",
    icon: Building2,
  },
  {
    name: "Kiosks",
    path: "/sudo/kiosks",
    icon: Monitor,
  },
];

// ==========================================
// RFID MANAGEMENT NAVIGATION
// ==========================================

const rfidNavigation = [
  {
    name: "RFID Machines",
    path: "/sudo/machines",
    icon: Cpu,
  },
  {
    name: "RFID Cards",
    path: "/sudo/rfid-cards",
    icon: CreditCard,
  },
  {
    name: "Transactions",
    path: "/sudo/transactions",
    icon: ReceiptText,
  },
];

// ==========================================
// ANALYTICS NAVIGATION
// ==========================================

// ==========================================
// ANALYTICS NAVIGATION
// ==========================================

const analyticsNavigation = [
  {
    name: "Overview",
    path: "/sudo/analytics/sudo-analytics",
    icon: BarChart3,
  
  },
  {
    name: "Print History",
    path: "/sudo/analytics/print-history",
    icon: History,
  },
  {
    name: "Kiosk Analytics",
    path: "/sudo/analytics/kiosks",
    icon: ChartNoAxesCombined,
  },
];

// ==========================================
// SYSTEM NAVIGATION
// ==========================================

const systemNavigation = [
  {
    name: "Settings",
    path: "/sudo/settings",
    icon: Settings,
  },
];

// ==========================================
// COMPONENT
// ==========================================

export default function SudoSidebar({
  isOpen,
  onClose,
}: SudoSidebarProps) {
  const navigate = useNavigate();

  const { logout } = useSudoAuth();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      await logout();

      toast.success(
        "Logged out successfully",
      );

      navigate("/sudo/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error,
      );

      navigate("/sudo/login", {
        replace: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ==========================================
  // NAVIGATION ITEM COMPONENT
  // ==========================================

  const renderNavigation = (
    navigation: {
      name: string;
      path: string;
      icon: React.ElementType;
    }[],
  ) => {
    return navigation.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? "bg-white text-brand-purple shadow-lg"
                : "text-white/80 hover:bg-white/15 hover:text-white"
            }`
          }
        >
          <Icon className="h-5 w-5" />

          <span>
            {item.name}
          </span>
        </NavLink>
      );
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ======================================
          MOBILE OVERLAY
      ====================================== */}

      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-brand-purple transition-transform duration-300 lg:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* ======================================
            LOGO
        ====================================== */}

        <div className="flex h-[84px] items-center justify-between px-6">
          <img
            src={WhiteLogo}
            alt="PrintPoint"
            className="h-auto w-40 object-contain"
          />

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ======================================
            DIVIDER
        ====================================== */}

        <div className="mx-5 border-t border-white/20" />

        {/* ======================================
            SCROLLABLE NAVIGATION
        ====================================== */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          {/* ======================================
              MAIN NAVIGATION
          ====================================== */}

          <nav className="space-y-2">
            {renderNavigation(mainNavigation)}
          </nav>

          {/* ======================================
              PLATFORM
          ====================================== */}

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Platform
          </p>

          <nav className="space-y-2">
            {renderNavigation(platformNavigation)}
          </nav>

          {/* ======================================
              RFID MANAGEMENT
          ====================================== */}

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            RFID Management
          </p>

          <nav className="space-y-2">
            {renderNavigation(rfidNavigation)}
          </nav>

          {/* ======================================
              ANALYTICS
          ====================================== */}

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            Analytics
          </p>

          <nav className="space-y-2">
            {renderNavigation(
              analyticsNavigation,
            )}
          </nav>

          {/* ======================================
              SYSTEM
          ====================================== */}

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-white/60">
            System
          </p>

          <nav className="space-y-2">
            {renderNavigation(systemNavigation)}
          </nav>
        </div>

        {/* ======================================
            LOGOUT
        ====================================== */}

        <div className="border-t border-white/20 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}

            {isLoggingOut
              ? "Logging out..."
              : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}