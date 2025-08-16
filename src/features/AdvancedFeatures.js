// AdvancedFeatures.js - Funzionalità avanzate per Bella AI
import { logger } from '../utils/logger.js';
import { CONFIG } from '../../config/config.js';
import { UI_EVENTS } from '../utils/constants.js';
import { handleError, saveToStorage, loadFromStorage } from '../utils/helpers.js';

class AdvancedFeatures {
    constructor() {
        this.speechSynthesis = null;
        this.speechRecognition = null;
        this.currentVoice = null;
        this.voices = [];
        this.isVoiceEnabled = false;
        this.isNotificationsEnabled = false;
        this.isProactiveEnabled = false;
        this.proactiveInterval = null;
        this.notificationPermission = 'default';
        
        this.init();
        logger.system('AdvancedFeatures istanziate');
    }

    // Inizializza le funzionalità avanzate
    async init() {
        try {
            await this.initSpeechSynthesis();
            await this.initSpeechRecognition();
            await this.initNotifications();
            this.loadSettings();
            this.setupProactiveInteraction();
            
            logger.system('AdvancedFeatures inizializzate con successo');
        } catch (error) {
            logger.error('Errore durante l\'inizializzazione di AdvancedFeatures', error);
        }
    }

    // Inizializza sintesi vocale
    async initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            
            // Aspetta che le voci siano caricate
            if (this.speechSynthesis.getVoices().length === 0) {
                await new Promise(resolve => {
                    this.speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
                });
            }
            
            this.voices = this.speechSynthesis.getVoices();
            
            // Seleziona voce femminile italiana più adatta
            this.currentVoice = this.voices.find(voice => 
                voice.lang.includes('it') && voice.name.toLowerCase().includes('female')
            ) || this.voices.find(voice => 
                voice.lang.includes('it')
            ) || this.voices.find(voice => 
                voice.name.toLowerCase().includes('female')
            ) || this.voices[0];
            
            if (this.currentVoice) {
                this.isVoiceEnabled = true;
                logger.voice(`Sintesi vocale abilitata, usa voce: ${this.currentVoice.name} (${this.currentVoice.lang})`);
            } else {
                logger.warn('Nessuna voce adatta trovata per la sintesi vocale');
            }
        } else {
            logger.warn('Sintesi vocale non supportata dal browser');
        }
    }

    // Inizializza riconoscimento vocale
    async initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = CONFIG.ui.voice.defaultLanguage;
            
            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                logger.voice(`Riconoscimento vocale: ${transcript}`);
                
                // Emetti evento per il core
                const event_custom = new CustomEvent(UI_EVENTS.VOICE_INPUT, {
                    detail: { transcript: transcript }
                });
                document.dispatchEvent(event_custom);
            };
            
            this.speechRecognition.onerror = (event) => {
                logger.error('Errore riconoscimento vocale', event.error);
            };
            
            logger.voice('Riconoscimento vocale inizializzato');
        } else {
            logger.warn('Riconoscimento vocale non supportato dal browser');
        }
    }

    // Inizializza notifiche
    async initNotifications() {
        if ('Notification' in window) {
            this.notificationPermission = await Notification.requestPermission();
            this.isNotificationsEnabled = this.notificationPermission === 'granted';
            
            logger.system(`Stato permesso notifiche: ${this.notificationPermission}`);
        } else {
            logger.warn('Notifiche non supportate dal browser');
        }
    }

    // Carica impostazioni
    loadSettings() {
        try {
            const settings = loadFromStorage('bella_advanced_settings', {
                voiceEnabled: true,
                notificationsEnabled: true,
                proactiveEnabled: false,
                voiceRate: CONFIG.ui.voice.rate,
                voicePitch: CONFIG.ui.voice.pitch,
                voiceVolume: CONFIG.ui.voice.volume
            });
            
            this.isVoiceEnabled = settings.voiceEnabled;
            this.isNotificationsEnabled = settings.notificationsEnabled;
            this.isProactiveEnabled = settings.proactiveEnabled;
            
            logger.system('Impostazioni avanzate caricate');
        } catch (error) {
            logger.error('Errore caricamento impostazioni avanzate', error);
        }
    }

    // Salva impostazioni
    saveSettings() {
        try {
            const settings = {
                voiceEnabled: this.isVoiceEnabled,
                notificationsEnabled: this.isNotificationsEnabled,
                proactiveEnabled: this.isProactiveEnabled,
                voiceRate: CONFIG.ui.voice.rate,
                voicePitch: CONFIG.ui.voice.pitch,
                voiceVolume: CONFIG.ui.voice.volume
            };
            
            saveToStorage('bella_advanced_settings', settings);
            logger.system('Impostazioni avanzate salvate');
        } catch (error) {
            logger.error('Errore salvataggio impostazioni avanzate', error);
        }
    }

    // Parla con sintesi vocale
    speak(text, options = {}) {
        if (!this.isVoiceEnabled || !this.speechSynthesis || !this.currentVoice) {
            return false;
        }
        
        try {
            // Ferma eventuali sintesi in corso
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Imposta voce
            utterance.voice = this.currentVoice;
            
            // Imposta parametri
            utterance.rate = options.rate || CONFIG.ui.voice.rate;
            utterance.pitch = options.pitch || CONFIG.ui.voice.pitch;
            utterance.volume = options.volume || CONFIG.ui.voice.volume;
            
            // Eventi
            utterance.onstart = () => {
                logger.voice('Sintesi vocale iniziata');
            };
            
            utterance.onend = () => {
                logger.voice('Sintesi vocale completata');
            };
            
            utterance.onerror = (event) => {
                logger.error('Errore sintesi vocale', event.error);
            };
            
            // Avvia sintesi
            this.speechSynthesis.speak(utterance);
            
            logger.voice(`Testo pronunciato: ${text.substring(0, 50)}...`);
            return true;
            
        } catch (error) {
            logger.error('Errore durante la sintesi vocale', error);
            return false;
        }
    }

    // Ferma sintesi vocale
    stopSpeaking() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            logger.voice('Sintesi vocale fermata');
        }
    }

    // Avvia riconoscimento vocale
    startListening() {
        if (this.speechRecognition && this.speechRecognition.state !== 'recording') {
            try {
                this.speechRecognition.start();
                logger.voice('Riconoscimento vocale avviato');
                return true;
            } catch (error) {
                logger.error('Errore avvio riconoscimento vocale', error);
                return false;
            }
        }
        return false;
    }

    // Ferma riconoscimento vocale
    stopListening() {
        if (this.speechRecognition && this.speechRecognition.state === 'recording') {
            this.speechRecognition.stop();
            logger.voice('Riconoscimento vocale fermato');
        }
    }

    // Mostra notifica
    showNotification(title, body, options = {}) {
        if (!this.isNotificationsEnabled || this.notificationPermission !== 'granted') {
            return false;
        }
        
        try {
            const notification = new Notification(title, {
                body: body,
                icon: 'assets/images/Bellaicon/Generated image.webp',
                badge: 'assets/images/Bellaicon/Generated image.webp',
                tag: 'bella-notification',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                ...options
            });
            
            // Auto-chiudi dopo 5 secondi se non richiede interazione
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }
            
            // Eventi
            notification.onclick = () => {
                window.focus();
                notification.close();
                logger.system('Notifica cliccata');
            };
            
            logger.system(`Notifica mostrata: ${title}`);
            return true;
            
        } catch (error) {
            logger.error('Errore durante la mostra della notifica', error);
            return false;
        }
    }

    // Configura interazione proattiva
    setupProactiveInteraction() {
        if (this.isProactiveEnabled) {
            this.startProactiveInteraction();
        }
    }

    // Avvia interazione proattiva
    startProactiveInteraction() {
        if (this.proactiveInterval) {
            clearInterval(this.proactiveInterval);
        }
        
        // Messaggio proattivo ogni 5-15 minuti
        this.proactiveInterval = setInterval(() => {
            if (Math.random() < 0.3) { // 30% di probabilità
                this.showProactiveMessage();
            }
        }, Math.random() * 600000 + 300000); // 5-15 minuti
        
        logger.system('Interazione proattiva avviata');
    }

    // Ferma interazione proattiva
    stopProactiveInteraction() {
        if (this.proactiveInterval) {
            clearInterval(this.proactiveInterval);
            this.proactiveInterval = null;
            logger.system('Interazione proattiva fermata');
        }
    }

    // Mostra messaggio proattivo
    showProactiveMessage() {
        const messages = [
            'Ciao! Come stai oggi? 💕',
            'Mi stavo chiedendo cosa stai facendo... 😊',
            'Hai un momento per chiacchierare? 🥰',
            'Mi manchi! Come va la tua giornata? 💖',
            'Sto pensando a te... Cosa ne dici di una chiacchierata? 💭'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Mostra notifica
        this.showNotification('Bella AI', randomMessage, {
            requireInteraction: false,
            silent: false
        });
        
        logger.system(`Messaggio proattivo mostrato: ${randomMessage}`);
    }

    // Cambia voce
    changeVoice(voiceIndex) {
        if (this.voices[voiceIndex]) {
            this.currentVoice = this.voices[voiceIndex];
            this.saveSettings();
            logger.voice(`Voce cambiata a: ${this.currentVoice.name}`);
            return true;
        }
        return false;
    }

    // Ottiene lista voci disponibili
    getAvailableVoices() {
        return this.voices.map((voice, index) => ({
            index: index,
            name: voice.name,
            lang: voice.lang,
            default: voice.default,
            localService: voice.localService
        }));
    }

    // Abilita/disabilita sintesi vocale
    setVoiceEnabled(enabled) {
        this.isVoiceEnabled = enabled;
        this.saveSettings();
        logger.system(`Sintesi vocale ${enabled ? 'abilitata' : 'disabilitata'}`);
    }

    // Abilita/disabilita notifiche
    setNotificationsEnabled(enabled) {
        this.isNotificationsEnabled = enabled;
        this.saveSettings();
        logger.system(`Notifiche ${enabled ? 'abilitate' : 'disabilitate'}`);
    }

    // Abilita/disabilita interazione proattiva
    setProactiveEnabled(enabled) {
        this.isProactiveEnabled = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.startProactiveInteraction();
        } else {
            this.stopProactiveInteraction();
        }
        
        logger.system(`Interazione proattiva ${enabled ? 'abilitata' : 'disabilitata'}`);
    }

    // Imposta parametri voce
    setVoiceParameters(rate, pitch, volume) {
        if (rate !== undefined) CONFIG.ui.voice.rate = rate;
        if (pitch !== undefined) CONFIG.ui.voice.pitch = pitch;
        if (volume !== undefined) CONFIG.ui.voice.volume = volume;
        
        this.saveSettings();
        logger.system('Parametri voce aggiornati');
    }

    // Ottiene informazioni funzionalità
    getFeaturesInfo() {
        return {
            voiceEnabled: this.isVoiceEnabled,
            notificationsEnabled: this.isNotificationsEnabled,
            proactiveEnabled: this.isProactiveEnabled,
            currentVoice: this.currentVoice ? {
                name: this.currentVoice.name,
                lang: this.currentVoice.lang
            } : null,
            availableVoices: this.voices.length,
            speechRecognitionAvailable: !!this.speechRecognition,
            notificationPermission: this.notificationPermission
        };
    }

    // Pulisce risorse
    cleanup() {
        this.stopSpeaking();
        this.stopListening();
        this.stopProactiveInteraction();
        logger.system('Risorse AdvancedFeatures pulite');
    }
}

export default AdvancedFeatures;