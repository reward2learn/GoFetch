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

      return response.json();
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
    payload: {
      pickupAddress: string;
      deliveryAddress: string;
      packageDescription?: string;
    },
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
      });
  },
});

export const { setCurrentOrder, clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
