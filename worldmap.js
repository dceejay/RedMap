/* eslint-disable no-inner-declarations */

module.exports = function(RED) {
    "use strict";
    var fs = require('fs');
    var path = require("path");
    var express = require("express");
    var compression = require("compression");
    var sockjs = require('sockjs');
    var sockets = {};
    RED.log.info("Worldmap version " + require('./package.json').version );
    // add the cgi module for serving local maps.... only if mapserv exists
    if (fs.existsSync((__dirname + '/mapserv'))) {
        RED.httpNode.use("/cgi-bin/mapserv", require('cgi')(__dirname + '/mapserv'));
    }
    var pmtiles;
    var pmtilesopts;
    try {
        pmtiles = fs.readdirSync(__dirname + '/worldmap').filter(fn => fn.endsWith('.pmtiles'));
        pmtiles.forEach(file => { fs.unlinkSync(__dirname + '/worldmap/'+file); })
        pmtiles = fs.readdirSync(RED.settings.userDir).filter(fn => fn.endsWith('.pmtiles'));
        pmtilesopts = fs.readFileSync(RED.settings.userDir+'/pmtiles.opts');
        pmtilesopts = JSON.parse(pmtilesopts);
    }
    catch(e) {};

    function worldMap(node, n) {
        var allPoints = {};
        RED.nodes.createNode(node,n);
        node.lat = n.lat || "";
        node.lon = n.lon || "";
        node.zoom = n.zoom || "";
        node.layer = n.layer || "";
        node.cluster = n.cluster || "";
        node.maxage = n.maxage || "";
        node.showmenu = n.usermenu || "show";
        node.layers = n.layers || "show";
        node.panlock = n.panlock || "false";
        node.zoomlock = n.zoomlock || "false";
        node.panit = n.panit || "false";
        node.hiderightclick = n.hiderightclick || "false";
        node.coords = n.coords || "none";
        node.showgrid = n.showgrid || "false";
        node.showruler = n.showruler || "false";
        node.allowFileDrop = n.allowFileDrop || "false";
        node.path = n.path || "/worldmap";
        node.maplist = n.maplist;
        node.overlist = n.overlist;
        node.mapname = n.mapname || "";
        node.mapurl = n.mapurl || "";
        node.mapopt = n.mapopt || "";
        node.mapwms = n.mapwms || false;
        if (n.maplist === undefined) { node.maplist = "OSMG,OSMC,EsriC,EsriS,UKOS"; }
        if (n.overlist === undefined) { node.overlist = "DR,CO,RA,DN"; }
        try { node.mapopt2 = JSON.parse(node.mapopt); }
        catch(e) { node.mapopt2 = null; }

        if (node.path.charAt(0) != "/") { node.path = "/" + node.path; }
        if (!sockets[node.path]) {
            var libPath = path.posix.join(RED.settings.httpNodeRoot, node.path, 'leaflet', 'sockjs.min.js');
            var sockPath = path.posix.join(RED.settings.httpNodeRoot,node.path,'socket');
            sockets[node.path] = sockjs.createServer({prefix:sockPath, sockjs_url:libPath, log:function(s,e) { return; }});
            sockets[node.path].installHandlers(RED.server);
            sockets[node.path].on('error', function(e) { node.error("Socket Connection Error: "+e.stack); });
        }
        //node.log("Serving "+__dirname+" as "+node.path);
        node.log("started at "+node.path);
        var clients = {};
        RED.httpNode.get("/-worldmap3d-key",  RED.auth.needsPermission('worldmap3d.read'), function(req, res) {
            if (process.env.MAPBOXGL_TOKEN) {
                res.send({key:process.env.MAPBOXGL_TOKEN});
            }
            else {
                node.error("No API key set");
                res.send({key:''})
            }
        });
        RED.httpNode.use(compression());
        RED.httpNode.use(node.path, express.static(__dirname + '/worldmap'));
        // RED.httpNode.use(node.path, express.static(__dirname + '/worldmap', {maxage:3600000}));

        var sendToRest = function(m,id) {
            for (var c in clients) {
                if (clients.hasOwnProperty(c) && c !== id) {
                    // console.log("RESEND",m);
                    clients[c].write(JSON.stringify(m));
                }
            }
        }

        var callback = function(client) {
            if (!client.headers.hasOwnProperty("user-agent")) { client.close(); }
            //client.setMaxListeners(0);
            clients[client.id] = client;
            client.on('data', function(message) {
                message = JSON.parse(message);
                // console.log("ACTION",message.action,client.id,message)
                if (message.action === "connected") {
                    var m = {};
                    var c = {init:true};
                    c.maplist = node.maplist;
                    c.overlist = node.overlist;
                    if (node.layer && node.layer == "Custom") {
                        m.name = node.mapname;
                        m.url = node.mapurl;
                        m.opt = node.mapopt2;
                        if (node.mapwms === true) { m.wms = true; }
                        client.write(JSON.stringify({command:{map:m}}));
                        c.layer = m.name;
                    }
                    else {
                        if (node.layer && node.layer.length > 0) { c.layer = node.layer; }
                    }
                    if (node.lat && node.lat.length > 0) { c.lat = node.lat; }
                    if (node.lon && node.lon.length > 0) { c.lon = node.lon; }
                    if (node.zoom && node.zoom.length > 0) { c.zoom = node.zoom; }
                    if (node.cluster && node.cluster.length > 0) { c.cluster = node.cluster; }
                    if (node.maxage && node.maxage.length > 0) { c.maxage = node.maxage; }
                    c.showmenu = node.showmenu;
                    c.panit = node.panit;
                    c.panlock = node.panlock;
                    c.zoomlock = node.zoomlock;
                    c.showlayers = node.layers;
                    c.grid = {showgrid:node.showgrid};
                    c.ruler = {showruler:node.showruler};
                    c.hiderightclick = node.hiderightclick;
                    c.allowFileDrop = node.allowFileDrop;
                    c.coords = node.coords;
                    if (node.name) { c.toptitle = node.name; }
                    //console.log("INIT",c)
                    client.write(JSON.stringify({command:c}));
                    for (var p=0; p < pmtiles.length; p++) {
                        fs.symlink(RED.settings.userDir+'/'+pmtiles[p], __dirname+'/worldmap/'+pmtiles[p], 'file', (err) => {
                            if (err) {
                                if (err.code !== "EEXIST") { console.log(err); }
                            }
                        })
                        client.write(JSON.stringify({command: {map: {name:pmtiles[p].split('.')[0], pmtiles:pmtiles[p], opt:pmtilesopts }}}));
                        node.log("Added pmtiles file: "+pmtiles[p]);
                    }
                    var o = Object.values(allPoints);
                    o.map(v => delete v.tout);
                    setTimeout(function() { client.write(JSON.stringify(o)) }, 250);
                }
                if (message.action === "draw") {
                    delete message.action;
                    delete message.type;
                    if (message.options) { delete message.options.pane; }
                    allPoints[message.name] = RED.util.cloneMessage(message);
                    sendToRest(message,client.id);
                }
                if (message.action === "point") {
                    delete message.action;
                    sendToRest(message,client.id);
                }
                if (message.action === "move") {
                    delete message.action;
                    delete message.from;
                    sendToRest(message,client.id);
                }
                if (message.action === "delete" || message.action === "drawdelete") {
                    delete allPoints[message.name];
                    sendToRest(message,client.id);
                }
            });
            client.on('close', function() {
                delete clients[client.id];
                node.status({fill:"green",shape:"ring",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
            });
            node.status({fill:"green",shape:"dot",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
        }

        node.on('input', function(msg) {
            if (!msg.hasOwnProperty("payload")) { node.warn("Missing payload"); return; }

            if (msg.payload.hasOwnProperty("command") && msg.payload.command.hasOwnProperty("map") && msg.payload.command.map.hasOwnProperty("pmtiles")) {
                if (msg.payload.command.map.pmtiles.indexOf("http") !== 0) {
                    fs.symlink(msg.payload.command.map.pmtiles, __dirname+'/worldmap/'+msg.payload.command.map.name+'.pmtiles', 'file', (err) => {
                        if (err) {
                            if (err.code !== "EEXIST") { node.log("PMTiles "+err.code,msg); }
                        }
                    });
                    msg.payload.command.map.pmtiles = msg.payload.command.map.name+'.pmtiles';
                }
            }
            if (msg.hasOwnProperty("_sessionid")) {
                if (clients.hasOwnProperty(msg._sessionid)) {
                    clients[msg._sessionid].write(JSON.stringify(msg.payload));
                }
            }
            else {
                for (var c in clients) {
                    if (clients.hasOwnProperty(c)) {
                        clients[c].write(JSON.stringify(msg.payload));
                    }
                }
            }
            if (msg.payload.hasOwnProperty("name") && !msg.hasOwnProperty("_sessionid")) {
                allPoints[msg.payload.name] = RED.util.cloneMessage(msg.payload);
                var t = node.maxage || 3600;
                if (msg.payload.ttl && msg.payload.ttl < t) { t = msg.payload.ttl; }
                allPoints[msg.payload.name].tout = setTimeout( function() { delete allPoints[msg.payload.name] }, t * 1000 );
            }
            if (msg?.payload?.command?.map?.delete) {
                var ddd = msg.payload.command.map.delete;
                if (!Array.isArray(ddd)) { ddd = [cmd.map.delete]; }
                for (let a=0; a < ddd.length; a++) {
                    for (let p in allPoints) {
                        if (allPoints.hasOwnProperty(p)) {
                            if (allPoints[p].layer === ddd[a]) {
                                delete allPoints[p];
                            }
                        }
                    }
                }
            }
        });

        node.on("close", function() {
            for (var c in clients) {
                if (clients.hasOwnProperty(c)) {
                    clients[c].end();
                }
            }
            clients = {};
            sockets[node.path].removeListener('connection', callback);
            for (var i=0; i < RED.httpNode._router.stack.length; i++) {
                var r = RED.httpNode._router.stack[i];
                if ((r.name === "serveStatic") && (r.regexp.test(node.path))) {
                    RED.httpNode._router.stack.splice(i, 1)
                }
            }
            node.status({});
        });

        sockets[node.path].on('connection', callback);
    }
    var WorldMap = function(n) {
        worldMap(this, n);
    }
    RED.nodes.registerType("worldmap",WorldMap);

    function HTML(ui, config) {
        var width = config.width;
        if (width == 0) {
            var group = RED.nodes.getNode(config.group);
            if (group) { width = group.config.width; }
        }
        var height = config.height;
        if (height == 0) { height = 10; }
        var size = ui.getSizes();
        var frameWidth = (size.sx + size.cx) * width - size.cx;
        var frameHeight = (size.sy + size.cy) * height - size.cy + 40;
        var url = encodeURI(path.posix.join(RED.settings.httpNodeRoot||RED.settings.httpRoot,config.path));
        if (config.layer === "MB3d") { url += "/index3d.html"; }
        var html = `<style>.nr-dashboard-ui_worldmap{padding:0;}</style><div style="overflow:hidden;">
<iframe src="${url}" width="${frameWidth}px" height="${frameHeight}px" style="border:none;"></iframe></div>`;
        return html;
    }

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error("no group");
            return false;
        }
        return true;
    }

    var ui = undefined;
    try {
        ui = RED.require("node-red-dashboard")(RED);
    }
    catch(e) {
        RED.log.info("Node-RED Dashboard not found - ui_worldmap not installed.");
    }
    setTimeout( function() {
        if (ui) {
            function UIWorldMap(config) {
                try {
                    var node = this;
                    worldMap(node, config);
                    var done = null;
                    if (checkConfig(node, config)) {
                        var html = HTML(ui, config);
                        done = ui.addWidget({
                            node: node,
                            order: config.order,
                            group: config.group,
                            width: config.width,
                            height: config.height,
                            format: html,
                            templateScope: "local",
                            emitOnlyNewValues: false,
                            forwardInputMessages: false,
                            storeFrontEndInputAsState: false,
                            convertBack: function (value) {
                                return value;
                            },
                            beforeEmit: function(msg, value) {
                                return { msg: { items: value } };
                            },
                            beforeSend: function (msg, orig) {
                                if (orig) { return orig.msg; }
                            },
                            initController: function($scope, events) {
                            }
                        });
                    }
                }
                catch (e) {
                    console.log(e);
                }
                node.on("close", function() {
                    if (done) { done(); }
                });
            }
            setImmediate(function() { RED.nodes.registerType("ui_worldmap", UIWorldMap) });
        }
    }, 100);


    var WorldMapIn = function(n) {
        RED.nodes.createNode(this,n);
        this.path = n.path || "/worldmap";
        this.events = n.events || "connect,disconnect,point,layer,bounds,files,draw,other";
        if (this.path.charAt(0) != "/") { this.path = "/" + this.path; }
        if (!sockets[this.path]) {
            var libPath = path.posix.join(RED.settings.httpNodeRoot, this.path, 'leaflet', 'sockjs.min.js');
            var sockPath = path.posix.join(RED.settings.httpNodeRoot,this.path,'socket');
            sockets[this.path] = sockjs.createServer({prefix:sockPath, sockjs_url:libPath, log:function() { return; }});
            sockets[this.path].installHandlers(RED.server);
        }
        var node = this;
        var clients = {};

        var callback = function(client) {
            //client.setMaxListeners(0);
            clients[client.id] = client;
            //get ip of user connected to the _sessionid, check to see if its proxied first
            var sessionip = client.headers['x-real-ip'] || client.headers['x-forwarded-for'] || client.remoteAddress;
            node.status({fill:"green",shape:"dot",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
            client.on('data', function(message) {
                message = JSON.parse(message);
                if (message.hasOwnProperty("action")) {
                    if ((node.events.indexOf("connect")!==-1) && (message.action === "connected")) {
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip, _clientheaders:client.headers})});
                    }
                    if ((node.events.indexOf("bounds")!==-1) && (message.action === "bounds")) {
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip})});
                    }
                    if ((node.events.indexOf("point")!==-1) && ((message.action === "point")||(message.action === "move")||(message.action === "delete") ))  {
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip})});
                    }
                    if ((node.events.indexOf("layer")!==-1) && (message.action.indexOf("layer") !== -1) )  {
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip})});
                    }
                    if ((node.events.indexOf("files")!==-1) && (message.action === "file"))  {
                        message.content =  Buffer.from(message.content.split('base64,')[1], 'base64');
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip})});
                    }
                    if ((node.events.indexOf("draw")!==-1) && ((message.action === "draw")||(message.action === "drawdelete")))  {
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip})});
                    }
                    if (node.events.indexOf("other")!==-1 && "connected,point,addlayer,dellayer,delete,move,draw,drawdelete,files,bounds".indexOf(message.action) === -1) {
                        setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip})});
                    }
                }
            });
            client.on('close', function() {
                delete clients[client.id];
                node.status({fill:"green",shape:"ring",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
                if (node.events.indexOf("disconnect")!==-1) {
                    node.send({payload:{action:"disconnect", clients:Object.keys(clients).length}, topic:node.path.substr(1), _sessionid:client.id, _sessionip:sessionip});
                }
            });
        }

        node.on("close", function() {
            for (var c in clients) {
                if (clients.hasOwnProperty(c)) {
                    clients[c].end();
                }
            }
            clients = {};
            sockets[this.path].removeListener('connection', callback);
            node.status({});
        });
        sockets[this.path].on('connection', callback);
    }
    RED.nodes.registerType("worldmap in",WorldMapIn);


    var WorldMapTracks = function(n) {
        RED.nodes.createNode(this,n);
        this.depth = parseInt(Number(n.depth) || 20);
        this.pointsarray = {};
        this.layer = n.layer || "combined"; // separate, single
        this.smooth = n.smooth || false;
        var node = this;
        var bezierSpline = require("@turf/bezier-spline").default;

        var doTrack = function(msg) {
            if (msg.hasOwnProperty("payload") && msg.payload.hasOwnProperty("name")) {
                var newmsg = RED.util.cloneMessage(msg);
                if (msg.payload.deleted) {
                    if (msg.payload.name.substr(-1) === '_') {
                        var a = node.pointsarray[msg.payload.name.substr(0,msg.payload.name.length-1)].pop();
                        node.pointsarray[msg.payload.name.substr(0,msg.payload.name.length-1)] = [ a ];
                        node.send(newmsg);
                    }
                    else {
                        delete node.pointsarray[msg.payload.name];
                    }
                    //newmsg.payload.name = msg.payload.name + "_";
                    node.send(newmsg);
                    return;
                }
                if (!msg.payload.hasOwnProperty("lat") || !msg.payload.hasOwnProperty("lon")) { return; }
                if (!node.pointsarray.hasOwnProperty(msg.payload.name)) {
                    node.pointsarray[msg.payload.name] = [];
                }
                if (msg.payload.hasOwnProperty("trackpoints") && !isNaN(parseInt(msg.payload.trackpoints)) ) {
                    var tl = parseInt(msg.payload.trackpoints);
                    if (tl < 0) { tl = 0; }
                    if (node.pointsarray[msg.payload.name].length > tl) {
                        node.pointsarray[msg.payload.name] = node.pointsarray[msg.payload.name].slice(-tl);
                    }
                    node.depth = tl;
                }
                if (node.depth < 2) { return; } // if set less than 2 then don't bother.

                var still = false;
                if (node.pointsarray[msg.payload.name].length > 0) {
                    var oldlat = node.pointsarray[msg.payload.name][node.pointsarray[msg.payload.name].length-1].lat;
                    var oldlon = node.pointsarray[msg.payload.name][node.pointsarray[msg.payload.name].length-1].lon;
                    if (msg.payload.lat === oldlat && msg.payload.lon === oldlon) { still = true; }
                }
                if (!still) { node.pointsarray[msg.payload.name].push(msg.payload);
                    if (node.pointsarray[msg.payload.name].length > node.depth) {
                        node.pointsarray[msg.payload.name].shift();
                    }
                }
                var line = [];
                for (var i=0; i<node.pointsarray[msg.payload.name].length; i++) {
                    var m = node.pointsarray[msg.payload.name][i];
                    if (m.hasOwnProperty("lat") && m.hasOwnProperty("lon")) {
                        line.push( [m.lat*1, m.lon*1] );
                        delete newmsg.payload.lat;
                        delete newmsg.payload.lon;
                    }
                    if (m.hasOwnProperty("latitude") && m.hasOwnProperty("longitude")) {
                        line.push( [m.latitude*1, m.longitude*1] );
                        delete newmsg.payload.latitude;
                        delete newmsg.payload.longitude;
                    }
                    if (m.hasOwnProperty("position") && m.position.hasOwnProperty("lat") && m.position.hasOwnProperty("lon")) {
                        line.push( [m.position.lat*1, m.position.lon*1] );
                        delete newmsg.payload.position;
                    }
                }
                if (line.length > 1) { // only send track if two points or more
                    if (node.smooth) {
                        var curved = bezierSpline({"type":"Feature", "properties":{}, "geometry":{"type":"LineString", "coordinates":line }});
                        newmsg.payload.line = curved.geometry.coordinates;
                    }
                    else {
                        newmsg.payload.line = line;
                    }
                    newmsg.payload.name = msg.payload.name + "_";
                    if (node.layer === "separate") {
                        newmsg.payload.layer = msg.payload.layer + " tracks";
                        if (newmsg.payload.layer.indexOf('_') === 0) {
                            newmsg.payload.layer = newmsg.payload.layer.substr(1);
                        }
                    }
                    if (node.layer === "single") {
                        newmsg.payload.layer = "Tracks";
                    }
                    node.send(newmsg);  // send the track
                }
            }
            if (msg?.payload?.command?.map?.delete) {
                var ddd = msg.payload.command.map.delete;
                if (!Array.isArray(ddd)) { ddd = [cmd.map.delete]; }
                for (let a=0; a < ddd.length; a++) {
                    for (let p in node.pointsarray) {
                        if (node.pointsarray.hasOwnProperty(p)) {
                            if (node.pointsarray[p][0].layer === ddd[a]) {
                                delete node.pointsarray[p];
                            }
                        }
                    }
                }
            }
            if (msg?.payload?.command?.clear) {
                for (let p in node.pointsarray) {
                    if (node.pointsarray.hasOwnProperty(p)) {
                        if (node.pointsarray[p][0].layer === msg.payload.command.clear) {
                            delete node.pointsarray[p];
                        }
                    }
                }
            }
        }

        node.on("input", function(m) {
            if (Array.isArray(m.payload)) {
                m.payload.forEach(function (pay) {
                    var n = RED.util.cloneMessage(m)
                    n.payload = pay;
                    doTrack(n);
                });
            }
            else {
                doTrack(m);
            }
        });

        node.on("close", function() {
            node.pointsarray = {};
        });
    }
    RED.nodes.registerType("worldmap-tracks",WorldMapTracks);


    var WorldMapHull = function(n) {
        RED.nodes.createNode(this,n);
        this.prop = n.prop || "layer";
        var node = this;
        node.oldlayercount = {};
        node.hulls = {};

        var convexHull = function(points) {
            var arr = [];
            for (const val of Object.values(points)) {
                arr.push(val);
            }

            arr.sort(function (a, b) {
                return a.lat != b.lat ? a.lat - b.lat : a.lon - b.lon;
            });

            var n = arr.length;
            var hull = [];

            for (var i = 0; i < 2 * n; i++) {
                var j = i < n ? i : 2 * n - 1 - i;
                while (hull.length >= 2 && removeMiddle(hull[hull.length - 2], hull[hull.length - 1], arr[j]))
                    hull.pop();
                hull.push(arr[j]);
            }

            hull.pop();
            return hull;
        }

        var removeMiddle = function(a, b, c) {
            var cross = (a.lat- b.lat) * (c.lon - b.lon) - (a.lon - b.lon) * (c.lat- b.lat);
            var dot = (a.lat- b.lat) * (c.lat- b.lat) + (a.lon - b.lon) * (c.lon - b.lon);
            return cross < 0 || cross == 0 && dot <= 0;
        }

        var doHull = function(msg) {
            if (msg.hasOwnProperty("payload") && msg.payload.hasOwnProperty("name")) {
                var newmsg = RED.util.cloneMessage(msg);
                newmsg.payload = {};
                newmsg.payload[node.prop] = msg.payload[node.prop] || "unknown";
                if (msg.payload.deleted === true) {
                    if (node.hulls.hasOwnProperty(newmsg.payload[node.prop])) {
                        delete node.hulls[newmsg.payload[node.prop]][msg.payload.name];
                    }
                }
                else {
                    if (!msg.payload.hasOwnProperty("lat") || !msg.payload.hasOwnProperty("lon")) { return; }
                    if (!node.hulls.hasOwnProperty(newmsg.payload[node.prop])) {
                        node.hulls[newmsg.payload[node.prop]] = {};
                    }
                    node.hulls[newmsg.payload[node.prop]][msg.payload.name] = {lat:msg.payload.lat,lon:msg.payload.lon};
                }
                var convexHullPoints = convexHull(node.hulls[newmsg.payload[node.prop]]);
                var leafletHull = convexHullPoints.map(function (element) {return ([element.lat,element.lon])})

                newmsg.payload.name = newmsg.payload[node.prop];
                newmsg.payload.clickable = true;

                if (msg.payload.fillColor) {
                    newmsg.payload.color = msg.payload.fillColor;
                    newmsg.payload.fillColor = msg.payload.fillColor;
                }

                if (node.oldlayercount[newmsg.payload[node.prop]] === undefined) {
                    node.oldlayercount[newmsg.payload[node.prop]] = 0;
                }
                var oldl = node.oldlayercount[newmsg.payload[node.prop]];

                if (leafletHull.length === 1 && oldl === 2) {
                    newmsg.payload.deleted = true;
                    node.send(newmsg);
                }
                if (leafletHull.length === 2 && (oldl === 1 || oldl === 3)) {
                    var newmsg2 = RED.util.cloneMessage(newmsg);
                    newmsg2.payload.deleted = true;
                    node.send(newmsg2);
                    newmsg.payload.line = leafletHull;
                    node.send(newmsg);
                }
                if (leafletHull.length === 3 && oldl === 2) {
                    var newmsg3 = RED.util.cloneMessage(newmsg);
                    newmsg3.payload.deleted = true;
                    node.send(newmsg3);
                }
                if (leafletHull.length >= 3) {
                    newmsg.payload.area = leafletHull;
                    node.send(newmsg);
                }

                node.oldlayercount[newmsg.payload[node.prop]] = leafletHull.length;
            }
        }

        node.on("input", function(m) {
            if (Array.isArray(m.payload)) {
                m.payload.forEach(function (pay) {
                    var n = RED.util.cloneMessage(m)
                    n.payload = pay;
                    doHull(n);
                });
            }
            else {
                doHull(m);
            }
        });

        node.on("close", function() {
            node.hulls = {};
        });
    }
    RED.nodes.registerType("worldmap-hull",WorldMapHull);

    RED.httpAdmin.get("/-ui-worldmap",  RED.auth.needsPermission('rpi-ui-worldmap.read'), function(req, res) {
        res.send(ui ? "true": "false");
    });
}
