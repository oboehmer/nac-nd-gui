'use strict';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let paOriginalInterfaces = [];   // raw data from /api/v1/nac/interfaces
let paBasicTable = null;         // Tabulator instance for basic settings table
let paAccessTable = null;        // Tabulator instance for access mgmt table
let paActiveChangeType = null;   // 'basic-settings' | 'access-mgmt'
let paInitialized = false;       // guard against double-init on nav
let paCurrentTicket = '';        // current ticket number (normalized)
let paCurrentChangeset = '';     // changeset value sent to NaC API (e.g. 'inc0012345-20260614120000')
let paCurrentBranch = '';        // actual git branch created by NaC (e.g. 'nac-inc0012345-20260614120000')

// Pipeline / apply state
let paPipelineMonitors = [];     // array of PipelineMonitor instances (one per submit)
let paChangeWindowStart = null;  // Date: when change window opens
let paChangeWindowInterval = null; // setInterval handle for countdown
let paApplied = false;           // true once Apply to Production succeeds
let paLatestPipelineStatus = null; // latest terminal pipeline status ('success'|'failed'|...)

// ---------------------------------------------------------------------------
// Entry point called from app.js loadPageContent()
// ---------------------------------------------------------------------------
function initPreApprovedWorkflow() {
    // Reload fabrics every time (they may have changed), but only bind events once
    loadPreApprovedFabrics();

    if (paInitialized) {
        // User navigated back — if a ticket was already looked up, reload the table
        // (the table is destroyed when navigating away but ticket state is retained)
        //
        // REVERT NOTE (multi-use-case): replace the direct loadBasicSettingsTable() call
        // below with logic that re-shows preApprovedChangeTypeSection and resets the
        // dropdown to its previous value, then re-fires the appropriate load function.
        if (paCurrentTicket && !paBasicTable) {
            loadBasicSettingsTable();
        }
        return;
    }

    document.getElementById('preApprovedLookupBtn').addEventListener('click', mockTicketLookup);

    document.getElementById('preApprovedMergeBtn').addEventListener('click', handlePreApprovedMerge);
    document.getElementById('preApprovedDiffBtn').addEventListener('click', showPreApprovedDiff);
    document.getElementById('preApprovedResetBtn').addEventListener('click', resetPreApprovedWorkflow);
    document.getElementById('refreshBasicInterfacesBtn').addEventListener('click', loadBasicSettingsTable);
    document.getElementById('refreshAccessInterfacesBtn').addEventListener('click', loadAccessMgmtTable);

    // Event delegation for VLAN inputs rendered inside Tabulator cells.
    //
    // IMPORTANT: use 'change' (fires on blur/enter, after user leaves field) NOT
    // 'input' (fires on every keystroke) for row.update() calls.
    // row.update() causes Tabulator to re-render the cell, which destroys and
    // recreates the <input> element, immediately stealing focus mid-keystroke.
    // On 'input' we only toggle the dirty CSS class without touching Tabulator data.
    // On 'change' we sync the final value into Tabulator and re-evaluate dirty state.

    function _syncVlanInput(target) {
        if (!paAccessTable) return;
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

    // 'input': only update the dirty highlight — no row.update(), no re-render
    document.addEventListener('input', function (e) {
        const target = e.target;
        if (target.classList.contains('pa-access-vlan-input') ||
            target.classList.contains('pa-native-vlan-input') ||
            target.classList.contains('pa-trunk-vlans-input')) {
            if (!paAccessTable) return;
            const rowId = target.getAttribute('data-row-id');
            if (!rowId) return;
            const rows = paAccessTable.getRows();
            for (const row of rows) {
                const data = row.getData();
                if (`${data.name}_${data.switch_hostname}` === rowId) {
                    // Temporarily patch data for dirty check without triggering re-render
                    const orig = row.getData()._originalData;
                    if (orig) row.getElement().classList.toggle('pa-row-dirty', true);
                    break;
                }
            }
        }
    });

    // 'change': sync value into Tabulator and properly evaluate dirty state
    document.addEventListener('change', function (e) {
        const target = e.target;
        if (target.classList.contains('pa-access-vlan-input') ||
            target.classList.contains('pa-native-vlan-input') ||
            target.classList.contains('pa-trunk-vlans-input')) {
            _syncVlanInput(target);
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
        paCurrentBranch = `nac-${sanitizedTicket}-${ts}`;

        // Populate ticket card fields
        document.getElementById('paTicketNumber').textContent = paCurrentTicket;
        document.getElementById('paTicketTitle').textContent = 'Pre-Approved Network Interface Update';
        document.getElementById('paTicketStatus').innerHTML = '<span class="pa-status-approved badge">Approved</span>';
        document.getElementById('paTicketRequestor').textContent = 'John Smith';
        document.getElementById('paTicketScheduled').textContent = '2026-06-15 02:00 UTC';

        // Set change window to open 1 minute from now (demo)
        paChangeWindowStart = new Date(Date.now() + 1 * 60 * 1000);

        // Show scheduled time in ticket card matching the actual change window
        const openTimeStr = paChangeWindowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            + ' (local)';
        document.getElementById('paTicketScheduled').textContent = openTimeStr;

        // Show ticket section — always approved
        document.getElementById('preApprovedTicketSection').classList.remove('d-none');
        document.getElementById('preApprovedPendingWarning').classList.add('d-none');
        document.getElementById('preApprovedTicketCardHeader').className = 'card-header bg-success text-white';

        // REVERT NOTE (multi-use-case): replace the direct loadBasicSettingsTable() call
        // below with:  document.getElementById('preApprovedChangeTypeSection').classList.remove('d-none');
        // and restore the change-type addEventListener block in initPreApprovedWorkflow().
        // The HTML section (id="preApprovedChangeTypeSection") and its dropdown are still
        // intact in index.html — they just stay hidden while only one use case is active.
        loadBasicSettingsTable();

        // Restore spinner
        document.getElementById('preApprovedLookupSpinner').classList.add('d-none');
        document.getElementById('preApprovedLookupIcon').classList.remove('d-none');
        document.getElementById('preApprovedLookupBtn').disabled = false;
    }, 800);
}

// ---------------------------------------------------------------------------
// Section 4a: Basic Interface Settings table
// ---------------------------------------------------------------------------
function loadBasicSettingsTable() {
    document.getElementById('preApprovedBasicSection').classList.remove('d-none');
    document.getElementById('basicInterfacesLoading').classList.remove('d-none');
    document.getElementById('basicInterfacesTable').innerHTML = '';

    if (paBasicTable) {
        paBasicTable.destroy();
        paBasicTable = null;
    }

    fetch('/api/v1/nac/interfaces')
        .then(r => r.json())
        .then(json => {
            if (json.status !== 'success' || !json.data) {
                throw new Error(json.message || 'Failed to load interfaces');
            }
            const rawData = json.data;
            paOriginalInterfaces = rawData;

            // Store original data per row for dirty detection; edit description in-place
            const transformed = rawData.map(row => Object.assign({}, row, {
                _originalData: Object.assign({}, row)
            }));

            const commonConfig = {
                pagination: true,
                paginationSize: 15,
                layout: 'fitColumns',
                variableHeight: true,
                placeholder: 'No interfaces found'
            };

            paBasicTable = new Tabulator('#basicInterfacesTable', Object.assign({}, commonConfig, {
                data: transformed,
                columns: [
                    { title: 'Switch', field: 'switch_hostname', sorter: 'string', minWidth: 150 },
                    { title: 'Interface', field: 'name', sorter: 'string', minWidth: 120 },
                    {
                        title: 'Enabled',
                        field: 'enabled',
                        sorter: 'boolean',
                        width: 90,
                        hozAlign: 'center',
                        formatter: function (cell) {
                            const checked = cell.getValue() ? 'checked' : '';
                            // padding-left:0 + margin-left:0 neutralise Bootstrap's form-check
                            // indent so the toggle sits centred in the cell
                            return `<div class="form-check form-switch mb-0 d-flex justify-content-center" style="padding-left:0">
                                <input class="form-check-input mt-0" type="checkbox" role="switch" style="margin-left:0" ${checked}>
                            </div>`;
                        },
                        cellClick: function (e, cell) {
                            if (e.target.tagName === 'INPUT') {
                                cell.setValue(e.target.checked, true);
                                markBasicRowDirty(cell.getRow());
                            }
                        }
                    },
                    {
                        title: 'Description',
                        field: 'description',
                        widthGrow: 3,
                        minWidth: 300,
                        editor: 'input',
                        editorParams: { elementAttributes: { maxlength: 256 } },
                        formatter: function (cell) {
                            const val = cell.getValue() || '';
                            return `<div style="white-space:normal;word-break:break-word">${escapeHtml(val)}</div>`;
                        },
                        cellEdited: function (cell) { markBasicRowDirty(cell.getRow()); }
                    }
                ],
            }));

            document.getElementById('basicInterfacesLoading').classList.add('d-none');
            document.getElementById('preApprovedActionsSection').classList.remove('d-none');
            paActiveChangeType = 'basic-settings';
        })
        .catch(err => {
            document.getElementById('basicInterfacesLoading').classList.add('d-none');
            document.getElementById('basicInterfacesTable').innerHTML =
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
// Helper: mark a basic settings row dirty if enabled or description changed
// ---------------------------------------------------------------------------
function markBasicRowDirty(row) {
    const data = row.getData();
    const orig = data._originalData;
    if (!orig) return;

    const isDirty =
        String(data.enabled) !== String(orig.enabled) ||
        (data.description || '') !== (orig.description || '');

    row.getElement().classList.toggle('pa-row-dirty', isDirty);
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
    if (paActiveChangeType === 'basic-settings') {
        if (!paBasicTable) return [];
        return paBasicTable.getData().filter(r => {
            const orig = r._originalData;
            if (!orig) return false;
            return String(r.enabled) !== String(orig.enabled) ||
                (r.description || '') !== (orig.description || '');
        });
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

        if (paActiveChangeType === 'basic-settings') {
            switchMap[sw].push({ name: row.name, enabled: row.enabled, description: row.description || '' });
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
    const changeTypeName = paActiveChangeType === 'basic-settings'
        ? 'Basic Interface Settings'
        : 'Access Interface Management';
    const apply_message = `Pre-Approved ${changeTypeName} via ${paCurrentTicket} (${dirtyRows.length} interface(s) changed)`;

    // Disable button + show spinner
    const mergeBtn = document.getElementById('preApprovedMergeBtn');
    mergeBtn.disabled = true;
    mergeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Submitting…';

    responseEl.classList.add('d-none');

    fetch('/api/v1/nac/interfaces/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, changeset, apply_message, apply: false })
    })
        .then(r => r.json())
        .then(json => {
            if (json.status === 'success' || json.status === 'ok') {
                responseEl.className = 'alert alert-success';
                responseEl.innerHTML = `<i class="bi bi-check-circle me-2"></i><strong>Changes submitted!</strong> Branch <code>${escapeHtml(paCurrentBranch)}</code> created/updated — watching for merge pipeline…`;
                responseEl.classList.remove('d-none');

                // Launch a new pipeline monitor card
                _launchPipelineCard(changeset);
            } else {
                throw new Error(json.message || JSON.stringify(json));
            }
        })
        .catch(err => {
            responseEl.className = 'alert alert-danger';
            responseEl.innerHTML = `<i class="bi bi-x-circle me-2"></i><strong>Merge failed:</strong> ${escapeHtml(err.message)}`;
            responseEl.classList.remove('d-none');
        })
        .finally(() => {
            responseEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            mergeBtn.disabled = false;
            mergeBtn.innerHTML = '<i class="bi bi-git me-2"></i>Submit Changes';
        });
}

// ---------------------------------------------------------------------------
// Pipeline monitoring
// ---------------------------------------------------------------------------
function _launchPipelineCard(changeset) {
    const pipelineSection = document.getElementById('preApprovedPipelineSection');
    const pipelineList = document.getElementById('preApprovedPipelineList');

    // Show the section on first submit
    pipelineSection.classList.remove('d-none');
    const branchLabel = document.getElementById('paPipelineBranchLabel');
    if (branchLabel) branchLabel.textContent = paCurrentBranch;

    // Collapse previous (latest) card before adding a new one
    if (paPipelineMonitors.length > 0) {
        paPipelineMonitors[paPipelineMonitors.length - 1].collapse();
    }
    // Stop all previous monitors (they are already done or collapsed)
    paPipelineMonitors.forEach(m => m.stop());

    // sinceId: the pipeline ID found by the previous monitor.
    // The new monitor will only latch onto a pipeline with a strictly higher ID,
    // preventing it from re-using a pipeline created by a previous submit.
    const prevMonitor = paPipelineMonitors.length > 0 ? paPipelineMonitors[paPipelineMonitors.length - 1] : null;
    const sinceId = prevMonitor ? (prevMonitor.foundPipelineId || 0) : 0;

    const cardIndex = paPipelineMonitors.length + 1;
    const cardEl = document.createElement('div');
    cardEl.className = 'pm-card-wrapper mb-2';
    pipelineList.appendChild(cardEl);

    const monitor = new PipelineMonitor(cardEl, paCurrentBranch, {
        label: `Merge Pipeline #${cardIndex}`,
        sinceId,
        onComplete: function (status) {
            paLatestPipelineStatus = status;
            _updateApplyButton();
        }
    });
    paPipelineMonitors.push(monitor);
    monitor.start();

    // Show the apply section and start change window countdown (only on first submit)
    const applySection = document.getElementById('preApprovedApplySection');
    if (applySection.classList.contains('d-none')) {
        applySection.classList.remove('d-none');
        applySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        _startChangeWindowCountdown();
    }
}

// ---------------------------------------------------------------------------
// Refresh pipeline state — fetches all pipelines for the branch and rebuilds
// the pipeline list, re-attaching a live monitor to any still-running pipeline.
// ---------------------------------------------------------------------------
function refreshPipelineState() {
    if (!paCurrentBranch) return;

    const btn = document.getElementById('paRefreshPipelinesBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Refreshing…';
    }

    fetch(`/api/v1/nac/pipelines?changeset=${encodeURIComponent(paCurrentBranch)}`)
        .then(r => r.json())
        .then(json => {
            if (json.status !== 'ok') throw new Error(json.message || 'Unknown error');

            const pipelines = json.pipelines || [];  // newest-first from API

            // Stop all existing monitors
            paPipelineMonitors.forEach(m => m.stop());
            paPipelineMonitors = [];

            const pipelineList = document.getElementById('preApprovedPipelineList');
            pipelineList.innerHTML = '';

            if (pipelines.length === 0) {
                pipelineList.innerHTML = '<div class="text-muted small p-2">No merge pipelines found for this branch.</div>';
                return;
            }

            // Render oldest-first so the list reads top-to-bottom chronologically
            const ordered = [...pipelines].reverse();
            const terminal = ['success', 'failed', 'canceled', 'skipped'];

            ordered.forEach((p, idx) => {
                const isLast = idx === ordered.length - 1;
                const cardEl = document.createElement('div');
                cardEl.className = 'pm-card-wrapper mb-2';
                pipelineList.appendChild(cardEl);

                const label = `Merge Pipeline #${idx + 1}`;

                if (!isLast || terminal.includes(p.status)) {
                    // Historical or already-terminal: render as collapsed summary
                    const badge = PipelineMonitor._statusBadge(p.status);
                    const link = p.web_url
                        ? `<a href="${escapeHtml(p.web_url)}" target="_blank" rel="noopener" class="pm-pipeline-link ms-2"><i class="bi bi-box-arrow-up-right"></i></a>`
                        : '';
                    cardEl.innerHTML = `
                        <div class="pm-card pm-card-collapsed d-flex justify-content-between align-items-center px-3 py-2">
                            <span class="fw-semibold text-muted small">
                                <i class="bi bi-git me-2"></i>${escapeHtml(label)}${link}
                            </span>
                            <span>${badge}</span>
                        </div>`;

                    // Update latest status from the last pipeline in the list
                    if (isLast) {
                        paLatestPipelineStatus = p.status;
                        _updateApplyButton();
                    }
                } else {
                    // Latest pipeline is still running — attach a live monitor
                    // sinceId = previous pipeline's id so it latches onto exactly this one
                    const prevId = idx > 0 ? ordered[idx - 1].id : 0;
                    const monitor = new PipelineMonitor(cardEl, paCurrentBranch, {
                        label,
                        sinceId: prevId,
                        onComplete: function (status) {
                            paLatestPipelineStatus = status;
                            _updateApplyButton();
                        }
                    });
                    paPipelineMonitors.push(monitor);
                    monitor.start();
                }
            });
        })
        .catch(err => {
            const pipelineList = document.getElementById('preApprovedPipelineList');
            pipelineList.innerHTML = `<div class="alert alert-danger py-2 m-2 small">
                <i class="bi bi-exclamation-triangle me-2"></i>Refresh failed: ${escapeHtml(err.message)}
            </div>`;
        })
        .finally(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
            }
        });
}

// ---------------------------------------------------------------------------
// Change window countdown
// ---------------------------------------------------------------------------
function _startChangeWindowCountdown() {
    _updateApplyButton(); // initial render
    if (paChangeWindowInterval) clearInterval(paChangeWindowInterval);
    paChangeWindowInterval = setInterval(_updateApplyButton, 1000);
}

function _updateApplyButton() {
    const countdownEl = document.getElementById('paChangeWindowCountdown');
    const applyBtn = document.getElementById('paApplyToProductionBtn');

    if (!countdownEl || !applyBtn) return;
    if (paApplied) return; // already applied — don't touch

    const now = new Date();
    const windowOpen = paChangeWindowStart && now >= paChangeWindowStart;
    const pipelineOk = paLatestPipelineStatus === 'success';
    const canApply = windowOpen && pipelineOk;

    // Update countdown text
    if (windowOpen) {
        countdownEl.innerHTML = '<span class="badge bg-success"><i class="bi bi-unlock me-1"></i>Change window is open</span>';
    } else if (paChangeWindowStart) {
        const msLeft = paChangeWindowStart - now;
        const minsLeft = Math.floor(msLeft / 60000);
        const secsLeft = Math.floor((msLeft % 60000) / 1000);
        const openTime = paChangeWindowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        countdownEl.innerHTML = `<span class="badge bg-secondary">
            <i class="bi bi-lock me-1"></i>Opens at ${escapeHtml(openTime)} — ${minsLeft}m ${secsLeft}s
        </span>`;
    }

    // Update pipeline gate hint
    const pipelineHintEl = document.getElementById('paApplyPipelineHint');
    if (pipelineHintEl) {
        if (pipelineOk) {
            pipelineHintEl.innerHTML = '<i class="bi bi-check-circle text-success me-1"></i>Latest merge pipeline passed';
        } else if (paLatestPipelineStatus === 'failed') {
            pipelineHintEl.innerHTML = '<i class="bi bi-x-circle text-danger me-1"></i>Latest merge pipeline failed — fix and re-submit';
        } else if (paLatestPipelineStatus) {
            pipelineHintEl.innerHTML = `<i class="bi bi-hourglass-split text-warning me-1"></i>Merge pipeline ${escapeHtml(paLatestPipelineStatus)}`;
        } else {
            pipelineHintEl.innerHTML = '<i class="bi bi-hourglass-split text-warning me-1"></i>Waiting for merge pipeline to complete…';
        }
    }

    if (canApply) {
        applyBtn.disabled = false;
        applyBtn.classList.remove('btn-secondary');
        applyBtn.classList.add('btn-success');
        if (paChangeWindowInterval) {
            clearInterval(paChangeWindowInterval);
            paChangeWindowInterval = null;
        }
    } else {
        applyBtn.disabled = true;
        applyBtn.classList.remove('btn-success');
        applyBtn.classList.add('btn-secondary');
    }
}

// ---------------------------------------------------------------------------
// Apply to Production
// ---------------------------------------------------------------------------
function handleApplyToProduction() {
    if (paApplied) return;

    const applyBtn = document.getElementById('paApplyToProductionBtn');
    const applyResponseEl = document.getElementById('paApplyResponse');
    const changeTypeName = paActiveChangeType === 'basic-settings'
        ? 'Basic Interface Settings'
        : 'Access Interface Management';
    const apply_message = `Pre-Approved ${changeTypeName} via ${paCurrentTicket}`;

    applyBtn.disabled = true;
    applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Applying…';
    applyResponseEl.classList.add('d-none');

    fetch('/api/v1/nac/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeset: paCurrentChangeset, apply_message })
    })
        .then(r => r.json())
        .then(json => {
            if (json.status === 'success') {
                paApplied = true;
                applyBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Applied to Production';
                applyBtn.classList.remove('btn-success');
                applyBtn.classList.add('btn-outline-success');
                applyResponseEl.className = 'alert alert-success d-flex justify-content-between align-items-center mt-3';
                applyResponseEl.innerHTML = `<span><i class="bi bi-check-circle-fill me-2"></i>
                    <strong>Successfully applied!</strong> Branch <code>${escapeHtml(paCurrentBranch)}</code> merged to production.</span>
                    <button class="btn btn-sm btn-outline-success ms-3 text-nowrap" onclick="resetPreApprovedWorkflow()">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>Start New Change
                    </button>`;
                applyResponseEl.classList.remove('d-none');
            } else {
                throw new Error(json.message || JSON.stringify(json));
            }
        })
        .catch(err => {
            applyBtn.disabled = false;
            applyBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Apply to Production';
            applyResponseEl.className = 'alert alert-danger mt-3';
            applyResponseEl.innerHTML = `<i class="bi bi-x-circle me-2"></i><strong>Apply failed:</strong> ${escapeHtml(err.message)}`;
            applyResponseEl.classList.remove('d-none');
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
            if (paActiveChangeType === 'basic-settings') {
                const orig = row._originalData || {};
                beforeObj = {
                    name: orig.name || row.name,
                    enabled: orig.enabled,
                    description: orig.description || ''
                };
                afterObj = {
                    name: row.name,
                    enabled: row.enabled,
                    description: row.description || ''
                };
                // Remove unchanged fields from diff to keep it readable
                if (String(afterObj.enabled) === String(beforeObj.enabled)) {
                    delete beforeObj.enabled;
                    delete afterObj.enabled;
                }
                if (afterObj.description === beforeObj.description) {
                    delete beforeObj.description;
                    delete afterObj.description;
                }
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
// HTML escape helper — defined in pipeline_monitor.js (loaded before this file)
// ---------------------------------------------------------------------------

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
        'preApprovedBasicSection',
        'preApprovedAccessSection',
        'preApprovedActionsSection',
        'preApprovedPendingWarning',
        'preApprovedPipelineSection',
        'preApprovedApplySection',
    ];
    hideIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('d-none');
    });

    const responseEl = document.getElementById('preApprovedResponse');
    responseEl.classList.add('d-none');
    responseEl.innerHTML = '';

    // Stop all pipeline monitors and clear list
    paPipelineMonitors.forEach(m => m.stop());
    paPipelineMonitors = [];
    const pipelineList = document.getElementById('preApprovedPipelineList');
    if (pipelineList) pipelineList.innerHTML = '';

    // Stop change window interval
    if (paChangeWindowInterval) {
        clearInterval(paChangeWindowInterval);
        paChangeWindowInterval = null;
    }

    // Reset apply section
    const applyBtn = document.getElementById('paApplyToProductionBtn');
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.classList.remove('btn-success', 'btn-outline-success');
        applyBtn.classList.add('btn-secondary');
        applyBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Apply to Production';
    }
    const applyResponseEl = document.getElementById('paApplyResponse');
    if (applyResponseEl) {
        applyResponseEl.classList.add('d-none');
        applyResponseEl.innerHTML = '';
    }

    if (paBasicTable) {
        paBasicTable.destroy();
        paBasicTable = null;
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
    paCurrentBranch = '';
    paChangeWindowStart = null;
    paApplied = false;
    paLatestPipelineStatus = null;
    paInitialized = false;
}
