### Change Log for Node-RED Worldmap

 - v1.3.5 - parse numeric inputs (speed, bearing etc) to remove any extra text.
 - v1.3.4 - Add ISS icon
 - v1.3.3 - Bugfix for inline satellite icon
 - v1.3.2 - Bugfix for inline svg icons
 - v1.3.1 - Allow `msg.payload.popup = true` to auto open the info popup.
 - v1.3.0 - Add initial 3D page (worldmap/index3d.html), Add ability to add KML, GPX and TOPOJSON overlay layers and optional zoom to fit. Change all http: links to https:
 - v1.2.4 - Let weblink also specify target page. eg `msg.payload.weblink = {name:"BBC News", url:"news.bbc.co.uk", target:"_new"}`
 - v1.2.3 - Add higher maxZoom values for some layers
 - v1.2.2 - Re-fix simultaneous command plus payload
 - v1.2.1 - Sort out map initialisation - especially clusterAt values
 - v1.2.0 - Bump version (should have done it for adding velocity layer). Tidy up deletion of marker and tracks.
 - v1.1.16 - Add Velocity layer - for velocity grid type overlays (eg wind, currents, etc)
 - v1.1.15 - Tidy of Info, Readme and NATO symbol options.
 - v1.1.14 - Add proper NATO symbology via <a href="https://github.com/spatialillusions/milsymbol" target="mapinfo">milsymbol.js</a>
 - v1.1.13 - Add ability to set a building using a GeoJSON Feature set. {name:"MyTower":building:{...feature sets...}}
 - v1.1.12 - README changes, split out CHANGELOG.md
 - v1.1.11 - fix websocket multiple connections
 - v1.1.9 - add ability to add geoJSON layers
 - v1.1.8 - add videoUrl property to allow mp4 insert in popup
 - v1.1.7 - extend path correctly - Issue #28
 - v1.1.6 - cleanup/remove excess logging
 - v1.1.5 - add ttl property to set expiry time (secs) of individual marker, and let command clear:"layername" delete a complete layer.
 - v1.1.4 - Let layer control be visible or not
 - v1.1.3 - more typos.
 - v1.1.1 - fix adding layer to embedded map in iframe
 - v1.1.0 - Move to sockjs (smaller than socket.io). Remove layers that are no longer served for free, Issue #24. Remove polygons as well as markers on timeout.
 - v1.0.35 - Try to better center fa-icon and remove black square (Windows) - Issue #25
 - v1.0.34 - Fix for icon not specified
 - v1.0.33 - Add fa-icon without marker
 - v1.0.32 - Add uav icon, update README
 - v1.0.31 - Add arrow and wind icons
 - v1.0.30 - Add ability to send an array of data points or commands. Add overlay map. Allow more drawing options for lines, areas, circles.
 - v1.0.29 - Add, tracks node, Fix websocket on Windows
 - v1.0.28 - Move websocket to specific path, and support satellite node
 - v1.0.26 - Add info on how to use with local WMS server
 - v1.0.24 - Add `.weblink` property to allow links out to other information.
 - v1.0.23 - Add msg.payload.command.heatmap to allow setting of heatmap config.
 - v1.0.22 - Add example how to embed into Node-RED-Dashboard template.
 - v1.0.21 - If you specify range and icon then you get a marker and a range circle, if you just specify range with no icon, you just get a circle, and vice versa.
 - v1.0.20 - Add buildings overlay.
 - v1.0.19 - Add circle mode - specify name, lat, lon and radius.
 - v1.0.18 - Correct .photourl property to match .photoUrl as per docs
 - v1.0.17 - Removed Mapquest maps. Bug fixes - reduced leakage of listeners being added.
 - v1.0.12 - Added ability to set initial start position, zoom level and base map layer.
 - v1.0.x - now uses socket.io to connect to backend - means this node now has an input connection
 (like "proper" nodes should :-), and you no longer need a websocket node in parallel.
 Obviously this is a breaking change hence the major version number bump. Also thus adds a `worldmap in`
 node to handle events coming from the map interaction.
