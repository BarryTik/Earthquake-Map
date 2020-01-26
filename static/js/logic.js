var formatTime = d3.timeFormat("%c");
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(lineData =>{
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(data =>{
    var mapboxAccessToken = "pk.eyJ1IjoiYmFycnl0aWsiLCJhIjoiY2s0ZnJ6dHViMGo3ZDNtbG9qeTlwbTlhaiJ9.mSbR1XgOf-XcELSwuzz3Vw";

    var light = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: mapboxAccessToken
      });

    var dark = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.dark",
        accessToken: mapboxAccessToken
      });

    var terrain = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.mapbox-terrain-v2",
        accessToken: mapboxAccessToken
      });

    var terrainRGB = L.tileLayer("https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        accessToken: mapboxAccessToken
      });

    var satellite = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.satellite",
        accessToken: mapboxAccessToken
      });

    var faultLines = L.geoJSON(lineData);

    
    function onEachFeature(feature, layer) {
    layer.bindPopup("<b>Magnitude: </b>" + feature.properties.mag + "<br><b>Place:</b> " +
        feature.properties.place + "<br><b>Time:</b> " + formatTime(feature.properties.time)
        );
    }

    map = L.map("map", {
        center: [39.50, -98.35],
        zoom: 3,
        layers: [terrain, faultLines]
    });

    

    function colorPicker(value, range){
        var min = range[0];
        var max = range[1];
        value = value - min;
        max = max - min;
        var weight = value/max;
        var desiredColors = {"light": [255, 255, 70], "dark": [71, 71, 21]};
        var colors = [Math.round(desiredColors["light"][0] - (weight * (desiredColors["light"][0] - desiredColors["dark"][0]))), Math.round(desiredColors["light"][1] - (weight * (desiredColors["light"][1] - desiredColors["dark"][1]))), Math.round(desiredColors["light"][2] - (weight * (desiredColors["light"][2] - desiredColors["dark"][2])))]
        output = "#" + colors[0].toString(16) + colors[1].toString(16) + colors[2].toString(16);
        return output;
    }
    var extentTester = []
    for (var i=0; i<data.features.length; i++){
        extentTester.push(data.features[i].properties.mag)
    };
   var extent = d3.extent(extentTester);

    for (var i=0; i< data.features.length; i++){
        L.circle([data.features[i].geometry.coordinates[1],data.features[i].geometry.coordinates[0]], {
            fillOpacity: 0.75,
            stroke: false,
            fillColor: colorPicker(data.features[i].properties.mag, extent),
            radius: (data.features[i].properties.mag - extent[0])*15000
        }).bindPopup("<b>Magnitude: </b>" + data.features[i].properties.mag + "<br><b>Place:</b> " +
        data.features[i].properties.place + "<br><b>Time:</b> " + formatTime(data.features[i].properties.time)
        ).addTo(map);
    };   

    var baseMaps = {
        Dark: dark,
        Light: light,
        Satellite: satellite,
        Terrain: terrain,
        TerrainRGB: terrainRGB
    }

    var overlayMaps = {
        "Fault Lines": faultLines
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend");
        var grades = [0, (1/7)*(extent[1] - extent[0]), (2/7)*(extent[1] - extent[0]), (3/7)*(extent[1] - extent[0]), (4/7)*(extent[1] - extent[0]), (5/7)*(extent[1] - extent[0]), (6/7)*(extent[1] - extent[0]), extent[1] - extent[0]];
        var colors = [colorPicker(grades[0], extent), colorPicker(grades[1], extent), colorPicker(grades[2], extent), colorPicker(grades[3], extent), colorPicker(grades[4], extent), colorPicker(grades[5], extent), colorPicker(grades[6], extent), colorPicker(grades[7], extent)];
        var labels = [];

        var legendInfo = "<h4>Earthquake Magnitude</h4>"+
            "<div class=\"labels\">" +
                "<div class=\"min\">" + extent[0] + "</div>" +
                "<div class=\"max\">" + extent[1] + "</div>"
            "</div>";
        
        div.innerHTML = legendInfo;

        grades.forEach(function(grades, index){
            labels.push("<li style=\"background-color: " + colors[index] + "\"></li>")
        });

        div.innerHTML += "<ul>" + labels.join("") + "</ul>";
        return div;
    };

    legend.addTo(map);

});
});