'use strict';

/**
 * escapeHtml — shared HTML escaping utility used by pipeline_monitor and pre_approved.
 * Defined here because pipeline_monitor.js loads before pre_approved.js.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * PipelineMonitor — reusable GitLab CI pipeline visualization widget.
 *
 * Usage:
 *   const monitor = new PipelineMonitor(containerEl, changeset, {
 *     onComplete: (status) => { ... },  // called once on terminal state
 *     label: 'Pipeline #1',             // optional header label
 *   });
 *   monitor.start();
 *   monitor.stop();  // stop polling (e.g. on reset)
 */
class PipelineMonitor {
    /**
     * @param {HTMLElement} containerEl  DOM element to render into
     * @param {string}      changeset    Git branch name
     * @param {object}      options
     * @param {function}    [options.onComplete]  callback(status: string) on terminal state
     * @param {string}      [options.label]       display label for the card header
     */
    constructor(containerEl, changeset, options = {}) {
        this.containerEl = containerEl;
        this.changeset = changeset;
        this.onComplete = options.onComplete || null;
        this.label = options.label || `Pipeline — ${changeset}`;
        this.sinceId = options.sinceId || 0;  // only latch onto pipelines with id > sinceId

        this._intervalId = null;
        this._pollCount = 0;
        this._maxWaitPolls = 6;  // 6 × 5s = 30s max wait for pipeline to appear
        this._done = false;
        this._latestStatus = null;
        this.foundPipelineId = null;  // set once we latch onto a pipeline; readable by caller

        this._render('waiting');
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    start() {
        if (this._done) return;
        this._poll();  // immediate first call
        this._intervalId = setInterval(() => this._poll(), 5000);
    }

    stop() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    /** Collapse this card to a compact summary row (called when a newer pipeline starts). */
    collapse() {
        const status = this._latestStatus || 'unknown';
        const icon = PipelineMonitor._statusIcon(status);
        const badge = PipelineMonitor._statusBadge(status);
        this.containerEl.innerHTML = `
            <div class="pm-card pm-card-collapsed d-flex justify-content-between align-items-center px-3 py-2">
                <span class="fw-semibold text-muted small">
                    <i class="bi bi-git me-2"></i>${escapeHtml(this.label)}
                </span>
                <span>${badge}</span>
            </div>`;
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    _poll() {
        if (this._done) return;
        this._pollCount++;

        fetch(`/api/v1/nac/pipeline-status?changeset=${encodeURIComponent(this.changeset)}&since_id=${this.sinceId}`)
            .then(r => r.json())
            .then(json => {
                if (json.status === 'error') {
                    this._renderError(json.message || 'Unknown error');
                    this.stop();
                    this._done = true;
                    return;
                }

                const pipeline = json.pipeline;

                if (!pipeline) {
                    // No pipeline yet — show skeleton until timeout
                    if (this._pollCount >= this._maxWaitPolls) {
                        this._renderError('No pipeline found after 30 seconds. Is a GitLab CI trigger configured for this branch?');
                        this.stop();
                        this._done = true;
                    }
                    // else keep polling, skeleton already shown
                    return;
                }

                this._latestStatus = pipeline.status;
                this.foundPipelineId = pipeline.id;  // record so caller can pass as sinceId to next monitor
                this._render('live', pipeline);

                if (PipelineMonitor._isTerminal(pipeline.status)) {
                    this.stop();
                    this._done = true;
                    if (this.onComplete) {
                        this.onComplete(pipeline.status);
                    }
                }
            })
            .catch(err => {
                // Network error — don't stop polling, just log; transient failures happen
                console.warn('PipelineMonitor poll error:', err);
            });
    }

    _render(mode, pipeline = null) {
        if (mode === 'waiting') {
            this.containerEl.innerHTML = `
                <div class="pm-card">
                    <div class="pm-card-header">
                        <span><i class="bi bi-git me-2"></i>${escapeHtml(this.label)}</span>
                        <span class="pm-badge pm-badge-waiting">
                            <span class="spinner-border spinner-border-sm me-1" role="status"></span>Waiting for pipeline…
                        </span>
                    </div>
                    <div class="pm-skeleton-body">
                        <div class="pm-skeleton-stage"></div>
                        <div class="pm-skeleton-stage"></div>
                        <div class="pm-skeleton-stage"></div>
                    </div>
                </div>`;
            return;
        }

        if (mode === 'live' && pipeline) {
            const headerBadge = PipelineMonitor._statusBadge(pipeline.status);
            const pipelineLink = pipeline.web_url
                ? `<a href="${escapeHtml(pipeline.web_url)}" target="_blank" rel="noopener" class="pm-pipeline-link ms-2">
                       <i class="bi bi-box-arrow-up-right"></i>
                   </a>`
                : '';

            const stagesHtml = pipeline.stages.map(stage => {
                const stageStatus = PipelineMonitor._stageStatus(stage.jobs);
                const stageIcon = PipelineMonitor._statusIcon(stageStatus);
                const jobsHtml = stage.jobs.map(job => {
                    const jobIcon = PipelineMonitor._statusIcon(job.status);
                    const jobBadge = PipelineMonitor._statusBadge(job.status);
                    const duration = job.duration ? ` <span class="pm-duration">${Math.round(job.duration)}s</span>` : '';
                    const href = job.web_url || '#';
                    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="pm-job pm-job-${escapeHtml(job.status || 'unknown')}" title="${escapeHtml(job.name)}">
                                <span class="pm-job-icon">${jobIcon}</span>
                                <span class="pm-job-name">${escapeHtml(job.name)}</span>
                                ${duration}
                            </a>`;
                }).join('');

                return `<div class="pm-stage">
                            <div class="pm-stage-header">
                                <span class="pm-stage-icon">${stageIcon}</span>
                                <span class="pm-stage-name">${escapeHtml(stage.name)}</span>
                            </div>
                            <div class="pm-stage-jobs">${jobsHtml}</div>
                        </div>`;
            }).join('');

            this.containerEl.innerHTML = `
                <div class="pm-card pm-card-${escapeHtml(pipeline.status || 'unknown')}">
                    <div class="pm-card-header">
                        <span><i class="bi bi-git me-2"></i>${escapeHtml(this.label)}${pipelineLink}</span>
                        ${headerBadge}
                    </div>
                    <div class="pm-stages-row">${stagesHtml || '<span class="text-muted small px-3 py-2 d-inline-block">No stages yet…</span>'}</div>
                </div>`;
            return;
        }
    }

    _renderError(message) {
        this.containerEl.innerHTML = `
            <div class="pm-card pm-card-failed">
                <div class="pm-card-header">
                    <span><i class="bi bi-git me-2"></i>${escapeHtml(this.label)}</span>
                    <span class="pm-badge pm-badge-failed"><i class="bi bi-x-circle me-1"></i>Error</span>
                </div>
                <div class="px-3 py-2">
                    <div class="alert alert-danger py-2 mb-0 small">
                        <i class="bi bi-exclamation-triangle me-2"></i>${escapeHtml(message)}
                    </div>
                </div>
            </div>`;
    }

    // -----------------------------------------------------------------------
    // Static helpers
    // -----------------------------------------------------------------------

    static _isTerminal(status) {
        return ['success', 'failed', 'canceled', 'skipped'].includes(status);
    }

    static _stageStatus(jobs) {
        if (!jobs || jobs.length === 0) return 'unknown';
        if (jobs.some(j => j.status === 'failed')) return 'failed';
        if (jobs.some(j => j.status === 'running')) return 'running';
        if (jobs.some(j => j.status === 'pending')) return 'pending';
        if (jobs.every(j => j.status === 'success')) return 'success';
        if (jobs.some(j => j.status === 'canceled')) return 'canceled';
        return 'unknown';
    }

    static _statusIcon(status) {
        const icons = {
            success:  '<i class="bi bi-check-circle-fill text-success"></i>',
            failed:   '<i class="bi bi-x-circle-fill text-danger"></i>',
            running:  '<span class="spinner-border spinner-border-sm text-info" role="status"></span>',
            pending:  '<i class="bi bi-hourglass-split text-warning"></i>',
            canceled: '<i class="bi bi-slash-circle text-secondary"></i>',
            skipped:  '<i class="bi bi-skip-forward-fill text-secondary"></i>',
            created:  '<i class="bi bi-circle text-secondary"></i>',
            waiting_for_resource: '<i class="bi bi-hourglass text-secondary"></i>',
            unknown:  '<i class="bi bi-question-circle text-secondary"></i>',
        };
        return icons[status] || icons.unknown;
    }

    static _statusBadge(status) {
        const classes = {
            success:  'pm-badge-success',
            failed:   'pm-badge-failed',
            running:  'pm-badge-running',
            pending:  'pm-badge-pending',
            canceled: 'pm-badge-canceled',
            skipped:  'pm-badge-skipped',
            created:  'pm-badge-pending',
        };
        const labels = {
            success:  '<i class="bi bi-check-circle me-1"></i>Passed',
            failed:   '<i class="bi bi-x-circle me-1"></i>Failed',
            running:  '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Running',
            pending:  '<i class="bi bi-hourglass-split me-1"></i>Pending',
            canceled: '<i class="bi bi-slash-circle me-1"></i>Canceled',
            skipped:  '<i class="bi bi-skip-forward me-1"></i>Skipped',
            created:  '<i class="bi bi-circle me-1"></i>Created',
        };
        const cls = classes[status] || 'pm-badge-unknown';
        const label = labels[status] || status || 'Unknown';
        return `<span class="pm-badge ${cls}">${label}</span>`;
    }
}
