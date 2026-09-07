import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ─── Types ─── */

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  updatedAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

/* ─── Thunks ─── */

export const fetchConversations = createAsyncThunk<
  Conversation[],
  void,
  { rejectValue: string }
>("chat/fetchConversations", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/chat/conversations");
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch conversations");
  }
});

export const fetchMessages = createAsyncThunk<
  ChatMessage[],
  string,
  { rejectValue: string }
>("chat/fetchMessages", async (convId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/chat/${convId}/messages`);
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch messages");
  }
});

export const sendMessage = createAsyncThunk<
  ChatMessage,
  { conversationId: string; content: string },
  { rejectValue: string }
>("chat/sendMessage", async ({ conversationId, content }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/chat/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to send message");
  }
});

/* ─── Slice ─── */

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearChatError: (state) => {
      state.error = null;
    },
    addMessageOptimistic: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
      if (conv) {
        conv.lastMessage = action.payload.content;
        conv.updatedAt = action.payload.timestamp;
      }
    },
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch conversations";
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<ChatMessage[]>) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch messages";
      })
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        state.isLoading = false;
        state.messages.push(action.payload);
        const conv = state.conversations.find(
          (c) => c.id === action.payload.conversationId
        );
        if (conv) {
          conv.lastMessage = action.payload.content;
          conv.updatedAt = action.payload.timestamp;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to send message";
      });
  },
});

export const { clearChatError, addMessageOptimistic, setCurrentConversation, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
