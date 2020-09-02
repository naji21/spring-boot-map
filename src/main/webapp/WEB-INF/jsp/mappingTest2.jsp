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
  <style>
      @import url(lib/cesium/Widgets/widgets.css);
      html, body, #cesiumContainer {
          width: 500px; height: 500px; margin: 0; padding: 0; overflow: hidden;
      }
  </style>
</head>
<body>
	<div id="cesiumContainer"></div>
	<div>
		<input type="file" id="filepicker" style="position: absolute;" />
	</div>
  	<pre id="allMetaDataSpan"></pre>
  <script>
    
    var viewer = new Cesium.Viewer("cesiumContainer", {
        animation: true, // 애니메이션 컨트롤 을 보일 지 여부 입 니 다.
        baseLayerPicker: true, // 그림% 1 개의 캡 션 을 편 집 했 습 니 다.
        geocoder: true, // 지명 찾기 컨트롤 표시 여부
        timeline: true, // 타임 라인 컨트롤 을 보일 지 여부 입 니 다.
        sceneModePicker: true, // 투영 방식 컨트롤 을 보일 지 여부 입 니 다.
        navigationHelpButton: false, // 도움말 정보 컨트롤 을 보일 지 여부 입 니 다.
        infoBox: false, // 클릭 요 소 를 표시 할 지 여부 입 니 다.
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
        terrainProvider: Cesium.createWorldTerrain()
    });
    
    //viewer.scene.primitives.add(Cesium.createOsmBuildings());
    
    var scene = viewer.scene;
    
 // 브이월드 hybrid 레이어 추가
 	/*/
    var layers = viewer.scene.imageryLayers;
    var hybridLayer = layers.addImageryProvider(new Cesium.ArcGisMapServerAndVworldImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      type: 'Hybrid'
    }));
    //*/
    
    
    //*/
    var wms = new Cesium.WebMapServiceImageryProvider({
    	url: "http://localhost:8081/geoserver/sample/wms",
    	parameters: {
    		format: "image/png",
    		transparent:"true",
    		srs: "EPSG:4326",
    	},
    	layers: "sample:SEOUL",
    	
    });
    
    var imageryLayers = viewer.imageryLayers;
    imageryLayers.addImageryProvider(wms);
    //*/
    
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
	    
	    
	  }
	  
	  // Read the file
	  reader.readAsArrayBuffer(files[0]);
	}, false);
    
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