import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.ts";
import projectReducer from "./projectSlice.ts";

export const store = configureStore({
    reducer: {
        user: userReducer,
        project: projectReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
