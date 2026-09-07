import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/auth.slice";
import ordersReducer from "./slices/orders.slice";
import requestsReducer from "./slices/requests.slice";
import walletReducer from "./slices/wallet.slice";
import uiReducer from "./slices/ui.slice";
import web3Reducer from "./slices/web3.slice";
import exploreReducer from "./slices/explore.slice";
import brandReducer from "./slices/brand.slice";
import themeReducer from "./slices/theme.slice";
import deliveriesReducer from "./slices/deliveries.slice";
import tripsReducer from "./slices/trips.slice";
import chatReducer from "./slices/chat.slice";
import notificationsReducer from "./slices/notifications.slice";
import profileReducer from "./slices/profile.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  orders: ordersReducer,
  requests: requestsReducer,
  wallet: walletReducer,
  ui: uiReducer,
  web3: web3Reducer,
  explore: exploreReducer,
  brand: brandReducer,
  theme: themeReducer,
  deliveries: deliveriesReducer,
  trips: tripsReducer,
  chat: chatReducer,
  notifications: notificationsReducer,
  profile: profileReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
  });

export const store = makeStore();
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
