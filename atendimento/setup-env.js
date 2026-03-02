/**
 * Script de Setup - Gera env-config.js a partir do .env
 * 
 * USO: node setup-env.js
 * 
 * Este script lê o arquivo .env e gera automaticamente
 * o js/env-config.js com as credenciais configuradas.
 */

const fs = require('fs');
const path = require('path');

// Caminhos
const envPath = path.join(__dirname, '.env');
const outputPath = path.join(__dirname, 'js', 'env-config.js');

// Verificar se .env existe
if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado!');
    console.log('   Copie .env.example para .env e preencha suas credenciais.');
    process.exit(1);
}

// Ler e parsear .env
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    line = line.trim();
    // Ignorar comentários e linhas vazias
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remover aspas se houver
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

// Gerar conteúdo do env-config.js
const configContent = `/**
 * Configuração de Ambiente - Gerado automaticamente
 * NÃO EDITE MANUALMENTE - Use setup-env.js
 * Gerado em: ${new Date().toISOString()}
 */

(function() {
    'use strict';

    const ENV = {
        // Supabase
        SUPABASE_URL: '${envVars.SUPABASE_URL || ''}',
        SUPABASE_ANON_KEY: '${envVars.SUPABASE_ANON_KEY || ''}',

        // Gemini
        GEMINI_API_KEY: '${envVars.GEMINI_API_KEY || ''}',
        GEMINI_MODEL: '${envVars.GEMINI_MODEL || 'gemini-1.5-flash'}',

        // Groq
        GROQ_API_KEY: '${envVars.GROQ_API_KEY || ''}',
        GROQ_MODEL: '${envVars.GROQ_MODEL || 'llama-3.3-70b-versatile'}',

        // OpenRouter
        OPENROUTER_API_KEY: '${envVars.OPENROUTER_API_KEY || ''}',
        OPENROUTER_MODEL: '${envVars.OPENROUTER_MODEL || 'google/gemini-flash-1.5'}',

        // Freshdesk
        FRESHDESK_TICKET_URL: '${envVars.FRESHDESK_TICKET_URL || ''}'
    };

    function get(key, defaultValue = null) {
        const localKey = \`env_\${key.toLowerCase()}\`;
        const localValue = localStorage.getItem(localKey);
        if (localValue !== null) return localValue;
        if (window.ENV_OVERRIDE?.[key] !== undefined) return window.ENV_OVERRIDE[key];
        if (ENV[key] !== undefined) return ENV[key];
        return defaultValue;
    }

    function set(key, value) {
        localStorage.setItem(\`env_\${key.toLowerCase()}\`, value);
    }

    function clear(key) {
        localStorage.removeItem(\`env_\${key.toLowerCase()}\`);
    }

    function list() {
        return Object.keys(ENV).map(key => ({
            key,
            hasLocalOverride: localStorage.getItem(\`env_\${key.toLowerCase()}\`) !== null,
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
`;

// Garantir que o diretório js existe
const jsDir = path.join(__dirname, 'js');
if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
}

// Escrever arquivo
fs.writeFileSync(outputPath, configContent, 'utf-8');

console.log('✅ js/env-config.js gerado com sucesso!');
console.log('   Variáveis carregadas:', Object.keys(envVars).length);
