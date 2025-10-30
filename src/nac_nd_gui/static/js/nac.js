// NaC YAML specific JavaScript
// Handles all NaC API related tables, modals, and visualizations

/**
 * Initialize NaC table for a specific page
 */
function initializeNacTableForPage(page, commonConfig, tableInstances) {
    // Initialize VRF Instances Table (VRF page)
    if (page === 'vrf' && document.getElementById('vrfInstancesTable') && !tableInstances['vrfInstancesTable']) {
        tableInstances['vrfInstancesTable'] = new Tabulator("#vrfInstancesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/vrfs",
            columns: [
                {
                    title: "VRF Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "VRF ID",
                    field: "vrf_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Attach Group",
                    field: "vrf_attach_group",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const vrfName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-info view-vrf-yaml"
                                    data-vrf-name="${vrfName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });
    }

    // Initialize VRF Instances Table (Action VRFs page)
    if (page === 'action-vrfs' && document.getElementById('actionVrfInstancesTable') && !tableInstances['actionVrfInstancesTable']) {
        tableInstances['actionVrfInstancesTable'] = new Tabulator("#actionVrfInstancesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/vrfs",
            columns: [
                {
                    title: "VRF Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "VRF ID",
                    field: "vrf_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Attach Group",
                    field: "vrf_attach_group",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const vrfName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-info view-action-vrf-yaml"
                                    data-vrf-name="${vrfName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });

        // Add refresh button handler for action VRFs
        const refreshBtn = document.getElementById('refreshActionVrfsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                tableInstances['actionVrfInstancesTable'].setData("/api/v1/nac/vrfs");
            });
        }
    }

    // Initialize Networks Table (Networks page)
    if (page === 'networks' && document.getElementById('networksTable') && !tableInstances['networksTable']) {
        tableInstances['networksTable'] = new Tabulator("#networksTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/networks",
            columns: [
                {
                    title: "Network Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Network ID",
                    field: "network_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Name",
                    field: "vrf_name",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const networkName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-success view-network-yaml"
                                    data-network-name="${networkName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });
    }

    // Initialize Network Instances Table (Action Networks page)
    if (page === 'action-networks' && document.getElementById('actionNetworkInstancesTable') && !tableInstances['actionNetworkInstancesTable']) {
        tableInstances['actionNetworkInstancesTable'] = new Tabulator("#actionNetworkInstancesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/networks",
            columns: [
                {
                    title: "Network Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Network ID",
                    field: "network_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Name",
                    field: "vrf_name",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const networkName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-success view-action-network-yaml"
                                    data-network-name="${networkName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });

        // Add refresh button handler for action Networks
        const refreshBtn = document.getElementById('refreshActionNetworksBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                tableInstances['actionNetworkInstancesTable'].setData("/api/v1/nac/networks");
            });
        }
    }

    // Initialize Switches Table (Switches page)
    if (page === 'switches' && document.getElementById('switchesTable') && !tableInstances['switchesTable']) {
        tableInstances['switchesTable'] = new Tabulator("#switchesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/switches",
            columns: [
                {
                    title: "Hostname",
                    field: "hostname",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Role",
                    field: "role",
                    sorter: "string",
                    minWidth: 120
                },
                {
                    title: "Serial Number",
                    field: "serial",
                    sorter: "string",
                    minWidth: 180
                },
                {
                    title: "Management IP",
                    field: "mgmt_ip",
                    sorter: "string",
                    minWidth: 150
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const hostname = rowData.hostname;
                        return `
                            <button class="btn btn-sm btn-outline-primary view-switch-yaml"
                                    data-switch-hostname="${hostname}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "hostname", dir: "asc" }]
        });
    }

    // Initialize Interfaces Table (Interfaces page) - Grouped by switch
    if (page === 'interfaces' && document.getElementById('interfacesTable') && !tableInstances['interfacesTable']) {
        tableInstances['interfacesTable'] = new Tabulator("#interfacesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/interfaces",
            groupBy: "switch_hostname",  // Group interfaces by switch hostname
            groupHeader: function(value, count, data, group) {
                // Custom group header showing switch name and interface count
                return `<i class="bi bi-router me-2"></i><strong>${value}</strong> <span class="badge bg-secondary ms-2">${count} interfaces</span>`;
            },
            columns: [
                {
                    title: "Interface Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Mode",
                    field: "mode",
                    sorter: "string",
                    minWidth: 150
                },
                {
                    title: "Description",
                    field: "description",
                    sorter: "string",
                    minWidth: 250
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const interfaceName = rowData.name;
                        const switchHostname = rowData.switch_hostname;
                        return `
                            <button class="btn btn-sm btn-outline-warning view-interface-yaml"
                                    data-interface-name="${interfaceName}"
                                    data-switch-hostname="${switchHostname}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [
                { column: "switch_hostname", dir: "asc" },
                { column: "name", dir: "asc" }
            ]
        });
    }

    // Initialize Fabric Details (Fabric page)
    if (page === 'fabric') {
        loadFabricDetails();
    }

    console.log(`NaC Tabulator table initialized for page: ${page}`);
}


/**
 * Load and display Fabric details from NaC API
 */
function loadFabricDetails() {
    const contentDiv = document.getElementById('fabricContent');
    if (!contentDiv) return;

    // Fetch fabric details
    fetch('/api/v1/nac/fabric')
        .then(response => response.json())
        .then(fabricData => {
            if (fabricData.status === 'success' && fabricData.data) {
                const data = fabricData.data;
                const global = data.global || {};
                const fabric = data.fabric || {};

                // Build HTML for fabric details in grouped cards
                let html = '<div class="row g-4">';

                // Helper to separate simple and complex properties
                function separateProperties(obj) {
                    const simple = {};
                    const complex = {};
                    const excludeFromSimple = ['dns_servers', 'ntp_servers', 'syslog_servers', 'netflow', 'bgp'];

                    for (const [key, value] of Object.entries(obj)) {
                        // Skip keys that have dedicated cards
                        if (excludeFromSimple.includes(key)) {
                            continue;
                        }

                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            complex[key] = value;
                        } else {
                            simple[key] = value;
                        }
                    }

                    return { simple, complex };
                }

                // Global Configuration Card (simple properties only)
                const globalProps = separateProperties(global);
                if (Object.keys(globalProps.simple).length > 0) {
                    html += `
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="bi bi-globe me-2"></i>Global Configuration</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        ${Object.entries(globalProps.simple).map(([key, value]) => `
                                            <div class="col-md-6">
                                                <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Fabric Configuration Card (simple properties only)
                const fabricProps = separateProperties(fabric);
                if (Object.keys(fabricProps.simple).length > 0) {
                    html += `
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0"><i class="bi bi-diagram-3 me-2"></i>Fabric Configuration</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        ${Object.entries(fabricProps.simple).map(([key, value]) => `
                                            <div class="col-md-6">
                                                <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // BGP Configuration Cards (if available in fabric or global)
                const bgpData = fabric.bgp || global.bgp || {};
                if (Object.keys(bgpData).length > 0) {
                    // eBGP Card
                    if (bgpData.ebgp) {
                        html += `
                            <div class="col-lg-6">
                                <div class="card shadow-sm">
                                    <div class="card-header bg-info text-white">
                                        <h5 class="mb-0"><i class="bi bi-arrows-angle-expand me-2"></i>eBGP Configuration</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            ${Object.entries(bgpData.ebgp).map(([key, value]) => `
                                                <div class="col-md-6">
                                                    <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                    <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    // iBGP Card
                    if (bgpData.ibgp) {
                        html += `
                            <div class="col-lg-6">
                                <div class="card shadow-sm">
                                    <div class="card-header bg-warning text-dark">
                                        <h5 class="mb-0"><i class="bi bi-arrows-angle-contract me-2"></i>iBGP Configuration</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            ${Object.entries(bgpData.ibgp).map(([key, value]) => `
                                                <div class="col-md-6">
                                                    <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                    <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }

                // DNS Servers Card
                const dnsServers = global.dns_servers || fabric.dns_servers;
                if (dnsServers && typeof dnsServers === 'object') {
                    html += createComplexCard('DNS Servers', dnsServers, 'dns', 'secondary', 'dnsServersTable');
                }

                // NTP Servers Card
                const ntpServers = global.ntp_servers || fabric.ntp_servers;
                if (ntpServers && typeof ntpServers === 'object') {
                    html += createComplexCard('NTP Servers', ntpServers, 'clock', 'info', 'ntpServersTable');
                }

                // Syslog Servers Card
                const syslogServers = global.syslog_servers || fabric.syslog_servers;
                if (syslogServers && typeof syslogServers === 'object') {
                    html += createComplexCard('Syslog Servers', syslogServers, 'journal-text', 'warning', 'syslogServersTable');
                }

                // NETFLOW Configuration Card
                const netflow = global.netflow || fabric.netflow;
                if (netflow && typeof netflow === 'object') {
                    html += createComplexCard('NETFLOW Configuration', netflow, 'diagram-2', 'dark', 'netflowTable');
                }

                html += '</div>';

                contentDiv.innerHTML = html;

                // Initialize Tabulator tables for complex objects
                if (dnsServers && typeof dnsServers === 'object') {
                    initializeComplexTable('dnsServersTable', dnsServers);
                }
                if (ntpServers && typeof ntpServers === 'object') {
                    initializeComplexTable('ntpServersTable', ntpServers);
                }
                if (syslogServers && typeof syslogServers === 'object') {
                    initializeComplexTable('syslogServersTable', syslogServers);
                }
                if (netflow && typeof netflow === 'object') {
                    initializeComplexTable('netflowTable', netflow);
                }
            } else {
                contentDiv.innerHTML = `<div class="alert alert-danger">Failed to load fabric details: ${fabricData.message || 'Unknown error'}</div>`;
            }
        })
        .catch(error => {
            console.error('Failed to load fabric details:', error);
            contentDiv.innerHTML = '<div class="alert alert-danger">Failed to load fabric details. Please check the console for errors.</div>';
        });

    // Helper function to create card for complex objects
    function createComplexCard(title, data, icon, colorClass, tableId) {
        const entries = Object.entries(data);
        if (entries.length === 0) return '';

        const textClass = ['warning', 'dark'].includes(colorClass) ? 'text-dark' : 'text-white';

        return `
            <div class="col-lg-6">
                <div class="card shadow-sm">
                    <div class="card-header bg-${colorClass} ${textClass}">
                        <h5 class="mb-0"><i class="bi bi-${icon} me-2"></i>${title}</h5>
                    </div>
                    <div class="card-body p-0">
                        <div id="${tableId}"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper function to initialize Tabulator for complex objects
    function initializeComplexTable(tableId, data) {
        // Check if data is an array of dictionaries or a single object
        let tableData = [];
        let columns = [];

        if (Array.isArray(data)) {
            // Data is a list of dictionaries - use each dictionary as a row
            tableData = data;

            // Extract column names from the first dictionary
            if (tableData.length > 0) {
                const firstItem = tableData[0];
                columns = Object.keys(firstItem).map(key => ({
                    title: key.replace(/_/g, ' ').toUpperCase(),
                    field: key,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return formatComplexValue(value);
                    }
                }));
            }
        } else if (typeof data === 'object') {
            // Data is a single object - convert to property/value pairs
            tableData = Object.entries(data).map(([key, value]) => ({
                property: key.replace(/_/g, ' ').toUpperCase(),
                value: value
            }));

            columns = [
                {
                    title: "Property",
                    field: "property",
                    widthGrow: 1,
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`
                },
                {
                    title: "Value",
                    field: "value",
                    widthGrow: 2,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return formatComplexValue(value);
                    }
                }
            ];
        }

        new Tabulator(`#${tableId}`, {
            data: tableData,
            layout: "fitColumns",
            responsiveLayout: "collapse",
            placeholder: "No Data Available",
            columns: columns
        });
    }

    // Helper function to format values
    function formatValue(value) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">N/A</span>';
        }
        if (typeof value === 'boolean') {
            const icon = value ? 'check-circle-fill text-success' : 'x-circle text-muted';
            return `<i class="bi bi-${icon}"></i> ${value}`;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return '<span class="text-muted">Empty</span>';
            return value.join(', ');
        }
        if (typeof value === 'object') {
            return '<span class="text-muted">[Complex Object]</span>';
        }
        return value;
    }

    // Helper function to format complex nested values
    function formatComplexValue(value) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">N/A</span>';
        }
        if (typeof value === 'boolean') {
            const icon = value ? 'check-circle-fill text-success' : 'x-circle text-muted';
            return `<i class="bi bi-${icon}"></i> ${value}`;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return '<span class="text-muted">Empty</span>';
            // Display array items as a comma-separated list or each on a new line for better readability
            if (value.length === 1) {
                return value[0];
            }
            return value.map(item => `<div class="mb-1">${item}</div>`).join('');
        }
        if (typeof value === 'object') {
            // Format nested objects as key-value pairs
            return Object.entries(value).map(([k, v]) =>
                `<div class="mb-1"><span class="text-muted">${k}:</span> <strong>${v}</strong></div>`
            ).join('');
        }
        return value;
    }
}


/**
 * YAML Modal Functions for NaC Resources
 */

/**
 * Show VRF YAML modal
 */
async function showVrfYamlModal(vrfName, tableInstances) {
    try {
        // Get the VRF data from the table
        const vrfTable = tableInstances['vrfInstancesTable'];
        if (!vrfTable) {
            console.error('VRF table not found');
            return;
        }

        // Find the VRF row data
        const rows = vrfTable.getData();
        const vrfData = rows.find(row => row.name === vrfName);

        if (!vrfData) {
            console.error(`VRF ${vrfName} not found in table data`);
            return;
        }

        // Use the complete original API data instead of just table fields
        const completeData = vrfData._originalData || vrfData;

        // Convert complete VRF data to YAML format
        const yamlContent = convertToYaml(completeData);

        // Update modal content
        document.querySelector('#vrfYamlName span').textContent = vrfName;
        document.getElementById('vrfYamlContent').textContent = yamlContent;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('vrfYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing VRF YAML modal:', error);
        alert('Failed to display VRF YAML. Please try again.');
    }
}

/**
 * Show VRF YAML modal (Action VRFs page)
 */
async function showActionVrfYamlModal(vrfName, tableInstances) {
    try {
        // Get the VRF data from the action VRF table
        const vrfTable = tableInstances['actionVrfInstancesTable'];
        if (!vrfTable) {
            console.error('Action VRF table not found');
            return;
        }

        // Find the VRF row data
        const rows = vrfTable.getData();
        const vrfData = rows.find(row => row.name === vrfName);

        if (!vrfData) {
            console.error(`VRF ${vrfName} not found in action VRF table data`);
            return;
        }

        // Use the complete original API data instead of just table fields
        const completeData = vrfData._originalData || vrfData;

        // Convert complete VRF data to YAML format
        const yamlContent = convertToYaml(completeData);

        // Update modal content
        document.querySelector('#vrfYamlName span').textContent = vrfName;
        document.getElementById('vrfYamlContent').textContent = yamlContent;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('vrfYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Action VRF YAML modal:', error);
        alert('Failed to display VRF YAML. Please try again.');
    }
}

/**
 * Show Network YAML modal
 */
async function showNetworkYamlModal(networkName, tableInstances) {
    try {
        const networkTable = tableInstances['networksTable'];
        if (!networkTable) {
            console.error('Network table not found');
            return;
        }

        const rows = networkTable.getData();
        const networkData = rows.find(row => row.name === networkName);

        if (!networkData) {
            console.error(`Network ${networkName} not found in table data`);
            return;
        }

        const completeData = networkData._originalData || networkData;
        const yamlContent = convertToYaml(completeData);

        document.querySelector('#networkYamlName span').textContent = networkName;
        document.getElementById('networkYamlContent').textContent = yamlContent;

        const modal = new bootstrap.Modal(document.getElementById('networkYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Network YAML modal:', error);
        alert('Failed to display Network YAML. Please try again.');
    }
}

/**
 * Show Network YAML modal (Action Networks page)
 */
async function showActionNetworkYamlModal(networkName, tableInstances) {
    try {
        // Get the Network data from the action Network table
        const networkTable = tableInstances['actionNetworkInstancesTable'];
        if (!networkTable) {
            console.error('Action Network table not found');
            return;
        }

        // Find the Network row data
        const rows = networkTable.getData();
        const networkData = rows.find(row => row.name === networkName);

        if (!networkData) {
            console.error(`Network ${networkName} not found in action Network table data`);
            return;
        }

        // Use the complete original API data instead of just table fields
        const completeData = networkData._originalData || networkData;

        // Convert complete Network data to YAML format
        const yamlContent = convertToYaml(completeData);

        // Update modal content
        document.querySelector('#networkYamlName span').textContent = networkName;
        document.getElementById('networkYamlContent').textContent = yamlContent;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('networkYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Action Network YAML modal:', error);
        alert('Failed to display Network YAML. Please try again.');
    }
}

/**
 * Show Switch YAML modal
 */
async function showSwitchYamlModal(hostname, tableInstances) {
    try {
        const switchTable = tableInstances['switchesTable'];
        if (!switchTable) {
            console.error('Switch table not found');
            return;
        }

        const rows = switchTable.getData();
        const switchData = rows.find(row => row.hostname === hostname);

        if (!switchData) {
            console.error(`Switch ${hostname} not found in table data`);
            return;
        }

        const completeData = switchData._originalData || switchData;
        const yamlContent = convertToYaml(completeData);

        document.querySelector('#switchYamlName span').textContent = hostname;
        document.getElementById('switchYamlContent').textContent = yamlContent;

        const modal = new bootstrap.Modal(document.getElementById('switchYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Switch YAML modal:', error);
        alert('Failed to display Switch YAML. Please try again.');
    }
}

/**
 * Show Interface YAML modal
 */
async function showInterfaceYamlModal(interfaceName, switchHostname, tableInstances) {
    try {
        const interfaceTable = tableInstances['interfacesTable'];
        if (!interfaceTable) {
            console.error('Interface table not found');
            return;
        }

        const rows = interfaceTable.getData();
        const interfaceData = rows.find(row =>
            row.name === interfaceName && row.switch_hostname === switchHostname
        );

        if (!interfaceData) {
            console.error(`Interface ${interfaceName} on ${switchHostname} not found in table data`);
            return;
        }

        const completeData = interfaceData._originalData || interfaceData;
        const yamlContent = convertToYaml(completeData);

        document.querySelector('#interfaceYamlName span').textContent = `${interfaceName} (${switchHostname})`;
        document.getElementById('interfaceYamlContent').textContent = yamlContent;

        const modal = new bootstrap.Modal(document.getElementById('interfaceYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Interface YAML modal:', error);
        alert('Failed to display Interface YAML. Please try again.');
    }
}

/**
 * Convert data to YAML format
 * Generic function that handles all data types
 */
function convertToYaml(data) {
    // Helper function to convert value to YAML format
    function formatValue(value, indent = 0) {
        const spaces = '  '.repeat(indent);

        if (value === null || value === undefined) {
            return 'null';
        } else if (typeof value === 'string') {
            // Quote strings if they contain special characters or are numeric
            if (value.includes(':') || value.includes('#') || !isNaN(value)) {
                return `"${value}"`;
            }
            return value;
        } else if (typeof value === 'boolean') {
            return value.toString();
        } else if (typeof value === 'number') {
            return value.toString();
        } else if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            return '\n' + value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return spaces + '  - ' + formatValue(item, indent + 1).trim();
                }
                return spaces + '  - ' + formatValue(item, indent + 1);
            }).join('\n');
        } else if (typeof value === 'object') {
            const entries = Object.entries(value);
            if (entries.length === 0) return '{}';
            return '\n' + entries.map(([k, v]) => {
                return spaces + '  ' + k + ': ' + formatValue(v, indent + 1);
            }).join('\n');
        }
        return String(value);
    }

    // Convert all fields to YAML
    const yamlLines = [];
    for (const [key, value] of Object.entries(data)) {
        // Skip internal fields starting with underscore
        if (key.startsWith('_')) continue;

        yamlLines.push(key + ': ' + formatValue(value));
    }

    return yamlLines.join('\n');
}


/**
 * Load VRFs into dropdown for action-networks page
 */
async function loadVrfDropdown() {
    const vrfSelect = document.getElementById('networkVrfName');
    if (!vrfSelect) {
        console.error('VRF select element not found');
        return;
    }

    try {
        const response = await fetch('/api/v1/nac/vrfs');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            // Clear existing options except the first one
            vrfSelect.innerHTML = '<option value="">Select a VRF</option>';

            // Add VRF options
            result.data.forEach(vrf => {
                const option = document.createElement('option');
                option.value = vrf.name;
                option.textContent = vrf.name;
                vrfSelect.appendChild(option);
            });

            console.log(`Loaded ${result.data.length} VRFs into dropdown`);
        } else {
            console.error('Failed to load VRFs:', result.message);
        }
    } catch (error) {
        console.error('Error loading VRFs:', error);
    }
}


/**
 * Event delegation for NaC YAML modal buttons
 * This must be called after DOM is loaded
 */
function initializeNacYamlEventListeners(tableInstances) {
    document.addEventListener('click', function(event) {
        // VRF YAML buttons (NaC YAML VRF page)
        if (event.target.closest('.view-vrf-yaml')) {
            const button = event.target.closest('.view-vrf-yaml');
            const vrfName = button.dataset.vrfName;
            showVrfYamlModal(vrfName, tableInstances);
        }

        // VRF YAML buttons (Action VRFs page)
        if (event.target.closest('.view-action-vrf-yaml')) {
            const button = event.target.closest('.view-action-vrf-yaml');
            const vrfName = button.dataset.vrfName;
            showActionVrfYamlModal(vrfName, tableInstances);
        }

        // Network YAML buttons (NaC YAML Networks page)
        if (event.target.closest('.view-network-yaml')) {
            const button = event.target.closest('.view-network-yaml');
            const networkName = button.dataset.networkName;
            showNetworkYamlModal(networkName, tableInstances);
        }

        // Network YAML buttons (Action Networks page)
        if (event.target.closest('.view-action-network-yaml')) {
            const button = event.target.closest('.view-action-network-yaml');
            const networkName = button.dataset.networkName;
            showActionNetworkYamlModal(networkName, tableInstances);
        }

        // Switch YAML buttons
        if (event.target.closest('.view-switch-yaml')) {
            const button = event.target.closest('.view-switch-yaml');
            const hostname = button.dataset.switchHostname;
            showSwitchYamlModal(hostname, tableInstances);
        }

        // Interface YAML buttons
        if (event.target.closest('.view-interface-yaml')) {
            const button = event.target.closest('.view-interface-yaml');
            const interfaceName = button.dataset.interfaceName;
            const switchHostname = button.dataset.switchHostname;
            showInterfaceYamlModal(interfaceName, switchHostname, tableInstances);
        }
    });
}


/**
 * Initialize form handlers for NaC action forms
 */
function initializeNacActionFormHandlers() {
    // VRF Action Form Handler
    const vrfActionForm = document.getElementById('vrfActionForm');
    if (vrfActionForm) {
        vrfActionForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const responseDiv = document.getElementById('vrfActionResponse');
            const submitBtn = event.target.querySelector('button[type="submit"]');

            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Merging...';

            // Get form data (required fields)
            const formData = {
                name: document.getElementById('vrfName').value,
                vrf_id: parseInt(document.getElementById('vrfId').value),
                vlan_id: parseInt(document.getElementById('vlanId').value)
            };

            // Add optional fields if provided
            const vrfVlanName = document.getElementById('vrfVlanName').value;
            if (vrfVlanName) {
                formData.vrf_vlan_name = vrfVlanName;
            }

            const vrfDescription = document.getElementById('vrfDescription').value;
            if (vrfDescription) {
                formData.vrf_description = vrfDescription;
            }

            try {
                const response = await fetch('/api/v1/nac/vrfs/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    responseDiv.innerHTML = `<strong><i class="bi bi-check-circle me-2"></i>Success!</strong><p class="mb-0 mt-2">${result.message}</p>`;
                    responseDiv.className = 'alert alert-success';
                    responseDiv.style.display = 'block';

                    // Reset form after success
                    vrfActionForm.reset();
                } else {
                    responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">${result.message}</p>`;
                    responseDiv.className = 'alert alert-danger';
                    responseDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('VRF merge error:', error);
                responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">Failed to merge VRF: ${error.message}</p>`;
                responseDiv.className = 'alert alert-danger';
                responseDiv.style.display = 'block';
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                // Smooth scroll to response
                responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // Network Action Form Handler
    const networkActionForm = document.getElementById('networkActionForm');
    if (networkActionForm) {
        networkActionForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const responseDiv = document.getElementById('networkActionResponse');
            const submitBtn = event.target.querySelector('button[type="submit"]');

            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Merging...';

            // Get form data (required fields)
            const formData = {
                name: document.getElementById('networkName').value,
                vrf_name: document.getElementById('networkVrfName').value,
                net_id: parseInt(document.getElementById('netId').value),
                vlan_id: parseInt(document.getElementById('networkVlanId').value)
            };

            // Add optional fields if provided
            const vlanName = document.getElementById('vlanName').value;
            if (vlanName) {
                formData.vlan_name = vlanName;
            }

            const gwIpAddress = document.getElementById('gwIpAddress').value;
            if (gwIpAddress) {
                formData.gw_ip_address = gwIpAddress;
            }

            const gwIpv6 = document.getElementById('gwIpv6Address').value;
            if (gwIpv6) {
                formData.gw_ipv6_address = gwIpv6;
            }

            const secondaryIp = document.getElementById('secondaryIpAddress').value;
            if (secondaryIp) {
                formData.secondary_ip_address = secondaryIp;
            }

            try {
                const response = await fetch('/api/v1/nac/networks/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    responseDiv.innerHTML = `<strong><i class="bi bi-check-circle me-2"></i>Success!</strong><p class="mb-0 mt-2">${result.message}</p>`;
                    responseDiv.className = 'alert alert-success';
                    responseDiv.style.display = 'block';

                    // Reset form after success
                    networkActionForm.reset();
                } else {
                    responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">${result.message}</p>`;
                    responseDiv.className = 'alert alert-danger';
                    responseDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Network merge error:', error);
                responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">Failed to merge Network: ${error.message}</p>`;
                responseDiv.className = 'alert alert-danger';
                responseDiv.style.display = 'block';
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                // Smooth scroll to response
                responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }
}


/**
 * Copy YAML to clipboard handlers
 */
function initializeNacYamlCopyHandlers() {
    // Copy YAML to clipboard (VRF)
    const copyYamlBtn = document.getElementById('copyYamlBtn');
    if (copyYamlBtn) {
        copyYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('vrfYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                // Show success feedback
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }

    // Copy YAML to clipboard (Network)
    const copyNetworkYamlBtn = document.getElementById('copyNetworkYamlBtn');
    if (copyNetworkYamlBtn) {
        copyNetworkYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('networkYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }

    // Copy YAML to clipboard (Switch)
    const copySwitchYamlBtn = document.getElementById('copySwitchYamlBtn');
    if (copySwitchYamlBtn) {
        copySwitchYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('switchYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }

    // Copy YAML to clipboard (Interface)
    const copyInterfaceYamlBtn = document.getElementById('copyInterfaceYamlBtn');
    if (copyInterfaceYamlBtn) {
        copyInterfaceYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('interfaceYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }
}
