"""
NaC API Client
Handles authentication and API interactions with Network-as-Code API
"""

import requests
import yaml
import os
import json
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_NACAPI_DEBUG = os.environ.get("NACAPI_DEBUG", "1") != "0"


def _nacapi_print(method: str, url: str, payload: Any = None, status: int = None, response_body: Any = None):
    """Print NaC API interactions to stdout for demo visibility."""
    if not _NACAPI_DEBUG:
        return
    sep = "─" * 72
    print(f"\n{sep}")
    print(f"[NaC API] {method}  {url}")
    if payload is not None:
        print("[NaC API] REQUEST PAYLOAD:")
        print(json.dumps(payload, indent=2))
    if status is not None:
        print(f"[NaC API] RESPONSE STATUS: {status}")
    if response_body is not None:
        body_str = json.dumps(response_body, indent=2) if isinstance(response_body, (dict, list)) else str(response_body)
        # Truncate very large responses so the terminal stays readable
        if len(body_str) > 2000:
            body_str = body_str[:2000] + "\n... (truncated)"
        print("[NaC API] RESPONSE BODY:")
        print(body_str)
    print(sep)


class NacApiClient:
    """Client for interacting with Network-as-Code API"""

    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None,
                 scm_provider: Optional[str] = None, scm_api_url: Optional[str] = None,
                 repository_url: Optional[str] = None, data_sources_dir: Optional[str] = None):
        """
        Initialize NaC API client

        Args:
            api_url: Base URL for NaC API (e.g., https://nd-api.example.com)
            api_key: API key for authentication
            scm_provider: SCM provider (github, gitlab, bitbucket_cloud, bitbucket_local, azure_devops)
            scm_api_url: SCM API URL (e.g., https://api.github.com)
            repository_url: Repository path inside the SCM (e.g., username/repo-name)
            data_sources_dir: Directory path containing data sources
        """
        self.api_url = api_url
        self.api_key = api_key
        self.scm_provider = scm_provider
        self.scm_api_url = scm_api_url
        self.repository_url = repository_url
        self.data_sources_dir = data_sources_dir
        self.session = requests.Session()

        # Load from config if parameters not provided
        if not all([self.api_url, self.api_key]):
            self._load_config()

        # Set authentication headers if credentials available
        self._set_auth_headers()

    def _load_config(self):
        """Load configuration from YAML file"""
        try:
            # Navigate from src/nac_nd_gui/ up to project root, then to yaml/
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            config_path = os.path.join(project_root, 'yaml', 'config.yaml')

            if not os.path.exists(config_path):
                logger.warning("Configuration file not found. Please configure via Admin panel.")
                return

            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)

            if config and 'nac' in config:
                nac_config = config['nac']
                self.api_url = self.api_url or nac_config.get('api_url', '')
                self.api_key = self.api_key or nac_config.get('api_key', '')
                self.scm_provider = self.scm_provider or nac_config.get('scm_provider', '')
                self.scm_api_url = self.scm_api_url or nac_config.get('scm_api_url', '')
                self.repository_url = self.repository_url or nac_config.get('repository_url', '')
                self.data_sources_dir = self.data_sources_dir or nac_config.get('data_sources_dir', '')

                logger.info("NaC API configuration loaded successfully")
                logger.info(f"API URL: {self.api_url}")
                logger.info(f"SCM Provider: {self.scm_provider}")
                logger.info(f"SCM API URL: {self.scm_api_url}")
                if self.api_key:
                    logger.info(f"API Key: {self.api_key[0:10]}...")
        except Exception as e:
            logger.error(f"Failed to load configuration: {str(e)}")

    def _ensure_config(self) -> tuple[bool, str]:
        """
        Ensure required configuration is present

        Returns:
            Tuple of (is_configured, error_message)
        """
        missing_fields = []

        if not self.api_url:
            missing_fields.append("NAC-API URL")
        if not self.api_key:
            missing_fields.append("Passthrough API Key")
        if not self.scm_provider:
            missing_fields.append("SCM Provider")
        if not self.scm_api_url:
            missing_fields.append("SCM API URL")

        if missing_fields:
            error_msg = f"NaC API configuration incomplete. Missing required fields: {', '.join(missing_fields)}. Please configure in Admin panel."
            logger.error(error_msg)
            return False, error_msg

        return True, ""

    def _set_auth_headers(self):
        """Set authentication headers for API requests"""
        if self.api_key and self.scm_provider:
            # Build x-git-config header
            git_config_parts = []
            if self.scm_api_url:
                git_config_parts.append(f"api_url={self.scm_api_url}")
            if self.repository_url:
                git_config_parts.append(f"repository={self.repository_url}")
            if self.data_sources_dir:
                git_config_parts.append(f"data_sources={self.data_sources_dir}")
            if self.scm_provider:
                git_config_parts.append(f"type={self.scm_provider}")

            git_config = ";".join(git_config_parts)

            self.session.headers.update({
                'Authorization': f'passthrough {self.api_key}',
                'x-git-config': git_config,
                'Content-Type': 'application/json'
            })
            logger.info("Authentication headers set successfully")

    def get(self, endpoint: str, params: Optional[Dict] = None, empty_on_404: bool = False) -> Optional[Dict[str, Any]]:
        """
        Make GET request to NaC API

        Args:
            endpoint: API endpoint (e.g., '/api/v1/operations/read')
            params: Optional query parameters
            empty_on_404: If True, return an empty list when the API returns 404
                          (useful for collection endpoints where no items yet exist)

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.get(url, params=params, verify=False, timeout=30)

            if response.status_code == 200:
                data = response.json()
                _nacapi_print("GET", url, status=response.status_code, response_body=data)
                return data
            elif response.status_code == 404 and empty_on_404:
                logger.info(f"GET {endpoint} returned 404 (no items exist yet), returning empty list")
                _nacapi_print("GET", url, status=response.status_code, response_body=[])
                return []
            else:
                logger.error(f"GET request failed: {response.status_code} - {response.text}")
                _nacapi_print("GET", url, status=response.status_code, response_body=response.text)
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"GET request failed: {str(e)}")
            return None

    def post(self, endpoint: str, data: Dict[str, Any], params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make POST request to NaC API

        Args:
            endpoint: API endpoint
            data: Request payload
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        try:
            url = f"{self.api_url}{endpoint}"
            _nacapi_print("POST", url, payload=data)
            response = self.session.post(url, json=data, params=params, verify=False, timeout=30)

            if response.status_code in [200, 201]:
                resp_data = response.json()
                _nacapi_print("POST", url, status=response.status_code, response_body=resp_data)
                return resp_data
            elif response.status_code == 204:
                # 204 No Content - successful but no body to return
                _nacapi_print("POST", url, status=response.status_code, response_body="(no content)")
                return {'status': 'success', 'message': 'Operation completed successfully'}
            else:
                logger.error(f"POST request failed: {response.status_code} - {response.text}")
                _nacapi_print("POST", url, status=response.status_code, response_body=response.text)
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"POST request failed: {str(e)}")
            return None

    def put(self, endpoint: str, data: Dict[str, Any], params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make PUT request to NaC API

        Args:
            endpoint: API endpoint
            data: Request payload
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.put(url, json=data, params=params, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 204:
                # 204 No Content - successful but no body to return
                return {'status': 'success', 'message': 'Operation completed successfully'}
            else:
                logger.error(f"PUT request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"PUT request failed: {str(e)}")
            return None

    def delete(self, endpoint: str, params: Optional[Dict] = None) -> bool:
        """
        Make DELETE request to NaC API

        Args:
            endpoint: API endpoint
            params: Optional query parameters

        Returns:
            True if deletion successful, False otherwise
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return False

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.delete(url, params=params, verify=False, timeout=30)

            if response.status_code in [200, 204]:
                return True
            else:
                logger.error(f"DELETE request failed: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"DELETE request failed: {str(e)}")
            return False

    # Convenience methods for common NaC API operations

    def read_data_model(self) -> Optional[Dict[str, Any]]:
        """
        Read the complete data model from NaC API

        Returns:
            Complete data model or None if request failed
        """
        return self.get('/api/v1/operations/read')

    def get_data_model_summary(self) -> Optional[Dict[str, Any]]:
        """
        Get a summary of the data model (lightweight version)

        Returns:
            Data model summary or None if request failed
        """
        response = self.get('/api/v1/operations/read')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None

    def get_fabric_details(self) -> Optional[Dict[str, Any]]:
        """
        Get fabric details from vxlan/global and vxlan/fabric endpoints

        Returns:
            Combined fabric details or None if request failed
        """
        logger.info("Fetching fabric details from NaC API")

        try:
            # Fetch global data
            global_response = self.get('/api/v1/operations/read?path=vxlan/global')
            # Fetch fabric data
            fabric_response = self.get('/api/v1/operations/read?path=vxlan/fabric')

            if global_response is None and fabric_response is None:
                logger.error("Failed to retrieve both global and fabric data from NaC API")
                return None

            # Combine the responses
            result = {
                'global': global_response if global_response else {},
                'fabric': fabric_response if fabric_response else {}
            }

            logger.info("Successfully retrieved fabric details")
            return result

        except Exception as e:
            logger.error(f"Error retrieving fabric details: {str(e)}", exc_info=True)
            return None

    def get_data_model_global(self) -> Optional[Dict[str, Any]]:
        """
        Get a global summary of the data model (lightweight version)

        Returns:
            Global summary of the data model or None if request failed
        """
        response = self.get('/api/v1/operations/read?path=vxlan/global')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None

    def get_data_model_vrfs(self) -> Optional[Dict[str, Any]]:
        """
        Get a list of all VRFs in the data model (lightweight version)

        Returns:
            List of VRFs or None if request failed
        """
        response = self.get('/api/v1/operations/read?path=vxlan/overlay/vrfs')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None

    def get_vrfs_for_table(self) -> Optional[list]:
        """
        Get VRFs formatted for table display

        Returns:
            List of VRF dictionaries formatted for Tabulator, or None if request failed
        """
        logger.info("Fetching VRFs from NaC API for table display")
        response = self.get('/api/v1/operations/read?path=vxlan/overlay/vrfs', empty_on_404=True)

        if response is None:
            logger.error("Failed to retrieve VRF data from NaC API")
            return None

        # Response is always a list of dictionaries
        if not isinstance(response, list):
            logger.error(f"Unexpected response type: {type(response)}. Expected list of dictionaries.")
            return None

        logger.info(f"Processing {len(response)} VRFs from API response")

        vrf_list = []
        try:
            for vrf_data in response:
                vrf_entry = self._transform_vrf_entry(vrf_data)
                vrf_list.append(vrf_entry)

            logger.info(f"Successfully transformed {len(vrf_list)} VRFs for table display")
            return vrf_list

        except Exception as e:
            logger.error(f"Error transforming VRF data: {str(e)}", exc_info=True)
            return None

    def _transform_vrf_entry(self, vrf_data: Any, vrf_name: str = None) -> Dict[str, Any]:
        """
        Transform a single VRF entry to table format

        Args:
            vrf_data: VRF data (dict or other)
            vrf_name: Optional VRF name if not in vrf_data

        Returns:
            Transformed VRF entry dict with original data preserved
        """
        # Handle case where vrf_data might not be a dict
        if not isinstance(vrf_data, dict):
            logger.warning(f"VRF data is not a dict: {type(vrf_data)}")
            return {
                'name': vrf_name or 'N/A',
                'vrf_id': 'N/A',
                'vlan_id': 'N/A',
                'vrf_attach_group': 'N/A',
                '_originalData': {}
            }

        # Extract name with fallbacks
        name = vrf_data.get('name') or vrf_data.get('vrf_name') or vrf_name or 'N/A'

        return {
            'name': name,
            'vrf_id': vrf_data.get('vrf_id') or vrf_data.get('id', 'N/A'),
            'vlan_id': vrf_data.get('vlan_id', 'N/A'),
            'vrf_attach_group': vrf_data.get('vrf_attach_group', 'N/A'),
            '_originalData': vrf_data  # Store complete API response data
        }

    def get_data_model_networks(self) -> Optional[Dict[str, Any]]:
        """
        Get a list of all networks in the data model (lightweight version)

        Returns:
            List of networks or None if request failed
        """
        response = self.get('/api/v1/operations/read?path=vxlan/overlay/networks')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None

    def get_data_model_network_attachments(self) -> Optional[Dict[str, Any]]:
        """
        Get a list of all network attach group in the data model (lightweight version)

        Returns:
            List of network attach groups or None if request failed
        """
        response = self.get('/api/v1/operations/read?path=vxlan/overlay/network_attach_groups')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None


    def get_network_attach_groups_full(self) -> Optional[list]:
        """
        Get Network Attach Groups with full details

        Returns:
            List of network attach group dictionaries with 'name' field, or None if request failed
        """
        logger.info("Fetching Network Attach Groups from NaC API")
        response = self.get('/api/v1/operations/read?path=vxlan/overlay/network_attach_groups')

        if response is None:
            logger.error("Failed to retrieve network attach groups from NaC API")
            return None

        # Response is always a list of dictionaries
        if not isinstance(response, list):
            logger.error(f"Unexpected response type: {type(response)}. Expected list of dictionaries.")
            return None

        logger.info(f"Processing {len(response)} network attach groups from API response")

        # Extract just the names for dropdown
        attach_groups_list = []
        for group in response:
            if isinstance(group, dict) and 'name' in group:
                attach_groups_list.append({
                    'name': group['name']
                })

        logger.info(f"Returning {len(attach_groups_list)} network attach groups")
        return attach_groups_list


    def get_networks_for_table(self) -> Optional[list]:
        """
        Get Networks formatted for table display

        Returns:
            List of network dictionaries formatted for Tabulator, or None if request failed
        """
        logger.info("Fetching Networks from NaC API for table display")
        response = self.get('/api/v1/operations/read?path=vxlan/overlay/networks', empty_on_404=True)

        if response is None:
            logger.error("Failed to retrieve network data from NaC API")
            return None

        # Response is always a list of dictionaries
        if not isinstance(response, list):
            logger.error(f"Unexpected response type: {type(response)}. Expected list of dictionaries.")
            return None

        logger.info(f"Processing {len(response)} networks from API response")

        network_list = []
        try:
            for network_data in response:
                network_entry = self._transform_network_entry(network_data)
                network_list.append(network_entry)

            logger.info(f"Successfully transformed {len(network_list)} networks for table display")
            return network_list

        except Exception as e:
            logger.error(f"Error transforming network data: {str(e)}", exc_info=True)
            return None

    def _transform_network_entry(self, network_data: Any, network_name: str = None) -> Dict[str, Any]:
        """
        Transform a single network entry to table format

        Args:
            network_data: Network data (dict or other)
            network_name: Optional network name if not in network_data

        Returns:
            Transformed network entry dict with original data preserved
        """
        if not isinstance(network_data, dict):
            logger.warning(f"Network data is not a dict: {type(network_data)}")
            return {
                'name': network_name or 'N/A',
                'network_id': 'N/A',
                'vlan_id': 'N/A',
                'vrf_name': 'N/A',
                '_originalData': {}
            }

        # Extract name with fallbacks
        name = network_data.get('name') or network_data.get('network_name') or network_name or 'N/A'

        return {
            'name': name,
            'network_id': network_data.get('network_id') or network_data.get('id', 'N/A'),
            'vlan_id': network_data.get('vlan_id', 'N/A'),
            'vrf_name': network_data.get('vrf_name', 'N/A'),
            '_originalData': network_data  # Store complete API response data
        }

    def get_data_model_switches(self) -> Optional[Dict[str, Any]]:
        """
        Get a list of all switches in the data model (lightweight version)

        Returns:
            List of switches or None if request failed
        """
        response = self.get('/api/v1/operations/read?path=vxlan/topology/switches')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None

    def get_switches_for_table(self) -> Optional[list]:
        """
        Get Switches formatted for table display

        Returns:
            List of switch dictionaries formatted for Tabulator, or None if request failed
        """
        logger.info("Fetching Switches from NaC API for table display")
        response = self.get('/api/v1/operations/read?path=vxlan/topology/switches')

        if response is None:
            logger.error("Failed to retrieve switch data from NaC API")
            return None

        # Response is always a list of dictionaries
        if not isinstance(response, list):
            logger.error(f"Unexpected response type: {type(response)}. Expected list of dictionaries.")
            return None

        logger.info(f"Processing {len(response)} switches from API response")

        switch_list = []
        try:
            for switch_data in response:
                switch_entry = self._transform_switch_entry(switch_data)
                switch_list.append(switch_entry)

            logger.info(f"Successfully transformed {len(switch_list)} switches for table display")
            return switch_list

        except Exception as e:
            logger.error(f"Error transforming switch data: {str(e)}", exc_info=True)
            return None

    def _transform_switch_entry(self, switch_data: Any, switch_name: str = None) -> Dict[str, Any]:
        """
        Transform a single switch entry to table format

        Args:
            switch_data: Switch data (dict or other)
            switch_name: Optional switch name if not in switch_data

        Returns:
            Transformed switch entry dict with original data preserved
        """
        if not isinstance(switch_data, dict):
            logger.warning(f"Switch data is not a dict: {type(switch_data)}")
            return {
                'hostname': switch_name or 'N/A',
                'role': 'N/A',
                'serial': 'N/A',
                'mgmt_ip': 'N/A',
                '_originalData': {}
            }

        # Extract hostname with fallbacks
        hostname = switch_data.get('hostname') or switch_data.get('name') or switch_name or 'N/A'

        return {
            'hostname': hostname,
            'role': switch_data.get('role', 'N/A'),
            'serial': switch_data.get('serial_number') or switch_data.get('serial', 'N/A'),
            'mgmt_ip': switch_data.get('mgmt_ip') or switch_data.get('management_ip', 'N/A'),
            '_originalData': switch_data  # Store complete API response data
        }

    def get_interfaces_for_table(self) -> Optional[list]:
        """
        Get Interfaces formatted for table display
        Extracts interfaces from switches (interfaces are nested under switches)

        Returns:
            List of interface dictionaries formatted for Tabulator, or None if request failed
        """
        logger.info("Fetching Interfaces from NaC API for table display")
        # Interfaces are nested under switches in the data model
        response = self.get('/api/v1/operations/read?path=vxlan/topology/switches')

        if response is None:
            logger.error("Failed to retrieve switch data from NaC API")
            return None

        # Response is always a list of dictionaries (switches)
        if not isinstance(response, list):
            logger.error(f"Unexpected response type: {type(response)}. Expected list of dictionaries.")
            return None

        logger.info(f"Processing interfaces from {len(response)} switches")

        interface_list = []
        try:
            # Extract interfaces from each switch
            for switch_data in response:
                if not isinstance(switch_data, dict):
                    logger.warning(f"Switch data is not a dict: {type(switch_data)}")
                    continue

                # Get switch hostname for grouping
                switch_hostname = switch_data.get('hostname') or switch_data.get('name') or 'Unknown Switch'

                # Get interfaces from this switch
                interfaces = switch_data.get('interfaces', [])
                if not isinstance(interfaces, list):
                    logger.warning(f"Interfaces for {switch_hostname} is not a list: {type(interfaces)}")
                    continue

                # Transform each interface
                for interface_data in interfaces:
                    interface_entry = self._transform_interface_entry(interface_data, switch_hostname)
                    interface_list.append(interface_entry)

            logger.info(f"Successfully transformed {len(interface_list)} interfaces for table display")
            return interface_list

        except Exception as e:
            logger.error(f"Error transforming interface data: {str(e)}", exc_info=True)
            return None

    def _transform_interface_entry(self, interface_data: Any, switch_hostname: str) -> Dict[str, Any]:
        """
        Transform a single interface entry to table format

        Args:
            interface_data: Interface data (dict or other)
            switch_hostname: Hostname of the switch this interface belongs to

        Returns:
            Transformed interface entry dict with original data preserved
        """
        if not isinstance(interface_data, dict):
            logger.warning(f"Interface data is not a dict: {type(interface_data)}")
            return {
                'switch_hostname': switch_hostname,
                'name': 'N/A',
                'mode': 'N/A',
                'description': '',
                '_originalData': {}
            }

        # Extract interface name with fallbacks
        name = interface_data.get('name') or interface_data.get('interface_name') or 'N/A'

        return {
            'switch_hostname': switch_hostname,  # For grouping
            'name': name,
            'mode': interface_data.get('mode', 'N/A'),
            'description': interface_data.get('description', ''),
            '_originalData': interface_data  # Store complete API response data
        }

    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to NaC API and verify configuration

        Returns:
            Dictionary with status and message
        """
        is_configured, error_msg = self._ensure_config()
        if not is_configured:
            return {
                'status': 'error',
                'message': error_msg
            }

        try:
            # Log connection attempt details
            test_url = f"{self.api_url}/api/v1/operations/read"
            logger.info(f"Testing connection to: {test_url}")
            logger.info(f"Authentication: passthrough {self.api_key[:10] if self.api_key else 'None'}...")
            logger.info(f"x-git-config: api_url={self.scm_api_url};repository={self.repository_url};type={self.scm_provider}")

            # Try to read data model as a connection test
            response = self.session.get(
                test_url,
                verify=False,
                timeout=10
            )

            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {dict(response.headers)}")

            if response.status_code in [200, 201]:
                return {
                    'status': 'success',
                    'message': f'Successfully connected to NaC API ({self.scm_provider})',
                    'scm_api_url': self.scm_api_url,
                    'scm_provider': self.scm_provider,
                    'size_of_data_model': len(response.content)
                }
            else:
                logger.error(f"Response body: {response.text[:500]}")
                return {
                    'status': 'error',
                    'message': f'NaC API returned status code {response.status_code}: {response.text[:200]}'
                }

        except requests.exceptions.Timeout:
            return {
                'status': 'error',
                'message': 'Connection test failed: Request timeout (10s)'
            }
        except requests.exceptions.ConnectionError:
            return {
                'status': 'error',
                'message': 'Connection test failed: Unable to connect to NaC API'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }

    # Generic NaC API operation methods

    def _operation_request(self, operation_type: str, path: str, data: Any,
                          change_message: Optional[str] = None,
                          apply: bool = False,
                          apply_message: Optional[str] = None,
                          changeset: Optional[str] = None,
                          source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Generic method to handle NaC API operations

        Args:
            operation_type: Type of operation (batch, merge, replace, delete, create, apply)
            path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
            data: Data payload for the operation
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        # Build operation payload
        operation_payload = {
            "operation": {
                "type": operation_type,
                "path": path,
                "data": data if isinstance(data, list) else [data],
            }
        }

        # Add optional fields
        if change_message:
            operation_payload["operation"]["change_message"] = change_message

        if apply is not None:
            operation_payload["operation"]["apply"] = apply

        if apply_message:
            operation_payload["operation"]["apply_message"] = apply_message

        if changeset:
            operation_payload["operation"]["changeset"] = changeset

        if source:
            operation_payload["source"] = source

        # Call the operation endpoint
        endpoint = f"/api/v1/operations/{operation_type}"
        logger.info(f"Calling {operation_type} operation on path '{path}'")

        return self.post(endpoint, data=operation_payload)

    def batch_operation(self, changes: list,
                       changeset: Optional[str] = None,
                       apply: bool = False,
                       apply_message: Optional[str] = None,
                       source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a batch operation on NaC API

        Batch operations allow multiple changes (create, merge, replace, delete) to be submitted together.

        Args:
            changes: List of change dictionaries, each containing:
                - type: Operation type (create, merge, replace, delete)
                - path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
                - change_message: Optional message describing the change
                - data: Data payload (for create/merge/replace operations)
                - file: Optional file reference
            changeset: Optional changeset identifier
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            source: Optional source information (dict with 'name' and 'repository' keys)

        Returns:
            Response JSON data or None if request failed

        Example:
            changes = [
                {
                    "type": "merge",
                    "path": "vxlan/overlay/vrfs",
                    "change_message": "Add VRF_PROD",
                    "data": {"name": "VRF_PROD", "vrf_id": 50001, "vlan_id": 2001}
                },
                {
                    "type": "merge",
                    "path": "vxlan/overlay/networks",
                    "change_message": "Add NET_PROD_WEB",
                    "data": {"name": "NET_PROD_WEB", "vrf_name": "VRF_PROD", ...}
                }
            ]
            client.batch_operation(changes, apply=False)
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        # Build batch operation payload
        batch_payload = {
            "operation": {
                "changes": changes,
                "apply": apply
            }
        }

        # Add optional fields
        if changeset:
            batch_payload["operation"]["changeset"] = changeset

        if apply_message:
            batch_payload["operation"]["apply_message"] = apply_message

        if source:
            batch_payload["source"] = source

        # Call the batch operation endpoint
        logger.info(f"Calling batch operation with {len(changes)} changes")

        return self.post("/api/v1/operations/batch", data=batch_payload)

    def merge_operation(self, path: str, data: Any,
                       change_message: Optional[str] = None,
                       apply: bool = False,
                       apply_message: Optional[str] = None,
                       changeset: Optional[str] = None,
                       source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a merge operation on NaC API

        Args:
            path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
            data: Data payload for the merge operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            changeset: Optional git branch name for the change
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("merge", path, data, change_message, apply, apply_message, changeset, source)

    def replace_operation(self, path: str, data: Any,
                         change_message: Optional[str] = None,
                         apply: bool = False,
                         apply_message: Optional[str] = None,
                         source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a replace operation on NaC API

        Args:
            path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
            data: Data payload for the replace operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("replace", path, data, change_message, apply, apply_message, source)

    def delete_operation(self, path: str, data: Any,
                        change_message: Optional[str] = None,
                        apply: bool = False,
                        apply_message: Optional[str] = None,
                        source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a delete operation on NaC API

        Args:
            path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
            data: Data payload for the delete operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("delete", path, data, change_message, apply, apply_message, source)

    def create_operation(self, path: str, data: Any,
                        change_message: Optional[str] = None,
                        apply: bool = False,
                        apply_message: Optional[str] = None,
                        source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a create operation on NaC API

        Args:
            path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
            data: Data payload for the create operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("create", path, data, change_message, apply, apply_message, source)

    def apply_operation(self, path: str, data: Any,
                       change_message: Optional[str] = None,
                       apply: bool = False,
                       apply_message: Optional[str] = None,
                       source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute an apply operation on NaC API

        Args:
            path: Path within the data model (e.g., 'vxlan/overlay/vrfs')
            data: Data payload for the apply operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_message: Optional message for the apply operation
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("apply", path, data, change_message, apply, apply_message, source)

    def close(self):
        """Close the session"""
        self.session.close()


# Singleton instance for reuse across the application
_nac_client_instance = None


def get_nac_client(reload_config: bool = False) -> NacApiClient:
    """
    Get or create singleton NaC API client instance

    Args:
        reload_config: If True, force reload of configuration from file

    Returns:
        NacApiClient instance
    """
    global _nac_client_instance

    if _nac_client_instance is None:
        _nac_client_instance = NacApiClient()
    elif reload_config:
        # Reload configuration for existing client
        _nac_client_instance._load_config()
        _nac_client_instance._set_auth_headers()
        logger.info("NaC API client configuration reloaded")

    return _nac_client_instance


def reset_nac_client():
    """
    Reset the singleton NaC API client instance.
    This forces a fresh client to be created on next get_nac_client() call.
    """
    global _nac_client_instance
    _nac_client_instance = None
    logger.info("NaC API client instance reset")
