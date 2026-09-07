import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface Delivery {
  id: string;
  requestId: string;
  orderId?: string;
  travelerId?: string;
  buyerId?: string;
  status: "pending" | "accepted" | "in_transit" | "delivered" | "completed" | "cancelled";
  pickupLocation?: string;
  deliveryAddress?: string;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveriesState {
  items: Delivery[];
  currentDelivery: Delivery | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DeliveriesState = {
  items: [],
  currentDelivery: null,
  isLoading: false,
  error: null,
};

/* ─── Thunks ─── */

export const fetchDeliveries = createAsyncThunk<
  Delivery[],
  void,
  { rejectValue: string }
>("deliveries/fetchDeliveries", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/deliveries");
    if (!response.ok) throw new Error("Failed to fetch deliveries");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch deliveries");
  }
});

export const fetchDeliveryById = createAsyncThunk<
  Delivery,
  string,
  { rejectValue: string }
>("deliveries/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/deliveries/${id}`);
    if (!response.ok) throw new Error("Failed to fetch delivery");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch delivery");
  }
});

export const updateDeliveryStatus = createAsyncThunk<
  Delivery,
  { id: string; status: string },
  { rejectValue: string }
>("deliveries/updateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update delivery status");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update delivery status");
  }
});

export const confirmDelivery = createAsyncThunk<
  Delivery,
  string,
  { rejectValue: string }
>("deliveries/confirm", async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (!response.ok) throw new Error("Failed to confirm delivery");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to confirm delivery");
  }
});

/* ─── Slice ─── */

const deliveriesSlice = createSlice({
  name: "deliveries",
  initialState,
  reducers: {
    clearDeliveriesError: (state) => {
      state.error = null;
    },
    removeDelivery: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((d) => d.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeliveries.fulfilled, (state, action: PayloadAction<Delivery[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchDeliveries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch deliveries";
      })
      .addCase(fetchDeliveryById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDeliveryById.fulfilled, (state, action: PayloadAction<Delivery>) => {
        state.isLoading = false;
        state.currentDelivery = action.payload;
      })
      .addCase(fetchDeliveryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch delivery";
      })
      .addCase(updateDeliveryStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateDeliveryStatus.fulfilled, (state, action: PayloadAction<Delivery>) => {
        state.isLoading = false;
        const index = state.items.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.currentDelivery = action.payload;
      })
      .addCase(updateDeliveryStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update delivery status";
      })
      .addCase(confirmDelivery.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(confirmDelivery.fulfilled, (state, action: PayloadAction<Delivery>) => {
        state.isLoading = false;
        const index = state.items.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.currentDelivery = action.payload;
      })
      .addCase(confirmDelivery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to confirm delivery";
      });
  },
});

export const { clearDeliveriesError, removeDelivery } = deliveriesSlice.actions;
export default deliveriesSlice.reducer;
