
var startpos = [51.03, -1.379];  // Start location - somewhere in UK :-)
var startzoom = 10;

var ws;
var map;
var allData = {};
var markers = {};
var polygons = {};
var layers = {};
var overlays = {};
var basemaps = {};
var marks = [];
var buttons = {};
var marksIndex = 0;
var popid = "";
var menuOpen = false;
var clusterAt = 0;
var maxage = 600;   // default max age of icons on map in seconds - cleared after 10 mins
var baselayername = "OSM grey";     // Default base layer OSM but uniform grey
var ibmfoot = "&nbsp;&copy; IBM 2015,2019"
var inIframe = false;
var showUserMenu = true;
var showLayerMenu = true;
var showMouseCoords = false;
var sidebyside;
var layercontrol;

var iconSz = {
  "Team/Crew": 24,
  "Squad": 24,
  "Section": 24,
  "Platoon/detachment": 26,
  "Company/battery/troop": 28,
  "Battalion/squadron": 30,
  "Regiment/group": 32,
  "Brigade": 34,
  "Division": 36,
  "Corps/MEF": 36,
  "Army": 40,
  "Army Group/front": 40,
  "Region/Theater": 44,
  "Command": 44
};

// Create the socket
var connect = function() {
    ws = new SockJS(location.pathname.split("index")[0] + 'socket');
    ws.onopen = function() {
        console.log("CONNECTED");
        if (!inIframe) {
            document.getElementById("footer").innerHTML = "<font color='#494'>"+ibmfoot+"</font>";
        }
        ws.send(JSON.stringify({action:"connected"}));
        onoffline();
    };
    ws.onclose = function() {
        console.log("DISCONNECTED");
        if (!inIframe) {
            document.getElementById("footer").innerHTML = "<font color='#900'>"+ibmfoot+"</font>";
        }
        setTimeout(function() { connect(); }, 2500);
    };
    ws.onmessage = function(e) {
        var data = JSON.parse(e.data);
        //console.log("DATA" typeof data,data);
        if (Array.isArray(data)) {
            //console.log("ARRAY");
            // map.closePopup();
            // var bnds= L.latLngBounds([0,0]);
            for (var prop in data) {
                if (data[prop].command) { doCommand(data[prop].command); delete data[prop].command; }
                if (data[prop].hasOwnProperty("name")) {
                    setMarker(data[prop]);
                    // bnds.extend(markers[data[prop].name].getLatLng());
                }
                else { console.log("SKIP A",data[prop]); }
            }
            // map.fitBounds(bnds.pad(0.25));
        }
        else {
            if (data.command) { doCommand(data.command); delete data.command; }
            if (data.hasOwnProperty("name")) { setMarker(data); }
            else if (data.hasOwnProperty("type")) { doGeojson(data); }
            else {
                console.log("SKIP",data);
                // if (typeof data === "string") { doDialog(data); }
                // else { console.log("SKIP",data); }
            }
        }
    };
}
console.log("CONNECT TO",location.pathname + 'socket');

window.onunload = function() { if (ws) ws.close(); }

var onoffline = function() { if (!navigator.onLine) map.addLayer(layers["_countries"]); }

// Set Ctl-Alt-3 to switch to 3d view
document.addEventListener ("keydown", function (ev) {
    if (ev.ctrlKey && ev.altKey && ev.code === "Digit3") {
        ws.close();
        window.location.href = "index3d.html";
    }
});

// Create the Initial Map object.
map = new L.map('map').setView(startpos, startzoom);

// Create some buttons
var menuButton = L.easyButton({states:[{icon:'fa-bars fa-lg', onClick:function() { toggleMenu(); }, title:'Toggle menu'}], position:"topright"});
var fullscreenButton = L.control.fullscreen();
var rulerButton = L.control.ruler({position:"topleft"});

//var colorPickButton = L.easyButton({states:[{icon:'fa-tint fa-lg', onClick:function() { console.log("PICK"); }, title:'Pick Colour'}]});
var redButton = L.easyButton('fa-square wm-red', function(btn) { console.log("RED",btn); })
var blueButton = L.easyButton('fa-square wm-blue', function(btn) { console.log("BLUE",btn); })
var greenButton = L.easyButton('fa-square wm-green', function(btn) { console.log("GREEN",btn); })
var yellowButton = L.easyButton('fa-square wm-yellow', function(btn) { console.log("YELLOW",btn); })
var blackButton = L.easyButton('fa-square wm-black', function(btn) { console.log("BLACK",btn); })
var colorControl = L.easyBar([redButton,blueButton,greenButton,yellowButton,blackButton]);

// Move some bits around if in an iframe
if (window.self !== window.top) {
    console.log("IN an iframe");
    inIframe = true;
    if (showUserMenu) { menuButton.addTo(map); }
    document.getElementById("topbar").style.display="none";
    document.getElementById("map").style.top="0px";
    document.getElementById("results").style.right="50px";
    document.getElementById("results").style.top="10px";
    document.getElementById("results").style.zIndex="1";
    document.getElementById("results").style.height="31px";
    document.getElementById("results").style.paddingTop="6px";
    document.getElementById("bars").style.display="none";
    document.getElementById("menu").style.right="8px";
    document.getElementById("menu").style.borderRadius="6px";
}
else {
    console.log("NOT in an iframe");
    if (!showUserMenu) { document.getElementById("bars").style.display="none"; }

    // Add the fullscreen button
    fullscreenButton.addTo(map);

    // Add the locate my position button
    L.easyButton( 'fa-crosshairs fa-lg', function() {
        map.locate({setView:true, maxZoom:16});
    }, "Locate me").addTo(map);
    function onLocationFound(e) {
        var radius = e.accuracy;
        //L.marker(e.latlng).addTo(map).bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius, {color:"cyan", weight:4, opacity:0.8, fill:false, clickable:false}).addTo(map);
        if (e.hasOwnProperty("heading")) {
            var lengthAsDegrees = e.speed * 60 / 110540;
            var ya = e.latlng.lat + Math.sin((90-e.heading)/180*Math.PI)*lengthAsDegrees*Math.cos(e.latlng.lng/180*Math.PI);
            var xa = e.latlng.lng + Math.cos((90-e.heading)/180*Math.PI)*lengthAsDegrees;
            var lla = new L.LatLng(ya,xa);
            L.polygon([ e.latlng, lla ], {color:"cyan", weight:3, opacity:0.8, clickable:false}).addTo(map);
        }
        ws.send(JSON.stringify({action:"point", lat:e.latlng.lat.toFixed(5), lon:e.latlng.lng.toFixed(5), point:"self", bearing:e.heading, speed:(e.speed*3.6 || undefined)}));
    }
    function onLocationError(e) { console.log(e.message); }
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    // Add the measure/ruler button
    rulerButton.addTo(map);

    // Create the clear heatmap button
    var clrHeat = L.easyButton( '<b>Reset Heatmap</b>', function() {
        console.log("Reset heatmap");
        heat.setLatLngs([]);
    }, "Clears the current heatmap", "bottomright");
}

var helpText = `<table>
<tr><td><input type='text' name='search' id='search' size='20' style="width:150px;"/>&nbsp;<span onclick='doSearch();'><i class="fa fa-search fa-lg"></i></span></td></tr>
<tr><td style="cursor:default"><i class="fa fa-spinner fa-lg fa-fw"></i> Set Max Age <input type='text' name='maxage' id='maxage' value="600" size="5" onchange='setMaxAge();'/>s</td></tr>
<tr><td style="cursor:default"><i class="fa fa-search-plus fa-lg fa-fw"></i> Cluster at zoom &lt;<input type='text' name='setclus' id='setclus' size="2" onchange='setCluster(this.value);'/></td></tr>
<tr><td style="cursor:default"><input type='checkbox' id='panit' onclick='doPanit(this.checked);'/> Auto Pan Map</td></tr>
<tr><td style="cursor:default"><input type='checkbox' id='lockit' onclick='doLock(this.checked);'/> Lock Map</td></tr>
<tr><td style="cursor:default"><input type='checkbox' id='heatall' onclick='doHeatAll(this.checked);'/> Heatmap all layers</td></tr>`
if (!inIframe) { helpText += `<tr><td style="cursor:default"><span id="showHelp" onclick='doDialog(helpText);'><i class="fa fa-info fa-lg fa-fw"></i>Help</span></td></tr></table>`; }
else { helpText += `</table>` }
document.getElementById('menu').innerHTML = helpText;

if (showUserMenu) {
    if ( window.localStorage.hasOwnProperty("lastpos") ) {
        var sp = JSON.parse(window.localStorage.getItem("lastpos"));
        startpos = [ sp.lat, sp.lng ];
    }
    if ( window.localStorage.hasOwnProperty("lastzoom") ) {
        startzoom = window.localStorage.getItem("lastzoom");
    }
    // if ( window.localStorage.hasOwnProperty("clusterat") ) {
    //     clusterAt = window.localStorage.getItem("clusterat");
    //     document.getElementById("setclus").value = clusterAt;
    // }
    if ( window.localStorage.hasOwnProperty("maxage") ) {
        maxage = window.localStorage.getItem("maxage");
        document.getElementById("maxage").value = maxage;
    }
}

// Add graticule
var showGrid = false;
var Lgrid = L.latlngGraticule({
	font: "Verdana",
    fontColor: "#666",
    zoomInterval: [
		{start:1, end:2, interval:40},
		{start:3, end:3, interval:20},
		{start:4, end:4, interval:10},
		{start:5, end:7, interval:5},
		{start:8, end:20, interval:1}
	]
});

var panit = false;
function doPanit(v) {
    if (v !== undefined) { panit = v; }
    console.log("Panit set :",panit);
}

var heatAll = false;
function doHeatAll(v) {
    if (v !== undefined) { heatall = v; }
    console.log("Heatall set :",heatAll);
}

var lockit = false;
var mb = new L.LatLngBounds([[-120,-360],[120,360]]);
function doLock(v) {
    if (v !== undefined) { lockit = v; }
    if (lockit === false) {
        mb = new L.LatLngBounds([[-120,-360],[120,360]]);
    }
    else {
        mb = map.getBounds();
        window.localStorage.setItem("lastpos",JSON.stringify(map.getCenter()));
        window.localStorage.setItem("lastzoom", map.getZoom());
        window.localStorage.setItem("lastlayer", baselayername);
        //window.localStorage.setItem("clusterat", clusterAt);
        window.localStorage.setItem("maxage", maxage);
        console.log("Saved :",JSON.stringify(map.getCenter()),map.getZoom(),baselayername);
    }
    map.setMaxBounds(mb);
    //console.log("Map bounds lock :",lockit);
}

// Remove old markers
function doTidyUp(l) {
    var d = parseInt(Date.now()/1000);
    for (var m in markers) {
        if ((l && (l == markers[m].lay)) || typeof markers[m].ts != "undefined") {
            if ((l && (l == markers[m].lay)) || (markers[m].hasOwnProperty("ts") && (Number(markers[m].ts) < d) && (markers[m].lay !== "_drawing"))) {
                //console.log("STALE :",m);
                layers[markers[m].lay].removeLayer(markers[m]);
                if (typeof polygons[m] != "undefined") {
                    layers[markers[m].lay].removeLayer(polygons[m]);
                    delete polygons[m];
                }
                if (typeof polygons[m+"_"] != "undefined") {
                    layers[polygons[m+"_"].lay].removeLayer(polygons[m+"_"]);
                    delete polygons[m+"_"];
                }
                delete markers[m];
            }
        }
    }
    if (l) {
        if (layers[l]) { map.removeLayer(layers[l]); layercontrol.removeLayer(layers[l]); delete layers[l]; }
        if (overlays[l]) { map.removeLayer(overlays[l]); layercontrol.removeLayer(overlays[l]); delete overlays[l]; }
    }
}

// Call tidyup every {maxage} seconds - default 10 mins
var stale = null;
function setMaxAge() {
    maxage = document.getElementById('maxage').value;
    if (stale) { clearInterval(stale); }
    //if (maxage > 0) {
    stale = setInterval( function() { doTidyUp() }, 20000); // check every 20 secs
    //} //every minute
    //console.log("Stale time set :",maxage+"s");
}
setMaxAge();

// move the daylight / nighttime boundary (if enabled) every minute
function moveTerminator() { // if terminator line plotted move it every minute
    if (layers["_daynight"].getLayers().length > 0) {
        layers["_daynight"].clearLayers();
        layers["_daynight"].addLayer(L.terminator());
    }
}
setInterval( function() { moveTerminator() }, 60000 );

function setCluster(v) {
    clusterAt = v || 0;
    console.log("clusterAt set:",clusterAt);
    showMapCurrentZoom();
}

// Search for markers with names of ... or icons of ...
function doSearch() {
    var value = document.getElementById('search').value;
    marks = [];
    marksIndex = 0;
    for (var key in markers) {
        if ( (~(key.toLowerCase()).indexOf(value.toLowerCase())) && (mb.contains(markers[key].getLatLng()))) {
            marks.push(markers[key]);
        }
        if (markers[key].icon === value) {
            marks.push(markers[key]);
        }
    }
    moveToMarks();
    if (marks.length === 0) {
        // If no markers found let's try a geolookup...
        var protocol = location.protocol;
        if (protocol == "file:") { protocol = "https:"; }
        var searchUrl = protocol + "//nominatim.openstreetmap.org/search?format=json&limit=1&q=";

        fetch(searchUrl + value) // Call the fetch function passing the url of the API as a parameter
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            if (data.length > 0) {
                var bb = data[0].boundingbox;
                map.fitBounds([ [bb[0],bb[2]], [bb[1],bb[3]] ]);
                map.panTo([data[0].lat, data[0].lon]);
            }
            else {
                document.getElementById('searchResult').innerHTML = "&nbsp;<font color='#ff0'>Not Found</font>";
            }
        })
        .catch(function(err) {
            if (err.toString() === "TypeError: Failed to fetch") {
                document.getElementById('searchResult').innerHTML = "&nbsp;<font color='#ff0'>Not Found</font>";
            }
        });
    }
    else {
        if (lockit) {
            document.getElementById('searchResult').innerHTML = "&nbsp;<font color='#ff0'>Found "+marks.length+" results within bounds.</font>";
        } else {
            document.getElementById('searchResult').innerHTML = "&nbsp;<font color='#ff0'>Found "+marks.length+" results.</font>";
        }
    }
}

// Jump to a markers position - centralise it on map
function moveToMarks() {
    if (marks.length > marksIndex) {
        var m = marks[marksIndex];
        map.setView(m.getLatLng(), map.getZoom());
        m.openPopup();
        marksIndex++;
        setTimeout(moveToMarks, 2500);
    }
}

// Clear Search With Marker names
function clearSearch() {
    var value = document.getElementById('search').value;
    marks = [];
    marksIndex = 0;
    for (var key in markers) {
        if ( (~(key.toLowerCase()).indexOf(value.toLowerCase())) && (mb.contains(markers[key].getLatLng()))) {
            marks.push(markers[key]);
        }
    }
    removeMarks();
    if (lockit) {
        document.getElementById('searchResult').innerHTML = "";
    }
    else {
        document.getElementById('searchResult').innerHTML = "";
    }
}

function removeMarks() {
    if (marks.length > marksIndex) {
        var m = marks[marksIndex];
        map.setView(m.getLatLng(), map.getZoom());
        m.closePopup();
        marksIndex++;
    }
}

function toggleMenu() {
    menuOpen = !menuOpen;
    if (menuOpen) {
        document.getElementById("menu").style.display = 'block';
    } else {
        document.getElementById("menu").style.display = 'none';
        dialogue.close();
    }
}

function openMenu() {
    if (!menuOpen) {
        menuOpen = true;
        document.getElementById("menu").style.display = 'block';
    }
}

function closeMenu() {
    if (menuOpen) {
        menuOpen = false;
        document.getElementById("menu").style.display = 'none';
    }
    dialogue.close();
}

document.getElementById("menu").style.display = 'none';

map.on('overlayadd', function(e) {
    if (typeof overlays[e.name].bringToFront === "function") {
        overlays[e.name].bringToFront();
    }
    if (e.name == "satellite") {
        overlays["satellite"].bringToBack();
    }
    if (e.name == "countries") {
        overlays["countries"].bringToBack();
    }
    if (e.name == "heatmap") { // show heatmap button when it's layer is added.
        clrHeat.addTo(map);
    }
    if (e.name == "day/night") {
        layers["_daynight"].addLayer(L.terminator());
    }
    if (e.name == "drawing") {
        overlays["drawing"].bringToFront();
        map.addControl(drawControl);
        //map.addControl(colorControl);
    }
    ws.send(JSON.stringify({action:"addlayer", name:e.name}));
});

map.on('overlayremove', function(e) {
    if (e.name == "heatmap") { // hide heatmap button when it's layer is removed.
        clrHeat.removeFrom(map);
    }
    if (e.name == "day/night") {
        layers["_daynight"].clearLayers();
    }
    if (e.name == "drawing") {
        //map.removeControl(colorControl);
        map.removeControl(drawControl);
    }
    ws.send(JSON.stringify({action:"dellayer", name:e.name}));
});

map.on('baselayerchange', function(e) {
    //console.log("base layer now :",e.name);
    baselayername = e.name;
    ws.send(JSON.stringify({action:"layer", name:e.name}));
});

function showMapCurrentZoom() {
    console.log("zoom:",map.getZoom(),". clusterAt:",clusterAt);
    for (var l in layers) {
        if (layers[l].hasOwnProperty("_zoom")) {
            if (map.getZoom() >= clusterAt) {
                layers[l].disableClustering();
            }
            else {
                layers[l].enableClustering();
            }
        }
    }
    setTimeout( function() {
        for (var key in markers) {
            if (polygons[key]) {
                if (typeof layers[markers[key].lay].getVisibleParent === 'function') {
                    var vis = layers[markers[key].lay].getVisibleParent(markers[key]);
                    if ((vis) && (vis.hasOwnProperty("lay"))) {
                        polygons[key].setStyle({opacity:1});
                    }
                    else {
                        polygons[key].setStyle({opacity:0});
                    }
                }
                polygons[key].redraw();
            }
        }
    },750);
}

map.on('zoomend', function() {
    showMapCurrentZoom();
});

//map.on('contextmenu', function(e) {
//    ws.send(JSON.stringify({action:"rightclick", lat:e.latlng.lat.toFixed(5), lon:e.latlng.lng.toFixed(5)}));
//});

// single right click to add a marker
var addmenu = "<b>Add marker</b><br><input type='text' id='rinput' autofocus onkeydown='if (event.keyCode == 13) addThing();' placeholder='name (,icon, layer, colour)'/>";
var rightmenuMap = L.popup({keepInView:true, minWidth:250}).setContent(addmenu);

var rclk;
var hiderightclick = false;
var addThing = function() {
    var thing = document.getElementById('rinput').value;
    map.closePopup();
    //popped = false;
    var bits = thing.split(",");
    var icon = (bits[1] || "circle").trim();
    var lay = (bits[2] || "_drawing").trim();
    var colo = (bits[3] || "#910000").trim();
    var drag = true;
    var regi = /^[S,G,E,I,O][A-Z]{4}.*/i;  // if it looks like a SIDC code
    var d = {action:"point", name:bits[0].trim(), layer:lay, draggable:drag, lat:rclk.lat, lon:rclk.lng};
    if (regi.test(icon)) {
        d.SIDC = (icon.toUpperCase()+"------------").substr(0,12);
    }
    else {
        d.icon = icon;
        d.iconColor = colo;
    }
    ws.send(JSON.stringify(d));
    delete d.action;
    setMarker(d);
    map.addLayer(layers[lay]);
}

var feedback = function(n,v,a) {
    ws.send(JSON.stringify({action:a||"feedback", name:n, value:v}));
}

// allow double right click to zoom out (if enabled)
// single right click opens a message window that adds a marker
var rclicked = false;
var rtout = null;
map.on('contextmenu', function(e) {
    if (rclicked) {
        rclicked = false;
        clearTimeout(rtout);
        if (map.doubleClickZoom.enabled()) {
            map.zoomOut();
        }
    }
    else {
        rclicked = true;
        rtout = setTimeout( function() {
            rclicked = false;
            if ((hiderightclick !== true) && (addmenu.length > 0)) {
                rclk = e.latlng;
                rightmenuMap.setLatLng(e.latlng);
                map.openPopup(rightmenuMap);
                setTimeout( function() {
                    document.getElementById('rinput').focus();
                }, 200);
            }
        }, 300);
    }
});

// Add all the base layer maps

// Use this for OSM online maps
var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
//var osmUrl='https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors';
var osmg = new L.TileLayer.Grayscale(osmUrl, {attribution:osmAttrib, maxNativeZoom:19, maxZoom:20});
basemaps["OSM grey"] = osmg;
var osm = new L.TileLayer(osmUrl, {attribution:osmAttrib, maxNativeZoom:19, maxZoom:20});
basemaps["OSM"] = osm;

// Extra Leaflet map layers from https://leaflet-extras.github.io/leaflet-providers/preview/
var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri', maxNativeZoom:19, maxZoom:20
});
basemaps["Esri"] = Esri_WorldStreetMap;

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution:'Tiles &copy; Esri', maxNativeZoom:19, maxZoom:20
});
basemaps["Esri Satellite"] = Esri_WorldImagery;

var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
});
basemaps["Esri Topography"] = Esri_WorldTopoMap;

// var Esri_WorldShadedRelief = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
//     attribution: 'Tiles &copy; Esri',
//     maxNativeZoom:13
// });
// basemaps["Esri Terrain"] = Esri_WorldShadedRelief;

var Esri_OceanBasemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
	maxZoom: 13
});
basemaps["Esri Ocean"] = Esri_OceanBasemap;

var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
	maxZoom: 16
});
basemaps["Esri Dark Grey"] = Esri_WorldGrayCanvas;

// var OpenMapSurfer_Roads = L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}', {
//     maxZoom: 18,
//     attribution: 'Imagery from <a href="https://giscience.uni-hd.de/">University of Heidelberg</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// });
// basemaps["Mapsurfer"] = OpenMapSurfer_Roads;

// var MapQuestOpen_OSM = L.tileLayer('https://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
//     type: 'map',
//     ext: 'jpg',
//     attribution: 'Tiles Courtesy of <a href="https://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//     subdomains: '1234',
//     maxNativeZoom: 17
// });
//basemaps["MapQuest OSM"] = MapQuestOpen_OSM;

var Esri_NatGeoWorldMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxNativeZoom:12
});
basemaps["Nat Geo"] = Esri_NatGeoWorldMap;

var NLS_OS_opendata = L.tileLayer('https://geo.nls.uk/maps/opendata/{z}/{x}/{y}.png', {
    attribution: '<a href="https://geo.nls.uk/maps/">National Library of Scotland Historic Maps</a>',
    bounds: [[49.6, -12], [61.7, 3]],
    minZoom:1, maxNativeZoom:18, maxZoom:18,
    subdomains: '0123'
});
basemaps["UK OS Opendata"] = NLS_OS_opendata;

var HikeBike_HikeBike = L.tileLayer('https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
basemaps["Hike Bike"] = HikeBike_HikeBike;

var NLS_OS_1919_1947 = L.tileLayer( 'https://nls-{s}.tileserver.com/nls/{z}/{x}/{y}.jpg', {
    attribution: 'Historical Maps Layer, from <a href="https://maps.nls.uk/projects/api/">NLS Maps</a>',
    bounds: [[49.6, -12], [61.7, 3]],
    minZoom:1, maxZoom:18,
    subdomains: '0123'
});
basemaps["UK OS 1919-47"] = NLS_OS_1919_1947;

//var NLS_OS_1900 = L.tileLayer('https://nls-{s}.tileserver.com/NLS_API/{z}/{x}/{y}.jpg', {
var NLS_OS_1900 = L.tileLayer('https://nls-{s}.tileserver.com/fpsUZbzrfb5d/{z}/{x}/{y}.jpg', {
    attribution: '<a href="https://geo.nls.uk/maps/">National Library of Scotland Historic Maps</a>',
    bounds: [[49.6, -12], [61.7, 3]],
    minZoom:1, maxNativeZoom:19, maxZoom:20,
    subdomains: '0123'
});
basemaps["UK OS 1900"] = NLS_OS_1900;

//var CartoPos = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
//});
//basemaps["CartoDB Light"] = CartoPos;

// Nice terrain based maps by Stamen Design
var terrainUrl = "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg";
basemaps["Terrain"] = L.tileLayer(terrainUrl, {
    subdomains: ['a','b','c','d'],
    minZoom: 0,
    maxZoom: 20,
    type: 'jpg',
    attribution: 'Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
});

// Nice watercolour based maps by Stamen Design
var watercolorUrl = "https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg";
basemaps["Watercolor"] = L.tileLayer(watercolorUrl, {
    subdomains: ['a','b','c','d'],
    minZoom: 0,
    maxZoom: 20,
    type: 'jpg',
    attribution: 'Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
});


// Now add the overlays

// Add the countries (world-110m) for offline use
var customTopoLayer = L.geoJson(null, {clickable:false, style: {color:"blue", weight:2, fillColor:"#cf6", fillOpacity:0.04}});
layers["_countries"] = omnivore.topojson('images/world-50m-flat.json',null,customTopoLayer);
overlays["countries"] = layers["_countries"];

// Add the day/night overlay
layers["_daynight"] = new L.LayerGroup();
overlays["day/night"] = layers["_daynight"];

// Add the drawing layer for fun...
layers["_drawing"] = new L.FeatureGroup();
overlays["drawing"] = layers["_drawing"];
map.options.drawControlTooltips = false;
var drawCount = 0;
var drawControl = new L.Control.Draw({
    draw: {
        polyline: { shapeOptions: { clickable:true } },
        marker: false,
        //circle: false,
        circle: { shapeOptions: { clickable:false } },
        circlemarker: false,
        rectangle: { shapeOptions: { clickable:true } },
        polygon: { shapeOptions: { clickable:true } }
    },
    edit: false
    // {
    //     featureGroup: layers["_drawing"],
    //     remove: true,
    //     edit: true
    // }
});
map.on('draw:created', function (e) {
    var name = e.layerType + drawCount;
    drawCount = drawCount + 1;

    var rightmenuMarker = L.popup({offset:[0,-12]}).setContent("<b>"+name+"</b><br/><button onclick='editPoly(\""+name+"\",true);'>Edit</button><button onclick='delMarker(\""+name+"\",true);'>Delete</button>");
    e.layer.on('contextmenu', function(e) {
        L.DomEvent.stopPropagation(e);
        rightmenuMarker.setLatLng(e.latlng);
        map.openPopup(rightmenuMarker);
    });

    var la, lo;
    if (e.layer.hasOwnProperty("_latlng")) {
        la = e.layer._latlng.lat;
        lo = e.layer._latlng.lng;
    }
    var m = {action:"draw", name:name, layer:"_drawing", options:e.layer.options, radius:e.layer._mRadius, lat:la, lon:lo};
    if (e.layer.hasOwnProperty("_latlngs")) {
        if (e.layer.options.fill === false) { m.line = e.layer._latlngs; }
        else { m.area = e.layer._latlngs[0]; }
    }
    ws.send(JSON.stringify(m));
    polygons[name] = e.layer;
    polygons[name].lay = "_drawing";
    layers["_drawing"].addLayer(e.layer);
});

// Add the heatmap layer
var heat = L.heatLayer([], {radius:60, gradient:{0.2:'blue', 0.4:'lime', 0.6:'red', 0.8:'yellow', 1:'white'}});
layers["_heat"] = new L.LayerGroup().addLayer(heat);
overlays["heatmap"] = layers["_heat"];

// Add the buildings layer
overlays["buildings"] = new OSMBuildings(map).load();
map.removeLayer(overlays["buildings"]);     // Hide it at start

// Add Roads
overlays["roads"] = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/roads_and_labels/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Tiles courtesy of <a href="https://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    opacity: 0.8
});

// Add Railways
overlays["railways"] = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Add Public Transport (Buses)
overlays["public transport"] = L.tileLayer('https://openptmap.org/tiles/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openptmap.org">OpenPtMap</a> contributors'
});

// Add the OpenSea markers layer
overlays["ship nav"] = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data: &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors'
});

if (showUserMenu) {
    if ( window.localStorage.hasOwnProperty("lastlayer") ) {
        if ( basemaps[window.localStorage.getItem("lastlayer")] ) {
            baselayername = window.localStorage.getItem("lastlayer");
        }
    }
}
basemaps[baselayername].addTo(map);

// Layer control based on select box rather than radio buttons.
//var layercontrol = L.control.selectLayers(basemaps, overlays).addTo(map);
layercontrol = L.control.layers(basemaps, overlays);

// Add the layers control widget
if (!inIframe) { layercontrol.addTo(map); }
else { showLayerMenu = false;}

var coords = L.control.coordinates({
	position:"bottomleft", //optional default "bottomright"
	decimals:4, //optional default 4
	decimalSeperator:".", //optional default "."
	labelTemplateLat:"&nbsp;Lat: {y}", //optional default "Lat: {y}"
	labelTemplateLng:"&nbsp;Lon: {x}", //optional default "Lng: {x}"
	enableUserInput:false, //optional default true
	useDMS:true, //optional default false
	useLatLngOrder: true, //ordering of labels, default false-> lng-lat
});

// Add the dialog box for messages
var dialogue = L.control.dialog({initOpen:false, size:[600,400], anchor:[50,150]}).addTo(map);
dialogue.freeze();

var doDialog = function(d) {
    //console.log("DIALOGUE",d);
    dialogue.setContent(d);
    dialogue.open();
}

var helpText = `<h3>Node-RED - Map all the things</h3><br/>
<p><i class="fa fa-search fa-lg fa-fw"></i> <b>Search</b> - You may enter a name, or partial name, or icon name of an object to search for.
The map will then jump to centre on each of the results in turn. If nothing is found locally it will try to
search for a place name if connected to a network.</p>
<p><i class="fa fa-spinner fa-lg fa-fw"></i> <b>Set Max Age</b> - You can set the time after which points
that haven't been updated get removed.</p>
<p><i class="fa fa-search-plus fa-lg fa-fw"></i> <b>Cluster at zoom</b> - lower numbers mean less clustering. 0 means disable totally.</p>
<p><i class="fa fa-arrows fa-lg fa-fw"></i> <b>Auto Pan</b> - When selected, the map will
automatically move to centre on each data point as they arrive.</p>
<p><i class="fa fa-lock fa-lg fa-fw"></i> <b>Lock Map</b> - When selected will save the
currently displayed area and basemap.
Reloading the map in the current browser will return to the same view.
This can be used to set your initial start position.
While active it also restricts the "auto pan" and "search" to within that area.</p>
<p><i class="fa fa-globe fa-lg fa-fw"></i> <b>Heatmap all layers</b> - When selected
all layers whether hidden or not will contribute to the heatmap.
The default is that only visible layers add to the heatmap.</p>`

// Delete a marker (and notify websocket)
var delMarker = function(dname,note) {
    if (note) { map.closePopup(); }
    if (typeof polygons[dname] != "undefined") {
        layers[polygons[dname].lay].removeLayer(polygons[dname]);
        delete polygons[dname];
    }
    if (typeof polygons[dname+"_"] != "undefined") {
        layers[polygons[dname+"_"].lay].removeLayer(polygons[dname+"_"]);
        delete polygons[dname+"_"];
    }
    if (typeof markers[dname] != "undefined") {
        layers[markers[dname].lay].removeLayer(markers[dname]);
        map.removeLayer(markers[dname]);
        delete markers[dname];
    }
    delete allData[dname];
    if (note) { ws.send(JSON.stringify({action:"delete", name:dname, deleted:true})); }
}

var editPoly = function(pname) {
    map.closePopup();
    editFeatureGroup = L.featureGroup();
    editToolbar = new L.EditToolbar({ featureGroup:editFeatureGroup });
    editHandler = editToolbar.getModeHandlers()[0].handler;
    editHandler._map = map;
    polygons[pname].on("dblclick", function(e) {
        editHandler.disable();
        editFeatureGroup.removeLayer(polygons[pname]);
        polygons[pname].off("dblclick");
        L.DomEvent.stopPropagation(e);
        var la, lo;
        if (e.target.hasOwnProperty("_latlng")) {
            la = e.target._latlng.lat;
            lo = e.target._latlng.lng;
        }
        var m = {action:"draw", name:pname, layer:polygons[pname].lay, options:e.target.options, radius:e.target._mRadius, lat:la, lon:lo};
        if (e.target.hasOwnProperty("_latlngs")) {
            if (e.target.options.fill === false) { m.line = e.target._latlngs; }
            else { m.area = e.target._latlngs[0]; }
        }
        ws.send(JSON.stringify(m));
    })
    editFeatureGroup.addLayer(polygons[pname]);
    editHandler.enable();
}

// the MAIN add something to map function
function setMarker(data) {

    var rightmenu = function(m) {
        // customise right click context menu
        var rightcontext = "";
        if (polygons[data.name] == undefined) {
            rightcontext = "<button id='delbutton' onclick='delMarker(\""+data.name+"\",true);'>Delete</button>";
        }
        else if (data.editable) {
            rightcontext = "<button onclick='editPoly(\""+data.name+"\",true);'>Edit</button><button onclick='delMarker(\""+data.name+"\",true);'>Delete</button>";
        }
        if ((data.contextmenu !== undefined) && (typeof data.contextmenu === "string")) {
            rightcontext = data.contextmenu.replace(/\$name/g,data.name);
            delete data.contextmenu;
        }
        if (rightcontext.length > 0) {
            var rightmenuMarker = L.popup({offset:[0,-12]}).setContent("<b>"+data.name+"</b><br/>"+rightcontext);
            if (hiderightclick !== true) {
                m.on('contextmenu', function(e) {
                    L.DomEvent.stopPropagation(e);
                    rightmenuMarker.setLatLng(e.latlng);
                    map.openPopup(rightmenuMarker);
                });
            }
        }
        return m;
    }

    //console.log("DATA" typeof data, data);
    if (data.deleted) { // remove markers we are told to
        delMarker(data.name);
        return;
    }

    var ll;
    var lli = null;
    var opt = {};
    opt.color = data.color || data.lineColor || "#910000";
    opt.fillColor = data.fillColor || "#910000";
    opt.stroke = (data.hasOwnProperty("stroke")) ? data.stroke : true;
    opt.weight = data.weight || 2;
    opt.opacity = data.opacity || 1;
    opt.fillOpacity = data.fillOpacity || 0.2;
    opt.clickable = (data.hasOwnProperty("clickable")) ? data.clickable : false;
    opt.fill = (data.hasOwnProperty("fill")) ? data.fill : true;
	if (data.hasOwnProperty("dashArray")) { opt.dashArray = data.dashArray; }

    // Replace building
    if (data.hasOwnProperty("building")) {
        if ((data.building === "") && layers.hasOwnProperty("buildings")) {
            map.removeLayer(layers["buildings"]);
            layercontrol._update();
            layers["buildings"] = overlays["buildings"].set("");
            return;
        }
        //layers["buildings"] = new OSMBuildings(map).set(data.building);
        layers["buildings"] = overlays["buildings"].set(data.building);
        map.addLayer(layers["buildings"]);
        return;
    }

    var lay = data.layer || "unknown";
    if (!data.hasOwnProperty("action") || data.action.indexOf("layer") === -1) {
        if (typeof layers[lay] == "undefined") {  // add layer if if doesn't exist
            if (clusterAt > 0) {
                layers[lay] = new L.MarkerClusterGroup({
                    maxClusterRadius:50,
                    spiderfyDistanceMultiplier:1.8,
                    disableClusteringAtZoom:clusterAt
                    //zoomToBoundsOnClick:false
                });
            }
            else {
                layers[lay] = new L.LayerGroup();
            }
            overlays[lay] = layers[lay];
            if (showLayerMenu !== false) {
                layercontrol.addOverlay(layers[lay],lay);
            }
            map.addLayer(overlays[lay]);
            //console.log("ADDED LAYER",lay,layers);
        }
        if (!allData.hasOwnProperty(data.name)) { allData[data.name] = {}; }
        delete data.action;
        Object.keys(data).forEach(key => {
            if (data[key] == null) { delete allData[data.name][key]; }
            else { allData[data.name][key] = data[key]; }
        });
        data = Object.assign({},allData[data.name]);
    }
    delete data.action;

    if (typeof markers[data.name] != "undefined") {
        if (markers[data.name].lay !== data.layer) {
            delMarker(data.name);
        }
        else {
            try {layers[lay].removeLayer(markers[data.name]); }
            catch(e) { console.log("OOPS"); }
        }
    }
    if (typeof polygons[data.name] != "undefined") { layers[lay].removeLayer(polygons[data.name]); }

    if (data.hasOwnProperty("line") && Array.isArray(data.line)) {
        delete opt.fill;
        if (!data.hasOwnProperty("weight")) { opt.weight = 3; }    //Standard settings different for lines
        if (!data.hasOwnProperty("opacity")) { opt.opacity = 0.8; }
        var polyln = L.polyline(data.line, opt);
        polygons[data.name] = polyln;
    }
    else if (data.hasOwnProperty("area") && Array.isArray(data.area)) {
        var polyarea;
        if (data.area.length === 2) { polyarea = L.rectangle(data.area, opt); }
        else { polyarea = L.polygon(data.area, opt); }
        polygons[data.name] = polyarea;
    }
    else if (data.hasOwnProperty("sdlat") && data.hasOwnProperty("sdlon")) {
        if (!data.hasOwnProperty("iconColor")) { opt.color = "blue"; }     //different standard Color Settings
        if (!data.hasOwnProperty("fillColor")) { opt.fillColor = "blue"; }
        var ellipse = L.ellipse(new L.LatLng((data.lat*1), (data.lon*1)), [200000*data.sdlon*Math.cos(data.lat*Math.PI/180), 200000*data.sdlat], 0, opt);
        polygons[data.name] = ellipse;
    }
    else if (data.hasOwnProperty("radius")) {
        if (data.hasOwnProperty("lat") && data.hasOwnProperty("lon")) {
            var polycirc;
            if (Array.isArray(data.radius)) {
                polycirc = L.ellipse(new L.LatLng((data.lat*1), (data.lon*1)), [data.radius[0]*Math.cos(data.lat*Math.PI/180), data.radius[1]], data.tilt || 0, opt);
            }
            else {
                polycirc = L.circle(new L.LatLng((data.lat*1), (data.lon*1)), data.radius*1, opt);
            }
            polygons[data.name] = polycirc;
        }
    }

    if (polygons[data.name] !== undefined) {
        polygons[data.name].lay = lay;
        if (opt.clickable) {
            var words = "<b>"+data.name+"</b>";
            if (data.popup) { var words = words + "<br/>" + data.popup; }
            polygons[data.name].bindPopup(words, {autoClose:false, closeButton:true, closeOnClick:false, minWidth:200});
        }
        polygons[data.name] = rightmenu(polygons[data.name]);
        layers[lay].addLayer(polygons[data.name]);
    }
    else {
        if (typeof data.coordinates == "object") { ll = new L.LatLng(data.coordinates[1],data.coordinates[0]); }
        else if (data.hasOwnProperty("position") && data.position.hasOwnProperty("lat") && data.position.hasOwnProperty("lon")) {
            data.lat = data.position.lat*1;
            data.lon = data.position.lon*1;
            data.alt = data.position.alt;
            if (parseFloat(data.position.alt) == data.position.alt) { data.alt = data.position.alt + " m"; }
            delete data.position;
            ll = new L.LatLng((data.lat*1), (data.lon*1));
        }
        else if (data.hasOwnProperty("lat") && data.hasOwnProperty("lon")) { ll = new L.LatLng((data.lat*1), (data.lon*1)); }
        else if (data.hasOwnProperty("latitude") && data.hasOwnProperty("longitude")) { ll = new L.LatLng((data.latitude*1), (data.longitude*1)); }
        else { console.log("No location:",data); return; }

        // Adding new L.LatLng object (lli) when optional intensity value is defined. Only for use in heatmap layer
        if (typeof data.coordinates == "object") { lli = new L.LatLng(data.coordinates[2],data.coordinates[1],data.coordinates[0]); }
        else if (data.hasOwnProperty("lat") && data.hasOwnProperty("lon") && data.hasOwnProperty("intensity")) { lli = new L.LatLng((data.lat*1), (data.lon*1), (data.intensity*1)); }
        else if (data.hasOwnProperty("latitude") && data.hasOwnProperty("longitude") && data.hasOwnProperty("intensity")) { lli = new L.LatLng((data.latitude*1), (data.longitude*1), (data.intensity*1)); }
        else { lli = ll }

        // Create the icons... handle plane, car, ship, wind, earthquake as specials
        var marker, myMarker;
        var icon, q;
        var words="";
        var labelOffset = [12,0];
        var drag = false;

        if (data.draggable === true) { drag = true; }
        //console.log("ICON",data.icon);
        if (data.hasOwnProperty("icon")) {
            if (data.icon === "ship") {
                marker = L.boatMarker(ll, {
                    title: data.name,
                    color: (data.iconColor || "blue")
                });
                marker.setHeading(parseFloat(data.hdg || data.bearing || "0"));
                q = 'https://www.bing.com/images/search?q='+data.icon+'%20%2B"'+encodeURIComponent(data.name)+'"';
                words += '<a href=\''+q+'\' target="_thingpic">Pictures</a><br>';
            }
            else if (data.icon === "plane") {
                data.iconColor = data.iconColor || "black";
                if (data.hasOwnProperty("squawk")) { data.iconColor = "red"; }
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="310px" height="310px" viewBox="0 0 310 310">';
                icon += '<path d="M134.875,19.74c0.04-22.771,34.363-22.771,34.34,0.642v95.563L303,196.354v35.306l-133.144-43.821v71.424l30.813,24.072v27.923l-47.501-14.764l-47.501,14.764v-27.923l30.491-24.072v-71.424L3,231.66v-35.306l131.875-80.409V19.74z" fill="'+data.iconColor+'"/></svg>';
                var svgplane = "data:image/svg+xml;base64," + btoa(icon);
                var dir = parseFloat(data.hdg || data.bearing || "0");
                myMarker = L.divIcon({
                    className:"planeicon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svgplane+'" style="width:32px; height:32px; -webkit-transform:rotate('+dir+'deg); -moz-transform:rotate('+dir+'deg);"/>'
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                //q = 'https://www.bing.com/images/search?q='+data.icon+'%20'+encodeURIComponent(data.name);
                //words += '<a href=\''+q+'\' target="_thingpic">Pictures</a><br>';
            }
            else if (data.icon === "helicopter") {
                data.iconColor = data.iconColor || "black";
                if (data.hasOwnProperty("squawk")) { data.iconColor = "red"; }
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="314" height="314" viewBox="0 0 314.5 314.5">';
                icon += '<path d="M268.8 3c-3.1-3.1-8.3-2.9-11.7 0.5L204.9 55.7C198.5 23.3 180.8 0 159.9 0c-21.9 0-40.3 25.5-45.7 60.2L57.4 3.5c-3.4-3.4-8.6-3.6-11.7-0.5 -3.1 3.1-2.9 8.4 0.5 11.7l66.3 66.3c0 0.2 0 0.4 0 0.6 0 20.9 4.6 39.9 12.1 54.4l-78.4 78.4c-3.4 3.4-3.6 8.6-0.5 11.7 3.1 3.1 8.3 2.9 11.7-0.5l76.1-76.1c3.2 3.7 6.7 6.7 10.4 8.9v105.8l-47.7 32.2v18l50.2-22.3h26.9l50.2 22.3v-18L175.8 264.2v-105.8c2.7-1.7 5.4-3.8 7.8-6.2l73.4 73.4c3.4 3.4 8.6 3.6 11.7 0.5 3.1-3.1 2.9-8.3-0.5-11.7l-74.9-74.9c8.6-14.8 14-35.2 14-57.8 0-1.9-0.1-3.8-0.2-5.8l61.2-61.2C271.7 11.3 271.9 6.1 268.8 3z" fill="'+data.iconColor+'"/></svg>';
                var svgheli = "data:image/svg+xml;base64," + btoa(icon);
                var dir = parseFloat(data.hdg || data.bearing || "0");
                myMarker = L.divIcon({
                    className:"heliicon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svgheli+'" style="width:32px; height:32px; -webkit-transform:rotate('+dir+'deg); -moz-transform:rotate('+dir+'deg);"/>'
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if (data.icon === "uav") {
                data.iconColor = data.iconColor || "black";
                if (data.hasOwnProperty("squawk")) { data.iconColor = "red"; }
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">';
                icon+= '<path d="M62 82h-8V64h36c0-5-4-9-9-9H54v-8c0-3 4-5 4-11.1 0-4.4-3.6-8-8-8-4.4 0-8 3.6-8 8 0 5.1 4 8.1 4 11.1V55h-27c-5 0-9 4-9 9h36v18H38c-2.4 0-5 2.3-5 5L50 92l17-5C67 84.3 64.4 82 62 82z" fill="'+data.iconColor+'"/></svg>';
                var svguav = "data:image/svg+xml;base64," + btoa(icon);
                var dir = parseFloat(data.hdg || data.bearing || "0");
                myMarker = L.divIcon({
                    className:"uavicon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svguav+'" style="width:32px; height:32px; -webkit-transform:rotate('+dir+'deg); -moz-transform:rotate('+dir+'deg);"/>',
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if (data.icon === "car") {
                data.iconColor = data.iconColor || "black";
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="47px" height="47px" viewBox="0 0 47 47">';
                icon += '<path d="M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759   c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z    M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713   v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z" fill="'+data.iconColor+'"/></svg>';
                var svgcar = "data:image/svg+xml;base64," + btoa(icon);
                var dir = parseFloat(data.hdg || data.bearing || "0");
                myMarker = L.divIcon({
                    className:"caricon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svgcar+'" style="width:32px; height:32px; -webkit-transform:rotate('+dir+'deg); -moz-transform:rotate('+dir+'deg);"/>',
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if (data.icon === "arrow") {
                data.iconColor = data.iconColor || "black";
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32px" height="32px" viewBox="0 0 32 32">';
                icon += '<path d="m16.2 0.6l-10.9 31 10.7-11.1 10.5 11.1 -10.3-31z" fill="'+data.iconColor+'"/></svg>';
                var svgarrow = "data:image/svg+xml;base64," + btoa(icon);
                var dir = parseFloat(data.hdg || data.bearing || "0");
                myMarker = L.divIcon({
                    className:"arrowicon",
                    iconAnchor: [16, 16],
                    html:"'<img src='"+svgarrow+"' style='width:32px; height:32px; -webkit-transform:translate(0px,-16px) rotate("+dir+"deg); -moz-transform:translate(0px,-16px) rotate("+dir+"deg);'/>",
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if (data.icon === "wind") {
                data.iconColor = data.iconColor || "black";
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32px" height="32px" viewBox="0 0 32 32">';
                icon += '<path d="M16.7 31.7l7-6.9c0.4-0.4 0.4-1 0-1.4 -0.4-0.4-1-0.4-1.4 0l-5.3 5.2V17.3l6.7-6.6c0.2-0.2 0.3-0.5 0.3-0.7v-9c0-0.9-1.1-1.3-1.7-0.7l-6.3 6.2L9.7 0.3C9.1-0.3 8 0.1 8 1.1v8.8c0 0.3 0.1 0.6 0.3 0.8l6.7 6.6v11.3l-5.3-5.2c-0.4-0.4-1-0.4-1.4 0 -0.4 0.4-0.4 1 0 1.4l7 6.9c0.2 0.2 0.5 0.3 0.7 0.3C16.2 32 16.5 31.9 16.7 31.7zM10 9.6V3.4l5 4.9v6.2L10 9.6zM17 8.3l5-4.9v6.2l-5 4.9V8.3z" fill="'+data.iconColor+'"/></svg>';
                var svgwind = "data:image/svg+xml;base64," + btoa(icon);
                var dir = parseFloat(data.hdg || data.bearing || "0");
                myMarker = L.divIcon({
                    className:"windicon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svgwind+'" style="width:32px; height:32px; -webkit-transform:rotate('+dir+'deg); -moz-transform:rotate('+dir+'deg);"/>',
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if (data.icon === "satellite") {
                data.iconColor = data.iconColor || "black";
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100">';
                icon += '<polygon points="38.17 39.4 45.24 32.33 43.34 27.92 24.21 8.78 14.59 18.4 33.72 37.53" fill="'+data.iconColor+'"/>';
                icon += '<path d="M69.22 44.57L54.38 29.73c-1.1-1.1-2.91-1.1-4.01 0L35.53 44.57c-1.1 1.1-1.1 2.91 0 4.01l14.84 14.84c1.1 1.1 2.91 1.1 4.01 0l14.84-14.84C70.32 47.47 70.32 45.67 69.22 44.57z" fill="'+data.iconColor+'"/>';
                icon += '<polygon points="71.04 55.61 66.58 53.75 59.52 60.82 61.42 65.23 80.55 84.36 90.17 74.75" fill="'+data.iconColor+'"/>';
                icon += '<path d="M28.08 55.26l-6.05 0.59C23.11 68.13 32.78 77.94 45 79.22l0.59-6.05C36.26 72.15 28.89 64.66 28.08 55.26z" fill="'+data.iconColor+'"/>';
                icon += '<path d="M15.88 56.54L9.83 57.13c1.67 18.06 16.03 32.43 34.08 34.09l0.59-6.04C29.34 83.76 17.29 71.71 15.88 56.54z" fill="'+data.iconColor+'"/>';
                icon += '</svg>';
                var svgsat = "data:image/svg+xml;base64," + btoa(icon);
                myMarker = L.divIcon({
                    className:"satelliteicon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svgsat+'" style="width:32px; height:32px;"/>',
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if ((data.icon === "iss") || (data.icon === "ISS")) {
                data.iconColor = data.iconColor || "black";
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48">';
                icon += '<path id="iss" d="m4.55 30.97l6.85-12.68 0.59 0.32 -6.85 12.68 4.27 2.3 6.85-12.68 0.49 0.27 -0.81 1.5c-0.26 0.48-0.07 1.1 0.44 1.37l5.09 2.75c0.5 0.27 1.12 0.1 1.38-0.39l0.81-1.5 0.72 0.39 -1.49 2.75c-0.41 0.76-0.38 1.58 0.08 1.82l4.61 2.49c0.45 0.24 1.15-0.18 1.56-0.94l1.49-2.75 0.69 0.37 -6.85 12.68 4.26 2.3 6.85-12.68 0.59 0.32 -6.85 12.69 4.26 2.3 14.46-26.78 -4.26-2.3 -6.88 12.74 -0.59-0.32 6.88-12.74 -4.26-2.3 -6.88 12.74 -0.69-0.37 1.49-2.75c0.41-0.76 ';
                icon += '0.38-1.58-0.08-1.82l-1.4-0.75 0.5-0.92c1.02 0.17 2.09-0.32 2.62-1.3 0.67-1.23 0.22-2.76-0.99-3.42 -1.21-0.65-2.74-0.19-3.4 1.05 -0.53 0.98-0.35 2.14 0.35 2.9l-0.5 0.92 -1.8-0.97c-0.45-0.24-1.15 0.17-1.57 0.94l-1.49 2.75 -0.72-0.39 0.81-1.5c0.26-0.48 0.07-1.1-0.44-1.36l-5.09-2.75c-0.5-0.27-1.12-0.1-1.38 0.39l-0.81 1.5 -0.49-0.27 6.88-12.74 -4.26-2.3 -6.88 12.74 -0.59-0.32 6.88-12.74 -4.26-2.3 -14.46 26.78 4.26 2.3zm14.26-11.72c0.2-0.37 0.68-0.51 1.06-0.3l3.93 ';
                icon += '2.12c0.39 0.21 0.54 0.68 0.34 1.05l-1.81 3.35c-0.2 0.37-0.68 0.51-1.06 0.3l-3.93-2.12c-0.38-0.21-0.53-0.68-0.33-1.05l1.81-3.35zm12.01-1.46c0.45-0.83 1.47-1.14 2.28-0.7 0.81 0.44 1.11 1.46 0.66 2.29 -0.44 0.83-1.47 1.14-2.28 0.7 -0.81-0.44-1.11-1.46-0.66-2.29zm-3.78 4.26c0.35-0.66 0.93-1.04 1.28-0.85l3.57 1.93c0.35 0.19 0.35 0.88-0.01 1.53l-3.19 5.91c-0.35 0.66-0.93 1.04-1.28 0.85l-3.56-1.92c-0.35-0.19-0.35-0.88 0.01-1.53l3.19-5.91zm0.19 7.49c-0.26 0.49-0.87 ';
                icon += '0.67-1.36 0.41 -0.49-0.26-0.67-0.87-0.41-1.36 0.27-0.49 0.87-0.67 1.36-0.4 0.49 0.26 0.67 0.87 0.41 1.36zm-7.46-6.31c-0.26 0.49-0.87 0.67-1.36 0.41s-0.67-0.87-0.41-1.36c0.27-0.49 0.87-0.67 1.36-0.4s0.67 0.87 0.41 1.36zm2.32 1.25c-0.26 0.49-0.87 0.67-1.36 0.41 -0.49-0.26-0.67-0.87-0.41-1.36 0.27-0.49 0.87-0.67 1.36-0.41 0.49 0.26 0.67 0.87 0.41 1.36z" fill="'+data.iconColor+'"/>';
                icon += '</svg>';
                var svgiss = "data:image/svg+xml;base64," + btoa(icon);
                myMarker = L.divIcon({
                    className:"issicon",
                    iconAnchor: [25, 25],
                    html:'<img src="'+svgiss+'" style="width:50px; height:50px;"/>',
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            }
            else if (data.icon === "locate") {
                data.iconColor = data.iconColor || "cyan";
                icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="468px" height="468px" viewBox="0 0 468 468">';
                icon += '<polygon points="32 32 104 32 104 0 0 0 0 104 32 104" fill="'+data.iconColor+'"/>';
                icon += '<polygon points="468 0 364 0 364 32 436 32 436 104 468 104" fill="'+data.iconColor+'"/>';
                icon += '<polygon points="0 468 104 468 104 436 32 436 32 364 0 364" fill="'+data.iconColor+'"/>';
                icon += '<polygon points="436 436 364 436 364 468 468 468 468 364 436 364" fill="'+data.iconColor+'"/>';
                //icon += '<circle cx="234" cy="234" r="22" fill="'+data.iconColor+'"/>';
                icon += '</svg>';
                var svglocate = "data:image/svg+xml;base64," + btoa(icon);
                myMarker = L.divIcon({
                    className:"locateicon",
                    iconAnchor: [16, 16],
                    html:'<img src="'+svglocate+'" style="width:32px; height:32px;"/>',
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                labelOffset = [12,-4];
            }
            else if (data.icon === "friend") {
                marker = L.marker(ll, { icon: L.divIcon({ className: 'circle f', iconSize: [20, 12] }), title: data.name, draggable:drag });
            }
            else if (data.icon === "hostile") {
                marker = L.marker(ll, { icon: L.divIcon({ className: 'circle h', iconSize: [16, 16] }), title: data.name, draggable:drag });
            }
            else if (data.icon === "neutral") {
                marker = L.marker(ll, { icon: L.divIcon({ className: 'circle n', iconSize: [16, 16] }), title: data.name, draggable:drag });
            }
            else if (data.icon === "unknown") {
                marker = L.marker(ll, { icon: L.divIcon({ className: 'circle', iconSize: [16, 16] }), title: data.name, draggable:drag });
            }
            else if (data.icon === "danger") {
                marker = L.marker(ll, { icon: L.divIcon({ className: 'up-triangle' }), title: data.name, draggable:drag });
            }
            else if (data.icon === "earthquake") {
                marker = L.marker(ll, { icon: L.divIcon({ className: 'circle e', iconSize: [data.mag*5, data.mag*5] }), title: data.name, draggable:drag });
            }
            else if (data.icon.match(/^:.*:$/g)) {
                var em = emojify(data.icon);
                var col = data.iconColor || "#910000";
                myMarker = L.divIcon({
                    className:"emicon",
                    html: '<center><span style="font-size:2em; color:'+col+'">'+em+'</span></center>',
                    iconSize: [32, 32]
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                labelOffset = [12,-4];
            }
            else if (data.icon.match(/^https?:.*$/)) {
                myMarker = L.icon({
                    iconUrl: data.icon,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -16]
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                labelOffset = [12,-4];
            }
            else if (data.icon.substr(0,3) === "fa-") {
                var col = data.iconColor || "#910000";
                var imod = "";
                if (data.icon.indexOf(" ") === -1) { imod = "fa-2x "; }
                myMarker = L.divIcon({
                    className:"faicon",
                    html: '<center><i class="fa fa-fw '+imod+data.icon+'" style="color:'+col+'"></i></center>',
                    iconSize: [32, 32],
                    popupAnchor: [0, -16]
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                labelOffset = [8,-8];
            }
            else if (data.icon.substr(0,3) === "wi-") {
                var col = data.iconColor || "#910000";
                var imod = "";
                if (data.icon.indexOf(" ") === -1) { imod = "wi-2x "; }
                myMarker = L.divIcon({
                    className:"wiicon",
                    html: '<center><i class="wi wi-fw '+imod+data.icon+'" style="color:'+col+'"></i></center>',
                    iconSize: [32, 32],
                    popupAnchor: [0, -16]
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                labelOffset = [16,-16];
            }
            else {
                myMarker = L.VectorMarkers.icon({
                    icon: data.icon || "circle",
                    markerColor: (data.iconColor || "#910000"),
                    prefix: 'fa',
                    iconColor: 'white'
                });
                marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
                labelOffset = [6,-6];
            }
        }
        else if (data.hasOwnProperty("SIDC")) {
            // "SIDC":"SFGPU------E***","name":"1.C2 komp","fullname":"1.C2 komp/FTS/INSS"
            myMarker = new ms.Symbol( data.SIDC.toUpperCase(), { uniqueDesignation:data.name });
            // Now that we have a symbol we can ask for the echelon and set the symbol size
            var opts = data.options || {};
            opts.size = opts.size || iconSz[myMarker.getProperties().echelon] || 30;
            opts.size = opts.size * (opts.scale || 1);
            myMarker = myMarker.setOptions(opts);
            var myicon = L.icon({
                iconUrl: myMarker.toDataURL(),
                iconAnchor: [myMarker.getAnchor().x, myMarker.getAnchor().y],
                className: "natoicon",
            });
            marker =  L.marker(ll, { title:data.name, icon:myicon, draggable:drag });
        }
        else {
            myMarker = L.VectorMarkers.icon({
                icon: "circle",
                markerColor: (data.iconColor || "#910000"),
                prefix: 'fa',
                iconColor: 'white'
            });
            marker = L.marker(ll, {title:data.name, icon:myMarker, draggable:drag});
            labelOffset = [6,-6];
        }
        marker.name = data.name;

        // var createLabelIcon = function(labelText) {
        //     return L.marker(new L.LatLng(51.05, -1.35), {icon:L.divIcon({ html:labelText })});
        // }

        // send new position at end of move event if point is draggable
        if (data.draggable === true) {
            if (data.icon) { marker.icon = data.icon; }
            if (data.iconColor) { marker.iconColor = data.iconColor; }
            if (data.SIDC) { marker.SIDC = data.SIDC.toUpperCase(); }
            marker.on('dragend', function (e) {
                var l = marker.getLatLng().toString().replace('LatLng(','lat, lon : ').replace(')','')
                marker.setPopupContent(marker.getPopup().getContent().split("lat, lon")[0] + l);
                ws.send(JSON.stringify({action:"move",name:marker.name,layer:marker.lay,icon:marker.icon,iconColor:marker.iconColor,SIDC:marker.SIDC,draggable:true,lat:parseFloat(marker.getLatLng().lat.toFixed(6)),lon:parseFloat(marker.getLatLng().lng.toFixed(6))}));
            });
        }

        // remove icon from list of properties, then add all others to popup
        if (data.hasOwnProperty("alt")) { data.alt = +data.alt.toFixed(2); }
        if (data.hasOwnProperty("speed")) { data.speed = +data.speed.toFixed(2); }
        if (data.hasOwnProperty("SIDC") && data.hasOwnProperty("options")) { delete data.options; }
        if (data.hasOwnProperty("icon")) { delete data.icon; }
        if (data.hasOwnProperty("iconColor")) { delete data.iconColor; }
        if (data.hasOwnProperty("photourl")) {
            words += "<img src=\"" + data.photourl + "\" style=\"width:100%; margin-top:10px;\">";
            delete data.photourl;
        }
        if (data.hasOwnProperty("photoUrl")) {
            words += "<img src=\"" + data.photoUrl + "\" style=\"width:100%; margin-top:10px;\">";
            delete data.photoUrl;
        }
        if (data.hasOwnProperty("videoUrl")) {
            words += '<video controls muted autoplay width="320"><source src="'+data.videoUrl+'" type="video/mp4">Your browser does not support the video tag.</video>';
            delete data.videoUrl;
        }
        if (data.hasOwnProperty("ttl")) {  // save expiry time for this marker
            if (data.ttl != 0) {
                marker.ts = parseInt(Date.now()/1000) + Number(data.ttl);
            }
            delete data.ttl;
        }
        else if (maxage != 0) {
            marker.ts = parseInt(Date.now()/1000) + Number(maxage);
        }
        if (data.hasOwnProperty("weblink")) {
            if (typeof data.weblink === "string") {
                words += "<b><a href='"+ data.weblink + "' target='_new'>more information...</a></b><br/>";
            } else {
                var tgt = data.weblink.target || "_new";
                words += "<b><a href='"+ data.weblink.url + "' target='"+ tgt + "'>" + data.weblink.name + "</a></b><br/>";
            }
            delete data.weblink;
        }
        var p;
        if (data.hasOwnProperty("popped") && (data.popped === true)) {
            p = true;
            delete data.popped;
        }
        if (data.hasOwnProperty("popped") && (data.popped === false)) {
            marker.closePopup();
            p = false;
            delete data.popped;
        }
        // If .label then use that rather than name tooltip
        if (data.label) {
            if (typeof data.label === "boolean" && data.label === true) {
                marker.bindTooltip(data.name, { permanent:true, direction:"right", offset:labelOffset });
            }
            else if (typeof data.label === "string" && data.label.length > 0) {
                marker.bindTooltip(data.label, { permanent:true, direction:"right", offset:labelOffset });
            }
            delete marker.options.title;
            delete data.label;
        }
        // otherwise check for .tooltip then use that rather than name tooltip
        else if (data.tooltip) {
            if (typeof data.tooltip === "string" && data.tooltip.length > 0) {
                marker.bindTooltip(data.tooltip, { direction:"bottom", offset:[0,4] });
                delete marker.options.title;
                delete data.tooltip;
            }
        }

        marker = rightmenu(marker);

        // Add any remaining properties to the info box
        var llc = data.lineColor || data.color;
        delete data.lat;
        delete data.lon;
        if (data.layer) { delete data.layer; }
        if (data.lineColor) { delete data.lineColor; }
        if (data.color) { delete data.color; }
        if (data.weight) { delete data.weight; }
        if (data.tracklength) { delete data.tracklength; }
        if (data.dashArray) { delete data.dashArray; }
        if (data.fill) { delete data.fill; }
        if (data.draggable) { delete data.draggable; }
        for (var i in data) {
            if ((i != "name") && (i != "length")) {
                if (typeof data[i] === "object") {
                    words += i +" : "+JSON.stringify(data[i])+"<br/>";
                } else {
                    words += i +" : "+data[i]+"<br/>";
                }
            }
        }
        if (data.popup) { words = data.popup; }
        else { words = words + marker.getLatLng().toString().replace('LatLng(','lat, lon : ').replace(')',''); }
        words = "<b>"+data.name+"</b><br/>" + words; //"<button style=\"border-radius:4px; float:right; background-color:lightgrey;\" onclick='popped=false;popmark.closePopup();'>X</button><br/>" + words;
        marker.bindPopup(words, {autoClose:false, closeButton:true, closeOnClick:false, minWidth:200});
        marker._popup.dname = data.name;
        marker.lay = lay;                       // and the layer it is on

        marker.on('click', function(e) {
            ws.send(JSON.stringify({action:"click",name:marker.name,layer:marker.lay,icon:marker.icon,iconColor:marker.iconColor,SIDC:marker.SIDC,draggable:true,lat:parseFloat(marker.getLatLng().lat.toFixed(6)),lon:parseFloat(marker.getLatLng().lng.toFixed(6))}));
        });
        if ((data.addtoheatmap !== "false") || (!data.hasOwnProperty("addtoheatmap"))) { // Added to give ability to control if points from active layer contribute to heatmap
            if (heatAll || map.hasLayer(layers[lay])) { heat.addLatLng(lli); }
        }
        markers[data.name] = marker;
        layers[lay].addLayer(marker);



        if ((data.hdg != null) && (data.bearing == null)) { data.bearing = data.hdg; delete data.hdg; }
        if (data.bearing != null) {  // if there is a heading
            if (data.speed != null) { data.length = parseFloat(data.speed || "0") * 50; }  // and a speed
            if (data.length != null) {
                if (polygons[data.name] != null) { map.removeLayer(polygons[data.name]); }
                var x = ll.lng * 1; // X coordinate
                var y = ll.lat * 1; // Y coordinate
                var ll1 = ll;
                var angle = parseFloat(data.bearing);
                var lengthAsDegrees = parseFloat(data.length || "0") / 110540; // metres in a degree..ish
                var polygon = null;
                if (data.accuracy != null) {
                    data.accuracy = Number(data.accuracy);
                    var y2 = y + Math.sin((90-angle+data.accuracy)/180*Math.PI)*lengthAsDegrees*Math.cos(y/180*Math.PI);
                    var x2 = x + Math.cos((90-angle+data.accuracy)/180*Math.PI)*lengthAsDegrees;
                    var ll2 = new L.LatLng(y2,x2);
                    var y3 = y + Math.sin((90-angle-data.accuracy)/180*Math.PI)*lengthAsDegrees*Math.cos(y/180*Math.PI);
                    var x3 = x + Math.cos((90-angle-data.accuracy)/180*Math.PI)*lengthAsDegrees;
                    var ll3 = new L.LatLng(y3,x3);
                    polygon = L.polygon([ ll1, ll2, ll3 ], {weight:2, color:llc||'#f30', fillOpacity:0.06, clickable:false});
                } else {
                    var ya = y + Math.sin((90-angle)/180*Math.PI)*lengthAsDegrees*Math.cos(y/180*Math.PI);
                    var xa = x + Math.cos((90-angle)/180*Math.PI)*lengthAsDegrees;
                    var lla = new L.LatLng(ya,xa);
                    polygon = L.polygon([ ll1, lla ], {weight:2, color:llc||'#f30', clickable:false});
                }
                if (typeof layers[lay].getVisibleParent === 'function') {
                    var vis = layers[lay].getVisibleParent(marker);
                    if ((polygon !== null) && (vis !== null) && (!vis.hasOwnProperty("lay"))) {
                        polygon.setStyle({opacity:0});
                    }
                }
                polygons[data.name] = polygon;
                polygons[data.name].lay = lay;
                layers[lay].addLayer(polygon);
            }
        }
        if (panit) { map.setView(ll,map.getZoom()); }
        if (p === true) { marker.openPopup(); }
    }
}

// handle any incoming COMMANDS to control the map remotely
function doCommand(cmd) {
    //console.log("COMMAND",cmd);
    if (cmd.hasOwnProperty("clear")) {
        doTidyUp(cmd.clear);
    }
    if (cmd.hasOwnProperty("panit")) {
        if (cmd.panit == "true") { panit = true; }
        else { panit = false; }
        document.getElementById("panit").checked = panit;
    }
    if (cmd.hasOwnProperty("hiderightclick")) {
        if (cmd.hiderightclick == "true" || cmd.hiderightclick == true) { hiderightclick = true; }
        else { hiderightclick = false; }
    }
    if (cmd.hasOwnProperty("showmenu")) {
        if ((cmd.showmenu === "hide") && (showUserMenu === true)) {
            showUserMenu = false;
            if (inIframe) {
                if (menuButton) {
                    try { map.removeControl(menuButton); }
                    catch(e) {}
                }
            }
            else { document.getElementById("bars").style.display="none"; }
        }
        else if ((cmd.showmenu === "show") && (showUserMenu === false)) {
            showUserMenu = true;
            if (inIframe) { map.addControl(menuButton); }
            else { document.getElementById("bars").style.display="unset";  }
        }
    }
    if (cmd.hasOwnProperty("showlayers")) {
        if ((cmd.showlayers === "hide") && (showLayerMenu === true)) {
            showLayerMenu = false;
            if (layercontrol) { layercontrol.removeFrom(map); }
        }
        else if ((cmd.showlayers === "show") && (showLayerMenu === false)) {
            showLayerMenu = true;
            layercontrol = L.control.layers(basemaps, overlays).addTo(map);
        }
    }
    if (cmd.hasOwnProperty("grid")) {
        if (cmd.grid.hasOwnProperty("showgrid")) {
            var changed = false;
            if ((cmd.grid.showgrid == "true" || cmd.grid.showgrid == true ) && !showGrid) { changed = true; }
            if ((cmd.grid.showgrid == "false" || cmd.grid.showgrid == false ) && showGrid) { changed = true; }
            if (changed) {
                showGrid = !showGrid;
                if (showGrid) { Lgrid.addTo(map); }
                else { Lgrid.removeFrom(map); }
            }
        }
        if (cmd.grid.hasOwnProperty("opt")) {
            Lgrid.initialize(cmd.grid.opt);
            if (showGrid) {
                Lgrid.removeFrom(map);
                Lgrid.addTo(map);
            }
        }
    }
    if (cmd.hasOwnProperty("button")) {
        if (cmd.button.icon) {
            if (!buttons[cmd.button.name]) {
                buttons[cmd.button.name] = L.easyButton( cmd.button.icon, function() {
                    ws.send(JSON.stringify({action:"button",name:cmd.button.name}));
                }, cmd.button.name, { position:cmd.button.position||'topright' }).addTo(map);
            }
        }
        else {
            if (buttons[cmd.button.name]) {
                buttons[cmd.button.name].removeFrom(map);
                delete buttons[cmd.button.name];
            }
        }
    }
    if (cmd.hasOwnProperty("contextmenu")) {
        if (typeof cmd.contextmenu === "string") {
            addmenu = cmd.contextmenu;
            rightmenuMap.setContent(addmenu);
        }
    }
    if (cmd.hasOwnProperty("coords")) {
        try { coords.removeFrom(map); }
        catch(e) {}
        if (cmd.coords == "dms") {
            coords.options.useDMS = true;
            showMouseCoords = "dms";
            coords.addTo(map);
        }
        if (cmd.coords == "deg") {
            coords.options.useDMS = false;
            showMouseCoords = "deg";
            coords.addTo(map);
        }
    }

    var existsalready = false;
    // Add a new base map layer
    if (cmd.map && cmd.map.hasOwnProperty("name") && cmd.map.hasOwnProperty("url") && cmd.map.hasOwnProperty("opt")) {
        console.log("BASE",cmd.map);
        if (basemaps.hasOwnProperty(cmd.map.name)) { existsalready = true; }
        if (cmd.map.hasOwnProperty("wms")) {   // special case for wms
            console.log("New WMS:",cmd.map.name);
            if (cmd.map.wms === "grey") {
                basemaps[cmd.map.name] = L.tileLayer.graywms(cmd.map.url, cmd.map.opt);
            }
            else {
                basemaps[cmd.map.name] = L.tileLayer.wms(cmd.map.url, cmd.map.opt);
            }
        }
        else {
            console.log("New Map:",cmd.map.name);
            basemaps[cmd.map.name] = L.tileLayer(cmd.map.url, cmd.map.opt);
        }
        //if (!existsalready && !inIframe) {
        if (!existsalready) {
            layercontrol.addBaseLayer(basemaps[cmd.map.name],cmd.map.name);
        }
    }
    // Remove one or more map layers (base or overlay)
    if (cmd.map && cmd.map.hasOwnProperty("delete")) {
        if (!Array.isArray(cmd.map.delete)) { cmd.map.delete = [cmd.map.delete]; }
        for (var a=0; a < cmd.map.delete.length; a++) {
            if (basemaps.hasOwnProperty(cmd.map.delete[a])) { delete basemaps[cmd.map.delete[a]]; }
            if (overlays.hasOwnProperty(cmd.map.delete[a])) { delete overlays[cmd.map.delete[a]]; }
        }
        if (showLayerMenu) {
            map.removeControl(layercontrol);
            layercontrol = L.control.layers(basemaps, overlays).addTo(map);
        }
    }
    // Add a new geojson overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("geojson") ) {
        if (overlays.hasOwnProperty(cmd.map.overlay)) {
            map.removeLayer(overlays[cmd.map.overlay]);
            existsalready = true;
        }
        var opt = cmd.map.opt || { style:function(feature) {
            var st = { stroke:true, weight:2, fill:true };
            if (feature.hasOwnProperty("properties")) {
                st.color = feature.properties.color||feature.properties.roofColor||"black";
                if (feature.properties.hasOwnProperty("color")) { delete feature.properties.color; }
                if (feature.properties.hasOwnProperty("roofColor")) { delete feature.properties.roofColor; }
            }
            if (feature.hasOwnProperty("properties") && feature.properties.hasOwnProperty('style')) {
                if (feature.properties.style.hasOwnProperty('stroke')) {
                    st.color = feature.properties.style.stroke;
                }
                if (feature.properties.style.hasOwnProperty('stroke-width')) {
                    st.weight = feature.properties.style["stroke-width"];
                }
                if (feature.properties.style.hasOwnProperty('stroke-opacity')) {
                    st.opacity = feature.properties.style["stroke-opacity"];
                }
                if (feature.properties.style.hasOwnProperty('fill')) {
                    if (feature.properties.style.fill == "none") { st.fill = false; }
                    else { st.fillColor = feature.properties.style.fill; }
                }
                if (feature.properties.style.hasOwnProperty('fill-opacity')) {
                    st.fillOpacity = feature.properties.style["fill-opacity"];
                }
            }
            delete feature.properties.style;
            return st;
        }};
        opt.onEachFeature = function (f,l) {
            l.bindPopup('<pre>'+JSON.stringify(f.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
        }
        overlays[cmd.map.overlay] = L.geoJson(cmd.map.geojson,opt);
        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
        if (cmd.map.hasOwnProperty("fit")) { map.fitBounds(overlays[cmd.map.overlay].getBounds()); }
    }
    // Add a new NVG XML overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("nvg") ) {
        if (overlays.hasOwnProperty(cmd.map.overlay)) {
            map.removeLayer(overlays[cmd.map.overlay]);
            existsalready = true;
        }
        var parser = new NVG(cmd.map.nvg);
        var geoj = parser.toGeoJSON();

        overlays[cmd.map.overlay] = L.geoJson(geoj,{
            style: function(feature) {
                var st = { stroke:true, color:"black", weight:2, fill:true };
            	if (feature.hasOwnProperty("properties") && feature.properties.hasOwnProperty('style')) {
                    if (feature.properties.style.hasOwnProperty('stroke')) {
                        st.color = feature.properties.style.stroke;
                    }
                    if (feature.properties.style.hasOwnProperty('stroke-width')) {
                        st.weight = feature.properties.style["stroke-width"];
                    }
                    if (feature.properties.style.hasOwnProperty('stroke-opacity')) {
                        st.opacity = feature.properties.style["stroke-opacity"];
                    }
                    if (feature.properties.style.hasOwnProperty('fill')) {
                        if (feature.properties.style.fill == "none") { st.fill = false; }
                        else { st.fillColor = feature.properties.style.fill; }
                    }
                    if (feature.properties.style.hasOwnProperty('fill-opacity')) {
                        st.fillOpacity = feature.properties.style["fill-opacity"];
                    }
                }
                return st;
            }
        });
        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
        if (cmd.map.hasOwnProperty("fit")) { map.fitBounds(overlays[cmd.map.overlay].getBounds()); }
    }
    var custIco = function() {
        var customLayer = L.geoJson();
        if (cmd.map.hasOwnProperty("icon")) {
            var col = cmd.map.iconColor || "#910000";
            var myMarker = L.divIcon({
                className:"faicon",
                html: '<center><i class="fa fa-fw '+cmd.map.icon+'" style="color:'+col+'"></i></center>',
                iconSize: [15, 15],
            });
            customLayer = L.geoJson(null, {
                pointToLayer: function(geoJsonPoint, latlng) {
                    return L.marker(latlng, {icon: myMarker, title: geoJsonPoint.properties.name});
                }
            });
        }
        return customLayer;
    }
    // Add a new KML overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("kml") ) {
        if (overlays.hasOwnProperty(cmd.map.overlay)) {
            map.removeLayer(overlays[cmd.map.overlay]);
            existsalready = true;
        }
        //var opt = {async:true};
        overlays[cmd.map.overlay] = omnivore.kml.parse(cmd.map.kml, null, custIco());
        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
        if (cmd.map.hasOwnProperty("fit")) { map.fitBounds(overlays[cmd.map.overlay].getBounds()); }
    }
    // Add a new TOPOJSON overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("topojson") ) {
        if (overlays.hasOwnProperty(cmd.map.overlay)) {
            map.removeLayer(overlays[cmd.map.overlay]);
            existsalready = true;
        }
        overlays[cmd.map.overlay] = omnivore.topojson.parse(cmd.map.topojson);
        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
        if (cmd.map.hasOwnProperty("fit")) { map.fitBounds(overlays[cmd.map.overlay].getBounds()); }
    }
    // Add a new GPX overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("gpx") ) {
        if (overlays.hasOwnProperty(cmd.map.overlay)) {
            map.removeLayer(overlays[cmd.map.overlay]);
            existsalready = true;
        }
        overlays[cmd.map.overlay] = omnivore.gpx.parse(cmd.map.gpx, null, custIco());

        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
        if (cmd.map.hasOwnProperty("fit")) { map.fitBounds(overlays[cmd.map.overlay].getBounds()); }
    }
    // Add a new velocity overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("velocity") ) {
        if (overlays.hasOwnProperty(cmd.map.overlay)) {
            map.removeLayer(overlays[cmd.map.overlay]);
            existsalready = true;
        }
        overlays[cmd.map.overlay] = L.velocityLayer(cmd.map.velocity);
        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
        if (cmd.map.hasOwnProperty("fit")) { map.fitBounds(overlays[cmd.map.overlay].getBounds()); }
    }
    // Add a new overlay layer
    if (cmd.map && cmd.map.hasOwnProperty("overlay") && cmd.map.hasOwnProperty("url") && cmd.map.hasOwnProperty("opt")) {
        console.log("New overlay:",cmd.map.overlay);
        if (overlays.hasOwnProperty(cmd.map.overlay)) { existsalready = true; }
        if (cmd.map.hasOwnProperty("wms")) {   // special case for wms
            if (cmd.map.wms === "grey") {
                overlays[cmd.map.overlay] = L.tileLayer.graywms(cmd.map.url, cmd.map.opt);
            }
            else {
                overlays[cmd.map.overlay] = L.tileLayer.wms(cmd.map.url, cmd.map.opt);
            }
        }
        else if (cmd.map.hasOwnProperty("bounds")) {            //Image Overlay in the bounds specified (2D Array)
            if (cmd.map.bounds.length === 2 && cmd.map.bounds[0].length === 2 && cmd.map.bounds[1].length === 2) {
                overlays[cmd.map.overlay] = new L.imageOverlay(cmd.map.url, L.latLngBounds(cmd.map.bounds), cmd.map.opt);
            }
        }
        else {
            overlays[cmd.map.overlay] = L.tileLayer(cmd.map.url, cmd.map.opt);
        }
        //if (!existsalready && !inIframe) {
        if (!existsalready) {
            layercontrol.addOverlay(overlays[cmd.map.overlay],cmd.map.overlay);
        }
        map.addLayer(overlays[cmd.map.overlay]);
    }
    // Swap a base layer
    if (cmd.layer && basemaps.hasOwnProperty(cmd.layer)) {
        map.removeLayer(basemaps[baselayername]);
        baselayername = cmd.layer;
        basemaps[baselayername].addTo(map);
    }
    if (cmd.layer && (cmd.layer === "none")) {
        map.removeLayer(basemaps[baselayername]);
        baselayername = cmd.layer;
    }
    // Add search command
    if (cmd.hasOwnProperty("search") && (typeof cmd.search === "string")) {
        document.getElementById('search').value = cmd.search;
        if (cmd.search !== "") {
            openMenu();
            doSearch();
        }
        else {
            closeMenu();
            clearSearch();
        }
    }
    // Add side by side control
    if (cmd.side && (cmd.side === "none")) {
        sidebyside.remove();
        map.removeLayer(basemaps[sidebyside.lay]);
        sidebyside = undefined;
    }
    if (cmd.side && basemaps.hasOwnProperty(cmd.side)) {
        if (sidebyside) { sidebyside.remove(); map.removeLayer(basemaps[sidebyside.lay]); }
        basemaps[cmd.side].addTo(map);
        sidebyside = L.control.sideBySide(basemaps[baselayername], basemaps[cmd.side]);
        sidebyside.addTo(map);
        sidebyside.lay = cmd.side;
    }
    if (cmd.split && sidebyside && (cmd.split <= 100) && (cmd.split >= 0)) { sidebyside.setSplit(cmd.split); }
    // Turn on an existing overlay(s)
    if (cmd.hasOwnProperty("showlayer")) {
        if (typeof cmd.showlayer === "string") { cmd.showlayer = [ cmd.showlayer ]; }
        for (var i=0; i < cmd.showlayer.length; i++) {
            if (overlays.hasOwnProperty(cmd.showlayer[i])) {
                map.addLayer(overlays[cmd.showlayer[i]]);
            }
        }
    }
    // Turn off an existing overlay(s)
    if (cmd.hasOwnProperty("hidelayer")) {
        if (typeof cmd.hidelayer === "string") { cmd.hidelayer = [ cmd.hidelayer ]; }
        for (var i=0; i < cmd.hidelayer.length; i++) {
            if (overlays.hasOwnProperty(cmd.hidelayer[i])) {
                map.removeLayer(overlays[cmd.hidelayer[i]]);
            }
        }
    }
    // Lock the pan so map can be moved
    if (cmd.hasOwnProperty("panlock")) {
        if (cmd.panlock == "true" || cmd.panlock == true) { lockit = true; }
        else { lockit = false; doLock(false); }
        document.getElementById("lockit").checked = lockit;
    }
    // move to a new position
    var clat = map.getCenter().lat;
    var clon = map.getCenter().lng;
    var czoom = map.getZoom();
    if (cmd.hasOwnProperty("lat")) { clat = cmd.lat; }
    if (cmd.hasOwnProperty("lon")) { clon = cmd.lon; }
    if (cmd.hasOwnProperty("zoom")) { czoom = cmd.zoom; }
    map.setView([clat,clon],czoom);

    if (cmd.hasOwnProperty("cluster")) {
        clusterAt = cmd.cluster;
        document.getElementById("setclus").value = cmd.cluster;
        setCluster(clusterAt);
    }
    if (cmd.hasOwnProperty("maxage")) {
        document.getElementById("maxage").value = cmd.maxage;
        setMaxAge();
    }
    if (cmd.hasOwnProperty("heatmap")) {
        heat.setOptions(cmd.heatmap);
        document.getElementById("heatall").checked = !!cmd.heatmap;
        heat.redraw();
    }
    if (cmd.hasOwnProperty("panlock") && lockit === true) { doLock(true); }
    if (cmd.hasOwnProperty("zoomlock")) {
        if (cmd.zoomlock == "true" || cmd.zoomlock == true) {
            if (map.doubleClickZoom.enabled()) { map.removeControl(map.zoomControl); }
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
        }
        else {
            if (!map.doubleClickZoom.enabled()) { map.addControl(map.zoomControl); }
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
        }
    }
}

// handle any incoming GEOJSON directly - may style badly
function doGeojson(g) {
    console.log("GEOJSON",g);
    if (!basemaps["geojson"]) {
        var opt = { style: function(feature) {
                var st = { stroke:true, color:"#910000", weight:2, fill:true, fillColor:"#910000", fillOpacity:0.3 };
                if (feature.hasOwnProperty("properties")) {
                    console.log("GPROPS", feature.properties)
                }
                if (feature.hasOwnProperty("style")) {
                    console.log("GSTYLE", feature.style)
                }
                return st;
            }
        }
        opt.onEachFeature = function (f,l) {
            if (f.properties) { l.bindPopup('<pre>'+JSON.stringify(f.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>'); }
        }
        overlays["geojson"] = L.geoJson(g,opt);
        layercontrol.addOverlay(overlays["geojson"],"geojson");
    }
    overlays["geojson"].addData(g);
}

connect();
