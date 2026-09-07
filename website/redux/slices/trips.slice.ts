import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface TravelPlan {
  id: string;
  userId: string;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  departDate: string;
  returnDate?: string;
  note?: string;
  capacity: number;
  status: "active" | "full" | "completed" | "cancelled";
  matchedRequests?: string[];
  createdAt: string;
}

export interface TravelPlanState {
  items: TravelPlan[];
  currentPlan: TravelPlan | null;
  isLoading: boolean;
  error: string | null;
  matchResults: Array<{
    requestId: string;
    score: number;
    compatibility: Record<string, boolean>;
  }>;
}

const initialState: TravelPlanState = {
  items: [],
  currentPlan: null,
  isLoading: false,
  error: null,
  matchResults: [],
};

/* ─── Thunks ─── */

export const fetchMyTravelPlans = createAsyncThunk<
  TravelPlan[],
  void,
  { rejectValue: string }
>("trips/fetchMyPlans", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/travel-plans/mine");
    if (!response.ok) throw new Error("Failed to fetch travel plans");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch travel plans");
  }
});

export const fetchAllTravelPlans = createAsyncThunk<
  TravelPlan[],
  void,
  { rejectValue: string }
>("trips/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/travel-plans");
    if (!response.ok) throw new Error("Failed to fetch travel plans");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch travel plans");
  }
});

export const createTravelPlan = createAsyncThunk<
  TravelPlan,
  Partial<TravelPlan>,
  { rejectValue: string }
>("trips/create", async (data, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/travel-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create travel plan");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to create travel plan");
  }
});

export const updateTravelPlan = createAsyncThunk<
  TravelPlan,
  { id: string; data: Partial<TravelPlan> },
  { rejectValue: string }
>("trips/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/travel-plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update travel plan");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update travel plan");
  }
});

export const deleteTravelPlan = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>("trips/delete", async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/travel-plans/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete travel plan");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to delete travel plan");
  }
});

export const matchTravelPlan = createAsyncThunk<
  Array<{ requestId: string; score: number; compatibility: Record<string, boolean> }>,
  string,
  { rejectValue: string }
>("trips/match", async (planId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/requests/match?planId=${planId}`);
    if (!response.ok) throw new Error("Failed to match travel plan");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to match travel plan");
  }
});

/* ─── Slice ─── */

const tripsSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    clearTripsError: (state) => {
      state.error = null;
    },
    clearMatchResults: (state) => {
      state.matchResults = [];
    },
    setCurrentPlan: (state, action: PayloadAction<TravelPlan | null>) => {
      state.currentPlan = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTravelPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTravelPlans.fulfilled, (state, action: PayloadAction<TravelPlan[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyTravelPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch travel plans";
      })
      .addCase(fetchAllTravelPlans.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllTravelPlans.fulfilled, (state, action: PayloadAction<TravelPlan[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllTravelPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch travel plans";
      })
      .addCase(createTravelPlan.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createTravelPlan.fulfilled, (state, action: PayloadAction<TravelPlan>) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createTravelPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create travel plan";
      })
      .addCase(updateTravelPlan.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateTravelPlan.fulfilled, (state, action: PayloadAction<TravelPlan>) => {
        state.isLoading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.currentPlan = action.payload;
      })
      .addCase(updateTravelPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update travel plan";
      })
      .addCase(deleteTravelPlan.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteTravelPlan.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.isLoading = false;
        state.items = state.items.filter((p) => p.id !== action.payload.id);
      })
      .addCase(deleteTravelPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete travel plan";
      })
      .addCase(matchTravelPlan.pending, (state) => {
        state.isLoading = true;
        state.matchResults = [];
      })
      .addCase(matchTravelPlan.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchResults = action.payload;
      })
      .addCase(matchTravelPlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to match travel plan";
      });
  },
});

export const { clearTripsError, clearMatchResults, setCurrentPlan } = tripsSlice.actions;
export default tripsSlice.reducer;
