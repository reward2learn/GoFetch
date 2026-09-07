import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface Profile {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  passportFullName?: string;
  passportDocumentNo?: string;
  passportNationality?: string;
  passportDateOfBirth?: string;
  passportSex?: string;
  passportExpiryDate?: string;
  passportDateOfIssue?: string;
  passportPlaceOfBirth?: string;
  passportImageUrl?: string;
  acceptedTermsAt?: string | null;
  kycStatus?: string;
  kycSubmittedAt?: string | null;
  role?: string;
}

export interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  kycStatus: string;
  ordersCount: number;
  requestsCount: number;
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  kycStatus: "none",
  ordersCount: 0,
  requestsCount: 0,
};

/* ─── Thunks ─── */

export const fetchProfile = createAsyncThunk<
  Profile,
  void,
  { rejectValue: string }
>("profile/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/profile");
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch profile");
  }
});

export const updateProfile = createAsyncThunk<
  Profile,
  Partial<Profile>,
  { rejectValue: string }
>("profile/update", async (data, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update profile");
  }
});

export const uploadPassport = createAsyncThunk<
  Profile,
  { file: File },
  { rejectValue: string }
>("profile/uploadPassport", async ({ file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("passport", file);
    const response = await fetch("/api/scan/passport", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to scan passport");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to scan passport");
  }
});

export const submitKyc = createAsyncThunk<
  Profile,
  void,
  { rejectValue: string }
>("profile/submitKyc", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/kyc/submit", { method: "POST" });
    if (!response.ok) throw new Error("Failed to submit KYC");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to submit KYC");
  }
});

export const checkKycStatus = createAsyncThunk<
  { kycStatus: string },
  void,
  { rejectValue: string }
>("profile/checkKyc", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/kyc/check");
    if (!response.ok) throw new Error("Failed to check KYC status");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to check KYC status");
  }
});

export const fetchOrderCounts = createAsyncThunk<
  { orders: number; requests: number },
  void,
  { rejectValue: string }
>("profile/fetchOrderCounts", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error("Failed to fetch order counts");
    const orders = await response.json();
    return { orders: orders.length, requests: orders.length };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch order counts");
  }
});

/* ─── Slice ─── */

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    resetProfile: (state) => {
      state.profile = null;
      state.kycStatus = "none";
      state.ordersCount = 0;
      state.requestsCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.kycStatus = action.payload.kycStatus ?? "none";
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch profile";
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update profile";
      })
      .addCase(uploadPassport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadPassport.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(uploadPassport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to scan passport";
      })
      .addCase(submitKyc.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(submitKyc.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.kycStatus = action.payload.kycStatus ?? "pending";
      })
      .addCase(submitKyc.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to submit KYC";
      })
      .addCase(checkKycStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkKycStatus.fulfilled, (state, action: PayloadAction<{ kycStatus: string }>) => {
        state.isLoading = false;
        state.kycStatus = action.payload.kycStatus;
      })
      .addCase(checkKycStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to check KYC status";
      })
      .addCase(fetchOrderCounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrderCounts.fulfilled, (state, action: PayloadAction<{ orders: number; requests: number }>) => {
        state.isLoading = false;
        state.ordersCount = action.payload.orders;
        state.requestsCount = action.payload.requests;
      })
      .addCase(fetchOrderCounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch order counts";
      });
  },
});

export const { clearProfileError, resetProfile } = profileSlice.actions;
export default profileSlice.reducer;
