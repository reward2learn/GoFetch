"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";

const CATEGORY_IMAGES: Record<string, string> = {
  Beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=500&fit=crop",
  Electronics: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=500&fit=crop",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=500&fit=crop",
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop",
  Travel: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&h=500&fit=crop",
  Other: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=500&fit=crop",
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwner = authUser?.id === request?.buyerId;

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/requests/${params.id}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Request not found");
        const data = await res.json();
        if (!ignore) setRequest(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load request");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchRequest();
    return () => { ignore = true; controller.abort(); };
  }, [params.id]);

  const startEdit = () => {
    setEditForm({
      title: request.title || "",
      description: request.description || "",
      category: request.category || "Other",
      itemPrice: request.itemPrice || "",
      reward: request.reward || "",
      fromCountry: request.fromCountry || "",
      fromCity: request.fromCity || "",
      toCountry: request.toCountry || "",
      toCity: request.toCity || "",
      deadline: request.deadline ? new Date(request.deadline).toISOString().split("T")[0] : "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setRequest(updated);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/requests/${params.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.push("/app/explore");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-surface-tertiary rounded-xl"></div>
          <div className="h-8 bg-surface-tertiary rounded w-1/2"></div>
          <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted mb-4">{error || "Request not found"}</p>
        <Button variant="primary" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const image = request.imageUrl || CATEGORY_IMAGES[request.category || "Other"] || CATEGORY_IMAGES.Other;

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Hero image */}
        <div className="relative h-72 rounded-xl overflow-hidden">
          <img src={image} alt={request.title} className="w-full h-full object-cover" />
          <span className="absolute top-4 left-4 text-sm font-medium px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
            {request.category || "Other"}
          </span>
          <span className="absolute top-4 right-4 text-sm font-bold px-3 py-1 bg-brand-primary text-white rounded-full">
            +{formatCurrency(request.reward)}
          </span>
        </div>

        {/* Details or Edit Form */}
        {editing ? (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700">
                    <option value="Beauty">Beauty</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Item Price (USDC)</label>
                  <input type="number" value={editForm.itemPrice} onChange={(e) => setEditForm({ ...editForm, itemPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Reward (USDC)</label>
                <input type="number" value={editForm.reward} onChange={(e) => setEditForm({ ...editForm, reward: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">From Country</label>
                  <input type="text" value={editForm.fromCountry} onChange={(e) => setEditForm({ ...editForm, fromCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From City</label>
                  <input type="text" value={editForm.fromCity} onChange={(e) => setEditForm({ ...editForm, fromCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">To Country</label>
                  <input type="text" value={editForm.toCountry} onChange={(e) => setEditForm({ ...editForm, toCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To City</label>
                  <input type="text" value={editForm.toCity} onChange={(e) => setEditForm({ ...editForm, toCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">{request.title}</h1>
            
            {request.description && (
              <p className="text-muted mb-6">{request.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-muted mb-1">Item Price</p>
                <p className="text-lg font-semibold">{formatCurrency(request.itemPrice)}</p>
              </div>
              <div className="p-3 bg-surface-tertiary rounded-lg">
                <p className="text-xs text-muted mb-1">Delivery Reward</p>
                <p className="text-lg font-semibold text-brand-primary">+{formatCurrency(request.reward)}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">From</span>
                <span className="font-medium">{request.fromCity}, {request.fromCountry}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">To</span>
                <span className="font-medium">{request.toCity}, {request.toCountry}</span>
              </div>
              {request.deadline && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted">Deadline</span>
                  <span className="font-medium">{new Date(request.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted">Status</span>
                <span className="font-medium text-green-600 capitalize">{request.status}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        {isOwner ? (
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={startEdit}>Edit Request</Button>
            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
          </div>
        ) : request.status === "open" ? (
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1">Accept Delivery</Button>
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Request">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete &quot;{request.title}&quot;? This action cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
