import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/auth/authApi";
import authReducer from "@/features/auth/authSlice";
import adminReducer from "@/features/admin/adminSlice";
import procurementReducer from "@/features/procurement/procurementSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    procurement: procurementReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
