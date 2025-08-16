// main.js - Entry point principale per Bella AI
import { logger } from './utils/logger.js';
import { CONFIG } from '../config/config.js';
import { UI_EVENTS, MESSAGE_TYPES } from './utils/constants.js';
import { handleError } from './utils/helpers.js';
import BellaAI from './core/BellaAI.js';
import CloudAPIService from './api/CloudAPIService.js';
import ChatInterface from './ui/ChatInterface.js';
import AdvancedFeatures from './features/AdvancedFeatures.js';

class BellaApp {
    constructor() {
        this.bellaAI = null;
        this.cloudAPI = null;
        this.chatInterface = null;
        this.advancedFeatures = null;
        this.isInitialized = false;
        this.autoShowTimer = null;
        this.videoIndex = 0;
        this.videos = [];
        
        logger.system('BellaApp istanziata');
    }

    // Inizializza l'applicazione
    async init() {
        try {
            logger.system('Inizializzazione Bella AI...');
            
            // Inizializza servizi in ordine
            await this.initCloudAPI();
            await this.initBellaAI();
            await this.initChatInterface();
            await this.initAdvancedFeatures();
            
            // Inizializza video di sfondo
            this.initBackgroundVideos();
            
            // Collega eventi
            this.bindEvents();
            
            // Imposta timer per mostrare automaticamente l'interfaccia
            this.setupAutoShow();
            
            // Nascondi schermata di caricamento
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            logger.system('Bella AI inizializzata con successo');
            
            // Mostra messaggio di benvenuto
            this.showWelcomeMessage();
            
        } catch (error) {
            logger.error('Errore durante l\'inizializzazione di Bella AI', error);
            this.showErrorMessage('Errore durante l\'inizializzazione. Ricarica la pagina.');
        }
    }

    // Inizializza video di sfondo
    initBackgroundVideos() {
        try {
            const video1 = document.getElementById('video1');
            const video2 = document.getElementById('video2');
            
            if (video1 && video2) {
                this.videos = [video1, video2];
                
                // Imposta eventi per i video
                this.videos.forEach(video => {
                    video.addEventListener('ended', () => this.switchVideo());
                    video.addEventListener('error', (e) => {
                        logger.error('Errore caricamento video', e);
                        this.switchVideo();
                    });
                });
                
                // Avvia il primo video
                if (this.videos[0]) {
                    this.videos[0].play().catch(e => {
                        logger.error('Errore riproduzione video', e);
                    });
                }
                
                logger.system('Video di sfondo inizializzati');
            }
        } catch (error) {
            logger.error('Errore inizializzazione video di sfondo', error);
        }
    }

    // Cambia video di sfondo
    switchVideo() {
        try {
            const currentVideo = this.videos[this.videoIndex];
            const nextVideo = this.videos[(this.videoIndex + 1) % this.videos.length];
            
            if (currentVideo && nextVideo) {
                // Fade out video corrente
                currentVideo.classList.remove('active');
                
                // Fade in nuovo video
                setTimeout(() => {
                    nextVideo.classList.add('active');
                    nextVideo.play().catch(e => {
                        logger.error('Errore riproduzione video successivo', e);
                    });
                }, 500);
                
                // Aggiorna indice
                this.videoIndex = (this.videoIndex + 1) % this.videos.length;
                
                logger.system('Video di sfondo cambiato');
            }
        } catch (error) {
            logger.error('Errore cambio video', error);
        }
    }

    // Nasconde schermata di caricamento
    hideLoadingScreen() {
        try {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 1500);
                
                logger.system('Schermata di caricamento nascosta');
            }
        } catch (error) {
            logger.error('Errore nascondere schermata caricamento', error);
        }
    }

    // Inizializza servizio API cloud
    async initCloudAPI() {
        try {
            this.cloudAPI = new CloudAPIService();
            logger.system('Servizio API cloud inizializzato');
        } catch (error) {
            logger.error('Errore inizializzazione servizio API cloud', error);
            throw error;
        }
    }

    // Inizializza core AI
    async initBellaAI() {
        try {
            this.bellaAI = BellaAI.getInstance();
            await this.bellaAI.init(this.cloudAPI);
            logger.system('Core AI inizializzato');
        } catch (error) {
            logger.error('Errore inizializzazione core AI', error);
            throw error;
        }
    }

    // Inizializza interfaccia chat
    async initChatInterface() {
        try {
            this.chatInterface = new ChatInterface();
            logger.system('Interfaccia chat inizializzata');
        } catch (error) {
            logger.error('Errore inizializzazione interfaccia chat', error);
            throw error;
        }
    }

    // Inizializza funzionalità avanzate
    async initAdvancedFeatures() {
        try {
            this.advancedFeatures = new AdvancedFeatures();
            logger.system('Funzionalità avanzate inizializzate');
        } catch (error) {
            logger.error('Errore inizializzazione funzionalità avanzate', error);
            throw error;
        }
    }

    // Collega eventi
    bindEvents() {
        // Messaggio inviato dall'interfaccia
        document.addEventListener(UI_EVENTS.MESSAGE_SENT, async (event) => {
            await this.handleUserMessage(event.detail);
        });

        // Cambio provider AI
        document.addEventListener(UI_EVENTS.PROVIDER_CHANGED, (event) => {
            this.handleProviderChange(event.detail);
        });

        // Cambio modalità chat
        document.addEventListener(UI_EVENTS.MODE_CHANGED, (event) => {
            this.handleModeChange(event.detail);
        });

        // Input vocale
        document.addEventListener(UI_EVENTS.VOICE_INPUT, (event) => {
            this.handleVoiceInput(event.detail);
        });

        // Gestione errori globali
        window.addEventListener('error', (event) => {
            logger.error('Errore globale JavaScript', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            logger.error('Promise rifiutata non gestita', event.reason);
        });

        // Collega pulsanti UI
        this.bindUIEvents();

        logger.system('Eventi collegati');
    }

    // Collega eventi UI
    bindUIEvents() {
        // Pulsante toggle chat
        const chatToggleBtn = document.getElementById('chat-toggle-btn');
        if (chatToggleBtn) {
            chatToggleBtn.addEventListener('click', () => {
                this.toggleChatInterface();
            });
        }

        // Pulsante test chat
        const chatTestBtn = document.getElementById('chat-test-btn');
        if (chatTestBtn) {
            chatTestBtn.addEventListener('click', () => {
                this.testChatInterface();
            });
        }

        // Pulsante microfono
        const micButton = document.getElementById('mic-button');
        if (micButton) {
            micButton.addEventListener('click', () => {
                this.toggleVoiceRecognition();
            });
        }

        logger.system('Eventi UI collegati');
    }

    // Toggle interfaccia chat
    toggleChatInterface() {
        if (this.chatInterface) {
            if (this.chatInterface.isVisible) {
                this.chatInterface.hide();
                logger.ui('Interfaccia chat nascosta manualmente');
            } else {
                this.chatInterface.show();
                logger.ui('Interfaccia chat mostrata manualmente');
            }
        }
    }

    // Test interfaccia chat
    testChatInterface() {
        if (this.chatInterface) {
            // Mostra interfaccia se non è visibile
            if (!this.chatInterface.isVisible) {
                this.chatInterface.show();
            }

            // Aggiungi messaggio di test
            this.chatInterface.addMessage(MESSAGE_TYPES.ASSISTANT, 
                'Ciao! Questo è un messaggio di test per verificare che l\'interfaccia funzioni correttamente! 😊'
            );

            logger.ui('Test interfaccia chat eseguito');
        }
    }

    // Toggle riconoscimento vocale
    toggleVoiceRecognition() {
        if (this.advancedFeatures) {
            if (this.advancedFeatures.speechRecognition) {
                // Implementa logica per toggle riconoscimento vocale
                logger.voice('Toggle riconoscimento vocale richiesto');
            }
        }
    }

    // Gestisce messaggio utente
    async handleUserMessage(detail) {
        try {
            const { message, provider, mode } = detail;
            
            // Aggiorna modalità e provider
            this.bellaAI.setChatMode(mode);
            this.bellaAI.setAIProvider(provider);
            
            // Aggiungi messaggio utente alla cronologia AI
            this.bellaAI.addToHistory(MESSAGE_TYPES.USER, message);
            
            // Ottieni risposta da Bella
            const response = await this.bellaAI.think(message);
            
            // Mostra risposta nell'interfaccia
            this.chatInterface.receiveResponse(response);
            
            // Aggiungi risposta alla cronologia AI
            this.bellaAI.addToHistory(MESSAGE_TYPES.ASSISTANT, response);
            
            // Riproduci vocalmente se abilitato
            if (this.advancedFeatures.isVoiceEnabled) {
                this.advancedFeatures.speak(response);
            }
            
            logger.chat('Messaggio utente gestito con successo');
            
        } catch (error) {
            logger.error('Errore gestione messaggio utente', error);
            this.chatInterface.receiveError(error);
        }
    }

    // Gestisce cambio provider
    handleProviderChange(detail) {
        try {
            const { provider } = detail;
            
            // Aggiorna provider nel core AI
            this.bellaAI.setAIProvider(provider);
            
            // Aggiorna stato connessione
            this.chatInterface.updateConnectionStatus('connected');
            
            logger.system(`Provider cambiato a: ${provider}`);
            
        } catch (error) {
            logger.error('Errore cambio provider', error);
            this.chatInterface.updateConnectionStatus('error');
        }
    }

    // Gestisce cambio modalità
    handleModeChange(detail) {
        try {
            const { mode } = detail;
            
            // Aggiorna modalità nel core AI
            this.bellaAI.setChatMode(mode);
            
            logger.system(`Modalità cambiata a: ${mode}`);
            
        } catch (error) {
            logger.error('Errore cambio modalità', error);
        }
    }

    // Gestisce input vocale
    handleVoiceInput(detail) {
        try {
            const { transcript } = detail;
            
            // Inserisci testo nell'input della chat
            if (this.chatInterface.chatInput) {
                this.chatInterface.chatInput.value = transcript;
                
                // Simula invio messaggio
                this.chatInterface.sendMessage();
            }
            
            logger.voice(`Input vocale gestito: ${transcript}`);
            
        } catch (error) {
            logger.error('Errore gestione input vocale', error);
        }
    }

    // Configura auto-show dell'interfaccia
    setupAutoShow() {
        if (CONFIG.ui.chat.autoShowDelay > 0) {
            this.autoShowTimer = setTimeout(() => {
                this.showChatInterface();
            }, CONFIG.ui.chat.autoShowDelay);
            
            logger.system(`Auto-show interfaccia configurato per ${CONFIG.ui.chat.autoShowDelay}ms`);
        }
    }

    // Mostra interfaccia chat
    showChatInterface() {
        if (this.chatInterface && !this.chatInterface.isVisible) {
            this.chatInterface.show();
            logger.ui('Interfaccia chat mostrata automaticamente');
        }
    }

    // Mostra messaggio di benvenuto
    showWelcomeMessage() {
        if (this.chatInterface) {
            this.chatInterface.addMessage(MESSAGE_TYPES.ASSISTANT, 
                'Ciao! Sono Bella, la tua compagna AI. Sono qui per chiacchierare e aiutarti! 💕'
            );
        }
    }

    // Mostra messaggio di errore
    showErrorMessage(message) {
        if (this.chatInterface) {
            this.chatInterface.addMessage(MESSAGE_TYPES.SYSTEM, message);
        }
    }

    // Ottiene informazioni sull'applicazione
    getAppInfo() {
        return {
            isInitialized: this.isInitialized,
            bellaAI: this.bellaAI ? this.bellaAI.getSystemInfo() : null,
            chatInterface: this.chatInterface ? this.chatInterface.getInterfaceInfo() : null,
            advancedFeatures: this.advancedFeatures ? this.advancedFeatures.getFeaturesInfo() : null,
            config: {
                version: '1.0.0',
                environment: CONFIG.debug ? 'development' : 'production',
                logLevel: CONFIG.logLevel
            }
        };
    }

    // Pulisce risorse
    cleanup() {
        if (this.autoShowTimer) {
            clearTimeout(this.autoShowTimer);
        }
        
        if (this.advancedFeatures) {
            this.advancedFeatures.cleanup();
        }
        
        logger.system('Risorse applicazione pulite');
    }
}

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new BellaApp();
        await app.init();
        
        // Esponi app globalmente per debugging
        window.bellaApp = app;
        
        logger.system('Bella AI pronta! 🚀');
        
    } catch (error) {
        logger.error('Errore inizializzazione applicazione', error);
        console.error('Errore inizializzazione Bella AI:', error);
    }
});

// Gestione chiusura pagina
window.addEventListener('beforeunload', () => {
    if (window.bellaApp) {
        window.bellaApp.cleanup();
    }
});

export default BellaApp;