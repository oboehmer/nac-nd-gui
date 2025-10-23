// Nexus Dashboard specific JavaScript
// Handles all Nexus Dashboard API related tables and visualizations

/**
 * Initialize Nexus Dashboard table for a specific page
 */
function initializeNexusTableForPage(page, commonConfig, tableInstances) {
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

    console.log(`Nexus Dashboard Tabulator table initialized for page: ${page}`);
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
