// Costanti per Bella AI

// Tipi di messaggio
export const MESSAGE_TYPES = {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system'
};

// Modalità chat
export const CHAT_MODES = {
    CASUAL: 'casual',
    ASSISTANT: 'assistant',
    CREATIVE: 'creative'
};

// Stati emotivi
export const EMOTIONAL_STATES = {
    HAPPY: 'happy',
    EXCITED: 'excited',
    THOUGHTFUL: 'thoughtful',
    CARING: 'caring',
    PLAYFUL: 'playful'
};

// Provider AI
export const AI_PROVIDERS = {
    OPENAI: 'openai',
    CLAUDE: 'claude',
    PERPLEXITY: 'perplexity',
    LOCAL: 'local'
};

// Eventi UI
export const UI_EVENTS = {
    CHAT_OPENED: 'chatOpened',
    CHAT_CLOSED: 'chatClosed',
    MESSAGE_SENT: 'messageSent',
    MESSAGE_RECEIVED: 'messageReceived',
    VOICE_TOGGLED: 'voiceToggled'
};

// Permessi
export const PERMISSIONS = {
    NOTIFICATIONS: 'notifications',
    MICROPHONE: 'microphone',
    STORAGE: 'storage'
};

// Limiti
export const LIMITS = {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_HISTORY_LENGTH: 50,
    MAX_RETRY_ATTEMPTS: 3,
    RATE_LIMIT_DELAY: 1000
};

// URL e percorsi
export const PATHS = {
    ASSETS: '/assets',
    IMAGES: '/assets/images',
    VIDEOS: '/assets/videos',
    STYLES: '/assets/styles'
};

// Classi CSS
export const CSS_CLASSES = {
    CHAT_CONTAINER: 'bella-chat-container',
    CHAT_VISIBLE: 'visible',
    CHAT_HIDDEN: 'hidden',
    MESSAGE_USER: 'message-user',
    MESSAGE_ASSISTANT: 'message-assistant'
};
