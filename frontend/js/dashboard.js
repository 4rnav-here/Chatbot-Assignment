// =============================================================================
// DASHBOARD PAGE JAVASCRIPT
// =============================================================================
// Handles the dashboard functionality:
//   - Display user info
//   - Load and display projects
//   - Create new projects
//   - Edit existing projects
//   - Delete projects
//
// This script runs on the dashboard.html page.
// =============================================================================

// =============================================================================
// GLOBAL STATE
// =============================================================================
let projects = []; // Array of user's projects
let editingProjectId = null; // ID of project being edited (null for create)

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth()) {
        return;
    }

    // Initialize the page
    initializeDashboard();
});

/**
 * Initialize the dashboard page
 */
async function initializeDashboard() {
    // Display user info
    displayUserInfo();

    // Set up event listeners
    setupEventListeners();

    // Load projects
    await loadProjects();
}

/**
 * Display user name and avatar in header
 */
function displayUserInfo() {
    const user = getUser();

    const userNameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');

    if (user) {
        userNameEl.textContent = user.name;
        avatarEl.textContent = getInitials(user.name);
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Create project buttons (there are two - one in header, one in empty state)
    document.getElementById('create-project-btn').addEventListener('click', openCreateModal);
    document.getElementById('create-first-btn')?.addEventListener('click', openCreateModal);

    // Modal controls
    document.getElementById('modal-close').addEventListener('click', closeProjectModal);
    document.getElementById('modal-cancel').addEventListener('click', closeProjectModal);
    document.getElementById('project-form').addEventListener('submit', handleProjectSubmit);

    // Delete modal controls
    document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-confirm').addEventListener('click', handleDeleteConfirm);

    // Close modals on overlay click
    document.getElementById('project-modal').addEventListener('click', (e) => {
        if (e.target.id === 'project-modal') closeProjectModal();
    });

    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-modal') closeDeleteModal();
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProjectModal();
            closeDeleteModal();
        }
    });
}

// =============================================================================
// LOAD PROJECTS
// =============================================================================

/**
 * Load all projects from the API
 */
async function loadProjects() {
    const container = document.getElementById('projects-container');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const alertContainer = document.getElementById('dashboard-alert');

    try {
        // Show loading
        loadingState.style.display = 'block';
        container.innerHTML = '';
        emptyState.style.display = 'none';

        // Fetch projects from API
        const response = await api.get('/projects');
        projects = response.data.projects;

        // Hide loading
        loadingState.style.display = 'none';

        // Show projects or empty state
        if (projects.length === 0) {
            emptyState.style.display = 'block';
        } else {
            renderProjects();
        }

    } catch (error) {
        loadingState.style.display = 'none';
        showAlert(alertContainer, error.message, 'error');
    }
}

/**
 * Render projects to the grid
 */
function renderProjects() {
    const container = document.getElementById('projects-container');

    container.innerHTML = projects.map(project => `
    <div class="card project-card">
      <div class="card-body">
        <h3 class="project-name">${escapeHtml(project.name)}</h3>
        <p class="project-description">
          ${project.description ? escapeHtml(project.description) : 'No description'}
        </p>
        <div class="project-stats">
          <span class="project-stat">
            💬 ${project._count?.messages || 0} messages
          </span>
          <span class="project-stat">
            📎 ${project._count?.files || 0} files
          </span>
        </div>
      </div>
      <div class="card-footer flex justify-between items-center">
        <span class="text-sm text-muted">
          Created ${formatDate(project.createdAt)}
        </span>
        <div class="project-actions">
          <button 
            type="button" 
            class="btn btn-secondary btn-icon" 
            onclick="openEditModal('${project.id}')"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="btn btn-secondary btn-icon" 
            onclick="openDeleteModal('${project.id}')"
            title="Delete"
          >
            🗑️
          </button>
          <a 
            href="chat.html?id=${project.id}" 
            class="btn btn-primary"
          >
            Chat →
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================================================
// CREATE/EDIT PROJECT MODAL
// =============================================================================

/**
 * Open the modal for creating a new project
 */
function openCreateModal() {
    editingProjectId = null;

    // Reset form
    document.getElementById('project-id').value = '';
    document.getElementById('project-name').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-prompt').value = 'You are a helpful assistant.';

    // Update modal title and button text
    document.getElementById('modal-title').textContent = 'Create New Project';
    document.getElementById('modal-submit').querySelector('.btn-text').textContent = 'Create Project';

    // Show modal
    document.getElementById('project-modal').classList.add('active');
}

/**
 * Open the modal for editing an existing project
 */
function openEditModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    editingProjectId = projectId;

    // Fill form with project data
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-prompt').value = project.systemPrompt;

    // Update modal title and button text
    document.getElementById('modal-title').textContent = 'Edit Project';
    document.getElementById('modal-submit').querySelector('.btn-text').textContent = 'Save Changes';

    // Show modal
    document.getElementById('project-modal').classList.add('active');
}

/**
 * Close the project modal
 */
function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
    editingProjectId = null;
}

/**
 * Handle project form submission (create or update)
 */
async function handleProjectSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const systemPrompt = document.getElementById('project-prompt').value.trim();

    const submitBtn = document.getElementById('modal-submit');
    const alertContainer = document.getElementById('dashboard-alert');

    try {
        setButtonLoading(submitBtn, true);

        if (editingProjectId) {
            // Update existing project
            await api.put(`/projects/${editingProjectId}`, { name, description, systemPrompt });
            showAlert(alertContainer, 'Project updated successfully', 'success');
        } else {
            // Create new project
            await api.post('/projects', { name, description, systemPrompt });
            showAlert(alertContainer, 'Project created successfully', 'success');
        }

        // Close modal and reload projects
        closeProjectModal();
        await loadProjects();

    } catch (error) {
        showAlert(alertContainer, error.message, 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// =============================================================================
// DELETE PROJECT MODAL
// =============================================================================

/**
 * Open the delete confirmation modal
 */
function openDeleteModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById('delete-project-id').value = projectId;
    document.getElementById('delete-project-name').textContent = project.name;
    document.getElementById('delete-modal').classList.add('active');
}

/**
 * Close the delete modal
 */
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
}

/**
 * Handle delete confirmation
 */
async function handleDeleteConfirm() {
    const projectId = document.getElementById('delete-project-id').value;
    const confirmBtn = document.getElementById('delete-confirm');
    const alertContainer = document.getElementById('dashboard-alert');

    try {
        setButtonLoading(confirmBtn, true);

        await api.delete(`/projects/${projectId}`);

        showAlert(alertContainer, 'Project deleted successfully', 'success');
        closeDeleteModal();
        await loadProjects();

    } catch (error) {
        showAlert(alertContainer, error.message, 'error');
    } finally {
        setButtonLoading(confirmBtn, false);
    }
}
