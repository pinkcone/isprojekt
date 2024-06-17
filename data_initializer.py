from app import db
from app.models import UnemploymentData, Inflation, GDP, PensionData, HousingPriceData
from data_importer import import_data, import_inflation_data, import_gdp_data, import_pension_data, import_housing_price_data

def initialize_data(session):
    # Sprawdź, czy dane istnieją w tabelach
    if session.query(UnemploymentData).first() is None:
        print("Importing Unemployment Data")
        import_data(session)
    else:
        print("Unemployment Data already exists")

    if session.query(Inflation).first() is None:
        print("Importing Inflation Data")
        import_inflation_data(session)
    else:
        print("Inflation Data already exists")

    if session.query(GDP).first() is None:
        print("Importing GDP Data")
        import_gdp_data(session)
    else:
        print("GDP Data already exists")

    if session.query(HousingPriceData).first() is None:
        print("Importing Housing Price Data")
        import_housing_price_data(session)
    else:
        print("Housing Price Data already exists")

    if session.query(PensionData).first() is None:
        print("Importing Pension Data")
        import_pension_data(session)
    else:
        print("Pension Data already exists")
