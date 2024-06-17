import os
from app import create_app, db
from app.models import UnemploymentData, Inflation, GDP
from data_importer import import_data, import_inflation_data, import_gdp_data, import_pension_data, import_housing_price_data

# Utwórz aplikację Flask
app = create_app()

# Ustaw kontekst aplikacji
with app.app_context():
    # Inicjalizuj sesję bazy danych
    session = db.session

    # Wywołaj funkcje importu danych
    import_data(session)
    import_inflation_data(session)
    import_gdp_data(session)
    import_housing_price_data(session)
    import_pension_data(session)
