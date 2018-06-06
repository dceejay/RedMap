# node-red-contrib-web-worldmap

![NPM version](https://badge.fury.io/js/node-red-contrib-web-worldmap.svg)

A <a href="http://nodered.org" target="mapinfo">Node-RED</a> node to provide world
map web page for plotting "things" on.

![Map Image](https://dceejay.github.io/pages/images/redmap.png)

### Updates

- v1.2.0 - Bump version (should have done it for adding velocity layer). Tidy up deletion of marker and tracks.
- v1.1.16 - Add Velocity layer - for velocity grid type overlays (eg wind, currrents, etc)
- v1.1.15 - Tidy of Info, Readme and NATO symbol options.
- v1.1.14 - Add proper NATO symbology via <a href="https://github.com/spatialillusions/milsymbol" target="mapinfo">milsymbol.js</a>
- v1.1.13 - Add ability to set a building using a GeoJSON Feature set. {name:"MyTower":building:{...feature sets...}}

see [CHANGELOG](https://github.com/dceejay/RedMap/blob/master/CHANGELOG.md) for full list.

## Install

Either use the Manage Palette option in the Node-RED Editor menu, or run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i --save node-red-contrib-web-worldmap



## Usage

Plots "things" on a map. The map will be served from `{httpRoot}/worldmap`

Use keyboard shortcut `⌘⇧m`, `ctrl-shift-m` to jump to the map.

The minimum **msg.payload** must contain `name`, `lat` and `lon` properties, e.g.

        msg.payload = { name:"Joe", lat:51.05, lon:-1.35 }

`name` must be a unique identifier across the whole map. Repeated location updates to the same `name` move the point.

Optional properties include

 - **deleted** : set to <i>true</i> to remove the named marker. (default <i>false</i>)
 - **layer** : specify a layer on the map to add marker to.
 - **speed** : combined with bearing, draws a vector.
 - **bearing** : combined with speed, draws a vector.
 - **accuracy** : combined with bearing, draws a polygon of possible direction.
 - **icon** : <a href="http://fortawesome.github.io/Font-Awesome/icons/" target="mapinfo">font awesome</a> icon name.
 - **iconColor** : Standard CSS colour name or #rrggbb hex value.
 - **SIDC** : NATO symbology code (instead of icon). See below.
 - **building** : OSMbulding GeoJSON feature set to add 2.5D buildings to buildings layer. See below.
 - **ttl** : time to live, how long an individual marker stays on map in seconds (overrides general maxage setting)
 - **photoUrl** : adds an image pointed at by the url to the popup box.
 - **videoUrl** : adds an mp4 video pointed at by the url to the popup box. Ideally 320x240 in size.
 - **weblink** : adds a link to an external page for more information. Either set a url as a *string*, or an *object* like `{name:"BBC News", url:"news.bbc.co.uk"}`
 - **addtoheatmap** : set to <i>false</i> to exclude point from contributing to heatmap layer. (default true)
 - **intensity** : set to a value of 0.1 - 1.0 to set the intensity of the point on heatmap layer. (default 1.0)

Any other `msg.payload` properties will be added to the icon popup text box.

### Icons

You may select any of the Font Awesome set of [icons](http://fortawesome.github.io/Font-Awesome/icons/).
If you use the name without the fa- prefix (eg `male`) you will get the icon inside a generic marker shape. If you use the fa- prefix (eg `fa-male`) you will get the icon on its own.

There are also several special icons...

 - **plane** : a plane icon that aligns with the bearing of travel.
 - **ship** : a ship icon that aligns with the bearing of travel.
 - **car** : a car icon that aligns with the bearing of travel.
 - **uav** : a small plane icon that aligns with the bearing of travel.
 - **arrow** : a map GPS arrow type pointer that aligns with the bearing of travel.
 - **wind** : a wind arrow that points in the direction the wind is coming FROM.
 - **satellite** : a small satellite icon.
 - **locate** : a 4 corner outline to locate a point without obscuring it.
 - **friend** : pseudo NATO style blue rectangle.
 - **hostile** : pseudo NATO style red circle.
 - **neutral** : pseudo NATO style green square.
 - **unknown** : pseudo NATO style yellow square.
 - **earthquake** : black circle - diameter proportional to `msg.mag`.

#### NATO Symbology

You can use NATO symbols from <a href="https://github.com/spatialillusions/milsymbol" target="mapinfo">milsymbol.js</a>.
To do this you need to supply a `msg.SIDC` instead of an icon, for example:

    msg.payload = { name: "Emergency Medical Operation",
        lat: 51.05,
        lon: -1.35,
        SIDC:"ENOPA-------",
        options: { fillOpacity:0.8 }
    }

SIDC codes can be generated using the online tool - https://spatialillusions.com/unitgenerator/

There are lots of extra options you can specify as `msg.options` - see the <a href="https://github.com/spatialillusions/milsymbol/tree/master/docs" target="mapinfo">milsymbol docs here</a>.

### Buildings

The OSM Buildings layer is available in the layers menu. You can replace this with a building of your own by
sending a msg.payload containing a name and a building property. The building property should be
a GeoJSON Feature Collection as per the OSMBuildings spec.

    msg.payload = { name:"My Block", building: {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {
              "wallColor": "rgb(0,0,255)",
              "roofColor": "rgb(128,128,255)",
              "height": 50,
              "minHeight": 0,
              "piso": 0
            },
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                [
                  [-1.398163, 51.026591],
                  [-1.397781, 51.026597],
                  [-1.397751, 51.025430],
                  [-1.398148, 51.025427],
                  [-1.398163, 51.026591]
                ]
              ]
            }
          }
        ] }
    }

**Note**: the object you supply will replace the whole buildings layer. To delete the building send a msg with a name and the building property set to ""  (blank string).


### Areas and Lines

If the payload contains an **area** property - that is an array of co-ordinates, e.g.

    ... , area: [ [51.05, -0.08], [51.5, -1], [51.2, -0.047] ], ...

then rather than draw a point and icon it draws the polygon. Likewise if it contains a
**line** property it will draw the polyline.

 - **iconColor** : can set the colour of the polygon or line.
 - **name** : is used as the id key - so can be redrawn/moved.
 - **layer** : declares which layer you put it on..

### Circles

If the payload contains a **radius** property, as well as name, lat and lon, then rather
than draw a point it will draw a circle. The *radius* property is specified in meters.

    msg.payload = { lat:51.05, lon:-1.35, name:"A3090", radius:3000 }

As per Areas and Lines you may also specify *iconColor*, and *layer*.

If the payload contains a **sdlat** and **sdlon** property instead of *radius* an ellipse will be drawn. The sdlat and sdlon propertys specify the semi-axes of the ellipse.
These are specified in the Latitude/Longitude format.

### Options

Areas, Lines and Circles can also specify more optional properties:
 - color
 - fillColor
 - stroke
 - weight
 - opacity
 - fill
 - fillOpacity
 - clickable (if true sets the passed in name as Popup)

## Drawing

A single *right click* will allow you to add a point to the map - you must specify the `name` and optionally the `icon` and `layer`.  

Right-clicking on an icon will allow you to delete it.

If you select the **drawing** layer you can also add polylines, polygons and rectangles.

All these events generate messages that can be received by using a **worldmap in** node. For example:

    { "action": "connected" }
    { "action": "point", "lat": "50.60634", "lon": "-1.66580", "point": "joe,male,mylayer" }
    { "action": "delete", "name": "joe" }
    { "action": "layer", "name": "Esri Satellite" }
    { "action": "draw", "type": "rectangle", "points": [ { "lat": 50.61243889044519, "lng": -1.5913009643554688 }, { "lat": 50.66665471366635, "lng": -1.5913009643554688 }, { "lat": 50.66665471366635, "lng": -1.4742279052734375 }, { "lat": 50.61243889044519, "lng": -1.4742279052734375 } ] }

## Control

You can also control the map via the node, by sending in a msg.payload containing a **command** object.

Optional properties include

 - **lat** - move map to specified latitude.
 - **lon** - move map to specified longitude.
 - **zoom** - move map to specified zoom level (1 - world, 13 to 20 max zoom depending on map).
 - **layer** - set map to specified layer name (can be a base layer or an overlay layer).
 - **map** - Object containing details of a new map layer:
   - **name** - name of the map base layer OR **overlay** - name of overlay layer
   - **url** - url of the map layer
   - **opt** - options object for the new layer
   - **wms** - boolean, specifies if the data is provided by a Web Map Service
   - **bounds** - sets the bounds of an Overlay-Image. 2 Dimensional Array that defines the top-left and bottom-right Corners (lat/lng Points)
 - **heatmap** - set heatmap options object see https://github.com/Leaflet/Leaflet.heat#reference
 - **clear** - layer name - to clear a complete layer and remove from layer menu

#### To switch layer, move map and zoom

    msg.payload.command =  {layer:"Esri Relief", lat:51, lon:3, zoom:10 };

#### To draw a heavily customized Circle on a layer

    msg.payload.command =  {
        name:"circle",
        lat:51.515,
        lon:-0.1235,
        radius:10,
        layer:"drawing",
        iconColor:'#464646',
        stroke:false,
        fillOpacity:0.8,
        clickable:true
    };

#### To add a new base layer

    msg.payload.command.map = {
        name:"OSMhot",
        url:'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        opt:{ maxZoom:19, attribution:"&copy; OpenStreetMap" }
    };

#### To add a new geoJSON overlay

    msg.payload.command.map = {
        overlay:"myGeoJSON",
        geojson:{ your geojson feature as an object },
        opt:{ optional geojson options, style, filter, onEach, Feature, etc }
    };

see http://leafletjs.com/examples/geojson/ for more details about options

#### To add a Velocity Grid Overlay

    msg.payload.command.map = {
        overlay:"myWind",
        velocity: { 	
            displayValues: true,
	        displayOptions: {
                velocityType: 'Global Wind',
                displayPosition: 'bottomleft',
                displayEmptyString: 'No wind data'
            },
            maxVelocity: 15,
            data: [Array of data as per format referenced below]
        }
    };

see https://github.com/danwild/leaflet-velocity for more details about options and data examples.

#### To add an Image Overlay

    var imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
    msg.payload = { command : {lat:40.74, lon:-74.175, zoom:13 } };
    msg.payload.command.map = {
        overlay:"New York Historical",
        url:'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
        bounds: imageBounds,
        opt:{ opacity:1.0, attribution:"&copy; University of Texas" }
    };

#### To clear a layer from the map

    msg.payload.command.clear = "name of your layer/overlay to remove";

### Using a local Map Server (WMS server)

IMHO the easiest map server to make work is the <a href="http://www.mapserver.org/" target="mapinfo">mapserver</a> package in Ubuntu / Debian. Usually you will start with

    sudo apt-get install mapserver-bin cgi-mapserver gdal-bin

Configuring that, setting up your tiles, and creating a .map file is way beyond the scope of this README so I will leave that as an exercise for the reader. Once set up you should have a cgi process you can run called `mapserv`, and a `.map` file that describes the layers available from the server.

Create and edit these into an executeable file called **mapserv**, located in this node's directory, typically
`~/.node-red/node_modules/node-red-contrib-web-worldmap/mapserv`, for example:

    #! /bin/sh
    # set this to the path of your WMS map file (which in turn points to your tiles)
    MS_MAPFILE=~/Data/maps/uk.map
    export MS_MAPFILE
    # and set this to the path of your cgi-mapserv executable
    /usr/bin/mapserv

You can then add a new WMS Base layer by injecting a message like

    msg.payload.command.map = {
        name: "Local WMS",
        url: 'http://localhost:1880/cgi-bin/mapserv',   // we will serve the tiles from this node locally.
        opt: {
            layers: 'gb',                               // specifies a layer in your map file
            format: 'image/png',
            transparent: true,
            attribution: "© Ordnance Survey, UK"
        },
        wms: true                                       // set to true for WMS type mapserver
    }


## Demo Flow

The following example gets recent earthquakes from USGS, parses the result,
formats up the msg as per above and sends to the node to plot on the map.
It also shows how to zoom and move the map or add a new layer.

    [{"id":"f7950c21.019f5","type":"worldmap","z":"896b28a8.437658","name":"","x":670,"y":680,"wires":[]},{"id":"bb057b8a.4fe2c8","type":"inject","z":"896b28a8.437658","name":"","topic":"","payload":"","payloadType":"none","repeat":"","crontab":"","once":false,"x":110,"y":640,"wires":[["b8545e85.5ba4c"]]},{"id":"b8545e85.5ba4c","type":"function","z":"896b28a8.437658","name":"add new layer","func":"msg.payload = {};\nmsg.payload.command = {};\n\nvar u = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';\nvar o = JSON.stringify({ maxZoom: 19, attribution: '&copy; OpenStreetMap'});\n\nmsg.payload.command.map = {name:\"OSMhot\", url:u, opt:o};\nmsg.payload.command.layer = \"OSMhot\";\n\nreturn msg;","outputs":1,"noerr":0,"x":340,"y":640,"wires":[["f7950c21.019f5"]]},{"id":"e6cc0a05.14edd8","type":"function","z":"896b28a8.437658","name":"USGS Quake monitor csv re-parse","func":"msg.payload.lat = msg.payload.latitude;\nmsg.payload.lon = msg.payload.longitude;\nmsg.payload.layer = \"earthquake\";\nmsg.payload.name = msg.payload.id;\nmsg.payload.icon = \"globe\";\nmsg.payload.iconColor = \"orange\";\n\ndelete msg.payload.latitude;\ndelete msg.payload.longitude;\t\nreturn msg;","outputs":1,"noerr":0,"x":460,"y":780,"wires":[["f7950c21.019f5"]]},{"id":"84b8388.5e943c8","type":"function","z":"896b28a8.437658","name":"move and zoom","func":"msg.payload = { command:{layer:\"Esri Terrain\",lat:0,lon:0,zoom:3} };\nreturn msg;","outputs":1,"noerr":0,"x":340,"y":680,"wires":[["f7950c21.019f5"]]},{"id":"5c317188.d2f31","type":"csv","z":"896b28a8.437658","name":"","sep":",","hdrin":true,"hdrout":"","multi":"one","ret":"\\n","temp":"","x":310,"y":720,"wires":[["e6cc0a05.14edd8"]]},{"id":"cfafad11.2f299","type":"inject","z":"896b28a8.437658","name":"","topic":"","payload":"","payloadType":"none","repeat":"","crontab":"","once":false,"x":110,"y":680,"wires":[["84b8388.5e943c8"]]},{"id":"f0d75b03.39d618","type":"http request","z":"896b28a8.437658","name":"","method":"GET","url":"http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.csv","x":190,"y":780,"wires":[["5c317188.d2f31"]]},{"id":"87da03a.eb8a3","type":"inject","z":"896b28a8.437658","name":"Quakes","topic":"","payload":"","payloadType":"none","repeat":"900","crontab":"","once":false,"x":120,"y":720,"wires":[["f0d75b03.39d618"]]}]


Car icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="mapinfo">CC 3.0 BY</a>.</div>
