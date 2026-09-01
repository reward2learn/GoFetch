/**
 * Tenant Configuration Service
 * Handles multi-tenant isolation and configuration
 */

export interface TenantConfig {
  slug: string;
  displayName: string;
  template: string;
  primaryColor: string;
  secondaryColor: string;
  appId?: string; // For suite-mode apps
}

/**
 * Get tenant configuration from environment or database
 */
export async function getTenantConfig(): Promise<TenantConfig> {
  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG || "gofetch";

  // In production, fetch from database
  // For now, return default config
  return {
    slug,
    displayName: process.env.NEXT_PUBLIC_APP_NAME || "GoFetch",
    template: "delivery-marketplace",
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#2A5A4A",
    secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || "#C97A5E",
  };
}

/**
 * Get tenant-scoped database URL
 */
export function getTenantDbUrl(tenantSlug: string): string {
  // In production, each tenant has its own database
  // For now, use the main database with tenant isolation
  return process.env.DATABASE_URL!;
}

/**
 * Generate tenant-scoped app URL
 */
export function getTenantAppUrl(tenantSlug: string): string {
  if (process.env.VERCEL_URL) {
    return `https://${tenantSlug}.${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
