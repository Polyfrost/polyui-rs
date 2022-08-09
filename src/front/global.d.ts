/// <reference types="svelte" />

export interface API {
    log: (str: string) => void,
    err: (str: string) => void,
    debug: (str: string) => void
}

declare global {
    interface Window {
        api: API
    }
}
