// Browser polyfills for Node.js modules used by Cosmos SDK
import { Buffer } from "buffer";

// Make Buffer globally available
if (typeof window !== "undefined") {
    window.global = window.global || window;
    window.Buffer = window.Buffer || Buffer;
    window.process = window.process || {
        env: {},
        browser: true,
        version: "",
        versions: { node: "16.0.0" }
    };
}

// Export for module usage
export { Buffer };
export const global = globalThis;
export const process = {
    env: {},
    browser: true,
    version: "",
    versions: { node: "16.0.0" }
};