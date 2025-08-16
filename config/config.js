// Configurazione centrale per Bella AI
export const CONFIG = {
    // Configurazione server
    server: {
        port: 8081,
        host: '0.0.0.0'
    },

    // Configurazione API
    api: {
        openai: {
            baseURL: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-3.5-turbo',
            maxTokens: 200,
            temperature: 0.8
        },
        claude: {
            baseURL: 'https://api.anthropic.com/v1/messages',
            model: 'claude-3-haiku-20240307',
            maxTokens: 200,
            temperature: 0.8
        },
        perplexity: {
            baseURL: 'https://api.perplexity.ai/chat/completions',
            model: 'llama-3.1-8b-instant',
            maxTokens: 200,
            temperature: 0.8
        }
    },

    // Configurazione UI
    ui: {
        chat: {
            maxHistoryLength: 15,
            autoShowDelay: 2000
        },
        voice: {
            defaultLanguage: 'it-IT',
            rate: 0.9,
            pitch: 1.1,
            volume: 0.8
        }
    },

    // Configurazione modelli locali
    localModels: {
        enabled: false,
        llm: 'Xenova/LaMini-Flan-T5-77M',
        asr: 'Xenova/whisper-tiny',
        tts: 'Xenova/speecht5_tts'
    },

    // Configurazione fallback
    fallback: {
        enabled: true,
        responses: [
            "Mi dispiace, sono un po' confusa ora, lasciami riorganizzare i pensieri...",
            "Mmm... devo pensarci ancora un po', aspetta un momento.",
            "I miei pensieri sono un po' confusi, dammi un po' di tempo per organizzarli.",
            "Lasciami riorganizzare il linguaggio, aspetta un momento."
        ]
    }
};

// Configurazione per ambiente di sviluppo
export const DEV_CONFIG = {
    ...CONFIG,
    debug: true,
    logLevel: 'debug'
};

// Configurazione per produzione
export const PROD_CONFIG = {
    ...CONFIG,
    debug: false,
    logLevel: 'error'
};
