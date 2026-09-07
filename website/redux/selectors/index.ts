import { RootState } from "../store";
import { ExploreState, ExploreRequest } from "../slices/explore.slice";

/* ─── Explore Selectors ─── */

export const selectExploreState = (state: RootState) => state.explore;

export const selectExploreRequests = (state: RootState) =>
  state.explore.requests;

export const selectExploreFilters = (state: RootState) =>
  state.explore.filters;

export const selectExploreIsLoading = (state: RootState) =>
  state.explore.isLoading;

export const selectExploreError = (state: RootState) => state.explore.error;

export const selectExploreIsAdmin = (state: RootState) => state.explore.isAdmin;

export const selectExploreMatchResults = (state: RootState) =>
  state.explore.matchResults;

export const selectExploreFilteredRequests = (state: RootState) => {
  const { requests, filters } = state.explore;
  let filtered = [...requests];

  if (filters.categories.length > 0 && filters.categories[0] !== "All") {
    filtered = filtered.filter((r) =>
      filters.categories.includes(r.category ?? "")
    );
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        (r as any).description?.toLowerCase().includes(q)
    );
  }

  if (filters.fromCountry) {
    filtered = filtered.filter((r) => r.fromCountry === filters.fromCountry);
  }

  if (filters.toCountry) {
    filtered = filtered.filter((r) => r.toCountry === filters.toCountry);
  }

  if (filters.deliveryType && filters.deliveryType !== "all") {
    filtered = filtered.filter((r) => r.deliveryType === filters.deliveryType);
  }

  return filtered;
};

/* ─── Auth Selectors ─── */

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthIsLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthWalletAddress = (state: RootState) =>
  state.auth.walletAddress;
export const selectAuthIsWalletConnected = (state: RootState) =>
  state.auth.walletConnected;
export const selectAuthSessionChecked = (state: RootState) =>
  state.auth.sessionChecked;
export const selectAuthError = (state: RootState) => state.auth.error;

/* ─── Orders Selectors ─── */

export const selectOrdersItems = (state: RootState) => state.orders.items;
export const selectOrdersCurrent = (state: RootState) => state.orders.currentOrder;
export const selectOrdersIsLoading = (state: RootState) => state.orders.isLoading;
export const selectOrdersError = (state: RootState) => state.orders.error;

/* ─── Requests Selectors ─── */

export const selectRequestsItems = (state: RootState) => state.requests.items;
export const selectRequestsCurrent = (state: RootState) => state.requests.currentRequest;
export const selectRequestsIsLoading = (state: RootState) => state.requests.isLoading;
export const selectRequestsError = (state: RootState) => state.requests.error;

/* ─── Wallet Selectors ─── */

export const selectWalletBalance = (state: RootState) => state.wallet.balance;
export const selectWalletTransactions = (state: RootState) =>
  state.wallet.transactions;
export const selectWalletIsLoading = (state: RootState) => state.wallet.isLoading;
export const selectWalletError = (state: RootState) => state.wallet.error;

/* ─── UI Selectors ─── */

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectModalOpen = (state: RootState) => state.ui.modalOpen;
export const selectModalContent = (state: RootState) => state.ui.modalContent;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectSearchQuery = (state: RootState) => state.ui.searchQuery;
export const selectNotificationDrawerOpen = (state: RootState) =>
  state.ui.notificationDrawerOpen;
export const selectLastSeenNotificationTimestamp = (state: RootState) =>
  state.ui.lastSeenNotificationTimestamp;

/* ─── Web3 Selectors ─── */

export const selectWeb3AppKitReady = (state: RootState) => state.web3.appKitReady;
export const selectWeb3ConnectDropdownOpen = (state: RootState) =>
  state.web3.connectDropdownOpen;
export const selectWeb3Address = (state: RootState) => state.web3.address;
export const selectWeb3IsConnected = (state: RootState) => state.web3.isConnected;
export const selectWeb3ConnectorName = (state: RootState) => state.web3.connectorName;

/* ─── Brand Selectors ─── */

export const selectBrandSettings = (state: RootState) => state.brand.settings;
export const selectBrandIsLoading = (state: RootState) => state.brand.isLoading;
export const selectBrandError = (state: RootState) => state.brand.error;

/* ─── Theme Settings Selectors ─── */

export const selectThemeSettings = (state: RootState) => state.theme.settings;
export const selectThemeIsLoading = (state: RootState) => state.theme.isLoading;
export const selectThemeError = (state: RootState) => state.theme.error;

/* ─── Deliveries Selectors ─── */

export const selectDeliveriesItems = (state: RootState) => state.deliveries.items;
export const selectDeliveriesCurrent = (state: RootState) =>
  state.deliveries.currentDelivery;
export const selectDeliveriesIsLoading = (state: RootState) =>
  state.deliveries.isLoading;
export const selectDeliveriesError = (state: RootState) => state.deliveries.error;

/* ─── Trips Selectors ─── */

export const selectTripsItems = (state: RootState) => state.trips.items;
export const selectTripsCurrent = (state: RootState) => state.trips.currentPlan;
export const selectTripsIsLoading = (state: RootState) => state.trips.isLoading;
export const selectTripsError = (state: RootState) => state.trips.error;
export const selectTripsMatchResults = (state: RootState) => state.trips.matchResults;

/* ─── Chat Selectors ─── */

export const selectChatConversations = (state: RootState) => state.chat.conversations;
export const selectChatCurrentConversation = (state: RootState) =>
  state.chat.currentConversation;
export const selectChatMessages = (state: RootState) => state.chat.messages;
export const selectChatIsLoading = (state: RootState) => state.chat.isLoading;
export const selectChatError = (state: RootState) => state.chat.error;

/* ─── Notifications Selectors ─── */

export const selectNotificationsItems = (state: RootState) => state.notifications.items;
export const selectNotificationsUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectNotificationsIsLoading = (state: RootState) => state.notifications.isLoading;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectNotificationsLastSeenTimestamp = (state: RootState) => state.notifications.lastSeenTimestamp;

/* ─── Profile Selectors ─── */

export const selectProfile = (state: RootState) => state.profile.profile;
export const selectProfileIsLoading = (state: RootState) => state.profile.isLoading;
export const selectProfileError = (state: RootState) => state.profile.error;
export const selectProfileKycStatus = (state: RootState) => state.profile.kycStatus;
export const selectProfileOrdersCount = (state: RootState) => state.profile.ordersCount;
export const selectProfileRequestsCount = (state: RootState) => state.profile.requestsCount;
/* ─── Admin Selectors ─── */

export const selectIsAdmin = (state: RootState) => state.explore.isAdmin;
