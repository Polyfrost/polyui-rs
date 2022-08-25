/* eslint-disable no-use-before-define */
import { app } from 'electron';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { Config } from '../types/Config';

const sysRoot = process.env.APPDATA || (process.platform === 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
const dataPath = path.join(sysRoot, '.polyfrost');

const launcherDir = process.env.CONFIG_DIRECT_PATH || app.getPath('userData');

export function getLauncherDirectory(): string {
    return launcherDir;
}

export function getDataDirectory(def = false): string {
    // eslint-disable-next-line no-use-before-define
    return !def ? config.settings.launcher.dataDirectory : DEFAULT_CONFIG.settings.launcher.dataDirectory;
}

const configPath = path.join(getLauncherDirectory(), 'config.json');
const configPathLegacy = path.join(dataPath, 'config.json');
const firstLaunch = !fs.existsSync(configPath);

export function getAbsoluteMinRAM(): number {
    const mem = os.totalmem();
    return mem >= 6000000000 ? 3 : 2;
}

export function getAbsoluteMaxRAM(): number {
    const mem = os.totalmem();
    const gT16 = mem - 16000000000;
    return Math.floor((mem - 1000000000 - (gT16 > 0 ? Number.parseInt((gT16 / 8).toString()) + 16000000000 / 4 : mem / 4)) / 1000000000);
}

function resolveMaxRAM(): string {
    const mem = os.totalmem();
    // eslint-disable-next-line no-nested-ternary
    return mem >= 8000000000 ? '4G' : mem >= 6000000000 ? '3G' : '2G';
}

function resolveMinRAM(): string {
    return resolveMaxRAM();
}

const DEFAULT_CONFIG: Config = {
    settings: {
        java: {
            minRAM: resolveMinRAM(),
            maxRAM: resolveMaxRAM(),
            executable: null,
            jvmOptions: ['-XX:+UseConcMarkSweepGC', '-XX:+CMSIncrementalMode', '-XX:+UseAdaptiveSizePolicy', '-Xmn128M', '-Xoneconfig.launcher=true', '-Xoneconfig.ipc=localhost://'],
        },
        game: {
            resWidth: 1280,
            resHeight: 720,
            fullscreen: false,
            autoConnect: true,
            launchDetached: true,
        },
        launcher: {
            allowPrerelease: false,
            dataDirectory: dataPath,
        },
    },
    newsCache: {
        date: null,
        content: null,
        dismissed: false,
    },
    clientToken: null,
    selectedAccount: null,
    authenticationDatabase: {},
};

let config: Config = null;

export function save(): void {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
}

export function load(): void {
    let doLoad = true;

    if (fs.existsSync(configPath)) {
        fs.ensureDirSync(path.join(configPath, '..'));
        if (fs.existsSync(configPathLegacy)) {
            fs.moveSync(configPathLegacy, configPathLegacy);
        } else {
            doLoad = false;
            config = DEFAULT_CONFIG;
            save();
        }
    }
    if (doLoad) {
        let doValidate = false;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            doValidate = true;
        } catch (err) {
            console.log('Config file contains malformed JSON or it is corrupt.');
            console.log('Attempting to abort and restore corrupted config.');
            fs.ensureDirSync(path.join(configPath, '..'));
            config = DEFAULT_CONFIG;
            save();
        }
        if (doValidate) {
            config = validateKeySet(DEFAULT_CONFIG, config);
            save();
        }
    }
    console.log('Config file loaded.');
}

export function isLoaded(): boolean {
    return config != null;
}

export function validateKeySet(srcObj: Config | Object, destObj: Config | Object): Config | Object {
    if (srcObj == null) srcObj = {};
    const validationBlacklist = ['authenticationDatabase'];
    const keys = Object.keys(srcObj);
    for (let i = 0; i < keys.length; i++) {
        if (typeof destObj[keys[i]] === 'undefined') {
            destObj[keys[i]] = srcObj[keys[i]];
        } else if (typeof srcObj[keys[i]] === 'object' && srcObj[keys[i]] != null && !(srcObj[keys[i]] instanceof Array) && validationBlacklist.indexOf(keys[i]) === -1) {
            destObj[keys[i]] = validateKeySet(srcObj[keys[i]], destObj[keys[i]]);
        }
    }
    return destObj;
}

export function isFirstLaunch(): boolean {
    return firstLaunch;
}

export function getTempNativeFolder(): string {
    return 'WCNatives';
}

export function getNewsCache(): unknown {
    return config.newsCache;
}

export function setNewsCache(newsCache: unknown): void {
    config.newsCache = newsCache;
}

export function setNewsCacheDismissed(dismissed: boolean): void {
    config.newsCache.dismissed = dismissed;
}

export function getCommonDirectory(): string {
    return path.join(getDataDirectory(), 'common');
}

export function getInstanceDirectory(): string {
    return path.join(getDataDirectory(), 'instances');
}

export function getClientToken(): string {
    return config.clientToken;
}

export function setClientToken(clientToken: string): void {
    config.clientToken = clientToken;
}
