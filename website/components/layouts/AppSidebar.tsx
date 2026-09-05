"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PackageIcon, MapIcon, MessageSquare, SettingsIcon, WalletIcon, UserIcon, LogOutIcon, XIcon, HelpCircleIcon, FileTextIcon, ShieldIcon } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import { useBrand } from "@/components/providers/BrandProvider";
import { useLogout } from "@/lib/useLogout";

const navItems = [
  { href: "/app/explore", label: "Explore", icon: HomeIcon },
  { href: "/app/orders", label: "My Orders", icon: PackageIcon },
  { href: "/app/trips", label: "Travel Plans", icon: MapIcon },
  { href: "/app/chat", label: "Messages", icon: MessageSquare },
  { href: "/app/wallet", label: "Account", icon: WalletIcon },
  { href: "/app/profile", label: "Profile", icon: UserIcon },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
  { href: "/app/qa", label: "Q&A", icon: HelpCircleIcon },
  { href: "/terms", label: "Terms", icon: FileTextIcon },
  { href: "/privacy", label: "Privacy", icon: ShieldIcon },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ collapsed, onToggle, isMobile, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const brand = useBrand();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const handleLogout = useLogout();

  const initials = authUser?.name?.startsWith("0x")
    ? "GF"
    : (authUser?.name || "")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

  // Mobile: full-screen sidebar
  if (isMobile) {
    return (
      <aside className="w-full h-full bg-surface-1 flex flex-col">
        {/* Header with close button */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center shrink-0 overflow-hidden brand-logo-container">
              {brand.logo ? (
                <img src={brand.logo} alt={`${brand.name} logo`} className="w-full h-full object-cover brand-logo-img" />
              ) : (
                <span className="text-white font-bold text-lg">G</span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-primary-color">{brand.name}</h2>
              <p className="text-xs text-muted">{brand.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            title="Close menu"
          >
            <XIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-surface-tertiary hover:text-primary-color"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="border-t border-border p-4 space-y-3">
          {/* User info */}
          <Link href="/app/profile" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
            <div className="w-10 h-10 rounded-full  text-white flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
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

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors border border-error/20"
          >
            <LogOutIcon className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>
    );
  }

  // Desktop: original sidebar behavior
  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-surface-1 border-r border-border flex flex-col transition-all duration-300`}
    >
      {/* Logo area */}
      <div className={`${collapsed ? "p-4" : "p-6"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            {brand.logo ? (
              <img src={brand.logo} alt={`${brand.name} logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">G</span>
            )}
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-primary-color">{brand.name}</h2>
              <p className="text-xs text-muted">{brand.subtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto min-h-0">
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
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/app/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
            <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
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
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors border border-error/20"
          >
            <LogOutIcon className="h-4 w-4" />
            Log Out
          </button>
        </div>
      )}

      {/* User profile — collapsed avatar + logout */}
      {collapsed && (
        <div className="p-2 border-t border-border flex flex-col items-center gap-2">
          <Link href="/app/profile" className="w-10 h-10 rounded-full  text-white flex items-center justify-center text-sm font-bold overflow-hidden">
            {authUser?.avatarUrl ? (
              <img src={authUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
            title="Log out"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
