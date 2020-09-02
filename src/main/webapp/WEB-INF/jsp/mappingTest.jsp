<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Use correct character set. -->
  <meta charset="utf-8">
  <!-- Tell IE to use the latest, best version. -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!-- Make the application on mobile take up the full browser screen and disable user scaling. -->
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
  <title>Hello World!</title>
  <link rel="stylesheet" href="lib/bootstrap-v3.3.5/bootstrap.css">
    <script src="lib/Jquery-v3.2.1/jquery-3.2.1.min.js"></script>

  <script src="lib/cesium/Cesium.js"></script>
  <script src="lib/bootstrap-v3.3.5/bootstrap.min.js"></script>

  <script src="https://cdn.jsdelivr.net/npm/exif-js"></script>
  <script src="lib/html2canvas.js"></script>
  <script src="lib/es6-promise.auto.min.js"></script>
  <script src="lib/FileSaver.min.js"></script>
  
  <style>
      @import url(lib/cesium/Widgets/widgets.css);
      html, body, #cesiumContainer {
          width: 600px; height: 800px; margin: 0; padding: 0; overflow: hidden;
      }
      
      #imageDiv{
      	position: absolute;
      }
  </style>
</head>
<body>
	<div id="container" style="display: inline-block">
		<div id="imageDiv"><!-- <img src="/images/test.jpg" width="200" height="300" /> --></div>
		<div id="cesiumContainer"></div>
	</div>
	<div id="controller" style="position: absolute;display: inline-block">
		투명도조절 : <input type="range" name="alpha" id="alpha" min="0" max="1" step="0.005" value="0" onchange="_baseTranslate(value)" /> <br />
		<!-- buffer 조절 : <input type="range" name="" id="" min="0" max="500" step="10" onchange="_addWMS(value)" /> <br /> -->
		<button onclick="saveImg();">저장</button>
	</div>
	<div>
		<input type="file" id="filepicker" style="position: absolute;" />
	</div>
  	<pre id="allMetaDataSpan"></pre>
  <script>
    
  	var transparentBaseLayer = new Cesium.SingleTileImageryProvider({
	    url : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
	});
  	
  	Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMzlhMDcxNC04YTU1LTQ4ZWQtOGIyMC03ZGY3YzYzOTdlNDciLCJpZCI6Mjc1NjEsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyIsInByIl0sImlhdCI6MTU4OTc2MjMyNn0.cwr9WS2p0XoqYnFtQKfQYL2qkrV7WsP-Az2srDEMN1s";
  
    var viewer = new Cesium.Viewer("cesiumContainer", {
    	skyBox : false,
       	skyAtmosphere : false,
        baseLayerPicker : false,
        animation: false, // 애니메이션 컨트롤 을 보일 지 여부 입 니 다.
        baseLayerPicker: false, // 그림% 1 개의 캡 션 을 편 집 했 습 니 다.
        geocoder: false, // 지명 찾기 컨트롤 표시 여부
        timeline: false, // 타임 라인 컨트롤 을 보일 지 여부 입 니 다.
        sceneModePicker: false, // 투영 방식 컨트롤 을 보일 지 여부 입 니 다.
        fullscreenButton: false,
        homeButton: false,
        navigationHelpButton: false, // 도움말 정보 컨트롤 을 보일 지 여부 입 니 다.
        navigationInstructionsInitiallyVisible: false,
        infoBox: false, // 클릭 요 소 를 표시 할 지 여부 입 니 다.
        contextOptions : {
            webgl: { alpha: true, preserveDrawingBuffer: true }
        },
        //alpha: true,
        imageryProvider: transparentBaseLayer,
        //imageryProvider: false,
        /*
        imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
            url:
"http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles",
            layer: "tdtBasicLayer",
            style: "default",
            format: "image/jpeg",
            tileMatrixSetID: "GoogleMapsCompatible",
            show: false
        })
    	*/
    	/*
    	imageryProvider: Cesium.createWorldImagery({
            style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }),
        */
        //terrainProvider: Cesium.createWorldTerrain()
    });
    
    //viewer.scene.primitives.add(Cesium.createOsmBuildings());
    /*
    viewer.scene.skyBox.destroy();
    viewer.scene.skyBox = undefined;
    viewer.scene.sun.destroy();
    viewer.scene.sun = undefined;
    viewer.scene.skyAtmosphere.destroy();
    viewer.scene.skyAtmosphere = undefined;
    viewer.scene.backgroundColor = new Cesium.Color(0, 0, 0, 0);
    */
    
    var scene = viewer.scene;
    
    var layers = viewer.scene.imageryLayers;
 
    //viewer.scene.globe.enableLighting = true;
    // 브이월드  레이어 추가
 	//*/
 	var satelliteProvider = new Cesium.ArcGisMapServerAndVworldImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      //type: 'Base',
      type: 'Satellite',
    });
 	
 	//satelliteProvider.defaultAlpha = 0;
 
    var satelliteLayer = layers.addImageryProvider(satelliteProvider);
    
    satelliteLayer.alpha = 0;
    //*/
    
 	// 브이월드 hybrid 레이어 추가
 	//*/
 	var hybridProvider = new Cesium.ArcGisMapServerAndVworldImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      type: 'Hybrid',
    });
 	
 	//hybridProvider.defaultAlpha = 0;
 	//hybridProvider.alpha = 0;
 
    var hybridLayer = layers.addImageryProvider(hybridProvider);
    
    hybridLayer.alpha = 0;
    //*/
    
    
  //Set the background of the scene to transparent
    viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;

    //Set the globe base color to transparent
    viewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT;

    //Work around https://github.com/AnalyticalGraphicsInc/cesium/issues/2866
    viewer.scene.fxaa = false;
    
    //viewer.scene.globe.show = false;
    
    /*/
    var wmsLayer;
    var _addWMS = function(buffer){
    	var imageryLayers = viewer.imageryLayers;
    	imageryLayers.remove(wmsLayer);
    	
    	var center = [14124874.893846003, 4506205.602331586];
    	cql_filter = "DWITHIN(the_geom,POINT("+ center[0] + " " + center[1] +"),"+ buffer +",meters)";
	    var wmsProvider = new Cesium.WebMapServiceImageryProvider({
	    	url: "http://localhost:8081/geoserver/sample/wms",
	    	parameters: {
	    		format: "image/png",
	    		transparent:"true",
	    		srs: "EPSG:4326",
	    		cql_filter: cql_filter
	    	},
	    	layers: "sample:SEOUL",
	    	proxy: new Cesium.DefaultProxy('/proxy.jsp'),
	    	enablePickFeatures: false
	    });
	   
	    wmsLayer = imageryLayers.addImageryProvider(wmsProvider);
    };
    
    _addWMS(100);
    /*/
    
    var imageryLayers = viewer.imageryLayers;
    var wmsProvider = new Cesium.WebMapServiceImageryProvider({
    	url: "http://localhost:8081/geoserver/sample/wms",
    	parameters: {
    		format: "image/png",
    		transparent:"true",
    		srs: "EPSG:4326"
    	},
    	layers: "sample:SEOUL",
    	proxy: new Cesium.DefaultProxy('/proxy.jsp'),
    	enablePickFeatures: false
    });
   
    wmsLayer = imageryLayers.addImageryProvider(wmsProvider);
    
    //imageryLayers.get(0).alpha = 0;
    
    //viewer.scene.globe.show = false;
    
    //viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
    /*
    var dataSource = new Cesium.CustomDataSource('myData');

    var entity = dataSource.entities.add({
    	position: Cesium.Cartesian3.fromDegrees(126.87835693359378, 37.474365234375),
	    billboard: {
	      image: "/images/test.jpg", // default: undefined
	      show: true, // default
	      //pixelOffset: new Cesium.Cartesian2(0, 0), // default: (0, 0)
	      //eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
	      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
	      verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
	      //scale: 1.0, // default: 1.0
	      //color: Cesium.Color.LIME, // default: WHITE
	      rotation: -90 * Math.PI / 180, // default: 0.0
	      //alignedAxis: 1, // default
	      width: 200, // default: undefined
	      height: 200, // default: undefined
	      sizeInMeters: true
	    }
    });

    viewer.dataSources.add(dataSource);
    */
    //viewer.dataSources.lower(dataSource);
    
    /*/
    viewer.dataSources.add(Cesium.GeoJsonDataSource.load("http://localhost:8081/geoserver/sample/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sample:SEOUL&srsName=EPSG:4326&outputFormat=application/json&bbox=14119729.726379558,4503409.342934988,14129848.07799881,4508831.594628967,EPSG:3857", {
    	// 선 색을 설정
		stroke: Cesium.Color.RED,
		// 채우기 설정 : 투명
	 	fill: Cesium.Color.TRANSPARENT,
	 	// 선의 두께 설정
	 	strokeWidth: 2
    }));
    
    /*
    viewer.entities.add({
	    position: Cesium.Cartesian3.fromDegrees(126.87835693359378, 37.474365234375),
	    billboard: {
	      image: "/images/test.jpg", // default: undefined
	      show: true, // default
	      //pixelOffset: new Cesium.Cartesian2(0, 0), // default: (0, 0)
	      //eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
	      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
	      verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
	      //scale: 1.0, // default: 1.0
	      //color: Cesium.Color.LIME, // default: WHITE
	      rotation: -90 *  Math.PI / 180, // default: 0.0
	      //alignedAxis: 2, // default
	      width: 200, // default: undefined
	      height: 200, // default: undefined
	      sizeInMeters: true,
	      zindex : 2
	    }
	  });
    */
    /*/
    /*
    viewer.dataSources.add(Cesium.GeoJsonDataSource.load("/ne_10m_us_states.topojson", {
    	// 선 색을 설정
		stroke: Cesium.Color.RED,
		// 채우기 설정 : 투명
	 	fill: Cesium.Color.TRANSPARENT,
	 	// 선의 두께 설정
	 	strokeWidth: 2
    }));
    */

   	document.getElementById('filepicker').addEventListener('change', function (event) {
	  $("#imageDiv").html("");
	  const files = event.target.files;
	    
	  // Initialize an instance of the `FileReader`
	  const reader = new FileReader();
	  
	  // Specify the handler for the `load` event
	  reader.onload = function (e) {
	    // Do something with the file
	    // E.g. Send it to the cloud
	    console.log(e.target.result);
	    
	    var exif = EXIF.readFromBinaryFile(e.target.result);
	    console.log(exif);
	    debugger;
	    var imgElement = document.createElement("img");
	    var data = _arrayBufferToBase64(e.target.result);
	    imgElement.src = "data:image/png;base64," + data;
	    
	    imgElement.width = 600;
	    imgElement.height = 800;
	    
	    $("#imageDiv").append(imgElement);
	   
	    console.log((exif.GPSLongitude[0].numerator + (exif.GPSLongitude[1].numerator + (exif.GPSLongitude[2].numerator / exif.GPSLongitude[2].denominator) / 60) / 60), 
	        	(exif.GPSLatitude[0].numerator + (exif.GPSLatitude[1].numerator + (exif.GPSLatitude[2].numerator / exif.GPSLatitude[2].denominator) / 60) / 60));
	    
	    viewer.camera.flyTo({
	        destination : Cesium.Cartesian3.fromDegrees(
	        	(exif.GPSLongitude[0].numerator + (exif.GPSLongitude[1].numerator + (exif.GPSLongitude[2].numerator / exif.GPSLongitude[2].denominator) / 60) / 60), 
	        	(exif.GPSLatitude[0].numerator + (exif.GPSLatitude[1].numerator + (exif.GPSLatitude[2].numerator / exif.GPSLatitude[2].denominator) / 60) / 60),
	            50
	        ),
	        orientation : {
	            heading : Cesium.Math.toRadians(0),
	            pitch : Cesium.Math.toRadians(-20),
	            roll : Cesium.Math.toRadians(0)
	        }
	    });
	  }
	  
	  // Read the file
	  reader.readAsArrayBuffer(files[0]);
	}, false);
    
    function _arrayBufferToBase64( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

  	//카메라 시점 조절하기 
    function _lookAtTransform(value){
  		var center = getMapCenter();
  		
    	var transform = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(center.longitude, center.latitude));  	    
		var camera = viewer.camera;
		
		camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
		camera.lookAtTransform(transform, new Cesium.Cartesian3(-10000.0, -10000.0, value));
    }
  	
  	//베이스맵 투명도 조절
    function _baseTranslate(value){
    	satelliteLayer.alpha = value;
    	hybridLayer.alpha = value;
    }
  	
  	function saveImg(){
  		satelliteLayer.alpha = 0;
  		hybridLayer.alpha = 0;
  		
  		var element = $("#container")[0];
  		
  		//var element = viewer.canvas;
		var capture = function (){ 
	  		html2canvas( element, {
				useCORS : false,
				logging : false,
				proxy : "/proxy.jsp"
			} ).then( function(canvas) {
				//*/
				if ( navigator.msSaveBlob ) {
					navigator.msSaveBlob( canvas.msToBlob(), 'map.png' );
				} else {
					canvas.toBlob( function(blob) {
						saveAs( blob, 'map.png' );
					} );
				}
				
				satelliteLayer.alpha = $("#alpha").val();
				hybridLayer.alpha = $("#alpha").val();
				
		    	/*/
				var myImage = canvas.toDataURL("image/png");
		    	var tWindow = window.open("");
	            $(tWindow.document.body).html("<img id='Image' src=" + myImage + " style='width:100%;'></img>").ready(function() {
	            	tWindow.focus();
	            });
	            */
			} );
		};
		
		setTimeout(capture, 500);
  	}
  	
    function getMapCenter() {            
        var windowPosition = new Cesium.Cartesian2(viewer.container.clientWidth / 2, viewer.container.clientHeight / 2);
        var pickRay = viewer.scene.camera.getPickRay(windowPosition);
        var pickPosition = viewer.scene.globe.pick(pickRay, viewer.scene);
        var pickPositionCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);
        return { longitude : pickPositionCartographic.longitude * (180/Math.PI), latitude : pickPositionCartographic.latitude * (180/Math.PI) };
	}
    
    var center = Cesium.Cartesian3.fromDegrees(
    	126.87835693359378, 37.474365234375, 5000
    );
    
    viewer.camera.flyTo({
        destination : center,
        orientation : {
            heading : Cesium.Math.toRadians(0),
            pitch : Cesium.Math.toRadians(-90),
            roll : Cesium.Math.toRadians(0)
        },
        duration: 3
    });
  </script>
  
</body>
</html>