/// <reference types="svelte" />

export interface API {
    log: (str: string) => void
}

declare global {
    interface Window {
        api: API
    }
}
