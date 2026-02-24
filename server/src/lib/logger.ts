import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = isProduction
    ? pino({
          level: process.env.LOG_LEVEL || 'info',
      })
    : pino(
          {
              level: process.env.LOG_LEVEL || 'info',
          },
          pino.transport({
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  singleLine: false,
              },
          }),
      );

// Create child loggers for different modules
export const createLogger = (module: string) => {
    return logger.child({ module });
};

export default logger;
