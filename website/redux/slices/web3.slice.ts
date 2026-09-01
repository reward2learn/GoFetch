import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Web3State {
  /** Whether Reown AppKit has been initialized */
  appKitReady: boolean;
  /** Whether the wallet connect dropdown is open */
  connectDropdownOpen: boolean;
  /** Connected wallet address (synced from wagmi useAccount) */
  address: string | null;
  /** Whether a wallet is connected */
  isConnected: boolean;
  /** Name of the active connector */
  connectorName: string | null;
}

const initialState: Web3State = {
  appKitReady: false,
  connectDropdownOpen: false,
  address: null,
  isConnected: false,
  connectorName: null,
};

const web3Slice = createSlice({
  name: "web3",
  initialState,
  reducers: {
    setAppKitReady: (state, action: PayloadAction<boolean>) => {
      state.appKitReady = action.payload;
    },
    toggleConnectDropdown: (state) => {
      state.connectDropdownOpen = !state.connectDropdownOpen;
    },
    setConnectDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.connectDropdownOpen = action.payload;
    },
    setWalletConnected: (
      state,
      action: PayloadAction<{ address: string; connectorName: string }>
    ) => {
      state.isConnected = true;
      state.address = action.payload.address;
      state.connectorName = action.payload.connectorName;
      state.connectDropdownOpen = false;
    },
    setWalletDisconnected: (state) => {
      state.isConnected = false;
      state.address = null;
      state.connectorName = null;
    },
    /** Sync from wagmi useAccount — call on every wagmi state change */
    syncWagmiAccount: (
      state,
      action: PayloadAction<{
        address: string | undefined;
        isConnected: boolean;
      }>
    ) => {
      state.isConnected = action.payload.isConnected;
      state.address = action.payload.address ?? null;
      if (!action.payload.isConnected) {
        state.connectorName = null;
      }
    },
  },
});

export const {
  setAppKitReady,
  toggleConnectDropdown,
  setConnectDropdownOpen,
  setWalletConnected,
  setWalletDisconnected,
  syncWagmiAccount,
} = web3Slice.actions;

export default web3Slice.reducer;
