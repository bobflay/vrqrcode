// Authentication module
const API_BASE_URL = 'https://setbc.ci/api/v1';

const AUTH_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'version-app': 'V 1.17.2 PROD'
};

// Token storage
let authToken = null;
let userData = null;

export function getToken() {
    if (!authToken) {
        authToken = localStorage.getItem('auth_token');
    }
    return authToken;
}

export function getUser() {
    if (!userData) {
        const stored = localStorage.getItem('user_data');
        if (stored) {
            userData = JSON.parse(stored);
        }
    }
    return userData;
}

export function isAuthenticated() {
    return !!getToken();
}

export function logout() {
    authToken = null;
    userData = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
}

export async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: AUTH_HEADERS,
            body: JSON.stringify({
                login: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.success && data.success.token) {
            authToken = data.success.token;
            userData = data.success.data;

            // Store in localStorage
            localStorage.setItem('auth_token', authToken);
            localStorage.setItem('user_data', JSON.stringify(userData));

            return {
                success: true,
                user: userData,
                token: authToken
            };
        } else {
            return {
                success: false,
                error: data.error || 'Login failed'
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: 'Network error. Please try again.'
        };
    }
}

// Helper for authenticated API calls
export async function authFetch(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        ...AUTH_HEADERS,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
}
