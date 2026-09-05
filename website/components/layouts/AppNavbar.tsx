"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { ConnectButton } from "@/components/web3/ConnectButton";
import { BellIcon, SearchIcon, MenuIcon, WalletIcon, LogOutIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery, openNotificationDrawer } from "@/redux/slices/ui.slice";
import { useBrand } from "@/components/providers/BrandProvider";
import { useLogout } from "@/lib/useLogout";

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
  const searchQuery = useAppSelector((s) => s.ui.searchQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleLogout = useLogout();

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = () => {
    dispatch(setSearchQuery(localSearch));
    if (!localSearch) setSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setLocalSearch(searchQuery);
      setSearchOpen(false);
    }
  };

  const handleSearchIconClick = () => {
    if (searchOpen) {
      handleSearchSubmit();
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  };

  return (
    <>
      {/* Mobile header — clean minimal layout */}
      <header className="md:hidden h-14 bg-surface-1 flex items-center justify-between px-4">
        {/* Left: Hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          title="Open menu"
        >
          <MenuIcon className="h-5 w-5 text-muted" />
        </button>

        {/* Center: Brand Logo + Name */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          {brand.logo ? (
            <img src={brand.logo} alt={`${brand.name} logo`} className="h-8 w-8 object-cover rounded-lg brand-logo-img" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">{brand.name.charAt(0)}</span>
            </div>
          )}
          <span className="text-base font-bold text-primary-color whitespace-nowrap">{brand.name}</span>
        </div>

        {/* Right: Notification bell + Wallet indicator + Logout */}
        <div className="flex items-center">
          <button
            onClick={() => dispatch(openNotificationDrawer())}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
            title="Notifications"
          >
            <BellIcon className="h-5 w-5 text-muted" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-secondary-300 rounded-full"></span>
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

      {/* Desktop header — original layout */}
      <header className="hidden md:flex h-16 border-b border-border bg-surface-1 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Desktop burger toggle — visible only when sidebar is collapsed */}
          {sidebarCollapsed && onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="flex p-2 hover:bg-surface-tertiary rounded-lg transition-colors items-center gap-2"
              title="Expand sidebar"
            >
              <MenuIcon className="h-5 w-5 text-muted" />
              <span className="text-xl font-bold text-primary-color">{brand.name}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={() => {
                  if (!localSearch) setSearchOpen(false);
                }}
                placeholder="Search requests..."
                className="w-48 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-1"
              />
              <button
                onClick={handleSearchIconClick}
                className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
              >
                <SearchIcon className="h-5 w-5 text-muted" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSearchIconClick}
              className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            >
              <SearchIcon className="h-5 w-5 text-muted" />
            </button>
          )}
          <button
            onClick={() => dispatch(openNotificationDrawer())}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
          >
            <BellIcon className="h-5 w-5 text-muted" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-secondary-300 rounded-full"></span>
          </button>
          <ConnectButton />
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
