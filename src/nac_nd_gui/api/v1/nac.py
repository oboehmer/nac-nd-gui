"""
NaC API endpoints for UI
"""
from flask import Blueprint, jsonify, request
from ...nac_api import get_nac_client
import logging
import yaml
from pathlib import Path
import re

logger = logging.getLogger(__name__)

nac_bp = Blueprint('nac', __name__)


@nac_bp.route('/vrfs', methods=['GET'])
def get_vrfs():
    """
    Get VRFs from NaC API
    ---
    tags:
      - NaC API
    summary: Get VRFs
    description: Gets all VRFs from the NaC API data model
    responses:
      200:
        description: VRF data retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
      500:
        description: Failed to retrieve VRF data
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Failed to retrieve VRF data"
    """
    try:
        logger.info("VRF endpoint called")
        client = get_nac_client()
        vrf_list = client.get_vrfs_for_table()

        if vrf_list is not None:
            logger.info(f"Returning {len(vrf_list)} VRFs")
            return jsonify({
                'status': 'success',
                'data': vrf_list
            })
        else:
            logger.error("Failed to retrieve VRF data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve VRF data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in VRF endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve VRF data: {str(e)}'
        }), 500


@nac_bp.route('/networks', methods=['GET'])
def get_networks():
    """
    Get Networks from NaC API
    ---
    tags:
      - NaC API
    summary: Get Networks
    description: Gets all networks from the NaC API data model
    responses:
      200:
        description: Network data retrieved successfully
      500:
        description: Failed to retrieve network data
    """
    try:
        logger.info("Network endpoint called")
        client = get_nac_client()
        network_list = client.get_networks_for_table()

        if network_list is not None:
            logger.info(f"Returning {len(network_list)} networks")
            return jsonify({
                'status': 'success',
                'data': network_list
            })
        else:
            logger.error("Failed to retrieve network data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve network data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in network endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve network data: {str(e)}'
        }), 500


@nac_bp.route('/switches', methods=['GET'])
def get_switches():
    """
    Get Switches from NaC API
    ---
    tags:
      - NaC API
    summary: Get Switches
    description: Gets all switches from the NaC API data model
    responses:
      200:
        description: Switch data retrieved successfully
      500:
        description: Failed to retrieve switch data
    """
    try:
        logger.info("Switch endpoint called")
        client = get_nac_client()
        switch_list = client.get_switches_for_table()

        if switch_list is not None:
            logger.info(f"Returning {len(switch_list)} switches")
            return jsonify({
                'status': 'success',
                'data': switch_list
            })
        else:
            logger.error("Failed to retrieve switch data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve switch data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in switch endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve switch data: {str(e)}'
        }), 500


@nac_bp.route('/fabric', methods=['GET'])
def get_fabric():
    """
    Get Fabric details from NaC API
    ---
    tags:
      - NaC API
    summary: Get Fabric Details
    description: Gets fabric details from vxlan/global and vxlan/fabric endpoints
    responses:
      200:
        description: Fabric data retrieved successfully
      500:
        description: Failed to retrieve fabric data
    """
    try:
        logger.info("Fabric endpoint called")
        client = get_nac_client()
        fabric_data = client.get_fabric_details()

        if fabric_data is not None:
            logger.info("Returning fabric details")
            return jsonify({
                'status': 'success',
                'data': fabric_data
            })
        else:
            logger.error("Failed to retrieve fabric data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve fabric data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in fabric endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve fabric data: {str(e)}'
        }), 500


@nac_bp.route('/interfaces', methods=['GET'])
def get_interfaces():
    """
    Get Interfaces from NaC API
    ---
    tags:
      - NaC API
    summary: Get Interfaces
    description: Gets all interfaces from the NaC API data model (extracted from switches)
    responses:
      200:
        description: Interface data retrieved successfully
      500:
        description: Failed to retrieve interface data
    """
    try:
        logger.info("Interface endpoint called")
        client = get_nac_client()
        interface_list = client.get_interfaces_for_table()

        if interface_list is not None:
            logger.info(f"Returning {len(interface_list)} interfaces")
            return jsonify({
                'status': 'success',
                'data': interface_list
            })
        else:
            logger.error("Failed to retrieve interface data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve interface data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in interface endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve interface data: {str(e)}'
        }), 500


@nac_bp.route('/network-attach-groups', methods=['GET'])
def get_network_attach_groups():
    """
    Get Network Attach Groups from NaC API
    ---
    tags:
      - NaC API
    summary: Get Network Attach Groups
    description: Gets all network attach groups from vxlan/overlay/network_attach_groups
    responses:
      200:
        description: Network attach groups retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "ATTACH_GROUP_1"
      500:
        description: Failed to retrieve network attach groups
    """
    try:
        logger.info("Network Attach Groups endpoint called")
        client = get_nac_client()

        # Use the client's method to get network attach groups
        attach_groups_list = client.get_network_attach_groups_full()

        if attach_groups_list is not None:
            logger.info(f"Returning {len(attach_groups_list)} network attach groups")
            return jsonify({
                'status': 'success',
                'data': attach_groups_list
            })
        else:
            logger.error("Failed to retrieve network attach groups from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve network attach groups from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in network attach groups endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve network attach groups: {str(e)}'
        }), 500


@nac_bp.route('/vrfs/merge', methods=['POST'])
def merge_vrf():
    """
    Merge a new VRF in NaC API
    ---
    tags:
      - NaC API
    summary: Merge VRF
    description: Merges a new VRF into the NaC API data model using merge operation
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - vrf_id
            - vlan_id
          properties:
            name:
              type: string
              description: VRF name
              example: "VRF_PROD"
            vrf_id:
              type: integer
              description: VRF ID
              example: 50001
            vlan_id:
              type: integer
              description: VLAN ID
              example: 2001
            vrf_vlan_name:
              type: string
              description: VRF VLAN name (optional)
              example: "VLAN_PROD"
            vrf_description:
              type: string
              description: VRF description (optional)
              example: "Production VRF"
            change_message:
              type: string
              description: Optional change message for the merge operation
              example: "Adding new VRF"
            apply:
              type: boolean
              description: Whether to apply the changeset immediately
              example: false
            apply_message:
              type: string
              description: Optional message for the apply operation
              example: "Applying VRF changes"
    responses:
      200:
        description: VRF merged successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "VRF merged successfully"
            data:
              type: object
      400:
        description: Invalid request data
      500:
        description: Failed to merge VRF
    """
    try:
        logger.info("Merge VRF endpoint called")

        # Get request data
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Validate required fields
        required_fields = ['name', 'vrf_id', 'vlan_id']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Get NaC client
        client = get_nac_client()

        # Create VRF data with required fields
        vrf_data = {
            'name': data['name'],
            'vrf_id': data['vrf_id'],
            'vlan_id': data['vlan_id']
        }

        # Add optional fields if provided
        if 'vrf_vlan_name' in data and data['vrf_vlan_name']:
            vrf_data['vrf_vlan_name'] = data['vrf_vlan_name']

        if 'vrf_description' in data and data['vrf_description']:
            vrf_data['vrf_description'] = data['vrf_description']

        logger.info(f"Merging VRF: {vrf_data}")

        # Call NaC API merge operation using the client's merge_operation method
        response = client.merge_operation(
            path='vxlan/overlay/vrfs',
            data=vrf_data,
            change_message=data.get('change_message', f"Adding VRF {data['name']}"),
            apply=data.get('apply', False),
            apply_message=data.get('apply_message'),
            source=data.get('source')
        )

        if response:
            logger.info(f"VRF merged successfully: {data['name']}")
            return jsonify({
                'status': 'success',
                'message': f"VRF '{data['name']}' merged successfully",
                'data': response
            })
        else:
            logger.error("Failed to merge VRF - NaC API returned None")
            return jsonify({
                'status': 'error',
                'message': 'Failed to merge VRF in NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in merge VRF endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to merge VRF: {str(e)}'
        }), 500


def load_network_template(template_vars: dict) -> dict:
    """
    Load network template from YAML file and replace template variables.

    Args:
        template_vars: Dictionary containing variable names and their values
                      e.g., {'name': 'NET_PROD', 'vrf_name': 'VRF_PROD', ...}

    Returns:
        Dictionary with template variables replaced and defaults preserved
    """
    try:
        # Get the path to the YAML template file
        template_path = Path(__file__).parent.parent.parent.parent.parent/ 'yaml' / 'nac-network.yaml'

        if not template_path.exists():
            logger.error(f"Network template file not found: {template_path}")
            return None

        # Read the YAML template as text
        with open(template_path, 'r') as f:
            template_content = f.read()

        # Replace template variables using regex
        # Pattern matches {{ variable_name }} and replaces with actual values
        for var_name, var_value in template_vars.items():
            pattern = r'\{\{\s*' + re.escape(var_name) + r'\s*\}\}'
            template_content = re.sub(pattern, str(var_value), template_content)

        # Parse the resulting YAML into a dictionary
        network_data = yaml.safe_load(template_content)

        logger.info(f"Network template loaded with variables: {list(template_vars.keys())}")
        return network_data

    except Exception as e:
        logger.error(f"Error loading network template: {str(e)}", exc_info=True)
        return None


@nac_bp.route('/networks/merge', methods=['POST'])
def merge_network():
    """
    Merge a new Network in NaC API using YAML template
    ---
    tags:
      - NaC API
    summary: Merge Network
    description: |
      Merges a new network into the NaC API data model using merge operation.
      Uses a YAML template (yaml/nac-network.yaml) with default values.
      Template variables are replaced with provided values, while non-template
      fields maintain their default values from the template.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - vrf_name
            - net_id
            - vlan_id
            - vlan_name
            - gw_ip_address
            - network_attach_group
          properties:
            name:
              type: string
              description: Network name
              example: "NET_PROD_WEB"
            vrf_name:
              type: string
              description: Associated VRF name
              example: "VRF_PROD"
            net_id:
              type: integer
              description: Network ID (VNID)
              example: 30001
            vlan_id:
              type: integer
              description: VLAN ID
              example: 101
            vlan_name:
              type: string
              description: VLAN name
              example: "vlan_net_prod_web"
            gw_ip_address:
              type: string
              description: Gateway IP address in CIDR notation
              example: "10.1.1.1/24"
            network_attach_group:
              type: string
              description: Network attach group name (from NaC API attach groups)
              example: "ATTACH_GROUP_1"
            change_message:
              type: string
              description: Optional change message for the merge operation
              example: "Adding new production network"
            apply:
              type: boolean
              description: Whether to apply the changeset immediately
              example: false
            apply_message:
              type: string
              description: Optional message for the apply operation
              example: "Applying network changes"
    responses:
      200:
        description: Network merged successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "Network merged successfully"
            data:
              type: object
      400:
        description: Invalid request data or missing required fields
      500:
        description: Failed to merge network or load template
    """
    try:
        logger.info("Merge Network endpoint called")

        # Get request data
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Validate required fields (matching template variables)
        required_fields = ['name', 'vrf_name', 'net_id', 'vlan_id', 'vlan_name', 'gw_ip_address', 'network_attach_group']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Get NaC client
        client = get_nac_client()

        # Prepare template variables mapping
        # Map incoming data fields to template variable names
        template_vars = {
            'name': data['name'],
            'vrf_name': data['vrf_name'],
            'vnid': data['net_id'],                    # Template uses 'vnid', API uses 'net_id'
            'vlan_id': data['vlan_id'],
            'vlan_name': data['vlan_name'],
            'vlan_gateway_ip': data['gw_ip_address'],  # Template uses 'vlan_gateway_ip', API uses 'gw_ip_address'
            'network_attach_group': data['network_attach_group']
        }

        # Load network template with variable substitution
        network_data = load_network_template(template_vars)

        if not network_data:
            return jsonify({
                'status': 'error',
                'message': 'Failed to load network template'
            }), 500

        logger.info(f"Merging Network with template: {network_data}")

        # Call NaC API merge operation using the client's merge_operation method
        response = client.merge_operation(
            path='vxlan/overlay/networks',
            data=network_data,
            change_message=data.get('change_message', f"Adding network {data['name']}"),
            apply=data.get('apply', False),
            apply_message=data.get('apply_message'),
            source=data.get('source')
        )

        if response:
            logger.info(f"Network merged successfully: {data['name']}")
            return jsonify({
                'status': 'success',
                'message': f"Network '{data['name']}' merged successfully",
                'data': response
            })
        else:
            logger.error("Failed to merge Network - NaC API returned None")
            return jsonify({
                'status': 'error',
                'message': 'Failed to merge Network in NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in merge Network endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to merge Network: {str(e)}'
        }), 500
