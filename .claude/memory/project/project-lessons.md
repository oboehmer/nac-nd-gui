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

### Flask Blueprint Modularization Pattern
**Pattern**: Organize API routes into versioned subdirectories with domain-specific modules
**Implementation**: Created api/v1/ directory structure with domain modules (tables.py: 8.4KB, admin.py: 5.5KB, nexus.py: 10.8KB)
**Project Context**: Migrated from monolithic app.py to modular blueprint architecture; registered via api_v1 blueprint
**Results**: Improved code organization, separation of concerns, and maintainability for API endpoints
**Added**: [2025-10-22T22:54:30Z]
**Additional Details**: Blueprint registration in main app.py using `from api.v1 import api_v1` and `app.register_blueprint(api_v1)`. Each domain module (tables, admin, nexus) handles related endpoints independently.

### Iterative Frontend Refinement Development Pattern
**Pattern**: Apply incremental JavaScript improvements through multiple small, focused edits
**Implementation**: 14 successive edits to static/js/app.js for gradual enhancement
**Project Context**: Frontend development workflow for app.js refinement
**Results**: Controlled, testable improvements with clear change history; reduces risk of breaking changes
**Added**: [2025-10-22T22:54:30Z]
**Additional Details**: Each edit represents a single logical improvement, making debugging and code review easier. Pattern particularly effective for complex frontend logic requiring iterative testing.
