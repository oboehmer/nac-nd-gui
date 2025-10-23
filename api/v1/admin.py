"""
Admin configuration API endpoints
"""
from flask import Blueprint, jsonify, request
import os
import yaml
import requests
from nac_api import get_nac_client

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/save-config', methods=['POST'])
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

        # Create yaml directory if it doesn't exist
        yaml_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'yaml')
        os.makedirs(yaml_dir, exist_ok=True)

        # Configuration file path
        config_path = os.path.join(yaml_dir, 'config.yaml')

        # Configuration data
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
                'api_key': data.get('nexus_api_key', ''),
                'url': data.get('nexus_url', ''),
                'username': data.get('nexus_username', ''),
                'fabric_name': data.get('nexus_fabric_name', '')
            }
        }

        # Write to YAML file
        with open(config_path, 'w') as f:
            yaml.dump(config_data, f, default_flow_style=False, sort_keys=False)

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
def load_admin_config():
    """Load current API configuration from YAML file"""
    try:
        # Configuration file path
        yaml_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'yaml')
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
                    'data_sources_dir': ''
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
                'nexus_fabric_name': config_data.get('nexus_dashboard', {}).get('fabric_name', '')
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to load configuration: {str(e)}'
        }), 500


@admin_bp.route('/clear-config', methods=['POST'])
def clear_admin_config():
    """Clear API configuration from YAML file"""
    try:
        # Configuration file path
        yaml_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'yaml')
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
        client = get_nac_client()
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
