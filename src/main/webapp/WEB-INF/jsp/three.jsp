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

	<!-- jQuery Script, CSS Load -->
	<!-- 
	<link href="lib/jQueryUI-v1.11.2/jquery-ui.min.css" rel="stylesheet">
	 -->
	<script src="lib/jQuery-v3.2.1/jquery-3.2.1.min.js"></script>
	<script src="lib/jQueryUI-v1.11.2/jquery-ui.js"></script>

	<!-- Three.js -->
	<script src="lib/three/three.js"></script>
	
	<style>
		body { margin: 0; }
		canvas { display: block; }
	</style>
</head>
<body>
	<div id="ThreeContainer"></div>
</body>
<script>
var _three = {};
var _ThreeContainer;

function initThree() {
    var fov = 45;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspect = width / height;
    var near = 1;
    var far = 10 * 1000 * 1000;
    
    _ThreeContainer = document.getElementById("ThreeContainer");

    // 1. Scene 생성
    _three.scene = new THREE.Scene();
    // 2. 카메라 생성
    _three.camera = new THREE.PerspectiveCamera(fov, aspect, 1, 1000);
    // 3. 렌더러 생성
    _three.renderer = new THREE.WebGLRenderer({alpha: true});
    
    _three.renderer.setSize(width, height);
    
    // 4. 컨테이너에 추가
    _ThreeContainer.appendChild(_three.renderer.domElement);
    /*
    _three.camera.matrixAutoUpdate = false;
	  
	  _three.camera.lookAt(new THREE.Vector3(0,0,0));

	  var width = _ThreeContainer.clientWidth;
	  var height = _ThreeContainer.clientHeight;
	  var aspect = width / height;
	  _three.camera.aspect = aspect;
	  _three.camera.updateProjectionMatrix();
	*/
	  
	  //_three.renderer.render(_three.scene, _three.camera);
  }
  
  function init3DObject(){
	// Lathe geometry
	  var doubleSideMaterial = new THREE.MeshNormalMaterial({
	    side: THREE.DoubleSide
	  });
	  var segments = 10;
	  var points = [];
	  for ( var i = 0; i < segments; i ++ ) {
	      points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * segments + 5, ( i - 5 ) * 2 ) );
	  }
	  var geometry = new THREE.LatheGeometry( points );
	  var latheMesh = new THREE.Mesh( geometry, doubleSideMaterial ) ;
	  //latheMesh.scale.set(1500,1500,1500); //scale object to be visible at planet scale
	  //latheMesh.position.z += 15000.0; // translate "up" in Three.js space so the "bottom" of the mesh is the handle
	  //latheMesh.rotation.x = Math.PI / 2; // rotate mesh for Cesium's Y-up system
	  var latheMeshYup = new THREE.Group();
	  latheMeshYup.add(latheMesh);
	  //_three.scene.add(latheMeshYup); // don’t forget to add it to the Three.js scene manually
	  //_three.renderer.render(_three.scene, _three.camera);
	  
      // ... 위의 코드 ...  
	  var idx = 279416
		var idy = 116071
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
		    
		    _data.version = p.getVersion();
		    _data.type = p.getUint1();
		    var lenStr = p.getLenStr();
		    _data.keyLen = lenStr.len;
		    _data.key = lenStr.str;
		
		    _data.centerPosX = p.getFloat8();
		    _data.centerPosY = p.getFloat8();
		    _data.altitude = p.getFloat4();
		    _data.box = p.getBox3dd();
		
		    _data.imgLevel = p.getUint1();
		    var lenStr = p.getLenStr();
		    _data.dataFileLen = lenStr.len;
		    _data.dataFileName = lenStr.str;
		
		    var lenStr = p.getLenStr();
		    _data.imgFileLen = lenStr.len;
		    _data.imgFileName = lenStr.str;
		    
		    // model object
		    /*
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
		    */
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
	        	});
	        	
	        	// 7. 메시 생성
	        	var build = new THREE.Mesh(geometry, material);
	        	//build.position.z = 0;
	        	//build.rotation.x = -90; // rotate mesh for Cesium's Y-up system
	        	//build.rotation.y = 0.7; // rotate mesh for Cesium's Y-up system
	        	
	             var buildGroup = new THREE.Group();
	             buildGroup.add(build);
	             _three.scene.add(buildGroup);
	            	             
	             
	             build.position.copy(new THREE.Vector3(_data.objBox.min));
	             build.lookAt(new THREE.Vector3(_data.objBox.min));
	             //build.up.copy(latDir);
	             
	             debugger;
	             render();
		    });
		});
  }
  function render() {
	  requestAnimationFrame( render );
	  _three.renderer.render( _three.scene, _three.camera );
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
<script>

initThree(); // Initialize Three.js renderer
init3DObject(); // Initialize Three.js object mesh with Cesium Cartesian coordinate system
</script>


</html>
