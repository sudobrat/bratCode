import axios from "axios";
import { env } from "../config/env";

export const deductCredits = async ({ userId, amount }: { userId: string; amount: number }) => {
    try {
        const { data } = await axios.post(`${env.AUTH_SERVICE}/user/deduct-credits`, { userId, amount });
        return { success: true, data };
    } catch (error: any) {
        console.log(error);
        return { success: false, error: error?.response?.data?.message || "Failed to deduct credits" };
    }
};
