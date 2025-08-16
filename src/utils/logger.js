// Sistema di logging per Bella AI

import { CONFIG } from '../../config/config.js';

class Logger {
    constructor() {
        this.logLevel = CONFIG.logLevel || 'info';
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    /**
     * Controlla se il livello di log è abilitato
     */
    isLevelEnabled(level) {
        return this.logLevels[level] <= this.logLevels[this.logLevel];
    }

    /**
     * Formatta il messaggio di log
     */
    formatMessage(level, message, context = '') {
        const timestamp = new Date().toISOString();
        const prefix = `[Bella AI] [${timestamp}] [${level.toUpperCase()}]`;
        return context ? `${prefix} [${context}]: ${message}` : `${prefix}: ${message}`;
    }

    /**
     * Log di errore
     */
    error(message, context = '') {
        if (this.isLevelEnabled('error')) {
            console.error(this.formatMessage('error', message, context));
        }
    }

    /**
     * Log di warning
     */
    warn(message, context = '') {
        if (this.isLevelEnabled('warn')) {
            console.warn(this.formatMessage('warn', message, context));
        }
    }

    /**
     * Log di informazione
     */
    info(message, context = '') {
        if (this.isLevelEnabled('info')) {
            console.info(this.formatMessage('info', message, context));
        }
    }

    /**
     * Log di debug
     */
    debug(message, context = '') {
        if (this.isLevelEnabled('debug')) {
            console.debug(this.formatMessage('debug', message, context));
        }
    }

    /**
     * Log di performance
     */
    performance(label, startTime) {
        if (this.isLevelEnabled('debug')) {
            const duration = performance.now() - startTime;
            this.debug(`${label}: ${duration.toFixed(2)}ms`, 'PERFORMANCE');
        }
    }

    /**
     * Log di API
     */
    api(method, url, status, duration) {
        if (this.isLevelEnabled('info')) {
            const level = status >= 400 ? 'error' : 'info';
            this[level](`${method} ${url} - ${status} (${duration.toFixed(2)}ms)`, 'API');
        }
    }

    /**
     * Log di UI
     */
    ui(action, details = '') {
        if (this.isLevelEnabled('debug')) {
            this.debug(`${action} ${details}`, 'UI');
        }
    }

    /**
     * Log di sistema
     */
    system(message, details = '') {
        if (this.isLevelEnabled('info')) {
            this.info(`${message} ${details}`, 'SYSTEM');
        }
    }

    /**
     * Log di chat
     */
    chat(action, message = '') {
        if (this.isLevelEnabled('debug')) {
            this.debug(`${action} ${message}`, 'CHAT');
        }
    }

    /**
     * Log di voce
     */
    voice(action, details = '') {
        if (this.isLevelEnabled('debug')) {
            this.debug(`${action} ${details}`, 'VOICE');
        }
    }

    /**
     * Imposta il livello di log
     */
    setLogLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.info(`Livello di log impostato a: ${level}`);
        } else {
            this.warn(`Livello di log non valido: ${level}`);
        }
    }

    /**
     * Esporta i log
     */
    exportLogs() {
        // In futuro, potremmo implementare l'esportazione dei log
        this.info('Esportazione log richiesta');
    }

    /**
     * Pulisce i log
     */
    clearLogs() {
        // In futuro, potremmo implementare la pulizia dei log
        this.info('Pulizia log richiesta');
    }
}

// Istanza singleton del logger
export const logger = new Logger();

// Esporta anche la classe per test
export { Logger };
