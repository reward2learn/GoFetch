import type { Request } from "./Request";

const PAGE_SIZE = 20;

/** Page of requests returned by the search endpoint. */
export interface RequestsPage {
  items: Request[];
  nextPage: number | null;
}

export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getRequestLabel(request: Request): string {
  return `${request.title} (${request.category})`;
}

/**
 * Checks whether a request matches the normalized search query.
 */
function matchesRequest(request: Request, query: string): boolean {
  const title = normalizeQuery(request.title);
  const category = normalizeQuery(request.category);
  const label = normalizeQuery(getRequestLabel(request));

  return title.includes(query) || category.includes(query) || label.includes(query);
}

/**
 * Fetches one page from the paginated request search endpoint.
 */
export async function fetchRequests(
  query: string,
  page: number,
  signal: AbortSignal
): Promise<RequestsPage> {
  const url = new URL("/api/requests", window.location.origin);
  if (query) url.searchParams.set("q", query);
  url.searchParams.set("page", String(page + 1));

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) throw new Error("Failed to fetch requests");

  const allItems: Request[] = await response.json();

  // Client-side pagination since API returns all matching results (up to 50)
  const start = page * PAGE_SIZE;
  const items = allItems.slice(start, start + PAGE_SIZE);
  const nextPage = start + PAGE_SIZE < allItems.length ? page + 1 : null;

  return { items, nextPage };
}
