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
	<script src="lib/ol3d/ol3d.js"></script>

	<!-- jQuery Script, CSS Load -->
	<link href="lib/jQueryUI-v1.11.2/jquery-ui.min.css" rel="stylesheet">
	<script src="lib/jQuery-v3.2.1/jquery-3.2.1.min.js"></script>
	<script src="lib/jQueryUI-v1.11.2/jquery-ui.js"></script>

	<!-- Cesium 3D MAP -->
	<link rel="stylesheet" type="text/css" href="lib/ol-cesium/olcs.css">
	
	<!-- Three.js -->
	<script src="lib/three/three.min.js"></script>
	
	<!-- 
	<script src="lib/cesium/Cesium.js"></script>
	<script src="lib/ol-cesium/olcesium.js"></script>
	 -->
	<!-- /Cesium 3D MAP -->
	
	<script src="http://3dgis.seoul.go.kr/js/proj4.js"></script>
</head>
<body>
	<div class="div-container">
		<div id='dfdcf1b2-42db-42ee-a632-986f292208b5' style="width:100%;height:100%" class="mapstudio-content-body mapstudio-content-flex-column" data-parent="contents/">
			<div style='display: -webkit-flex;display: flex; position: relative;height: 100%;'>
			   	<div class="center-container" style="min-height:500px;color:#000;display: flex;flex-direction: column; position: relative; width:100%; background-color: rgb(235, 235, 235);">
			   		<div id="extraCanvasDiv" class="extraCanvasDiv">
						<canvas id="extraCanavs" class="extraCanavs"></canvas>
					</div>
					<div id="ThreeContainer"></div>
			   		<div class="map-container">
				   		<div id="dfdcf1b2-42db-42ee-a632-986f292208b5_base" style="position: absolute; width: 100%; height: 100%;z-index:1;"></div>
				   		<div id="dfdcf1b2-42db-42ee-a632-986f292208b5_map" style="position: absolute; width: 100%; height: 100%; z-index:2;"></div>
			   		</div>
			   		<div id="dfdcf1b2-42db-42ee-a632-986f292208b5_popup" class="ol-popup">
					      <a href="#" id="dfdcf1b2-42db-42ee-a632-986f292208b5_popup-closer" class="ol-popup-closer"></a>
					      <div id="dfdcf1b2-42db-42ee-a632-986f292208b5_popup-content"></div>
				    </div>
			   		<div class="time-container" style="display:none;"></div>
			   	</div>
		
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
<script>
var scene = {};

scene.center_x = 198046;
scene.center_y = 551895;

scene.rotation = 0 * Math.PI / 180;
scene.tilt = 55 * Math.PI / 180;
scene.range = 480;


var _three = {};
var _ThreeContainer = document.getElementById("ThreeContainer");

function getSceneParameter() {
	var hashObject = getHash();
	
	if(hashObject === null) {
		return scene;
	}
	parseHash(hashObject);

	return scene;
}

function getHashString() {
	
	var hash = location.hash;
	if(hash === undefined || hash.length === 0) {
		return null;
	}
	hash = hash.replace("#", "");
	
	return hash;
}

function getHash() {
	
	var hashObject = {};
	
	var hashString = getHashString();
	if(hashString === null) {
		return null;
	}
	
	var temp = hashString.split("&");
	if(temp.length < 2) {
		return null;
	}
	
	var hashValue = temp[0];
	var checkEncodeValue = temp[1];
	
	switch(true) {
		case isLike(checkEncodeValue, "encode=y"):
		case isLike(checkEncodeValue, "encode=yes"):
			// window.atob exception 처리.
			hashObject.hashValue = window.atob(hashValue);	
			hashObject.encode = true;
			break;
		case isLike(checkEncodeValue, "encode=no"):
		case isLike(checkEncodeValue, "encode=n"):
			hashObject.hashValue = hashValue;
			hashObject.encode = false;
			break;
		default:
			hashObject = null;
			break;
	}
	
	return hashObject;
}

function parseHash(hashObject) {
	
	var hash = hashObject.hashValue;
	var hashValues = hash.split(",");
	var hashValueLength = hashValues.length;
	
	var encode = hashObject.encode;
	var transfactor = 1;
	
	if(encode == false) {
		transfactor = Math.PI/180;
	}
	
	switch(hashValueLength) {
		case 0:
		case 1:
			break;
		case 2:
			scene.center_x = parseFloat(hashValues[0]);
			scene.center_y = parseFloat(hashValues[1]);
			
			break;
		case 3:
			scene.center_x = parseFloat(hashValues[0]);
			scene.center_y = parseFloat(hashValues[1]);
			scene.rotation = parseFloat(hashValues[2]) * transfactor;
			
			break;
		case 4:
			scene.center_x = parseFloat(hashValues[0]);
			scene.center_y = parseFloat(hashValues[1]);
			scene.rotation = parseFloat(hashValues[2]) * transfactor;
			scene.tilt = parseFloat(hashValues[3]) * transfactor;
			
			break;
		case 5:
			scene.center_x = parseFloat(hashValues[0]);
			scene.center_y = parseFloat(hashValues[1]);
			scene.rotation = parseFloat(hashValues[2]) * transfactor;
			scene.tilt = parseFloat(hashValues[3]) * transfactor;
			scene.range = parseFloat(hashValues[4]);
			
			break;
		default:
			break;
	}
}

function isLike(src, dest) {
	if(src.toUpperCase() === dest.toUpperCase()) {
		return true;
	}
	return false;
}


var ol3dApp = {};

ol3dApp.defaults = {};

var isDebug = true;

var prefix3D = "http://3dgis.seoul.go.kr/w3d";
var prefix2D = "http://3dgis.seoul.go.kr/wms";

var sceneParameter = getSceneParameter();

var center_x = sceneParameter.center_x;
var center_y = sceneParameter.center_y;

var rotation = sceneParameter.rotation;
var tilt = sceneParameter.tilt;
var range = sceneParameter.range;

ol3dApp.defaults.center = [center_x, center_y];

ol3dApp.defaults.lastCenter = ol3dApp.defaults.center; 
ol3dApp.defaults.isMobile = (/mobile|tablet|ip(ad|hone|od)|android/i).test(navigator.userAgent);
ol3dApp.defaults.wmsDefaultLayer = 'seoul:Seoul_Default';

proj4.defs('EPSG:5179','+ellps=GRS80 +proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +units=m +no_defs');
proj4.defs('EPSG:5181','+ellps=GRS80 +proj=tmerc +lat_0=38 +lon_0=127   +k=1      +x_0=200000  +y_0=500000  +units=m +no_defs');
proj4.defs('urn:ogc:def:crs:EPSG:5186','+ellps=GRS80 +proj=tmerc +lat_0=38 +lon_0=127   +k=1      +x_0=200000  +y_0=600000  +units=m +no_defs');
proj4.defs('EPSG:KATEC','+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');
proj4.defs('EPSG:4326','+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs');

ol3dApp.projections = {};
ol3dApp.projections.projLocal = ol.proj.get('urn:ogc:def:crs:EPSG:5186');
ol3dApp.projections.projKATEC = ol.proj.get('EPSG:KATEC');
ol3dApp.projections.projLongLat = ol.proj.get('EPSG:4326');

var projLocal = ol.proj.get('urn:ogc:def:crs:EPSG:5186');

projLocal.setExtent([153468,513944, 219004,579480]);
projLocal.setDefaultTileGrid(new ol.tilegrid.TileGrid({
                      origin     : [153468,513944],
                      extent     : [153468,513944, 219004,579480],
                      resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                      tileSize   : [256, 256]
                    }));

var projDaum = ol.proj.get('EPSG:5181');
projDaum.setExtent([-30000,-60000,1018576,988576]);
projDaum.setDefaultTileGrid(new ol.tilegrid.TileGrid({
                      origin     : [-30000,-60000],
                      extent     : projDaum.getExtent(),
                      resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125],
                      minZoom    : 2,
                      tileSize   : [256, 256]
                      }));

var projNaver = ol.proj.get('EPSG:5179');
projNaver.setExtent([90112, 1192896, 1138688, 2241472]);
projNaver.setDefaultTileGrid(new ol.tilegrid.TileGrid({
                      origin     : [90112, 1192896],//1192896 2241472
                      extent     : projNaver.getExtent(),
                      resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125],
                      minZoom    : 3,
                      tileSize   : [256, 256]
                      }));

// interactions
ol3dApp.interactions = {};

// Keyborad
ol3dApp.interactions.Keyborad  = new ol.interaction.Keyboard3d({panDelta:8, zoomDelta:0.05, rotateDelta:0.5, tiltDelta:-0.5,rotateDuration:0});
// lookAround camera
ol3dApp.interactions.lookAround  = new ol.interaction.FpsCamera3d({duration:3000,lodQaulity:1.0});
// Measure Elevation
ol3dApp.interactions.measureElev = new ol.interaction.MeasureElevation3d();
// Measure Line
ol3dApp.interactions.measureLine = new ol.interaction.MeasureLine3d();
// Measure Area
ol3dApp.interactions.measureArea = new ol.interaction.MeasureArea3d();
// Measure Verivcal Profile
ol3dApp.interactions.measureProf = new ol.interaction.MeasureProfile3d();
// Main Cameara
ol3dApp.interactions.camera      = new ol.interaction.FreeCamera3d({dragFocus : !ol3dApp.defaults.isMobile, dragOnBuilding : true, kinetic:new ol.Kinetic(-0.005, 0.05, 100)});
// Picking Building
ol3dApp.interactions.pickerBuilding = new ol.interaction.PickBuilding3d();

// controls
ol3dApp.constrols = {};

ol3dApp.constrols.overviewmap = new ol.control.OverviewMap(
  {
    collapsed:false,
    layers:[new ol.layer.Tile({
          visible  : true,
          opacity  : 1.0,
          preload  : 0,
          source   : new ol.source.XYZ({
            crossOrigin : 'anonymous',
            cacheSize   : 32,
            projection  : projNaver,
            tileUrlFunction : function(tileCoord, pixelRatio, projection) {
              if (!tileCoord) { return undefined; }
              return ('http://onetile{s}.map.naver.net/get/203/0/0/{z}/{x}/{-y}/bl_vc_bg/ol_vc_an')
                .replace('{s}' ,(tileCoord[1]%4+1))
                .replace('{z}' ,tileCoord[0])
                .replace('{-y}',(1<<tileCoord[0])+tileCoord[2])
                .replace('{x}' ,tileCoord[1]);
            }
          })
        })], 
    view : new ol.View({projection : projLocal})
  });

// layers
ol3dApp.layers = {};

ol3dApp.layers.terrainDem = new ol.layer.Tile({
  visible: true,
  preload: ol3dApp.defaults.isMobile?1:2,
  source : new ol.source.Terrain3dTile({
    modelClass  : ol.model3d.EpolarTerrain,
    keepCacheZoom : 5,
    crossOrigin :'anonymous',
    cacheSize   : 512,
    projection  : projLocal,
    tileGrid    : new ol.tilegrid.TileGrid({
                  origin     : [153468,513944],
                  extent     : [153468,513944, 219004,579480],
                  resolutions: [1024, 512,256, 128, 64, 32, 16, 8, 4, 2, 1],
                  tileSize   : [64, 64]
                }),
    tileUrlFunction : function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) { return undefined; }
            return (prefix3D + '/tile.sqlite/dem/{z}/{x}/{-y}.wgl')
              .replace('{z}' ,tileCoord[0])
              .replace('{-y}',tileCoord[2])
              .replace('{x}' ,tileCoord[1])
              ;
          }
  })
});

// terrain-texutre
ol3dApp.layers.terrainOrthoPrimary = new ol.layer.Tile({
  visible: true,
  preload: ol3dApp.defaults.isMobile?1:2,
  source : new ol.source.XYZ({
    crossOrigin :'anonymous',
    cacheSize   : 10, 
    projection  : projLocal,
    tileGrid    : new ol.tilegrid.TileGrid({
                  origin     : [153468,513944],
                  extent     : [153468,513944, 219004,579480],
                  resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                  tileSize   : [256, 256]
                }),
    tileUrlFunction : function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) { return undefined; }
            return (prefix3D + '/tile.sqlite/terrain_vw/{z}/{x}/{-y}.jpg')
              .replace('{z}' ,tileCoord[0])
              .replace('{-y}',tileCoord[2])
              .replace('{x}' ,tileCoord[1]);
          }
  })
});

// terrain-texutre-seoul
ol3dApp.layers.terrainOrthoSecondary = new ol.layer.Tile({
  visible: false,
  preload: 1,
  source : new ol.source.XYZ({
    crossOrigin :'anonymous',
    cacheSize   : 10, 
    projection  : projLocal,
    tileGrid    : new ol.tilegrid.TileGrid({
                  origin     : [153468,513944],
                  extent     : [153468,513944, 219004,579480],
                  resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                  tileSize   : [256, 256]
                }),
    tileUrlFunction : function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) { return undefined; }
            return (prefix3D + '/tile.sqlite/terrain_se/{z}/{x}/{-y}.jpg')
              .replace('{z}' ,tileCoord[0])
              .replace('{-y}',tileCoord[2])
              .replace('{x}' ,tileCoord[1]);
          }
  })
});

// WMS
ol3dApp.layers.terrainOrthoWMS = new ol.layer.Tile({
  extent   : projLocal.getExtent(),
  preload  : 0,
  opacity  : 1.0,
  visible  : true,
  source   : new ol.source.TileWMS(({
    cacheSize   : 128,
    projection  : projLocal,
    url        : prefix2D + '/geoserver/seoul/wms',
    crossOrigin:'anonymous',
    params     : {'SERVICE':'WMS', 'VERSION':'1.1.1', 'TILED': true, 'CRS': 'EPSG:5186',
                  'TRANSPARENT':true, 'BGCOLOR':'0x000000', 'WIDTH': 256, 'HEIGHT': 256, 'FORMAT_OPTIONS':'ANTIALIASING:OFF',
                  'FORMAT': 'image/png8', 
                  'LAYERS': 'seoul:Seoul_Default'},
    serverType : 'geoserver'
    }))
});

// Building(vw)
ol3dApp.layers.buildingVW = new ol.layer.Tile({
  visible: true,
  preload: ol3dApp.defaults.isMobile?1:4,
  source : new ol.source.Model3dTile({
    modelClass  : ol.model3d.EpolarBuilding,
    keepCacheZoom : 5,
    startupPreload: 0,
    crossOrigin :'anonymous',
    cacheSize   : ol3dApp.defaults.isMobile?64:256,
    projection  : projLocal,
    tileGrid    : new ol.tilegrid.TileGrid({
                  origin     : [153468,513944],
                  extent     : [153468,513944, 219004,579480],
                  resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                  tileSize   : [256, 256],
                  minZoom    : 5
                }),
    tileUrlFunction : function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) { return undefined; }
            return (prefix3D + '/tile.sqlite/building/{z}/{x}/{-y}.{ext}')
              .replace('{z}' ,tileCoord[0])
              .replace('{-y}',tileCoord[2])
              .replace('{x}' ,tileCoord[1]);
          }
  })
});

// structure_se(casle)
ol3dApp.layers.structureSE = new ol.layer.Tile({
  visible: false,
  preload: 0,
  source : new ol.source.Model3dTile({
    modelClass  : ol.model3d.EpolarBuilding,
    keepCacheZoom : 4,
    startupPreload: 0,
    crossOrigin :'anonymous',
    cacheSize   : ol3dApp.defaults.isMobile?64:256,
    projection  : projLocal,
    tileGrid    : new ol.tilegrid.TileGrid({
                  origin     : [153468,513944],
                  extent     : [153468,513944, 219004,579480],
                  resolutions: [256, 128, 64, 32, 16],
                  tileSize   : [256, 256],
                  minZoom    : 4
                }),
    tileUrlFunction : function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) { return undefined; }
            return (prefix3D + '/tile.sqlite/structure_se/{z}/{x}/{-y}.{ext}')
              .replace('{z}' ,tileCoord[0])
              .replace('{-y}',tileCoord[2])
              .replace('{x}' ,tileCoord[1]);
          }
  })
});

ol3dApp.layers.buildingDrone = new ol.layer.Tile({
	visible: true,
	preload: ol3dApp.defaults.isMobile?1:4,
	source : new ol.source.Model3dTile({
		modelClass  : ol.model3d.EpolarBuilding,
		keepCacheZoom : 4,
		startupPreload: 0,
		crossOrigin :'anonymous',
		cacheSize   : ol3dApp.defaults.isMobile?64:256,
		projection  : projLocal,
		tileGrid    : new ol.tilegrid.TileGrid({
			origin     : [153468,513944],
			//extent     : [153468,513944, 219004,579480],
			extent : [195954, 550030, 196742, 550818],
			resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
			tileSize   : [256, 256],
			minZoom    : 5
		}),
		tileUrlFunction : function(tileCoord, pixelRatio, projection) {
			if (!tileCoord) { return undefined; }
			return (prefix3D + '/tile.sqlite/building_dron/{z}/{x}/{-y}.{ext}')
			.replace('{z}' ,tileCoord[0])
			.replace('{-y}',tileCoord[2])
			.replace('{x}' ,tileCoord[1])
		}
	})
});

// structure_vw(bridge)
ol3dApp.layers.structureVW = new ol.layer.Tile({
  visible: true,
  preload: 0,
  source : new ol.source.Model3dTile({
    modelClass  : ol.model3d.EpolarBuilding,
    keepCacheZoom : 4,
    startupPreload: 0,
    crossOrigin :'anonymous',
    cacheSize   : ol3dApp.defaults.isMobile?64:256,
    projection  : projLocal,
    tileGrid    : new ol.tilegrid.TileGrid({
                  origin     : [153468,513944],
                  extent     : [153468,513944, 219004,579480],
                  resolutions: [256, 128, 64, 32, 16],
                  tileSize   : [256, 256],
                  minZoom    : 4
                }),
    tileUrlFunction : function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) { return undefined; }
            return (prefix3D + '/tile.sqlite/structure_vw/{z}/{x}/{-y}.{ext}')
              .replace('{z}' ,tileCoord[0])
              .replace('{-y}',tileCoord[2])
              .replace('{x}' ,tileCoord[1]);
          }
  })
});

// POI
var poiTileGrid = new ol.tilegrid.TileGrid({
                      origin     : [153468,513944],
                      extent     : [153468,513944, 219004,579480],
                      resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                      tileSize   : [256, 256],
                      minZoom    : 0,
                      maxZoom    : 10
                    });
ol3dApp.layers.poi = new ol.layer.Tile({
  extent   : projLocal.getExtent(),
  preload  : 0,
  opacity  : 1.0,
  visible  : true,
  source   : new ol.source.Poi3dTile(({
        crossOrigin :'anonymous',
        cacheSize   : 10, 
        projection  : projLocal,
        format: new ol.format.GeoJSON({
          defaultProjection: 'urn:ogc:def:crs:EPSG:5186'
        }),
        tileGrid    : poiTileGrid,
        tileUrlFunction : function(tileCoord, pixelRatio, projection) {
                if (!tileCoord) { return undefined; }
                var tileExtent = poiTileGrid.getTileCoordExtent(tileCoord);
                var url = (prefix2D + '/geoserver/seoul/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName=seoul:poi_base&CQL_FILTER=level<={z} and bbox(geom,{x1},{y1},{x2},{y2})')
                  .replace('{x1}' ,tileExtent[0])
                  .replace('{y1}' ,tileExtent[1])
                  .replace('{x2}' ,tileExtent[2])
                  .replace('{y2}' ,tileExtent[3])
                  .replace('{z}'  ,tileCoord[0]);
                //console.log(url);  
                return url;
              }
      }))
});

// CCTV Video
ol3dApp.layers.cctv = new ol.layer.Cctv3d({
  visible  : false,
  opacity  : 0.9,
  source : new ol.source.Cctv3d({
    projection : projLocal
  })
});

// DEBUG Tile
ol3dApp.layers.debug = new ol.layer.Tile({
	  visible  : true,
	  opacity  : 0.9,
	  source   : new ol.source.TileDebug3d({
	    projection : projLocal,
	    tileGrid   : new ol.tilegrid.TileGrid({
	    	origin     : [153468,513944],
            extent     : [153468,513944, 219004,579480],
            resolutions: [256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
            tileSize   : [256, 256]
          }),
	  })
	});

// styles
ol3dApp.styles = {};

ol3dApp.styles.markerIconUri = 'data:image/png;base64,'
  + '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'
;

var markerImage = new Image();
markerImage.src = ol3dApp.styles.markerIconUri;

markerImage.onload = function() {
	ol3dApp.styles.markerSearch = new ol.style.Style({
	      image: new ol.style.Icon({
	        img:markerImage
	        ,imgSize:[markerImage.width, markerImage.height]
	      })
	  });
}

var rotateImage = new Image();

rotateImage.src='data:image/png;base64,'
	 + 'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAC8klEQVRIiY3WW29WVRAG4Gc2X1VsKwWDloakScUqieEQ0MQTeIiJJqJX/BEu/Qkm/A8Tb4yJp8QjBhMNCEEOEdSoCMWmArWlAm0ZL9YqLV++XVjJTvZea+add2bNu9YO9zAycwibMHCZvkFu9nENExFxdTXfuAvwdmzHIKZnmRs4eHDcvn0XFsfHcw3rMIsTEXHsngNk5jDeQB+O4FxEzEDyLj4IvsvMQTyO3VjAxxFxaTXSMnM8Mw9k5iuZ2bljjbHk2+SdLp9OtT+QmU+uXOt0GY7iLXwWET/1iL8H92N3sj64AhGxgC8z82+8mZk/R0RCswK8v4J/1Qs8S7lewDwexdPdNhFxCp9j79JcU8E3VHYTEXG0B3PYii1KrRu81MsoIo5jZ2Y+vDKD5/AYvmgBVwk8UJIxjx1ZWrfX+BXPQlM3crSyv9LLOnmwkpivU7cwVOd6jSMYzcy+BiO4id9WYb8Dm+v7YH0a7MnerX6pYo402ICrmGxh3+BtDJdP79VnHi/iqW6fiLhVMTd00I/riiJ7jQaHcAK/BN/XwIcUkV1v8fsP/Z2Wxdvj/czcxNQN5tbRmWEjHKVvmotrmRPtJ05HObRGMIDpboP9ZUPH8AxuYAZ28ZCydq4Fey0uNIoah/BIL6uqyB+Uml5XlHyfsgenI+J8t09mNhXzcoML1WGsNU/+UJqgwWJlnjjZYj9cMS829Rw5j5HMXN+SxQLOWBZmo5TzbEuAXfgrIuaXHA4rOnh5lSxOK50RWIOzEXGtxXZLxSyMIuIffIPNmbmzJYtJ/Kk0xgJO9bLLzG04HhFTtwNUgFl8iFczc2sLs5PVZ1LZl27wJ/Aavl6au0MHEfF7Zn6E1zNzIw5HxOIKk7P4F2fqviwBr8HzSu0/XboLaL8yNylXZoMflXrP1rW9OBURU5k5oKh5l9JZn0TExB2kW0ohM0M55LZZFuGM0n6LipCGFKGewLGVzO8aoCvYevW3RbnZblr+bel5xC+N/wFYZRmTpx8usQAAAABJRU5ErkJggg==';
	
 rotateImage.alt = 'compass 이미지';
//
// map
//

ol3dApp.create = function() {
ol3dApp.map = new ol.Map3d({
   logo : false  
  ,keyboardEventTarget:document
  ,interactions:
    [
      ol3dApp.interactions.Keyborad
     ,ol3dApp.interactions.pickerBuilding
     ,ol3dApp.interactions.measureElev, ol3dApp.interactions.measureLine
     ,ol3dApp.interactions.measureArea, ol3dApp.interactions.measureProf
     ,ol3dApp.interactions.lookAround , ol3dApp.interactions.camera
    ]
  ,controls: [ol3dApp.constrols.overviewmap
             ,new ol.control.Rotate({label:rotateImage, autoHide:false}),
             new ol.control.Zoom3d()]
  // layers
  ,layers: [
     ol3dApp.layers.terrainDem
    ,ol3dApp.layers.terrainOrthoPrimary
    ,ol3dApp.layers.terrainOrthoSecondary
    ,ol3dApp.layers.terrainOrthoWMS
    ,ol3dApp.layers.buildingVW
    ,ol3dApp.layers.buildingDrone
    ,ol3dApp.layers.structureVW
    ,ol3dApp.layers.structureSE
    ,ol3dApp.layers.poi
    ,ol3dApp.layers.cctv
    ,ol3dApp.layers.debug
    ]
  ,target  : "dfdcf1b2-42db-42ee-a632-986f292208b5_map"
  ,renderer: 'webgl'
  ,loadTilesWhileInteracting: !ol3dApp.defaults.isMobile
  ,loadTilesWhileAnimating  : !ol3dApp.defaults.isMobile
  ,loadBuildingAfterTerrain :  ol3dApp.defaults.isMobile
  ,view    : new ol.View3d({
     projection : projLocal
    ,center  : ol3dApp.defaults.center
    ,extent  : [179190,536547,216242,566864]
    ,zoom    : 10
    ,minZoom : 0
    ,maxZoom : 10
    ,rotation: rotation
    ,tilt    : tilt
    ,range   : range
    ,constrainRotation:false
    ,constrainTilt :[(ol3dApp.defaults.isMobile?22:10)*Math.PI/180, 90*Math.PI/180]
    ,constrainRange:[10, 50000]
    ,lodQuality : ol3dApp.defaults.isMobile?0.2:0.5
  })
});
};


//경사도 그리기
canvas = document.getElementById("extraCanavs");
context = canvas.getContext("2d");

// 경사도 canvas 변경
$(window).on("load resize", function() {
	canvas.width = $("#extraCanvasDiv").width();
	canvas.height = $("#extraCanvasDiv").height();
});

// map 생성
ol3dApp.create();

// 맵 view change finished event
ol3dApp.map.on('viewChangeFinished', function(evt) {
	var view = ol3dApp.map.getView();
	var center = view.getCenter();
	var point = ol.proj.transform(
			[ center[0].toFixed(0),
			center[1].toFixed(0) ], ol3dApp.projections.projLocal,
			ol3dApp.projections.projKATEC);

	var rotation = view.getRotation();
	var tilt = view.getTilt();
	var range = view.getRange();

	var hash = center[0] + ',' + center[1] + ',' + rotation + ',' + tilt + ',' + range;
	location.hash = window.btoa(hash) + "&encode=y";

	renderLocalInfo(point[0], point[1]);

	var htmlText = "";

	htmlText += "<li>고도 " + view.getAltitude().toFixed(0) + "m</li>";
	htmlText += "<li>기울임 각도 " + (view.getTilt() * 180 / Math.PI).toFixed(0)
			+ "\u00B0</li>";

	$("#ul_viewInfo").html(htmlText);
});

ol3dApp.interactions.pickerBuilding.setCallback(function(id, layer,
		coordinate) {
});

// 경사도 measure callback
/*
ol3dApp.interactions.measureProf.setCallback(function(coordinates) {
	var dataArray = new Array();
	var coord;
	for (var i = 0; i < coordinates.length; ++i) {
		coord = coordinates[i];
		dataArray[i] = coord.z.toFixed(1);
	}

	google.charts
			.setOnLoadCallback(google_drawChart(coordinates, dataArray));
});
*/

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

function initThree() {
   var fov = 45;
   var width = window.innerWidth;
   var height = window.innerHeight;
   var aspect = width / height;
   var near = 1;
   var far = 10 * 1000 * 1000;

   // 1. Scene 생성
   _three.scene = new THREE.Scene();
   // 2. 카메라 생성
   _three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
   // 3. 렌더러 생성
   _three.renderer = new THREE.WebGLRenderer({alpha: true});
   // 4. 컨테이너에 추가
   _ThreeContainer.appendChild(_three.renderer.domElement);
 }
 
 function init3DObject(){
     // ... 위의 코드 ...  
     
    var idx = 279403
	var idy = 116056
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
	    }
	    debugger;
	    
	    var promise = $.ajax({
	        url: layerUrl+"&DataFile="+_data.dataFileName,
	        dataType: "binary",
	    });
	
	    promise.done(function (data1) {
	        var p1 = new Parser(data1);
	        
	     	// object Attribute
	     	_data.objType = p1.getUint1();
	     	_data.objectID = p1.getUint4();
	     	var lenStr = p1.getLenStr();
	        _data.keyLen = lenStr.len;
	        _data.objBox = p1.getBox3dd();
	        _data.objAltitude = p1.getFloat4();
	        _data.faceNum = p1.getUint1();
	        
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
			
	        var promise = $.ajax({
	            url: layerUrl+"&DataFile="+_data.imageName,
	           	dataType: "binary"
	            //contentType: "application/octet-stream;charset=UTF-8"
	        });
	
	        promise.done(function (data1) {
	        	var binary = '';
	        	var bytes = new Uint8Array( data1 );
	        	var len = bytes.byteLength;
	        	for (var i = 0; i < len; i++) {
	        	    binary += String.fromCharCode( bytes[ i ] );
	        	}
	        	console.log();
	        	
	        	var vert = _data.vertex;
	        	var index = _data.indexed;
	        	
	        	// 1. Geometry  생성
	        	var geometry = new THREE.Geometry();
	        	
	        	for (var i = 0; i < vert.length; i += 3) {
	        	    var v1 = vert[i];
	        	    var v2 = vert[i + 1];
	        	    var v3 = vert[i + 2];
	        		
	        	    // 2. 버텍스 추가
	        	    geometry.vertices.push(new THREE.Vector3(v1.pos.x, v1.pos.y, v1.pos.z));
	        	    geometry.vertices.push(new THREE.Vector3(v2.pos.x, v2.pos.y, v2.pos.z));
	        	    geometry.vertices.push(new THREE.Vector3(v3.pos.x, v3.pos.y, v3.pos.z));
	        	
	        	    // 3. 버텍스 인덱스 추가
	        	    geometry.faces.push(new THREE.Face3(index[i], index[i + 1], index[i + 2]));
	        		
	        	    // 4. UV 추가
	        	    geometry.faceVertexUvs[0].push([
	        	        new THREE.Vector2(v1.uv.x, 1 - v1.uv.y),
	        	        new THREE.Vector2(v3.uv.x, 1 - v3.uv.y),
	        	        new THREE.Vector2(v2.uv.x, 1 - v2.uv.y)
	        	    ]);
	        	}
	        	
	        	geometry.uvsNeedUpdate = true;
	        	
	        	// 5. 이미지 파일 추가
	        	//const textureLoader = new THREE.TextureLoader();
	        	//textureLoader.crossOrigin = "Anonymous";
	        	//const myTexture = textureLoader.load("data:image/jpg;base64,"+window.btoa( binary ));
	        	
	        	var image = document.createElement( 'img' );
				document.body.appendChild( image );
				
				myTexture = new THREE.Texture( image );
				
				image.addEventListener( 'load', function ( event ) { myTexture.needsUpdate = true; } );
				image.src = "data:image/jpg;base64,"+window.btoa( binary );  
				
	        	// 6. 메테리얼 생성
	        	var material = new THREE.MeshBasicMaterial({
	        	    side: THREE.DoubleSide,
	        	    map: myTexture
	        	});
	        	
	        	// 7. 메시 생성
	        	var build = new THREE.Mesh(geometry, material);
	             debugger;
	             var buildGroup = new THREE.Group();
	             buildGroup.add(build);
	             // 5. 메쉬 추가
	             _three.scene.add(buildGroup); // don’t forget to add it to the Three.js scene manually
	        });
	    });
	});
 }
 
 initThree(); // Initialize Three.js renderer
 init3DObject(); // Initialize Three.js object mesh with Cesium Cartesian

</script>


</html>
