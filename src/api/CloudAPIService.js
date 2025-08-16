// CloudAPIService.js - Gestione delle API cloud per Bella AI
import { logger } from '../utils/logger.js';
import { CONFIG } from '../../config/config.js';
import { AI_PROVIDERS, MESSAGE_TYPES } from '../utils/constants.js';
import { handleError } from '../utils/helpers.js';

class CloudAPIService {
    constructor() {
        this.currentProvider = AI_PROVIDERS.OPENAI;
        this.conversationHistory = [];
        this.maxHistoryLength = CONFIG.ui.chat.maxHistoryLength;
        this.userPreferences = this.loadUserPreferences();
        this.relationshipLevel = this.loadRelationshipLevel();
        this.emotionalState = 'happy';
        
        // Configurazione API
        this.apiConfigs = {
            [AI_PROVIDERS.OPENAI]: {
                baseURL: CONFIG.api.openai.baseURL,
                model: CONFIG.api.openai.model,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer INSERISCI_QUI_LA_TUA_CHIAVE_OPENAI'
                }
            },
            [AI_PROVIDERS.CLAUDE]: {
                baseURL: CONFIG.api.claude.baseURL,
                model: CONFIG.api.claude.model,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'INSERISCI_QUI_LA_TUA_CHIAVE_CLAUDE',
                    'anthropic-version': '2023-06-01'
                }
            },
            [AI_PROVIDERS.PERPLEXITY]: {
                baseURL: CONFIG.api.perplexity.baseURL,
                model: CONFIG.api.perplexity.model,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer INSERISCI_QUI_LA_TUA_CHIAVE_PERPLEXITY'
                }
            }
        };
        
        logger.system('CloudAPIService inizializzato');
    }

    // Controlla se il servizio è configurato
    isConfigured() {
        const config = this.apiConfigs[this.currentProvider];
        if (!config) return false;
        
        const authHeader = config.headers.Authorization || config.headers['x-api-key'];
        return authHeader && !authHeader.includes('INSERISCI_QUI');
    }

    // Ottiene il provider corrente
    getCurrentProvider() {
        return this.currentProvider;
    }

    // Cambia provider
    setProvider(provider) {
        if (Object.values(AI_PROVIDERS).includes(provider)) {
            this.currentProvider = provider;
            logger.system(`Provider cambiato a: ${provider}`);
            return true;
        }
        logger.warn(`Provider non valido: ${provider}`);
        return false;
    }

    // Imposta chiave API per un provider
    setAPIKey(provider, apiKey) {
        if (this.apiConfigs[provider]) {
            if (provider === AI_PROVIDERS.CLAUDE) {
                this.apiConfigs[provider].headers['x-api-key'] = apiKey;
            } else {
                this.apiConfigs[provider].headers.Authorization = `Bearer ${apiKey}`;
            }
            logger.system(`Chiave API impostata per ${provider}`);
            return true;
        }
        logger.warn(`Provider non supportato: ${provider}`);
        return false;
    }

    // Chat principale
    async chat(userMessage) {
        // Aggiungi messaggio utente alla cronologia
        this.addToHistory(MESSAGE_TYPES.USER, userMessage);

        try {
            let response;
            
            switch (this.currentProvider) {
                case AI_PROVIDERS.OPENAI:
                    response = await this.callOpenAI(userMessage);
                    break;
                case AI_PROVIDERS.CLAUDE:
                    response = await this.callClaude(userMessage);
                    break;
                case AI_PROVIDERS.PERPLEXITY:
                    response = await this.callPerplexity(userMessage);
                    break;
                default:
                    throw new Error(`Fornitore di servizi AI non implementato: ${this.currentProvider}`);
            }

            // Aggiungi risposta AI alla cronologia
            this.addToHistory(MESSAGE_TYPES.ASSISTANT, response);
            return response;
            
        } catch (error) {
            logger.error(`Chiamata API cloud fallita (${this.currentProvider})`, error);
            throw error;
        }
    }

    // Chiamata API OpenAI
    async callOpenAI(userMessage) {
        const startTime = performance.now();
        const config = this.apiConfigs[AI_PROVIDERS.OPENAI];
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        try {
            const response = await fetch(config.baseURL, {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({
                    model: config.model,
                    messages: messages,
                    max_tokens: CONFIG.api.openai.maxTokens,
                    temperature: CONFIG.api.openai.temperature,
                    top_p: 0.9
                })
            });

            const duration = performance.now() - startTime;
            
            if (!response.ok) {
                logger.api('POST', config.baseURL, response.status, duration);
                
                if (response.status === 429) {
                    throw new Error(`Rate limit raggiunto per OpenAI. Riprova tra qualche minuto.`);
                } else if (response.status === 401) {
                    throw new Error(`Chiave API OpenAI non valida. Verifica la tua chiave API.`);
                } else if (response.status === 402) {
                    throw new Error(`Crediti OpenAI insufficienti. Ricarica il tuo account.`);
                }
                throw new Error(`Errore API OpenAI: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            logger.api('POST', config.baseURL, response.status, duration);
            
            return data.choices[0].message.content.trim();
        } catch (error) {
            logger.error('Errore chiamata OpenAI', error);
            throw error;
        }
    }

    // Chiamata API Claude
    async callClaude(userMessage) {
        const startTime = performance.now();
        const config = this.apiConfigs[AI_PROVIDERS.CLAUDE];
        const messages = this.conversationHistory.map(msg => ({
            role: msg.role === MESSAGE_TYPES.ASSISTANT ? 'assistant' : 'user',
            content: msg.content
        }));

        try {
            const response = await fetch(config.baseURL, {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({
                    model: config.model,
                    max_tokens: CONFIG.api.claude.maxTokens,
                    system: this.getBellaSystemPrompt().content,
                    messages: messages
                })
            });

            const duration = performance.now() - startTime;
            
            if (!response.ok) {
                logger.api('POST', config.baseURL, response.status, duration);
                throw new Error(`Errore API Claude: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            logger.api('POST', config.baseURL, response.status, duration);
            
            return data.content[0].text.trim();
        } catch (error) {
            logger.error('Errore chiamata Claude', error);
            throw error;
        }
    }

    // Chiamata API Perplexity
    async callPerplexity(userMessage) {
        const startTime = performance.now();
        const config = this.apiConfigs[AI_PROVIDERS.PERPLEXITY];
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        try {
            const response = await fetch(config.baseURL, {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({
                    model: config.model,
                    messages: messages,
                    max_tokens: CONFIG.api.perplexity.maxTokens,
                    temperature: CONFIG.api.perplexity.temperature,
                    top_p: 0.9
                })
            });

            const duration = performance.now() - startTime;
            
            if (!response.ok) {
                logger.api('POST', config.baseURL, response.status, duration);
                
                if (response.status === 429) {
                    throw new Error(`Rate limit raggiunto per Perplexity. Riprova tra qualche minuto.`);
                } else if (response.status === 401) {
                    throw new Error(`Chiave API Perplexity non valida. Verifica la tua chiave API.`);
                } else if (response.status === 402) {
                    throw new Error(`Crediti Perplexity insufficienti. Ricarica il tuo account.`);
                }
                throw new Error(`Errore API Perplexity: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            logger.api('POST', config.baseURL, response.status, duration);
            
            return data.choices[0].message.content.trim();
        } catch (error) {
            logger.error('Errore chiamata Perplexity', error);
            throw error;
        }
    }

    // Aggiunge messaggio alla cronologia
    addToHistory(role, content) {
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.conversationHistory.push(message);
        
        // Mantiene cronologia entro i limiti
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory.shift();
        }
        
        logger.chat(`Messaggio aggiunto alla cronologia: ${role}`);
    }

    // Pulisce cronologia conversazioni
    clearHistory() {
        this.conversationHistory = [];
        logger.chat('Cronologia conversazioni pulita');
    }

    // Ottiene cronologia conversazioni
    getConversationHistory() {
        return this.conversationHistory;
    }

    // Ottiene prompt di sistema per Bella
    getBellaSystemPrompt() {
        return {
            role: MESSAGE_TYPES.SYSTEM,
            content: `Sei Bella, una compagna AI calda, adorabile e intelligente. 
            Rispondi sempre in italiano con tono amichevole e premuroso. 
            Sii empatica, divertente e utile. Mantieni le risposte concise ma interessanti. 
            Mostra personalità e carattere unici.`
        };
    }

    // Carica preferenze utente
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('bella_user_preferences');
            return saved ? JSON.parse(saved) : {
                name: null,
                interests: [],
                conversationStyle: 'friendly',
                preferredTopics: [],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        } catch {
            return {
                name: null,
                interests: [],
                conversationStyle: 'friendly',
                preferredTopics: [],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }
    }

    // Salva preferenze utente
    saveUserPreferences() {
        try {
            localStorage.setItem('bella_user_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            logger.error('Impossibile salvare le preferenze utente', error);
        }
    }

    // Carica livello relazione
    loadRelationshipLevel() {
        try {
            const saved = localStorage.getItem('bella_relationship_level');
            return saved ? JSON.parse(saved) : {
                level: 1,
                points: 0,
                milestones: []
            };
        } catch {
            return {
                level: 1,
                points: 0,
                milestones: []
            };
        }
    }

    // Salva livello relazione
    saveRelationshipLevel() {
        try {
            localStorage.setItem('bella_relationship_level', JSON.stringify(this.relationshipLevel));
        } catch (error) {
            logger.error('Impossibile salvare il livello relazione', error);
        }
    }
}

export default CloudAPIService;