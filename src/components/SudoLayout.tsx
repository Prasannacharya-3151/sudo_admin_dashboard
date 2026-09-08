import {
  useState,
  type ReactNode,
} from "react";

import { Outlet } from "react-router-dom";

import SudoSidebar from "./SudoSidebar";
import SudoTopbar from "./SudoTopbar";

interface SudoLayoutProps {
  children?: ReactNode;
}

export default function SudoLayout({
  children,
}: SudoLayoutProps) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-[#F8F7FC]">

      <SudoSidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-[280px]">

        <SudoTopbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="p-5 lg:p-8">
          {children || <Outlet />}
        </main>

      </div>

    </div>
  );
}