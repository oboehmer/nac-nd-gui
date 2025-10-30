# Development Guide

## Setup with uv

This project uses [uv](https://github.com/astral-sh/uv) for fast, reliable Python package management.

### Prerequisites

- Python 3.11 or higher
- uv installed (`pip install uv` or see [uv installation guide](https://github.com/astral-sh/uv#installation))

### Initial Setup

1. Clone the repository and navigate to the project directory:
   ```bash
   cd nac-nd-gui
   ```

2. Sync dependencies and create a virtual environment:
   ```bash
   uv sync
   ```

   This will:
   - Create a `.venv` directory with the virtual environment
   - Install all dependencies from `pyproject.toml`
   - Install the package in editable mode

3. Copy the environment sample file and configure:
   ```bash
   cp .env.sample .env
   # Edit .env with your configuration
   ```

### Running the Application

#### Using the installed command:
```bash
uv run nac-nd-gui
```

#### Using Python module syntax:
```bash
uv run python -m nac_nd_gui.app
```

#### Direct execution:
```bash
uv run python src/nac_nd_gui/app.py
```

### Development Commands

#### Add a new dependency:
```bash
uv add <package-name>
```

#### Add a development dependency:
```bash
uv add --dev <package-name>
```

#### Update dependencies:
```bash
uv sync
```

#### Run tests (when implemented):
```bash
uv run pytest
```

#### Run linting:
```bash
uv run ruff check src/
```

#### Run code formatting:
```bash
uv run black src/
```

#### Run type checking:
```bash
uv run mypy src/
```

## Project Structure

```
nac-nd-gui/
├── src/
│   └── nac_nd_gui/          # Main package
│       ├── __init__.py
│       ├── app.py            # Flask application entry point
│       ├── nac_api.py        # NaC API client
│       ├── nexus_dashboard.py # Nexus Dashboard client
│       ├── api/              # API blueprints
│       │   └── v1/
│       ├── static/           # Static files (CSS, JS)
│       └── templates/        # HTML templates
├── logs/                     # Application logs
├── yaml/                     # YAML configuration files
├── pyproject.toml            # Project metadata and dependencies
├── .env                      # Environment variables (not in git)
├── .env.sample               # Environment variables template
└── README.md                 # Project documentation
```

## Why uv?

- **Fast**: 10-100x faster than pip
- **Reliable**: Uses a Rust-based resolver for consistent installs
- **Modern**: Native support for `pyproject.toml` and PEP standards
- **Simple**: Single tool for dependency management
- **Compatible**: Works with existing Python packaging ecosystem

## Migration from pip

This project was migrated from pip to uv. Key changes:

1. `requirements.txt` → `pyproject.toml` (dependencies section)
2. Flat directory structure → `src/` layout for better packaging
3. `pip install -r requirements.txt` → `uv sync`
4. `python app.py` → `uv run nac-nd-gui` or `uv run python -m nac_nd_gui.app`

## Troubleshooting

### Virtual environment not activated
```bash
# uv automatically manages the virtual environment
# Just use `uv run` prefix for all commands
uv run python -m nac_nd_gui.app
```

### Dependency conflicts
```bash
# Clear the lock file and sync again
rm uv.lock
uv sync
```

### Import errors
```bash
# Reinstall in editable mode
uv sync --reinstall
```
