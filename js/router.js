// Simple hash-based router for SPA
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const handler = this.routes[hash] || this.routes['/'];

        if (handler) {
            this.currentRoute = hash;
            handler();
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

export const router = new Router();
