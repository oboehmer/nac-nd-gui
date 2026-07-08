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
        (e.g. vxlan/topology/switches/name=LEAF1/interfaces/name=ethernet1~11).
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
                # Interface names (e.g. ethernet1/1) must be JSON Pointer-encoded per
                # RFC 6901 so they are treated as part of the selector value, not path
                # separators. Order matters: encode '~' as '~0' first, then '/' as '~1'.
                encoded_name = iface_name.replace('~', '~0').replace('/', '~1')
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


# ---------------------------------------------------------------------------
# Git Revert Workflow Endpoints (GitLab API direct)
# ---------------------------------------------------------------------------

@nac_bp.route('/commits', methods=['GET'])
def list_commits():
    """
    List recent commits on main branch with pagination.
    ---
    tags:
      - NaC API
    summary: List recent commits on main
    description: Retrieves recent commits from the main branch using GitLab API with pagination support
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
        description: Page number for pagination
      - in: query
        name: per_page
        type: integer
        default: 15
        description: Number of commits per page
    responses:
      200:
        description: List of commits retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            commits:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  short_id:
                    type: string
                  title:
                    type: string
                  message:
                    type: string
                  author_name:
                    type: string
                  author_email:
                    type: string
                  authored_date:
                    type: string
                  committed_date:
                    type: string
            current_page:
              type: integer
            total_pages:
              type: integer
      400:
        description: Not a GitLab provider
      502:
        description: GitLab API error
    """
    page = request.args.get('page', type=int, default=1)
    per_page = request.args.get('per_page', type=int, default=15)

    client = get_nac_client()
    scm_provider = client.scm_provider or ''
    if scm_provider != 'gitlab':
        return jsonify({
            'status': 'error',
            'message': f'Commits endpoint is only supported for GitLab (configured provider: "{scm_provider}")'
        }), 400

    scm_api_url = (client.scm_api_url or '').rstrip('/')
    repository_url = client.repository_url or ''
    api_key = client.api_key or ''

    if not scm_api_url or not repository_url:
        return jsonify({'status': 'error', 'message': 'GitLab scm_api_url or repository_url not configured'}), 400

    encoded_path = repository_url.replace('/', '%2F')
    headers = {'PRIVATE-TOKEN': api_key} if api_key else {}

    try:
        commits_url = f"{scm_api_url}/projects/{encoded_path}/repository/commits"
        resp = _requests.get(
            commits_url,
            params={'ref_name': 'main', 'page': page, 'per_page': per_page},
            headers=headers,
            timeout=10
        )

        if not resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'GitLab API error {resp.status_code}: {resp.text[:200]}'
            }), 502

        commits = resp.json()

        # Extract pagination headers from GitLab response
        current_page = int(resp.headers.get('X-Page', page))
        total_pages = int(resp.headers.get('X-Total-Pages', 0))
        next_page = resp.headers.get('X-Next-Page', '').strip()
        has_next_page = bool(next_page) or (total_pages > 0 and current_page < total_pages)

        # If GitLab doesn't return X-Total-Pages, estimate from commit count
        if total_pages == 0:
            total_pages = current_page + (1 if len(commits) == per_page else 0)

        return jsonify({
            'status': 'ok',
            'commits': commits,
            'current_page': current_page,
            'total_pages': total_pages,
            'has_next_page': has_next_page,
        })

    except _requests.exceptions.ConnectionError as exc:
        return jsonify({'status': 'error', 'message': f'Cannot reach GitLab: {exc}'}), 502
    except Exception as exc:
        logger.error(f"list commits error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500


@nac_bp.route('/commits/<sha>/diff', methods=['GET'])
def get_commit_diff(sha):
    """
    Get the diff for a specific commit.
    ---
    tags:
      - NaC API
    summary: Get commit diff
    description: Retrieves the unified diff for a specific commit from GitLab
    parameters:
      - in: path
        name: sha
        type: string
        required: true
        description: Commit SHA to retrieve diff for
    responses:
      200:
        description: Commit diff retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            diffs:
              type: array
              items:
                type: object
                properties:
                  old_path:
                    type: string
                  new_path:
                    type: string
                  diff:
                    type: string
                  new_file:
                    type: boolean
                  renamed_file:
                    type: boolean
                  deleted_file:
                    type: boolean
      400:
        description: Not a GitLab provider
      502:
        description: GitLab API error
    """
    client = get_nac_client()
    scm_provider = client.scm_provider or ''
    if scm_provider != 'gitlab':
        return jsonify({
            'status': 'error',
            'message': f'Commit diff endpoint is only supported for GitLab (configured provider: "{scm_provider}")'
        }), 400

    scm_api_url = (client.scm_api_url or '').rstrip('/')
    repository_url = client.repository_url or ''
    api_key = client.api_key or ''

    if not scm_api_url or not repository_url:
        return jsonify({'status': 'error', 'message': 'GitLab scm_api_url or repository_url not configured'}), 400

    encoded_path = repository_url.replace('/', '%2F')
    headers = {'PRIVATE-TOKEN': api_key} if api_key else {}

    try:
        diff_url = f"{scm_api_url}/projects/{encoded_path}/repository/commits/{sha}/diff"
        resp = _requests.get(diff_url, headers=headers, timeout=10)

        if not resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'GitLab API error {resp.status_code}: {resp.text[:200]}'
            }), 502

        diffs = resp.json()
        return jsonify({'status': 'ok', 'diffs': diffs})

    except _requests.exceptions.ConnectionError as exc:
        return jsonify({'status': 'error', 'message': f'Cannot reach GitLab: {exc}'}), 502
    except Exception as exc:
        logger.error(f"get commit diff error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500


@nac_bp.route('/revert', methods=['POST'])
def revert_commit():
    """
    Orchestrate git revert workflow: create branch → revert commit → create MR.
    ---
    tags:
      - NaC API
    summary: Revert a commit
    description: |
      Creates a revert workflow by:
      1. Creating a new branch from main
      2. Reverting the specified commit onto that branch
      3. Creating a merge request to merge the revert back to main
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - sha
            - ticket
            - branch
          properties:
            sha:
              type: string
              description: Commit SHA to revert
              example: "abc123def456"
            ticket:
              type: string
              description: Service ticket number
              example: "INC0012345"
            branch:
              type: string
              description: Branch name for the revert
              example: "nac-revert-inc0012345-20260708120000"
    responses:
      200:
        description: Revert workflow completed successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            branch:
              type: string
            mr_iid:
              type: integer
            mr_url:
              type: string
      400:
        description: Invalid request or merge conflict
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
            conflict:
              type: boolean
      502:
        description: GitLab API error
    """
    try:
        body = request.get_json() or {}
        sha = body.get('sha', '').strip()
        ticket = body.get('ticket', '').strip()
        branch = body.get('branch', '').strip()

        if not sha or not ticket or not branch:
            return jsonify({
                'status': 'error',
                'message': 'sha, ticket, and branch are required'
            }), 400

        client = get_nac_client()
        scm_provider = client.scm_provider or ''
        if scm_provider != 'gitlab':
            return jsonify({
                'status': 'error',
                'message': f'Revert endpoint is only supported for GitLab (configured provider: "{scm_provider}")'
            }), 400

        scm_api_url = (client.scm_api_url or '').rstrip('/')
        repository_url = client.repository_url or ''
        api_key = client.api_key or ''

        if not scm_api_url or not repository_url:
            return jsonify({'status': 'error', 'message': 'GitLab scm_api_url or repository_url not configured'}), 400

        encoded_path = repository_url.replace('/', '%2F')
        headers = {'PRIVATE-TOKEN': api_key} if api_key else {}

        # Step 0: Fetch the original commit to get its title
        logger.info(f"Fetching commit {sha} details")
        commit_url = f"{scm_api_url}/projects/{encoded_path}/repository/commits/{sha}"
        commit_resp = _requests.get(commit_url, headers=headers, timeout=10)

        if not commit_resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'Failed to fetch commit details: GitLab API error {commit_resp.status_code}'
            }), 502

        commit_data = commit_resp.json()
        commit_title = commit_data.get('title', sha[:8])

        # Step 1: Create branch from main
        logger.info(f"Creating branch {branch} from main")
        branch_url = f"{scm_api_url}/projects/{encoded_path}/repository/branches"
        branch_resp = _requests.post(
            branch_url,
            json={'branch': branch, 'ref': 'main'},
            headers=headers,
            timeout=10
        )

        if not branch_resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'Failed to create branch: GitLab API error {branch_resp.status_code}: {branch_resp.text[:200]}'
            }), 502

        # Step 2: Revert the commit onto the new branch
        logger.info(f"Reverting commit {sha} onto branch {branch}")
        revert_url = f"{scm_api_url}/projects/{encoded_path}/repository/commits/{sha}/revert"
        revert_resp = _requests.post(
            revert_url,
            json={'branch': branch},
            headers=headers,
            timeout=10
        )

        if not revert_resp.ok:
            # Check for merge conflict (400 status)
            if revert_resp.status_code == 400:
                return jsonify({
                    'status': 'error',
                    'message': 'Cannot revert: merge conflict. This must be handled manually.',
                    'conflict': True
                }), 400

            return jsonify({
                'status': 'error',
                'message': f'Failed to revert commit: GitLab API error {revert_resp.status_code}: {revert_resp.text[:200]}'
            }), 502

        # Step 3: Create merge request
        logger.info(f"Creating merge request for branch {branch}")
        mr_title = f"Revert: [{ticket}] - {commit_title}"
        mr_description = f"Emergency revert of commit {sha} per service ticket {ticket}.\n\nOriginal commit: {sha}"

        mr_url = f"{scm_api_url}/projects/{encoded_path}/merge_requests"
        mr_resp = _requests.post(
            mr_url,
            json={
                'source_branch': branch,
                'target_branch': 'main',
                'title': mr_title,
                'description': mr_description
            },
            headers=headers,
            timeout=10
        )

        if not mr_resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'Failed to create merge request: GitLab API error {mr_resp.status_code}: {mr_resp.text[:200]}'
            }), 502

        mr_data = mr_resp.json()
        mr_iid = mr_data.get('iid')
        mr_web_url = mr_data.get('web_url', '')

        logger.info(f"Revert workflow completed: branch={branch}, MR={mr_iid}")
        return jsonify({
            'status': 'ok',
            'branch': branch,
            'mr_iid': mr_iid,
            'mr_url': mr_web_url
        })

    except _requests.exceptions.ConnectionError as exc:
        return jsonify({'status': 'error', 'message': f'Cannot reach GitLab: {exc}'}), 502
    except Exception as exc:
        logger.error(f"revert commit error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500


@nac_bp.route('/revert/merge', methods=['PUT'])
def merge_revert():
    """
    Merge a revert merge request.
    ---
    tags:
      - NaC API
    summary: Merge revert MR
    description: Merges a revert merge request back to main
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - mr_iid
          properties:
            mr_iid:
              type: integer
              description: Merge request IID to merge
              example: 42
    responses:
      200:
        description: Merge request merged successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            message:
              type: string
            merge_commit_sha:
              type: string
      400:
        description: Invalid request or not a GitLab provider
      502:
        description: GitLab API error
    """
    try:
        body = request.get_json() or {}
        mr_iid = body.get('mr_iid')

        if not mr_iid:
            return jsonify({
                'status': 'error',
                'message': 'mr_iid is required'
            }), 400

        client = get_nac_client()
        scm_provider = client.scm_provider or ''
        if scm_provider != 'gitlab':
            return jsonify({
                'status': 'error',
                'message': f'Merge revert endpoint is only supported for GitLab (configured provider: "{scm_provider}")'
            }), 400

        scm_api_url = (client.scm_api_url or '').rstrip('/')
        repository_url = client.repository_url or ''
        api_key = client.api_key or ''

        if not scm_api_url or not repository_url:
            return jsonify({'status': 'error', 'message': 'GitLab scm_api_url or repository_url not configured'}), 400

        encoded_path = repository_url.replace('/', '%2F')
        headers = {'PRIVATE-TOKEN': api_key} if api_key else {}

        logger.info(f"Merging revert MR {mr_iid}")
        merge_url = f"{scm_api_url}/projects/{encoded_path}/merge_requests/{mr_iid}/merge"
        merge_resp = _requests.put(merge_url, headers=headers, timeout=10)

        if not merge_resp.ok:
            return jsonify({
                'status': 'error',
                'message': f'Failed to merge MR: GitLab API error {merge_resp.status_code}: {merge_resp.text[:200]}'
            }), 502

        merge_data = merge_resp.json()
        merge_commit_sha = merge_data.get('merge_commit_sha', '')

        logger.info(f"Revert MR {mr_iid} merged successfully: {merge_commit_sha}")
        return jsonify({
            'status': 'ok',
            'message': 'Merge request merged successfully',
            'merge_commit_sha': merge_commit_sha
        })

    except _requests.exceptions.ConnectionError as exc:
        return jsonify({'status': 'error', 'message': f'Cannot reach GitLab: {exc}'}), 502
    except Exception as exc:
        logger.error(f"merge revert error: {exc}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(exc)}), 500

