/**
 * Pino-compliant JSON Structured Logger for TestPilot Backend Services
 */
const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
};

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.service = options.service || 'testpilot-backend';
        this.logFile = options.logFile || path.resolve(process.cwd(), 'testpilot-backend.log');
    }

    log(levelName, msg, meta = {}) {
        if (LOG_LEVELS[levelName] < LOG_LEVELS[this.level]) return;

        const entry = {
            level: LOG_LEVELS[levelName],
            levelName: levelName.toUpperCase(),
            time: new Date().toISOString(),
            service: this.service,
            msg: typeof msg === 'string' ? msg : JSON.stringify(msg),
            ...meta
        };

        const serialized = JSON.stringify(entry);
        if (levelName === 'error' || levelName === 'fatal') {
            process.stderr.write(serialized + '\n');
        } else {
            process.stdout.write(serialized + '\n');
        }

        try {
            fs.appendFileSync(this.logFile, serialized + '\n');
        } catch (e) {}
    }

    info(msg, meta) { this.log('info', msg, meta); }
    debug(msg, meta) { this.log('debug', msg, meta); }
    warn(msg, meta) { this.log('warn', msg, meta); }
    error(msg, meta) { this.log('error', msg, meta); }
    fatal(msg, meta) { this.log('fatal', msg, meta); }
}

const logger = new Logger();
module.exports = logger;
