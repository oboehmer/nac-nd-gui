"""
Admin configuration API endpoints
"""
from flask import Blueprint, jsonify, request
import os
import yaml
import requests
from ...nac_api import get_nac_client, reset_nac_client
from ...nexus_dashboard import reset_nexus_client
from ...auth import require_permission

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/save-config', methods=['POST'])
@require_permission('admin')
def save_admin_config():
    """
    Save API configuration to YAML file
    ---
    tags:
      - Admin
    summary: Save API configuration
    description: Saves API keys and connection details to configuration file
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            nac_api_url:
              type: string
              description: NAC-API base URL
              example: "https://nac-api.example.com"
            nac_api_key:
              type: string
              description: Passthrough API key
              example: "your-passthrough-api-key"
            nexus_api_key:
              type: string
              description: Nexus Dashboard API key
              example: "your-nexus-api-key"
            nexus_url:
              type: string
              description: Nexus Dashboard URL
              example: "https://10.15.0.122"
            nexus_username:
              type: string
              description: Nexus Dashboard username
              example: "admin"
            nexus_fabric_name:
              type: string
              description: Fabric name to manage
              example: "nac-tf-fabric1"
            scm_provider:
              type: string
              description: Source Control Management provider
              enum: [github, gitlab, bitbucket_cloud, bitbucket_local, azure_devops]
              example: "github"
            scm_api_url:
              type: string
              description: Source Control Management API URL
              example: "https://api.github.com"
            repository_url:
              type: string
              description: Repository path (directory inside the repository)
              example: "path/to/config/directory"
            data_sources_dir:
              type: string
              description: Directory path containing data sources to read
              example: "/path/to/data"
    responses:
      200:
        description: Configuration saved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "Configuration saved successfully"
      500:
        description: Failed to save configuration
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Failed to save configuration: Write error"
    """
    try:
        data = request.get_json()

        # Validate Nexus Dashboard credentials contain only ASCII/Latin-1 characters
        # Strip whitespace to remove any hidden characters
        nexus_username = data.get('nexus_username', '').strip()
        nexus_api_key = data.get('nexus_api_key', '').strip()

        try:
            if nexus_username:
                nexus_username.encode('latin-1')
            if nexus_api_key:
                nexus_api_key.encode('latin-1')
        except UnicodeEncodeError:
            return jsonify({
                'status': 'error',
                'message': 'Nexus Dashboard username and API key must contain only ASCII/Latin-1 characters. Please remove any special Unicode characters, emojis, or non-ASCII symbols.'
            }), 400

        # Create yaml directory if it doesn't exist
        # Navigate from src/nac_nd_gui/api/v1/ up to project root, then to yaml/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        yaml_dir = os.path.join(project_root, 'yaml')
        os.makedirs(yaml_dir, exist_ok=True)

        # Configuration file path
        config_path = os.path.join(yaml_dir, 'config.yaml')

        # Configuration data (use validated/stripped credentials)
        config_data = {
            'nac': {
                'api_url': data.get('nac_api_url', ''),
                'api_key': data.get('nac_api_key', ''),
                'scm_provider': data.get('scm_provider', ''),
                'scm_api_url': data.get('scm_api_url', ''),
                'repository_url': data.get('repository_url', ''),
                'data_sources_dir': data.get('data_sources_dir', '')
            },
            'nexus_dashboard': {
                'api_key': nexus_api_key,
                'url': data.get('nexus_url', ''),
                'username': nexus_username,
                'fabric_name': data.get('nexus_fabric_name', '')
            },
            'netbox': {
                'url': data.get('netbox_url', ''),
                'username': data.get('netbox_username', ''),
                'api_key': data.get('netbox_api_key', ''),
                'prefix_settings': data.get('netbox_prefix_settings', []),
                'vlan_group_settings': data.get('netbox_vlan_group_settings', [])
            }
        }

        # Write to YAML file
        with open(config_path, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False, sort_keys=False)

        # Reset client singletons to force reload of new configuration
        reset_nac_client()
        reset_nexus_client()

        return jsonify({
            'status': 'success',
            'message': 'Configuration saved successfully'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to save configuration: {str(e)}'
        }), 500


@admin_bp.route('/load-config', methods=['GET'])
@require_permission('admin')
def load_admin_config():
    """Load current API configuration from YAML file"""
    try:
        # Configuration file path
        # Navigate from src/nac_nd_gui/api/v1/ up to project root, then to yaml/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        yaml_dir = os.path.join(project_root, 'yaml')
        config_path = os.path.join(yaml_dir, 'config.yaml')

        # Check if config file exists
        if not os.path.exists(config_path):
            return jsonify({
                'status': 'success',
                'data': {
                    'nac_api_url': '',
                    'nac_api_key': '',
                    'nexus_api_key': '',
                    'nexus_url': '',
                    'nexus_username': '',
                    'nexus_fabric_name': '',
                    'scm_provider': '',
                    'scm_api_url': '',
                    'repository_url': '',
                    'data_sources_dir': '',
                    'netbox_url': '',
                    'netbox_username': '',
                    'netbox_api_key': '',
                    'netbox_prefix_settings': [],
                    'netbox_vlan_group_settings': []
                }
            })

        # Read YAML file
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f) or {}

        return jsonify({
            'status': 'success',
            'data': {
                'nac_api_url': config_data.get('nac', {}).get('api_url', ''),
                'nac_api_key': config_data.get('nac', {}).get('api_key', ''),
                'scm_provider': config_data.get('nac', {}).get('scm_provider', ''),
                'scm_api_url': config_data.get('nac', {}).get('scm_api_url', ''),
                'repository_url': config_data.get('nac', {}).get('repository_url', ''),
                'data_sources_dir': config_data.get('nac', {}).get('data_sources_dir', ''),
                'nexus_api_key': config_data.get('nexus_dashboard', {}).get('api_key', ''),
                'nexus_url': config_data.get('nexus_dashboard', {}).get('url', ''),
                'nexus_username': config_data.get('nexus_dashboard', {}).get('username', ''),
                'nexus_fabric_name': config_data.get('nexus_dashboard', {}).get('fabric_name', ''),
                'netbox_url': config_data.get('netbox', {}).get('url', ''),
                'netbox_username': config_data.get('netbox', {}).get('username', ''),
                'netbox_api_key': config_data.get('netbox', {}).get('api_key', ''),
                'netbox_prefix_settings': config_data.get('netbox', {}).get('prefix_settings', []),
                'netbox_vlan_group_settings': config_data.get('netbox', {}).get('vlan_group_settings', [])
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to load configuration: {str(e)}'
        }), 500


@admin_bp.route('/clear-config', methods=['POST'])
@require_permission('admin')
def clear_admin_config():
    """Clear API configuration from YAML file"""
    try:
        # Configuration file path
        # Navigate from src/nac_nd_gui/api/v1/ up to project root, then to yaml/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        yaml_dir = os.path.join(project_root, 'yaml')
        config_path = os.path.join(yaml_dir, 'config.yaml')

        # Remove the config file if it exists
        if os.path.exists(config_path):
            os.remove(config_path)

        return jsonify({
            'status': 'success',
            'message': 'Configuration cleared successfully'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to clear configuration: {str(e)}'
        }), 500


@admin_bp.route('/test-nac-api-connection', methods=['GET'])
@require_permission('admin')
def test_nac_api_connection():
    """
    Test connection to NaC API (SCM)
    ---
    tags:
      - Admin
    summary: Test NaC API connectivity
    description: Tests the connection to NaC API SCM endpoint using configured credentials
    responses:
      200:
        description: Connection test result
        schema:
          type: object
          properties:
            status:
              type: string
              enum: [success, error]
              example: success
            message:
              type: string
              example: "Successfully connected to NaC API"
            scm_api_url:
              type: string
              example: "https://api.github.com"
            scm_provider:
              type: string
              example: "github"
            size_of_data_model:
              type: integer
              example: 12345
      500:
        description: Connection test failed
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Connection test failed: Connection timeout"
    """
    try:
        # Force reload of configuration before testing
        client = get_nac_client(reload_config=True)
        result = client.test_connection()

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Connection test failed: {str(e)}'
        }), 500


# User Management Endpoints

@admin_bp.route('/users', methods=['GET'])
@require_permission('admin')
def list_users():
    """
    List all users
    ---
    tags:
      - Admin
    responses:
      200:
        description: User list retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            users:
              type: array
              items:
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
                  email:
                    type: string
                    example: "admin@example.com"
                  enabled:
                    type: boolean
                    example: true
    """
    try:
        from ...auth import load_auth_config
        auth_config = load_auth_config()

        if not auth_config:
            return jsonify({
                'success': False,
                'message': 'Authentication configuration not found'
            }), 404

        users_data = auth_config.get('users', {})
        users_list = []

        for username, user_info in users_data.items():
            users_list.append({
                'username': username,
                'role': user_info.get('role', 'readonly'),
                'full_name': user_info.get('full_name', username),
                'email': user_info.get('email', ''),
                'enabled': user_info.get('enabled', True)
            })

        return jsonify({
            'success': True,
            'users': users_list
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load users: {str(e)}'
        }), 500


@admin_bp.route('/users', methods=['POST'])
@require_permission('admin')
def create_user():
    """
    Create a new user
    ---
    tags:
      - Admin
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            username:
              type: string
              description: Username (must be unique)
              example: "newuser"
            password:
              type: string
              description: Password
              example: "SecurePass123!"
            role:
              type: string
              description: User role
              example: "operator"
            full_name:
              type: string
              description: Full name
              example: "New User"
            email:
              type: string
              description: Email address
              example: "newuser@example.com"
            enabled:
              type: boolean
              description: Whether user is enabled
              example: true
    responses:
      201:
        description: User created successfully
      400:
        description: Invalid input or user already exists
      500:
        description: Server error
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['username', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400

        username = data['username'].strip()
        password = data['password']
        role = data['role']
        full_name = data.get('full_name', username)
        email = data.get('email', '')
        enabled = data.get('enabled', True)

        # Load current auth config
        auth_config_path = os.path.join('yaml', 'auth.yaml')

        if os.path.exists(auth_config_path):
            with open(auth_config_path, 'r') as file:
                auth_config = yaml.safe_load(file) or {}
        else:
            return jsonify({
                'success': False,
                'message': 'Authentication configuration file not found'
            }), 404

        # Check if user already exists
        users = auth_config.get('users', {})
        if username in users:
            return jsonify({
                'success': False,
                'message': f'User {username} already exists'
            }), 400

        # Validate role exists
        roles = auth_config.get('roles', {})
        if role not in roles:
            return jsonify({
                'success': False,
                'message': f'Role {role} does not exist'
            }), 400

        # Add new user
        users[username] = {
            'password': password,  # Note: In production, this should be hashed
            'role': role,
            'full_name': full_name,
            'email': email,
            'enabled': enabled
        }

        auth_config['users'] = users

        # Save updated config
        with open(auth_config_path, 'w') as file:
            yaml.dump(auth_config, file, default_flow_style=False, indent=2)

        return jsonify({
            'success': True,
            'message': f'User {username} created successfully'
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to create user: {str(e)}'
        }), 500


@admin_bp.route('/users/<username>', methods=['PUT'])
@require_permission('admin')
def update_user(username):
    """
    Update an existing user
    ---
    tags:
      - Admin
    parameters:
      - in: path
        name: username
        type: string
        required: true
        description: Username to update
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            password:
              type: string
              description: New password (optional)
            role:
              type: string
              description: User role
            full_name:
              type: string
              description: Full name
            email:
              type: string
              description: Email address
            enabled:
              type: boolean
              description: Whether user is enabled
    responses:
      200:
        description: User updated successfully
      404:
        description: User not found
      500:
        description: Server error
    """
    try:
        data = request.get_json()

        # Load current auth config
        auth_config_path = os.path.join('yaml', 'auth.yaml')

        if not os.path.exists(auth_config_path):
            return jsonify({
                'success': False,
                'message': 'Authentication configuration file not found'
            }), 404

        with open(auth_config_path, 'r') as file:
            auth_config = yaml.safe_load(file) or {}

        # Check if user exists
        users = auth_config.get('users', {})
        if username not in users:
            return jsonify({
                'success': False,
                'message': f'User {username} not found'
            }), 404

        # Update user fields
        user_info = users[username]

        if 'password' in data and data['password']:
            user_info['password'] = data['password']

        if 'role' in data:
            # Validate role exists
            roles = auth_config.get('roles', {})
            if data['role'] not in roles:
                return jsonify({
                    'success': False,
                    'message': f'Role {data["role"]} does not exist'
                }), 400
            user_info['role'] = data['role']

        if 'full_name' in data:
            user_info['full_name'] = data['full_name']

        if 'email' in data:
            user_info['email'] = data['email']

        if 'enabled' in data:
            user_info['enabled'] = data['enabled']

        # Save updated config
        with open(auth_config_path, 'w') as file:
            yaml.dump(auth_config, file, default_flow_style=False, indent=2)

        return jsonify({
            'success': True,
            'message': f'User {username} updated successfully'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to update user: {str(e)}'
        }), 500


@admin_bp.route('/users/<username>', methods=['DELETE'])
@require_permission('admin')
def delete_user(username):
    """
    Delete a user
    ---
    tags:
      - Admin
    parameters:
      - in: path
        name: username
        type: string
        required: true
        description: Username to delete
    responses:
      200:
        description: User deleted successfully
      400:
        description: Cannot delete user (e.g., last admin)
      404:
        description: User not found
      500:
        description: Server error
    """
    try:
        # Load current auth config
        auth_config_path = os.path.join('yaml', 'auth.yaml')

        if not os.path.exists(auth_config_path):
            return jsonify({
                'success': False,
                'message': 'Authentication configuration file not found'
            }), 404

        with open(auth_config_path, 'r') as file:
            auth_config = yaml.safe_load(file) or {}

        # Check if user exists
        users = auth_config.get('users', {})
        if username not in users:
            return jsonify({
                'success': False,
                'message': f'User {username} not found'
            }), 404

        # Check if this is the last admin user
        admin_count = sum(1 for user_info in users.values()
                         if user_info.get('role') == 'admin' and user_info.get('enabled', True))

        if users[username].get('role') == 'admin' and admin_count <= 1:
            return jsonify({
                'success': False,
                'message': 'Cannot delete the last admin user'
            }), 400

        # Delete user
        del users[username]

        # Save updated config
        with open(auth_config_path, 'w') as file:
            yaml.dump(auth_config, file, default_flow_style=False, indent=2)

        return jsonify({
            'success': True,
            'message': f'User {username} deleted successfully'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to delete user: {str(e)}'
        }), 500


@admin_bp.route('/roles', methods=['GET'])
@require_permission('admin')
def list_roles():
    """
    List all available roles
    ---
    tags:
      - Admin
    responses:
      200:
        description: Role list retrieved successfully
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            roles:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "admin"
                  description:
                    type: string
                    example: "Full system access"
                  permissions:
                    type: array
                    items:
                      type: string
                    example: ["read", "write", "admin"]
    """
    try:
        from ...auth import load_auth_config
        auth_config = load_auth_config()

        if not auth_config:
            return jsonify({
                'success': False,
                'message': 'Authentication configuration not found'
            }), 404

        roles_data = auth_config.get('roles', {})
        roles_list = []

        for role_name, role_info in roles_data.items():
            roles_list.append({
                'name': role_name,
                'description': role_info.get('description', ''),
                'permissions': role_info.get('permissions', [])
            })

        return jsonify({
            'success': True,
            'roles': roles_list
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to load roles: {str(e)}'
        }), 500
