// Main App Entry Point
import { router } from './router.js';
import { initUI } from './ui.js';
import { initScanner } from './scanner.js';

// Views
function scannerView() {
    console.log('Scanner view loaded');
}

// Initialize app
function init() {
    console.log('Initializing QR Scanner SPA...');

    // Initialize modules
    initUI();
    initScanner();

    // Setup routes
    router
        .addRoute('/', scannerView)
        .addRoute('/scanner', scannerView);

    console.log('App initialized successfully');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
