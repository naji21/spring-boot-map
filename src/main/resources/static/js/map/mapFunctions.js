

function setMap_WMS(wmsInitData) {
		
	var najiMapModule = new mapModule();

	
	
//	setTimeout(function() {
	
	
		
		var cb_WMS = new najiMapModule.capabilities_WMS();
		cb_WMS.setAttribute({
		    URL : proxy + wmsInitData["wmsURL"],
		    CALLBACK : alert_Error
		});
		
		var xmlData = cb_WMS.getCapabilities_WMS();
		var serviceMetaData = xmlData["serviceMetaData"];
		
		var fixed = true;
		var extent = wmsInitData["extent"];
		var resolution = wmsInitData["resolution"];
		if ( extent === undefined || extent === null || extent === "" ) {
			extent = serviceMetaData["maxExtent"];
			fixed = false;
		}
		
		
		var options = {
		    wmsServiceURL : wmsInitData["wmsURL"],
		    wmsProxyServiceURL : proxy + wmsInitData["wmsURL"],
		    params : {
		        LAYERS : 'ROOT',
		        CRS : serviceMetaData["crs"],
		        STYLES : '',
		        FORMAT : 'image/png',
		        BGCOLOR : '0xffffff', 
		        EXCEPTIONS : 'BLANK',
		        LABEL : 'HIDE_OVERLAP',
		        GRAPHIC_BUFFER : '64',
		        ANTI : 'true',
		        TEXT_ANTI : 'true',
		        VERSION : '1.3.0'
		    }
		};
		
		
		najiMapModule.OBJ_Map.initMap({
		    CRS : serviceMetaData["crs"],
		    target : wmsInitData["targetDiv"],
			view_extent : wmsInitData["view_extent"]
		});
		
		var wmsLayerOBJ = new najiMapModule.layer_WMS();
		
		
		var wmsLayer = wmsLayerOBJ.createWMSLayer( options );
		najiMapModule.OBJ_Map.addWMSLayer( wmsLayerOBJ, extent, resolution, fixed );
	
//	}, 1);
	
	return {
		najiMapModule : najiMapModule,
		wmsLayerOBJ: wmsLayerOBJ
	}
	
}


function setMap_WFS( wfsInitData ) {

	var najiMapModule = new mapModule();
	
	var cb_WFS = new najiMapModule.capabilities_WFS();
	cb_WFS.setAttribute({
	    URL : proxy + wfsInitData["wfsURL"],
	    CALLBACK : alert_Error
	});

	var capabilities = cb_WFS.getServiceMetaData_WFS();

	var mapCRS = capabilities["crs"];

	
	if( mapCRS === 'urn:ogc:def:crs:EPSG:6.11.2:4326' ) {
		mapCRS = 'EPSG:5181';
	}
	
	
	if ( mapCRS === 'CRS:84') {
		mapCRS = 'EPSG:4326';
	}
	
	
	najiMapModule.OBJ_Map.initMap({
	    CRS : mapCRS,
	    target : wfsInitData["targetDiv"]
	});
	
	
	var wfsLayerOBJ = new najiMapModule.layer_WFS();		
	
	setTimeout(function() {
		
		var options = {
		    URL : proxy + wfsInitData["wfsURL"],
		    LAYERNAME : wfsInitData["LAYERNAME"],
		    srsName : mapCRS,
		    //maxFeatures : 100
		}
		
		var wfsLayer = wfsLayerOBJ.createWFSLayer( options );
		
		var responseData = wfsLayerOBJ.addFeatures();
		
		najiMapModule.OBJ_Map.addWFSLayer( wfsLayerOBJ );
		
	}, 1);
	
	
	return {
		najiMapModule : najiMapModule,
		wfsLayerOBJ: wfsLayerOBJ
	}
}





function setMap_WCS(wcsInitData) {
	
	var najiMapModule = new mapModule();
	
	najiMapModule.OBJ_Map.initMap({
	    CRS : 'EPSG:3857',
	    target : wcsInitData["targetDiv"]
	});
	
	var wcsLayerOBJ = new najiMapModule.layer_WCS();
	
	var options = {
		wcsServiceURL : wcsInitData["wcsURL"],
	    params : {
	    	identifier : wcsInitData["Identifier"],
  	      	BoundingBox : wcsInitData["BBOX"],
      		format : 'image/jpeg'
	    }
	};
	
	var wcsLayer = wcsLayerOBJ.createWCSLayer( options );
	najiMapModule.OBJ_Map.addWCSLayer( wcsLayerOBJ, wcsInitData["BBOX"] );
		
	return {
		najiMapModule : najiMapModule,
		wmsLayerOBJ: wmsLayerOBJ
	}
	
}

function setMap_WMTS( wmtsInitData_ ) {
		
	var najiMapModule = new mapModule();
	najiMapModule.OBJ_Map.initMap({
	    CRS : "EPSG:3857",
	    target : wmtsInitData_["targetDiv"]
	});

	var cb_WMTS = new najiMapModule.capabilities_WMTS();
	cb_WMTS.setAttribute({
	    URL : wmtsInitData_["proxy"] + wmtsInitData_["wmtsURL"],
	    CALLBACK : alert_Error
	});

	var capabilities = cb_WMTS.getCapabilities_WMTS();
	var wmtsData = capabilities["olJson"];

	wmtsInitData_["wmtsCapabilities"] = wmtsData;

	
	var wmtsLayerOBJ = new najiMapModule.layer_WMTS();

	var wmtsLayer = wmtsLayerOBJ.createWMTSLayer( wmtsInitData_ );

	najiMapModule.OBJ_Map.addWMTSLayer( wmtsLayerOBJ );
	
	
	setTimeout(function() {
		if ( wmtsInitData_["extent"] !== undefined ) {
			najiMapModule.OBJ_Map.getMap().getView().fit( wmtsInitData_["extent"], najiMapModule.OBJ_Map.getMap().getSize() );
        }
		if ( wmtsInitData_["resolution"] !== undefined ) {
			najiMapModule.OBJ_Map.getMap().getView().setResolution( wmtsInitData_["resolution"] );
        }
	}, 50);
	
	return {
		najiMapModule : najiMapModule,
		wmtsLayerOBJ: wmtsLayerOBJ
	}
}


/*
function setMap_WMTS( wmtsInitData ) {

	var najiMapModule = new mapModule();
	var serviceType;
	var tileData = {};
	
	$.ajax({
		type : 'POST',
		url : contextPath + '/system/data/getWMTS_TileState.json',
		data : {
			KEY : wmtsInitData["KEY"],
			LAYER : wmtsInitData["LAYER"]
		},
		async : false,
		success : function(response) {			
			tileData = response.data;			
		}
	});	
	
	
	najiMapModule.OBJ_Map.initMap({
	    CRS : tileData["CRS"],
	    target : wmtsInitData["targetDiv"]
	});
	
	
	var wmtsLayerOBJ = new najiMapModule.layer_WMTS();
	
	setTimeout(function() {
		
		if ( wmtsInitData["LAYER"].indexOf("D$") != -1 ) {
			serviceType = 'Dynamic';
		} else if ( wmtsInitData["LAYER"].indexOf("S$") != -1 ) {
			serviceType = 'Static';
		}
		
		var extent = tileData["ENVELOPE"].split(" ");
		var matrixSet = wmtsInitData["LAYER"] + '_MATRIXSET';
		var matrixIds = [];
		
		for(var i=0; i<tileData["LEVELS"]; i++ ) {
			matrixIds.push( "L" + i );
		}
		
		var origin;
		var origins;
		
		if ( serviceType === 'Dynamic' ) {
			origin = tileData["ORIGIN"].replace(/'/g, '"');
			origin = JSON.parse( origin );
		} else if ( serviceType === 'Static' ) {			
			origins = tileData["ORIGINS"];
		}
		
		var options = {
			wmtsServiceURL : wmtsInitData["wmtsURL"],
		    wmtsProxyServiceURL : proxy + wmtsInitData["wmtsURL"],
		    params : {
		    	servieType : serviceType,
		    	layer : wmtsInitData["LAYER"],
		    	CRS : tileData["CRS"],
		    	resolutions : tileData["RESOLUTIONS"],
		    	tileSize : tileData["TILEWIDTH"],
		    	extent : extent,
		    	matrixSet : matrixSet,
		    	format : tileData["FORMAT"],
		    	style : 'default',
		    	matrixIds : matrixIds,
		    	origin : origin,
		    	origins : origins
		    }
		};
		
		var wmtsLayer = wmtsLayerOBJ.createWMTSLayer( options );
		
		najiMapModule.OBJ_Map.addWMTSLayer( wmtsLayerOBJ );
		
	}, 1);
	
	
	return {
		najiMapModule : najiMapModule,
		wmtsLayerOBJ: wmtsLayerOBJ
	}
}

*/

