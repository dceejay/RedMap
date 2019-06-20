/**
 * Copyright 2015, 2019 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var path = require("path");
    var express = require("express");
    var sockjs = require('sockjs');
    var sockets = {};
    RED.log.info("Worldmap version " + require('./package.json').version );
    // add the cgi module for serving local maps....
    RED.httpNode.use("/cgi-bin/mapserv", require('cgi')(__dirname + '/mapserv'));

    var WorldMap = function(n) {
        RED.nodes.createNode(this,n);
        this.lat = n.lat || "";
        this.lon = n.lon || "";
        this.zoom = n.zoom || "";
        this.layer = n.layer || "";
        this.cluster = n.cluster || "";
        this.maxage = n.maxage || "";
        if (n.maxage == 0) { this.maxage = "0"; }
        this.showmenu = n.usermenu || "show";
        this.layers = n.layers || "show";
        this.panlock = n.panlock || "false";
        this.zoomlock = n.zoomlock || "false";
        this.panit = n.panit || "false";
        this.hiderightclick = n.hiderightclick || "false";
        this.coords = n.coords || "none";
        this.showgrid = n.showgrid || "false";
        this.path = n.path || "/worldmap";
        if (this.path.charAt(0) != "/") { this.path = "/" + this.path; }
        if (!sockets[this.path]) {
            var libPath = path.posix.join(RED.settings.httpNodeRoot, this.path, 'leaflet', 'sockjs.min.js');
            var sockPath = path.posix.join(RED.settings.httpNodeRoot,this.path,'socket');
            sockets[this.path] = sockjs.createServer({prefix:sockPath, sockjs_url:libPath, log:function() { return; }});
            sockets[this.path].installHandlers(RED.server);
        }
        //this.log("Serving "+__dirname+" as "+this.path);
        this.log("started at "+this.path);
        var node = this;
        var clients = {};
        RED.httpNode.use(node.path, express.static(__dirname + '/worldmap'));

        var callback = function(client) {
            //client.setMaxListeners(0);
            clients[client.id] = client;
            client.on('data', function(message) {
                message = JSON.parse(message);
                if (message.action === "connected") {
                    var c = {init:true};
                    if (node.lat && node.lat.length > 0) { c.lat = node.lat; }
                    if (node.lon && node.lon.length > 0) { c.lon = node.lon; }
                    if (node.zoom && node.zoom.length > 0) { c.zoom = node.zoom; }
                    if (node.layer && node.layer.length > 0) { c.layer = node.layer; }
                    if (node.cluster && node.cluster.length > 0) { c.cluster = node.cluster; }
                    if (node.maxage && node.maxage.length > 0) { c.maxage = node.maxage; }
                    c.showmenu = node.showmenu;
                    c.panit = node.panit;
                    c.panlock = node.panlock;
                    c.zoomlock = node.zoomlock;
                    c.showlayers = node.layers;
                    c.grid = {showgrid:node.showgrid};
                    c.hiderightclick = node.hiderightclick;
                    c.coords = node.coords;
                    client.write(JSON.stringify({command:c}));
                }
            });
            client.on('close', function() {
                delete clients[client.id];
                node.status({fill:"green",shape:"ring",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
            });
            node.status({fill:"green",shape:"dot",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
        }
        node.on('input', function(msg) {
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
        });
        node.on("close", function() {
            for (var c in clients) {
                if (clients.hasOwnProperty(c)) {
                    clients[c].end();
                }
            }
            clients = {};
            sockets[this.path].removeListener('connection', callback);
            for (var i=0; i < RED.httpNode._router.stack.length; i++) {
                var r = RED.httpNode._router.stack[i];
                if ((r.name === "serveStatic") && (r.regexp.test(node.path))) {
                    RED.httpNode._router.stack.splice(i, 1)
                }
            }
            node.status({});
        });
        sockets[this.path].on('connection', callback);
    }
    RED.nodes.registerType("worldmap",WorldMap);


    var WorldMapIn = function(n) {
        RED.nodes.createNode(this,n);
        this.path = n.path || "/worldmap";
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
            node.status({fill:"green",shape:"dot",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
            client.on('data', function(message) {
                message = JSON.parse(message);
                setImmediate(function() {node.send({payload:message, topic:node.path.substr(1), _sessionid:client.id})});
            });
            client.on('close', function() {
                delete clients[client.id];
                node.status({fill:"green",shape:"ring",text:"connected "+Object.keys(clients).length,_sessionid:client.id});
                node.send({payload:{action:"disconnect", clients:Object.keys(clients).length}, topic:node.path.substr(1), _sessionid:client.id});
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
        var node = this;

        node.on("input", function(msg) {
            if (msg.hasOwnProperty("payload") && msg.payload.hasOwnProperty("name")) {
                var newmsg = RED.util.cloneMessage(msg);
                if (msg.payload.deleted) {
                    delete node.pointsarray[msg.payload.name];
                    //newmsg.payload.name = msg.payload.name + "_";
                    node.send(newmsg);  // send the track to be deleted
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
                    newmsg.payload.line = line;
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
            if (msg.hasOwnProperty("payload") && msg.payload.hasOwnProperty("command") && msg.payload.command.hasOwnProperty("clear")) {
                for (var p in node.pointsarray) {
                    if (node.pointsarray.hasOwnProperty(p)) {
                        if (node.pointsarray[p][0].layer === msg.payload.command.clear) {
                            delete node.pointsarray[p];
                        }
                    }
                }
            }
        });

        node.on("close", function() {
            node.pointsarray = {};
        });
    }
    RED.nodes.registerType("worldmap-tracks",WorldMapTracks);
}
