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

// Podświetlanie województwa po kliknięciu
function highlightFeature(e) {
    var layer = e.target;
    var region = layer.feature.properties.name;

    if (selectedRegions.includes(region)) {
        // Usuń region z wybranych i zresetuj styl
        selectedRegions = selectedRegions.filter(r => r !== region);
        geojson.resetStyle(layer);
        highlightedLayers = highlightedLayers.filter(l => l !== layer);
    } else {
        if (selectedRegions.length >= 4) {
            alert('Możesz wybrać maksymalnie 4 regiony.');
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
    }

    console.log('Selected regions:', selectedRegions);

    // Zaktualizuj wykres
    updateChart(); // Wywołanie funkcji updateChart bezpośrednio tutaj
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
