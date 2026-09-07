import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: number;
  read: boolean;
}

export interface NotificationsState {
  items: Notification[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  lastSeenTimestamp: number;
}

const initialState: NotificationsState = {
  items: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  lastSeenTimestamp: 0,
};

/* ─── Thunks ─── */

export const fetchNotifications = createAsyncThunk<
  Notification[],
  void,
  { rejectValue: string }
>("notifications/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/notifications");
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch notifications");
  }
});

export const markAsSeen = createAsyncThunk<
  { count: number },
  string[],
  { rejectValue: string }
>("notifications/markAsSeen", async (ids, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/notifications/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error("Failed to mark notifications as seen");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to mark notifications as seen");
  }
});

/* ─── Slice ─── */

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, "id" | "timestamp" | "read">>) => {
      const notification: Notification = {
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        read: false,
      };
      state.items.unshift(notification);
      state.unreadCount += 1;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((n) => n.id !== action.payload);
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.isLoading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch notifications";
      })
      .addCase(markAsSeen.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(markAsSeen.fulfilled, (state, action: PayloadAction<{ count: number }>) => {
        state.isLoading = false;
        state.unreadCount = Math.max(0, state.unreadCount - action.payload.count);
        state.items.forEach((n) => {
          if (!n.read) n.read = true;
        });
      })
      .addCase(markAsSeen.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to mark notifications as seen";
      });
  },
});

export const { addNotification, removeNotification, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
