// ChatInterface.js - Interfaccia utente per la chat con Bella AI
import { logger } from '../utils/logger.js';
import { CONFIG } from '../../config/config.js';
import { MESSAGE_TYPES, CHAT_MODES, AI_PROVIDERS, UI_EVENTS } from '../utils/constants.js';
import { generateId, formatDate, handleError } from '../utils/helpers.js';

class ChatInterface {
    constructor() {
        this.isVisible = false;
        this.isMinimized = false;
        this.currentMode = CHAT_MODES.CASUAL;
        this.currentProvider = AI_PROVIDERS.OPENAI;
        this.messageHistory = [];
        this.isTyping = false;
        
        this.init();
        logger.ui('ChatInterface istanziata');
    }

    // Inizializza l'interfaccia
    init() {
        this.createChatContainer();
        this.bindEvents();
        this.loadSettings();
        logger.ui('ChatInterface inizializzata');
    }

    // Crea il container della chat
    createChatContainer() {
        // Rimuovi container esistente se presente
        const existingContainer = document.querySelector('.bella-chat-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Crea nuovo container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'bella-chat-container';
        chatContainer.innerHTML = this.getChatHTML();
        
        document.body.appendChild(chatContainer);
        
        // Riferimenti agli elementi
        this.chatContainer = chatContainer;
        this.chatHeader = chatContainer.querySelector('.bella-chat-header');
        this.chatBody = chatContainer.querySelector('.bella-chat-body');
        this.chatInput = chatContainer.querySelector('.bella-chat-input');
        this.sendButton = chatContainer.querySelector('.bella-send-button');
        this.minimizeButton = chatContainer.querySelector('.bella-minimize-button');
        this.closeButton = chatContainer.querySelector('.bella-close-button');
        this.providerSelect = chatContainer.querySelector('.bella-provider-select');
        this.modeSelect = chatContainer.querySelector('.bella-mode-select');
        this.statusIndicator = chatContainer.querySelector('.bella-status-indicator');
        
        logger.ui('Container chat creato');
    }

    // Ottiene HTML della chat
    getChatHTML() {
        return `
            <div class="bella-chat-header">
                <div class="bella-chat-title">
                    <div class="bella-avatar">B</div>
                    <div class="bella-title-text">
                        <h3>Bella AI</h3>
                        <div class="bella-status">Online</div>
                    </div>
                </div>
                <div class="bella-chat-controls">
                    <button class="bella-minimize-button" title="Minimizza">−</button>
                    <button class="bella-close-button" title="Chiudi">×</button>
                </div>
            </div>
            
            <div class="bella-chat-messages">
                <!-- I messaggi verranno inseriti qui dinamicamente -->
            </div>
            
            <div class="bella-chat-input-container">
                <div class="bella-input-wrapper">
                    <textarea class="bella-message-input" placeholder="Scrivi un messaggio a Bella..."></textarea>
                    <button class="bella-send-btn" title="Invia">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="bella-chat-controls-panel">
                    <select class="bella-provider-select">
                        <option value="${AI_PROVIDERS.OPENAI}" selected>OpenAI GPT-3.5 (Consigliato)</option>
                        <option value="${AI_PROVIDERS.CLAUDE}">Claude</option>
                        <option value="${AI_PROVIDERS.PERPLEXITY}">Perplexity</option>
                        <option value="local">Modello Locale</option>
                    </select>
                    
                    <select class="bella-mode-select">
                        <option value="${CHAT_MODES.CASUAL}" selected>Casuale</option>
                        <option value="${CHAT_MODES.ASSISTANT}">Assistente</option>
                        <option value="${CHAT_MODES.CREATIVE}">Creativo</option>
                    </select>
                </div>
            </div>
        `;
    }

    // Collega gli eventi
    bindEvents() {
        // Pulsante invio
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Input con Enter
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Pulsanti controllo
        this.minimizeButton.addEventListener('click', () => this.toggleMinimize());
        this.closeButton.addEventListener('click', () => this.hide());
        
        // Cambio provider
        this.providerSelect.addEventListener('change', (e) => {
            this.currentProvider = e.target.value;
            this.onProviderChange();
        });
        
        // Cambio modalità
        this.modeSelect.addEventListener('change', (e) => {
            this.currentMode = e.target.value;
            this.onModeChange();
        });
        
        logger.ui('Eventi collegati');
    }

    // Mostra l'interfaccia
    show() {
        logger.ui('ChatInterface.show() chiamato');
        logger.ui(`Prima di show isVisible: ${this.isVisible}`);
        logger.ui(`Prima di show chatContainer.className: ${this.chatContainer.className}`);
        
        if (!this.isVisible) {
            this.chatContainer.classList.add('visible');
            this.isVisible = true;
            
            // Focus sull'input
            setTimeout(() => {
                this.chatInput.focus();
            }, 100);
            
            logger.ui(`Dopo show isVisible: ${this.isVisible}`);
            logger.ui(`Dopo show chatContainer.className: ${this.chatContainer.className}`);
            logger.ui(`chatContainer stile opacity: ${getComputedStyle(this.chatContainer).opacity}`);
            logger.ui(`chatContainer stile transform: ${getComputedStyle(this.chatContainer).transform}`);
        }
        
        logger.ui('Interfaccia chat mostrata');
    }

    // Nasconde l'interfaccia
    hide() {
        if (this.isVisible) {
            this.chatContainer.classList.remove('visible');
            this.isVisible = false;
            logger.ui('Interfaccia chat nascosta');
        }
    }

    // Toggle minimizza
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.chatContainer.classList.toggle('minimized', this.isMinimized);
        this.minimizeButton.textContent = this.isMinimized ? '+' : '−';
        logger.ui(`Chat ${this.isMinimized ? 'minimizzata' : 'espansa'}`);
    }

    // Invia messaggio
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Aggiungi messaggio utente
        this.addMessage(MESSAGE_TYPES.USER, message);
        this.chatInput.value = '';
        
        // Mostra indicatore digitazione
        this.showTypingIndicator();
        
        try {
            // Emetti evento per il core
            const event = new CustomEvent(UI_EVENTS.MESSAGE_SENT, {
                detail: {
                    message: message,
                    provider: this.currentProvider,
                    mode: this.currentMode
                }
            });
            document.dispatchEvent(event);
            
            logger.chat(`Messaggio inviato: ${message}`);
        } catch (error) {
            logger.error('Errore invio messaggio', error);
            this.addMessage(MESSAGE_TYPES.SYSTEM, 'Errore nell\'invio del messaggio');
        }
    }

    // Aggiunge messaggio alla chat
    addMessage(type, content, timestamp = new Date()) {
        const messageId = generateId();
        const messageElement = document.createElement('div');
        messageElement.className = `bella-message bella-message-${type}`;
        messageElement.id = `message-${messageId}`;
        
        const timeString = formatDate(timestamp);
        
        messageElement.innerHTML = `
            <div class="bella-message-content">
                <div class="bella-message-text">${this.sanitizeMessage(content)}</div>
                <div class="bella-message-time">${timeString}</div>
            </div>
        `;
        
        this.chatBody.querySelector('.bella-chat-messages').appendChild(messageElement);
        
        // Scroll in fondo
        this.scrollToBottom();
        
        // Salva nel messaggio
        this.messageHistory.push({
            id: messageId,
            type: type,
            content: content,
            timestamp: timestamp
        });
        
        // Mantieni cronologia entro i limiti
        if (this.messageHistory.length > CONFIG.ui.chat.maxHistoryLength) {
            this.messageHistory.shift();
            const firstMessage = this.chatBody.querySelector('.bella-message');
            if (firstMessage) firstMessage.remove();
        }
        
        logger.chat(`Messaggio aggiunto: ${type}`);
    }

    // Mostra indicatore digitazione
    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingElement = document.createElement('div');
        typingElement.className = 'bella-typing-indicator';
        typingElement.innerHTML = `
            <div class="bella-typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        
        this.chatBody.querySelector('.bella-chat-messages').appendChild(typingElement);
        this.scrollToBottom();
        
        logger.ui('Indicatore digitazione mostrato');
    }

    // Nasconde indicatore digitazione
    hideTypingIndicator() {
        this.isTyping = false;
        const typingElement = this.chatBody.querySelector('.bella-typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
        
        logger.ui('Indicatore digitazione nascosto');
    }

    // Riceve risposta da Bella
    receiveResponse(response) {
        this.hideTypingIndicator();
        this.addMessage(MESSAGE_TYPES.ASSISTANT, response);
        logger.chat('Risposta ricevuta da Bella');
    }

    // Riceve errore
    receiveError(error) {
        this.hideTypingIndicator();
        this.addMessage(MESSAGE_TYPES.SYSTEM, `Errore: ${error.message || error}`);
        logger.error('Errore ricevuto nell\'interfaccia', error);
    }

    // Scroll in fondo
    scrollToBottom() {
        const messagesContainer = this.chatBody.querySelector('.bella-chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Sanitizza messaggio per sicurezza
    sanitizeMessage(message) {
        const div = document.createElement('div');
        div.textContent = message;
        return div.innerHTML;
    }

    // Cambio provider
    onProviderChange() {
        logger.system(`Provider cambiato a: ${this.currentProvider}`);
        this.saveSettings();
        
        // Emetti evento
        const event = new CustomEvent(UI_EVENTS.PROVIDER_CHANGED, {
            detail: { provider: this.currentProvider }
        });
        document.dispatchEvent(event);
    }

    // Cambio modalità
    onModeChange() {
        logger.system(`Modalità cambiata a: ${this.currentMode}`);
        this.saveSettings();
        
        // Emetti evento
        const event = new CustomEvent(UI_EVENTS.MODE_CHANGED, {
            detail: { mode: this.currentMode }
        });
        document.dispatchEvent(event);
    }

    // Aggiorna stato connessione
    updateConnectionStatus(status) {
        this.statusIndicator.className = `bella-status-indicator ${status}`;
        this.statusIndicator.title = this.getStatusTitle(status);
        logger.ui(`Stato connessione aggiornato: ${status}`);
    }

    // Ottiene titolo stato
    getStatusTitle(status) {
        const titles = {
            'connected': 'Connesso',
            'connecting': 'Connessione...',
            'error': 'Errore connessione',
            'disconnected': 'Disconnesso'
        };
        return titles[status] || 'Sconosciuto';
    }

    // Carica impostazioni
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('bella_chat_settings') || '{}');
            this.currentProvider = settings.provider || AI_PROVIDERS.OPENAI;
            this.currentMode = settings.mode || CHAT_MODES.CASUAL;
            
            // Aggiorna UI
            this.providerSelect.value = this.currentProvider;
            this.modeSelect.value = this.currentMode;
            
            logger.ui('Impostazioni caricate');
        } catch (error) {
            logger.error('Errore caricamento impostazioni', error);
        }
    }

    // Salva impostazioni
    saveSettings() {
        try {
            const settings = {
                provider: this.currentProvider,
                mode: this.currentMode
            };
            localStorage.setItem('bella_chat_settings', JSON.stringify(settings));
            logger.ui('Impostazioni salvate');
        } catch (error) {
            logger.error('Errore salvataggio impostazioni', error);
        }
    }

    // Pulisce cronologia
    clearHistory() {
        this.messageHistory = [];
        this.chatBody.querySelector('.bella-chat-messages').innerHTML = '';
        logger.chat('Cronologia chat pulita');
    }

    // Ottiene informazioni interfaccia
    getInterfaceInfo() {
        return {
            isVisible: this.isVisible,
            isMinimized: this.isMinimized,
            currentProvider: this.currentProvider,
            currentMode: this.currentMode,
            messageCount: this.messageHistory.length
        };
    }
}

export default ChatInterface;
export { ChatInterface };