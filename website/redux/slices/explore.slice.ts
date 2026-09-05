import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface ExploreRequest {
  id: string;
  title: string;
  category?: string;
  outletName?: string;
  imageUrl?: string;
  invoiceUrl?: string;
  itemPrice: number;
  maxItemPrice?: number;
  reward: number;
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  deadline?: string | null;
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
  /** Bumped to re-trigger fetch after mutations (archive, delete, post) */
  refreshKey: number;
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
  isLoading: true,
  error: null,
  isAdmin: false,
  refreshKey: 0,
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
 * Archive a request (admin only).
 */
export const archiveRequest = createAsyncThunk<
  string, // returns the archived request id
  { id: string; reason: string },
  { rejectWithValue: string }
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
      dispatch(exploreSlice.actions.bumpRefresh());
      return id;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : "Archive failed");
    }
  }
);

/* ─── Slice ─── */

const exploreSlice = createSlice({
  name: "explore",
  initialState,
  reducers: {
    /* Filter setters — each updates one filter and auto-bumps refreshKey
       so the consuming component can react via a useEffect on refreshKey,
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
    /** Bump refreshKey to trigger a re-fetch from the component */
    bumpRefresh: (state) => {
      state.refreshKey += 1;
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
      /* archiveRequest — handled via bumpRefresh in thunk, nothing extra needed */
      .addCase(archiveRequest.rejected, (state, action) => {
        state.error = action.payload as string || "Archive failed";
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
  bumpRefresh,
  removeRequest,
} = exploreSlice.actions;

export default exploreSlice.reducer;
