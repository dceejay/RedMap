# node-red-contrib-web-worldmap

[![npm version](https://badge.fury.io/js/node-red-contrib-web-worldmap.svg)](https://badge.fury.io/js/node-red-contrib-web-worldmap)
[![GitHub license](https://github.com/dceejay/redmap/blob/master/LICENSE)](https://img.shields.io/github/license/dceejay/redmap.svg)

A <a href="https://nodered.org" target="mapinfo">Node-RED</a> node to provide a world
map web page for plotting "things" on.

![Map Image](https://dceejay.github.io/pages/images/redmap.png)

### Updates

- v2.1.6 - Add legend command to allow inserting an html legend
- v2.1.5 - Fix squawk icon color handling
- v2.1.4 - Fix alt and speed as strings
- v2.1.3 - Fix web page file path error
- v2.1.2 - Fix layercontrol remove bug. Issue #116
- v2.1.1 - fix bug in repeated add with polygon
- v2.1.0 - add ui-worldmap node to make embedding in Dashboard easier. Let -in node specify connection actions only.
- v2.0.22 - fix SIDC missing property
- v2.0.21 - allow adding overlays without making them visible (visible:false). Issue #108
- v2.0.20 - ensure `fit` option is boolean, Issue #109. Fix track layers, Issue #110.
- v2.0.18 - Stop map contextmenu bleedthrough to marker. Add compress middleware.
- v2.0.17 - Let clear command also clear tracks from tracks node
- v2.0.16 - Revert use of ES6 import. Keep IE11 happy for while
- v2.0.13 - Fix tracks colour.
- v2.0.12 - Ensure default icon is in place if not specified (regression)
- v2.0.9 - Only update maxage on screen once it exists
- v2.0.8 - Drop beta flag, re-organise index, js and css files. Now using leaflet 1.4
- v2.0.7-beta - Switch Ruler control to be independent of Draw library.
- v2.0.6-beta - Re-enable editing of draw layer, add rectangles to lines and areas. Make individual objects editable.
- v2.0.5-beta - Fix clustering on zoom (update old library)
- v2.0.4-beta - Add helicopter icon. Correct Leaflet.Coordinates file name. Fix right contextmenu.
- v2.0.3-beta - Let circles have popups. Better drawing of ellipses
- v2.0.2-beta - Let lines and areas also have popups
- v2.0.1-beta - Add optional graticule
- v2.0.0-beta - Move to leaflet 1.4.x plus all plugins updated
  - ...

see [CHANGELOG](https://github.com/dceejay/RedMap/blob/master/CHANGELOG.md) for full list.

## Install

Either use the Manage Palette option in the Node-RED Editor menu, or run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i node-red-contrib-web-worldmap


## Usage

Plots "things" on a map. By default the map will be served from `{httpRoot}/worldmap`, but this
can be configured in the configuration panel.

Use keyboard shortcut `⌘⇧m`, `ctrl-shift-m` to jump to the map.

The minimum **msg.payload** must contain `name`, `lat` and `lon` properties, for example

        msg.payload = { "name":"Jason", "lat":51.05, "lon":-1.35 }

`name` must be a unique identifier across the whole map. Repeated location updates to the same `name` move the marker.

Optional properties include

 - **deleted** : set to <i>true</i> to remove the named marker. (default <i>false</i>)
 - **draggable** : set to <i>true</i> to allow marker to be moved. (default <i>false</i>)
 - **layer** : specify a layer on the map to add marker to. (default <i>"unknown"</i>)
 - **speed** : when combined with bearing, draws a vector.
 - **bearing** : when combined with speed, draws a vector.
 - **accuracy** : when combined with bearing, draws a polygon of possible direction.
 - **color** : CSS color name or #rrggbb value for bearing line or accuracy polygon
 - **icon** : <a href="https://fontawesome.com/v4.7.0/icons/" target="mapinfo">font awesome</a> icon name, <a href="https://github.com/Paul-Reed/weather-icons-lite" target="mapinfo">weather-lite</a> icon, :emoji name:, or http://
 - **iconColor** : Standard CSS colour name or #rrggbb hex value.
 - **SIDC** : NATO symbology code (can be used instead of icon). See below.
 - **building** : OSMbulding GeoJSON feature set to add 2.5D buildings to buildings layer. See below.
 - **ttl** : time to live, how long an individual marker stays on map in seconds (overrides general maxage setting, minimum 20 seconds)
 - **photoUrl** : adds an image pointed at by the url to the popup box.
 - **videoUrl** : adds an mp4 video pointed at by the url to the popup box. Ideally 320x240 in size.
 - **weblink** : adds a link to an external page for more information. Either set a url as a *string*, or an *object* like `{"name":"BBC News", "url":"http://news.bbc.co.uk", "target":"_new"}`
 - **addtoheatmap** : set to <i>false</i> to exclude point from contributing to the heatmap layer. (default true)
 - **intensity** : set to a value of 0.1 - 1.0 to set the intensity of the point on the heatmap layer. (default 1.0)
 - **popped** : set to true to automatically open the popup info box, set to false to close it.
 - **popup** : html to fill the popup if you don't want the automatic default of the properties list. Using this overrides photourl, videourl and weblink options.
 - **label** : displays the contents as a permanent label next to the marker, or
 - **tooltip** : displays the contents when you hover over the marker. (Mutually exclusive with label. Label has priority)
 - **contextmenu** : an html fragment to display on right click of marker - defaults to delete marker. You can specify `$name` to pass in the name of the marker. Set to `""` to disable just this instance.

Any other `msg.payload` properties will be added to the icon popup text box. This can be
overridden by using the **popup** property to supply your own html content. If you use the
popup property it will completely replace the contents so photourl, videourl and weblink are
meaningless in this mode.

### Icons

You may select any of the Font Awesome set of [icons](https://fontawesome.com/v4.7.0/icons/).
If you use the name without the fa- prefix (eg `male`) you will get the icon inside a generic marker shape. If you use the fa- prefix (eg `fa-male`) you will get the icon on its own. Likewise you can use any of the [Weather-lite](https://github.com/Paul-Reed/weather-icons-lite) icons by using the wi- prefix. These map to icons returned by common weather API such as DarkSky and OpenWeatherMap - for example `"wi-owm-"+msg.payload.weather[0].icon` will pickup the icon returned from the OpenWeatherMap API.

You can also specify an emoji as the icon by using the :emoji name: syntax - for example `:smile:`. Here is a **[list of emojis](https://github.com/dceejay/RedMap/blob/master/emojilist.md)**.

Or you can specify an image to load as an icon by setting the icon to http(s)://... It will be scaled to 32x32 pixels. For example `"https://img.icons8.com/windows/32/000000/bird.png"`

There are also several special icons...

 - **plane** : a plane icon that aligns with the bearing of travel.
 - **ship** : a ship icon that aligns with the bearing of travel.
 - **car** : a car icon that aligns with the bearing of travel.
 - **uav** : a small plane icon that aligns with the bearing of travel.
 - **helicopter** : a small helicopter icon that aligns with the bearing of travel.
 - **arrow** : a map GPS arrow type pointer that aligns with the bearing of travel.
 - **wind** : a wind arrow that points in the direction the wind is coming FROM.
 - **satellite** : a small satellite icon.
 - **iss** : a slightly larger icon for the ISS.
 - **locate** : a 4 corner outline to locate a point without obscuring it.
 - **friend** : pseudo NATO style blue rectangle.
 - **hostile** : pseudo NATO style red circle.
 - **neutral** : pseudo NATO style green square.
 - **unknown** : pseudo NATO style yellow square.
 - **earthquake** : black circle - diameter proportional to `msg.mag`.

#### NATO Symbology

You can use NATO symbols from <a href="https://github.com/spatialillusions/milsymbol" target="mapinfo">milsymbol.js</a>.
To do this you need to supply a `msg.SIDC` instead of an icon, for example:

    msg.payload = { "name": "Emergency Medical Operation",
        "lat": 51.05,
        "lon": -1.35,
        "SIDC": "ENOPA-------",
        "options": { "fillOpacity":0.8 }
    }

SIDC codes can be generated using the online tool - https://spatialillusions.com/unitgenerator/

There are lots of extra options you can specify as `msg.options` - see the <a href="https://github.com/spatialillusions/milsymbol/tree/master/docs" target="mapinfo">milsymbol docs here</a>.

### Buildings

The OSM Buildings layer is available in the layers menu. You can replace this with a
building of your own by sending a `msg.payload.command.map` containing an `overlay`
and a `geojson` property. The geojson property should be a GeoJSON Feature Collection
as per the OSMBuildings spec. For example in a function node:

    var geo = { "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "color": "rgb(0,0,255)",
          "roofColor": "rgb(128,128,255)",
          "height": 20,
          "minHeight": 0
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
            [-1.356221,51.048611],
            [-1.356039,51.048672],
            [-1.355765,51.048311],
            [-1.355937,51.048237],
            [-1.356221,51.048611]
            ]
          ]
        }
      }
    ]
    }
    var m = {overlay:"Golf Clubhouse", geojson:geo, fit:true};
    msg.payload = {command:{map:m, lat:51.0484, lon:-1.3558}};
    return msg;

**Note**: the object you supply will replace the whole buildings layer. To delete the building send a msg with a name and the building property set to ""  (blank string).

#### Buildings 3D view

A 3D map view has now been added as **worldmap/index3d.html** using the mapbox api - the msg can support `msg.command.pitch` and `msg.command.bearing` to angle the view, for example:

    msg.payload = { "command": { "zoom":18, "pitch":60, "bearing":80 } }

The `icon` can be specified as a person, block, bar, or "anything else" - they will render slightly differently - all units are approximate. They will be positioned at the `lat`, `lon` as normal but also at the `msg.payload.height` - where height is in meters above the surface of the map (which may or may not relate to altitude...)

`msg.payload.icon` can be

 - person : 1m x 1m x 2m tall
 - block : 5m x 5m x 5m cube
 - bar : a bar from the surface up to the specified minHeight
 - (else) : 1.5m x 1.5m x 1.5m cube


in addition existing male, female, fa-male and fa-female icons are all represented as the person shape.
 `msg.iconColor` can be used to colour the icons.

 **NOTES**

 - There is currently no way to add labels, popups, or make the icons clickable.
 - The 3D only really works at zoomed in scales 16+ due to the small size of the icons. They are not scale independent like icons on the normal map.
 - As this uses the mapbox api you may wish to edit the index3d.html code to include your api key to remove any usage restrictions.
 - This view is a side project to the Node-RED Worldmap project so I'm happy to take PRs but it probably won't be actively developed.

### Areas, Lines and Rectangles

If the msg.payload contains an **area** property - that is an array of co-ordinates, e.g.

    msg.payload = {"name": "zone1", "area": [ [51.05, -0.08], [51.5, -1], [51.2, -0.047] ]}

then rather than draw a point and icon it draws the polygon. If the "area" array only has 2
elements, then it assumes this is a bounding box for a rectangle and draws a rectangle.

Likewise if it contains a **line** property it will draw the polyline.

There are extra optional properties you can specify - see Options below.


### Circles and Ellipses

If the msg.payload contains a **radius** property, as well as name, lat and lon, then rather
than draw a point it will draw a circle. The *radius* property is specified in meters.

    msg.payload = { "name":"A3090", "lat":51.05, "lon":-1.35, "radius":3000 }

As per Areas and Lines you may also specify *color*, *fillColor*, and *layer*, see Options below.

If the **radius** property is an array of two numbers, these specify the minor and major radii
of an ellipse, in meters. A **tilt** property can also be applied to rotate the ellipse by
a number of degrees.

    msg.payload = { "name":"Bristol Channel", "lat":51.5, "lon":-2.9, "radius":[30000,70000], "tilt":45 };

### Options

Areas, Rectangles, Lines, Circles and Ellipses can also specify more optional properties:

 - **layer** : declares which layer you put it on.
 - **color** : can set the colour of the polygon or line.
 - **fillColor** : can set the fill colour of the polygon.
 - **fillOpacity** : can set the opacity of the polygon fill colour.
 - **dashArray** : optional dash array for polyline.
 - **clickable** : boolean - set to true to allow click to show popup.
 - **popup** : html string to display in popup (as well as name).
 - **editable** : boolean - set to true to allow simple edit/delete right click contextmenu
 - **contextmenu** : html string to display a more complex right click contextmenu
 - **weight** : the width of the line (or outline)

Other properties can be found in the leaflet documentation.

## Drawing

A single *right click* will allow you to add a point to the map - you must specify the `name` and optionally the `icon` and `layer`.  

Right-clicking on an icon will allow you to delete it.

If you select the **drawing** layer you can also add and edit polylines, polygons, rectangles and circles.
Once an item is drawn you can right click to edit or delete it. Double click the object to exit edit mode.

## Events from the map

The **worldmap in** node can be used to receive various events from the map. Examples of messages coming FROM the map include:

    { "action": "connected" }  // useful to trigger delivery or redraw of points
    { "action": "disconnect", "clients": 1 }  // when a client disconnects - reports number remaining

    { "action": "click", "name":"Jason", "layer":"gps", "icon":"male", "iconColor":"blue", "lat":51.024985, "lon":-1.39698 }   // when a marker is clicked
    { "action": "move", "name":"Jason", "layer":"gps", "icon":"male", "iconColor":"blue", "lat":51.044632, "lon":-1.359901 }    // when a marker is moved
    { "action": "delete", "name": "Jason" }  // when a point or shape is deleted

    { "action": "point", "lat": "50.60634", "lon": "-1.66580", "point": "Jason,male,gps" }
    { "action": "draw", "type": "rectangle", "points": [ { "lat": 50.61243889044519, "lng": -1.5913009643554688 }, { "lat": 50.66665471366635, "lng": -1.5913009643554688 }, { "lat": 50.66665471366635, "lng": -1.4742279052734375 }, { "lat": 50.61243889044519, "lng": -1.4742279052734375 } ] }

    { "action": "layer", "name": "myLayer" }      // when a map layer is changed
    { "action": "addlayer", "name": "myLayer" }   // when a new map layer is added
    { "action": "dellayer", "name": "myLayer" }   // when a new map layer is deleted

    { "action": "button", "name": "My Fancy Button" } // when a user defined button is clicked

    { "action": "feedback", "name": "some name", "value": "some value" } // when a user calls the feedback function - see below

All actions also include a `msg._sessionid` property that indicates which client session they came from. Any msg sent out that includes this property will ONLY be sent to that session - so you can target map updates to specific sessions if required.


### Utility functions

There are some internal functions available to make interacting with Node-RED easier (e.g. from inside a user defined popup., these include:

 - **feedback()** : it takes two (or three) parameters, name, value, and optionally an action name (defaults to "feedback"), and can be used inside something like an input tag - `onchange='feedback(this.name,this.value)'`. Value can be a more complex object if required as long as it is serialisable.

 - **delMarker()** : takes the name of the marker as a parameter. In a popup this can be specified as `$name` for dynamic substitution.

 - **editPoly()** : takes the name of the shape or line as a parameter. In a popup this can be specified as `$name` for dynamic substitution.


## Controlling the map

You can also control the map via the node, by sending in a msg.payload containing a **command** object. Multiple parameters can be specified in one command.

Optional properties include

 - **lat** - move map to specified latitude.
 - **lon** - move map to specified longitude.
 - **zoom** - move map to specified zoom level (1 - world, 13 to 20 max zoom depending on map).
 - **layer** - set map to specified base layer name - `{"command":{"layer":"Esri"}}`
 - **search** - search markers on map for name containing `string`. If not found in existing markers, will then try geocoding looking using Nominatim. An empty string `""` clears the search results. - `{"command":{"search":"Winchester"}}`
 - **showlayer** - show the named overlay(s) - `{"command":{"showlayer":"foo"}}` or `{"command":{"showlayer":["foo","bar"]}}`
 - **hidelayer** - hide the named overlay(s) - `{"command":{"hidelayer":"bar"}}` or `{"command":{"hidelayer":["bar","another"}}`
 - **side** - add a second map alongside with slide between them. Use the name of a *baselayer* to add - or "none" to remove the control. - `{"command":{"side":"Esri Satellite"}}`
 - **split** - once you have split the screen - the split value is the % across the screen of the split line. - `{"command":{"split":50}}`
 - **map** - Object containing details of a new map layer:
   - **name** - name of the map base layer OR **overlay** - name of overlay layer
   - **url** - url of the map layer
   - **opt** - options object for the new layer
   - **wms** - true/false/grey, specifies if the data is provided by a Web Map Service (if grey sets layer to greyscale)
   - **bounds** - sets the bounds of an Overlay-Image. 2 Dimensional Array that defines the top-left and bottom-right Corners (lat/lon Points)
   - **delete** - name or array of names of base layers and/or overlays to delete and remove from layer menu.
 - **heatmap** - set heatmap options object see https://github.com/Leaflet/Leaflet.heat#reference
 - **clear** - layer name - to clear a complete layer and remove from layer menu - `{"command":{"clear":"myOldLayer"}}`
 - **panlock** - lock the map area to the current visible area. - `{"command":{"panlock":true}}`
 - **zoomlock** - locks the zoom control to the current value and removes zoom control - `{"command":{"zoomlock":true}}`
 - **hiderightclick** - disables the right click that allows adding or deleting points on the map - `{"command":{"hiderightclick":true}}`
 - **coords** - turns on and off a display of the current mouse co-ordinates. Values can be "deg", "dms", or "none" (default). - `{"command":{"coords":"deg"}}`
 - **button** - if supplied with a `name` and `icon` property - adds a button to provide user input - sends
 a msg `{"action":"button", "name":"the_button_name"}` to the worldmap in node. If supplied with a `name` property only, it will remove the button. Optional `position` property can be 'bottomright', 'bottomleft', 'topleft' or 'topright' (default).
 - **contextmenu** - html string to define the right click menu when not on a marker. Defaults to the simple add marker input. Empty string `""` disables this right click.

#### To switch layer, move map and zoom

    msg.payload = { "command": { "layer":"Esri Satellite", "lat":51, "lon":3, "zoom":10 }};

You can also use the name "none" to completely remove the base layer,

    msg.payload = { "command": { "layer":"none" }};

#### To add and remove a user defined button

to add a button bottom right

    msg.payload.command = { "button": { "name":"My Fancy Button", "icon": "fa-star", "position":"bottomright" } };

When clicked the button will send an event to the `worldmap in` node containing `{"action":"button", "name","My Fancy Button"}` - this can then be used to trigger other map commands or flows.

to remove

    msg.payload.command = { "button": { "name":"My Fancy Button" } };

#### To add a custom popup or contextmenu

You can customise a marker's popup, or context menu (right click), by setting the
appropriate property to an html string. Often you will need some embedded javascript
in order to make it do something when you click a button for example. You need to be
careful escaping quotes, and that they remain matched.

For example a popup with a slider (note the \ escaping the internal ' )

    popup: '<input name="slide1" type="range" min="1" max="100" value="50" onchange=\'feedback(this.name,this.value)\' style="width:250px;">'

Or a contextmenu with a button

    contextmenu: '<button name="Clicker" onclick=\'feedback(this.name)\'>Click me</button>'

#### To add and remove a legend

If you want to add a small legend overlay

    msg.payload.command = { "legend": "<b>Title</b></br><i style=\"background: #477AC2\"></i> Water<br><i style=\"background: #448D40\"></i> Forest<br>" };


#### To draw a heavily customised Circle on a layer

    msg.payload.command =  {
        "name": "circle",
        "lat": 51.515,
        "lon": -0.1235,
        "radius": 10,
        "layer": "drawing",
        "iconColor": '#464646',
        "stroke": false,
        "fillOpacity": 0.8,
        "clickable": true
    };

#### To add a new base layer

The layer will be called `name`. By default it expects a leaflet Tilelayer style url. You can also use a WMS
style server by adding a property `wms: true`. You can also set `wms: "grey"` to set the layer to greyscale which
may let you markers be more visible. (see overlay example below).

    msg.payload.command.map = {
        "name":"OSMhot",
        "url":"https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        "opt":{ "maxZoom":19, "attribution":"&copy; OpenStreetMap" }
    };

#### To remove base or overlay layers

To remove several layers, either base layers or overlays, you can pass an array of names as follows.
This can be used to tidy up the initial selections available to the user layer menu.

    msg.payload.command.map = {
        "delete":["Watercolor","ship nav","heatmap","Terrain","UK OS 1900","UK OS 1919-47"]
    };

Note: layer names are case sensitive.

#### To add a WMS overlay layer - eg US weather radar

To add an overlay instead of a base layer - specify the `overlay` property instead of the `name`.

    msg.payload.command.map = {
        "overlay": "NowCoast",
        "url": "https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WmsServer?",
        "opt":  {
            "layers": "1",
            "format": "image/png",
            "transparent": true,
            "attribution": "NOAA/NWS"
        },
        "wms": true
    }

By default the overlay will be instantly visible. To load it hidden add a property to the command.map - `visible:false`

#### To add a new geoJSON overlay

    msg.payload.command.map = {
        "overlay": "myGeoJSON",
        "geojson": { your geojson feature as an object },
        "opt": { optional geojson options, style, etc },
        "fit": true
    };

The geojson features may contain a `properties` property. That may also include a `style` with properties - stroke, stroke-width, stroke-opacity, fill, fill-opacity. Any other properties will be listed in the popup.

The `opt` property is optional. See the <a href="https://leafletjs.com/examples/geojson/">Leaflet geojson docs</a> for more info on possible options. Note: only simple options are supported as functions cannot be serialised.

The `fit` property is optional. If boolean true the map will automatically zoom to fit the area relevant to the geojson.

see http://leafletjs.com/examples/geojson/ for more details about options for opt.

#### To add a new KML, GPX, or TOPOJSON overlay

As per the geojson overlay you can also inject a KML layer, GPX layer or TOPOJSON layer. The syntax is the same but with either a `kml` property containing the KML string - a `gpx` property containing a GPX string - or a `topojson` property containing the topojson.

    msg.payload.command.map = {
        "overlay": "myKML",
        "kml": "<kml>...your kml placemarks...</kml>"
    };

 For GPX and KML layers, it is possible to define which icon to use for point markers by adding the
 following properties to `msg.payload.command.map`:

 - **icon** : <a href="https://fontawesome.com/v4.7.0/icons/" target="mapinfo">font awesome</a> icon name.
 - **iconColor** : Standard CSS colour name or #rrggbb hex value.

Again the boolean `fit` property can be added to make the map zoom to the relevant area, and the `visible` property can be set false to not immediately show the layer.

#### To add a Velocity Grid Overlay

    msg.payload.command.map = {
        "overlay": "myWind",
        "velocity": { 	
            "displayValues": true,
	        "displayOptions": {
                "velocityType": "Global Wind",
                "displayPosition": "bottomleft",
                "displayEmptyString": "No wind data"
            },
            "maxVelocity": 15,
            "data": [Array of data as per format referenced below]
        }
    };

see https://github.com/danwild/leaflet-velocity for more details about options and data examples.

#### To add an Image Overlay

in a function node:

    var imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
    msg.payload = { command : { lat:40.74, lon:-74.175, zoom:13 } };
    msg.payload.command.map = {
        overlay: "New York Historical",
        url: 'https://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
        bounds: imageBounds,
        opt: { opacity:0.8, attribution:"&copy; University of Texas" }
    };

#### To add a Lat/Lon Graticule overlay

A graticule can be enabled via the node configuration, and can also be set dynamically,
for example in a function node:

    msg.payload = { command : { grid : {
        showgrid: true,
        opt: { showLabel:true, dashArray:[5, 5], fontColor:"#900" }
    };

see https://github.com/cloudybay/leaflet.latlng-graticule for more details about options and demo.

#### To clear all markers from a layer, or an overlay from the map

    msg.payload.command.clear = "name of the layer/overlay you wish to clear";

Feeding this into the tracks node will also remove the tracks stored for that layer.

### Using a local Map Server (WMS server)

IMHO the easiest map server to make work is the <a href="http://www.mapserver.org/" target="mapinfo">mapserver</a> package in Ubuntu / Debian. Usually you will start with

    sudo apt-get install mapserver-bin cgi-mapserver gdal-bin

Configuring that, setting up your tiles, and creating a .map file is way beyond the scope of this README so I will leave that as an exercise for the reader. Once set up you should have a cgi process you can run called `mapserv`, and a `.map` file that describes the layers available from the server.

Create and edit these into an executeable file called **mapserv**, located in this node's directory, typically
`~/.node-red/node_modules/node-red-contrib-web-worldmap/mapserv`, for example:

    #! /bin/sh
    # set this to the path of your WMS map file (which in turn points to your tiles)
    MS_MAPFILE=/home/pi/maps/gb.map
    export MS_MAPFILE
    # and set this to the path of your cgi-mapserv executable
    /usr/bin/mapserv

You can then add a new WMS Base layer by injecting a message like

    msg.payload = { command : { map : {
        "name": "Local WMS",
        "url": "/cgi-bin/mapserv",   // we will serve the tiles from this node locally.
        "opt": {
            "layers": "gb",                         // specifies a layer in your map file
            "format": "image/png",
            "transparent": true,
            "attribution": "© Ordnance Survey, UK"
        },
        "wms": true                                 // set to true for WMS type mapserver
    }}}

Optionally set `"wms":"grey"` to make the layer to greyscale which may make your markers more visible.


## Demo Flow

The following example gets recent earthquakes from USGS, parses the result,
formats up the msg as per above and sends to the node to plot on the map.
It also shows how to zoom and move the map or add a new layer.

    [{"id":"86457344.50e6b","type":"inject","z":"745a133b.dd6dec","name":"","topic":"","payload":"","payloadType":"none","repeat":"","crontab":"","once":false,"x":190,"y":2420,"wires":[["9a142026.fa47f"]]},{"id":"9a142026.fa47f","type":"function","z":"745a133b.dd6dec","name":"add new layer","func":"msg.payload = {};\nmsg.payload.command = {};\n\nvar u = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';\nvar o = { maxZoom: 19, attribution: '&copy; OpenStreetMap'};\n\nmsg.payload.command.map = {name:\"OSMhot\", url:u, opt:o};\nmsg.payload.command.layer = \"OSMhot\";\n\nreturn msg;","outputs":1,"noerr":0,"x":420,"y":2420,"wires":[["c643e022.1816c"]]},{"id":"c643e022.1816c","type":"worldmap","z":"745a133b.dd6dec","name":"","x":750,"y":2460,"wires":[]},{"id":"2998e233.4ba64e","type":"function","z":"745a133b.dd6dec","name":"USGS Quake monitor csv re-parse","func":"msg.payload.lat = msg.payload.latitude;\nmsg.payload.lon = msg.payload.longitude;\nmsg.payload.layer = \"earthquake\";\nmsg.payload.name = msg.payload.id;\nmsg.payload.icon = \"globe\";\nmsg.payload.iconColor = \"orange\";\n\ndelete msg.payload.latitude;\ndelete msg.payload.longitude;\t\nreturn msg;","outputs":1,"noerr":0,"x":540,"y":2560,"wires":[["c643e022.1816c"]]},{"id":"e72c5732.9fa198","type":"function","z":"745a133b.dd6dec","name":"move and zoom","func":"msg.payload = { command:{layer:\"Esri Terrain\",lat:0,lon:0,zoom:3} };\nreturn msg;","outputs":1,"noerr":0,"x":420,"y":2460,"wires":[["c643e022.1816c"]]},{"id":"12317723.589249","type":"csv","z":"745a133b.dd6dec","name":"","sep":",","hdrin":true,"hdrout":"","multi":"one","ret":"\\n","temp":"","x":390,"y":2500,"wires":[["2998e233.4ba64e"]]},{"id":"10e5e5f0.8daeaa","type":"inject","z":"745a133b.dd6dec","name":"","topic":"","payload":"","payloadType":"none","repeat":"","crontab":"","once":false,"x":190,"y":2460,"wires":[["e72c5732.9fa198"]]},{"id":"b6917d83.d1bac","type":"http request","z":"745a133b.dd6dec","name":"","method":"GET","url":"http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.csv","x":270,"y":2560,"wires":[["12317723.589249"]]},{"id":"3842171.4d487e8","type":"inject","z":"745a133b.dd6dec","name":"Quakes","topic":"","payload":"","payloadType":"none","repeat":"900","crontab":"","once":false,"x":200,"y":2500,"wires":[["b6917d83.d1bac"]]}]


Car and Helicopter icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="mapinfo">CC 3.0 BY</a>.
