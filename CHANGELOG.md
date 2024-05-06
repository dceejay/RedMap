### Change Log for Node-RED Worldmap

 - v4.8.0 - Merged PR for feedback functioanlity cleanup and example. PR #271 and #272
 - v4.7.0 - Update pmtiles library, fix feedback function inconsistency. Issue #270
 - v4.6.5 - Let geojson allow for generic overrides with .icon and .layer.
 - v4.6.4 - Fix deletion of layers logic to actually fully remove points.
 - v4.6.3 - Fix sending of layer events when not wanted. Issue #262
 - v4.6.2 - Fix multiple use of contextmenu feedback. Issue #259
 - v4.6.1 - let default pmtiles be light/dark or monocolored.
 - v4.5.2 - Tidy up when pmtiles removed.
 - v4.5.0 - Fix pmtiles to look for maps in userdir rather than modules.
 - v4.4.0 - Add quad(copter) drone icon.
 - v4.3.3 - Fix for objects changing layers.
 - v4.3.2 - Fix geojson popup missing label name.
 - v4.3.1 - Small fix to icon transparency, and routing detail.
 - v4.3.0 - Add support for PMtiles files.
 - v4.2.1 - Revert use of optional chaining to extend life slightly. Issue #252
 - v4.2.0 - Let icons also be inline images data:image... 
 - v4.1.0 - Add optional SOG, COG, altft, altm input properties.
 - v4.0.0 - Breaking - Better context menu variable substitution and retention
            Now uses ${name} syntax rather than $name so we can handle user defined variables in context menus.
            
 - v3.2.0 - Sync up drawing sessions across browsers to same map
 - v3.1.0 - Add esri overlay layers, and let geojson overlay rendering be customised
 - v3.0.0 - Bump to Leaflet 1.9.4
            Move to geoman for drawing shapes.
            Allow command.rotation to set rotation of map.
            Allow editing of multipoint geojson tracks.

 - v2.43.1 - Tweak drawing layer double click
 - v2.43.0 - Revert leaflet update as it broke Draw
 - v2.42.3 - More KML and GeoJson drag drop fixes
 - v2.42.1 - Remove extraneous debug logging, fix KMZ icons
 - v2.42.0 - Add handling for TAK type spots, waypoints, alerts, sensors. Better KML/KMZ handling.
 - v2.41.0 - Bump leaflet libs to latest stable (1.9.4)
 - v2.40.1 - Fix missing countries overlay when starting disconnected.
 - v2.40.0 - Add handling for TAK event points from TAK ingest node.
 - v2.39.0 - Add client timezone to connect message. PR #245
 - v2.38.3 - Better fix for geojson multipoint icons.
 - v2.38.1 - Fix for geojson multipoint icons.
 - v2.38.0 - Return client headers as part of connect message.
 - v2.37.4 - Fix sessionid specific data not to be sent on reload/refresh
 - v2.37.3 - Fix hang on layer change
 - v2.37.2 - If custom layer is only layer then show it automatically. Issue #230
 - v2.37.1 - Warn (and drop) messages that are missing a payload. Issue #229
 - v2.37.0 - Allow fly instead of fit option when using command to move view window. (PR #225)
 - v2.36.0 - Add edge icons for SIDC markers just off the map.
 - v2.35.0 - Let clickable:false work for markers as well.
 - v2.34.0 - Let icon "url" be a local fixed path. PR #223
 - v2.33.0 - Let shapes create click event. from PR #221
             Fix heatmap delete point bug. Issue #222
 - v2.32.3 - Fix map split in iframe position
 - v2.32.1 - Let command.heatmap replace complete heatmap array.
 - v2.32.0 - Change || to nullish operator ?? to fix numerous dodgy assignments. Issue #219
             Delete marker now also removes from heatmap layer. Issue #218

 - v2.31.3 - Undo previous fix as while more technically correct - doesn't look so good. Issue #217
 - v2.31.2 - Fix more antimeridian crossing wrinkles. Issue #216
 - v2.31.1 - Fix missing type property for drawings, and pass back feedback value. Add route distance. Issue #213, Issue #212, PR #215
 - v2.31.0 - Better handling of KML files. Issue #211

 - v2.30.3 - Fix for iframe height. Issue #210
 - v2.30.2 - Fix for bad handling of mapbox id. Issue #208
 - v2.30.1 - Don't resend bounds if not changed. Issue #209
 - v2.30.0 - Add show/hide ruler option. PR #206

 - v2.29.0 - Change locate to be a toggle and add command (trackme) to set style. Issue #202

 - v2.28.3 - Let button declaration be an array
 - v2.28.1 - Fix layer command bug for non-core layers. Issue #195
 - v2.28.0 - Better Handling of sidc icons in geojson

 - v2.27.3 - Try to handle greatcircles crossing antimeridian
 - v2.27.1 - Reload existing markers for late joiners

 - v2.26.1 - Add QTH/Maidenhead option also
 - v2.26.0 - Add UTM and MGRS to coordinate display options.

 - v2.25.0 - Add bounds command to set overall map bounds.

 - v2.24.3 - Fix geojson incorrect fill.
 - v2.24.2 - Changes to drawing colours to be more visible.
 - v2.24.1 - Fix ellipse accuracy.
 - v2.24.0 - Add greatcircle option, fix non default httpRoot. Issue #193

 - v2.23.5 - Fix addtoheatmap. Issue #192
 - v2.23.4 - Fix opacity of area borders
 - v2.23.3 - Fix initial load of maps
 - v2.23.2 - Add convex-hull example
 - v2.23.1 - Fix saving of custom map layer
 - v2.23.0 - Give logo an id so it can be overridden by toplogo command. PR #188.

 - v2.22.3 - Don't show empty popup for geojson object. Issue #186. Add wobble to null island.
 - v2.22.2 - Be more tolerant of speed string types
 - v2.22.0 - Separate out layer events in worldmap in

 - v2.21.9 - Unbreak Drawing layer that I must have broken recently
 - v2.21.8 - Let SIDC/icon short code be only 4 chars long
 - v2.21.5 - Fix handling of "old" ship nav to ship navigation
 - v2.21.4 - Fix speed leader length. Add transparentPixels option.
 - v2.21.3 - Add zoom to bounds action. Adjust map layers max zoom levels.
 - v2.21.2 - Expand ship nav to ship navigation.
 - v2.21.1 - Fix ui check callback to not use .
 - v2.21.0 - Let config panel select maps to show, default map and choice of overlays.

 - v2.20.0 - Add support of .pbf map layers. Issue #123.

 - v2.19.0 - Bump leaflet to latest. v1.7

 - v2.18.1 - Let fillOpacity be 0.
 - v2.18.0 - Add bounds event onzoom or drag.

 - v2.17.3 - Yet more better feedback on clicks, moves.
 - v2.17.2 - Add smallplane icon.
 - v2.17.1 - More complete feedback on click, better popup image sizing.

 - v2.16.3 - Ensure polygons can be deleted.
 - v2.16.2 - Better handling of unpacked kmz objects.
 - v2.16.0 - Allow specifying custom base map server.

 - v2.15.8 - Adjust ui check timing for UI worldmap.
 - v2.15.7 - Tidy up geoJson handling a bit more.
 - v2.15.5 - Fix SIDC icons to accept unicoded icons as labels.
 - v2.15.4 - Let clear heatmap command do what it says.
 - v2.15.3 - Fix panit command to work, try to use alt units, popup alignments.
 - v2.15.0 - Let speed be text and specify units if required (kt,kn,knots,mph,kmh,kph) default m/s.

 - v2.14.0 - Let geojson features be clickable if added as overlay.

 - v2.13.4 - Fix list of map choices to be in sync. Fix popup auto sizing.
 - v2.13.3 - Fix unchanged layer propagation.
 - v2.13.2 - Add mayflower icon.
 - v2.13.0 - Tidy velocity layer. Feedback any url parameters.

 - v2.12.1 - Only show online layer options if we are online.
 - v2.12.0 - Add live rainfall radar data layer. Remove some non-loading overlays.

 - v2.11.2 - Allow thicknesss of arc to be specified by weight
 - v2.11.1 - Better handle KML point info - add popup.
 - v2.11.0 - Add option to smooth tracks using bezier curves.

 - v2.10.0 - Save latest position to browser for refresh if in iframe/dashboard. Allow fractional Zoom levels.

 - v2.9.0 - Let weblinks be an array of links. Add more info to readme about Mapservers.

 - v2.8.9 - Only load cgi module if we have a local mapserv file
 - v2.8.8 - Change length of speed leader to show where you will be in 1 min if speed in m/s
 - v2.8.7 - Delay start of ui widget.
 - v2.8.6 - Better checking of type property before guessing it's geojson. Issue #153
 - v2.8.4 - Add addToForm(n,v) option and $form - to make contextmenu form submission easier.
 - v2.8.3 - Let feedback include lat lon for context menu on general map.
 - v2.8.2 - Improve direction handling of 3d objects.
 - v2.8.1 - Fix old tracks re-appearing afer hide/show. Issue #135
 - v2.8.0 - Align vector with `track`, prioritise hdg and heading over bearing. Add old location to move action.

 - v2.7.1 - Also allow geojson files to be dropped, and better png handling
 - v2.7.0 - Allow track and image files to be dragged onto the map, if enabled

 - v2.6.1 - Better fit for worldmap when in ui_template
 - v2.6.0 - Add route capability to draw line when online

 - v2.5.9 - Fix handling of multiple hulls, tidy contextmenu handling
 - v2.5.8 - Let node name be the full page map title
 - v2.5.7 - Let fillColor set color of hulls
 - v2.5.6 - Let node accept plain text payload kml or nvg input
 - v2.5.5 - Fix NVG import to handle symbols for points
 - v2.5.4 - Fix delete of hulls
 - v2.5.3 - Swap default satellite layer
 - v2.5.2 - Add boolean parameter to feedback call to allow auto close of popup on click. Set Esc key to close all open popups. Issue #146
 - v2.5.1 - Add lat, lng and layer to feedback function.
 - v2.5.0 - Add minimap capability.

 - v2.4.2 - Fix editing injected shapes.
 - v2.4.1 - Add convex-hull node for grouping objects.

 - v2.3.16 - Add heading to default addMarker, allow custom http icon size.
 - v2.3.13 - Fix geoson feature properties fill color, and better marker handling
 - v2.3.11 - Better editing of drawing layer, add OpenTopoMap, and better Esri satellite
 - v2.3.10 - Improve geojson layer and name handling.
 - v2.3.8 - Fix fa-marker offset to improve accuracy.
 - v2.3.7 - Show icon within circle if icon present. Issue #128
 - v2.3.6 - Show ruler if grid is turned on.
 - v2.3.5 - Let tracks node handle array of points. Let http icons be rotated to hdg or bearing.
 - v2.3.4 - Add aligning bus icon
 - v2.3.3 - Fix satellite view max zoom
 - v2.3.2 - Add better geojson support - name plus geojson properties
 - v2.3.1 - Stop adding point when you add a circle
 - v2.3.0 - Add colour options for drawing layer

 - v2.2.1 - Better implementation of legend create/show/hide
 - v2.2.0 - Add range rings and arcs function

 - v2.1.6 - Add legend command to allow inserting an html legend
 - v2.1.5 - Fix squawk icon color handling
 - v2.1.4 - Fix alt and speed as strings
 - v2.1.3 - Fix web page file path error
 - v2.1.2 - Fix layercontrol remove bug. Issue #116
 - v2.1.1 - Fix bug in repeated add with polygon
 - v2.1.0 - Add ui-worldmap node to make embedding in Dashboard easier. Let -in node specify connection actions only.

 - v2.0.22 - fix SIDC missing property
 - v2.0.21 - allow adding overlays without making them visible (visible:false). Issue #108
 - v2.0.20 - ensure `fit` option is boolean, Issue #109. Fix track layers, Issue #110.
 - v2.0.18 - Stop map contextmenu bleedthrough to marker. Add compress middleware.
 - v2.0.17 - Let clear command also clear tracks from tracks node
 - v2.0.16 - Revert use of ES6 import. Keep IE11 happy for while
 - v2.0.13 - Fix tracks colour
 - v2.0.12 - Ensure default icon is in place if not specified (regression)
 - v2.0.9 - Only update maxage on screen once it exists
 - v2.0.8 - Drop beta flag, re-organise index, js and css files. Now using leaflet 1.4
 - v2.0.7-beta - Switch Ruler control to be independent of Draw library.
 - v2.0.6-beta - Re-enable editing of draw layer, add rectangles to lines and areas. Make individual objects editable.
 - v2.0.5-beta - Fix clustering on zoom (update old library)
 - v2.0.4-beta - Add helicopter icon. Correct Leaflet.Coordinates file name. Fix right contextmenu.
 - v2.0.3-beta - Let circles have popups. Better drawing of ellipses
 - v2.0.2-beta - Let lines and areas also have popups
 - v2.0.1-beta - Add optional graticule.
 - v2.0.0-beta - Move to leaflet 1.4.x plus all plugins updated

 - v1.5.40 - Only enable on.location function when not in an iframe. Issue #89. Tidy html.
 - v1.5.39 - Add weather-lite icons
 - v1.5.38 - Add Esri dark grey and ocean, re-add hikebike, layers
 - v1.5.37 - Add .trackpoints to override default number in tracks node. Let tracks optionally be on different layers. Fix marker changing layers Issue #85
 - v1.5.36 - Fix contextmenu $name substitution
 - v1.5.35 - Add msp.delete command to remove any layers not needed at start (array of names). Issue #83.
 - v1.5.34 - Add command.contextmenu to set non-marker context menu (defaults to add marker).
 - v1.5.33 - Let blank input disable contextmenu completely. Tidy up help, update dialog polyfill.
 - v1.5.32 - Add .contextmenu custom right click menu Issue #73, Fix map lock, Close websocket on unload
 - v1.5.31 - Fix pan first at start, and coords overlay. Issues #81 and #82
 - v1.5.30 - Add tooltip option, ability to remove base layer, search on icon, show mouse pointer co-ordinates
 - v1.5.29 - remove lat/lon from popup if using .popup property. Allow icon to be loaded from http.
 - v1.5.28 - Tidy up popup location and timing. Auto add countries overlay if no internet.
 - v1.5.27 - Add hide right click option to config panel
 - v1.5.26 - Ensure all map tiles loaded over https
 - v1.5.25 - Add button command to allow user to add and remove buttons
 - v1.5.24 - ensure hiderightclick does do that, and popup always has close button. Issue #69, #70
 - v1.5.23 - Let icon support use of emoji specified as :emoji name:
 - v1.5.22 - Slight adjust to label positions for default map marker icon. Add .lineColor for bearing lines
 - v1.5.21 - Add .label option to display permanent label. Clean up some excess debug logging
 - v1.5.20 - Let worldmap in node send message after out node has initialised
 - v1.5.19 - Fix map path label
 - v1.5.18 - Update Leaflet.vector-markers to 0.0.6 (https://github.com/hiasinho/Leaflet.vector-markers)
 - v1.5.17 - Allow setting maxage to 0 (infinite) correctly - Issue #64
 - v1.5.16 - Allow setting panlock, zoomlock and hiderightclick via commands - Issue #60
 - v1.5.15 - Allow setting clusterAt to 0 to fully disable it - Issue #61
 - v1.5.14 - Stop delete marker feedback to allow updating multiple maps - Issue #59
 - v1.5.13 - Send click message to websocket on marker click - Issue #56, #57
 - v1.5.11 - Let search also try geocoding lookup if not found in marks.
 - v1.5.10 - Allow latest mark added to open popup, and allow `popped=false` to close.
 - v1.5.7 - Tidy up sidc entry, and drag-ability of nodes on drawing layer.
 - v1.5.6 - Add search command and clear search functionality.
 - v1.5.5 - Allow multiple overlays to be enabled at once - Issue #53
 - v1.5.4 - Allow remote update of the split position via `msg.command.split`
 - v1.5.3 - Add side by side mode (via `msg.command` only).
 - v1.5.2 - Make manually added icons moveable by default.
 - v1.5.0 - Add multi-map capability - can now have multiple map endpoints. Issue #40 PR #51
   - Also add built-in world countries overlay layer for offline use.
 - v1.4.6 - allow more variation in fa-icon modifiers, so fa-3x and fa-spin work.
 - v1.4.5 - fix clearing overlays
 - v1.4.4 - add a couple of extra overlay layers, roads, rail, sea
 - v1.4.3 - support custom icon for GPX and KML. Better readme for geojson.
 - v1.4.2 - add NVG layer capability
 - v1.4.1 - let `msg.payload.popup` set the popup contents.
 - v1.4.0 - only send to specific _ sessionid if specified.
 - v1.3.7 - rescale NATO symbols (less variation, not so small)
 - v1.3.6 - setting `msg.payload.draggable = true` will allow a marker to be moved and create a move event on the input node.
 - v1.3.5 - parse numeric inputs (speed, bearing etc) to remove any extra text.
 - v1.3.4 - Add ISS icon
 - v1.3.3 - Bugfix for inline satellite icon
 - v1.3.2 - Bugfix for inline svg icons
 - v1.3.1 - Allow `msg.payload.popped = true` to auto open the info popup.
 - v1.3.0 - Add initial 3D page (worldmap/index3d.html), Add ability to add KML, GPX and TOPOJSON overlay layers and optional zoom to fit. Change all http: links to https:
 - v1.2.4 - Let weblink also specify target page. eg `msg.payload.weblink = {name:"BBC News", url:"http://news.bbc.co.uk", target:"_new"}`
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
