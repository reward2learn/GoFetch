"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery } from "@/redux/slices/ui.slice";
import { fetchExploreRequests, checkAdminStatus, createRequest, archiveRequest, scrapeRequest } from "@/redux/slices/explore.slice";
import { selectExploreRequests, selectExploreIsLoading, selectExploreError, selectIsAdmin } from "@/redux/selectors";
import { COUNTRIES, getCitiesForCountry } from "@/lib/data/airports";
import { Upload, X, Sparkles } from "lucide-react";

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
  const requests = useAppSelector(selectExploreRequests);
  const isLoading = useAppSelector(selectExploreIsLoading);
  const error = useAppSelector(selectExploreError);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<"all" | "standard" | "click_and_collect">("all");
  const [filterFromCountry, setFilterFromCountry] = useState("");
  const [filterToCountry, setFilterToCountry] = useState("");
  const [lovedFilter, setLovedFilter] = useState(false);
  const [buyerIdFilter, setBuyerIdFilter] = useState("");
  const [buyerNameFilter, setBuyerNameFilter] = useState("");
  const [groupByOwner, setGroupByOwner] = useState(false);
  const isAdmin = useAppSelector(selectIsAdmin);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const favs = JSON.parse(localStorage.getItem("gf-favorites") || "[]");
      return new Set(favs);
    } catch { return new Set(); }
  });
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
    const bname = searchParams.get("buyerName");

    if (fc) setFilterFromCountry(fc);
    if (tc) setFilterToCountry(tc);
    if (cat) setSelectedCategories(cat.split(","));
    if (sort) setSortBy(sort);
    if (dt) setDeliveryTypeFilter(dt as any);
    if (bid) {
      setBuyerIdFilter(bid);
      setBuyerNameFilter(bname || "");
    }
  }, [searchParams]);

  // Sticky filter state
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [productUrl, setProductUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlDraft, setImageUrlDraft] = useState("");
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

  // Check admin status via Redux
  useEffect(() => {
    dispatch(checkAdminStatus());
  }, [dispatch]);

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

  // Fetch requests via Redux thunk
  useEffect(() => {
    dispatch(fetchExploreRequests());
  }, [dispatch, selectedCategories, searchQuery, sortBy, deliveryTypeFilter, filterFromCountry, filterToCountry, buyerIdFilter]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Append to the image array (deduped)
      setImageUrls((prev: string[]) => (prev.includes(dataUrl) ? prev : [...prev, dataUrl]));
      setImageUrlDraft("");
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    const url = imageUrlDraft.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      alert("Image URL must start with http:// or https://");
      return;
    }
    setImageUrls((prev: string[]) => (prev.includes(url) ? prev : [...prev, url]));
    setImageUrlDraft("");
  };

  const handleRemoveImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
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
    setImageUrls([]);
    setImageUrlDraft("");
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
      const result = await dispatch(scrapeRequest({ url: productUrl })).unwrap();
      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.category) setCategory(result.category);
      if (Array.isArray(result.imageUrls) && result.imageUrls.length > 0) {
        setImageUrls((prev: string[]) => {
          const scrapedOnly = result.imageUrls!.filter((u: string) => !prev.includes(u));
          return [...scrapedOnly, ...prev];
        });
      } else if (result.imageUrl) {
        setImageUrls((prev: string[]) =>
          prev.includes(result.imageUrl!) ? prev : [result.imageUrl!, ...prev]
        );
      }
      if (result.price) setItemPrice(String(result.price));
      if (result.country) setFromCountry(result.country);
      if (result.city) setFromCity(result.city);
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
      await dispatch(createRequest({
        title: form.get("title") as string,
        description: (form.get("description") as string) || undefined,
        outletName: outletName || undefined,
        productUrl: productUrl || undefined,
        imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
        invoiceUrl: invoiceUrl || undefined,
        category: form.get("category") as string,
        deliveryType,
        itemPrice: deliveryType === "click_and_collect" ? 0 : parseFloat(itemPrice) || 0,
        pickupLocation: deliveryType === "click_and_collect" ? pickupLocation : undefined,
        pickupInstructions: deliveryType === "click_and_collect" ? pickupInstructions : undefined,
        reward: parseFloat(reward) || 0,
        deadline: deadline || undefined,
        fromCountry,
        fromCity,
        toCountry,
        toCity,
      })).unwrap();
      resetForm();
      setShowPostModal(false);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to post request");
    } finally {
      setPosting(false);
    }
  };

  const handleArchive = async (id: string, reason: string) => {
    try {
      await dispatch(archiveRequest({ id, reason })).unwrap();
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

  return (
    <div className="min-h-screen">
      {/* Sticky Filter Bar */}
      <div className="sticky z-30 bg-surface-1 border-b border-border shadow-sm" style={{ top: '-4px' }}>
        
        {/* Persistent top row: filter toggle + Post Request (always visible) */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
              filtersExpanded
                ? "bg-primary text-white border-primary"
                : "bg-surface-2 border-border text-muted hover:bg-surface-hover"
            }`}
            title={filtersExpanded ? "Hide filters" : "Show filters"}
            aria-label={filtersExpanded ? "Hide filters" : "Show filters"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
          </button>

          {/* Expandable Filters — shared desktop/mobile */}
          <div className={`transition-all duration-300 ease-in-out ${
            filtersExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none h-0"
          }`}>
            <div className="p-4 pt-0 md:pt-4">
              {/* Filters row */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Category multi-select */}
                <Autocomplete<string>
                  multiple
                  clearable
                  size="small"
                  placeholder="All Categories"
                  options={ALL_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                  value={selectedCategories}
                  onChange={(val) => setSelectedCategories(val as string[])}
                  className="w-48"
                />

                {/* Sort */}
                <Autocomplete<string>
                  size="small"
                  clearable
                  placeholder="Sort: Newest"
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(val) => setSortBy((val as string) || "newest")}
                  className="w-52"
                />

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

                {/* Group by Owner toggle */}
                <button
                  onClick={() => setGroupByOwner(!groupByOwner)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    groupByOwner
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-2 border border-border text-secondary hover:bg-surface-hover"
                  }`}
                  title="Group requests by owner"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Group by Owner
                </button>

                {/* Delivery Type */}
                <Autocomplete<string>
                  size="small"
                  clearable
                  placeholder="All Types"
                  options={[
                    { value: "standard", label: "Standard Delivery" },
                    { value: "click_and_collect", label: "Click & Collect" },
                  ]}
                  value={deliveryTypeFilter === "all" ? "" : deliveryTypeFilter}
                  onChange={(val) => setDeliveryTypeFilter((val as "all" | "standard" | "click_and_collect") || "all")}
                  className="w-48"
                />

                {/* From Country */}
                <Autocomplete<string>
                  size="small"
                  clearable
                  placeholder="From Country"
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                  value={filterFromCountry}
                  onChange={(val) => setFilterFromCountry((val as string) || "")}
                  className="w-44"
                />

                {/* To Country */}
                <Autocomplete<string>
                  size="small"
                  clearable
                  placeholder="To Country"
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                  value={filterToCountry}
                  onChange={(val) => setFilterToCountry((val as string) || "")}
                  className="w-44"
                />

                {(filterFromCountry || filterToCountry) && (
                  <button
                    onClick={() => { setFilterFromCountry(""); setFilterToCountry(""); }}
                    className="text-sm text-primary-color hover:underline"
                  >
                    Clear countries
                  </button>
                )}

                {/* Active owner filter chip — removable */}
                {buyerIdFilter && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="text-sm font-medium text-primary">
                      {buyerNameFilter || "Selected owner"}
                    </span>
                    <button
                      onClick={() => { setBuyerIdFilter(""); setBuyerNameFilter(""); }}
                      className="text-primary hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      aria-label="Remove owner filter"
                      title="Show all items"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowPostModal(true); }}
            className="px-4 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-hover transition-colors shrink-0"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
          </button>
        </div>

      
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Grid */}
        {isLoading ? (
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
        ) : groupByOwner && groupedByOwner ? (
          <div className="space-y-8">
            {Object.entries(groupedByOwner)
              .filter(([, group]) => group.items.some((r: any) => !lovedFilter || favorites.has(r.id)))
              .map(([ownerId, group]) => (
                <div key={ownerId}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                      {(group.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-sm font-semibold text-primary">{group.name}</h2>
                    <span className="text-xs text-muted">({group.items.filter((r: any) => !lovedFilter || favorites.has(r.id)).length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.items
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
                </div>
              ))}
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
                title="Upload an image (you can add multiple)"
              >
                <span className="text-base leading-none">+</span>
                <Upload className="h-4 w-4" />
                Add Image
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
                value={imageUrlDraft}
                onChange={(e) => setImageUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddImageUrl(); } }}
                placeholder="Or paste image URL and press Enter"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!imageUrlDraft.trim()}
                className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
            {/* Image gallery — array of uploaded + scraped images */}
            {imageUrls.length > 0 && (
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imageUrls.map((url: string, idx: number) => (
                  <div key={url + idx} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-border bg-surface-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      aria-label={`Remove image ${idx + 1}`}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-error text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 bg-primary text-white rounded">Primary</span>
                    )}
                  </div>
                ))}
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
