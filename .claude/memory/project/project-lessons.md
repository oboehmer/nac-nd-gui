# Project-Specific Lessons Learned

<!-- Document insights and patterns specific to this project -->
<!-- Note: Core Flask/web patterns promoted to global memory (~/.claude/memory/lessons-learned.md) -->

## Project Architecture Overview

**Flask Application Stack**: Flask 3.0.3 + Bootstrap 5.3.3 + Tabulator + Swagger/Flasgger
**Integration**: Nexus Dashboard API client with header-based authentication
**Frontend**: Hierarchical sidebar navigation with collapsible sections
**Documentation**: Interactive API documentation via /swagger/ endpoint

See global memory for universal Flask patterns (REST API, Bootstrap CDN, Fetch API, Environment Configuration)

## Project-Specific Development Patterns

### Table Library Migration
**Implementation**: Expanded mock data (4→20, 3→8, 3→12, 4→27 entries); added setTimeout timing fix
**Project Context**: Migration from DataTables to Tabulator for better Bootstrap 5 integration
**See Global**: DOM Initialization Timing, API Development Testing, Tabulator Response Transformation patterns

### Project Memory Optimization Results
**Session Achievements**: 511+ log entries processed; 22 patterns promoted to global memory; 74.5% current-session reduction (19.6K→5.0K); 53.3% project-lessons reduction
**Workflow**: Sequential au-update→au-promotion; automated pattern extraction; cross-tier promotion
**Impact**: Validated memory system self-processing capability; demonstrated robust automated workflow
**Added**: [2025-10-22T20:15:00Z]

### Nexus Dashboard API Client Implementation
**Authentication**: Header-based (X-Nd-Username, X-Nd-Apikey) - no token expiration handling needed
**Response Handling**: Polymorphic isinstance() checking for list/dict/other response types
**Configuration**: YAML-driven with singleton factory pattern
**Project Context**: nexus_dashboard_client.py with get_client() factory
**See Global**: API Client with Configuration Management, Polymorphic API Response Handling patterns

### Configuration Management Implementation
**Full-Stack Field Addition**: HTML (id/name) → Flask API (save/load/empty) → JS (capture/submit) → YAML storage
**Testing**: Test configs for validation scenarios (config_test_no_fabric.yaml, config_test_wrong_fabric.yaml)
**Project Context**: 3 Flask app.py update locations; fabric_name field example with nexusFabricName HTML id
**See Global**: Full-Stack Configuration Field Addition, Configuration Testing patterns

### API Documentation
**Implementation**: Swagger/Flasgger with OpenAPI 2.0; 4 tag groups (General, Tables, Admin, Nexus Dashboard)
**Endpoints**: /swagger/ (interactive UI), /apispec.json (programmatic access)
**Project Context**: Automatic Flask route discovery; no manual docstring formatting
**See Global**: Swagger/Flasgger API Documentation Pattern

### Flask Blueprint Modularization
**Implementation**: Created api/v1/ structure with domain modules (tables.py: 8.4KB, admin.py: 5.5KB, nexus.py: 10.8KB)
**Project Context**: Migrated from monolithic app.py to modular blueprint architecture
**See Global**: Flask Blueprint Modularization Pattern

### Iterative Frontend Refinement
**Implementation**: 14 successive edits to static/js/app.js for gradual enhancement
**Project Context**: Applied to app.js refinement with controlled testing
**See Global**: Iterative Frontend Refinement Pattern

### Memory Archival Workflow
**Pattern**: Systematic capacity management through monitoring → identification → archival → validation
**Implementation**: Monitor file sizes (wc -c); identify archival candidates (age, specificity, reuse); create dated archive structure (YYYY-QQ); archive with context; update source with references; re-measure and validate
**Results**: Reduced global lessons-learned.md from 91.5%→76.9% capacity by archiving 8 Terraform patterns (1,192 bytes / 15.9%)
**Context**: Applied when any memory file exceeds 85% capacity threshold
**Added**: [2025-10-30T15:30:00Z]
**Additional Details**: Created ~/.claude/memory/archive/2025-Q3/terraform-infrastructure-patterns.md with full pattern content preserved for searchability while reducing active memory footprint

### API Connection Testing Implementation
**Implementation**: Configuration-driven connection test endpoints with comprehensive error handling
**Project Context**: /test-nac-connection (Bearer auth), /test-nd-connection (header auth), /test-nac-api-connection (multi-provider SCM auth) endpoints in admin.py
**Specifics**: Tests NaC API, Nexus Dashboard API, and SCM API (GitHub/GitLab/Bitbucket/Azure DevOps) connectivity
**See Global**: API Connection Test Endpoint Pattern (promoted 2025-10-23)
**Added**: [2025-10-23T16:15:00Z]
**Updated**: [2025-10-23T16:22:00Z]

### NaC API Client Implementation
**Authentication**: Passthrough token + x-git-config header (api_url, repository, data_sources, type)
**Configuration**: YAML-driven with _load_config() + _ensure_config() validation
**Client Pattern**: Singleton factory (get_nac_client()) with session reuse
**Project Context**: nac_api.py with NacApiClient class; integrated with admin.py
**Methods**: RESTful (get/post/put/delete) + convenience (read_data_model, test_connection)
**Error Handling**: Configuration validation, 30s timeout, ConnectionError/RequestException logging
**SCM Support**: GitHub, GitLab, Bitbucket (cloud/local), Azure DevOps via provider-specific header construction
**See Global**: API Client with Configuration Management Pattern
**Added**: [2025-10-23T17:30:00Z]

### Python Package Modernization
**Pattern**: Migration from flat structure to src/ layout with modern packaging standards
**Implementation**: Created pyproject.toml (PEP 517/518); migrated to src/nac_nd_gui/ package; adopted uv package manager; removed legacy requirements.txt; added tool configurations (black, ruff, mypy, pytest)
**Project Context**: Refactored flat Flask app to proper package structure with __init__.py exports, relative imports, and CLI entry point
**Results**: Modern, installable Python package; improved dependency management; better IDE support; standardized tooling configuration
**See Global**: Modern Python Package Structure Pattern (promoted 2025-10-30)
**Added**: [2025-10-30T18:55:00Z]
**Additional Details**:
- Package structure: src/nac_nd_gui/ with api/, static/, templates/ subdirectories
- Entry point: nac-nd-gui CLI command via project.scripts in pyproject.toml
- Import updates: .api.v1 relative imports, main() function for entry point
- Version control: Updated .gitignore for .venv/, uv.lock, .python-version.lock

### SVG Logo and Banner Integration
**Pattern**: Incremental SVG asset integration with semantic CSS classes and comprehensive documentation
**Implementation**: Created custom SVG assets (nac-logo.svg, nac-banner.svg, nac-icon.svg); integrated Cisco branding; applied semantic CSS classes (nac-banner-nav, nac-banner-wrapper); tested with uv run python; documented in LOGO-INTEGRATION.md
**Project Context**: Flask template (index.html) with Bootstrap 5 navbar; sidebar with Cisco logo; main landing page with NaC logo; favicon integration
**Results**: Professional branding throughout application; scalable SVG assets for all screen sizes; maintainable with semantic CSS naming; documented integration process
**Added**: [2025-10-30T19:58:00Z]
**Additional Details**:
- SVG assets: nac-logo.svg (main landing), nac-banner.svg (top nav), nac-icon.svg (favicon)
- Cisco branding: Cisco_Logo_no_TM_White-RGB_264px.png (sidebar header)
- Semantic CSS: .nac-banner-nav, .nac-banner-wrapper for consistent styling
- Testing: Integration verified with Flask app load test
- Documentation: LOGO-INTEGRATION.md tracks all asset specifications and implementation status

### Dual Configuration Method Documentation
**Pattern**: Document complex integrations with both GUI and manual configuration methods, plus architecture diagrams and field-level descriptions
**Implementation**: README sections with Option A (Web Admin Panel - step-by-step GUI instructions) and Option B (Manual File Editing - complete YAML examples with field description tables); architecture diagrams showing data flow; example workflows
**Project Context**: API integration configuration (NaC API + Nexus Dashboard); 10 configuration fields with descriptions, examples, and validation requirements
**Results**: Users can choose configuration method that fits their workflow; field-level table provides quick reference; architecture diagram clarifies system components; comprehensive coverage reduces support questions
**Added**: [2025-10-30T20:08:00Z]
**Additional Details**:
- Configuration methods: Web admin panel (recommended for beginners) vs manual YAML editing (preferred by automation/power users)
- Field descriptions: Markdown table with Field | Description | Example columns for all 10 configuration parameters
- Architecture diagram: ASCII art showing NaC ND GUI → NaC API → SCM (GitHub) with bidirectional data flow
- Workflow example: 6-step user workflow from GUI form to Git repository commit
- Benefits section: GitOps, version control, validation, automation, multi-provider support (5 key benefits explained)
