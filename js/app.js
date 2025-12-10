// Main App Entry Point
import { router, showView } from './router.js';
import { initUI } from './ui.js';
import { initScanner } from './scanner.js';
import { login, logout, isAuthenticated, getUser } from './auth.js';

// Login view handler
function loginView() {
    console.log('Login view loaded');
    showView('loginView');
    initLoginForm();
}

// Scanner view handler
function scannerView() {
    console.log('Scanner view loaded');
    showView('scannerView');

    // Display user name
    const user = getUser();
    if (user) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `${user.firstname} ${user.lastname}`;
        }
    }

    // Initialize scanner if not already done
    initScanner();
}

// Initialize login form
function initLoginForm() {
    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    const errorDiv = document.getElementById('loginError');

    // Remove any existing listeners by cloning
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const newBtnText = newForm.querySelector('.btn-text');
        const newBtnLoader = newForm.querySelector('.btn-loader');
        const newErrorDiv = document.getElementById('loginError');
        const newLoginBtn = document.getElementById('loginBtn');

        // Show loading state
        newBtnText.style.display = 'none';
        newBtnLoader.style.display = 'flex';
        newLoginBtn.disabled = true;
        newErrorDiv.textContent = '';

        try {
            const result = await login(username, password);

            if (result.success) {
                console.log('Login successful:', result.user);
                router.navigate('/scanner');
            } else {
                newErrorDiv.textContent = result.error || 'Login failed. Please try again.';
            }
        } catch (err) {
            console.error('Login error:', err);
            newErrorDiv.textContent = 'An error occurred. Please try again.';
        } finally {
            // Reset button state
            newBtnText.style.display = 'inline';
            newBtnLoader.style.display = 'none';
            newLoginBtn.disabled = false;
        }
    });
}

// Initialize logout button
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            router.navigate('/login');
        });
    }
}

// Initialize app
function init() {
    console.log('Initializing QR Scanner SPA...');

    // Initialize UI
    initUI();

    // Initialize logout
    initLogout();

    // Setup routes
    router
        .addRoute('/', () => {
            // Default route - check auth and redirect
            if (isAuthenticated()) {
                router.navigate('/scanner');
            } else {
                router.navigate('/login');
            }
        })
        .addRoute('/login', loginView, false)
        .addRoute('/scanner', scannerView, true);

    console.log('App initialized successfully');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
