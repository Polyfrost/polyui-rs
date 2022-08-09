import type { IpcMain } from 'electron';

export default (ipcMain: IpcMain) => {
    ipcMain.on('log', (e, args) => {
        console.log(args);
    });
};
