"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { RequestCard } from "@/components/marketplace/RequestCard";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSearchQuery } from "@/redux/slices/ui.slice";

const categories = ["All", "Beauty", "Electronics", "Fashion", "Other"];

export default function ExplorePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const searchQuery = useAppSelector((s) => s.ui.searchQuery);
  const dispatch = useAppDispatch();
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "All") params.append("category", category);
        if (searchQuery) params.append("q", searchQuery);
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
  }, [category, searchQuery, refreshKey]);

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
          category: form.get("category"),
          itemPrice: form.get("itemPrice"),
          reward: form.get("reward"),
          fromCountry: form.get("fromCountry"),
          fromCity: form.get("fromCity"),
          toCountry: form.get("toCountry"),
          toCity: form.get("toCity"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post request");
      }
      setShowPostModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to post request");
    } finally {
      setPosting(false);
    }
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
          onClick={() => setShowPostModal(true)}
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

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
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
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="Post a Request">
        <form onSubmit={handlePostRequest} className="space-y-3">
          <Input label="Title" name="title" placeholder="e.g., Nike Air Max from London" required />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" rows={2} placeholder="Optional details..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="category" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700">
                <option value="Beauty">Beauty</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input label="Item Price (USDC)" name="itemPrice" type="number" placeholder="0.00" required />
          </div>
          <Input label="Delivery Reward (USDC)" name="reward" type="number" placeholder="5.00" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="From Country" name="fromCountry" placeholder="United Kingdom" required />
            <Input label="From City" name="fromCity" placeholder="London" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="To Country" name="toCountry" placeholder="United States" required />
            <Input label="To City" name="toCity" placeholder="New York" required />
          </div>
          {postError && <p className="text-sm text-red-600">{postError}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowPostModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={posting} className="px-4 py-2 text-sm bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
              {posting ? "Posting..." : "Post Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
