import { configure, getConsoleSink, getLogger } from '@logtape/logtape';

// Initialize LogTape
await configure({
    sinks: {
        console: getConsoleSink(),
    },
    filters: {},
    loggers: [
        {
            category: [],
            lowestLevel: (process.env.LOG_LEVEL as any) || 'info',
            sinks: ['console'],
        },
    ],
});

const baseLogger = getLogger([]);

// Wrapper to match previous logger API if needed
export const logger = {
    info: (msg: any, ...args: any[]) => baseLogger.info(typeof msg === 'object' ? '{msg}' : msg, { msg, args }),
    error: (msg: any, ...args: any[]) => baseLogger.error(typeof msg === 'object' ? '{msg}' : msg, { msg, args }),
    warn: (msg: any, ...args: any[]) => baseLogger.warn(typeof msg === 'object' ? '{msg}' : msg, { msg, args }),
    debug: (msg: any, ...args: any[]) => baseLogger.debug(typeof msg === 'object' ? '{msg}' : msg, { msg, args }),
    child: (bindings: Record<string, any>) => {
        const category = bindings.module ? [bindings.module] : [];
        const childBase = getLogger(category);
        return {
            info: (msg: any, ...args: any[]) => childBase.info(typeof msg === 'object' ? '{msg}' : msg, { ...bindings, msg, args }),
            error: (msg: any, ...args: any[]) => childBase.error(typeof msg === 'object' ? '{msg}' : msg, { ...bindings, msg, args }),
            warn: (msg: any, ...args: any[]) => childBase.warn(typeof msg === 'object' ? '{msg}' : msg, { ...bindings, msg, args }),
            debug: (msg: any, ...args: any[]) => childBase.debug(typeof msg === 'object' ? '{msg}' : msg, { ...bindings, msg, args }),
            child: (moreBindings: Record<string, any>) => logger.child({ ...bindings, ...moreBindings }),
        };
    },
};

export const createLogger = (module: string) => {
    return logger.child({ module });
};

export default logger;
