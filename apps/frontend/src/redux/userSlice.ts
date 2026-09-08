import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { SessionUser } from "@bratCode/zod";

interface UserState {
    userData: SessionUser | null;
    isCheckingAuth: boolean;
}

const initialState: UserState = {
    userData: null,
    isCheckingAuth: true,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<SessionUser | null>) => {
            state.userData = action.payload;
            state.isCheckingAuth = false;
        },
        setIsCheckingAuth: (state, action: PayloadAction<boolean>) => {
            state.isCheckingAuth = action.payload;
        },
    },
});

export const { setUserData, setIsCheckingAuth } = userSlice.actions;

export default userSlice.reducer;
