import pandas as pd
import os
from app.models import UnemploymentData, db
from flask import current_app as app

def parse_unemployment_data(file_path):
    try:
        df = pd.read_excel(file_path, engine='openpyxl')
        
        # Znajdowanie interesujących nas kolumn
        region_col = 'WOJEWÓDZTW/Podregiony/Powiaty'
        unemployed_col = 'Bezrobotni zarejestrowani w tysiącach'
        rate_col = 'Stopa bezrobocia %'

        if region_col in df.columns and unemployed_col in df.columns and rate_col in df.columns:
            data = []
            for _, row in df.iterrows():
                region = row[region_col]
                unemployed = row[unemployed_col]
                rate = row[rate_col]
                if pd.notna(region) and pd.notna(unemployed) and pd.notna(rate):
                    data.append({
                        'region': region,
                        'unemployed': unemployed,
                        'unemployment_rate': rate
                    })
            return data
        else:
            print(f"Failed to find required columns in {file_path}")
            return None
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return None

def import_data():
    base_path = 'bezrobocie'
    for year in os.listdir(base_path):
        year_path = os.path.join(base_path, year)
        if os.path.isdir(year_path):
            for file_name in os.listdir(year_path):
                if file_name.endswith('.xls') or file_name.endswith('.xlsx'):
                    file_path = os.path.join(year_path, file_name)
                    month = int(file_name.split('.')[0].split('-')[0])  # Extract the month from the file name
                    data = parse_unemployment_data(file_path)
                    if data:
                        with app.app_context():
                            for record in data:
                                db_record = UnemploymentData(
                                    year=int(year),
                                    month=month,
                                    region=record['region'],
                                    unemployed=record['unemployed'],
                                    unemployment_rate=record['unemployment_rate']
                                )
                                db.session.add(db_record)
                            db.session.commit()

def check_and_import_data():
    with app.app_context():
        if UnemploymentData.query.first() is None:
            print("No data found in the database. Importing data...")
            import_data()
        else:
            print("Data already exists in the database.")
