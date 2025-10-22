# NaC API - Network as Code

A modern network management web application built with Python Flask backend and Bootstrap 5.3 frontend for Cisco Systems Inc.

## Features

- 🚀 **Flask Backend**: Lightweight Python web framework
- 🎨 **Bootstrap 5.3**: Latest Bootstrap for responsive design
- 📱 **Mobile-First**: Fully responsive layout
- 🔌 **API Ready**: RESTful API endpoints included
- ✨ **Modern JavaScript**: Clean, async/await patterns
- 🎯 **Interactive UI**: Live API testing and form handling
- ⚙️ **Admin Panel**: Web-based configuration management with YAML storage
- 🔐 **Secure Config**: API keys stored in YAML format (gitignored)

## Project Structure

```
.
├── app.py                  # Flask application with API routes
├── requirements.txt        # Python dependencies
├── .env.sample            # Environment variables template
├── yaml/
│   └── config.yaml.sample # Configuration file template
├── static/
│   ├── css/
│   │   └── style.css      # Custom CSS styles
│   ├── images/
│   │   └── *.png          # Logo and image assets
│   └── js/
│       └── app.js         # Frontend JavaScript
└── templates/
    └── index.html         # Main HTML template with Bootstrap
```

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone or navigate to the project directory**

2. **Create a virtual environment**

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

```bash
cp .env.sample .env
# Edit .env and set your SECRET_KEY
```

5. **Run the application**

```bash
python app.py
```

The application will start on `http://localhost:9999`

6. **Configure API Keys** (Optional)

Navigate to the Admin page in the web interface to configure:
- NaC API Key
- Nexus Dashboard API Key
- Nexus Dashboard URL
- Nexus Dashboard Username
- Fabric Name (optional - scopes all operations to specific fabric)

Configuration is automatically saved to `yaml/config.yaml`

**Security Feature**: When loading existing configuration, API key fields show placeholder dots (••••••••••••••••) instead of actual values. The green border indicates a value is already configured. Click into the field to change it, or leave it unchanged to keep the current value.

## API Endpoints

### GET /api/hello
Test endpoint that returns a greeting message.

**Query Parameters:**
- `name` (optional): Name to greet (default: "World")

**Example:**
```bash
curl "http://localhost:5000/api/hello?name=User"
```

**Response:**
```json
{
  "message": "Hello, User!",
  "status": "success"
}
```

### POST /api/data
Example endpoint for receiving JSON data.

**Request Body:**
```json
{
  "name": "John Doe",
  "message": "Hello from the frontend"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/data \
  -H "Content-Type: application/json" \
  -d '{"name":"John","message":"Test"}'
```

**Response:**
```json
{
  "received": {
    "name": "John",
    "message": "Test"
  },
  "status": "success"
}
```

### Admin Configuration Endpoints

#### POST /api/admin/save-config
Save API configuration to YAML file.

**Request Body:**
```json
{
  "nac_api_key": "your-key",
  "nexus_api_key": "your-key",
  "nexus_url": "https://nexus.example.com",
  "nexus_username": "admin"
}
```

#### GET /api/admin/load-config
Load current API configuration from YAML file.

**Response:**
```json
{
  "status": "success",
  "data": {
    "nac_api_key": "***",
    "nexus_api_key": "***",
    "nexus_url": "https://nexus.example.com",
    "nexus_username": "admin"
  }
}
```

#### POST /api/admin/clear-config
Clear all API configuration (deletes config.yaml).

**Response:**
```json
{
  "status": "success",
  "message": "Configuration cleared successfully"
}
```

### Table Data Endpoints

The application provides JSON data for Tabulator tables:

- `GET /api/tables/recent-activity` - Recent activity data
- `GET /api/tables/fabrics` - Network fabric list
- `GET /api/tables/vrfs` - VRF instances
- `GET /api/tables/interfaces` - Network interfaces

All table endpoints return data in the format:
```json
{
  "data": [...]
}
```

### Nexus Dashboard API Endpoints

The application provides proxy endpoints to Nexus Dashboard:

- `GET /api/nexus/test-connection` - Test Nexus Dashboard connection
- `GET /api/nexus/sites` - Get all sites
- `GET /api/nexus/fabrics` - Get all fabrics
- `GET /api/nexus/fabrics/{fabric_id}/switches` - Get fabric switches
- `GET /api/nexus/fabrics/{fabric_id}/vrfs` - Get fabric VRFs
- `GET /api/nexus/fabrics/{fabric_id}/networks` - Get fabric networks
- `GET /api/nexus/fabrics/{fabric_id}/inventory` - Get fabric inventory

Example:
```bash
curl http://localhost:9999/api/nexus/test-connection
```

## Nexus Dashboard Integration

The application includes a complete Nexus Dashboard API client with:
- Header-based authentication (X-Nd-Username, X-Nd-Apikey)
- RESTful API methods (GET, POST, PUT, DELETE)
- Convenience methods for common operations
- Connection testing from Admin panel

**Authentication Method**: Uses `X-Nd-Username` and `X-Nd-Apikey` headers for all requests.

**See [NEXUS_DASHBOARD_API.md](NEXUS_DASHBOARD_API.md) for complete API documentation and examples.**

## Frontend Features

### Interactive API Testing
- Click the "Test API" button to make a live API call
- See formatted JSON responses in real-time

### Form Submission
- Fill out the form and submit data to the API
- Receive instant feedback on submission success/failure

### Responsive Design
- Mobile-first approach using Bootstrap 5.3
- Card-based layout with smooth animations
- Feature showcase with icons

## Development

### Adding New Routes

Edit `app.py` to add new API endpoints:

```python
@app.route('/api/your-endpoint', methods=['GET', 'POST'])
def your_endpoint():
    # Your logic here
    return jsonify({'status': 'success', 'data': 'your data'})
```

### Customizing Styles

Edit `static/css/style.css` to customize the appearance:

```css
/* Your custom styles */
.your-class {
    /* properties */
}
```

### Adding JavaScript Functionality

Edit `static/js/app.js` to add new frontend features:

```javascript
async function yourFunction() {
    const data = await apiCall('/api/your-endpoint');
    console.log(data);
}
```

## Production Deployment

Before deploying to production:

1. Set a strong `SECRET_KEY` in your environment variables
2. Set `FLASK_ENV=production`
3. Use a production WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

4. Consider using a reverse proxy (nginx, Apache)
5. Enable HTTPS with SSL certificates

## Technologies Used

- **Backend**: Flask 3.0.3, Requests 2.31.0
- **Frontend**: Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Tabulator 6.2.5
- **JavaScript**: Modern ES6+ with async/await
- **CSS**: Custom styles + Bootstrap utilities
- **Python**: python-dotenv for environment management, PyYAML 6.0.1 for configuration, Requests for HTTP
- **Storage**: YAML format for secure configuration management
- **API Integration**: Cisco Nexus Dashboard REST API client with automatic authentication

## License

MIT License - Feel free to use this template for your projects!

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
