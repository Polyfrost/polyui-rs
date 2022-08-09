import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import serve from 'electron-serve';
import ipcHandler from './ipc';

const loadURL = serve({ directory: 'public' });
const dev = !app.isPackaged;
let mainWindow: BrowserWindow | null;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            devTools: dev,
        },
        icon: path.join(__dirname, 'public/favicon.png'),
        show: false,
    });

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

export {
    dev,
};
