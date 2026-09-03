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
          <span className="absolute top-3 left-3 text-xs font-medium px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white shadow-sm">
            {request.category || "Other"}
          </span>
          {/* Delivery type badge */}
          {request.deliveryType === "click_and_collect" && (
            <span className="absolute top-3 left-3 mt-8 text-xs font-medium px-1.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white shadow-sm" title="Click & Collect">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
            </span>
          )}
          {/* Reward badge */}
          <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 bg-primary text-white rounded-full shadow-sm">
            +{formatCurrency(request.reward)}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{request.title}</h3>
          
          {/* Route */}
          <div className="space-y-1 text-sm text-white">
            <p className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {request.fromCity && request.fromCountry
                ? `${request.fromCity}, ${request.fromCountry}`
                : "Origin TBD"}
              {" → "}
              {request.toCity && request.toCountry
                ? `${request.toCity}, ${request.toCountry}`
                : "Destination TBD"}
            </p>
          </div>
          
          {/* Price section - reward primary */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Delivery Reward</p>
                <p className="font-bold text-lg text-primary-color">+{formatCurrency(request.reward)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Item Price</p>
                <p className="text-sm text-muted">{formatCurrency(request.itemPrice)}</p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Heart */}
              <button className="p-1 text-muted hover:text-error transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>
              {/* Share */}
              <button className="p-1 text-muted hover:text-primary-color transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                </svg>
              </button>
            </div>
            {/* Status chip */}
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-info text-info capitalize">
              {request.status}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
