const { createLogger, format } = require("winston");
var winston = require('winston')
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
require('dotenv').config();
 
 
const customFormat = format.combine(
    format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
    format.align(),
    format.printf((i) => `${i.level}: ${[i.timestamp]}: ${i.message}`)
);
const options = {
    console: {
        level: "info",
        handleExceptions: true,
        json: false,
        colorize: true,
        format:customFormat
    }
};
const logger = createLogger({
    transports:[
        new winston.transports.DailyRotateFile({
            filename: `${process.env.NOTARY_LOG_FILE_PATH}/logs/NOTARY-%DATE%.log`,
            datePattern: "DD-MM-YYYY",
            zippedArchive: true,
            level:"error",
            maxSize: "20m",
            maxFiles: "14d",
            level: "info",
            format:customFormat
        }),
        new winston.transports.Console(options.console),
    ]
});
 
logger.stream = {
    write: function (message,req) {
        const status = message.split(" ")[8]
        const logs = (status === '404' || status === '500') ? logger.error(message) : status === '200' ? (message) : logger.warn(message);
        return logs;
    },
};
 
module.exports = logger;
 