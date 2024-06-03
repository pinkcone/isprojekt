// Inicjalizacja mapy bez warstwy kafelkowej
var map = L.map('map', {
    center: [52.237049, 19.145136],
    zoom: 6,
    zoomControl: false, // Wyłączenie kontroli powiększania
    dragging: false,    // Wyłączenie przeciągania
    scrollWheelZoom: false, // Wyłączenie powiększania kółkiem myszy
    doubleClickZoom: false, // Wyłączenie powiększania podwójnym kliknięciem
    boxZoom: false,         // Wyłączenie zoomowania za pomocą pola
    touchZoom: false        // Wyłączenie zoomowania dotykowego
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

var highlightedLayer;
var selectedRegion = '';

// Inicjalizacja wykresu
var ctx = document.getElementById('unemploymentChart').getContext('2d');
var unemploymentChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Liczba bezrobotnych',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Funkcja do aktualizacji wykresu
function updateChart(data) {
    var labels = data.map(item => `${item.year}-${item.month}`);
    var values = data.map(item => item.unemployed);

    unemploymentChart.data.labels = labels;
    unemploymentChart.data.datasets[0].data = values;
    unemploymentChart.update();
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

// Funkcja do pobierania danych z serwera
function fetchData() {
    const month = document.getElementById('startMonthSelect').value;
    const year = document.getElementById('startYearSelect').value;

    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endMonth = document.getElementById('endMonthSelect').value;
    const endYear = document.getElementById('endYearSelect').value;

    if (!selectedRegion) {
        alert('Wybierz region na mapie!');
        return;
    }

    fetch(`/get_data?region=${selectedRegion}&month=${month}&year=${year}`)
        .then(response => response.json())
        .then(data => {
            const infoDiv = document.getElementById('info');
            const chartContainer = document.getElementById('chartContainer');
            if (startMonth && startYear && endMonth && endYear) {
                infoDiv.style.display = 'none';
                chartContainer.style.display = 'block';
                const filteredData = filterDataByDateRange(data.unemployment_data, startMonth, startYear, endMonth, endYear);
                updateChart(filteredData);
            } else {
                chartContainer.style.display = 'none';
                if (selectedRegion === 'POLSKA') {
                    infoDiv.innerHTML = `
                        <p>Region: ${selectedRegion}</p>
                        <p>Rok: ${year}</p>
                        <p>Miesiąc: ${month}</p>
                        <p>Inflacja: ${data.inflation}</p>
                        <p>PKB: ${data.gdp}</p>
                        <p>Liczba bezrobotnych: ${data.unemployed}</p>
                        <p>Stopa bezrobocia: ${data.unemployment_rate}</p>
                    `;
                } else {
                    infoDiv.innerHTML = `
                        <p>Region: ${selectedRegion}</p>
                        <p>Rok: ${year}</p>
                        <p>Miesiąc: ${month}</p>
                        <p>Liczba bezrobotnych: ${data.unemployed}</p>
                        <p>Stopa bezrobocia: ${data.unemployment_rate}</p>
                    `;
                }
                infoDiv.style.display = 'block';
            }
        })
        .catch(error => console.error('Błąd:', error));
}

// Podświetlanie województwa po kliknięciu
function highlightFeature(e) {
    var layer = e.target;

    if (highlightedLayer === layer) {
        // Jeśli kliknięto zaznaczone województwo, resetuj wybór do "POLSKA"
        geojson.resetStyle(highlightedLayer);
        highlightedLayer = null;
        selectedRegion = 'POLSKA';
        var infoDiv = document.getElementById('info');
        infoDiv.innerHTML = 'Województwo: POLSKA';
        fetchData(); // Pobierz dane dla "POLSKA"
        return;
    }

    if (highlightedLayer) {
        geojson.resetStyle(highlightedLayer);
    }

    layer.setStyle({
        fillColor: 'green',
        weight: 5, // Zwiększenie szerokości linii obwodowej
        color: 'black', // Czarny kolor linii obwodowej
        dashArray: '',
        fillOpacity: 0.7
    });

    // Przenieś zaznaczoną warstwę na wierzch
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    highlightedLayer = layer;

    // Wyświetlanie nazwy województwa
    selectedRegion = layer.feature.properties.name;
    var infoDiv = document.getElementById('info');
    infoDiv.innerHTML = 'Województwo: ' + selectedRegion;

    // Automatyczne pobieranie danych po kliknięciu
    fetchData();
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
    if (selectedRegion) {
        fetchData();
    }
});

document.getElementById('startYearSelect').addEventListener('change', function() {
    if (selectedRegion) {
        fetchData();
    }
});

document.getElementById('endMonthSelect').addEventListener('change', function() {
    if (selectedRegion) {
        fetchData();
    }
});

document.getElementById('endYearSelect').addEventListener('change', function() {
    if (selectedRegion) {
        fetchData();
    }
});
