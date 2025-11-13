# Project-Specific Lessons Learned

<!-- Document insights and patterns specific to this project -->
<!-- Note: Core Flask/web patterns promoted to global memory (~/.claude/memory/lessons-learned.md) -->

**Archive Notes**:
- SVG Logo Integration pattern → `.claude/memory/archive/2025-Q4/documentation-patterns.md` (2025-10-30)
- Dual Configuration Documentation (detailed) → `.claude/memory/archive/2025-Q4/documentation-patterns.md` (2025-10-30)
- Dual Configuration Documentation (universal pattern) → Global lessons-learned.md (2025-10-30)

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

### Multi-API Client Architecture
**Pattern**: Three YAML-driven API clients with unified configuration, authentication, and error handling patterns
**Implementations**:
- **Nexus Dashboard** (nexus_dashboard_client.py): Header auth (X-Nd-Username/X-Nd-Apikey); singleton factory; polymorphic response handling
- **NaC API** (nac_api.py): Bearer token + SCM header (GitHub/GitLab/Bitbucket/Azure); singleton factory; RESTful methods + generic operation pattern
- **NetBox IPAM** (netbox_api.py): Token auth; requests.Session; full CRUD + bulk IPAM operations (prefixes, IPs, VLANs, sites, devices)
**Common Patterns**: YAML config with _load_config() + _ensure_config(); connection test endpoints; 30s timeouts; comprehensive error handling
**See Global**: API Client with Configuration Management, Full-Stack Configuration patterns

### Configuration & Documentation Patterns
**Full-Stack Config**: HTML→Flask API (save/load/empty)→JS→YAML; test configs for validation
**API Docs**: Swagger/Flasgger OpenAPI 2.0; /swagger/ UI + /apispec.json; 4 tag groups
**Blueprint Architecture**: api/v1/ modular structure (tables.py, admin.py, nexus.py)
**Iterative Refinement**: 14 successive edits for gradual enhancement with controlled testing
**See Global**: Full-Stack Configuration, Swagger/Flasgger, Flask Blueprint, Iterative Frontend patterns

### Memory Archival Workflow
**Pattern**: Monitor (wc -c) → identify candidates (age, specificity) → create dated archive (YYYY-QQ) → update refs → validate
**Results**: 91.5%→76.9% reduction by archiving 8 Terraform patterns (1,192 bytes / 15.9%)
**Context**: Applied when files exceed 85% capacity
**Added**: [2025-10-30T15:30:00Z]

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

### Branding and Documentation Patterns (ARCHIVED)
**SVG Logo Integration**: Archived to `.claude/memory/archive/2025-Q4/documentation-patterns.md` (project-specific branding implementation)
**Dual Configuration Documentation**: Universal pattern promoted to global lessons-learned.md; detailed implementation archived to `.claude/memory/archive/2025-Q4/documentation-patterns.md`
