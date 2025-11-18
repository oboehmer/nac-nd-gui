# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NaC ND GUI** is a modern network management web application built with Flask and Bootstrap for Cisco Systems. It provides a unified frontend interface for managing network configurations through three main backend integrations:

- **NaC API** (Network as Code) - GitOps workflow for network configurations via GitHub/GitLab/Bitbucket
- **Cisco Nexus Dashboard** - Direct fabric and VRF management
- **NetBox IPAM** - IP Address Management and network inventory

## Technology Stack

- **Backend**: Flask 3.0.3 with Python 3.11+ using UV package manager
- **Frontend**: Bootstrap 5.3.3, Bootstrap Icons, Tabulator tables, modern JavaScript
- **API Documentation**: Swagger/Flasgger at `/swagger/`
- **Configuration**: YAML-based config with web admin panel
- **Development**: pytest, black, ruff, mypy for testing and code quality

## Development Commands

```bash
# Project setup
uv sync                     # Install all dependencies and create venv

# Running the application
uv run nac-nd-gui          # Start Flask app on localhost:9999
uv run python -m nac_nd_gui.app  # Alternative startup method

# Development tools
uv run pytest             # Run tests (pytest with coverage)
uv run black src/          # Format code (line length 100)
uv run ruff check src/     # Lint code (E, F, I, N, W, B, C90 rules)
uv run mypy src/           # Type checking (lenient config)

# Dependency management
uv add package-name        # Add runtime dependency
uv add --dev package-name  # Add development dependency
uv remove package-name     # Remove dependency

# Production build
uv build                   # Build wheel in dist/
```

## Project Architecture

### Directory Structure

```
src/nac_nd_gui/           # Main Python package (src layout)
├── app.py                # Flask app entry point, Swagger config
├── nac_api.py            # NaC API client (1,044 lines)
├── nexus_dashboard.py    # Nexus Dashboard client (390 lines)
├── netbox_api.py         # NetBox IPAM client (581 lines)
├── api/v1/               # Modular API blueprints
│   ├── general.py        # Basic endpoints
│   ├── tables.py         # UI table data endpoints
│   ├── admin.py          # Configuration management
│   ├── nexus.py          # Nexus Dashboard endpoints
│   ├── nac.py            # NaC API endpoints
│   └── netbox.py         # NetBox endpoints
├── static/
│   ├── css/style.css     # Custom styles (506 lines)
│   ├── images/           # Logo and branding assets
│   └── js/
│       ├── app.js        # Main UI logic (2,204 lines)
│       ├── nac.js        # NaC-specific features (1,335 lines)
│       └── nexus.js      # Nexus-specific features (394 lines)
└── templates/index.html  # Single-page application (1,286 lines)
```

### API Client Pattern

All three backend clients follow a consistent pattern:
- Constructor with optional config parameters
- YAML configuration loading from `yaml/config.yaml`
- Session management with `requests.Session()`
- Authentication header setup (API keys, tokens)
- HTTP method wrappers (`get()`, `post()`, `put()`, `delete()`)

### Flask Blueprint Architecture

API endpoints are organized into versioned blueprints under `/api/v1/*`:
- **Modular design**: Each integration has dedicated blueprint
- **Centralized registration**: All blueprints registered in `api/v1/__init__.py`
- **Swagger documentation**: Each endpoint documented with decorators

### Frontend Architecture

**Single Page Application (SPA)** with:
- **Dynamic navigation**: Sidebar with collapsible sections
- **Tabulator tables**: Advanced data tables with sorting/filtering
- **API-driven UI**: All data fetched via REST endpoints
- **Bootstrap utilities**: Responsive design with card layouts

## Configuration Management

### Web Admin Panel (Recommended)

Navigate to Admin page to configure:
- **NaC API settings**: API URL, SCM provider, repository, API keys
- **Nexus Dashboard settings**: URL, username, API key, fabric name
- **NetBox settings**: URL, username, API token
- **Visual feedback**: Green borders indicate configured fields
- **Security**: API keys show as dots (••••••••) when loaded

### YAML Configuration

Configuration stored in `yaml/config.yaml` (gitignored):

```yaml
nac:
  api_url: http://0.0.0.0:8000
  api_key: ghp_xxxxxxxxxxxxxxxx
  scm_provider: github  # github, gitlab, bitbucket
  scm_api_url: https://github.com/api/v3/
  repository_url: username/repository
  data_sources_dir: data

nexus_dashboard:
  api_key: xxxxxxxxxxxxxxxxxxxxxxxxx
  url: https://10.x.x.x
  username: admin
  fabric_name: fabric1

netbox:
  url: https://netbox.example.com
  username: admin
  api_key: xxxxxxxxxx
```

## Key Integration Patterns

### NaC API (Network as Code)

**Purpose**: GitOps workflow for network configurations
- **Authentication**: GitHub/GitLab/Bitbucket Personal Access Tokens
- **Data Format**: YAML files in SCM repositories
- **Workflow**: GUI → NaC API → SCM → Network automation
- **Features**: VRF/network management, YAML validation, version control

### Nexus Dashboard Integration

**Purpose**: Direct Cisco fabric management
- **Authentication**: Header-based (`X-Nd-Username`, `X-Nd-Apikey`)
- **Operations**: Fabric discovery, VRF management, switch inventory
- **Scope**: Optional fabric-specific operations

### NetBox Integration

**Purpose**: IP Address Management (IPAM)
- **Authentication**: Token-based API authentication
- **Operations**: Prefix management, VLAN tracking, device inventory
- **Data**: Sites, devices, IP addresses, prefixes

## Development Guidelines

### Code Organization

- **Client classes**: Keep consistent patterns across `*_api.py` files
- **Blueprint structure**: Maintain separation of concerns in `api/v1/`
- **Frontend modules**: Organize JavaScript by backend integration
- **Configuration**: Always use YAML config, never hardcode credentials

### Testing Strategy

- **pytest configuration**: Tests in `tests/` directory
- **Coverage reporting**: Enabled with `--cov=nac_nd_gui`
- **Test patterns**: `test_*.py` files, `Test*` classes, `test_*` functions

### Code Quality

- **Black formatting**: Line length 100, Python 3.11 target
- **Ruff linting**: E, F, I, N, W, B, C90 rules (ignore E501)
- **MyPy type checking**: Lenient config, gradual adoption

### Security Considerations

- **Configuration security**: All API keys in gitignored `yaml/config.yaml`
- **Environment variables**: Flask SECRET_KEY in `.env`
- **Admin UI masking**: API keys displayed as dots for security
- **Authentication**: All clients use secure authentication methods

## Production Deployment

### Flask Configuration

```python
# Production settings
app.config['SECRET_KEY'] = 'strong-secret-key'
os.environ['FLASK_ENV'] = 'production'
```

### WSGI Deployment

```bash
uv add gunicorn
uv run gunicorn -w 4 -b 0.0.0.0:9999 "nac_nd_gui.app:app"
```

### Infrastructure Requirements

- **Reverse proxy**: nginx/Apache recommended
- **HTTPS**: SSL certificates required for production
- **Configuration**: Secure `yaml/config.yaml` with proper permissions

## API Documentation

**Interactive Swagger UI**: Available at `http://localhost:9999/swagger/`

### Endpoint Categories

- **General**: `/api/v1/hello`, `/api/v1/data`
- **Tables**: `/api/v1/tables/{recent-activity,fabrics,vrfs,interfaces}`
- **Admin**: `/api/v1/admin/{save-config,load-config,test-*-connection}`
- **Nexus**: `/api/v1/nexus/{fabrics,switches,vrfs,networks}`
- **NaC**: `/api/v1/nac/{vrfs,networks,switches,fabric}`
- **NetBox**: `/api/v1/netbox/{prefixes,vlans,sites,devices}`

## Troubleshooting

### Common Issues

1. **Missing configuration**: Use Admin panel to configure backend connections
2. **API connection failures**: Test connections via Admin panel
3. **YAML parsing errors**: Validate configuration file syntax
4. **Frontend issues**: Check browser console for JavaScript errors

### Debug Mode

Flask debug mode enabled by default for development:
- **Error pages**: Detailed traceback information
- **Auto-reload**: Server restarts on file changes
- **Swagger UI**: Interactive API testing available

## Package Management with UV

This project uses **UV** (fast Python package manager):
- **10-100x faster** than pip for dependency resolution
- **Rust-based resolver** for reliability
- **Native pyproject.toml support**
- **Lock file**: `uv.lock` ensures reproducible builds
- **Editable installs**: Development mode package installation