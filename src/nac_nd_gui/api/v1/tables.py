"""
Table data API endpoints for UI
"""
from flask import Blueprint, jsonify
from ...auth import require_permission

tables_bp = Blueprint('tables', __name__)


@tables_bp.route('/recent-activity', methods=['GET'])
@require_permission('read')
def api_recent_activity():
    """Get recent activity data for Tabulator"""
    data = [
        {"time": "11:45 AM", "action": "Interface Configuration", "resource": "Ethernet1/12", "status": "Success", "user": "netadmin"},
        {"time": "11:30 AM", "action": "BGP Neighbor Added", "resource": "DC1-Spine-01", "status": "Success", "user": "admin"},
        {"time": "11:15 AM", "action": "VLAN Created", "resource": "VLAN-250", "status": "Success", "user": "operator"},
        {"time": "10:58 AM", "action": "Fabric Health Check", "resource": "DC2-Fabric", "status": "Success", "user": "system"},
        {"time": "10:45 AM", "action": "Template Applied", "resource": "Edge-Fabric", "status": "Warning", "user": "admin"},
        {"time": "10:23 AM", "action": "Policy Deployment", "resource": "DC1-Fabric", "status": "Success", "user": "admin"},
        {"time": "10:10 AM", "action": "Switch Reboot", "resource": "DC1-Leaf-05", "status": "Success", "user": "operator"},
        {"time": "09:55 AM", "action": "ACL Update", "resource": "DC2-Spine-02", "status": "Success", "user": "security"},
        {"time": "09:45 AM", "action": "VRF Created", "resource": "guest-vrf", "status": "Success", "user": "admin"},
        {"time": "09:30 AM", "action": "Route Map Modified", "resource": "DC1-Leaf-03", "status": "Success", "user": "netadmin"},
        {"time": "09:12 AM", "action": "Port Channel Added", "resource": "Po10", "status": "Success", "user": "operator"},
        {"time": "08:50 AM", "action": "License Activated", "resource": "DC2-Fabric", "status": "Success", "user": "admin"},
        {"time": "08:30 AM", "action": "Interface Update", "resource": "Ethernet1/48", "status": "Success", "user": "operator"},
        {"time": "08:15 AM", "action": "Backup Completed", "resource": "All Devices", "status": "Success", "user": "system"},
        {"time": "07:55 AM", "action": "Firmware Check", "resource": "DC1-Fabric", "status": "Warning", "user": "system"},
        {"time": "07:30 AM", "action": "OSPF Configuration", "resource": "DC2-Spine-01", "status": "Success", "user": "netadmin"},
        {"time": "07:15 AM", "action": "Configuration Sync", "resource": "DC2-Fabric", "status": "Warning", "user": "system"},
        {"time": "07:00 AM", "action": "Daily Health Report", "resource": "All Fabrics", "status": "Success", "user": "system"},
        {"time": "06:45 AM", "action": "STP Update", "resource": "DC1-Leaf-08", "status": "Success", "user": "operator"},
        {"time": "06:30 AM", "action": "NTP Sync", "resource": "All Devices", "status": "Success", "user": "system"}
    ]
    return jsonify({"data": data})


@tables_bp.route('/fabrics', methods=['GET'])
@require_permission('read')
def api_fabrics():
    """Get fabric list data for Tabulator"""
    data = [
        {"name": "DC1-Fabric", "type": "VXLAN EVPN", "switches": 24, "status": "Healthy", "vxlan_enabled": True},
        {"name": "DC2-Fabric", "type": "VXLAN EVPN", "switches": 18, "status": "Healthy", "vxlan_enabled": True},
        {"name": "DC3-Fabric", "type": "VXLAN EVPN", "switches": 16, "status": "Healthy", "vxlan_enabled": True},
        {"name": "Edge-Fabric", "type": "Classic LAN", "switches": 6, "status": "Warning", "vxlan_enabled": False},
        {"name": "Campus-Fabric", "type": "Classic LAN", "switches": 12, "status": "Healthy", "vxlan_enabled": False},
        {"name": "DMZ-Fabric", "type": "VXLAN EVPN", "switches": 8, "status": "Healthy", "vxlan_enabled": True},
        {"name": "Branch-Fabric", "type": "Classic LAN", "switches": 4, "status": "Healthy", "vxlan_enabled": False},
        {"name": "Lab-Fabric", "type": "VXLAN EVPN", "switches": 6, "status": "Warning", "vxlan_enabled": True}
    ]
    return jsonify({"data": data})


@tables_bp.route('/vrfs', methods=['GET'])
@require_permission('read')
def api_vrfs():
    """Get VRF instances data for Tabulator"""
    data = [
        {"name": "default", "rd": "65000:1", "status": "Active", "interfaces": 12},
        {"name": "management", "rd": "65000:2", "status": "Active", "interfaces": 4},
        {"name": "production", "rd": "65000:100", "status": "Active", "interfaces": 24},
        {"name": "development", "rd": "65000:101", "status": "Active", "interfaces": 18},
        {"name": "staging", "rd": "65000:102", "status": "Active", "interfaces": 16},
        {"name": "dmz", "rd": "65000:200", "status": "Active", "interfaces": 8},
        {"name": "guest", "rd": "65000:3", "status": "Pending", "interfaces": 0},
        {"name": "iot", "rd": "65000:300", "status": "Active", "interfaces": 32},
        {"name": "backup", "rd": "65000:400", "status": "Active", "interfaces": 6},
        {"name": "monitoring", "rd": "65000:500", "status": "Active", "interfaces": 10},
        {"name": "security", "rd": "65000:600", "status": "Active", "interfaces": 14},
        {"name": "voip", "rd": "65000:700", "status": "Active", "interfaces": 20}
    ]
    return jsonify({"data": data})


@tables_bp.route('/interfaces', methods=['GET'])
@require_permission('read')
def api_interfaces():
    """Get interface list data for Tabulator"""
    data = [
        {"name": "Ethernet1/1", "type": "Physical", "status": "Up", "speed": "10G", "description": "Uplink to Core"},
        {"name": "Ethernet1/2", "type": "Physical", "status": "Up", "speed": "10G", "description": "Uplink to Dist"},
        {"name": "Ethernet1/3", "type": "Physical", "status": "Up", "speed": "10G", "description": "Spine Connection"},
        {"name": "Ethernet1/4", "type": "Physical", "status": "Up", "speed": "10G", "description": "Leaf Connection"},
        {"name": "Ethernet1/5", "type": "Physical", "status": "Up", "speed": "1G", "description": "Access Port"},
        {"name": "Ethernet1/6", "type": "Physical", "status": "Up", "speed": "1G", "description": "Server Connection"},
        {"name": "Ethernet1/7", "type": "Physical", "status": "Down", "speed": "1G", "description": "Reserved"},
        {"name": "Ethernet1/8", "type": "Physical", "status": "Up", "speed": "1G", "description": "Management Access"},
        {"name": "Ethernet1/9", "type": "Physical", "status": "Up", "speed": "1G", "description": "Backup Link"},
        {"name": "Ethernet1/10", "type": "Physical", "status": "Down", "speed": "1G", "description": "Not Connected"},
        {"name": "Ethernet1/11", "type": "Physical", "status": "Up", "speed": "25G", "description": "High-Speed Uplink"},
        {"name": "Ethernet1/12", "type": "Physical", "status": "Up", "speed": "25G", "description": "Storage Network"},
        {"name": "Ethernet1/13", "type": "Physical", "status": "Up", "speed": "40G", "description": "Data Center Interconnect"},
        {"name": "Ethernet1/14", "type": "Physical", "status": "Up", "speed": "40G", "description": "Core Spine Link"},
        {"name": "Ethernet1/15", "type": "Physical", "status": "Down", "speed": "10G", "description": "Maintenance"},
        {"name": "Port-channel1", "type": "Port-Channel", "status": "Up", "speed": "20G", "description": "LAG to Distribution"},
        {"name": "Port-channel2", "type": "Port-Channel", "status": "Up", "speed": "40G", "description": "LAG to Core"},
        {"name": "Port-channel10", "type": "Port-Channel", "status": "Up", "speed": "80G", "description": "vPC Peer Link"},
        {"name": "Loopback0", "type": "Loopback", "status": "Up", "speed": "N/A", "description": "Management"},
        {"name": "Loopback1", "type": "Loopback", "status": "Up", "speed": "N/A", "description": "VTEP"},
        {"name": "Loopback100", "type": "Loopback", "status": "Up", "speed": "N/A", "description": "BGP Router ID"},
        {"name": "Vlan1", "type": "VLAN", "status": "Up", "speed": "N/A", "description": "Default VLAN"},
        {"name": "Vlan10", "type": "VLAN", "status": "Up", "speed": "N/A", "description": "Production"},
        {"name": "Vlan20", "type": "VLAN", "status": "Up", "speed": "N/A", "description": "Development"},
        {"name": "Vlan30", "type": "VLAN", "status": "Up", "speed": "N/A", "description": "DMZ"},
        {"name": "Vlan100", "type": "VLAN", "status": "Up", "speed": "N/A", "description": "Guest Network"},
        {"name": "mgmt0", "type": "Management", "status": "Up", "speed": "1G", "description": "Out-of-Band Management"}
    ]
    return jsonify({"data": data})
