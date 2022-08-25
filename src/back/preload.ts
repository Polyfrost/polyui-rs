import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    log: (str: string) => ipcRenderer.send('log', str),
    err: (str: string) => ipcRenderer.send('err', str),
    debug: (str: string) => ipcRenderer.send('debug', str),
});
