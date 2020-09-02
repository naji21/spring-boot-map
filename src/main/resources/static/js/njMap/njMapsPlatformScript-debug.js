/**
 * Naji's GIS OpenLayers Maps Platform
 * 
 * http://www.njMaptech.net
 * 
 * Author : Naji
 * 
 * Date : 2020.04.09
 */
( function(window, jQuery) {
	"use strict";

	if ( typeof jQuery === "undefined" ) {
		alert( "need for jQuery !" );
		return false;
	}

	window._$ = jQuery;
	window.naji = {
		version : "1.0.0",
		etc : {},
		toc : {},
		util : {},
		layer : {},
		control : {},
		service : {},
		manager : {},
		baseMap : {},
		animation : {}
	};

	var hostIndex = location.href.indexOf( location.host ) + location.host.length;
	var contextPath = location.href.substring( hostIndex, location.href.indexOf( '/', hostIndex + 1 ) );

	window.naji.contextPath = contextPath;

	_$( document ).ready( function() {
		window.njMapsPlatform = window.naji;
	} );

} )( window, jQuery );

( function() {
	"use strict";

	/**
	 * Vector 애니메이션 효과 프로토타입
	 * 
	 * @param workFeature {Object} animateFeature 옵션
	 */
	ol.layer.Vector.prototype.animateFeature = ( function(workFeature_) {
		var _self = this;
		var workFeature = workFeature_;

		var step = 0;

		// postcompose 등록
		var listenerKey = _self.on( 'postcompose', animate );

		if ( _self.changed ) {
			_self.changed();
		}


		/**
		 * 애니메이션
		 * 
		 * @param e {function} postcompose 리스너 함수
		 */
		function animate(e) {
			if ( _self.isStop ) {
				workFeature.extent = false;
				e.frameState.animate = true;
				return;
			}

			var fanim = _self.animations[ step ];
			var famimProp = fanim.getProperties();
			var viewExtent = e.frameState.extent;

			workFeature.vectorContext = e.vectorContext;
			workFeature.frameState = e.frameState;
			if ( !workFeature.extent ) {
				workFeature.extent = e.frameState.extent;
				workFeature.start = e.frameState.time - workFeature.interval;
				workFeature.context = e.context;
			}

			workFeature.time = e.frameState.time - workFeature.start;
			workFeature.elapsed = workFeature.time / famimProp.duration;

			if ( workFeature.elapsed > 1 ) {
				workFeature.elapsed = 1;
			}

			if ( !fanim.animate( workFeature ) ) {

				workFeature.nowNB++;
				// 애니메이션 반복 횟수
				if ( workFeature.nowNB < famimProp.repeat ) {
					workFeature.extent = false;
				}
				// 다음 단계 애니메이션
				else if ( step < _self.animations.length - 1 ) {
					step++;
					workFeature.nowNB = 0;
					workFeature.extent = false;
				}

			}

			// tell OL3 to continue postcompose animation
			e.frameState.animate = true;
		}

		return listenerKey;
	} );

} )();

( function() {
	"use strict";

	ol.interaction.MouseWheelZoom.handleEvent = function(mapBrowserEvent) {
		var targetMap = this.getMap();
		var type = mapBrowserEvent.type;
		if ( type !== ol.events.EventType.WHEEL && type !== ol.events.EventType.MOUSEWHEEL ) {
			return true;
		}

		if ( targetMap.scrollCallBack ) {
			if ( targetMap.scrollCallBack.getAltKeyOnly() && !ol.events.condition.altKeyOnly( mapBrowserEvent ) ) {
				targetMap.scrollCallBack.run();
				return true;
			} else {
				targetMap.scrollCallBack.clear();
				mapBrowserEvent.originalEvent.preventDefault();
				mapBrowserEvent.originalEvent.stopPropagation();
			}
		} else {
			mapBrowserEvent.originalEvent.preventDefault();
			mapBrowserEvent.originalEvent.stopPropagation();
		}

		var map = mapBrowserEvent.map;
		var wheelEvent = /** @type {WheelEvent} */
		( mapBrowserEvent.originalEvent );

		if ( this.useAnchor_ ) {
			this.lastAnchor_ = mapBrowserEvent.coordinate;
		}

		// Delta normalisation inspired by
		// https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
		var delta;
		if ( mapBrowserEvent.type == ol.events.EventType.WHEEL ) {
			delta = wheelEvent.deltaY;
			if ( ol.has.FIREFOX && wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL ) {
				delta /= ol.has.DEVICE_PIXEL_RATIO;
			}
			if ( wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE ) {
				delta *= 40;
			}
		} else if ( mapBrowserEvent.type == ol.events.EventType.MOUSEWHEEL ) {
			delta = -wheelEvent.wheelDeltaY;
			if ( ol.has.SAFARI ) {
				delta /= 3;
			}
		}

		if ( delta === 0 ) {
			return false;
		}

		var now = Date.now();

		if ( this.startTime_ === undefined ) {
			this.startTime_ = now;
		}

		if ( !this.mode_ || now - this.startTime_ > this.trackpadEventGap_ ) {
			this.mode_ = Math.abs( delta ) < 4 ? ol.interaction.MouseWheelZoom.Mode_.TRACKPAD : ol.interaction.MouseWheelZoom.Mode_.WHEEL;
		}

		if ( this.mode_ === ol.interaction.MouseWheelZoom.Mode_.TRACKPAD ) {
			var view = map.getView();
			if ( this.trackpadTimeoutId_ ) {
				clearTimeout( this.trackpadTimeoutId_ );
			} else {
				view.setHint( ol.ViewHint.INTERACTING, 1 );
			}
			this.trackpadTimeoutId_ = setTimeout( this.decrementInteractingHint_.bind( this ), this.trackpadEventGap_ );
			var resolution = view.getResolution() * Math.pow( 2, delta / this.trackpadDeltaPerZoom_ );
			var minResolution = view.getMinResolution();
			var maxResolution = view.getMaxResolution();
			var rebound = 0;
			if ( resolution < minResolution ) {
				resolution = Math.max( resolution, minResolution / this.trackpadZoomBuffer_ );
				rebound = 1;
			} else if ( resolution > maxResolution ) {
				resolution = Math.min( resolution, maxResolution * this.trackpadZoomBuffer_ );
				rebound = -1;
			}
			if ( this.lastAnchor_ ) {
				var center = view.calculateCenterZoom( resolution, this.lastAnchor_ );
				view.setCenter( view.constrainCenter( center ) );
			}
			view.setResolution( resolution );

			if ( rebound === 0 && this.constrainResolution_ ) {
				view.animate( {
					resolution : view.constrainResolution( resolution, delta > 0 ? -1 : 1 ),
					easing : ol.easing.easeOut,
					anchor : this.lastAnchor_,
					duration : this.duration_
				} );
			}

			if ( rebound > 0 ) {
				view.animate( {
					resolution : minResolution,
					easing : ol.easing.easeOut,
					anchor : this.lastAnchor_,
					duration : 500
				} );
			} else if ( rebound < 0 ) {
				view.animate( {
					resolution : maxResolution,
					easing : ol.easing.easeOut,
					anchor : this.lastAnchor_,
					duration : 500
				} );
			}
			this.startTime_ = now;
			return false;
		}

		this.delta_ += delta;

		var timeLeft = Math.max( this.timeout_ - ( now - this.startTime_ ), 0 );

		clearTimeout( this.timeoutId_ );
		this.timeoutId_ = setTimeout( this.handleWheelZoom_.bind( this, map ), timeLeft );

		return false;
	};

} )();

( function() {
	"use strict";


	/**
	 * @constructor
	 * @extends {ol.interaction.Pointer}
	 */
	ol.interaction.njMapPointer = function(opt_options) {
		var options = opt_options || {};

		ol.interaction.Pointer.call( this, {
			handleEvent : ol.interaction.njMapPointer.prototype.handleEvent,
			handleDownEvent : ol.interaction.njMapPointer.prototype.handleDownEvent,
			handleDragEvent : ol.interaction.njMapPointer.prototype.handleDragEvent,
			handleMoveEvent : ol.interaction.njMapPointer.prototype.handleMoveEvent,
			handleUpEvent : ol.interaction.njMapPointer.prototype.handleUpEvent
		} );

		/**
		 * @type {Function}
		 * @private
		 */
		this.dragEnd_ = options.dragEnd ? options.dragEnd : null;

		/**
		 * @type {Function}
		 * @private
		 */
		this.clickEnd_ = options.clickEnd ? options.clickEnd : null;

		/**
		 * @type {layerFilter}
		 * @private
		 */
		this.layerFilter_ = null;


		/**
		 * @type {ol.Pixel}
		 * @private
		 */
		this.coordinate_ = null;

		/**
		 * @type {string|undefined}
		 * @private
		 */
		this.cursor_ = 'pointer';

		/**
		 * @type {ol.Feature}
		 * @private
		 */
		this.feature_ = null;

		/**
		 * @type {string|undefined}
		 * @private
		 */
		this.previousCursor_ = null;


		if ( options.layers ) {
			if ( typeof options.layers === 'function' ) {
				this.layerFilter_ = options.layers;
			} else {
				var layers = options.layers;
				this.layerFilter_ = function(layer) {
					return ol.array.includes( layers, layer );
				};
			}
		} else {
			this.layerFilter_ = ol.functions.TRUE;
		}

	};
	ol.inherits( ol.interaction.njMapPointer, ol.interaction.Pointer );


	/**
	 * @param {ol.MapBrowserEvent} evt Map browser event.
	 * @return {boolean} `true` to start the drag sequence.
	 */
	ol.interaction.njMapPointer.prototype.handleDownEvent = function(evt) {
		var map = evt.map;

		var feature = map.forEachFeatureAtPixel( evt.pixel, ( function(feature, layer) {
			if ( ol.functions.TRUE( feature, layer ) ) {
				if ( feature ) {
					this.feature_ = feature;
					this.coordinate_ = evt.coordinate;

					return feature;
				}
			}
		} ).bind( this ), {
			layerFilter : this.layerFilter_,
			hitTolerance : 0
		} );

		return !!feature;
	};


	/**
	 * @param {ol.MapBrowserEvent} evt Map browser event.
	 */
	ol.interaction.njMapPointer.prototype.handleDragEvent = function(evt) {
		var olMap = evt.map;

		if ( this.dragEnd_ && this.feature_ ) {
			var deltaX = evt.coordinate[ 0 ] - this.coordinate_[ 0 ];
			var deltaY = evt.coordinate[ 1 ] - this.coordinate_[ 1 ];

			var geometry = this.feature_.getGeometry();
			geometry.translate( deltaX, deltaY );

			this.coordinate_[ 0 ] = evt.coordinate[ 0 ];
			this.coordinate_[ 1 ] = evt.coordinate[ 1 ];

			this.dragEnd_.call( this, this.feature_ );
		}

		return true;
	};


	/**
	 * @param {ol.MapBrowserEvent} evt Event.
	 */
	ol.interaction.njMapPointer.prototype.handleMoveEvent = function(evt) {
		if ( this.cursor_ ) {
			var map = evt.map;
			var element = map.getViewport();

			var feature = map.forEachFeatureAtPixel( evt.pixel, ( function(feature, layer) {
				if ( ol.functions.TRUE( feature, layer ) ) {
					if ( feature ) {
						return feature;
					}
				}
			} ).bind( this ), {
				layerFilter : this.layerFilter_,
				hitTolerance : 0
			} );

			if ( feature ) {
				if ( element.style.cursor != this.cursor_ ) {
					this.previousCursor_ = element.style.cursor;
					element.style.cursor = this.cursor_;
				}
			} else if ( this.previousCursor_ !== undefined ) {
				element.style.cursor = this.previousCursor_;
				this.previousCursor_ = undefined;
			}
		}
	};


	/**
	 * @return {boolean} `false` to stop the drag sequence.
	 */
	ol.interaction.njMapPointer.prototype.handleUpEvent = function() {
		this.coordinate_ = null;
		this.feature_ = null;

		return false;
	};


	ol.interaction.njMapPointer.prototype.handleEvent = function(mapBrowserEvent) {
		if ( !( mapBrowserEvent instanceof ol.MapBrowserPointerEvent ) ) {
			return true;
		}

		var map = mapBrowserEvent.map;

		if ( this.clickEnd_ && ol.events.condition.singleClick( mapBrowserEvent ) ) {
			var feature = map.forEachFeatureAtPixel( mapBrowserEvent.pixel, ( function(feature, layer) {
				if ( ol.functions.TRUE( feature, layer ) ) {
					if ( feature ) {
						return feature;
					}
				}
			} ).bind( this ), {
				layerFilter : this.layerFilter_,
				hitTolerance : 0
			} );

			this.clickEnd_.call( this, feature );
		}

		var stopEvent = false;
		this.updateTrackedPointers_( mapBrowserEvent );
		if ( this.handlingDownUpSequence ) {
			if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERDRAG ) {
				this.handleDragEvent_( mapBrowserEvent );
			} else if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERUP ) {
				var handledUp = this.handleUpEvent_( mapBrowserEvent );
				this.handlingDownUpSequence = handledUp && this.targetPointers.length > 0;
			}
		} else {
			if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERDOWN ) {
				var handled = this.handleDownEvent_( mapBrowserEvent );
				this.handlingDownUpSequence = handled;
				stopEvent = this.shouldStopEvent( handled );
			} else if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERMOVE ) {
				this.handleMoveEvent_( mapBrowserEvent );
			}
		}

		return !stopEvent;
	};

} )();

/**
 * JavasScript Extensions
 * 
 * Author : Naji
 */
( function(window) {	
	
	/**
	 * element resize 감지 이벤트
	 */
	( function($) {
		var attachEvent = document.attachEvent, stylesCreated = false;

		var jQuery_resize = $.fn.resize;

		$.fn.resize = ( function(callback) {
			return this.each( function() {
				if ( this == window ) jQuery_resize.call( jQuery( this ), callback );
				else addResizeListener( this, callback );
			} );
		} );

		$.fn.removeResize = ( function(callback) {
			return this.each( function() {
				removeResizeListener( this, callback );
			} );
		} );

		if ( !attachEvent ) {
			var requestFrame = ( function() {
				var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) {
					return window.setTimeout( fn, 20 );
				};
				return function(fn) {
					return raf( fn );
				};
			} )();

			var cancelFrame = ( function() {
				var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
				return function(id) {
					return cancel( id );
				};
			} )();

			function resetTriggers(element) {
				var triggers = element.__resizeTriggers__, expand = triggers.firstElementChild, contract = triggers.lastElementChild, expandChild = expand.firstElementChild;
				contract.scrollLeft = contract.scrollWidth;
				contract.scrollTop = contract.scrollHeight;
				expandChild.style.width = expand.offsetWidth + 1 + 'px';
				expandChild.style.height = expand.offsetHeight + 1 + 'px';
				expand.scrollLeft = expand.scrollWidth;
				expand.scrollTop = expand.scrollHeight;
			}

			function checkTriggers(element) {
				return element.offsetWidth != element.__resizeLast__.width || element.offsetHeight != element.__resizeLast__.height;
			}

			function scrollListener(e) {
				var element = this;
				resetTriggers( this );
				if ( this.__resizeRAF__ ) cancelFrame( this.__resizeRAF__ );
				this.__resizeRAF__ = requestFrame( function() {
					if ( checkTriggers( element ) ) {
						element.__resizeLast__.width = element.offsetWidth;
						element.__resizeLast__.height = element.offsetHeight;
						element.__resizeListeners__.forEach( function(fn) {
							fn.call( element, e );
						} );
					}
				} );
			}

			/* Detect CSS Animations support to detect element display/re-attach */
			var animation = false, animationstring = 'animation', keyframeprefix = '', animationstartevent = 'animationstart', domPrefixes = 'Webkit Moz O ms'
					.split( ' ' ), startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split( ' ' ), pfx = '';
			{
				var elm = document.createElement( 'fakeelement' );
				if ( elm.style.animationName !== undefined ) {
					animation = true;
				}

				if ( animation === false ) {
					for ( var i = 0; i < domPrefixes.length; i++ ) {
						if ( elm.style[ domPrefixes[ i ] + 'AnimationName' ] !== undefined ) {
							pfx = domPrefixes[ i ];
							animationstring = pfx + 'Animation';
							keyframeprefix = '-' + pfx.toLowerCase() + '-';
							animationstartevent = startEvents[ i ];
							animation = true;
							break;
						}
					}
				}
			}

			var animationName = 'resizeanim';
			var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
			var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
		}

		function createStyles() {
			if ( !stylesCreated ) {
				// opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
				var css = ( animationKeyframes ? animationKeyframes : '' )
						+ '.resize-triggers { '
						+ ( animationStyle ? animationStyle : '' )
						+ 'visibility: hidden; opacity: 0; } '
						+ '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }', head = document.head
						|| document.getElementsByTagName( 'head' )[ 0 ], style = document.createElement( 'style' );

				style.type = 'text/css';
				if ( style.styleSheet ) {
					style.styleSheet.cssText = css;
				} else {
					style.appendChild( document.createTextNode( css ) );
				}

				head.appendChild( style );
				stylesCreated = true;
			}
		}

		window.addResizeListener = ( function(element, fn) {
			if ( attachEvent ) element.attachEvent( 'onresize', fn );
			else {
				if ( !element.__resizeTriggers__ ) {
					if ( getComputedStyle( element ).position == 'static' ) element.style.position = 'relative';
					createStyles();
					element.__resizeLast__ = {};
					element.__resizeListeners__ = [];
					( element.__resizeTriggers__ = document.createElement( 'div' ) ).className = 'resize-triggers';
					element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' + '<div class="contract-trigger"></div>';
					element.appendChild( element.__resizeTriggers__ );
					resetTriggers( element );
					element.addEventListener( 'scroll', scrollListener, true );

					/* Listen for a css animation to detect element display/re-attach */
					animationstartevent && element.__resizeTriggers__.addEventListener( animationstartevent, function(e) {
						if ( e.animationName == animationName ) resetTriggers( element );
					} );
				}
				element.__resizeListeners__.push( fn );
			}
		} );

		window.removeResizeListener = ( function(element, fn) {
			if ( attachEvent ) element.detachEvent( 'onresize', fn );
			else {
				element.__resizeListeners__.splice( element.__resizeListeners__.indexOf( fn ), 1 );
				if ( !element.__resizeListeners__.length ) {
					element.removeEventListener( 'scroll', scrollListener );
					element.__resizeTriggers__ = !element.removeChild( element.__resizeTriggers__ );
				}
			}
		} );
	}( jQuery ) );

} )( window );

( function() {
	"use strict";

	/**
	 * njMapsPlatform 지도 객체.
	 * 
	 * 다양한 타입의 레이어({@link naji.layer})를 추가할 수 있으며, 지도의 기본 객체이다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMap = new naji.njMap( {
	 * 	target : 'map',
	 * 	crs : 'EPSG:3857',
	 * 	center : [ 0, 0 ],
	 * 	useMaxExtent : true,
	 * 	useAltKeyOnly : false
	 * } );
	 * 
	 * // ol.Map 객체에 직접 접근
	 * njMap.getMap().addLayer( new ol.layer.Tile( {
	 * 	source : new ol.source.OSM()
	 * } ) );
	 * 
	 * // njMap에 WMS 레이어 추가
	 * njMap.addWMSLayer( {
	 * 	layer : new naji.layer.njMapWMSLayer( {...} )
	 * 	...
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.crs {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.center {Array.<Number>} 중심점. Default is `[0, 0]`.
	 * @param opt_options.target {String} 지도가 그려질 DIV ID.
	 * @param opt_options.useAltKeyOnly {Boolean} 마우스 휠줌 스크롤 시 AltKey 조합 설정 사용 여부.
	 * 
	 * `true`면 AltKey를 누를 상태에서만 마우스 휠줌 스크롤 사용이 가능하다. Default is `false`.
	 * 
	 * @param opt_options.useMaxExtent {Boolean} 이동할 수 있는 영역을 해당 좌표계의 최대 영역으로 한정한다. Default is `false`.
	 * 
	 * @class
	 */
	naji.njMap = ( function(opt_options) {
		var _self = this;

		this.olMap = null;
		this.mapCRS = null;
		this.maxExtent = null;
		this.useAltKeyOnly = null;

		this.layers = null;
		this.dataViewId = null;
		this.loadingSrcDiv = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.layers = [];
			_self.mapCRS = ( options.crs !== undefined ) ? options.crs.toUpperCase() : "EPSG:3857";
			_self.maxExtent = ol.proj.get( _self.mapCRS ).getExtent();
			_self.useAltKeyOnly = ( typeof ( options.useAltKeyOnly ) === "boolean" ) ? options.useAltKeyOnly : false;

			var center = options.center;
			if ( !Array.isArray( center ) ) {
				center = [ 0, 0 ];
			}

			var maxExtent = ( options.useMaxExtent ) ? ol.proj.get( _self.mapCRS ).getExtent() : undefined;
			
			var view = new ol.View( {
				zoom : 2,
				center : center,
				extent : maxExtent,
				projection : _self.mapCRS
			} );

			_self.olMap = new ol.Map( {
				target : options.target,
				layers : [],
				renderer : "canvas",
				controls : _self._createDefaultControls(),
				interactions : _self._createDefaultInteractions(),
				view : view
			} );

			_self.dataViewId = _self.olMap.getViewport().getAttribute("data-view");

			_self._createScrollElement();
			_self._createLoadingElement();

			/**
			 * view 변경 시 overlay transform
			 * 
			 * 로딩 심볼 초기화
			 */
			_self.olMap.on( "change:view", function() {
				var newProjection = _self.olMap.getView().getProjection().getCode();
				_self.mapCRS = newProjection;
				_self.maxExtent = ol.proj.get( _self.mapCRS ).getExtent();
				
				var overlays = _self.olMap.getOverlays().getArray();
				for ( var i = overlays.length - 1; i >= 0; i-- ) {
					var origin = overlays[ i ].get( "origin" );
					if ( origin ) {
						var position = ol.proj.transform( origin[ "position" ], origin[ "projection" ], _self.mapCRS );
						overlays[ i ].setPosition( position );
						overlays[ i ].set( "CRS", _self.mapCRS );
					}
				}

				naji.njMapConfig.resetLoading( _self.dataViewId );
			} );


			var tag = ( options.target instanceof Element ) ? options.target : "#" + options.target;

			_self.dataViewId = ol.getUid( view );

			_$( tag ).resize( function() {
				_self.refresh();
			} );

			_$( window ).resize( function() {
				_self.refresh();
			} );

			console.log( "####### njMap Init #######" );
			console.log( "Projection : " + _self.mapCRS );
		} )();
		// END initialize


		return {
			_this : _self,
			refresh : _self.refresh,
			getCRS : _self.getCRS,
			getResolutions : _self.getResolutions,
			getMatrixIds : _self.getMatrixIds,
			getMap : _self.getMap,
			getMaxExtent : _self.getMaxExtent,
			setExtent : _self.setExtent,
			getLayers : _self.getLayers,
			getLayerById : _self.getLayerById,
			getLayerByName : _self.getLayerByName,
			getLayerByKey : _self.getLayerByKey,
			setAltKeyOnly : _self.setAltKeyOnly,
			removeLayer : _self.removeLayer,
			addWMSLayer : _self.addWMSLayer,
			addWFSLayer : _self.addWFSLayer,
			addWCSLayer : _self.addWCSLayer,
			addGSSWMTSLayer : _self.addGSSWMTSLayer,
			addWMTSLayer : _self.addWMTSLayer,
			addVectorLayer : _self.addVectorLayer,
			addClusterLayer : _self.addClusterLayer,
			addVector3DLayer : _self.addVector3DLayer,
			calculateScale : _self.calculateScale,
			getDataViewId : _self.getDataViewId,
			getScaleForZoom : _self.getScaleForZoom,
			setLoadingVisible : _self.setLoadingVisible,
			removeAllListener : _self.removeAllListener,
			removeAllInteraction : _self.removeAllInteraction,
			setActiveAllInteraction : _self.setActiveAllInteraction
		}

	} );


	/**
	 * 지도 영역 스크롤 이벤트 Element
	 * 
	 * @private
	 */
	naji.njMap.prototype._createScrollElement = function() {
		var _self = this._this || this;

		var selector = '.ol-viewport[data-view="' + _self.dataViewId + '"]';
		var element = document.querySelector( selector );

		var altEmpty = document.createElement( "div" );
		altEmpty.setAttribute( "altText", "" );
		altEmpty.style.top = "0px";
		altEmpty.style.zIndex = 2;
		altEmpty.style.opacity = 0;
		altEmpty.style.width = "100%";
		altEmpty.style.height = "100%";
		altEmpty.style.position = "absolute";
		altEmpty.style.pointerEvents = "none";
		altEmpty.style.transitionDuration = "1s";
		altEmpty.style.backgroundColor = "rgba( 0, 0, 0, 0.5 )";

		var text = document.createElement( "p" );
		text.textContent = "지도를 확대/축소하려면 Alt를 누른 채 스크롤하세요.";
		text.style.left = "0px";
		text.style.right = "0px";
		text.style.top = "50%";
		text.style.color = "white";
		text.style.fontSize = "25px";
		text.style.margin = "0 auto";
		text.style.textAlign = "center";
		text.style.position = "absolute";
		text.style.transform = "translateY(-50%)";

		altEmpty.appendChild( text );

		element.insertBefore( altEmpty, element.firstChild );

		_self.olMap.scrollCallBack = new _scrollCallBack( altEmpty, function() {
			return _self.useAltKeyOnly
		} );

		function _scrollCallBack(altElement_, getAltKeyOnly_) {
			var _this = this;

			this.tId = null;
			this.altElement = null;
			this.getAltKeyOnly = null;

			( function(altElement_, getAltKeyOnly_) {
				_this.altElement = altElement_;
				_this.getAltKeyOnly = getAltKeyOnly_;
			} )( altElement_, getAltKeyOnly_ );

			function _none() {
				_this.altElement.style.opacity = 0;
				_this.altElement.style.transitionDuration = "0.8s";
			}

			this.run = function() {
				_this.altElement.style.opacity = 1;
				_this.altElement.style.transitionDuration = "0.3s";

				window.clearTimeout( _this.tId );

				_this.tId = window.setTimeout( function() {
					_none();
				}, 1500 );
			};

			this.clear = function() {
				window.clearTimeout( _this.tId );
				_none();
			};


			return {
				run : _this.run,
				clear : _this.clear,
				getAltKeyOnly : _this.getAltKeyOnly
			}
		}
	};


	/**
	 * 로딩 심볼 Element
	 * 
	 * @private
	 */
	naji.njMap.prototype._createLoadingElement = function() {
		var _self = this._this || this;

		var selector = '.ol-viewport[data-view="' + _self.dataViewId + '"]';
		var element = document.querySelector( selector );

		var loadingDiv = document.createElement( "div" );
		loadingDiv.id = "loadingDIV";
		loadingDiv.style.zIndex = 1;
		loadingDiv.style.top = "0px";
		loadingDiv.style.left = "0px";
		loadingDiv.style.right = "0px";
		loadingDiv.style.bottom = "0px";
		loadingDiv.style.display = "none";
		loadingDiv.style.margin = "auto";
		loadingDiv.style.position = "absolute";
		loadingDiv.style.pointerEvents = "none";

		_self.loadingSrcDiv = new Image();
		_self.loadingSrcDiv.src = naji.njMapConfig.getLoadingImg();
		_self.loadingSrcDiv.onload = function(evt) {
			loadingDiv.style.width = evt.target.width + "px";
			loadingDiv.style.height = evt.target.height + "px";

			loadingDiv.appendChild( _self.loadingSrcDiv );
			element.insertBefore( loadingDiv, element.firstChild );
		};

		naji.njMapConfig.addProgress( ol.getUid(_self.olMap.getView()), function(state_) {
			if ( state_ ) {
				loadingDiv.style.display = "block";
			} else {
				loadingDiv.style.display = "none";
			}
		} );
	};


	/**
	 * Default Interactions 설정.
	 * 
	 * -베이스맵(배경지도)과 자연스러운 싱크를 맞추기 위해 각 Interaction의 기본 효과 제거.
	 * 
	 * -모든 Intercation 삭제 시 꼭 필요한 Interaction은 제외하기 위해 속성값 추가.
	 * 
	 * @private
	 * 
	 * @return interactions {Array.<ol.interaction.Interaction>}
	 */
	naji.njMap.prototype._createDefaultInteractions = function() {
		var interactions = [ new ol.interaction.DragPan( {
			kinetic : false
		} ), new ol.interaction.DragZoom( {
			duration : 0,
			condition : ol.events.condition.shiftKeyOnly
		} ), new ol.interaction.DragRotate( {
			duration : 0
		} ), new ol.interaction.DoubleClickZoom( {
			duration : 0
		} ), new ol.interaction.MouseWheelZoom( {
			duration : 0,
			constrainResolution : true
		} ), new ol.interaction.PinchZoom( {
			duration : 0,
			constrainResolution : true
		} ), new ol.interaction.PinchRotate( {
			duration : 0
		} ) ];

		for ( var i in interactions ) {
			interactions[ i ].set( "necessary", true );
		}

		return interactions;
	};


	/**
	 * Default Controls 설정.
	 * 
	 * -베이스맵(배경지도)과 자연스러운 싱크를 맞추기 위해 각 Control의 기본 효과 제거.
	 * 
	 * -모든 Control 삭제 시 꼭 필요한 Control은 제외하기 위해 속성값 추가.
	 * 
	 * @private
	 * 
	 * @return controls {Array.<ol.control.Control>}
	 */
	naji.njMap.prototype._createDefaultControls = function() {
		var controls = [ new ol.control.Rotate(), new ol.control.Zoom( {
			duration : 0
		} ) ];

		for ( var i in controls ) {
			controls[ i ].set( "necessary", true );
		}

		return controls;
	};


	/**
	 * 현재 {@link naji.njMap}에 설정된 ol.Map 객체를 가져온다.
	 * 
	 * @return olMap {ol.Map} ol.Map 객체.
	 */
	naji.njMap.prototype.getMap = function() {
		var _self = this._this || this;
		return _self.olMap;
	};

	/**
	 * 현재 지도 좌표계의 Resolutions 객체를 가져온다.
	 * 
	 * @param tileSize {Integer} 타일 사이즈. (256, 512)
	 * 
	 * @return Resolutions {Array} 객체.
	 */
	naji.njMap.prototype.getResolutions = function( tileSize ) {
		var _self = this._this || this;
		var size = ol.extent.getWidth( _self.maxExtent ) / tileSize;
		
		var resolutions = new Array(_self.olMap.getView().getMaxZoom());
		
		for (var i = 0; i < _self.olMap.getView().getMaxZoom(); ++i) {
			resolutions[i] = size / Math.pow(2, i);
		}
		
		return resolutions;

	};
	
	/**
	 * 현재 지도 좌표계의 MatrixIds 객체를 가져온다.
	 * 
	 * @return MatrixIds {Array} 객체.
	 */
	naji.njMap.prototype.getMatrixIds = function() {
		var _self = this._this || this;
		var matrixIds = new Array(_self.olMap.getView().getMaxZoom());
		
		for (var i = 0; i < _self.olMap.getView().getMaxZoom(); ++i) {
			matrixIds[i] = '' + i;
		}
		
		return matrixIds;
	};
	
	/**
	 * 현재 지도 좌표계를 가져온다.
	 * 
	 * @return mapCRS {String} 현재 지도 좌표계.
	 */
	naji.njMap.prototype.getCRS = function() {
		var _self = this._this || this;
		return _self.mapCRS;
	};

	/**
	 * 현재 지도의 MaxExtent를 가져온다.
	 * 
	 * @return envelop {Array.<Double>} Extent.
	 */
	naji.njMap.prototype.getMaxExtent = function() {
		var _self = this._this || this;
		return _self.maxExtent;
	};

	/**
	 * 지정된 Extent로 지도 영역 맞추기.
	 * 
	 * @param envelop {Array.<Double>} Extent.
	 */
	naji.njMap.prototype.setExtent = function(envelop_) {
		var _self = this._this || this;
		_self.olMap.getView().fit( envelop_ );
	};


	/**
	 * 현재 {@link naji.njMap}에 추가된 {@link naji.layer} 목록을 가져온다.
	 * 
	 * @param layerType {String} 레이어 타입. (WMS, WFS, WMTS, Vector...)
	 * 
	 * @return layers {Array.<naji.layer>} 레이어 목록.
	 */
	naji.njMap.prototype.getLayers = function(layerType_) {
		var _self = this._this || this;

		var layers = [];

		if ( _self.layers && layerType_ ) {
			for ( var i in _self.layers ) {
				var layer = _self.layers[ i ];
				if ( layer.getLayerType() === layerType_ ) {
					layers.push( layer );
				}
			}
		} else {
			layers = _self.layers;
		}

		return layers;
	};


	/**
	 * 현재 {@link naji.njMap}에 추가된 {@link naji.layer}를 Id 이용하여 가져온다.
	 * 
	 * @param layerId {String} 레이어 Id.
	 * 
	 * @return layer {naji.layer} 레이어.
	 */
	naji.njMap.prototype.getLayerById = function(layerId_) {
		var _self = this._this || this;

		var rLayer = null;

		if ( _self.layers ) {
			for ( var i in _self.layers ) {
				var layer = _self.layers[ i ];
				if ( layer.getId() === layerId_ ) {
					rLayer = layer;
				}
			}
		}

		return rLayer;
	};

	/**
	 * 현재 {@link naji.njMap}에 추가된 {@link naji.layer}를 이름을 이용하여 가져온다.
	 * 
	 * @param layerName {String} 레이어 명.
	 * 
	 * @return layer {naji.layer} 레이어.
	 */
	naji.njMap.prototype.getLayerByName = function(layerName_) {
		var _self = this._this || this;

		var rLayer = null;

		if ( _self.layers ) {
			for ( var i in _self.layers ) {
				var layer = _self.layers[ i ];
				if ( layer.getName() === layerName_ ) {
					rLayer = layer;
				}
			}
		}

		return rLayer;
	};

	/**
	 * 현재 {@link naji.njMap}에 추가된 {@link naji.layer}를 Key를 이용하여 가져온다.
	 * 
	 * @param layerKey {String} 레이어 Key.
	 * 
	 * @return layer {naji.layer} 레이어.
	 */
	naji.njMap.prototype.getLayerByKey = function(layerKey_) {
		var _self = this._this || this;

		var rLayer = null;

		if ( _self.layers ) {
			for ( var i in _self.layers ) {
				var layer = _self.layers[ i ];
				if ( layer.getLayerKey() === layerKey_ ) {
					rLayer = layer;
				}
			}
		}

		return rLayer;
	};

	/**
	 * WMS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapWMSLayer} {@link naji.layer.njMapWMSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.resolution {Float} 레이어 추가 후 설정될 resolution.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link naji.service.njMapGetCapabilitiesWMS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addWMSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;
		var resolution = ( options.resolution !== undefined ) ? options.resolution : undefined;

		var deferred = _$.Deferred();

		try {
			_self.olMap.addLayer( layer.getOlLayer() );
			_self.layers.push( layer );

			var source = layer.getOlLayer().getSource();
			source.on( [ "imageloadstart", "tileloadstart" ], function(evt) {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( [ "imageloadend", "tileloadend" ], function() {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( [ "imageloaderror", "tileloaderror" ], function() {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, false );
				}
			} );


			/**
			 * extent로 이동
			 */
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent ) ) {
					for ( var i in extent ) {
						extent[ i ] = parseFloat( extent[ i ] );
					}

					_self.setExtent( extent );

					if ( resolution ) {
						_olMap.getView().setResolution( resolution );
					}
				} else {
					var capabilities = new naji.service.njMapGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : layer.getServiceURL(),
						dataViewId : _self.dataViewId
					} );

					capabilities.then(
							function(result_) {

								if ( result_.state ) {
									var transExtent = ol.proj.transformExtent( capabilities.data.serviceMetaData.maxExtent,
											capabilities.data.serviceMetaData.crs, _self.mapCRS );
									_self.setExtent( transExtent );
								} else {
									naji.njMapConfig.alert_Error( result_.message );
									deferred.reject( result_.message );
									return deferred.promise();
								}

							} ).fail( function(e) {
						naji.njMapConfig.alert_Error( "Error : " + e );
						deferred.reject( false );
						return deferred.promise();
					} );
				}

			}

			deferred.resolve( true );

		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WFS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapWFSLayer} {@link naji.layer.njMapWFSLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addWFSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olWFSLayer = layer.getOlLayer();
			_self.olMap.addLayer( olWFSLayer );
			_self.layers.push( layer );

			var uFeatures = layer.getFeatures( _self.dataViewId );

			uFeatures.then( function(result_) {

				if ( result_.state ) {
					olWFSLayer.getSource().addFeatures( result_.features );

					if ( useExtent ) {
						var transExtent = ol.proj.transformExtent( olWFSLayer.getSource().getExtent(), layer.srsName, _self.mapCRS );
						_self.setExtent( transExtent );
					}

					deferred.resolve( true );
				} else {
					naji.njMapConfig.alert_Error( result_.message );
					deferred.reject( result_.message );
					return deferred.promise();
				}

			} ).fail( function(e) {
				naji.njMapConfig.alert_Error( "Error : " + e );
				deferred.reject( false );
				return deferred.promise();
			} );

		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WCS 레이어 추가
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapWCSLayer} {@link naji.layer.njMapWCSLayer} 객체.
	 * @param opt_options.extent {Array} 레이어 추가 후 설정될 extent.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부. Default is `false`.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link naji.service.njMapGetCapabilitiesWCS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addWCSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;

		var deferred = _$.Deferred();

		try {
			var olWCSLayer = layer.getOlLayer();

			if ( layer.getBoundingBox() && layer.getBoundingBox().length > 3 ) {

				_self.olMap.addLayer( olWCSLayer );
				_self.layers.push( layer );

				layer.setMap( _self.olMap, _load );

				var extent = ol.proj.transformExtent( layer.getBoundingBox(), "EPSG:4326", _self.getCRS() );
				setExtent( extent );
				deferred.resolve( true );
			} else {
				var capabilities = new naji.service.njMapGetCapabilitiesWCS( {
					useProxy : true,
					version : layer.version,
					serviceURL : layer.getServiceURL(),
					dataViewId : _self.dataViewId
				} );

				capabilities.then( function(result_) {

					if ( result_.state ) {

						var serviceMetaData = capabilities.data.serviceMetaData;
						var coverageList = serviceMetaData.coverages;

						for ( var i in coverageList ) {
							if ( coverageList[ i ][ "Identifier" ] === layer.identifier ) {
								layer.setBoundingBox( coverageList[ i ][ "BBOX" ] );
								break;
							}
						}

						_self.olMap.addLayer( olWCSLayer );
						_self.layers.push( layer );

						layer.setMap( _self.olMap, _load );

						if ( extent && Array.isArray( extent ) ) {
							setExtent( extent );
						} else {
							var extent = ol.proj.transformExtent( layer.getBoundingBox(), "EPSG:4326", _self.getCRS() );
							setExtent( extent );
						}

						deferred.resolve( true );

					} else {
						naji.njMapConfig.alert_Error( result_.message );
						_self.deferred.reject( result_.message );
						return deferred.promise();
					}

				} );
			}

			deferred.resolve( true );

		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}


		function setExtent(extent_) {
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent_ ) ) {
					for ( var i in extent_ ) {
						extent_[ i ] = parseFloat( extent_[ i ] );
					}
					_self.setExtent( extent_ );
				}

			}
		}


		function _load(state_) {
			if ( naji.njMapConfig.isUseLoading() ) {
				naji.njMapConfig.loading( _self.dataViewId, state_ );
			}
		}

		return deferred.promise();
	};

	/**
	 * GSS WMTS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapWMSLayer} {@link naji.layer.njMapGSSWMTSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.resolution {Float} 레이어 추가 후 설정될 resolution.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addGSSWMTSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;
		var resolution = ( options.resolution !== undefined ) ? options.resolution : undefined;

		var deferred = _$.Deferred();

		try {
			_self.olMap.addLayer( layer.getOlLayer() );
			_self.layers.push( layer );

			var source = layer.getOlLayer().getSource();
			source.on( [ "imageloadstart", "tileloadstart" ], function(evt) {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( [ "imageloadend", "tileloadend" ], function() {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( [ "imageloaderror", "tileloaderror" ], function() {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, false );
				}
			} );


			/**
			 * extent로 이동
			 */
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent ) ) {
					for ( var i in extent ) {
						extent[ i ] = parseFloat( extent[ i ] );
					}

					_self.setExtent( extent );

					if ( resolution ) {
						_olMap.getView().setResolution( resolution );
					}
				} else {
					var capabilities = new naji.service.njMapGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : layer.getServiceURL(),
						dataViewId : _self.dataViewId
					} );

					capabilities.then(
							function(result_) {

								if ( result_.state ) {
									var transExtent = ol.proj.transformExtent( capabilities.data.serviceMetaData.maxExtent,
											capabilities.data.serviceMetaData.crs, _self.mapCRS );
									_self.setExtent( transExtent );
								} else {
									naji.njMapConfig.alert_Error( result_.message );
									deferred.reject( result_.message );
									return deferred.promise();
								}

							} ).fail( function(e) {
						naji.njMapConfig.alert_Error( "Error : " + e );
						deferred.reject( false );
						return deferred.promise();
					} );
				}

			}

			deferred.resolve( true );

		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WMTS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapWMTSLayer} {@link naji.layer.njMapWMTSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link naji.service.njMapGetCapabilitiesWMTS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addWMTSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;

		var deferred = _$.Deferred();

		try {
			var olWMTSLayer = layer.getOlLayer();

			if ( layer.getWmtsCapabilities() && layer.getOriginExtent() ) {
				layer.update( true );
				_self.olMap.addLayer( olWMTSLayer );
				_self.layers.push( layer );
				var extent = ol.proj.transformExtent( layer.getOriginExtent(), "EPSG:4326", _self.getCRS() );
				setExtent( extent );
				setOn();
				deferred.resolve( true );
			} else {
				var capabilities = new naji.service.njMapGetCapabilitiesWMTS( {
					useProxy : true,
					version : layer.version,
					serviceURL : layer.getServiceURL(),
					dataViewId : _self.dataViewId
				} );

				capabilities.then( function(result_) {

					if ( result_.state ) {

						var layers = capabilities.data.olJson.Contents.Layer;

						for ( var i in layers ) {
							if ( layers[ i ][ "Identifier" ] === layer.layer ) {
								layer.setOriginExtent( layers[ i ][ "WGS84BoundingBox" ] );
								break;
							}
						}

						layer.setWmtsCapabilities( capabilities.data );

						layer.update( true );

						_self.olMap.addLayer( olWMTSLayer );
						_self.layers.push( layer );

						if ( extent && Array.isArray( extent ) ) {
							setExtent( extent );
						} else {
							var extent = ol.proj.transformExtent( layer.getOriginExtent(), "EPSG:4326", _self.getCRS() );
							setExtent( extent );
						}

						setOn();

						deferred.resolve( true );

					} else {
						naji.njMapConfig.alert_Error( result_.message );
						_self.deferred.reject( result_.message );
						return deferred.promise();
					}

				} );
			}

			// deferred.resolve( true );

		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}


		function setExtent(extent_) {
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent_ ) ) {
					for ( var i in extent_ ) {
						extent_[ i ] = parseFloat( extent_[ i ] );
					}
					_self.setExtent( extent_ );
				}

			}
		}

		function setOn() {
			var source = layer.getOlLayer().getSource();
			source.on( "tileloadstart", function(evt) {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( "tileloadend", function() {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( "tileloaderror", function() {
				if ( naji.njMapConfig.isUseLoading() ) {
					naji.njMapConfig.loading( _self.dataViewId, false );
				}
			} );
		}

		return deferred.promise();
	};


	/**
	 * Vector 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapVectorLayer} {@link naji.layer.njMapVectorLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addVectorLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olVectorLayer = layer.getOlLayer();
			_self.olMap.addLayer( olVectorLayer );
			_self.layers.push( layer );

			if ( useExtent ) {
				var extent = olVectorLayer.getSource().getExtent();

				if ( extent && extent[ 0 ] !== Infinity ) {
					var transExtent = ol.proj.transformExtent( olVectorLayer.getSource().getExtent(), layer.srsName, _self.mapCRS );
					_self.setExtent( transExtent );
				}
			}

			deferred.resolve( true );
		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};
	
	
	/**
	 * Vector3D 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.layer {naji.layer.njMapVector3DLayer} {@link naji.layer.njMapVector3DLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addVector3DLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var layer = ( options.layer !== undefined ) ? options.layer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olVectorLayer = layer.getOlLayer();
			_self.olMap.addLayer( olVectorLayer );
			_self.layers.push( layer );

			if ( useExtent ) {
				var extent = olVectorLayer.getSource().getExtent();

				if ( extent && extent[ 0 ] !== Infinity ) {
					var transExtent = ol.proj.transformExtent( olVectorLayer.getSource().getExtent(), layer.srsName, _self.mapCRS );
					_self.setExtent( transExtent );
				}
			}

			deferred.resolve( true );
		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * Cluster 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uClusterLayer {naji.layer.njMapClusterLayer} {@link naji.layer.njMapClusterLayer} 객체.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	naji.njMap.prototype.addClusterLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uClusterLayer = ( options.uClusterLayer !== undefined ) ? options.uClusterLayer : undefined;

		var deferred = _$.Deferred();

		try {
			var olClusterLayer = uClusterLayer.getOlLayer();
			_self.olMap.addLayer( olClusterLayer );
			_self.layers.push( uClusterLayer );

			deferred.resolve( true );
		} catch ( e ) {
			naji.njMapConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * 지도 새로고침.
	 */
	naji.njMap.prototype.refresh = function() {
		var _self = this._this || this;

		if ( _self.olMap ) {
			var view = _self.olMap.getView();
			view.dispatchEvent( {
				type : 'change:center'
			} );

			view.dispatchEvent( {
				type : 'change:rotation'
			} );

			view.dispatchEvent( {
				type : 'change:resolution'
			} );

			_self.olMap.updateSize();
		}
	};


	/**
	 * 현재 {@link naji.njMap}에 등록된 {@link naji.layer}를 삭제한다.
	 * 
	 * @param njMapLayerKey {String} 삭제할 {@link naji.layer}의 KEY.
	 */
	naji.njMap.prototype.removeLayer = function(njMapLayerKey_) {
		var _self = this._this || this;

		for ( var i = 0; i < _self.layers.length; i++ ) {
			var njMapLayer = _self.layers[ i ];

			if ( njMapLayer.getLayerKey() === njMapLayerKey_ ) {
				njMapLayer.destroy();
				_self.olMap.removeLayer( njMapLayer.getOlLayer() );
				_self.layers.splice( i, 1 );
			}
		}
	};


	/**
	 * Temp Scale -> Resolution
	 * 
	 * @param scale {Double} scale
	 * 
	 * @private
	 * 
	 * @return resolution {Double} resolution
	 */
	naji.njMap.prototype.getResolutionFromScale = function(scale_) {
		var projection = _self.olMap.getView().getProjection();
		var metersPerUnit = projection.getMetersPerUnit();
		var inchesPerMeter = 39.37;
		var dpi = 96;
		return scale_ / ( metersPerUnit * inchesPerMeter * dpi );
	};


	/**
	 * Temp Resolution -> Scale
	 * 
	 * @param resolution {Double} resolution
	 * 
	 * @private
	 * 
	 * @return scale {Double} scale
	 */
	naji.njMap.prototype.getScaleFromResolution = function(resolution_) {
		var projection = _self.olMap.getView().getProjection();
		var metersPerUnit = projection.getMetersPerUnit();
		var inchesPerMeter = 39.37;
		var dpi = 96;
		return resolution_ * ( metersPerUnit * inchesPerMeter * dpi );
	};


	/**
	 * 현재 지도에서 해당 Extent의 스케일을 계산한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.extent {Array.<Number>} 스케일을 계산할 Extent. Default is 현재 지도 영역.
	 * @param opt_options.originCRS {String} 레이어 원본 좌표계. Default is 현재 지도 좌표계.
	 * 
	 * @return scale {Double} 스케일.
	 */
	naji.njMap.prototype.calculateScale = function(opt_options) {
		var _self = this._this || this;

		var scale = null;
		var extent = null;
		var viewCRS = null;
		var originCRS = null;
		var PPI = 0.000264583;

		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			viewCRS = _self.mapCRS;
			originCRS = ( options.originCRS !== undefined ) ? options.originCRS : _self.getCRS();
			extent = ( options.extent !== undefined ) ? options.extent : _self.olMap.getView().calculateExtent( _self.olMap.getSize() );

			var mapDistance;
			var canvasDistance;

			var eWidth = ol.extent.getWidth( extent );
			var eHeight = ol.extent.getHeight( extent );

			var pixelWidth = _self.olMap.getSize()[ 0 ];
			var pixelHeight = _self.olMap.getSize()[ 1 ];

			var resX = eWidth / pixelWidth;
			var resY = eHeight / pixelHeight;

			if ( resX >= resY ) {
				mapDistance = _getMapWidthInMeter();
				canvasDistance = pixelWidth * PPI;
				scale = mapDistance / canvasDistance;
			} else {
				mapDistance = _getMapHeightInMeter();
				canvasDistance = pixelHeight * PPI;
				scale = mapDistance / canvasDistance;
			}

		} )( opt_options );


		function _getMapWidthInMeter() {
			var p1 = [ extent[ 0 ], extent[ 1 ] ];
			var p2 = [ extent[ 2 ], extent[ 1 ] ];

			return _getDistanceInMeter( p1, p2 );
		}


		function _getMapHeightInMeter() {
			var p1 = [ extent[ 0 ], extent[ 1 ] ];
			var p2 = [ extent[ 0 ], extent[ 3 ] ];

			return _getDistanceInMeter( p1, p2 );
		}


		function _getDistanceInMeter(p1_, p2_) {
			var latLon1 = _getLatLon( p1_ );
			var latLon2 = _getLatLon( p2_ );

			var dx = latLon2[ 0 ] - latLon1[ 0 ];
			var dy = latLon2[ 1 ] - latLon1[ 1 ];

			return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
		}


		function _getLatLon(p_) {
			var latLon = new Array( 2 );

			if ( viewCRS === null || ( viewCRS === originCRS ) ) {
				latLon[ 0 ] = p_[ 0 ];
				latLon[ 1 ] = p_[ 1 ];

				return latLon;
			}

			try {
				var np = ol.proj.transform( p_, viewCRS, originCRS );

				latLon[ 0 ] = np[ 0 ];
				latLon[ 1 ] = np[ 1 ];

				return latLon;
			} catch ( e ) {

			}
		}

		return scale;
	};


	/**
	 * 현재 지도에서 해당 줌 레벨의 스케일을 계산한다.
	 * 
	 * @param zoom {Integer} 줌 레벨.
	 * 
	 * @return scale {Double} 스케일.
	 */
	naji.njMap.prototype.getScaleForZoom = function(zoom_) {
		var _self = this._this || this;

		var resolution = _self.olMap.getView().getResolutionForZoom( zoom_ );

		var eWidth = resolution * _self.olMap.getSize()[ 0 ];
		var eHeight = resolution * _self.olMap.getSize()[ 1 ];

		var dummyExtent = [ 0, 0, eWidth, eHeight ];

		return _self.calculateScale( {
			extent : dummyExtent,
			originCRS : _self.getCRS()
		} );
	};


	/**
	 * 현재 지도에 등록된 모든 이벤트리스너를 제거한다.
	 * 
	 * @param type {String} 이벤트 타입
	 */
	naji.njMap.prototype.removeAllListener = function(type_) {
		var _self = this._this || this;

		var clickListeners = ol.events.getListeners( _self.olMap, type_ );
		for ( var i = clickListeners.length - 1; i >= 0; i-- ) {
			ol.Observable.unByKey( clickListeners[ i ] );
		}
	};


	/**
	 * 현재 지도에 등록된 모든 Interaction을 제거한다. (Default Interaction 제외)
	 */
	naji.njMap.prototype.removeAllInteraction = function() {
		var _self = this._this || this;

		var interactions = _self.olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( !( interactions[ i ].get( "necessary" ) ) ) {
				_self.olMap.removeInteraction( interactions[ i ] );
			}
		}
	};


	/**
	 * 현재 지도에 등록된 모든 Interaction 사용 설정. (Default Interaction 포함)
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	naji.njMap.prototype.setActiveAllInteraction = function(state_) {
		var _self = this._this || this;

		var interactions = _self.olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			interactions[ i ].setActive( state_ );
		}
	};


	/**
	 * 마우스 휠줌 스크롤 시 AltKey 조합 설정 사용 여부를 설정한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	naji.njMap.prototype.setAltKeyOnly = function(state_) {
		var _self = this._this || this;

		if ( _self.useAltKeyOnly === state_ ) {
			return;
		}
		_self.useAltKeyOnly = state_;
	};


	/**
	 * 로딩 심볼 표시 여부를 설정한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	naji.njMap.prototype.setLoadingVisible = function(state_) {
		var _self = this._this || this;

		if ( state_ ) {
			_self.loadingSrcDiv.style.display = "block";
		} else {
			_self.loadingSrcDiv.style.display = "none";
		}
	};


	/**
	 * 현재 지도의 View ID를 가져온다. View ID는 고유값이므로 해당 지도의 Key로 사용한다.
	 * 
	 * @return dataViewId {String} View ID.
	 */
	naji.njMap.prototype.getDataViewId = function() {
		var _self = this._this || this;
		return _self.dataViewId;
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapsPlatform 지도 캡쳐 객체.
	 * 
	 * 배경지도 및 njMap에 등록된 레이어를 캡쳐할 수 있다.
	 * 
	 * ※`useSync(동기화)`는 같은 Document일 경우 사용 가능하며 새창으로 띄울 경우 `false`로 설정해야한다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapCapture = new naji.njMapCapture( {
	 * 	useSync : true,
	 * 	njMap : new naji.njMap({...}),
	 * 	njMapBaseMap : new naji.baseMap.njMapBaseMap({...}),
	 * 	njMapLayerManager : new naji.manager.njMapLayerManager({...}),
	 * 	appendElement : document.getElementById('map'),
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useSync {Boolean} 캡쳐 대상 지도 연동 사용 여부. Default is `false`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapBaseMap {naji.baseMap.njMapBaseMap} {@link naji.baseMap.njMapBaseMap} 객체.
	 * @param opt_options.njMapLayerManager {naji.manager.njMapLayerManager} {@link naji.manager.njMapLayerManager} 객체.
	 * @param opt_options.appendElement {Element} 캡쳐 대상 지도 Element를 추가할 Element.
	 * 
	 * @class
	 */
	naji.njMapCapture = ( function(opt_options) {
		var _self = this;

		this.useSync = null;
		this.origin_njMap = null;
		this.appendElement = null;
		this.origin_njMapBaseMap = null;
		this.origin_njMapLayerManager = null;

		this.captureDivId = null;
		this.captureMapId = null;
		this.readyFunction = null;
		this.captureNjMap = null;
		this.captureElement = null;
		this.arrDeferred_ready = null;
		this.captureBaseMapId = null;
		this.captureUgBaseMap = null;
		this.captureLayerManager = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.useSync = ( typeof ( options.useSync ) === "boolean" ) ? options.useSync : false;
			_self.origin_njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.origin_njMapBaseMap = ( options.njMapBaseMap !== undefined ) ? options.njMapBaseMap : undefined;
			_self.origin_njMapLayerManager = ( options.njMapLayerManager !== undefined ) ? options.njMapLayerManager : undefined;
			_self.appendElement = ( options.appendElement !== undefined ) ? options.appendElement : undefined;
			_self.readyFunction = ( typeof options.readyFunction === "function" ) ? options.readyFunction : undefined;

			_self.arrDeferred_ready = [];

			if ( !_self.origin_njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			var uuid = naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];
			_self.captureDivId = "captureDiv_" + uuid;
			_self.captureMapId = "captureMap_" + uuid;
			_self.captureBaseMapId = "captureBaseMap_" + uuid;

			_self._createCaptureElement();
			_self._setCaptureMap();
			_self._setCaptureLayer();

		} )();
		// END initialize


		return {
			_this : _self,
			ready : _self.ready,
			destroy : _self.destroy,
			runCapture : _self.runCapture,
			getnjMap : _self.getnjMap,
			getnjMapBaseMap : _self.getnjMapBaseMap,
			setBaseMapVisible : _self.setBaseMapVisible,
			getnjMapLayerManager : _self.getnjMapLayerManager,
			baseMapVisibleToggle : _self.baseMapVisibleToggle
		}

	} );


	/**
	 * Capture DIV Element를 생성한다.
	 * 
	 * @private
	 */
	naji.njMapCapture.prototype._createCaptureElement = function() {
		var _self = this._this || this;

		var mapMainDIV = document.createElement( "div" );
		mapMainDIV.id = _self.captureDivId;
		mapMainDIV.style.width = "100%";
		mapMainDIV.style.height = "100%";
		mapMainDIV.style.overflow = "hidden";
		mapMainDIV.style.position = "relative";
		mapMainDIV.style.backgroundColor = "white";

		var baseMapDIV = document.createElement( "div" );
		baseMapDIV.id = _self.captureBaseMapId;
		naji.util.njMapUtil.setCssTextStyle( baseMapDIV, "z-Index", "20" );
		naji.util.njMapUtil.setCssTextStyle( baseMapDIV, "width", "100%" );
		naji.util.njMapUtil.setCssTextStyle( baseMapDIV, "height", "100%" );
		naji.util.njMapUtil.setCssTextStyle( baseMapDIV, "position", "absolute !important" );
		naji.util.njMapUtil.setCssTextStyle( baseMapDIV, "background-color", "rgb(255, 255, 254)" );

		var mapDIV = document.createElement( "div" );
		mapDIV.id = _self.captureMapId;
		naji.util.njMapUtil.setCssTextStyle( mapDIV, "z-Index", "30" );
		naji.util.njMapUtil.setCssTextStyle( mapDIV, "width", "100%" );
		naji.util.njMapUtil.setCssTextStyle( mapDIV, "height", "100%" );
		naji.util.njMapUtil.setCssTextStyle( mapDIV, "position", "absolute !important" );
		// naji.util.njMapUtil.setCssTextStyle( mapDIV, "background-color", "rgba(255, 255, 255, 0)" );

		mapMainDIV.appendChild( baseMapDIV );
		mapMainDIV.appendChild( mapDIV );

		_self.captureElement = mapMainDIV;
	};


	/**
	 * Capture할 배경지도, 지도를 설정한다.
	 * 
	 * @private
	 */
	naji.njMapCapture.prototype._setCaptureMap = function() {
		var _self = this._this || this;

		_self.appendElement.insertBefore( _self.captureElement, _self.appendElement.firstChild );

		// 캡쳐 지도 생성
		_self.captureNjMap = new naji.njMap( {
			target : document.getElementById( _self.captureMapId ),
			crs : _self.origin_njMap.getCRS(),
			center : _self.origin_njMap.getMap().getView().getCenter(),
			useMaxExtent : true,
			useAltKeyOnly : false
		} );

		// 캡쳐 기본 컨트롤 모두 제거
		var controls = _self.captureNjMap.getMap().getControls().getArray();
		for ( var i = controls.length - 1; i >= 0; i-- ) {
			_self.captureNjMap.getMap().removeControl( controls[ i ] );
		}

		// 캡쳐 기본 상호작용 모두 제거
		var interactions = _self.captureNjMap.getMap().getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( interactions[ i ] instanceof ol.interaction.DragRotate ) {
				_self.captureNjMap.getMap().removeInteraction( interactions[ i ] );
				break;
			}
		}

		// 드래그 패닝
		var njMapDragPan = new naji.control.njMapDragPan( {
			njMap : _self.captureNjMap,
			useDragPan : false,
			cursorCssName : "cursor-default",
			activeChangeListener : function(state_) {
				console.log( "njMapDragPan : " + state_ );
			}
		} );

		njMapDragPan.setActive( true );


		// 캡쳐 배경 지도 설정 및 생성
		if ( _self.origin_njMapBaseMap ) {
			_self.captureUgBaseMap = new naji.baseMap.njMapBaseMap( {
				target : _self.captureBaseMapId,
				njMap : _self.captureNjMap,
				baseMapKey : "osm_none",
				useElementMargin : false
			} );

			var baseMapDIV = document.getElementById( _self.captureBaseMapId );
			baseMapDIV.firstElementChild.style.top = null;
			baseMapDIV.firstElementChild.style.left = null;
			baseMapDIV.firstElementChild.style.overflow = null;
			baseMapDIV.firstElementChild.style.width = "100%";
			baseMapDIV.firstElementChild.style.height = "100%";

			_self.captureUgBaseMap.setVisible( _self.origin_njMapBaseMap.getVisible() );
			_self.captureUgBaseMap.setOpacity( _self.origin_njMapBaseMap.getOpacity() );

			var baseMapKey = _self.origin_njMapBaseMap.getSelectedBaseMap();

			if ( baseMapKey.indexOf( "custom" ) > -1 ) {
				var originObj = _self.origin_njMapBaseMap._this.baseMapList[ baseMapKey ].object;
				var uWMTSLayer = originObj._this.uWMTSLayer;

				var cWMTSLyer = new naji.layer.njMapWMTSLayer( {
					useProxy : true,
					serviceURL : uWMTSLayer.getServiceURL(),
					layer : uWMTSLayer.layer,
					version : uWMTSLayer.version,
					matrixSet : uWMTSLayer.matrixSet,
					wmtsCapabilities : uWMTSLayer.getWmtsCapabilities(),
					originExtent : uWMTSLayer.getOriginExtent()
				} );

				var bKey = "custom_" + naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];
				var custom = new naji.baseMap.njMapBaseMapCustom( {
					baseMapKey : bKey,
					uWMTSLayer : cWMTSLyer,
					capabilities : uWMTSLayer.getWmtsCapabilities(),
					isWorld : originObj.isWorlds(),
					isFactor : originObj.isFactors()
				} );

				custom._this.resolutions = originObj._this.resolutions;
				custom._this.mapTypes[ bKey ].maxZoom = originObj._this.mapTypes[ baseMapKey ].maxZoom;
				custom._this.mapTypes[ bKey ].resolutions = originObj._this.mapTypes[ baseMapKey ].resolutions;

				_self.captureUgBaseMap.addBaseMapType( bKey, custom );
				_self.captureUgBaseMap.changeBaseMap( bKey );
			} else if ( baseMapKey.indexOf( "TMS" ) > -1 ) {
				var code = baseMapKey.split( "_" )[ 0 ];

				var tms = new naji.baseMap.njMapBaseMapTMS_vWorld( {
					baseCode : code,
					projection : _self.origin_njMapBaseMap.getApiMap().getView().getProjection().getCode()
				} );

				_self.captureUgBaseMap.addBaseMapType( code, tms );
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				var layers = _self.captureUgBaseMap.getApiMap().getLayers().getArray();

				for ( var i in layers ) {
					var urls = layers[ i ].getSource().getUrls();
					var reUrls = [];
					for ( var u in urls ) {
						reUrls.push( naji.njMapConfig.getProxy() + urls[ u ] );
					}
					layers[ i ].getSource().setUrls( reUrls );
				}
			} else {
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				if ( baseMapKey === "osm_gray" ) {
					var layers = _self.captureUgBaseMap.getApiMap().getLayers().getArray();

					for ( var i in layers ) {
						layers[ i ].getSource().setUrl( naji.njMapConfig.getProxy() + "https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png" );
					}
				}
			}
		}

		// 캡쳐 지도 ol.View 설정
		var originView = _self.origin_njMap.getMap().getView();
		originView.setRotation( 0 );
		_self.captureNjMap.getMap().setView( new ol.View( {
			zoom : originView.getZoom(),
			center : originView.getCenter(),
			extent : ol.proj.get( _self.origin_njMap.getCRS() ).getExtent(),
			projection : originView.getProjection().getCode(),
			maxZoom : originView.getMaxZoom(),
			minZoom : originView.getMinZoom(),
			resolution : originView.getResolution(),
			resolutions : originView.getResolutions(),
			rotation : 0
		} ) );

		// 대상 지도와 캡쳐 지도 동기화
		if ( _self.useSync ) {
			_self.captureNjMap.getMap().setView( originView );
		}
	};


	/**
	 * Capture할 레이어를 설정한다.
	 * 
	 * @private
	 */
	naji.njMapCapture.prototype._setCaptureLayer = function() {
		var _self = this._this || this;

		var njMapLayers = [];

		// njMapLayerManager 사용 여부에 따른 레이어 설정
		if ( _self.origin_njMapLayerManager ) {
			_self.captureLayerManager = new naji.manager.njMapLayerManager( {
				njMap : _self.captureNjMap,
				useMinMaxZoom : true
			} );

			njMapLayers = _self.origin_njMapLayerManager.getAll( true );
		} else {
			var orginUgLayers = _self.origin_njMap.getLayers();
			for ( var i in orginUgLayers ) {
				njMapLayers.push( {
					njMapLayer : orginUgLayers[ i ]
				} );
			}
		}

		// 레이어 순차 동기화로 추가
		( function loop(i) {
			if ( i < njMapLayers.length ) {
				var addObject;
				var njMapLayer = njMapLayers[ i ][ "njMapLayer" ];

				if ( !njMapLayer.getVisible() ) {
					loop( i + 1 );
					return false;
				}

				if ( njMapLayer.getLayerType() === "WMS" ) {
					addObject = _self._addnjMapLayer().addWMSLayer;
				} else if ( njMapLayer.getLayerType() === "WFS" ) {
					addObject = _self._addnjMapLayer().addWFSLayer;
				} else if ( njMapLayer.getLayerType() === "Vector" ) {
					addObject = _self._addnjMapLayer().addVectorLayer;
				} else if ( njMapLayer.getLayerType() === "Vector3D" ) {
					addObject = _self._addnjMapLayer().addVector3DLayer;
				} else if ( njMapLayer.getLayerType() === "Cluster" ) {
					addObject = _self._addnjMapLayer().addClusterLayer;
				} else if ( njMapLayer.getLayerType() === "WMTS" ) {
					addObject = _self._addnjMapLayer().addWMTSLayer;
				} else if ( njMapLayer.getLayerType() === "WCS" ) {
					addObject = _self._addnjMapLayer().addWCSLayer;
				}

				// 레이어 visible, zIndex, opacity 설정
				var addedUgLayer = addObject.create( njMapLayer );
				addedUgLayer.setLayerVisible( njMapLayer.getVisible() );
				addedUgLayer.getOlLayer().setZIndex( njMapLayer.getOlLayer().getZIndex() );
				addedUgLayer.getOlLayer().setOpacity( njMapLayer.getOlLayer().getOpacity() );

				// njMapLayerManager 사용 시 대상 지도에서 설정된 Zoom 설정
				if ( _self.captureLayerManager ) {
					addedUgLayer.setMinZoom( njMapLayer.getMinZoom() );
					addedUgLayer.setMaxZoom( njMapLayer.getMaxZoom() );
				}

				// 대상 지도에서 njMapWMSToc 객체 사용 시 생성
				if ( _self.origin_njMapLayerManager && addedUgLayer.getLayerType() === "WMS" ) {
					var njMapToc = njMapLayers[ i ][ "njMapToc" ];

					// WMS Capabilities 요청
					var njMapGetCapabilitiesWMS = new naji.service.njMapGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : addedUgLayer.getServiceURL(),
						dataViewId : _self.captureNjMap.getDataViewId()
					} );

					_self.arrDeferred_ready.push( njMapGetCapabilitiesWMS );

					njMapGetCapabilitiesWMS.then( function() {
						var toc = addObject.toc( {
							key : njMapToc.tocKey,
							addLayer : addedUgLayer,
							saveData : JSON.parse( JSON.stringify( njMapToc.getSaveData() ) ),
							capabilities : njMapGetCapabilitiesWMS.data
						} );
						if ( _self.captureLayerManager ) {
							_self.captureLayerManager.add( {
								njMapToc : toc,
								njMapLayer : addedUgLayer
							} );
						}
					} );
				} else {
					if ( _self.captureLayerManager ) {
						_self.captureLayerManager.add( {
							njMapLayer : addedUgLayer
						} );
					}
				}

				var def_add = addObject.add( addedUgLayer );
				_self.arrDeferred_ready.push( def_add );
				def_add.then( function(res) {
				} );
				loop( i + 1 );
			} else {
				_self.ready();
			}
		} )( 0 );
	};


	/**
	 * 등록된 레이어를 순차 비동기로 추가한다.
	 * 
	 * @param njMapLayer {naji.layer} {@link naji.layer}객체.
	 * 
	 * @return {Object}
	 * 
	 * @private
	 */
	naji.njMapCapture.prototype._addnjMapLayer = function(njMapLayer_) {
		var _self = this._this || this;

		var addWMSLayer = {
			create : function(njMapLayer_) {
				return new naji.layer.njMapWMSLayer( {
					useProxy : true,
					singleTile : njMapLayer_._this.singleTile,
					serviceURL : njMapLayer_.getServiceURL(),
					ogcParams : njMapLayer_.getOlLayer().getSource().getParams()
				} );
			},
			add : function(njMapWmsLayer_) {
				return _self.captureNjMap.addWMSLayer( {
					uWMSLayer : njMapWmsLayer_,
					useExtent : false,
					extent : null,
					resolution : null
				} );
			},
			toc : function(options_) {
				return new naji.toc.njMapWMSToc( {
					tocKey : options_.key,
					njMap : _self.captureNjMap,
					njMapLayer : options_.addLayer,
					loadData : options_.saveData,
					capabilities : options_.capabilities
				} );
			}
		};

		var addWFSLayer = {
			create : function(njMapLayer_) {
				return new naji.layer.njMapWFSLayer( {
					useProxy : true,
					serviceURL : njMapLayer_.getServiceURL(),
					layerName : njMapLayer_.layerName,
					srsName : _self.captureNjMap.getCRS(),
					maxFeatures : njMapLayer_._this.maxFeatures,
					style : njMapLayer_._this.style,
					filter : njMapLayer_._this.filter
				} );
			},
			add : function(njMapWfsLayer_) {
				return _self.captureNjMap.addWFSLayer( {
					uWFSLayer : njMapWfsLayer_,
					useExtent : false
				} );
			}
		};

		var addVectorLayer = {
			create : function(njMapLayer_) {
				var style = njMapLayer_._this.style;

				if ( typeof style !== "function" && typeof style !== "undefined" ) {
					style = naji.util.njMapUtil.cloneStyle( style );
				}

				return new naji.layer.njMapVectorLayer( {
					style : style,
					features : njMapLayer_.getFeatures(),
					srsName : njMapLayer_._this.srsName,
				} );
			},
			add : function(njMapVectorLayer_) {
				return _self.captureNjMap.addVectorLayer( {
					uVectorLayer : njMapVectorLayer_,
					useExtent : false
				} );
			}
		};

		var addVector3DLayer = {
			create : function(njMapLayer_) {
				var style = njMapLayer_._this.style;

				if ( typeof style !== "function" && typeof style !== "undefined" ) {
					style = naji.util.njMapUtil.cloneStyle( style );
				}

				return new naji.layer.njMapVector3DLayer( {
					style : style,
					features : njMapLayer_.getFeatures(),
					initBuild : njMapLayer_._this.initBuild,
					srsName : njMapLayer_._this.srsName,
					labelColumn : njMapLayer_._this.labelColumn,
					heightColumn : njMapLayer_._this.heightColumn,
					maxResolution : njMapLayer_._this.maxResolution					
				} );
			},
			add : function(njMapVector3DLayer_) {
				return _self.captureNjMap.addVector3DLayer( {
					uVector3DLayer : njMapVector3DLayer_,
					useExtent : false
				} );
			}
		};

		var addClusterLayer = {
			create : function(njMapLayer_) {
				var style = njMapLayer_._this.style;
				return new naji.layer.njMapClusterLayer( {
					style : ( typeof style === "function" ) ? style : naji.util.njMapUtil.cloneStyle( style ),
					features : naji.util.njMapUtil.cloneFeatures( njMapLayer_.getFeatures() ),
					distance : njMapLayer_._this.distance,
					useAnimation : njMapLayer_._this.useAnimation
				} );
			},
			add : function(njMapClusterLayer_) {
				return _self.captureNjMap.addClusterLayer( {
					uClusterLayer : njMapClusterLayer_,
					useExtent : false
				} );
			}
		};

		var addWMTSLayer = {
			create : function(njMapLayer_) {
				return new naji.layer.njMapWMTSLayer( {
					useProxy : true,
					serviceURL : njMapLayer_.getServiceURL(),
					layer : njMapLayer_.layer,
					version : njMapLayer_.version,
					matrixSet : njMapLayer_.matrixSet,
					wmtsCapabilities : njMapLayer_.getWmtsCapabilities(),
					originExtent : njMapLayer_.getOriginExtent()
				} );
			},
			add : function(njMapWmtsLayer_) {
				return _self.captureNjMap.addWMTSLayer( {
					uWMTSLayer : njMapWmtsLayer_,
					useExtent : false,
					extent : null
				} );
			}
		};

		var addWCSLayer = {
			create : function(njMapLayer_) {
				return new naji.layer.njMapWCSLayer( {
					useProxy : true,
					version : njMapLayer_.version,
					identifier : njMapLayer_.identifier,
					format : njMapLayer_._this.format,
					serviceURL : njMapLayer_.getServiceURL(),
					boundingBox : njMapLayer_.getBoundingBox(),
					useScaleRefresh : njMapLayer_.useScaleRefresh
				} );
			},
			add : function(njMapWcsLayer_) {
				return _self.captureNjMap.addWCSLayer( {
					uWCSLayer : njMapWcsLayer_,
					useExtent : false,
					extent : null
				} );
			}
		};

		return {
			addWFSLayer : addWFSLayer,
			addWCSLayer : addWCSLayer,
			addWMSLayer : addWMSLayer,
			addWMTSLayer : addWMTSLayer,
			addVectorLayer : addVectorLayer,
			addClusterLayer : addClusterLayer,
			addVector3DLayer : addVector3DLayer
		}
	};


	/**
	 * 캡쳐 지도 {naji.njMap} 객체를 가져온다.
	 * 
	 * @return captureNjMap {naji.njMap} {@link naji.njMap} 객체.
	 */
	naji.njMapCapture.prototype.getnjMap = function() {
		var _self = this._this || this;
		return _self.captureNjMap;
	};


	/**
	 * 캡쳐 배경 지도 {naji.njMapBaseMap} 객체를 가져온다.
	 * 
	 * @return captureBaseMapId {naji.njMapBaseMap} {@link naji.njMapBaseMap} 객체.
	 */
	naji.njMapCapture.prototype.getnjMapBaseMap = function() {
		var _self = this._this || this;
		return _self.captureUgBaseMap;
	};


	/**
	 * 캡쳐 레이어 매니저 {naji.manager.njMapLayerManager} 객체를 가져온다.
	 * 
	 * @return captureLayerManager {naji.manager.njMapLayerManager} {@link naji.manager.njMapLayerManager} 객체.
	 */
	naji.njMapCapture.prototype.getnjMapLayerManager = function() {
		var _self = this._this || this;
		return _self.captureLayerManager;
	};


	/**
	 * Capture 배경지도를 끄거나 켤 수 있다.
	 * 
	 * @param visible {Boolean} 배경지도 ON/OFF.
	 */
	naji.njMapCapture.prototype.setBaseMapVisible = function(visible_) {
		var _self = this._this || this;

		if ( _self.captureUgBaseMap ) {
			_self.captureUgBaseMap.setVisible( visible_ );
		}
	};


	/**
	 * Capture 배경지도의 ON/OFF 상태를 토글한다.
	 */
	naji.njMapCapture.prototype.baseMapVisibleToggle = function() {
		var _self = this._this || this;

		if ( _self.captureUgBaseMap ) {
			_self.captureUgBaseMap.visibleToggle();
		}
	};


	/**
	 * 지도 캡쳐를 시작한다.
	 * 
	 * @param callBack {Function} 콜백 함수.
	 */
	naji.njMapCapture.prototype.runCapture = function(callBack_) {
		var _self = this._this || this;

		document.getElementById( _self.captureBaseMapId ).style.overflow = "";
		document.getElementById( _self.captureBaseMapId ).firstElementChild.style.overflow = "";

		if ( typeof callBack_ !== "function" ) {
			return false;
		}

		var baseMapCode = "none";

		if ( _self.origin_njMapBaseMap ) {
			baseMapCode = _self.origin_njMapBaseMap.getSelectedBaseMap().split( "_" )[ 0 ];
		}

		if ( baseMapCode.indexOf( "naver" ) > -1 || baseMapCode.indexOf( "daum" ) > -1 || baseMapCode.indexOf( "baroEmap" ) > -1 ) {
			document.getElementById( _self.captureDivId ).scrollIntoView( false );
			html2canvas_etc( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				logging : false,
				proxy : naji.njMapConfig.getProxy()
			} ).then( function(canvas) {
				callBack_.call( this, canvas );
			} );
		} else {
			document.getElementById( _self.captureDivId ).scrollIntoView( false );
			html2canvas_google( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				proxy : naji.njMapConfig.getProxy(),
				onrendered : function(canvas) {
					callBack_.call( this, canvas );
				}
			} );
		}
	};


	/**
	 * 생성된 Capture 객체를 destroy 한다.
	 */
	naji.njMapCapture.prototype.destroy = function(callBack_) {
		var _self = this._this || this;

		_$( "#" + _self.captureBaseMapId ).empty();
		_self.captureNjMap.getMap().setTarget( null );
	};


	/**
	 * setLayer Ready Success
	 */
	naji.njMapCapture.prototype.ready = function() {
		var _self = this._this || this;

		$.when.apply( $, _self.arrDeferred_ready ).then( function() {
			if ( _self.readyFunction ) {
				_self.readyFunction.call( _self );
			}

			_self.captureNjMap.refresh();
		} );
	};

} )();

/**
 * @namespace naji
 */

( function() {
	"use strict";

	/**
	 * njMapsPlatform에서 사용할 config를 설정한다.
	 * 
	 * 프록시 주소, 에러 알림창 함수, 로딩 심볼 표시 사용 여부, 로딩 심볼 이미지 경로를 설정할 수 있으며, 한 번 설정하면 공통으로 사용할 수 있다.
	 * 
	 * @example
	 * 
	 * <pre>
	 * naji.njMapConfig.init( {
	 * 	proxy : '/proxy.do', // 프록시 설정
	 * 	useLoading : true, // 로딩 심볼 표시 사용 여부
	 * 	loadingImg : 'https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif', // 로딩 심볼 이미지
	 * 	alert_Error : function(msg) { // 에러 알림창 함수
	 * 		alert( 'Error : ' + msg );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @namespace
	 */
	naji.njMapConfig = ( function(opt_options) {
		var _self = this;

		this.proxy = null;
		this.mobile = null;
		this.loading = null;
		this.browser = null;
		this.progress = null;
		this.flag_Proxy = null;
		this.alert_Error = null;
		this.loadingImg = null;
		this.useLoading = null;
		this.useMapProxy = null;

		this.progressObj = {};

		_self._checkMobile();
		_self._checkBrowser();
		_self._setIeCursor();

		return {
			_this : _self,
			init : this.init,
			isMobile : this.isMobile,
			getProxy : this.getProxy,
			loading : this.getLoading,
			isMapProxy : this.isMapProxy,
			getBrowser : this.getBrowser,
			alert_Error : this.getAlert_Error,
			addProgress : this.addProgress,
			resetLoading : this.resetLoading,
			isUseLoading : this.isUseLoading,
			getLoadingImg : this.getLoadingImg,
			addLoadEventListener : this.addLoadEventListener
		}

	} );


	/**
	 * Initialize
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.proxy {String} 프록시 주소.
	 * @param opt_options.useLoading {Boolean} 로딩 심볼 표시 사용 여부. Default is `true`.
	 * @param opt_options.alert_Error {Function} 에러 알림창 함수 msg {String}. Default is `alert`.
	 * @param opt_options.loadingImg {String} 로딩 심볼 이미지 경로 또는 base64. Default is `icon_loading.gif`.
	 */
	naji.njMapConfig.prototype.init = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		if ( options.proxy !== undefined && typeof options.proxy === "string" ) {
			_self.proxy = options.proxy;
			_self.flag_Proxy = true;
		} else {
			_self.proxy = "";
			_self.flag_Proxy = false;
		}

		if ( options.alert_Error !== undefined && typeof options.alert_Error === "function" ) {
			_self.alert_Error = options.alert_Error;
		} else {
			_self.alert_Error = _self._defaultAlert_Error;
		}

		if ( options.loadingImg !== undefined && typeof options.loadingImg === "string" ) {
			_self.loadingImg = options.loadingImg;
		} else {
			var defaultLoadingImg = naji.contextPath + "/images/icon_loading.gif";
			_self.loadingImg = _self.defaultLoadingImg;
		}

		_self.useLoading = ( options.useLoading !== undefined ) ? options.useLoading : true;
		_self.useMapProxy = ( options.useMapProxy !== undefined ) ? options.useMapProxy : false;
	};


	/**
	 * 현재 브라우저가 모바일이면 `true`.
	 * 
	 * @return mobile {Boolean} 모바일 여부.
	 */
	naji.njMapConfig.prototype.isMobile = function() {
		var _self = this._this || this;
		return _self.mobile;
	};


	/**
	 * URL 레이어 Proxy 사용 여부를 가져온다.
	 * 
	 * @return useMapProxy {Boolean} URL 레이어 Proxy 사용 여부.
	 */
	naji.njMapConfig.prototype.isMapProxy = function() {
		var _self = this._this || this;
		return _self.useMapProxy;
	};


	/**
	 * 현재 브라우저 타입을 가져온다.
	 * 
	 * @return browser {String} 브라우저 타입.
	 */
	naji.njMapConfig.prototype.getBrowser = function() {
		var _self = this._this || this;
		return _self.browser;
	};


	/**
	 * 설정된 프록시 주소를 가져온다.
	 * 
	 * @return proxy {String} 프록시 주소.
	 */
	naji.njMapConfig.prototype.getProxy = function() {
		var _self = this._this || this;

		if ( _self.flag_Proxy !== undefined ) {
			return _self.proxy;
		} else {
			return "";
		}
	};


	/**
	 * 설정된 에러 알림 함수를 호출한다.
	 * 
	 * @param msg {String} 알림 메세지.
	 */
	naji.njMapConfig.prototype.getAlert_Error = function(msg_) {
		var _self = this._this || this;
		_self.alert_Error( msg_ );
	};


	/**
	 * 에러 발생 시 기본 호출 함수
	 * 
	 * @private
	 * 
	 * @param msg {String} 알림 메세지.
	 */
	naji.njMapConfig.prototype._defaultAlert_Error = function(msg_) {
		alert( msg_ );
	};


	/**
	 * 로딩 심볼 표시 사용 여부를 가져온다.
	 * 
	 * @return useLoading {Boolean} 로딩 심볼 표시 사용 여부.
	 */
	naji.njMapConfig.prototype.isUseLoading = function() {
		var _self = this._this || this;
		return _self.useLoading;
	};


	/**
	 * 로딩 심볼을 리셋 시킨다.
	 * 
	 * @param key {String} 지도의 View ID.
	 */
	naji.njMapConfig.prototype.resetLoading = function(key_) {
		var _self = this._this || this;

		if ( _self.progressObj[ key_ ] ) {
			_self.progressObj[ key_ ].reset();
		}
	};


	/**
	 * 로딩 심볼 표시 함수.
	 * 
	 * @param key {String} 지도의 View ID.
	 * @param state {Boolean} 사용 여부.
	 */
	naji.njMapConfig.prototype.getLoading = function(key_, state_) {
		var _self = this._this || this;

		if ( state_ ) {
			if ( _self.progressObj[ key_ ] ) {
				_self.progressObj[ key_ ].addLoading();
			}
		} else {
			if ( _self.progressObj[ key_ ] ) {
				_self.progressObj[ key_ ].addLoaded();
			}
		}
	};


	/**
	 * 로딩 심볼 표시 연동 함수.
	 * 
	 * @private
	 * 
	 * @return loadingFunc {Function} 로딩 심볼 표시 함수.
	 */
	naji.njMapConfig.prototype._Progress = function(key_, loadingFunc_) {
		var _self = this;

		this.key = null;
		this.loaded = null;
		this.loading = null;
		this.interval = null;
		this.timeOut = null;
		this.loadingFunc = null;


		( function() {
			_self.key = key_;
			_self.loaded = 0;
			_self.loading = 0;
			_self.loadingFunc = loadingFunc_;
		} )();


		this.addLoading = ( function() {
			if ( _self.loading === 0 ) {
				_self.loadingFunc( true );

				_$( document ).trigger( "loadChangeEvent_" + _self.key, false );
			}
			++_self.loading;
			_self.update();
		} );


		this.addLoaded = ( function() {
			setTimeout( function() {
				++_self.loaded;
				_self.update();
			}, 100 );
		} );


		this.update = ( function() {
			if ( ( _self.loading !== 0 && _self.loaded !== 0 ) && ( _self.loading <= _self.loaded ) ) {
				_self.loading = 0;
				_self.loaded = 0;

				clearInterval( _self.interval );

				// _self.timeOut = setTimeout( function() {
				_self.loadingFunc( false );

				$( document ).trigger( "loadChangeEvent_" + _self.key, true );
				// }, 999 );
			} else {
				clearTimeout( _self.timeOut );
			}
		} );


		this.reset = ( function() {
			clearInterval( _self.interval );
			_self.interval = setInterval( _self.update, 1000 );
		} );


		return {
			reset : _self.reset,
			addLoaded : _self.addLoaded,
			addLoading : _self.addLoading
		}
	};


	/**
	 * 웹, 모바일 여부 체크.
	 * 
	 * @private
	 */
	naji.njMapConfig.prototype._checkMobile = function() {
		var _self = this._this || this;

		var filter = "win16|win32|win64|mac";
		if ( navigator.platform ) {
			if ( 0 > filter.indexOf( navigator.platform.toLowerCase() ) ) {
				_self.mobile = true;
			} else {
				_self.mobile = false;
			}
		}
	};


	/**
	 * 브라우저 종류 체크.
	 * 
	 * @private
	 */
	naji.njMapConfig.prototype._checkBrowser = function() {
		var _self = this._this || this;

		var browser;
		var name = navigator.appName;
		var agent = navigator.userAgent.toLowerCase();

		// MS 계열 브라우저를 구분하기 위함.
		if ( name === 'Microsoft Internet Explorer' || agent.indexOf( 'trident' ) > -1 || agent.indexOf( 'edge/' ) > -1 ) {
			browser = 'ie';
			if ( name === 'Microsoft Internet Explorer' ) { // IE old version (IE 10 or Lower)
				agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec( agent );
				browser += parseInt( agent[ 1 ] );
			} else { // IE 11+
				if ( agent.indexOf( 'trident' ) > -1 ) { // IE 11
					browser += 11;
				} else if ( agent.indexOf( 'edge/' ) > -1 ) { // Edge
					browser = 'edge';
				}
			}
		} else if ( agent.indexOf( 'safari' ) > -1 ) { // Chrome or Safari
			if ( agent.indexOf( 'opr' ) > -1 ) { // Opera
				browser = 'opera';
			} else if ( agent.indexOf( 'chrome' ) > -1 ) { // Chrome
				browser = 'chrome';
			} else { // Safari
				browser = 'safari';
			}
		} else if ( agent.indexOf( 'firefox' ) > -1 ) { // Firefox
			browser = 'firefox';
		}

		// IE: ie7~ie11, Edge: edge, Chrome: chrome, Firefox: firefox, Safari: safari, Opera: opera
		_self.browser = browser;
	};


	/**
	 * 브라우저가 IE인 경우 마우스 커서 설정.
	 * 
	 * @private
	 */
	naji.njMapConfig.prototype._setIeCursor = function() {
		var _self = this._this || this;

		if ( _self.browser && _self.browser.indexOf( "ie" ) > -1 ) {
			var style = document.createElement( 'style' );
			style.type = 'text/css';
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );

			var cursorList = [ 'default', 'closeHand', 'identify', 'measureArea', 'measureDistance', 'zoomIn', 'zoomOut', 'zoomOut', 'point', 'line',
					'polygon', 'rectangle', 'circle' ];

			for ( var i in cursorList ) {
				var cursor = cursorList[ i ];
				var url = "../images/cursor/cursor_" + cursor + ".cur";

				var name = '.cursor-' + cursor;
				var rule = "cursor: url(" + url + "), auto !important;";

				if ( !( style.sheet || {} ).insertRule ) {
					( style.styleSheet || style.sheet ).addRule( name, rule );
				} else {
					style.sheet.insertRule( name + "{" + rule + "}", 0 );
				}
			}
		}
	};


	/**
	 * 설정된 로딩 심볼 이미지를 가져온다.
	 * 
	 * @return loadingImg {String} 이미지 경로 또는 base64.
	 */
	naji.njMapConfig.prototype.getLoadingImg = function() {
		var _self = this._this || this;

		if ( !_self.loadingImg ) {
			var defaultLoadingImg = naji.contextPath + "/images/icon_loading.gif";
			_self.loadingImg = defaultLoadingImg;
		}
		return _self.loadingImg;
	};


	/**
	 * 데이터 로딩 프로그레스를 추가한다.
	 * 
	 * @param key {String} View ID.
	 * @param loadFunction {Function} 로딩 심볼 표시 함수.
	 */
	naji.njMapConfig.prototype.addProgress = function(key_, loadFunction_) {
		var _self = this._this || this;
		_self.progressObj[ key_ ] = new _self._Progress( key_, loadFunction_ );
	};


	/**
	 * 데이터 로딩 시작/완료 이벤트를 추가한다.
	 * 
	 * ※로드가 시작되거나 로딩 중이면 `false` 로딩이 완료 되면 `true`를 반환한다.
	 * 
	 * @param key {String} View ID.
	 * @param eventListener {Function} {jQuery.Event, Boolean} 시작/완료 함수.
	 */
	naji.njMapConfig.prototype.addLoadEventListener = function(key_, eventListener_) {
		var _self = this._this || this;
		setTimeout( function() {
			$( document ).on( "loadChangeEvent_" + key_, eventListener_ );
		}, 10 )
	};


	naji.njMapConfig = new naji.njMapConfig();

} )();

( function() {
	"use strict";

	/**
	 * HTTP ajax 통신.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapHttp = naji.njMapHttp.requestData( {
	 * 	url : '/sampleXML.xml',
	 * 	type : 'GET',
	 * 	dataType : 'XML',
	 * 	contentType : 'text/xml',
	 * 	data : {
	 * 		param1 : '1',
	 * 		param2 : '2'
	 * 	}
	 * } );
	 * 
	 * njMapHttp.then( function(res) {
	 * 	console.log( res );
	 * } );
	 * </pre>
	 * 
	 * @namespace
	 */
	naji.njMapHttp = ( function() {

		return {
			requestData : this.requestData
		}

	} );


	/**
	 * Request Data.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.url {String} URL 주소.
	 * 
	 * @param opt_options.type {String} GET or POST. Default is `GET`.
	 * @param opt_options.data {Object} 서버에 전송할 데이터.
	 * @param opt_options.contentType {String} contentType 유형. Default is `application/x-www-form-urlencoded; charset=UTF-8`.
	 * @param opt_options.dataType {String} dataType 유형. Default is `XML`.
	 * @param opt_options.dataViewId {String} 지도의 View ID.
	 * 
	 * @return deferred.promise {jQuery.deferred.promise}
	 */
	naji.njMapHttp.prototype.requestData = function(opt_options) {
		var _this = this;
		var options = opt_options || {};

		this.isUseLoading = naji.njMapConfig.isUseLoading();

		this.deferred = _$.Deferred();

		this.url = ( options.url !== undefined ) ? options.url : "";
		this.type = ( options.type !== undefined ) ? options.type : "GET";
		this.data = ( options.data !== undefined ) ? options.data : {};
		this.contentType = ( options.contentType !== undefined ) ? options.contentType : "application/x-www-form-urlencoded; charset=UTF-8";
		this.dataType = ( options.dataType !== undefined ) ? options.dataType : "XML";
		this.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

		_$.ajax( {
			url : _this.url,
			type : _this.type,
			data : _this.data,
			dataType : _this.dataType,
			contentType : _this.contentType,
			beforeSend : function() {
				if ( _this.isUseLoading ) {
					naji.njMapConfig.loading( _this.dataViewId, true );
				}
			},
			complete : function() {
				if ( _this.isUseLoading ) {
					naji.njMapConfig.loading( _this.dataViewId, false );
				}
			},
			success : function(response_) {
				_this.deferred.resolve( response_ );
			},
			error : function(response_) {
				_this.deferred.reject( response_ );
			}
		} );

		return _this.deferred.promise();
	};


	naji.njMapHttp = new naji.njMapHttp();

} )();

( function() {
	"use strict";

	/**
	 * njMapsPlatform 팝업 객체.
	 * 
	 * 팝업을 생성하여 원하는 좌표에 나타낼 수 있으며, 끄고 켤 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapPopup = new naji.njMapPopup( {
	 *	njMap : new naji.njMap({...}),
	 *	position : [ 14679631.555732759, 4472532.067911336 ],
	 *	content : 'content',
	 *	show : true,
	 *	closeCallBack : function() {
	 *		alert( 'Popup Close !' );
	 *	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.closeCallBack {Function} 팝업 close 시 콜백 함수.
	 * 
	 * @class
	 */
	naji.njMapPopup = ( function(opt_options) {
		var _self = this;

		this.njMap = null;
		this.closeCallBack = null;

		this.content = null;
		this.removed = null;
		this.container = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			var html = ( options.content !== undefined ) ? options.content : "";
			var position = ( options.position !== undefined ) ? options.position : undefined;
			var show = ( typeof ( options.show ) === "boolean" ) ? options.show : false;
			_self.removed = false;
			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.closeCallBack = ( typeof options.closeCallBack === "function" ) ? options.closeCallBack : undefined;

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			_self._init( position, html, show );

		} )( opt_options );
		// END initialize


		return {
			_this : _self,
			hide : _self.hide,
			show : _self.show,
			remove : _self.remove,
			setContent : _self.setContent,
			setPosition : _self.setPosition
		}

	} );


	naji.njMapPopup.prototype = Object.create( ol.Overlay.prototype );
	naji.njMapPopup.prototype.constructor = naji.njMapPopup;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.njMapPopup.prototype._init = function(position_, html_, show_) {
		var _self = this._this || this;

		var header = document.createElement( "div" );
		header.className = "ol-popup-header";

		var closer = document.createElement( "a" );
		closer.className = "ol-popup-closer";
		closer.href = "#";
		closer.addEventListener( "click", function(evt) {
			_self.container.style.display = "none";
			closer.blur();
			if ( _self.closeCallBack ) {
				_self.closeCallBack();
			}
			evt.preventDefault();
		}, false );
		header.appendChild( closer );

		_self.container = document.createElement( "div" );
		_self.container.className = "ol-popup";

		_self.container.style.transitionDuration = "0.5s";

		_self.container.addEventListener( "mouseover", function(event) {
			this.style.zIndex = 1;
		}, false );

		_self.container.addEventListener( "mouseout", function(event) {
			this.style.zIndex = "";
		}, false );


		_self.container.appendChild( header );

		_self.content = document.createElement( "div" );
		_self.content.className = "ol-popup-content";

		_self.container.appendChild( _self.content );

		ol.Overlay.call( _self, {
			insertFirst : false,
			element : _self.container,
			stopEvent : true
		} );

		_self.setContent( html_ );
		_self.setPosition( position_ );
		_self.njMap.getMap().addOverlay( _self );

		if ( show_ ) {
			_self._panIntoCenter();
		} else {
			_self.container.style.display = "none";
		}
	};


	/**
	 * 팝업의 위치를 지도 중앙에 표시한다.
	 * 
	 * @private
	 */
	naji.njMapPopup.prototype._panIntoCenter = function() {
		var _self = this._this || this;

		var olMap = _self.njMap.getMap();

		olMap.getView().animate( {
			center : _self.getPosition(),
			duration : 500
		} );
	};


	/**
	 * 팝업의 위치를 지도 뷰 화면에 표시한다.
	 * 
	 * @private
	 */
	naji.njMapPopup.prototype._panIntoView = function() {
		var _self = this._this || this;

		if ( !_self.getPosition() ) {
			return false;
		}

		var olMap = _self.njMap.getMap();
		var mapSize = olMap.getSize();
		var popSize = {
			width : _self.getElement().clientWidth + 20,
			height : _self.getElement().clientHeight + 20
		};

		var tailHeight = 20;
		var tailOffsetLeft = 60;
		var tailOffsetRight = popSize.width - tailOffsetLeft;
		var popOffset = _self.getOffset();
		var popPx = olMap.getPixelFromCoordinate( _self.getPosition() );

		var fromLeft = ( popPx[ 0 ] - tailOffsetLeft );
		var fromRight = mapSize[ 0 ] - ( popPx[ 0 ] + tailOffsetRight );

		var fromTop = popPx[ 1 ] - popSize.height + popOffset[ 1 ];
		var fromBottom = mapSize[ 1 ] - ( popPx[ 1 ] + tailHeight ) - popOffset[ 1 ];

		var center = olMap.getView().getCenter();
		var px = olMap.getPixelFromCoordinate( center );

		if ( fromRight < 0 ) {
			px[ 0 ] -= fromRight;
		} else if ( fromLeft < 0 ) {
			px[ 0 ] += fromLeft;
		}

		if ( fromTop < 0 ) {
			// px[1] = 170 + fromTop;
			px[ 1 ] += fromTop; // original
		} else if ( fromBottom < 0 ) {
			px[ 1 ] -= fromBottom;
		}

		olMap.getView().animate( {
			center : olMap.getCoordinateFromPixel( px ),
			duration : 500
		} );
	};


	/**
	 * 팝업을 표시한다.
	 * 
	 * @param panIntoCenter {Boolean} 지도 가운데 영역에 표시할지 사용 여부.
	 * 
	 * `true`면 팝업을 지도 가운데 영역에 표시한다.
	 */
	naji.njMapPopup.prototype.show = function(panIntoCenter_) {
		var _self = this._this || this;

		if ( _self.removed ) {
			return false;
		}
		_self.container.style.display = "block";

		var content = _self.content;

		window.setTimeout( function() {
			content.scrollTop = 0;
		}, 100 );

		if ( panIntoCenter_ ) {
			_self._panIntoCenter();
		} else {
			_self._panIntoView();
		}
	};


	/**
	 * 팝업을 숨긴다.
	 */
	naji.njMapPopup.prototype.hide = function() {
		var _self = this._this || this;

		if ( _self.removed ) {
			return false;
		}
		_self.container.style.display = "none";
		if ( _self.closeCallBack ) {
			_self.closeCallBack();
		}
	};


	/**
	 * 팝업 내용을 설정한다.
	 * 
	 * @param html {String} html 형태의 텍스트.
	 */
	naji.njMapPopup.prototype.setContent = function(html_) {
		var _self = this._this || this;

		if ( typeof html_ === "string" ) {
			_self.content.innerHTML = html_;
		}
	};


	/**
	 * 팝업의 위치를 설정한다.
	 * 
	 * @Extends {ol.Overlay.prototype.setPosition}
	 * 
	 * @param coordinate {ol.Coordinate} 팝업을 표시할 좌표.
	 * @param move {Boolean} 변경된 위치로 View 화면 이동 여부.
	 */
	naji.njMapPopup.prototype.setPosition = function(coordinate_, move_) {
		var _self = this._this || this;

		_self.set( "origin", {
			position : coordinate_,
			projection : _self.njMap.getCRS()
		} );

		ol.Overlay.prototype.setPosition.call( _self, coordinate_ );
		
		if ( move_ ) {
			_self.show( true );
		}
	};


	/**
	 * 팝업을 삭제한다.
	 */
	naji.njMapPopup.prototype.remove = function() {
		var _self = this._this || this;

		_self.hide();
		_self.removed = true;
		_self.njMap.getMap().removeOverlay( _self );
	};

} )();

/**
 * @namespace naji.etc
 */

( function() {
	"use strict";

	/**
	 * 지도 이동 기록 정보 객체 (NavigationHistory).
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapNavigationHistory = new naji.etc.njMapNavigationHistory( {
	 * 	njMap : njMap,
	 * 	hasNext : function(state_) {
	 * 		console.log( state_ );
	 * 	},
	 * 	hasPrevious : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.hasNext {Function} 다음 영역 존재 여부 CallBack.
	 * @param opt_options.hasPrevious {Function} 이전 영역 존재 여부 CallBack.
	 * 
	 * @class
	 */
	naji.etc.njMapNavigationHistory = ( function(opt_options) {
		var _self = this;

		this.njMap = null;
		this.hasNext = null;
		this.hasPrevious = null;

		this.state = null;
		this.current = null;
		this.nextStack = null;
		this.previousStack = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.state = true;
			_self.current = [];
			_self.nextStack = [];
			_self.previousStack = [];

			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.hasNext = ( typeof options.hasNext === "function" ) ? options.hasNext : undefined;
			_self.hasPrevious = ( typeof options.hasPrevious === "function" ) ? options.hasPrevious : undefined;


			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			_self._init();

		} )();
		// END initialize

		return {
			_this : _self,
			clear : _self.clear,
			moveNext : _self.moveNext,
			movePrevious : _self.movePrevious
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.etc.njMapNavigationHistory.prototype._init = ( function() {
		var _self = this._this || this;

		var olMap = _self.njMap.getMap();

		olMap.on( "change:view", function() {
			window.setTimeout( function() {
				_self.clear();
			}, 100 );
		} );

		olMap.on( "moveend", function(evt) {
			if ( _self.state ) {
				_self.nextStack = [];
				_self.previousStack.push( {
					zoom : evt.target.getView().getZoom(),
					center : evt.target.getView().getCenter()
				} );
				_self._historyCheckListener();
			}
		} );

		olMap.dispatchEvent( {
			type : "moveend"
		} );
	} );


	/**
	 * 이전 영역으로 이동.
	 */
	naji.etc.njMapNavigationHistory.prototype.movePrevious = ( function() {
		var _self = this._this || this;

		if ( _self.previousStack.length > 1 ) {
			var current = _self.previousStack.pop();
			var state = _self.previousStack.pop();
			_self.nextStack.push( current );
			_self.previousStack.push( state );
			_self._changeMapArea( state );
		}
	} );


	/**
	 * 다음 영역으로 이동.
	 */
	naji.etc.njMapNavigationHistory.prototype.moveNext = ( function() {
		var _self = this._this || this;

		if ( _self.nextStack.length > 0 ) {
			var state = _self.nextStack.pop();
			_self.previousStack.push( state );
			_self._changeMapArea( state );
		}
	} );


	/**
	 * 이전/이후 영역으로 이동한다.
	 * 
	 * @private
	 * 
	 * @param stack {Object} 이전/이후 영역 데이터.
	 */
	naji.etc.njMapNavigationHistory.prototype._changeMapArea = ( function(stack_) {
		var _self = this._this || this;

		var olMap = _self.njMap.getMap();

		_self.state = false;
		olMap.getView().setZoom( stack_.zoom );
		olMap.getView().setCenter( stack_.center );

		_self._historyCheckListener();

		window.setTimeout( function() {
			_self.state = true;
		}, 500 );
	} );


	/**
	 * 이전/이후 영역 존재 여부를 체크하고 설정된 함수를 트리거한다.
	 * 
	 * @private
	 */
	naji.etc.njMapNavigationHistory.prototype._historyCheckListener = ( function() {
		var _self = this._this || this;

		if ( _self.hasNext ) {
			if ( _self.nextStack.length > 0 ) {
				_self.hasNext.call( this, true );
			} else {
				_self.hasNext.call( this, false );
			}
		}

		if ( _self.hasPrevious ) {
			if ( _self.previousStack.length > 1 ) {
				_self.hasPrevious.call( this, true );
			} else {
				_self.hasPrevious.call( this, false );
			}
		}
	} );


	/**
	 * 내용을 초기화 한다.
	 */
	naji.etc.njMapNavigationHistory.prototype.clear = ( function() {
		var _self = this._this || this;

		_self.state = true;
		_self.nextStack = [];
		_self.previousStack = [];

		_self.njMap.getMap().dispatchEvent( {
			type : "moveend"
		} );
	} );

} )();

( function() {
	"use strict";

	/**
	 * Vector 3D 렌더링 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapRender3D = new naji.etc.njMapRender3D( {
	 * 	style : new ol.style.Style({...}),
	 * 	layer : new ol.layer.Vector({...}),
	 * 	initBuild : true,
	 * 	labelColumn : 'BUILD_NAME',
	 * 	heightColumn : 'BUILD_HEIGHT',
	 * 	maxResolution : 0.5
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.style {ol.style.Style} 스타일.
	 * @param opt_options.easing {ol.easing} ol.easing 타입.
	 * @param opt_options.layer {ol.layer.Vector} 벡터레이어 객체.
	 * @param opt_options.initBuild {Boolean} 초기 3D 렌더링 사용 여부.
	 * @param opt_options.labelColumn {String} 피처에 표시할 라벨 컬럼명.
	 * @param opt_options.heightColumn {String} 피처의 높이를 참조할 컬럼명.
	 * @param opt_options.animateDuration {Number} 3D 렌더링 지연 시간. Default is `1000`.
	 * @param opt_options.maxResolution {Number} 3D 렌더링 최대 Resolution. Default is `0.6`.
	 * 
	 * @class
	 */
	naji.etc.njMapRender3D = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.layer = null;
		this.easing = null;
		this.initBuild = null;
		this.labelColumn = null;
		this.defaultHeight = null;
		this.heightColumn = null;
		this.maxResolution = null;
		this.animateDuration = null;

		this.res = null;
		this.center = null;
		this.height = null;
		this.matrix = null;
		this.listener = null;
		this.animate = null;
		this.toHeight = null;
		this.buildState = null;
		this.elapsedRatio = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.layer = ( options.layer !== undefined ) ? options.layer : undefined;
			_self.easing = ( options.easing !== undefined ) ? options.easing : ol.easing.easeOut;
			_self.initBuild = ( typeof ( options.initBuild ) === "boolean" ) ? options.initBuild : true;
			_self.labelColumn = _self.labelColumn = ( options.labelColumn !== undefined ) ? options.labelColumn : "";
			_self.heightColumn = _self.heightColumn = ( options.heightColumn !== undefined ) ? options.heightColumn : "";
			_self.animateDuration = ( typeof ( options.animateDuration ) === "number" ) ? options.animateDuration : 1000;
			_self.defaultHeight = options.defaultHeight = ( typeof ( options.defaultHeight ) === "number" ) ? options.defaultHeight : 0;
			_self.maxResolution = options.maxResolution = ( typeof ( options.maxResolution ) === "number" ) ? options.maxResolution : 0.6;

			_super = ol.Object.call( _self, options );

			_self._init();

		} )();
		// END Initialize

		
		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			isBuild3D : _self.isBuild3D,
			setBuild3D : _self.setBuild3D,
			buildToggle : _self.buildToggle
		} );

	} );


	naji.etc.njMapRender3D.prototype = Object.create( ol.Object.prototype );
	naji.etc.njMapRender3D.prototype.constructor = naji.etc.njMapRender3D;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._init = ( function() {
		var _self = this._this || this;

		_self._setStyle( _self.style );
		_self._setLayer( _self.layer );
		_self.height = _self._getHfn( _self.heightColumn );
	} );


	/**
	 * Set style associated with the renderer
	 * 
	 * @param {ol.style.Style} s
	 * 
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._setStyle = ( function(style_) {
		var _self = this._this || this;

		if ( style_ instanceof ol.style.Style ) {
			_self._style = style_;
		} else {
			_self._style = new ol.style.Style();
		}

		if ( !_self._style.getStroke() ) {
			_self._style.setStroke( new ol.style.Stroke( {
				width : 1,
				color : "RED"
			} ) );
		}

		if ( !_self._style.getFill() ) {
			_self._style.setFill( new ol.style.Fill( {
				color : "rgba(0,0,255,0.5)"
			} ) );
		}

		// Get the geometry
		if ( style_ && style_.getGeometry() ) {
			var geom = style_.getGeometry();
			if ( typeof ( geom ) === "function" ) {
				_self.set( "geometry", geom );
			} else {
				_self.set( "geometry", function() {
					return geom;
				} );
			}
		} else {
			_self.set( "geometry", function(f_) {
				return f_.getGeometry();
			} );
		}
	} );


	/**
	 * Set layer to render 3D
	 * 
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._setLayer = ( function(layer_) {
		var _self = this._this || this;

		_self._layer = layer_;

		if ( _self.listener_ ) {
			_self.listener_.forEach( function(lKey_) {
				ol.Observable.unByKey( lKey_ );
			} );
		}

		_self.listener_ = layer_.on( [ "postcompose", "postrender" ], _self._onPostcompose.bind( _self ) );
		
		_self.setBuild3D( _self.initBuild );
	} );


	/**
	 * Calculate 3D at potcompose
	 * 
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._onPostcompose = ( function(e_) {
		var _self = this._this || this;

		var res = e_.frameState.viewState.resolution;
		if ( res > _self.get( "maxResolution" ) ) return;

		var asd = njMap.getMap().getRenderer().getLayerRenderer( _self.layer );


		asd.declutterTree_.clear();

		_self.res = res * 400;

		if ( _self.animate ) {
			var elapsed = e_.frameState.time - _self.animate;

			if ( elapsed < _self.animateDuration ) {
				_self.elapsedRatio = _self.easing( elapsed / _self.animateDuration );
				// tell OL3 to continue postcompose animation
				e_.frameState.animate = true;
			} else {
				_self.animate = false;
				_self.height = _self.toHeight;
			}
		}

		var ratio = e_.frameState.pixelRatio;
		var ctx = e_.context;
		var m = _self.matrix = e_.frameState.coordinateToPixelTransform;
		// Old version (matrix)
		if ( !m ) {
			m = e_.frameState.coordinateToPixelMatrix, m[ 2 ] = m[ 4 ];
			m[ 3 ] = m[ 5 ];
			m[ 4 ] = m[ 12 ];
			m[ 5 ] = m[ 13 ];
		}


		_self.center = [ ctx.canvas.width/2/ratio, ctx.canvas.height/ratio ];


		var f = _self.layer.getSource().getFeaturesInExtent( e_.frameState.extent );
		ctx.save();
		ctx.scale( ratio, ratio );

		var s = _self.style;
		ctx.lineWidth = s.getStroke().getWidth();
		ctx.fillStyle = ol.color.asString( s.getFill().getColor() );
		ctx.strokeStyle = ol.color.asString( s.getStroke().getColor() );

		var builds = [];
		for ( var i = 0; i < f.length; i++ ) {
			builds.push( _self._getFeature3D( f[ i ], _self._getFeatureHeight( f[ i ] ) ) );
		}

		_self._drawFeature3D( ctx, builds );
		ctx.restore();
	} );


	/**
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._getFeature3D = ( function(f_, h_) {
		var _self = this._this || this;

		var geom = _self.get( "geometry" )( f_ );
		var c = geom.getCoordinates();

		switch ( geom.getType() ) {
			case "Polygon" :
				c = [ c ];
				// fallthronjMaph

			case "MultiPolygon" :
				var build = [];
				for ( var i = 0; i < c.length; i++ ) {
					for ( var j = 0; j < c[ i ].length; j++ ) {
						var b = [];
						for ( var k = 0; k < c[ i ][ j ].length; k++ ) {
							b.push( _self._hvector( c[ i ][ j ][ k ], h_ ) );
						}
						build.push( b );
					}
				}

				return {
					type : "MultiPolygon",
					feature : f_,
					geom : build
				};

			case "Point" :
				return {
					type : "Point",
					feature : f_,
					geom : _self._hvector( c, h )
				};

			default :
				return {};
		}
	} );


	/**
	 * Create a function that return height of a feature
	 * 
	 * @param {function|string|number} h a height function or a popertie name or a fixed value
	 * 
	 * @private
	 * 
	 * @return {function} function(f) return height of the feature f
	 */
	naji.etc.njMapRender3D.prototype._getHfn = ( function(h_) {
		var _self = this._this || this;

		switch ( typeof ( h_ ) ) {
			case 'function' :
				return h_;

			case 'string' : {
				var dh = _self.get( "defaultHeight" );
				return ( function(f_) {
					return ( Number( f_.get( h_ ) ) || dh );
				} );
			}

			case 'number' :
				return ( function(/* f */) {
					return h_;
				} );

			default :
				return ( function(/* f */) {
					return 10;
				} );
		}
	} );


	/**
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._hvector = ( function(pt_, h_) {
		var _self = this._this || this;

		var p0 = [ pt_[ 0 ] * _self.matrix[ 0 ] + pt_[ 1 ] * _self.matrix[ 1 ] + _self.matrix[ 4 ],
			pt_[ 0 ] * _self.matrix[ 2 ] + pt_[ 1 ] * _self.matrix[ 3 ] + _self.matrix[ 5 ] ];
	
		return {
			p0 : p0,
			p1 : [ p0[ 0 ] + h_ / _self.res * ( p0[ 0 ] - _self.center[ 0 ] ), p0[ 1 ] + h_ / _self.res * ( p0[ 1 ] - _self.center[ 1 ] ) ]
		};
	} );


	/**
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._getFeatureHeight = ( function(f_) {
		var _self = this._this || this;

		if ( _self.animate ) {
			var h1 = _self.height( f_ );
			var h2 = _self.toHeight( f_ );

			return ( h1 * ( 1 - _self.elapsedRatio ) + _self.elapsedRatio * h2 );
		} else {
			return _self.height( f_ );
		}
	} );


	/**
	 * @private
	 */
	naji.etc.njMapRender3D.prototype._drawFeature3D = ( function(ctx_, build_) {
		var _self = this._this || this;

		var i, j, b, k;
		// Construct
		for ( i = 0; i < build_.length; i++ ) {
			switch ( build_[ i ].type ) {
				case "MultiPolygon" : {
					for ( j = 0; j < build_[ i ].geom.length; j++ ) {
						b = build_[ i ].geom[ j ];
						for ( k = 0; k < b.length; k++ ) {
							ctx_.beginPath();
							ctx_.moveTo( b[ k ].p0[ 0 ], b[ k ].p0[ 1 ] );
							ctx_.lineTo( b[ k ].p1[ 0 ], b[ k ].p1[ 1 ] );
							ctx_.stroke();
						}
					}
					break;
				}

				case "Point" : {
					var g = build_[ i ].geom;
					ctx_.beginPath();
					ctx_.moveTo( g.p0[ 0 ], g.p0[ 1 ] );
					ctx_.lineTo( g.p1[ 0 ], g.p1[ 1 ] );
					ctx_.stroke();
					break;
				}
				default :
					break;
			}
		}

		// Roof
		for ( i = 0; i < build_.length; i++ ) {
			switch ( build_[ i ].type ) {
				case "MultiPolygon" : {
					ctx_.beginPath();
					for ( j = 0; j < build_[ i ].geom.length; j++ ) {
						b = build_[ i ].geom[ j ];
						if ( j == 0 ) {
							ctx_.moveTo( b[ 0 ].p1[ 0 ], b[ 0 ].p1[ 1 ] );
							for ( k = 1; k < b.length; k++ ) {
								ctx_.lineTo( b[ k ].p1[ 0 ], b[ k ].p1[ 1 ] );
							}
						} else {
							ctx_.moveTo( b[ 0 ].p1[ 0 ], b[ 0 ].p1[ 1 ] );
							for ( k = b.length - 2; k >= 0; k-- ) {
								ctx_.lineTo( b[ k ].p1[ 0 ], b[ k ].p1[ 1 ] );
							}
						}
						ctx_.closePath();
					}
					ctx_.fill( "evenodd" );
					ctx_.stroke();


					b = build_[ i ];
					var text = b.feature.get( _self.labelColumn );

					if ( text ) {
						var center = naji.util.njMapGeoSpatialUtil.getGeomCenter( b.feature.getGeometry() );
						var p = _self._hvector( center, _self._getFeatureHeight( b.feature ) ).p1;

						var f = ctx_.fillStyle;

						var m = ctx_.measureText( text );
						var h = Number( ctx_.font.match( /\d+(\.\d+)?/g ).join( [] ) );
						ctx_.fillStyle = "rgba(255,255,255,0.5)";
						ctx_.fillRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )
						ctx_.strokeRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )

						ctx_.font = "bold 12px Verdana";
						ctx_.fillStyle = 'black';
						ctx_.textAlign = 'center';
						ctx_.textBaseline = 'bottom';
						ctx_.fillText( text, p[ 0 ], p[ 1 ] );

						ctx_.fillStyle = f;
					}

					break;
				}

				case "Point" : {
					b = build_[ i ];
					var text = b.feature.get( _self.labelColumn );

					if ( text ) {
						var p = b.geom.p1;
						var f = ctx_.fillStyle;
						ctx_.fillStyle = ctx_.strokeStyle;
						ctx_.textAlign = 'center';
						ctx_.textBaseline = 'bottom';
						ctx_.fillText( text, p[ 0 ], p[ 1 ] );
						var m = ctx_.measureText( text );
						var h = Number( ctx_.font.match( /\d+(\.\d+)?/g ).join( [] ) );
						ctx_.fillStyle = "rgba(255,255,255,0.5)";
						ctx_.fillRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )
						ctx_.strokeRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )
						ctx_.fillStyle = f;
					}

					break;
				}
				default :
					break;
			}
		}
	} );


	/**
	 * Check if animation is on
	 * 
	 * @private
	 * 
	 * @return {Boolean} 현재 animation 상태.
	 */
	naji.etc.njMapRender3D.prototype._animating = ( function() {
		var _self = this._this || this;

		if ( _self.animate && new Date().getTime() - _self.animate > _self.animateDuration ) {
			_self.animate = false;
		}

		return !!_self.animate;
	} );


	/**
	 * 3D 렌더링 ON/OFF 설정을 한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	naji.etc.njMapRender3D.prototype.setBuild3D = ( function(state_) {
		var _self = this._this || this;

		if ( state_ ) {
			_self.buildState = true;
			_self.toHeight = _self._getHfn( _self.heightColumn );
		} else {
			_self.buildState = false;
			_self.toHeight = _self._getHfn( 0 );
		}

		_self.animate = new Date().getTime();

		// Force redraw
		_self.layer.changed();
	} );
	
	
	/**
	 * 3D 렌더링 ON/OFF 상태를 토글한다.
	 */
	naji.etc.njMapRender3D.prototype.buildToggle = ( function() {
		var _self = this._this || this;
		_self.setBuild3D( !_self.buildState );
	} );
	
	
	/**
	 * 3D 렌더링 ON/OFF 상태를 가져온다.
	 * 
	 * @return {Boolean} 현재 렌더링 ON/OFF 상태.
	 */
	naji.etc.njMapRender3D.prototype.isBuild3D = ( function() {
		var _self = this._this || this;
		_self.setBuild3D( !_self.buildState );
	} );

} )();
( function() {
	"use strict";

	/**
	 * njMapsPlatform 지형 공간 유틸리티.
	 * 
	 * 지형 공간 정보 처리에 필요한 유틸리티 객체.
	 * 
	 * @namespace
	 */
	naji.util.njMapGeoSpatialUtil = ( function() {

		return {
			toRadians : this.toRadians,
			toDegrees : this.toDegrees,
			getGeomCenter : this.getGeomCenter,
			getLargestPolygon : this.getLargestPolygon,
			getLargestLineString : this.getLargestLineString,
			lineToArcTransForm : this.lineToArcTransForm,
			getRadianBtwPoints : this.getRadianBtwPoints,
			getDegreeBtwPoints : this.getDegreeBtwPoints,
			getDistanceBtwPotins : this.getDistanceBtwPotins
		}

	} );


	/**
	 * Radian을 Degree로 변환한다.
	 * 
	 * @param degree {Number} Degree(도).
	 * 
	 * @return {Number} Radian(라디안).
	 */
	naji.util.njMapGeoSpatialUtil.prototype.toRadians = function(degree_) {
		return degree_ / 180.0 * Math.PI;
	};


	/**
	 * Degree를 Radian으로 변환한다.
	 * 
	 * @param radian {Number} Radian(라디안).
	 * 
	 * @return {Number} Degree(도).
	 */
	naji.util.njMapGeoSpatialUtil.prototype.toDegrees = function(radian_) {
		return radian_ * 180.0 / Math.PI;
	};


	/**
	 * 두 점 사이의 Radian(라디안)을 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 Radian(라디안).
	 */
	naji.util.njMapGeoSpatialUtil.prototype.getRadianBtwPoints = function(coordinate1, coordinate2) {
		var pX1 = coordinate1[ 0 ];
		var pY1 = coordinate1[ 1 ];
		var pX2 = coordinate2[ 0 ];
		var pY2 = coordinate2[ 1 ];

		return Math.atan2( pY2 - pY1, pX2 - pX1 );
	};


	/**
	 * 두 점 사이의 Degree(도)를 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 Degree(도).
	 */
	naji.util.njMapGeoSpatialUtil.prototype.getDegreeBtwPoints = function(coordinate1, coordinate2) {
		var radian = this.getRadianBtwPoints( coordinate1, coordinate2 );

		return this.toDegrees( radian );
	};


	/**
	 * 두 점 사이의 거리를 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 거리.
	 */
	naji.util.njMapGeoSpatialUtil.prototype.getDistanceBtwPotins = function(c1, c2) {
		return Math.sqrt( Math.pow( ( c1[ 0 ] - c2[ 0 ] ), 2 ) + Math.pow( ( c1[ 1 ] - c2[ 1 ] ), 2 ) );
	};


	/**
	 * 일반 라인을 호 형태의 라인으로 변환한다.
	 * 
	 * -featureList는 피처의 속성이 `ol.geom.LineString`또는 `ol.geom.MultiLineString`이다.
	 * 
	 * @param originCRS {String} 피처 원본 좌표계.
	 * @param featureList {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 변활할 피처 리스트.
	 * 
	 * @return reData {Array.<ol.Feature.<ol.geom.LineString>>} 변환된 호 형태의 피처 리스트.
	 */
	naji.util.njMapGeoSpatialUtil.prototype.lineToArcTransForm = function(originCRS_, featureList_) {
		var _self = this;
		var reData = [];
		var transFormFeatures = [];

		( function() {
			var features = featureList_.slice();

			for ( var i = 0; i < features.length; i++ ) {
				var geom = features[ i ].getGeometry();

				if ( !geom ) {
					continue;
				}

				if ( geom instanceof ol.geom.LineString ) {
					transFormFeatures.push( new ol.Feature( {
						geometry : geom
					} ) );
				} else if ( geom instanceof ol.geom.MultiLineString ) {
					var lineStrings = geom.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						transFormFeatures.push( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				}
			}

			_transFormArc();

		} )();


		function _transFormArc() {
			for ( var j = 0; j < transFormFeatures.length; j++ ) {
				var customCoordinates = [];
				var coords = transFormFeatures[ j ].getGeometry().getCoordinates();

				for ( var i = 0; i < coords.length - 1; i++ ) {
					var from = coords[ i ];
					var to = coords[ i + 1 ];
					var dist = _self.getDistanceBtwPotins( from, to );
					var midPoint = _draw_curve( from, to, ( dist / 5 ) );

					var line = {
						type : "Feature",
						properties : {},
						geometry : {
							type : "LineString",
							coordinates : [ from, midPoint, to ]
						}
					};

					var curved = turf.bezier( line, 3000, 1.5 );
					customCoordinates = customCoordinates.concat( curved[ "geometry" ][ "coordinates" ] );
				}

				var newFeature = new ol.Feature( {
					geometry : new ol.geom.LineString( customCoordinates )
				} );

				reData.push( newFeature );
			}
		}


		function _draw_curve(from_, to_, dist_) {
			// Find midpoint J
			var Ax = from_[ 0 ];
			var Ay = from_[ 1 ];
			var Bx = to_[ 0 ];
			var By = to_[ 1 ];

			var Jx = Ax + ( Bx - Ax ) / 5 * 3;
			var Jy = Ay + ( By - Ay ) / 5 * 3;

			var a = Bx - Ax;
			var b = By - Ay;
			var asign = ( a < 0 ? -1 : 1 );
			var bsign = ( b < 0 ? -1 : 1 );
			var theta = Math.atan( b / a );

			// Find the point that's perpendicular to J on side
			var costheta = asign * Math.cos( theta );
			var sintheta = asign * Math.sin( theta );

			// Find c and d
			var c = dist_ * sintheta;
			var d = dist_ * costheta;

			// Use c and d to find Kx and Ky
			var Kx = Jx - c;
			var Ky = Jy + d;

			return [ Kx, Ky ];
		}

		return reData;
	};


	/**
	 * MultiLineString의 가장 큰 LineString을 가져온다.
	 * 
	 * @param geom_ {ol.geom.MultiLineString} MultiLineString.
	 * 
	 * @return {LineString} 가장 큰 LineString.
	 */
	naji.util.njMapGeoSpatialUtil.prototype.getLargestLineString = function(geom_) {
		if ( !geom_ || geom_.getType() !== ol.geom.GeometryType.MULTI_LINE_STRING ) return false;

		return geom_.getLineStrings().reduce( function(left, right) {
			return left.getLength() > right.getLength() ? left : right;
		} );
	};


	/**
	 * MultiPolygon의 가장 큰 Polygon을 가져온다.
	 * 
	 * @param geom_ {ol.geom.MultiPolygon} MultiPolygon.
	 * 
	 * @return {Polygon} 가장 큰 Polygon.
	 */
	naji.util.njMapGeoSpatialUtil.prototype.getLargestPolygon = function(geom_) {
		if ( !geom_ || geom_.getType() !== ol.geom.GeometryType.MULTI_POLYGON ) return false;

		return geom_.getPolygons().reduce( function(left, right) {
			return left.getArea() > right.getArea() ? left : right;
		} );
	};


	/**
	 * Geometry의 중심점을 가져온다.
	 * 
	 * @param geom {ol.geom.Geometry} Geometry.
	 * 
	 * @return {Array.<Number>} 중심점[x, y].
	 */
	naji.util.njMapGeoSpatialUtil.prototype.getGeomCenter = function(geom_) {
		if ( !geom_ || !geom_ instanceof ol.geom.Geometry ) return false;

		var coordinate = [];
		var geometry = geom_;
		var geometryType = geometry.getType();

		switch ( geometryType ) {
			case ol.geom.GeometryType.POINT :
			case ol.geom.GeometryType.MULTI_POINT :
				coordinate = geometry.getFlatCoordinates();
				break;

			case ol.geom.GeometryType.CIRCLE :
				coordinate = geometry.getCenter();

				break;
			case ol.geom.GeometryType.LINE_STRING :
				coordinate = geometry.getFlatMidpoint();
				break;

			case ol.geom.GeometryType.MULTI_LINE_STRING :
				coordinate = this.getLargestLineString( geometry ).getFlatMidpoint();
				break;

			case ol.geom.GeometryType.POLYGON :
				coordinate = geometry.getFlatInteriorPoint();
				break;

			case ol.geom.GeometryType.MULTI_POLYGON :
				// coordinate = this.getLargestPolygon( geometry ).getInteriorPoint().getCoordinates();
				coordinate = this.getLargestPolygon( geometry ).getFlatInteriorPoint();
				break;
		}

		return coordinate;
	};


	naji.util.njMapGeoSpatialUtil = new naji.util.njMapGeoSpatialUtil();

} )();

/**
 * @namespace naji.util
 */

( function() {
	"use strict";

	/**
	 * njMapsPlatform 유틸리티.
	 * 
	 * njMapsPlatform에서 자주 사용하는 유틸리티 객체.
	 * 
	 * @namespace
	 */
	naji.util.njMapUtil = ( function() {

		return {
			isXMLDoc : this.isXMLDoc,
			xmlToJson : this.xmlToJson,
			objectMerge : this.objectMerge,
			cloneStyle : this.cloneStyle,
			cloneFeature : this.cloneFeature,
			cloneFeatures : this.cloneFeatures,
			cloneGeometry : this.cloneGeometry,
			generateUUID : this.generateUUID,
			appendParams : this.appendParams,
			setCssTextStyle : this.setCssTextStyle,
			numberWithCommas : this.numberWithCommas
		}

	} );


	/**
	 * 숫자 1000단위 콤마 표시.
	 * 
	 * @param num {Number|String} 숫자.
	 * 
	 * @return {String} 1000단위 (세 자리마다 콤마 표시).
	 */
	naji.util.njMapUtil.prototype.numberWithCommas = function(num_) {
		if ( !num_ ) return 0;
		var parts = num_.toString().split( "." );
		return parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," ) + ( parts[ 1 ] ? "." + parts[ 1 ] : "" );
	};


	/**
	 * XML을 JSON으로 변환한다.
	 * 
	 * @param xml {Document} XML.
	 * 
	 * @return obj {Object} JSON.
	 */
	naji.util.njMapUtil.prototype.xmlToJson = function(xml_) {

		// Create the return object
		var obj = {};

		if ( xml_.nodeType == 1 ) { // element
			// do attributes
			if ( xml_.attributes.length > 0 ) {
				obj[ "@attributes" ] = {};
				for ( var j = 0; j < xml_.attributes.length; j++ ) {
					var attribute = xml_.attributes.item( j );
					obj[ "@attributes" ][ attribute.nodeName ] = attribute.nodeValue;
				}
			}
		} else if ( xml_.nodeType == 3 ) { // text
			obj = xml_.nodeValue;
		}

		// do children
		if ( xml_.hasChildNodes() ) {
			for ( var i = 0; i < xml_.childNodes.length; i++ ) {
				var item = xml_.childNodes.item( i );
				var nodeName = item.nodeName;
				if ( typeof ( obj[ nodeName ] ) == "undefined" ) {
					obj[ nodeName ] = this.xmlToJson( item );
				} else {
					if ( typeof ( obj[ nodeName ].push ) == "undefined" ) {
						var old = obj[ nodeName ];
						obj[ nodeName ] = [];
						obj[ nodeName ].push( old );
					}
					obj[ nodeName ].push( this.xmlToJson( item ) );
				}
			}
		}

		return obj;
	};


	/**
	 * 객체가 Document인지 체크한다.
	 * 
	 * @param a {Object} 체크할 객체.
	 * 
	 * @return b {Boolean} 해당 객체가 Document면 `true` 아니면 `false`.
	 */
	naji.util.njMapUtil.prototype.isXMLDoc = function(a) {
		var b = a && ( a.ownerDocument || a ).documentElement;
		return !!b && "HTML" !== b.nodeName;
	};


	/**
	 * JSON 파라미터를 URI에 GET 방식으로 붙인다.
	 * 
	 * @param uri {String} URI.
	 * @param params {Object} 추가할 JSON 파라미터 객체.
	 * 
	 * @return uri {String} JSON 파라미터가 추가된 URI.
	 */
	naji.util.njMapUtil.prototype.appendParams = function(uri_, params_) {
		var keyParams = [];
		Object.keys( params_ ).forEach( function(k) {
			if ( params_[ k ] !== null && params_[ k ] !== undefined ) {
				keyParams.push( k + "=" + encodeURIComponent( params_[ k ] ) );
			}
		} );
		var qs = keyParams.join( "&" );
		uri_ = uri_.replace( /[?&]$/, "" );
		uri_ = uri_.indexOf( "?" ) === -1 ? uri_ + "?" : uri_ + "&";

		return uri_ + qs;
	};


	/**
	 * UUID 생성를 생성한다.
	 * 
	 * @return uuid {String} UUID.
	 */
	naji.util.njMapUtil.prototype.generateUUID = function() {
		var d = new Date().getTime();
		var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function(c) {
			var r = ( d + Math.random() * 16 ) % 16 | 0;
			d = Math.floor( d / 16 );
			return ( c == "x" ? r : ( r & 0x3 | 0x8 ) ).toString( 16 );
		} );

		return uuid;
	};


	/**
	 * 두 객체를 병합한다. 중복된 Key의 데이터일 경우 덮어쓴다.
	 * 
	 * @return object {Object} 병합된 Object.
	 */
	naji.util.njMapUtil.prototype.objectMerge = function() {
		var options, name, src, copy, copyIsArray, clone, target = arguments[ 0 ] || {}, i = 1, length = arguments.length, deep = false;

		if ( typeof target === "boolean" ) {
			deep = target;

			target = arguments[ i ] || {};
			i++;
		}

		if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
			target = {};
		}

		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			if ( ( options = arguments[ i ] ) != null ) {
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					if ( target === copy ) {
						continue;
					}

					if ( deep && copy && ( jQuery.isPlainObject( copy ) || ( copyIsArray = Array.isArray( copy ) ) ) ) {

						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && Array.isArray( src ) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject( src ) ? src : {};
						}

						target[ name ] = jQuery.extend( deep, clone, copy );

					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		return target;
	};


	/**
	 * DOM Element 스타일 추가/업데이트 한다.
	 * 
	 * @param el {Element} 대상 Element.
	 * @param style {String} 적용할 스타일명.
	 * @param value {String} 스타일 속성.
	 */
	naji.util.njMapUtil.prototype.setCssTextStyle = function(el, style, value) {
		var result = el.style.cssText.match( new RegExp( "(?:[;\\s]|^)(" + style.replace( "-", "\\-" ) + "\\s*:(.*?)(;|$))" ) ), idx;
		if ( result ) {
			idx = result.index + result[ 0 ].indexOf( result[ 1 ] );
			el.style.cssText = el.style.cssText.substring( 0, idx ) + style + ": " + value + ";" + el.style.cssText.substring( idx + result[ 1 ].length );
		} else {
			el.style.cssText += " " + style + ": " + value + ";";
		}
	};


	/**
	 * geometry 객체를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param geometry {ol.geom} 복사할 geometry 객체.
	 * 
	 * @return {ol.geom} 복사한 geometry 객체.
	 */
	naji.util.njMapUtil.prototype.cloneGeometry = function(geometry_) {
		return ol.geom[ geometry_.getType() ].prototype.clone.call( geometry_ );
	};


	/**
	 * 피처를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param feature {ol.Feature} 복사할 피처 객체.
	 * 
	 * @return cloneFt {ol.Feature} 복사한 피처.
	 */
	naji.util.njMapUtil.prototype.cloneFeature = function(feature_) {
		var cloneFt = new ol.Feature( feature_.getProperties() );
		cloneFt.setGeometryName( feature_.getGeometryName() );

		var geometry = feature_.getGeometry();
		if ( geometry ) {
			cloneFt.setGeometry( this.cloneGeometry( geometry ) );
		}
		var style = feature_.getStyle();
		if ( style ) {
			cloneFt.setStyle( style );
		}
		return cloneFt;
	};


	/**
	 * 피처리스트를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param feature {Array.<ol.Feature>} 복사할 피처리스트 객체.
	 * 
	 * @return array {Array.<ol.Feature>} 복사한 피처리스트.
	 */
	naji.util.njMapUtil.prototype.cloneFeatures = function(features_) {
		if ( !Array.isArray( features_ ) ) return false;

		var array = [];
		for ( var i in features_ ) {
			array.push( this.cloneFeature( features_[ i ] ) );
		}

		return array;
	};


	/**
	 * 스타일을 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param style {ol.style.Style} 복사할 스타일 객체.
	 * 
	 * @return style {ol.style.Style} 복사한 스타일.
	 */
	naji.util.njMapUtil.prototype.cloneStyle = function(style_) {
		var geometry = style_.getGeometry();

		if ( geometry && geometry.clone ) {
			geometry = this.cloneGeometry( geometry )
		}

		return new ol.style.Style( {
			geometry : geometry,
			fill : style_.getFill() ? style_.getFill().clone() : undefined,
			image : style_.getImage() ? style_.getImage().clone() : undefined,
			stroke : style_.getStroke() ? style_.getStroke().clone() : undefined,
			text : style_.getText() ? style_.getText().clone() : undefined,
			zIndex : style_.getZIndex()
		} );
	};


	naji.util.njMapUtil = new naji.util.njMapUtil();

} )();

( function() {
	"use strict";

	/**
	 * WFS DWithin filter
	 * 
	 * Initialize
	 * 
	 * @return ol.format.filter.DWithin
	 */
	ol.format.filter.dwithin = ( function(geometryName, geometry, opt_srsName, distance, opt_units) {
		var _self = this;


		/**
		 * Initialize
		 */
		( function() {

			ol.format.filter.DWithin = _DWithin;

			ol.inherits( ol.format.filter.DWithin, ol.format.filter.Spatial );

			ol.format.WFS.GETFEATURE_SERIALIZERS_[ "http://www.opengis.net/ogc" ][ "DWithin" ] = ol.xml.makeChildAppender( _writeWithinFilter );

		} )();
		// END initialize


		function _DWithin(geometryName, geometry, opt_srsName, distance, opt_units) {
			ol.format.filter.Spatial.call( this, "DWithin", geometryName, geometry, opt_srsName );

			this.distance = distance;
			this.units = opt_units || "m"; // http://www.opengeospatial.org/se/units/metre
		}


		function _writeWithinFilter(node, filter, objectStack) {
			var context = objectStack[ objectStack.length - 1 ];
			context[ "srsName" ] = filter.srsName;

			ol.format.WFS.writeOgcPropertyName_( node, filter.geometryName );
			ol.format.GML3.prototype.writeGeometryElement( node, filter.geometry, objectStack );

			var distanceNode = ol.xml.createElementNS( "http://www.opengis.net/ogc", "Distance" );
			distanceNode.setAttribute( "units", filter.units );
			ol.format.XSD.writeStringTextNode( distanceNode, filter.distance + "" );
			node.appendChild( distanceNode );
		}

		
		return new ol.format.filter.DWithin( geometryName, geometry, opt_srsName, distance, opt_units );
	} );

} )();

( function() {
	"use strict";

	/**
	 * WFS DescribeFeatureType 객체.
	 * 
	 * OGC 표준의 WFS DescribeFeatureType 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapDescribeFeatureType = new naji.service.njMapDescribeFeatureType( {
	 * 	useProxy : true,
	 * 	version : '1.1.0',
	 * 	serviceURL : 'url',
	 * 	dataViewId : njMap.getDataViewId(),
	 * 	typeName : 'LAYER_NAME'
	 * } );
	 * 
	 * njMapDescribeFeatureType.then( function(res_) {
	 * 	if ( res_.state ) {
	 * 		console.log( res_.data );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전. Default is `1.1.0`.
	 * @param opt_options.useProxy {Boolean} 프록시 사용여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL. Default is `""`.
	 * @param opt_options.dataViewId {String} View ID. Default is `""`.
	 * 
	 * @return {jQuery.Deferred} jQuery.Deferred.
	 * 
	 * @class
	 */
	naji.service.njMapDescribeFeatureType = ( function(opt_options) {
		var _self = this;

		this.version = null;
		this.useProxy = null;
		this.typeName = null;
		this.serviceURL = null;
		this.dataViewId = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.version = ( options.version !== undefined ) ? options.version : "1.1.0";
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.typeName = ( options.typeName !== undefined ) ? options.typeName : "";
			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";
			_self.serviceURL = ( typeof ( options.serviceURL ) === "string" ) ? options.serviceURL : "";

			_self._callAjax();

		} )();
		// END Initialize


		return _self.promise;

	} );


	/**
	 * DescribeFeatureType OGC 표준 속성.
	 * 
	 * @private
	 * 
	 * @retrun attribute {Object}
	 */
	naji.service.njMapDescribeFeatureType.prototype._getAttribute = function() {
		var attribute = {
			SERVICE : "WFS",
			VERSION : this.version,
			REQUEST : "DescribeFeatureType",
			TYPENAME : this.typeName
		};

		return attribute;
	};


	/**
	 * DescribeFeatureType 요청.
	 * 
	 * @private
	 * 
	 * @return promise
	 */
	naji.service.njMapDescribeFeatureType.prototype._callAjax = function() {
		var _self = this;

		_self.promise = _$.Deferred();

		var url = naji.util.njMapUtil.appendParams( _self.serviceURL, _self._getAttribute() );

		if ( _self.useProxy ) {
			url = naji.njMapConfig.getProxy() + url;
		}

		var response = new naji.njMapHttp.requestData( {
			url : url,
			type : "GET",
			loading : true,
			contentType : "",
			dataType : "XML",
			dataViewId : _self.dataViewId,
		} );

		response.then( function(response_) {
			// -To do : response가 text일 경우 처리.
			var resolveData = {
				state : false,
				message : undefined,
				data : {
					xmlJson : undefined,
					document : response_,
					serviceMetaData : undefined
				}
			};

			try {
				var xmlJson = naji.util.njMapUtil.xmlToJson( response_ );

				if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport" || response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
					var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
					resolveData.state = false;
					resolveData.message = "ServiceExceptionReport : \n" + message;
				} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport" || response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
					var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
					resolveData.state = false;
					resolveData.message = "ExceptionReport : \n" + message;
				} else {
					resolveData.state = true;
					resolveData.data.xmlJson = xmlJson;
					resolveData.data.serviceMetaData = _self._getServiceMetaData( xmlJson );
				}

				_self.promise.resolveData = resolveData;
				_self.promise.resolve( resolveData );

			} catch ( e ) {
				_self.promise.reject( e );
			}

		}, function(result_) {
			_self.promise.reject( result_ );
		} );
	};


	/**
	 * DescribeFeatureType 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} 메타데이터
	 */
	naji.service.njMapDescribeFeatureType.prototype._getServiceMetaData = function(xmlJson_) {
		var _self = this;

		var json = xmlJson_;

		var sequence = {};
		var findGeomType = false;
		var geometryName = "the_geom";
		var tempSequence = json[ "xsd:schema" ][ "xsd:complexType" ][ "xsd:complexContent" ][ "xsd:extension" ][ "xsd:sequence" ][ "xsd:element" ];

		for ( var i in tempSequence ) {
			var name = tempSequence[ i ][ "@attributes" ][ "name" ];
			var type = tempSequence[ i ][ "@attributes" ][ "type" ];

			if ( !findGeomType ) {
				if ( type.split( ":" )[ 0 ] === "gml" ) {
					findGeomType = true;
					geometryName = name;
					continue;
				}
			}

			sequence[ name ] = type.split( ":" )[ 1 ];
		}

		return {
			sequence : sequence,
			geometryName : geometryName
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS getFeature 서비스 객체.
	 * 
	 * OGC 표준의 WFS getFeature 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapFeatures = new naji.service.njMapGetFeature( {
	 * 	useProxy : true,
	 * 	srsName : 'EPSG:3857',
	 * 	maxFeatures : 100,
	 * 	typeName : 'world_country',
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	filter : new ol.format.filter.like( 'NAME', 'South*' )
	 * } );
	 * 
	 * njMapFeatures.then( function(res) {
	 * 	console.log( res.features );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.filter {ol.format.filter.Filter} 필터. Default is `undefined`.
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} WFS 서비스 URL. Default is `""`.
	 * @param opt_options.typeName {String} 레이어명. Default is `""`.
	 * @param opt_options.maxFeatures {Boolean} 피쳐 최대 요청 갯수. Default is `1000`.
	 * @param opt_options.outputFormat {String} outputFormat. Default is `text/xml; subtype=gml/3.1.1`.
	 * @param opt_options.dataViewId {String} View ID. Default is `""`.
	 * 
	 * @return {jQuery.Deferred} jQuery.Deferred.
	 * 
	 * @class
	 */
	naji.service.njMapGetFeature = ( function(opt_options) {
		var _self = this;

		this.filter = null;
		this.srsName = null;
		this.useProxy = null;
		this.serviceURL = null;
		this.typeName = null;
		this.maxFeatures = null;
		this.outputFormat = null;
		this.dataViewId = null;

		this.deferred = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};
			_self.deferred = _$.Deferred();

			_self.filter = ( options.filter !== undefined ) ? options.filter : undefined;
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.serviceURL = ( options.serviceURL !== undefined ) ? options.serviceURL : "";
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.typeName = ( options.typeName !== undefined ) ? options.typeName : [];
			_self.maxFeatures = ( options.maxFeatures !== undefined ) ? options.maxFeatures : 1000;
			_self.outputFormat = ( options.outputFormat !== undefined ) ? options.outputFormat : "text/xml; subtype=gml/3.1.1";
			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

			var featureRequest = new ol.format.WFS().writeGetFeature( {
				filter : _self.filter,
				// featureNS : "",
				srsName : _self.srsName,
				featureTypes : [ _self.typeName ],
				maxFeatures : _self.maxFeatures,
				outputFormat : _self.outputFormat
			} );

			var url = _self.serviceURL;

			if ( _self.useProxy ) {
				url = naji.njMapConfig.getProxy() + url;
			}

			var response = new naji.njMapHttp.requestData( {
				url : url,
				dataType : "",
				type : "POST",
				contentType : "text/xml",
				dataViewId : _self.dataViewId,
				data : new XMLSerializer().serializeToString( featureRequest )
			} );

			response.then(
					function(response_) {
						// -To do : response가 text일 경우 처리.
						var data = {
							state : false,
							message : null,
							features : null,
							typeName : _self.typeName
						};

						try {
							if ( naji.util.njMapUtil.isXMLDoc( response_ ) ) {
								var xmlJson = naji.util.njMapUtil.xmlToJson( response_ );
								if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport"
										|| response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
									var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
									data.state = false;
									data.message = "ServiceExceptionReport : " + "<br>" + message;
								} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport"
										|| response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
									var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
									data.state = false;
									data.message = "ExceptionReport : " + "<br>" + message;
								} else {
									data.state = true;
									data.features = new ol.format.WFS().readFeatures( response_ );
								}
							} else {
								data.state = true;
								data.features = new ol.format.GeoJSON().readFeatures( response_ );
							}

							_self.deferred.resolve( data );

						} catch ( e ) {
							_self.deferred.reject( e );
						}
					} ).fail( function(result_) {
				_self.deferred.reject( result_ );
			} );

		} )();
		// END initialize


		return _self.deferred.promise();

	} );

} )();

/**
 * @namespace naji.service
 */

( function() {
	"use strict";

	/**
	 * GetCapabilities 서비스 기본 객체.
	 * 
	 * OGC 표준의 GetCapabilities 서비스를 요청하는 객체로 도메인이 다를 경우 프록시로 요청하여야 한다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.service {String} 서비스 타입 (WMS, WFS, WFS, WCS, WMTS). Default is `WMS`.
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @class
	 */
	naji.service.njMapGetCapabilitiesDefault = ( function(opt_options) {
		var _self = this;

		this.service = null;
		this.version = null;
		this.useProxy = null;
		this.serviceURL = null;
		this.dataViewId = null;

		this.request = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.request = "GetCapabilities";
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.service = ( typeof ( options.service ) === "string" ) ? options.service : "WMS";
			_self.serviceURL = ( typeof ( options.serviceURL ) === "string" ) ? options.serviceURL : "";

			_self._setVersion( options.version );

			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

		} )();
		// END Initialize


		return {
			getAttribute : _self.getAttribute
		}

	} );


	/**
	 * 타입별 버전 설정.
	 * 
	 * @private
	 * 
	 * @param version {String} 서비스 버전
	 */
	naji.service.njMapGetCapabilitiesDefault.prototype._setVersion = function(version_) {
		var _self = this._this || this;

		if ( version_ ) {
			_self.version = version_;
		} else {
			switch ( _self.service ) {
				case "WMS" :
					_self.version = "1.3.0";
					break;
				case "WFS" :
					_self.version = "1.1.0";
					break;
				case "WCS" :
					_self.version = "1.1.1";
					break;
				case "WMTS" :
					_self.version = "1.0.0";
					break;
				default :
					_self.version = "1.3.0";
			}
		}
	};


	/**
	 * Capabilities OGC 표준 속성을 가져온다.
	 * 
	 * @retrun attribute {Object} OGC 표준 속성.
	 */
	naji.service.njMapGetCapabilitiesDefault.prototype.getAttribute = function() {
		var _self = this._this || this;

		var attribute = {
			SERVICE : _self.service,
			VERSION : _self.version,
			REQUEST : _self.request
		};

		return attribute;
	};


	/**
	 * 해당 서비스 getCapabilities를 요청한다.
	 * 
	 * @private
	 * 
	 * @return promise
	 */
	naji.service.njMapGetCapabilitiesDefault.prototype.callAjax = function() {
		var _self = this._this || this;

		var deferred = _$.Deferred();

		var url = naji.util.njMapUtil.appendParams( _self.serviceURL, _self.getAttribute() );

		if ( _self.useProxy ) {
			url = naji.njMapConfig.getProxy() + url;
		}

		var response = new naji.njMapHttp.requestData( {
			url : url,
			type : "GET",
			loading : true,
			contentType : "",
			dataType : "XML",
			dataViewId : _self.dataViewId,
		} );

		response.then( function(response_) {
			// -To do : response가 text일 경우 처리.
			var data = {
				state : false,
				message : null,
				xmlJson : null,
				document : response_
			};

			try {
				var xmlJson = naji.util.njMapUtil.xmlToJson( response_ );
				data.xmlJson = xmlJson;

				if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport" || response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
					var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
					data.state = false;
					data.message = "ServiceExceptionReport : " + "<br>" + message;
				} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport" || response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
					var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
					data.state = false;
					data.message = "ExceptionReport : " + "<br>" + message;
				} else {
					data.state = true;
				}

				deferred.resolve( data );

			} catch ( e ) {
				deferred.reject( e );
			}
		} ).fail( function(result) {
			deferred.reject( result );
		} );

		return deferred.promise();
	};

} )();

( function() {
	"use strict";

	/**
	 * WCS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WCS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapGetCapabilitiesWCS = new naji.service.njMapGetCapabilitiesWCS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wcs?KEY=key',
	 * 	version : '2.0.1',
	 * 	dataViewId : njMap.getDataViewId()
	 * } );
	 * 
	 * njMapGetCapabilitiesWCS.then( function() {
	 * 	console.log( njMapGetCapabilitiesWCS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {naji.service.njMapGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	naji.service.njMapGetCapabilitiesWCS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WCS";

			_super = naji.service.njMapGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
					olJson : undefined,
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : _self.getServiceMetaDataWCS( result_.xmlJson )
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	naji.service.njMapGetCapabilitiesWCS.prototype = Object.create(naji.service.njMapGetCapabilitiesDefault.prototype);
	naji.service.njMapGetCapabilitiesWCS.prototype.constructor = naji.service.njMapGetCapabilitiesWCS;
	
	
	/**
	 * WCS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	naji.service.njMapGetCapabilitiesWCS.prototype.getServiceMetaDataWCS = function(xmlJson_) {
    	var json = xmlJson_;
    	var version = json["wcs:Capabilities"]["@attributes"]["version"];
        var title = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Title"];
        title = ( title ) ? title["#text"] : "null";
		var abstract = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"];
		abstract = ( abstract ) ? abstract["#text"] : "null";
		var fees = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Fees"];
		fees = ( fees ) ? fees["#text"] : "null";
		var accessconstraints = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"];
		accessconstraints = ( accessconstraints ) ? accessconstraints["#text"] : "null";
        var crs = "EPSG:4326";
		
        var keywordList = [];
        var keywords = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"];
        if ( keywords ) {
        	keywords = keywords["ows:Keyword"];
        	for(var i in keywords) {
                keywordList.push( keywords[i]["#text"] );
            }
        }        
        
        var providerName = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        providerName = ( providerName ) ? providerName["#text"] : "null";
        var providerSite = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        providerSite = ( providerSite ) ? providerSite["#text"] : "null";
        // var serviceContact =
		// json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];
        
        var tempSupportedFormat = json["wcs:Capabilities"]["wcs:Contents"]["wcs:SupportedFormat"];
        
        var supportedFormats = [];
        for(var i in tempSupportedFormat) {
            supportedFormats.push( tempSupportedFormat[i]["#text"] );
        }
        
        var tempCoverageSummary = json["wcs:Capabilities"]["wcs:Contents"]["wcs:CoverageSummary"];
        
        if ( !Array.isArray( tempCoverageSummary ) ) {
            tempCoverageSummary = [ tempCoverageSummary ];
        }
        
        var coverages = [];
        for(var i in tempCoverageSummary) {
            var lowerCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"];
            if ( lowerCorner ) {
            	lowerCorner = lowerCorner["ows:LowerCorner"]["#text"];
            } else {
            	lowerCorner = tempCoverageSummary[i]["ows:BoundingBox"]["ows:LowerCorner"]["#text"];
            }
            
            var upperCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"];
            if ( upperCorner ) {
            	upperCorner = upperCorner["ows:UpperCorner"]["#text"];
            } else {
            	upperCorner = tempCoverageSummary[i]["ows:BoundingBox"]["ows:UpperCorner"]["#text"];
            }
            
            var extent = [];
            extent[0] = parseFloat( ( lowerCorner.split(" ") )[0] );
            extent[1] = parseFloat( ( lowerCorner.split(" ") )[1] );
            extent[2] = parseFloat( ( upperCorner.split(" ") )[0] );
            extent[3] = parseFloat( ( upperCorner.split(" ") )[1] );
            
            var identifier;
            if ( version === "2.0.1" ) {
            	identifier = tempCoverageSummary[i][ "wcs:CoverageId" ];
            	identifier = ( identifier ) ? identifier["#text"] : tempCoverageSummary[i][ "CoverageId" ]["#text"];
            } else {
            	identifier = tempCoverageSummary[i][ "wcs:Identifier" ];
            	identifier = ( identifier ) ? identifier["#text"] : tempCoverageSummary[i][ "Identifier" ]["#text"];
            }
            
            coverages.push( {
                Identifier : identifier,
                BBOX : extent
            } );
        }
        
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            coverages : coverages,
            keywords : keywordList,
            providerSite : providerSite,
            providerName : providerName,
            accessconstraints : accessconstraints,
            supportedFormats : supportedFormats
        };
        
        return metaData;
    };

} )();

( function() {
	"use strict";

	/**
	 * WFS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WFS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapGetCapabilitiesWFS = new naji.service.njMapGetCapabilitiesWFS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	version : '1.1.0',
	 * 	dataViewId : njMap.getDataViewId()
	 * } );
	 * 
	 * njMapGetCapabilitiesWFS.then( function() {
	 * 	console.log( njMapGetCapabilitiesWFS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {naji.service.njMapGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	naji.service.njMapGetCapabilitiesWFS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WFS";

			_super = naji.service.njMapGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : _self.getServiceMetaDataWFS( result_.xmlJson )
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	naji.service.njMapGetCapabilitiesWFS.prototype = Object.create(naji.service.njMapGetCapabilitiesDefault.prototype);
	naji.service.njMapGetCapabilitiesWFS.prototype.constructor = naji.service.njMapGetCapabilitiesWFS;
	
	
	/**
	 * WFS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	naji.service.njMapGetCapabilitiesWFS.prototype.getServiceMetaDataWFS = function(xmlJson_) {
    	var json = xmlJson_;
        
        var title = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Title"]["#text"];
		var abstract = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"]["#text"];
		var fees = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Fees"]["#text"];
		var accessconstraints = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"]["#text"];
        var crs = "EPSG:4326";
        var keywordList = [];
        var keywords = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"]["ows:Keyword"];
        for(var i in keywords) {
            keywordList.push( keywords[i]["#text"] );
        }
        
        var providerName = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        var providerSite = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        
        if ( providerName !== undefined ) {
            providerName = providerName["#text"];
        }
        if ( providerSite !== undefined ) {
            providerSite = providerSite["#text"];
        }
        // var serviceContact =
		// json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];

        var layers = [];
        var featureTypeList = json["wfs:WFS_Capabilities"]["FeatureTypeList"];
        
        if ( featureTypeList && featureTypeList["FeatureType"] ) {
        	var featureType = featureTypeList["FeatureType"];
        	
        	if ( Array.isArray( featureType ) ) {
    			crs = featureType[0]["DefaultSRS"]["#text"];
                
                for (var i in featureType) {
                    var temp = {
                        Title : featureType[i]["Title"]["#text"],
                        Name : featureType[i]["Name"]["#text"]
                    }
                    layers.push( temp );
                }
                
    		} else {
    			crs = featureType["DefaultSRS"]["#text"];
                
                var temp = {
                    Title : featureType["Title"]["#text"],
                    Name : featureType["Name"]["#text"]
                }
                layers.push( temp );
    		}
    	}
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            providerSite : providerSite,
            providerName : providerName,
            // serviceContact : serviceContact,
            accessconstraints : accessconstraints,
            
            layers : layers
        };
        
        return metaData;
    };
	
} )();

( function() {
	"use strict";

	/**
	 * WMS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WMS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapGetCapabilitiesWMS = new naji.service.njMapGetCapabilitiesWMS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wms?KEY=key',
	 * 	version : '1.3.0',
	 * 	dataViewId : njMap.getDataViewId()
	 * } );
	 * 
	 * njMapGetCapabilitiesWMS.then( function() {
	 * 	console.log( njMapGetCapabilitiesWMS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {naji.service.njMapGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	naji.service.njMapGetCapabilitiesWMS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WMS";

			_super = naji.service.njMapGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
					olJson : olJson,
					xmlJson : result_.xmlJson,
					document : result_.document,
					serviceMetaData : _self.getServiceMetaDataWMS( olJson )
				};

				_self.promise.data = data;
			} );

		} )();
		// END Initialize

		
		return _self.promise;

	} );
	
	
	naji.service.njMapGetCapabilitiesWMS.prototype = Object.create(naji.service.njMapGetCapabilitiesDefault.prototype);
	naji.service.njMapGetCapabilitiesWMS.prototype.constructor = naji.service.njMapGetCapabilitiesWMS;
	
	
	/**
	 * WMS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	naji.service.njMapGetCapabilitiesWMS.prototype.getServiceMetaDataWMS = function(olJson_) {
        var json = olJson_;
        
        var service = json["Service"]["Name"];
        var version = json["version"];
        var getCapabilitiesFormat = "";
        var getCapabilitiesFormats = json["Capability"]["Request"]["GetCapabilities"]["Format"];
		for(var i in getCapabilitiesFormats) {
			getCapabilitiesFormat += ( getCapabilitiesFormats[i] +( (getCapabilitiesFormats.length-1) == i ? "" : ", " ) );
		}
		var getMapFormat = "";
		var getMapFormats = json["Capability"]["Request"]["GetMap"]["Format"];
		for(var i in getMapFormats) {
			getMapFormat += ( getMapFormats[i] +( (getMapFormats.length-1) == i ? "" : ", " ) );
		}
		var getFeatureInfoFormat = "";
		var getFeatureInfoFormats = json["Capability"]["Request"]["GetFeatureInfo"]["Format"];
		for(var i in getFeatureInfoFormats) {
			getFeatureInfoFormat += ( getFeatureInfoFormats[i] +( (getFeatureInfoFormats.length-1) == i ? "" : ", " ) );
		}
		var exceptionFormat = "";
		var exceptionFormats = json["Capability"]["Exception"];
		for(var i in exceptionFormats) {
			exceptionFormat += ( exceptionFormats[i] +( (exceptionFormats.length-1) == i ? "" : ", " ) );
		}
        var WGS84 = json["Capability"]["Layer"]["EX_GeographicBoundingBox"];
        var maxExtent = json["Capability"]["Layer"]["BoundingBox"][0]["extent"];
		var crs = json["Capability"]["Layer"]["BoundingBox"][0]["crs"];		
		var title = json["Service"]["Title"];
		var onlineResource = json["Service"]["OnlineResource"];
        var abstract = json["Service"]["Abstract"];
        var fees = json["Service"]["Fees"];
        var accessConstraints = json["Service"]["AccessConstraints"];
        var contactPerson;
        var contactOrganization;
        
        if ( json["Service"]["ContactInformation"] !== undefined ) {
            contactPerson = json["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactPerson"];
            contactOrganization = json["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactOrganization"];
        }
        
        var keywordList = json["Service"]["KeywordList"];
        
        
        if ( crs === "CRS:84" || crs === "EPSG:4326" ) {
            // maxExtent = [ maxExtent[1], maxExtent[0], maxExtent[3], maxExtent[2] ];
            maxExtent = [-185.8007812499999, -46.07323062540835, 472.67578125000006, 65.94647177615741];
        }
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            WGS84 : WGS84,
            service : service,
            version : version,
            keywordList : keywordList,
            abstract : abstract,
            maxExtent : maxExtent,
            getMapFormat : getMapFormat,
            contactPerson : contactPerson,
            onlineResource : onlineResource,                        
            exceptionFormat : exceptionFormat,
            accessConstraints : accessConstraints,
            contactOrganization : contactOrganization,
            getFeatureInfoFormat : getFeatureInfoFormat,
            getCapabilitiesFormat : getCapabilitiesFormat
        };
        
        return metaData;
    };

} )();

( function() {
	"use strict";

	/**
	 * WMTS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WMTS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapGetCapabilitiesWMTS = new naji.service.njMapGetCapabilitiesWMTS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	version : '1.0.0',
	 * 	dataViewId : njMap.getDataViewId()
	 * } );
	 * 
	 * njMapGetCapabilitiesWMTS.then( function() {
	 * 	console.log( njMapGetCapabilitiesWMTS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {naji.service.njMapGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	naji.service.njMapGetCapabilitiesWMTS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WMTS";

			_super = naji.service.njMapGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMTSCapabilities();
                var olJson = parser.read( result_.document );
                var xmlJson = result_.xmlJson;
                var serviceMetaData = _self.getServiceMetaDataWMTS( olJson );
                
				var style = xmlJson["Capabilities"]["Contents"]["Layer"]["Style"];
				if ( style !== undefined ) {
					var legendURL = style["ows:LegendURL"];
					if ( legendURL !== undefined ) {
	    	            legendURL = legendURL["ows:OnlineResource"]["@attributes"]["xlink:href"];
	    	            serviceMetaData["legendURL"] = legendURL;
	    	        }
				}
				
    	        var extra_serviceIdentification = xmlJson["Capabilities"]["ows:ServiceIdentification"];    	        
    	        
    	        if(extra_serviceIdentification  !== undefined ) {
    	        	if ( extra_serviceIdentification["ows:Abstract"] ) {
    	        		serviceMetaData["abstract"] = extra_serviceIdentification["ows:Abstract"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:AccessConstraints"] ) {
    	        		serviceMetaData["accessconstraints"] = extra_serviceIdentification["ows:AccessConstraints"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:Fees"] ) {
    	        		serviceMetaData["fees"] = extra_serviceIdentification["ows:Fees"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:Keywords"] ) {
    	        		var keywords = extra_serviceIdentification["ows:Keywords"]["ows:Keyword"];
        	        	var keywordList = [];
        	        	
        	        	if ( keywords !== undefined ) {
        	                if ( Array.isArray( keywords ) ) {            
        	                    for(var i in keywords) {
        	                        keywordList.push( keywords[i]["#text"]);
        	                    }
        	                } else {
        	                    keywordList.push( keywords["#text"] );
        	                }
        	            }        	
        	        	serviceMetaData["keywords"] = keywordList; 
    	        	}
    	        }
                
                var data = {
                	olJson : olJson,
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : serviceMetaData
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	naji.service.njMapGetCapabilitiesWMTS.prototype = Object.create(naji.service.njMapGetCapabilitiesDefault.prototype);
	naji.service.njMapGetCapabilitiesWMTS.prototype.constructor = naji.service.njMapGetCapabilitiesWMTS;
	
	
	/**
	 * WMTS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	naji.service.njMapGetCapabilitiesWMTS.prototype.getServiceMetaDataWMTS = function(xmlJson_) {
    	var json = xmlJson_;  
        
        var crs = json["Contents"]["TileMatrixSet"];
        if ( Array.isArray( crs ) ) {
            crs = crs[0]["SupportedCRS"];
        } else {
            crs = crs["SupportedCRS"];
        }
        
        var title = json["ServiceIdentification"]["Title"];
		var abstract = json["ServiceIdentification"]["Abstract"];
		var fees = json["ServiceIdentification"]["Fees"];
		var accessconstraints = json["ServiceIdentification"]["AccessConstraints"];
        
        var keywordList = [];
        var keywords = json["ServiceIdentification"]["Keywords"];
        if ( keywords !== undefined ) {
            if ( Array.isArray( keywords ) ) {            
                for(var i in keywords) {
                    keywordList.push( keywords[i]["Keyword"] );
                }
            } else {
                keywordList.push( keywords["Keyword"] );
            }
        }

        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            accessconstraints : accessconstraints
        };
        
        return metaData;
    };

} )();

/**
 * @namespace naji.layer
 */

( function() {
	"use strict";

	/**
	 * 레이어의 기본 객체. 공통으로 서비스 URL, 프록시, GetFeature 사용 여부를 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.useGetFeature {Boolean} GetFeature 사용 여부. Default is `false`.
	 * 
	 * @class
	 */
	naji.layer.njMapLayerDefault = ( function(opt_options) {
		var _self = this;

		this.useProxy = null;
		this.serviceURL = null;
		this.useGetFeature = null;

		this.olLayer = null;
		this.id = null;
		this.name = null;
		this.layerKey = null;
		this.layerType = null;
		this.isUseLoading = null;
		this.tocVisibleFlag = null;
		this.layerVisibleFlag = null;
		this.scaleVisibleFlag = null;

		this.minZoom = null;
		this.maxZoom = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.isUseLoading = naji.njMapConfig.isUseLoading();
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : false;
			_self.serviceURL = ( options.serviceURL !== undefined ) ? options.serviceURL : "";
			_self.useGetFeature = ( options.useGetFeature !== undefined ) ? options.useGetFeature : false;

			_self.id = ( options.id !== undefined ) ? options.id : "";
			_self.name = ( options.name !== undefined ) ? options.name : "";

			_self.layerKey = naji.util.njMapUtil.generateUUID();
			_self.layerType = ( options.layerType !== undefined ) ? options.layerType : "";
			_self.tocVisibleFlag = ( options.tocVisible !== undefined ) ? options.tocVisible : true;
			_self.layerVisibleFlag = ( options.layerVisible !== undefined ) ? options.layerVisible : true;
			_self.scaleVisibleFlag = ( options.scaleVisible !== undefined ) ? options.scaleVisible : true;

			_self.minZoom = ( options.minZoom !== undefined ) ? options.minZoom : 0;
			_self.maxZoom = ( options.maxZoom !== undefined ) ? options.maxZoom : 21;

		} )();
		// END Initialize


		return {
			destroy : _self.destroy,
			setMinZoom : _self.setMinZoom,
			setMaxZoom : _self.setMaxZoom,
			getMinZoom : _self.getMinZoom,
			getMaxZoom : _self.getMaxZoom,

			getVisible : _self.getVisible,
			getLayerVisible : _self.getLayerVisible,
			getOlLayer : _self.getOlLayer,
			getId : _self.getId,
			getName : _self.getName,
			getLayerKey : _self.getLayerKey,
			getLayerType : _self.getLayerType,
			getServiceURL : _self.getServiceURL,

			visibleToggle : _self.visibleToggle,
			setTocVisible : _self.setTocVisible,
			setScaleVisible : _self.setScaleVisible,
			setLayerVisible : _self.setLayerVisible,

			getUseGetFeature : _self.getUseGetFeature,
			setUseGetFeature : _self.setUseGetFeature
		}

	} );


	/**
	 * 서비스 URL을 가져온다.
	 * 
	 * @return serviceURL {String} 서비스 URL.
	 */
	naji.layer.njMapLayerDefault.prototype.getServiceURL = function() {
		var _self = this._this || this;
		return _self.serviceURL;
	};


	/**
	 * ID를 가져온다.
	 * 
	 * @return id {String} ID.
	 */
	naji.layer.njMapLayerDefault.prototype.getId = function() {
		var _self = this._this || this;
		return _self.id;
	};

	/**
	 * Name을 가져온다.
	 * 
	 * @return Name {String} Name.
	 */
	naji.layer.njMapLayerDefault.prototype.getName = function() {
		var _self = this._this || this;
		return _self.name;
	};


	/**
	 * 레이어 키를 가져온다.
	 * 
	 * @return layerKey {String} 레이어 키.
	 */
	naji.layer.njMapLayerDefault.prototype.getLayerKey = function() {
		var _self = this._this || this;
		return _self.layerKey;
	};


	/**
	 * 레이어 타입을 가져온다.
	 * 
	 * @return layerType {String} 레이어 타입.
	 */
	naji.layer.njMapLayerDefault.prototype.getLayerType = function() {
		var _self = this._this || this;
		return _self.layerType;
	};


	/**
	 * OpenLayers의 `ol.layer` 객체를 가져온다.
	 * 
	 * @return olLayer {ol.layer} OpenLayers의 `ol.layer` 객체
	 */
	naji.layer.njMapLayerDefault.prototype.getOlLayer = function() {
		var _self = this._this || this;
		return _self.olLayer;
	};


	/**
	 * 레이어 visible 상태를 가져온다.
	 * 
	 * 1. 오픈레이어스 레이어 상태
	 * 
	 * 2. 레이어 visible상태
	 * 
	 * 3. TOC visible 상태
	 * 
	 * 4. 스케일 visible 상태
	 * 
	 * 모든 항목의 visible 상태가 `true`일 경우에만 `true`.
	 * 
	 * @return visible {Boolean} visible 상태.
	 */
	naji.layer.njMapLayerDefault.prototype.getVisible = function() {
		var _self = this._this || this;
		return ( _self.olLayer.getVisible() && _self.layerVisibleFlag && _self.tocVisibleFlag && _self.scaleVisibleFlag );
	};


	/**
	 * 레이어 layer visible 상태를 가져온다.
	 * 
	 * @return layerVisible {Boolean} layerVisible 상태.
	 */
	naji.layer.njMapLayerDefault.prototype.getLayerVisible = function() {
		var _self = this._this || this;
		return _self.layerVisibleFlag;
	};

	/**
	 * 레이어 visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} 레이어 visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	naji.layer.njMapLayerDefault.prototype.setLayerVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.tocVisibleFlag && _self.scaleVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.layerVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 레이어 visible 상태를 토글한다.
	 */
	naji.layer.njMapLayerDefault.prototype.visibleToggle = function() {
		var _self = this._this || this;

		_self.setLayerVisible( !_self.layerVisibleFlag );
	};


	/**
	 * TOC visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} TOC visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	naji.layer.njMapLayerDefault.prototype.setTocVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.layerVisibleFlag && _self.scaleVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.tocVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 스케일 visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} 스케일 visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	naji.layer.njMapLayerDefault.prototype.setScaleVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.layerVisibleFlag && _self.tocVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.scaleVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 레이어의 MinZoom을 설정한다.
	 * 
	 * @param minZoom {Integer} MinZoom 값.
	 */
	naji.layer.njMapLayerDefault.prototype.setMinZoom = function(minZoom_) {
		var _self = this._this || this;
		_self.minZoom = minZoom_;

		_self.olLayer.dispatchEvent( {
			type : 'change:zoom'
		} );
	};


	/**
	 * 레이어의 MaxZoom을 설정한다.
	 * 
	 * @param maxZoom {Integer} MaxZoom 값.
	 */
	naji.layer.njMapLayerDefault.prototype.setMaxZoom = function(maxZoom_) {
		var _self = this._this || this;
		_self.maxZoom = maxZoom_;

		_self.olLayer.dispatchEvent( {
			type : 'change:zoom'
		} );
	};


	/**
	 * 레이어의 MinZoom 값을 가져온다.
	 * 
	 * @return minZoom {Integer} MinZoom 값.
	 */
	naji.layer.njMapLayerDefault.prototype.getMinZoom = function() {
		var _self = this._this || this;
		return _self.minZoom;
	};


	/**
	 * 레이어의 MaxZoom 값을 가져온다.
	 * 
	 * @return maxZoom {Integer} MaxZoom 값.
	 */
	naji.layer.njMapLayerDefault.prototype.getMaxZoom = function() {
		var _self = this._this || this;
		return _self.maxZoom;
	};


	/**
	 * GetFeature 사용 여부를 가져온다.
	 * 
	 * @return useGetFeature {Boolean} GetFeature 사용 여부.
	 */
	naji.layer.njMapLayerDefault.prototype.getUseGetFeature = function() {
		var _self = this._this || this;
		return _self.useGetFeature;
	};


	/**
	 * GetFeature 사용 여부를 설정한다.
	 * 
	 * @param state {Boolean} GetFeature 사용 여부.
	 */
	naji.layer.njMapLayerDefault.prototype.setUseGetFeature = function(state_) {
		var _self = this._this || this;

		if ( typeof state_ === "boolean" ) {
			_self.useGetFeature = state_;
		} else {
			_self.useGetFeature = false;
		}
	};
	
	
	/**
	 * 레이어를 destroy한다.
	 * 
	 * @abstract
	 */
	naji.layer.njMapLayerDefault.prototype.destroy = function() {
		var _self = this._this || this;
	};

} )();

( function() {
	"use strict";

	/**
	 * Cluster 레이어 객체.
	 * 
	 * Cluster 데이터를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★ 기능 개발
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapVectorLayer = new naji.layer.njMapClusterLayer( {
	 *	distance : 50,
	 *	features : [ new ol.Feature( {
	 *		geometry : new ol.geom.Point({...})
	 *	} ) ],
	 *	useAnimation : true,
	 *	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.distance {Number} 클러스터 사이의 거리. Default is `50`.
	 * @param opt_options.useAnimation {Boolean} 애니메이션 효과 사용 여부. Default is `true`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 대상 피처 리스트.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapClusterLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.distance = null;
		this.features = null;

		this.clusters = null;
		this.animation = null;
		this.oldcluster = null;
		this.useAnimation = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Cluster";
			options.useGetFeature = false;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.clusters = [];
			_self.oldcluster = new ol.source.Vector();
			_self.animation = {
				start : false
			};

			_self.style = ( options.style !== undefined ) ? options.style : _self._defaultStyle;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.distance = ( typeof ( options.distance ) === "number" ) ? options.distance : 50;
			_self.useAnimation = ( typeof ( options.useAnimation ) === "boolean" ) ? options.useAnimation : true;

			_self._init();

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setDistance : _self.setDistance,
			setUseAnimation : _self.setUseAnimation
		} );

	} );


	naji.layer.njMapClusterLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapClusterLayer.prototype.constructor = naji.layer.njMapClusterLayer;


	/**
	 * init
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._init = function(state_) {
		var _self = this._this || this;

		_self.olLayer = new ol.layer.Vector( {
			source : new ol.source.Cluster( {
				distance : _self.distance,
				source : new ol.source.Vector( {
					features : _self.features
				} )
			} ),
			style : _getStyle
		} );


		_self.setUseAnimation( _self.useAnimation );
		_self.olLayer.set( 'animationMethod', ol.easing.easeOut );

		// Save cluster before change
		_self.olLayer.getSource().on( 'change', _self._saveCluster, _self );
		// Animate the cluster
		_self.olLayer.on( 'precompose', _self._animate, _self );
		_self.olLayer.on( 'postcompose', _self._postanimate, _self );


		var styleCache = {};
		function _getStyle(feature, resolution) {
			var size = feature.get( 'features' ).length;
			var style = styleCache[ size ];
			if ( !style ) {
				if ( typeof _self.style === "function" ) {
					style = _self.style.call( this, feature, resolution );
				} else {
					style = _self.style;
				}
				styleCache[ size ] = style;
			}
			return [ style ];
		}
	};


	/**
	 * 기본 스타일
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._defaultStyle = function(feature, resolution) {
		var size = feature.get( 'features' ).length;
		var color = size > 25 ? "192,0,0" : size > 8 ? "255,128,0" : "0,128,0";
		var radius = Math.max( 8, Math.min( size * 0.75, 20 ) );
		var dash = 2 * Math.PI * radius / 6;
		var dash = [ 0, dash, dash, dash, dash, dash, dash ];
		var style = new ol.style.Style( {
			image : new ol.style.Circle( {
				radius : radius,
				stroke : new ol.style.Stroke( {
					color : "rgba(" + color + ",0.5)",
					width : 15,
					lineDash : dash,
					lineCap : "butt"
				} ),
				fill : new ol.style.Fill( {
					color : "rgba(" + color + ",1)"
				} )
			} ),
			text : new ol.style.Text( {
				text : size.toString(),
				fill : new ol.style.Fill( {
					color : '#fff'
				} )
			} )
		} );

		return style;
	};


	/**
	 * 클러스터 애니메이션 효과 사용 여부 설정.
	 * 
	 * @param state {Boolean} 애니메이션 효과 사용 여부.
	 */
	naji.layer.njMapClusterLayer.prototype.setUseAnimation = function(state_) {
		var _self = this._this || this;
		_self.olLayer.set( 'animationDuration', state_ ? 700 : 0 );
	};


	/**
	 * 클러스터 사이의 거리 설정.
	 * 
	 * @param distance {Number} 클러스터 사이의 거리.
	 */
	naji.layer.njMapClusterLayer.prototype.setDistance = function(distance_) {
		var _self = this._this || this;

		var source = _self.olLayer.getSource();
		ol.source.Cluster.prototype.setDistance.call( source, distance_ );
	};


	/**
	 * _saveCluster
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._saveCluster = function() {
		var _self = this._this || this;

		_self.oldcluster.clear();
		if ( !_self.olLayer.get( 'animationDuration' ) ) return;

		var features = _self.olLayer.getSource().getFeatures();
		if ( features.length && features[ 0 ].get( 'features' ) ) {
			_self.oldcluster.addFeatures( _self.clusters );
			_self.clusters = features.slice( 0 );
			_self.sourceChanged = true;
		}
	};


	/**
	 * Get the cluster that contains a feature
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._getClusterForFeature = function(f, cluster) {
		var _self = this._this || this;

		for ( var j = 0 , c; c = cluster[ j ]; j++ ) {
			var features = cluster[ j ].get( 'features' );

			if ( features && features.length ) {
				for ( var k = 0 , f2; f2 = features[ k ]; k++ ) {
					if ( f === f2 ) {
						return cluster[ j ];
					}
				}
			}
		}
		return false;
	};


	/**
	 * _stopAnimation
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._stopAnimation = function() {
		var _self = this._this || this;
		_self.animation.start = false;
		_self.animation.cA = [];
		_self.animation.cB = [];
	};


	/**
	 * animate the cluster
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._animate = function(e) {
		var _self = this._this || this;

		var duration = _self.olLayer.get( 'animationDuration' );
		if ( !duration ) return;

		var resolution = e.frameState.viewState.resolution;
		var a = _self.animation;
		var time = e.frameState.time;

		// Start a new animation, if change resolution and source has changed
		if ( a.resolution != resolution && _self.sourceChanged ) {
			var extent = e.frameState.extent;

			if ( a.resolution < resolution ) {
				extent = ol.extent.buffer( extent, 100 * resolution );
				a.cA = _self.oldcluster.getFeaturesInExtent( extent );
				a.cB = _self.olLayer.getSource().getFeaturesInExtent( extent );
				a.revers = false;
			} else {
				extent = ol.extent.buffer( extent, 100 * resolution );
				a.cA = _self.olLayer.getSource().getFeaturesInExtent( extent );
				a.cB = _self.oldcluster.getFeaturesInExtent( extent );
				a.revers = true;
			}

			a.clusters = [];

			for ( var i = 0 , c0; c0 = a.cA[ i ]; i++ ) {
				var f = c0.get( 'features' );
				if ( f && f.length ) {
					var c = _self._getClusterForFeature( f[ 0 ], a.cB );
					if ( c ) a.clusters.push( {
						f : c0,
						pt : c.getGeometry().getCoordinates()
					} );
				}
			}

			// Save state
			a.resolution = resolution;
			_self.sourceChanged = false;

			// No cluster or too much to animate
			if ( !a.clusters.length || a.clusters.length > 1000 ) {
				_self._stopAnimation();
				return;
			}
			// Start animation from now
			time = a.start = ( new Date() ).getTime();
		}

		// Run animation
		if ( a.start ) {
			var vectorContext = e.vectorContext;
			var d = ( time - a.start ) / duration;

			// Animation ends
			if ( d > 1.0 ) {
				_self._stopAnimation();
				d = 1;
			}
			d = _self.olLayer.get( 'animationMethod' )( d );

			// Animate
			var style = _self.olLayer.getStyle();
			var stylefn = ( typeof ( style ) == 'function' ) ? style : style.length ? function() {
				return style;
			} : function() {
				return [ style ];
			};

			// Layer opacity
			e.context.save();
			e.context.globalAlpha = _self.olLayer.getOpacity();

			// Retina device
			var ratio = e.frameState.pixelRatio;

			for ( var i = 0 , c; c = a.clusters[ i ]; i++ ) {
				var pt = c.f.getGeometry().getCoordinates();

				if ( a.revers ) {
					pt[ 0 ] = c.pt[ 0 ] + d * ( pt[ 0 ] - c.pt[ 0 ] );
					pt[ 1 ] = c.pt[ 1 ] + d * ( pt[ 1 ] - c.pt[ 1 ] );
				} else {
					pt[ 0 ] = pt[ 0 ] + d * ( c.pt[ 0 ] - pt[ 0 ] );
					pt[ 1 ] = pt[ 1 ] + d * ( c.pt[ 1 ] - pt[ 1 ] );
				}

				// Draw feature
				var st = stylefn( c.f, resolution );
				/* Preserve pixel ration on retina */
				var s;
				var geo = new ol.geom.Point( pt );
				for ( var k = 0; s = st[ k ]; k++ ) {
					var sc;
					// OL < v4.3 : setImageStyle doesn't check retina
					var imgs = ol.Map.prototype.getFeaturesAtPixel ? false : s.getImage();
					if ( imgs ) {
						sc = imgs.getScale();
						imgs.setScale( sc * ratio );
					}
					// OL3 > v3.14
					if ( vectorContext.setStyle ) {
						vectorContext.setStyle( s );
						vectorContext.drawGeometry( geo );
					}
					// older version
					else {
						vectorContext.setImageStyle( imgs );
						vectorContext.setTextStyle( s.getText() );
						vectorContext.drawPointGeometry( geo );
					}
					if ( imgs ) imgs.setScale( sc );
				}
			}

			e.context.restore();
			// tell OL3 to continue postcompose animation
			e.frameState.animate = true;

			// Prevent layer drawing (clip with null rect)
			e.context.save();
			e.context.beginPath();
			e.context.rect( 0, 0, 0, 0 );
			e.context.clip();
			_self.clip_ = true;
		}

		return;
	};


	/**
	 * remove clipping after the layer is drawn
	 * 
	 * @private
	 */
	naji.layer.njMapClusterLayer.prototype._postanimate = function(e) {
		var _self = this._this || this;
		if ( _self.clip_ ) {
			e.context.restore();
			_self.clip_ = false;
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * GSS WMTS 레이어 객체.
	 * 
	 * GSS WMTS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGSSWmtsLayer = new naji.layer.njMapGSSWMTSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	layer : 'LAYER',
	 * 	matrixSet : 'MATRIXSET',
	 * 	projection : 'EPSG:3857',
	 * 	version : '1.0.0',
	 * 	wmtsCapabilities : null,
	 * 	originExtent : []
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} GSS WMTS 서비스 URL.
	 * 
	 * @param opt_options.layer {String} 레이어 이름.
	 * @param opt_options.style {String} 스타일 이름.
	 * @param opt_options.version {String} WMTS 버전. Default is `1.0.0`.
	 * @param opt_options.matrixSet {String} matrixSet.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapGSSWMTSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layer = null;
		this.style = null;
		this.version = null;
		this.matrixSet = null;
		this.tileGrid = null;
		this.zoomOffset = null;
		this.format = null;
		this.originExtent = null;
		this.wmtsCapabilities = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "GSS_WMTS";
			options.useGetFeature = false;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.0.0";
			_self.layer = ( options.layer !== undefined ) ? options.layer : "";
			_self.style = ( options.style !== undefined ) ? options.style : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.originExtent = _self._setOriginExtent( options.originExtent );
			//_self.projection = _self._setProjection( options.projection );
			_self.tileGrid = _self._setTileGrid( options );
			
			_self.zoomOffset = ( options.zoomOffset !== undefined ) ? options.zoomOffset : -1;
			_self.format = ( options.format !== undefined ) ? options.format : "image/png";

			var serviceURL = _self.serviceURL;
			if ( _self.useProxy ) {
				if ( serviceURL.indexOf( "?" ) === -1 ) {
					serviceURL += "??";
				} else if ( serviceURL.indexOf( "?" ) === serviceURL.length - 1 ) {
					serviceURL = serviceURL.replace( "?", "??" );
				}

				serviceURL = naji.njMapConfig.getProxy() + serviceURL;
			}

			var source = new ol.source.WMTS( {
				url: serviceURL,
				layer: _self.layer,
				matrixSet: _self.matrixSet,
				tileGrid: _self.tileGrid,
				zoomOffset: _self.zoomOffset,
				format: _self.format,
				//crossOrigin : "Anonymous"
			} );

			_self.olLayer = new ol.layer.Tile( {
				opacity : options.opacity,
				source : source
			} );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			layer : _self.layer,
			version : _self.version,
			matrixSet : _self.matrixSet,
			setTileGrid : _self._setTileGrid,
			getTileGrid : _self.getTileGrid,
			getOriginExtent : _self.getOriginExtent,
			setOriginExtent : _self._setOriginExtent
		} );

	} );


	var njMapGSSWMTSLayer = naji.layer.njMapGSSWMTSLayer;
	njMapGSSWMTSLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	njMapGSSWMTSLayer.prototype.constructor = njMapGSSWMTSLayer;


	/**
	 * OriginExtent 설정
	 * 
	 * @param originExtent {Array.<Double>} originExtent
	 */
	njMapGSSWMTSLayer.prototype._setOriginExtent = function(originExtent_) {
		var _self = this._this || this;

		if ( originExtent_ && originExtent_.length > 3 ) {
			_self.originExtent = originExtent_;
		} else {
			_self.originExtent = undefined;
		}

		return _self.originExtent;
	};

	/**
	 * WMTS tileGrid 설정
	 * 
	 * @param tileGrid { ol.tilegrid.WMTS } WMTS TileGrid 설정
	 */
	njMapGSSWMTSLayer.prototype._setTileGrid = function( options ) {
		var _self = this._this || this;

		_self.tileGrid = new ol.tilegrid.WMTS({
			origin: options.origin,
			tileSize: options.tileSize,
			resolutions: options.resolutions,
			matrixIds: options.matrixIds
		});

		return _self.tileGrid;
	};

	/**
	 * OriginExtent 가져오기
	 * 
	 * @return OriginExtent {Array}
	 */
	njMapGSSWMTSLayer.prototype.getOriginExtent = function() {
		var _self = this._this || this;
		return _self.originExtent;
	};


	/**
	 * WMTS tilegrid 가져오기
	 * 
	 * @return tileGrid { ol.tilegrid.WMTS }
	 */
	njMapGSSWMTSLayer.prototype.getTileGrid = function() {
		var _self = this._this || this;
		return _self.tileGrid;
	};


	/**
	 * GetFeature 사용 여부 설정
	 * 
	 * @Override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부
	 */
	njMapGSSWMTSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};

} )();

( function() {
	"use strict";

	/**
	 * Vector3D 레이어 객체.
	 * 
	 * 벡터데이터를 3D로 표현할 수 있는 레이어 객체.
	 * 
	 * ※도형의 Z값으로 렌더링하는 것은 아니며, 해당 피처의 높이 값 컬럼 설정을 통해 건물의 대략적인 높이만 표현할 수 있다.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapVector3DLayer = new naji.layer.njMapVector3DLayer( {
	 * 	srsName :'EPSG:3857',
	 * 	features : [ new ol.Feature( {
	 * 	 	geometry : new ol.geom.Polygon({...})
	 * 	} ) ],
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 피처.
	 * @param opt_options.style {ol.style.Style} 스타일.
	 * 
	 * @param opt_options.initBuild {Boolean} 초기 3D 렌더링 사용 여부.
	 * @param opt_options.labelColumn {String} 피처에 표시할 라벨 컬럼명.
	 * @param opt_options.heightColumn {String} 피처의 높이를 참조할 컬럼명.
	 * @param opt_options.maxResolution {Number} 3D 렌더링 최대 Resolution. Default is `0.6`.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapVector3DLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.initBuild = null;
		this.features = null;
		this.srsName = null;
		this.labelColumn = null;
		this.heightColumn = null;
		this.maxResolution = null;

		this.njMapRender3D = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Vector3D";
			options.useGetFeature = true;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.labelColumn = ( options.labelColumn !== undefined ) ? options.labelColumn : "";
			_self.initBuild = ( typeof ( options.initBuild ) === "boolean" ) ? options.initBuild : true;
			_self.heightColumn = ( options.heightColumn !== undefined ) ? options.heightColumn : "";
			_self.maxResolution = ( typeof ( options.maxResolution ) === "number" ) ? options.maxResolution : 0.6;

			_self._init();

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName,
			getFeatures : _self.getFeatures,
			addFeatures : _self.addFeatures,
			getRender3D : _self.getRender3D
		} );

	} );


	naji.layer.njMapVector3DLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapVector3DLayer.prototype.constructor = naji.layer.njMapVector3DLayer;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.layer.njMapVector3DLayer.prototype._init = ( function() {
		var _self = this._this || this;

		_self.olLayer = new ol.layer.Vector( {
			// zIndex : 8999,
			declutter : true,
			// style : _self.style,
			source : new ol.source.Vector( {
				features : _self.features
			} )
		} );

		_self.njMapRender3D = new naji.etc.njMapRender3D( {
			style : _self.style,
			layer : _self.olLayer,
			initBuild : _self.initBuild,
			labelColumn : _self.labelColumn,
			heightColumn : _self.heightColumn,
			maxResolution : _self.maxResolution
		} );
	} );


	/**
	 * njMapRender3D 객체를 가져온다.
	 * 
	 * @return njMapRender3D {@link naji.etc.njMapRender3D} 객체.
	 */
	naji.layer.njMapVector3DLayer.prototype.getRender3D = ( function() {
		var _self = this._this || this;
		return _self.njMapRender3D;
	} );


	/**
	 * 레이어에 Feature를 추가한다.
	 * 
	 * @param features {Array.<ol.Feature>} 추가할 피처 리스트.
	 */
	naji.layer.njMapVector3DLayer.prototype.addFeatures = ( function(features_) {
		var _self = this._this || this;
		_self.olLayer.getSource().addFeatures( features_ );
	} );


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	naji.layer.njMapVector3DLayer.prototype.getFeatures = ( function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getFeatures();
	} );


	/**
	 * 레이어의 Feature를 지운다.
	 */
	naji.layer.njMapVector3DLayer.prototype.clear = ( function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	} );

} )();

( function() {
	"use strict";

	/**
	 * Vector 레이어 객체.
	 * 
	 * 벡터데이터를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapVectorLayer = new naji.layer.njMapVectorLayer( {
	 * 	declutter : true, 
	 * 	srsName : 'EPSG:3857',
	 * 	style : new ol.style.Style({...}),
	 * 	features : [ new ol.Feature( {
	 * 	 	geometry : new ol.geom.Polygon({...})
	 * 	} ) ]
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 피처.
	 * @param opt_options.declutter {Boolean} 디클러터링 설정 (이미지, 텍스트). Default is `true`.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapVectorLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.features = null;
		this.srsName = null;
		this.declutter = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Vector";
			options.useGetFeature = true;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.declutter = ( typeof ( options.declutter ) === "boolean" ) ? options.declutter : true;

			_self.olLayer = new ol.layer.Vector( {
				// zIndex : 8999,
				opacity : options.opacity,
				declutter : false,
				style : _self.style,
				source : new ol.source.Vector( {
					features : _self.features
				} )
			} );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName,
			getFeatures : _self.getFeatures,
			addFeatures : _self.addFeatures
		} );

	} );


	naji.layer.njMapVectorLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapVectorLayer.prototype.constructor = naji.layer.njMapVectorLayer;


	/**
	 * 레이어에 Feature를 추가한다.
	 * 
	 * @param features {Array.<ol.Feature>} 추가할 피처 리스트.
	 */
	naji.layer.njMapVectorLayer.prototype.addFeatures = function(features_) {
		var _self = this._this || this;
		_self.olLayer.getSource().addFeatures( features_ );
	};


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	naji.layer.njMapVectorLayer.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getFeatures();
	};


	/**
	 * 레이어의 Feature를 지운다.
	 */
	naji.layer.njMapVectorLayer.prototype.clear = function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	};

} )();

( function() {
	"use strict";

	/**
	 * WCS 레이어 객체.
	 * 
	 * WCS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapWcsLayer = new naji.layer.njMapWCSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wcs?KEY=key',
	 * 	format : 'image/jpeg',
	 * 	version : '2.0.1',
	 * 	identifier : 'LAYER_ID',
	 * 	boundingBox : [...],
	 * 	useScaleRefresh : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WCS 서비스 URL.
	 * 
	 * @param opt_options.format {String} 이미지 포맷. Default is `image/jpeg`.
	 * @param opt_options.version {String} WCS 버전. Default is `1.1.1`.
	 * @param opt_options.identifier {String} 레이어 아이디.
	 * @param opt_options.boundingBox {Array} boundingBox. `※EPSG:4326`.
	 * @param opt_options.useScaleRefresh {Boolean} 이미지 해상도 자동 새로고침 사용 여부. Default is `false`.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapWCSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.format = null;
		this.version = null;
		this.identifier = null;
		this.coverageId = null;
		this.boundingBox = null;
		this.useScaleRefresh = null;

		this.key_moveEnd = null;
		this.key_changeView = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WCS";
			options.useGetFeature = false;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.1.1";
			_self.format = ( options.format !== undefined ) ? options.format : "image/jpeg";
			_self.identifier = ( options.identifier !== undefined ) ? options.identifier : "";
			_self.coverageId = ( options.coverageId !== undefined ) ? options.coverageId : "";
			_self.useScaleRefresh = ( typeof ( options.useScaleRefresh ) === "boolean" ) ? options.useScaleRefresh : false;

			_self.boundingBox = _self._setBoundingBox( options.boundingBox );

			_self.olLayer = new ol.layer.Image( {} );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setMap : _self.setMap,
			update : _self._update,
			version : _self.version,
			identifier : _self.identifier,
			useScaleRefresh : _self.useScaleRefresh,
			setBoundingBox : _self._setBoundingBox,
			getBoundingBox : _self.getBoundingBox
		} );

	} );


	naji.layer.njMapWCSLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapWCSLayer.prototype.constructor = naji.layer.njMapWCSLayer;


	/**
	 * BoundingBox를 설정한다.
	 * 
	 * @private
	 * 
	 * @param boundingBox {Array.<Double>} boundingBox.
	 */
	naji.layer.njMapWCSLayer.prototype._setBoundingBox = function(boundingBox_) {
		var _self = this._this || this;

		if ( boundingBox_ && boundingBox_.length > 3 ) {
			_self.boundingBox = boundingBox_.slice();
			if ( !boundingBox_[ 4 ] ) {
				_self.boundingBox.push( "EPSG:4326" );
			}
		} else {
			_self.boundingBox = undefined;
		}

		return _self.boundingBox;
	};


	/**
	 * Map을 설정한다. 해당 Map을 통해 Coverage의 BOUNDINGBOX를 갱신한다.
	 * 
	 * @param olMap {ol.Map}
	 * @param load {Function} 로드 함수.
	 */
	naji.layer.njMapWCSLayer.prototype.setMap = function(olMap_, load_) {
		var _self = this._this || this;

		_self._update( olMap_.getView(), load_ );

		if ( olMap_ && _self.useScaleRefresh ) {
			ol.Observable.unByKey( _self.key_moveEnd );

			_self.key_moveEnd = olMap_.on( "moveend", function() {
				_self._update( olMap_.getView(), load_ );
			} );
		}

		_self.key_changeView = olMap_.once( "change:view", function() {
			_self.setMap( olMap_, load_ );
		} );
	};


	/**
	 * WCS Param을 설정하고 갱신한다.
	 * 
	 * @private
	 * 
	 * @param view {ol.View} View 객체.
	 * @param load {Function} 로드 함수.
	 */
	naji.layer.njMapWCSLayer.prototype._update = function(view_, load_) {
		var _self = this._this || this;

		var viewExtent = view_.calculateExtent();
		viewExtent = ol.proj.transformExtent( viewExtent, view_.getProjection(), "EPSG:4326" );

		if ( !ol.extent.intersects( viewExtent, _self.boundingBox ) ) {
			return false;
		}

		var params = {
			SERVICE : "WCS",
			REQUEST : "GetCoverage",
			FORMAT : _self.format,
			VERSION : _self.version,
			IDENTIFIER : _self.identifier,
			COVERAGEID : _self.identifier,
			BOUNDINGBOX : _self.boundingBox
		};

		if ( _self.version === "2.0.1" ) {
			delete params.IDENTIFIER;
		} else {
			delete params.COVERAGEID;
		}

		if ( _self.useScaleRefresh ) {
			var poly1 = turf.polygon( [ [ [ viewExtent[ 0 ], viewExtent[ 1 ] ], [ viewExtent[ 0 ], viewExtent[ 3 ] ], [ viewExtent[ 2 ], viewExtent[ 3 ] ],
					[ viewExtent[ 2 ], viewExtent[ 1 ] ], [ viewExtent[ 0 ], viewExtent[ 1 ] ] ] ] );

			var poly2 = turf.polygon( [ [ [ _self.boundingBox[ 0 ], _self.boundingBox[ 1 ] ], [ _self.boundingBox[ 0 ], _self.boundingBox[ 3 ] ],
					[ _self.boundingBox[ 2 ], _self.boundingBox[ 3 ] ], [ _self.boundingBox[ 2 ], _self.boundingBox[ 1 ] ],
					[ _self.boundingBox[ 0 ], _self.boundingBox[ 1 ] ] ] ] );

			var intersection = turf.intersect( poly1, poly2 );
			var intersectCoordinate = intersection.geometry.coordinates[ 0 ];
			var intersectExtent = [ intersectCoordinate[ 0 ][ 0 ], intersectCoordinate[ 0 ][ 1 ], intersectCoordinate[ 2 ][ 0 ], intersectCoordinate[ 2 ][ 1 ] ];

			if ( intersectExtent[ 0 ] > intersectExtent[ 2 ] ) {
				var temp = intersectExtent[ 2 ];
				intersectExtent[ 2 ] = intersectExtent[ 0 ];
				intersectExtent[ 0 ] = temp;
			}

			if ( intersectExtent[ 1 ] > intersectExtent[ 3 ] ) {
				var temp = intersectExtent[ 3 ];
				intersectExtent[ 3 ] = intersectExtent[ 1 ];
				intersectExtent[ 1 ] = temp;
			}

			params.BOUNDINGBOX = intersectExtent;
		}

		params.BOUNDINGBOX.push( "EPSG:4326" );

		if ( _self.useProxy ) {
			_self.getGetCoverageURL = naji.njMapConfig.getProxy() + naji.util.njMapUtil.appendParams( _self.getServiceURL(), params );
		} else {
			_self.getGetCoverageURL = naji.util.njMapUtil.appendParams( _self.getServiceURL(), params );
		}

		load_( true );

		_self.olLayer.setSource( new ol.source.ImageStatic( {
			url : _self.getGetCoverageURL,
			// projection : view_.getProjection(),
			projection : "EPSG:4326",
			imageExtent : params.BOUNDINGBOX,
			imageLoadFunction : function(image, src) {
				var imageElement = image.getImage();
				imageElement.onload = function() {
					load_( false );
				};
				imageElement.onerror = function() {
					load_( false );
				};

				imageElement.src = src;
			}
		} ) );
	};


	/**
	 * BoundingBox를 가져온다.
	 * 
	 * @return BoundingBox {Array.<Double>} BoundingBox.
	 */
	naji.layer.njMapWCSLayer.prototype.getBoundingBox = function() {
		var _self = this._this || this;
		return _self.boundingBox;
	};


	/**
	 * GetFeature 사용 여부를 설정한다.
	 * 
	 * @override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부.
	 */
	naji.layer.njMapWCSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};


	/**
	 * 레이어를 destroy한다.
	 * 
	 * @override
	 */
	naji.layer.njMapWCSLayer.prototype.destroy = function() {
		var _self = this._this || this;

		ol.Observable.unByKey( _self.key_moveEnd );
		ol.Observable.unByKey( _self.key_changeView );
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS 레이어 객체.
	 * 
	 * WFS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapWfsLayer = new naji.layer.njMapWFSLayer( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	layerName : 'world_country',
	 * 	srsName : 'EPSG:3857',
	 * 	maxFeatures : 300,
	 * 	style : new ol.style.Style({...}),
	 * 	filter : new ol.format.filter.like( 'NAME', 'South*' )
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WFS 서비스 URL.
	 * 
	 * @param opt_options.layerName {String} 레이어명.
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.filter {ol.format.filter.Filter} 필터. Default is `undefined`.
	 * @param opt_options.maxFeatures {Number} 피처 최대 요청 갯수. Default is `1000`.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapWFSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.filter = null;
		this.style = null;
		this.srsName = null;
		this.layerName = null;
		this.maxFeatures = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WFS";
			options.useGetFeature = true;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.filter = ( options.filter !== undefined ) ? options.filter : undefined;
			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.maxFeatures = ( options.maxFeatures !== undefined ) ? options.maxFeatures : 1000;

			_self.olLayer = new ol.layer.Vector( {
				opacity : options.opacity,
				declutter : true,
				style : _self.style,
				source : new ol.source.Vector()
			} );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			srsName : _self.srsName,
			layerName : _self.layerName,
			getFeatures : _self.getFeatures
		} );

	} );


	naji.layer.njMapWFSLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapWFSLayer.prototype.constructor = naji.layer.njMapWFSLayer;


	/**
	 * OGC WFS getFeatures를 요청한다.
	 * 
	 * @param filter {ol.format.filter.Filter} 필터
	 * 
	 * @return uFeatures {@link naji.service.njMapGetFeature} naji.service.njMapGetFeature.
	 */
	naji.layer.njMapWFSLayer.prototype.getFeatures = function(dataViewId_) {
		var _self = this._this || this;

		var uFeatures = new naji.service.njMapGetFeature( {
			srsName : _self.srsName,
			useProxy : _self.useProxy,
			serviceURL : _self.getServiceURL(),
			typeName : _self.layerName,
			maxFeatures : _self.maxFeatures,
			outputFormat : "application/json",
			filter : _self.filter,
			dataViewId : dataViewId_,
		} );

		return uFeatures;
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS Vector 레이어 객체.
	 * 
	 * 벡터데이터를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapWFSVectorLayer = new naji.layer.njMapWFSVectorLayer( {
	 * 	declutter : true, 
	 * 	srsName : 'EPSG:3857',
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.declutter {Boolean} 디클러터링 설정 (이미지, 텍스트). Default is `true`.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapWFSVectorLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.id = null;
		this.style = null;
		this.srsName = null;
		this.declutter = null;
		this.url = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WFS_Vector";
			options.useGetFeature = false;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.id = ( options.id !== undefined ) ? options.id : undefined;
			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.declutter = ( typeof ( options.declutter ) === "boolean" ) ? options.declutter : true;

			var serviceURL = _self.serviceURL;
			if ( _self.useProxy ) {
				/*
				if ( serviceURL.indexOf( "?" ) === -1 ) {
					serviceURL += "??";
				} else if ( serviceURL.indexOf( "?" ) === serviceURL.length - 1 ) {
					serviceURL = serviceURL.replace( "?", "??" );
				}
				*/
				serviceURL = naji.njMapConfig.getProxy() + serviceURL;
			}

			_self.url = serviceURL + "?service=WFS&version=1.1.0&request=GetFeature&typename="+options.layerName+"&outputFormat=application/json&srsname="+options.srsName+"&bbox=";

			_self.olLayer = new ol.layer.Vector( {
				// zIndex : 8999,
				id : _self.id,
				declutter : false,
				style : _self.style,
				source : new ol.source.Vector( {
					format : new ol.format.GeoJSON(),
					url : function(extent){
						return _self.url + extent.join(",") + "," + _self.srsName;
					},
					strategy : ol.loadingstrategy.bbox
				} )
			} );
		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName
		} );

	} );


	naji.layer.njMapWFSVectorLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapWFSVectorLayer.prototype.constructor = naji.layer.njMapWFSVectorLayer;

	/**
	 * 레이어의 Feature를 지운다.
	 */
	naji.layer.njMapWFSVectorLayer.prototype.clear = function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	};

} )();

( function() {
	"use strict";

	/**
	 * WMS 레이어 객체.
	 * 
	 * WMS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapWmsLayer = new naji.layer.njMapWMSLayer( {
	 *	useProxy : false,
	 *	singleTile : false,
	 *	serviceURL : 'http://mapstudio.uitgis.com/ms/wms?KEY=key',
	 *	ogcParams : {
	 *		LAYERS : 'ROOT',
	 *		CRS : njMap.getCRS(),
	 *		VERSION : '1.3.0';
	 *		...
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WMS 서비스 URL.
	 * @param opt_options.wfsServiceURL {String} WFS 서비스 URL (GetFeature).
	 * 
	 * @param opt_options.singleTile {Boolean} 싱글 타일 설정. Default is `false`.
	 * @param opt_options.ogcParams {Object} WMS OGC 표준 속성.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapWMSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.singleTile = null;
		this.ogcParams = null;
		this.wfsServiceURL = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WMS";
			options.useGetFeature = true;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			if ( options.wfsServiceURL ) {
				_self.wfsServiceURL = options.wfsServiceURL;
			} else {
				_self.wfsServiceURL = _self.serviceURL.replace( "/wms", "/wfs" );
			}

			_self.singleTile = ( options.singleTile !== undefined ) ? options.singleTile : false;
			_self.ogcParams = ( options.ogcParams !== undefined ) ? options.ogcParams : {};

			var serviceURL = _self.serviceURL;
			if ( _self.useProxy ) {
				if ( serviceURL.indexOf( "?" ) === -1 ) {
					serviceURL += "??";
				} else if ( serviceURL.indexOf( "?" ) === serviceURL.length - 1 ) {
					serviceURL = serviceURL.replace( "?", "??" );
				}

				serviceURL = naji.njMapConfig.getProxy() + serviceURL;
			}

			if ( _self.singleTile ) {
				var source = new ol.source.ImageWMS( {
					url : serviceURL,
					params : _self.ogcParams,
					// ratio : 1
				} );

				_self.olLayer = new ol.layer.Image( {
					opacity : options.opacity,
					source : source
				} );
			} else {
				var source = new ol.source.TileWMS( {
					url : serviceURL,
					params : _self.ogcParams
				} );

				_self.olLayer = new ol.layer.Tile( {
					opacity : options.opacity,
					source : source
				} );
			}

		} )();


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			ogcParams : _self.ogcParams,
			getWFSServiceURL : _self.getWFSServiceURL
		} );

	} );


	naji.layer.njMapWMSLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	naji.layer.njMapWMSLayer.prototype.constructor = naji.layer.njMapWMSLayer;


	/**
	 * WFS 서비스 URL을 가져온다.
	 * 
	 * @return wfsServiceURL {String} WFS 서비스 URL.
	 */
	naji.layer.njMapWMSLayer.prototype.getWFSServiceURL = function() {
		var _self = this._this || this;
		return _self.wfsServiceURL;
	};

} )();

( function() {
	"use strict";

	/**
	 * WMTS 레이어 객체.
	 * 
	 * WMTS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uWmtsLayer = new naji.layer.njMapWMTSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	layer : 'LAYER',
	 * 	matrixSet : 'MATRIXSET',
	 * 	projection : 'EPSG:3857',
	 * 	version : '1.0.0',
	 * 	wmtsCapabilities : null,
	 * 	originExtent : []
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WMTS 서비스 URL.
	 * 
	 * @param opt_options.layer {String} 레이어 이름.
	 * @param opt_options.style {String} 스타일 이름.
	 * @param opt_options.version {String} WMTS 버전. Default is `1.0.0`.
	 * @param opt_options.matrixSet {String} matrixSet.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.wmtsCapabilities {naji.service.njMapGetCapabilitiesWMTS} {@link naji.service.njMapGetCapabilitiesWMTS} WMTS
	 *            Capabilities 객체.
	 * 
	 * @Extends {naji.layer.njMapLayerDefault}
	 * 
	 * @class
	 */
	naji.layer.njMapWMTSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layer = null;
		this.style = null;
		this.version = null;
		this.matrixSet = null;
		this.originExtent = null;
		this.wmtsCapabilities = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WMTS";
			options.useGetFeature = false;

			_super = naji.layer.njMapLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.0.0";
			_self.layer = ( options.layer !== undefined ) ? options.layer : "";
			_self.style = ( options.style !== undefined ) ? options.style : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.originExtent = _self._setOriginExtent( options.originExtent );
			_self.wmtsCapabilities = _self._setWmtsCapabilities( options.wmtsCapabilities );

			_self._update( false );

			_self.olLayer = new ol.layer.Tile( {
				opacity : options.opacity,
				// originCRS : "EPSG:4326",
				// originExtent : ( _self.originExtent !== undefined ) ? options.originExtent : [],
				source : null
			} );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			layer : _self.layer,
			version : _self.version,
			update : _self._update,
			matrixSet : _self.matrixSet,
			getOriginExtent : _self.getOriginExtent,
			setOriginExtent : _self._setOriginExtent,
			getWmtsCapabilities : _self.getWmtsCapabilities,
			setWmtsCapabilities : _self._setWmtsCapabilities,
		} );

	} );


	var njMapWMTSLayer = naji.layer.njMapWMTSLayer;
	njMapWMTSLayer.prototype = Object.create( naji.layer.njMapLayerDefault.prototype );
	njMapWMTSLayer.prototype.constructor = njMapWMTSLayer;


	/**
	 * OriginExtent 설정
	 * 
	 * @param originExtent {Array.<Double>} originExtent
	 */
	njMapWMTSLayer.prototype._setOriginExtent = function(originExtent_) {
		var _self = this._this || this;

		if ( originExtent_ && originExtent_.length > 3 ) {
			_self.originExtent = originExtent_;
		} else {
			_self.originExtent = undefined;
		}

		return _self.originExtent;
	};


	/**
	 * WMTS capabilities 설정
	 * 
	 * @param wmtsCapabilities {naji.service.njMapGetCapabilitiesWMTS} WMTS capabilities
	 */
	njMapWMTSLayer.prototype._setWmtsCapabilities = function(wmtsCapabilities_) {
		var _self = this._this || this;

		if ( wmtsCapabilities_ ) {
			_self.wmtsCapabilities = wmtsCapabilities_;
		} else {
			_self.wmtsCapabilities = undefined;
		}

		return _self.wmtsCapabilities;
	};


	/**
	 * WMTS Param 설정
	 * 
	 * @param use {Boolean}
	 */
	njMapWMTSLayer.prototype._update = function(use_) {
		var _self = this._this || this;

		if ( _self.olLayer && use_ ) {
			var WMTSOptions = new ol.source.WMTS.optionsFromCapabilities( _self.wmtsCapabilities.olJson, {
				layer : _self.layer,
				style : _self.style,
				matrixSet : _self.matrixSet
			} );

			if ( _self.useProxy ) {
				for ( var i in WMTSOptions.urls ) {
					WMTSOptions.urls[ i ] = naji.njMapConfig.getProxy() + WMTSOptions.urls[ i ];
				}
			}

			_self.olLayer.setSource( new ol.source.WMTS( WMTSOptions ) );
		}
	};


	/**
	 * OriginExtent 가져오기
	 * 
	 * @return OriginExtent {Array}
	 */
	njMapWMTSLayer.prototype.getOriginExtent = function() {
		var _self = this._this || this;
		return _self.originExtent;
	};


	/**
	 * WMTS Capabilities 가져오기
	 * 
	 * @return wmtsCapabilities {naji.service.njMapGetCapabilitiesWMTS}
	 */
	njMapWMTSLayer.prototype.getWmtsCapabilities = function() {
		var _self = this._this || this;
		return _self.wmtsCapabilities;
	};


	/**
	 * GetFeature 사용 여부 설정
	 * 
	 * @Override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부
	 */
	njMapWMTSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};

} )();

/**
 * @namespace naji.toc
 */

( function() {
	"use strict";

	/**
	 * TOC 기본 객체.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapLayer {naji.layer} {@link naji.layer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * @param opt_options.menuOpen {Boolean} 메뉴 초기 Open 여부.
	 * @param opt_options.groupOpen {Boolean} 그룹레이어(폴더) 초기 Open 여부.
	 * @param opt_options.legendOpen {Boolean} 범례 이미지 초기 Open 여부.
	 * 
	 * ※`tocListDivId`가 없을 시 body에 임시로 DIV를 생성한다.
	 * 
	 * @class
	 */
	naji.toc.njMapTocDefault = ( function(opt_options) {
		var _self = this;

		this.tocKey = null;
		this.tocTitle = null;
		this.njMap = null;
		this.njMapLayer = null;
		this.menuOpen = null;
		this.groupOpen = null;
		this.legendOpen = null;
		this.tocListDivId = null;

		this.tocDivId = null;
		this.tocAccorId = null;
		this.zTreeAttribute = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.njMapLayer = ( options.njMapLayer !== undefined ) ? options.njMapLayer : undefined;
			_self.tocKey = ( options.tocKey !== undefined ) ? options.tocKey : undefined;
			_self.tocTitle = ( options.tocTitle !== undefined ) ? options.tocTitle : undefined;
			_self.tocListDivId = ( options.tocListDivId !== undefined ) ? options.tocListDivId : undefined;
			_self.menuOpen = ( typeof ( options.menuOpen ) === "boolean" ) ? options.menuOpen : true;
			_self.groupOpen = ( typeof ( options.groupOpen ) === "boolean" ) ? options.groupOpen : true;
			_self.legendOpen = ( typeof ( options.legendOpen ) === "boolean" ) ? options.legendOpen : true;

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			if ( !_self.njMapLayer ) {
				naji.njMapConfig.alert_Error( "njMapLayer undefined" );
				return false;
			}

			// tocListDivId가 없을 시 body에 임시로 DIV 생성
			if ( !_self.tocListDivId ) {
				_self.tocListDivId = naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];

				_$( "body" ).append( _$( "<div/>", {
					id : _self.tocListDivId,
					css : {
						display : "none"
					}
				} ) );
			}

		} )();
		// END Initialize


		return {
			tocKey : _self.tocKey,
			remove : _self.remove,
			njMap : _self.njMap,
			njMapLayer : _self.njMapLayer,
			getTocDivId : _self.getTocDivId,
			tocExpandAll : _self.tocExpandAll,
			tocCheckAllNodes : _self.tocCheckAllNodes
		}

	} );


	/**
	 * TOC DIV 생성를 생성한다.
	 * 
	 * @param type {String} TOC 타입 (WMS, WebWMS, WFS, WCS, WMTS).
	 * @param title {String} TOC 타이틀.
	 * 
	 * @private
	 */
	naji.toc.njMapTocDefault.prototype.createTocDiv = function(type_, title_) {
		var _self = this._this || this;

		var _iconSRC = null;
		var _tocDiv = null;
		var _tocHead = null;
		var _collapseId = null;
		var _collapseDiv;
		var _title = null;

		_self.tocDivId = "TOC_" + naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];
		_self.tocAccorId = "accor_" + naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];
		_collapseId = "collapse_" + naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];
		_iconSRC = '<img class="' + 'tocIMG_' + type_ + '">';

		_tocDiv = _$( "<div/>", {
			id : _self.tocAccorId
		} );

		_tocDiv.addClass( "panel-group" );
		_tocDiv.html(
			'<div class="panel-group" >' +
				'<div class="panel panel-default">' +
					'<div class="panel-heading" onclick="javascript:_$(\'#collapseOne\').collapse(\'toggle\');">' + 
						/* '<div class="panel-heading">'+ */
						'<h4 class="panel-title">' +
							'<a class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion1" href="#collapseOne" aria-expanded="false">' +
								'sampleTOC_1' +
							'</a><i class="indicator glyphicon glyphicon-chevron-down pull-right"></i>' +
						'</h4>' +
					'</div>' +
					'<div id="collapseOne" class="panel-collapse collapse" aria-expanded="false" style="height: 0px;">' +
						'<div class="panel-body" style="padding: 5px;">' +
							//'<div style="overflow: auto; width: 100%; background-color: white;height:340px" class="ztree" id="TOC_1"></div>' +
							'<div style="overflow: auto; width: 100%;" class="ztree" id="TOC_1"></div>' +
							'<div class="tocEventDIV">' +
								'<div class="tocEventDIV sub">' +
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').checkAllNodes(' + true + ');">' +
										'<span class="glyphicon glyphicon-check"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').checkAllNodes(' + false + ');">' +
										'<span class="glyphicon glyphicon-unchecked"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').expandAll(' + true + ');">' +
										'<span class="glyphicon glyphicon-resize-full"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').expandAll(' + false + ');">' +
										'<span class="glyphicon glyphicon-resize-small"></span>' +
									'</a>'+
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>' +	
				'</div>' +
			'</div>');
		
		
		var table = 
			'<table class="table" style="border: 1px solid #cecece; margin-bottom: 10px;">' +
				'<tbody>' +
					'<tr>' +
						//'<td style="background-color:#cecece;" >CRS</td>' +
						'<td>CRS</td>' +
						'<td id="CRS_TEXT"></td>' +
					'</tr>' +      
					'<tr>' +
						//'<td style="background-color:#cecece;">BBOX</td>' +
						'<td>BBOX</td>' +
						'<td id="BBOX_TEXT" style="word-break: break-all; white-space:pre-line;"></td>' +
					'</tr>' +
				'</tbody>' +
			'</table>';

		if ( type_ === "WMS" || type_ === "WebWMS" ) {
			_tocDiv.find( ".panel-body" ).prepend( table );
		}

		_tocHead = _tocDiv.find( ".panel-heading" );
		_tocHead.attr( "onclick", _tocHead.attr( "onclick" ).replace( "collapseOne", _collapseId ) );
		_tocHead.find( ".accordion-toggle" ).attr( "data-parent", "#" + _self.tocAccorId );
		_tocHead.find( ".accordion-toggle" ).attr( "href", "#" + _collapseId );
		_tocHead.find( ".accordion-toggle" ).text( " " + title_ );
		_tocHead.find( ".accordion-toggle" ).prepend( _$( _iconSRC ) );

		_collapseDiv = _tocDiv.find( ".panel-collapse" ).attr( "id", _collapseId );
		_collapseDiv.find( ".ztree" ).attr( "id", _self.tocDivId );

		_$( "#" + _self.tocListDivId ).prepend( _tocDiv );
		
		if ( _self.menuOpen ) {
			$( "#" + _collapseId ).collapse( "show" );
		}
	};


	/**
	 * zTree 속성 정보를 가져온다.
	 * 
	 * @param layerSetVisible {Function} 레이어 체크 이벤트.
	 * @param layerOrderChange {Function} 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 * 
	 * @return zTreeSetting {Object} zTree 속성 정보.
	 */
	naji.toc.njMapTocDefault.prototype.zTreeAttribute_Legend = function(options_) {
		var _self = this._this || this;

		var funcs = new _self._zTreeFuncs();

		var zTreeSetting = {
			view : {
				selectedMulti : false,
				expandSpeed : "fast",
				addDiyDom : funcs.addDIYDom_Legend
			},
			check : {
				autoCheckTrigger : true,
				enable : true,
				chkboxType : {
					"Y" : "",
					"N" : ""
				}
			},
			data : {
				simpleData : {
					enable : true
				}
			},
			edit : {
				enable : true,
				showRemoveBtn : false,
				showRenameBtn : false,
				drag : {
					autoExpandTrigger : true,
					prev : funcs.dropPrev,
					inner : funcs.dropInner,
					next : funcs.dropNext
				}
			},
			callback : {
				onCheck : options_.layerSetVisible,
				beforeDrop : options_.layerOrderChange,
				beforeDrag : funcs.beforeDrag
			},
			async : {
				enable : true
			}
		};

		return zTreeSetting;
	};


	/**
	 * TOC 전체 펼치기.
	 * 
	 * @param state {Boolean} 펼치기 상태.
	 */
	naji.toc.njMapTocDefault.prototype.tocExpandAll = function(state_) {
		var _self = this._this || this;
		_$.fn.zTree.getZTreeObj( _self.tocDivId ).expandAll( state_ );
	};


	/**
	 * TOC 전체 체크.
	 * 
	 * @param state {Boolean} 체크 상태.
	 */
	naji.toc.njMapTocDefault.prototype.tocCheckAllNodes = function(state_) {
		var _self = this._this || this;
		_$.fn.zTree.getZTreeObj( _self.tocDivId ).checkAllNodes( state_ );
	};


	/**
	 * TOC DIV ID를 가져온다.
	 * 
	 * @return tocDivId {String} TOC DIV ID.
	 */
	naji.toc.njMapTocDefault.prototype.getTocDivId = function() {
		var _self = this._this || this;
		return _self.tocDivId;
	};


	/**
	 * TOC를 삭제한다.
	 */
	naji.toc.njMapTocDefault.prototype.remove = function() {
		var _self = this._this || this;
		
		_$.fn.zTree.destroy( _self.tocDivId );
		_$( "#" + _self.tocAccorId ).remove();
	};


	/**
	 * zTree 이벤트.
	 * 
	 * @private
	 * 
	 * @return {Object} zTree 이벤트 리스트.
	 */
	naji.toc.njMapTocDefault.prototype._zTreeFuncs = function() {
		var _this = this;

		_this.curDragNodes = null;

		// dropPrev
		function _dropPrev(treeId, nodes, targetNode) {
			var pNode = targetNode.getParentNode();
			if ( pNode && pNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					var curPNode = _this.curDragNodes[ i ].getParentNode();
					if ( curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// dropInner
		function _dropInner(treeId, nodes, targetNode) {
			if ( targetNode && targetNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					if ( !targetNode && _this.curDragNodes[ i ].dropRoot === false ) {
						return false;
					} else if ( _this.curDragNodes[ i ].parentTId && _this.curDragNodes[ i ].getParentNode() !== targetNode
							&& _this.curDragNodes[ i ].getParentNode().childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// dropNext
		function _dropNext(treeId, nodes, targetNode) {
			var pNode = targetNode.getParentNode();
			if ( pNode && pNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					var curPNode = _this.curDragNodes[ i ].getParentNode();
					if ( curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// beforeDrag
		function _beforeDrag(treeId, treeNodes) {
			for ( var i = 0 , l = treeNodes.length; i < l; i++ ) {
				if ( treeNodes[ i ].drag === false ) {
					_this.curDragNodes = null;
					return false;
				} else if ( treeNodes[ i ].parentTId && treeNodes[ i ].getParentNode().childDrag === false ) {
					_this.curDragNodes = null;
					return false;
				}
			}

			_this.curDragNodes = treeNodes;
			return true;
		}


		// 범례이미지 추가
		function _addDIYDom_Legend(treeId, treeNode) {
			if ( treeNode[ "parentNode" ] && treeNode[ "parentNode" ][ "id" ] !== 2 ) return;

			var aObj = _$( "#" + treeNode.tId + "_a" );
			if ( treeNode[ "isLegend" ] && treeNode[ "LegendURL" ] ) {
				aObj.empty();
				aObj.css( "height", "auto" );
				aObj.append( "<img src='" + treeNode[ "LegendURL" ] + "' title='" + treeNode[ "name" ] +"'>" );
			}
		}

		return {
			dropPrev : _dropPrev,
			dropInner : _dropInner,
			dropNext : _dropNext,
			beforeDrag : _beforeDrag,
			addDIYDom_Legend : _addDIYDom_Legend
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * WCS TOC 객체.
	 * 
	 * WCS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapLayer {naji.layer.njMapWCSLayer} {@link naji.layer.njMapWCSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.coverage {String} 레이어 이름.
	 * 
	 * @Extends {naji.toc.njMapTocDefault}
	 * 
	 * @class
	 */
	naji.toc.njMapWCSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.coverage = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.toc.njMapTocDefault.call( _self, options );

			_self.coverage = ( options.coverage !== undefined ) ? options.coverage : "";

			_self.createTocDiv( "WCS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( _layerSetVisible );

			_self._createWCSToc();

		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.njMapLayer.setTocVisible( check );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.toc.njMapWCSToc.prototype = Object.create( naji.toc.njMapTocDefault.prototype );
	naji.toc.njMapWCSToc.prototype.constructor = naji.toc.njMapWCSToc;


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	naji.toc.njMapWCSToc.prototype._createWCSToc = function() {
		var _self = this._this || this;

		var wcsZtreeLayer;
		var originWCSztreeLayer = _self._getWCSNodeTozTree( _self._getWCSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wcsZtreeLayer = originWCSztreeLayer;
		} else {
			wcsZtreeLayer = originWCSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wcsZtreeLayer );

		return wcsZtreeLayer;
	};


	/**
	 * _getWCSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wcsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	naji.toc.njMapWCSToc.prototype._getWCSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "Coverage" ],
			name : node_[ "Coverage" ],
			// title : null,
			children : [],
			open : true,
			drop : false,
			inner : false,
			checked : true,
			Coverage : node_[ "Coverage" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false
		};

		var root = {
			id : "root",
			name : node_[ "Coverage" ],
			// title : null,
			children : [ layer ],
			open : true,
			drop : false,
			inner : false,
			checked : true,
			isGroupLayer : true,
			Extent : null,
			chkDisabled : false
		};

		return root;
	};


	/**
	 * 해당 WCS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wcsLayerData
	 */
	naji.toc.njMapWCSToc.prototype._getWCSLayerData = function() {
		var _self = this._this || this;

		var wcsLayerData = {
			KEY : _self.tocKey,
			Coverage : _self.coverage
		};

		return wcsLayerData;
	};

} )();

( function() {
	"use strict";

	/**
	 * Web WMS TOC 객체.
	 * 
	 * WMS 서비스의 TOC를 표현하는 객체. 원하는 레이어만 표현할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWebWmsToc = new naji.toc.njMapWebWMSToc( {
	 *	njMap : new naji.njMap({...}),
	 *	njMapLayer : new naji.layer.njMapWMSLayer({...}),
	 *	capabilities : new naji.service.njMapGetCapabilitiesWMS({...}).data,
	 *	tocKey : 'wms_key',
	 *	tocTitle : 'WMS TOC Title',
	 *	tocListDivId : 'toc',
	 *	symbolSize : [20, 20],
	 *	visibleState : { 'LAYER_NAME1' : false, 'LAYER_NAME2' : false },
	 *	loadData : { 'LayerName' : 'ROOT', 'checked' : false, 'open' : true }
	 *	selectLayers : [ 'LAYER_NAME1', 'LAYER_NAME2' ]
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapLayer {naji.layer.njMapWMSLayer} {@link naji.layer.njMapWMSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.symbolSize {Array.<Number>} 범례 심볼 간격. Default is `[20, 20]`.
	 * @param opt_options.visibleState {Object} { layerName : Boolean } 형태로 초기 체크 상태 설정.
	 * @param opt_options.capabilities {naji.service.njMapGetCapabilitiesWMS} {@link naji.service.njMapGetCapabilitiesWMS} WMS capabilities.
	 * @param opt_options.selectLayers {Array.<String>} TOC에 추가할 레이어 리스트.
	 * 
	 * @Extends {naji.toc.njMapTocDefault}
	 * 
	 * @class
	 */
	naji.toc.njMapWebWMSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.symbolSize = null;
		this.capabilities = null;
		this.visibleState = null;
		this.selectLayers = null;

		this.key_zoomEnd = null;
		this.showLayerNames = null;
		this.key_changeResolution = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.toc.njMapTocDefault.call( _self, options );

			var symbolSize = options.symbolSize;
			if ( !Array.isArray( symbolSize ) ) {
				_self.symbolSize = [ 20, 20 ];
			} else {
				_self.symbolSize = symbolSize;
			}

			_self.loadData = ( options.loadData !== undefined ) ? options.loadData : undefined;
			_self.visibleState = ( options.visibleState !== undefined ) ? options.visibleState : {};
			_self.selectLayers = ( options.selectLayers !== undefined ) ? options.selectLayers : [];
			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;

			if ( !_self.capabilities ) {
				naji.njMapConfig.alert_Error( "capabilities undefined" );
				return false;
			}

			_self.createTocDiv( "WebWMS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible,
				layerOrderChange : _layerOrderChange
			} );

			_self._createWMSToc( false );

			_self._createReloadBtn();

			_self._activeChangeResolution();

			_$( "#" + _self.tocAccorId ).find( "#CRS_TEXT" ).text( _self.capabilities.serviceMetaData[ "crs" ] );
			_$( "#" + _self.tocAccorId ).find( "#BBOX_TEXT" ).text( _self.capabilities.serviceMetaData[ "maxExtent" ].toString() );

			_self.njMap.getMap().getView().dispatchEvent( {
				type : "change:resolution"
			} );
		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			_self._olWMSLayerRefresh();
		}


		/**
		 * TOC 레이어 순서 변경 이벤트
		 */
		function _layerOrderChange(treeId, treeNodes, targetNode, moveType) {
			var state = false;

			if ( treeNodes[ 0 ] ) {
				var tocID = treeNodes[ 0 ][ "tId" ].split( "_" )[ 1 ];
				if ( treeId.split( "_" )[ 1 ] !== tocID ) {
					return false;
				}
			} else {
				return false;
			}

			if ( targetNode[ "isGroupLayer" ] ) {
				state = ( targetNode[ "drop" ] ) ? true : false;
				if ( targetNode[ "LayerName" ] === "ROOT" && moveType !== "inner" ) {
					state = false;
				}
			} else {
				state = ( moveType !== "inner" ) ? true : false;
			}

			return _self._layerOrderChangeListener( state );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			reLoad : _self.reLoad,
			getSaveData : _self.getSaveData,
			getShowLayerNames : _self.getShowLayerNames
		} );

	} );


	naji.toc.njMapWebWMSToc.prototype = Object.create( naji.toc.njMapTocDefault.prototype );
	naji.toc.njMapWebWMSToc.prototype.constructor = naji.toc.njMapWebWMSToc;


	/**
	 * 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 */
	naji.toc.njMapWebWMSToc.prototype._layerOrderChangeListener = function(state) {
		var _self = this._this || this;

		if ( state ) {
			_self._olWMSLayerRefresh();
			setTimeout( function() {
				_self._olWMSLayerRefresh();
			}, 100 );
		}
		return state;
	};


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	naji.toc.njMapWebWMSToc.prototype._createWMSToc = function(reload_ ) {
		var _self = this._this || this;

		var wmsZtreeLayer = _self._getWMSNodeTozTree( _self._getWMSLayerData()[ "Layers" ] );

		// 저장된 데이터 불러오기 (open, order, checked)
		if ( !reload_ && _self.loadData ) {
			var layerDataObject = _self._getLayerDataObject( wmsZtreeLayer, {} );
			wmsZtreeLayer = _self._setLoadData( layerDataObject, _$.extend( true, {}, _self.loadData ) );
		}

		if ( _self.selectLayers !== undefined ) {
			wmsZtreeLayer = _self._getSelectLayers( wmsZtreeLayer, _self.selectLayers );
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmsZtreeLayer );

		return wmsZtreeLayer;
	};


	/**
	 * 선택된 레이어 정보를 추출한다.
	 * 
	 * @param originWebWMSztreeLayer {Object} 원본 zTree 데이터.
	 * @param selectLayers {Array.<String>} 추가할 레이어 리스트.
	 * 
	 * @private
	 * 
	 * @return {Object} wmsZtreeLayer
	 */
	naji.toc.njMapWebWMSToc.prototype._getSelectLayers = function(originWebWMSztreeLayer_, selectLayers_) {
		var _self = this._this || this;

		var reLoadData = [];
		var noneGroupLayers_origin = [];
		noneGroupLayers_origin = _self._getNoneGroupLayers( originWebWMSztreeLayer_, noneGroupLayers_origin );

		var temp = [];
		for ( var i in selectLayers_ ) {
			var selectLayerName = selectLayers_[ i ];
			for ( var j in noneGroupLayers_origin ) {
				var originLayer = noneGroupLayers_origin[ j ];
				if ( originLayer[ "LayerName" ] === selectLayerName ) {
					// originLayer["checked"] = false;
					temp.push( noneGroupLayers_origin.slice( j, j + 1 )[ 0 ] );
					noneGroupLayers_origin.splice( j, 1 );
				}
			}
		}

		// reLoadData = noneGroupLayers_origin.concat( temp );
		reLoadData = temp;

		originWebWMSztreeLayer_[ "children" ] = reLoadData;

		return originWebWMSztreeLayer_;
	};


	/**
	 * _getWMSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node_ {Object} wmsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	naji.toc.njMapWebWMSToc.prototype._getWMSNodeTozTree = function(node_) {
		var _self = this._this || this;

		var layer = {
			id : null,
			name : null,
			children : [],
			drop : true,
			drag : true,
			open : true,
			checked : true,
			dropInner : true,
			chkDisabled : false,

			Extent : null,
			LayerName : null,
			LegendURL : null,
			MinScale : 0,
			MaxScale : Infinity,
			scaleVisible : true,
			isGroupLayer : false
		};


		for ( var i = 0; i < node_.length; i++ ) {
			layer[ "name" ] = node_[ i ][ "Title" ];
			layer[ "id" ] = node_[ i ][ "LayerName" ];
			layer[ "LayerName" ] = node_[ i ][ "LayerName" ];

			if ( typeof _self.visibleState[ layer[ "LayerName" ] ] === 'boolean' ) {
				layer[ "checked" ] = _self.visibleState[ layer[ "LayerName" ] ];
			}

			layer[ "LegendURL" ] = node_[ i ][ "LegendURL" ];

			var minScale = node_[ i ][ "MinScale" ];
			if ( typeof minScale !== "undefined" ) {
				layer[ "MinScale" ] = minScale;
			}

			var maxScale = node_[ i ][ "MaxScale" ];
			if ( typeof maxScale !== "undefined" ) {
				layer[ "MaxScale" ] = maxScale;
			}

			layer[ "Extent" ] = node_[ i ][ "Extent" ];
			layer[ "isGroupLayer" ] = node_[ i ][ "isGroupLayer" ];

			// 그룹레이어
			if ( layer[ "isGroupLayer" ] ) {
				layer[ "open" ] = ( _self.groupOpen ? true : false );
			}

			if ( layer[ "id" ] === "ROOT" ) {
				layer[ "open" ] = true;
				layer[ "drag" ] = false;
			}

			var childLayers = node_[ i ][ "ChildLayers" ];
			if ( childLayers.length > 0 ) {
				for ( var j = 0; j < childLayers.length; j++ ) {
					layer[ "children" ].push( _self._getWMSNodeTozTree( [ childLayers[ j ] ] ) );
				}
			} else {
				layer[ "drop" ] = false;
				layer[ "dropInner" ] = false;
				layer[ "iconSkin" ] = "pIconFeatureLayer";

				// 범례 오픈
				if ( !_self.legendOpen ) {
					layer[ "open" ] = false;
				}

				layer[ "children" ].push( {
					drag : false,
					drop : false,
					open : false,
					nocheck : true,
					isLegend : true,
					dropInner : false,
					LayerName : "leg_" + layer[ "LayerName" ],
					LegendURL : layer[ "LegendURL" ]
				} );
			}

		}

		return layer;
	};


	/**
	 * 해당 WMS 서비스의 capabilities를 통해 레이어 정보를 가져온다.
	 * 
	 * @private
	 * 
	 * @return wmsLayerData
	 */
	naji.toc.njMapWebWMSToc.prototype._getWMSLayerData = function() {
		var _self = this._this || this;

		var wmsLayerData = {
			CRS : _self.capabilities.serviceMetaData.crs,
			MaxExtent : _self.capabilities.serviceMetaData.maxExtent,
			Layers : []
		};

		var capabilitiesJSON = _self.capabilities.xmlJson[ "WMS_Capabilities" ][ "Capability" ][ "Layer" ];
		var layers = _self._getWMSCapabilitieLayerData( [ capabilitiesJSON ] );
		wmsLayerData[ "Layers" ].push( layers );

		return wmsLayerData;
	};


	/**
	 * 해당 WMS 서비스의 capabilitie에서 TOC 생성에 필요한 데이터를 가져온다.
	 * 
	 * @private
	 * 
	 * @return layerData
	 */
	naji.toc.njMapWebWMSToc.prototype._getWMSCapabilitieLayerData = function(node_) {
		var _self = this._this || this;

		var layerData = {
			LayerName : null,
			Title : null,
			Extent : null,
			MinScale : null,
			MaxScale : null,
			LegendURL : null,
			isGroupLayer : false,
			isVisible : true,
			ChildLayers : []
		};

		for ( var i in node_ ) {
			var title = node_[ i ][ "Title" ];
			if ( typeof title !== "undefined" ) {
				title = title[ "#text" ];
			}
			var layerName = node_[ i ][ "Name" ];
			if ( typeof layerName !== "undefined" ) {
				layerName = layerName[ "#text" ];
			}
			var extent = node_[ i ][ "BoundingBox" ];
			if ( typeof extent !== "undefined" ) {
				if ( Array.isArray( extent ) ) {
					extent = extent[ 0 ];
				}
				extent = extent[ "@attributes" ];
				extent = [ parseFloat( extent[ "minx" ] ), parseFloat( extent[ "miny" ] ), parseFloat( extent[ "maxx" ] ), parseFloat( extent[ "maxy" ] ) ];
			}
			var minScale = node_[ i ][ "MinScaleDenominator" ];
			if ( typeof minScale !== "undefined" ) {
				minScale = parseFloat( minScale[ "#text" ] );
			}
			var maxScale = node_[ i ][ "MaxScaleDenominator" ];
			if ( typeof maxScale !== "undefined" ) {
				maxScale = parseFloat( maxScale[ "#text" ] );
			}
			var style = node_[ i ][ "Style" ];
			var legendURL;
			if ( typeof style !== "undefined" ) {

				if ( Array.isArray( style ) ) {
					style = style[ 0 ];
				}

				if ( typeof style[ "LegendURL" ] !== "undefined" ) {
					legendURL = style[ "LegendURL" ][ "OnlineResource" ][ "@attributes" ][ "xlink:href" ];
					legendURL += "&SYMBOL_WIDTH=" + _self.symbolSize[ 0 ];
					legendURL += "&SYMBOL_HEIGHT=" + _self.symbolSize[ 1 ];
				}
			}

			var childLayer = node_[ i ][ "Layer" ];

			if ( !Array.isArray( childLayer ) && typeof childLayer !== "undefined" ) {
				childLayer = [ childLayer ];
			}

			if ( Array.isArray( childLayer ) ) {
				layerData[ "isGroupLayer" ] = true;
				for ( var j = childLayer.length; --j >= 0; ) {
					layerData[ "ChildLayers" ].push( _self._getWMSCapabilitieLayerData( [ childLayer[ j ] ] ) );
				}
			}

			layerData[ "LayerName" ] = layerName;
			layerData[ "Title" ] = title;
			layerData[ "Extent" ] = extent;
			layerData[ "MinScale" ] = minScale;
			layerData[ "MaxScale" ] = maxScale;
			layerData[ "LegendURL" ] = legendURL;

		}

		return layerData;
	};


	/**
	 * 레이어 그룹해제
	 * 
	 * @private
	 * 
	 * @return noneGroupLayers
	 */
	naji.toc.njMapWebWMSToc.prototype._getNoneGroupLayers = function(layers_, noneGroupLayers_) {
		var _self = this._this || this;

		layers_ = [ layers_ ];
		for ( var i in layers_ ) {
			var layer = layers_[ i ];

			if ( layer.isGroupLayer ) {
				var childs = layer[ "children" ];
				for ( var j in childs ) {
					var child = childs[ j ];
					_self._getNoneGroupLayers( child, noneGroupLayers_ );
				}
			} else {
				noneGroupLayers_.push( layer );
			}
		}

		return noneGroupLayers_;
	};


	/**
	 * 스케일 변경 이벤트 활성화 설정
	 * 
	 * @private
	 */
	naji.toc.njMapWebWMSToc.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var view = _self.njMap.getMap().getView();

		_self.njMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( view );


		function detectZoomChange(view_) {
			_self.key_changeResolution = view_.on( "change:resolution", function() {
				_changeResolution();
			} );
		}


		// 스케일 변경 이벤트
		function _changeResolution() {
			var scale = _self.njMap.calculateScale( {
				extent : _self.njMap.getMap().getView().calculateExtent( _self.njMap.getMap().getSize() ),
				originCRS : _self.capabilities.serviceMetaData[ "crs" ]
			} );

			scale = Math.ceil( scale );

			var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
			_updateScale( layers, scale );
			_$.fn.zTree.getZTreeObj( _self.tocDivId ).refresh();
			_self._olWMSLayerRefresh();
		}


		// 스케일 변경 시 해당 레이어의 MinScale, MaxScale 값에 따른 View 상태 처리
		function _updateScale(layer, scale) {
			if ( !layer[ "isLegend" ] ) {
				if ( ( layer[ "MinScale" ] <= scale ) && ( scale < layer[ "MaxScale" ] ) ) {
					layer.scaleVisible = true;
					layer.chkDisabled = false;
				} else {
					layer.scaleVisible = false;
					layer.chkDisabled = true;
				}
			}

			var children = layer.children;

			if ( Array.isArray( children ) ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[ i ];
					_updateScale( child, scale );
				}
			}
		}

	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 설정
	 * 
	 * @private
	 * 
	 * @return layerNames {String<String>} 레이어 리스트 toString
	 */
	naji.toc.njMapWebWMSToc.prototype.setZtreeLayerData = function() {
		var _self = this._this || this;

		var layerNames = [];
		var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
		layerNames = _self._getZtreeLayerData( layers, layerNames, "show" );
		layerNames = ( typeof layerNames === "undefined" ) ? "" : layerNames.toString();
		_self.showLayerNames = layerNames;
		return layerNames;
	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 가져오기
	 * 
	 * @private
	 * 
	 * @return names {Array.<String>}
	 */
	naji.toc.njMapWebWMSToc.prototype._getZtreeLayerData = function(layers, names, type) {
		var _self = this._this || this;

		var layer = [ layers ];
		for ( var i in layer ) {
			var data = layer[ i ];

			if ( ( type === "show" && data[ "checked" ] === false ) || ( type === "show" && data[ "chkDisabled" ] === true ) ) {
				return;
			}

			if ( data.isGroupLayer ) {
				var childs = data[ "children" ];
				for ( var j = childs.length; --j >= 0; ) {
					var child = childs[ j ];
					_self._getZtreeLayerData( child, names, type );
				}
			} else {
				names.push( data[ "LayerName" ] );
			}
		}

		return names;
	};


	/**
	 * 레이어 새로고침.
	 * 
	 * @private
	 */
	naji.toc.njMapWebWMSToc.prototype._olWMSLayerRefresh = function() {
		var _self = this._this || this;

		var olLayer = _self.njMapLayer.getOlLayer();

		olLayer.getSource().getParams().LAYERS = _self.setZtreeLayerData();
		olLayer.getSource().getParams().refTime = new Date().getMilliseconds();
		olLayer.getSource().updateParams( olLayer.getSource().getParams() );

		if ( olLayer.getSource().getParams().LAYERS === "" ) {
			_self.njMapLayer.setTocVisible( false );
		} else {
			if ( !( _self.njMapLayer.getVisible() ) ) {
				_self.njMapLayer.setTocVisible( true );
			}
		}
	};


	/**
	 * TOC의 모든 레이어를 { Key : Value } 형태로 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWebWMSToc.prototype._getLayerDataObject = function(layer_, layerDataObj_) {
		var _self = this._this || this;

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
				_self._getLayerDataObject( child, layerDataObj_ );
			}
		} else {
			layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
		}

		return layerDataObj_;
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWebWMSToc.prototype.getSaveData = function() {
		var _self = this._this || this;

		var zTreeNodes = $.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];

		return _self._getSaveData( _$.extend( true, {}, zTreeNodes ) );
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWebWMSToc.prototype._getSaveData = function(layer_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children", "LayerName" ];

		for ( var key in layer_ ) {
			if ( layer_.hasOwnProperty( key ) ) {
				if ( _$.inArray( key, ignores ) === -1 ) {
					delete layer_[ key ];
				}
			}
		}

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._getSaveData( child );
			}
		}

		return layer_;
	};


	/**
	 * 로드할 TOC 목록 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWebWMSToc.prototype._setLoadData = function(layerDataObj_, loadData_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children" ];

		var data = layerDataObj_[ loadData_[ "LayerName" ] ];

		for ( var key in data ) {
			if ( data.hasOwnProperty( key ) ) {
				if ( $.inArray( key, ignores ) === -1 ) {
					loadData_[ key ] = data[ key ];
				}
			}
		}


		var children = loadData_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._setLoadData( layerDataObj_, child );
			}
		}

		return loadData_;
	};


	/**
	 * TOC Reload 버튼 생성.
	 * 
	 * @private
	 */
	naji.toc.njMapWebWMSToc.prototype._createReloadBtn = function() {
		var _self = this._this || this;

		var $btn = $( '<a/>', {
			click : function() {
				_self.reLoad();
			}
		} ).append( $( '<span/>', {
			'class' : 'glyphicon glyphicon-refresh',
			'title' : '새로고침'
		} ) );

		_$( "#" + _self.tocDivId ).parent().find( ".tocEventDIV.sub" ).prepend( $btn );
	};


	/**
	 * 현재 보여지고 있는 레이어 목록 가져오기.
	 * 
	 * uniq가 true면 중복된 레이어를 제거한다.
	 * 
	 * @return showLayerList {Array.<String>} 현재 보여지고 있는 레이어 목록.
	 */
	naji.toc.njMapWebWMSToc.prototype.getShowLayerNames = function(uniq_) {
		var _self = this._this || this;

		var showLayerList = _self.showLayerNames.split( ',' );

		if ( uniq_ ) {
			showLayerList = showLayerList.reduce( function(a, b) {
				if ( a.indexOf( b ) < 0 ) a.push( b );
				return a;
			}, [] );
		}

		return showLayerList;
	};


	/**
	 * TOC를 다시 로드한다.
	 * 
	 * ※설정된 {@link naji.service.njMapGetCapabilitiesWMS}를 기준으로 다시 로드한다.
	 */
	naji.toc.njMapWebWMSToc.prototype.reLoad = function() {
		var _self = this._this || this;

		$.fn.zTree.destroy( _self.tocDivId );
		_self._createWMSToc( true );

		_self.njMap.getMap().getView().dispatchEvent( {
			type : "change:resolution"
		} );
	};


	/**
	 * TOC를 삭제한다.
	 * 
	 * @override
	 */
	naji.toc.njMapWebWMSToc.prototype.remove = function() {
		var _self = this._this || this;

		naji.toc.njMapTocDefault.prototype.remove.call( this );

		ol.Observable.unByKey( _self.key_changeResolution );
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS TOC 객체.
	 * 
	 * WFS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWfsToc = new naji.toc.njMapWFSToc( {
	 *	njMap : new naji.njMap({...}),
	 *	njMapLayer : new naji.layer.njMapWFSLayer({...}),
	 *	tocKey : 'wfs_key',
	 *	tocTitle : 'WFS TOC Title',
	 *	tocListDivId : 'toc',
	 *	layerName : 'world_country',
	 *	layerTitle : 'world_country Title'
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapLayer {naji.layer.njMapWFSLayer} {@link naji.layer.njMapWFSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.layerTitle {String} 레이어 이름.
	 * @param opt_options.layerName {String} 레이어 원본 이름.
	 * 
	 * @Extends {naji.toc.njMapTocDefault}
	 * 
	 * @class
	 */
	naji.toc.njMapWFSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layerTitle = null;
		this.layerName = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_super = naji.toc.njMapTocDefault.call( _self, options );

			_self.layerTitle = ( options.layerTitle !== undefined ) ? options.layerTitle : "";
			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";

			_self.createTocDiv( "WFS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible
			} );

			_self._createWFSToc();

		} )( opt_options );
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.njMapLayer.setTocVisible( check );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.toc.njMapWFSToc.prototype = Object.create( naji.toc.njMapTocDefault.prototype );
	naji.toc.njMapWFSToc.prototype.constructor = naji.toc.njMapWFSToc;


	/**
	 * TOC 생성
	 */
	naji.toc.njMapWFSToc.prototype._createWFSToc = function() {
		var _self = this._this || this;

		var wfsZtreeLayer;
		var originWFSztreeLayer = _self._getWFSNodeTozTree( _self._getWFSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wfsZtreeLayer = originWFSztreeLayer;
		} else {
			wfsZtreeLayer = originWFSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wfsZtreeLayer );

		return wfsZtreeLayer;
	};


	/**
	 * _getWFSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wfsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	naji.toc.njMapWFSToc.prototype._getWFSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "LayerName" ],
			name : node_[ "LayerTitle" ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false
		};

		var root = {
			id : "ROOT",
			name : node_[ "LayerTitle" ],
			children : [ layer ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			isGroupLayer : true,
			Extent : null,
			chkDisabled : false,
			iconSkin : "pIconFeatureLayer"
		};

		return root;
	};


	/**
	 * 해당 WFS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wfsLayerData
	 */
	naji.toc.njMapWFSToc.prototype._getWFSLayerData = function() {
		var _self = this._this || this;

		var wfsLayerData = {
			KEY : _self.tocKey,
			LayerName : _self.layerName,
			LayerTitle : _self.layerTitle
		};

		return wfsLayerData;
	};

} )();

( function() {
	"use strict";

	/**
	 * WMS TOC 객체.
	 * 
	 * WMS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWmsToc = new naji.toc.njMapWMSToc( {
	 * 	njMap : new naji.njMap({...}),
	 * 	njMapLayer : new naji.layer.njMapWMSLayer({...}),
	 * 	capabilities : new naji.service.njMapGetCapabilitiesWMS({...}).data,
	 * 	tocKey : 'wms_key',
	 * 	tocTitle : 'WMS TOC Title',
	 * 	tocListDivId : 'toc',
	 * 	symbolSize : [20, 20],
	 * 	visibleState : { 'LAYER_NAME1' : false, 'LAYER_NAME2' : false }
	 * 	loadData : { 'LayerName' : 'ROOT', 'checked' : false, 'open' : true }
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapLayer {naji.layer.njMapWMSLayer} {@link naji.layer.njMapWMSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.symbolSize {Array.<Number>} 범례 심볼 간격. Default is `[20, 20]`.
	 * @param opt_options.visibleState {Object} { layerName : Boolean } 형태로 초기 체크 상태 설정.
	 * @param opt_options.capabilities {naji.service.njMapGetCapabilitiesWMS} {@link naji.service.njMapGetCapabilitiesWMS} WMS capabilities
	 *            객체.
	 * 
	 * @Extends {naji.toc.njMapTocDefault}
	 * 
	 * @class
	 */
	naji.toc.njMapWMSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.loadData = null;
		this.symbolSize = null;
		this.capabilities = null;
		this.visibleState = null;

		this.key_zoomEnd = null;
		this.showLayerNames = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_super = naji.toc.njMapTocDefault.call( _self, options );

			var symbolSize = options.symbolSize;
			if ( !Array.isArray( symbolSize ) ) {
				_self.symbolSize = [ 20, 20 ];
			} else {
				_self.symbolSize = symbolSize;
			}

			_self.loadData = ( options.loadData !== undefined ) ? options.loadData : undefined;
			_self.visibleState = ( options.visibleState !== undefined ) ? options.visibleState : {};
			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;

			if ( !_self.capabilities ) {
				naji.njMapConfig.alert_Error( "capabilities undefined" );
				return false;
			}

			_self.createTocDiv( "WMS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible,
				layerOrderChange : _layerOrderChange
			} );

			_self._createWMSToc( false );

			_self._createReloadBtn();

			_self._activeChangeResolution();

			_$( "#" + _self.tocAccorId ).find( "#CRS_TEXT" ).text( _self.capabilities.serviceMetaData[ "crs" ] );
			_$( "#" + _self.tocAccorId ).find( "#BBOX_TEXT" ).text( _self.capabilities.serviceMetaData[ "maxExtent" ].toString() );

			_self.njMap.getMap().getView().dispatchEvent( {
				type : "change:resolution"
			} );
		} )( opt_options );
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			_self._olWMSLayerRefresh( false );
		}


		/**
		 * TOC 레이어 순서 변경 이벤트
		 */
		function _layerOrderChange(treeId, treeNodes, targetNode, moveType) {
			var state = false;

			if ( treeNodes[ 0 ] ) {
				var tocID = treeNodes[ 0 ][ "tId" ].split( "_" )[ 1 ];
				if ( treeId.split( "_" )[ 1 ] !== tocID ) {
					return false;
				}
			} else {
				return false;
			}

			if ( targetNode[ "isGroupLayer" ] ) {
				state = ( targetNode[ "drop" ] ) ? true : false;
				if ( targetNode[ "LayerName" ] === "ROOT" && moveType !== "inner" ) {
					state = false;
				}
			} else {
				state = ( moveType !== "inner" ) ? true : false;
			}

			return _self._layerOrderChangeListener( state );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			reLoad : _self.reLoad,
			getSaveData : _self.getSaveData,
			getShowLayerNames : _self.getShowLayerNames
		} );

	} );


	naji.toc.njMapWMSToc.prototype = Object.create( naji.toc.njMapTocDefault.prototype );
	naji.toc.njMapWMSToc.prototype.constructor = naji.toc.njMapWMSToc;


	/**
	 * 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 */
	naji.toc.njMapWMSToc.prototype._layerOrderChangeListener = function(state) {
		var _self = this._this || this;

		if ( state ) {
			_self._olWMSLayerRefresh( true );
			setTimeout( function() {
				_self._olWMSLayerRefresh( true );
			}, 100 );
		}
		return state;
	};


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	naji.toc.njMapWMSToc.prototype._createWMSToc = function(reload_) {
		var _self = this._this || this;

		var wmsZtreeLayer = _self._getWMSNodeTozTree( _self._getWMSLayerData()[ "Layers" ] );

		// 저장된 데이터 불러오기 (open, order, checked)
		if ( !reload_ && _self.loadData ) {
			var layerDataObject = _self._getLayerDataObject( wmsZtreeLayer, {} );
			wmsZtreeLayer = _self._setLoadData( layerDataObject, _$.extend( true, {}, _self.loadData ) );
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmsZtreeLayer );

		return wmsZtreeLayer;
	};


	/**
	 * _getWMSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node_ {Object} wmsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	naji.toc.njMapWMSToc.prototype._getWMSNodeTozTree = function(node_) {
		var _self = this._this || this;

		var layer = {
			id : null,
			name : null,
			children : [],
			drop : true,
			drag : true,
			open : true,
			checked : true,
			dropInner : true,
			chkDisabled : false,

			Extent : null,
			LayerName : null,
			LegendURL : null,
			MinScale : 0,
			MaxScale : Infinity,
			scaleVisible : true,
			isGroupLayer : false
		};


		for ( var i = 0; i < node_.length; i++ ) {
			layer[ "name" ] = node_[ i ][ "Title" ];
			layer[ "id" ] = node_[ i ][ "LayerName" ];
			layer[ "LayerName" ] = node_[ i ][ "LayerName" ];

			if ( typeof _self.visibleState[ layer[ "LayerName" ] ] === 'boolean' ) {
				layer[ "checked" ] = _self.visibleState[ layer[ "LayerName" ] ];
			}

			layer[ "LegendURL" ] = node_[ i ][ "LegendURL" ];

			var minScale = node_[ i ][ "MinScale" ];
			if ( typeof minScale !== "undefined" ) {
				layer[ "MinScale" ] = minScale;
			}

			var maxScale = node_[ i ][ "MaxScale" ];
			if ( typeof maxScale !== "undefined" ) {
				layer[ "MaxScale" ] = maxScale;
			}

			layer[ "Extent" ] = node_[ i ][ "Extent" ];
			layer[ "isGroupLayer" ] = node_[ i ][ "isGroupLayer" ];

			// 그룹레이어 오픈
			if ( layer[ "isGroupLayer" ] ) {
				layer[ "open" ] = ( _self.groupOpen ? true : false );
			}

			if ( layer[ "id" ] === "ROOT" ) {
				layer[ "open" ] = true;
				layer[ "drag" ] = false;
			}

			var childLayers = node_[ i ][ "ChildLayers" ];
			if ( childLayers.length > 0 ) {
				for ( var j = 0; j < childLayers.length; j++ ) {
					layer[ "children" ].push( _self._getWMSNodeTozTree( [ childLayers[ j ] ] ) );
				}
			} else {
				layer[ "drop" ] = false;
				layer[ "dropInner" ] = false;
				layer[ "iconSkin" ] = "pIconFeatureLayer";

				// 범례 오픈
				if ( !_self.legendOpen ) {
					layer[ "open" ] = false;
				}

				if ( layer[ "LayerName" ] && layer[ "LegendURL" ] ) {
					layer[ "children" ].push( {
						drag : false,
						drop : false,
						open : false,
						nocheck : true,
						isLegend : true,
						dropInner : false,
						name : layer[ "LayerName" ],
						LayerName : "leg_" + layer[ "LayerName" ],
						LegendURL : layer[ "LegendURL" ]
					} );
				}
			}

		}

		return layer;
	};


	/**
	 * 해당 WMS 서비스의 capabilities를 통해 레이어 정보를 가져온다.
	 * 
	 * @private
	 * 
	 * @return wmsLayerData
	 */
	naji.toc.njMapWMSToc.prototype._getWMSLayerData = function() {
		var _self = this._this || this;

		var wmsLayerData = {
			CRS : _self.capabilities.serviceMetaData.crs,
			MaxExtent : _self.capabilities.serviceMetaData.maxExtent,
			Layers : []
		};

		var capabilitiesJSON = _self.capabilities.xmlJson[ "WMS_Capabilities" ][ "Capability" ][ "Layer" ];
		var layers = _self._getWMSCapabilitieLayerData( [ capabilitiesJSON ] );
		wmsLayerData[ "Layers" ].push( layers );

		return wmsLayerData;
	};


	/**
	 * 해당 WMS 서비스의 capabilitie에서 TOC 생성에 필요한 데이터를 가져온다.
	 * 
	 * @private
	 * 
	 * @return layerData
	 */
	naji.toc.njMapWMSToc.prototype._getWMSCapabilitieLayerData = function(node_) {
		var _self = this._this || this;

		var layerData = {
			LayerName : null,
			Title : null,
			Extent : null,
			MinScale : null,
			MaxScale : null,
			LegendURL : null,
			isGroupLayer : false,
			isVisible : true,
			ChildLayers : []
		};

		for ( var i in node_ ) {
			var title = node_[ i ][ "Title" ];
			if ( typeof title !== "undefined" ) {
				title = title[ "#text" ];
			}
			var layerName = node_[ i ][ "Name" ];
			if ( typeof layerName !== "undefined" ) {
				layerName = layerName[ "#text" ];
			}
			var extent = node_[ i ][ "BoundingBox" ];
			if ( typeof extent !== "undefined" ) {
				if ( Array.isArray( extent ) ) {
					extent = extent[ 0 ];
				}
				extent = extent[ "@attributes" ];
				extent = [ parseFloat( extent[ "minx" ] ), parseFloat( extent[ "miny" ] ), parseFloat( extent[ "maxx" ] ), parseFloat( extent[ "maxy" ] ) ];
			}
			var minScale = node_[ i ][ "MinScaleDenominator" ];
			if ( typeof minScale !== "undefined" ) {
				minScale = parseFloat( minScale[ "#text" ] );
			}
			var maxScale = node_[ i ][ "MaxScaleDenominator" ];
			if ( typeof maxScale !== "undefined" ) {
				maxScale = parseFloat( maxScale[ "#text" ] );
			}
			var style = node_[ i ][ "Style" ];
			var legendURL;
			if ( typeof style !== "undefined" ) {

				if ( Array.isArray( style ) ) {
					style = style[ 0 ];
				}

				if ( typeof style[ "LegendURL" ] !== "undefined" ) {
					legendURL = style[ "LegendURL" ][ "OnlineResource" ][ "@attributes" ][ "xlink:href" ];
					legendURL += "&SYMBOL_WIDTH=" + _self.symbolSize[ 0 ];
					legendURL += "&SYMBOL_HEIGHT=" + _self.symbolSize[ 1 ];
				}
			}

			var childLayer = node_[ i ][ "Layer" ];

			if ( !Array.isArray( childLayer ) && typeof childLayer !== "undefined" ) {
				childLayer = [ childLayer ];
			}

			if ( Array.isArray( childLayer ) ) {
				layerData[ "isGroupLayer" ] = true;
				for ( var j = childLayer.length; --j >= 0; ) {
					layerData[ "ChildLayers" ].push( _self._getWMSCapabilitieLayerData( [ childLayer[ j ] ] ) );
				}
			}

			layerData[ "LayerName" ] = layerName;
			layerData[ "Title" ] = title;
			layerData[ "Extent" ] = extent;
			layerData[ "MinScale" ] = minScale;
			layerData[ "MaxScale" ] = maxScale;
			layerData[ "LegendURL" ] = legendURL;
		}

		return layerData;
	};


	/**
	 * 레이어 그룹해제.
	 * 
	 * @private
	 * 
	 * @return noneGroupLayers
	 */
	naji.toc.njMapWMSToc.prototype._getNoneGroupLayers = function(layers_, noneGroupLayers_) {
		var _self = this._this || this;

		layers_ = [ layers_ ];
		for ( var i in layers_ ) {
			var layer = layers_[ i ];

			if ( layer.isGroupLayer ) {
				var childs = layer[ "children" ];
				for ( var j in childs ) {
					var child = childs[ j ];
					_self._getNoneGroupLayers( child, noneGroupLayers_ );
				}
			} else {
				noneGroupLayers_.push( layer );
			}
		}

		return noneGroupLayers_;
	};


	/**
	 * 스케일 변경 이벤트 활성화 설정.
	 * 
	 * @param baseMap {naji.baseMap} baseMap.
	 * 
	 * @private
	 */
	naji.toc.njMapWMSToc.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var view = _self.njMap.getMap().getView();

		_self.njMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( view );


		function detectZoomChange(view_) {
			_self.key_changeResolution = view_.on( "change:resolution", function() {
				_changeResolution();
			} );
		}


		// 스케일 변경 이벤트
		function _changeResolution() {
			var scale = _self.njMap.calculateScale( {
				extent : _self.njMap.getMap().getView().calculateExtent( _self.njMap.getMap().getSize() ),
				originCRS : _self.capabilities.serviceMetaData[ "crs" ]
			} );

			scale = Math.ceil( scale );

			var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
			_updateScale( layers, scale );
			_$.fn.zTree.getZTreeObj( _self.tocDivId ).refresh();
			_self._olWMSLayerRefresh( false );
		}


		// 스케일 변경 시 해당 레이어의 MinScale, MaxScale 값에 따른 View 상태 처리
		function _updateScale(layer, scale) {
			if ( !layer[ "isLegend" ] ) {
				if ( ( layer[ "MinScale" ] <= scale ) && ( scale < layer[ "MaxScale" ] ) ) {
					layer.scaleVisible = true;
					layer.chkDisabled = false;
				} else {
					layer.scaleVisible = false;
					layer.chkDisabled = true;
				}
			}

			var children = layer.children;

			if ( Array.isArray( children ) ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[ i ];
					_updateScale( child, scale );
				}
			}
		}

	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 설정.
	 * 
	 * @private
	 * 
	 * @return layerNames {String} 레이어 리스트 toString
	 */
	naji.toc.njMapWMSToc.prototype.setZtreeLayerData = function() {
		var _self = this._this || this;

		var layerNames = [];
		var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
		layerNames = _self._getZtreeLayerData( layers, layerNames, "show" );
		layerNames = ( typeof layerNames === "undefined" ) ? "" : layerNames.toString();
		_self.showLayerNames = layerNames;
		return layerNames;
	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 가져오기
	 * 
	 * @private
	 * 
	 * @return names {Array.<String>}
	 */
	naji.toc.njMapWMSToc.prototype._getZtreeLayerData = function(layers, names, type) {
		var _self = this._this || this;

		var layer = [ layers ];
		for ( var i in layer ) {
			var data = layer[ i ];

			if ( ( type === "show" && data[ "checked" ] === false ) || ( type === "show" && data[ "chkDisabled" ] === true ) ) {
				return;
			}

			if ( data.isGroupLayer ) {
				var childs = data[ "children" ];
				for ( var j = childs.length; --j >= 0; ) {
					var child = childs[ j ];
					_self._getZtreeLayerData( child, names, type );
				}
			} else {
				names.push( data[ "LayerName" ] );
			}
		}

		return names;
	};


	/**
	 * 레이어 새로고침.
	 * 
	 * @private
	 */
	naji.toc.njMapWMSToc.prototype._olWMSLayerRefresh = function(cacheClear_) {
		var _self = this._this || this;

		var olLayer = _self.njMapLayer.getOlLayer();

		olLayer.getSource().getParams().LAYERS = _self.setZtreeLayerData();
		if ( cacheClear_ ) {
			olLayer.getSource().getParams().refTime = new Date().getMilliseconds();
		}
		olLayer.getSource().updateParams( olLayer.getSource().getParams() );

		if ( olLayer.getSource().getParams().LAYERS === "" ) {
			_self.njMapLayer.setTocVisible( false );
		} else {
			if ( !( _self.njMapLayer.getVisible() ) ) {
				_self.njMapLayer.setTocVisible( true );
			}
		}
	};


	/**
	 * TOC의 모든 레이어를 { Key : Value } 형태로 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWMSToc.prototype._getLayerDataObject = function(layer_, layerDataObj_) {
		var _self = this._this || this;

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
				_self._getLayerDataObject( child, layerDataObj_ );
			}
		} else {
			layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
		}

		return layerDataObj_;
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWMSToc.prototype.getSaveData = function() {
		var _self = this._this || this;

		var zTreeNodes = $.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];

		return _self._getSaveData( _$.extend( true, {}, zTreeNodes ) );
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWMSToc.prototype._getSaveData = function(layer_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children", "LayerName" ];

		for ( var key in layer_ ) {
			if ( layer_.hasOwnProperty( key ) ) {
				if ( _$.inArray( key, ignores ) === -1 ) {
					delete layer_[ key ];
				}
			}
		}

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._getSaveData( child );
			}
		}

		return layer_;
	};


	/**
	 * 로드할 TOC 목록 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	naji.toc.njMapWMSToc.prototype._setLoadData = function(layerDataObj_, loadData_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children" ];

		var data = layerDataObj_[ loadData_[ "LayerName" ] ];

		for ( var key in data ) {
			if ( data.hasOwnProperty( key ) ) {
				if ( $.inArray( key, ignores ) === -1 ) {
					loadData_[ key ] = data[ key ];
				}
			}
		}


		var children = loadData_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._setLoadData( layerDataObj_, child );
			}
		}

		return loadData_;
	};


	/**
	 * TOC Reload 버튼 생성.
	 * 
	 * @private
	 */
	naji.toc.njMapWMSToc.prototype._createReloadBtn = function() {
		var _self = this._this || this;

		var $btn = $( '<a/>', {
			click : function() {
				_self.reLoad();
			}
		} ).append( $( '<span/>', {
			'class' : 'glyphicon glyphicon-refresh',
			'title' : '새로고침'
		} ) );

		_$( "#" + _self.tocDivId ).parent().find( ".tocEventDIV.sub" ).prepend( $btn );
	};


	/**
	 * 현재 보여지고 있는 레이어 목록 가져오기.
	 * 
	 * uniq가 true면 중복된 레이어를 제거한다.
	 * 
	 * @return showLayerList {Array.<String>} 현재 보여지고 있는 레이어 목록.
	 */
	naji.toc.njMapWMSToc.prototype.getShowLayerNames = function(uniq_) {
		var _self = this._this || this;

		var showLayerList = _self.showLayerNames.split( ',' );

		if ( uniq_ ) {
			showLayerList = showLayerList.reduce( function(a, b) {
				if ( a.indexOf( b ) < 0 ) a.push( b );
				return a;
			}, [] );
		}

		return showLayerList;
	};


	/**
	 * TOC를 다시 로드한다.
	 * 
	 * ※설정된 {@link naji.service.njMapGetCapabilitiesWMS}를 기준으로 다시 로드한다.
	 */
	naji.toc.njMapWMSToc.prototype.reLoad = function() {
		var _self = this._this || this;

		$.fn.zTree.destroy( _self.tocDivId );
		_self._createWMSToc( true );

		_self.njMap.getMap().getView().dispatchEvent( {
			type : "change:resolution"
		} );
	};


	/**
	 * TOC를 삭제한다.
	 * 
	 * @override {naji.toc.njMapTocDefault.prototype.remove}
	 */
	naji.toc.njMapWMSToc.prototype.remove = function() {
		var _self = this._this || this;

		naji.toc.njMapTocDefault.prototype.remove.call( this );

		ol.Observable.unByKey( _self.key_changeResolution );
	};

} )();

( function() {
	"use strict";

	/**
	 * WMTS TOC 객체.
	 * 
	 * WMTS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWmtsToc = new naji.toc.njMapWMTSToc( {
	 *	njMap : new naji.njMap({...}),
	 *	njMapLayer : new naji.layer.njMapWMSLayer({...}),
	 *	capabilities : new naji.service.njMapGetCapabilitiesWMS({...}).data,
	 *	tocKey : 'wms_key',
	 *	tocTitle : 'WMS TOC Title',
	 *	tocListDivId : 'toc',
	 *	layerName : 'LAYER_NAME',
	 *	matrixSet : 'MATRIXSET'
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.njMapLayer {naji.layer.njMapWMTSLayer} {@link naji.layer.njMapWMTSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.matrixSet {String} matrixSet 이름.
	 * @param opt_options.layerName {String} 레이어 이름.
	 * @param opt_options.legendURL {String} 범례 URL.
	 * 
	 * @Extends {naji.toc.njMapTocDefault}
	 * 
	 * @class
	 */
	naji.toc.njMapWMTSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.matrixSet = null;
		this.layerName = null;
		this.legendURL = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.toc.njMapTocDefault.call( _self, options );

			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.legendURL = ( options.legendURL !== undefined ) ? options.legendURL : "";

			_self.createTocDiv( "WMTS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible
			} );

			_self._createWMTSToc();

		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.njMapLayer.setTocVisible( check );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.toc.njMapWMTSToc.prototype = Object.create( naji.toc.njMapTocDefault.prototype );
	naji.toc.njMapWMTSToc.prototype.constructor = naji.toc.njMapWMTSToc;


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	naji.toc.njMapWMTSToc.prototype._createWMTSToc = function() {
		var _self = this._this || this;

		var wmtsZtreeLayer;
		var originWMTSztreeLayer = _self._getWMTSNodeTozTree( _self._getWMTSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wmtsZtreeLayer = originWMTSztreeLayer;
		} else {
			wmtsZtreeLayer = originWMTSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmtsZtreeLayer );

		return wmtsZtreeLayer;
	};


	/**
	 * _getWMTSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wmtsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	naji.toc.njMapWMTSToc.prototype._getWMTSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "LayerName" ],
			name : node_[ "LayerName" ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			MatrixSet : node_[ "MatrixSet" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false,
			LegendURL : node_[ "LegendURL" ]
		};

		var root = {
			id : "ROOT",
			name : node_[ "LayerName" ],
			children : [ layer ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			isGroupLayer : true,
			LegendURL : null,
			Extent : null,
			chkDisabled : false,
			iconSkin : "pIconFeatureLayer"
		};

		return root;
	};


	/**
	 * 해당 WMTS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wmtsLayerData
	 */
	naji.toc.njMapWMTSToc.prototype._getWMTSLayerData = function() {
		var _self = this._this || this;

		var wmtsLayerData = {
			KEY : _self.tocKey,
			LayerName : _self.layerName,
			LayerTitle : _self.layerName,
			MatrixSet : _self.matrixSet,
			LegendURL : _self.legendURL
		};

		return wmtsLayerData;
	};

} )();

/**
 * @namespace naji.baseMap
 */

( function() {
	"use strict";

	/**
	 * njMapBaseMap 기본 객체.
	 * 
	 * 배경지도의 기본 객체로 배경지도의 코드값은 언더바(_) 기준으로 나눈다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.isWorld {Boolean} 세계 좌표 여부. Default is `true`.
	 * @param opt_options.isFactor {Boolean} 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부. Default is `true`.
	 * @param opt_options.baseCode {String} 베이스맵의 코드명 (언더바 기준). Default is `custom_code`.
	 * @param opt_options.mapTypes {Object} 베이스맵 타입 별 속성 정보.
	 * @param opt_options.projection {String} 베이스맵 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.maxExtent {Array.<Double>} 베이스맵 최대 영역. Default is `EPSG:3857 Extent`.
	 * @param opt_options.isAvailable {Boolean} 베이스맵 사용 가능 여부.
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapDefault = ( function(opt_options) {
		var _self = this;

		this.target = null;

		this.apiMap = null;
		this.isWorld = null;
		this.isFactor = null;
		this.baseCode = null;
		this.mapTypes = null;
		this.projection = null;
		this.maxExtent = null;
		this.isAvailable = null;
		this.resolutions = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.isWorld = ( options.isWorld !== undefined ) ? options.isWorld : true;
			_self.isFactor = ( options.isFactor !== undefined ) ? options.isFactor : true;
			_self.apiMap = ( options.apiMap !== undefined ) ? options.apiMap : undefined;
			_self.mapTypes = ( options.mapTypes !== undefined ) ? options.mapTypes : {};
			_self.projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";
			_self.baseCode = ( options.baseCode !== undefined ) ? options.baseCode : "custom_code";
			_self.resolutions = ( options.resolutions !== undefined ) ? options.resolutions : undefined;
			_self.maxExtent = ( options.maxExtent !== undefined ) ? options.maxExtent : ol.proj.get( "EPSG:3857" ).getExtent();

		} )();
		// END initialize


		return {
			isWorlds : _self.isWorlds,
			isFactors : _self.isFactors,
			getApiMap : _self.getApiMap,
			updateSize : _self.updateSize,
			setMapType : _self.setMapType,
			isAvailables : _self.isAvailables,
			syncMapZoom : _self.syncMapZoom,
			syncMapCenter : _self.syncMapCenter,
			syncMapRotation : _self.syncMapRotation,
			getUsableKeys : _self.getUsableKeys,
			createBaseMap : _self.createBaseMap,
			getTypeProperties : _self.getTypeProperties
		}

	} );


	/**
	 * 지도 API 맵을 생성한다.
	 * 
	 * @abstract
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.createBaseMap = function(target_, type_) {
	};


	/**
	 * 지도 줌 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:resolution>
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.syncMapZoom = function(evt_) {
	};


	/**
	 * 지도 화면 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:center>
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.syncMapCenter = function(evt_) {
	};


	/**
	 * 지도 회전 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:resolution|change:center>
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.syncMapRotation = function(evt_) {
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @abstract
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.setMapType = function(type_) {
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @abstract
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.updateSize = function() {
	};


	/**
	 * 타입에 해당하는 속성 정보 가져온다.
	 * 
	 * @abstract
	 * 
	 * @param type {String} 배경지도 타입.
	 * 
	 * @return {Object} 해당 타입 속성
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.getTypeProperties = function(type_) {
		var _self = this._this || this;

		var minZoom = _self.mapTypes[ type_ ][ "minZoom" ];
		var maxZoom = _self.mapTypes[ type_ ][ "maxZoom" ];

		return {
			minZoom : minZoom,
			maxZoom : maxZoom,
			baseCode : _self.baseCode,
			projection : _self.projection,
			maxExtent : _self.maxExtent,
			resolutions : _self.resolutions,
			id : _self.mapTypes[ type_ ][ "id" ]
		}
	};


	/**
	 * API 사용 가능 여부를 설정한다.
	 * 
	 * @param script {String} API 사용 테스트 스크립트.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.checkIsAvailable = function(script_) {
		var _self = this._this || this;

		try {
			new Function( script_.toString() )();
			_self.isAvailable = true;
		} catch ( e ) {
			_self.isAvailable = false;
		}
	};


	/**
	 * 사용 가능한 타입(키) 리스트를 가져온다.
	 * 
	 * @return {Array.<String>} 사용 가능한 타입(키) 리스트를.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.getUsableKeys = function() {
		var _self = this._this || this;

		var usableKeys = [];
		var types = _self.mapTypes;
		for ( var i in types ) {
			if ( i.indexOf( "custom_" ) > -1 ) {
				usableKeys.push( _self.baseCode );
			} else {
				usableKeys.push( _self.baseCode + "_" + i );
			}
		}

		return usableKeys;
	};


	/**
	 * 동기화 데이터.
	 * 
	 * @param evt {Function} ol3 change:resolution, change:center
	 * 
	 * @return {Object} 현재 View의 동기화 데이터.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.getSyncData = function(evt_) {
		var _self = this._this || this;

		var view = evt_.target;

		if ( view instanceof ol.Map ) {
			view = view.getView();
		}

		return {
			view : view,
			center : view.getCenter(),
			rotation : view.getRotation(),
			projection : view.getProjection(),
			resolution : view.getResolution(),
			zoom : Math.round( view.getZoom() )
		};
	};


	/**
	 * 베이스맵 사용 가능 여부.
	 * 
	 * @return {Boolean} 베이스맵 사용 가능 여부.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.isAvailables = function() {
		var _self = this._this || this;
		return _self.isAvailable;
	};


	/**
	 * 세계 좌표 여부.
	 * 
	 * @return {Boolean} 세계 좌표 여부.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.isWorlds = function() {
		var _self = this._this || this;
		return _self.isWorld;
	};


	/**
	 * 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부.
	 * 
	 * @return {Boolean} 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.isFactors = function() {
		var _self = this._this || this;
		return _self.isFactor;
	};


	/**
	 * 배경지도의 API 객체를 가져온다.
	 * 
	 * @return apiMap {Object} 배경지도의 API 객체.
	 */
	naji.baseMap.njMapBaseMapDefault.prototype.getApiMap = function() {
		var _self = this._this || this;
		return _self.apiMap;
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapsPlatform 배경지도 객체.
	 * 
	 * 다양하게 제공되는 지도 API나 WMTS 서비스를 배경지도로 사용할 수 있다.
	 * 
	 * njMapsPlatform에서 기본적으로 내장한 배경지도 API는 다음과 같으며, API KEY가 정상적인 경우에만 사용할 수 있다.
	 * 
	 * 1. Google(normal, terrain, satellite, hybrid) : 월 28,500건 무료.
	 * 
	 * 2. OpenStreetMap(normal, gray) : 무제한 무료.
	 * 
	 * 3. Stamen(toner, terrain) : 무제한 무료.
	 * 
	 * 4. vWorld(normal, gray, satellite, hybrid, midnight) : 무제한 무료.
	 * 
	 * 5. 바로E맵(normal, white, colorVision) : 무제한 무료.
	 * 
	 * 6. 네이버(normal, satellite, hybrid, terrain) : 무료.
	 * 
	 * 7. 다음(normal, satellite, hybrid) : 월 300,000건 무료.
	 * 
	 * 8. Bing(normal, aerial, hybrid, dark) : 1년 125,000건 무료.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapBaseMap = new naji.baseMap.njMapBaseMap( {
	 * 	target : 'base',
	 * 	njMap : new naji.njMap({...}),
	 * 	baseMapKey : 'google_normal'
	 * 	useElementMargin : false
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.target {String} 배경지도 DIV ID.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.baseMapKey {String} 배경지도 Key ( _로 구분 ). Default is `osm_normal`.
	 * @param opt_options.useElementMargin {Boolean} 배경지도 회전 시 공백 처리를 위한 element의 여백 사이즈 사용 유무 . Default is `true`.
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMap = ( function(opt_options) {
		var _self = this;

		this.target = null;
		this.njMap = null;
		this.useElementMargin = null;

		this.UUID = null;
		this.nowMapView = null;
		this.baseMapList = null;
		this.nowBaseMapKey = null;

		this.key_changeCenter = null;
		this.key_elementResize = null;
		this.key_changeRotation = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.UUID = naji.util.njMapUtil.generateUUID().split( "-" )[ 0 ];
			_self.target = ( options.target !== undefined ) ? options.target : undefined;
			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.nowBaseMapKey = ( options.baseMapKey !== undefined ) ? options.baseMapKey : "osm_normal";
			_self.useElementMargin = ( options.useElementMargin !== undefined ) ? options.useElementMargin : true;

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			_self.addBaseMapType( "osm", new naji.baseMap.njMapBaseMapOSM() );
			_self.addBaseMapType( "bing", new naji.baseMap.njMapBaseMapBing() );
			_self.addBaseMapType( "daum", new naji.baseMap.njMapBaseMapDaum() );
			_self.addBaseMapType( "naver", new naji.baseMap.njMapBaseMapNaver() );
			_self.addBaseMapType( "google", new naji.baseMap.njMapBaseMapGoogle() );
			_self.addBaseMapType( "vWorld", new naji.baseMap.njMapBaseMapVWorld() );
			_self.addBaseMapType( "stamen", new naji.baseMap.njMapBaseMapStamen() );
			_self.addBaseMapType( "baroEmap", new naji.baseMap.njMapBaseMapBaroEmap() );

			_self._callBaseMapType( _self.nowBaseMapKey );

			_self.setVisible( true );
		} )();
		// END initialize


		return {
			_this : _self,
			remove : _self.remove,
			setVisible : _self.setVisible,
			getVisible : _self.getVisible,
			getApiMap : _self.getApiMap,
			setOpacity : _self.setOpacity,
			getOpacity : _self.getOpacity,
			visibleToggle : _self.visibleToggle,
			changeBaseMap : _self.changeBaseMap,
			addBaseMapType : _self.addBaseMapType,
			getSelectedBaseMap : _self.getSelectedBaseMap,
			getUsableBaseMapList : _self.getUsableBaseMapList
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._callBaseMapType = function(baseMapKey_) {
		var _self = this._this || this;

		if ( !_self._isBaseMapUsable( baseMapKey_ ) ) {
			naji.njMapConfig.alert_Error( baseMapKey_ + " undefined" );
			return false;
		}

		$( "#" + _self.target ).prepend( $( "<div>", {
			'id' : _self.UUID,
			'style' : "width: 100%; height: 100%; position: relative; overflow: hidden"
		} ) );

		naji.util.njMapUtil.setCssTextStyle( $( "#" + _self.target )[ 0 ], "overflow", "hidden !important" );

		var code = baseMapKey_.split( "_" )[ 0 ];
		var type = baseMapKey_.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = baseMapKey_;
			type = baseMapKey_;
		}

		var baseMap = _self.baseMapList[ code ][ "object" ];
		var properties = baseMap.getTypeProperties( type );

		baseMap.createBaseMap( _self.UUID, type, function(state_) {
			naji.njMapConfig.loading( _self.njMap.getDataViewId(), state_ );
		} );

		var view = _self._createView( baseMap, type );

		_self._activeChangeResolution( baseMap );

		_self._transformLayerProjection( _self.njMap.getMap().getView().getProjection().getCode(), properties[ "projection" ] );

		_self.njMap.getMap().setView( view );

		_self._setElementMargin();

		_self.njMap.refresh();

		_$( "#" + _self.target ).resize( function() {
			if ( _self._updateSize ) {
				_self._setElementMargin();
				_self._updateSize();
			}
		} );

		_$( window ).resize( function() {
			if ( _self._updateSize ) {
				_self._setElementMargin();
				_self._updateSize();
			}
		} );
	};


	/**
	 * njMap <==> njMapBaseMap 동기화 설정 사용
	 * 
	 * @param baseMap {naji.baseMap} 배경지도 객체
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var view = _self.njMap.getMap().getView();

		_self.njMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeCenter );
			ol.Observable.unByKey( _self.key_changeRotation );
			ol.Observable.unByKey( _self.key_changeResolution );

			_self.key_changeCenter = evt1_.target.getView().on( "change:center", baseMap_.syncMapCenter );
			_self.key_changeRotation = evt1_.target.getView().on( "change:rotation", baseMap_.syncMapRotation );
			_self.key_changeResolution = evt1_.target.getView().on( "change:resolution", baseMap_.syncMapZoom );
		} );
	};


	/**
	 * 배경지도를 추가한다.
	 * 
	 * {@link naji.baseMap.njMapBaseMapDefault naji.baseMap.njMapBaseMapDefault}를 확장한 배경지도 객체 또는 사용자 정의 배경지도(WMTS)를 추가할 수 있다.
	 * 
	 * 사용자 정의 배경지도(WMTS)를 추가하기 위해서는 {@link naji.baseMap.njMapBaseMapCustom naji.baseMap.njMapBaseMapCustom}를 사용한다.
	 * 
	 * 기본 내장 배경지도 코드. ["osm", "daum", "naver", "vWorld", "baroEmap", "stamen", "google"]
	 * 
	 * @param code {String} 배경지도 코드.
	 * @param obj {Object} etc -> njMapBaseMapCustom.
	 */
	naji.baseMap.njMapBaseMap.prototype.addBaseMapType = function(code_, obj_) {
		var _self = this._this || this;

		_self.baseMapList = _self.baseMapList || {};

		if ( obj_ && obj_.isAvailables() ) {
			_self.baseMapList[ code_ ] = {
				code : code_,
				object : obj_
			}
		}
	};


	/**
	 * View 생성
	 * 
	 * @param baseMap {String} 배경지도
	 * @param type {String} 배경지도 타입
	 * 
	 * @return nowMapView {ol.View} 현재 Map의 View
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._createView = function(baseMap_, type_) {
		var _self = this._this || this;

		var properties = baseMap_.getTypeProperties( type_ );
		var oldView = _self.njMap.getMap().getView();

		var viewData = {
			projection : properties[ "projection" ],
			extent : properties[ "maxExtent" ],
			center : ol.proj.transform( oldView.getCenter(), oldView.getProjection(), properties[ "projection" ] ),
			zoom : oldView.getZoom(),
			rotation : oldView.getRotation(),
			zoomFactor : 2,
			minZoom : properties[ "minZoom" ],
			maxZoom : properties[ "maxZoom" ]
		};

		if ( type_.indexOf( "custom" ) > -1 ) {
			// delete viewData.minZoom;
			// delete viewData.maxZoom;
		}

		if ( properties[ "resolutions" ] ) {
			viewData.resolutions = properties[ "resolutions" ]
		}

		_self.nowMapView = new ol.View( viewData );

		return _self.nowMapView;
	};


	/**
	 * 피처 좌표계 변경
	 * 
	 * View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 레이어 정보 변경
	 * 
	 * @param source {String} 원본 좌표계
	 * @param destination {String} 변경 좌표계
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._transformLayerProjection = function(source_, destination_) {
		var _self = this._this || this;

		var layers = _self.njMap.getMap().getLayers().getArray();
		for ( var idx_layer in layers ) {

			if ( layers[ idx_layer ] instanceof ol.layer.Group ) {
				var orderGroupLayers = layers[ idx_layer ].getLayersArray();
				for ( var i in orderGroupLayers ) {
					transform( orderGroupLayers[ i ], source_, destination_ );
				}

			} else {
				transform( layers[ idx_layer ], source_, destination_ );
			}

		}


		function transform(layer_, source_, destination_) {
			var source = layer_.getSource();
			if ( source instanceof ol.source.TileWMS || source instanceof ol.source.ImageWMS ) {
				if ( destination_ === "EPSG:4326" ) {
					// source.getParams().CRS = "EPSG:4326";
					source.getParams().VERSION = "1.1.0";
					source.updateParams( source.getParams() );
				}
			} else if ( source instanceof ol.source.Vector ) {
				/**
				 * ★ - To do : 피처 좌표변경 추가 작업 필요.
				 */

				if ( source instanceof ol.source.Cluster ) return false;

				var features = source.getFeatures();
				for ( var idx_feature in features ) {
					features[ idx_feature ].getGeometry().transform( source_, destination_ );
				}
			}
		}
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._updateSize = function() {
		var _self = this._this || this;

		var code = _self.nowBaseMapKey.split( "_" )[ 0 ];
		var type = _self.nowBaseMapKey.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = _self.nowBaseMapKey;
			type = _self.nowBaseMapKey;
		}

		var baseMap = _self.baseMapList[ code ][ "object" ];

		baseMap.updateSize();
	};


	/**
	 * 해당 배경지도가 사용 가능한지 확인한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._isBaseMapUsable = function(baseMapKey_) {
		var _self = this._this || this;

		var usable = true;
		var code = baseMapKey_.split( "_" )[ 0 ];
		var type = baseMapKey_.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = baseMapKey_;
			type = baseMapKey_;
		}

		if ( _self.baseMapList[ code ] ) {
			var baseMap = _self.baseMapList[ code ][ "object" ];
			var usableKeys = baseMap.getUsableKeys();
			if ( !( usableKeys.indexOf( baseMapKey_ ) !== -1 ) ) {
				usable = false;
			}

		} else {
			usable = false;
		}

		return usable;
	};


	/**
	 * 배경지도를 변경한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 */
	naji.baseMap.njMapBaseMap.prototype.changeBaseMap = function(baseMapKey_) {
		var _self = this._this || this;

		if ( baseMapKey_ === _self.nowBaseMapKey ) {
			return false;
		}

		if ( !_self._isBaseMapUsable( baseMapKey_ ) ) {
			naji.njMapConfig.alert_Error( baseMapKey_ + " undefined" );
			return false;
		}

		var beforeBMCode = _self.nowBaseMapKey.split( "_" )[ 0 ];
		var beforeBMType = _self.nowBaseMapKey.split( "_" )[ 1 ];
		var afterBMCode = baseMapKey_.split( "_" )[ 0 ];
		var afterBMType = baseMapKey_.split( "_" )[ 1 ];

		if ( beforeBMCode.indexOf( "custom" ) > -1 ) {
			beforeBMCode = _self.nowBaseMapKey;
			beforeBMType = _self.nowBaseMapKey;
		}
		if ( afterBMCode.indexOf( "custom" ) > -1 ) {
			afterBMCode = baseMapKey_;
			afterBMType = baseMapKey_;
		}

		var beforeBaseMap = _self.baseMapList[ beforeBMCode ][ "object" ];
		var afterBaseMap = _self.baseMapList[ afterBMCode ][ "object" ];

		var beforeProperties = beforeBaseMap.getTypeProperties( beforeBMType );
		var afterProperties = afterBaseMap.getTypeProperties( afterBMType );


		// 배경지도 코드가 같으면서 타입이 다를 때
		if ( ( beforeBMCode === afterBMCode ) && ( beforeBMType !== afterBMType ) ) {
			afterBaseMap.setMapType( afterBMType, function(state_) {
				naji.njMapConfig.loading( _self.njMap.getDataViewId(), state_ );
			} );
			var view = _self.nowMapView;

			view.setMinZoom( afterProperties.minZoom );
			view.setMaxZoom( afterProperties.maxZoom );
		} else {
			// 배경지도 코드가 다를 때
			var viewExtent = _self.nowMapView.calculateExtent( _self.njMap.getMap().getSize() );
			var beforeProjection = beforeProperties[ "projection" ];
			var afterProjection = afterProperties[ "projection" ];
			var beforeZoomCount = beforeProperties[ "zoomCount" ];
			var afterZoomCount = afterProperties[ "zoomCount" ];

			document.getElementById( _self.UUID ).innerHTML = "";
			document.getElementById( _self.UUID ).style.background = "";

			afterBaseMap.createBaseMap( _self.UUID, afterBMType, function(state_) {
				naji.njMapConfig.loading( _self.njMap.getDataViewId(), state_ );
			} );

			var view = _self._createView( afterBaseMap, afterBMType );

			_self._activeChangeResolution( afterBaseMap );

			if ( !( ol.proj.equivalent( ol.proj.get( beforeProjection ), ol.proj.get( afterProjection ) ) ) ) {
				_self._transformLayerProjection( beforeProjection, afterProjection );
			}

			_self.njMap.getMap().setView( view );

			if ( beforeBaseMap.isWorlds() ) {

				if ( !afterBaseMap.isWorlds() ) {
					// 세계 좌표계에서 변경될 때
					var afterExtent = afterProperties.maxExtent;
					afterExtent = ol.proj.transformExtent( afterExtent, afterProjection, "EPSG:3857" );
					viewExtent = ol.proj.transformExtent( viewExtent, beforeProjection, "EPSG:3857" );

					// 현재 영역이 변경되는 배경지도의 좌표계에 포함될 때
					if ( ol.extent.containsExtent( afterExtent, viewExtent ) ) {
						view.fit( ol.proj.transformExtent( viewExtent, "EPSG:3857", afterProjection ) );
						if ( afterBaseMap.isFactors() ) {
							view.setZoom( view.getZoom() + 1 );
						}
					} else {
						// 포함되지 않으면 변경되는 배경지도의 FullExtent로 설정
						view.fit( afterProperties.maxExtent );
					}
				}

			} else {
				view.fit( ol.proj.transformExtent( viewExtent, beforeProjection, afterProjection ) );

				if ( afterBaseMap.isFactors() ) {
					view.setZoom( view.getZoom() + 1 );
				}
			}

		}

		_self.setVisible( true );

		_self.njMap.refresh();

		_self.nowBaseMapKey = baseMapKey_;

		console.log( "####### changeBaseMap #######" );
		console.log( "baseMapType : " + _self.nowBaseMapKey );
	};


	/**
	 * 사용 가능한 배경지도 타입(키) 목록을 가져온다.
	 * 
	 * @return {Array.<String>} 배경지도 키 목록.
	 */
	naji.baseMap.njMapBaseMap.prototype.getUsableBaseMapList = function() {
		var _self = this._this || this;

		var usableBaseMapList = [];

		for ( var i in _self.baseMapList ) {
			usableBaseMapList = usableBaseMapList.concat( _self.baseMapList[ i ][ "object" ].getUsableKeys() );
		}

		return usableBaseMapList;
	};


	/**
	 * 배경지도를 삭제한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 * 
	 * @return {Array.<String>} 배경지도 키 목록.
	 */
	naji.baseMap.njMapBaseMap.prototype.remove = function(baseMapKey_) {
		var _self = this._this || this;

		var code = baseMapKey_.split( "_" )[ 0 ];

		// 사용자 정의 배경지도만 삭제
		if ( code.indexOf( "custom" ) > -1 ) {
			// 활성화된 배경지도 삭제 시
			if ( _self.nowBaseMapKey === baseMapKey_ ) {
				for ( var base in _self.baseMapList ) {
					if ( _self.baseMapList.hasOwnProperty( base ) ) {
						var tempBaseMap = _self.baseMapList[ base ][ "object" ].getUsableKeys()[ 0 ];
						_self.changeBaseMap( tempBaseMap );
						break;
					}
				}
			}

			delete _self.baseMapList[ baseMapKey_ ];
		}

		return _self.getUsableBaseMapList();
	};


	/**
	 * 현재 선택된 배경지도의 키를 가져온다.
	 * 
	 * @return nowBaseMapKey {String} 현재 선택된 배경지도 키.
	 */
	naji.baseMap.njMapBaseMap.prototype.getSelectedBaseMap = function() {
		var _self = this._this || this;
		return _self.nowBaseMapKey;
	};


	/**
	 * 배경지도의 불투명도를 가져온다.
	 * 
	 * @return opacity {Double} 배경지도 불투명도 값.
	 */
	naji.baseMap.njMapBaseMap.prototype.getOpacity = function(opacity_) {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );

		return element.style.opacity;
	};


	/**
	 * 배경지도의 불투명도를 설정할 수 있다.
	 * 
	 * 0.0 ~ 1.0 사이의 숫자. 0.0 = 투명, 1.0 = 불투명
	 * 
	 * @param opacity {Double} 배경지도 불투명도 값.
	 */
	naji.baseMap.njMapBaseMap.prototype.setOpacity = function(opacity_) {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );

		if ( typeof opacity_ === 'number' ) {
			element.style.opacity = opacity_;
		}
	};


	/**
	 * 배경지도의 ON/OFF 상태를 가져온다.
	 * 
	 * @return visible {Boolean} 배경지도 ON/OFF 상태.
	 */
	naji.baseMap.njMapBaseMap.prototype.getVisible = function() {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );

		return ( element.style.visibility === 'visible' ) ? true : false;
	};


	/**
	 * 배경지도를 끄거나 켤 수 있다.
	 * 
	 * @param visible {Boolean} 배경지도 ON/OFF 상태.
	 */
	naji.baseMap.njMapBaseMap.prototype.setVisible = function(visible_) {
		var _self = this._this || this;

		var visibility = 'visible';
		var element = document.getElementById( _self.UUID );

		if ( typeof visible_ === 'boolean' ) {
			if ( !visible_ ) {
				visibility = 'hidden';
			}
		}

		element.style.visibility = visibility;
	};


	/**
	 * 배경지도의 ON/OFF 상태를 토글한다.
	 */
	naji.baseMap.njMapBaseMap.prototype.visibleToggle = function() {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );
		var visibility = element.style.visibility;

		if ( visibility === 'visible' ) {
			_self.setVisible( false );
		} else {
			_self.setVisible( true );
		}
	};


	/**
	 * 현재 배경지도의 API 객체를 가져온다.
	 * 
	 * @return apiMap {Object} 현재 배경지도의 API 객체.
	 */
	naji.baseMap.njMapBaseMap.prototype.getApiMap = function() {
		var _self = this._this || this;
		return _self.baseMapList[ _self.nowBaseMapKey.split( "_" )[ 0 ] ][ "object" ].getApiMap();
	};


	/**
	 * 배경지도 회전 시 공백 처리를 위한 element의 여백 사이즈를 설정한다.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMap.prototype._setElementMargin = ( function() {
		var _self = this._this || this;

		if ( !_self.useElementMargin ) return false;

		var $target = $( "#" + _self.target );
		var $base = $( "#" + _self.UUID );

		var originWidth = $target.width();
		var originHeight = $target.height();
		var diagonalLength = Math.round( Math.sqrt( Math.pow( $target.width(), 2 ) + Math.pow( $target.height(), 2 ) ) );
		var interval_width = Math.round( diagonalLength - originWidth );
		var interval_height = Math.round( diagonalLength - originHeight );
		if ( interval_width % 2 === 1 ) ++interval_width;
		if ( interval_height % 2 === 1 ) ++interval_height;

		$base.css( "width", 'calc(100% + ' + interval_width + 'px)' );
		$base.css( "height", 'calc(100% + ' + interval_height + 'px)' );
		$base.css( "left", -( interval_width / 2 ) );
		$base.css( "top", -( interval_height / 2 ) );
	} );

} )();

( function() {
	"use strict";

	/**
	 * 바로E맵 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapBaroEmap = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.resolutions = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.resolutions = [ 1954.597389, 977.2986945, 488.64934725, 244.324673625, 122.1623368125, 61.08116840625, 30.540584203125, 15.2702921015625,
					7.63514605078125, 3.817573025390625, 1.9087865126953125, 0.9543932563476563, 0.47719662817382813, 0.23859831408691406, 0.119299157043457, 0.0596495785217285,
					0.0298247892608643, 0.0149123946304321, 0.0074561973152161, 0.003728098657608, 0.001864049328804, 0.000932024664402, 0.000466012332201, 0.0002330061661005, 0.0001165030830503
			];

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "baroEmap";
			options.projection = "EPSG:5179";
			options.maxExtent = ol.proj.get( "EPSG:5179" ).getExtent();
			options.mapTypes = {
				normal : {
					id : 0,
					minZoom : 0,
					maxZoom : 13
				},
				white : {
					id : 4,
					minZoom : 0,
					maxZoom : 13
				},
				colorVision : {
					id : 1,
					minZoom : 0,
					maxZoom : 13
				}
			};

			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "ngii.version" );

			if ( !_self.isAvailables() ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var baroEmapCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var baroEmapLevel = syncData[ "zoom" ];
			_self.apiMap.setCenter( baroEmapCenter, baroEmapLevel, false, false );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var baroEmapCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var baroEmapLevel = syncData[ "zoom" ];
			_self.apiMap.setCenter( baroEmapCenter, baroEmapLevel, false, false );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapBaroEmap.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapBaroEmap.prototype.constructor = naji.baseMap.njMapBaseMapBaroEmap;


	/**
	 * 바로E맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 * @param loadEvents {Function} tile load events 함수.
	 */
	naji.baseMap.njMapBaseMapBaroEmap.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;
		_self.apiMap = new ngii.map( target_ );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입 설정
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 * @param loadEvents {Function} tile load events 함수.
	 */
	naji.baseMap.njMapBaseMapBaroEmap.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap._setMapMode( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapBaroEmap.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapBaroEmap.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layer = _self.apiMap._getMap().baseLayer;
		layer.events.register( "loadstart", layer, function() {
			loadEvents_.call( this, true );
		} );
		layer.events.register( "loadend", layer, function() {
			loadEvents_.call( this, false );
		} );
		layer.events.register( "tileloadstart", layer, function() {
			loadEvents_.call( this, true );
		} );
		layer.events.register( "tileloaded", layer, function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * Bing 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapBing = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "bing";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'RoadOnDemand'
							} )
						} )
					},
					minZoom : 0,
					maxZoom : 19
				},
				aerial : {
					id : "aerial",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'Aerial'
							} )
						} )
					},
					minZoom : 1,
					maxZoom : 19
				},
				hybrid : {
					id : "hybrid",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'AerialWithLabelsOnDemand'
							} )
						} )
					},
					minZoom : 1,
					maxZoom : 19
				},
				dark : {
					id : "dark",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'CanvasDark'
							} )
						} )
					},
					minZoom : 1,
					maxZoom : 19
				}
			};

			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "new ol.layer.Tile" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapBing.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapBing.prototype.constructor = naji.baseMap.njMapBaseMapBing;


	/**
	 * Bing 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 * @param loadEvents {Function} tile load events 함수.
	 */
	naji.baseMap.njMapBaseMapBing.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입
	 * @param loadEvents {Function} tile load events 함수.
	 */
	naji.baseMap.njMapBaseMapBing.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapBing.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapBing.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapBing.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();
		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * 사용자 정의 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var custom = new naji.baseMap.njMapBaseMapCustom( {
	 * 	baseMapKey : 'custom_code1',
	 * 	layer : new naji.layer.njMapWMTSLayer({...}),
	 * 	capabilities : new naji.service.njMapGetCapabilitiesWMTS({...}).data,
	 * 	isWorld : true,
	 * 	isFactor : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.baseMapKey {String} 베이스맵 코드명 (custom_XXX).
	 * @param opt_options.layer {naji.layer.njMapWMTSLayer} {@link naji.layer.njMapWMTSLayer} 객체.
	 * @param opt_options.capabilities {naji.service.njMapGetCapabilitiesWMTS} {@link naji.service.njMapGetCapabilitiesWMTS} WMTS capabilities
	 *            객체.
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapCustom = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.resolutions = null;
		this.capabilities = null;
		this.layer = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;
			_self.layer = ( options.layer !== undefined ) ? options.layer : undefined;

			if ( !_self.capabilities ) {
				naji.njMapConfig.alert_Error( "capabilities undefined" );
				_self.isAvailable = false;
				return false;
			}

			if ( !_self.layer ) {
				naji.njMapConfig.alert_Error( "layer undefined" );
				_self.isAvailable = false;
				return false;
			}

			options.isWorld = ( options.isWorld !== undefined ) ? options.isWorld : true;
			options.isFactor = ( options.isFactor !== undefined ) ? options.isFactor : true;
			options.baseCode = ( options.baseMapKey !== undefined ) ? options.baseMapKey : "custom_code";
			options.projection = _self.capabilities.serviceMetaData.crs;

			if ( options.projection.indexOf( "urn:ogc:def:crs:EPSG:" ) > -1 ) {
				options.projection = options.projection.replace( "urn:ogc:def:crs:EPSG:", "EPSG" );
			}

			var layers = _self.capabilities.olJson.Contents.Layer;
			for ( var i in layers ) {
				if ( layers[ i ][ "Identifier" ] === _self.layer.layer ) {
					options.maxExtent = ol.proj.transformExtent( layers[ i ][ "WGS84BoundingBox" ], "EPSG:4326", options.projection );
					break;
				}
			}

			var tilems = _self.capabilities.olJson.Contents.TileMatrixSet;

			for ( var i in tilems ) {
				if ( tilems[ i ][ "Identifier" ] === _self.layer.matrixSet ) {
					_self.resolutions = [];
					var tileMatrixs = tilems[ i ][ "TileMatrix" ];
					for ( var j in tileMatrixs ) {
						_self.resolutions.push( tileMatrixs[ j ][ "ScaleDenominator" ] * 0.000264583 );
					}

					options.mapTypes = {};
					options.mapTypes[ options.baseCode ] = {
						id : options.baseCode,
						minZoom : 0,
						resolutions : _self.resolutions,
						maxZoom : tilems[ i ][ "TileMatrix" ].length - 1
					};
					break;
				}
			}

			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], _self.projection );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapCustom.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapCustom.prototype.constructor = naji.baseMap.njMapBaseMapCustom;


	/**
	 * Customize Map 맵을 생성한다.
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapCustom.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			projection : _self.projection,
			view : new ol.View( {
				zoom : 2,
				center : [ 0, 0 ],
				projection : _self.projection,
				minZoom : _self.mapTypes[ type_ ][ "minZoom" ],
				maxZoom : _self.mapTypes[ type_ ][ "maxZoom" ],
				resolutions : _self.mapTypes[ type_ ][ "resolutions" ]
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapCustom.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		_self.layer.setWmtsCapabilities( _self.capabilities );
		_self.layer.update( true );
		_self.apiMap.addLayer( _self.layer.getOlLayer() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapCustom.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapCustom.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * 다음 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapDaum = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "daum";
			options.projection = "EPSG:5181";
			options.maxExtent = ol.proj.get( "EPSG:5181" ).getExtent();
			options.mapTypes = {
				normal : {
					id : 1, // daum.maps.MapTypeId[ "NORMAL" ]
					minZoom : 1,
					maxZoom : 14
				},
				satellite : {
					id : 2, // daum.maps.MapTypeId[ "SKYVIEW" ]
					minZoom : 1,
					maxZoom : 15
				},
				hybrid : {
					id : 3, // daum.maps.MapTypeId[ "HYBRID" ]
					minZoom : 1,
					maxZoom : 15
				}
			};
			
			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "daum.maps.MapTypeId" );

			if ( !_self.isAvailable ) {
				return false;
			}
			
		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var daumLevel = ( 15 - syncData[ "zoom" ] );
			_self.apiMap.setLevel( daumLevel );
			_self.apiMap.relayout();
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var daumCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( new daum.maps.LatLng( daumCenter[ 1 ], daumCenter[ 0 ] ) );
			_self.apiMap.relayout();
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapDaum.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapDaum.prototype.constructor = naji.baseMap.njMapBaseMapDaum;


	/**
	 * 다음 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapDaum.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var mapContainer = document.getElementById( target_ );
		var daumMapOptions = {
			center : new daum.maps.LatLng( 33.450701, 126.570667 ),
			level : 3
		};

		_self.apiMap = new daum.maps.Map( mapContainer, daumMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapDaum.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapDaum.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.relayout();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapDaum.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 다음 지도 API events tilesloadstart 미지원
		kakao.maps.event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		kakao.maps.event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();

( function() {
	"use strict";

	/**
	 * 구글 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapGoogle = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "google";
			options.projection = "EPSG:900913";
			options.maxExtent = ol.proj.get( "EPSG:900913" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "roadmap", // google.maps.MapTypeId.ROADMAP
					minZoom : 0,
					maxZoom : 21
				},
				satellite : {
					id : "satellite", // google.maps.MapTypeId.SATELLITE
					minZoom : 0,
					maxZoom : 19
				},
				hybrid : {
					id : "hybrid", // google.maps.MapTypeId.HYBRID
					minZoom : 0,
					maxZoom : 19
				},
				terrain : {
					id : "terrain", // google.maps.MapTypeId.TERRAIN
					minZoom : 0,
					maxZoom : 19
				}
			};
			
			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "google.maps.MapTypeId" );

			if ( !_self.isAvailables() ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var googleLevel = syncData[ "zoom" ];
			_self.apiMap.setZoom( googleLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var googleCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( {
				lat : googleCenter[ 1 ],
				lng : googleCenter[ 0 ]
			} );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapGoogle.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapGoogle.prototype.constructor = naji.baseMap.njMapBaseMapGoogle;


	/**
	 * 구글 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapGoogle.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var googleMapOptions = {
			zoom : 4,
			center : {
				lat : -33,
				lng : 151
			},
			disableDefaultUI : true
		};

		_self.apiMap = new google.maps.Map( document.getElementById( target_ ), googleMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapGoogle.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapGoogle.prototype.updateSize = function() {
		var _self = this._this || this;
		google.maps.event.trigger( _self.apiMap, "resize" );
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapGoogle.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 구글 지도 API events tilesloadstart 미지원
		google.maps.event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		google.maps.event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();

( function() {
	"use strict";

	/**
	 * 네이버 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapNaver = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.baseCode = "naver";
			options.projection = "EPSG:3857";
			options.maxExtent = [ 13833615.936057687, 3779460.9620584883, 14690783.774134403, 4666706.57663997 ];
			options.mapTypes = {
				normal : {
					id : "normal", // naver.maps.MapTypeId[ "NORMAL" ]
					minZoom : 6,
					maxZoom : 21
				},
				satellite : {
					id : "satellite", // naver.maps.MapTypeId[ "SATELLITE" ]
					minZoom : 6,
					maxZoom : 21
				},
				hybrid : {
					id : "hybrid", // naver.maps.MapTypeId[ "HYBRID" ]
					minZoom : 6,
					maxZoom : 21
				},
				terrain : {
					id : "terrain", // naver.maps.MapTypeId[ "TERRAIN" ]
					minZoom : 6,
					maxZoom : 21
				}
			};

			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "naver.maps.MapTypeId" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		//*/ 
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var naverLevel = syncData[ "zoom" ];
			_self.apiMap.setZoom( naverLevel, false );
		}
		/*/ bound 이동
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var view = syncData[ "view" ];

			var naverExtent = ol.proj.transformExtent( view.calculateExtent(), syncData[ "projection" ], "EPSG:4326" );

			var bound = new naver.maps.LatLngBounds(
                new naver.maps.LatLng(naverExtent[1], naverExtent[0]),
                new naver.maps.LatLng(naverExtent[3], naverExtent[2]));
			_self.apiMap.fitBounds( bound );
		}
		/*/

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		//*/
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var naverCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( new naver.maps.LatLng( naverCenter[ 1 ], naverCenter[ 0 ] ) );
		}
		/*/ bound 이동
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var view = syncData[ "view" ];

			var naverExtent = ol.proj.transformExtent( view.calculateExtent(), syncData[ "projection" ], "EPSG:4326" );

			var bound = new naver.maps.LatLngBounds(
                new naver.maps.LatLng(naverExtent[1], naverExtent[0]),
                new naver.maps.LatLng(naverExtent[3], naverExtent[2]));
			_self.apiMap.fitBounds( bound );
		}
		/*/
		
		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapNaver.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapNaver.prototype.constructor = naji.baseMap.njMapBaseMapNaver;


	/**
	 * 네이버 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapNaver.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var naverMapOptions = {
			center : new naver.maps.LatLng( 37.3595704, 127.105399 ),
			level : 3
		};

		_self.apiMap = new naver.maps.Map( target_, naverMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapNaver.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapNaver.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.trigger( "resize" );
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapNaver.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 네이버 지도 API events tilesloadstart 미지원
		naver.maps.Event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		naver.maps.Event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();

( function() {
	"use strict";

	/**
	 * OpenStreet 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapOSM = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			var grayURL = "http://{a-c}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png";

			if ( naji.njMapConfig.isMapProxy() ) {
				grayURL = naji.njMapConfig.getProxy() + grayURL;
			}
			
			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "osm";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.OSM()
						} )
					},
					minZoom : 0,
					maxZoom : 21
				},
				gray : {
					id : "gray",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : grayURL,
								attributions : [ ol.source.OSM.ATTRIBUTION ]
							} )
						} )
					},
					minZoom : 0,
					maxZoom : 18
				},
				none : {
					id : "none",
					layer : function() {
						return new ol.layer.Tile()
					},
					minZoom : 0,
					maxZoom : 21
				}
			};
			
			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "new ol.layer.Tile" );

			if ( !_self.isAvailable ) {
				return false;
			}
			
		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapOSM.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapOSM.prototype.constructor = naji.baseMap.njMapBaseMapOSM;


	/**
	 * OpenStreetMap 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapOSM.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [ new ol.control.Attribution( {
				collapsible : false
			} ) ],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입
	 */
	naji.baseMap.njMapBaseMapOSM.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapOSM.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapOSM.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapOSM.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * Stamen 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapStamen = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "stamen";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				toner : {
					id : "toner",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.Stamen( {
								layer : "toner"
							} )
						} );
					},
					minZoom : 0,
					maxZoom : 20
				},
				terrain : {
					id : "terrain",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.Stamen( {
								layer : "terrain"
							} )
						} );
					},
					minZoom : 0,
					maxZoom : 18
				}
			};
			
			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "ol.source.Stamen" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapStamen.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapStamen.prototype.constructor = naji.baseMap.njMapBaseMapStamen;


	/**
	 * Stamen 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapStamen.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [ new ol.control.Attribution( {
				collapsible : false
			} ) ],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapStamen.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "toner";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapStamen.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapStamen.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapStamen.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * TMS_vWorld 배경지도 객체.
	 * 
	 * vWorld 배경지도를 특정 좌표계로 설정하여 TMS 배경지도로 사용할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.baseCode {String} 베이스맵의 코드명 (언더바 기준). Default is `TMS`.
	 * @param opt_options.projection {String} 베이스맵 좌표계. Default is `EPSG:3857`.
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapTMS_vWorld = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.projection = options.projection;
			options.baseCode = ( options.baseCode !== undefined ) ? options.baseCode : "TMS";
			options.maxExtent = ol.proj.get( options.projection ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						var base = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Base/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ base ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				satellite : {
					id : "SATELLITE",
					layer : function() {
						var satellite = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Satellite/service/{z}/{x}/{y}.jpeg'
							} )
						} );
						return [ satellite ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				hybrid : {
					id : "VHYBRID",
					layer : function() {
						var satellite = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Satellite/service/{z}/{x}/{y}.jpeg'
							} )
						} );
						var hybrid = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Hybrid/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ satellite, hybrid ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				gray : {
					id : "VGRAY",
					layer : function() {
						var gray = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/gray/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ gray ];
					},
					minZoom : 0,
					maxZoom : 20 // 12
				},
				midnight : {
					id : "VMIDNIGHT",
					layer : function() {
						var midnight = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/midnight/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ midnight ];
					},
					minZoom : 0,
					maxZoom : 20 // 12
				}
			};

			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			var projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";

			_self.checkIsAvailable( "" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			// var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], _self.projection );
			var osmCenter = syncData[ "center" ];
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapTMS_vWorld.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapTMS_vWorld.prototype.constructor = naji.baseMap.njMapBaseMapTMS_vWorld;


	/**
	 * vWorld 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapTMS_vWorld.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				projection : _self.projection,
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapTMS_vWorld.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers().getArray() );

		var layers = _self.mapTypes[ type ][ "layer" ]();
		for ( var i in layers ) {
			_self.apiMap.addLayer( layers[ i ] );
		}

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapTMS_vWorld.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapTMS_vWorld.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		for ( var i = layers_.length - 1; i >= 0; i-- ) {
			_self.apiMap.removeLayer( layers_[ i ] );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapTMS_vWorld.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layers = _self.apiMap.getLayers().getArray();

		for ( var i in layers ) {
			var source = layers[ i ].getSource();
			source.on( [ "tileloadstart" ], function() {
				loadEvents_.call( this, true );
			} );
			source.on( [ "tileloadend" ], function() {
				loadEvents_.call( this, false );
			} );
			source.on( [ "tileloaderror" ], function() {
				loadEvents_.call( this, false );
			} );
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * vWorld 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {naji.baseMap.njMapBaseMapDefault}
	 * 
	 * @class
	 */
	naji.baseMap.njMapBaseMapVWorld = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.baseCode = "vWorld";
			options.projection = "EPSG:900913";
			options.maxExtent = [ 12873319.534819111, 3857406.4178978344, 15494719.534819111, 5166406.417897834 ];
			options.mapTypes = {
				normal : {
					id : "VBASE",
					layer : function() {
						return [ new vworld.Layers.Base( "VBASE" ) ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				satellite : {
					id : "SATELLITE",
					layer : function() {
						var vSat = new vworld.Layers.Satellite( "VSAT" );
						vSat.max_level = 19;
						return [ vSat ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				hybrid : {
					id : "VHYBRID",
					layer : function() {
						var vSat = new vworld.Layers.Satellite( "VSAT" );
						var vHybrid = new vworld.Layers.Hybrid( "VHYBRID" );
						vSat.max_level = 19;
						vHybrid.max_level = 19;
						return [ vSat, vHybrid ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				gray : {
					id : "VGRAY",
					layer : function() {
						return [ new vworld.Layers.Gray( "VGRAY" ) ];
					},
					minZoom : 6,
					maxZoom : 18
				},
				midnight : {
					id : "VMIDNIGHT",
					layer : function() {
						return [ new vworld.Layers.Midnight( "VMIDNIGHT" ) ];
					},
					minZoom : 6,
					maxZoom : 18
				}
			};

			_super = naji.baseMap.njMapBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "vworld.Layers.Base" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );

			var vWorldCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:900913" );
			vWorldCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var vWorldLevel = syncData[ "zoom" ];

			_self.apiMap.setCenter( vWorldCenter, vWorldLevel, false, false );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );

			var vWorldCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:900913" );
			vWorldCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var vWorldLevel = syncData[ "zoom" ];

			_self.apiMap.setCenter( vWorldCenter, vWorldLevel, false, false );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	naji.baseMap.njMapBaseMapVWorld.prototype = Object.create( naji.baseMap.njMapBaseMapDefault.prototype );
	naji.baseMap.njMapBaseMapVWorld.prototype.constructor = naji.baseMap.njMapBaseMapVWorld;


	/**
	 * vWorld 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapVWorld.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var options = {
			units : "m",
			controls : [],
			numZoomLevels : 21,
			projection : new OpenLayers.Projection( "EPSG:900913" ),
			displayProjection : new OpenLayers.Projection( "EPSG:900913" )
		};

		_self.apiMap = new OpenLayers.Map( target_, options );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	naji.baseMap.njMapBaseMapVWorld.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.layers );

		var layers = _self.mapTypes[ type ][ "layer" ]();
		for ( var i in layers ) {
			_self.apiMap.addLayer( layers[ i ] );
		}

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	naji.baseMap.njMapBaseMapVWorld.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapVWorld.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.layers.length > 0 ) {
			_self._removeAllLayer( _self.apiMap.layers );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	naji.baseMap.njMapBaseMapVWorld.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layers = _self.apiMap.layers;

		for ( var i in layers ) {
			layers[ i ].events.register( "loadstart", layers[ i ], function() {
				loadEvents_.call( this, true );
			} );
			layers[ i ].events.register( "loadend", layers[ i ], function() {
				loadEvents_.call( this, false );
			} );
			layers[ i ].events.register( "tileloadstart", layers[ i ], function() {
				loadEvents_.call( this, true );
			} );
			layers[ i ].events.register( "tileloaded", layers[ i ], function() {
				loadEvents_.call( this, false );
			} );
		}
	};

} )();

/**
 * @namespace naji.animation
 */

( function() {
	"use strict";

	/**
	 * featureAnimation 기본 객체.
	 * 
	 * 피처 애니메이션의 기본 객체. 공통으로 반복 횟수, 투명도 효과, 지연 시간을 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @class
	 */
	naji.animation.featureAnimationDefault = ( function(opt_options) {
		var _self = this;

		this.easing = null;
		this.repeat = null;
		this.useFade = null;
		this.duration = null;

		this.style = null;
		this.isStop = null;
		this.strokeStyle = null;
		this.animationType = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.animationType = ( typeof ( options.animationType ) === "string" ) ? options.animationType : "zoomIn";

			_self.setEasing( options.easing );
			_self.setRepeat( options.repeat );
			_self.setUseFade( options.useFade );
			_self.setDuration( options.duration );

		} )();
		// END Initialize


		return {
			animate : _self.animate,
			setStyle : _self.setStyle,
			setRepeat : _self.setRepeat,
			setUseFade : _self.setUseFade,
			setDuration : _self.setDuration,
			setStrokeStyle : _self.setStrokeStyle,
			getProperties : _self.getProperties
		}

	} );


	/**
	 * animate
	 * 
	 * @abstract
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.featureAnimationDefault.prototype.animate = function(e) {
		return false;
	};


	/**
	 * 효과 타입을 설정한다.
	 * 
	 * @param easing {String} 효과 타입 (ol.easing).
	 */
	naji.animation.featureAnimationDefault.prototype.setEasing = function(easing_) {
		var _self = this._this || this;
		_self.easing = ( typeof ( easing_ ) === "string" ) ? ol.easing[ easing_ ] : ol.easing.linear;
	};


	/**
	 * 반복 횟수를 설정한다.
	 * 
	 * @param repeat {Number.<Integer>} 반복 횟수.
	 */
	naji.animation.featureAnimationDefault.prototype.setRepeat = function(repeat_) {
		var _self = this._this || this;
		_self.repeat = ( typeof ( repeat_ ) === "number" ) ? ( repeat_ >= 0 ? repeat_ : 10000 ) : 10000;
	};


	/**
	 * 투명도 효과 사용 여부 설정.
	 * 
	 * @param fade {Boolean} 투명도 효과 사용 여부.
	 */
	naji.animation.featureAnimationDefault.prototype.setUseFade = function(fade_) {
		var _self = this._this || this;
		_self.useFade = ( typeof ( fade_ ) === "boolean" ) ? fade_ : true;
	};


	/**
	 * 지연 시간을 설정한다.
	 * 
	 * @param duration {Number.<Integer>} 지연 시간.
	 */
	naji.animation.featureAnimationDefault.prototype.setDuration = function(duration_) {
		var _self = this._this || this;
		_self.duration = ( typeof ( duration_ ) === "number" ) ? ( duration_ >= 0 ? duration_ : 2000 ) : 2000;
	};


	/**
	 * 애니메이션 스타일을 설정한다.
	 * 
	 * @param style {Array.<ol.style>} 애니메이션 스타일 리스트.
	 */
	naji.animation.featureAnimationDefault.prototype.setStyle = function(style_) {
		var _self = this._this || this;
		_self.style = style_;
	};


	/**
	 * Stroke 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Stroke 스타일.
	 */
	naji.animation.featureAnimationDefault.prototype.setStrokeStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var style = new ol.style.Style( {
			stroke : strokeStyle_
		} );

		_self.strokeStyle = style;
	};


	/**
	 * 애니메이션 Canvas에 그리기.
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * @param geom {ol.geom.Geometry} 표시할 Geometry.
	 */
	naji.animation.featureAnimationDefault.prototype.drawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			// e.context.globalAlpha = ol.easing.easeOut( 1 - e.elapsed );
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var style = _self.style;
		for ( var i = 0; i < style.length; i++ ) {
			var sc = 0;
			var imgs = ol.Map.prototype.getFeaturesAtPixel ? false : style[ i ].getImage();
			if ( imgs ) {
				sc = imgs.getScale();
				imgs.setScale( e.frameState.pixelRatio * sc );
			}

			e.vectorContext.setStyle( style[ i ] );
			e.vectorContext.drawGeometry( geom );

			if ( imgs ) {
				imgs.setScale( sc );
			}
		}
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.featureAnimationDefault.prototype.getProperties = function() {
		var _self = this._this || this;

		return {
			repeat : _self.repeat,
			useFade : _self.useFade,
			duration : _self.duration,
			animationType : _self.animationType
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * bounceAnimation 객체.
	 * 
	 * 피처를 상,하로 튕기는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var bounceAni = new naji.animation.bounceAnimation( {
	 * 	duration : 2000,
	 * 	repeat : 100,
	 * 	amplitude : 40,
	 * 	bounce : 5,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @param opt_options.bounce {Integer} 바운스. Default is `3`.
	 * @param opt_options.amplitude {Integer} 높이. Default is `40`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.bounceAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.bounce = null;
		this.amplitude = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "bounce";

			_self.setBounce( options.bounce );
			_self.setAmplitude( options.amplitude );

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setBounce : _self.setBounce,
			setAmplitude : _self.setAmplitude
		} );

	} );


	naji.animation.bounceAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.bounceAnimation.prototype.constructor = naji.animation.bounceAnimation;


	/**
	 * 바운스를 설정한다.
	 * 
	 * @param bounce {Number.<Integer>} 바운스.
	 */
	naji.animation.bounceAnimation.prototype.setBounce = function(bounce_) {
		var _self = this._this || this;
		_self.bounce = ( typeof ( bounce_ ) === "number" ) ? ( bounce_ >= 0 ? bounce_ : 3 ) : 3;
	};


	/**
	 * 높이를 설정한다.
	 * 
	 * @param easing {Number.<Integer>} 높이
	 */
	naji.animation.bounceAnimation.prototype.setAmplitude = function(amplitude_) {
		var _self = this._this || this;
		_self.amplitude = ( typeof ( amplitude_ ) === "number" ) ? ( amplitude_ >= 0 ? amplitude_ : 40 ) : 40;
	};


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.bounceAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			var bounce = -Math.PI * ( _self.bounce );
			var flashGeom = e.geom.clone();
			var t = Math.abs( Math.sin( bounce * e.elapsed ) ) * _self.amplitude * ( 1 - _self.easing( e.elapsed ) ) * e.frameState.viewState.resolution;
			flashGeom.translate( 0, t );
			_self.drawGeom( e, flashGeom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.bounceAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {
			bounce : _self.bounce,
			amplitude : _self.amplitude
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * dropAnimation 객체.
	 * 
	 * 피처를 위에서 아래로 또는 아래에서 위로 떨어트리는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var dropAni = new naji.animation.dropAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	side : 'top',
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @param opt_options.side {String} 시작 위치 (top, bottom). Default is `top`.
	 * 
	 * @class
	 */
	naji.animation.dropAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.side = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "drop";

			_self.setSide( options.side );

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setSide : _self.setSide
		} );

	} );


	naji.animation.dropAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.dropAnimation.prototype.constructor = naji.animation.dropAnimation;


	/**
	 * 시작 위치를 설정한다.
	 * 
	 * @param side side {String} 시작 위치 (top, bottom).
	 */
	naji.animation.dropAnimation.prototype.setSide = function(side_) {
		var _self = this._this || this;
		_self.side = ( typeof ( side_ ) === "string" ) ? side_ : "top";
	};


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.dropAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			var dy;
			if ( _self.side == 'top' ) {
				dy = e.extent[ 3 ] - e.bbox[ 1 ];
			} else if ( _self.side == 'bottom' ) {
				dy = e.extent[ 1 ] - e.bbox[ 3 ];
			}

			var flashGeom = e.geom.clone();
			flashGeom.translate( 0, dy * ( 1 - _self.easing( e.elapsed ) ) );
			_self.drawGeom( e, flashGeom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.dropAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {
			side : _self.side
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * lineDashMoveAnimation 객체.
	 * 
	 * 라인 형태의 피처를 라인 대시 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var lineDashMoveAni = new naji.animation.lineDashMoveAnimation( {
	 * 	duration : 1000,
	 * 	repeat : 200,
	 * 	useFade : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.lineDashMoveAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.reverse = null;

		this.currentOffset = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "lineDashMove";

			_self.currentOffset = 0;

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setReverse : _self.setReverse
		} );

	} );


	naji.animation.lineDashMoveAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.lineDashMoveAnimation.prototype.constructor = naji.animation.lineDashMoveAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.lineDashMoveAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		if ( _self.repeat < e.nowNB ) {
			return true;
		}

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			if ( !( e.time <= _self.duration ) ) {
				_self.moveLineDash();
			}
			_self.customDrawGeom( e, e.geom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 애니메이션 Canvas에 그리기.
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * @param geom {ol.geom.Geometry} 표시할 Geometry.
	 */
	naji.animation.lineDashMoveAnimation.prototype.customDrawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var vectorContext = e.vectorContext;
		var frameState = e.frameState;

		vectorContext.setStyle( _self.lineDashStyle() );
		vectorContext.drawGeometry( geom );
	};


	/**
	 * 라인 대시 스타일.
	 * 
	 * @private
	 * 
	 * @return style {ol.style.Stroke} 라인 대시 스타일.
	 */
	naji.animation.lineDashMoveAnimation.prototype.lineDashStyle = function() {
		var _self = this._this || this;

		var style = _self.strokeStyle;

		style.getStroke().setLineDashOffset( _self.currentOffset );

		return style;
	};


	/**
	 * 라인 대시 offset 조정.
	 * 
	 * @private
	 */
	naji.animation.lineDashMoveAnimation.prototype.moveLineDash = function() {
		var _self = this._this || this;

		if ( _self.reverse ) {
			_self.currentOffset -= 10;
			if ( _self.currentOffset <= -100 ) {
				_self.currentOffset = 0;
			}
		} else {
			_self.currentOffset += 10;

			if ( _self.currentOffset >= 100 ) {
				_self.currentOffset = 0;
			}
		}
	};


	/**
	 * 방향을 전환한다.
	 */
	naji.animation.lineDashMoveAnimation.prototype.setReverse = function() {
		var _self = this._this || this;
		_self.reverse = !_self.reverse;
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.lineDashMoveAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {
			reverse : _self.reverse
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * lineGradientAnimation 객체.
	 * 
	 * 라인 형태의 피처를 그라데이션 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var lineGradientAni = new naji.animation.lineGradientAnimation( {
	 * 	duration : 5000,
	 * 	repeat : 200,
	 * 	useFade : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.lineGradientAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.lineWidth = null;
		this.startColor = null;
		this.endColor = null;
		this.useSymbol = null;
		this.symbolIcon = null;

		this.njMap = null;
		this.uGSUtil = null;
		this.dummyContext = null;
		this.symbolSRC = null;
		this.symbolAnchor = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "lineGradient";

			_super = naji.animation.featureAnimationDefault.call( _self, options );

			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.uGSUtil = naji.util.njMapGeoSpatialUtil;
			_self.dummyContext = document.createElement( 'canvas' ).getContext( '2d' );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle,
			setnjMap : _self.setnjMap
		} );

	} );


	naji.animation.lineGradientAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.lineGradientAnimation.prototype.constructor = naji.animation.lineGradientAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.lineGradientAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		if ( _self.repeat < e.nowNB ) {
			return true;
		}

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			if ( !( e.time <= _self.duration ) ) {

			}
			_self.customDrawGeom( e, e.geom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 애니메이션 Canvas에 그리기.
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * @param geom {ol.geom.Geometry} 표시할 Geometry.
	 */
	naji.animation.lineGradientAnimation.prototype.customDrawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var vectorContext = e.vectorContext;
		var frameState = e.frameState;

		var cs = e.cs;
		var lens = e.lens;
		var length = e.length;

		var elapsedTime = e.elapsed;
		var len = length * elapsedTime; // 현재 실행 거리
		var fcs = [ cs[ 0 ] ]; // 현재 위치 좌표를 담을 배열 (경로상 임의 위치)
		var idx = 1;
		for ( ; idx < cs.length; idx++ ) {
			var subLen = lens[ idx ];
			if ( subLen >= len ) {
				break;
			} else {
				fcs.push( cs[ idx ] );
			}
		}
		if ( idx < cs.length ) {
			var subLen = lens[ idx ];
			len = subLen - len;
			subLen = subLen - lens[ idx - 1 ];
			var dl = len / subLen;
			var x0 = cs[ idx - 1 ][ 0 ];
			var y0 = cs[ idx - 1 ][ 1 ];
			var x1 = cs[ idx ][ 0 ];
			var y1 = cs[ idx ][ 1 ];
			var c = [ x1 - ( x1 - x0 ) * dl, y1 - ( y1 - y0 ) * dl ];
			fcs.push( c );
		}

		var flashGeo = new ol.geom.LineString( fcs );

		// 경로 그리기
		if ( typeof flashGeo !== "undefined" ) {
			vectorContext.setStyle( _self._gradientStyle( new ol.Feature( {
				geometry : flashGeo
			} ) ) );
			vectorContext.drawGeometry( flashGeo );
		}

		// 현재 위치 심볼 그리기
		_self._createSymbol( vectorContext, flashGeo );
	};


	/**
	 * 라인그라데이션 스타일을 설정한다.
	 * 
	 * style options
	 * 
	 * @param lineWidth {Double} 선 두께.
	 * @param startColor {ol.Color | ol.ColorLike} 그라데이션 색상1.
	 * @param endColor {ol.Color | ol.ColorLike} 그라데이션 색상2.
	 * @param useSymbol {Boolean} 심볼 사용 여부.
	 * @param symbolSRC {String} 심볼 경로 || base64.
	 * @param symbolAnchor {Array.<Double>} 심볼 중심 위치.
	 */
	naji.animation.lineGradientAnimation.prototype.setStyle = function(style_) {
		var _self = this._this || this;

		var options = style_ || {};

		if ( options.lineWidth !== undefined ) _self.lineWidth = options.lineWidth;
		if ( options.startColor !== undefined ) _self.startColor = options.startColor;
		if ( options.endColor !== undefined ) _self.endColor = options.endColor;
		if ( options.useSymbol !== undefined ) _self.useSymbol = options.useSymbol;
		if ( options.symbolSRC !== undefined ) {
			var symbolImage = new Image();
			symbolImage.src = options.symbolSRC;

			symbolImage.onload = function() {
				var icon = new ol.style.Icon( {
					img : symbolImage,
					rotation : 0,
					rotateWithView : true,
					imgSize : [ this.width, this.height ],
					anchor : options.symbolAnchor
				} );

				_self.symbolIcon = new ol.style.Style( {
					image : icon
				} );
			}
		}

		_self.style = new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : _self.startColor,
				width : _self.lineWidth
			} )
		} );
	};


	/**
	 * 그라데이션 설정
	 * 
	 * @private
	 * 
	 * @param feature {ol.Feature} 대상 피쳐
	 */
	naji.animation.lineGradientAnimation.prototype._gradientStyle = function(feature_) {
		var _self = this._this || this;

		var feature = feature_;
		var pixelStart;
		var pixelEnd;
		var extent = feature.getGeometry().getExtent();
		var startP = feature.getGeometry().getFirstCoordinate();
		var centerP = ol.extent.getCenter( extent );

		var angle = _self.uGSUtil.getDegreeBtwPoints( startP, centerP );

		if ( ( 0 <= angle && angle < 90 ) || ( -90 < angle && angle < 0 ) ) {
			// TopLeft -> TopRight
			pixelStart = ol.extent.getTopLeft( extent );
			pixelEnd = ol.extent.getTopRight( extent );
		} else if ( 90 === angle ) {
			// BottomRight -> TopRight
			pixelStart = ol.extent.getBottomRight( extent );
			pixelEnd = ol.extent.getTopRight( extent );
		} else if ( ( 90 < angle && angle < 180 ) || ( 180 === angle ) || ( -180 < angle && angle < -90 ) ) {
			// TopRight -> TopLeft
			pixelStart = ol.extent.getTopRight( extent );
			pixelEnd = ol.extent.getTopLeft( extent );
		} else if ( -90 === angle ) {
			// TopRight -> BottomRight
			pixelStart = ol.extent.getTopRight( extent );
			pixelEnd = ol.extent.getBottomRight( extent );
		}

		var left = _self.njMap.getMap().getPixelFromCoordinate( pixelStart );
		var right = _self.njMap.getMap().getPixelFromCoordinate( pixelEnd );

		var grad = _self.dummyContext.createLinearGradient( left[ 0 ], left[ 1 ], right[ 0 ], right[ 1 ] );

		grad.addColorStop( 0, _self.startColor );
		grad.addColorStop( 1, _self.endColor );

		var style = _self.style;

		style.getStroke().setColor( grad );

		return style;
	};


	/**
	 * 현재 위치에 심볼 그리기
	 * 
	 * @private
	 * 
	 * @param vectorContext {ol.render.VectorContext} vectorContext
	 * @param geometry {ol.geom.LineString | ol.geom.MultiLineString} 애니메이션 대상 피쳐
	 */
	naji.animation.lineGradientAnimation.prototype._createSymbol = function(vectorContext_, geometry_) {
		var _self = this._this || this;

		if ( !vectorContext_ || !geometry_ ) {
			return;
		}
		var coords = geometry_.getCoordinates();
		var startP = coords[ coords.length - 2 ];
		var endP = coords[ coords.length - 1 ];

		var currentPoint = new ol.geom.Point( endP ); // 현재 위치를 나타낼 포인트

		// 현재 위치 포인트 그리기
		if ( typeof currentPoint !== "undefined" ) {
			if ( _self.useSymbol && _self.symbolIcon ) {
				var rotation = _self.uGSUtil.getRadianBtwPoints( startP, endP );
				_self.symbolIcon.getImage().setRotation( -rotation );
				vectorContext_.setStyle( _self.symbolIcon );
			}

			vectorContext_.drawGeometry( currentPoint );
		}
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.lineGradientAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {

		} );
	};


	/**
	 * njMap을 설정한다.
	 * 
	 * @param njMap {naji.njMap} {@link naji.njMap naji.njMap} 객체.
	 */
	naji.animation.lineGradientAnimation.prototype.setnjMap = function(njMap_) {
		var _self = this._this || this;

		_self.njMap = njMap_;
	};

} )();

( function() {
	"use strict";

	/**
	 * showAnimation 객체.
	 * 
	 * 피처를 나타내는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var showAni = new naji.animation.showAnimation( {
	 * 	duration : 2500,
	 * 	repeat : 100,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.showAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "show";

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.animation.showAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.showAnimation.prototype.constructor = naji.animation.showAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.showAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			_self.drawGeom( e, e.geom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.showAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * teleportAnimation 객체.
	 * 
	 * 피처를 순간 이동하여 나타내는 것처럼 보이는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var teleportAni = new naji.animation.teleportAnimation( {
	 * 	duration : 2000,
	 * 	repeat : 100,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.teleportAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "teleport";

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.animation.teleportAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.teleportAnimation.prototype.constructor = naji.animation.teleportAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.teleportAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var sc = _self.easing( e.elapsed );
		if ( sc ) {
			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				e.context.globalAlpha = sc;
				e.context.scale( sc, 1 / sc );
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / sc - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( sc - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.teleportAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * zoomInAnimation 객체.
	 * 
	 * 피처를 확대하는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var zoomInAni = new naji.animation.zoomInAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.zoomInAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "zoomIn";

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.animation.zoomInAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.zoomInAnimation.prototype.constructor = naji.animation.zoomInAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.zoomInAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var fac = _self.easing( e.elapsed );

		if ( fac ) {
			var style = _self.style;
			var imgs, sc = []
			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) {
					sc[ i ] = imgs.getScale();
					imgs.setScale( sc[ i ] * fac );
				}
			}

			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / fac - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( 1 / fac - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.scale( fac, fac );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();

			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) imgs.setScale( sc[ i ] );
			}

		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보
	 */
	naji.animation.zoomInAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * zoomOutAnimation 객체.
	 * 
	 * 피처를 축소하는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var zoomOutAni = new naji.animation.zoomOutAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {naji.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.zoomOutAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "zoomOut";

			_super = naji.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.animation.zoomOutAnimation.prototype = Object.create( naji.animation.featureAnimationDefault.prototype );
	naji.animation.zoomOutAnimation.prototype.constructor = naji.animation.zoomOutAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	naji.animation.zoomOutAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var fac = _self.easing( e.elapsed );

		if ( fac ) {
			fac = 1 / fac;
			var style = _self.style;
			var imgs, sc = []
			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) {
					sc[ i ] = imgs.getScale();
					imgs.setScale( sc[ i ] * fac );
				}
			}

			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / fac - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( 1 / fac - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.scale( fac, fac );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();

			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) imgs.setScale( sc[ i ] );
			}

		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {naji.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.zoomOutAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = naji.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return naji.util.njMapUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapShapeAnimation 기본 객체.
	 * 
	 * 피처의 Shape 타입 애니메이션의 기본 객체. 공통으로 동기화 사용 여부, 멀티 애니메이션(naji.animation.featureAnimationDefault) 효과를 줄 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<naji.animation>} 애니메이션 효과 리스트.
	 * 
	 * @class
	 */
	naji.animation.njMapShapeAnimationDefault = ( function(opt_options) {
		var _self = this;

		this.sync = null;
		this.njMap = null;
		this.features = null;
		this.originCRS = null;
		this.list_animation = null;

		this.isStop = null;
		this.vectorLayer = null;
		this.animationType = null;
		this.transFormFeatures = null;
		this.list_PostcomposeKey = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.sync = ( typeof ( options.sync ) === "boolean" ) ? options.sync : true;
			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.originCRS = ( options.originCRS !== undefined ) ? options.originCRS : "EPSG:4326";
			_self.list_animation = ( Array.isArray( options.animations ) ) ? options.animations : [];
			_self.animationType = ( typeof ( options.animationType ) === "string" ) ? options.animationType : undefined;

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( 'njMap undefined' );
				return false;
			}

			_self.isStop = false;
			_self.transFormFeatures = _self.features;
			_self.vectorLayer = new ol.layer.Vector( {
				source : new ol.source.Vector(),
			// zIndex : 99999
			} );
			_self.vectorLayer.isStop = _self.isStop;
			_self.vectorLayer.animations = _self.list_animation;
			_self.njMap.getMap().addLayer( _self.vectorLayer );

			_self.list_PostcomposeKey = [];

			var proj1 = ol.proj.get( _self.originCRS );
			var proj2 = _self.njMap.getMap().getView().getProjection();
			_self._transformProjection( proj1, proj2 );

			// View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피쳐 정보 변경
			_self.njMap.getMap().on( 'change:view', function(evt_) {
				var oView = evt_.oldValue;
				var nView = evt_.target.getView();

				var oCRS = oView.getProjection();
				var nCRS = nView.getProjection();

				if ( !( ol.proj.equivalent( oCRS, nCRS ) ) ) {
					var list_PostcomposeKey = _self.list_PostcomposeKey;

					for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
						var postcomposeKey = list_PostcomposeKey[ i ];
						ol.Observable.unByKey( postcomposeKey );
					}

					_self._transformProjection( oCRS, nCRS );
					_self.init();
				}
			} );

		} )();
		// END Initialize


		return {
			stop : _self.stop,
			start : _self.start,
			destroy : _self.destroy,
			getLayer : _self.getLayer,
			getProperties : _self.getProperties
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.init = function() {
		var _self = this._this || this;

		/**
		 * 피쳐 초기화
		 */
		( function() {
			var features = _self.transFormFeatures;

			for ( var i = 0; i < features.length; i++ ) {
				var feature = features[ i ];

				if ( !( feature instanceof ol.Feature ) ) {
					continue;
				}

				var geometry = feature.getGeometry();

				// 피쳐 타입별 처리
				if ( geometry instanceof ol.geom.Point || geometry instanceof ol.geom.LineString || geometry instanceof ol.geom.Polygon ) {
					addAnimateFeature( feature );
				} else if ( geometry instanceof ol.geom.MultiPoint ) {
					var points = geometry.getPoints();
					for ( var j = 0; j < points.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : points[ j ]
						} ) );
					}
				} else if ( geometry instanceof ol.geom.MultiLineString ) {
					var lineStrings = geometry.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				} else if ( geometry instanceof ol.geom.MultiPolygon ) {
					var polygons = geometry.getPolygons();
					for ( var j = 0; j < polygons.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : polygons[ j ]
						} ) );
					}
				}
			}


			/**
			 * 애니메이션 피쳐 옵션 등록
			 * 
			 * @param feature {ol.Feature} 대상 피쳐
			 */
			function addAnimateFeature(feature_) {
				var options = {
					vectorContext : null,
					frameState : null,
					start : 0,
					time : 0,
					elapsed : 0,
					extent : false,
					feature : feature_,
					geom : feature_.getGeometry(),
					typeGeom : feature_.getGeometry().getType(),
					bbox : feature_.getGeometry().getExtent(),
					coord : ol.extent.getCenter( feature_.getGeometry().getExtent() ),
					nowNB : 0,
					interval : ( _self.sync ? 0 : Math.floor( ( Math.random() * ( 1500 - 500 + 1 ) ) + 500 ) )
				};

				var listenerKey = _self.vectorLayer.animateFeature( options );
				_self.list_PostcomposeKey.push( listenerKey );
			}

		} )();

	};


	/**
	 * 피처 좌표계 변경.
	 * 
	 * -View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피쳐 정보 변경.
	 * 
	 * @param source {ol.ProjectionLike} 원본 좌표계.
	 * @param destination {ol.ProjectionLike} 변경 좌표계.
	 * 
	 * @private
	 */
	naji.animation.njMapShapeAnimationDefault.prototype._transformProjection = function(source_, destination_) {
		var _self = this._this || this;

		if ( !( ol.proj.equivalent( source_, destination_ ) ) ) {
			_self.transFormFeatures = [];

			var features = _self.features.slice();

			var i, ii;
			for ( i = 0, ii = features.length; i < ii; ++i ) {
				var geom = features[ i ].clone().getGeometry();

				if ( !geom ) {
					continue;
				}

				_self.transFormFeatures.push( new ol.Feature( {
					geometry : geom.transform( _self.originCRS, destination_ )
				} ) );
			}
		}
	};


	/**
	 * 애니메이션 스타일을 설정한다.
	 * 
	 * @param style {Array.<ol.style>} 애니메이션 스타일 리스트.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.setStyles = function(style_) {
		var _self = this._this || this;

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setStyle( style_ );
		}
	};


	/**
	 * Stroke 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Stroke 스타일.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.setStrokeStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setStrokeStyle( strokeStyle_ );
		}
	};


	/**
	 * 애니메이션을 시작한다.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.start = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = false;
	};


	/**
	 * 애니메이션을 정지한다.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.stop = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = true;
	};


	/**
	 * 현재 애니메이션을 전체 초기화한다.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.destroy = function() {
		var _self = this._this || this;

		var list_PostcomposeKey = _self.list_PostcomposeKey;

		for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
			var postcomposeKey = list_PostcomposeKey[ i ];
			ol.Observable.unByKey( postcomposeKey );
		}

		_self.features = [];
		_self.transFormFeatures = [];

		_self.njMap.getMap().removeLayer( _self.vectorLayer );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.getProperties = function() {
		var _self = this._this || this;

		var animProperties = [];
		var animList = _self.list_animation;
		for ( var i in animList ) {
			animProperties.push( animList[ i ].getProperties() );
		}

		return {
			animProperties : animProperties,
			animationType : _self.animationType
		}
	};


	/**
	 * 애니메이션 벡터 레이어를 가져온다.
	 * 
	 * @return {ol.layer.Vector} 애니메이션 벡터 레이어.
	 */
	naji.animation.njMapShapeAnimationDefault.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapCircleAnimation 객체.
	 * 
	 * Circle(원) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Point 또는 ol.geom.MultiPoint
	 * 
	 * ※스타일 타입 : ol.style.Circle
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGcircleAni = new naji.animation.njMapCircleAnimation( {
	 * 	njMap : new naji.njMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Point({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new naji.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Circle({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Point|ol.geom.MultiPoint>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<naji.animation>} 애니메이션 효과 리스트.
	 * @param opt_options.style {ol.style.Circle} Circle 스타일.
	 * 
	 * @Extends {naji.animation.njMapShapeAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.njMapCircleAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "njMapCircleAnimation";

			_super = naji.animation.njMapShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	naji.animation.njMapCircleAnimation.prototype = Object.create( naji.animation.njMapShapeAnimationDefault.prototype );
	naji.animation.njMapCircleAnimation.prototype.constructor = naji.animation.njMapCircleAnimation;


	/**
	 * Circle 애니메이션 스타일을 설정한다.
	 * 
	 * @param circleStyle {ol.style.Circle} Circle 스타일.
	 */
	naji.animation.njMapCircleAnimation.prototype.setStyle = function(circleStyle_) {
		var _self = this._this || this;

		var style = [ new ol.style.Style( {
			image : circleStyle_
		} ) ];

		_self.setStyles( style );
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapLineAnimation 객체.
	 * 
	 * Line(선) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.LineString 또는 ol.geom.MultiLineString
	 * 
	 * ※스타일 타입 : ol.style.Stroke
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGLineAni = new naji.animation.njMapLineAnimation( {
	 * 	njMap : new naji.njMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.LineString({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new naji.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Stroke({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<naji.animation>} 애니메이션 효과 리스트.
	 * @param opt_options.style {ol.style.Stroke} Line Stroke 스타일.
	 * 
	 * @Extends {naji.animation.njMapShapeAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.njMapLineAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "njMapLineAnimation";

			_super = naji.animation.njMapShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	naji.animation.njMapLineAnimation.prototype = Object.create( naji.animation.njMapShapeAnimationDefault.prototype );
	naji.animation.njMapLineAnimation.prototype.constructor = naji.animation.njMapLineAnimation;


	/**
	 * Line Stroke 애니메이션 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Line Stroke 스타일.
	 */
	naji.animation.njMapLineAnimation.prototype.setStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var strokeStyle = strokeStyle_;

		var style = [ new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : [ 0, 0, 0, 0 ],
				width : 0
			} )
		} ), new ol.style.Style( {
			image : new ol.style.RegularShape( {} ),
			stroke : strokeStyle
		} ) ];

		_self.setStrokeStyle( strokeStyle );
		_self.setStyles( style );
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapLineGradientAnimation 객체.
	 * 
	 * Line(선) 형태의 피처에 그라데이션 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.LineString 또는 ol.geom.MultiLineString
	 * 
	 * ※스타일 타입 : ol.style.Stroke
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGLineGraAni = new naji.animation.njMapLineGradientAnimation( {
	 * 	njMap : new naji.njMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.LineString({...}),
	 * 		...
	 * 	) ],
	 *	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 *	animations : [ new naji.animation.lineGradientAnimation({...}) ],
	 *	style : {
	 *		lineWidth : 5,
	 *		startColor : 'white',
	 *		endColor : 'blue',
	 *		useSymbol : true,
	 *		symbolSRC : '/images/gRbrraN.png',
	 *		symbolAnchor : [ 0.5, 0.5 ]
	 *	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피처 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<naji.animation>} 애니메이션 효과 리스트.
	 * 
	 * @param opt_options.lineWidth {Number} 선 두께.
	 * @param opt_options.startColor {ol.Color | ol.ColorLike} 그라데이션 색상1.
	 * @param opt_options.endColor {ol.Color | ol.ColorLike} 그라데이션 색상2.
	 * @param opt_options.useSymbol {Boolean} 심볼 사용 여부.
	 * @param opt_options.symbolSRC {String} 심볼 경로 || base64.
	 * @param opt_options.symbolAnchor {Number} 심볼 중심 위치.
	 * 
	 * @class
	 */
	naji.animation.njMapLineGradientAnimation = ( function(opt_options) {
		var _self = this;

		this.sync = null;
		this.njMap = null;
		this.features = null;
		this.originCRS = null;
		this.list_animation = null;

		this.isStop = null;
		this.vectorLayer = null;
		this.animationType = null;
		this.transFormFeatures = null;

		this.uGSUtil = null;
		this.dummyContext = null;
		this.list_PostcomposeKey = null;

		this.lineWidth = null;
		this.startColor = null;
		this.endColor = null;
		this.useSymbol = null;
		this.symbolIcon = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.sync = ( options.sync !== undefined ) ? options.sync : true;
			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.originCRS = ( options.originCRS !== undefined ) ? options.originCRS : "EPSG:4326";
			_self.list_animation = ( Array.isArray( options.animations ) ) ? options.animations : [];
			_self.animationType = "njMapLineGradientAnimation";

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( 'njMap undefined' );
				return false;
			}

			_self.isStop = false;
			_self.transFormFeatures = _self.features;
			_self.vectorLayer = new ol.layer.Vector( {
				source : new ol.source.Vector()
			} );
			_self.vectorLayer.isStop = _self.isStop;
			_self.vectorLayer.animations = _self.list_animation;
			_self.njMap.getMap().addLayer( _self.vectorLayer );

			_self.list_PostcomposeKey = [];
			_self.uGSUtil = naji.util.njMapGeoSpatialUtil;
			_self.dummyContext = document.createElement( 'canvas' ).getContext( '2d' );

			_self.lineWidth = 2;
			_self.startColor = "white";
			_self.endColor = "black";
			_self.useSymbol = false;

			var proj1 = ol.proj.get( _self.originCRS );
			var proj2 = _self.njMap.getMap().getView().getProjection();
			_self._transformProjection( proj1, proj2 );

			_self._init();

			_self.setStyle( options.style );
			_self.setnjMap( _self.njMap );


			// View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피처 정보 변경
			_self.njMap.getMap().on( 'change:view', function(evt_) {
				var oView = evt_.oldValue;
				var nView = evt_.target.getView();

				var oCRS = oView.getProjection();
				var nCRS = nView.getProjection();

				if ( !( ol.proj.equivalent( oCRS, nCRS ) ) ) {
					var list_PostcomposeKey = _self.list_PostcomposeKey;

					for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
						var postcomposeKey = list_PostcomposeKey[ i ];
						ol.Observable.unByKey( postcomposeKey );
					}
					_self._transformProjection( oCRS, nCRS );
					_self._init();
				}
			} );

		} )();
		// END Initialize


		return {
			_this : _self,
			start : _self.start,
			stop : _self.stop,
			destroy : _self.destroy,
			setStyle : _self.setStyle,
			getLayer : _self.getLayer,
			getProperties : _self.getProperties
		}

	} );


	/**
	 * 피처 좌표계 변경.
	 * 
	 * View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피처 정보 변경.
	 * 
	 * @param source {ol.ProjectionLike} 원본 좌표계.
	 * @param destination {ol.ProjectionLike} 변경 좌표계.
	 * 
	 * @private
	 */
	naji.animation.njMapLineGradientAnimation.prototype._transformProjection = function(source_, destination_) {
		var _self = this._this || this;

		if ( !( ol.proj.equivalent( source_, destination_ ) ) ) {
			_self.transFormFeatures = [];

			var features = _self.features.slice();

			var i, ii;
			for ( i = 0, ii = features.length; i < ii; ++i ) {
				var geom = features[ i ].clone().getGeometry();

				if ( !geom ) {
					continue;
				}

				_self.transFormFeatures.push( new ol.Feature( {
					geometry : geom.transform( _self.originCRS, destination_ )
				} ) );
			}
		}
	};


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.animation.njMapLineGradientAnimation.prototype._init = function() {
		var _self = this._this || this;

		/**
		 * 피처 초기화
		 */
		( function() {
			var features = _self.transFormFeatures;

			for ( var i = 0; i < features.length; i++ ) {
				var feature = features[ i ];

				if ( !( feature instanceof ol.Feature ) ) {
					continue;
				}

				var geometry = feature.getGeometry();

				// 피처 타입별 처리
				if ( geometry instanceof ol.geom.LineString ) {
					addAnimateFeature( feature );
				} else if ( geometry instanceof ol.geom.MultiLineString ) {
					var lineStrings = geometry.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				}
			}


			/**
			 * 애니메이션 피처 옵션 등록
			 * 
			 * @param feature {ol.Feature} 대상 피처
			 */
			function addAnimateFeature(feature_) {
				var options = {
					vectorContext : null,
					frameState : null,
					start : 0,
					time : 0,
					elapsed : 0,
					extent : false,
					feature : feature_,
					geom : feature_.getGeometry(),
					typeGeom : feature_.getGeometry().getType(),
					bbox : feature_.getGeometry().getExtent(),
					coord : ol.extent.getCenter( feature_.getGeometry().getExtent() ),
					nowNB : 0,
					interval : ( _self.sync ? 0 : Math.floor( ( Math.random() * ( 1500 - 500 + 1 ) ) + 500 ) )
				};


				var length = feature_.getGeometry().getLength(); // 총 거리
				var cs = feature_.getGeometry().getCoordinates(); // 좌표 배열
				var lens = new Array( cs.length ); // 각 좌표 별 시작점 부터 현재 까지 거리를 담을 배열
				lens[ 0 ] = 0;
				for ( var i = 1; i < cs.length; i++ ) {
					lens[ i ] = lens[ i - 1 ] + _self.uGSUtil.getDistanceBtwPotins( cs[ i ], cs[ i - 1 ] );
				}

				options.length = length;
				options.cs = cs;
				options.lens = lens;

				var listenerKey = _self.vectorLayer.animateFeature( options );
				_self.list_PostcomposeKey.push( listenerKey );
			}

		} )();

	};


	/**
	 * 애니메이션 스타일을 설정한다.
	 * 
	 * @param style {Array.<ol.style>} 애니메이션 스타일 리스트.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.setStyle = function(style_) {
		var _self = this._this || this;

		var options = style_ || {};

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setStyle( style_ );
		}
	};


	/**
	 * njMap을 설정한다.
	 * 
	 * @param njMap {naji.njMap} {@link naji.njMap} 객체.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.setnjMap = function(njMap_) {
		var _self = this._this || this;

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setnjMap( njMap_ );
		}
	};


	/**
	 * 애니메이션을 시작한다.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.start = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = false;
	};


	/**
	 * 애니메이션을 정지한다.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.stop = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = true;
	};


	/**
	 * 현재 애니메이션을 전체 초기화한다.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.destroy = function() {
		var _self = this._this || this;

		var list_PostcomposeKey = _self.list_PostcomposeKey;

		for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
			var postcomposeKey = list_PostcomposeKey[ i ];
			ol.Observable.unByKey( postcomposeKey );
		}

		_self.features = null;
		_self.transFormFeatures = null;

		_self.njMap.getMap().removeLayer( _self.vectorLayer );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var animProperties = [];
		var animList = _self.list_animation;
		for ( var i in animList ) {
			animProperties.push( animList[ i ].getProperties() );
		}

		return {
			animationType : _self.animationType,
			animProperties : animProperties
		}
	};


	/**
	 * 애니메이션 벡터 레이어를 가져온다.
	 * 
	 * @return {ol.layer.Vector} 애니메이션 벡터 레이어.
	 */
	naji.animation.njMapLineGradientAnimation.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapPolygonAnimation 객체.
	 * 
	 * Polygon(폴리곤) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Polygon 또는 ol.geom.MultiPolygon
	 * 
	 * ※스타일 타입 : ol.style.Style
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGPolygonAni = new naji.animation.njMapPolygonAnimation( {
	 * 	njMap : new naji.njMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Polygon({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new naji.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Polygon|ol.geom.MultiPolygon>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<naji.animation>} 애니메이션 효과 리스트. *
	 * @param opt_options.style {ol.style.Style} Polygon 스타일.
	 * 
	 * @Extends {naji.animation.njMapShapeAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.njMapPolygonAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "njMapPolygonAnimation";

			_super = naji.animation.njMapShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	naji.animation.njMapPolygonAnimation.prototype = Object.create( naji.animation.njMapShapeAnimationDefault.prototype );
	naji.animation.njMapPolygonAnimation.prototype.constructor = naji.animation.njMapPolygonAnimation;


	/**
	 * Polygon 애니메이션 스타일을 설정한다.
	 * 
	 * @param polyonStyle {ol.style.Style} Polygon 스타일.
	 */
	naji.animation.njMapPolygonAnimation.prototype.setStyle = function(polyonStyle_) {
		var _self = this._this || this;

		var polyStyle = polyonStyle_;

		var style = [ new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : [ 0, 0, 0, 0 ],
				width : 0
			} ),
			fill : new ol.style.Fill( {
				color : [ 0, 0, 0, 0 ]
			} ),
		} ), new ol.style.Style( {
			image : new ol.style.RegularShape( {} ),
			stroke : polyStyle.getStroke(),
			fill : polyStyle.getFill()
		} ) ];

		_self.setStyles( style );
	};

} )();

( function() {
	"use strict";

	/**
	 * njMapRegularShapeAnimation 객체.
	 * 
	 * RegularShape 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Point 또는 ol.geom.MultiPoint
	 * 
	 * ※스타일 타입 : ol.style.RegularShape
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGregularShapeAni = new naji.animation.njMapCircleAnimation( {
	 * 	njMap : new naji.njMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Point({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new naji.animation.showAnimation({...}) ],
	 * 	style : new ol.style.RegularShape({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Point|ol.geom.MultiPoint>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<naji.animation>} 애니메이션 효과 리스트. *
	 * @param opt_options.style {ol.style.RegularShape} RegularShape 스타일.
	 * 
	 * @Extends {naji.animation.njMapShapeAnimationDefault}
	 * 
	 * @class
	 */
	naji.animation.njMapRegularShapeAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "njMapRegularShapeAnimation";

			_super = naji.animation.njMapShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	naji.animation.njMapRegularShapeAnimation.prototype = Object.create( naji.animation.njMapShapeAnimationDefault.prototype );
	naji.animation.njMapRegularShapeAnimation.prototype.constructor = naji.animation.njMapRegularShapeAnimation;


	/**
	 * RegularShape 애니메이션 스타일을 설정한다.
	 * 
	 * @param regularShapeStyle {ol.style.RegularShape} RegularShape 애니메이션 스타일.
	 */
	naji.animation.njMapRegularShapeAnimation.prototype.setStyle = function(regularShapeStyle_) {
		var _self = this._this || this;

		var regularShapeStyle = regularShapeStyle_;

		var style = [ new ol.style.Style( {
			image : regularShapeStyle
		} ) ];

		_self.setStyles( style );
	};

} )();

/**
 * @namespace naji.control
 */

( function() {
	"use strict";

	/**
	 * 컨트롤 기본 객체.
	 * 
	 * 컨트롤의 기본 객체. 공통으로 지도 이동 사용 여부, 마우스 커서, 컨트롤 상태 변경 이벤트를 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @class
	 */
	naji.control.njMapControlDefault = ( function(opt_options) {
		var _self = this;

		this.njMap = null;
		this.useDragPan = null;
		this.cursorCssName = null;
		this.activeChangeListener = null;

		this.controlKey = null;
		this.interaction = null;
		this.compatibleDragPan = null;
		this.key_activeChangeListener = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.useDragPan = ( typeof ( options.useDragPan ) === "boolean" ) ? options.useDragPan : false;

			_self.cursorCssName = ( options.cursorCssName !== undefined ) ? options.cursorCssName : undefined;
			_self.activeChangeListener = ( typeof options.activeChangeListener === "function" ) ? options.activeChangeListener : undefined;
			_self.controlKey = naji.util.njMapUtil.generateUUID();

			_self.target = ( options.target !== undefined ) ? options.target : undefined;

			if( options.elementId !== undefined ){
				//_self._setElement( options );

				var element = document.createElement( "div" );

				element.id = opt_options.elementId;
				element.title = opt_options.title;
				element.eventType = opt_options.type;

				_self.element = element;
			}

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

		} )();
		// END initialize


		return {
			destroy : _self.destroy,
			getElement : _self.getElement,
			setActive : _self.setActive,
			getActive : _self.getActive,
			getControlKey : _self.getControlKey,
			getInteraction : _self.getInteraction,
			setActiveChangeListener : _self.setActiveChangeListener
		};

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.control.njMapControlDefault.prototype._init = function() {
		var _self = this._this || this;

		var olMap = _self.njMap.getMap();

		// ol.Map에 DragPan 전체 삭제.
		var interactions = olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( interactions[ i ] instanceof ol.interaction.DragPan ) {
				if ( !( interactions[ i ].get( "njMapDragPan" ) ) ) {
					olMap.removeInteraction( interactions[ i ] );
				}
			}
		}

		_self.setActiveChangeListener( _self.activeChangeListener );

		olMap.addInteraction( _self.interaction );
	};


	/**
	 * 컨트롤 키를 가져온다.
	 * 
	 * @return getControlKey {String} 컨트롤 키.
	 */
	naji.control.njMapControlDefault.prototype.getControlKey = function() {
		var _self = this._this || this;
		return _self.controlKey;
	};


	/**
	 * Interaction을 가져온다.
	 * 
	 * @return interaction {ol.interaction.Interaction} Draw Interaction.
	 */
	naji.control.njMapControlDefault.prototype.getInteraction = function() {
		var _self = this._this || this;
		return _self.interaction;
	};

	
	/**
	 * element를 가져온다.
	 * 
	 * @return element {HTMLDivElement} ui element.
	 */
	naji.control.njMapControlDefault.prototype.getElement = function() {
		var _self = this._this || this;
		return _self.element;
	};


	/**
	 * Interaction 활성화 상태를 가져온다.
	 * 
	 * @return {Boolean} Interaction 활성화 상태.
	 */
	naji.control.njMapControlDefault.prototype.getActive = function() {
		var _self = this._this || this;
		return _self.interaction.getActive();
	};


	/**
	 * Interaction 활성화를 설정한다.
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	naji.control.njMapControlDefault.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.interaction.getActive() && state_ === true ) {
			return false;
		}

		var viewPort = _self.njMap.getMap().getViewport();

		var list = viewPort.classList;
		for ( var i = 0; i < list.length; i++ ) {
			var name = list[ i ];
			if ( name.indexOf( "cursor" ) === 0 ) {
				viewPort.classList.remove( name );
			}
		}

		if ( state_ ) {
			viewPort.classList.add( _self.cursorCssName );

			if ( _self.useDragPan ) {
				if ( !_self.compatibleDragPan ) {
					_self.compatibleDragPan = new ol.interaction.DragPan( {
						kinetic : false
					} );

					_self.compatibleDragPan.set( "njMapDragPan", true );

					_self.njMap.getMap().addInteraction( _self.compatibleDragPan );
				} else {
					_self.compatibleDragPan.setActive( true );
				}
			}

		} else {
			viewPort.classList.add( "cursor-default" );
			// _self.njMap.getMap().removeInteraction( _self.compatibleDragPan );
			if ( _self.compatibleDragPan ) {
				_self.compatibleDragPan.setActive( false );
			}
		}

		_self.interaction.setActive( state_ );
	};


	/**
	 * 컨트롤의 상태 변경 CallBack.
	 * 
	 * @param activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 */
	naji.control.njMapControlDefault.prototype.setActiveChangeListener = function(listener_) {
		var _self = this._this || this;

		if ( _self.interaction && typeof listener_ === "function" ) {
			ol.Observable.unByKey( _self.key_activeChangeListener );

			_self.activeChangeListener = listener_;

			_self.key_activeChangeListener = _self.interaction.on( "change:active", function(e_) {
				_self.activeChangeListener.call( this, e_.target.getActive() );
			} );
		}
	};

	/**
	 * element 설정.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.elementId {String} elementId.
	 * @param opt_options.title {String} element title.
	 * 
	 */
	naji.control.njMapControlDefault.prototype._setElement = function(opt_options) {
		var _self = this._this || this;

		var element = document.createElement( "div" );

		element.id = opt_options.elementId;
		element.title = opt_options.title;

		_self.element = element;
	};

	/**
	 * 컨트롤을 초기화한다.
	 */
	naji.control.njMapControlDefault.prototype.destroy = function() {
		var _self = this._this || this;

		_self.setActive( false );

		_self.njMap.getMap().removeInteraction( _self.interaction );
	};

} )();

( function() {
	"use strict";

	/**
	 * 피처 그리기 객체.
	 * 
	 * 마우스로 다양한 도형을 그리는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapDrawFeature = new naji.control.njMapDrawFeature( {
	 *	njMap : new naji.njMap({...}),
	 *	useSnap : true,
	 *	freehand : false,
	 *	useDragPan : true,
	 *	drawType : 'Polygon',
	 *	cursorCssName : 'cursor-polygon',
	 *	useDrawEndDisplay : true,
	 * 	activeChangeListener : function(state_) {
	 *		console.log( state_ );
	 * 	},
	 *	featureStyle : new ol.style.Style({...}),
	 *	drawingStyle : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @param opt_options.useSnap {Boolean} 스냅 사용 여부. Default is `false`.
	 * @param opt_options.drawType {String} 피처 타입 <Point|LineString|Polygon|Circle|Box>. Default is `LineString`.
	 * @param opt_options.useDrawEndDisplay {Boolean} 피처를 그린 후 해당 피처 Display 여부. Default is `true`.
	 * @param opt_options.featureStyle {ol.style.Style} 피처 스타일.
	 * @param opt_options.drawingStyle {ol.style.Style} drawing 피처 스타일.
	 * @param opt_options.freehand {Boolean} 자유 그리기 사용 여부. Default is `false`.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapDrawFeature = ( function(opt_options) {
		var _self = this;
		var _super;

		this.flag = false;
		this.useModify = null;
		this.useSnap = null;
		this.freehand = null;
		this.drawType = null;
		this.featureStyle = null;
		this.drawingStyle = null;
		this.useDrawEndDisplay = null;

		this.vectorLayer = null;
		this.snapInteraction = null;

		this.modifyInteraction = null;
		this.selectInteraction = null;
		this.selectFeatures = null;

		this.textOverlay = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self.useModify = ( options.useModify !== undefined ) ? options.useModify : false;
			_self.useSnap = ( options.useSnap !== undefined ) ? options.useSnap : false;
			_self.freehand = ( options.freehand !== undefined ) ? options.freehand : false;
			_self.featureStyle = ( options.featureStyle !== undefined ) ? options.featureStyle : undefined;
			_self.drawingStyle = ( options.drawingStyle !== undefined ) ? options.drawingStyle : _self.featureStyle;
			_self.drawType = ( options.drawType !== undefined ) ? options.drawType : "LineString";
			_self.useDrawEndDisplay = ( options.useDrawEndDisplay !== undefined ) ? options.useDrawEndDisplay : true;

			// _self.selectFeatures = [];

			if ( !options.noneInit ) {
				_self._init();
			}

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			getLayer : _self.getLayer,
			getFeatures : _self.getFeatures,
			removeFeature : _self.removeFeature
		} );

	} );


	naji.control.njMapDrawFeature.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapDrawFeature.prototype.constructor = naji.control.njMapDrawFeature;


	/**
	 * 초기화
	 * 
	 * @override naji.control.njMapControlDefault.prototype._init
	 * 
	 * @private
	 */
	naji.control.njMapDrawFeature.prototype._init = function() {
		var _self = this._this || this;

		var vectorSource = new ol.source.Vector( {
			wrapX : false
		} );

		_self.vectorLayer = new ol.layer.Vector( {
			zIndex : 9999,
			source : vectorSource,
			style : _self.featureStyle
		} );

		_self.njMap.getMap().addLayer( _self.vectorLayer );

		var type;
		var geometryFunction;

		switch ( _self.drawType ) {
			case "Point" :
				type = "Point";
				geometryFunction = null;
				break;
			case "LineString" :
				type = "LineString";
				geometryFunction = null;
				break;
			case "Polygon" :
				type = "Polygon";
				geometryFunction = null;
				break;
			case "Circle" :
				type = "Circle";
				geometryFunction = null;
				break;
			case "Box" :
				type = "Circle";
				geometryFunction = ol.interaction.Draw.createBox();
				break;
			case "Text" :
				type = "Point";
				geometryFunction = null;
				break;
			default :
				type = "Polygon";
				geometryFunction = null;
		}

		_self.interaction = new ol.interaction.Draw( {
			type : type,
			source : vectorSource,
			freehand : _self.freehand,
			style : _self.drawingStyle,
			geometryFunction : geometryFunction
		} );

		_self.interaction.setActive( false );

		if ( !_self.useDrawEndDisplay ) {
			_self.interaction.on( "drawend", function(evt) {
				setTimeout( function() {
					_self.clear();
				}, 1 );
			}, this );
		}

		if ( _self.drawType === "Text" ) {

			_self.interaction.on( "drawend", function(evt) {
				if( _self.textOverlay != null ) _self.njMap.getMap().removeOverlay( _self.textOverlay );

				_self.vectorLayer.getSource().once('addfeature', function(e){
					_self.removeFeature(e.feature);
				});

				var textElement = document.createElement( "div" );
				textElement.className = "tooltip";
				
				var textareaElement = document.createElement( "textarea" );
				textareaElement.id = "textareaElement";
				textareaElement.style = "color: black; font-size: 12px";

				var saver = document.createElement( "button" );
				saver.title = "save";
				saver.style = "color: green";
				saver.className = "tooltip-save";
				saver.innerHTML = "<i class=\"fa fa-check-circle-o\" />";
				saver.onclick = function() {
					_self.njMap.getMap().removeOverlay( _self.textOverlay );

					evt.feature.setStyle(new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(255,255,255,0.4)'
						}),
						stroke: new ol.style.Stroke({
							color: '#3399CC',
							width: 1.25
						}),
						text: new ol.style.Text({
							font: '15px Calibri,sans-serif',
							fill: new ol.style.Fill({ color: '#000' }),
							stroke: new ol.style.Stroke({
								color: '#fff', width: 2
							}),
							// get the text from the feature - `this` is ol.Feature
							// and show only under certain resolution
							text: textareaElement.value
						})
					}));

					_self.vectorLayer.getSource().addFeature( evt.feature );
					saver.blur();
					return false;
				};

				var closer = document.createElement( "button" );
				closer.title = "cancel";
				closer.style = "color: red";
				closer.className = "tooltip-cancel";
				closer.innerHTML = "<i class=\"fa fa-ban\" />";
				closer.onclick = function() {
					_self.njMap.getMap().removeOverlay( _self.textOverlay );
					//_self.removeFeature( evt.feature );
					closer.blur();
					return false;
				};

				textElement.appendChild(textareaElement);
				textElement.appendChild(document.createElement( "br" ));
				textElement.appendChild(saver);
				textElement.appendChild(closer);

				_self.textOverlay = new ol.Overlay( {
					element : textElement,
					offset : [ 0, 0 ],
					positioning : "bottom-center"
				} );
				
				_self.textOverlay.setPosition(evt.feature.getGeometry().getLastCoordinate());

				_self.njMap.getMap().addOverlay( _self.textOverlay );
			});
		}

		naji.control.njMapControlDefault.prototype._init.call( this );

		if ( _self.useSnap ) {
			_self.snapInteraction = new ol.interaction.Snap( {
				source : vectorSource
			} );

			_self.njMap.getMap().addInteraction( _self.snapInteraction );
		}

		if ( _self.useModify ) {

			_self.interaction.on( "drawstart", function(evt) {
				_self.flag = true;
				console.log("DRAW___START");
			});
			_self.interaction.on( "drawend", function(evt) {
				_self.flag = false;

				evt.feature.setId(naji.util.njMapUtil.generateUUID());

				console.log("DRAW___END");

				_self.selectInteraction = new ol.interaction.Select( {
					layers: function(layer){
						return layer == _self.vectorLayer;
					},
					//style: new ol.style.Style( _style ),
					//condition: ol.events.condition.pointerMove,
					condition: ol.events.condition.singleClick,
					wrapX: false
				} );
	
				_self.njMap.getMap().addInteraction( _self.selectInteraction );

				_self.selectInteraction.on("select", function(evt){
					if( evt.selected[0] ){
						_self.interaction.setActive(false);
					}else{
						_self.interaction.setActive(true);
					}
				});
				
				_self.modifyInteraction = new ol.interaction.Modify({ 
					features: _self.selectInteraction.getFeatures()
				});
				_self.njMap.getMap().addInteraction(_self.modifyInteraction);

			});
		}
	};

	/**
	 * Draw Interaction 활성화를 설정한다.
	 * 
	 * @override {naji.control.njMapControlDefault.prototype.setActive}
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	naji.control.njMapDrawFeature.prototype.setActive = function(state_) {
		var _self = this._this || this;

		naji.control.njMapControlDefault.prototype.setActive.call( this, state_ );

		if( _self.drawType === "Text" && _self.textOverlay != null ) _self.njMap.getMap().removeOverlay( _self.textOverlay );
	};

	/**
	 * 레이어를 가져온다.
	 * 
	 * @return vectorLayer {ol.layer.Vector} Vector Layer.
	 */
	naji.control.njMapDrawFeature.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};


	/**
	 * 피쳐를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} Features.
	 */
	naji.control.njMapDrawFeature.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.vectorLayer.getSource().getFeatures();
	};


	/**
	 * 그려진 도형을 지운다.
	 */
	naji.control.njMapDrawFeature.prototype.clear = function() {
		var _self = this._this || this;
		_self.vectorLayer.getSource().clear();
	};


	/**
	 * 피처를 제거한다.
	 * 
	 * @param feature {ol.Feature} 제거할 피처.
	 */
	naji.control.njMapDrawFeature.prototype.removeFeature = function(feature_) {
		var _self = this._this || this;
		_self.vectorLayer.getSource().removeFeature( feature_ );
	};


	/**
	 * 컨트롤을 초기화한다.
	 * 
	 * @override {naji.control.njMapControlDefault.prototype.destroy}
	 * 
	 * @param clearFeature {Boolean} 그려진 도형 제거 여부.
	 */
	naji.control.njMapDrawFeature.prototype.destroy = function(clearFeature_) {
		var _self = this._this || this;

		naji.control.njMapControlDefault.prototype.destroy.call( this );

		_self.njMap.getMap().removeInteraction( _self.snapInteraction );

		if ( clearFeature_ ) {
			_self.njMap.getMap().removeLayer( _self.vectorLayer );
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * 측정 기본 객체.
	 * 
	 * 마우스로 지도상에서 측정할 수 있는 측정 컨트롤 기본 객체.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * 
	 * @Extends {naji.control.njMapDrawFeature}
	 * 
	 * @class
	 */
	naji.control.njMapMeasureDefault = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.sketch = null;
		this.overlays = null;
		this.destroyed = null;
		this.helpTooltip = null;
		this.continueMsg = null;
		this.measureTooltip = null;
		this.helpTooltipElement = null;
		this.measureTooltipElement = null;

		this.pointerMoveListener = null;
		this.sketchChangeListener = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.noneInit = true;

			_super = naji.control.njMapDrawFeature.call( _self, options );

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			destroy : _self.destroy,
			getOverlay : _self.getOverlay,
			setActive : _self.setActive
		} );

	} );


	naji.control.njMapMeasureDefault.prototype = Object.create( naji.control.njMapDrawFeature.prototype );
	naji.control.njMapMeasureDefault.prototype.constructor = naji.control.njMapMeasureDefault;


	/**
	 * 초기화
	 * 
	 * @override {naji.control.njMapDrawFeature.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapMeasureDefault.prototype._init = function() {
		var _self = this._this || this;

		naji.control.njMapDrawFeature.prototype._init.call( this );

		_self.overlays = [];
		_self.destroyed = false;
	};


	/**
	 * Creates a new help tooltip
	 * 
	 * @private
	 */
	naji.control.njMapMeasureDefault.prototype.createHelpTooltip = function() {
		var _self = this._this || this;

		if ( _self.helpTooltip ) {
			_self.njMap.getMap().removeOverlay( _self.helpTooltip );
		}

		_self.helpTooltipElement = document.createElement( "div" );
		_self.helpTooltipElement.className = "tooltip hidden";
		_self.helpTooltip = new ol.Overlay( {
			element : _self.helpTooltipElement,
			offset : [ 25, 12 ],
			positioning : "center-left"
		} );

		_self.njMap.getMap().addOverlay( _self.helpTooltip );
	};


	/**
	 * Creates a new measure tooltip
	 * 
	 * @private
	 */
	naji.control.njMapMeasureDefault.prototype.createMeasureTooltip = function() {
		var _self = this._this || this;

		_self.measureTooltipElement = document.createElement( "div" );
		_self.measureTooltipElement.className = "tooltip tooltip-measure";
		_self.measureTooltip = new ol.Overlay( {
			element : _self.measureTooltipElement,
			offset : [ 0, -15 ],
			positioning : "bottom-center"
		} );

		_self.overlays.push( _self.measureTooltip );
		_self.njMap.getMap().addOverlay( _self.measureTooltip );
	};


	/**
	 * Draw Interaction 활성화를 설정한다.
	 * 
	 * @override {naji.control.njMapDrawFeature.prototype.setActive}
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	naji.control.njMapMeasureDefault.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.destroyed ) {
			return false;
		}

		if ( _self.interaction.getActive() === state_ ) {
			return false;
		}

		naji.control.njMapDrawFeature.prototype.setActive.call( this, state_ );

		ol.Observable.unByKey( _self.pointerMoveListener );

		if ( state_ ) {
			_self.createHelpTooltip();
			_self.createMeasureTooltip();

			_self.pointerMoveListener = _self.njMap.getMap().on( "pointermove", _pointerMoveHandler );
		} else {
			if ( _self.helpTooltipElement ) {
				_self.helpTooltipElement.parentNode.removeChild( _self.helpTooltipElement );
			}

			if ( _self.measureTooltipElement ) {
				_self.measureTooltipElement.parentNode.removeChild( _self.measureTooltipElement );
			}
		}


		// Handle pointer move.
		// @param {ol.MapBrowserEvent} evt The event.
		function _pointerMoveHandler(evt) {
			if ( evt.dragging ) {
				return;
			}

			var helpMsg = "측정 시작할 위치 선택";

			if ( _self.sketch ) {
				helpMsg = _self.continueMsg;
			}

			_self.helpTooltipElement.innerHTML = helpMsg;
			_self.helpTooltip.setPosition( evt.coordinate );

			_self.helpTooltipElement.classList.remove( "hidden" );
		}
	};


	/**
	 * 측정한 내용을 지운다.
	 * 
	 * @override {naji.control.njMapDrawFeature.prototype.clear}
	 */
	naji.control.njMapMeasureDefault.prototype.clear = function() {
		var _self = this._this || this;

		naji.control.njMapDrawFeature.prototype.clear.call( this );

		for ( var i in _self.overlays ) {
			_self.njMap.getMap().removeOverlay( _self.overlays[ i ] );
		}
	};


	/**
	 * 컨트롤을 초기화한다.
	 * 
	 * @override {naji.control.njMapDrawFeature.prototype.destroy}
	 */
	naji.control.njMapMeasureDefault.prototype.destroy = function() {
		var _self = this._this || this;

		_self.clear();
		_self.setActive( false );
		_self.destroyed = true;
		_self.njMap.getMap().removeOverlay( _self.helpTooltip );
		ol.Observable.unByKey( _self.pointerMoveListener );
		naji.control.njMapDrawFeature.prototype.destroy.call( this, true );
	};

	/**
	 * 해당 id의 overlay 객체를 가져온다.
	 * 
	 * @param id {String} overlay id.
	 * 
	 */
	naji.control.njMapMeasureDefault.prototype.getOverlay = function(id_) {
		var _self = this._this || this;

		var overlay = null;

		for ( var i in _self.overlays ) {
			if( overlay != null ) break;
			if( _self.overlays[ i ].id == id_ ) overlay = _self.overlays[ i ];
		}

		return overlay;
	};

	/**
	 * 해당 id의 overlay 객체를 제거한다.
	 * 
	 * @param id {String} overlay id.
	 * 
	 */
	naji.control.njMapMeasureDefault.prototype.removeOverlay = function(id_) {
		var _self = this._this || this;

		var overlays = [];

		for ( var i in _self.overlays ) {
			if( _self.overlays[ i ].id != id_ ) overlays.push(_self.overlays[ i ]);
			else _self.njMap.getMap().removeOverlay( _self.overlays[ i ] );
		}

		_self.overlays = overlays;
	};

	/**
	 * 피처를 제거한다.
	 * 
	 * @param feature {ol.Feature} 제거할 피처.
	 * 
	 * @override {naji.control.njMapDrawFeature.prototype.removeFeature}
	 */
	naji.control.njMapMeasureDefault.prototype.removeFeature = function(feature_) {
		var _self = this._this || this;

		naji.control.njMapDrawFeature.prototype.removeFeature.call( this, feature_ );
	};

} )();

( function() {
	"use strict";

	/**
	 * 면적 측정 객체.
	 * 
	 * 마우스로 지도상에서 면적을 측정할 수 있는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapAreaMeasure = new naji.control.njMapAreaMeasure( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-measureArea',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapMeasureDefault}
	 */
	naji.control.njMapAreaMeasure = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};
			
			options.drawType = "Polygon";
			options.useDrawEndDisplay = true;
			
			options.featureStyle = new ol.style.Style( {
				fill : new ol.style.Fill({
					color : "rgba(255, 255, 255, 0.2)"
				}),
				stroke : new ol.style.Stroke( {
					color : "#ffcc33",
					width : 3
				} ),
				image : new ol.style.Circle( {
					radius : 7,
					fill : new ol.style.Fill( {
						color : "#ffcc33"
					} )
				} )
			} );
			
			options.drawingStyle = new ol.style.Style( {
				fill : new ol.style.Fill({
					color : "rgba(255, 255, 255, 0.2)"
				}),
				stroke : new ol.style.Stroke( {
					color : "rgba(0, 0, 0, 0.5)",
					lineDash : [ 10, 10 ],
					width : 2
				} )
			} );
			
			_super = naji.control.njMapMeasureDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );

	
	naji.control.njMapAreaMeasure.prototype = Object.create( naji.control.njMapMeasureDefault.prototype );
	naji.control.njMapAreaMeasure.prototype.constructor = naji.control.njMapAreaMeasure;
	
	
	/**
	 * 초기화
	 * 
	 * @override {naji.control.njMapMeasureDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapAreaMeasure.prototype._init = function() {
		var _self = this._this || this;
		
		naji.control.njMapMeasureDefault.prototype._init.call( this );
		
		_self.continueMsg = "면적 측정";
		
		_self.interaction.on( "drawstart", function(evt) {
			_self.sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.coordinate;

			_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
				var geom = evt.target;
				var output = _self._formatArea( geom );
				tooltipCoord = geom.getInteriorPoint().getCoordinates();

				_self.measureTooltipElement.innerHTML = output;
				_self.measureTooltip.setPosition( tooltipCoord );
			} );
		}, this );

		_self.interaction.on( "drawend", function(evt) {
			var temp = _self.measureTooltip;
			_self.measureTooltipElement.className = "tooltip tooltip-static";
			_self.measureTooltip.setOffset( [ 0, -7 ] );

			var closer = document.createElement( "a" );
			closer.href = "#";
			closer.className = "tooltip-closer";
			closer.onclick = function() {
				_self.njMap.getMap().removeOverlay( temp );
				_self.removeFeature( evt.feature );
				closer.blur();
				return false;
			};

			_self.measureTooltip.id = evt.feature.getId();

			_self.measureTooltipElement.appendChild( closer );

			_self.sketch = null;
			_self.measureTooltipElement = null;
			_self.createMeasureTooltip();

			ol.Observable.unByKey( _self.sketchChangeListener );

			if( _self.useModify ){

				_self.selectInteraction.on("select", function(evt){					
					if( evt.selected[0] ){

						evt.selected[0].setStyle(_self.drawingStyle);

						_self.njMap.getMap().removeOverlay(_self.removeOverlay(evt.selected[0].getId()));						

						_self.continueMsg = "면적 측정";
					
						_self.setActive(true);

						var geom = evt.selected[0].getGeometry();
						var output = _self._formatArea( geom );
						var tooltipCoord = geom.getInteriorPoint().getCoordinates();

						_self.sketch = evt.selected[0];

						_self.measureTooltip.id = evt.selected[0].getId();

						_self.measureTooltipElement.innerHTML = output;
						_self.measureTooltip.setPosition( tooltipCoord );
					}

					if( evt.deselected[0] ){
						evt.deselected[0].setStyle(_self.featureStyle);

						var temp = _self.measureTooltip;
						_self.measureTooltipElement.className = "tooltip tooltip-static";
						_self.measureTooltip.id = evt.deselected[0].getId();
						_self.measureTooltip.setOffset( [ 0, -7 ] );

						var closer = document.createElement( "a" );
						closer.href = "#";
						closer.className = "tooltip-closer";
						closer.onclick = function() {
							_self.njMap.getMap().removeOverlay( temp );
							_self.removeFeature( evt.deselected[0] );
							closer.blur();
							return false;
						};

						_self.measureTooltipElement.appendChild( closer );

						_self.sketch = null;
						_self.measureTooltipElement = null;
						_self.createMeasureTooltip();

						ol.Observable.unByKey( _self.sketchChangeListener );

						_self.interaction.setActive(false);
						_self.interaction.setActive(true);
					}
				});

				_self.modifyInteraction.on("modifystart", function(evt){

					_self.sketch = evt.features.getArray()[0];

					_self.measureTooltip.id = _self.sketch.getId();

					/** @type {ol.Coordinate|undefined} */
					var tooltipCoord = evt.coordinate;

					_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
						var geom = evt.target;
						
						var output = _self._formatArea( geom );
						tooltipCoord = geom.getInteriorPoint().getCoordinates();

						if( _self.measureTooltip && _self.measureTooltipElement ){
							_self.measureTooltipElement.innerHTML = output;
							_self.measureTooltip.setPosition( tooltipCoord );
						}
					} );
				});
				
				_self.modifyInteraction.on('modifyend', function (evt) {
					
					var temp = _self.measureTooltip;
					_self.measureTooltipElement.className = "tooltip tooltip-measure";
					_self.measureTooltip.id = evt.features.getArray()[0].getId();
					_self.measureTooltip.setOffset( [ 0, -7 ] );
					
				});
			}
		}, this );
	}


	/**
	 * Format area output.
	 * 
	 * @param {ol.geom.Polygon} polygon The polygon.
	 * 
	 * @private
	 * 
	 * @return {String} Formatted area.
	 */
	naji.control.njMapAreaMeasure.prototype._formatArea = function(polygon_) {
		var _self = this._this || this;
		
		var area = ol.Sphere.getArea( polygon_, {
			projection : _self.njMap.getCRS()
		} );
		
		var output;
		
		if ( area > 10000 ) {
			output = ( Math.round(area / 1000000 * 100) / 100 ) + " " + "km<sup>2</sup>";
		} else {
			output = ( Math.round(area * 100) / 100 ) + " " + "m<sup>2</sup>";
        }
		
        return output;
	};
	
} )();

( function() {
	"use strict";

	/**
	 * 지도 화면 캡쳐 객체.
	 * 
	 * 지도 화면을 캡쳐하여 이미지로 가져오는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapCapture = new naji.control.njMapCapture( {
	 * 	njMap : new naji.njMap({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapCapture = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setActive : _self.setActive
		} );

	} );


	naji.control.njMapCapture.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapCapture.prototype.constructor = naji.control.njMapCapture;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.control.njMapCapture.prototype._init = function() {
		var _self = this._this || this;
		
		_self.interaction = new ol.interaction.DragPan( {
			kinetic : false
		} );

		_self.interaction.set( "njMapCapture", false );

		_self.interaction.setActive( false );

		naji.control.njMapControlDefault.prototype._init.call( this );
	};

	/**
	 * 현재 화면을 캡쳐한다.
	 * 
	 */
	naji.control.njMapCapture.prototype.setActive = function(state_) {
		var _self = this._this || this;

		document.getElementsByClassName( "ol-overlaycontainer-stopevent" )[0].style.display = "none";
		document.getElementById( "toolbar" ).style.display = "none";

		html2canvas( document.getElementsByClassName( "mapMainDIV" )[0], {
			useCORS : true,
			logging : false,
			proxy : naji.njMapConfig.getProxy()
		} ).then( function(canvas) {
			if ( navigator.msSaveBlob ) {
				navigator.msSaveBlob( canvas.msToBlob(), 'map.png' );
			} else {
				canvas.toBlob( function(blob) {
					saveAs( blob, 'map.png' );                                
				} );
			}
			document.getElementsByClassName( "ol-overlaycontainer-stopevent" )[0].style.display = "";
			document.getElementById( "toolbar" ).style.display = "";
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * 원 면적 측정 객체.
	 * 
	 * 마우스로 지도상에서 원 면적을 측정할 수 있는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapCircleMeasure = new naji.control.njMapCircleMeasure( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-measureArea',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapMeasureDefault}
	 */
	naji.control.njMapCircleMeasure = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};
			
			options.drawType = "Circle";
			options.useDrawEndDisplay = true;
			
			options.featureStyle = new ol.style.Style( {
				fill : new ol.style.Fill({
					color : "rgba(255, 255, 255, 0.2)"
				}),
				stroke : new ol.style.Stroke( {
					color : "#ffcc33",
					width : 3
				} ),
				image : new ol.style.Circle( {
					radius : 7,
					fill : new ol.style.Fill( {
						color : "#ffcc33"
					} )
				} )
			} );
			
			options.drawingStyle = new ol.style.Style( {
				fill : new ol.style.Fill({
					color : "rgba(255, 255, 255, 0.2)"
				}),
				stroke : new ol.style.Stroke( {
					color : "rgba(0, 0, 0, 0.5)",
					lineDash : [ 10, 10 ],
					width : 2
				} )
			} );
			
			_super = naji.control.njMapMeasureDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );

	
	naji.control.njMapCircleMeasure.prototype = Object.create( naji.control.njMapMeasureDefault.prototype );
	naji.control.njMapCircleMeasure.prototype.constructor = naji.control.njMapCircleMeasure;
	
	
	/**
	 * 초기화
	 * 
	 * @override {naji.control.njMapMeasureDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapCircleMeasure.prototype._init = function() {
		var _self = this._this || this;
		
		naji.control.njMapMeasureDefault.prototype._init.call( this );
		
		_self.continueMsg = "원 면적 측정";
		
		_self.interaction.on( "drawstart", function(evt) {
			_self.sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.feature.getGeometry().getCenter();
			_self.measureTooltip.setPosition( tooltipCoord );

			_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
				var geom = evt.target;
				var output = _self._formatArea( geom );

				_self.measureTooltipElement.innerHTML = output;
			} );
		}, this );

		_self.interaction.on( "drawend", function(evt) {
			var temp = _self.measureTooltip;
			_self.measureTooltipElement.className = "tooltip tooltip-static";
			_self.measureTooltip.setOffset( [ 0, -7 ] );

			var closer = document.createElement( "a" );
			closer.href = "#";
			closer.className = "tooltip-closer";
			closer.onclick = function() {
				_self.njMap.getMap().removeOverlay( temp );
				_self.removeFeature( evt.feature );
				closer.blur();
				return false;
			};

			_self.measureTooltipElement.appendChild( closer );

			_self.sketch = null;
			_self.measureTooltipElement = null;
			_self.createMeasureTooltip();

			ol.Observable.unByKey( _self.sketchChangeListener );
		}, this );
	}


	/**
	 * Format area output.
	 * 
	 * @param {ol.geom.Circle} circle The circle.
	 * 
	 * @private
	 * 
	 * @return {String} Formatted area.
	 */
	naji.control.njMapCircleMeasure.prototype._formatArea = function(circle_) {
		var _self = this._this || this;
		
		var sourceProj = _self.njMap.getCRS();
		var c1 = ol.proj.transform( circle_.getFirstCoordinate(), sourceProj, 'EPSG:4326' );
		var c2 = ol.proj.transform( circle_.getLastCoordinate(), sourceProj, 'EPSG:4326' );
		var radius = new ol.Sphere( 6378137 ).haversineDistance( c1, c2 );

		var area = radius * radius * Math.PI;
		
		var output;
		
		if ( area > 10000 ) {
			output = ( Math.round(area / 1000000 * 100) / 100 ) + " " + "km<sup>2</sup>";
		} else {
			output = ( Math.round(area * 100) / 100 ) + " " + "m<sup>2</sup>";
        }
		
        return output;
	};
	
} )();

( function() {
	"use strict";

	/**
	 * 마우스 드래그 팬 객체.
	 * 
	 * 마우스로 지도를 패닝하여 이동하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapDragPan = new naji.control.njMapDragPan( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-default',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapDragPan = ( function(opt_options) {
		var _self = this;
		var _super;

		this.key_pointerup = null;
		this.key_pointerdrag = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

			( typeof ( options.active ) === "boolean" ) && _self.setActive( options.active );

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.control.njMapDragPan.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapDragPan.prototype.constructor = naji.control.njMapDragPan;


	/**
	 * 초기화
	 * 
	 * @overide {naji.control.njMapControlDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapDragPan.prototype._init = function() {
		var _self = this._this || this;

		var olMap = _self.njMap.getMap();

		_self.interaction = new ol.interaction.DragPan( {
			kinetic : false
		} );

		_self.interaction.set( "njMapDragPan", true );

		_self.interaction.setActive( false );

		naji.control.njMapControlDefault.prototype._init.call( this );
	};


	/**
	 * Interaction 활성화를 설정한다.
	 * 
	 * @overide {naji.control.njMapControlDefault.prototype.setActive}
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	naji.control.njMapDragPan.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.interaction.getActive() && state_ === true ) {
			return false;
		}

		naji.control.njMapControlDefault.prototype.setActive.call( this, state_ );

		if ( state_ ) {
			var olMap = _self.njMap.getMap();
			var viewPort = olMap.getViewport();
			var startCenter = olMap.getView().getCenter();

			_self.key_pointerdrag = olMap.on( "pointerdrag", function(evt) {
				var viewCenter = evt.frameState.viewState.center;

				if ( startCenter[ 0 ] !== viewCenter[ 0 ] || startCenter[ 1 ] !== viewCenter[ 1 ] ) {
					viewPort.classList.remove( "cursor-default" );
					viewPort.classList.add( "cursor-closeHand" );
				}
			} );

			_self.key_pointerup = olMap.on( "pointerup", function(evt) {
				viewPort.classList.remove( "cursor-closeHand" );
				viewPort.classList.add( "cursor-default" );
			} );
		} else {
			ol.Observable.unByKey( _self.key_pointerup );
			ol.Observable.unByKey( _self.key_pointerdrag );
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * 마우스 드래그 줌인 객체.
	 * 
	 * 마우스로 드래깅하여 해당 영역으로 확대하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapDragZoomIn = new naji.control.njMapDragZoomIn( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-zoomIn',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapDragZoomIn = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.control.njMapDragZoomIn.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapDragZoomIn.prototype.constructor = naji.control.njMapDragZoomIn;


	/**
	 * 초기화
	 * 
	 * @override {naji.control.njMapControlDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapDragZoomIn.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.DragZoom( {
			condition : ol.events.condition.always,
			duration : 0,
			out : false
		} );

		_self.interaction.setActive( false );

		naji.control.njMapControlDefault.prototype._init.call( this );
	};

} )();

( function() {
	"use strict";

	/**
	 * 마우스 드래그 줌아웃 객체.
	 * 
	 * 마우스로 드래깅하여 해당 영역으로 축소하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapDragZoomOut = new naji.control.njMapDragZoomOut( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-zoomOut',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapDragZoomOut = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.control.njMapDragZoomOut.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapDragZoomOut.prototype.constructor = naji.control.njMapDragZoomOut;


	/**
	 * 초기화
	 * 
	 * @override {naji.control.njMapControlDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapDragZoomOut.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.DragZoom( {
			condition : ol.events.condition.always,
			duration : 0,
			out : true
		} );

		_self.interaction.setActive( false );

		naji.control.njMapControlDefault.prototype._init.call( this );
	};

} )();

( function() {
	"use strict";

	/**
	 * 피처 그리기 객체.
	 * 
	 * 마우스로 다양한 도형을 그리는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapEditor = new naji.control.njMapEditor( {
	 *	njMap : new naji.njMap({...}),
	 *	useSnap : true,
	 *	freehand : false,
	 *	useDragPan : true,
	 *	drawType : 'Polygon',
	 *	cursorCssName : 'cursor-polygon',
	 *	useDrawEndDisplay : true,
	 * 	activeChangeListener : function(state_) {
	 *		console.log( state_ );
	 * 	},
	 *	featureStyle : new ol.style.Style({...}),
	 *	drawingStyle : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @param opt_options.useSnap {Boolean} 스냅 사용 여부. Default is `false`.
	 * @param opt_options.drawType {String} 피처 타입 <Point|LineString|Polygon|Circle|Box>. Default is `LineString`.
	 * @param opt_options.useDrawEndDisplay {Boolean} 피처를 그린 후 해당 피처 Display 여부. Default is `true`.
	 * @param opt_options.featureStyle {ol.style.Style} 피처 스타일.
	 * @param opt_options.drawingStyle {ol.style.Style} drawing 피처 스타일.
	 * @param opt_options.freehand {Boolean} 자유 그리기 사용 여부. Default is `false`.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapEditor = ( function(opt_options) {
		var _self = this;
		var _super;

		this.useSnap = null;
		this.freehand = null;
		this.drawType = null;
		this.featureStyle = null;
		this.drawingStyle = null;
		this.useDrawEndDisplay = null;

		this.vectorLayer = null;
		this.selectPointMoveInteraction = null;
		this.selectInteraction = null;
		this.snapInteraction = null;
		this.dirty = {};

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self.useSnap = ( options.useSnap !== undefined ) ? options.useSnap : false;
			_self.freehand = ( options.freehand !== undefined ) ? options.freehand : false;
			_self.featureStyle = ( options.featureStyle !== undefined ) ? options.featureStyle : undefined;
			_self.drawingStyle = ( options.drawingStyle !== undefined ) ? options.drawingStyle : _self.featureStyle;
			_self.drawType = ( options.drawType !== undefined ) ? options.drawType : "LineString";
			_self.useDrawEndDisplay = ( options.useDrawEndDisplay !== undefined ) ? options.useDrawEndDisplay : true;

			if ( !options.noneInit ) {
				_self._init();
			}

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			getLayer : _self.getLayer,
			getFeatures : _self.getFeatures,
			setFeatures : _self.setFeatures,
			removeFeature : _self.removeFeature
		} );

	} );


	naji.control.njMapEditor.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapEditor.prototype.constructor = naji.control.njMapEditor;


	/**
	 * 초기화
	 * 
	 * @override naji.control.njMapControlDefault.prototype._init
	 * 
	 * @private
	 */
	naji.control.njMapEditor.prototype._init = function() {
		var _self = this._this || this;

		var vectorSource = new ol.source.Vector( {
			wrapX : false
		} );

		_self.vectorLayer = new ol.layer.Vector( {
			zIndex : 9999,
			source : vectorSource,
			style : _self.featureStyle
		} );

		_self.njMap.getMap().addLayer( _self.vectorLayer );

		var type;
		var geometryFunction;
		_self.dirty = {};

		switch ( _self.drawType ) {
			case "Point" :
				type = "Point";
				geometryFunction = null;
				break;
			case "LineString" :
				type = "LineString";
				geometryFunction = null;
				break;
			case "Polygon" :
				type = "Polygon";
				geometryFunction = null;
				break;
			case "Circle" :
				type = "Circle";
				geometryFunction = null;
				break;
			case "Box" :
				type = "Circle";
				geometryFunction = ol.interaction.Draw.createBox();
				break;
			default :
				type = "Polygon";
				geometryFunction = null;
		}
		
		_self.selectPointMoveInteraction = new ol.interaction.Select({
			condition: ol.events.condition.pointerMove
		});

		_self.njMap.getMap().addInteraction( _self.selectPointMoveInteraction );

		_self.selectInteraction = new ol.interaction.Select({
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: '#FF2828'
				})
			})
		});

		_self.njMap.getMap().addInteraction( _self.selectInteraction );

		_self.interaction = new ol.interaction.Modify({
			features: this.selectInteraction.getFeatures()
		});

		_self.interaction.setActive( false );

		_self.selectInteraction.getFeatures().on('add', function (e) {
			e.element.on('change', function (e) {
				_self.dirty[e.target.getId()] = true;
			});
		});
		_self.selectInteraction.getFeatures().on('remove', function (e) {
			var f = e.element;
			if (_self.dirty[f.getId()]) {
				delete _self.dirty[f.getId()];
				var featureProperties = f.getProperties();
				delete featureProperties.boundedBy;
				var clone = new ol.Feature(featureProperties);
				clone.setId(f.getId());
				//transactWFS('update', clone);
			}
		});

		if ( !_self.useDrawEndDisplay ) {
			_self.interaction.on( "drawend", function(evt) {
				setTimeout( function() {
					_self.clear();
				}, 1 );
			}, this );
		}

		naji.control.njMapControlDefault.prototype._init.call( this );

		if ( _self.useSnap ) {
			_self.snapInteraction = new ol.interaction.Snap( {
				source : vectorSource
			} );

			_self.njMap.getMap().addInteraction( _self.snapInteraction );
		}
	};


	/**
	 * 레이어를 가져온다.
	 * 
	 * @return vectorLayer {ol.layer.Vector} Vector Layer.
	 */
	naji.control.njMapEditor.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};

	/**
	 * 피쳐를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} Features.
	 */
	naji.control.njMapEditor.prototype.setFeatures = function( features ) {
		var _self = this._this || this;
		return _self.vectorLayer.getSource().setFeatures( features );
	};

	/**
	 * 피쳐를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} Features.
	 */
	naji.control.njMapEditor.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.vectorLayer.getSource().getFeatures();
	};


	/**
	 * 그려진 도형을 지운다.
	 */
	naji.control.njMapEditor.prototype.clear = function() {
		var _self = this._this || this;
		_self.vectorLayer.getSource().clear();
	};


	/**
	 * 피처를 제거한다.
	 * 
	 * @param feature {ol.Feature} 제거할 피처.
	 */
	naji.control.njMapEditor.prototype.removeFeature = function(feature_) {
		var _self = this._this || this;
		_self.vectorLayer.getSource().removeFeature( feature_ );
	};


	/**
	 * 컨트롤을 초기화한다.
	 * 
	 * @override {naji.control.njMapControlDefault.prototype.destroy}
	 * 
	 * @param clearFeature {Boolean} 그려진 도형 제거 여부.
	 */
	naji.control.njMapEditor.prototype.destroy = function(clearFeature_) {
		var _self = this._this || this;

		naji.control.njMapControlDefault.prototype.destroy.call( this );

		_self.njMap.getMap().removeInteraction( _self.selectPointMoveInteraction );

		_self.njMap.getMap().removeInteraction( _self.selectInteraction );

		_self.njMap.getMap().removeInteraction( _self.snapInteraction );

		if ( clearFeature_ ) {
			_self.njMap.getMap().removeLayer( _self.vectorLayer );
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * 길이 측정 객체.
	 * 
	 * 마우스로 지도상에서 거리를 측정할 수 있는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapLengthMeasure = new naji.control.njMapLengthMeasure( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-measureDistance',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapMeasureDefault}
	 */
	naji.control.njMapLengthMeasure = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.drawType = "LineString";
			options.useDrawEndDisplay = true;
			
			options.featureStyle = new ol.style.Style( {
				stroke : new ol.style.Stroke( {
					color : "#ffcc33",
					width : 3
				} ),
				image : new ol.style.Circle( {
					radius : 7,
					fill : new ol.style.Fill( {
						color : "#ffcc33"
					} )
				} )
			} );
			
			options.drawingStyle = new ol.style.Style( {
				stroke : new ol.style.Stroke( {
					color : "rgba(0, 0, 0, 0.5)",
					lineDash : [ 10, 10 ],
					width : 2
				} )
			} );
			
			_super = naji.control.njMapMeasureDefault.call( _self, options );

			_self._init();
			
		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );

	
	naji.control.njMapLengthMeasure.prototype = Object.create( naji.control.njMapMeasureDefault.prototype );
	naji.control.njMapLengthMeasure.prototype.constructor = naji.control.njMapLengthMeasure;
	
	
	/**
	 * 초기화
	 * 
	 * @override {naji.control.njMapMeasureDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapLengthMeasure.prototype._init = function() {
		var _self = this._this || this;
		
		naji.control.njMapMeasureDefault.prototype._init.call( this );
		
		_self.continueMsg = "길이 측정";
		
		_self.interaction.on( "drawstart", function(evt) {
			_self.sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.coordinate;

			_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
				var geom = evt.target;
				var output = _self._formatLength( geom );
				tooltipCoord = geom.getLastCoordinate();

				_self.measureTooltipElement.innerHTML = output;
				_self.measureTooltip.setPosition( tooltipCoord );
			} );

		}, this );

		_self.interaction.on( "drawend", function(evt) {
			var temp = _self.measureTooltip;
			_self.measureTooltipElement.className = "tooltip tooltip-static";
			_self.measureTooltip.setOffset( [ 0, -7 ] );

			var closer = document.createElement( "a" );
			closer.href = "#";
			closer.className = "tooltip-closer";
			closer.onclick = function() {
				_self.njMap.getMap().removeOverlay( temp );
				_self.removeFeature( evt.feature );
				closer.blur();
				return false;
			};
			
			_self.measureTooltip.id = evt.feature.getId();

			_self.measureTooltipElement.appendChild( closer );

			_self.sketch = null;
			_self.measureTooltipElement = null;
			_self.createMeasureTooltip();

			ol.Observable.unByKey( _self.sketchChangeListener );

			if( _self.useModify ){

				_self.selectInteraction.on("select", function(evt){					
					if( evt.selected[0] ){

						evt.selected[0].setStyle(_self.drawingStyle);

						_self.njMap.getMap().removeOverlay(_self.removeOverlay(evt.selected[0].getId()));						

						_self.continueMsg = "길이 측정";
					
						_self.setActive(true);

						var geom = evt.selected[0].getGeometry();
						var output = _self._formatLength( geom );
						var tooltipCoord = geom.getLastCoordinate();

						_self.sketch = evt.selected[0];

						_self.measureTooltip.id = evt.selected[0].getId();

						_self.measureTooltipElement.innerHTML = output;
						_self.measureTooltip.setPosition( tooltipCoord );
					}

					if( evt.deselected[0] ){
						evt.deselected[0].setStyle(_self.featureStyle);

						var temp = _self.measureTooltip;
						_self.measureTooltipElement.className = "tooltip tooltip-static";
						_self.measureTooltip.id = evt.deselected[0].getId();
						_self.measureTooltip.setOffset( [ 0, -7 ] );

						var closer = document.createElement( "a" );
						closer.href = "#";
						closer.className = "tooltip-closer";
						closer.onclick = function() {
							_self.njMap.getMap().removeOverlay( temp );
							_self.removeFeature( evt.deselected[0] );
							closer.blur();
							return false;
						};

						_self.measureTooltipElement.appendChild( closer );

						_self.sketch = null;
						_self.measureTooltipElement = null;
						_self.createMeasureTooltip();

						ol.Observable.unByKey( _self.sketchChangeListener );

						_self.interaction.setActive(false);
						_self.interaction.setActive(true);
					}
				});

				_self.modifyInteraction.on("modifystart", function(evt){

					_self.sketch = evt.features.getArray()[0];

					_self.measureTooltip.id = _self.sketch.getId();

					/** @type {ol.Coordinate|undefined} */
					var tooltipCoord = evt.coordinate;

					_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
						var geom = evt.target;
						
						var output = _self._formatLength( geom );

						tooltipCoord = geom.getLastCoordinate();

						if( _self.measureTooltip && _self.measureTooltipElement ){
							_self.measureTooltipElement.innerHTML = output;
							_self.measureTooltip.setPosition( tooltipCoord );
						}
					} );
				});
				
				_self.modifyInteraction.on('modifyend', function (evt) {
					
					var temp = _self.measureTooltip;
					_self.measureTooltipElement.className = "tooltip tooltip-measure";
					_self.measureTooltip.id = evt.features.getArray()[0].getId();
					_self.measureTooltip.setOffset( [ 0, -7 ] );
					
				});
			}

		}, this );
	};


	/**
	 * Format length output.
	 * 
	 * @param {ol.geom.LineString} line The line.
	 * 
	 * @private
	 * 
	 * @return {String} The formatted length.
	 */
	naji.control.njMapLengthMeasure.prototype._formatLength = function(line_) {
		var _self = this._this || this;
		
		var length = ol.Sphere.getLength( line_, {
			projection : _self.njMap.getCRS()
		} );
		
        var output;
        
        if ( length > 100 ) {
    		output = ( Math.round(length / 1000 * 100) / 100 ) + " " + "km";
        } else {
        	output = ( Math.round(length * 100) / 100 ) + " " + "m";
        }
        
        return output;
	};
	
} )();

( function() {
	"use strict";

	/**
	 * 현재 내 위치로 이동 객체.
	 * 
	 * 현재 위치한 좌표를 가져와 해당 좌표로 이동하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapLocation = new naji.control.njMapLocation( {
	 * 	njMap : new naji.njMap({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapLocation = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self,
			setActive : _self.setActive
		} );

	} );


	naji.control.njMapLocation.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapLocation.prototype.constructor = naji.control.njMapLocation;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.control.njMapLocation.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.DragPan( {
			kinetic : false
		} );

		_self.interaction.set( "njMapLocation", false );

		_self.interaction.setActive( false );

		naji.control.njMapControlDefault.prototype._init.call( this );
	};

	/**
	 * 내 위치 활성화 지역으로 이동한다.
	 * 
	 */
	naji.control.njMapLocation.prototype.setActive = function(state_) {
		var _self = this._this || this;

		// 위치를 가져오는데 성공할 경우
		var successFunc = function(position) {
			njMap.getMap().getView().setCenter(ol.proj.transform([position.coords.longitude, position.coords.latitude], "EPSG:4326", njMap.getCRS()));
			njMap.getMap().getView().setZoom( 15 );

			//_self.interaction.set( "njMapDragPan", true );
		};

		// 위치를 가져오는데 실패한 경우
		var errorFunc = function(error) {
			console.log( error.message );
		};

		if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successFunc, errorFunc);
        } else {
			naji.njMapConfig.alert_Error( "Geolocation을 지원하지 않는 브라우저 입니다." );
        }
	};

} )();

( function() {
	"use strict";

	/**
	 * 지도 마우스 클릭 객체.
	 * 
	 * 마우스로 지도를 클릭하여 좌표를 가져오는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapClick = new naji.control.njMapClick( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-identify',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapClick = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.control.njMapClick.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapClick.prototype.constructor = naji.control.njMapClick;


	/**
	 * 초기화
	 * 
	 * @overide {naji.control.njMapControlDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapClick.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.Interaction( {
			handleEvent : _handleEvent
		} );

		_self.interaction.setActive( false );


		function _handleEvent(mapBrowserEvent) {
			var stopEvent = false;
			var browserEvent = mapBrowserEvent.originalEvent;

			if ( mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK ) {
				var map = mapBrowserEvent.map;

				mapBrowserEvent.preventDefault();
				stopEvent = true;

				_self.interaction.dispatchEvent( {
					type : 'singleClick',
					coordinate : mapBrowserEvent.coordinate
				} );
			}

			return !stopEvent;
		}

		naji.control.njMapControlDefault.prototype._init.call( this );
	};

} )();

( function() {
	"use strict";

	/**
	 * 마우스 드래그 팬 객체.
	 * 
	 * 마우스로 지도를 패닝하여 이동하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapMousePosition = new naji.control.njMapMousePosition( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-default',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {naji.control.njMapControlDefault}
	 */
	naji.control.njMapMousePosition = ( function(opt_options) {
		var _self = this;
		var _super;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = naji.control.njMapControlDefault.call( _self, options );

			_self._init();

			( typeof ( options.active ) === "boolean" ) && _self.setActive( options.active );

		} )();
		// END initialize


		return naji.util.njMapUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	naji.control.njMapMousePosition.prototype = Object.create( naji.control.njMapControlDefault.prototype );
	naji.control.njMapMousePosition.prototype.constructor = naji.control.njMapMousePosition;


	/**
	 * 초기화
	 * 
	 * @overide {naji.control.njMapControlDefault.prototype._init}
	 * 
	 * @private
	 */
	naji.control.njMapMousePosition.prototype._init = function() {
		var _self = this._this || this;

		var olMap = _self.njMap.getMap();

		_self.interaction = new ol.interaction.DragPan( {
			kinetic : false
		} );

		_self.interaction.set( "njMapMousePosition", true );

		_self.interaction.setActive( false );

		naji.control.njMapControlDefault.prototype._init.call( this );
	};


	/**
	 * Interaction 활성화를 설정한다.
	 * 
	 * @overide {naji.control.njMapControlDefault.prototype.setActive}
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	naji.control.njMapMousePosition.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.interaction.getActive() && state_ === true ) {
			return false;
		}

		naji.control.njMapControlDefault.prototype.setActive.call( this, state_ );

		if ( state_ ) {
			var olMap = _self.njMap.getMap();
			var viewPort = olMap.getViewport();
			var startCenter = olMap.getView().getCenter();

			_self.key_pointerdrag = olMap.on( "pointerdrag", function(evt) {
				var viewCenter = evt.frameState.viewState.center;

				if ( startCenter[ 0 ] !== viewCenter[ 0 ] || startCenter[ 1 ] !== viewCenter[ 1 ] ) {
					viewPort.classList.remove( "cursor-default" );
					viewPort.classList.add( "cursor-closeHand" );
				}
			} );

			_self.key_pointerup = olMap.on( "pointerup", function(evt) {
				viewPort.classList.remove( "cursor-closeHand" );
				viewPort.classList.add( "cursor-default" );
			} );
		} else {
			ol.Observable.unByKey( _self.key_pointerup );
			ol.Observable.unByKey( _self.key_pointerdrag );
		}
	};

} )();

/**
 * @namespace naji.manager
 */

( function() {
	"use strict";

	/**
	 * 지도상에서 마우스와 상호작용하는 컨트롤을 관리하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapControlManager = new naji.manager.njMapControlManager( {
	 * 	njMap : new naji.njMap({...}),
	 * 	controls : [ new naji.control.njMapDragPan({...}), new naji.control.njMapDrawFeature({...}) ]
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * 
	 * @class
	 */
	naji.manager.njMapControlManager = ( function(opt_options) {
		var _self = this;

		this.njMap = null;

		this.activeControl = null;
		this.njMapContrlObjects = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.njMapContrlObjects = {};
			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			_self._init( options.controls );

		} )();
		// END initialize


		return {
			_this : _self,
			get : _self.get,
			add : _self.add
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.manager.njMapControlManager.prototype._init = function(controls_) {
		var _self = this._this || this;

		if ( Array.isArray( controls_ ) ) {
			for ( var i in controls_ ) {
				_self.add( controls_[ i ] );
			}
		}
	};


	/**
	 * 컨트롤 객체를 추가한다.
	 * 
	 * -컨트롤은 키로 관리한다.
	 * 
	 * @param njMapControl {naji.control} {@link naji.control naji.control} 객체.
	 */
	naji.manager.njMapControlManager.prototype.add = function(njMapControl_) {
		var _self = this._this || this;

		if ( !( njMapControl_._this instanceof naji.control.njMapControlDefault ) ) {
			return false;
		}

		if ( njMapControl_.getActive() ) {
			_self.activeControl = njMapControl_;
		}


		function _setActive(state_) {
			if ( njMapControl_.getInteraction().getActive() && state_ === true ) {
				return false;
			}

			if ( state_ ) {
				if ( _self.activeControl ) {
					_self.activeControl.setActive( false );
				}

				_self.activeControl = njMapControl_;
			}

			njMapControl_._this.setActive( state_ );
		}

		njMapControl_.setActive = _setActive;

		_self.njMapContrlObjects[ njMapControl_.getControlKey() ] = njMapControl_;
	};


	/**
	 * 컨트롤 키에 해당하는 컨트롤 객체를 가져온다.
	 * 
	 * @param controlKey {String} 컨트롤 키.
	 * 
	 * @return njMapControl {naji.control} {@link naji.control naji.control} 객체.
	 */
	naji.manager.njMapControlManager.prototype.get = function(controlKey_) {
		var _self = this._this || this;
		return _self.njMapContrlObjects[ controlKey_ ];
	};

	/**
	 * 컨트롤의 Feature 데이터를 초기화 한다.
	 * 
	 * @param controlKey {String} 컨트롤 키.
	 * 
	 */
	naji.manager.njMapControlManager.prototype.clearFeature = function(controlKey_) {
		var _self = this._this || this;

		if( controlKey_ !== undefined ) {
			var control = _self.njMapContrlObjects[ controlKey_ ];
			if( control.clear !== undefined ) control.clear();
		}else{
			for( var i in _self.njMapContrlObjects ){
				var control = _self.njMapContrlObjects[ controlKey_ ];
				if( control.clear !== undefined ) control.clear();
			}
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * 레이어 및 TOC를 관리하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapLayerManager = new naji.manager.njMapLayerManager( {
	 * 	njMap : new naji.njMap({...}),
	 * 	useMinMaxZoom : true
	 * } );
	 * </pre>
	 * 
	 * @param njMap {naji.njMap} {@link naji.njMap} 객체.
	 * @param useMinMaxZoom {Boolean} MinZoom, MaxZoom 사용 여부. Default is `true`.
	 * 
	 * @class
	 */
	naji.manager.njMapLayerManager = ( function(opt_options) {
		var _self = this;

		this.njMap = null;
		this.useMinMaxZoom = null;

		this.njMapLayerNTocObjects = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;
			_self.useMinMaxZoom = ( options.useMinMaxZoom !== undefined ) ? options.useMinMaxZoom : true;

			_self.njMapLayerNTocObjects = {};

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			if ( _self.useMinMaxZoom ) {
				_self._activeMinMaxZoom();
			}

		} )();
		// END initialize


		return {
			_this : _self,
			get : _self.get,
			add : _self.add,
			getAll : _self.getAll,
			remove : _self.remove,
			getnjMap : _self.getnjMap,
			scaleVisibleRefresh : _self._scaleVisibleRefresh
		}

	} );


	/**
	 * MinZoom, MaxZoom 설정 사용
	 * 
	 * @private
	 */
	naji.manager.njMapLayerManager.prototype._activeMinMaxZoom = function() {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var tempZoomEnd = null;

		_self.njMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			_self.key_changeResolution = evt1_.target.getView().on( "change:resolution", function(evt_) {
				_self._scaleVisibleRefresh();
			} );
		} );

		_self.key_changeResolution = _self.njMap.getMap().getView().on( "change:resolution", function(evt_) {
			_self._scaleVisibleRefresh();
		} );
	};


	/**
	 * 레이어 및 TOC 객체를 추가한다. (레이어 키로 관리)
	 * 
	 * @param njMapLayer {naji.layer} {@link naji.layer} 객체.
	 * @param njMapToc {naji.toc} {@link naji.toc} 객체.
	 */
	naji.manager.njMapLayerManager.prototype.add = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var njMapLayer = ( options.njMapLayer !== undefined ) ? options.njMapLayer : undefined;
		var njMapToc = ( options.njMapToc !== undefined ) ? options.njMapToc : undefined;

		var layerKey = njMapLayer.getLayerKey();

		var zoomChangeListenerKey;

		if ( _self.useMinMaxZoom ) {
			zoomChangeListenerKey = njMapLayer.getOlLayer().on( "change:zoom", function(e_) {
				var targetView = _self.njMap.getMap().getView();

				if ( ( njMapLayer.getMinZoom() <= targetView.getZoom() ) && ( targetView.getZoom() <= njMapLayer.getMaxZoom() ) ) {
					njMapLayer.setScaleVisible( true );
				} else {
					njMapLayer.setScaleVisible( false );
				}
			} );
		}

		_self.njMapLayerNTocObjects[ layerKey ] = {
			zoomChangeListenerKey : zoomChangeListenerKey,
			njMapLayer : njMapLayer,
			njMapToc : njMapToc
		};

		_self._scaleVisibleRefresh();
	};


	/**
	 * 레이어 키에 해당하는 레이어, TOC 객체를 가져온다.
	 * 
	 * @param layerKey {String} 레이어 키.
	 * 
	 * @return njMapLayerNTocObject {Object}
	 */
	naji.manager.njMapLayerManager.prototype.get = function(layerKey_) {
		var _self = this._this || this;
		return _self.njMapLayerNTocObjects[ layerKey_ ];
	};


	/**
	 * 레이어, TOC 객체 리스트를 가져온다.
	 * 
	 * @param all {Boolean} 모든 객체 리스트를 가져올지 여부를 설정한다.
	 * 
	 * `false`면 {@link naji.layer} 객체 리스트만 가져온다.
	 * 
	 * @return njMapLayerNTocObject {Object}
	 */
	naji.manager.njMapLayerManager.prototype.getAll = function(all_) {
		var _self = this._this || this;

		var list = [];

		for ( var key in _self.njMapLayerNTocObjects ) {
			if ( _self.njMapLayerNTocObjects.hasOwnProperty( key ) ) {
				if ( all_ ) {
					list.push( _self.njMapLayerNTocObjects[ key ] );
				} else {
					list.push( _self.njMapLayerNTocObjects[ key ][ "njMapLayer" ] );
				}
			}
		}

		return list;
	};


	/**
	 * 레이어 키에 해당하는 레이어, TOC 객체를 제거한다.
	 * 
	 * @param layerKey {String} 레이어 키.
	 */
	naji.manager.njMapLayerManager.prototype.remove = function(layerKey_) {
		var _self = this._this || this;

		var object = _self.njMapLayerNTocObjects[ layerKey_ ];

		_self.njMap.removeLayer( layerKey_ );

		if ( object.njMapToc ) {
			object.njMapToc.remove();
		}

		if ( object.zoomChangeListenerKey ) {
			ol.Observable.unByKey( object.zoomChangeListenerKey );
		}

		delete _self.njMapLayerNTocObjects[ layerKey_ ];
	};


	/**
	 * njMap 객체를 가져온다.
	 * 
	 * @return njMap {naji.njMap} {@link naji.njMap} 객체.
	 */
	naji.manager.njMapLayerManager.prototype.getnjMap = function() {
		var _self = this._this || this;
		return _self.njMap;
	};


	/**
	 * 스케일 visible 새로고침.
	 * 
	 * @private
	 */
	naji.manager.njMapLayerManager.prototype._scaleVisibleRefresh = function() {
		var _self = this._this || this;

		var targetView = _self.njMap.getMap().getView();

		for ( var key in _self.njMapLayerNTocObjects ) {
			if ( _self.njMapLayerNTocObjects.hasOwnProperty( key ) ) {
				var njMapLayer = _self.njMapLayerNTocObjects[ key ][ "njMapLayer" ];

				if ( ( njMapLayer.getMinZoom() <= targetView.getZoom() ) && ( targetView.getZoom() <= njMapLayer.getMaxZoom() ) ) {
					njMapLayer.setScaleVisible( true );
				} else {
					njMapLayer.setScaleVisible( false );
				}
			}
		}
	};

} )();

/**
 * @namespace naji.manager
 */

( function() {
	"use strict";

	/**
	 * 지도상에서 마우스와 상호작용하는 컨트롤을 관리하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var njMapUIControlManager = new naji.manager.njMapUIControlManager( {
	 * 	njMap : new naji.njMap({...}),
	 * 	controls : [ new naji.control.njMapDrawFeature({...}) ]
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.njMap {naji.njMap} {@link naji.njMap} 객체.
	 * 
	 * @class
	 */
	naji.manager.njMapUIControlManager = ( function(opt_options) {
		var _self = this;

		this.njMap = null;

		this.defaultControl = null;

		this.activeControl = null;
		this.njMapUIContrlObjects = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.defaultControl = opt_options.defaultControl;

			_self.njMapUIContrlObjects = {};
			_self.njMap = ( options.njMap !== undefined ) ? options.njMap : undefined;

			if ( !_self.njMap ) {
				naji.njMapConfig.alert_Error( "njMap undefined" );
				return false;
			}

			_self._init( options.target, options.controls, options.expendTools );

		} )();
		// END initialize


		return {
			_this : _self,
			get : _self.get,
			add : _self.add
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	naji.manager.njMapUIControlManager.prototype._init = function(target_, controls_, extendTools_) {
		var _self = this._this || this;

		if ( Array.isArray( controls_ ) ) {
			for ( var i in controls_ ) {
				_self.add( target_, controls_[ i ] );
			}
		}

		if( extendTools_ !== undefined ){
			if ( Array.isArray( extendTools_.controls ) ) {
				var element = document.createElement( "div" );
				element.id = "extendedToolbarButton";
				element.title = "Toggle extended toolbar";

				var toggleEvent = function( e_ ){
					if( this.className == "" ){
						this.className = "on";
						this.nextSibling.className = "on";
					}else{
						this.className = "";
						this.nextSibling.className = "";
					}
				};

				element.addEventListener("click", toggleEvent);

				document.getElementById( target_ ).appendChild( element );

				var extendedToolbarElement = document.createElement("div");
				extendedToolbarElement.id = extendTools_.target;

				document.getElementById( target_ ).appendChild( extendedToolbarElement );

				for ( var i in extendTools_.controls ) {
					_self.add( extendTools_.target, extendTools_.controls[ i ] );
				}

				var initializeElement = document.createElement( "div" );
				initializeElement.id = "initializeButton";
				initializeElement.title = "initialize";

				var initializeEvent = function( e_ ){
					for( var i in _self.njMapUIContrlObjects ){
						var control = _self.njMapUIContrlObjects[ i ];
						if( control.clear !== undefined ) control.clear();

						_self.njMapUIContrlObjects[i].getElement().className = "";
					}
					_self.activeControl = null;
					_self.defaultControl.setActive( true );
				};

				initializeElement.addEventListener("click", initializeEvent);
				document.getElementById( target_ ).appendChild( initializeElement );
			}
		}
	};


	/**
	 * 컨트롤 객체를 추가한다.
	 * 
	 * -컨트롤은 키로 관리한다.
	 * 
	 * @param njMapControl {naji.control} {@link naji.control naji.control} 객체.
	 */
	naji.manager.njMapUIControlManager.prototype.add = function(target_, njMapControl_) {
		var _self = this._this || this;

		if ( !( njMapControl_._this instanceof naji.control.njMapControlDefault ) ) {
			return false;
		}

		var element = njMapControl_._this.getElement();
		element.njMapUIContrlObjectId = njMapControl_.getControlKey();

		if( !element ) return false;

		var elementEventListener = function(e_){
			var uiControl = _self.get(e_.currentTarget.njMapUIContrlObjectId);
			if ( e_.currentTarget.eventType === "none" ){
				uiControl.setActive( false );
				_self.activeControl = null;
				_self.defaultControl.setActive( true );
			}else{

				if( _self.activeControl !== null ){
					//_self.activeControl.setActive( false );
					_self.defaultControl.setActive( true );
				}

				if( uiControl == _self.activeControl ){
					//_self.activeControl.setActive( false );
					_self.activeControl = null;
					_self.defaultControl.setActive( true );
				}else{
					_self.activeControl = uiControl;
					_self.activeControl.setActive( true );
				}

				for( var i in _self.njMapUIContrlObjects ){
					_self.njMapUIContrlObjects[i].getElement().className = "";

					if( _self.activeControl !== null ){
						if( _self.njMapUIContrlObjects[i].getElement().njMapUIContrlObjectId == _self.activeControl.getElement().njMapUIContrlObjectId ){
							_self.njMapUIContrlObjects[i].getElement().className = "on";
						}
					}
				}
			}
		};

		element.addEventListener("click", elementEventListener);

		var targetElement = ( target_ !== undefined ) ? document.getElementById( target_ ) : document.getElementById( "toolbar" );

		targetElement.appendChild( element );

		_self.njMapUIContrlObjects[ njMapControl_.getControlKey() ] = njMapControl_;
	};


	/**
	 * 컨트롤 키에 해당하는 컨트롤 객체를 가져온다.
	 * 
	 * @param controlKey {String} 컨트롤 키.
	 * 
	 * @return njMapControl {naji.control} {@link naji.control naji.control} 객체.
	 */
	naji.manager.njMapUIControlManager.prototype.get = function(controlKey_) {
		var _self = this._this || this;
		return _self.njMapUIContrlObjects[ controlKey_ ];
	};

} )();
