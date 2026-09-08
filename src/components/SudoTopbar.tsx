import {
  Bell,
  Menu,
  ShieldCheck,
} from "lucide-react";

import { useSudoAuth } from "../context/SudoAuthContext";

interface SudoTopbarProps {
  onMenuClick: () => void;
}

export default function SudoTopbar({
  onMenuClick,
}: SudoTopbarProps) {
  const { admin } = useSudoAuth();

  const displayName =
    admin?.name ||
    admin?.email?.split("@")[0] ||
    "Sudo Admin";

  const initials = displayName
    .split(" ")
    .filter((word: string) => word.length > 0)
    .map((word: string) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-gray-200 bg-white/95 px-5 backdrop-blur lg:px-8">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#1A1426] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="font-semibold text-[#1A1426]">
            Platform Control Center
          </h2>

          <p className="text-xs text-gray-500">
            Manage the PrintPoint ecosystem
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
        >
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7E49F2]" />
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#1A1426]">
              {displayName}
            </p>

            <p className="text-xs text-[#7E49F2]">
              Sudo Administrator
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-dark/10 font-semibold text-[#7E49F2]">
            {initials ? (
              initials
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}