import os
from app import create_app, db
from flask_migrate import upgrade
from data_initializer import initialize_data

app = create_app()

with app.app_context():
    # Inicjalizacja bazy danych
    upgrade()

    # Uruchomienie funkcji inicjalizacji danych
    initialize_data(db.session)

if __name__ == '__main__':
    app.run(debug=True)
