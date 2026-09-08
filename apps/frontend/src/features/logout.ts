import api from "../utils/axios.ts";

export const logout = async () => {
    try {
        const { data } = await api.get("/api/auth/logout");
        return data;
    } catch (err) {
        console.log(err);
        return null;
    }
};
