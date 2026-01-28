// =============================================================================
// CHAT PAGE JAVASCRIPT
// =============================================================================
// Handles the chat interface functionality:
//   - Load project info and messages
//   - Send messages and receive AI responses
//   - Auto-scroll and typing indicators
//   - File uploads
//   - Project settings
//
// This script runs on the chat.html page.
// =============================================================================

// =============================================================================
// GLOBAL STATE
// =============================================================================
let projectId = null;      // Current project ID (from URL)
let project = null;        // Current project data
let messages = [];         // Array of chat messages
let isLoading = false;     // Whether we're waiting for AI response

// =============================================================================
// MARKDOWN TO HTML CONVERTER
// =============================================================================
// Converts markdown formatted text to HTML for proper rendering
// Supports: bold, italic, headers, code blocks, lists, etc.

function markdownToHtml(markdown) {
    let html = markdown;

    // Escape special HTML characters first (for user content safety)
    html = escapeHtml(html);

    // Convert markdown to HTML (in order of specificity)
    
    // Code blocks (triple backticks)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code (single backticks)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers (### Header)
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Unordered lists (- or * or +)
    html = html.replace(/^\s*[-*+] (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');
    
    // Ordered lists (1. 2. 3.)
    html = html.replace(/^\s*\d+\. (.*?)$/gm, '<li>$1</li>');
    
    // Links [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Line breaks (--- or ***)
    html = html.replace(/^(\s*[-*_]){3,}$/gm, '<hr>');
    
    // Paragraphs and line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<(h[1-3]|pre|ul)/g, '<$1');
    html = html.replace(/<\/(h[1-3]|pre|ul)>\s*<\/p>/g, '</$1>');

    return html;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth()) {
        return;
    }

    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('id');

    if (!projectId) {
        alert('No project specified');
        window.location.href = 'dashboard.html';
        return;
    }

    // Initialize the page
    initializeChat();
});

/**
 * Initialize the chat page
 */
async function initializeChat() {
    setupEventListeners();

    try {
        // Load project info
        await loadProject();

        // Load message history
        await loadMessages();

    } catch (error) {
        alert('Error loading project: ' + error.message);
        window.location.href = 'dashboard.html';
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Chat form submission
    document.getElementById('chat-form').addEventListener('submit', handleSendMessage);

    // Auto-resize textarea
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('input', autoResizeTextarea);

    // Send on Enter (Shift+Enter for new line)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('chat-form').requestSubmit();
        }
    });

    // Header buttons
    document.getElementById('files-btn').addEventListener('click', openFilesModal);
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('clear-btn').addEventListener('click', handleClearChat);

    // Files modal
    document.getElementById('files-modal-close').addEventListener('click', closeFilesModal);
    document.getElementById('files-close').addEventListener('click', closeFilesModal);
    document.getElementById('file-upload-area').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', handleFileUpload);

    // Drag and drop for files
    const uploadArea = document.getElementById('file-upload-area');
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--color-primary)';
        uploadArea.style.backgroundColor = 'var(--color-primary-light)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.backgroundColor = '';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    });

    // Settings modal
    document.getElementById('settings-modal-close').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-cancel').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-form').addEventListener('submit', handleSettingsSave);

    // Close modals on overlay click
    document.getElementById('files-modal').addEventListener('click', (e) => {
        if (e.target.id === 'files-modal') closeFilesModal();
    });
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') closeSettingsModal();
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFilesModal();
            closeSettingsModal();
        }
    });
}

/**
 * Auto-resize textarea as user types
 */
function autoResizeTextarea() {
    const textarea = document.getElementById('chat-input');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// =============================================================================
// LOAD PROJECT AND MESSAGES
// =============================================================================

/**
 * Load project information
 */
async function loadProject() {
    const response = await api.get(`/projects/${projectId}`);
    project = response.data.project;

    // Update header
    document.getElementById('project-name').textContent = project.name;
    document.title = `${project.name} - ChatBot`;
}

/**
 * Load message history
 */
async function loadMessages() {
    const response = await api.get(`/chat/${projectId}/messages`);
    messages = response.data.messages;

    renderMessages();
}

/**
 * Render messages to the chat container
 */
function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    // Build the HTML content
    const welcomeHtml = `
        <div class="chat-welcome" id="chat-welcome" style="display: ${messages.length === 0 ? 'block' : 'none'}">
            <div class="chat-welcome-icon">💬</div>
            <h2 class="chat-welcome-title">Start a conversation</h2>
            <p>Type a message below to begin chatting with your AI agent.</p>
        </div>
    `;

    const messagesHtml = messages.map(msg => createMessageElement(msg)).join('');

    // Update the container
    container.innerHTML = welcomeHtml + messagesHtml;

    // Scroll to bottom
    scrollToBottom();
}

/**
 * Create HTML for a single message
 */
function createMessageElement(message) {
    const isUser = message.role === 'user';
    const className = isUser ? 'chat-message-user' : 'chat-message-assistant';
    
    // For user messages, escape HTML for safety
    // For assistant messages, convert markdown to HTML for proper formatting
    const messageContent = isUser 
        ? escapeHtml(message.content)
        : markdownToHtml(message.content);

    return `
    <div class="chat-message ${className}">
      <div class="message-content">${messageContent}</div>
      <div class="chat-message-time">${formatTime(message.createdAt)}</div>
    </div>
  `;
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// =============================================================================
// SEND MESSAGES
// =============================================================================

/**
 * Handle sending a new message
 */
async function handleSendMessage(e) {
    e.preventDefault();

    if (isLoading) return;

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Hide welcome message if it exists
    const welcome = document.getElementById('chat-welcome');
    if (welcome) welcome.style.display = 'none';

    // Add user message to UI immediately
    const userMessage = {
        id: 'temp-user',
        role: 'user',
        content: message,
        createdAt: new Date().toISOString()
    };

    appendMessage(userMessage);

    // Show typing indicator
    showTypingIndicator();

    try {
        isLoading = true;
        document.getElementById('send-btn').disabled = true;

        // Send to API
        const response = await api.post(`/chat/${projectId}`, { message });

        // Remove typing indicator
        hideTypingIndicator();

        // Add assistant message
        appendMessage(response.data.assistantMessage);

        // Update local messages array
        messages.push(response.data.userMessage);
        messages.push(response.data.assistantMessage);

    } catch (error) {
        hideTypingIndicator();

        // Show error as a message
        appendMessage({
            id: 'error',
            role: 'assistant',
            content: `Error: ${error.message}. Please try again.`,
            createdAt: new Date().toISOString()
        });

    } finally {
        isLoading = false;
        document.getElementById('send-btn').disabled = false;
        input.focus();
    }
}

/**
 * Append a message to the chat
 */
function appendMessage(message) {
    const container = document.getElementById('chat-messages');
    container.insertAdjacentHTML('beforeend', createMessageElement(message));
    scrollToBottom();
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const typingHtml = `
    <div class="chat-typing" id="typing-indicator">
      <div class="chat-typing-dots">
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
        <div class="chat-typing-dot"></div>
      </div>
      <span class="text-sm text-muted">AI is thinking...</span>
    </div>
  `;
    container.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// =============================================================================
// CLEAR CHAT
// =============================================================================

/**
 * Handle clearing all messages
 */
async function handleClearChat() {
    if (!confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
        return;
    }

    try {
        await api.delete(`/chat/${projectId}/messages`);
        messages = [];
        renderMessages();
    } catch (error) {
        alert('Error clearing chat: ' + error.message);
    }
}

// =============================================================================
// FILES MODAL
// =============================================================================

/**
 * Open the files modal and load files
 */
async function openFilesModal() {
    document.getElementById('files-modal').classList.add('active');
    await loadFiles();
}

/**
 * Close the files modal
 */
function closeFilesModal() {
    document.getElementById('files-modal').classList.remove('active');
}

/**
 * Load files for the project
 */
async function loadFiles() {
    const fileList = document.getElementById('file-list');
    const emptyState = document.getElementById('files-empty');
    const loadingState = document.getElementById('files-loading');

    try {
        loadingState.style.display = 'block';
        fileList.innerHTML = '';
        emptyState.style.display = 'none';

        const response = await api.get(`/files/${projectId}`);
        const files = response.data.files;

        loadingState.style.display = 'none';

        if (files.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        fileList.innerHTML = files.map(file => `
      <div class="file-item">
        <div class="file-info">
          <span class="file-icon">📄</span>
          <div>
            <div class="file-name">${escapeHtml(file.filename)}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <a 
            href="${API_BASE_URL}/files/${projectId}/${file.id}/download" 
            class="btn btn-secondary btn-icon"
            title="Download"
          >
            📥
          </a>
          <button 
            type="button" 
            class="btn btn-secondary btn-icon" 
            onclick="deleteFile('${file.id}')"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    } catch (error) {
        loadingState.style.display = 'none';
        alert('Error loading files: ' + error.message);
    }
}

/**
 * Handle file input change
 */
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
}

/**
 * Upload a file to the project
 */
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        await api.upload(`/files/${projectId}`, formData);
        await loadFiles();
    } catch (error) {
        alert('Error uploading file: ' + error.message);
    }
}

/**
 * Delete a file
 */
async function deleteFile(fileId) {
    if (!confirm('Delete this file?')) return;

    try {
        await api.delete(`/files/${projectId}/${fileId}`);
        await loadFiles();
    } catch (error) {
        alert('Error deleting file: ' + error.message);
    }
}

// =============================================================================
// SETTINGS MODAL
// =============================================================================

/**
 * Open the settings modal
 */
function openSettingsModal() {
    // Fill form with current project data
    document.getElementById('settings-name').value = project.name;
    document.getElementById('settings-description').value = project.description || '';
    document.getElementById('settings-prompt').value = project.systemPrompt;

    document.getElementById('settings-modal').classList.add('active');
}

/**
 * Close the settings modal
 */
function closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('active');
}

/**
 * Handle saving settings
 */
async function handleSettingsSave(e) {
    e.preventDefault();

    const name = document.getElementById('settings-name').value.trim();
    const description = document.getElementById('settings-description').value.trim();
    const systemPrompt = document.getElementById('settings-prompt').value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        setButtonLoading(submitBtn, true);

        await api.put(`/projects/${projectId}`, { name, description, systemPrompt });

        // Update local project data
        project.name = name;
        project.description = description;
        project.systemPrompt = systemPrompt;

        // Update header
        document.getElementById('project-name').textContent = name;

        closeSettingsModal();

    } catch (error) {
        alert('Error saving settings: ' + error.message);
    } finally {
        setButtonLoading(submitBtn, false);
    }
}
