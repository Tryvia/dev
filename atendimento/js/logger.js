/**
 * Logger - Sistema de Logging Estruturado
 * Substitui console.log com níveis e controle de produção
 * 
 * Uso:
 *   Logger.debug('mensagem de debug');
 *   Logger.info('informação importante');
 *   Logger.warn('aviso');
 *   Logger.error('erro', errorObject);
 *   Logger.setLevel('warn'); // Só mostra warn e error
 */

(function() {
    'use strict';

    const LEVELS = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
        none: 4
    };

    // Detectar ambiente de produção
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1' &&
                         !window.location.hostname.includes('192.168.');

    const Logger = {
        // Nível atual (em produção, só warn e error)
        currentLevel: isProduction ? LEVELS.warn : LEVELS.debug,
        
        // Prefixos com emojis para cada nível
        prefixes: {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        },

        // Configurar nível de log
        setLevel(level) {
            if (LEVELS[level] !== undefined) {
                this.currentLevel = LEVELS[level];
                console.log(`📊 Logger: nível definido para "${level}"`);
            }
        },

        // Obter nível atual
        getLevel() {
            return Object.keys(LEVELS).find(k => LEVELS[k] === this.currentLevel) || 'unknown';
        },

        // Habilitar todos os logs (útil para debug em produção)
        enableAll() {
            this.currentLevel = LEVELS.debug;
            console.log('📊 Logger: todos os níveis habilitados');
        },

        // Desabilitar todos os logs
        disableAll() {
            this.currentLevel = LEVELS.none;
        },

        // Métodos de log
        debug(...args) {
            if (this.currentLevel <= LEVELS.debug) {
                console.log(this.prefixes.debug, ...args);
            }
        },

        info(...args) {
            if (this.currentLevel <= LEVELS.info) {
                console.log(this.prefixes.info, ...args);
            }
        },

        warn(...args) {
            if (this.currentLevel <= LEVELS.warn) {
                console.warn(this.prefixes.warn, ...args);
            }
        },

        error(...args) {
            if (this.currentLevel <= LEVELS.error) {
                console.error(this.prefixes.error, ...args);
            }
        },

        // Log com grupo (para logs relacionados)
        group(label, fn) {
            if (this.currentLevel <= LEVELS.debug) {
                console.group(label);
                try {
                    fn();
                } finally {
                    console.groupEnd();
                }
            }
        },

        // Log de performance
        time(label) {
            if (this.currentLevel <= LEVELS.debug) {
                console.time(label);
            }
        },

        timeEnd(label) {
            if (this.currentLevel <= LEVELS.debug) {
                console.timeEnd(label);
            }
        },

        // Log de tabela (para arrays/objetos)
        table(data) {
            if (this.currentLevel <= LEVELS.debug) {
                console.table(data);
            }
        }
    };

    // Expor globalmente
    window.Logger = Logger;

    // Log inicial apenas em desenvolvimento
    if (!isProduction) {
        console.log('📊 Logger inicializado (ambiente de desenvolvimento)');
    }

})();
