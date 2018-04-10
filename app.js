// query the website for geojson
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
// Perform a GET request to the query URL
d3.json(queryUrl, function (data) {
  // function to create map on features of the geojson
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {
  
  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array

  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      //create circle marker instead of regular marker
      return L.circleMarker(latlng, {
        //run the radius function to generate a proportional radius for the marker based on eq mag
        radius: getRadius(feature.properties.mag),
        //set color scheme for the magnitutdes
        color: getColor(feature.properties.mag)
      })
    }
  });

  // run createMap function
  createMap(earthquakes);
}
var tectonicPlates = new L.LayerGroup();
function createMap(earthquakes) {

  // Define layers
  var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoibWluY2tpbTEyMjIiLCJhIjoiY2pkaGp5NHR0MHd3eDMxbnF6bXlsazhxYiJ9.6WOQPTje5_AYqQO_4W36xQ");

  var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1IjoibWluY2tpbTEyMjIiLCJhIjoiY2pkaGp5NHR0MHd3eDMxbnF6bXlsazhxYiJ9.6WOQPTje5_AYqQO_4W36xQ");

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Street Map": streetmap,
    "Dark Map": darkmap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    "Tectonic Plates": tectonicPlates,
    // "Heat Map" : heatLayer
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    scrollWheelZoom: false,
    layers: [streetmap, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
  //define legend variable
  var legend = L.control({
    position: 'bottomright'
  });

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
      grades = [0, 2, 4, 6, 8],
      labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
  };

  legend.addTo(myMap);
  //function to create tectonic plates
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json",
    function(platedata) {
      // Adding our geoJSON data, along with style information, to the tectonicplates
      // layer.
      L.geoJson(platedata, {
        color: "orange",
        weight: 2
      })
      .addTo(tectonicPlates);

      // Then add the tectonicplates layer to the map.
      // tectonicPlates.addTo(myMap);
    });
    var heatCoords = [];

    d3.json(queryUrl, function(error, response){
      if(error) console.warn(error);
      for( q = 1; q < response.features.length; q++){
        var currQuake = response.features[q];
        var currLong = currQuake.geometry.coordinates[0];
        var currLat = currQuake.geometry.coordinates[1];
        // var currMag = currQuake.geometry.coordinates[2];  
        var currCoords = []
        currCoords.push(currLat,currLong);
        heatCoords.push(currCoords);
      }
      var heat = L.heatLayer(heatCoords, {
        radius: 75,
        max : 1,
        blur: 15,
        gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
      }).addTo(myMap);
    })
  
}
//create a function to magnify the radius
function getRadius(data) {
  return data * 5
}
//create a function to separate the data into color groups based on mag
function getColor(data) {
  return data > 8 ? '#b30000' :
    data > 6 ? '#e34a33' :
    data > 4 ? '#045a8d' :
    data > 2 ? '#2b8cbe' :
    '#74a9cf';
}