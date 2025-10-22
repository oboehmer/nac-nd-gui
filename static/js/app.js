// Main application JavaScript

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');

    // Initialize sidebar navigation
    initializeSidebarNavigation();

    // Initialize sidebar toggle
    initializeSidebarToggle();

    // Test API button handler
    const testApiBtn = document.getElementById('testApiBtn');
    if (testApiBtn) {
        testApiBtn.addEventListener('click', testApiEndpoint);
    }

    // Form submission handler
    const dataForm = document.getElementById('dataForm');
    if (dataForm) {
        dataForm.addEventListener('submit', handleFormSubmit);
    }

    // Initialize Tabulator tables (with delay to ensure DOM is ready)
    setTimeout(initializeTables, 100);

    // Initialize admin form handlers
    initializeAdminHandlers();
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
 * Load dynamic data for a specific page (optional)
 */
async function loadPageData(page) {
    try {
        const data = await apiCall(`/api/${page}`);
        console.log(`Data loaded for ${page}:`, data);
        // Update page content with loaded data
    } catch (error) {
        console.error(`Failed to load data for ${page}:`, error);
    }
}


// Store table instances
const tableInstances = {};

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

    // Initialize Recent Activity Table (Main page)
    if (page === 'main' && document.getElementById('recentActivityTable') && !tableInstances['recentActivityTable']) {
        tableInstances['recentActivityTable'] = new Tabulator("#recentActivityTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/tables/recent-activity",
            columns: [
                { title: "Time", field: "time", formatter: (cell) => `<small>${cell.getValue()}</small>`, sorter: "string" },
                { title: "Action", field: "action", sorter: "string" },
                { title: "Resource", field: "resource", sorter: "string" },
                {
                    title: "Status",
                    field: "status",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === 'Success' ? 'bg-success' :
                                          value === 'Warning' ? 'bg-warning' : 'bg-danger';
                        return `<span class="badge ${badgeClass}">${value}</span>`;
                    },
                    sorter: "string"
                },
                { title: "User", field: "user", sorter: "string" }
            ],
            initialSort: [{ column: "time", dir: "desc" }]
        });
    }

    // Initialize Fabric List Table (Fabric page)
    if (page === 'fabric' && document.getElementById('fabricListTable') && !tableInstances['fabricListTable']) {
        tableInstances['fabricListTable'] = new Tabulator("#fabricListTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/tables/fabrics",
            columns: [
                { title: "Fabric Name", field: "name", formatter: (cell) => `<strong>${cell.getValue()}</strong>`, sorter: "string" },
                { title: "Type", field: "type", sorter: "string" },
                { title: "Switches", field: "switches", sorter: "number" },
                {
                    title: "Status",
                    field: "status",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === 'Healthy' ? 'bg-success' :
                                          value === 'Warning' ? 'bg-warning' : 'bg-danger';
                        return `<span class="badge ${badgeClass}">${value}</span>`;
                    },
                    sorter: "string"
                },
                {
                    title: "VXLAN EVPN",
                    field: "vxlan_enabled",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        if (value) {
                            return '<i class="bi bi-check-circle-fill text-success"></i> Enabled';
                        } else {
                            return '<i class="bi bi-x-circle-fill text-muted"></i> Disabled';
                        }
                    },
                    sorter: "boolean"
                },
                {
                    title: "Actions",
                    formatter: () => {
                        return `
                            <button class="btn btn-sm btn-outline-primary">Manage</button>
                            <button class="btn btn-sm btn-outline-info">View</button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center"
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });
    }

    // Initialize VRF Instances Table (VRF page)
    if (page === 'vrf' && document.getElementById('vrfInstancesTable') && !tableInstances['vrfInstancesTable']) {
        tableInstances['vrfInstancesTable'] = new Tabulator("#vrfInstancesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/tables/vrfs",
            columns: [
                { title: "VRF Name", field: "name", formatter: (cell) => `<strong>${cell.getValue()}</strong>`, sorter: "string" },
                { title: "RD", field: "rd", sorter: "string" },
                {
                    title: "Status",
                    field: "status",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === 'Active' ? 'bg-success' :
                                          value === 'Pending' ? 'bg-warning' : 'bg-danger';
                        return `<span class="badge ${badgeClass}">${value}</span>`;
                    },
                    sorter: "string"
                },
                { title: "Interfaces", field: "interfaces", sorter: "number" },
                {
                    title: "Actions",
                    formatter: () => {
                        return `
                            <button class="btn btn-sm btn-outline-primary">Edit</button>
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center"
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });
    }

    // Initialize Interface List Table (Interfaces page)
    if (page === 'interfaces' && document.getElementById('interfaceListTable') && !tableInstances['interfaceListTable']) {
        tableInstances['interfaceListTable'] = new Tabulator("#interfaceListTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/tables/interfaces",
            columns: [
                { title: "Interface", field: "name", formatter: (cell) => `<strong>${cell.getValue()}</strong>`, sorter: "string" },
                { title: "Type", field: "type", sorter: "string" },
                {
                    title: "Status",
                    field: "status",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === 'Up' ? 'bg-success' : 'bg-danger';
                        return `<span class="badge ${badgeClass}">${value}</span>`;
                    },
                    sorter: "string"
                },
                { title: "Speed", field: "speed", sorter: "string" },
                { title: "Description", field: "description", sorter: "string" },
                {
                    title: "Actions",
                    formatter: () => {
                        return '<button class="btn btn-sm btn-outline-primary">Edit</button>';
                    },
                    headerSort: false,
                    hozAlign: "center"
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });
    }

    // Initialize Nexus Fabric Details (Nexus Fabric page)
    if (page === 'nexus-fabric') {
        loadNexusFabricDetails();
    }

    // Initialize Nexus Switches Table (Nexus Switches page)
    if (page === 'nexus-switches' && document.getElementById('nexusSwitchesTable') && !tableInstances['nexusSwitchesTable']) {
        // First, get the fabric name from configuration
        fetch('/api/v1/admin/load-config')
            .then(response => response.json())
            .then(configData => {
                const fabricName = configData.data.nexus_fabric_name;
                if (!fabricName) {
                    document.getElementById('nexusSwitchesTable').innerHTML =
                        '<div class="alert alert-warning">Please configure a fabric name in the Admin panel first.</div>';
                    return;
                }

                // Create the table with the fabric-specific URL
                tableInstances['nexusSwitchesTable'] = new Tabulator("#nexusSwitchesTable", {
                    ...commonConfig,
                    ajaxURL: `/api/v1/nexus/fabrics/${fabricName}/switches`,
                    columns: [
                        { title: "Hostname", field: "hostName", formatter: (cell) => `<strong>${cell.getValue()}</strong>`, sorter: "string" },
                        { title: "IP Address", field: "ipAddress", sorter: "string" },
                        { title: "Model", field: "model", sorter: "string" },
                        { title: "Serial Number", field: "serialNumber", sorter: "string" },
                        { title: "Version", field: "release", sorter: "string" },
                        { title: "Role", field: "switchRole",
                          formatter: (cell) => {
                              const value = cell.getValue();
                              const badgeClass = value === 'spine' ? 'bg-primary' :
                                                value === 'leaf' ? 'bg-success' :
                                                value === 'border' ? 'bg-info' : 'bg-secondary';
                              return `<span class="badge ${badgeClass}">${value}</span>`;
                          },
                          sorter: "string"
                        },
                        {
                            title: "Status",
                            field: "status",
                            formatter: (cell) => {
                                const value = cell.getValue();
                                const badgeClass = value === 'ok' ? 'bg-success' :
                                                  value === 'minor' ? 'bg-warning' : 'bg-danger';
                                return `<span class="badge ${badgeClass}">${value}</span>`;
                            },
                            sorter: "string"
                        },
                        { title: "Uptime", field: "upTimeStr", sorter: "string" }
                    ],
                    initialSort: [{ column: "hostName", dir: "asc" }]
                });
            })
            .catch(error => {
                console.error('Failed to load configuration:', error);
                document.getElementById('nexusSwitchesTable').innerHTML =
                    '<div class="alert alert-danger">Failed to load configuration. Please check the Admin panel.</div>';
            });
    }

    // Initialize Nexus VRFs Table (Nexus VRF page)
    if (page === 'nexus-vrf' && document.getElementById('nexusVRFsTable') && !tableInstances['nexusVRFsTable']) {
        // First, get the fabric name from configuration
        fetch('/api/v1/admin/load-config')
            .then(response => response.json())
            .then(configData => {
                const fabricName = configData.data.nexus_fabric_name;
                if (!fabricName) {
                    document.getElementById('nexusVRFsTable').innerHTML =
                        '<div class="alert alert-warning">Please configure a fabric name in the Admin panel first.</div>';
                    return;
                }

                // Create the table with the fabric-specific URL
                tableInstances['nexusVRFsTable'] = new Tabulator("#nexusVRFsTable", {
                    ...commonConfig,
                    ajaxURL: `/api/v1/nexus/fabrics/${fabricName}/vrfs`,
                    columns: [
                        { title: "VRF Name", field: "vrfName", formatter: (cell) => `<strong>${cell.getValue()}</strong>`, sorter: "string" },
                        { title: "VRF ID", field: "vrfId", sorter: "number" },
                        { title: "Tenant", field: "tenantName", sorter: "string" },
                        { title: "Template", field: "vrfTemplate", sorter: "string" },
                        {
                            title: "Status",
                            field: "vrfStatus",
                            formatter: (cell) => {
                                const value = cell.getValue();
                                const badgeClass = value === 'DEPLOYED' ? 'bg-success' :
                                                  value === 'PENDING' ? 'bg-warning' :
                                                  value === 'NA' ? 'bg-secondary' : 'bg-danger';
                                return `<span class="badge ${badgeClass}">${value || 'N/A'}</span>`;
                            },
                            sorter: "string"
                        },
                        { title: "Source", field: "source", sorter: "string" },
                        { title: "Fabric", field: "fabric", sorter: "string" }
                    ],
                    initialSort: [{ column: "vrfName", dir: "asc" }]
                });
            })
            .catch(error => {
                console.error('Failed to load configuration:', error);
                document.getElementById('nexusVRFsTable').innerHTML =
                    '<div class="alert alert-danger">Failed to load configuration. Please check the Admin panel.</div>';
            });
    }

    // Initialize Nexus Networks Table (Nexus Network page)
    if (page === 'nexus-network' && document.getElementById('nexusNetworksTable') && !tableInstances['nexusNetworksTable']) {
        // First, get the fabric name from configuration
        fetch('/api/v1/admin/load-config')
            .then(response => response.json())
            .then(configData => {
                const fabricName = configData.data.nexus_fabric_name;
                if (!fabricName) {
                    document.getElementById('nexusNetworksTable').innerHTML =
                        '<div class="alert alert-warning">Please configure a fabric name in the Admin panel first.</div>';
                    return;
                }

                // Create the table with the fabric-specific URL
                tableInstances['nexusNetworksTable'] = new Tabulator("#nexusNetworksTable", {
                    ...commonConfig,
                    ajaxURL: `/api/v1/nexus/fabrics/${fabricName}/networks`,
                    ajaxResponse: function(url, params, response) {
                        // Parse the networkTemplateConfig JSON for each network
                        if (response.data && Array.isArray(response.data)) {
                            response.data.forEach(network => {
                                if (network.networkTemplateConfig) {
                                    try {
                                        const config = JSON.parse(network.networkTemplateConfig);
                                        network.vlanIdParsed = config.vlanId || 'N/A';
                                        network.gatewayParsed = config.gatewayIpAddress || 'N/A';
                                        network.vrfNameParsed = config.vrfName || 'N/A';
                                    } catch (e) {
                                        network.vlanIdParsed = 'N/A';
                                        network.gatewayParsed = 'N/A';
                                        network.vrfNameParsed = 'N/A';
                                    }
                                }
                            });
                        }
                        return response.data;
                    },
                    columns: [
                        { title: "Network Name", field: "networkName", formatter: (cell) => `<strong>${cell.getValue()}</strong>`, sorter: "string" },
                        { title: "Network ID", field: "networkId", sorter: "string" },
                        { title: "VLAN ID", field: "vlanIdParsed", sorter: "number" },
                        { title: "VRF Name", field: "vrfNameParsed", sorter: "string" },
                        { title: "Fabric", field: "fabric", sorter: "string" },
                        { title: "Template", field: "networkTemplate", sorter: "string" },
                        {
                            title: "Status",
                            field: "networkStatus",
                            formatter: (cell) => {
                                const value = cell.getValue();
                                const badgeClass = value === 'DEPLOYED' ? 'bg-success' :
                                                  value === 'PENDING' ? 'bg-warning' :
                                                  value === 'NA' ? 'bg-secondary' : 'bg-danger';
                                return `<span class="badge ${badgeClass}">${value || 'N/A'}</span>`;
                            },
                            sorter: "string"
                        },
                        { title: "Gateway IP", field: "gatewayParsed", sorter: "string" }
                    ],
                    initialSort: [{ column: "networkName", dir: "asc" }]
                });
            })
            .catch(error => {
                console.error('Failed to load configuration:', error);
                document.getElementById('nexusNetworksTable').innerHTML =
                    '<div class="alert alert-danger">Failed to load configuration. Please check the Admin panel.</div>';
            });
    }

    console.log(`Tabulator table initialized for page: ${page}`);
}


/**
 * Test the API endpoint
 */
async function testApiEndpoint() {
    const responseDiv = document.getElementById('apiResponse');
    const responseContent = document.getElementById('apiResponseContent');

    try {
        const response = await fetch('/api/v1/hello?name=User');
        const data = await response.json();

        responseContent.textContent = JSON.stringify(data, null, 2);
        responseDiv.style.display = 'block';

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('API Error:', error);
        responseContent.textContent = JSON.stringify({
            error: 'Failed to fetch data',
            message: error.message
        }, null, 2);
        responseDiv.style.display = 'block';
    }
}


/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const formResponse = document.getElementById('formResponse');
    const nameInput = document.getElementById('nameInput');
    const messageInput = document.getElementById('messageInput');

    const formData = {
        name: nameInput.value,
        message: messageInput.value,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/v1/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            formResponse.textContent = `✓ Success! Received: ${JSON.stringify(data.received)}`;
            formResponse.className = 'alert alert-success mt-3';
            formResponse.style.display = 'block';

            // Clear form
            nameInput.value = '';
            messageInput.value = '';
        } else {
            throw new Error('API returned error status');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        formResponse.textContent = `✗ Error: ${error.message}`;
        formResponse.className = 'alert alert-danger mt-3';
        formResponse.style.display = 'block';
    }

    // Smooth scroll to response
    formResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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


/**
 * Load and display Nexus Fabric details
 */
function loadNexusFabricDetails() {
    const contentDiv = document.getElementById('nexusFabricContent');
    if (!contentDiv) return;

    // First, get the fabric name from configuration
    fetch('/api/v1/admin/load-config')
        .then(response => response.json())
        .then(configData => {
            const fabricName = configData.data.nexus_fabric_name;
            if (!fabricName) {
                contentDiv.innerHTML = '<div class="alert alert-warning">Please configure a fabric name in the Admin panel first.</div>';
                return;
            }

            // Fetch fabric details
            return fetch(`/api/v1/nexus/fabric/${fabricName}`);
        })
        .then(response => response ? response.json() : null)
        .then(fabricData => {
            if (!fabricData) return;

            if (fabricData.status === 'success' && fabricData.data) {
                const fabric = fabricData.data;

                // Format the fabric details into grouped cards
                let html = `
                    <div class="row g-4">
                        <!-- Basic Information Card -->
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>Basic Information</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <label class="text-muted small">Fabric Name</label>
                                            <p class="mb-2 fw-bold">${fabric.fabricName || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">Fabric ID</label>
                                            <p class="mb-2">${fabric.fabricId || fabric.id || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">Technology</label>
                                            <p class="mb-2">${fabric.fabricTechnologyFriendly || fabric.fabricTechnology || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">Type</label>
                                            <p class="mb-2">${fabric.fabricTypeFriendly || fabric.fabricType || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">ASN</label>
                                            <p class="mb-2">${fabric.asn || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">Device Type</label>
                                            <p class="mb-2">${fabric.deviceType || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Configuration Card -->
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0"><i class="bi bi-gear me-2"></i>Configuration</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <label class="text-muted small">Network Template</label>
                                            <p class="mb-2">${fabric.networkTemplate || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">VRF Template</label>
                                            <p class="mb-2">${fabric.vrfTemplate || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">Network Extension</label>
                                            <p class="mb-2">${fabric.networkExtensionTemplate || 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">VRF Extension</label>
                                            <p class="mb-2">${fabric.vrfExtensionTemplate || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Timestamps Card -->
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-info text-white">
                                    <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Timestamps</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <label class="text-muted small">Created On</label>
                                            <p class="mb-2">${fabric.createdOn ? new Date(fabric.createdOn).toLocaleString() : 'N/A'}</p>
                                        </div>
                                        <div class="col-6">
                                            <label class="text-muted small">Modified On</label>
                                            <p class="mb-2">${fabric.modifiedOn ? new Date(fabric.modifiedOn).toLocaleString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Key Configuration Parameters Card -->
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-warning text-dark">
                                    <h5 class="mb-0"><i class="bi bi-sliders me-2"></i>Key Parameters</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        ${fabric.nvPairs ? `
                                            <div class="col-6">
                                                <label class="text-muted small">BGP AS</label>
                                                <p class="mb-2">${fabric.nvPairs.BGP_AS || 'N/A'}</p>
                                            </div>
                                            <div class="col-6">
                                                <label class="text-muted small">Anycast Gateway MAC</label>
                                                <p class="mb-2">${fabric.nvPairs.ANYCAST_GW_MAC || 'N/A'}</p>
                                            </div>
                                            <div class="col-6">
                                                <label class="text-muted small">BFD Enabled</label>
                                                <p class="mb-2">
                                                    <span class="badge ${fabric.nvPairs.BFD_ENABLE === 'true' ? 'bg-success' : 'bg-secondary'}">
                                                        ${fabric.nvPairs.BFD_ENABLE || 'N/A'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div class="col-6">
                                                <label class="text-muted small">VXLAN EVPN</label>
                                                <p class="mb-2">
                                                    <span class="badge ${fabric.nvPairs.VXLAN_EVPN === 'true' ? 'bg-success' : 'bg-secondary'}">
                                                        ${fabric.nvPairs.VXLAN_EVPN || 'N/A'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div class="col-6">
                                                <label class="text-muted small">Underlay Protocol</label>
                                                <p class="mb-2">${fabric.nvPairs.UNDERLAY_PROTOCOL || 'N/A'}</p>
                                            </div>
                                            <div class="col-6">
                                                <label class="text-muted small">Replication Mode</label>
                                                <p class="mb-2">${fabric.nvPairs.REPLICATION_MODE || 'N/A'}</p>
                                            </div>
                                        ` : '<p>No configuration parameters available</p>'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- IP Pools Card -->
                        <div class="col-12">
                            <div class="card shadow-sm">
                                <div class="card-header bg-secondary text-white">
                                    <h5 class="mb-0"><i class="bi bi-diagram-3 me-2"></i>IP Address Pools</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        ${fabric.nvPairs ? `
                                            <div class="col-md-3">
                                                <label class="text-muted small">Loopback Pool</label>
                                                <p class="mb-2">${fabric.nvPairs.LOOPBACK_IP_RANGE || 'N/A'}</p>
                                            </div>
                                            <div class="col-md-3">
                                                <label class="text-muted small">Underlay Subnet</label>
                                                <p class="mb-2">${fabric.nvPairs.LINK_STATE_ROUTING_TAG || fabric.nvPairs.UNDERLAY_SUBNET || 'N/A'}</p>
                                            </div>
                                            <div class="col-md-3">
                                                <label class="text-muted small">Anycast RP Range</label>
                                                <p class="mb-2">${fabric.nvPairs.ANYCAST_RP_IP_RANGE || 'N/A'}</p>
                                            </div>
                                            <div class="col-md-3">
                                                <label class="text-muted small">VPC Peer Link VLAN</label>
                                                <p class="mb-2">${fabric.nvPairs.VPC_PEER_LINK_VLAN || 'N/A'}</p>
                                            </div>
                                        ` : '<p>No IP pool information available</p>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                contentDiv.innerHTML = html;
            } else {
                contentDiv.innerHTML = `<div class="alert alert-danger">Failed to load fabric details: ${fabricData.message || 'Unknown error'}</div>`;
            }
        })
        .catch(error => {
            console.error('Failed to load fabric details:', error);
            contentDiv.innerHTML = '<div class="alert alert-danger">Failed to load fabric details. Please check the console for errors.</div>';
        });
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
    const nacApiKeyField = document.getElementById('nacApiKey');
    const nexusApiKeyField = document.getElementById('nexusApiKey');
    const nexusUrlField = document.getElementById('nexusUrl');
    const nexusUsernameField = document.getElementById('nexusUsername');
    const nexusFabricNameField = document.getElementById('nexusFabricName');

    // Determine actual values to save
    // If field has placeholder dots or is empty but has existing value, use stored value
    // Otherwise use the new value entered by user
    const formData = {
        nac_api_key: getFieldValue(nacApiKeyField),
        nexus_api_key: getFieldValue(nexusApiKeyField),
        nexus_url: nexusUrlField.value,
        nexus_username: nexusUsernameField.value,
        nexus_fabric_name: nexusFabricNameField.value
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
 * If field has placeholder dots or is empty with existing value, return stored value
 * Otherwise return the current field value
 */
function getFieldValue(field) {
    const currentValue = field.value;
    const hasValue = field.dataset.hasValue === 'true';
    const actualValue = field.dataset.actualValue || '';

    // If field has placeholder dots, use stored value
    if (currentValue === '••••••••••••••••' && hasValue) {
        return actualValue;
    }

    // If field is empty but had a value and user didn't explicitly clear it, keep existing
    if (currentValue === '' && hasValue && actualValue) {
        return actualValue;
    }

    // Otherwise use the new value (including empty string if user cleared it)
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
            const nacApiKeyField = document.getElementById('nacApiKey');
            const nexusApiKeyField = document.getElementById('nexusApiKey');
            const nexusUrlField = document.getElementById('nexusUrl');
            const nexusUsernameField = document.getElementById('nexusUsername');
            const nexusFabricNameField = document.getElementById('nexusFabricName');

            // Mark as loaded
            nacApiKeyField.dataset.configLoaded = 'true';

            // Handle NaC API Key
            if (data.nac_api_key) {
                nacApiKeyField.value = '••••••••••••••••';
                nacApiKeyField.dataset.hasValue = 'true';
                nacApiKeyField.dataset.actualValue = data.nac_api_key;
                nacApiKeyField.placeholder = 'Value configured - enter new value to change';
            } else {
                nacApiKeyField.value = '';
                nacApiKeyField.dataset.hasValue = 'false';
                nacApiKeyField.placeholder = 'Enter NaC API Key';
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

            // Handle Nexus Dashboard URL (not sensitive, show actual value)
            nexusUrlField.value = data.nexus_url || '';

            // Handle Nexus Dashboard Username (not sensitive, show actual value)
            nexusUsernameField.value = data.nexus_username || '';

            // Handle Nexus Dashboard Fabric Name (not sensitive, show actual value)
            nexusFabricNameField.value = data.nexus_fabric_name || '';

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
            // Get form fields
            const nacApiKeyField = document.getElementById('nacApiKey');
            const nexusApiKeyField = document.getElementById('nexusApiKey');
            const nexusUrlField = document.getElementById('nexusUrl');
            const nexusUsernameField = document.getElementById('nexusUsername');
            const nexusFabricNameField = document.getElementById('nexusFabricName');

            // Clear form fields and reset data attributes
            nacApiKeyField.value = '';
            nacApiKeyField.dataset.hasValue = 'false';
            nacApiKeyField.dataset.actualValue = '';
            nacApiKeyField.placeholder = 'Enter NaC API Key';

            nexusApiKeyField.value = '';
            nexusApiKeyField.dataset.hasValue = 'false';
            nexusApiKeyField.dataset.actualValue = '';
            nexusApiKeyField.placeholder = 'Enter Nexus Dashboard API Key';

            nexusUrlField.value = '';
            nexusUsernameField.value = '';
            nexusFabricNameField.value = '';

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
