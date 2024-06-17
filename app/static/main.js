const translations = {
    'unemployment_rate': 'Stopa bezrobocia',
    'unemployed': 'Liczba bezrobotnych',
    'gdp': 'PKB',
    'inflation': 'Inflacja',
    'pension': 'Emerytury',
    'housing_price': 'Ceny mieszkań'
};

function validateCorrelation() {
    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endMonth = document.getElementById('endMonthSelect').value;
    const endYear = document.getElementById('endYearSelect').value;
    const dataType1 = document.getElementById('dataTypeSelect').value;
    const dataType2 = document.getElementById('dataTypeSelect2').value;

    let message = '';

    if (!startMonth || !startYear || !endMonth || !endYear || !dataType1 || !dataType2) {
        message = 'Proszę uzupełnić wszystkie pola.';
    } else if (selectedRegions.length > 1) {
        message = 'Proszę wybrać maksymalnie jedno województwo.';
    } else if (parseInt(startYear) > parseInt(endYear) || (parseInt(startYear) === parseInt(endYear) && parseInt(startMonth) > parseInt(endMonth))) {
        message = 'Data początkowa nie może być późniejsza niż data końcowa.';
    } else if (parseInt(startYear) === parseInt(endYear) && parseInt(startMonth) === parseInt(endMonth)) {
        message = 'Data początkowa i końcowa nie mogą być takie same.';
    }

    return message;
}

function showAlert(message) {
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.innerHTML = message;
    alertMessage.style.display = 'block';
}

function clearAlert() {
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.style.display = 'none';
}

function clearCorrelation() {
    const correlationContainer = document.getElementById('correlationContainer');
    correlationContainer.innerHTML = '';
}

function updateChart() {
    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endMonth = document.getElementById('endMonthSelect').value;
    const endYear = document.getElementById('endYearSelect').value;
    const dataType1 = document.getElementById('dataTypeSelect').value;
    const dataType2 = document.getElementById('dataTypeSelect2').value;
    const region = selectedRegions.length ? selectedRegions.join(',') : 'POLSKA';

    console.log('Fetching data for:', {
        startMonth, startYear, endMonth, endYear, dataType1, dataType2, region
    });

    resetChart();
    clearCorrelation(); // Clear the correlation data

    fetch(`/get_data?regions=${region}&start_month=${startMonth}&start_year=${startYear}&end_month=${endMonth}&end_year=${endYear}&data_types=${dataType1}&data_types2=${dataType2}`)
        .then(response => response.json())
        .then(data => {
            console.log('Data received:', data);
            drawChart(data, dataType1, dataType2);
        });
}

function calculateCorrelation() {
    clearAlert(); // Clear any previous alerts

    const message = validateCorrelation();
    if (message) {
        showAlert(message);
        return;
    }

    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endMonth = document.getElementById('endMonthSelect').value;
    const endYear = document.getElementById('endYearSelect').value;
    const dataType1 = document.getElementById('dataTypeSelect').value;
    const dataType2 = document.getElementById('dataTypeSelect2').value;
    const region = selectedRegions.length ? selectedRegions.join(',') : 'POLSKA';

    console.log('Fetching correlation data for:', {
        startMonth, startYear, endMonth, endYear, dataType1, dataType2, region
    });

    fetch(`/get_correlation?regions=${region}&start_month=${startMonth}&start_year=${startYear}&end_month=${endMonth}&end_year=${endYear}&data_types=${dataType1}&data_types2=${dataType2}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Correlation received:', data);
            if (data && data.correlation !== undefined) {
                displayCorrelation(data.correlation);
            } else {
                showAlert('Błąd podczas obliczania korelacji.');
            }
        })
        .catch(error => {
            console.error('Error fetching correlation:', error);
            showAlert('Błąd podczas pobierania danych korelacji.');
        });
}

function drawChart(data, dataType1, dataType2) {
    const chartData1 = data[dataType1];
    const chartData2 = data[dataType2] || [];

    const regions1 = [...new Set(chartData1.map(entry => entry.region))];
    const plotData1 = regions1.map(region => {
        const regionData = chartData1.filter(entry => entry.region === region);

        let labels = [];
        let values = [];

        labels = regionData.map(entry => `${entry.month}/${entry.year}`);
        values = regionData.map(entry => entry.value);

        return {
            x: labels,
            y: values,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${region} (${translations[dataType1]})`,
            marker: { color: getRandomColor() }
        };
    });

    const regions2 = [...new Set(chartData2.map(entry => entry.region))];
    const plotData2 = regions2.map(region => {
        const regionData = chartData2.filter(entry => entry.region === region);

        let labels = [];
        let values = [];

        labels = regionData.map(entry => `${entry.month}/${entry.year}`);
        values = regionData.map(entry => entry.value);

        return {
            x: labels,
            y: values,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${region} (${translations[dataType2]})`,
            yaxis: 'y2',
            marker: { color: getRandomColor() }
        };
    });

    const layout = {
        title: `${translations[dataType1]}${dataType2 ? ' & ' + translations[dataType2] : ''}`,
        xaxis: { title: 'Data' },
        yaxis: { title: translations[dataType1] },
        yaxis2: {
            title: translations[dataType2],
            overlaying: 'y',
            side: 'right'
        },
        legend: {
            orientation: 'h',
            y: 1.1
        },
        margin: {
            l: 50,
            r: 50,
            t: 80,
            b: 50,
            pad: 4
        }
    };

    const plotData = plotData1.concat(plotData2);
    Plotly.newPlot('dataChart', plotData, layout, {responsive: true});
}

// Dodaj event listener na resize okna
window.addEventListener('resize', () => {
    Plotly.Plots.resize(document.getElementById('dataChart'));
});

function resetChart() {
    Plotly.purge('dataChart');
}

function displayCorrelation(correlation) {
    const correlationContainer = document.getElementById('correlationContainer');
    correlationContainer.innerHTML = `<h3>Współczynnik korelacji: ${correlation.toFixed(2)}</h3>`;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

document.addEventListener('DOMContentLoaded', function () {
    const selectors = document.querySelectorAll('#startMonthSelect, #startYearSelect, #endMonthSelect, #endYearSelect, #dataTypeSelect, #dataTypeSelect2');

    selectors.forEach(select => {
        select.addEventListener('change', function () {
            updateChart();
            validateCorrelationButton();
        });
    });

    document.getElementById('calculateCorrelationButton').addEventListener('click', function () {
        calculateCorrelation();
    });

    updateChart();
});
