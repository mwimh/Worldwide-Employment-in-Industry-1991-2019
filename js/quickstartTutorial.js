
// .map: creates a map and sets initial options, .setView: indicates the initial lat/long of the map view and starting zoom level
var map = L.map('map').setView([51.505, -0.09], 13);

// .tileLayer: points to URL of map image to use as a basemap and sets parameters and attributions for the basemap
var OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    // .addTo: adds the object it's attached to to the map specified
}).addTo(map);

// .marker: creates a point marker at the specified lat/long
var marker = L.marker([51.5, -0.09]).addTo(map);

// .circle: adds a circle centered at the specified lat/long with the parameters that follow
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// .polygon: addas a polygon to the map with verticies at the following lat/long
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

// .bindPopup: attaches a popup message to the indicated object, .openPopup: opens the specified popup on the map immediately
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

// .popup: creates a stand-alone popup
var popup = L.popup()
    // setLatLng: specifies where the popup/marker will be displayed
    .setLatLng([51.513, -0.09])
    // .setContent: what will be displayed in the popup
    .setContent("I am a standalone popup.")
    // .openOn: what map the popup will be displayed on
    .openOn(map);
;

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

// .on: creates a listener function for the specified action and function
map.on('click', onMapClick);

