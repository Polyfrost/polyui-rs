import { dev } from '../main';

const log = (str: string) => {
    // Implement saving to file
    console.log(`insert fancy console color codes + ${str}`);
};

export default {
    log: (str: string) => log(str),
    err: (str: string) => log(`fancy color codes ${str}`),
    debug: (str: string) => (dev ? log(`more fancy color codes ${str}`) : undefined),
};
