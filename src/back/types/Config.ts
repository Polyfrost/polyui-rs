export interface Config {
    settings?: {
        java?: {
            minRAM?: string,
            maxRAM?: string,
            executable?: unknown,
            jvmOptions?: Array<String>
        },
        game?: {
            resWidth?: number,
            resHeight?: number,
            fullscreen?: boolean,
            autoConnect?: boolean,
            launchDetached?: boolean
        },
        launcher?: {
            allowPrerelease?: false,
            dataDirectory?: string
        }
    },
    newsCache?: {
        date?: Date,
        content?: unknown,
        dismissed?: boolean
    },
    clientToken?: string,
    selectedAccount?: null,
    authenticationDatabase?: unknown
}
