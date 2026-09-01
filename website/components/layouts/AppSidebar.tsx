"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PackageIcon, MapIcon, MessageSquare, SettingsIcon, WalletIcon, UserIcon } from "lucide-react";

const navItems = [
  { href: "/app/explore", label: "Explore", icon: HomeIcon },
  { href: "/app/orders", label: "My Orders", icon: PackageIcon },
  { href: "/app/trips", label: "Travel Plans", icon: MapIcon },
  { href: "/app/chat", label: "Messages", icon: MessageSquare },
  { href: "/app/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/app/profile", label: "Profile", icon: UserIcon },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface-1 border-r border-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <div>
            <h2 className="font-bold text-brand-primary">GoFetch</h2>
            <p className="text-xs text-muted">Global Delivery</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "text-muted hover:bg-surface-tertiary hover:text-brand-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="bg-surface-tertiary rounded-lg p-4">
          <p className="text-sm font-medium mb-1">Need help?</p>
          <p className="text-xs text-muted">Contact support</p>
        </div>
      </div>
    </aside>
  );
}
