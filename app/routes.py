from flask import Blueprint, render_template
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    current_user = None
    try:
        verify_jwt_in_request(optional=True)
        current_user = get_jwt_identity()
    except:
        pass
    return render_template('index.html', current_user=current_user)
