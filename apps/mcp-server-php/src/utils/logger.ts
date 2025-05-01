import winston from 'winston';

export function createLogger(service: string) {
  const logLevel = process.env.LOG_LEVEL || 'info';

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        return `[${timestamp}] [${service}] ${level}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.Console(),
      // Vous pouvez ajouter d'autres transports ici si nécessaire
    ],
  });
}
