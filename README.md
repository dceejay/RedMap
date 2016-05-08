node-red-contrib-web-worldmap
=============================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to provide world
map web page for plotting "things" on.

### Install

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-contrib-web-worldmap

### Usage

Plots "things" on a map. The map will be served from `{httpRoot}/worldmap`

To use this node you must also place a **websocket out** node onto the workspace
and set the endpoint to

        {httpRoot}/ws/worldmap

The minimum **msg.payload** must contain `name`, `lat` and `lon` properties, e.g.

        {name:"Joe", lat:51, lon:-1.05}

`name` must be a unique identifier across the whole map. Repeated location updates to the same `name` move the point.

Optional properties include

 - **layer** : specify a layer on the map to add marker to.
 - **speed** : combined with bearing, draws a vector.
 - **bearing** : combined with speed, draws a vector.
 - **accuracy** : combined with bearing, draws a polygon of possible direction.
 - **icon** : <a href="http://fortawesome.github.io/Font-Awesome/icons/" target="_new">font awesome</a> icon name.
 - **iconColor** : Standard CSS color name or #rrggbb hex value.
 - **deleted** : set to <i>true</i> to remove the named marker. (default false)

Any other `msg.payload` properties will be added to the icon popup text box.

You may select any of the Font Awesome set of [icons](http://fortawesome.github.io/Font-Awesome/icons/).
However there are several specials...

 - **plane** : a plane icon that aligns with the bearing of travel.
 - **ship** : a ship icon that aligns with the bearing of travel.
 - **car** : a car icon that aligns with the bearing of travel.
 - **friend** : pseudo Nato style blue rectangle.
 - **hostile** : pseudo Nato style red circle.
 - **neutral** : pseudo Nato style green square.
 - **unknown** : pseudo Nato style yellow square.
 - **earthquake** : black circle - diameter proportional to magnitude.

If the payload contains an **area** property - that is an array of co-ordinates, e.g.

    [ [51.05, -0.08], [51.5, -1], [51.2, -0.047] ]

then rather than draw a point and icon it draws the polygon

 - **iconColor** : can set the colour of the polygon
 - **name** : is used as the id key - so can be redrawn/moved
 - **layer** : declares which layer you put it on.

### Drawing

A single right click will allow you to add a point to the map - you must specify the `name` and optionally the `icon` and `layer`.  

Right-clicking on an icon will allow you to delete it.

If you select the **drawing** layer you can also add polylines, polygons and rectangles.

All these events generate messages that can be received by using a **websocket in** node set to the same endpoint. For example:

    add:point,50.98523,-1.40625,joe,spot,test
    del:joe
    add:rectangle,LatLng(50.92944,-1.4502),
        LatLng(50.99172,-1.4502),
        LatLng(50.99172,-1.32729),
        LatLng(50.92944, -1.32729)

### Control

You can also control the map via the websocket, by sending in a msg.payload containing a **command** object.

Optional properties include

 - **lat** - move map to specified latitude.
 - **lon** - move map to specified longitude.
 - **zoom** - move map to specified zoom level (1 - world, 13 to 20 max zoom depending on map).
 - **layer** - set map to specified layer name.
 - **map** - Object containing details of a new map layer:
   - **name** - name of the map layer
   - **url** - url of the map layer
   - **opt** - options object for the new layer

#### For example

To switch layer, move map and zoom

        msg.payload.command =  {layer:"Esri Relief", lat:51, lon:3, zoom:10 };

To add a new layer

        msg.payload.command.map = {
            name:"OSMhot",
            url:'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            opt:JSON.stringify('{ maxZoom: 19, attribution: "&copy; OpenStreetMap"}')
        };

Demo Flow
---------

The following example gets recent earthquakes from USGS, parses the result,
formats up the msg as per above and sends to the websocket to plot on the map.
It also shows how to zoom and move the map or add a new layer.

        [{"id":"f63d823.f09c28","type":"websocket-listener","path":"/ws/worldmap","wholemsg":null},{"id":"6caef267.93510c","type":"inject","name":"","topic":"","payload":"","payloadType":"none","repeat":"","crontab":"","once":false,"x":217,"y":398,"z":"f307b843.0cf848","wires":[["fb7109d5.048ef8"]]},{"id":"fb7109d5.048ef8","type":"function","name":"add new layer","func":"msg.payload = {};\nmsg.payload.command = {};\n\nvar u = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';\nvar o = JSON.stringify({ maxZoom: 19, attribution: '&copy; OpenStreetMap'});\n\nmsg.payload.command.map = {name:\"OSMhot\", url:u, opt:o};\nmsg.payload.command.layer = \"OSMhot\";\n\nreturn msg;","outputs":1,"noerr":0,"x":454,"y":433,"z":"f307b843.0cf848","wires":[["e9c3a4cd.163c58"]]},{"id":"e9c3a4cd.163c58","type":"websocket out","name":"","server":"f63d823.f09c28","client":"","x":753.5,"y":540,"z":"f307b843.0cf848","wires":[]},{"id":"b68e0d77.4971f","type":"function","name":"USGS Quake monitor csv re-parse","func":"msg.payload.lat = msg.payload.latitude;\nmsg.payload.lon = msg.payload.longitude;\nmsg.payload.layer = \"earthquake\";\nmsg.payload.name = msg.payload.id;\nmsg.payload.icon = \"globe\";\nmsg.payload.iconColor = \"orange\";\n\ndelete msg.payload.latitude;\ndelete msg.payload.longitude;\t\nreturn msg;","outputs":1,"noerr":0,"x":416.5,"y":560,"z":"f307b843.0cf848","wires":[["e9c3a4cd.163c58"]]},{"id":"1a0508d4.e5faf7","type":"function","name":"move and zoom","func":"msg.payload = { command:{layer:\"Esri Terrain\",lat:0,lon:0,zoom:3} };\nreturn msg;","outputs":1,"noerr":0,"x":427,"y":476,"z":"f307b843.0cf848","wires":[["e9c3a4cd.163c58"]]},{"id":"8d1dcc2c.72e23","type":"csv","name":"","sep":",","hdrin":true,"hdrout":"","multi":"one","ret":"\\n","temp":"","x":250,"y":500,"z":"f307b843.0cf848","wires":[["b68e0d77.4971f"]]},{"id":"8fbd9df9.70426","type":"inject","name":"","topic":"","payload":"","payloadType":"none","repeat":"","crontab":"","once":false,"x":163,"y":440,"z":"f307b843.0cf848","wires":[["1a0508d4.e5faf7"]]},{"id":"b8f3fe3f.470c","type":"http request","name":"","method":"GET","url":"http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.csv","x":145.5,"y":560,"z":"f307b843.0cf848","wires":[["8d1dcc2c.72e23"]]},{"id":"47e1240c.b81edc","type":"inject","name":"Quakes","topic":"","payload":"","payloadType":"none","repeat":"900","crontab":"","once":false,"x":90,"y":500,"z":"f307b843.0cf848","wires":[["b8f3fe3f.470c"]]},{"id":"784ff2e9.87b00c","type":"worldmap","name":"","x":798,"y":499,"z":"f307b843.0cf848","wires":[]}]


Car icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>.</div>
