import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // Example API method to communicate with the main process
    sendMessage: (channel: string, data: any) => {
        ipcRenderer.send(channel, data);
    },
    receiveMessage: (channel: string, func: (data: any) => void) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
});