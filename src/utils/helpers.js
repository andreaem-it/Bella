// Utility e helper per Bella AI

/**
 * Genera un ID univoco
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatta la data corrente
 */
export function formatDate(date = new Date()) {
    return date.toLocaleString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Pulisce il testo da caratteri speciali
 */
export function sanitizeText(text) {
    return text.replace(/[<>]/g, '').trim();
}

/**
 * Tronca il testo alla lunghezza specificata
 */
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Valida un indirizzo email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Debounce per limitare le chiamate frequenti
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle per limitare la frequenza delle chiamate
 */
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Salva dati nel localStorage
 */
export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Errore nel salvataggio:', error);
        return false;
    }
}

/**
 * Carica dati dal localStorage
 */
export function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Errore nel caricamento:', error);
        return defaultValue;
    }
}

/**
 * Rimuove dati dal localStorage
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Errore nella rimozione:', error);
        return false;
    }
}

/**
 * Controlla se il browser supporta una feature
 */
export function isFeatureSupported(feature) {
    const features = {
        speechSynthesis: 'speechSynthesis' in window,
        notifications: 'Notification' in window,
        localStorage: 'localStorage' in window,
        webAudio: 'AudioContext' in window || 'webkitAudioContext' in window
    };
    return features[feature] || false;
}

/**
 * Gestisce gli errori in modo uniforme
 */
export function handleError(error, context = '') {
    const errorMessage = {
        message: error.message || 'Errore sconosciuto',
        context: context,
        timestamp: new Date().toISOString(),
        stack: error.stack
    };
    
    console.error('Errore Bella AI:', errorMessage);
    
    // In produzione, potremmo inviare l'errore a un servizio di logging
    if (process.env.NODE_ENV === 'production') {
        // logError(errorMessage);
    }
    
    return errorMessage;
}
