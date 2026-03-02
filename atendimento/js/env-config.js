/**
 * Configuração de Ambiente - Gerado automaticamente
 * NÃO EDITE MANUALMENTE - Use setup-env.js
 * Gerado em: 2026-02-24T20:39:24.538Z
 */

(function() {
    'use strict';

    const ENV = {
        // Supabase
        SUPABASE_URL: 'https://ifzypptlhpzuydjeympr.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8',

        // Gemini
        GEMINI_API_KEY: 'AIzaSyAf1Y_iJxafTDKIw_IpSrFdKYx7DQ3pVuc',
        GEMINI_MODEL: 'gemini-2.0-flash',

        // Groq
        GROQ_API_KEY: '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',
        GROQ_MODEL: 'llama-3.3-70b-versatile',

        // OpenRouter
        OPENROUTER_API_KEY: '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',
        OPENROUTER_MODEL: 'google/gemini-flash-1.5',

        // Freshdesk
        FRESHDESK_TICKET_URL: 'https://suportetryvia.freshdesk.com/a/tickets'
    };

    function get(key, defaultValue = null) {
        const localKey = `env_${key.toLowerCase()}`;
        const localValue = localStorage.getItem(localKey);
        if (localValue !== null) return localValue;
        if (window.ENV_OVERRIDE?.[key] !== undefined) return window.ENV_OVERRIDE[key];
        if (ENV[key] !== undefined) return ENV[key];
        return defaultValue;
    }

    function set(key, value) {
        localStorage.setItem(`env_${key.toLowerCase()}`, value);
    }

    function clear(key) {
        localStorage.removeItem(`env_${key.toLowerCase()}`);
    }

    function list() {
        return Object.keys(ENV).map(key => ({
            key,
            hasLocalOverride: localStorage.getItem(`env_${key.toLowerCase()}`) !== null,
            isApiKey: key.includes('KEY')
        }));
    }

    window.EnvConfig = {
        get, set, clear, list,
        supabase: {
            get url() { return get('SUPABASE_URL'); },
            get key() { return get('SUPABASE_ANON_KEY'); }
        },
        ai: {
            gemini: {
                get key() { return get('GEMINI_API_KEY'); },
                get model() { return get('GEMINI_MODEL'); }
            },
            groq: {
                get key() { return get('GROQ_API_KEY'); },
                get model() { return get('GROQ_MODEL'); }
            },
            openrouter: {
                get key() { return get('OPENROUTER_API_KEY'); },
                get model() { return get('OPENROUTER_MODEL'); }
            }
        },
        freshdesk: {
            get ticketUrl() { return get('FRESHDESK_TICKET_URL'); }
        }
    };

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('⚙️ EnvConfig carregado');
    }
})();
