import { ipcRenderer } from 'electron';

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    const statusLabel = document.getElementById('status-label');

    startButton?.addEventListener('click', () => {
        ipcRenderer.send('start-bot');
        statusLabel!.innerText = 'Bot is running...';
    });

    stopButton?.addEventListener('click', () => {
        ipcRenderer.send('stop-bot');
        statusLabel!.innerText = 'Bot has stopped.';
    });
});