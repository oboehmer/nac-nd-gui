from flask import Flask, render_template, jsonify
from dotenv import load_dotenv
import os
from flasgger import Swagger
from api.v1 import register_v1_blueprints

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/swagger/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "NaC API - Network as Code",
        "description": "API documentation for Network as Code application with Nexus Dashboard integration",
        "version": "1.0.0",
        "contact": {
            "name": "Network Team",
            "email": "network@example.com"
        }
    },
    "host": "localhost:9999",
    "basePath": "/",
    "schemes": ["http", "https"],
    "tags": [
        {
            "name": "General",
            "description": "General API endpoints"
        },
        {
            "name": "Tables",
            "description": "Table data endpoints for UI"
        },
        {
            "name": "Admin",
            "description": "Administrative configuration endpoints"
        },
        {
            "name": "Nexus Dashboard",
            "description": "Nexus Dashboard integration endpoints"
        }
    ]
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Register v1 API blueprints
register_v1_blueprints(app)


@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found', 'status': 'error'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error', 'status': 'error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=9999)
