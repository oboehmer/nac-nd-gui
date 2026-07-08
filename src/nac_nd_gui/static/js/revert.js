'use strict';

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let rvInitialized = false;
let rvCurrentTicket = '';
let rvCurrentBranch = '';
let rvCurrentMrIid = null;
let rvCurrentPage = 1;
let rvSelectedSha = null;
let rvSelectedTitle = null;
let rvPipelineMonitor = null;
let rvLatestPipelineStatus = null;
let rvRevertInProgress = false;  // locks commit selection after revert is triggered

// ---------------------------------------------------------------------------
// Entry point called from app.js loadPageContent()
// ---------------------------------------------------------------------------
function initRevertWorkflow() {
    if (rvInitialized) {
        return;
    }

    document.getElementById('revertLookupBtn').addEventListener('click', rvMockTicketLookup);
    document.getElementById('rvApplyBtn').addEventListener('click', rvHandleApply);
    document.getElementById('revertCommitList').addEventListener('click', (event) => {
        const commitRow = event.target.closest('.rv-commit-row');
        if (commitRow) {
            rvToggleCommitRow(commitRow);
        }
    });
    document.getElementById('rvPrevPageBtn').addEventListener('click', () => {
        if (rvCurrentPage > 1) {
            rvCurrentPage--;
            rvLoadCommits(rvCurrentPage);
        }
    });
    document.getElementById('rvNextPageBtn').addEventListener('click', () => {
        rvCurrentPage++;
        rvLoadCommits(rvCurrentPage);
    });

    rvInitialized = true;
}

// ---------------------------------------------------------------------------
// Mock ServiceNow ticket lookup
// ---------------------------------------------------------------------------
function rvMockTicketLookup() {
    const ticketInput = document.getElementById('revertTicket');
    const ticket = ticketInput.value.trim();

    if (!ticket) {
        ticketInput.classList.add('is-invalid');
        setTimeout(() => ticketInput.classList.remove('is-invalid'), 2000);
        return;
    }

    const lookupBtn = document.getElementById('revertLookupBtn');
    const spinner = document.getElementById('revertLookupSpinner');
    const icon = document.getElementById('revertLookupIcon');

    lookupBtn.disabled = true;
    spinner.classList.remove('d-none');
    icon.classList.add('d-none');

    // Simulate API call
    setTimeout(() => {
        lookupBtn.disabled = false;
        spinner.classList.add('d-none');
        icon.classList.remove('d-none');

        // Mock response
        const mockResponse = {
            ticket: ticket,
            title: 'Emergency Revert - Pre-Approved',
            status: 'Approved',
            requestor: 'John Smith'
        };

        // Store ticket and build branch name
        rvCurrentTicket = ticket;
        const sanitizedTicket = ticket.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        rvCurrentBranch = `nac-revert-${sanitizedTicket}-${timestamp}`;

        // Update UI
        document.getElementById('rvTicketNumber').textContent = mockResponse.ticket;
        document.getElementById('rvTicketTitle').textContent = mockResponse.title;
        document.getElementById('rvTicketStatus').textContent = mockResponse.status;
        document.getElementById('rvTicketRequestor').textContent = mockResponse.requestor;

        // Show ticket section
        document.getElementById('revertTicketSection').classList.remove('d-none');

        // Load commits
        rvCurrentPage = 1;
        rvLoadCommits(rvCurrentPage);
    }, 800);
}

// ---------------------------------------------------------------------------
// Load commits from API
// ---------------------------------------------------------------------------
function rvLoadCommits(page) {
    const commitSection = document.getElementById('revertCommitSection');
    const commitList = document.getElementById('revertCommitList');

    rvClearInlineDiffState();
    commitList.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div></div>';
    commitSection.classList.remove('d-none');

    fetch(`/api/v1/nac/commits?page=${page}&per_page=15`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                commitList.innerHTML = `<div class="alert alert-danger m-3">${escapeHtml(data.error)}</div>`;
                return;
            }

            const commits = data.commits || [];
            const totalPages = data.total_pages || 1;

            if (commits.length === 0) {
                commitList.innerHTML = '<div class="alert alert-info m-3">No commits found</div>';
                return;
            }

            // Render commit table
            let html = '<table class="table table-hover table-sm mb-0">';
            html += '<thead><tr>';
            html += '<th style="width: 100px;">Commit</th>';
            html += '<th>Title</th>';
            html += '<th style="width: 150px;">Author</th>';
            html += '<th style="width: 100px;">Date</th>';
            html += '</tr></thead>';
            html += '<tbody>';

            commits.forEach(commit => {
                const shortId = commit.short_id || commit.id.substring(0, 8);
                const title = commit.title.length > 80 ? commit.title.substring(0, 77) + '...' : commit.title;
                const authorName = commit.author_name || 'Unknown';
                const relativeDate = formatRelativeDate(commit.created_at);

                html += `<tr class="rv-commit-row" data-sha="${escapeHtml(commit.id)}" data-title="${escapeHtml(commit.title)}" style="cursor: pointer;">`;
                html += `<td class="font-monospace small">${escapeHtml(shortId)}</td>`;
                html += `<td>${escapeHtml(title)}</td>`;
                html += `<td class="text-muted small">${escapeHtml(authorName)}</td>`;
                html += `<td class="text-muted small text-nowrap">${escapeHtml(relativeDate)}</td>`;
                html += '</tr>';
            });

            html += '</tbody></table>';
            commitList.innerHTML = html;

            // Update pagination — don't show total (unreliable), just show page number
            document.getElementById('rvPageInfo').textContent = `Page ${page}`;
            document.getElementById('rvPrevPageBtn').disabled = (page === 1);
            const hasNextPage = data.has_next_page !== undefined ? data.has_next_page : (page < totalPages);
            document.getElementById('rvNextPageBtn').disabled = !hasNextPage;
        })
        .catch(error => {
            commitList.innerHTML = `<div class="alert alert-danger m-3">Error loading commits: ${escapeHtml(error.message)}</div>`;
            console.error('Error loading commits:', error);
        });
}

function rvToggleCommitRow(row) {
    // Block selection if a revert is already in progress
    if (rvRevertInProgress) return;

    const sha = row.getAttribute('data-sha');
    const isAlreadyExpanded = row.classList.contains('table-active') && !!row.nextElementSibling && row.nextElementSibling.classList.contains('rv-diff-row');

    if (isAlreadyExpanded && rvSelectedSha === sha) {
        rvCollapseInlineDiff();
        rvSelectedSha = null;
        rvSelectedTitle = null;
        return;
    }

    rvCollapseInlineDiff();
    rvSelectedSha = sha;
    rvSelectedTitle = row.getAttribute('data-title') || sha.substring(0, 8);
    row.classList.add('table-active');

    const expandedRow = document.createElement('tr');
    expandedRow.className = 'rv-diff-row';
    expandedRow.innerHTML = `
        <td colspan="4" class="p-0 border-0">
            <div class="p-3 border-top">
                <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
                    <div>
                        <div class="fw-semibold">${escapeHtml(rvSelectedTitle)}</div>
                        <div class="font-monospace small text-muted">${escapeHtml(sha.substring(0, 8))}</div>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm align-self-start rv-revert-btn" onclick="rvHandleRevert()">
                        <i class="bi bi-arrow-counterclockwise me-2"></i>Revert this Commit
                    </button>
                </div>
                <div id="revertDiffContent"><div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div></div></div>
                <div id="rvBottomRevertBtnContainer" class="d-none d-flex justify-content-end mt-2"></div>
                <div id="rvRevertResponse" class="alert d-none mt-3 mb-0"></div>
            </div>
        </td>
    `;

    row.insertAdjacentElement('afterend', expandedRow);
    rvLoadDiff(sha);
}

function rvCollapseInlineDiff() {
    document.querySelectorAll('.rv-commit-row.table-active').forEach(row => row.classList.remove('table-active'));
    document.querySelectorAll('.rv-diff-row').forEach(row => row.remove());
}

function rvClearInlineDiffState() {
    rvCollapseInlineDiff();
    rvSelectedSha = null;
    rvSelectedTitle = null;
}

// ---------------------------------------------------------------------------
// Load diff for selected commit
// ---------------------------------------------------------------------------
function rvLoadDiff(sha) {
    const diffContent = document.getElementById('revertDiffContent');

    if (!diffContent) {
        return;
    }

    diffContent.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div></div>';

    fetch(`/api/v1/nac/commits/${sha}/diff`)
        .then(response => response.json())
        .then(data => {
            if (rvSelectedSha !== sha) {
                return;
            }

            const activeDiffContent = document.getElementById('revertDiffContent');
            if (!activeDiffContent) {
                return;
            }

            if (data.error) {
                activeDiffContent.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(data.error)}</div>`;
                return;
            }

            const diffs = data.diffs || [];
            if (diffs.length === 0) {
                activeDiffContent.innerHTML = '<div class="alert alert-info mb-0">No changes in this commit</div>';
                return;
            }

            // Render diff — use a simple div container (not <pre> to avoid
            // whitespace rendering issues). Each line is a div for zero extra spacing.
            let html = '<div style="font-family: SFMono-Regular, Consolas, monospace; font-size: 0.75rem; line-height: 1.35; overflow-x: auto; color: #e6edf3;">';
            diffs.forEach(diff => {
                html += `<div style="padding: 0 6px; color: #8b949e;">--- a/${escapeHtml(diff.old_path)}</div>`;
                html += `<div style="padding: 0 6px; color: #8b949e;">+++ b/${escapeHtml(diff.new_path)}</div>`;

                const diffLines = diff.diff.split('\n');
                diffLines.forEach(line => {
                    if (!line && line !== '0') return; // skip empty trailing lines
                    let style = 'padding: 0 6px; white-space: pre;';
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                        style += ' background-color: rgba(46, 160, 67, 0.25); color: #7ee787;';
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                        style += ' background-color: rgba(248, 81, 73, 0.25); color: #ffa198;';
                    } else if (line.startsWith('@@')) {
                        style += ' color: #79c0ff; font-weight: 600;';
                    }
                    html += `<div style="${style}">${escapeHtml(line)}</div>`;
                });
            });
            html += '</div>';

            activeDiffContent.innerHTML = html;

            // Show bottom Revert button if diff is long enough to scroll
            const bottomBtnContainer = document.getElementById('rvBottomRevertBtnContainer');
            if (bottomBtnContainer && activeDiffContent.scrollHeight > 300) {
                bottomBtnContainer.classList.remove('d-none');
                bottomBtnContainer.innerHTML = `
                    <button type="button" class="btn btn-danger btn-sm rv-revert-btn" onclick="rvHandleRevert()">
                        <i class="bi bi-arrow-counterclockwise me-2"></i>Revert this Commit
                    </button>`;
            }
        })
        .catch(error => {
            if (rvSelectedSha !== sha) {
                return;
            }

            const activeDiffContent = document.getElementById('revertDiffContent');
            if (!activeDiffContent) {
                return;
            }

            activeDiffContent.innerHTML = `<div class="alert alert-danger mb-0">Error loading diff: ${escapeHtml(error.message)}</div>`;
            console.error('Error loading diff:', error);
        });
}

// ---------------------------------------------------------------------------
// Handle revert action
// ---------------------------------------------------------------------------
function rvHandleRevert() {
    if (!rvSelectedSha) {
        alert('Please select a commit to revert');
        return;
    }

    // Confirmation dialog
    const shortSha = rvSelectedSha.substring(0, 8);
    const confirmed = confirm(
        `You are about to revert:\n\n` +
        `  "${rvSelectedTitle}"\n` +
        `  (${shortSha})\n\n` +
        `This will create a merge request to main.\n` +
        `Ticket: ${rvCurrentTicket}\n\n` +
        `Continue?`
    );
    if (!confirmed) return;

    // Lock — prevent selecting other commits
    rvRevertInProgress = true;

    // Disable all revert buttons (top and bottom)
    document.querySelectorAll('.rv-revert-btn').forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Reverting...';
    });
    const responseDiv = document.getElementById('rvRevertResponse');
    if (responseDiv) responseDiv.classList.add('d-none');

    const payload = {
        sha: rvSelectedSha,
        ticket: rvCurrentTicket,
        branch: rvCurrentBranch
    };

    fetch('/api/v1/nac/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // Unlock on error — user can try another commit
                rvRevertInProgress = false;
                document.querySelectorAll('.rv-revert-btn').forEach(btn => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-2"></i>Revert this Commit';
                });
                const responseDiv = document.getElementById('rvRevertResponse');
                // Check for conflict
                if (data.conflict) {
                    if (responseDiv) {
                        responseDiv.className = 'alert alert-warning mt-3';
                        responseDiv.innerHTML = `<strong>Conflict detected:</strong> ${escapeHtml(data.error)}<br>` +
                            `<small>This commit cannot be automatically reverted. Manual intervention required.</small>`;
                        responseDiv.classList.remove('d-none');
                    }
                } else {
                    if (responseDiv) {
                        responseDiv.className = 'alert alert-danger mt-3';
                        responseDiv.innerHTML = `<strong>Error:</strong> ${escapeHtml(data.error)}`;
                        responseDiv.classList.remove('d-none');
                    }
                }
                return;
            }

            // Success — collapse diff but keep commit row highlighted
            // Remove the expanded diff row
            document.querySelectorAll('.rv-diff-row').forEach(row => row.remove());

            // Store MR IID
            rvCurrentMrIid = data.mr_iid;

            // Show pipeline section with revert description
            const pipelineSection = document.getElementById('revertPipelineSection');
            const applySection = document.getElementById('revertApplySection');
            const shortSha = rvSelectedSha ? rvSelectedSha.substring(0, 8) : '';
            const revertDesc = `Reverting "${rvSelectedTitle}" (${shortSha})`;

            // Update pipeline card header with the revert description
            const pipelineHeader = pipelineSection.querySelector('.card-header h5');
            if (pipelineHeader) {
                pipelineHeader.innerHTML = `<i class="bi bi-diagram-3 me-2"></i>${escapeHtml(revertDesc)}`;
            }

            pipelineSection.classList.remove('d-none');
            applySection.classList.remove('d-none');
            rvStartPipelineMonitor(data.branch);

            // Scroll to pipeline section
            pipelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(error => {
            // Unlock on error
            rvRevertInProgress = false;
            document.querySelectorAll('.rv-revert-btn').forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-2"></i>Revert this Commit';
            });
            const responseDiv = document.getElementById('rvRevertResponse');
            if (responseDiv) {
                responseDiv.className = 'alert alert-danger mt-3';
                responseDiv.innerHTML = `<strong>Error:</strong> ${escapeHtml(error.message)}`;
                responseDiv.classList.remove('d-none');
            }
            console.error('Error reverting commit:', error);
        });
}

// ---------------------------------------------------------------------------
// Start pipeline monitor
// ---------------------------------------------------------------------------
function rvStartPipelineMonitor(branch) {
    const container = document.getElementById('revertPipelineList');
    rvPipelineMonitor = new PipelineMonitor(container, branch, {
        label: `Revert Pipeline — ${branch}`,
        onComplete: (status) => {
            rvLatestPipelineStatus = status;
            rvUpdateApplyGate();
        }
    });
    rvPipelineMonitor.start();
}

// ---------------------------------------------------------------------------
// Update Apply button state based on pipeline status
// ---------------------------------------------------------------------------
function rvUpdateApplyGate() {
    const applyBtn = document.getElementById('rvApplyBtn');
    if (rvLatestPipelineStatus === 'success') {
        applyBtn.disabled = false;
        applyBtn.className = 'btn btn-warning btn-lg';
    } else {
        applyBtn.disabled = true;
        applyBtn.className = 'btn btn-secondary btn-lg';
    }
}

// ---------------------------------------------------------------------------
// Handle Apply to Production
// ---------------------------------------------------------------------------
function rvHandleApply() {
    if (!rvCurrentMrIid) {
        alert('No merge request to apply');
        return;
    }

    const applyBtn = document.getElementById('rvApplyBtn');
    const responseDiv = document.getElementById('rvApplyResponse');

    applyBtn.disabled = true;
    applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Applying...';
    responseDiv.classList.add('d-none');

    const payload = {
        mr_iid: rvCurrentMrIid
    };

    fetch('/api/v1/nac/revert/merge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                applyBtn.disabled = false;
                applyBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Apply to Production';
                responseDiv.className = 'alert alert-danger mt-3';
                responseDiv.innerHTML = `<strong>Error:</strong> ${escapeHtml(data.error)}`;
                responseDiv.classList.remove('d-none');
                return;
            }

            // Success — replace the entire apply section with a summary card
            const applySection = document.getElementById('revertApplySection');
            const shortSha = rvSelectedSha ? rvSelectedSha.substring(0, 8) : '';
            const mrUrl = data.merge_commit_sha ? '' : ''; // GitLab MR URL not returned here
            const timestamp = new Date().toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
            });

            applySection.innerHTML = `
                <div class="card shadow-sm mb-4 border-success border-2">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0"><i class="bi bi-check-circle me-2"></i>Revert Applied Successfully</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-3">
                            <div class="col-md-3">
                                <small class="text-muted d-block">Ticket</small>
                                <strong>${escapeHtml(rvCurrentTicket)}</strong>
                            </div>
                            <div class="col-md-5">
                                <small class="text-muted d-block">Reverted</small>
                                <span>${escapeHtml(rvSelectedTitle || '')} <code class="small">(${escapeHtml(shortSha)})</code></span>
                            </div>
                            <div class="col-md-2">
                                <small class="text-muted d-block">MR</small>
                                <span>#${rvCurrentMrIid}</span>
                            </div>
                            <div class="col-md-2">
                                <small class="text-muted d-block">Operator</small>
                                <span>oboehmer</span>
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-3">
                                <small class="text-muted d-block">Applied</small>
                                <span class="small">${escapeHtml(timestamp)}</span>
                            </div>
                            <div class="col-md-5">
                                <small class="text-muted d-block">Branch</small>
                                <code class="small">${escapeHtml(rvCurrentBranch)}</code>
                            </div>
                        </div>
                        <hr>
                        <button type="button" class="btn btn-outline-secondary" onclick="resetRevertWorkflow()">
                            <i class="bi bi-arrow-counterclockwise me-2"></i>Start New Revert
                        </button>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            applyBtn.disabled = false;
            applyBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Apply to Production';
            responseDiv.className = 'alert alert-danger mt-3';
            responseDiv.innerHTML = `<strong>Error:</strong> ${escapeHtml(error.message)}`;
            responseDiv.classList.remove('d-none');
            console.error('Error applying revert:', error);
        });
}

// ---------------------------------------------------------------------------
// Reset workflow
// ---------------------------------------------------------------------------
function resetRevertWorkflow() {
    // Stop pipeline monitor if running
    if (rvPipelineMonitor) {
        rvPipelineMonitor.stop();
        rvPipelineMonitor = null;
    }

    // Hide all sections except section 1
    document.getElementById('revertTicketSection').classList.add('d-none');
    document.getElementById('revertCommitSection').classList.add('d-none');
    document.getElementById('revertPipelineSection').classList.add('d-none');
    document.getElementById('revertApplySection').classList.add('d-none');

    // Clear state
    rvCurrentTicket = '';
    rvCurrentBranch = '';
    rvCurrentMrIid = null;
    rvCurrentPage = 1;
    rvSelectedSha = null;
    rvSelectedTitle = null;
    rvLatestPipelineStatus = null;
    rvRevertInProgress = false;
    rvClearInlineDiffState();

    // Clear inputs
    document.getElementById('revertTicket').value = '';

    // Clear response divs
    document.getElementById('rvApplyResponse').classList.add('d-none');

    // Remove any dynamically added "Start New Revert" buttons
    document.querySelectorAll('#revertApplySection .btn-outline-secondary').forEach(b => b.remove());
}

// ---------------------------------------------------------------------------
// Utility: Format relative date
// ---------------------------------------------------------------------------
function formatRelativeDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    // Fallback to date string
    return date.toLocaleDateString();
}
