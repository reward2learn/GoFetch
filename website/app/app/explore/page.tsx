"use client";

import { useState, useEffect, useRef } from "react";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery } from "@/redux/slices/ui.slice";
import { COUNTRIES, getCitiesForCountry } from "@/lib/data/airports";
import { ChevronDown, Check, Upload, X } from "lucide-react";

const ALL_CATEGORIES = ["Beauty", "Electronics", "Fashion", "Food", "Other"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
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
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const searchQuery = useAppSelector((s) => s.ui.searchQuery);
  const dispatch = useAppDispatch();

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [selectedCategories, searchQuery, sortBy, refreshKey]);

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
    setPostError(null);
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
          productUrl: productUrl || null,
          imageUrl: imageUrl || null,
          category: form.get("category"),
          itemPrice: itemPrice,
          reward: reward,
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

  const categoryLabel = () => {
    if (selectedCategories.length === 0 || selectedCategories.length === ALL_CATEGORIES.length) return "All Categories";
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} selected`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Explore Requests</h1>
          <p className="text-sm text-gray-500">Find delivery opportunities worldwide</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowPostModal(true); }}
          className="px-4 py-2 bg-green-700 text-white rounded-full text-sm font-medium hover:bg-green-800 transition-colors"
        >
          Post Request
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search perfume, sneakers, tech..."
        value={searchQuery}
        onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
      />

      {/* Filters row */}
      <div className="flex gap-3 items-center">
        {/* Multi-select category dropdown */}
        <div className="relative" ref={catDropdownRef}>
          <button
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {categoryLabel()}
            <ChevronDown className={`h-4 w-4 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {catDropdownOpen && (
            <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
              <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={selectedCategories.length === ALL_CATEGORIES.length}
                  onChange={() => toggleCategory("All")}
                  className="rounded border-gray-300 text-green-700 focus:ring-green-700"
                />
                <span className="text-sm font-medium">All</span>
              </label>
              {ALL_CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="rounded border-gray-300 text-green-700 focus:ring-green-700"
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
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-700"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl overflow-hidden">
              <div className="h-44 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No requests found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request: any) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Post Request Modal */}
      <Modal
        isOpen={showPostModal}
        onClose={() => { resetForm(); setShowPostModal(false); }}
        title="Post a Request"
        footer={
          <>
            <button type="button" onClick={() => { resetForm(); setShowPostModal(false); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" form="post-request-form" disabled={posting} className="px-4 py-2 text-sm bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
              {posting ? "Posting..." : "Post Request"}
            </button>
          </>
        }
      >
        <form id="post-request-form" onSubmit={handlePostRequest} className="space-y-3">
          {/* 1. Product URL — first field */}
          <Input
            label="Product URL (optional)"
            name="productUrl"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://store.example.com/product..."
          />

          {/* 2. Image upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Product Image</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            {imagePreview && (
              <div className="mt-2 relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
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

          {/* 3. Title */}
          <Input label="Title" name="title" placeholder="e.g., Nike Air Max from London" required />

          {/* 4. Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" rows={2} placeholder="Optional details..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
          </div>

          {/* 5. Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="category" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700">
                <option value="Beauty">Beauty</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input
              label="Item Price (USDC)"
              name="itemPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              required
            />
          </div>

          {/* 6. Reward — auto-calculated */}
          <Input
            label="Delivery Reward (USDC)"
            name="reward"
            type="number"
            step="0.01"
            min="0"
            placeholder="10% of price"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            required
          />

          {/* 7. From Country → City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Country</label>
              <select
                value={fromCountry}
                onChange={(e) => { setFromCountry(e.target.value); setFromCity(""); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-50 disabled:text-gray-400"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-50 disabled:text-gray-400"
                required
              >
                <option value="">{toCountry ? "Select city" : "Select country first"}</option>
                {toCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {postError && <p className="text-sm text-red-600">{postError}</p>}
        </form>
      </Modal>
    </div>
  );
}
