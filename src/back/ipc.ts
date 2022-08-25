import type { IpcMain } from 'electron';
import Logger from './utils/Logger';

export default (ipcMain: IpcMain) => {
    ipcMain.on('log', (e, args) => Logger.log(args));
    ipcMain.on('err', (e, args) => Logger.err(args));
    ipcMain.on('debug', (e, args) => Logger.debug(args));
};
