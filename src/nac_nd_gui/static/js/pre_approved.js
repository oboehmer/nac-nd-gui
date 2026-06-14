'use strict';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let paOriginalInterfaces = [];   // raw data from /api/v1/nac/interfaces
let paDescTable = null;          // Tabulator instance for description table
let paAccessTable = null;        // Tabulator instance for access mgmt table
let paActiveChangeType = null;   // 'description-change' | 'access-mgmt'
let paInitialized = false;       // guard against double-init on nav
let paCurrentTicket = '';        // current ticket number (normalized)
let paCurrentChangeset = '';     // changeset name set once on ticket lookup

// ---------------------------------------------------------------------------
// Entry point called from app.js loadPageContent()
// ---------------------------------------------------------------------------
function initPreApprovedWorkflow() {
    // Reload fabrics every time (they may have changed), but only bind events once
    loadPreApprovedFabrics();

    if (paInitialized) return;

    document.getElementById('preApprovedLookupBtn').addEventListener('click', mockTicketLookup);

    document.getElementById('preApprovedChangeType').addEventListener('change', function () {
        const val = this.value;
        // Hide both table sections first
        document.getElementById('preApprovedDescSection').classList.add('d-none');
        document.getElementById('preApprovedAccessSection').classList.add('d-none');
        document.getElementById('preApprovedActionsSection').classList.add('d-none');

        if (val === 'description-change') {
            loadDescriptionChangeTable();
        } else if (val === 'access-mgmt') {
            loadAccessMgmtTable();
        }
    });

    document.getElementById('preApprovedMergeBtn').addEventListener('click', handlePreApprovedMerge);
    document.getElementById('preApprovedDiffBtn').addEventListener('click', showPreApprovedDiff);
    document.getElementById('preApprovedResetBtn').addEventListener('click', resetPreApprovedWorkflow);
    document.getElementById('refreshDescInterfacesBtn').addEventListener('click', loadDescriptionChangeTable);
    document.getElementById('refreshAccessInterfacesBtn').addEventListener('click', loadAccessMgmtTable);

    // Event delegation for VLAN inputs rendered inside Tabulator cells
    document.addEventListener('input', function (e) {
        if (!paAccessTable) return;
        const target = e.target;
        if (target.classList.contains('pa-access-vlan-input') ||
            target.classList.contains('pa-native-vlan-input') ||
            target.classList.contains('pa-trunk-vlans-input')) {
            const rowId = target.getAttribute('data-row-id');
            if (!rowId) return;
            const rows = paAccessTable.getRows();
            for (const row of rows) {
                const data = row.getData();
                const id = `${data.name}_${data.switch_hostname}`;
                if (id === rowId) {
                    if (target.classList.contains('pa-access-vlan-input')) {
                        row.update({ access_vlan: target.value });
                    } else if (target.classList.contains('pa-native-vlan-input')) {
                        row.update({ native_vlan: target.value });
                    } else if (target.classList.contains('pa-trunk-vlans-input')) {
                        row.update({ trunk_vlans_text: target.value });
                    }
                    markAccessRowDirty(row);
                    break;
                }
            }
        }
    });

    paInitialized = true;
}

// ---------------------------------------------------------------------------
// Load ND fabrics into dropdown
// ---------------------------------------------------------------------------
function loadPreApprovedFabrics() {
    const select = document.getElementById('preApprovedFabric');
    select.innerHTML = '<option value="">Loading fabric...</option>';

    fetch('/api/v1/nac/fabric')
        .then(r => r.json())
        .then(json => {
            select.innerHTML = '';
            if (json.status !== 'success' || !json.data) {
                select.innerHTML = '<option value="">No fabric available</option>';
                return;
            }
            // NaC manages a single fabric; name lives in data.fabric.name or data.global.name
            const fabric = json.data.fabric || {};
            const global_ = json.data.global || {};
            const fabricName = fabric.name || global_.name || 'NaC Fabric';
            const opt = document.createElement('option');
            opt.value = fabricName;
            opt.textContent = fabricName;
            opt.selected = true;
            select.appendChild(opt);
        })
        .catch(() => {
            select.innerHTML = '<option value="">No fabric available</option>';
        });
}

// ---------------------------------------------------------------------------
// Mock ServiceNow ticket lookup (simulated async)
// ---------------------------------------------------------------------------
function mockTicketLookup() {
    const ticketInput = document.getElementById('preApprovedTicket');
    const ticketVal = ticketInput.value.trim();
    if (!ticketVal) {
        ticketInput.classList.add('is-invalid');
        setTimeout(() => ticketInput.classList.remove('is-invalid'), 2000);
        return;
    }

    // Show spinner
    document.getElementById('preApprovedLookupSpinner').classList.remove('d-none');
    document.getElementById('preApprovedLookupIcon').classList.add('d-none');
    document.getElementById('preApprovedLookupBtn').disabled = true;

    setTimeout(function () {
        paCurrentTicket = ticketVal.toUpperCase();

        // Build changeset once: sanitized ticket + YYYYMMDDHHmmss timestamp
        const sanitizedTicket = paCurrentTicket.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const now = new Date();
        const ts = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        paCurrentChangeset = `${sanitizedTicket}-${ts}`;

        // Populate ticket card fields
        document.getElementById('paTicketNumber').textContent = paCurrentTicket;
        document.getElementById('paTicketTitle').textContent = 'Pre-Approved Network Interface Update';
        document.getElementById('paTicketStatus').innerHTML = '<span class="pa-status-approved badge">Approved</span>';
        document.getElementById('paTicketRequestor').textContent = 'John Smith';
        document.getElementById('paTicketScheduled').textContent = '2026-06-15 02:00 UTC';

        // Show ticket section — always approved
        document.getElementById('preApprovedTicketSection').classList.remove('d-none');
        document.getElementById('preApprovedPendingWarning').classList.add('d-none');
        document.getElementById('preApprovedTicketCardHeader').className = 'card-header bg-success text-white';
        document.getElementById('preApprovedChangeTypeSection').classList.remove('d-none');

        // Restore spinner
        document.getElementById('preApprovedLookupSpinner').classList.add('d-none');
        document.getElementById('preApprovedLookupIcon').classList.remove('d-none');
        document.getElementById('preApprovedLookupBtn').disabled = false;
    }, 800);
}

// ---------------------------------------------------------------------------
// Section 4a: Interface Description Change table
// ---------------------------------------------------------------------------
function loadDescriptionChangeTable() {
    document.getElementById('preApprovedDescSection').classList.remove('d-none');
    document.getElementById('descInterfacesLoading').classList.remove('d-none');
    document.getElementById('descInterfacesTable').innerHTML = '';

    if (paDescTable) {
        paDescTable.destroy();
        paDescTable = null;
    }

    fetch('/api/v1/nac/interfaces')
        .then(r => r.json())
        .then(json => {
            if (json.status !== 'success' || !json.data) {
                throw new Error(json.message || 'Failed to load interfaces');
            }
            const rawData = json.data;
            paOriginalInterfaces = rawData;

            // Add newDescription tracking field per row
            const transformed = rawData.map(row => Object.assign({}, row, {
                newDescription: row.description || ''
            }));

            const commonConfig = {
                pagination: true,
                paginationSize: 15,
                layout: 'fitColumns',
                placeholder: 'No interfaces found'
            };

            paDescTable = new Tabulator('#descInterfacesTable', Object.assign({}, commonConfig, {
                data: transformed,
                columns: [
                    { title: 'Switch', field: 'switch_hostname', sorter: 'string', minWidth: 150 },
                    { title: 'Interface', field: 'name', sorter: 'string', minWidth: 120 },
                    { title: 'Current Description', field: 'description', sorter: 'string', minWidth: 200 },
                    {
                        title: 'New Description',
                        field: 'newDescription',
                        editor: 'input',
                        editorParams: { elementAttributes: { maxlength: 256 } },
                        minWidth: 250,
                        cellEdited: function (cell) {
                            const row = cell.getRow();
                            const data = row.getData();
                            if (data.newDescription !== (data.description || '')) {
                                row.getElement().classList.add('pa-row-dirty');
                            } else {
                                row.getElement().classList.remove('pa-row-dirty');
                            }
                        }
                    }
                ],
                rowFormatter: function (row) {
                    const data = row.getData();
                    if (data.newDescription !== (data.description || '')) {
                        row.getElement().classList.add('pa-row-dirty');
                    } else {
                        row.getElement().classList.remove('pa-row-dirty');
                    }
                }
            }));

            document.getElementById('descInterfacesLoading').classList.add('d-none');
            document.getElementById('preApprovedActionsSection').classList.remove('d-none');
            paActiveChangeType = 'description-change';
        })
        .catch(err => {
            document.getElementById('descInterfacesLoading').classList.add('d-none');
            document.getElementById('descInterfacesTable').innerHTML =
                `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load interfaces: ${err.message}</div>`;
        });
}

// ---------------------------------------------------------------------------
// Section 4b: Access Interface Management table
// ---------------------------------------------------------------------------
function loadAccessMgmtTable() {
    document.getElementById('preApprovedAccessSection').classList.remove('d-none');
    document.getElementById('accessInterfacesLoading').classList.remove('d-none');
    document.getElementById('accessInterfacesTable').innerHTML = '';

    if (paAccessTable) {
        paAccessTable.destroy();
        paAccessTable = null;
    }

    fetch('/api/v1/nac/interfaces')
        .then(r => r.json())
        .then(json => {
            if (json.status !== 'success' || !json.data) {
                throw new Error(json.message || 'Failed to load interfaces');
            }
            const rawData = json.data;
            paOriginalInterfaces = rawData;

            // Filter to only access / trunk
            const filtered = rawData
                .filter(row => row.mode === 'access' || row.mode === 'trunk')
                .map(row => Object.assign({}, row, {
                    _originalData: Object.assign({}, row),
                    trunk_vlans_text: formatTrunkVlans(row.trunk_allowed_vlans)
                }));

            const commonConfig = {
                pagination: true,
                paginationSize: 15,
                layout: 'fitColumns',
                placeholder: 'No access/trunk interfaces found'
            };

            paAccessTable = new Tabulator('#accessInterfacesTable', Object.assign({}, commonConfig, {
                data: filtered,
                columns: [
                    { title: 'Switch', field: 'switch_hostname', sorter: 'string', minWidth: 150 },
                    { title: 'Interface', field: 'name', sorter: 'string', minWidth: 120 },
                    {
                        title: 'Mode',
                        field: 'mode',
                        sorter: 'string',
                        minWidth: 100,
                        editor: 'select',
                        editorParams: { values: { access: 'access', trunk: 'trunk' } },
                        cellEdited: function (cell) {
                            cell.getRow().reformat();
                            markAccessRowDirty(cell.getRow());
                        }
                    },
                    {
                        title: 'Enabled',
                        field: 'enabled',
                        sorter: 'boolean',
                        minWidth: 90,
                        editor: 'tickCross',
                        formatter: 'tickCross',
                        cellEdited: function (cell) {
                            markAccessRowDirty(cell.getRow());
                        }
                    },
                    {
                        title: 'VLAN Config',
                        field: 'access_vlan',
                        minWidth: 250,
                        formatter: function (cell) {
                            const data = cell.getRow().getData();
                            const rowId = `${data.name}_${data.switch_hostname}`;
                            if (data.mode === 'access') {
                                return `<input type="number" class="form-control form-control-sm pa-access-vlan-input"
                                               data-row-id="${rowId}"
                                               value="${data.access_vlan || ''}" min="1" max="4094" placeholder="Access VLAN">`;
                            } else {
                                return `<div>
                                    <input type="number" class="form-control form-control-sm mb-1 pa-native-vlan-input"
                                           data-row-id="${rowId}"
                                           value="${data.native_vlan || ''}" min="1" max="4094" placeholder="Native VLAN">
                                    <input type="text" class="form-control form-control-sm pa-trunk-vlans-input"
                                           data-row-id="${rowId}"
                                           value="${data.trunk_vlans_text || ''}" placeholder="Allowed VLANs e.g. 10-20,100">
                                </div>`;
                            }
                        },
                        formatterParams: { htmlOutput: true },
                        cellClick: function (e) { e.stopPropagation(); }
                    }
                ],
                rowFormatter: function (row) {
                    markAccessRowDirty(row);
                }
            }));

            document.getElementById('accessInterfacesLoading').classList.add('d-none');
            document.getElementById('preApprovedActionsSection').classList.remove('d-none');
            paActiveChangeType = 'access-mgmt';
        })
        .catch(err => {
            document.getElementById('accessInterfacesLoading').classList.add('d-none');
            document.getElementById('accessInterfacesTable').innerHTML =
                `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>Failed to load interfaces: ${err.message}</div>`;
        });
}

// ---------------------------------------------------------------------------
// Helper: mark an access table row dirty if anything changed vs _originalData
// ---------------------------------------------------------------------------
function markAccessRowDirty(row) {
    const data = row.getData();
    const orig = data._originalData;
    if (!orig) return;

    const isDirty =
        data.mode !== orig.mode ||
        String(data.enabled) !== String(orig.enabled) ||
        String(data.access_vlan || '') !== String(orig.access_vlan || '') ||
        String(data.native_vlan || '') !== String(orig.native_vlan || '') ||
        (data.trunk_vlans_text || '') !== formatTrunkVlans(orig.trunk_allowed_vlans);

    if (isDirty) {
        row.getElement().classList.add('pa-row-dirty');
    } else {
        row.getElement().classList.remove('pa-row-dirty');
    }
}

// ---------------------------------------------------------------------------
// Helpers: trunk VLAN formatting / parsing
// ---------------------------------------------------------------------------
function formatTrunkVlans(vlans) {
    if (!vlans || !Array.isArray(vlans) || vlans.length === 0) return '';
    return vlans.map(v => {
        if (v.to !== undefined && v.to !== null && v.to !== v.from) {
            return `${v.from}-${v.to}`;
        }
        return String(v.from);
    }).join(', ');
}

function parseTrunkVlans(text) {
    if (!text || !text.trim()) return [];
    const result = [];
    const parts = text.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        if (trimmed.includes('-')) {
            const [fromStr, toStr] = trimmed.split('-');
            const from = parseInt(fromStr.trim(), 10);
            const to = parseInt(toStr.trim(), 10);
            if (!isNaN(from) && !isNaN(to)) {
                result.push({ from, to });
            }
        } else {
            const from = parseInt(trimmed, 10);
            if (!isNaN(from)) {
                result.push({ from });
            }
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Collect dirty rows for merge / diff
// ---------------------------------------------------------------------------
function collectDirtyRows() {
    if (paActiveChangeType === 'description-change') {
        if (!paDescTable) return [];
        return paDescTable.getData().filter(r => (r.newDescription || '') !== (r.description || ''));
    } else if (paActiveChangeType === 'access-mgmt') {
        if (!paAccessTable) return [];
        return paAccessTable.getData().filter(r => {
            const orig = r._originalData;
            if (!orig) return false;
            return r.mode !== orig.mode ||
                String(r.enabled) !== String(orig.enabled) ||
                String(r.access_vlan || '') !== String(orig.access_vlan || '') ||
                String(r.native_vlan || '') !== String(orig.native_vlan || '') ||
                (r.trunk_vlans_text || '') !== formatTrunkVlans(orig.trunk_allowed_vlans);
        });
    }
    return [];
}

// ---------------------------------------------------------------------------
// Merge Changes
// ---------------------------------------------------------------------------
function handlePreApprovedMerge() {
    const dirtyRows = collectDirtyRows();
    const responseEl = document.getElementById('preApprovedResponse');

    if (dirtyRows.length === 0) {
        responseEl.className = 'alert alert-warning';
        responseEl.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>No changes detected. Edit some interface fields first.';
        responseEl.classList.remove('d-none');
        return;
    }

    // Group by switch
    const switchMap = {};
    for (const row of dirtyRows) {
        const sw = row.switch_hostname;
        if (!switchMap[sw]) switchMap[sw] = [];

        if (paActiveChangeType === 'description-change') {
            switchMap[sw].push({ name: row.name, mode: row.mode, description: row.newDescription });
        } else {
            const iface = { name: row.name, mode: row.mode };
            if (row.enabled !== undefined) iface.enabled = row.enabled;
            if (row.mode === 'access' && row.access_vlan) {
                iface.access_vlan = parseInt(row.access_vlan, 10);
            }
            if (row.mode === 'trunk') {
                if (row.native_vlan) iface.native_vlan = parseInt(row.native_vlan, 10);
                iface.trunk_allowed_vlans = parseTrunkVlans(row.trunk_vlans_text || '');
            }
            switchMap[sw].push(iface);
        }
    }

    const data = Object.entries(switchMap).map(([name, interfaces]) => ({ name, interfaces }));

    const changeset = paCurrentChangeset;

    const changeTypeName = paActiveChangeType === 'description-change'
        ? 'Interface Description Change'
        : 'Access Interface Management';
    const apply_message = `Pre-Approved ${changeTypeName} via ${paCurrentTicket} (${dirtyRows.length} interface(s) changed)`;
    const apply = document.getElementById('preApprovedAutoProvision').checked;

    // Disable button + show spinner
    const mergeBtn = document.getElementById('preApprovedMergeBtn');
    mergeBtn.disabled = true;
    mergeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...';

    responseEl.classList.add('d-none');

    fetch('/api/v1/nac/interfaces/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, changeset, apply_message, apply })
    })
        .then(r => r.json())
        .then(json => {
            if (json.status === 'success' || json.status === 'ok') {
                responseEl.className = 'alert alert-success d-flex justify-content-between align-items-center';
                responseEl.innerHTML = `<span><i class="bi bi-check-circle me-2"></i><strong>Changes submitted!</strong> Branch <code>${changeset}</code> created.</span>
                    <button class="btn btn-sm btn-outline-success ms-3 text-nowrap" onclick="resetPreApprovedWorkflow()">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>Start New Change
                    </button>`;
            } else {
                throw new Error(json.message || JSON.stringify(json));
            }
        })
        .catch(err => {
            responseEl.className = 'alert alert-danger';
            responseEl.innerHTML = `<i class="bi bi-x-circle me-2"></i><strong>Merge failed:</strong> ${err.message}`;
        })
        .finally(() => {
            responseEl.classList.remove('d-none');
            responseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            mergeBtn.disabled = false;
            mergeBtn.innerHTML = '<i class="bi bi-git me-2"></i>Submit Changes';
        });
}

// ---------------------------------------------------------------------------
// Show unified diff modal
// ---------------------------------------------------------------------------
function showPreApprovedDiff() {
    const dirtyRows = collectDirtyRows();
    let diffHtml = '';

    if (dirtyRows.length === 0) {
        diffHtml = '<p class="text-muted p-3">No changes detected. Edit interfaces first.</p>';
    } else {
        for (const row of dirtyRows) {
            let beforeObj, afterObj;
            if (paActiveChangeType === 'description-change') {
                beforeObj = {
                    name: row.name,
                    mode: row.mode || '',
                    description: row.description || ''
                };
                afterObj = {
                    name: row.name,
                    mode: row.mode || '',
                    description: row.newDescription || ''
                };
            } else {
                const orig = row._originalData || {};
                beforeObj = {
                    name: orig.name || row.name,
                    mode: orig.mode || row.mode,
                    enabled: orig.enabled,
                    access_vlan: orig.access_vlan,
                    native_vlan: orig.native_vlan,
                    trunk_allowed_vlans: orig.trunk_allowed_vlans
                };
                // Clean undefined from before
                Object.keys(beforeObj).forEach(k => beforeObj[k] === undefined && delete beforeObj[k]);

                afterObj = { name: row.name, mode: row.mode };
                if (row.enabled !== undefined) afterObj.enabled = row.enabled;
                if (row.mode === 'access' && row.access_vlan) {
                    afterObj.access_vlan = parseInt(row.access_vlan, 10);
                }
                if (row.mode === 'trunk') {
                    if (row.native_vlan) afterObj.native_vlan = parseInt(row.native_vlan, 10);
                    const vlans = parseTrunkVlans(row.trunk_vlans_text || '');
                    if (vlans.length > 0) afterObj.trunk_allowed_vlans = vlans;
                }
            }

            const beforeYaml = convertToYaml(beforeObj);
            const afterYaml = convertToYaml(afterObj);
            const diff = lineDiff(beforeYaml, afterYaml);

            const linesHtml = diff.map(item => {
                if (item.type === 'removed') {
                    return `<div class="diff-line diff-line-removed">- ${escapeHtml(item.text)}</div>`;
                } else if (item.type === 'added') {
                    return `<div class="diff-line diff-line-added">+ ${escapeHtml(item.text)}</div>`;
                } else {
                    return `<div class="diff-line diff-line-context">  ${escapeHtml(item.text)}</div>`;
                }
            }).join('');

            diffHtml += `<div class="diff-block">
                <div class="diff-block-header">${escapeHtml(row.switch_hostname)} / ${escapeHtml(row.name)}</div>
                ${linesHtml}
            </div>`;
        }
    }

    document.getElementById('preApprovedDiffContent').innerHTML = diffHtml;
    new bootstrap.Modal(document.getElementById('preApprovedDiffModal')).show();
}

// ---------------------------------------------------------------------------
// Simple line diff helper
// ---------------------------------------------------------------------------
function lineDiff(before, after) {
    const bLines = before.split('\n').filter(l => l.trim() !== '');
    const aLines = after.split('\n').filter(l => l.trim() !== '');
    const result = [];
    const bSet = new Set(bLines);
    const aSet = new Set(aLines);

    for (const l of bLines) {
        if (!aSet.has(l)) result.push({ type: 'removed', text: l });
    }
    for (const l of aLines) {
        if (!bSet.has(l)) result.push({ type: 'added', text: l });
    }
    for (const l of bLines) {
        if (aSet.has(l)) result.push({ type: 'context', text: l });
    }
    return result;
}

// ---------------------------------------------------------------------------
// HTML escape helper
// ---------------------------------------------------------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Reset the entire workflow
// ---------------------------------------------------------------------------
function resetPreApprovedWorkflow() {
    document.getElementById('preApprovedTicket').value = '';
    const fabricSel = document.getElementById('preApprovedFabric');
    if (fabricSel.options.length > 0) fabricSel.selectedIndex = 0;
    const changeTypeSel = document.getElementById('preApprovedChangeType');
    if (changeTypeSel.options.length > 0) changeTypeSel.selectedIndex = 0;

    const hideIds = [
        'preApprovedTicketSection',
        'preApprovedChangeTypeSection',
        'preApprovedDescSection',
        'preApprovedAccessSection',
        'preApprovedActionsSection',
        'preApprovedPendingWarning'
    ];
    hideIds.forEach(id => document.getElementById(id).classList.add('d-none'));

    const responseEl = document.getElementById('preApprovedResponse');
    responseEl.classList.add('d-none');
    responseEl.innerHTML = '';

    document.getElementById('preApprovedAutoProvision').checked = false;

    if (paDescTable) {
        paDescTable.destroy();
        paDescTable = null;
    }
    if (paAccessTable) {
        paAccessTable.destroy();
        paAccessTable = null;
    }

    // Reset module state
    paOriginalInterfaces = [];
    paActiveChangeType = null;
    paCurrentTicket = '';
    paCurrentChangeset = '';
    paInitialized = false;
}
