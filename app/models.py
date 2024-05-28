from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='user')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')  # method potrzebne zeby byla taka sama jak przy funkcji sprawdzajacej

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class UnemploymentData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    region = db.Column(db.String(100), nullable=False)
    unemployed = db.Column(db.Integer, nullable=False)
    unemployment_rate = db.Column(db.Float, nullable=False)
