/**
 * Copyright 2015, 2016 IBM Corp.
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
    var express = require("express");
    var io = require('socket.io');
    var socket;

    var WorldMap = function(n) {
        RED.nodes.createNode(this,n);
        if (!socket) { socket = io.listen(RED.server); }
        this.lat = n.lat || "";
        this.lon = n.lon || "";
        this.zoom = n.zoom || "";
        this.layer = n.layer || "";
        this.cluster = n.cluster || "";
        this.maxage = n.maxage || "";
        this.showmenu = n.usermenu || "show";
        this.panit = n.panit || "false";
        var node = this;
        //node.log("Serving map from "+__dirname+" as "+RED.settings.httpNodeRoot.slice(0,-1)+"/worldmap");
        RED.httpNode.use("/worldmap", express.static(__dirname + '/worldmap'));

        var callback = function(client) {
            client.setMaxListeners(0);
            node.status({fill:"green",shape:"dot",text:"connected "+socket.engine.clientsCount});
            function handler(msg) {
                client.emit("worldmapdata",msg.payload);
            }
            node.on('input', handler);
            client.on('worldmap', function(data) {
                if (data.action === "connected") {
                    var c = {init:true};
                    if (node.lat && node.lat.length > 0) { c.lat = node.lat; }
                    if (node.lon && node.lon.length > 0) { c.lon = node.lon; }
                    if (node.zoom && node.zoom.length > 0) { c.zoom = node.zoom; }
                    if (node.layer && node.layer.length > 0) { c.layer = node.layer; }
                    if (node.cluster && node.cluster.length > 0) { c.cluster = node.cluster; }
                    if (node.maxage && node.maxage.length > 0) { c.maxage = node.maxage; }
                    c.showmenu = node.showmenu;
                    c.panit = node.panit;
                    client.emit("worldmapdata",{command:c});
                }
            });
            client.on('disconnect', function() {
                node.removeListener("input", handler);
                node.status({fill:"green",shape:"ring",text:"connected "+socket.engine.clientsCount});
            });
            node.on("close", function() {
                node.status({});
                client.disconnect(true);
            });
        }
        node.status({});
        socket.on('connection', callback);
    }
    RED.nodes.registerType("worldmap",WorldMap);

    var WorldMapIn = function(n) {
        RED.nodes.createNode(this,n);
        if (!socket) { socket = io.listen(RED.server); }
        var node = this;

        var callback = function(client) {
            client.setMaxListeners(0);
            node.status({fill:"green",shape:"dot",text:"connected "+socket.engine.clientsCount});
            client.on('worldmap', function(data) {
                node.send({payload:data, topic:"worldmap"});
            });
            client.on('disconnect', function() {
                node.status({fill:"green",shape:"ring",text:"connected "+socket.engine.clientsCount});
                node.send({payload:{action:"disconnect", clients:socket.engine.clientsCount}, topic:"worldmap"});
            });
            node.on("close", function() {
                client.disconnect(true);
            });
        }

        node.on("close", function() {
            node.status({});
            //socket.close();
        });
        socket.on('connection', callback);
    }
    RED.nodes.registerType("worldmap in",WorldMapIn);
}
