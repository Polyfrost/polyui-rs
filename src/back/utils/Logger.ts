import { dev } from '../main';
import { ANSI } from './textUtils';

const log = (prefix: string, str: string, color: string) => {
    console.log(`${ANSI.RESET}${ANSI.BRIGHT_BLACK}[${ANSI.RESET}${color}${prefix}${ANSI.RESET}${ANSI.BRIGHT_BLACK}]${ANSI.RESET} ${color}${str}`);
};

export default {
    log: (str: string) => log('INFO', str, ANSI.BRIGHT_BLUE),
    err: (str: string) => log('ERROR', str, ANSI.BRIGHT_RED),
    debug: (str: string) => (dev ? log('DEBUG', str, ANSI.BRIGHT_MAGENTA) : undefined),
};
