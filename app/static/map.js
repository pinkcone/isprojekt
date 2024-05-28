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

// Podświetlanie województwa po kliknięciu
function highlightFeature(e) {
    if (highlightedLayer) {
        geojson.resetStyle(highlightedLayer);
    }

    var layer = e.target;

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
    var infoDiv = document.getElementById('info');
    infoDiv.innerHTML = 'Województwo: ' + layer.feature.properties.name;
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
