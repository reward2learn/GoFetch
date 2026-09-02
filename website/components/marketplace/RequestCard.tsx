"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_IMAGES: Record<string, string> = {
  Beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop",
  Electronics: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop",
  Food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  Travel: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=400&fit=crop",
  Other: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    category?: string;
    imageUrl?: string;
    itemPrice: number;
    reward: number;
    fromCity?: string;
    fromCountry?: string;
    toCity?: string;
    toCountry?: string;
    status: string;
    deliveryType?: string;
  };
}

export function RequestCard({ request }: RequestCardProps) {
  const image = request.imageUrl || CATEGORY_IMAGES[request.category || "Other"] || DEFAULT_IMAGE;

  return (
    <Link href={`/app/requests/${request.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow h-full overflow-hidden">
        {/* Image */}
        <div className="relative h-44 -mx-6 -mt-6 mb-4">
          <img
            src={image}
            alt={request.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Category badge */}
          <span className="absolute top-3 left-3 text-xs font-medium px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 shadow-sm">
            {request.category || "Other"}
          </span>
          {/* Delivery type badge */}
          {request.deliveryType === "click_and_collect" && (
            <span className="absolute top-3 left-3 mt-8 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              ✈️ Click & Collect
            </span>
          )}
          {/* Reward badge */}
          <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 bg-brand-primary text-white rounded-full shadow-sm">
            +{formatCurrency(request.reward)}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{request.title}</h3>
          
          <div className="space-y-1 text-sm text-muted">
            <p>
              {request.fromCity && request.fromCountry
                ? `${request.fromCity}, ${request.fromCountry}`
                : "Origin TBD"}
              {" → "}
              {request.toCity && request.toCountry
                ? `${request.toCity}, ${request.toCountry}`
                : "Destination TBD"}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Item Price</p>
              <p className="font-medium">{formatCurrency(request.itemPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Status</p>
              <p className="font-medium text-green-600 capitalize">{request.status}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
