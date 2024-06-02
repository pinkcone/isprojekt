import re
import pandas as pd
import os
from app.models import UnemploymentData, Inflation, GDP
import json


wojewodztwa = [
    'POLSKA', 'DOLNOŚLĄSKIE', 'KUJAWSKO-POMORSKIE', 'LUBELSKIE', 'LUBUSKIE',
    'ŁÓDZKIE', 'MAŁOPOLSKIE', 'MAZOWIECKIE', 'OPOLSKIE', 'PODKARPACKIE',
    'PODLASKIE', 'POMORSKIE', 'ŚLĄSKIE', 'ŚWIĘTOKRZYSKIE', 'WARMIŃSKO-MAZURSKIE',
    'WIELKOPOLSKIE', 'ZACHODNIOPOMORSKIE'
]

current_dir = os.path.dirname(os.path.abspath(__file__))

def import_data(session):
    for year in range(2012, 2025):
        if year in [2012, 2013, 2015, 2016, 2017]:
            month_start = 9

            file_path = os.path.join(current_dir, f'bezrobocie/{year}/01-08.xls')
            if not os.path.exists(file_path):
                file_path = os.path.join(current_dir, f'bezrobocie/{year}/01-08.xlsx')
                if not os.path.exists(file_path):
                    break
            ile_usunac = 1

            while True:
                try:
                    df_bezrobotni = pd.read_excel(file_path, sheet_name='Bezrobotni_Unemployed', header=0)
                    df_stopa = pd.read_excel(file_path, sheet_name='stopa _Rate', header=0)
                    ile_kolumn_bezrobotni = df_bezrobotni.shape[1]
                    ile_kolumn_stopa = df_stopa.shape[1]

                    if ile_usunac >= 5:
                        break
                    df_bezrobotni = df_bezrobotni.iloc[:, ile_usunac:]
                    df_stopa = df_stopa.iloc[:, ile_usunac:]

                    df_bezrobotni.columns = [f'Unnamed: {i}' for i in range(df_bezrobotni.shape[1])]
                    df_stopa.columns = [f'Unnamed: {i}' for i in range(df_stopa.shape[1])]

                    df_bezrobotni = df_bezrobotni[df_bezrobotni['Unnamed: 0'].str.contains('|'.join(wojewodztwa), case=False, na=False)]
                    df_stopa = df_stopa[df_stopa['Unnamed: 0'].str.contains('|'.join(wojewodztwa), case=False, na=False)]
                    if 'POLSKA' not in df_bezrobotni['Unnamed: 0'].iloc[0].upper():
                        raise ValueError("Pierwsza wartość kolumny 'Województwo' nie jest 'POLSKA'")
                    df_bezrobotni = df_bezrobotni.rename(columns={df_bezrobotni.columns[0]: 'Województwo'})
                    df_stopa = df_stopa.rename(columns={df_stopa.columns[0]: 'Województwo', df_stopa.columns[4]: '01'})

                    for month in range(1, 9):
                        month_str = f"{month:02d}"
                        bezrobotni_col_index = month 
                        stopa_col_index = month
                        
                        for _, row_bezrobotni in df_bezrobotni.iterrows():
                            wojewodztwo = row_bezrobotni['Województwo']
                            row_stopa = df_stopa[df_stopa['Województwo'] == wojewodztwo]
                            
                            if not row_stopa.empty:
                                stopa_value = row_stopa.iloc[0, stopa_col_index]
                            else:
                                stopa_value = None

                            wojewodztwo = wojewodztwo.replace('WOJ. ', '', 1).replace('Woj. ', '', 1).replace('REGION: ', '', 1).replace('MAKROREGION WOJEWÓDZTWO ', '', 1).upper()
                            wojewodztwo = re.sub(r'\s+', '', wojewodztwo)

                            if wojewodztwo in wojewodztwa:
                                db_record = UnemploymentData(
                                    year=year,
                                    month=month,
                                    region=wojewodztwo,
                                    unemployed=row_bezrobotni.iloc[bezrobotni_col_index],
                                    unemployment_rate=stopa_value
                                )
                                session.add(db_record)
                        session.commit()
                    break

                except Exception as e:
                    ile_usunac += 1
        else:
            month_start = 1
        for month in range(month_start, 13):

            file_path = os.path.join(current_dir, f'bezrobocie/{year}/{month:02d}.xls')
            if not os.path.exists(file_path):
                file_path = os.path.join(current_dir, f'bezrobocie/{year}/{month:02d}.xlsx')
                if not os.path.exists(file_path):
                    continue
            ile_usunac = 2
            ile_kolumn = 2
            while True:
                try:
                    df = pd.read_excel(file_path, sheet_name=0, header=0)
                    ile_kolumn = df.shape[1]
                    if ile_usunac >= ile_kolumn - 2:
                        break
                    df = df.iloc[:, ile_usunac:]
                    df.columns = [f'Unnamed: {i}' for i in range(df.shape[1])]
                    try:
                        selected_columns = ['Unnamed: 0', 'Unnamed: 1', 'Unnamed: 2']
                        wojewodztwa_df = df[selected_columns]
                    except KeyError:
                        fallback_columns = ['Kolumna4', 'Kolumna5', 'Kolumna6']
                        wojewodztwa_df = df[fallback_columns]
                    wojewodztwa_df.columns = ['Województwo', 'Bezrobotni (tys.)', 'Stopa bezrobocia (%)']
                    wojewodztwa_df.loc[:, 'Województwo'] = wojewodztwa_df['Województwo'].str.strip()
                    wojewodztwa_df = wojewodztwa_df[wojewodztwa_df['Województwo'].str.contains('|'.join(wojewodztwa), case=False, na=False)]
                    if wojewodztwa_df['Województwo'].iloc[0] != 'POLSKA':
                        raise ValueError("Pierwsza wartość kolumny 'Województwo' nie jest 'POLSKA'")

                    for _, row in wojewodztwa_df.iterrows():
                        wojewodztwo = row['Województwo'].replace('WOJ. ', '', 1).replace('Woj. ', '', 1).replace('REGION: ', '', 1).replace('MAKROREGION WOJEWÓDZTWO ', '', 1).upper()
                        if wojewodztwo in wojewodztwa:
                            db_record = UnemploymentData(
                                year=year,
                                month=month,
                                region=wojewodztwo,
                                unemployed=row['Bezrobotni (tys.)'],
                                unemployment_rate=row['Stopa bezrobocia (%)']
                            )
                            session.add(db_record)
                    session.commit()
                    break

                except Exception as e:
                    ile_usunac += 1

def import_inflation_data(session):
    inflation_file = os.path.join(current_dir, 'inflacja_is.json')
    with open(inflation_file, 'r', encoding='utf-8') as file:
        inflation_data = json.load(file)

    for entry in inflation_data:
        month, year = entry['miesiac'].split(' ')
        year = int(year)
        month_map = {
            'sty': 1, 'lut': 2, 'mar': 3, 'kwi': 4, 'maj': 5, 'cze': 6,
            'lip': 7, 'sie': 8, 'wrz': 9, 'paź': 10, 'lis': 11, 'gru': 12
        }
        month = month_map[month]
        value = entry['inflacja']

        # Sprawdź, czy rekord już istnieje
        existing_record = session.query(Inflation).filter_by(year=year, month=month).first()
        if not existing_record:
            inflation_record = Inflation(year=year, month=month, value=value)
            session.add(inflation_record)

    session.commit()
    print("Dane inflacji zaimportowane pomyślnie.")

def import_gdp_data(session):
    gdp_file = os.path.join(current_dir, 'pkb_kwartaly_is.json')
    with open(gdp_file, 'r', encoding='utf-8') as file:
        gdp_data = json.load(file)

    for entry in gdp_data:
        okres = entry['okres'].split(' ')
        year = int(okres[0])
        quarter = okres[1]
        value = entry['pkb']

        # Sprawdź, czy rekord już istnieje
        existing_record = session.query(GDP).filter_by(year=year, quarter=quarter).first()
        if not existing_record:
            gdp_record = GDP(year=year, quarter=quarter, value=value)
            session.add(gdp_record)

    session.commit()
    print("Dane PKB zaimportowane pomyślnie.")