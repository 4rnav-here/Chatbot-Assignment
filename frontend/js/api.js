// =============================================================================
// API CLIENT
// =============================================================================
// This file provides a centralized way to make API calls to the backend.
// It handles:
//   - Base URL configuration
//   - Adding authentication headers
//   - Parsing responses
//   - Error handling
//
// USAGE:
// const projects = await api.get('/projects');
// const result = await api.post('/projects', { name: 'My Bot' });
//
// WHY USE THIS:
// - Don't repeat fetch() configuration everywhere
// - Automatically add JWT token to requests
// - Consistent error handling
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================
// Auto-detect environment: use localhost for development, production URL otherwise
// TODO: Replace YOUR_RAILWAY_URL with your actual Railway backend URL after deployment
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://chatbot-assignment-production.up.railway.app/api';

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================
// We store the JWT token in localStorage so it persists across page reloads.
// Functions to get and set the token.
// =============================================================================

/**
 * Get the stored authentication token
 * @returns {string|null} The JWT token or null if not logged in
 */
function getToken() {
    return localStorage.getItem('chatbot_token');
}

/**
 * Store the authentication token
 * @param {string} token - The JWT token from login/register
 */
function setToken(token) {
    localStorage.setItem('chatbot_token', token);
}

/**
 * Remove the authentication token (logout)
 */
function removeToken() {
    localStorage.removeItem('chatbot_token');
}

/**
 * Get stored user data
 * @returns {Object|null} User object or null
 */
function getUser() {
    const user = localStorage.getItem('chatbot_user');
    return user ? JSON.parse(user) : null;
}

/**
 * Store user data
 * @param {Object} user - User object from API
 */
function setUser(user) {
    localStorage.setItem('chatbot_user', JSON.stringify(user));
}

/**
 * Remove stored user data
 */
function removeUser() {
    localStorage.removeItem('chatbot_user');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if logged in
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Redirect to login page if not authenticated
 * Call this at the start of protected pages
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

/**
 * Redirect to dashboard if already authenticated
 * Call this on login page
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
}

/**
 * Logout the user
 */
function logout() {
    removeToken();
    removeUser();
    window.location.href = 'index.html';
}

// =============================================================================
// API REQUEST FUNCTION
// =============================================================================
// Main function to make API requests. Handles auth headers and errors.
// =============================================================================

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/projects')
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If request fails or returns error
 */
async function apiRequest(endpoint, options = {}) {
    // Build the full URL
    const url = `${API_BASE_URL}${endpoint}`;

    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add auth header if we have a token
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(url, {
        ...options,
        headers
    });

    // Parse the JSON response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
            removeToken();
            removeUser();

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }

        throw new Error(data.message || 'An error occurred');
    }

    return data;
}

// =============================================================================
// API METHODS
// =============================================================================
// Convenience methods for common HTTP verbs.
// =============================================================================

const api = {
    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @returns {Promise<Object>} Response data
     */
    post: (endpoint, body) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    }),

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body
     * @returns {Promise<Object>} Response data
     */
    put: (endpoint, body) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
    }),

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),

    /**
     * Upload a file
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data with file
     * @returns {Promise<Object>} Response data
     */
    upload: async (endpoint, formData) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = getToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                // Don't set Content-Type for FormData - browser will set it with boundary
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable size (e.g., "1.5 MB")
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time for chat messages
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show an alert message
 * @param {HTMLElement} container - Alert container element
 * @param {string} message - Message to display
 * @param {string} type - Alert type (success, error, warning)
 */
function showAlert(container, message, type = 'error') {
    container.textContent = message;
    container.className = `alert alert-${type}`;
    container.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.style.display = 'none';
    }, 5000);
}

/**
 * Hide an alert message
 * @param {HTMLElement} container - Alert container element
 */
function hideAlert(container) {
    container.style.display = 'none';
}

/**
 * Set button loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - Whether to show loading state
 */
function setButtonLoading(button, loading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');

    if (loading) {
        button.disabled = true;
        if (text) text.style.display = 'none';
        if (spinner) spinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        if (text) text.style.display = 'inline';
        if (spinner) spinner.style.display = 'none';
    }
}

/**
 * Get initials from a name (for avatar)
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
function getInitials(name) {
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for innerHTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
