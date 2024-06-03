from flask import Blueprint, render_template, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models import UnemploymentData, Inflation, GDP
from app import db

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

@main_bp.route('/get_data')
def get_data():
    region = request.args.get('region')
    month = int(request.args.get('month'))
    year = int(request.args.get('year'))

    # Pobierz dane inflacji
    inflation = db.session.query(Inflation.value).filter_by(year=year%1000, month=month).first()
    inflation_value = inflation.value if inflation else 'Brak danych'

    # Pobierz dane PKB
    if month in [1, 2, 3]:
        quarter = 'Q1'
    elif month in [4, 5, 6]:
        quarter = 'Q2'
    elif month in [7, 8, 9]:
        quarter = 'Q3'
    else:
        quarter = 'Q4'

    gdp = db.session.query(GDP.value).filter_by(year=year, quarter=quarter).first()
    gdp_value = gdp.value if gdp else 'Brak danych'

    # Pobierz dane bezrobocia
    unemployment_data = db.session.query(UnemploymentData).filter_by(year=year, month=month, region=region).first()
    unemployment_value = unemployment_data.unemployment_rate if unemployment_data else 'Brak danych'
    unemployed_value = unemployment_data.unemployed if unemployment_data else 'Brak danych'

    # Pobierz dane bezrobocia dla wykresu
    unemployment_data_all = db.session.query(UnemploymentData).filter_by(region=region).all()
    unemployment_data_list = [
        {
            'year': data.year,
            'month': data.month,
            'unemployed': data.unemployed,
            'unemployment_rate': data.unemployment_rate
        } for data in unemployment_data_all
    ]

    data = {
        'inflation': inflation_value,
        'gdp': gdp_value,
        'unemployment_rate': unemployment_value,
        'unemployed': unemployed_value,
        'unemployment_data': unemployment_data_list
    }

    return jsonify(data)
