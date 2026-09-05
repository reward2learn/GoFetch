import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  user: {
    id: string;
    walletAddress: string;
    email?: string;
    name?: string;
    role?: string;
    avatarUrl?: string;
    acceptedTermsAt?: string | null;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionChecked: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  sessionChecked: false,
  walletConnected: false,
  walletAddress: null,
  error: null,
};

/**
 * Check existing JWT session cookie on mount.
 * If valid → set user + isAuthenticated + sessionChecked.
 * If invalid → set sessionChecked only.
 */
export const checkSession = createAsyncThunk<
  { user: AuthState["user"] },
  void,
  { rejectValue: string }
>(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return rejectWithValue("No session");
      const user = await res.json();
      return { user };
    } catch {
      return rejectWithValue("No session");
    }
  }
);

/**
 * Sign-in thunk: nonce → SIWE signature → verify → JWT.
 * Falls back to direct login if SIWE signing fails (e.g. social login connectors).
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
      // 1. Get nonce from server
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        signal: controller.signal,
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      // 2. Create SIWE message
      const message = `gofetch.app wants you to sign in with your Ethereum account:\n${address}\n\nSign in to GoFetch\n\nURI: https://gofetch.app\nVersion: 1\nChain ID: 11155111\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`;

      // 3. Try to sign message — may fail for social login connectors
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (signErr) {
        console.warn("[signInWithWallet] SIWE signing failed, falling back to direct login:", signErr);
        // Social login connectors don't support signMessageAsync
        // Fall back to direct login (no SIWE signature needed)
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
          signal: controller.signal,
        });
        if (!loginRes.ok) throw new Error("Login failed");
        const { token, user } = await loginRes.json();
        clearTimeout(timeout);
        dispatch(setCredentials({ user, token }));
        return { user, token };
      }

      // 4. Verify with server (SIWE path)
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
      
      // Detect user rejection from wallet (common error patterns)
      const errMsg = err instanceof Error ? err.message : String(err);
      const isUserRejected = 
        errMsg.includes("User rejected") ||
        errMsg.includes("user rejected") ||
        errMsg.includes("denied") ||
        errMsg.includes("rejected") ||
        errMsg.includes("Request rejected") ||
        errMsg.includes("ACTION_REJECTED") ||
        errMsg.includes("getChainId is not a function") ||
        (err as any)?.code === 4001 ||
        (err as any)?.code === "ACTION_REJECTED";
      
      if (isUserRejected) {
        return rejectWithValue("Sign-in cancelled. Please try again when ready.");
      }
      
      return rejectWithValue(errMsg || "Sign-in failed");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => true);

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
      // checkSession
      .addCase(checkSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.sessionChecked = true;
      })
      .addCase(checkSession.rejected, (state) => {
        state.isLoading = false;
        state.sessionChecked = true;
      })
      // signInWithWallet
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
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.sessionChecked = false;
        state.walletConnected = false;
        state.walletAddress = null;
      });
  },
});

export const { setUser, setCredentials, walletConnected, walletDisconnected, clearError } = authSlice.actions;
export default authSlice.reducer;
