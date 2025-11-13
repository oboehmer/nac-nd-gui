# NetBox API Configuration Guide

## Issue: 403 Permission Denied Error

If you're seeing a **403 Permission Denied** error when trying to access NetBox VLANs or other resources, this means your API token doesn't have the necessary permissions.

### Error Example
```
ERROR:nac_nd_gui.netbox_api:GET request failed: 403 - {"detail":"You do not have permission to perform this action."}
```

## Solution: Configure NetBox API Token Permissions

### Step 1: Access NetBox Admin Panel

1. Log in to your NetBox instance as an administrator
2. Navigate to **Admin** → **Users** (or `/admin/users/`)

### Step 2: Create or Edit API Token

#### Option A: Create New Token

1. Go to **Admin** → **API Tokens** → **+ Add Token**
2. Fill in the required fields:
   - **User**: Select the user this token belongs to
   - **Key**: Auto-generated or enter custom token
   - **Write enabled**: Check if you need write access (optional for read-only operations)
   - **Description**: e.g., "NaC Frontend Integration"

#### Option B: Edit Existing Token

1. Go to **Admin** → **API Tokens**
2. Click on your existing token
3. Verify the settings

### Step 3: Assign Permissions to User/Group

The user associated with the API token needs proper permissions:

#### Required Permissions for VLAN Access:

1. Go to **Admin** → **Users** → Select your user
2. Scroll to **User permissions** section
3. Add the following permissions:
   - `ipam | vlan | Can view vlan` ✓

#### Recommended Permissions for Full IPAM Access:

For complete IPAM functionality, grant these permissions:

**IPAM Permissions:**
- `ipam | prefix | Can view prefix`
- `ipam | ip address | Can view IP address`
- `ipam | vlan | Can view vlan`
- `ipam | vrf | Can view VRF`
- `ipam | aggregate | Can view aggregate`
- `ipam | asn | Can view ASN`

**DCIM Permissions (if accessing devices/sites):**
- `dcim | site | Can view site`
- `dcim | device | Can view device`

#### Using Groups (Recommended):

Instead of assigning permissions directly to users, it's better to use groups:

1. Go to **Admin** → **Groups** → **+ Add Group**
2. Create a group (e.g., "API Read-Only Users")
3. Assign permissions to the group
4. Add your user to this group

### Step 4: Verify Token Configuration

1. Copy your API token from NetBox
2. In the NaC Frontend application:
   - Go to **NetBox** page in the left menu
   - Enter NetBox URL (e.g., `https://netbox.example.com`)
   - Enter Username (for reference)
   - Paste the API Token
   - Click **Save Configuration**

### Step 5: Test Connection

1. Click the **Test NetBox Connection** button
2. If successful, you should see:
   - "Successfully connected to NetBox"
   - NetBox version
   - IP Prefix count

3. Try loading VLANs by clicking the **Refresh** button in the VLANs section

## Common Issues

### Issue 1: Token Not Found (401 Unauthorized)
**Cause**: Invalid or incorrect API token
**Solution**:
- Verify you copied the entire token correctly
- Check for extra spaces or characters
- Generate a new token if needed

### Issue 2: Permission Denied (403 Forbidden)
**Cause**: Token user lacks permissions
**Solution**:
- Follow Step 3 above to assign proper permissions
- Ensure user is in the correct group with permissions
- Verify permissions are saved

### Issue 3: Connection Timeout
**Cause**: NetBox URL unreachable or incorrect
**Solution**:
- Verify NetBox URL is correct (including http/https)
- Check network connectivity
- Ensure NetBox is running and accessible
- Check firewall rules

### Issue 4: SSL Certificate Error
**Cause**: Self-signed certificate
**Note**: The application currently disables SSL verification for development
**Production Solution**: Use proper SSL certificates

## Token Permission Levels

### Read-Only Token (Recommended for Frontend)
- Can view/read all IPAM resources
- Cannot create, modify, or delete resources
- Safer for integration applications

### Read-Write Token
- Full access to create, modify, delete resources
- Required for automation that creates/updates data
- Higher security risk if compromised

## Security Best Practices

1. **Use Read-Only Tokens**: Unless you need write access, use read-only tokens
2. **Rotate Tokens Regularly**: Change tokens periodically
3. **One Token Per Application**: Don't share tokens between applications
4. **Monitor Token Usage**: Check NetBox logs for unusual activity
5. **Use HTTPS**: Always use HTTPS for NetBox connections
6. **Restrict Token Scope**: Only grant necessary permissions

## Testing Your Configuration

### Using curl (Command Line Test)

```bash
# Test with your token
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
     -H "Accept: application/json" \
     https://your-netbox-url/api/ipam/vlans/

# Expected successful response:
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [...]
}

# If you get 403:
{
  "detail": "You do not have permission to perform this action."
}
```

### Using Python

```python
import requests

url = "https://your-netbox-url/api/ipam/vlans/"
headers = {
    "Authorization": "Token YOUR_TOKEN_HERE",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers, verify=False)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

## Getting Help

If you continue to experience issues:

1. Check NetBox logs: `/var/log/netbox/` or Docker logs
2. Verify NetBox version compatibility
3. Check the application logs for detailed error messages
4. Ensure your NetBox instance is properly configured

## References

- [NetBox Official Documentation](https://docs.netbox.dev/)
- [NetBox API Documentation](https://docs.netbox.dev/en/stable/integrations/rest-api/)
- [NetBox Authentication](https://docs.netbox.dev/en/stable/integrations/rest-api/#authentication)
