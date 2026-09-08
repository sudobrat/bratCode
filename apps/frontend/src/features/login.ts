import { SessionUserSchema } from "@bratCode/zod";
import api from "../utils/axios.ts";

export const login = async (token: string) => {
    try {
        const { data } = await api.post("/api/auth/login", { token });
        return SessionUserSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};
