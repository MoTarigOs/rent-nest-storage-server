const { format, createLogger, transports } = require('winston');
const { timestamp, combine, errors, json } = format;

function buildLogger() {
    const logger = createLogger({
        format: combine(
            timestamp(),
            errors({ stack: true }),
            json(),
            format.json()
        ),
        defaultMeta: { service: 'user-service' },
        transports: [
            // new transports.Console(),
            new transports.File({ 
                filename: "Log/exceptions.log",
            })
        ]
    })

    return logger;
};

module.exports = buildLogger;

