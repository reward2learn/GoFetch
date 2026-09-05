"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery } from "@/redux/slices/ui.slice";
import { COUNTRIES, getCitiesForCountry } from "@/lib/data/airports";
import { ChevronDown, Check, Upload, X, Sparkles } from "lucide-react";

const ALL_CATEGORIES = ["Beauty", "Electronics", "Fashion", "Food", "Other"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "deadline_asc", label: "Time Left: Urgent First" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "reward_asc", label: "Reward: Low → High" },
  { value: "reward_desc", label: "Reward: High → Low" },
];

export default function ExplorePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<"all" | "standard" | "click_and_collect">("all");
  const [filterFromCountry, setFilterFromCountry] = useState("");
  const [filterToCountry, setFilterToCountry] = useState("");
  const [lovedFilter, setLovedFilter] = useState(false);
  const [buyerIdFilter, setBuyerIdFilter] = useState("");
  const [groupByOwner, setGroupByOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const favs = JSON.parse(localStorage.getItem("gf-favorites") || "[]");
      return new Set(favs);
    } catch { return new Set(); }
  });
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const searchQuery = useAppSelector((s) => s.ui.searchQuery);
  const dispatch = useAppDispatch();

  const searchParams = useSearchParams();

  // Pre-fill filters from URL params (e.g. from trip match button)
  useEffect(() => {
    const fc = searchParams.get("fromCountry");
    const tc = searchParams.get("toCountry");
    const cat = searchParams.get("category");
    const sort = searchParams.get("sort");
    const dt = searchParams.get("deliveryType");
    const bid = searchParams.get("buyerId");

    if (fc) setFilterFromCountry(fc);
    if (tc) setFilterToCountry(tc);
    if (cat) setSelectedCategories(cat.split(","));
    if (sort) setSortBy(sort);
    if (dt) setDeliveryTypeFilter(dt as any);
    if (bid) setBuyerIdFilter(bid);
  }, [searchParams]);

  // Sticky filter state
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [productUrl, setProductUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [itemPrice, setItemPrice] = useState("");
  const [reward, setReward] = useState("");
  const [fromCountry, setFromCountry] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [toCity, setToCity] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [outletName, setOutletName] = useState("");
  const [category, setCategory] = useState("Other");
  const [deliveryType, setDeliveryType] = useState<"standard" | "click_and_collect">("standard");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const fromCities = fromCountry ? getCitiesForCountry(fromCountry) : [];
  const toCities = toCountry ? getCitiesForCountry(toCountry) : [];

  // Auto-calc reward as 10% of price
  useEffect(() => {
    if (itemPrice) {
      const price = parseFloat(itemPrice);
      if (!isNaN(price)) {
        setReward((price * 0.1).toFixed(2));
      }
    }
  }, [itemPrice]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Check admin status
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/check", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.isAdmin))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  // Auto-collapse filters when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);
      if (scrolled) setFiltersExpanded(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync favorites from localStorage when they change
  useEffect(() => {
    const syncFavorites = () => {
      try {
        const favs = JSON.parse(localStorage.getItem("gf-favorites") || "[]");
        setFavorites(new Set(favs));
      } catch {}
    };
    window.addEventListener("storage", syncFavorites);
    // Also poll periodically in case storage event doesn't fire (same-tab changes)
    const interval = setInterval(syncFavorites, 1000);
    return () => {
      window.removeEventListener("storage", syncFavorites);
      clearInterval(interval);
    };
  }, []);

  // Fetch requests
  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategories.length > 0 && selectedCategories.length < ALL_CATEGORIES.length) {
          params.append("categories", selectedCategories.join(","));
        }
        if (searchQuery) params.append("q", searchQuery);
        if (sortBy !== "newest") params.append("sort", sortBy);
        if (deliveryTypeFilter !== "all") {
          params.append("deliveryType", deliveryTypeFilter);
        }
        if (filterFromCountry) params.append("fromCountry", filterFromCountry);
        if (filterToCountry) params.append("toCountry", filterToCountry);
        if (buyerIdFilter) params.append("buyerId", buyerIdFilter);
        const res = await fetch(`/api/requests?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) { if (!ignore) setRequests([]); return; }
        const data = await res.json();
        if (!ignore) setRequests(Array.isArray(data) ? data : data.requests || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setRequests([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchRequests();
    return () => { ignore = true; controller.abort(); };
  }, [selectedCategories, searchQuery, sortBy, filterFromCountry, filterToCountry, deliveryTypeFilter, buyerIdFilter, refreshKey]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (cat === "All") {
        return prev.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES];
      }
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPostError("Invoice must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setInvoicePreview(dataUrl);
      setInvoiceUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setProductUrl("");
    setImageUrl("");
    setImagePreview(null);
    setItemPrice("");
    setReward("");
    setFromCountry("");
    setFromCity("");
    setToCountry("");
    setToCity("");
    setTitle("");
    setDescription("");
    setOutletName("");
    setCategory("Other");
    setDeliveryType("standard");
    setPickupLocation("");
    setPickupInstructions("");
    setInvoiceUrl("");
    setInvoicePreview(null);
    setDeadline("");
    setScrapeError(null);
  };

  const handleScrape = async () => {
    if (!productUrl) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to scrape URL");
      }
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.price) setItemPrice(data.price);
      // Pre-populate country and city from scraped location
      if (data.country) setFromCountry(data.country);
      if (data.city) setFromCity(data.city);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Failed to scrape URL");
    } finally {
      setScraping(false);
    }
  };

  const handlePostRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPosting(true);
    setPostError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          outletName: outletName || null,
          productUrl: productUrl || null,
          imageUrl: imageUrl || null,
          invoiceUrl: invoiceUrl || null,
          category: form.get("category"),
          deliveryType,
          itemPrice: deliveryType === "click_and_collect" ? "0.00" : itemPrice,
          pickupLocation: deliveryType === "click_and_collect" ? pickupLocation : undefined,
          pickupInstructions: deliveryType === "click_and_collect" ? pickupInstructions : undefined,
          reward: reward,
          deadline: deadline || null,
          fromCountry,
          fromCity,
          toCountry,
          toCity,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post request");
      }
      resetForm();
      setShowPostModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to post request");
    } finally {
      setPosting(false);
    }
  };

  const handleArchive = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived", archiveReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive");
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  // Group requests by owner for grouped view
  const groupedByOwner = groupByOwner
    ? requests.reduce((acc: Record<string, { name: string; items: any[] }>, r: any) => {
        const ownerId = r.buyerId || r.buyer?.id || "unknown";
        const ownerName = r.buyer?.name || "Unknown Owner";
        if (!acc[ownerId]) acc[ownerId] = { name: ownerName, items: [] };
        acc[ownerId].items.push(r);
        return acc;
      }, {} as Record<string, { name: string; items: any[] }>)
    : null;

  const categoryLabel = () => {
    if (selectedCategories.length === 0 || selectedCategories.length === ALL_CATEGORIES.length) return "All Categories";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} selected`;
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-surface-1 border-b border-border shadow-sm">
        {/* Desktop header — search always visible */}
        <div className="hidden md:block p-4">
          <div className="flex items-center justify-between gap-4">
            
            <div className="flex-1 max-w-xl">
              <input
                type="text"
                placeholder="Search perfume, sneakers, tech..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                className="w-full px-4 py-2.5 bg-surface-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  filtersExpanded 
                    ? "bg-primary text-white border-primary" 
                    : "bg-surface-2 border-border text-muted hover:bg-surface-hover"
                }`}
                title={filtersExpanded ? "Hide filters" : "Show filters"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </button>
              <button
                onClick={() => { resetForm(); setShowPostModal(true); }}
                className="px-4 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Post Request
              </button>
            </div>
          </div>
        </div>

        {/* Mobile header — icon row */}
        <div className="md:hidden p-3">
          {!isScrolled && (
            <h1 className="text-xl font-bold mb-3">Explore</h1>
          )}
          <div className="flex items-center gap-2">
            {/* Search icon button */}
            <button
              onClick={() => { setSearchExpanded(!searchExpanded); if (!searchExpanded) setFiltersExpanded(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                searchExpanded
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-muted hover:bg-surface-hover"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
            {/* Filter icon button */}
            <button
              onClick={() => { setFiltersExpanded(!filtersExpanded); if (!filtersExpanded) setSearchExpanded(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filtersExpanded
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-muted hover:bg-surface-hover"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
            </button>
            {/* Add request icon button */}
            <button
              onClick={() => { resetForm(); setShowPostModal(true); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search field — expandable */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          searchExpanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="px-3 pb-3">
            <input
              type="text"
              placeholder="Search perfume, sneakers, tech..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full px-4 py-2.5 bg-surface-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus={searchExpanded}
            />
          </div>
        </div>

        {/* Expandable Filters — shared desktop/mobile */}
        <div className={`transition-all duration-300 ease-in-out ${
          filtersExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none h-0"
        }`}>
          <div className="p-4 pt-0 md:pt-4">
            {/* Filters row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Multi-select category dropdown */}
              <div className="relative" ref={catDropdownRef}>
                <button
                  onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
                >
                  {categoryLabel()}
                  <ChevronDown className={`h-4 w-4 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {catDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-56 bg-surface-1 border border-border rounded-lg shadow-lg">
                    <label className="flex items-center gap-2 px-4 py-2 hover:bg-surface-hover cursor-pointer border-b border-border">
                      <input
                        type="checkbox"
                        checked={selectedCategories.length === ALL_CATEGORIES.length}
                        onChange={() => toggleCategory("All")}
                        className="rounded border-divider text-primary-color focus:ring-primary"
                      />
                      <span className="text-sm font-medium">All</span>
                    </label>
                    {ALL_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 px-4 py-2 hover:bg-surface-hover cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="rounded border-divider text-primary-color focus:ring-primary"
                        />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Loved filter toggle */}
              <button
                onClick={() => setLovedFilter(!lovedFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  lovedFilter
                    ? "bg-error text-white"
                    : "bg-surface-2 border border-border text-secondary hover:bg-surface-hover"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={lovedFilter ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                Loved
              </button>

              {/* Delivery Type Filter */}
              <select
                value={deliveryTypeFilter}
                onChange={(e) => setDeliveryTypeFilter(e.target.value as "all" | "standard" | "click_and_collect")}
                className="px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Types</option>
                <option value="standard">Standard Delivery</option>
                <option value="click_and_collect">Click & Collect</option>
              </select>

              {/* Country Filters */}
              <select
                value={filterFromCountry}
                onChange={(e) => setFilterFromCountry(e.target.value)}
                className="px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">From Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterToCountry}
                onChange={(e) => setFilterToCountry(e.target.value)}
                className="px-4 py-2 bg-surface-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">To Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {(filterFromCountry || filterToCountry) && (
                <button
                  onClick={() => { setFilterFromCountry(""); setFilterToCountry(""); }}
                  className="text-sm text-primary-color hover:underline"
                >
                  Clear countries
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-surface-1 rounded-xl overflow-hidden">
                <div className="h-44 bg-surface-3" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-surface-3 rounded w-2/3" />
                  <div className="h-3 bg-surface-3 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted">No requests found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {requests
              .filter((r: any) => !lovedFilter || favorites.has(r.id))
              .map((request: any) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  isAdmin={isAdmin}
                  onArchive={handleArchive}
                />
              ))}
          </div>
        )}
      </div>

      {/* Post Request Modal */}
      <Modal
        isOpen={showPostModal}
        onClose={() => { resetForm(); setShowPostModal(false); }}
        title="Post a Request"
        footer={
          <>
            <button type="button" onClick={() => { resetForm(); setShowPostModal(false); }} className="px-4 py-2 text-sm text-secondary hover:bg-surface-hover rounded-lg">Cancel</button>
            <button type="submit" form="post-request-form" disabled={posting} className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50">
              {posting ? "Posting..." : "Post Request"}
            </button>
          </>
        }
      >
        <form id="post-request-form" onSubmit={handlePostRequest} className="space-y-3">
          {/* 1. Product URL — first field */}
          <div>
            <label className="block text-sm font-medium mb-1">Product URL (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="productUrl"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://store.example.com/product..."
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleScrape}
                disabled={!productUrl || scraping}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4" />
                {scraping ? "Scraping..." : "Generate"}
              </button>
            </div>
            {scrapeError && <p className="text-xs text-error mt-1">{scrapeError}</p>}
          </div>

          {/* 2. Image upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Image</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-secondary hover:bg-surface-hover transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                type="text"
                name="imageUrl"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImagePreview(null); }}
                placeholder="Or paste image URL"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {imagePreview && (
              <div className="mt-2 relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageUrl(""); }}
                  className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Invoice Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Invoice / Receipt (optional)</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => invoiceInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-secondary hover:bg-surface-hover transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Invoice
              </button>
              <input
                ref={invoiceInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleInvoiceUpload}
                className="hidden"
              />
              <input
                type="text"
                name="invoiceUrl"
                value={invoiceUrl}
                onChange={(e) => { setInvoiceUrl(e.target.value); setInvoicePreview(null); }}
                placeholder="Or paste invoice URL"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {invoicePreview && (
              <div className="mt-2 relative inline-block">
                {invoicePreview.startsWith("data:application/pdf") ? (
                  <div className="h-20 w-20 bg-surface-2 rounded-lg border border-border flex items-center justify-center text-xs text-muted">
                    PDF
                  </div>
                ) : (
                  <img src={invoicePreview} alt="Invoice Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                )}
                <button
                  type="button"
                  onClick={() => { setInvoicePreview(null); setInvoiceUrl(""); }}
                  className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* 3. Title */}
          <Input label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Nike Air Max from London" required />

          {/* 3b. Outlet Name */}
          <Input label="Outlet Name (optional)" name="outletName" value={outletName} onChange={(e) => setOutletName(e.target.value)} placeholder="e.g., Heinemann Duty Free" />

          {/* 4. Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details..." className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {/* 5. Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="Beauty">Beauty</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Food">Food</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 6. Delivery Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium">Delivery Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType("standard")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  deliveryType === "standard"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-secondary hover:bg-surface-hover-strong"
                }`}
              >
                📦 Standard Delivery
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("click_and_collect")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  deliveryType === "click_and_collect"
                    ? "bg-primary text-white"
                    : "bg-surface-2 text-secondary hover:bg-surface-hover-strong"
                }`}
              >
                ✈️ Click & Collect
              </button>
            </div>
          </div>

          {/* 7. Conditional fields based on delivery type */}
          {deliveryType === "standard" ? (
            <>
              {/* Standard Delivery Fields */}
              <Input
                label="Item Price (USDC)"
                name="itemPrice"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                placeholder="0.00"
                value={itemPrice}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = val.split(".");
                  if (parts.length > 2) return;
                  setItemPrice(val);
                }}
                required
              />
              <Input
                label="Delivery Reward (USDC)"
                name="reward"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                placeholder="10% of price"
                value={reward}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = val.split(".");
                  if (parts.length > 2) return;
                  setReward(val);
                }}
                required
              />
            </>
          ) : (
            <>
              {/* Click & Collect Fields */}
              <Input
                label="Pickup Location"
                name="pickupLocation"
                type="text"
                placeholder="e.g., Heinemann Departures Shop, Sydney Airport"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium">Pickup Instructions</label>
                <textarea
                  name="pickupInstructions"
                  placeholder="e.g., Order #12345, have confirmation email + passport + boarding pass ready"
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors text-sm"
                  required
                />
              </div>
              <Input
                label="Pickup Fee (USDC)"
                name="reward"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                placeholder="0.00"
                value={reward}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = val.split(".");
                  if (parts.length > 2) return;
                  setReward(val);
                }}
                required
              />
            </>
          )}

          {/* Delivery Deadline */}
          <div>
            <label className="block text-sm font-medium mb-1">Deliver By (Deadline)</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted mt-1">When does the traveler need to deliver this item?</p>
          </div>

          {/* 7. From Country → City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Country</label>
              <select
                value={fromCountry}
                onChange={(e) => { setFromCountry(e.target.value); setFromCity(""); }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From City</label>
              <select
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                disabled={!fromCountry}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-2 disabled:text-muted"
                required
              >
                <option value="">{fromCountry ? "Select city" : "Select country first"}</option>
                {fromCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 8. To Country → City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">To Country</label>
              <select
                value={toCountry}
                onChange={(e) => { setToCountry(e.target.value); setToCity(""); }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To City</label>
              <select
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                disabled={!toCountry}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-surface-2 disabled:text-muted"
                required
              >
                <option value="">{toCountry ? "Select city" : "Select country first"}</option>
                {toCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {postError && <p className="text-sm text-error">{postError}</p>}
        </form>
      </Modal>
    </div>
  );
}
