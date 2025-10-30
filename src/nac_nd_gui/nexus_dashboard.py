"""
Nexus Dashboard API Client
Handles authentication and API interactions with Cisco Nexus Dashboard
"""

import requests
import yaml
import os
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NexusDashboardClient:
    """Client for interacting with Cisco Nexus Dashboard API"""

    def __init__(self, base_url: Optional[str] = None, username: Optional[str] = None,
                 api_key: Optional[str] = None, fabric_name: Optional[str] = None):
        """
        Initialize Nexus Dashboard client

        Args:
            base_url: Base URL for Nexus Dashboard (e.g., https://nexus-dashboard.example.com)
            username: Username for authentication
            api_key: API key for authentication
            fabric_name: Specific fabric name to manage (optional)
        """
        self.base_url = base_url
        self.username = username
        self.api_key = api_key
        self.fabric_name = fabric_name
        self.session = requests.Session()

        # Load from config if parameters not provided
        if not all([self.base_url, self.username, self.api_key]):
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

            if config and 'nexus_dashboard' in config:
                nd_config = config['nexus_dashboard']
                self.base_url = self.base_url or nd_config.get('url', '')
                self.username = self.username or nd_config.get('username', '')
                self.api_key = self.api_key or nd_config.get('api_key', '')
                self.fabric_name = self.fabric_name or nd_config.get('fabric_name', '')

                logger.info("Nexus Dashboard configuration loaded successfully")
                logger.info(f"Base URL: {self.base_url}")
                logger.info(f"Username: {self.username}")
                logger.info(f"API Key: {self.api_key[0:10]}...")
                if self.fabric_name:
                    logger.info(f"Fabric Name: {self.fabric_name}")
        except Exception as e:
            logger.error(f"Failed to load configuration: {str(e)}")

    def _ensure_config(self) -> bool:
        """Ensure required configuration is present"""
        if not all([self.base_url, self.username, self.api_key]):
            logger.error("Nexus Dashboard not configured. Please configure via Admin panel.")
            return False
        return True

    def _set_auth_headers(self):
        """Set authentication headers for API requests"""
        if self.username and self.api_key:
            self.session.headers.update({
                'X-Nd-Username': self.username,
                'X-Nd-Apikey': self.api_key,
                'Content-Type': 'application/json'
            })
            logger.info("Authentication headers set successfully")

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make GET request to Nexus Dashboard API

        Args:
            endpoint: API endpoint (e.g., '/api/v1/sites')
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.get(url, params=params, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"GET request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"GET request failed: {str(e)}")
            return None

    def post(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Make POST request to Nexus Dashboard API

        Args:
            endpoint: API endpoint
            data: Request payload

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.post(url, json=data, verify=False, timeout=30)

            if response.status_code in [200, 201]:
                return response.json()
            else:
                logger.error(f"POST request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"POST request failed: {str(e)}")
            return None

    def put(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Make PUT request to Nexus Dashboard API

        Args:
            endpoint: API endpoint
            data: Request payload

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.put(url, json=data, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"PUT request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"PUT request failed: {str(e)}")
            return None

    def delete(self, endpoint: str) -> bool:
        """
        Make DELETE request to Nexus Dashboard API

        Args:
            endpoint: API endpoint

        Returns:
            True if deletion successful, False otherwise
        """
        if not self._ensure_config():
            return False

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.delete(url, verify=False, timeout=30)

            if response.status_code in [200, 204]:
                return True
            else:
                logger.error(f"DELETE request failed: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"DELETE request failed: {str(e)}")
            return False

    # Convenience methods for common Nexus Dashboard operations

    def get_sites(self) -> Optional[Dict[str, Any]]:
        """Get all sites from Nexus Dashboard"""
        return self.get('/api/v1/sites')

    def get_fabrics(self) -> Optional[Dict[str, Any]]:
        """Get all fabrics from Nexus Dashboard"""
        return self.get('/appcenter/cisco/ndfc/api/v1/lan-fabric/rest/control/fabrics') 

    def get_fabric(self, fabric_name: str) -> Optional[Dict[str, Any]]:
        """Get specific fabric from Nexus Dashboard"""
        return self.get(f'/appcenter/cisco/ndfc/api/v1/lan-fabric/rest/control/fabrics/{fabric_name}') 

    def get_fabric_inventory(self, fabric_name: str) -> Optional[Dict[str, Any]]:
        """Get fabric inventory"""
        return self.get(f'/appcenter/cisco/ndfc/api/v1/lan-fabric/rest/control/fabrics/{fabric_name}/inventory/switchesByFabric')

    def get_switches(self, fabric_name: str) -> Optional[Dict[str, Any]]:
        """Get switches for a specific fabric"""
        return self.get(f'/appcenter/cisco/ndfc/api/v1/lan-fabric/rest/control/fabrics/{fabric_name}/inventory/switchesByFabric')

    def get_vrfs(self, fabric_name: str) -> Optional[Dict[str, Any]]:
        """Get VRFs for a specific fabric"""
        return self.get(f'/appcenter/cisco/ndfc/api/v1/lan-fabric/rest/top-down/fabrics/{fabric_name}/vrfs')

    def get_networks(self, fabric_name: str) -> Optional[Dict[str, Any]]:
        """Get networks for a specific fabric"""
        return self.get(f'/appcenter/cisco/ndfc/api/v1/lan-fabric/rest/top-down/fabrics/{fabric_name}/networks')

    def get_configured_fabric(self) -> Optional[Dict[str, Any]]:
        """
        Get the configured fabric details by name

        Returns:
            Fabric details if configured fabric is found, None otherwise
        """
        if not self.fabric_name:
            logger.warning("No fabric name configured")
            return None

        # Get all fabrics
        fabrics_response = self.get_fabrics()
        if fabrics_response is None:
            return None

        # Handle both list and dict responses
        fabrics_list = []
        if isinstance(fabrics_response, list):
            fabrics_list = fabrics_response
        elif isinstance(fabrics_response, dict):
            fabrics_list = fabrics_response.get('fabrics', fabrics_response.get('data', []))

        # Find fabric by name
        for fabric in fabrics_list:
            if fabric.get('fabricName') == self.fabric_name or fabric.get('name') == self.fabric_name:
                logger.info(f"Found configured fabric: {self.fabric_name}")
                return fabric

        logger.warning(f"Configured fabric '{self.fabric_name}' not found")
        return None

    def get_configured_fabric_switches(self) -> Optional[Dict[str, Any]]:
        """Get switches for the configured fabric"""
        if not self.fabric_name:
            logger.warning("No fabric name configured")
            return None
        return self.get_switches(self.fabric_name)

    def get_configured_fabric_vrfs(self) -> Optional[Dict[str, Any]]:
        """Get VRFs for the configured fabric"""
        if not self.fabric_name:
            logger.warning("No fabric name configured")
            return None
        return self.get_vrfs(self.fabric_name)

    def get_configured_fabric_networks(self) -> Optional[Dict[str, Any]]:
        """Get networks for the configured fabric"""
        if not self.fabric_name:
            logger.warning("No fabric name configured")
            return None
        return self.get_networks(self.fabric_name)

    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to Nexus Dashboard and verify fabric configuration

        Returns:
            Dictionary with status and message
        """
        if not self._ensure_config():
            return {
                'status': 'error',
                'message': 'Nexus Dashboard not configured. Please configure via Admin panel.'
            }

        # Check if fabric name is configured - REQUIRED for successful test
        if not self.fabric_name:
            return {
                'status': 'error',
                'message': 'Fabric name not configured. Please enter a fabric name in the Admin panel before testing connection.'
            }

        try:
            # Try to get fabrics as a connection test
            fabrics = self.get_fabrics()
            if fabrics is not None:
                # Handle both list and dict responses
                if isinstance(fabrics, list):
                    fabric_count = len(fabrics)
                elif isinstance(fabrics, dict):
                    fabric_count = len(fabrics.get('fabrics', fabrics.get('data', [])))
                else:
                    fabric_count = 0

                # Check if the configured fabric exists
                configured_fabric = self.get_configured_fabric()
                if configured_fabric:
                    # Success - fabric found
                    return {
                        'status': 'success',
                        'message': f"Successfully connected to Nexus Dashboard and verified fabric '{self.fabric_name}'",
                        'fabrics_count': fabric_count,
                        'configured_fabric': self.fabric_name,
                        'fabric_found': True
                    }
                else:
                    # Failure - fabric not found
                    return {
                        'status': 'error',
                        'message': f"Connection successful but fabric '{self.fabric_name}' not found. Please verify the fabric name.",
                        'fabrics_count': fabric_count,
                        'configured_fabric': self.fabric_name,
                        'fabric_found': False
                    }
            else:
                return {
                    'status': 'error',
                    'message': 'Failed to connect. Please check credentials and URL.'
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }

    def close(self):
        """Close the session"""
        self.session.close()


# Singleton instance for reuse across the application
_nexus_client_instance = None


def get_nexus_client() -> NexusDashboardClient:
    """
    Get or create singleton Nexus Dashboard client instance

    Returns:
        NexusDashboardClient instance
    """
    global _nexus_client_instance

    if _nexus_client_instance is None:
        _nexus_client_instance = NexusDashboardClient()

    return _nexus_client_instance
