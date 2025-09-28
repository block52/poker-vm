const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
    settings: {
        addNode: (nodeUrl) => ipcRenderer.invoke("settings:addNode", nodeUrl),
        getNodes: () => ipcRenderer.invoke("settings:getNodes"),
        toggleVPN: () => ipcRenderer.invoke("settings:toggleVPN"),
        getAll: () => ipcRenderer.invoke("settings:getAll"),
        updateConnectedNodes: (count) => ipcRenderer.invoke("settings:updateConnectedNodes", count)
    }
});

console.log("Preload script loaded - electronAPI exposed to renderer");