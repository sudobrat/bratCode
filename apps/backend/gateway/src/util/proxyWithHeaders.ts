import type { RequestHandler } from "express";
import proxy from "express-http-proxy";

export const proxyWithHeader = (serviceUrl: string): RequestHandler => {
    return proxy(serviceUrl, {
        proxyReqOptDecorator: (proxyReqOpts, req) => {
            if (req.user) {
                proxyReqOpts.headers["x-user-id"] = req.user?._id;
            }
            return proxyReqOpts;
        },
    });
};