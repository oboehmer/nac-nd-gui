"""
Authentication module for NaC ND GUI application.

Provides user authentication, session management, and role-based access control.
"""

import os
import yaml
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from functools import wraps

import bcrypt
from flask import Flask, request, session, jsonify, flash, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user


class User(UserMixin):
    """User class for Flask-Login."""

    def __init__(self, username: str, password_hash: str, role: str, full_name: str,
                 email: str, enabled: bool = True):
        self.id = username
        self.username = username
        self.password_hash = password_hash
        self.role = role
        self.full_name = full_name
        self.email = email
        self.enabled = enabled
        self.failed_attempts = 0
        self.locked_until = None

    def check_password(self, password: str) -> bool:
        """Check if the provided password matches the user's password hash."""
        if isinstance(self.password_hash, str):
            password_hash = self.password_hash.encode('utf-8')
        else:
            password_hash = self.password_hash

        return bcrypt.checkpw(password.encode('utf-8'), password_hash)

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission based on their role."""
        auth_config = load_auth_config()
        if not auth_config:
            return False

        roles = auth_config.get('roles', {})
        user_role = roles.get(self.role, {})
        permissions = user_role.get('permissions', [])

        return permission in permissions

    def is_locked(self) -> bool:
        """Check if the user account is currently locked."""
        if not self.locked_until:
            return False
        return datetime.now() < self.locked_until

    def get_id(self):
        """Return the user ID for Flask-Login."""
        return self.username


class AuthManager:
    """Authentication manager for the application."""

    def __init__(self, app: Flask = None):
        self.app = app
        self.login_manager = LoginManager()
        self.users_cache = {}
        self.config_cache = None
        self.config_last_modified = None

        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):
        """Initialize the authentication system with Flask app."""
        self.app = app

        # Configure Flask-Login
        self.login_manager.init_app(app)
        self.login_manager.login_view = 'auth.login'
        self.login_manager.login_message = 'Please log in to access this page.'
        self.login_manager.login_message_category = 'info'

        # Set user loader
        self.login_manager.user_loader(self.load_user)

        # Register authentication blueprint
        from .api.v1.auth import auth_bp
        app.register_blueprint(auth_bp)

    def load_user(self, username: str) -> Optional[User]:
        """Load user by username for Flask-Login."""
        return self.get_user(username)

    def get_user(self, username: str) -> Optional[User]:
        """Get user by username."""
        users = self.get_users()
        return users.get(username)

    def get_users(self) -> Dict[str, User]:
        """Get all users, with caching."""
        auth_config = load_auth_config()
        if not auth_config:
            return {}

        # Check if we need to reload users
        config_path = os.path.join('yaml', 'auth.yaml')
        if os.path.exists(config_path):
            last_modified = os.path.getmtime(config_path)
            if (self.config_last_modified is None or
                last_modified > self.config_last_modified):
                self.users_cache = {}
                self.config_last_modified = last_modified

        if not self.users_cache:
            users_config = auth_config.get('users', {})
            for username, user_data in users_config.items():
                password = user_data.get('password', '')

                # Hash password if it's not already hashed
                if not password.startswith('$2b$'):
                    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                else:
                    password_hash = password.encode('utf-8')

                user = User(
                    username=username,
                    password_hash=password_hash,
                    role=user_data.get('role', 'readonly'),
                    full_name=user_data.get('full_name', username),
                    email=user_data.get('email', ''),
                    enabled=user_data.get('enabled', True)
                )

                self.users_cache[username] = user

        return self.users_cache

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password."""
        user = self.get_user(username)

        if not user or not user.enabled:
            return None

        # Check if account is locked
        if user.is_locked():
            return None

        # Check password
        if user.check_password(password):
            # Reset failed attempts on successful login
            user.failed_attempts = 0
            user.locked_until = None
            return user
        else:
            # Increment failed attempts
            self._handle_failed_login(user)
            return None

    def _handle_failed_login(self, user: User):
        """Handle failed login attempt."""
        auth_config = load_auth_config()
        if not auth_config:
            return

        security_config = auth_config.get('security', {})
        max_attempts = security_config.get('max_login_attempts', 5)
        lockout_duration = security_config.get('lockout_duration', 15)
        enable_lockout = security_config.get('enable_lockout', True)

        user.failed_attempts += 1

        if enable_lockout and user.failed_attempts >= max_attempts:
            user.locked_until = datetime.now() + timedelta(minutes=lockout_duration)


def load_auth_config() -> Optional[Dict[str, Any]]:
    """Load authentication configuration from YAML file."""
    config_path = os.path.join('yaml', 'auth.yaml')

    if not os.path.exists(config_path):
        return None

    try:
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"Error loading auth config: {e}")
        return None


def is_auth_enabled() -> bool:
    """Check if authentication is enabled."""
    config = load_auth_config()
    if not config:
        return False

    auth_config = config.get('auth', {})
    return auth_config.get('enabled', False)


def require_permission(permission: str):
    """Decorator to require specific permission."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_auth_enabled():
                return f(*args, **kwargs)

            if not current_user.is_authenticated:
                if request.is_json:
                    return jsonify({'error': 'Authentication required'}), 401
                flash('Please log in to access this page.', 'error')
                return redirect(url_for('auth.login'))

            if not current_user.has_permission(permission):
                if request.is_json:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                flash('You do not have permission to access this page.', 'error')
                return redirect(url_for('index'))

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_role(role: str):
    """Decorator to require specific role."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_auth_enabled():
                return f(*args, **kwargs)

            if not current_user.is_authenticated:
                if request.is_json:
                    return jsonify({'error': 'Authentication required'}), 401
                flash('Please log in to access this page.', 'error')
                return redirect(url_for('auth.login'))

            if current_user.role != role:
                if request.is_json:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                flash('You do not have permission to access this page.', 'error')
                return redirect(url_for('index'))

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def optional_auth(f):
    """Decorator for routes that work with or without authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Add auth status to kwargs
        kwargs['auth_enabled'] = is_auth_enabled()
        kwargs['user_authenticated'] = current_user.is_authenticated if is_auth_enabled() else False
        return f(*args, **kwargs)
    return decorated_function