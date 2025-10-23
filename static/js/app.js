// Main application JavaScript
// Common functionality shared across NaC and Nexus Dashboard

// Store table instances (shared across modules)
const tableInstances = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');

    // Initialize sidebar navigation
    initializeSidebarNavigation();

    // Initialize sidebar toggle
    initializeSidebarToggle();

    // Initialize Tabulator tables (with delay to ensure DOM is ready)
    setTimeout(initializeTables, 100);

    // Initialize admin form handlers
    initializeAdminHandlers();

    // Initialize NaC YAML event listeners
    if (typeof initializeNacYamlEventListeners === 'function') {
        initializeNacYamlEventListeners(tableInstances);
    }

    // Initialize NaC YAML copy handlers
    if (typeof initializeNacYamlCopyHandlers === 'function') {
        initializeNacYamlCopyHandlers();
    }
});


/**
 * Initialize sidebar navigation
 */
function initializeSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Remove active class from all links
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });

            // Add active class to clicked link
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');

            // Get the page name and parent from data attributes
            const page = this.getAttribute('data-page');
            const parent = this.getAttribute('data-parent');
            console.log(`Navigated to: ${page} (parent: ${parent})`);

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.remove('show');
            }

            // Load page content
            loadPageContent(page, parent);
        });
    });

    // Initialize collapse arrow rotation
    const collapseElements = document.querySelectorAll('.sidebar-parent');
    collapseElements.forEach(element => {
        const target = element.getAttribute('href');
        const collapseEl = document.querySelector(target);

        if (collapseEl) {
            collapseEl.addEventListener('shown.bs.collapse', function() {
                element.setAttribute('aria-expanded', 'true');
            });

            collapseEl.addEventListener('hidden.bs.collapse', function() {
                element.setAttribute('aria-expanded', 'false');
            });
        }
    });
}


/**
 * Initialize sidebar toggle button
 */
function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            sidebar.classList.toggle('collapsed');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnToggle = sidebarToggle.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }
}


/**
 * Load content based on selected menu item
 */
function loadPageContent(page, parent) {
    console.log(`Loading content for: ${page} (parent: ${parent})`);

    // Hide all page content sections
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => {
        p.classList.remove('active');
    });

    // Show the selected page
    const selectedPage = document.getElementById(`page-${page}`);
    if (selectedPage) {
        selectedPage.classList.add('active');

        // Initialize table for this page if not already done
        initializeTableForPage(page);

        // Smooth scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`Page not found: page-${page}`);
    }
}


/**
 * Initialize Tabulator tables
 */
function initializeTables() {
    // Check if Tabulator is available
    if (typeof Tabulator === 'undefined') {
        console.error('Tabulator not loaded');
        return;
    }

    // Initialize the table for the currently active page
    const activePage = document.querySelector('.page-content.active');
    if (activePage) {
        const pageId = activePage.id.replace('page-', '');
        initializeTableForPage(pageId);
    }
}


/**
 * Initialize table for a specific page
 * Delegates to NaC or Nexus specific initializers
 */
function initializeTableForPage(page) {
    // Check if Tabulator is available
    if (typeof Tabulator === 'undefined') {
        console.error('Tabulator not loaded');
        return;
    }

    // Common Tabulator configuration
    const commonConfig = {
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 25, 50, 100],
        layout: "fitColumns",
        responsiveLayout: "collapse",
        placeholder: "No Data Available",
        ajaxResponse: function(url, params, response) {
            // Extract data from the JSON response
            return response.data;
        }
    };

    // Determine if this is a NaC or Nexus page and delegate
    const nacPages = ['fabric', 'vrf', 'networks', 'switches', 'interfaces'];
    const nexusPages = ['nexus-fabric', 'nexus-switches', 'nexus-vrf', 'nexus-network', 'nexus-interfaces'];

    if (nacPages.includes(page)) {
        // Delegate to NaC initializer
        if (typeof initializeNacTableForPage === 'function') {
            initializeNacTableForPage(page, commonConfig, tableInstances);
        }
    } else if (nexusPages.includes(page)) {
        // Delegate to Nexus initializer
        if (typeof initializeNexusTableForPage === 'function') {
            initializeNexusTableForPage(page, commonConfig, tableInstances);
        }
    } else if (page === 'admin') {
        // Admin page has no tables
        console.log('Admin page - no tables to initialize');
    }
}


/**
 * Initialize admin form handlers
 */
function initializeAdminHandlers() {
    // Password toggle handlers
    initializePasswordToggle('toggleNacKey', 'nacApiKey');
    initializePasswordToggle('toggleNexusKey', 'nexusApiKey');

    // Form submission handler
    const apiKeysForm = document.getElementById('apiKeysForm');
    if (apiKeysForm) {
        apiKeysForm.addEventListener('submit', handleAdminFormSubmit);
    }

    // Load config button
    const loadConfigBtn = document.getElementById('loadConfigBtn');
    if (loadConfigBtn) {
        loadConfigBtn.addEventListener('click', loadAdminConfig);
    }

    // Clear config button
    const clearConfigBtn = document.getElementById('clearConfigBtn');
    if (clearConfigBtn) {
        clearConfigBtn.addEventListener('click', clearAdminConfig);
    }

    // Test Nexus Dashboard connection button
    const testNexusConnectionBtn = document.getElementById('testNexusConnectionBtn');
    if (testNexusConnectionBtn) {
        testNexusConnectionBtn.addEventListener('click', testNexusConnection);
    }

    // Test NaC API (SCM) connection button
    const testNacApiConnectionBtn = document.getElementById('testNacApiConnectionBtn');
    if (testNacApiConnectionBtn) {
        testNacApiConnectionBtn.addEventListener('click', testNacApiConnection);
    }

    // Auto-load configuration when admin page becomes visible
    const adminPage = document.getElementById('page-admin');
    if (adminPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    // Page became active, load config if not already loaded
                    const nacApiKeyField = document.getElementById('nacApiKey');
                    if (nacApiKeyField && !nacApiKeyField.dataset.configLoaded) {
                        loadAdminConfig();
                        nacApiKeyField.dataset.configLoaded = 'true';
                    }
                }
            });
        });

        observer.observe(adminPage, { attributes: true, attributeFilter: ['class'] });
    }
}


/**
 * Initialize password toggle for a field
 */
function initializePasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (button && input) {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        });
    }
}


/**
 * Handle admin form submission
 */
async function handleAdminFormSubmit(event) {
    event.preventDefault();

    const responseDiv = document.getElementById('apiKeysResponse');

    // Get form fields
    const nacApiUrlField = document.getElementById('nacApiUrl');
    const nacApiKeyField = document.getElementById('nacApiKey');
    const nexusApiKeyField = document.getElementById('nexusApiKey');
    const nexusUrlField = document.getElementById('nexusUrl');
    const nexusUsernameField = document.getElementById('nexusUsername');
    const nexusFabricNameField = document.getElementById('nexusFabricName');
    const scmProviderField = document.getElementById('scmProvider');
    const scmApiUrlField = document.getElementById('scmApiUrl');
    const repositoryUrlField = document.getElementById('repositoryUrl');
    const dataSourcesDirField = document.getElementById('dataSourcesDir');

    // Determine actual values to save
    const formData = {
        nac_api_url: nacApiUrlField.value,
        nac_api_key: getFieldValue(nacApiKeyField),
        nexus_api_key: getFieldValue(nexusApiKeyField),
        nexus_url: nexusUrlField.value,
        nexus_username: nexusUsernameField.value,
        nexus_fabric_name: nexusFabricNameField.value,
        scm_provider: scmProviderField.value,
        scm_api_url: scmApiUrlField.value,
        repository_url: repositoryUrlField.value,
        data_sources_dir: dataSourcesDirField.value
    };

    try {
        const response = await fetch('/api/v1/admin/save-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            responseDiv.textContent = `✓ ${data.message}`;
            responseDiv.className = 'alert alert-success';
            responseDiv.style.display = 'block';

            // Update last config update timestamp
            const timestamp = new Date().toLocaleString();
            const lastUpdateEl = document.getElementById('lastConfigUpdate');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = timestamp;
            }

            // Reload config to show updated placeholder values
            nacApiKeyField.dataset.configLoaded = 'false';
            setTimeout(() => {
                nacApiKeyField.dataset.configLoaded = 'false';
                loadAdminConfig();
            }, 500);
        } else {
            throw new Error(data.message || 'Failed to save configuration');
        }
    } catch (error) {
        console.error('Admin config save error:', error);
        responseDiv.textContent = `✗ Error: ${error.message}`;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    }

    // Smooth scroll to response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/**
 * Get actual field value for saving
 */
function getFieldValue(field) {
    const currentValue = field.value;
    const hasValue = field.dataset.hasValue === 'true';
    const actualValue = field.dataset.actualValue || '';

    // If field has placeholder dots, use stored value
    if (currentValue === '••••••••••••••••' && hasValue) {
        return actualValue;
    }

    // If field is empty but had a value, keep existing
    if (currentValue === '' && hasValue && actualValue) {
        return actualValue;
    }

    // Otherwise use the new value
    return currentValue;
}


/**
 * Load admin configuration
 */
async function loadAdminConfig() {
    const responseDiv = document.getElementById('apiKeysResponse');

    try {
        const response = await fetch('/api/v1/admin/load-config');
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;

            // Store actual values in data attributes and show placeholders for non-empty fields
            const nacApiUrlField = document.getElementById('nacApiUrl');
            const nacApiKeyField = document.getElementById('nacApiKey');
            const nexusApiKeyField = document.getElementById('nexusApiKey');
            const nexusUrlField = document.getElementById('nexusUrl');
            const nexusUsernameField = document.getElementById('nexusUsername');
            const nexusFabricNameField = document.getElementById('nexusFabricName');
            const scmProviderField = document.getElementById('scmProvider');
            const scmApiUrlField = document.getElementById('scmApiUrl');
            const repositoryUrlField = document.getElementById('repositoryUrl');
            const dataSourcesDirField = document.getElementById('dataSourcesDir');

            // Mark as loaded
            nacApiKeyField.dataset.configLoaded = 'true';

            // Handle NAC API URL (not sensitive, show actual value)
            nacApiUrlField.value = data.nac_api_url || '';

            // Handle NaC API Key
            if (data.nac_api_key) {
                nacApiKeyField.value = '••••••••••••••••';
                nacApiKeyField.dataset.hasValue = 'true';
                nacApiKeyField.dataset.actualValue = data.nac_api_key;
                nacApiKeyField.placeholder = 'Value configured - enter new value to change';
            } else {
                nacApiKeyField.value = '';
                nacApiKeyField.dataset.hasValue = 'false';
                nacApiKeyField.placeholder = 'Enter Passthrough API Key';
            }

            // Handle Nexus Dashboard API Key
            if (data.nexus_api_key) {
                nexusApiKeyField.value = '••••••••••••••••';
                nexusApiKeyField.dataset.hasValue = 'true';
                nexusApiKeyField.dataset.actualValue = data.nexus_api_key;
                nexusApiKeyField.placeholder = 'Value configured - enter new value to change';
            } else {
                nexusApiKeyField.value = '';
                nexusApiKeyField.dataset.hasValue = 'false';
                nexusApiKeyField.placeholder = 'Enter Nexus Dashboard API Key';
            }

            // Handle other fields
            nexusUrlField.value = data.nexus_url || '';
            nexusUsernameField.value = data.nexus_username || '';
            nexusFabricNameField.value = data.nexus_fabric_name || '';
            scmProviderField.value = data.scm_provider || '';
            scmApiUrlField.value = data.scm_api_url || '';
            repositoryUrlField.value = data.repository_url || '';
            dataSourcesDirField.value = data.data_sources_dir || '';

            // Add focus listeners to clear placeholder when user starts typing
            addPlaceholderClearListener(nacApiKeyField);
            addPlaceholderClearListener(nexusApiKeyField);

            responseDiv.textContent = '✓ Configuration loaded successfully';
            responseDiv.className = 'alert alert-info';
            responseDiv.style.display = 'block';
        } else {
            throw new Error(result.message || 'Failed to load configuration');
        }
    } catch (error) {
        console.error('Admin config load error:', error);
        responseDiv.textContent = `✗ Error: ${error.message}`;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    }

    // Smooth scroll to response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/**
 * Add listener to clear placeholder dots when user focuses on field
 */
function addPlaceholderClearListener(field) {
    // Remove existing listener if any
    field.removeEventListener('focus', clearPlaceholderDots);

    // Add new listener
    field.addEventListener('focus', clearPlaceholderDots);
}


/**
 * Clear placeholder dots when user focuses on a field with existing value
 */
function clearPlaceholderDots(event) {
    const field = event.target;
    if (field.dataset.hasValue === 'true' && field.value === '••••••••••••••••') {
        field.value = '';
        field.placeholder = 'Enter new value or leave empty to keep current';
    }
}


/**
 * Clear admin configuration
 */
async function clearAdminConfig() {
    const responseDiv = document.getElementById('apiKeysResponse');

    // Confirm before clearing
    if (!confirm('Are you sure you want to clear all API configuration?')) {
        return;
    }

    try {
        const response = await fetch('/api/v1/admin/clear-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Clear all form fields
            const fields = [
                'nacApiUrl', 'nacApiKey', 'nexusApiKey', 'nexusUrl',
                'nexusUsername', 'nexusFabricName', 'scmProvider',
                'scmApiUrl', 'repositoryUrl', 'dataSourcesDir'
            ];

            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                    field.dataset.hasValue = 'false';
                    field.dataset.actualValue = '';
                }
            });

            responseDiv.textContent = `✓ ${data.message}`;
            responseDiv.className = 'alert alert-warning';
            responseDiv.style.display = 'block';

            // Update last config update timestamp
            const timestamp = new Date().toLocaleString();
            const lastUpdateEl = document.getElementById('lastConfigUpdate');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = timestamp;
            }
        } else {
            throw new Error(data.message || 'Failed to clear configuration');
        }
    } catch (error) {
        console.error('Admin config clear error:', error);
        responseDiv.textContent = `✗ Error: ${error.message}`;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    }

    // Smooth scroll to response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/**
 * Test Nexus Dashboard connection
 */
async function testNexusConnection() {
    const responseDiv = document.getElementById('nexusConnectionResponse');
    const testBtn = document.getElementById('testNexusConnectionBtn');

    // Show loading state
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';

    responseDiv.style.display = 'none';

    try {
        const response = await fetch('/api/v1/nexus/test-connection');
        const result = await response.json();

        if (result.status === 'success') {
            let fabricInfo = '';
            if (result.fabrics_count !== undefined) {
                fabricInfo += `<p class="mb-0 mt-1"><small>Found ${result.fabrics_count} fabric(s)</small></p>`;
            }
            if (result.configured_fabric) {
                const fabricStatus = result.fabric_found
                    ? '<i class="bi bi-check-circle-fill text-success"></i>'
                    : '<i class="bi bi-x-circle-fill text-warning"></i>';
                fabricInfo += `<p class="mb-0 mt-1"><small>${fabricStatus} Configured fabric: <strong>${result.configured_fabric}</strong></small></p>`;
            }

            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Connection Successful!</strong>
                <p class="mb-0 mt-2">${result.message}</p>
                ${fabricInfo}
            `;

            // Use warning class if fabric configured but not found
            if (result.configured_fabric && !result.fabric_found) {
                responseDiv.className = 'alert alert-warning mt-3';
            } else {
                responseDiv.className = 'alert alert-success mt-3';
            }
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Connection Failed</strong>
                <p class="mb-0 mt-2">${result.message}</p>
            `;
            responseDiv.className = 'alert alert-danger mt-3';
        }

        responseDiv.style.display = 'block';
    } catch (error) {
        console.error('Connection test error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Connection Test Failed</strong>
            <p class="mb-0 mt-2">Unable to connect to server: ${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger mt-3';
        responseDiv.style.display = 'block';
    } finally {
        // Restore button state
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Test NaC API (SCM) connection
 */
async function testNacApiConnection() {
    const responseDiv = document.getElementById('nacApiConnectionResponse');
    const testBtn = document.getElementById('testNacApiConnectionBtn');

    // Show loading state
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';

    responseDiv.style.display = 'none';

    try {
        const response = await fetch('/api/v1/admin/test-nac-api-connection');
        const result = await response.json();

        if (result.status === 'success') {
            let apiInfo = '';
            if (result.scm_api_url) {
                apiInfo += `<p class="mb-0 mt-1"><small>SCM API URL: <strong>${result.scm_api_url}</strong></small></p>`;
            }
            if (result.scm_provider) {
                apiInfo += `<p class="mb-0 mt-1"><small>Provider: <strong>${result.scm_provider}</strong></small></p>`;
            }
            if (result.size_of_data_model) {
                apiInfo += `<p class="mb-0 mt-1"><small>Size of Data Model: <strong>${result.size_of_data_model} bytes</strong></small></p>`;
            }

            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Connection Successful!</strong>
                <p class="mb-0 mt-2">${result.message}</p>
                ${apiInfo}
            `;
            responseDiv.className = 'alert alert-success mt-2';
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Connection Failed</strong>
                <p class="mb-0 mt-2">${result.message}</p>
            `;
            responseDiv.className = 'alert alert-danger mt-2';
        }

        responseDiv.style.display = 'block';
    } catch (error) {
        console.error('Connection test error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Connection Test Failed</strong>
            <p class="mb-0 mt-2">Unable to connect to server: ${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger mt-2';
        responseDiv.style.display = 'block';
    } finally {
        // Restore button state
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Utility function to make API calls
 */
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(endpoint, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}


/**
 * Show toast notification (Bootstrap 5.3)
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    // You can append this to a toast container if you add one to the HTML
    console.log('Toast:', message);
}
