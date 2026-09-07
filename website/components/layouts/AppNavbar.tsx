"use client";

import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { BellIcon, MenuIcon, SearchIcon, WalletIcon, LogOutIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { openNotificationDrawer, markNotificationsAsSeen } from "@/redux/slices/ui.slice";
import { useBrand } from "@/components/providers/BrandProvider";
import { useLogout } from "@/lib/useLogout";
import SearchDropdown from "@/components/search/SearchDropdown";
import { useMemo, useRef, useState } from "react";

interface AppNavbarProps {
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  onMobileMenuToggle?: () => void;
}

export function AppNavbar({ onSidebarToggle, sidebarCollapsed, onMobileMenuToggle }: AppNavbarProps) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const dispatch = useAppDispatch();
  const brand = useBrand();
  const notifications = useAppSelector((s) => s.ui.notifications);
  const lastSeenNotificationTimestamp = useAppSelector(
    (s) => s.ui.lastSeenNotificationTimestamp
  );
  const handleLogout = useLogout();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => n.timestamp > lastSeenNotificationTimestamp).length,
    [notifications, lastSeenNotificationTimestamp]
  );

  const openNotifications = () => {
    dispatch(openNotificationDrawer());
    dispatch(markNotificationsAsSeen());
  };

  const handleSearchIconClick = () => {
    if (searchOpen) {
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const handleSearchBlur = () => {
    if (!searchInputRef.current?.value) setSearchOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden h-14 bg-surface-1 flex items-center gap-2 px-3">
        {/* Left: Hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 hover:bg-surface-tertiary rounded-lg transition-colors shrink-0"
          title="Open menu"
        >
          <MenuIcon className="h-5 w-5 text-muted" />
        </button>

        {/* Center: Brand Logo + Name */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0 overflow-hidden">
          {brand.logo ? (
            <img src={brand.logo} alt={`${brand.name} logo`} className="h-7 w-7 object-cover rounded-lg brand-logo-img shrink-0" />
          ) : (
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">{brand.name.charAt(0)}</span>
            </div>
          )}
          <span className="text-base font-bold text-primary-color whitespace-nowrap truncate">{brand.name}</span>
        </div>

        {/* Right: notification + wallet + logout */}
        <div className="flex items-center shrink-0">
          <button
            onClick={openNotifications}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
            title={unreadNotificationCount > 0 ? `${unreadNotificationCount} new notification${unreadNotificationCount !== 1 ? "s" : ""}` : "Notifications"}
            aria-label={unreadNotificationCount > 0 ? `${unreadNotificationCount} new notifications` : "Notifications"}
          >
            <BellIcon className={`h-5 w-5 ${unreadNotificationCount > 0 ? "text-primary" : "text-muted"}`} />
            {unreadNotificationCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full ring-2 ring-surface-1"
                aria-label={`${unreadNotificationCount} unread`}
              >
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => open()}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
            title={isConnected ? "Wallet connected" : "Connect wallet"}
          >
            <WalletIcon className="h-5 w-5 text-muted" />
            <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface-1 ${
              isConnected ? "bg-success" : "bg-error"
            }`}></span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            title="Log out"
          >
            <LogOutIcon className="h-5 w-5 text-error" />
          </button>
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden md:flex h-16 border-b border-border bg-surface-1 items-center gap-3 px-6">
        {/* Left: burger toggle (only when sidebar collapsed) */}
        {sidebarCollapsed && onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="flex p-2 hover:bg-surface-tertiary rounded-lg transition-colors items-center gap-2 shrink-0"
            title="Expand sidebar"
          >
            <MenuIcon className="h-5 w-5 text-muted" />
            <span className="text-xl font-bold text-primary-color">{brand.name}</span>
          </button>
        )}

        {/* Center: search icon expands to full-width field */}
        <div className="flex-1 flex items-center justify-center">
          {searchOpen ? (
            <div className="relative w-full max-w-xl">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search requests..."
                onBlur={handleSearchBlur}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-surface-2"
              />
              {/* Search dropdown below the input */}
              <div className="absolute top-full left-0 right-0 mt-1 z-20">
                <SearchDropdown />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={handleSearchIconClick}
                className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors w-full max-w-xl"
                title="Open search"
              >
                <SearchIcon className="h-5 w-5 text-muted" />
              </button>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNotifications}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
            title={unreadNotificationCount > 0 ? `${unreadNotificationCount} new notification${unreadNotificationCount !== 1 ? "s" : ""}` : "Notifications"}
            aria-label={unreadNotificationCount > 0 ? `${unreadNotificationCount} new notifications` : "Notifications"}
          >
            <BellIcon className={`h-5 w-5 ${unreadNotificationCount > 0 ? "text-primary" : "text-muted"}`} />
            {unreadNotificationCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full ring-2 ring-surface-1"
                aria-label={`${unreadNotificationCount} unread`}
              >
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => open()}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
            title={isConnected ? "Wallet connected" : "Connect wallet"}
          >
            <WalletIcon className="h-5 w-5 text-muted" />
            <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface-1 ${
              isConnected ? "bg-success" : "bg-error"
            }`}></span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            title="Log out"
          >
            <LogOutIcon className="h-5 w-5 text-error" />
          </button>
        </div>
      </header>
    </>
  );
}
