import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface BrandSettings {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tagline?: string;
  description?: string;
  domain?: string;
}

export interface BrandState {
  settings: BrandSettings | null;
  users: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BrandState = {
  settings: null,
  users: [],
  isLoading: false,
  error: null,
};

/* ─── Thunks ─── */

export const fetchBrandSettings = createAsyncThunk<
  BrandSettings,
  void,
  { rejectValue: string }
>("brand/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/brand");
    if (!response.ok) throw new Error("Failed to fetch brand settings");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch brand settings");
  }
});

export const saveBrandSettings = createAsyncThunk<
  BrandSettings,
  Partial<BrandSettings>,
  { rejectValue: string }
>("brand/saveSettings", async (data, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to save brand settings");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to save brand settings");
  }
});

export const provisionNeon = createAsyncThunk<
  { success: boolean },
  void,
  { rejectValue: string }
>("brand/provisionNeon", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/neon/provision", { method: "POST" });
    if (!response.ok) throw new Error("Failed to provision Neon database");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to provision Neon database");
  }
});

export const fetchKycUsers = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("brand/fetchKycUsers", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/kyc");
    if (!response.ok) throw new Error("Failed to fetch KYC users");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch KYC users");
  }
});

export const handleKycAction = createAsyncThunk<
  { success: boolean },
  { userId: string; action: string },
  { rejectValue: string }
>("brand/handleKycAction", async ({ userId, action }, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId }),
    });
    if (!response.ok) throw new Error("Failed to perform KYC action");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to perform KYC action");
  }
});

/* ─── Slice ─── */

const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    clearBrandError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrandSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBrandSettings.fulfilled, (state, action: PayloadAction<BrandSettings>) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchBrandSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch brand settings";
      })
      .addCase(saveBrandSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveBrandSettings.fulfilled, (state, action: PayloadAction<BrandSettings>) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(saveBrandSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to save brand settings";
      })
      .addCase(provisionNeon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(provisionNeon.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(provisionNeon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to provision Neon database";
      })
      .addCase(fetchKycUsers.pending, (state) => {
        state.isLoading = true;
      })
       .addCase(fetchKycUsers.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchKycUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch KYC users";
      });
  },
});

export const { clearBrandError } = brandSlice.actions;
export default brandSlice.reducer;
