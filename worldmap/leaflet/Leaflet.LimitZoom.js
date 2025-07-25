// Limit leaflet map zoom to a list of variants
// Written by Ilya Zverev, licensed WTFPL

L.Map.mergeOptions({
	zooms: [] // array of integers
});

L.Map.include({
	_limitZoom: function (zoom) {
		var zooms = this.options.zooms;
		if (!zooms || !('length' in zooms) || !zooms.length) {
			var min = this.getMinZoom(),
			    max = this.getMaxZoom(),
			    snap = L.Browser.any3d ? this.options.zoomSnap : 1;
			if (snap) {
				zoom = Math.round(zoom / snap) * snap;
			}
			return Math.max(min, Math.min(max, zoom));
		} else {
			var z, d = 100, i, dist;
			var dz = -1, dd = 100, dir = zoom - this._zoom;
			var snap = L.Browser.any3d ? this.options.zoomSnap : 1;
			if (snap) {
				zoom = Math.round(zoom / snap) * snap;
			}
			for (i = 0; i < zooms.length; i++) {
				dist = Math.abs(zooms[i] - zoom);
				if (dist < d) {
					z = zooms[i];
					d = dist;
				}
				if (dir * (zooms[i] - this._zoom) > 0 && dist < dd) {
					dz = zooms[i];
					dd = dist;
				}
			}
			return dz < 0 ? z : dz;
		}
	}
});
