import { SessionUserSchema } from "@bratCode/zod";
import api from "../utils/axios.ts";

export const me = async () => {
    try {
        const { data } = await api.get("/api/me");
        return SessionUserSchema.parse(data);
    } catch (err) {
        console.log(err);
        return null;
    }
};
