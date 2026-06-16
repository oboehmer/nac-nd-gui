"""
NaC API endpoints for UI
"""
from flask import Blueprint, jsonify, request
from ...nac_api import get_nac_client
import logging
import yaml
from pathlib import Path
import re
import requests as _requests

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


@nac_bp.route('/interfaces/merge', methods=['POST'])
def merge_interfaces():
    """
    Merge interface changes to NaC topology (Pre-Approved Workflow)
    ---
    tags:
      - NaC API
    summary: Merge interface changes
    description: >
        Merges access/trunk interface configuration changes (descriptions, VLANs, enabled state)
        into the NaC topology data model. Used by the Pre-Approved Changes workflow.
        Accepts a list of switch objects each containing the modified interfaces.
        Internally decomposes the changes into a single batch operation, targeting each
        interface individually via selector paths
        (e.g. vxlan/topology/switches/name=LEAF1/interfaces/name=ethernet1%2F1).
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - data
          properties:
            data:
              type: array
              description: List of switch objects with modified interfaces
              items:
                type: object
            changeset:
              type: string
              description: Git branch name (derived from SNOW ticket #)
              example: "inc0012345-a3f"
            apply_message:
              type: string
              description: Commit message for the merge
              example: "Pre-Approved Interface Change via INC0012345"
            apply:
              type: boolean
              description: Whether to apply (provision) immediately after merge
              example: false
    responses:
      200:
        description: Interfaces merged successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
            changeset:
              type: string
            data:
              type: object
      400:
        description: Invalid request data
      500:
        description: Failed to merge interfaces
    """
    try:
        logger.info("Merge interfaces endpoint called (pre-approved workflow)")

        body = request.get_json()

        if not body:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        switch_data = body.get('data', [])
        if not switch_data:
            return jsonify({
                'status': 'error',
                'message': 'No interface changes provided in data array'
            }), 400

        changeset = body.get('changeset', '')
        apply_message = body.get('apply_message', f'Pre-Approved Interface Change via {changeset}')
        apply = body.get('apply', False)

        # Decompose into one batch change entry per interface, each targeting the
        # interface directly via a selector path so the NaC API performs a
        # targeted merge rather than a collection-level append.
        changes = []
        for switch in switch_data:
            switch_name = switch.get('name', '')
            for iface in switch.get('interfaces', []):
                iface_name = iface.get('name', '')
                # Slashes in interface names (e.g. ethernet1/1) must be percent-encoded
                # so they are treated as part of the selector value, not path separators.
                encoded_name = iface_name.replace('/', '%2F')
                changes.append({
                    "type": "merge",
                    "path": f"vxlan/topology/switches/name={switch_name}/interfaces/name={encoded_name}",
                    "data": iface,
                })

        if not changes:
            return jsonify({
                'status': 'error',
                'message': 'No interface changes found in data'
            }), 400

        logger.info(f"Batch-merging {len(changes)} interface(s) across {len(switch_data)} switch(es), "
                    f"changeset={changeset}, apply={apply}")

        client = get_nac_client()

        response = client.batch_operation(
            changes=changes,
            changeset=changeset,
            apply=apply,
            apply_message=apply_message,
        )

        if response is not None:
            return jsonify({
                'status': 'success',
                'message': f'{len(changes)} interface(s) merged successfully (changeset: {changeset})',
                'changeset': changeset,
                'data': response
            })
        else:
            logger.error("Failed to merge interfaces - NaC API returned None")
            return jsonify({
                'status': 'error',
                'message': 'Failed to merge interface changes in NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in merge interfaces endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to merge interfaces: {str(e)}'
        }), 500

# ---------------------------------------------------------------------------
# GET /api/v1/nac/pipeline-status?changeset=<branch>
# ---------------------------------------------------------------------------
@nac_bp.route('/pipeline-status', methods=['GET'])
def get_pipeline_status():
    """
    Get GitLab CI pipeline status for a changeset (branch).
    ---
    tags:
      - NaC API
    summary: Get GitLab pipeline status for a branch
    parameters:
      - in: query
        name: changeset
        required: true
        type: string
        description: Branch name (changeset) to query pipelines for
    responses:
      200:
        description: Pipeline status
      400:
        description: Missing changeset or not a GitLab provider
      502:
        description: GitLab API error
    """
    changeset = request.args.get('changeset', '').strip()
    if not changeset:
        return jsonify({'status': 'error', 'message': 'changeset query parameter is required'}), 400

    # Optional: only return a pipeline with id strictly greater than this value.
    # Used by the frontend to ensure each PipelineMonitor only latches onto its
    # own pipeline, not one created by a previous submit on the same branch.
    since_id = request.args.get('since_id', type=int, default=0)

    client = get_nac_client()
    scm_provider = client.scm_provider or ''
    if scm_provider != 'gitlab':
        return jsonify({
            'status': 'error',
            'message': f'Pipeline status is only supported for GitLab (configured provider: "{scm_provider}")'
        }), 400

    scm_api_url = (client.scm_api_url or '').rstrip('/')
    repository_url = client.repository_url or ''
    api_key = client.api_key or ''

    if not scm_api_url or not repository_url:
        return jsonify({'status': 'error', 'message': 'GitLab scm_api_url or repository_url not configured'}), 400

    encoded_path = repository_url.replace('/', '%2F')
    headers = {'PRIVATE-TOKEN': api_key} if api_key else {}

    try:
        # Fetch recent pipelines for the branch (sorted newest-first)
        # scm_api_url is already the full API base (e.g. http://gitlab/api/v4)
        pipelines_url = f"{scm_api_url}/projects/{encoded_path}/pipelines"
        resp = _requests.get(pipelines_url,
                             params={'ref': changeset, 'source': 'merge_request_event',
                                     'order_by': 'id', 'sort': 'desc', 'per_page': 20},
                             headers=headers, timeout=10)
        if not resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'GitLab API error {resp.status_code}: {resp.text[:200]}'
            }), 502

        pipelines = resp.json()
        if not pipelines:
            return jsonify({'status': 'ok', 'pipeline': None})

        # Find the newest pipeline that is strictly newer than since_id and was
        # not auto-canceled by GitLab immediately (canceled pipelines that lived
        # < 5 seconds are supersession artifacts — skip them).
        target = None
        for p in pipelines:  # already sorted newest-first
            if p['id'] <= since_id:
                break  # everything from here is older, no point continuing
            # Skip instant-canceled pipelines (GitLab auto-cancels superseded runs)
            created = p.get('created_at', '')
            updated = p.get('updated_at', '')
            if p['status'] == 'canceled' and created and updated and created == updated[:len(created)]:
                # Same-second cancel — very likely a supersession artifact; skip
                continue
            target = p
            break  # take the newest qualifying pipeline

        if not target:
            return jsonify({'status': 'ok', 'pipeline': None})

        pipeline_id = target['id']
        pipeline_status = target['status']
        pipeline_web_url = target.get('web_url', '')

        # Fetch jobs for the latest pipeline
        jobs_url = f"{scm_api_url}/projects/{encoded_path}/pipelines/{pipeline_id}/jobs"
        jobs_resp = _requests.get(jobs_url, params={'per_page': 100}, headers=headers, timeout=10)
        jobs = jobs_resp.json() if jobs_resp.ok else []

        # Group jobs by stage
        stages_map: dict = {}
        for job in jobs:
            stage = job.get('stage', 'unknown')
            if stage not in stages_map:
                stages_map[stage] = []
            stages_map[stage].append({
                'id': job.get('id'),
                'name': job.get('name'),
                'status': job.get('status'),
                'web_url': job.get('web_url', ''),
                'duration': job.get('duration'),
                'started_at': job.get('started_at'),
                'finished_at': job.get('finished_at'),
            })

        stages = [{'name': s, 'jobs': j} for s, j in stages_map.items()]

        return jsonify({
            'status': 'ok',
            'pipeline': {
                'id': pipeline_id,
                'status': pipeline_status,
                'web_url': pipeline_web_url,
                'ref': changeset,
                'stages': stages,
            }
        })

    except _requests.exceptions.ConnectionError as exc:
        return jsonify({'status': 'error', 'message': f'Cannot reach GitLab: {exc}'}), 502
    except Exception as exc:
        logger.error(f"pipeline-status error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500


# ---------------------------------------------------------------------------
# GET /api/v1/nac/pipelines?changeset=<branch>
# Returns all pipelines for a branch as a summary list (no job details).
# Used by the "Refresh pipeline state" button.
# ---------------------------------------------------------------------------
@nac_bp.route('/pipelines', methods=['GET'])
def list_pipelines():
    """
    List all pipelines for a branch (summary only, no job details).
    ---
    tags:
      - NaC API
    summary: List GitLab pipelines for a branch
    parameters:
      - in: query
        name: changeset
        required: true
        type: string
    responses:
      200:
        description: List of pipelines
      400:
        description: Missing changeset or not a GitLab provider
      502:
        description: GitLab API error
    """
    changeset = request.args.get('changeset', '').strip()
    if not changeset:
        return jsonify({'status': 'error', 'message': 'changeset query parameter is required'}), 400

    client = get_nac_client()
    scm_provider = client.scm_provider or ''
    if scm_provider != 'gitlab':
        return jsonify({'status': 'error', 'message': f'Pipeline status is only supported for GitLab (provider: "{scm_provider}")'}), 400

    scm_api_url = (client.scm_api_url or '').rstrip('/')
    repository_url = client.repository_url or ''
    api_key = client.api_key or ''
    encoded_path = repository_url.replace('/', '%2F')
    headers = {'PRIVATE-TOKEN': api_key} if api_key else {}

    try:
        resp = _requests.get(
            f"{scm_api_url}/projects/{encoded_path}/pipelines",
            params={'ref': changeset, 'source': 'merge_request_event',
                    'order_by': 'id', 'sort': 'desc', 'per_page': 20},
            headers=headers, timeout=10
        )
        if not resp.ok:
            return jsonify({'status': 'error', 'message': f'GitLab API error {resp.status_code}: {resp.text[:200]}'}), 502

        pipelines = [
            {'id': p['id'], 'status': p['status'], 'web_url': p.get('web_url', ''),
             'created_at': p.get('created_at', ''), 'updated_at': p.get('updated_at', '')}
            for p in resp.json()
        ]
        return jsonify({'status': 'ok', 'pipelines': pipelines})

    except _requests.exceptions.ConnectionError as exc:
        return jsonify({'status': 'error', 'message': f'Cannot reach GitLab: {exc}'}), 502
    except Exception as exc:
        logger.error(f"list-pipelines error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /api/v1/nac/apply
# ---------------------------------------------------------------------------
@nac_bp.route('/apply', methods=['POST'])
def apply_changeset():
    """
    Apply an existing changeset (branch) to production via NaC API.
    ---
    tags:
      - NaC API
    summary: Apply changeset to production
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - changeset
          properties:
            changeset:
              type: string
              description: Branch name to apply
            apply_message:
              type: string
              description: Merge commit message
    responses:
      200:
        description: Changeset applied successfully
      400:
        description: Missing changeset
      500:
        description: NaC API error
    """
    try:
        body = request.get_json() or {}
        changeset = body.get('changeset', '').strip()
        if not changeset:
            return jsonify({'status': 'error', 'message': 'changeset is required'}), 400

        apply_message = body.get('apply_message', f'Apply changeset {changeset} to production')

        client = get_nac_client()
        response = client.apply_changeset(changeset=changeset, apply_message=apply_message)

        if response is not None:
            return jsonify({
                'status': 'success',
                'message': f'Changeset "{changeset}" applied to production successfully',
                'changeset': changeset,
                'data': response,
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to apply changeset "{changeset}" — NaC API returned no response',
            }), 500

    except Exception as exc:
        logger.error(f"apply changeset error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500

