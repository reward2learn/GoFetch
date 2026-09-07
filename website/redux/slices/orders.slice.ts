import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Order {
  id: string;
  userId: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription?: string;
  estimatedCost?: number;
  finalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersState {
  items: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch("/api/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch orders"
      );
    }
  }
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (
    payload: Record<string, any>,
    { rejectWithValue }
  ) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create order"
      );
    }
  }
);

export const updateRequest = createAsyncThunk<
  Order,
  { id: string; data: Record<string, any> },
  { rejectValue: string }
>("orders/updateRequest", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update request");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update request");
  }
});

export const deleteRequest = createAsyncThunk<
  { id: string },
  string,
  { rejectValue: string }
>("orders/deleteRequest", async (id, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/requests/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete request");
    return { id };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to delete request");
  }
});

/* ─── Slice ─── */

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    clearOrdersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRequest.fulfilled, (state, action: PayloadAction<Order>) => {
        state.isLoading = false;
        const index = state.items.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteRequest.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.items = state.items.filter((o) => o.id !== action.payload.id);
      })
  },
});

export const { setCurrentOrder, clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
