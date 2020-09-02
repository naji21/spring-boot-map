<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>njMap</title>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
	
	<!-- #FAVICONS -->
	<!-- 
	<link rel="shortcut icon" href="resources/favicon.ico" type="image/x-icon">
	<link rel="icon" href="resources/favicon.ico" type="image/x-icon">
	 -->
	
	<!-- properties Script Load-->
	<!-- 
	<script src="js/properties.js"></script>
	-->
	
	<!-- jQuery Script, CSS Load -->
	<link href="lib/jQueryUI-v1.11.2/jquery-ui.min.css" rel="stylesheet">
	<script src="lib/jQuery-v3.2.1/jquery-3.2.1.min.js"></script>
	<script src="lib/jQueryUI-v1.11.2/jquery-ui.js"></script>	
	<script src="lib/jquery.bootpag.min.js"></script>
	<script src="lib/jquery.nestable.min.js"></script>
	
	<script src="lib/jQueryFileUpload/vendor/jquery.ui.widget.js"></script>
	<script src="lib/jQueryFileUpload/jquery.iframe-transport.js"></script>
	<script src="lib/jQueryFileUpload/jquery.fileupload.js"></script>
	<script src="lib/jQueryFileUpload/jquery.fileupload-ui.js"></script>
	<script src="lib/jQueryFileUpload/jquery.fileupload-process.js"></script>
	
	<!-- BootStrap Script, CSS Load -->
	<link href="lib/bootstrap-v3.3.5/bootstrap.min.css" rel="stylesheet">
	<script src="lib/bootstrap-v3.3.5/bootstrap.min.js"></script>
	
	<link href="lib/jQueryFileUpload/css/jquery.fileupload.css" rel="stylesheet">
	<link href="lib/jQueryFileUpload/css/jquery.fileupload-ui.css" rel="stylesheet">
	
	<!-- font awesome CSS Load -->
    <link rel="stylesheet" type="text/css" href="lib/font-awesome/font-awesome.min.css">
	
	<!-- lodash js Load -->
	<script src="lib/lodash/lodash.min.js"></script>
	
	<!-- Cesium 3D MAP -->	
	<script src="lib/cesium/Cesium.js"></script>
	<!-- /Cesium 3D MAP -->
	
	<!-- OpenLayers3 Script, CSS Load -->
	<link href="lib/openLayers3-v4.6.5/ol.css" rel="stylesheet">
	<script src="lib/openLayers3-v4.6.5/ol-debug.js"></script>
	<!-- <script src="lib/openLayers3-v4.6.5/ol.min.js"></script> -->
	<link rel="stylesheet" type="text/css" href="lib/ol-cesium/olcs.css">
	<script src="lib/ol-cesium/olcesium.js"></script>
	
	<!-- Openalyers3 Ext Script, CSS Load -->
	<link href="lib/openLayers3-v4.6.5/ol-ext.css" rel="stylesheet">
	<script src="lib/openLayers3-v4.6.5/ol-ext.js"></script>

	<!-- Geocoder -->
	<link rel="stylesheet" type="text/css" href="lib/geocoder/ol3-geocoder.css" >
	<!-- <script src="js/njMapsPlatformScript-debug.js"></script> -->
	<script src="lib/geocoder/ol3-geocoder-debug.js"></script>
	<script src="lib/geocoder/ol3-geolocation.js"></script>	
    
	<!-- CustomIcon CSS Load -->
	<link rel="stylesheet" type="text/css" href="css/map/customIcon.css">
	
	<script src="lib/proj4/proj4.js"></script>
	<script src="lib/EPSG.js"></script>
	<script src="lib/EPSG_setExtent.js"></script>
	<script src="lib/EPSG_custom.js"></script>
	
	<!-- njMapsPlatForm Script, CSS Load-->
	<link href="css/njMapCSS.css" rel="stylesheet">
	<!-- <script src="js/njMapsPlatformScript.js"></script> -->
	<!-- <script src="js/njMapsPlatformScript-debug.js"></script> -->
	<script src="js/njMap/njMapsPlatformScript.min.js"></script>
	
	<!-- Openlayers3 Custom CSS Load -->	
	<link rel="stylesheet" type="text/css" href="css/map/ol3-custom-controller.css" >
	<link rel="stylesheet" type="text/css" href="css/map/ol3-custom-popup.css" >
    
    <!-- Smartadmin CSS Load -->
    <link rel="stylesheet" type="text/css" href="css/map/smartadmin-production-plugins.min.css">
	<link rel="stylesheet" type="text/css" href="css/map/smartadmin-production.min.css">
	
	<!-- Map Icon CSS Load -->	
    <link rel="stylesheet" type="text/css" href="css/map/mapStudio-icon.css">
	
	<!-- BaseMap API Key Script Load -->
	<!-- ★ Required when using BaseMap ★ -->
	<script src="lib/OpenLayers2.13.js"></script>
	<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=51585941a159119e7e794472451c5a45&libraries=services"></script>
	<script src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=g46w748sjd&amp;submodules=panorama,geocoder,drawing,visualization"></script>
	<script src="http://map.ngii.go.kr/openapi/ngiiMap.js?apikey=BE45C5F6FC53B39B751EBB5B28B06EAB"></script>
	<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDuTiBLO4pGc3kbYJf-3qHJSZhnZBdXfpw"></script>
	<script src="http://map.vworld.kr/js/apis.do?type=Base&apiKey=C1F649CB-3C34-343C-B6D6-6C97BE17DCAD&domain=http://localhost:8080"></script>
	<!-- <script src="http://map.vworld.kr/js/vworldMapInit.js.do?version=wBeta&apiKey=C1F649CB-3C34-343C-B6D6-6C97BE17DCAD&domain=http://localhost:8080"></script> -->
	<script>
		window.API_KEY_BING = "AkoPAT2pQ_S1OYqnoKYiWIpBsDqeSmpwDZSOKE68EcnHGt1Wfp0u2dkzuee9tfS8";
	</script>
	
	<!-- ★ Required when using njMapCapture ★ -->
	<script src="lib/html2canvas.js"></script>
	<script src="lib/html2canvas-etc.js"></script>
	<script src="lib/html2canvas-google.js"></script>
	<script src="lib/es6-promise.auto.min.js"></script>
	<script src="lib/FileSaver.min.js"></script>
	
	<script src="lib/ion-slider/ion.rangeSlider.min.js" ></script>
	<!-- <script src="lib/echarts/echarts-all.js"></script> -->
	<!-- <script src="lib/dom-to-image/dom-to-image.min.js"></script> -->
	
	<!-- 
	<script src="lib/jscolor-2.0.5/jscolor.js"></script>
	-->
	<!-- 
	<link rel="stylesheet" href="lib/jqueryColor/css/colorpicker.css" type="text/css" />
    <link rel="stylesheet" media="screen" type="text/css" href="lib/jqueryColor/css/layout.css" />
	<script type="text/javascript" src="lib/jqueryColor/colorpicker.js"></script>
    <script type="text/javascript" src="lib/jqueryColor/eye.js"></script>
    <script type="text/javascript" src="lib/jqueryColor/utils.js"></script>
    <script type="text/javascript" src="lib/jqueryColor/layout.js?ver=1.0.2"></script>
	 -->

	<!-- 
	<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.bundle.min.js"></script>
	<link rel="stylesheet" media="screen" type="text/css" href="lib/bootstrap-colorpicker/bootstrap-colorpicker.css" />
	<script type="text/javascript" src="lib/bootstrap-colorpicker/bootstrap-colorpicker.js"></script>
	-->
	<!-- 
	<link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-colorpicker/2.5.3/css/bootstrap-colorpicker.css" rel="stylesheet">
	<script src="//cdn.rawgit.com/twbs/bootstrap/v4.1.3/dist/js/bootstrap.bundle.min.js"></script>
  	<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-colorpicker/2.5.3/js/bootstrap-colorpicker.js"></script>
  	-->
  	<link href="lib/evoluteur-colorpicker/evol-colorpicker.min.css" rel="stylesheet">
	<script src="lib/evoluteur-colorpicker/evol-colorpicker.min.js"></script>
  
	<!-- Map Overlay Script, CSS Load -->
	<link rel="stylesheet" type="text/css" href="css/map/mapOverlay.css">
	<script src="js/map/mapOverlay.js"></script>
	
	<link rel="stylesheet" type="text/css" media="print" href="css/map/print_style.css">
	
	<!-- <link rel="stylesheet" type="text/css" href="css/map/mapApp.css"> -->
	
	
	<!-- <script src="js/map/mapWidget.js"></script> -->
	
	<script src="js/map/message.js"></script>
    <script src="js/map/util.js"></script>

	<!-- XML Util -->
	<!-- <script src="/msp/resources/map/js/util/JS_Util.js"></script> -->
	<!-- <script src="/msp/resources/map/js/util/vkbeautify.js"></script> -->
	
	<!-- OpenLayers Customize js -->
	<script src="js/map/ol3-custom-popup.js"></script>
	
	<!-- Map Module -->
	<script src="js/map/mapModule.js"></script>
	
	<!-- Style Module -->
	<script src="js/map/styleModule.js"></script>
	
	<!-- Map controllers -->
	<script src="js/map/mapController.js"></script>
	
	<!-- Base Map Module -->
	<script src="js/map/baseMapModule.js"></script>
	
	<!-- TOC Module -->
	<script src="js/map/tocModule.js"></script>
	
	<!-- Popup Module -->
	<!-- 
	<script src="js/map/popupModule.js"></script>
	<script src="js/map/mapFunctions.js"></script>
	<script src="js/map/colorbrewer.min.js"></script>
	 -->
	<!-- Popup Module -->
	
	<script src="js/map/webMapPrint.js"></script>
	
	<script src="js/map/turf.min.js"></script>

	<script>
		( function($) {
			$.fn.serializeFormJSON = function() {
	
				var o = {};
				var a = this.serializeArray();
				$.each( a, function() {
					if ( o[ this.name ] ) {
						if ( !o[ this.name ].push ) {
							o[ this.name ] = [ o[ this.name ] ];
						}
						o[ this.name ].push( this.value || '' );
					} else {
						o[ this.name ] = this.value || '';
					}
				} );
				return o;
			};
		} )( jQuery );
	</script>
</head>

<body>
	<div class="div-container">
		<div style="width:100%;height:100%" data-parent="contents/">
			<div style='display: -webkit-flex;display: flex; position: relative;height: 100%;'>
				<div id="div-map-contents" style="display: -webkit-flex;display: flex; position: relative;width:100%;height: 100%;"></div>
			   	<!-- <div class="right-container" style="display:none;min-height:500px;position: relative;height: 100%; background-color:#1a2134"></div>   -->
			   	<div class="right-container" style="display:none;min-height:500px;position: relative;height: 100%;"></div>
			</div>
		</div>
	</div>
</body>
<script>
/**
 * Renders a progress bar.
 * @param {Element} el The target element.
 * @constructor
 */
function Progress(el) {
  this.el = el;
  this.loading = 0;
  this.loaded = 0;
}


/**
 * Increment the count of loading tiles.
 */
Progress.prototype.addLoading = function() {
  if (this.loading === 0) {
    this.show();
  }
  ++this.loading;
  this.update();
};


/**
 * Increment the count of loaded tiles.
 */
Progress.prototype.addLoaded = function() {
  var this_ = this;
  setTimeout(function() {
    ++this_.loaded;
    this_.update();
  }, 100);
};


/**
 * Update the progress bar.
 */
Progress.prototype.update = function() {
  var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
  this.el.style.width = width;
  if (this.loading === this.loaded) {
    this.loading = 0;
    this.loaded = 0;
    var this_ = this;
    setTimeout(function() {
      this_.hide();
    }, 500);
  }
};


/**
 * Show the progress bar.
 */
Progress.prototype.show = function() {
  this.el.style.visibility = 'visible';
};


/**
 * Hide the progress bar.
 */
Progress.prototype.hide = function() {
  if (this.loading === this.loaded) {
    this.el.style.visibility = 'hidden';
    this.el.style.width = 0;
  }
};
</script>

<link rel="stylesheet" type="text/css" href="css/map/map.css">
<script src="js/map/map.js"></script>
<script>
	function initialize(){
		console.log("Map Initialize");
	}
	
	var options = {};
	
	var map = window.mapInit("div-map-contents", options, initialize);
	
	//var map2 = window.mapInit("div-map-contents", options, initialize);
	
	//var map3 = window.mapInit("div-map-contents", options, initialize);
</script>
</html>
