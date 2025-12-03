const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
    // App info
    getAppInfo: () => ipcRenderer.invoke("app:getInfo"),

    // Window controls
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),

    // Menu event listeners
    onMenuEvent: (callback) => {
        const events = [
            "menu:importKey",
            "menu:exportKey",
            "menu:settings",
            "menu:quickPlay",
            "menu:joinTable",
            "menu:gameHistory",
            "menu:howToPlay",
            "menu:shortcuts",
            "menu:about"
        ];

        events.forEach(event => {
            ipcRenderer.on(event, () => callback(event));
        });

        // Return cleanup function
        return () => {
            events.forEach(event => {
                ipcRenderer.removeAllListeners(event);
            });
        };
    },

    // Check if running in Electron
    isElectron: true
});

console.log("Preload script loaded - electronAPI exposed to renderer");
