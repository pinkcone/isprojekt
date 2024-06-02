from app import create_app, db
from app.models import GDP, Inflation, UnemploymentData
from data_importer import import_data, import_inflation_data, import_gdp_data
from sqlalchemy.orm import sessionmaker

def initialize_data():
    app = create_app()
    with app.app_context():
        Session = sessionmaker(bind=db.engine)
        session = Session()

        # Import danych bezrobocia, jeśli tabela jest pusta
        if not session.query(UnemploymentData).first():
            import_data(session)

        # Import danych inflacji, jeśli tabela jest pusta
        if not session.query(Inflation).first():
            import_inflation_data(session)

        # Import danych PKB, jeśli tabela jest pusta
        if not session.query(GDP).first():
            import_gdp_data(session)

        session.commit()
        session.close()

if __name__ == '__main__':
    initialize_data()
