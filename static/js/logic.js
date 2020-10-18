var formatTime = d3.timeFormat("%c");
var faults;
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(lineData =>{

    faults = Object.assign({},lineData);
    
    var extendedFaults = Object.assign({},lineData);
   
    for(var i=0; i< 241; i++){  // Object.assign isn't making a copy, hard coded value for now.

        var coords = []
        for(var j=0; j< faults["features"][i]["geometry"]["coordinates"].length; j++){
            coords.push([faults["features"][i]["geometry"]["coordinates"][j][0] - 360,faults["features"][i]["geometry"]["coordinates"][j][1]]);
        }
        extendedFaults["features"].push({"type": faults["features"][i]["type"], "properties": faults["features"][i]["properties"], "geometry": {"type": faults["features"][i]["geometry"]["type"], "coordinates": coords}});
    };    
    

    var faultLines = L.geoJSON(faults);
       

    d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(data =>{
        var mapboxAccessToken = "pk.eyJ1IjoiYmFycnl0aWsiLCJhIjoiY2s0ZnJ6dHViMGo3ZDNtbG9qeTlwbTlhaiJ9.mSbR1XgOf-XcELSwuzz3Vw";

        var light = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            tileSize: 512,
            maxZoom: 18,
            zoomOffset: -1,
            id: "mapbox/light-v9",
            accessToken: mapboxAccessToken
        });

        var dark = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            tileSize: 512,
            maxZoom: 18,
            zoomOffset: -1,
            id: "mapbox/dark-v10",
            accessToken: mapboxAccessToken
        });

        var terrain = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: "mapbox.mapbox-terrain-v2",
            accessToken: mapboxAccessToken
        });

        var terrainRGB = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            accessToken: mapboxAccessToken
        });

        var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            tileSize: 512,
            maxZoom: 18,
            zoomOffset: -1,
            id: "mapbox/satellite-v9",
            accessToken: mapboxAccessToken
        });

        
        function onEachFeature(feature, layer) {
        layer.bindPopup("<b>Magnitude: </b>" + feature.properties.mag + "<br><b>Place:</b> " +
            feature.properties.place + "<br><b>Time:</b> " + formatTime(feature.properties.time)
            );
        }

        map = L.map("map", {
            center: [35, -165],
            zoom: 3,
            layers: [light, faultLines]
        });

        

        function colorPicker(value, range){
            var min = range[0];
            var max = range[1];
            value = value - min;
            max = max - min;
            var weight = value/max;
            var desiredColors = {"light": [255, 255, 70], "dark": [71, 71, 21]};
            // var desiredColors = {"light":[255, 255, 70], "dark": [163, 19, 11]};
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

            L.circle([data.features[i].geometry.coordinates[1],data.features[i].geometry.coordinates[0] - 360], {
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
            Terrain: terrain
            // TerrainRGB: terrainRGB
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


        // https://stackoverflow.com/questions/33767463/overlaying-a-text-box-on-a-leaflet-js-map
        L.Control.textbox = L.Control.extend({
            onAdd: function(map) {
                
            var text = L.DomUtil.create('div');
            text.id = "info_text";
            text.innerHTML = "<p>This visualization shows earthquakes over the last week as reported by the <a href='https://earthquake.usgs.gov/'>USGS</a>.</p><p>Circles show earthquakes, darker circles are higher magnitude. Lines show fault lines.</p> <p>Click on a circle to see information for that report.</p>"
            return text;
            },
    
            onRemove: function(map) {
                // Nothing to do here
            }
        });
        L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
        L.control.textbox({ position: 'bottomleft' }).addTo(map);

        

        // Debugging Test Circle
        
        // L.circle([35, -165], {
        //     fillOpacity: 0.75,
        //     stroke: false,
        //     fillColor: "black",
        //     radius: 500000
        // }).bindPopup("TEST").addTo(map);
        

    });
});