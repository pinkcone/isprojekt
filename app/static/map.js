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
    'Dolnośląskie': '#FD2D00',  // czerwony
    'Kujawsko-Pomorskie': '#128500',  // zielony
    'Lubelskie': '#003EFF',  // niebieski
    'Lubuskie': '#FB9995',  // różowy
    'Łódzkie': '#63322F',  // brązowy
    'Małopolskie': '#9B00FF',  // fiolet
    'Mazowieckie': '#CBCE00',  // ciemny żółty
    'Opolskie': '#84FF00',  // jasnozielony
    'Podkarpackie': '#E20E6B',  // ciemny różowy
    'Podlaskie': '#00FDF8',  // cyjan
    'Pomorskie': '#FD9800',  // pomarańczowy
    'Śląskie': '#00016C',  // granatowy
    'Świętokrzyskie': '#FFFB00',  // jasnożółty
    'Warmińsko-Mazurskie': '#600063',  // ciemny fiolet
    'Wielkopolskie': '#06A366',  // jakis zielony
    'Zachodniopomorskie': '#B38BE6'  // wyblakły fiolet
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
    .catch(function (error) {
        console.log("Error loading or parsing data: ", error);
    });
