// Declare global variables
var map;
var minValue;

// Create the basemap
function createMap() {
    map = L.map('map', {
        center: [28, 12],
        zoom: 3
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    getData();
};


// Determine the lowest attribute value
function calculateMinValue(data) {
    // Create empty array to store all data values
    var allValues = [];
    // Loop through each country
    for (var Country of data.features) {
        // Loop through each year
        for (var year = 1991; year <= 2019; year += 1) {
            // Get attribute value for current year
            var value = Country.properties["ind_" + String(year)];
            // Add value to array
            allValues.push(value);
        }
    }
    // Get minimum value of the array
    var minValue = Math.min(...allValues)
    return minValue;
}


// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = .5; // default value 5
    // Flannery Apperance Compensation formula (adjusted) default values: 1.0083, 0.5715
    var radius = 1.0083 * Math.pow(attValue / minValue, 0.9) * minRadius
    return radius;
};


// Set marker attributes and popup content
function pointToLayer(feature, latlng, attributes) {
    // Determine the attribute for scaling the proportional symbols
    var attribute = attributes[0];
    // Create marker options
    var options = {
        fillColor: "#D39631",
        color: "#000",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.6,
        radius: 8,
    };
    // For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    // Create a variable called totChange to determine the symbol color: orange for the countries with the greatest reduction, teal for the countries with the greatest increase
    var totChange = Math.round((feature.properties['ind_2019'] - feature.properties['ind_1991']) * 10) / 10;
    if (totChange > 0) {
        options.fillColor = '#2FC9B9';
        totChange = "+" + totChange;
    }
    // Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);
    // Build popup content string
    var year = attribute.split("_")[1];
    var popupContent = "<p><b>Country:</b> " + feature.properties.Country + "</p><p><b>" + "Industry Emp. in " + year + ":</b> " + Math.round(feature.properties[attribute] * 10) / 10 + "%</p>" + "<p><b>28-Year Change:</b> " + totChange + "%</p>";
    // Bind the popup to the circle marker
    layer.bindPopup(popupContent);
    // Return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


// Add circle markers for point features to the map
function createPropSymbols(data, attributes) {
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};


// Create new sequence controls
function createSequenceControls(attributes) {
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    //set slider attributes and create buttons
    document.querySelector(".range-slider").max = 28;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="forward"></button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend', '<img src="img/backarrow.png" style="width:12px;padding-top:4px">');
    document.querySelector('#forward').insertAdjacentHTML('beforeend', '<img src="img/forwardarrow.png" style="width:12px;padding-top:4px">');

    // Add functionality to the forward/reverse buttons
    document.querySelectorAll('.step').forEach(function (step) {
        step.addEventListener("click", function () {
            var index = document.querySelector('.range-slider').value;
            // Increment or decrement depending on button clicked
            if (step.id == 'forward') {
                index++;
                // If past the last attribute, wrap around to first attribute
                index = index > 28 ? 0 : index;
            } else if (step.id == 'reverse') {
                index--;
                // If past the first attribute, wrap around to last attribute
                index = index < 0 ? 28 : index;
            };
            // Update slider to match index position
            document.querySelector('.range-slider').value = index;
            updatePropSymbols(attributes[index]);
        })

    })

    // Add drag function to the slider
    document.querySelector('.range-slider').addEventListener('input', function () {
        // Get the new index value
        var index = this.value;
        // Update slider to match index position
        updatePropSymbols(attributes[index]);
    });
};


// Resize proportional symbols according to selected date
function updatePropSymbols(attribute, totChange) {
    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            // Update each feature's radius based on new attribute values
            var radius = calcPropRadius(layer.feature.properties[attribute]);
            layer.setRadius(radius);
            // Add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            var popupContent = "<p><b>Country:</b> " + layer.feature.properties.Country + "</p><p><b>" + "Industry Emp. in " + year + ":</b> " + (Math.round(layer.feature.properties[attribute] * 10) / 10) + "%</p>" + "<p><b>28-Year Change:</b> " + (Math.round((layer.feature.properties['ind_2019'] - layer.feature.properties['ind_1991']) * 10) / 10) + "%</p>";
            // Update popup content           
            popup = layer.getPopup();
            popup.setContent(popupContent).update();
        };
    });
};


// Build an attributes array from the data
function processData(data) {
    // Create an empty array to hold attributes
    var attributes = [];
    // Properties of the first feature in the dataset
    var properties = data.features[0].properties;
    // Push each attribute name into attributes array
    for (var attribute in properties) {
        // Only take attributes with actual values
        if (attribute.indexOf("ind") > -1) {
            attributes.push(attribute);
        };
    };
    return attributes;
};


// Load and convert geojson data to be used
function getData() {
    // Load the data
    fetch("data/IndustEmp.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            // Calculate minimum data value
            var attributes = processData(json);
            minValue = calculateMinValue(json);
            // Call function to create proportional symbols
            createPropSymbols(json, attributes);
            // Call function to create controls
            createSequenceControls(attributes);
        })
};

// Create the map once everything is loaded
document.addEventListener('DOMContentLoaded', createMap);