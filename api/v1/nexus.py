"""
Nexus Dashboard API endpoints
"""
from flask import Blueprint, jsonify
import sys
import os

# Add parent directory to path to import nexus_dashboard module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from nexus_dashboard import get_nexus_client

nexus_bp = Blueprint('nexus', __name__)


@nexus_bp.route('/test-connection', methods=['GET'])
def test_nexus_connection():
    """
    Test connection to Nexus Dashboard
    ---
    tags:
      - Nexus Dashboard
    summary: Test Nexus Dashboard connectivity
    description: Tests the connection to Nexus Dashboard using configured credentials and verifies fabric existence
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
              example: "Successfully connected to Nexus Dashboard and verified fabric 'nac-tf-fabric1'"
            fabrics_count:
              type: integer
              example: 1
            configured_fabric:
              type: string
              example: "nac-tf-fabric1"
            fabric_found:
              type: boolean
              example: true
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
        client = get_nexus_client()
        result = client.test_connection()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Connection test failed: {str(e)}'
        }), 500


@nexus_bp.route('/sites', methods=['GET'])
def get_nexus_sites():
    """Get all sites from Nexus Dashboard"""
    try:
        client = get_nexus_client()
        sites = client.get_sites()

        if sites is not None:
            return jsonify({
                'status': 'success',
                'data': sites
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve sites'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve sites: {str(e)}'
        }), 500


@nexus_bp.route('/fabrics', methods=['GET'])
def get_nexus_fabrics():
    """Get all fabrics from Nexus Dashboard"""
    try:
        client = get_nexus_client()
        fabrics = client.get_fabrics()

        if fabrics is not None:
            return jsonify({
                'status': 'success',
                'data': fabrics
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve fabrics'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve fabrics: {str(e)}'
        }), 500


@nexus_bp.route('/fabric/<fabric_name>', methods=['GET'])
def get_nexus_fabric(fabric_name):
    """
    Get specific fabric details from Nexus Dashboard
    ---
    tags:
      - Nexus Dashboard
    summary: Get fabric details
    description: Retrieves detailed information about a specific fabric
    parameters:
      - name: fabric_name
        in: path
        type: string
        required: true
        description: Name of the fabric to retrieve
        example: "nac-tf-fabric1"
    responses:
      200:
        description: Fabric details retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: object
              properties:
                fabricName:
                  type: string
                  example: "nac-tf-fabric1"
                fabricId:
                  type: string
                  example: "FABRIC-2"
                fabricTechnology:
                  type: string
                  example: "VXLANFabric"
                fabricType:
                  type: string
                  example: "Switch_Fabric"
                asn:
                  type: string
                  example: "65001"
                deviceType:
                  type: string
                  example: "n9k"
                networkTemplate:
                  type: string
                  example: "Default_Network_Universal"
                vrfTemplate:
                  type: string
                  example: "Default_VRF_Universal"
                createdOn:
                  type: integer
                  example: 1759420239605
                modifiedOn:
                  type: integer
                  example: 1759859372294
      500:
        description: Failed to retrieve fabric
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Failed to retrieve fabric: Connection error"
    """
    try:
        client = get_nexus_client()
        fabric = client.get_fabric(fabric_name)

        if fabric is not None:
            return jsonify({
                'status': 'success',
                'data': fabric
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve fabric {fabric_name}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve fabric: {str(e)}'
        }), 500


@nexus_bp.route('/fabrics/<fabric_name>/switches', methods=['GET'])
def get_nexus_switches(fabric_name):
    """
    Get switches for a specific fabric
    ---
    tags:
      - Nexus Dashboard
    summary: Get fabric switches
    description: Retrieves list of switches in a specific fabric
    parameters:
      - name: fabric_name
        in: path
        type: string
        required: true
        description: Name of the fabric
        example: "nac-tf-fabric1"
    responses:
      200:
        description: Switches retrieved successfully
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
                  hostName:
                    type: string
                    example: "nac-tf-nd-b1"
                  ipAddress:
                    type: string
                    example: "10.15.37.103"
                  model:
                    type: string
                    example: "N9K-C9300v"
                  serialNumber:
                    type: string
                    example: "91Z71J0CAD0"
                  switchRole:
                    type: string
                    enum: [spine, leaf, border]
                    example: "border"
                  status:
                    type: string
                    enum: [ok, minor, major, critical]
                    example: "ok"
                  release:
                    type: string
                    example: "10.5(2)"
                  upTimeStr:
                    type: string
                    example: "20 days, 02:59:13"
      500:
        description: Failed to retrieve switches
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Failed to retrieve switches for fabric nac-tf-fabric1"
    """
    try:
        client = get_nexus_client()
        switches = client.get_switches(fabric_name)

        if switches is not None:
            return jsonify({
                'status': 'success',
                'data': switches
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve switches for fabric {fabric_name}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve switches: {str(e)}'
        }), 500


@nexus_bp.route('/fabrics/<fabric_name>/vrfs', methods=['GET'])
def get_nexus_vrfs(fabric_name):
    """Get VRFs for a specific fabric"""
    try:
        client = get_nexus_client()
        vrfs = client.get_vrfs(fabric_name)

        if vrfs is not None:
            return jsonify({
                'status': 'success',
                'data': vrfs
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve VRFs for fabric {fabric_name}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve VRFs: {str(e)}'
        }), 500


@nexus_bp.route('/fabrics/<fabric_name>/networks', methods=['GET'])
def get_nexus_networks(fabric_name):
    """Get networks for a specific fabric"""
    try:
        client = get_nexus_client()
        networks = client.get_networks(fabric_name)

        if networks is not None:
            return jsonify({
                'status': 'success',
                'data': networks
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve networks for fabric {fabric_name}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve networks: {str(e)}'
        }), 500


@nexus_bp.route('/fabrics/<fabric_name>/inventory', methods=['GET'])
def get_nexus_inventory(fabric_name):
    """Get inventory for a specific fabric"""
    try:
        client = get_nexus_client()
        inventory = client.get_fabric_inventory(fabric_name)

        if inventory is not None:
            return jsonify({
                'status': 'success',
                'data': inventory
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve inventory for fabric {fabric_name}'
            }), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve inventory: {str(e)}'
        }), 500
