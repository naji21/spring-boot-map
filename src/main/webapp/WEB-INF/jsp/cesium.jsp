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
  <link rel="stylesheet" href="Bootstrap/css/bootstrap.css">
    <script src="Bootstrap/js/jquery-1.11.3.min.js"></script>

  <script src="lib/cesium/Cesium.js"></script>
  <script src="lib/bootstrap-v3.3.5/bootstrap.min.js"></script>

  <style>
      @import url(lib/cesium/Widgets/widgets.css);
      html, body, #cesiumContainer {
          width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden;
      }
  </style>
</head>
<body>
	<div id="cesiumContainer"></div>
	<button type="button" class="btn btn-info" id="moni" style="position:absolute;top:20px;" onclick="SetMode('drawPloy')"> 면적 </button>
	<button type="button" class="btn btn-info" style="position:absolute;top:20px;left: 95px;" onclick="SetMode('drawLine')"> 측량 하 다. </button>
	<button type="button" class="btn btn-info" style="position:absolute;top:20px;left: 185px;" onclick="clearDrawingBoard()"> 없애다. </button>
  <script>
    
    var viewer = new Cesium.Viewer("cesiumContainer", {
        animation: true, // 애니메이션 컨트롤 을 보일 지 여부 입 니 다.
        baseLayerPicker: true, // 그림% 1 개의 캡 션 을 편 집 했 습 니 다.
        geocoder: true, // 지명 찾기 컨트롤 표시 여부
        timeline: true, // 타임 라인 컨트롤 을 보일 지 여부 입 니 다.
        sceneModePicker: true, // 투영 방식 컨트롤 을 보일 지 여부 입 니 다.
        navigationHelpButton: false, // 도움말 정보 컨트롤 을 보일 지 여부 입 니 다.
        infoBox: true, // 클릭 요 소 를 표시 할 지 여부 입 니 다.
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
    	imageryProvider: Cesium.createWorldImagery({
            style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }),
        terrainProvider: Cesium.createWorldTerrain()
    });
    
    viewer.scene.primitives.add(Cesium.createOsmBuildings());
    
    var scene = viewer.scene;

    var loadedModels = [];

    var tempPoints = [];
    var tempEntities = [];
    var tempPinEntities = [];
    var tempPinLon, tempPinLat;

    var handler = null;

    function clearEffects() {
        if (handler != null) {
            handler.destroy();
        }
    }

    // 각종 조작 모드 설정
    function SetMode(mode) {
        if (mode == "drawPloy")
        {
            tempPoints = [];
            handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            handler.setInputAction(function (click) {
                var cartesian = viewer.camera.pickEllipsoid(click.position,
scene.globe.ellipsoid);
                if (cartesian) {
                    var cartographic =
Cesium.Cartographic.fromCartesian(cartesian);
                    var longitudeString =
Cesium.Math.toDegrees(cartographic.longitude);
                    var latitudeString =
Cesium.Math.toDegrees(cartographic.latitude);
                    tempPoints.push({ lon: longitudeString, lat:
latitudeString });
                    var tempLength = tempPoints.length;
                    drawPoint(tempPoints[tempPoints.length-1]);
                    if (tempLength > 1) {
                        drawLine(tempPoints[tempPoints.length - 2],
tempPoints[tempPoints.length - 1], true);
                    }
                } 
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            handler.setInputAction(function (click) {
                var cartesian = viewer.camera.pickEllipsoid(click.position,
scene.globe.ellipsoid);
                if (cartesian) {
                    var tempLength = tempPoints.length;
                    if (tempLength < 3) {
                        alert(' 선택 하 세 요. 3 개 이상 의 지점 에서 닫 기 동작 명령 을 수행 합 니 다. ');
                    } else {
                        drawLine(tempPoints[0], tempPoints[tempPoints.length
- 1], true);
                        drawPoly(tempPoints);
                        <!-- highLightAssetsInArea(tempPoints); -->
                        
                    
                var         ent =
                viewer.entities.add({
                    position:
Cesium.Cartesian3.fromDegrees(((tempPoints[0].lon
+(tempPoints[tempPoints.length-1].lon+
tempPoints[tempPoints.length-2].lon)/2)/2 ),
                    ((tempPoints[0].lat
+(tempPoints[tempPoints.length-1].lat+tempPoints[tempPoints.length -2].lat)/2
)/2)),
                    label: {
                        text: SphericalPolygonAreaMeters(tempPoints)
.toFixed(1) + '㎡',
                        font: '22px Helvetica',
                        fillColor: Cesium.Color.BLACK
                    }
                });
            tempEntities.push(ent);
                        tempPoints = [];
                        clearEffects();
                    }

                }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
        
       
        else if ("drawLine" == mode)
        {
            tempPoints = [];
            handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            handler.setInputAction(function (click) {
                var cartesian = viewer.camera.pickEllipsoid(click.position,
scene.globe.ellipsoid);
                if (cartesian) {
                    var cartographic =
Cesium.Cartographic.fromCartesian(cartesian);
                    var longitudeString =
Cesium.Math.toDegrees(cartographic.longitude);
                    var latitudeString =
Cesium.Math.toDegrees(cartographic.latitude);
                    tempPoints.push({ lon: longitudeString, lat:
latitudeString });
                    var tempLength = tempPoints.length;
                    drawPoint(tempPoints[tempPoints.length - 1]);
                    if (tempLength > 1) {
                        drawLine(tempPoints[tempPoints.length - 2],
tempPoints[tempPoints.length - 1], true);
                    }
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.setInputAction(function (click) {
                tempPoints = [];
                clearEffects();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
    }

    function drawPoint(point) {
        var entity = 
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
            label: {
                        text: '',
                        font: '22px Helvetica'
                    },
            point: {
                pixelSize: 10,
                color: Cesium.Color.CHARTREUSE
            }
        });
        tempEntities.push(entity);
    }

    function drawLine(point1, point2, showDistance) {
        var entity =
        viewer.entities.add({
            polyline: {
                positions: [Cesium.Cartesian3.fromDegrees(point1.lon,
point1.lat), Cesium.Cartesian3.fromDegrees(point2.lon, point2.lat)],
                width: 10.0,
                material: new Cesium.PolylineGlowMaterialProperty({
                    color: Cesium.Color.CHARTREUSE.withAlpha(.5)
                })
            }
        });
        tempEntities.push(entity);
        if (showDistance) {
            var w = Math.abs(point1.lon - point2.lon);
            var h = Math.abs(point1.lat - point2.lat);
            var offsetV = w >= h ? 0.0005 : 0;
            var offsetH = w < h ? 0.001 : 0;
            var distance = getFlatternDistance(point1.lat, point1.lon,
point2.lat, point2.lon);
            entity =
                viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(((point1.lon +
point2.lon) / 2) + offsetH,
                    ((point1.lat + point2.lat) / 2) + offsetV),
                    label: {
                        text: distance.toFixed(1) + 'm',
                        font: '22px Helvetica',
                        fillColor: Cesium.Color.WHITE
                    }
                });
            tempEntities.push(entity);
        }
    }

    function drawPoly(points) {
        var pArray = [];
        for (var i = 0; i < points.length; i ++) {
            pArray.push(points[i].lon);
            pArray.push(points[i].lat);
        }
        var entity =
        viewer.entities.add({
            polygon: {
                hierarchy: new
Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(pArray)),
                material: Cesium.Color.CHARTREUSE.withAlpha(.5)
            }
        });
        tempEntities.push(entity);
    }

    // 두 점 의 거 리 를 계산 하 다.
    function getFlatternDistance(lat1, lng1, lat2, lng2) {
        var EARTH_RADIUS = 6378137.0;    // 단위 M
        var PI = Math.PI;

        function getRad(d) {
            return d * PI / 180.0;
        }
        var f = getRad((lat1 + lat2) / 2);
        var g = getRad((lat1 - lat2) / 2);
        var l = getRad((lng1 - lng2) / 2);

        var sg = Math.sin(g);
        var sl = Math.sin(l);
        var sf = Math.sin(f);

        var s, c, w, r, d, h1, h2;
        var a = EARTH_RADIUS;
        var fl = 1 / 298.257;

        sg = sg * sg;
        sl = sl * sl;
        sf = sf * sf;

        s = sg * (1 - sl) + (1 - sf) * sl;
        c = (1 - sg) * (1 - sl) + sf * sl;

        w = Math.atan(Math.sqrt(s / c));
        r = Math.sqrt(s * c) / w;
        d = 2 * w * a;
        h1 = (3 * r - 1) / 2 / c;
        h2 = (3 * r + 1) / 2 / s;

        return d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg));
    }

    // 다각형 면적 을 계산 하 다.
    var earthRadiusMeters = 6371000.0;
    var radiansPerDegree = Math.PI / 180.0;
    var degreesPerRadian = 180.0 / Math.PI;
    function SphericalPolygonAreaMeters(points) {
        var totalAngle = 0;
        for (var i = 0; i < points.length; i++) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            totalAngle += Angle(points[i], points[j], points[k]);
        }
        var planarTotalAngle = (points.length - 2) * 180.0;
        var sphericalExcess = totalAngle - planarTotalAngle;
        if (sphericalExcess > 420.0) {
            totalAngle = points.length * 360.0 - totalAngle;
            sphericalExcess = totalAngle - planarTotalAngle;
        } else if (sphericalExcess > 300.0 && sphericalExcess < 420.0) {
            sphericalExcess = Math.abs(360.0 - sphericalExcess);
        }
        return sphericalExcess * radiansPerDegree * earthRadiusMeters *
earthRadiusMeters;
    }

    /* 각도 */
    function Angle(p1, p2, p3) {
        var bearing21 = Bearing(p2, p1);
        var bearing23 = Bearing(p2, p3);
        var angle = bearing21 - bearing23;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }
    /* 방향 */
    function Bearing(from, to) {
        var lat1 = from.lat * radiansPerDegree;
        var lon1 = from.lon * radiansPerDegree;
        var lat2 = to.lat * radiansPerDegree;
        var lon2 = to.lon * radiansPerDegree;
        var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2),
Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) *
Math.cos(lon1 - lon2));
        if (angle < 0) {
            angle += Math.PI * 2.0;
        }
        angle = angle * degreesPerRadian;
        return angle;
    }
 /**
     * 맵 흔적 제거
     */
    function clearDrawingBoard() {
    <!-- viewer.entities.removeAll(); -->
        var primitives = viewer.entities;
            for (i = 0; i <  tempEntities.length; i++) {
                primitives.remove(tempEntities[i]);
        }
        tempEntities=[];
        clearEffects();
    }

  </script>
</body>
</html>