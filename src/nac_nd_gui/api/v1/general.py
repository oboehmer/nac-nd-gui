"""
General API endpoints
"""
from flask import Blueprint, jsonify, request

general_bp = Blueprint('general', __name__)


@general_bp.route('/hello', methods=['GET'])
def api_hello():
    """
    Example API endpoint
    ---
    tags:
      - General
    parameters:
      - name: name
        in: query
        type: string
        required: false
        default: World
        description: Name to greet
    responses:
      200:
        description: Successful greeting
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Hello, World!"
            status:
              type: string
              example: "success"
    """
    name = request.args.get('name', 'World')
    return jsonify({
        'message': f'Hello, {name}!',
        'status': 'success'
    })


@general_bp.route('/data', methods=['POST'])
def api_data():
    """Example POST endpoint"""
    data = request.get_json()
    return jsonify({
        'received': data,
        'status': 'success'
    })
