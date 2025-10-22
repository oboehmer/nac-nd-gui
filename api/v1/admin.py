"""
Admin configuration API endpoints
"""
from flask import Blueprint, jsonify, request
import os
import yaml

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
            nac_api_key:
              type: string
              description: NaC API key
              example: "your-nac-api-key"
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
                'api_key': data.get('nac_api_key', '')
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
                    'nac_api_key': '',
                    'nexus_api_key': '',
                    'nexus_url': '',
                    'nexus_username': '',
                    'nexus_fabric_name': ''
                }
            })

        # Read YAML file
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f) or {}

        return jsonify({
            'status': 'success',
            'data': {
                'nac_api_key': config_data.get('nac', {}).get('api_key', ''),
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
