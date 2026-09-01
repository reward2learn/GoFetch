import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/auth.slice";
import ordersReducer from "./slices/orders.slice";
import requestsReducer from "./slices/requests.slice";
import walletReducer from "./slices/wallet.slice";
import uiReducer from "./slices/ui.slice";
import web3Reducer from "./slices/web3.slice";

const rootReducer = combineReducers({
  auth: authReducer,
  orders: ordersReducer,
  requests: requestsReducer,
  wallet: walletReducer,
  ui: uiReducer,
  web3: web3Reducer,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
