# Project-Specific Error Patterns

<!-- Document error patterns specific to this project -->

## Project-Specific Prevention

### Flask Secret Key Configuration
**Context**: Flask applications require SECRET_KEY for session management and security features
**Implementation**: Use python-dotenv to load SECRET_KEY from environment; provide development fallback with clear warning in variable name
**Effectiveness**: Prevents deployment failures while maintaining development convenience; naming convention reminds developers to change in production
**Added**: [2025-10-22T14:42:00Z]
**Additional Details**:
```python
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
```
The fallback value name explicitly warns about production change requirements.

### Bootstrap Integrity Hash Verification
**Context**: CDN-delivered assets can be compromised or tampered with, creating security vulnerabilities
**Implementation**: Include integrity="sha384-..." and crossorigin="anonymous" attributes on all CDN-loaded Bootstrap resources
**Effectiveness**: Browser verifies asset integrity before execution; prevents compromised CDN content from executing; maintains security without hosting assets locally
**Added**: [2025-10-22T14:43:00Z]
**Additional Details**: SRI (Subresource Integrity) hashes ensure the exact file content matches what's expected, preventing malicious modifications.

### JSON API Content-Type Headers
**Context**: POST requests to Flask JSON endpoints require proper Content-Type headers or Flask won't parse JSON body
**Implementation**: Always set 'Content-Type': 'application/json' in fetch() headers when sending JSON data
**Effectiveness**: Ensures Flask request.get_json() properly parses request body; prevents silent failures where JSON isn't parsed
**Added**: [2025-10-22T14:43:30Z]
**Additional Details**:
```javascript
fetch('/api/data', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(formData)
})
```

## Memory System Error Pattern: API Rate Limiting

### 429 Too Many Tokens Error
**When it happens**: During high-volume memory processing operations with multiple au-update and au-promotion cycles in close succession
**How to prevent**: Implement backoff delays between Task delegations; batch log entries before processing; monitor token usage
**Related components**: Memory log processing system, au-update agent, au-promotion agent
**Last seen**: [2025-10-22T21:18:00Z]
**Status**: Transient error; system resilient (processing can resume after rate limit period)
**Added**: [2025-10-22T21:18:00Z]
**Additional Details**: Error occurred during au-update delegation after extensive cross-tier promotion analysis (477+ log entries processed, 21 patterns promoted). System demonstrated resilience: previous processing sessions completed successfully, and the error is recoverable with retry after rate limit window expires. Consider implementing rate limit awareness in high-volume processing scenarios.

### Bootstrap Modal Z-Index Layering
**When it happens**: Bootstrap 5 modals fail to display above other content or become unclickable due to z-index conflicts with other UI elements
**How to prevent**: Apply explicit z-index hierarchy: backdrop (1040), modal (1050), dialog (1060), content (1070); use !important to override conflicting styles; ensure pointer-events: auto on modal-content
**Related components**: Bootstrap 5 modal components, custom CSS overrides
**Last seen**: [2025-10-23T18:25:55Z]
**Status**: Fixed with comprehensive z-index layering in style.css
**Added**: [2025-10-23T18:35:00Z]
**Additional Details**:
```css
.modal-backdrop { z-index: 1040 !important; }
.modal { z-index: 1050 !important; }
.modal-dialog { z-index: 1060 !important; }
.modal-content { position: relative; z-index: 1070 !important; pointer-events: auto; }
```
This layered approach ensures modals always display correctly and remain interactive regardless of other page elements.

### HTTP 204 No Content Response Handling
**When it happens**: API POST/PUT requests return 204 No Content status (successful operation with no response body), causing JSON parsing errors when client expects response body
**How to prevent**: Check for 204 status code explicitly and return synthetic success response dictionary when no body is returned; handle alongside 200/201 success codes
**Related components**: NaC API Client (nac_api.py), POST and PUT HTTP methods
**Last seen**: [2025-10-30T00:59:16Z]
**Status**: Implemented in NacApiClient.post() and NacApiClient.put() methods
**Added**: [2025-10-30T05:00:00Z]
**Additional Details**:
```python
if response.status_code in [200, 201]:
    return response.json()
elif response.status_code == 204:
    # 204 No Content - successful but no body to return
    return {'status': 'success', 'message': 'Operation completed successfully'}
else:
    logger.error(f"POST request failed: {response.status_code} - {response.text}")
    return None
```
This pattern prevents JSON parsing errors on 204 responses while maintaining consistent return type (Dict or None) for client code.
