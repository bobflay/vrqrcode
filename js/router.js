// Simple hash-based router for SPA
import { isAuthenticated } from './auth.js';

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.authGuard = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    addRoute(path, handler, requiresAuth = false) {
        this.routes[path] = { handler, requiresAuth };
        return this;
    }

    setAuthGuard(guardFn) {
        this.authGuard = guardFn;
        return this;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const route = this.routes[hash] || this.routes['/'];

        if (!route) {
            console.error('Route not found:', hash);
            return;
        }

        // Check authentication for protected routes
        if (route.requiresAuth && !isAuthenticated()) {
            this.navigate('/login');
            return;
        }

        // Redirect to scanner if already authenticated and on login page
        if (hash === '/login' && isAuthenticated()) {
            this.navigate('/scanner');
            return;
        }

        this.currentRoute = hash;
        route.handler();
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

export const router = new Router();

// View management
export function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });

    // Show the requested view
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'block';
    }
}
