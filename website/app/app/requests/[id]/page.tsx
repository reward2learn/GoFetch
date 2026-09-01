"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

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
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      {/* Details */}
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

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" className="flex-1">Accept Delivery</Button>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>
    </div>
  );
}
