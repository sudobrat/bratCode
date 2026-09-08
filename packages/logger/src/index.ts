export const log = (...args: unknown[]): void => {
    const timeString = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    // eslint-disable-next-line no-console -- logger
    console.log("LOGGER: ", ...args, " ", timeString);
};
