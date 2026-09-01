"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/web3/ConnectButton";
import { BellIcon, SearchIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery } from "@/redux/slices/ui.slice";

export function AppNavbar() {
  const { address } = useAccount();
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((s) => s.ui.searchQuery);
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
        <h1 className="text-xl font-bold text-brand-primary">GoFetch</h1>
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
              className="w-48 px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
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
        <button className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors relative">
          <BellIcon className="h-5 w-5 text-muted" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-secondary-300 rounded-full"></span>
        </button>
        <ConnectButton />
      </div>
    </header>
  );
}
