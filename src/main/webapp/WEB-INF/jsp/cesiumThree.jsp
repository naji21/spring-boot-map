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
	
	<!-- OpenLayers3 Script, CSS Load -->
	<link href="lib/openLayers3-v4.6.5/ol.css" rel="stylesheet">
	<!-- <script src="lib/openLayers3-v4.6.5/ol.min.js"></script> -->
	<!-- <script src="lib/ol3d/ol3d.js"></script> -->

	<!-- jQuery Script, CSS Load -->
	<link href="lib/jQueryUI-v1.11.2/jquery-ui.min.css" rel="stylesheet">
	<script src="lib/jQuery-v3.2.1/jquery-3.2.1.min.js"></script>
	<script src="lib/jQueryUI-v1.11.2/jquery-ui.js"></script>

	<!-- Cesium 3D MAP -->
	<link rel="stylesheet" type="text/css" href="lib/ol-cesium/olcs.css">
	<script src="lib/cesium/Cesium.js"></script>
	
	<!-- Three.js -->
	<script src="lib/three/three.min.js"></script>
	
	<!-- 
	<script src="lib/ol-cesium/olcesium.js"></script>
	 -->
	<!-- /Cesium 3D MAP -->
	
	<style>
	 	@import url(lib/cesium/Widgets/widgets.css);
		body {
		  height: 100%;
		  width: 100%;
		  margin: 0;
		  overflow: hidden;
		  padding: 0;
		  background: #000;
		}
		
		#cesiumContainer{
		  position: absolute;
		  top: 0;
		  left: 0;
		  height: 100%;
		  width: 100%;
		  margin: 0;
		  overflow: hidden;
		  padding: 0;
		  font-family: sans-serif;
		}
		
		#ThreeContainer{
		  position: absolute;
		  top: 0;
		  left: 0;
		  height: 100%;
		  width: 100%;
		  margin: 0;
		  overflow: hidden;
		  padding: 0;
		  font-family: sans-serif;
		  pointer-events:none;
		}
		
		.fullWindow {
		    position: absolute;
		    top: 0;
		    left: 0;
		    height: 100%;
		    width: 100%;
		    margin: 0;
		    overflow: hidden;
		    padding: 0;
		    font-family: sans-serif;
		}
		
		.loadingIndicator {
		    display: block;
		    position: absolute;
		    top: 50%;
		    left: 50%;
		    margin-top: -33px;
		    margin-left: -33px;
		    width: 66px;
		    height: 66px;
		    background-position: center;
		    background-repeat: no-repeat;
		    background-image: url(Images/ajax-loader.gif);
		}
	</style>
</head>
<body>
	<div id="cesiumContainer"></div>
	<div id="ThreeContainer"></div>
</body>
<script>
//boundaries in WGS84 to help with syncing the renderers
var minWGS84 = [126.96592291983335, 37.42019090242157];
var maxWGS84 = [126.98592291983335, 37.62019090242157];
var cesiumContainer = document.getElementById("cesiumContainer");
var ThreeContainer = document.getElementById("ThreeContainer");

var _3Dobjects = []; //Could be any Three.js object mesh
var _tiles = {}; //Could be any Three.js object mesh
var three = {
  renderer: null,
  camera: null,
  scene: null
};

var cesium = {
  viewer: null
};
function main(){
  initCesium(); // Initialize Cesium renderer
  initThree(); // Initialize Three.js renderer
  //init3DObject(); // Initialize Three.js object mesh with Cesium Cartesian coordinate system
  loop(); // Looping renderer
}
function initCesium(){
    cesium.viewer = new Cesium.Viewer(cesiumContainer,{
        useDefaultRenderLoop: true,
        selectionIndicator : false,
        homeButton:false,
        sceneModePicker:false,
        navigationHelpButton:false,
        infoBox : false,
        navigationHelpButton:false,
        navigationInstructionsInitiallyVisible:false,
        animation : false,
        timeline : false,
        fullscreenButton : false,
        allowTextureFilterAnisotropic:false,
        contextOptions:{
            webgl: {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer : true,
                failIfMajorPerformanceCaveat: false,
                depth:true,
                stencil:false,
                anialias:false
            },
        },
        //targetFrameRate:60,
        //resolutionScale:0.1,
        orderIndependentTranslucency : true,
        /*
        creditContainer : "hidecredit",
        imageryProvider : new Cesium.TileMapServiceImageryProvider({
            url: 'Assets/imagery/NaturalEarthII/',
            maximumLevel : 5
        }),
        
        imageryProvider: Cesium.createWorldImagery({
            style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }),
        */
     	// Arcgis MapServer 브이월드 Satellite
     	/*/
        imageryProvider : new Cesium.ArcGisMapServerAndVworldImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            type: 'Satellite'
        }),
        //*/
        imageryProvider : new Cesium.BingMapsImageryProvider({
			url : 'https://dev.virtualearth.net',
			key : 'AkoPAT2pQ_S1OYqnoKYiWIpBsDqeSmpwDZSOKE68EcnHGt1Wfp0u2dkzuee9tfS8',
			mapStyle : Cesium.BingMapsStyle.AERIAL
		}),
        /*/
        /*
        imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            enablePickFeatures: false
        }),
        */
        //terrainProvider: Cesium.createWorldTerrain(),
        baseLayerPicker : false,
        geocoder : false,
        automaticallyTrackDataSourceClocks: false,
        dataSources: null,
        clock: null,
        terrainShadows: Cesium.ShadowMode.DISABLED
    });
    
 	// 브이월드 hybrid 레이어 추가
 	//*/
    var layers = cesium.viewer.scene.imageryLayers;
    var hybridLayer = layers.addImageryProvider(new Cesium.ArcGisMapServerAndVworldImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      type: 'Hybrid'
    }));
    /*/
	/*
    // terrain 설정
    var terrainProvider = new Cesium.CesiumTerrainProvider({
      url : '//assets.agi.com/stk-terrain/world'
    });
    cesium.viewer.terrainProvider = terrainProvider;
    */

    var center = Cesium.Cartesian3.fromDegrees(
        (minWGS84[0] + maxWGS84[0]) / 2,
        ((minWGS84[1] + maxWGS84[1]) / 2)-1,
        200000
    );
    
    cesium.viewer.camera.flyTo({
        destination : center,
        orientation : {
            heading : Cesium.Math.toRadians(0),
            pitch : Cesium.Math.toRadians(-60),
            roll : Cesium.Math.toRadians(0)
        },
        duration: 3
    });
    

    cesium.viewer.camera.moveEnd.addEventListener(function() {
    	
        var tilesToRender = cesium.viewer.scene.globe._surface._tilesToRender;
        
        if(tilesToRender[0].level >= 16){
        	var rectangle = cesium.viewer.camera.computeViewRectangle();
        	var bbox = [
	        	Number(Cesium.Math.toDegrees(rectangle.west)),
	        	Number(Cesium.Math.toDegrees(rectangle.south)),
	        	Number(Cesium.Math.toDegrees(rectangle.east)),
	        	Number(Cesium.Math.toDegrees(rectangle.north))
        	];
        	
        	getLayerNode( bbox );
        }
        
        /*
    	var windowPosition = new Cesium.Cartesian2(cesium.viewer.container.clientWidth / 2, cesium.viewer.container.clientHeight / 2);
        var pickRay = cesium.viewer.scene.camera.getPickRay(windowPosition);
        var pickPosition = cesium.viewer.scene.globe.pick(pickRay, viewer.scene);
        var pickPositionCartographic = cesium.viewer.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);
        [pickPositionCartographic.longitude * (180/Math.PI), pickPositionCartographic.latitude * (180/Math.PI)];
        */
    });
}
function initThree(){
    var fov = 45;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspect = width / height;
    var near = 1;
    var far = 10*1000*1000; // needs to be far to support Cesium's world-scale rendering

    three.scene = new THREE.Scene();
    
    three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    three.renderer = new THREE.WebGLRenderer({alpha: true});
    
    //three.renderer.setSize(width, height);
    
    ThreeContainer.appendChild(three.renderer.domElement); 
}
function init3DObject(){
	  //Cesium entity
	  var entity = {
	    name : 'Polygon',
	    polygon : {
	      hierarchy : Cesium.Cartesian3.fromDegreesArray([
	        minWGS84[0], minWGS84[1],
	        maxWGS84[0], minWGS84[1],
	        maxWGS84[0], maxWGS84[1],
	        minWGS84[0], maxWGS84[1],
	      ]),
	      material : Cesium.Color.RED.withAlpha(0.2)
	    }
	  };
	  var Polygon = cesium.viewer.entities.add(entity);
	}
function _3DObject(){
	  this.threeMesh = null; //Three.js 3DObject.mesh
	  this.minWGS84 = null; //location bounding box
	  this.maxWGS84 = null;
	}
function loop(){
	  requestAnimationFrame(loop);
	  renderCesium();
	  renderThreeObj();
	}
function renderCesium(){
	  cesium.viewer.render();
	}
function renderThreeObj(){	
	  // register Three.js scene with Cesium
	  three.camera.fov = Cesium.Math.toDegrees(cesium.viewer.camera.frustum.fovy) // ThreeJS FOV is vertical
	  three.camera.updateProjectionMatrix();
	  //three.camera.position.z = 0;

	  var cartToVec = function(cart){
	    return new THREE.Vector3(cart.x, cart.y, cart.z);
	  };
	
	  // Configure Three.js meshes to stand against globe center position up direction
	
	  for(id in _3Dobjects){
	    minWGS84 = _3Dobjects[id].minWGS84;
	    maxWGS84 = _3Dobjects[id].maxWGS84;
	    // convert lat/long center position to Cartesian3
	    //var center = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2);
	    var center = Cesium.Cartesian3.fromDegrees(_3Dobjects[id].centerWGS84[0],_3Dobjects[id].centerWGS84[1], _3Dobjects[id].centerWGS84[2]);

	    // get forward direction for orienting model
	    //var centerHigh = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2, 0);
	    var centerHigh = Cesium.Cartesian3.fromDegrees(_3Dobjects[id].centerWGS84[0],_3Dobjects[id].centerWGS84[1], _3Dobjects[id].centerWGS84[2]);
		
	    // use direction from bottom left to top left as up-vector
	    var bottomLeft  = cartToVec(_3Dobjects[id].bbox.min);
	    var topLeft = cartToVec(_3Dobjects[id].bbox.max);
	    //var bottomLeft  = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[1], maxWGS84[1]));
	    //var topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[0]));
	    
	    var latDir  = new THREE.Vector3().subVectors(bottomLeft,topLeft).normalize();
	    
	    // configure entity position and orientation
	    //W_3Dobjects[id].threeMesh.position.copy(center);
	    //_3Dobjects[id].threeMesh.lookAt(centerHigh);
	    //_3Dobjects[id].threeMesh.up.copy(latDir);
	    
	    //centerHigh.z = 0;
	    _3Dobjects[id].threeMesh.position.copy(center);
	    _3Dobjects[id].threeMesh.lookAt(centerHigh);
	    
	    //_3Dobjects[id].threeMesh.up.copy(latDir);
	  }
	  
	  // Clone Cesium Camera projection position so the
	  // Three.js Object will appear to be at the same place as above the Cesium Globe
	  three.camera.matrixAutoUpdate = false;
	  
	  var cvm = cesium.viewer.camera.viewMatrix;
	  var civm = cesium.viewer.camera.inverseViewMatrix;
	  
	  three.camera.matrixWorld.set(
	      civm[0], civm[4], civm[8 ], civm[12],
	      civm[1], civm[5], civm[9 ], civm[13],
	      civm[2], civm[6], civm[10], civm[14],
	      civm[3], civm[7], civm[11], civm[15]
	  );
	  three.camera.matrixWorldInverse.set(
	      cvm[0], cvm[4], cvm[8 ], cvm[12],
	      cvm[1], cvm[5], cvm[9 ], cvm[13],
	      cvm[2], cvm[6], cvm[10], cvm[14],
	      cvm[3], cvm[7], cvm[11], cvm[15]
	  );
	  
	  //three.camera.matrixWorld = cvm;
	  //three.camera.matrixWorldInverse = civm;
	  
	  //debugger;
	  //three.camera.lookAt(new THREE.Vector3(0,0,0));

	  var width = ThreeContainer.clientWidth;
	  var height = ThreeContainer.clientHeight;
	  var aspect = width / height;
	  three.camera.aspect = aspect;
	  three.camera.updateProjectionMatrix();

	  three.renderer.setSize(width, height);
	  three.renderer.render(three.scene, three.camera);
	}
function addBuilding(x, y){
	//var idx = 279416
	//var idy = 116071
	
	var idx = x;
	var idy = y;
	
	var layerUrl = "http://xdworld0.vworld.kr:8080/XDServer/3DData?Version=2.0.0.0&Request=GetLayer&Key=767B7ADF-10BA-3D86-AB7E-02816B5B92E9&Layer=facility_build&Level=15&IDX="+idx+"&IDY="+idy;
	var _data = {};
	//http://xdworld0.vworld.kr:8080/XDServer/3DData?Version=2.0.0.0&Request=GetLayer&Layer=facility_build&Level=15&IDX=279403&IDY=116056&Key=767B7ADF-10BA-3D86-AB7E-02816B5B92E9&DataFile=d_09262.xdo
	
	var promise = $.ajax({
	    url: layerUrl,
	    dataType: "binary",
	});
	
	promise.done(function (data) {
	    var p = new Parser(data);
	    
	    // header
	    _data.level = p.getUint4();
	    _data.idx = p.getUint4();
	    _data.idy = p.getUint4();
	    _data.objectCount = p.getUint4();
	    _data.obj = [];
	   
	    // model object
	    for(var i=0;i<_data.objectCount; i++){
	    	//if ( p.offset != p.dv.buffer.byteLength ){
		    	var obj = {};
		    	obj.version = p.getVersion();
		    	obj.type = p.getUint1();
			    var lenStr = p.getLenStr();
			    obj.keyLen = lenStr.len;
			    obj.key = lenStr.str;
			
			    obj.centerPosX = p.getFloat8();
			    obj.centerPosY = p.getFloat8();
			    obj.altitude = p.getFloat4();
			    obj.box = p.getBox3dd();
			
			    obj.imgLevel = p.getUint1();
			    var lenStr = p.getLenStr();
			    obj.dataFileLen = lenStr.len;
			    obj.dataFileName = lenStr.str;
			
			    var lenStr = p.getLenStr();
			    obj.imgFileLen = lenStr.len;
			    obj.imgFileName = lenStr.str;
			    
			    _data.obj.push(obj);
			    //getData(layerUrl, obj);
	    	//}
	    }
	    
	    if(_data.obj.length > 0) getData(layerUrl, _data.obj);
	});
}

function getData(layerUrl, dataList){
	var _data = dataList[dataList.length-1];
//	if(layerUrl+"&DataFile="+_data.dataFileName == "http://xdworld0.vworld.kr:8080/XDServer/3DData?Version=2.0.0.0&Request=GetLayer&Key=767B7ADF-10BA-3D86-AB7E-02816B5B92E9&Layer=facility_build&Level=15&IDX=279433&IDY=116076&DataFile=t991.xdo"){
//		debugger;
//	}
	var promise = $.ajax({
        url: layerUrl+"&DataFile="+_data.dataFileName,
        dataType: "binary",
    });

    promise.done(function (data1) {
        var p1 = new Parser(data1);
     	// object Attribute
     	_data.objType = p1.getUint1();
     	
     	if( _data.objType == 8 ){
     	
	     	_data.objectID = p1.getUint4();
	     	var lenStr = p1.getLenStr();
	        _data.keyLen = lenStr.len;
	        _data.objBox = p1.getBox3dd();
	        _data.objAltitude = p1.getFloat4();
	        
	        if( _data.version == "3.0.0.2" ) _data.faceNum = p1.getUint1();
	        
	        // 3d Mesh Data
	       	var vertex = p1.getCountVert();
	        _data.vertexCount = vertex.count;
	        _data.vertex = vertex.vert;
	        
	        var index = p1.getCountIndex();
	        _data.indexCount = index.count;
	        _data.indexed = index.index;
	        
	        _data.color = p1.getUint4();
	        
	        _data.imageLevel = p1.getUint1();
	        
	        var imageStr = p1.getLenStr();
	        _data.imageNameLen = imageStr.len;
	        _data.imageName = imageStr.str;
	        
	        var nailTexture = p1.getLenStr();
	        
	        _data.nailTextureSize = nailTexture.len;
	        _data.nailTextureData = nailTexture.str;
	        
	        //console.log("data:image/jpeg;base64," + window.btoa(_data.nailTextureData));
			
	        var vert = _data.vertex;
	    	var index = _data.indexed;
	    	
	    	// 1. Geometry  생성
	    	var geometry = new THREE.Geometry();
	    	
	    	for (var i = 0; i < vert.length; i += 3) {
	    	    var v1 = vert[i];
	    	    var v2 = vert[i + 1];
	    	    var v3 = vert[i + 2];
	    		
	    	    // 2. 버텍스 추가
	    	    geometry.vertices.push(new THREE.Vector3(v1.pos.x, -1*v1.pos.y, v1.pos.z));
	    	    geometry.vertices.push(new THREE.Vector3(v2.pos.x, -1*v2.pos.y, v2.pos.z));
	    	    geometry.vertices.push(new THREE.Vector3(v3.pos.x, -1*v3.pos.y, v3.pos.z));
	    	
	    	    // 3. 버텍스 인덱스 추가
	    	    geometry.faces.push(new THREE.Face3(index[i], index[i + 1], index[i + 2] ));
	    		
	    	    // 4. UV 추가
	    	    geometry.faceVertexUvs[0].push([
	    	        new THREE.Vector2(v1.uv.x, 1 - v1.uv.y),
	    	        new THREE.Vector2(v3.uv.x, 1 - v3.uv.y),
	    	        new THREE.Vector2(v2.uv.x, 1 - v2.uv.y)
	    	        //new THREE.Vector2(v1.uv.x, v1.uv.y),
	    	        //new THREE.Vector2(v3.uv.x, v3.uv.y),
	    	        //new THREE.Vector2(v2.uv.x, v2.uv.y)
	    	    ]);
	    	}
	    	
	    	geometry.uvsNeedUpdate = true;
	    	
	    	// 5. 이미지 파일 추가
	    	var textureLoader = new THREE.TextureLoader();
	    	textureLoader.crossOrigin = "Anonymous";
	    	var myTexture = textureLoader.load(layerUrl+"&DataFile="+_data.imageName);
	    	/*
	    	var image = document.createElement( 'img' );
			document.body.appendChild( image );
			
			myTexture = new THREE.Texture( image );
			
			image.addEventListener( 'load', function ( event ) { myTexture.needsUpdate = true; } );
			image.src = layerUrl+"&DataFile="+_data.imageName;  
			*/
	    	// 6. 메테리얼 생성
	    	var material = new THREE.MeshBasicMaterial({
	    	    side: THREE.DoubleSide,
	    	    map: myTexture
	    	    //wireframe: true
	    	});
	    	
	    	// 7. 메시 생성
	    	var build = new THREE.Mesh(geometry, material);
	    	
	         var buildGroup = new THREE.Group();
	         buildGroup.add(build);
	         three.scene.add(buildGroup);
	         
	         _3DOB = new _3DObject();
	       	 _3DOB.threeMesh = buildGroup;
	       	 _3DOB.centerWGS84 = [_data.centerPosX, _data.centerPosY, _data.objAltitude];
	       	 _3DOB.bbox = _data.objBox;
	       	 
	       	 console.log(_data);
	       	 
	       	 _3Dobjects.push(_3DOB);
	       	 
			if( dataList.length > 1 ) getData(layerUrl, dataList.splice(0, dataList.length-1));
     	}
    });
}
function getLayerNode( bbox ){
	var layerUrl = "http://xdworld.vworld.kr:8080/XDServer/3DData?Version=2.0.0.0&Request=GetLayerExists&Key=767B7ADF-10BA-3D86-AB7E-02816B5B92E9&Layer=facility_build&Level=15&CheckFlag=True&BBOX=";
	
	$.ajax({
        url: layerUrl+bbox.join(","),
        success: function(result){
        	if(result.childNodes[0].childNodes[1].childNodes[0].children){
	        	var nodes = result.childNodes[0].childNodes[1].childNodes[0].children;
	        	var count = result.childNodes[0].childNodes[1].childNodes[0].childElementCount;
	        	
	        	for(var i=0;i<count;i++){
	        		
	        		if( !_tiles[nodes[i].getAttribute("IDX")+","+nodes[i].getAttribute("IDY")] ){
	        			_tiles[nodes[i].getAttribute("IDX")+","+nodes[i].getAttribute("IDY")] = true;
	        			addBuilding(nodes[i].getAttribute("IDX"), nodes[i].getAttribute("IDY"));
	        		}
	        	}
        	}
        }
	})
}

</script>
<script>
$.ajaxSetup({
    beforeSend: function (jqXHR, settings) {
        if (settings.dataType === 'binary') {
            settings.xhr().responseType = 'blob';
        }
    }
});

$.ajaxTransport("+binary", function (options, originalOptions, jqXHR) {
    if (window.FormData && ((options.dataType && (options.dataType == 'binary'))
            || (options.data && ((window.ArrayBuffer && options.data instanceof ArrayBuffer)
                || (window.Blob && options.data instanceof Blob))))) {
        return {
            send: function (headers, callback) {
                var xhr = new XMLHttpRequest(),
                    url = options.url,
                    type = options.type,
                    async = options.async || true,                        
                    dataType = options.responseType || "arraybuffer",
                    data = options.data || null;

                xhr.addEventListener('load', function () {
                    var data = {};
                    data[options.dataType] = xhr.response;
                    callback(xhr.status, xhr.statusText, data, xhr.getAllResponseHeaders());
                });

                xhr.open(type, url, async);

                for (var i in headers) {
                    xhr.setRequestHeader(i, headers[i]);
                }

                xhr.responseType = dataType;
                xhr.send(data);
            },
            abort: function () {
            }
        };
    }
});

class Parser {
    constructor(data) {
        this.dv = new DataView(data);
        this.endian = true;
        this.offset = 0;
    }

    getUint4() {
        const val = this.dv.getUint32(this.offset, this.endian);
        this.offset += 4;
        return val;
    }

    getUint1() {
        const val = this.dv.getUint8(this.offset, this.endian);
        this.offset += 1;
        return val;
    }

    getUint2() {
        const val = this.dv.getUint16(this.offset, this.endian);
        this.offset += 2;
        return val;
    }

    getLenStr() {
        const len = this.getUint1();

        var str = "";
        var val = "";
        for (var i = 0; i < len; i++) {
            val = this.getUint1();
            str += String.fromCharCode(val);
        }
        return {
            len: len,
            str: str,
        };
    }

    getFloat8() {
        const val = this.dv.getFloat64(this.offset, this.endian);
        this.offset += 8;
        return val;
    }

    getFloat4() {
        const val = this.dv.getFloat32(this.offset, this.endian);
        this.offset += 4;
        return val;
    }

    getVersion() {
        const val = this.getUint1()+"."+this.getUint1()+"."+this.getUint1()+"."+this.getUint1();
        return val;
    }

    getBox() {
        var minX = this.getFloat8();
        var maxX = this.getFloat8();
        var minY = this.getFloat8();
        var maxY = this.getFloat8();
        var minZ = this.getFloat8();
        var maxZ = this.getFloat8();
        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY,
            minZ: minZ,
            maxZ: maxZ
        }
    }

    getVector2df() {
        var x = this.getFloat4();
        var y = this.getFloat4();
        return {
            x: x,
            y: y
        }
    }

    getVector3df() {
        var x = this.getFloat4();
        var y = this.getFloat4();
        var z = this.getFloat4();
        return {
            x: x,
            y: y,
            z: z
        }
    }

    getVector3dd() {
        var x = this.getFloat8();
        var y = this.getFloat8();
        var z = this.getFloat8();
        return {
            x: x,
            y: y,
            z: z
        }
    }

    //http://irrlicht.sourceforge.net/docu/structirr_1_1video_1_1_s3_d_vertex.html
    getCountVert() {
        const count = this.getUint4();
        var vert = [];
        for (var i = 0; i < count; i++) {
            const pos = this.getVector3df();
            const normal = this.getVector3df();
            const uv = this.getVector2df();

            vert.push({
                pos: pos,
                normal: normal,
                uv: uv
            })
        }
        return {
            count: count,
            vert: vert
        };
    }

    getCountIndex() {
        const count = this.getUint4();
        var index = [];
        for (var i = 0; i < count; i++) {
            const val = this.getUint2();
            index.push(val)
        }
        return {
            count: count,
            index: index
        };
    }


    getBox3dd() {
        const min = this.getVector3dd();
        const max = this.getVector3dd();
        return {
            min: min,
            max: max
        }
    }
}
</script>
<script> main(); </script>


</html>
