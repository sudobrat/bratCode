import type { SessionUser } from "@bratCode/zod";

declare global {
    namespace Express {
        interface Request {
            user?: SessionUser;
        }
    }
}
