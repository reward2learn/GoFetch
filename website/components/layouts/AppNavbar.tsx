"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/web3/ConnectButton";
import { BellIcon, SearchIcon, MenuIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery, openNotificationDrawer } from "@/redux/slices/ui.slice";
import { useTheme } from "@/components/providers/ThemeProvider";

interface AppNavbarProps {
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export function AppNavbar({ onSidebarToggle, sidebarCollapsed }: AppNavbarProps) {
  const { address } = useAccount();
  const dispatch = useAppDispatch();
  const { mode, setMode } = useTheme();
  const searchQuery = useAppSelector((s) => s.ui.searchQuery);
  const notificationDrawerOpen = useAppSelector((s) => s.ui.notificationDrawerOpen);
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    <header className="h-16 border-b border-border bg-surface-1 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Burger toggle — visible only when sidebar is collapsed, desktop only */}
        {sidebarCollapsed && onSidebarToggle && (
          <button
            onClick={onSidebarToggle}
            className="hidden md:flex p-2 hover:bg-surface-tertiary rounded-lg transition-colors items-center gap-2"
            title="Expand sidebar"
          >
            <MenuIcon className="h-5 w-5 text-muted" />
            <span className="text-xl font-bold text-primary-color">GoFetch</span>
          </button>
        )}
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold text-primary-color">GoFetch</h1>
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
        {/* Theme toggle */}
        <button
          onClick={() => {
            const next = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";
            setMode(next);
          }}
          className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          title={`Theme: ${mode}`}
        >
          {mode === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : mode === "light" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>
            </svg>
          )}
        </button>
        <button
          onClick={() => dispatch(openNotificationDrawer())}
          className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative"
        >
          <BellIcon className="h-5 w-5 text-muted" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-secondary-300 rounded-full"></span>
        </button>
        <ConnectButton />
      </div>
    </header>
  );
}
