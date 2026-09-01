import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface DeliveryRequest {
  id: string;
  orderId: string;
  driverId?: string;
  status: string;
  proposedCost?: number;
  acceptedCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestsState {
  items: DeliveryRequest[];
  currentRequest: DeliveryRequest | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RequestsState = {
  items: [],
  currentRequest: null,
  isLoading: false,
  error: null,
};

export const fetchRequests = createAsyncThunk(
  "requests/fetchRequests",
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch("/api/requests");

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch requests"
      );
    }
  }
);

export const acceptRequest = createAsyncThunk(
  "requests/acceptRequest",
  async (
    payload: { requestId: string; cost: number },
    { rejectWithValue }
  ) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch(
        `/api/requests/${payload.requestId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cost: payload.cost }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to accept request");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to accept request"
      );
    }
  }
);

const requestsSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    setCurrentRequest: (state, action: PayloadAction<DeliveryRequest | null>) => {
      state.currentRequest = action.payload;
    },
    clearRequestsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(
          (r) => r.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(acceptRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentRequest, clearRequestsError } = requestsSlice.actions;
export default requestsSlice.reducer;
