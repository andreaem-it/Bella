// BellaAI.js - Core dell'intelligenza artificiale di Bella
import { logger } from '../utils/logger.js';
import { CONFIG } from '../../config/config.js';
import { AI_PROVIDERS, CHAT_MODES, EMOTIONAL_STATES } from '../utils/constants.js';
import { saveToStorage, loadFromStorage, handleError } from '../utils/helpers.js';

class BellaAI {
    constructor() {
        this.cloudAPI = null; // Sarà inizializzato dopo
        this.useCloudAPI = true;
        this.currentMode = CHAT_MODES.CASUAL;
        this.emotionalState = EMOTIONAL_STATES.HAPPY;
        this.conversationHistory = [];
        this.userPreferences = this.loadUserPreferences();
        this.relationshipLevel = this.loadRelationshipLevel();
        
        logger.system('BellaAI istanziata');
    }

    // Singleton pattern
    static instance = null;
    static getInstance() {
        if (!BellaAI.instance) {
            BellaAI.instance = new BellaAI();
        }
        return BellaAI.instance;
    }

    // Inizializza Bella
    async init(cloudAPIService) {
        try {
            logger.system('Inizializzazione Bella AI...');
            
            this.cloudAPI = cloudAPIService;
            
            // Modelli locali disabilitati temporaneamente
            logger.info('Modelli locali disabilitati, usando sistema di risposte intelligenti');
            
            this.useCloudAPI = true;
            this.llm = null;
            this.asr = null;
            this.tts = null;
            
            logger.system('Bella AI inizializzata con successo - Cloud API mode');
            return true;
        } catch (error) {
            logger.error('Errore durante l\'inizializzazione di Bella AI', error);
            return false;
        }
    }

    // Processo di pensiero principale
    async think(prompt) {
        try {
            // Se API cloud è abilitata e configurata correttamente, usa servizio cloud
            if (this.useCloudAPI && this.cloudAPI && this.cloudAPI.isConfigured()) {
                return await this.thinkWithCloudAPI(prompt);
            }
            
            // Se abbiamo un modello locale funzionante, usalo
            if (this.llm) {
                return await this.thinkWithLocalModel(prompt);
            }
            
            // Altrimenti usa risposta di fallback
            return this.getErrorResponse();
            
        } catch (error) {
            logger.error('Errore durante il processo di pensiero', error);
            
            // Se API cloud fallisce, fornisci risposta di fallback
            if (this.useCloudAPI) {
                logger.info('API cloud fallita, usando risposta di fallback...');
                return this.getErrorResponse();
            }
            
            return this.getErrorResponse();
        }
    }

    // Usa API cloud per pensare
    async thinkWithCloudAPI(prompt) {
        const enhancedPrompt = this.enhancePromptForMode(prompt);
        return await this.cloudAPI.chat(enhancedPrompt);
    }

    // Usa modello locale per pensare
    async thinkWithLocalModel(prompt) {
        if (!this.llm) {
            return "Sto ancora imparando a pensare, aspetta un momento...";
        }
        
        const bellaPrompt = this.enhancePromptForMode(prompt, true);
        
        try {
            const result = await this.llm(bellaPrompt, {
                max_new_tokens: 50,
                temperature: 0.8,
                top_k: 40,
                do_sample: true,
            });
            
            // Pulisce testo generato
            let response = result[0].generated_text;
            if (response.includes(bellaPrompt)) {
                response = response.replace(bellaPrompt, '').trim();
            }
            
            return response || "Devo pensarci ancora...";
        } catch (error) {
            logger.error('Errore modello locale', error);
            return "Mi dispiace, ho un problema con il mio cervello locale...";
        }
    }

    // Migliora prompt in base alla modalità
    enhancePromptForMode(prompt, isLocal = false) {
        const modePrompts = {
            [CHAT_MODES.CASUAL]: isLocal ? 
                `Come compagna AI calda e adorabile Bella, rispondi con tono leggero e amichevole: ${prompt}` :
                `Per favore rispondi con tono caldo e leggero, come un amico premuroso. Mantieni conciso e interessante: ${prompt}`,
            [CHAT_MODES.ASSISTANT]: isLocal ?
                `Come assistente intelligente Bella, fornisci aiuto utile e accurato: ${prompt}` :
                `Come assistente AI professionale ma caldo, fornisci informazioni e consigli accurati e utili: ${prompt}`,
            [CHAT_MODES.CREATIVE]: isLocal ?
                `Come compagna AI creativa Bella, usa l'immaginazione per rispondere: ${prompt}` :
                `Usa creatività e immaginazione, fornisci risposte e idee interessanti e uniche: ${prompt}`
        };
        
        return modePrompts[this.currentMode] || modePrompts[CHAT_MODES.CASUAL];
    }

    // Ottiene risposta di errore
    getErrorResponse() {
        const responses = CONFIG.fallback.responses;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Imposta modalità chat
    setChatMode(mode) {
        if (Object.values(CHAT_MODES).includes(mode)) {
            this.currentMode = mode;
            logger.chat(`Modalità chat cambiata a: ${mode}`);
            return true;
        }
        logger.warn(`Modalità chat non valida: ${mode}`);
        return false;
    }

    // Cambia fornitore servizio AI
    setAIProvider(provider) {
        if (Object.values(AI_PROVIDERS).includes(provider)) {
            if (this.cloudAPI) {
                this.cloudAPI.setProvider(provider);
                logger.system(`Provider AI cambiato a: ${provider}`);
                return true;
            }
        }
        logger.warn(`Provider AI non valido o non disponibile: ${provider}`);
        return false;
    }

    // Aggiunge messaggio alla cronologia
    addToHistory(role, content) {
        const message = {
            id: Date.now(),
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            mode: this.currentMode
        };
        
        this.conversationHistory.push(message);
        
        // Mantiene cronologia entro i limiti
        if (this.conversationHistory.length > CONFIG.ui.chat.maxHistoryLength) {
            this.conversationHistory.shift();
        }
        
        logger.chat(`Messaggio aggiunto alla cronologia: ${role}`);
    }

    // Ottiene cronologia conversazioni
    getConversationHistory() {
        return this.conversationHistory;
    }

    // Pulisce cronologia conversazioni
    clearHistory() {
        this.conversationHistory = [];
        logger.chat('Cronologia conversazioni pulita');
    }

    // Ottiene informazioni sul sistema
    getSystemInfo() {
        return {
            useCloudAPI: this.useCloudAPI,
            provider: this.cloudAPI ? this.cloudAPI.getCurrentProvider() : 'none',
            mode: this.currentMode,
            emotionalState: this.emotionalState,
            historyLength: this.conversationHistory.length,
            isConfigured: this.cloudAPI ? this.cloudAPI.isConfigured() : false
        };
    }

    // Carica preferenze utente
    loadUserPreferences() {
        return loadFromStorage('bella_user_preferences', {
            name: null,
            interests: [],
            conversationStyle: 'friendly',
            preferredTopics: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    }

    // Salva preferenze utente
    saveUserPreferences() {
        return saveToStorage('bella_user_preferences', this.userPreferences);
    }

    // Carica livello relazione
    loadRelationshipLevel() {
        return loadFromStorage('bella_relationship_level', {
            level: 1,
            points: 0,
            milestones: []
        });
    }

    // Salva livello relazione
    saveRelationshipLevel() {
        return saveToStorage('bella_relationship_level', this.relationshipLevel);
    }

    // Imposta stato emotivo
    setEmotionalState(state) {
        if (Object.values(EMOTIONAL_STATES).includes(state)) {
            this.emotionalState = state;
            logger.system(`Stato emotivo cambiato a: ${state}`);
            return true;
        }
        return false;
    }

    // Ottiene stato emotivo corrente
    getEmotionalState() {
        return this.emotionalState;
    }
}

export default BellaAI;