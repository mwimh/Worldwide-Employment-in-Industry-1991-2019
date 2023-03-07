// Declare global variables
var map;
var dataStats = {};

// Create the basemap
function createMap() {
    map = L.map('map', {
        center: [22, 55],
        zoom: 3
    });

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    getData();
};

// Create static informational items
function createTitle() {
    // Display Title
    title.innerHTML = '<h1 class="title"><u>Global Shift of Industrial Employment (1991 - 2019)</u><br><font size="5">Top 20 <font color="#2FC9B9">Growing<font color="#000000"> and <font color="#D39631">Shrinking<font color="#000000"> Industrial Sectors Since 1991</h1>';
    // Display Metadata
    info.innerHTML = '<p class="info">Map Data from "The World Bank Group" © 2023</br>Supplemental information from Wikipedia: "Secondary sector of the economy"</br>Map Created by Michael Imhoff for UW-Madison Geography</p>'
    // Display additional information
    story.innerHTML = '<p class="story"><img src="img/indPhoto1.jpg" alt="" width="150" align="left" hspace="20px">The industrial sector includes fields that produce a finished, usable product from raw materials or are involved in construction. Manufacturing is an\
    important activity in promoting economic growth and development. Nations that export manufactured products tend to generate higher marginal GDP growth, that supports higher incomes and therefore tax revenue needed to fund government expenditures like health \
    care and infrastructure.</br></br><img src="img/indPhoto3.jpg" alt="" height="100" align="right" hspace="20px" vspace="10px">This map shows the 20 countries with the most growth and most decline since 1991. A noticable shift in employment in the industrial \
    sector from Western countries to South-East Asia shows the out-sourcing of industry that has occured in the last 30 years. Also of note is significant growth in Qatar and Oman, due primarily to the growth of their Oil Industries.</p>'
    // Display title over slider
    sliderTitle.innerHTML = '<h1 class="sliderTitle">Year Selection (1991 - 2019)</h1>'
};


// Create the Popup Content Class and properties
function PopupContent(properties, attribute) {
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];
    this.employment = properties[attribute];
    // Calculate total change from 1991 to 2019
    this.change = Math.round((properties['ind_2019'] - properties['ind_1991']) * 10) / 10;
    // If the change is positive, add a '+' sign to it
    if (this.change > 0) {
        this.change = "+" + this.change;
    }
    this.formatted = "<p><b>Country:</b> " + this.properties.Country + "</p><p><b>" + "Industry Emp. in " + this.year + ":</b> " + Math.round(this.properties[attribute] * 10) / 10 + "%</p>" + "<p><b>28-Year Change:</b> " + this.change + "%</p>";
};


// Calculate min, max, and mean of the data
function calcStats(data) {
    //create empty array to store all data values
    var allValues = [];
    //loop through each country
    for (var country of data.features) {
        //loop through each year
        for (var year = 1991; year <= 2019; year += 1) {
            //get population for current year
            var value = country.properties["ind_" + String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    //get min, max, mean stats for the array
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
    var radius = 1.0083 * Math.pow(attValue / dataStats.min, 0.52) * minRadius
    return radius;
};


// Create popup content HTML
function createPopupContent(properties, attribute) {
    // Add Country to popup content string
    var popupContent = "<p><b>Country:</b> " + properties.Country + "</p>";
    // Add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>" + "Industry Emp. in " + year + ":</b> " + Math.round(properties[attribute] * 10) / 10 + "%</p>";
    return popupContent;
};


// Set marker attributes and popup content
function pointToLayer(feature, latlng, attributes) {
    // Determine the attribute for scaling the proportional symbols
    var attribute = attributes[28];
    // Create new popup content object
    var popupContent = new PopupContent(feature.properties, attribute);
    // Set marker options
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
    // Bind the popup to the circle marker    
    layer.bindPopup(popupContent.formatted, {
        offset: new L.Point(0, -options.radius)
    });
    // Return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


// Add circle markers for point features to the map
function createPropSymbols(data, attributes) {
    // Create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};


// Resize proportional symbols according to selected date
function updatePropSymbols(attribute) {
    // Create the 'year' variable
    var year = attribute.split("_")[1];
    // Update temporal legend
    document.querySelector("span.year").innerHTML = year;
    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            // Update each feature's radius based on new attribute values
            var props = layer.feature.properties
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            // Add formatted attribute to panel content string
            var popupContent = new PopupContent(props, attribute);
            // Update popup with new content    
            popup = layer.getPopup();
            popup.setContent(popupContent.formatted).update();
        };
    });
};


// Create new sequence controls
function createSequenceControls(attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        // Set parameters for the slider
        onAdd: function () {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            // Create range input element (slider) and add parameters
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
            container.querySelector(".range-slider").max = 28;
            container.querySelector(".range-slider").min = 0;
            container.querySelector(".range-slider").value = 28;
            container.querySelector(".range-slider").step = 1;
            // Add skip buttons and button images
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/backarrow.png"></button>');
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forwardarrow.png"></button>');
            // Disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            // Return the contorl container
            return container;
        }
    });

    // Add the sequence control
    map.addControl(new SequenceControl());
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


// Create a legend
function createLegend() {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        // Set legend parameters and svg image
        onAdd: function () {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            container.innerHTML = '<p class="temporalLegend">Percent Employed<br>in Industry in <span class="year">2019</span></p>';
            // Start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="190px" height="105px">';
            // Array of circle names to base loop on  
            var circles = ["max", "mean", "min"];
            // Loop to add each circle and text to SVG string
            for (var i = 0; i < circles.length; i++) {
                // Assign the r and cy attributes            
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 100 - radius;
                // Circle parameter string            
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#D3D3D3" fill-opacity="0.8" stroke="#000000" cx="65"/>';
                // Evenly space out labels            
                var textY = i * 42 + 12;
                // Text label string            
                svg += '<text id="' + circles[i] + '-text" x="135" y="' + textY + '">' + Math.round(dataStats[circles[i]] * 10) / 10 + "%" + '</text>';
            };
            // Close svg string
            svg += "</svg>";

            // Add attribute legend svg to container            
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
function getData() {
    // Load the data from the data folder
    fetch("data/IndustEmp.geojson")
        .then(function (response) {
            return response.json();
        })
        // Call functions to create the map data
        .then(function (json) {
            var attributes = processData(json);
            // Calculate min, max, and mean
            calcStats(json);
            // Call function to create proportional symbols 
            createPropSymbols(json, attributes);
            // Call function to create controls
            createSequenceControls(attributes);
            // Call function to create the legend
            createLegend(attributes);
            // Add informational panels and titles to the map
            createTitle();
        })
};

// Create the map once everything is loaded
document.addEventListener('DOMContentLoaded', createMap);