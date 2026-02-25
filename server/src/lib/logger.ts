import { configure, getConsoleSink, getLogger, type LogLevel } from '@logtape/logtape';

// Extract the log level safely from the environment
const getLogLevel = (): LogLevel => {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    const validLevels = ['debug', 'info', 'warning', 'error', 'fatal'];
    return validLevels.includes(level as string) ? (level as LogLevel) : 'info';
};

// Initialize LogTape
await configure({
    sinks: {
        console: getConsoleSink(),
    },
    filters: {},
    loggers: [
        {
            category: ['logtape', 'meta'],
            lowestLevel: 'warning',
            sinks: ['console'],
        },
        {
            category: [],
            lowestLevel: getLogLevel(),
            sinks: ['console'],
        },
    ],
});

export const logger = getLogger([]);

/**
 * Creates a new logger with the given module names as logtape categories.
 * Example: createLogger('agents', 'tools') -> creates logger for category ['agents', 'tools']
 */
export const createLogger = (...modules: string[]) => {
    return getLogger(modules);
};

export default logger;
