<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>njMap</title>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
	<link rel="stylesheet" type="text/css" href="webjars/bootstrap/3.3.7/css/bootstrap.min.css" />
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" />
	
	<style>
	html {
		width: 100%;
		height: 100%;
	}
	
	body {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	
	.wrapper {
		display: flex;
		width: 100%;
		height: 100%;
		align-items: stretch;
	}
	
	.map { position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; width: 100%; height: 100%; }
    .map .ol-zoom { font-size: 1.2em; }
	
	#sidebar {
		min-width: 250px;
		max-width: 250px;
		background: #333;
		color: #fff;
		transition: all 0.3s;
	}
	.navbar-offset { margin-top: 50px; }

	
	.zoom-top-opened-sidebar { margin-top: 5px; }
   	.zoom-top-collapsed { margin-top: 45px; }

      .mini-submenu{
        display:none;  
        background-color: rgba(255, 255, 255, 0.46);
        border: 1px solid rgba(0, 0, 0, 0.9);
        border-radius: 4px;
        padding: 9px;  
        /*position: relative;*/
        width: 42px;
        text-align: center;
      }

      .mini-submenu-left {
        position: absolute;
        top: 60px;
        left: .5em;
        z-index: 40;
      }
      .mini-submenu-right {
        position: absolute;
        top: 60px;
        right: .5em;
        z-index: 40;
      }
	
      .map { z-index: 35; }

      .sidebar { z-index: 45; }
      
	  .main-row { position: relative; top: 0; }

      .mini-submenu:hover{
        cursor: pointer;
      }

      .slide-submenu{
        background: rgba(0, 0, 0, 0.45);
        display: inline-block;
        padding: 0 8px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .panel-shadow{
      	box-shadow: 0 0px 10px !important;
      }
      
      .layer-list{
      	overflow: auto;
    	max-height: 200px;
      }
      
      .overlay-list{
      	overflow: auto;
    	max-height: 350px;
      }
      
      .pt5{
      	padding-top: 5px;
      }
      
      .ml3{
      	margin-left: 3px;
      }
      
      .mr3{
      	margin-right: 3px;
      }
      
	.ol-top-right{
		top: 15px;
		right: 15px;
	}
      
	/*
	.baseMapListDIV {
		float: left;
		width: 30%;
		height: 100%;
		overflow: auto;
		position: relative;
		padding-left: 10px;
		background-color: white;
	}
	*/
	.mapMainDIV {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: absolute;
		top: 50px;
		background-color: lightgray;
	}
	
	.baseMapDIV {
		z-index: 20;
		width: 100%;
		height: 100%;
		position: absolute !important;
	}
	
	.mashUpMapDIV {
		z-index: 30;
		width: 100%;
		height: 100%;
		position: absolute !important;
	}
	
	@media ( max-width : 1500px) {
		.baseMapListDIV {
			min-width: 250px;
			max-width: 250px;
		}
		.mapMainDIV {
			width: 100%;
		}
	}
	
	@media ( max-width : 900px) {
		.baseMapListDIV {
			min-width: 250px;
			max-width: 250px;
		}
		.mapMainDIV {
			width: 100%;
		}
	}
	
	.mashUpMapDIV .ol-zoom {
		right: .5em;
		left: auto;
	}
	
	.mashUpMapDIV .ol-zoom .ol-zoom-out {
		margin-top: 204px;
	}
	
	.mashUpMapDIV .ol-zoomslider {
		right: .5em;
		left: auto;
		background-color: transparent;
		top: 3.1em;
	}
	
	.mashUpMapDIV .ol-touch .ol-zoom .ol-zoom-out {
		margin-top: 212px;
	}
	
	.mashUpMapDIV .ol-touch .ol-zoomslider {
		top: 2.75em;
	}
	
	.mashUpMapDIV .ol-zoom-in.ol-has-tooltip:hover [role=tooltip],
		.mashUpMapDIV .ol-zoom-in.ol-has-tooltip:focus [role=tooltip] {
		top: 3px;
	}
	
	.mashUpMapDIV .ol-zoom-out.ol-has-tooltip:hover [role=tooltip],
		.mashUpMapDIV .ol-zoom-out.ol-has-tooltip:focus [role=tooltip] {
		top: 232px;
	}
	
	.mashUpMapDIV .ol-control button {
		width: 32px;
		height: 32px;
	}
	
	.mashUpMapDIV .ol-control .ol-zoomslider-thumb {
		height: 14px;
	}
	
	
	.mashUpMapDIV div.olControl, div.olControlTextButtonPanel {
	    position: absolute;
	    _top: 8px;
	    _left: 8px;
	    background: rgba(255,255,255,0.4);
	    border-radius: 4px;
	    padding: 2px;
	}
	.mashUpMapDIV div.olControl a {
	    font-size: 22px;
	    line-height: 30px;
	    height: 32px;
	    width: 32px;
	    padding: 0;
	}
	.mashUpMapDIV div.olControl a, div.olControlTextButtonPanel .olButton {
	    display: block;
	    margin: 1px;
	    color: white;
	    font-family: 'Lucida Grande', Verdana, Geneva, Lucida, Arial, Helvetica, sans-serif;
	    font-weight: bold;
	    text-decoration: none;
	    text-align: center;
	    background: #130085; /* fallback for IE - IE6 requires background shorthand*/
	    background: rgba(0, 60, 136, 0.5);
	    filter: alpha(opacity=80);
	}
	.mashUpMapDIV div.olControl a:hover, div.olControlTextButtonPanel .olButton:hover {
	    background: #130085; /* fallback for IE */
	    background: rgba(0, 60, 136, 0.7);
	    filter: alpha(opacity=100);
	}
	
	
	/* toolbar css */
	.mashUpMapDIV .toolBar {
		cursor: pointer;
		position: absolute;
		z-index: 2001;
	    top: 350px;
	    right: .5em;
	    width: 38px;
		height: auto;
		padding: 2px !important;
		/* background: rgba(0, 60, 136, 0.5);	*/
	}
	#extendToolbar {
		cursor: move;
		float: left;
		z-index: 2001;
		width: 36px;	
		height: auto;
		_padding: 2px;
	    _background: rgba(255,255,255,0.4);
	    _border-radius: 4px;
		display: none;
	}
	#geolocateButton {
		float:left;
		background-image: url(/images/geolocate_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
	}
	#printButton {
		float:left;
		background-image: url(/images/print.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
	}
	#addMarkerButton {
		float:left;
		background-image: url(/images/addMarkerButton_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#rulerButton {
		float:left;
		background-image: url(/images/ruler_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
	}
	#rulerAreaButton {
		float:left;
		background-image: url(/images/ruler-area_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
	}
	#pointInfoButton {
		float:left;
		background-image: url(/images/point_info_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#addPolylineButton {
		float:left;
		background-image: url(/images/line-info_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#addPolygonButton {
		float:left;
		background-image: url(/images/area_info_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#addRectangleButton {
		float:left;
		background-image: url(/images/rectangle_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#addCircleButton {
		float:left;
		background-image: url(/images/area_info2_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#statisticsButton {
		float:left;
		background-image: url(/images/statistics.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#printButton {
		float:left;
		background-image: url(/images/print.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
	}
	#extendedToolbarButton {
		float:left;
		background-image: url(/images/tools_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
	}
	#helpButton {
		float:left;
		background-image: url(/images/helpButton.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#initializeButton {
		float:left;
		background-image: url(/images/init_off.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: pointer;
	}
	#blankButton {
		float:left;
		background-image: url(/images/blank.png);
		margin:1px;
		width: 32px;
		height: 32px;
		opacity: 0.5;
		filter: alpha(opacity=50); /* For IE8 and earlier */
		background-repeat: no-repeat;
	    background-size: contain;
		cursor: default !important;
	}
	
	#geolocateButton.on {
		background-image: url(/images/geolocate_on.png);
	}
	#addMarkerButton.on {
		background-image: url(/images/addMarkerButton_on.png);
	}
	#rulerButton.on {
		background-image: url(/images/ruler_on.png);
	}
	#rulerAreaButton.on {
		background-image: url(/images/ruler-area_on.png);
	}
	#pointInfoButton.on {
		background-image: url(/images/point_info_on.png);
	}
	#addPolylineButton.on {
		background-image: url(/images/line-info_on.png);
	}
	#addPolygonButton.on {
		background-image: url(/images/area_info_on.png);
	}
	#addRectangleButton.on {
		background-image: url(/images/rectangle_on.png);
	}
	#addCircleButton.on {
		background-image: url(/images/area_info2_on.png);
	}
	#extendedToolbarButton.on {
		background-image: url(/images/tools_on.png);
	}
	#initializeButton.on {
		background-image: url(/images/init_on.png);
	}
	#extendToolbar.on {
		display: block;
	}
	
	.areaExportButton {
		-webkit-border-radius: 2;
		-moz-border-radius: 2;
		border-radius: 2px;
		font-family: Arial;
		color: #ffffff;
		font-size: 10px;
		background: #003c88;
		padding: 2px 5px 2px 5px;
		border: solid #d4d4d4 1px;
		text-decoration: none;
		opacity: 0.5;
		filter: alpha(opacity=50);
		cursor:pointer;
	}
	.areaExportButton:hover {
		opacity: 0.7;
		filter: alpha(opacity=70);
	
	}
	
	#geolocateButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#addMarkerButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#rulerButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#rulerAreaButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#pointInfoButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#addPolylineButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#addPolygonButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#addRectangleButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#addCircleButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#areaExportButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#statisticsButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#printButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#helpButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#initializeButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	#extendedToolbarButton:hover{
		opacity: 0.7;
		filter: alpha(opacity=70); /* For IE8 and earlier */	
	}
	
	#searchBox {
		background-color: rgba(255,255,255,0.8);
		-o-transition:background 0.5s ease-in;
		-ms-transition:background 0.5s ease-in;
		-moz-transition:background 0.5s ease-in;
		-webkit-transition:background 0.5s ease-in;
		transition:background 0.5s ease-in;
		width:100%;
		height:2em;
		border-radius:4px;
	}
	#searchBox:hover{
		background-color: rgba(255,255,255,1.0);
		-o-transition:background 0.5s ease-in;
		-ms-transition:background 0.5s ease-in;
		-moz-transition:background 0.5s ease-in;
		-webkit-transition:background 0.5s ease-in;
		transition:background 0.5s ease-in;
	}
	
	
	
	</style>
	
	<!-- properties Script Load-->
	<script src="js/properties.js"></script>
	
	<!-- jQuery Script, CSS Load -->
	<link href="lib/jQueryUI-v1.11.2/jquery-ui.min.css" rel="stylesheet">
	<script src="lib/jQuery-v3.2.1/jquery-3.2.1.min.js"></script>
	<script src="lib/jQueryUI-v1.11.2/jquery-ui.js"></script>
	
	<!-- BootStrap Script, CSS Load -->
	<link href="lib/bootstrap-v3.3.5/bootstrap.min.css" rel="stylesheet">
	<script src="lib/bootstrap-v3.3.5/bootstrap.min.js"></script>
	
	<!-- OpenLayers3 Script, CSS Load -->
	<link href="lib/openLayers3-v4.6.5/ol.css" rel="stylesheet">
	<script src="lib/openLayers3-v4.6.5/ol.min.js"></script>
	
	<!-- OpenLayers5 Script, CSS Load -->
	<!-- 
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v5.3.0/css/ol.css">
	<script src="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v5.3.0/build/ol.js"></script>
	-->
		
	<!-- BaseMap API Key Script Load -->
	<!-- ★ Required when using BaseMap ★ -->
	<script src="lib/OpenLayers2.13.js"></script>
	<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=51585941a159119e7e794472451c5a45"></script>
	<script src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=g46w748sjd&amp;submodules=panorama"></script>
	<!-- <script src="http://map.ngii.go.kr/openapi/ngiiMap.js?apikey=BE45C5F6FC53B39B751EBB5B28B06EAB"></script> -->
	<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDuTiBLO4pGc3kbYJf-3qHJSZhnZBdXfpw" defer></script>
	<script src="http://map.vworld.kr/js/apis.do?type=Base&apiKey=C1F649CB-3C34-343C-B6D6-6C97BE17DCAD&domain=http://localhost:8080"></script>
	<script>
		window.API_KEY_BING = "AkoPAT2pQ_S1OYqnoKYiWIpBsDqeSmpwDZSOKE68EcnHGt1Wfp0u2dkzuee9tfS8";
	</script>
	
	<!-- ★ Required when using njMapCapture ★ -->
	<script src="lib/html2canvas.js"></script>
	<script src="lib/html2canvas-etc.js"></script>
	<script src="lib/html2canvas-google.js"></script>
	<script src="lib/es6-promise.auto.min.js"></script>
	<script src="lib/FileSaver.min.js"></script>

	<!-- uGisMapPlatForm Script, CSS Load-->
	<link href="css/njMapCSS.css" rel="stylesheet">
	<script src="lib/proj4/proj4.js"></script>
	<script src="lib/EPSG_custom.js"></script>
	<!-- <script src="js/njMapsPlatformScript.js"></script> -->
	<!-- <script src="js/njMapsPlatformScript-debug.js"></script> -->
	<script src="js/njMap/njMapsPlatformScript.min.js"></script>

</head>

<body>
	<div class="container">
		<nav class="navbar navbar-fixed-top navbar-default" role="navigation">
			<div class="container-fluid">
				<!-- Brand and toggle get grouped for better mobile display -->
				<div class="navbar-header">
					<button type="button" class="navbar-toggle" data-toggle="collapse"
						data-target="#bs-example-navbar-collapse-1">
						<span class="sr-only">Toggle navigation</span> <span
							class="icon-bar"></span> <span class="icon-bar"></span> <span
							class="icon-bar"></span>
					</button>
					<a class="navbar-brand" href="#">Map Viewer</a>
				</div>
				<!-- Collect the nav links, forms, and other content for toggling -->
				<div class="collapse navbar-collapse"
					id="bs-example-navbar-collapse-1">
					<!--
					<ul class="nav navbar-nav">
						<li class="active"><a href="#">Link</a></li>
						<li><a href="#">Link</a></li>
						<li class="dropdown"><a href="#" class="dropdown-toggle"
							data-toggle="dropdown">Dropdown <b class="caret"></b></a>
							<ul class="dropdown-menu">
								<li><a href="#">Action</a></li>
								<li><a href="#">Another action</a></li>
								<li><a href="#">Something else here</a></li>
								<li class="divider"></li>
								<li><a href="#">Separated link</a></li>
								<li class="divider"></li>
								<li><a href="#">One more separated link</a></li>
							</ul>
						</li>
					</ul>
					 -->
					<form class="navbar-form navbar-left" role="search">
						<div class="form-group">
							<input type="text" class="form-control" placeholder="Search">
						</div>
						<button type="submit" class="btn btn-default">Submit</button>
					</form>
					<!-- 
					<ul class="nav navbar-nav navbar-right">
						<li><a href="#">Link</a></li>
						<li class="dropdown"><a href="#" class="dropdown-toggle"
							data-toggle="dropdown">Dropdown <b class="caret"></b></a>
							<ul class="dropdown-menu">
								<li><a href="#">Action</a></li>
								<li><a href="#">Another action</a></li>
								<li><a href="#">Something else here</a></li>
								<li class="divider"></li>
								<li><a href="#">Separated link</a></li>
							</ul>
						</li>
					</ul>
					 -->
				</div>
				<!-- /.navbar-collapse -->
			</div>
			<!-- /.container-fluid -->
		</nav>
	</div>
	<div class="navbar-offset"></div>
	<div class="mapMainDIV">
		<div id="base" class="baseMapDIV"></div>
		<div id="map" class="mashUpMapDIV">
			<div id="toolbar" class="olControl toolBar">
				<!-- 
				<div id="pannigButton" title="Map panning"></div>
				<div id="geolocateButton" title="Go to your location"></div>
				<div id="pointInfoButton" title="Point information"></div>
				<div id="rulerButton" title="Measure distance"></div>
				<div id="rulerAreaButton" title="Measure Area distance"></div>
				<div id="printButton" title="Print map image"></div>
				<div id="helpButton" title="Help" onclick="window.open('help.html');"></div>
				<div id="extendedToolbarButton" title="Toggle extended toolbar"></div>
				<div id="extendToolbar" class="extendToolbar">
					<div id="addMarkerButton" title="Add a map marker"></div>					
					<div id="addPolylineButton" title="Add a map polyline"></div>
					<div id="addPolygonButton" title="Add a map polygon"></div>
					<div id="addRectangleButton" title="Add a map rectangle"></div>
					<div id="addCircleButton" title="Add a map circle"></div>
					<div id="blankButton"></div>
				</div>
				<div id="initializeButton" title="initialize add Data"></div>
				 -->
			</div>
		</div>
	</div>
	<div class="row main-row">
		<div class="col-sm-4 col-md-3 sidebar sidebar-left pull-left pt5 ml3">
			<div class="panel-group sidebar-body" id="accordion-left">
				<div class="panel panel-default panel-shadow">
					<div class="panel-heading">
						<h4 class="panel-title">
							<a data-toggle="collapse" href="#layers"> <i class="fa fa-list-alt"></i> 배경지도</a>
							<span class="pull-right slide-submenu"> <i class="fa fa-chevron-left"></i>
							</span>
						</h4>
					</div>
					<div id="layers" class="panel-collapse collapse in">
						<div class="panel-body">
							<div class="list-group layer-list"></div>
						</div>
					</div>
				</div>
				<div class="panel panel-default panel-shadow">
					<div class="panel-heading">
						<h4 class="panel-title">
							<a data-toggle="collapse" href="#properties"> <i class="fa fa-list-alt"></i> 레이어</a>
						</h4>
					</div>
					<div id="properties" class="panel-collapse collapse in">
						<div class="panel-body">
							<div class="list-group"><ul class="overlay-list list-unstyled"></ul></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="col-sm-4 col-md-6 mid"></div>
		<div class="col-sm-4 col-md-3 sidebar sidebar-right pull-right pt5 mr3">
			<div class="panel-group sidebar-body" id="accordion-right">
				<div class="panel panel-default panel-shadow">
					<div class="panel-heading">
						<h4 class="panel-title">
							<a data-toggle="collapse" href="#taskpane"> <i class="fa fa-tasks"></i> Task Pane</a>
							<span class="pull-right slide-submenu"> <i class="fa fa-chevron-right"></i></span>
						</h4>
					</div>
					<div id="taskpane" class="panel-collapse collapse in">
						<div class="panel-body">
							<p>Lorem ipsum dolor sit amet, vel an wisi propriae. Sea ut
								graece gloriatur. Per ei quando dicant vivendum. An insolens
								appellantur eos, doctus convenire vis et, at solet aeterno
								intellegebat qui.</p>
							<p>Elitr minimum inciderint qui no. Ne mea quaerendum
								scriptorem consequuntur. Mel ea nobis discere dignissim, aperiam
								patrioque ei ius. Stet laboramus eos te, his recteque mnesarchum
								an, quo id adipisci salutatus. Quas solet inimicus eu per. Sonet
								conclusionemque id vis.</p>
							<p>Eam vivendo repudiandae in, ei pri sint probatus. Pri et
								lorem praesent periculis, dicam singulis ut sed. Omnis patrioque
								sit ei, vis illud impetus molestiae id. Ex viderer assentior
								mel, inani liber officiis pro et. Qui ut perfecto repudiandae,
								per no hinc tation labores.</p>
							<p>Pro cu scaevola antiopam, cum id inermis salutatus. No duo
								liber gloriatur. Duo id vitae decore, justo consequat vix et.
								Sea id tale quot vitae.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="mini-submenu mini-submenu-left pull-left">
		<i class="fa fa-list-alt"></i>
	</div>
	<div class="mini-submenu mini-submenu-right pull-right">
		<i class="fa fa-tasks"></i>
	</div>
</body>


<script>
	//벡터스타일
	var vectorLayer = null, vectorLayer2 = null, njMapWmsLayer = null, vectorLayer3 = null;
	
	var config = {
		proxy : naji.contextPath + "/proxy.jsp?url=",
		layers : [
			{
				"Id" : "samchully_facility",
				"Service" : "GSSWMTS",
				"Name": "삼천리 시설물도",
				"Layers": "Facility",
				"MatrixSet": "EPSG-900913",
				"MinZoom": 13,
				"MaxZoom": 21,
				"ZoomOffset": -1,
				"TileSize": 512,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "samchully",
				"UseProxy": true,
				"Visible": true,
				"URL": "http://59.6.157.153:9090/maps"
			},
			{
				"Id" : "samchully_basemap",
				"Service" : "GSSWMTS",
				"Name": "삼천리 기본도",
				"Layers": "Basemap",
				"MatrixSet": "EPSG-900913",
				"MinZoom": 8,
				"MaxZoom": 21,
				"ZoomOffset": -1,
				"TileSize": 512,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "samchully",
				"UseProxy": true,
				"Visible": true,
				//"URL": "http://59.6.157.153:9090/maps"
				"URL": "http://59.6.157.173:9091/gssogc/ogc"
			},
			{
				"Id" : "yesco_facility",
				"Service" : "WMS",
				"Name": "예스코 시설물도",
				"Layers": "yesco:YESCO_GD_MAIN_HP_L_WMS,yesco:YESCO_GD_MAIN_MPB_L_WMS,yesco:YESCO_GD_MAIN_LP_L_WMS",
				"SingleTile": false,
				"UseProxy": true,
				"Style": "",
				"MinZoom": 13,
				"MaxZoom": 15,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": true,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wms"
			},
			{
				"Id" : "yesco_hadm",
				"Service" : "WMS",
				"Name": "예스코 동경계",
				"Layers": "	yesco:YESCO_BAL_HADM_AS",
				"SingleTile": false,
				"UseProxy": true,
				"Style": "",
				"MinZoom": 13,
				"MaxZoom": 16,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": false,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wms"
			},
			{
				"Id" : "yesco_gadm",
				"Service" : "WMS",
				"Name": "예스코 구경계",
				"Layers": "	yesco:YESCO_BAL_GADM_AS",
				"SingleTile": false,
				"UseProxy": true,
				"Style": "",
				"MinZoom": 10,
				"MaxZoom": 13,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": false,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wms"
			},
			{
				"Id" : "yesco_basemap",
				"Service" : "WMS",
				"Name": "예스코 팀구역도",
				"Layers": "yesco:YESCO_COST_CENTER",
				"SingleTile": false,
				"UseProxy": true,
				"Style": "",
				"MinZoom": 6,
				"MaxZoom": 10,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": true,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wms"
			},
			{
				"Id" : "yesco_facility_HP_L",
				"Service" : "WFS",
				"Name": "예스코 시설물_고압",
				"Layers": "YESCO_GD_MAIN_HP_L",
				"UseProxy": true,
				"Style": {
					"stroke" : {
						"color" : "#ff0000",
						"width" : 2
					}
				},
				"MinZoom": 7,
				"MaxZoom": 21,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": true,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wfs"
			},
			{
				"Id" : "yesco_facility_MPB_L",
				"Service" : "WFS",
				"Name": "예스코 시설물_중압",
				"Layers": "YESCO_GD_MAIN_MPB_L",
				"UseProxy": true,
				"Style": {
					"stroke" : {
						"color" : "#ff0000",
						"width" : 2
					}
				},
				"MinZoom": 16,
				"MaxZoom": 21,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": false,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wfs"
			},
			{
				"Id" : "yesco_facility_LP_L",
				"Service" : "WFS",
				"Name": "예스코 시설물_저압",
				"Layers": "YESCO_GD_MAIN_LP_L",
				"UseProxy": true,
				"Style": {
					"stroke" : {
						"color" : "#0000ff",
						"width" : 2
					}
				},
				"MinZoom": 16,
				"MaxZoom": 21,
				"Opacity": 0.7,
				"IsBaseLayer": false,
				"LayerGroup": "yesco",
				"Visible": false,
				"Version": "1.1.0",
				"URL": "http://localhost:8081/geoserver/yesco/wfs"
			}
		]			
	};
	
	var applyMargins = function() {
		var leftToggler = $(".mini-submenu-left");
		var rightToggler = $(".mini-submenu-right");
		/*
		if (leftToggler.is(":visible")) {
			$("#map .ol-zoom").css("margin-left", 0).removeClass("zoom-top-opened-sidebar").addClass("zoom-top-collapsed");
		} else {
			$("#map .ol-zoom").css("margin-left",
				$(".sidebar-left").width()).removeClass("zoom-top-opened-sidebar").removeClass("zoom-top-collapsed");
		}
		if (rightToggler.is(":visible")) {
			$("#map .ol-rotate").css("margin-right", 0).removeClass("zoom-top-opened-sidebar").addClass("zoom-top-collapsed");
		} else {
			$("#map .ol-rotate").css("margin-right",
				$(".sidebar-right").width()).removeClass("zoom-top-opened-sidebar").removeClass("zoom-top-collapsed");
		}
		*/
		$("#map .ol-zoom").removeClass("zoom-top-collapsed");
		$("#map .ol-zoom").addClass("zoom-top-collapsed");
		$("#map .ol-zoomslider").removeClass("zoom-top-collapsed");
		$("#map .ol-zoomslider").addClass("zoom-top-collapsed");
	}

	var isConstrained = function() {
		return $("div.mid").width() == $(window).width();
	}

	var applyInitialUIState = function() {
		if (isConstrained()) {
			$(".sidebar-left .sidebar-body").fadeOut('slide');
			$(".sidebar-right .sidebar-body").fadeOut('slide');
			$('.mini-submenu-left').fadeIn();
			$('.mini-submenu-right').fadeIn();
		}
	}
	
	$(document).ready(function() {
		$('.sidebar-left .slide-submenu').on('click', function() {
			var thisEl = $(this);
			thisEl.closest('.sidebar-body').fadeOut('slide', function() {
				$('.mini-submenu-left').fadeIn();
				applyMargins();
			});
		});

		$('.mini-submenu-left').on('click', function() {
			var thisEl = $(this);
			$('.sidebar-left .sidebar-body').toggle('slide');
			thisEl.hide();
			applyMargins();
		});

		$('.sidebar-right .slide-submenu').on('click', function() {
			var thisEl = $(this);
			thisEl.closest('.sidebar-body').fadeOut('slide', function() {
				$('.mini-submenu-right').fadeIn();
				applyMargins();
			});
		});

		$('.mini-submenu-right').on('click', function() {
			var thisEl = $(this);
			$('.sidebar-right .sidebar-body').toggle('slide');
			thisEl.hide();
			applyMargins();
		});

		$(window).on("resize", applyMargins);

		// njMapsPlatform Config 설정
		naji.njMapConfig.init({
			proxy : config.proxy,
			useLoading : true,
			loadingImg : "/images/double-ring-spinner.gif",
			alert_Error : function(msg) {
				alert( "Error : " + msg );
			}
		});

		// njMap 생성
		njMap = new naji.njMap({
			target : "map",
			crs : "EPSG:3857",
			center : [ 14171377.611070722, 4530186.929394197 ],
			useMaxExtent : false,
			useAltKeyOnly : false
		});

		njMap.getMap().addControl(new ol.control.ZoomSlider());
		njMap.getMap().addControl(new ol.control.MousePosition({
			coordinateFormat: function(coordinate) {				
				var coord = ol.proj.transform([ coordinate[0], coordinate[1] ], "EPSG:4326", njMap.getCRS());
				document.querySelecter(".ol-mouse-position").innerHTML = "경도 :" + coord[0].toFixed(4) + ", " + "위도 " + coord[1].toFixed(4);
			},
		  	//projection: 'EPSG:4326',
		  // comment the following two lines to have the mouse position
		  // be placed within the map.
		  //className: 'custom-mouse-position',
		  //target: document.getElementById('mouse-position'),
		  //undefinedHTML: '&nbsp;'
		}));
	
		// 베이스맵 생성
		njBaseMap = new naji.baseMap.njMapBaseMap({
			target : "base",
			njMap : njMap,
			//baseMapKey : "google_normal"
			baseMapKey : "naver_normal"
		});
		
		njMapDragPan = new naji.control.njMapDragPan( {
			njMap : njMap,
			useDragPan : true,
			active : true,
			cursorCssName : "cursor-default",
			activeChangeListener : function(state_) {
				console.log( "njMapDragPan : " + state_ );
			}
		} );
		
		njMapLocation = new naji.control.njMapLocation( {
			elementId : 'geolocateButton',
			title : 'Go to your location',
			njMap : njMap,
			useDragPan : true,
			type : 'none',
			cursorCssName : 'cursor-default',
			activeChangeListener : function(state_) {
				console.log( "njMapLocation : " + state_ );
			}
		} );
		
		njMapLengthMeasure = new naji.control.njMapLengthMeasure( {
			elementId : 'rulerButton',
			title : 'Measure Line distance',
			njMap : njMap,
			useSnap : true,
			useDragPan : false,
			cursorCssName : 'cursor-measureDistance',
			activeChangeListener : function(state_) {
				console.log( "njMapLengthMeasure : " + state_ );
			}
		} );


		njMapAreaMeasure = new naji.control.njMapAreaMeasure( {
			type: 'toggle',
			elementId : 'rulerAreaButton',
			title : 'Measure Area distance',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			cursorCssName : 'cursor-measureArea',
			activeChangeListener : function(state_) {
				console.log( "njMapAreaMeasure : " + state_ );
			}
		} );

		
		njMapDrawPoint = new naji.control.njMapDrawFeature( {
			elementId : 'addMarkerButton',
			title : 'add a Map Point',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Point",
			cursorCssName : 'cursor-point',
			useDrawEndDisplay : true,
			activeChangeListener : function(state_) {
				console.log( "njMapDrawPoint : " + state_ );
			}
		} );
		
		njMapDrawPolyline = new naji.control.njMapDrawFeature( {
			elementId : 'addPolylineButton',
			title : 'add a Map polyline',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "LineString",
			cursorCssName : 'cursor-line',
			useDrawEndDisplay : true,
			activeChangeListener : function(state_) {
				console.log( "njMapDrawPolyline : " + state_ );
			}
		} );
		
		njMapDrawPolygon = new naji.control.njMapDrawFeature( {
			elementId : 'addPolygonButton',
			title : 'add a Map polygon',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Polygon",
			cursorCssName : 'cursor-polygon',
			useDrawEndDisplay : true,
			activeChangeListener : function(state_) {
				console.log( "njMapDrawPolygon : " + state_ );
			}
		} );
		
		njMapDrawCircle = new naji.control.njMapDrawFeature( {
			elementId : 'addCircleButton',
			title : 'add a Map Circle',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Circle",
			cursorCssName : 'cursor-circle',
			useDrawEndDisplay : true,
			activeChangeListener : function(state_) {
				console.log( "njMapDrawCircle : " + state_ );
			}
		} );
		
		njMapDrawRectangle = new naji.control.njMapDrawFeature( {
			elementId : 'addRectangleButton',
			title : 'add a Map Rectangle',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Box",
			cursorCssName : 'cursor-rectangle',
			useDrawEndDisplay : true,
			activeChangeListener : function(state_) {
				console.log( "njMapDrawRectangle : " + state_ );
			}
		} );
		
		njMapCapture = new naji.control.njMapCapture( {
			elementId : 'printButton',
			title : 'capture image',
			useDragPan : true,
			njMap : njMap,
			type: 'none',
			activeChangeListener : function(state_) {
				console.log( "njMapCapture : " + state_ );
			}
		} );
		
		njMapControlManager = new naji.manager.njMapControlManager( {
			njMap : njMap,
			controls : [ njMapDragPan, njMapLocation, njMapLengthMeasure, njMapAreaMeasure, njMapCapture, njMapDrawPoint, njMapDrawPolyline, njMapDrawPolygon, njMapDrawCircle, njMapDrawRectangle ]
		} );

		njMapUIControlManager = new naji.manager.njMapUIControlManager( {
			njMap : njMap,
			target : 'toolbar',
			defaultControl : njMapDragPan,
			controls : [ njMapLocation, njMapLengthMeasure, njMapAreaMeasure, njMapCapture ],
			expendTools : {
				target : 'extendToolbar',
				controls : [ njMapDrawPoint, njMapDrawPolyline, njMapDrawPolygon, njMapDrawCircle, njMapDrawRectangle ]
			},
		} );
	
		var baseMapList = njBaseMap.getUsableBaseMapList();
	
		for ( var i in baseMapList) {
			createBaseMap(baseMapList[i]);
		}
	
		function createBaseMap(code_) {
			var alink = "<a href=\"#\" class=\"list-group-item\" value="+code_+"> <i class=\"fa fa-globe\"></i> "+code_+"</a>";
			
			$(".layer-list").append(alink);
		}
		
		for ( var i=0;i<config.layers.length;i++ ) {
			createOverlayLayer(config.layers[i]);
		}
	
		function createOverlayLayer(obj) {
			var input = "<input type=\"checkbox\" name=\"overlay\" id="+ obj.Id +" " + ( obj.Visible && "checked : \"checked\"" ) + " /><label for="+ obj.Id +">"+ obj.Name + "</label>";
			
			$(".overlay-list").append("<li class=\"list-group-item\">" + input + "</li>");
		}
		
		$(document).on("click", ".layer-list > a" , function() {
			if( $(this).attr("value") ){
				njBaseMap.changeBaseMap($(this).attr("value"));
			}
		});
		
		$(document).on("change", ".overlay-list > li > input" , function() {
			if( this.checked ){
				njMap.getLayerById(this.id).setLayerVisible(true);
			}else{
				njMap.getLayerById(this.id).setLayerVisible(false);
			}
		});
						
		njMap.getMap().addLayer(new ol.layer.Tile({
			title : 'Daum Street Map',
			visible : true,
			type : 'base',
			source : new ol.source.TileDebug({
				projection : njMap.getCRS(),
				tileSize : 256,
				minZoom : 0,
				maxZoom : 13,
				tileGrid : new ol.tilegrid.TileGrid({
					extent : njMap.getMaxExtent(),
					origin : [
						njMap.getMaxExtent()[0],
						njMap.getMaxExtent()[1] ],
					resolutions : njMap.getResolutions( 256 )
				}),
				tileUrlFunction : function(tileCoord, pixelRatio, projection) {
					if (tileCoord == null)
					return undefined;

					var s = Math.floor(Math.random() * 4); // 0 ~ 3
					var z = 14 - tileCoord[0];
					var x = tileCoord[1];
					var y = tileCoord[2];

					//return 'http://map' + s + '.daumcdn.net/map_2d/1810uis/L' + z + '/' + y + '/' + x + '.png';
					return 'http://map' + s + '.daumcdn.net/map_2d/1810uis/L' + z + '/' + y + '/' + x + '.png';
				}
			})
		}));
		
		var setLayers = function( _layers ){
			// njMapLayerManager 생성
			njMapLayerManager = new naji.manager.njMapLayerManager( {
				njMap : njMap,
				useMinMaxZoom : true
			} );
			
			for( var i=0; i<_layers.length; i++ ){
				var layerInfo = _layers[i];
				
				switch ( layerInfo.Service ){
					case 'WMS': 
						// njMapWMS 레이어 생성
						njMapWmsLayer = new naji.layer.njMapWMSLayer({
							id: layerInfo.Id,
							name: layerInfo.Name,
							minZoom: layerInfo.MinZoom,
							maxZoom: layerInfo.MaxZoom,
							opacity: layerInfo.Opacity,
							useProxy: layerInfo.UseProxy,
							singleTile: layerInfo.SingleTile,
							layerVisible: layerInfo.Visible,
							serviceURL: layerInfo.URL,
							ogcParams: {
								LAYERS: layerInfo.Layers,
								SRS: njMap.getCRS(),
								STYLES: layerInfo.Style,
								FORMAT: "image/png",
								BGCOLOR: "0xffffff",
								VERSION: layerInfo.Version
							}
						});

						// njMap에 WMS 레이어 추가
						njMapWMS = njMap.addWMSLayer({
							uWMSLayer : njMapWmsLayer,
							useExtent : false,
							extent : null,
							resolution : null
						});

						// addWMSLayer 콜백
						njMapWMS.then(function(res) {
							console.log("wms::", res);
						});
						
						// njMapLayerManager에 관리할 레이어 추가
						njMapLayerManager.add( {
							njMapLayer : njMapWmsLayer
						} );
						break;
					case 'GSSWMTS': 
						
						// njMapWMS 레이어 생성
						njMapGSSWmtsLayer = new naji.layer.njMapGSSWMTSLayer({
							id: layerInfo.Id,
							name: layerInfo.Name,
							minZoom: layerInfo.MinZoom,
							maxZoom: layerInfo.MaxZoom,
							opacity: layerInfo.Opacity,
							useProxy: layerInfo.UseProxy,
							layerVisible: layerInfo.Visible,
							serviceURL : layerInfo.URL,
							layer: layerInfo.Layers,
							matrixSet: layerInfo.MatrixSet,
							origin: ol.extent.getTopLeft(ol.proj.get(njMap.getCRS()).getExtent()),
				        	tileSize: [layerInfo.TileSize, layerInfo.TileSize],
				        	resolutions: njMap.getResolutions( layerInfo.TileSize ),
				            matrixIds: njMap.getMatrixIds(),
				            zoomOffset: layerInfo.ZoomOffset,
				            format: 'image/png'
						});

						// njMap에 WMS 레이어 추가
						njMapWMTS = njMap.addGSSWMTSLayer({
							uGSSWMTSLayer : njMapGSSWmtsLayer,
							useExtent : false,
							extent : null,
							resolution : null
						});

						// addWMSLayer 콜백
						njMapWMTS.then(function(res) {
							console.log("wmts::", res);
						});
						
						// njMapLayerManager에 관리할 레이어 추가
						njMapLayerManager.add( {
							njMapLayer : njMapGSSWmtsLayer
						} );
						break;
					case 'WFS':
						var _style = {};
						
						if( layerInfo.Style.fill ){
							_style.fill = new ol.style.Fill( {
								color: layerInfo.Style.fill.color
							} );
						}
						
						if( layerInfo.Style.stroke ){
							_style.stroke = new ol.style.Stroke( {
								color: layerInfo.Style.stroke.color,
								width: layerInfo.Style.stroke.width,
							} );
						}
						
						if( layerInfo.Style.fill && layerInfo.Style.stroke ){
							_style.image = new ol.style.Circle( {
								fill: _style.fill,
								stroke: _style.stroke,
								radius: ( layerInfo.Style.circle.radius ? layerInfo.Style.circle.radius : 0 ) 
							} );
						}
						
						njMapWfsVectorLayer = new naji.layer.njMapWFSVectorLayer({
							id: layerInfo.Id,
							name: layerInfo.Name,
							minZoom: layerInfo.MinZoom,
							maxZoom: layerInfo.MaxZoom,
							opacity: layerInfo.Opacity,
							useProxy: layerInfo.UseProxy,
							layerVisible: layerInfo.Visible,
							serviceURL : layerInfo.URL,
							layerName : layerInfo.Layers,
							srsName : njMap.getCRS(),
							maxFeatures : 999999,
							style : new ol.style.Style( _style )
						});
					
						// njMap에 WFS 레이어 추가
						
						var njMapWFSVector = njMap.addVectorLayer( {
							uVectorLayer : njMapWfsVectorLayer,
							useExtent : false
						} );
					
						// addWFSLayer 콜백
						njMapWFSVector.then( function(res) {
							console.log( "wfs::",res );
						} );
						
						
						// njMapLayerManager에 관리할 레이어 추가
						njMapLayerManager.add( {
							njMapLayer : njMapWfsVectorLayer
						} );
						
						break;
					default :

						break;
				}
			}
			
		}
	
		setLayers( config.layers );
		
		//njMapLocation.move();

		applyInitialUIState();
		applyMargins();
	});
</script>

</html>
