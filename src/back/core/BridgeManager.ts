import { BrowserWindow } from 'electron';
import { Server } from 'procbridge';
import Logger from '../utils/Logger';

export default class BridgeManager {
    private bridge: Server;
    
    constructor() {
        this.bridge = new Server('127.0.0.1', 28190, (method, args) => {
            switch (method) {
                case 'open-window':
                    Logger.log('Opening window.');
                    new Promise(async (resolve, reject) => {
                        const devTools = args.devTools;
                        const window = new BrowserWindow({
                            width: args.width + (devTools ? 300 : 0),
                            height: args.height,
                            autoHideMenuBar: true,
                            show: false,
                            resizable: false,
                            title: 'Loading...',
                            fullscreenable: false,
                        });
                        let redirectUri = null;
                        devTools ? window.webContents.openDevTools() : window.webContents.on('devtools-opened', () => {
                            window.webContents.closeDevTools();
                        });
                        window.webContents.addListener('will-redirect', (event, url) => {
                            
                        })
                    })
                default:
                    Logger.log(`Unknown bridge method: ${method}`)
            }
        })
    }
} 

const ipcServer = new Server('127.0.0.1', 28190, (method, args) => {
    switch (method) {
        case 'open-window':
            Logger.log('Opening window.');
            new Promise(async (resolve, reject) => {
                const window = new BrowserWindow({
                    width: args.width,
                    height: args.height,
                    autoHideMenuBar: !0,
                    show: !1,
                    resizable: !1,
                    title: 'Loading...',
                    fullscreenable: !1,
                });
                let redirect = null;
                window.webContents.addListener('will-redirect', (event, url) => {
                    // eslint-disable-next-line no-unused-expressions
                    url.startsWith(args.targetUrlPrefix) && ((redirect = url), window.close());
                });
                window.on('close', () => {
                    window.removeAllListeners();
                    resolve(
                        redirect === null
                            ? { status: 'CLOSED_WITH_NO_REDIRECT' }
                            : { status: 'MATCHED_TARGET_URL', url: redirect },
                    );
                });
                window.webContents.session.clearCache();
                window.webContents.session.clearStorageData();
                window.loadURL(args.url);
                window.on('show', (event) => {
                    window.setAlwaysOnTop(!0);
                    window.setAlwaysOnTop(!1);
                });
                window.once('ready-to-show', () => {
                    Logger.log('Showing window');
                    window.show();
                });
            });
            break;
        default:
            Logger.err(`Unknown IPC method${method}`);
    }
});

export function startIPCServer() {
    try {
        Logger.log("Starting IPC server.")
        ipcServer.start()
    }
}
