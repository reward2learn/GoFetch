import { NextRequest, NextResponse } from "next/server";

/**
 * Tenant-aware API middleware
 * Extracts tenant slug from request and adds to headers
 */
export function withTenant(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    // Extract tenant from hostname or path
    const host = req.headers.get("host") || "";
    const tenantSlug =
      host.split(".")[0] ||
      process.env.NEXT_PUBLIC_TENANT_SLUG ||
      "gofetch";

    // Add tenant to request headers
    req.headers.set("x-tenant-slug", tenantSlug);

    // Call the original handler
    return handler(req, context);
  };
}

/**
 * Get tenant slug from request
 */
export function getTenantSlug(req: NextRequest): string {
  return (
    req.headers.get("x-tenant-slug") ||
    process.env.NEXT_PUBLIC_TENANT_SLUG ||
    "gofetch"
  );
}
