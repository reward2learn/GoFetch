import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  user: {
    id: string;
    walletAddress: string;
    email?: string;
    name?: string;
    role?: string;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  walletConnected: false,
  walletAddress: null,
  error: null,
};

/**
 * Sign-in thunk: nonce → SIWE signature → verify → JWT.
 * Handles AbortController + timeout internally.
 * Dispatched by the login page or ConnectButton when wallet connects.
 */
export const signInWithWallet = createAsyncThunk<
  { user: AuthState["user"]; token: string },
  { address: string; signMessageAsync: (msg: { message: string }) => Promise<string> },
  { rejectValue: string }
>(
  "auth/signInWithWallet",
  async ({ address, signMessageAsync }, { dispatch, rejectWithValue }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        signal: controller.signal,
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      const message = `gofetch.app wants you to sign in with your Ethereum account:\n${address}\n\nSign in to GoFetch\n\nURI: https://gofetch.app\nVersion: 1\nChain ID: 84532\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

      const signature = await signMessageAsync({ message });

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
        signal: controller.signal,
      });
      if (!verifyRes.ok) throw new Error("Verification failed");
      const { token, user } = await verifyRes.json();

      clearTimeout(timeout);
      dispatch(setCredentials({ user, token }));
      return { user, token };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        return rejectWithValue("Sign-in timed out");
      }
      return rejectWithValue(err instanceof Error ? err.message : "Sign-in failed");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthState["user"]; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    walletConnected: (state, action: PayloadAction<string>) => {
      state.walletConnected = true;
      state.walletAddress = action.payload;
    },
    walletDisconnected: (state) => {
      state.walletConnected = false;
      state.walletAddress = null;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInWithWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithWallet.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signInWithWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.walletConnected = false;
        state.walletAddress = null;
      });
  },
});

export const { setUser, setCredentials, walletConnected, walletDisconnected, clearError } = authSlice.actions;
export default authSlice.reducer;
