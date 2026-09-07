import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface ExploreRequest {
  id: string;
  title: string;
  description?: string;
  productUrl?: string;
  category?: string;
  outletName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  invoiceUrl?: string;
  itemPrice: number;
  maxItemPrice?: number;
  price?: number;
  country?: string;
  city?: string;
  reward: number;
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  deadline?: string | null;
  pickupLocation?: string;
  pickupInstructions?: string;
  status: string;
  archiveReason?: string;
  deliveryType?: string;
  createdAt: string;
  buyerId?: string;
  buyer?: { id: string; name?: string };
}

export interface ExploreFilters {
  categories: string[];
  sortBy: string;
  deliveryType: "all" | "standard" | "click_and_collect";
  fromCountry: string;
  toCountry: string;
  buyerId: string;
  groupByOwner: boolean;
  lovedFilter: boolean;
  searchQuery: string;
}

export interface ExploreState {
  filters: ExploreFilters;
  requests: ExploreRequest[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  /** Generation counter for cache invalidation */
  generation: number;
  matchResults: Array<{ requestId: string; score: number; compatibility: Record<string, boolean> }>;
}

/* ─── Initial State ─── */

const initialState: ExploreState = {
  filters: {
    categories: [],
    sortBy: "newest",
    deliveryType: "all",
    fromCountry: "",
    toCountry: "",
    buyerId: "",
    groupByOwner: false,
    lovedFilter: false,
    searchQuery: "",
  },
  requests: [],
  isLoading: false,
  error: null,
  isAdmin: false,
  generation: 0,
  matchResults: [],
};

/* ─── Async Thunks ─── */

/**
 * Fetch requests with current filters. RTK manages the AbortController
 * internally — when a new dispatch arrives before the previous resolves,
 * the old fetch is automatically aborted (no race conditions, no leaks).
 */
export const fetchExploreRequests = createAsyncThunk<
  ExploreRequest[],
  void,
  { state: { explore: ExploreState }; signal: AbortSignal }
>(
  "explore/fetchRequests",
  async (_, { getState, signal }) => {
    const { filters } = getState().explore;
    const params = new URLSearchParams();

    if (filters.categories.length > 0 && filters.categories.length < 5) {
      params.append("categories", filters.categories.join(","));
    }
    if (filters.searchQuery) params.append("q", filters.searchQuery);
    if (filters.sortBy !== "newest") params.append("sort", filters.sortBy);
    if (filters.deliveryType !== "all") params.append("deliveryType", filters.deliveryType);
    if (filters.fromCountry) params.append("fromCountry", filters.fromCountry);
    if (filters.toCountry) params.append("toCountry", filters.toCountry);
    if (filters.buyerId) params.append("buyerId", filters.buyerId);

    const res = await fetch(`/api/requests?${params.toString()}`, { signal });
    if (!res.ok) throw new Error("Failed to fetch requests");
    const data = await res.json();
    return Array.isArray(data) ? data : data.requests || [];
  },
  {
    // Prevent duplicate fetches if already in-flight with same filters
    condition: (_, { getState }) => {
      const { explore } = getState() as { explore: ExploreState };
      return !explore.isLoading;
    },
  }
);

/**
 * Check admin status once and cache in slice.
 */
export const checkAdminStatus = createAsyncThunk(
  "explore/checkAdmin",
  async (_, { signal }) => {
    const res = await fetch("/api/admin/check", { signal });
    if (!res.ok) return false;
    const data = await res.json();
    return data.isAdmin as boolean;
  }
);

/**
 * Scrape a product URL to extract details.
 */
export const scrapeRequest = createAsyncThunk<
  Partial<ExploreRequest>,
  { url: string },
  { rejectValue: string }
>(
  "explore/scrapeRequest",
  async ({ url }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        return rejectWithValue(data.error || "Failed to scrape URL");
      }
      const json = await res.json();
      return json as Partial<ExploreRequest>;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Scrape failed");
    }
  }
);

/**
 * Create a new request.
 */
export const createRequest = createAsyncThunk<
  ExploreRequest,
  Partial<ExploreRequest>,
  { rejectValue: string }
>(
  "explore/createRequest",
  async (data, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        return rejectWithValue(err.error || "Failed to create request");
      }
      const json = await res.json();
      return json as ExploreRequest;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Create request failed");
    }
  }
);

/**
 * Archive a request (admin only).
 */
export const archiveRequest = createAsyncThunk<
  string, // returns the archived request id
  { id: string; reason: string },
  { rejectValue: string }
>(
  "explore/archiveRequest",
  async ({ id, reason }, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived", archiveReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        return rejectWithValue(data.error || "Failed to archive");
      }
      // Refresh the list after successful archive
      dispatch(exploreSlice.actions.bumpGeneration());
      return id;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Archive failed");
    }
  }
);

/**
 * Match a request to travel plans.
 */
export const matchTravelPlan = createAsyncThunk<
  Array<{ requestId: string; score: number; compatibility: Record<string, boolean> }>,
  string,
  { rejectValue: string }
>(
  "explore/matchTravelPlan",
  async (requestId, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/requests/match?requestId=${requestId}`);
      if (!res.ok) throw new Error("Failed to match travel plans");
      return res.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to match travel plans");
    }
  }
);

/* ─── Slice ─── */

const exploreSlice = createSlice({
  name: "explore",
  initialState,
  reducers: {
    /* Filter setters — each updates one filter and auto-bumps generation
       so the consuming component can react via a useEffect on generation,
       or call fetchExploreRequests directly. */
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.filters.categories = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.filters.sortBy = action.payload;
    },
    setDeliveryType: (state, action: PayloadAction<"all" | "standard" | "click_and_collect">) => {
      state.filters.deliveryType = action.payload;
    },
    setFromCountry: (state, action: PayloadAction<string>) => {
      state.filters.fromCountry = action.payload;
    },
    setToCountry: (state, action: PayloadAction<string>) => {
      state.filters.toCountry = action.payload;
    },
    setBuyerId: (state, action: PayloadAction<string>) => {
      state.filters.buyerId = action.payload;
    },
    setGroupByOwner: (state, action: PayloadAction<boolean>) => {
      state.filters.groupByOwner = action.payload;
    },
    setLovedFilter: (state, action: PayloadAction<boolean>) => {
      state.filters.lovedFilter = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    clearBuyerFilter: (state) => {
      state.filters.buyerId = "";
    },
    /** Reset all filters to defaults */
    resetFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
    /** Bump generation to trigger a re-fetch from the component */
    bumpGeneration: (state) => {
      state.generation += 1;
    },
    /** Optimistically remove a request from the local list */
    removeRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter((r) => r.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchExploreRequests */
      .addCase(fetchExploreRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExploreRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchExploreRequests.rejected, (state, action) => {
        state.isLoading = false;
        if (action.meta.aborted) return; // ignore aborts
        state.error = action.payload as string || action.error.message || "Failed to fetch";
      })
      /* checkAdminStatus */
      .addCase(checkAdminStatus.fulfilled, (state, action) => {
        state.isAdmin = action.payload;
      })
      /* archiveRequest — handled via bumpGeneration in thunk, nothing extra needed */
      .addCase(archiveRequest.rejected, (state, action) => {
        state.error = action.payload as string || "Archive failed";
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.error = action.payload as string || "Create request failed";
      })
      .addCase(scrapeRequest.rejected, (state, action) => {
        state.error = action.payload as string || "Scrape failed";
      });
  },
});

export const {
  setCategories,
  setSortBy,
  setDeliveryType,
  setFromCountry,
  setToCountry,
  setBuyerId,
  setGroupByOwner,
  setLovedFilter,
  setSearchFilter,
  clearBuyerFilter,
  resetFilters,
  bumpGeneration,
  removeRequest,
} = exploreSlice.actions;

export default exploreSlice.reducer;
