import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface WalletTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  txHash?: string;
  status: string;
  createdAt: string;
}

export interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  isLoading: false,
  error: null,
};

export const fetchBalance = createAsyncThunk(
  "wallet/fetchBalance",
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch("/api/wallet/balance");

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch balance"
      );
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "wallet/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement actual API call
      const response = await fetch("/api/wallet/transactions");

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      return response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch transactions"
      );
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    addTransaction: (state, action: PayloadAction<WalletTransaction>) => {
      state.transactions.unshift(action.payload);
    },
    clearWalletError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.balance;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateBalance, addTransaction, clearWalletError } =
  walletSlice.actions;
export default walletSlice.reducer;
