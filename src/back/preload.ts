import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    log: (str: string) => ipcRenderer.send('log', str),
});
