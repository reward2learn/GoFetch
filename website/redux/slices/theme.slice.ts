import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  borderRadius: string;
  logoUrl?: string;
}

export interface ThemeState {
  settings: ThemeSettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ThemeState = {
  settings: null,
  isLoading: false,
  error: null,
};

/* ─── Thunks ─── */

export const fetchThemeSettings = createAsyncThunk<
  ThemeSettings,
  void,
  { rejectValue: string }
>("theme/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/brand");
    if (!response.ok) throw new Error("Failed to fetch theme settings");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch theme settings");
  }
});

export const saveThemeSettings = createAsyncThunk<
  ThemeSettings,
  Partial<ThemeSettings>,
  { rejectValue: string }
>("theme/saveSettings", async (data, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/admin/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to save theme settings");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to save theme settings");
  }
});

/* ─── Slice ─── */

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    clearThemeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThemeSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThemeSettings.fulfilled, (state, action: PayloadAction<ThemeSettings>) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchThemeSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch theme settings";
      })
      .addCase(saveThemeSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveThemeSettings.fulfilled, (state, action: PayloadAction<ThemeSettings>) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(saveThemeSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to save theme settings";
      });
  },
});

export const { clearThemeError } = themeSlice.actions;
export default themeSlice.reducer;
