"use client";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

/**
 * Whether the Reown Project ID is configured (not empty/placeholder).
 */
export function isReownConfigured(): boolean {
  return !!projectId && projectId !== "your-reown-project-id" && projectId.length >= 20;
}

export { projectId };
