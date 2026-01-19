// =============================================================================
// AUTH PAGE JAVASCRIPT
// =============================================================================
// Handles login and registration functionality.
// This script runs on the index.html page.
//
// FLOW:
// 1. Check if already logged in → redirect to dashboard
// 2. Handle tab switching between login/register
// 3. Handle form submissions
// 4. Store token and redirect on success
// =============================================================================

// =============================================================================
// INITIALIZATION
// =============================================================================
// Wait for DOM to be ready, then set up event listeners.
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already logged in
    if (redirectIfAuthenticated()) {
        return;
    }

    // Get DOM elements
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const alertContainer = document.getElementById('auth-alert');

    // =============================================================================
    // TAB SWITCHING
    // =============================================================================
    // Handle clicking on Sign In / Sign Up tabs.
    // Shows/hides the appropriate form.
    // =============================================================================

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding form
            const tabName = tab.dataset.tab;

            if (tabName === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }

            // Hide any existing alerts
            hideAlert(alertContainer);
        });
    });

    // =============================================================================
    // LOGIN FORM SUBMISSION
    // =============================================================================

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page reload

        // Get form values
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        // Get submit button for loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
            // Show loading state
            setButtonLoading(submitBtn, true);
            hideAlert(alertContainer);

            // Make API call
            const response = await api.post('/auth/login', { email, password });

            // Store token and user data
            setToken(response.data.token);
            setUser(response.data.user);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            // Show error message
            showAlert(alertContainer, error.message, 'error');
        } finally {
            // Hide loading state
            setButtonLoading(submitBtn, false);
        }
    });

    // =============================================================================
    // REGISTER FORM SUBMISSION
    // =============================================================================

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page reload

        // Get form values
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        // Basic validation
        if (password.length < 6) {
            showAlert(alertContainer, 'Password must be at least 6 characters', 'error');
            return;
        }

        // Get submit button for loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        try {
            // Show loading state
            setButtonLoading(submitBtn, true);
            hideAlert(alertContainer);

            // Make API call
            const response = await api.post('/auth/register', { name, email, password });

            // Store token and user data
            setToken(response.data.token);
            setUser(response.data.user);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            // Show error message
            showAlert(alertContainer, error.message, 'error');
        } finally {
            // Hide loading state
            setButtonLoading(submitBtn, false);
        }
    });
});
