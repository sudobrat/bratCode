import api from "../utils/axios";

export const createPayment = async (
    plan: string,
): Promise<{
    key_id: string;
    order: {
        id: string;
        amount: number;
        currency: string;
    };
    plan: {
        name: string;
        credits: number;
    };
} | null> => {
    try {
        const { data } = await api.post("/api/payment/create", { plan });
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const verifyPayment = async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}) => {
    try {
        const { data } = await api.post("/api/payment/verify", {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });
        return data;
    } catch (error) {
        console.log(error);
        return null;
    }
};
