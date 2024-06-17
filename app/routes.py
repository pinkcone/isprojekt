import string
import threading
from flask import Blueprint, render_template, request, jsonify, send_file
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models import UnemploymentData, Inflation, GDP, PensionData, HousingPriceData
from app import db
import numpy as np
import pandas as pd
import json
import random
from dicttoxml import dicttoxml
import os
import zipfile
import time
from datetime import datetime
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

def get_data_by_type(data_type, start_month, start_year, end_month, end_year, regions):
    if data_type == 'inflation':
        start_year_inflation = start_year % 1000
        end_year_inflation = end_year % 1000

        query = db.session.query(Inflation).filter(
            ((Inflation.year == start_year_inflation) & (Inflation.month >= start_month)) |
            ((Inflation.year > start_year_inflation) & (Inflation.year < end_year_inflation)) |
            ((Inflation.year == end_year_inflation) & (Inflation.month <= end_month))
        )

        if start_year == end_year:
            query = query.filter(
                (Inflation.year == start_year_inflation) & (Inflation.month >= start_month) & (Inflation.month <= end_month)
            )

        data = query.all()
        return [{'month': d.month, 'year': d.year + 2000, 'value': d.value, 'region': 'POLSKA'} for d in data]

    elif data_type == 'gdp':
        query = db.session.query(GDP).filter(
            ((GDP.year == start_year) & ((GDP.quarter == 'Q1' and start_month <= 3) | 
                                         (GDP.quarter == 'Q2' and start_month <= 6) | 
                                         (GDP.quarter == 'Q3' and start_month <= 9) | 
                                         (GDP.quarter == 'Q4' and start_month <= 12))) |
            ((GDP.year > start_year) & (GDP.year < end_year)) |
            ((GDP.year == end_year) & ((GDP.quarter == 'Q1' and end_month >= 1) | 
                                       (GDP.quarter == 'Q2' and end_month >= 4) | 
                                       (GDP.quarter == 'Q3' and end_month >= 7) | 
                                       (GDP.quarter == 'Q4' and end_month >= 10)))
        )

        if start_year == end_year:
            query = query.filter(
                (GDP.year == start_year) & ((GDP.quarter == 'Q1' and start_month <= 3 and end_month >= 1) |
                                            (GDP.quarter == 'Q2' and start_month <= 6 and end_month >= 4) |
                                            (GDP.quarter == 'Q3' and start_month <= 9 and end_month >= 7) |
                                            (GDP.quarter == 'Q4' and start_month <= 12 and end_month >= 10))
            )

        data = query.all()
        gdp_monthly_data = []
        for d in data:
            quarter_to_months = {
                'Q1': [1, 2, 3],
                'Q2': [4, 5, 6],
                'Q3': [7, 8, 9],
                'Q4': [10, 11, 12]
            }
            months = quarter_to_months[d.quarter]
            for month in months:
                if (d.year == start_year and month < start_month) or (d.year == end_year and month > end_month):
                    continue
                gdp_monthly_data.append({'month': month, 'year': d.year, 'value': d.value / 3, 'region': 'POLSKA'})
        return gdp_monthly_data

    elif data_type in ['unemployment_rate', 'unemployed']:
        query = db.session.query(UnemploymentData).filter(
            ((UnemploymentData.year == start_year) & (UnemploymentData.month >= start_month)) |
            ((UnemploymentData.year > start_year) & (UnemploymentData.year < end_year)) |
            ((UnemploymentData.year == end_year) & (UnemploymentData.month <= end_month)),
            UnemploymentData.region.in_(regions)
        )

        if start_year == end_year:
            query = query.filter(
                (UnemploymentData.year == start_year) & (UnemploymentData.month >= start_month) & (UnemploymentData.month <= end_month)
            )

        data = query.all()
        return [{'month': d.month, 'year': d.year, 'region': d.region, 'value': getattr(d, data_type)} for d in data]

    elif data_type == 'pension':
        query = db.session.query(PensionData).filter(
            PensionData.year >= start_year,
            PensionData.year <= end_year,
            PensionData.region.in_(regions)
        )

        data = query.all()
        pension_monthly_data = []
        for d in data:
            for year in range(start_year, end_year + 1):
                for month in range(1, 13):
                    if (year == start_year and month < start_month) or (year == end_year and month > end_month):
                        continue
                    if d.year == year:
                        pension_monthly_data.append({'month': month, 'year': year, 'region': d.region, 'value': d.amount})
        return pension_monthly_data

    elif data_type == 'housing_price':
        query = db.session.query(HousingPriceData).filter(
            HousingPriceData.year >= start_year,
            HousingPriceData.year <= end_year,
            HousingPriceData.region.in_(regions)
        )

        data = query.all()
        housing_price_monthly_data = []
        for d in data:
            for year in range(start_year, end_year + 1):
                for month in range(1, 13):
                    if (year == start_year and month < start_month) or (year == end_year and month > end_month):
                        continue
                    if d.year == year:
                        housing_price_monthly_data.append({'month': month, 'year': year, 'region': d.region, 'value': d.price})
        return housing_price_monthly_data

    return []

@main_bp.route('/get_data')
def get_data():
    regions = request.args.get('regions', 'POLSKA').split(',')
    start_month = request.args.get('start_month')
    start_year = request.args.get('start_year')
    end_month = request.args.get('end_month')
    end_year = request.args.get('end_year')
    data_type1 = request.args.get('data_types')
    data_type2 = request.args.get('data_types2', '')

    if not (start_month and start_year and end_month and end_year and data_type1):
        return jsonify({'error': 'Missing required parameters'}), 400

    start_month = int(start_month)
    start_year = int(start_year)
    end_month = int(end_month)
    end_year = int(end_year)

    data1 = get_data_by_type(data_type1, start_month, start_year, end_month, end_year, regions)
    data2 = get_data_by_type(data_type2, start_month, start_year, end_month, end_year, regions) if data_type2 else []

    data = {
        data_type1: data1,
        data_type2: data2
    }

    return jsonify(data)

@main_bp.route('/get_correlation')
def get_correlation():
    regions = request.args.get('regions', 'POLSKA').split(',')
    start_month = request.args.get('start_month')
    start_year = request.args.get('start_year')
    end_month = request.args.get('end_month')
    end_year = request.args.get('end_year')
    data_type1 = request.args.get('data_types')
    data_type2 = request.args.get('data_types2', '')

    if not (start_month and start_year and end_month and end_year and data_type1 and data_type2):
        return jsonify({'error': 'Missing required parameters'}), 400

    start_month = int(start_month)
    start_year = int(start_year)
    end_month = int(end_month)
    end_year = int(end_year)

    data1 = get_data_by_type(data_type1, start_month, start_year, end_month, end_year, regions)
    data2 = get_data_by_type(data_type2, start_month, start_year, end_month, end_year, regions)

    # Mapowanie miesięcy i lat na wartości
    data1_values = [d['value'] for d in data1]
    data2_values = [d['value'] for d in data2]

    # Sprawdzenie, czy długości danych są równe
    if len(data1_values) != len(data2_values):
        return jsonify({'error': 'Data lengths do not match'}), 400

    # Obliczenie współczynnika korelacji
    correlation = np.corrcoef(data1_values, data2_values)[0, 1]

    return jsonify({'correlation': correlation})

def generate_unique_filename():
    current_date = datetime.now().strftime('%Y%m%d')
    random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    return f"data_{current_date}_{random_suffix}.zip"

def delete_file_after_delay(file_path, delay):
    def delayed_delete():
        time.sleep(delay)
        try:
            os.remove(file_path)
            print(f"Successfully removed file: {file_path}")
        except Exception as e:
            print(f"Error removing file: {e}")

    threading.Thread(target=delayed_delete).start()

@main_bp.route('/download_data')
def download_data():
    regions = request.args.get('regions', 'POLSKA').split(',')
    start_month = request.args.get('start_month')
    start_year = request.args.get('start_year')
    end_month = request.args.get('end_month')
    end_year = request.args.get('end_year')
    data_type1 = request.args.get('data_types')
    data_type2 = request.args.get('data_types2', '')
    file_format = request.args.get('format', 'csv')

    if not (start_month and start_year and end_month and end_year and data_type1):
        return jsonify({'error': 'Missing required parameters'}), 400

    start_month = int(start_month)
    start_year = int(start_year)
    end_month = int(end_month)
    end_year = int(end_year)

    data1 = get_data_by_type(data_type1, start_month, start_year, end_month, end_year, regions)
    data2 = get_data_by_type(data_type2, start_month, start_year, end_month, end_year, regions) if data_type2 else []

    data_files = []
    download_folder = os.path.join(os.getcwd(), 'downloads')
    os.makedirs(download_folder, exist_ok=True)
    
    def save_data_to_file(data, filename):
        if file_format == 'csv':
            df = pd.DataFrame(data)
            df.to_csv(filename, index=False)
        elif file_format == 'json':
            with open(filename, 'w') as f:
                json.dump(data, f)
        elif file_format == 'xml':
            xml_data = dicttoxml(data)
            with open(filename, 'wb') as f:
                f.write(xml_data)

    if data1:
        filename1 = os.path.join(download_folder, f'data_{data_type1}.{file_format}')
        save_data_to_file(data1, filename1)
        data_files.append(filename1)

    if data2:
        filename2 = os.path.join(download_folder, f'data_{data_type2}.{file_format}')
        save_data_to_file(data2, filename2)
        data_files.append(filename2)

    zip_filename = os.path.join(download_folder, generate_unique_filename())
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for file in data_files:
            zipf.write(file, os.path.basename(file))
            os.remove(file)

    response = send_file(zip_filename, as_attachment=True)

    delete_file_after_delay(zip_filename, delay=60)

    return response