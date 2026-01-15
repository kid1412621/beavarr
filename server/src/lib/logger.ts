import pino from 'pino';

const transport = pino.transport({
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
    },
});

export const logger = pino(
    {
        level: process.env.LOG_LEVEL || 'info',
    },
    transport,
);

// Create child loggers for different modules
export const createLogger = (module: string) => {
    return logger.child({ module });
};

export default logger;
