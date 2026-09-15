import axios from "axios";
import { env } from "../config/env";
export const addCredits = async ({ userId, credits }: { userId: string; credits: number }) => {
    try {
        const { data } = await axios.post(`${env.AUTH_SERVICE}/user/add-credits`, { userId, credits });
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
};
