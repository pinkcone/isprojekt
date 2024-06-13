// Inicjalizacja mapy bez warstwy kafelkowej
var map = L.map('map', {
    center: [52.237049, 19.145136],
    zoom: 6,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    touchZoom: false
});

// URL do pliku GeoJSON z województwami Polski
var geojsonUrl = "/static/poland.geojson";

// Funkcja stylizująca
function style(feature) {
    return {
        fillColor: "#ccc",
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

var highlightedLayers = [];
var selectedRegions = [];

// Predefined color dictionary for regions
var regionColors = {
    'Dolnośląskie': '#FF5733',
    'Kujawsko-Pomorskie': '#33FF57',
    'Lubelskie': '#3357FF',
    'Lubuskie': '#FF33A1',
    'Łódzkie': '#FF8333',
    'Małopolskie': '#33FFF8',
    'Mazowieckie': '#D433FF',
    'Opolskie': '#A1FF33',
    'Podkarpackie': '#FF3357',
    'Podlaskie': '#33A1FF',
    'Pomorskie': '#A133FF',
    'Śląskie': '#33FFA1',
    'Świętokrzyskie': '#FF5733',
    'Warmińsko-Mazurskie': '#33FF57',
    'Wielkopolskie': '#3357FF',
    'Zachodniopomorskie': '#FF33A1'
};

// Inicjalizacja wykresu
var ctx = document.getElementById('unemploymentChart').getContext('2d');
var unemploymentChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        maintainAspectRatio: false, // Ensure the chart scales correctly
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Funkcja do aktualizacji wykresu
function updateChart() {
    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endMonth = document.getElementById('endMonthSelect').value;
    const endYear = document.getElementById('endYearSelect').value;
    const dataType = document.getElementById('dataTypeSelect').value;

    if (!startMonth || !startYear) {
        alert('Wybierz początkową datę!');
        return;
    }

    if (!endMonth || !endYear) {
        // Only display numerical data if only start date is selected
        displayNumericalData();
        return;
    }

    unemploymentChart.data.datasets = []; // Clear existing datasets
    unemploymentChart.data.labels = []; // Clear existing labels

    let allLabels = new Set();
    let regionsToFetch = selectedRegions.length > 0 ? selectedRegions : ['POLSKA'];

    const fetchDataPromises = regionsToFetch.map(region => {
        return fetch(`/get_data?region=${region}&month=${startMonth}&year=${startYear}`)
            .then(response => response.json())
            .then(data => {
                const filteredData = filterDataByDateRange(data.unemployment_data, startMonth, startYear, endMonth, endYear);
                const labels = filteredData.map(item => `${item.year}-${item.month}`);
                labels.forEach(label => allLabels.add(label));

                var color = regionColors[region] || '#000000'; // Default to black for POLSKA
                var dataset = {
                    label: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} (${region})`,
                    data: filteredData.map(item => item[dataType]),
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1,
                    fill: false
                };

                unemploymentChart.data.datasets.push(dataset);

                // Add GDP and inflation if selected and if POLSKA
                if (region === 'POLSKA') {
                    if (dataType === 'gdp') {
                        data.gdp_data.forEach(gdpEntry => {
                            const gdpValue = gdpEntry.value;
                            unemploymentChart.data.datasets.push({
                                label: `PKB (${gdpEntry.year} ${gdpEntry.quarter})`,
                                data: Array.from(allLabels).map(label => {
                                    const [year, month] = label.split('-');
                                    return gdpEntry.year == year ? gdpValue : null;
                                }),
                                backgroundColor: '#FFA500', // Orange for GDP
                                borderColor: '#FFA500',
                                borderWidth: 1,
                                fill: false
                            });
                        });
                    } else if (dataType === 'inflation') {
                        data.inflation_data.forEach(inflationEntry => {
                            const inflationValue = inflationEntry.value;
                            unemploymentChart.data.datasets.push({
                                label: `Inflacja (${inflationEntry.year}-${inflationEntry.month})`,
                                data: Array.from(allLabels).map(label => {
                                    const [year, month] = label.split('-');
                                    return inflationEntry.year == year && inflationEntry.month == month ? inflationValue : null;
                                }),
                                backgroundColor: '#FF00FF', // Magenta for Inflation
                                borderColor: '#FF00FF',
                                borderWidth: 1,
                                fill: false
                            });
                        });
                    }
                }
            })
            .catch(error => console.error('Błąd:', error));
    });

    Promise.all(fetchDataPromises).then(() => {
        unemploymentChart.data.labels = Array.from(allLabels).sort();
        unemploymentChart.update();
        document.getElementById('chartContainer').style.display = 'block'; // Ensure chart container is visible
        document.getElementById('info').style.display = 'none'; // Hide numerical data
    });
}

// Funkcja do filtrowania danych na podstawie przedziału czasowego
function filterDataByDateRange(data, startMonth, startYear, endMonth, endYear) {
    return data.filter(item => {
        const itemDate = new Date(item.year, item.month - 1);
        const startDate = new Date(startYear, startMonth - 1);
        const endDate = new Date(endYear, endMonth - 1);
        return itemDate >= startDate && itemDate <= endDate;
    });
}

// Funkcja do wyświetlania danych liczbowych
function displayNumericalData() {
    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const dataType = document.getElementById('dataTypeSelect').value;

    document.getElementById('info').innerHTML = ''; // Clear existing numerical data

    let regionsToFetch = selectedRegions.length > 0 ? selectedRegions : ['POLSKA'];

    const fetchDataPromises = regionsToFetch.map(region => {
        return fetch(`/get_data?region=${region}&month=${startMonth}&year=${startYear}`)
            .then(response => response.json())
            .then(data => {
                updateInfo(data, region, dataType);
            })
            .catch(error => console.error('Błąd:', error));
    });

    Promise.all(fetchDataPromises).then(() => {
        document.getElementById('chartContainer').style.display = 'none'; // Hide chart container
        document.getElementById('info').style.display = 'block'; // Show numerical data
    });
}

// Funkcja do aktualizacji informacji
function updateInfo(data, region, dataType) {
    var infoDiv = document.getElementById('info');
    var regionDiv = document.createElement('div');
    regionDiv.innerHTML = `
        <h3>Region: ${region}</h3>
        <p>${dataType.charAt(0).toUpperCase() + dataType.slice(1)}: ${data[dataType]}</p>
    `;
    infoDiv.appendChild(regionDiv);
}

// Podświetlanie województwa po kliknięciu
function highlightFeature(e) {
    var layer = e.target;
    var region = layer.feature.properties.name;

    if (selectedRegions.includes(region)) {
        // Usuń region z wybranych i zresetuj styl
        selectedRegions = selectedRegions.filter(r => r !== region);
        geojson.resetStyle(layer);
        highlightedLayers = highlightedLayers.filter(l => l !== layer);

        // Zaktualizuj wykres
        unemploymentChart.data.datasets = unemploymentChart.data.datasets.filter(ds => !ds.label.includes(region));
        unemploymentChart.update();

        // Show POLSKA data if no regions are selected
        if (selectedRegions.length === 0) {
            updateChart();
        }

        return;
    }

    if (!regionColors[region]) {
        alert('Kolor nie został zdefiniowany dla wybranego regionu.');
        return;
    }

    selectedRegions.push(region);

    layer.setStyle({
        fillColor: regionColors[region],
        weight: 5,
        color: 'black',
        dashArray: '',
        fillOpacity: 0.7
    });

    highlightedLayers.push(layer);

    updateChart();
}

// Resetowanie podświetlenia
function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

// Przypisanie zdarzeń
function onEachFeature(feature, layer) {
    layer.on({
        click: highlightFeature
    });
}

// Pobranie i wyświetlenie danych GeoJSON
var geojson;
fetch(geojsonUrl)
    .then(response => response.json())
    .then(data => {
        geojson = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(function(error) {
        console.log("Error loading or parsing data: ", error);
    });

// Dodanie nasłuchiwaczy zdarzeń na selektory
document.getElementById('startMonthSelect').addEventListener('change', function() {
    updateChart();
});

document.getElementById('startYearSelect').addEventListener('change', function() {
    updateChart();
});

document.getElementById('endMonthSelect').addEventListener('change', function() {
    updateChart();
});

document.getElementById('endYearSelect').addEventListener('change', function() {
    updateChart();
});

document.getElementById('dataTypeSelect').addEventListener('change', function() {
    updateChart();
});
