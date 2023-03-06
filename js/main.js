// Declare global variables
var map;
var dataStats = {};

// Create the basemap
function createMap() {
    map = L.map('map', {
        center: [20, 32],
        zoom: 3
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    getData();
};


// Create the Popup Content Class and properties
function PopupContent(properties, attribute) {
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];
    this.employment = properties[attribute];
    this.change = Math.round((properties['ind_2019'] - properties['ind_1991']) * 10) / 10;
    if (this.change > 0) {
        this.change = "+" + this.change;
    }
    this.formatted = "<p><b>Country:</b> " + this.properties.Country + "</p><p><b>" + "Industry Emp. in " + this.year + ":</b> " + Math.round(this.properties[attribute] * 10) / 10 + "%</p>" + "<p><b>28-Year Change:</b> " + this.change + "%</p>";
};


//Percent of Workforce Employed in Industry from 1991 - 2019


function createTitle() {
    title.innerHTML = '<h1 class="title">Percent of Workforce Employed in Industry (1991 - 2019)</h1>';
};


function calcStats(data) {
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for (var country of data.features) {
        //loop through each year
        for (var year = 1991; year <= 2019; year += 1) {
            //get population for current year
            var value = country.properties["ind_" + String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function (a, b) { return a + b; });
    dataStats.mean = sum / allValues.length;
}


// Calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    // Constant factor adjusts symbol sizes evenly
    var minRadius = 3; // default value 5
    // Flannery-ish Apperance Compensation formula (adjusted) default values: 1.0083, 0.5715
    var radius = 1.0083 * Math.pow(attValue / dataStats.min, 0.5715) * minRadius
    return radius;
};


function createPopupContent(properties, attribute) {
    //add Country to popup content string
    var popupContent = "<p><b>Country:</b> " + properties.Country + "</p>";
    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>" + "Industry Emp. in " + year + ":</b> " + Math.round(properties[attribute] * 10) / 10 + "%</p>";
    return popupContent;
};


// Set marker attributes and popup content
function pointToLayer(feature, latlng, attributes) {
    // Determine the attribute for scaling the proportional symbols
    var attribute = attributes[28];
    //create new popup content...Example 1.4 line 1
    var popupContent = new PopupContent(feature.properties, attribute);
    //var popupContent = new PopupContent(feature.properties, attribute);
    // Create marker options
    var options = {
        fillColor: "#D39631",
        color: "#000",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.6,
        radius: 8,
    };
    if (popupContent.change > 0) {
        options.fillColor = '#2FC9B9';
    }
    // For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    // Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);
    // Create circle marker layer
    var layer = L.circleMarker(latlng, options);
    //bind the popup to the circle marker    
    layer.bindPopup(popupContent.formatted, {
        offset: new L.Point(0, -options.radius)
    });
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


//Create new sequence controls
function createSequenceControls(attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

            container.querySelector(".range-slider").max = 28;
            container.querySelector(".range-slider").min = 0;
            container.querySelector(".range-slider").value = 28;
            container.querySelector(".range-slider").step = 1;

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/backarrow.png"></button>');
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forwardarrow.png"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });


    map.addControl(new SequenceControl());    // add listeners after adding control}

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
}


// Resize proportional symbols according to selected date
function updatePropSymbols(attribute) {
    var year = attribute.split("_")[1];
    //update temporal legend
    document.querySelector("span.year").innerHTML = year;

    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            // Update each feature's radius based on new attribute values
            var props = layer.feature.properties
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            // Add formatted attribute to panel content string
            var popupContent = new PopupContent(props, attribute);

            //update popup with new content    
            popup = layer.getPopup();
            popup.setContent(popupContent.formatted).update();
        };

    });
};

function createLegend() {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            container.innerHTML = '<p class="temporalLegend">Percent Employed<br>in Industry in <span class="year">2019</span></p>';
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="190px" height="130px">';
            //array of circle names to base loop on  
            var circles = ["max", "mean", "min"];
            //Example 3.8 line 4...loop to add each circle and text to SVG string
            for (var i = 0; i < circles.length; i++) {
                //Step 3: assign the r and cy attributes            
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 130 - radius;
                //circle string            
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D39631" fill-opacity="0.8" stroke="#000000" cx="65"/>';
                //evenly space out labels            
                var textY = i * 52 + 20;
                //text string            
                svg += '<text id="' + circles[i] + '-text" x="140" y="' + textY + '">' + Math.round(dataStats[circles[i]] * 10) / 10 + "%" + '</text>';
            };
            //close svg string
            svg += "</svg>";
            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', svg);
            return container;
        }
    });
    map.addControl(new LegendControl());
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
function getData(map) {
    // Load the data
    fetch("data/IndustEmp.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json, response) {
            // Calculate minimum data value
            var attributes = processData(json);
            // Call function to create proportional symbols
            calcStats(json);
            createPropSymbols(json, attributes);
            // Call function to create controls
            createSequenceControls(attributes);
            createLegend(attributes);
            createTitle();
        })
};


// Create the map once everything is loaded
document.addEventListener('DOMContentLoaded', createMap);