"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PackageIcon, MapIcon, MessageSquare, SettingsIcon, WalletIcon, UserIcon } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

const navItems = [
  { href: "/app/explore", label: "Explore", icon: HomeIcon },
  { href: "/app/orders", label: "My Orders", icon: PackageIcon },
  { href: "/app/trips", label: "Travel Plans", icon: MapIcon },
  { href: "/app/chat", label: "Messages", icon: MessageSquare },
  { href: "/app/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/app/profile", label: "Profile", icon: UserIcon },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { user: authUser } = useAppSelector((s) => s.auth);

  const initials = authUser?.name?.startsWith("0x")
    ? "GF"
    : (authUser?.name || "")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-surface-1 border-r border-border flex flex-col transition-all duration-300`}
    >
      {/* Logo area */}
      <div className={`${collapsed ? "p-4" : "p-6"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-primary-color">GoFetch</h2>
              <p className="text-xs text-muted">Global Delivery</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface-tertiary hover:text-primary-color"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand/Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={onToggle}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-2 rounded-lg text-muted hover:bg-surface-2 hover:text-primary transition-colors`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          ) : (
            <>
              <span className="text-sm font-medium">Collapse</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </>
          )}
        </button>
      </div>

      {/* User profile — hidden when collapsed */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <Link href="/app/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
              {authUser?.avatarUrl ? (
                <img src={authUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{authUser?.name || "Guest"}</p>
              <p className="text-xs text-muted truncate">{authUser?.email || "No email"}</p>
            </div>
          </Link>
        </div>
      )}

      {/* User profile — collapsed avatar only */}
      {collapsed && (
        <div className="p-2 border-t border-border flex justify-center">
          <Link href="/app/profile" className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold overflow-hidden">
            {authUser?.avatarUrl ? (
              <img src={authUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
