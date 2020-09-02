
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
	</head>
<body>
	<div id="cesiumContainer"></div>
    <div id="ThreeContainer"></div>

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

        #cesiumContainer {
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

        #ThreeContainer {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            margin: 0;
            overflow: hidden;
            padding: 0;
            font-family: sans-serif;
            pointer-events: none;
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
    <script>
        //cesium

        let minWGS84 = [115.23, 39.55];
        let maxWGS84 = [116.23, 41.55];
        let cesiumContainer = document.getElementById("cesiumContainer");
        let ThreeContainer = document.getElementById("ThreeContainer");
        let _3Dobjects = [];
        let three = {
            renderer: null,
            camera: null,
            scene: null
        };
        let cesium = {
            viewer: null
        }
        main();
        function main() {
            initCesium();
            initThree();
            init3DObject();
            loop();
        }
        function initCesium() {
            let esri = new Cesium.ArcGisMapServerImageryProvider({
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
            });
            var googlemap = new Cesium.UrlTemplateImageryProvider(
                {
                    url: 'http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&{x}&y={y}&z={z}&s=Gali'
                })
            cesium.viewer = new Cesium.Viewer("cesiumContainer", {
                useDefaultRenderLoop: false,
                selectionIndicator: false,
                homeButton: false,
                sceneModePicker: false,
                navigationHelpButton: false,
                animate: false,
                timeline: false,
                fullscreenButton: false,
                navigationInstructionsInitiallyVisible: false,
                allowTextureFilterAnisotropic: false,
                contextOptions: {
                    webgl: {
                        alpha: false,
                        antialias: true,
                        preserveDrawingBuffer: true,
                        failIfMajorPerformanceCaveat: false,
                        depth: true,
                        stencil: false,
                        anialias: false
                    }
                },
                targetFrameRate: 60,
                resolutionScale: 0.1,
                orderIndependentTranslucency: true,
                // creditContainer:"CreditDisplay",
                // imageeryProvider: googlemap,   //谷歌地图
                baseLayerPicker: true,
                geocoder: false,
                automaticallyTrackDataSourceClocks: false,
                dataSources: null,
                clock: null,
                terrainShadows: Cesium.ShadowMode.DISABLED
            });
            let center = Cesium.Cartesian3.fromDegrees(
                (minWGS84[0] + maxWGS84[0]) / 2,
                ((minWGS84[1] + maxWGS84[1]) / 2) - 1,
                200000
            );
            ce = center;
            cesium.viewer.camera.flyTo({
                destination: center,
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-60),
                    roll: Cesium.Math.toRadians(0)
                },
                duration: 3
            });
        }
        function initThree() {
            let fov = 45;
            let width = window.innerWidth;
            let height = window.innerHeight;
            let aspect = width / height;
            let near = 1;
            let far = 10 * 1000 * 1000; // needs to be far to support Cesium's world-scale rendering
            three.scene = new THREE.Scene();
            three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            three.renderer = new THREE.WebGLRenderer({ alpha: true });
            // let axis=new THREE.AxesHelper(1000*1000*1000);
            // three.scene.add(axis);
            ThreeContainer.appendChild(three.renderer.domElement);
        }
        function init3DObject() {
            let entity = {
                name: 'Polygon',
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray([
                        minWGS84[0], minWGS84[1],
                        maxWGS84[0], minWGS84[1],
                        maxWGS84[0], maxWGS84[1],
                        minWGS84[0], maxWGS84[1]
                    ]),
                    material: Cesium.Color.RED.withAlpha(0.1)
                }
            }
            let Polypon = cesium.viewer.entities.add(entity);
            let doubleSideMaterial = new THREE.MeshNormalMaterial({
                side: THREE.DoubleSide
            });

            geometry = new THREE.SphereGeometry(1, 32, 32);
            let sphere = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide }));   //12面体
            // sphere.scale.set(5000,5000,5000);
            sphere.position.z+=15000;
            // translate "up" in Three.js space so the "bottom" of the mesh is the handle
            sphere.scale.set(5000, 5000, 5000);
            sphere.uuid = "sphere";
            var sphereYup = new THREE.Group();
            sphereYup.add(sphere)
            three.scene.add(sphereYup); // don’t forget to add it to the Three.js scene manually
            sphereYup.position.set(ce.x, ce.y, ce.z);
            _3DOB = new _3DObject();
            _3DOB.threeMesh = sphereYup;
            _3DOB.minWGS84 = minWGS84;
            _3DOB.maxWGS84 = maxWGS84;
            _3Dobjects.push(_3DOB);
            geometry = new THREE.DodecahedronGeometry();
            let dodecahedronMesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());   //12面体
            dodecahedronMesh.scale.set(5000, 5000, 5000);
            dodecahedronMesh.position.z = 0;
            // translate "up" in Three.js space so the "bottom" of the mesh is the handle
            dodecahedronMesh.rotation.x = Math.PI / 2; // rotate mesh for Cesium's Y-up system
            dodecahedronMesh.uuid = "12面体";
            var dodecahedronMeshYup = new THREE.Group();
            dodecahedronMeshYup.add(dodecahedronMesh)
            three.scene.add(dodecahedronMeshYup); // don’t forget to add it to the Three.js scene manually
            dodecahedronMeshYup.position.set(ce.x, ce.y, ce.z);
            //    Assign Three.js object mesh to our object array
            _3DOB = new _3DObject();
            _3DOB.threeMesh = dodecahedronMeshYup;
            _3DOB.minWGS84 = minWGS84;
            _3DOB.maxWGS84 = maxWGS84;
            _3Dobjects.push(_3DOB);
            //添加灯光
            //添加点光源
            var spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(0, 0, 50000);
            spotLight.castShadow = true; //设置光源投射阴影
            spotLight.intensity = 1;
            sphereYup.add(spotLight)
            //添加环境光
            var hemiLight = new THREE.HemisphereLight(0xff0000, 0xff0000, 1);
            sphereYup.add(hemiLight);
            var cartToVec = function (cart) {
                return new THREE.Vector3(cart.x, cart.y, cart.z);
            };
            // // Configure Three.js meshes to stand against globe center position up direction
            for (id in _3Dobjects) {
                minWGS84 = _3Dobjects[id].minWGS84;
                maxWGS84 = _3Dobjects[id].maxWGS84;
                // convert lat/long center position to Cartesian3
                var center = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2);

                // get forward direction for orienting model
                var centerHigh = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2, 1);

                // use direction from bottom left to top left as up-vector
                var bottomLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], minWGS84[1]));
                var topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
                var latDir = new THREE.Vector3().subVectors(bottomLeft, topLeft).normalize();
				debugger;
				
				//center.z = 1500;
                // configure entity position and orientation
                _3Dobjects[id].threeMesh.position.copy(center);
                //_3Dobjects[id].threeMesh.position.copy(new THREE.Vector3(0, 0, 0));
                _3Dobjects[id].threeMesh.lookAt(centerHigh);
                _3Dobjects[id].threeMesh.up.copy(latDir);
            }
        }
        function _3DObject() {
            this.threeMesh = null;
            this.minWGS84 = null;
            this.maxWGS84 = null;
        }

        function loop() {
            requestAnimationFrame(loop);
            renderCesium();
            renderThreeObj();
            renderCamera();
        }

        function renderCesium() {
            cesium.viewer.render();
        }

        function renderThreeObj() {
            var width = ThreeContainer.clientWidth;
            var height = ThreeContainer.clientHeight;
            three.renderer.setSize(width, height);
            three.renderer.render(three.scene, three.camera);

        }
        function renderCamera() {
            // register Three.js scene with Cesium
            three.camera.fov = Cesium.Math.toDegrees(cesium.viewer.camera.frustum.fovy) // ThreeJS FOV is vertical
            three.camera.updateProjectionMatrix();

            // Clone Cesium Camera projection position so the
            // Three.js Object will appear to be at the same place as above the Cesium Globe

            three.camera.matrixAutoUpdate = false;
            var cvm = cesium.viewer.camera.viewMatrix;
            var civm = cesium.viewer.camera.inverseViewMatrix;
            three.camera.matrixWorld.set(
                civm[0], civm[4], civm[8], civm[12],
                civm[1], civm[5], civm[9], civm[13],
                civm[2], civm[6], civm[10], civm[14],
                civm[3], civm[7], civm[11], civm[15]
            );
            three.camera.matrixWorldInverse.set(
                cvm[0], cvm[4], cvm[8], cvm[12],
                cvm[1], cvm[5], cvm[9], cvm[13],
                cvm[2], cvm[6], cvm[10], cvm[14],
                cvm[3], cvm[7], cvm[11], cvm[15]
            );
            three.camera.lookAt(new THREE.Vector3(0, 0, 0));

            var width = ThreeContainer.clientWidth;
            var height = ThreeContainer.clientHeight;
            var aspect = width / height;
            three.camera.aspect = aspect;
            three.camera.updateProjectionMatrix();
        }

    </script>
</body>

</html>