import * as remoteMain from '@electron/remote/main';
import {
    app, BrowserWindow, ipcMain, powerSaveBlocker,
} from 'electron';
import path from 'path';
import serve from 'electron-serve';
import { navigate } from 'svelte-routing';
import ipcHandler from './ipc';

remoteMain.initialize();

const loadURL = serve({ directory: 'public' });
const dev = !app.isPackaged || !!process.env.DEVELOPMENT;
let mainWindow: BrowserWindow | null;

// args for the app uwu
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--lang', 'en-US');
app.disableHardwareAcceleration();
app.setAsDefaultProtocolClient('onecube');
if (!app.requestSingleInstanceLock()) app.quit();
powerSaveBlocker.start('prevent-display-sleep');

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        transparent: process.platform === 'darwin',
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            devTools: dev,
        },
        icon: path.join(__dirname, 'public/favicon.png'),
        show: false,
    });

    mainWindow.setMaximizable(!1);

    remoteMain.enable(mainWindow.webContents);

    ipcHandler(ipcMain);

    if (dev) {
        (process.env.ELECTRON_DISABLE_SECURITY_WARNINGS as unknown as boolean) = true;
        mainWindow.webContents.openDevTools();
        mainWindow.loadURL('http://localhost:5000/');
    } else {
        loadURL(mainWindow);
    }

    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.once('ready-to-show', () => { mainWindow.show(); });
};

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('ready', createMainWindow);
app.on('activate', () => { if (mainWindow === null) createMainWindow(); });

app.on('open-url', (e, url) => {
    try {
        if (url.startsWith('/')) {
            url = url.substr(1);
        }

        if (mainWindow) {
            navigate(`/${url.replace('onecube://', '').replace('/', '')}`);
            mainWindow.show();
        }
    // eslint-disable-next-line no-empty
    } catch (e) {}
});

app.on('second-instance', (event, argv) => {
    try {
        argv.forEach((arg) => {
            if (arg.startsWith('onecube://')) {
                if (mainWindow) {
                    navigate(`/${arg.replace('onecube://', '').replace('/', '')}`);
                    mainWindow.show();
                }
            }
        });
    // eslint-disable-next-line no-empty
    } catch (e) {}
});

export {
    dev,
};
