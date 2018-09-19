'use strict';

var NVG = class {
	constructor(input) {
		this.document = 'nvg';
		this.items = [];
		this.version = '2.0.2'
		if (Array.isArray(input)){
			this.items = input;
		}
		if (typeof input == 'object' && !Array.isArray(input)){
			this.items.push(input);
		}
		if (typeof input == 'string'){
			//do stuff with input object
			try {
				input = JSON.parse(input);
				for (var key in input){
					this[key] = input[key];
				}
			}catch (e) {
				//So parse as JSON failed, try to parse it as xml
				this.parseXML(input);
			}	
		}
	}
	getItem(uri){ //returns item from uri
		if(typeof uri == 'undefined')return this.items;
		
		function getItemByURI(uri, items){
			for (var i = 0; i< items.length; i++){
				if(items[i].uri == uri) return items[i];
				if(items[i].hasOwnProperty('items')){
					var result = getItemByURI(uri, items[i].items);
					if(result) return result;
				}
			}
			return false;
		}
		return getItemByURI(uri, this.items);
	}
	getItems(){ //returns all items
		return this.items;
	}
	parseXML(xml){
		//parse XML string to JSON
		function tagAttributes(nodes, current){
			for (var i = 0; i < nodes.length; i++){
				var node = nodes[i];
				var nodeName = node.nodeName.split(':');
				if(nodeName[0] == 'dc' || nodeName[0] == 'dcterms'){
					nodeName = nodeName[0];
				}else{
					nodeName = nodeName[1];
				}
				if(node.nodeType == 1 && nodeName){
					nodeName = nodeName.toLowerCase();
					switch (nodeName) {
						case 'begin':
							current[nodeName] = node.textContent;
							break;
						case 'end':
							current[nodeName] = node.textContent;
							break;
						case 'dc':
						case 'dcterms':
							current[node.nodeName] = node.textContent;
							break;
						case 'content':
							current[nodeName] = node.textContent;
							break;
						case 'exclude':
							if (!current.hasOwnProperty(nodeName)){
								current.exclusion = [];
							}
							tagAttributes(node.childNodes, current.exclusion);
							break;
						case 'extendeddata':
							if (!current.hasOwnProperty(nodeName)){
								current[nodeName] = {};
								current[nodeName].simpledata = [];
							}
							nodeAttibutes(node, current[nodeName]);
							parseSubNodes(node.childNodes, current[nodeName]);
							break;
						case 'extension':
							console.log('TODO tagAttributes: '  + nodeName);
							// TODO How to handle extended data
							current[nodeName] = [];//this is for node 
							break;
						case 'metadata':
							current[nodeName] = {};
							tagAttributes(node.childNodes, current[nodeName]);
							break;
						case 'textinfo':
							current[nodeName] = node.textContent;
							break;
						case 'timespan':
							current[nodeName] = {};
							tagAttributes(node.childNodes, current[nodeName]);
							break;
						case 'timestamp':
							current[nodeName] = node.textContent;
							break;
						case 'simplefield':
							if (!current.hasOwnProperty(nodeName)){
								current[nodeName] = [];
							}
							var field = {};
							nodeAttibutes(node, field);
							current[nodeName].push(field);
							break;
						case 'arcband-ring':
						case 'circular-ring':
						case 'elliptic-ring':
						case 'linear-ring':
						case 'rect-ring':
							var exclude = {};
							exclude.ring = nodeName.replace('-','');
							nodeAttibutes(node, exclude);
							current.push(exclude);
							break;
						default:
							//Debug logging, remove later
							if(['arc','arcband','arrow','circle','composite','content-item','corridor','ellipse','g','multipoint','orbit','point','polygon','polyline','rect','text'].lastIndexOf(nodeName) == -1){
								console.log('TODO tagAttributes default: ' + nodeName);	
							}
					}
				}
			}
		}
		function nodeAttibutes(node, current){
			Array.prototype.slice.call(node.attributes).forEach(function(attr) {
				if (attr.name == 'modifiers' || attr.name == 'style') {
					current[attr.name] = {};
					var attr_list = attr.value.trim().split(';');
					for (var j = 0; j < attr_list.length; j++){
						if(attr_list[j]){
							var s = attr_list[j].split(':');
							if(s[0] && s[1])current[attr.name][s[0].trim()] = isNaN(Number(s[1].trim()))?s[1].trim():Number(s[1].trim());
						}
					}
				return;
				}
				if (attr.name == 'points') {
					current[attr.name] = [];
					var attr_list = attr.value.trim().split(' ');
					for (var j = 0; j < attr_list.length; j++){
						if(attr_list[j]){
							var s = attr_list[j].split(',');
							if(s[0] && s[1])current[attr.name].push([Number(s[0]),Number(s[1])]);
						}
					}
				return;
				}
				current[attr.name] = isNaN(Number(attr.value))?attr.value:Number(attr.value);
			});
		}
		function parseSubNodes(nodes, current){
			for (var i = 0; i < nodes.length; i++){
				var node = nodes[i];
				if(node.nodeType == 1){
					var nodeName = node.nodeName.split(':')[1] || node.nodeName;
					nodeName = nodeName.toLowerCase();
					var item = {};
					if (['extendeddata','extension','metadata','schema','section','simpledata','simplefield'].lastIndexOf(nodeName) != -1){			
						
						switch (nodeName) {
							case 'extendeddata':
								current[nodeName] = item;
								nodeAttibutes(node, item);
								tagAttributes(node.childNodes, item);
								break;
							case 'extension':
								console.log('TODO parsesubnodes: ' + nodeName)
								// TODO How to handle extended data
								current[nodeName] = [];//this is for root level
								break;
							case 'metadata':
								console.log('TODO parsesubnodes: ' + nodeName)
								// TODO How to handle metadata data
								current[nodeName] = item;
								break;
							case 'schema':
								if (!current.hasOwnProperty(nodeName)){
									current[nodeName] = [];
								}
								current[nodeName].push(item);
								nodeAttibutes(node, item);
								tagAttributes(node.childNodes, item);
								break;
							case 'section':
								if (!current.hasOwnProperty('simpledatasection')){
									current.simpledatasection = [];
								}
								current.simpledatasection.push(item);
								nodeAttibutes(node, item);
								item.simpledata = [];
								parseSubNodes(node.childNodes, item);
								break;
							case 'simpledata':
								nodeAttibutes(node, item);
								item.value = node.textContent;
								current.simpledata.push(item);
								tagAttributes(node.childNodes, item);
								break;
							case 'simplefield':
								current[nodeName] = item;
								nodeAttibutes(node, item);
								tagAttributes(node.childNodes, item);
								break;
							default:
								console.log('TODO parsesubnodes default: ' + nodeName)
						}
					}else{ //This is all drawables
						nodeAttibutes(node, item);
						item.drawable = nodeName;
						
						if(node.childNodes.length){
							tagAttributes(node.childNodes, item);
						}
						if(item.drawable == 'g' || item.drawable == 'composite'){
							item.items = [];
							parseSubNodes(node.childNodes, item);
						}
						if(item.drawable == 'a'){ //This is for handling the old A element
							parseSubNodes(node.childNodes, current);
						}else{	// otherwise just add featuers
							current.items.push(item);
						}					
					}
				}
			}
		}
		
		var xml = (new DOMParser()).parseFromString(xml , "text/xml");
		if(xml.firstChild.nodeName == 'nvg' || xml.firstChild.nodeName.split(':')[1] == 'nvg'){//check that we actually are parsing NVG but ignore namespace
			this.version = xml.firstChild.getAttribute('version'); 
			this.items = [];
			var nodes = xml.firstChild.childNodes;
			parseSubNodes(nodes, this);				
		}		
	}
	toGeoJSON(){
		function bearing(p1,p2){
    		var l1 = p1[0] * (Math.PI/180);
    		var l2 = p2[0] * (Math.PI/180);
    		var f1 = p1[1] * (Math.PI/180);
    		var f2 = p2[1] * (Math.PI/180);
    		var y = Math.sin(l2-l1)*Math.cos(f2);
    		var x = Math.cos(f1)*Math.sin(f2)-Math.sin(f1)*Math.cos(f2)*Math.cos(l2-l1);
    		return Math.atan2(y,x)/(Math.PI/180);
		}
		function distBearing(point, dist, bearing){
			var angularDist = dist/6371e3;
			var bearing = bearing * (Math.PI/180);
			var lng = point[0] * (Math.PI/180);
			var lat = point[1] * (Math.PI/180);
			var lat2 = Math.asin(Math.sin(lat)*Math.cos(angularDist)+Math.cos(lat)*Math.sin(angularDist)*Math.cos(bearing));
			var lng2 = (lng+Math.atan2(Math.sin(bearing)*Math.sin(angularDist)*Math.cos(lat),Math.cos(angularDist)-Math.sin(lat)*Math.sin(lat2)));
			lat2 = lat2/(Math.PI/180);
			lng2 = ((lng2/(Math.PI/180))+540)%360-180;
			return [lng2,lat2];
		}
		function exclusions(exclusion){
			var exclude = [];
			switch (exclusion.ring) {
				case 'arcbandring':
					var startangle = exclusion.startangle;
					var endangle = exclusion.endangle;
					if(startangle > endangle) endangle += 360;
					for (var j = startangle; j <= endangle; j+=2){
						exclude.push(distBearing([exclusion.cx,exclusion.cy], exclusion.minr, j));
					}
					for (var j = endangle; j >= startangle; j-=2){
						exclude.push(distBearing([exclusion.cx,exclusion.cy], exclusion.maxr, j));
					}
					exclude.push(distBearing([exclusion.cx,exclusion.cy], exclusion.minr, startangle));
					break;
				case 'ellipticalring':
					for (var j = 360; j >= 0; j-=2){
						var radius = exclusion.ry * exclusion.rx / Math.sqrt(Math.pow(exclusion.rx * Math.cos(j * (Math.PI/180)),2) + Math.pow(exclusion.ry * Math.sin(j * (Math.PI/180)),2));
						exclude.push(distBearing([exclusion.cx,exclusion.cy], radius, j-(exclusion.rotation||0)));
					}
					break;
				case 'linearring':
					exclude = exclusion.points;
					exclude.push(exclusion.points[0]);
					break;
				case 'rectangularring':
					var diagonalRadius = Math.sqrt(Math.pow(exclusion.rx,2)+Math.pow(exclusion.rx,2));
					var angle;
					angle = ((Math.PI/2)-Math.atan2(exclusion.ry, exclusion.rx)) / (Math.PI/180);
					exclude.push(distBearing([exclusion.cx,exclusion.cy], diagonalRadius, exclusion.rotation?angle-exclusion.rotation:angle));
					angle = ((Math.PI/2)-Math.atan2(-exclusion.ry, exclusion.rx)) / (Math.PI/180);
					exclude.push(distBearing([exclusion.cx,exclusion.cy], diagonalRadius, exclusion.rotation?angle-exclusion.rotation:angle));
					angle = ((Math.PI/2)-Math.atan2(-exclusion.ry, -exclusion.rx)) / (Math.PI/180);
					exclude.push(distBearing([exclusion.cx,exclusion.cy], diagonalRadius, exclusion.rotation?angle-exclusion.rotation:angle));
					angle = ((Math.PI/2)-Math.atan2(exclusion.ry, -exclusion.rx)) / (Math.PI/180);
					exclude.push(distBearing([exclusion.cx,exclusion.cy], diagonalRadius, exclusion.rotation?angle-exclusion.rotation:angle));
					angle = ((Math.PI/2)-Math.atan2(exclusion.ry, exclusion.rx)) / (Math.PI/180);
					exclude.push(distBearing([exclusion.cx,exclusion.cy], diagonalRadius, exclusion.rotation?angle-exclusion.rotation:angle));
					break;
				default:
					console.log('TODO parse item default: ' + exclusion.ring)
			}
			return exclude;
		}
		function items2features(items, geometrycollection){
			var features = [];
			for (var i = 0; i < items.length; i++){
				var item = items[i];
				var feature = { "type": "Feature", "properties" : {}};
				for (var key in item){
					if(key == 'uri'){
						feature.id = item.uri;
					}else{
						feature.properties[key] = item[key];
					}
				}
				switch (item.drawable) {
					case 'arc':
						feature.geometry = {"type": "LineString"};
						feature.geometry.coordinates = [];
						var startangle = item.startangle;
						var endangle = item.endangle;
						if(startangle > endangle) endangle += 360;
						for (var j = startangle; j <= endangle; j+=2){
							var radius = item.ry * item.rx / Math.sqrt(Math.pow(item.rx * Math.cos(j * (Math.PI/180)),2) + Math.pow(item.ry * Math.sin(j * (Math.PI/180)),2));
							feature.geometry.coordinates.push(distBearing([item.cx,item.cy], radius, item.rotation?j-item.rotation:j));
						}
						break;
					case 'arcband':
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [[]];
						var startangle = item.startangle;
						var endangle = item.endangle;
						if(startangle > endangle) endangle += 360;
						for (var j = startangle; j <= endangle; j+=2){
							feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], item.minr, j));
						}
						for (var j = endangle; j >= startangle; j-=2){
							feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], item.maxr, j));
						}
						feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], item.minr, startangle));
						break;
					case 'arrow':
						var direction;
						feature.geometry = {"type": "LineString"};
						feature.geometry.coordinates = [];
						direction = (bearing(item.points[0],item.points[1]) +360) % 360;
						feature.geometry.coordinates.push(distBearing(item.points[0], item.width/2, direction-90));
						for (var j = 1; j < item.points.length-1; j++){
							var direction1 = (bearing(item.points[j], item.points[j-1]) +360) % 360;
							var direction2 = (bearing(item.points[j], item.points[j+1]) +360) % 360;
							var factor = 1/Math.sin(((direction2-direction1)/2)*(Math.PI/180));
							feature.geometry.coordinates.push(distBearing(item.points[j], (item.width/2)*factor , ((direction1+direction2)/2)));
						}
						direction = (bearing(item.points[item.points.length-1],item.points[item.points.length-2]) + 180) % 360;
						
						//Arrowhead
						var point = distBearing(item.points[item.points.length-1], item.width, direction+180);
						feature.geometry.coordinates.push(distBearing(point, item.width/2, direction-90))
						feature.geometry.coordinates.push(distBearing(point, item.width, direction-90))
						feature.geometry.coordinates.push(item.points[item.points.length-1]);
						feature.geometry.coordinates.push(distBearing(point, item.width, direction+90))
						feature.geometry.coordinates.push(distBearing(point, item.width/2, direction+90))
						
						for (var j = item.points.length-2; j > 0; j--){
							var direction1 = (bearing(item.points[j], item.points[j-1]) +360) % 360;
							var direction2 = (bearing(item.points[j], item.points[j+1]) +360) % 360;
							var factor = 1/Math.sin(((direction2-direction1)/2)*(Math.PI/180));
							feature.geometry.coordinates.push(distBearing(item.points[j], -(item.width/2)*factor, ((direction1+direction2)/2)));
						}
						
						direction = (bearing(item.points[0],item.points[1]) +360) % 360;
						feature.geometry.coordinates.push(distBearing(item.points[0], item.width/2, direction+90));
						break;
					case 'circle':
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [[]];
						for (var j = 360; j >= 0; j-=5){
							feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], item.r, j));
						}
						break;
					case 'composite':
						//Flatten composites at the moment
						var subfeatures = items2features(item.items, true);
						for (key in subfeatures){
							subfeatures[key].properties.parent = {};//feature.properties;
							if(item.uri)subfeatures[key].properties.parent.uri = item.uri;
							features.push(subfeatures[key]);
						}
						break;
					case 'corridor':
						var direction;
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [[]];
						direction = (bearing(item.points[0],item.points[1]) +360) % 360;
						feature.geometry.coordinates[0].push(distBearing(item.points[0], item.width/2, direction-90));
						for (var j = 1; j < item.points.length-1; j++){
							var direction1 = (bearing(item.points[j], item.points[j-1]) +360) % 360;
							var direction2 = (bearing(item.points[j], item.points[j+1]) +360) % 360;
							var factor = 1/Math.sin(((direction2-direction1)/2)*(Math.PI/180));
							feature.geometry.coordinates[0].push(distBearing(item.points[j], (item.width/2)*factor, ((direction1+direction2)/2)));
						}
						
						direction = (bearing(item.points[item.points.length-1],item.points[item.points.length-2]) + 180) % 360;
						feature.geometry.coordinates[0].push(distBearing(item.points[item.points.length-1], item.width/2, direction-90));
						feature.geometry.coordinates[0].push(distBearing(item.points[item.points.length-1], item.width/2, direction+90));

						for (var j = item.points.length-2; j > 0; j--){
							var direction1 = (bearing(item.points[j], item.points[j-1]) +360) % 360;
							var direction2 = (bearing(item.points[j], item.points[j+1]) +360) % 360;
							var factor = 1/Math.sin(((direction2-direction1)/2)*(Math.PI/180));
							feature.geometry.coordinates[0].push(distBearing(item.points[j], -(item.width/2)*factor, ((direction1+direction2)/2)));
						}
						
						direction = (bearing(item.points[0],item.points[1]) +360) % 360;
						feature.geometry.coordinates[0].push(distBearing(item.points[0], item.width/2, direction+90));
						feature.geometry.coordinates[0].push(distBearing(item.points[0], item.width/2, direction-90));//Close line

						break;
					case 'ellipse':
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [[]];
						for (var j = 360; j >= 0; j-=2){
							var radius = item.ry * item.rx / Math.sqrt(Math.pow(item.rx * Math.cos(j * (Math.PI/180)),2) + Math.pow(item.ry * Math.sin(j * (Math.PI/180)),2));
							feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], radius, j-(item.rotation||0)));
						}
						break;
					case 'g':
						//Flatten groups
						var subfeatures = items2features(item.items, true);
						for (key in subfeatures){
							subfeatures[key].properties.parent = {};//feature.properties;
							if(item.uri)subfeatures[key].properties.parent.uri = item.uri;
							features.push(subfeatures[key]);
						}
						break;
					case 'multipoint':
						feature.geometry = {"type": "MultiPoint"};
						feature.geometry.coordinates = item.points;
						delete feature.properties.points;
						break;
					case 'orbit':
						var direction;
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [[]];
						direction = (Math.atan2(item.points[1][0] - item.points[0][0], item.points[1][1] - item.points[0][1]) - (Math.PI/2)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing(item.points[0], item.width/2, direction));
						for (var j = 0; j <= 180; j+=2){
							feature.geometry.coordinates[0].push(distBearing(item.points[1], item.width/2, direction + j ));
						}
						
						direction = (Math.atan2(item.points[0][0] - item.points[1][0], item.points[0][1] - item.points[1][1]) - (Math.PI/2)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing(item.points[item.points.length-1], item.width/2, direction));
						for (var j = 0; j <= 180; j+=2){
							feature.geometry.coordinates[0].push(distBearing(item.points[0], item.width/2, direction + j ));
						}
						
						direction = (Math.atan2(item.points[1][0] - item.points[0][0], item.points[1][1] - item.points[0][1]) - (Math.PI/2)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing(item.points[0], item.width/2, direction));
						break;
						break;
					case 'point':
						feature.geometry = {"type": "Point"};
						feature.geometry.coordinates = [item.x, item.y];
						break;
					case 'polygon':
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [item.points];
						feature.geometry.coordinates[0].push(item.points[0])
						delete feature.properties.points;
						break;
					case 'polyline':
						feature.geometry = {"type": "LineString"};
						feature.geometry.coordinates = item.points;
						delete feature.properties.points;
						break;
					case 'rect':
						feature.geometry = {"type": "Polygon"};
						feature.geometry.coordinates = [[]];
						var diagonalRadius = Math.sqrt(Math.pow(item.rx,2)+Math.pow(item.rx,2));
						var angle;
						angle = ((Math.PI/2)-Math.atan2(item.ry, item.rx)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], diagonalRadius, item.rotation?angle-item.rotation:angle));
						angle = ((Math.PI/2)-Math.atan2(-item.ry, item.rx)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], diagonalRadius, item.rotation?angle-item.rotation:angle));
						angle = ((Math.PI/2)-Math.atan2(-item.ry, -item.rx)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], diagonalRadius, item.rotation?angle-item.rotation:angle));
						angle = ((Math.PI/2)-Math.atan2(item.ry, -item.rx)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], diagonalRadius, item.rotation?angle-item.rotation:angle));
						angle = ((Math.PI/2)-Math.atan2(item.ry, item.rx)) / (Math.PI/180);
						feature.geometry.coordinates[0].push(distBearing([item.cx,item.cy], diagonalRadius, item.rotation?angle-item.rotation:angle));
						break;
					case 'text':
						feature.geometry = {"type": "Point"};
						feature.geometry.coordinates = [item.x, item.y];
						break;
					default:
						console.log('TODO parse item default: ' + item.drawable)
				}
				
				if(item.hasOwnProperty('exclusion')){
					for (var e = 0; e < item.exclusion.length; e++){
						feature.geometry.coordinates.push(exclusions(item.exclusion[e]));
					}
				}
				if(feature.geometry){
					features.push(feature);
				}
			}
			return features;
		}
		var geoJSON = {};
		geoJSON.type = 'FeatureCollection';
		for (var key in this){
			if(key == 'items'){
				geoJSON.features = items2features(this.items, false);
			}else{
				geoJSON[key] = this[key];
			}
		}
		return geoJSON;
	}
	toXML(){
		//parse this to NVG XML
	}
};
