from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response
from app.models import User
from app import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request

auth_bp = Blueprint('auth', __name__)

@auth_bp.context_processor
def inject_user():
    current_user = None
    try:
        verify_jwt_in_request(optional=True)
        current_user = get_jwt_identity()
    except Exception as e:
        print(f"Error in inject_user: {e}")
        current_user = None
    return dict(current_user=current_user)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm-password')

        if password != confirm_password:
            flash('Passwords do not match!', 'danger')
        elif User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
            flash('User already exists', 'danger')
        else:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful!', 'success')
            return redirect(url_for('auth.login'))
    return render_template('register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            access_token = create_access_token(identity={'username': user.username, 'email': user.email, 'role': user.role})
            flash('Login successful!', 'success')
            response = make_response(redirect(url_for('main.home')))
            response.set_cookie('access_token_cookie', access_token)
            return response
        else:
            flash('Invalid credentials', 'danger')
    return render_template('login.html')

@auth_bp.route('/logout')
@jwt_required()
def logout():
    response = redirect(url_for('main.home'))
    response.delete_cookie('access_token_cookie')
    flash('Logged out successfully', 'success')
    return response
