(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.L = global.L || {}, global.L.Wrapped = {})));
}(this, (function (exports) { 'use strict';

var version = "1.0.0+master.0861cee";

/*
 * @namespace L.Wrapped
 * Utility functions to calculate various aspects of linear geometry to
 * calculate if lines should be wrapped as well as common functionality used by both Polygons and Polylines.
 */

// @function calculateAntimeridianLat (latLngA: LatLng, latLngB: latLng)
// Returns the calculated latitude where a line drawn between
// two Latitude/Longitude points will cross the antimeridian.
function calculateAntimeridianLat(latLngA, latLngB) {
	// Ensure that the latitude A is less than latidue B. This will allow the
	// crossing point to be calculated based on the purportional similarity of
	// right triangles.
	if (latLngA.lat > latLngB.lat) {
		var temp = latLngA;
		latLngA = latLngB;
		latLngB = temp;
	}

	var A = 360 - Math.abs(latLngA.lng - latLngB.lng);
	var B = latLngB.lat - latLngA.lat;
	var a = Math.abs(180 - Math.abs(latLngA.lng));

	return latLngA.lat + ((B * a) / A);
}

// @function isCrossAntimeridian(latLngA: LatLng, latLngB: LatLng)
// Returns true if the line between the two points will cross either
// the prime meridian (Greenwich) or its antimeridian (International Date Line)
function isCrossMeridian(latLngA, latLngB) {
	// Returns true if the signs are not the same.
	return sign(latLngA.lng) * sign(latLngB.lng) < 0;
}

// @function sign(Number)
// Returns NaN for non-numbers, 0 for 0, -1 for negative numbers,
// 1 for positive numbers
function sign(x) {
	return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : 0 : NaN;
}


// @function pushLatLng(ring: Point[], projectedBounds: LatLngBounds, latlng: LatLng, map: Map)
// Adds the latlng to the current ring as a layer point and expands the projected bounds.
function pushLatLng(ring, projectedBounds, latlng, map) {
	ring.push(map.latLngToLayerPoint(latlng));
	projectedBounds.extend(ring[ring.length - 1]);
}

// @function isBreakRing(latLngA: LatLng, latLngB: LatLng)
// Determines when the ring should be broken and a new one started.
function isBreakRing(latLngA, latLngB) {
	return isCrossMeridian(latLngA, latLngB)  &&
	Math.abs(latLngA.lng) > 90 &&
	Math.abs(latLngB.lng) > 90;
}

// @function breakRing(currentLat: LatLng, nextLat: LatLng, rings: Point[][],
//  projectedBounds: LatLngBounds, map: Map)
// Breaks the existing ring along the anti-meridian.
// returns the starting latLng for the next ring.
function breakRing(currentLat, nextLat, rings, projectedBounds, map) {
	var ring = rings[rings.length - 1];

	// Calculate two points for the anti-meridian crossing.
	var breakLat = calculateAntimeridianLat(currentLat, nextLat);
	var breakLatLngs = [new L.LatLng(breakLat, 180), new L.LatLng(breakLat, -180)];

	// Add in first anti-meridian latlng to this ring to finish it.
	// Positive if positive, negative if negative.
	if (sign(currentLat.lng) > 0) {
		pushLatLng(ring, projectedBounds, breakLatLngs.shift(), map);
	} else {
		pushLatLng(ring, projectedBounds, breakLatLngs.pop(), map);
	}

	// Return the second anti-meridian latlng
	return breakLatLngs.pop();
}

/*
 * @namespace L.Wrapped
 * A polyline that will automatically split and wrap around the Antimeridian (Internation Date Line).
 */
var Polyline = L.Polyline.extend({

	// recursively turns latlngs into a set of rings with projected coordinates
	_projectLatlngs: function (latlngs, result, projectedBounds) {
		var flat = latlngs[0] instanceof L.LatLng;

		if (flat) {
			this._createRings(latlngs, result, projectedBounds);
		} else {
			for (var i = 0; i < latlngs.length; i++) {
				this._projectLatlngs(latlngs[i], result, projectedBounds);
			}
		}
	},

	// Creates the rings used to render the latlngs.
	_createRings: function (latlngs, rings, projectedBounds) {
		var len = latlngs.length;
		rings.push([]);

		for (var i = 0; i < len; i++) {
			var compareLatLng = this._getCompareLatLng(i, len, latlngs);

			pushLatLng(rings[rings.length - 1], projectedBounds, latlngs[i], this._map);

			// If the next point to check exists, then check to see if the
			// ring should be broken.
			if (compareLatLng && isBreakRing(compareLatLng, latlngs[i])) {
				var secondMeridianLatLng = breakRing(latlngs[i], compareLatLng,
					rings, projectedBounds, this._map);

				this._startNextRing(rings, projectedBounds, secondMeridianLatLng);
			}
		}
	},

	// returns the latlng to compare the current latlng to.
	_getCompareLatLng: function (i, len, latlngs) {
		return (i + 1 < len) ? latlngs[i + 1] : null;
	},

		// Starts a new ring and adds the second meridian point.
	_startNextRing: function (rings, projectedBounds, secondMeridianLatLng) {
		var ring = [];
		rings.push(ring);
		pushLatLng(ring, projectedBounds, secondMeridianLatLng, this._map);
	}
});

// @factory L.wrappedPolyline(latlngs: LatLng[], options?: Polyline options)
// Instantiates a polyline that will automatically split around the
// antimeridian (Internation Date Line) if that is a shorter path.
function wrappedPolyline(latlngs, options) {
	return new L.Wrapped.Polyline(latlngs, options);
}

/*
 * @namespace L.Wrapped
 * A polygon that will automatically split and wrap around the Antimeridian (Internation Date Line).
 */
var Polygon = L.Polygon.extend({

	// recursively turns latlngs into a set of rings with projected coordinates
	_projectLatlngs: function (latlngs, result, projectedBounds) {
		var flat = latlngs[0] instanceof L.LatLng;

		if (flat) {
			this._createRings(latlngs, result, projectedBounds);
		} else {
			for (var i = 0; i < latlngs.length; i++) {
				this._projectLatlngs(latlngs[i], result, projectedBounds);
			}
		}
	},

	// Creates the rings used to render the latlngs.
	_createRings: function (latlngs, rings, projectedBounds) {
		var len = latlngs.length;
		rings.push([]);

		for (var i = 0; i < len; i++) {
			// Because this is a polygon, there will always be a comparison latlng
			var compareLatLng = this._getCompareLatLng(i, len, latlngs);

			pushLatLng(rings[rings.length - 1], projectedBounds, latlngs[i], this._map);

			// Check to see if the ring should be broken.
			if (isBreakRing(compareLatLng, latlngs[i])) {
				var secondMeridianLatLng = breakRing(latlngs[i], compareLatLng,
					rings, projectedBounds, this._map);

				this._startNextRing(rings, projectedBounds, secondMeridianLatLng, i === len - 1);
			}
		}

		// Join the last two rings if needed.
		this._joinLastRing(rings, latlngs);
	},

	// Starts a new ring if needed and adds the second meridian point to the
	// correct ring.
	_startNextRing: function (rings, projectedBounds, secondMeridianLatLng, isLastLatLng) {
		var ring;
		if (!isLastLatLng) {
			ring = [];
			rings.push(ring);
			pushLatLng(ring, projectedBounds, secondMeridianLatLng, this._map);
		} else {
			// If this is the last latlng, don't bother starting a new ring.
			// instead, join the last meridian point to the first point, to connect
			// the shape correctly.
			ring = rings[0];
			ring.unshift(this._map.latLngToLayerPoint(secondMeridianLatLng));
			projectedBounds.extend(ring[0]);
		}
	},

	// returns the latlng to compare the current latlng to.
	_getCompareLatLng: function (i, len, latlngs) {
		return (i + 1 < len) ? latlngs[i + 1] : latlngs[0];
	},

	// Joins the last ring to the first if they were accidently disconnected by
	// crossing the anti-meridian
	_joinLastRing: function (rings, latlngs) {
		var firstRing = rings[0];
		var lastRing = rings[rings.length - 1];

		// If both either the first or last latlng cross the meridian immediately, then
		// they have accidently been split by turning one ring into mulitiple.
		// Rejoin them.
		if (rings.length > 1 && (firstRing.length === 2 || lastRing.length === 2) &&
			 !isCrossMeridian(latlngs[0], latlngs[latlngs.length - 1])) {
			var len = lastRing.length;
			for (var i = 0; i < len; i++) {
				firstRing.unshift(lastRing.pop());
			}
			// Remove the empty ring.
			rings.pop();
		}
	}
});

// @factory L.wrappedPolygon(latlngs: LatLng[], options?: Polygon options)
// Instantiates a polygon that will automatically split around the
// antimeridian (Internation Date Line) if that is a shorter path.
function wrappedPolygon(latlngs, options) {
	return new L.Wrapped.Polygon(latlngs, options);
}

exports.version = version;
exports.Polyline = Polyline;
exports.wrappedPolyline = wrappedPolyline;
exports.Polygon = Polygon;
exports.wrappedPolygon = wrappedPolygon;
exports.calculateAntimeridianLat = calculateAntimeridianLat;
exports.isCrossMeridian = isCrossMeridian;
exports.sign = sign;
exports.isBreakRing = isBreakRing;

})));
//# sourceMappingURL=leaflet.antimeridian-src.js.map
