"""
Authentication API endpoints.

Handles user login, logout, and authentication-related operations.
"""

from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from flasgger import swag_from

from ...auth import AuthManager, load_auth_config, is_auth_enabled

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
auth_manager = AuthManager()


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    User login endpoint.
    ---
    tags:
      - Authentication
    parameters:
      - name: username
        in: formData
        type: string
        required: true
        description: Username
      - name: password
        in: formData
        type: string
        required: true
        description: Password
      - name: remember
        in: formData
        type: boolean
        required: false
        description: Remember user session
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Login successful"
            user:
              type: object
              properties:
                username:
                  type: string
                  example: "admin"
                role:
                  type: string
                  example: "admin"
                full_name:
                  type: string
                  example: "Administrator"
      401:
        description: Authentication failed
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Invalid username or password"
      403:
        description: Account locked or disabled
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Account is locked or disabled"
    """
    # Check if authentication is enabled
    if not is_auth_enabled():
        if request.is_json:
            return jsonify({
                'success': False,
                'message': 'Authentication is not enabled'
            }), 400
        flash('Authentication is not configured.', 'warning')
        return redirect(url_for('index'))

    # If user is already authenticated, redirect to home
    if current_user.is_authenticated:
        if request.is_json:
            return jsonify({
                'success': True,
                'message': 'Already logged in',
                'user': {
                    'username': current_user.username,
                    'role': current_user.role,
                    'full_name': current_user.full_name
                }
            })
        return redirect(url_for('index'))

    if request.method == 'GET':
        if request.is_json:
            return jsonify({
                'success': False,
                'message': 'Use POST method to login'
            }), 405
        return render_template('login.html')

    # Handle POST request
    data = request.get_json() if request.is_json else request.form
    username = data.get('username', '').strip()
    password = data.get('password', '')
    remember = data.get('remember', False)

    if not username or not password:
        message = 'Username and password are required'
        if request.is_json:
            return jsonify({'success': False, 'message': message}), 400
        flash(message, 'error')
        return render_template('login.html')

    # Authenticate user
    user = auth_manager.authenticate_user(username, password)

    if user:
        if user.is_locked():
            message = 'Account is temporarily locked due to too many failed login attempts'
            if request.is_json:
                return jsonify({'success': False, 'message': message}), 403
            flash(message, 'error')
            return render_template('login.html')

        if not user.enabled:
            message = 'Account is disabled'
            if request.is_json:
                return jsonify({'success': False, 'message': message}), 403
            flash(message, 'error')
            return render_template('login.html')

        # Log in the user
        login_user(user, remember=remember)

        # Set session timeout if configured
        auth_config = load_auth_config()
        if auth_config:
            timeout = auth_config.get('auth', {}).get('session_timeout', 60)
            if timeout > 0:
                session.permanent = True
                from datetime import timedelta
                session.permanent_session_lifetime = timedelta(minutes=timeout)

        if request.is_json:
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'role': user.role,
                    'full_name': user.full_name,
                    'email': user.email
                }
            })

        flash(f'Welcome back, {user.full_name}!', 'success')
        next_page = request.args.get('next')
        return redirect(next_page) if next_page else redirect(url_for('index'))

    else:
        message = 'Invalid username or password'
        if request.is_json:
            return jsonify({'success': False, 'message': message}), 401
        flash(message, 'error')
        return render_template('login.html')


@auth_bp.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    """
    User logout endpoint.
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Logout successful
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Logout successful"
    """
    username = current_user.username if current_user.is_authenticated else 'Unknown'
    logout_user()

    if request.is_json:
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })

    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/status', methods=['GET'])
def status():
    """
    Check authentication status.
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Authentication status
        schema:
          type: object
          properties:
            auth_enabled:
              type: boolean
              example: true
            authenticated:
              type: boolean
              example: true
            user:
              type: object
              properties:
                username:
                  type: string
                  example: "admin"
                role:
                  type: string
                  example: "admin"
                full_name:
                  type: string
                  example: "Administrator"
                permissions:
                  type: array
                  items:
                    type: string
                  example: ["read", "write", "admin"]
    """
    auth_enabled = is_auth_enabled()
    authenticated = current_user.is_authenticated if auth_enabled else False

    result = {
        'auth_enabled': auth_enabled,
        'authenticated': authenticated
    }

    if authenticated:
        auth_config = load_auth_config()
        roles = auth_config.get('roles', {}) if auth_config else {}
        user_role = roles.get(current_user.role, {})
        permissions = user_role.get('permissions', [])

        result['user'] = {
            'username': current_user.username,
            'role': current_user.role,
            'full_name': current_user.full_name,
            'email': current_user.email,
            'permissions': permissions
        }

    return jsonify(result)


@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """
    Change user password.
    ---
    tags:
      - Authentication
    parameters:
      - name: current_password
        in: formData
        type: string
        required: true
        description: Current password
      - name: new_password
        in: formData
        type: string
        required: true
        description: New password
      - name: confirm_password
        in: formData
        type: string
        required: true
        description: Confirm new password
    responses:
      200:
        description: Password changed successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            message:
              type: string
              example: "Password changed successfully"
      400:
        description: Invalid input
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: false
            message:
              type: string
              example: "Password validation failed"
    """
    data = request.get_json() if request.is_json else request.form
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    # Validate input
    if not all([current_password, new_password, confirm_password]):
        return jsonify({
            'success': False,
            'message': 'All password fields are required'
        }), 400

    if new_password != confirm_password:
        return jsonify({
            'success': False,
            'message': 'New passwords do not match'
        }), 400

    # Verify current password
    if not current_user.check_password(current_password):
        return jsonify({
            'success': False,
            'message': 'Current password is incorrect'
        }), 400

    # Validate new password
    auth_config = load_auth_config()
    if auth_config:
        password_reqs = auth_config.get('auth', {}).get('password_requirements', {})
        validation_error = _validate_password(new_password, password_reqs)
        if validation_error:
            return jsonify({
                'success': False,
                'message': validation_error
            }), 400

    # TODO: Update password in auth.yaml file
    # This would require updating the YAML file, which is beyond the current scope
    # For now, return a message that this feature is not implemented

    return jsonify({
        'success': False,
        'message': 'Password change functionality requires file system updates (not yet implemented)'
    }), 501


def _validate_password(password: str, requirements: dict) -> str:
    """Validate password against requirements."""
    min_length = requirements.get('min_length', 8)
    require_uppercase = requirements.get('require_uppercase', False)
    require_lowercase = requirements.get('require_lowercase', False)
    require_numbers = requirements.get('require_numbers', False)
    require_special_chars = requirements.get('require_special_chars', False)

    if len(password) < min_length:
        return f'Password must be at least {min_length} characters long'

    if require_uppercase and not any(c.isupper() for c in password):
        return 'Password must contain at least one uppercase letter'

    if require_lowercase and not any(c.islower() for c in password):
        return 'Password must contain at least one lowercase letter'

    if require_numbers and not any(c.isdigit() for c in password):
        return 'Password must contain at least one number'

    if require_special_chars and not any(c in '!@#$%^&*(),.?":{}|<>' for c in password):
        return 'Password must contain at least one special character'

    return ''