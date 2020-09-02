(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory()
			: typeof define === 'function' && define.amd ? define(factory)
					: (global.Geolocation = factory());
}(this, (function() {
	'use strict';

	var Nominatim = function Nominatim(base, els) {
		this.Base = base;

		this.layerName = utils.randomId('geocoder-layer-');
		this.layer = new ol.layer.Vector({
			name : this.layerName,
			source : new ol.source.Vector()
		});

		this.options = base.options;
		this.options.provider = this.options.provider.toLowerCase();

		this.els = els;
		this.lastQuery = '';
		this.container = this.els.container;
		this.registeredListeners = {
			mapClick : false
		};
		//this.setListeners();

		// providers
		/*this.Photon = new Photon();
		this.OpenStreet = new OpenStreet();
		this.MapQuest = new MapQuest();
		this.Pelias = new Pelias();
		this.Google = new Google();
		this.Bing = new Bing();*/
	};
	
	
	var utils = {
	 randomId: function randomId(prefix) {
		    var id = this.now().toString(36);
		    return prefix ? prefix + id : id;
		  },
	}
	

	/**
	 * @class Base
	 * @extends {ol.control.Control}
	 */
	var Base = (function(superclass) {
		function Base(type, options) {

			if (!(this instanceof Base)) {
				return new Base();
			}

			this.container = undefined;

			superclass.call(this, {
				element : this.container
			});
		}

		if (superclass)
			Base.__proto__ = superclass;
		Base.prototype = Object.create(superclass && superclass.prototype);
		Base.prototype.constructor = Base;

		/**
		 * @return {ol.layer.Vector} Returns the layer created by this control
		 */
		Base.prototype.getLayer = function getLayer() {
			return this.layer;
		};

		/**
		 * @return {ol.source.Vector} Returns the source created by this control
		 */
		Base.prototype.getSource = function getSource() {
			return this.getLayer().getSource();
		};

		return Base;
	}(ol.control.Control));

	return Base;

})));
