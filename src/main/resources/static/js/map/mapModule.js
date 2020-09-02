
var mapModule = function() {
    
    var _olMap;
    var _baseCRS;
    var _bsaeExtent;
    var _geocoder;


    var OBJ_Map = {
        initMap : function(attribute_) {
        	
        	console.log("view_extent" +    attribute_["view_extent"]);
        	
            _bsaeExtent = ol.proj.get( attribute_["CRS"] ).getExtent();
            _baseCRS = attribute_["CRS"].toUpperCase();
            _olMap = new ol.Map({
                target : attribute_["target"],
                renderer : 'canvas',
                interactions: ol.interaction.defaults({
                    dragPan: false
                }).extend([
                    new ol.interaction.DragPan({ kinetic: false} )
                ]),
                view : new ol.View({
                    projection : attribute_["CRS"],
                    extent : attribute_["view_extent"] == true ? _bsaeExtent : undefined ,
                    minZoom : 2,
                    maxZoom : 19,
                    zoom : 2
                })
            });
                        
            _olMap.addControl( new ol.control.ZoomSlider() );
            _olMap.addControl( new ol.control.ScaleLine() );
            
            _olMap.on('change:view', function() {
                var newProjection = _olMap.getView().getProjection().getCode();
                _baseCRS = newProjection;
            });
            
            if(attribute_["search"]){
            	isGeocoder(true); 
            }      

            console.log('### Map Init ###');
            console.log('openLayers Map : ' + _olMap);
            console.log('Projection : ' + _baseCRS);

        },        
        
        getMap : function() {
            return _olMap;
        },
        
        getCRS : function() {
            return _baseCRS;
        },
        
        setExtent : function(envelop_) {
            _olMap.getView().fit( envelop_ , _olMap.getSize() );
        },
        
        isSearch: function (flag){
        	isGeocoder(flag);
        },
        
        addWMSLayer : function(layer_WMS_, extent_, resolution_, fixed_) {
            var originLayerCRS = layer_WMS_.getOptions()["params"]["CRS"];
            var compareCRS = this.compareToCRS( originLayerCRS );
            var targetLayer = layer_WMS_.getOlWMSLayer();
            
            if ( !compareCRS ) {
                targetLayer.getSource().getParams().CRS = _baseCRS;
                targetLayer.getSource().updateParams( targetLayer.getSource().getParams() );
            }
            
            _olMap.addLayer( targetLayer );
            
            setTimeout(function() {
            if ( typeof extent_ !== 'undefined' ) {
                for(var i in extent_) {
                    extent_[i] = parseFloat( extent_[i] );
                }
                
                if ( fixed_ ) {
                    originLayerCRS = 'EPSG:3857';
                }
                
                var transExtent = ol.proj.transformExtent(extent_, originLayerCRS, _baseCRS);
                
                OBJ_Map.setExtent( transExtent );

                if ( resolution_ !== undefined ) {
                    _olMap.getView().setResolution( resolution_ );
                }
            } else {
                /*
                var cb_WMS = new capabilities_WMS();
                cb_WMS.setAttribute({
                    URL : layer_WMS_.getOptions()["wmsProxyServiceURL"]
                });

                //var extent = [minX, minY, maxX, maxY];
                var metaData = cb_WMS.getServiceMetaData_WMS();
                var extent = metaData["maxExtent"];
                var crs = metaData["crs"];
                
                for(var i in extent) {
                    extent[i] = parseFloat( extent[i] );
                }
                
                extent = ol.proj.transformExtent(extent, crs, _baseCRS);

                OBJ_Map.setExtent( extent );
                */
            }
            }, 1);
        },
        
        addWFSLayer : function(layer_WFS_) {
            var targetLayer = layer_WFS_.getOlWFSLayer();            
            _olMap.addLayer( targetLayer );
        },
        
        addWMTSLayer : function(layer_WMTS_, extent_) {
            var targetLayer = layer_WMTS_.getOlWMTSLayer();            
            _olMap.addLayer( targetLayer );
            
            if ( typeof extent_ !== 'undefined' ) {
                for(var i in extent_) {
                    extent_[i] = parseFloat( extent_[i] );
                }
                OBJ_Map.setExtent( extent_ );
            } else {
                var originCRS = targetLayer.get("originCRS");
                var originExtent = targetLayer.get("originExtent");                
                var extent = ol.proj.transformExtent(originExtent, originCRS, _baseCRS);

                OBJ_Map.setExtent( extent );
            }
        },
        
        addWCSLayer : function(layer_WCS_, extent_) {
            var targetLayer = layer_WCS_.getOlWCSLayer();
            _olMap.addLayer( targetLayer );
            
            if ( typeof extent_ !== 'undefined' ) {
                for(var i in extent_) {
                    extent_[i] = parseFloat( extent_[i] );
                }
                extent_ = ol.proj.transformExtent(extent_, 'EPSG:4326', _baseCRS);
                OBJ_Map.setExtent( extent_ );
            } else {
                //
            }
        },
        
        compareToCRS : function(layerCRS) {
            return ( _baseCRS === layerCRS ) ? true : false;
        }
    };
    

    
    var isGeocoder = function(flag) {
    	
    	if(flag){
    		_geocoder = new Geocoder('nominatim', {
      		  provider: 'osm',	
      		  /*provider: 'google',*/
      		  //key : 'AIzaSyA1tVD32H81o7T3RSikpc3XLaVq-zOtRU8',
      		  lang: 'ko',
      		  placeholder: 'Search for ...',
      		  limit: 10,
      		  debug: true,
      		  autoComplete: true,
      		  keepOpen: true
      		});
      	_olMap.addControl(_geocoder);
    	}else{        		
    		if(_geocoder){
    			_olMap.removeControl(_geocoder);
    		}        	
    	}        	
    };       
    
    
    
    
    
    
    
    
    
    var layer_WMS = function() {
        var options;
        var olLayer;
        
        this.createWMSLayer = function(options_) {
            //options_["SRS"] = options_["params"]["CRS"];
            options_["SRS"] = 'EPSG:3857';
            options = options_;
            olLayer = OBJ_WMS["createWMSLayer"]( options );
            return olLayer;
        };
        
        this.getOlWMSLayer = function() {
            return olLayer;
        };
        
        this.getOptions = function() {
            return options;
        };
    };
    
    
    
    
    
    var OBJ_WMS = {
        createWMSLayer : function(options_) {
            /*
               params : {
                    LAYERS : 'ROOT',
                    CRS : mapCRS,
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
            */
            var params = options_["params"];
            var wmsURL = options_["wmsServiceURL"];
            
            return new ol.layer.Tile({
                source : new ol.source.TileWMS({
                    url : wmsURL,
                    params : params
                })
            });
        }

    };
    
    
    
    
    
    
    
    
    
    
    
    var layer_WFS = function() {
        var options;
        var olLayer;
        
        this.createWFSLayer = function(options_) {
            /*
               options : {
                    URL : proxy+'?url=http://221.148.35.76:8880/geonuris/wfs?GDX=KAIST_Sample.xml',
                    LAYERNAME : 'KAIST.LV14_SPBD_BULD',
                    srsName : 'EPSG:5179',
                    maxFeatures : 100
                }
            */
            options = options_;
            olLayer = OBJ_WFS["createWFSLayer"]();
            return olLayer;
        };
        
        this.addFeatures = function() {
            var responseData = OBJ_WFS["getFeatures"]( options );
            OBJ_WFS["addFeatures"]( olLayer, responseData["data"], options );
            return responseData;
        };
        
        this.updateOptions = function(options_) {
            options = options_;
        }

        this.getOlWFSLayer = function() {
            return olLayer;
        };
        
        this.getOptions = function() {
            return options;
        };
    };
    
    
    
    
    var OBJ_WFS = {
        createWFSLayer : function() {
            
            var vertorSource = new ol.source.Vector();
            /*
            *  To Do - Vector Random Style
            */
            
            return new ol.layer.Vector({
                source : vertorSource
            });
        },
        
        getFeatures : function(options) {
            
            var responseData = {
                state : false,
                message : '',
                data : {}
            };
                        
            var compareCRS = OBJ_Map.compareToCRS( options["srsName"] );
            
            if ( !compareCRS ) {
                options["srsName"] = _baseCRS;
            }
            
            var featureRequest = new ol.format.WFS().writeGetFeature({
                srsName : options["srsName"],
                //featureNS : 'http://cite.opengis.net/sf',
                //featurePrefix : 'osm',
                featureTypes : [options["LAYERNAME"]],
                outputFormat : 'application/json',
                geometryName : 'SHAPE',
                maxFeatures : options["maxFeatures"]
            });
            
            $.ajax({
                url : options["URL"],
                type : 'POST',
                data : new XMLSerializer().serializeToString( featureRequest ),
                async : false,
                contentType : 'text/xml',
                success : function(response_) {

                    if ( response_.xmlVersion !== undefined ) {
                        if ( response_.childNodes[0].nodeName === 'ogc:ServiceExceptionReport' || response_.childNodes[0].nodeName === 'ServiceExceptionReport' ) {
                            var xmlJson = _xmlToJson( response_ );
                            var message = xmlJson["ogc:ServiceExceptionReport"]["ogc:ServiceException"]["#text"];
                            options["CALLBACK"]( 'ServiceExceptionReport : ' + '<br>' + message );
                            return false;
                        } else if ( response_.childNodes[0].nodeName === 'ows:ExceptionReport' || response_.childNodes[0].nodeName === 'ExceptionReport' ) {
                            var xmlJson = _xmlToJson( response_ );
                            var message = xmlJson["ows:ExceptionReport"]["ows:Exception"]["ows:ExceptionText"]["#text"];
                            options["CALLBACK"]( 'ExceptionReport : ' + '<br>' + message );
                            return false;
                        }
                    } else {
                        var features = new ol.format.GeoJSON().readFeatures( response_ );                
                        responseData["state"] = true;
                        responseData["message"] = 'success !';
                        responseData["data"] = features;
                    }
    
                }
                /*
                ,
                error : function (e) {
                    responseData["message"] = 'fail !';
                }
                */
            });
        
            return responseData;
        },
        
        addFeatures : function(vectorLayer_, features_, options_) {
            
            // originFields
            var fields = features_[0].getKeys();
            
            vectorLayer_.set("originFields", fields);
            vectorLayer_.set("wfs_LayerName", options_["LAYERNAME"]);
            var vLayerSource = vectorLayer_.getSource();
            vLayerSource.clear();
            vLayerSource.addFeatures( features_ );
            var extent = vLayerSource.getExtent();
            OBJ_Map.setExtent( extent );
        }
        
        
    };

    var layer_WMTS = function() {
        var options;
        var olLayer;
        
        this.createWMTSLayer = function(options_) {
            options = options_;
            olLayer = OBJ_WMTS["createWMTSLayer"]( options );
            return olLayer;
        };
        
        this.getOlWMTSLayer = function() {
            return olLayer;
        };
        
        this.getOptions = function() {
            return options;
        };
    };
    
    var OBJ_WMTS = {
        createWMTSLayer : function(options_) {
            var wmtsExtent = [];
            var layers = options_["wmtsCapabilities"]["Contents"]["Layer"];
            for(var i in layers) {
                if ( layers[i]["Identifier"] === options_["layer"] ) {
                    wmtsExtent = layers[i]["WGS84BoundingBox"];
                    break;
                }
            }
            
            var wmtsOptions = ol.source.WMTS.optionsFromCapabilities(
                options_["wmtsCapabilities"], 
                {
                    layer : options_["layer"],
                    matrixSet : options_["matrixSet"]
                }
            );

           /* 
            var urls = wmtsOptions["urls"];
            for(var i in urls) {
                wmtsOptions["urls"][i] = wmtsOptions["urls"][i] + 'key=' + options_["key"];
            }*/
            
            
            
            var wmtsOlLayer = new ol.layer.Tile({
                originCRS : 'EPSG:4326',
                originExtent : wmtsExtent,
                source : new ol.source.WMTS( wmtsOptions )
            });
            
            return wmtsOlLayer;
            
            
            
            
            /*
            var params = options_["params"];
            var wmtsURL = options_["wmtsServiceURL"];
            var wmtsProxyURL = options_["wmtsProxyServiceURL"];
            
            var tileGridOptions = {
                resolutions : params["resolutions"],
                tileSize : params["tileSize"],
                matrixIds : params["matrixIds"]
            };
            
            if ( params["servieType"] === 'Dynamic' ) {
                tileGridOptions["origin"] = params["origin"];
            } else if ( params["servieType"] === 'Static' ) {
                tileGridOptions["origins"] = params["origins"];
            }
            
            return new ol.layer.Tile({
                extent : params["extent"],
                source : new ol.source.WMTS({
                    url : wmtsProxyURL,
                    layer : params["layer"],
                    matrixSet : params["matrixSet"],
                    format : params["format"],
                    projection : params["CRS"],
                    tileGrid : new ol.tilegrid.WMTS( tileGridOptions ),
                    style : params["style"]
                })
		    });
            */
        }

    };
    
    
    
    
    
    
    var layer_WCS = function() {
        var options;
        var olLayer;
        
        this.createWCSLayer = function(options_) {
            options_["SRS"] = 'EPSG:3857';
            options = options_;
            olLayer = OBJ_WCS["createWCSLayer"]( options );
            return olLayer;
        };
        
        this.getOlWCSLayer = function() {
            return olLayer;
        };
        
        this.getOptions = function() {
            return options;
        };
    };
    
    
    
    
    
    var OBJ_WCS = {
        createWCSLayer : function(options_) {
            /*
               params : {
                    identifier : '471700832_w.jpg',
                    BoundingBox : [],
                    format : 'image/jpeg'
                }
            */
            var params = options_["params"];
            var wcsURL = options_["wcsServiceURL"];
            params["BoundingBox"][0] = parseFloat( params["BoundingBox"][0] );
            params["BoundingBox"][1] = parseFloat( params["BoundingBox"][1] );
            params["BoundingBox"][2] = parseFloat( params["BoundingBox"][2] );
            params["BoundingBox"][3] = parseFloat( params["BoundingBox"][3] );
            var imageExtent = ol.proj.transformExtent(params["BoundingBox"], "EPSG:4326", "EPSG:3857");
            
            //(params["BoundingBox"]).push("EPSG:4326");
            var BBOX = params["BoundingBox"].slice();
            BBOX.push("EPSG:4326");
            
            params["BoundingBox"] = BBOX;
            
            params["service"] = 'WCS';
            params["version"] = '1.1.1';
            params["request"] = 'GetCoverage';
            

            var paramsSTR = Object.keys( params ).map(function(k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent( params[k] )
            }).join('&');
            
            wcsURL = wcsURL + '&' + paramsSTR;
            
            return new ol.layer.Image({
                source: new ol.source.ImageStatic({
                    url : wcsURL,
                    projection : 'EPSG:3857',
                    imageExtent : imageExtent
                })
            });
        }

    };
    
    
    
    
    
    
    
    
    
    
    var default_capabilities = function() {
        var _URL;
        var _GDX;
        var _CALLBACK;
        var _REQUEST = 'GetCapabilities';
        var _VERSION;
        var _SERVICE;
        
        this.setServiceType = function(type_) {
            _SERVICE = type_;
        };
        
        this.setAttribute = function(attribute_) {
            _URL = attribute_["URL"];
            _GDX = attribute_["GDX"];
            _CALLBACK = attribute_["CALLBACK"];
            if ( typeof attribute_["VERSION"] === 'undefined' ) {
                _VERSION = '1.3.0';
            } else {
                _VERSION = attribute_["VERSION"];
            }
        };
        
        this.getAttribute = function() {
            var attribute = {
                //KEY : _GDX,
                REQUEST : _REQUEST,
                SERVICE : _SERVICE,
                VERSION : _VERSION
            };
            return attribute;
        };
        
        this.callAjax = function() {
            var response;
            
            var url = '';
            var params = this.getAttribute();
            var toParams = '';
            
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    toParams += ('&' + key + '=' + encodeURI( params[key] ) );
                }
            }

            if ( _URL.split('?').length > 2 ) {
                url = _URL + toParams;
            } else {
                url = _URL + '?' + toParams;
            }            
            
            $.ajax({
                //type : 'GET',
                type : 'POST',
                url : url,
                //data : this.getAttribute(),
                async : false,
                success : function(response_) {
                //debugger;
                    
                    //var xmlData = response_["data"];
                

                    if ( response_.childNodes[0].nodeName === 'ogc:ServiceExceptionReport' || response_.childNodes[0].nodeName === 'ServiceExceptionReport' ) {
                        var xmlJson = _xmlToJson( response_ );
                        var message = xmlJson["ogc:ServiceExceptionReport"]["ogc:ServiceException"]["#text"];
                        _CALLBACK( 'ServiceExceptionReport : ' + '<br>' + message );
                        return false;
                    } else if ( response_.childNodes[0].nodeName === 'ows:ExceptionReport' || response_.childNodes[0].nodeName === 'ExceptionReport' ) {
                        var xmlJson = _xmlToJson( response_ );
                        var message = xmlJson["ows:ExceptionReport"]["ows:Exception"]["ows:ExceptionText"]["#text"];
                        _CALLBACK( 'ExceptionReport : ' + '<br>' + message );
                        return false;
                    } else {
                        response = response_;
                    }
                   

                
                    //response = xmlData;
                
                }
            });
            
            return response;            
        };
        
    };
    
    
    
    
    
    
    
    var capabilities_WMS = function() {
        
        var Child = function() {
            default_capabilities.apply( this, arguments );
        };
        Child.prototype = default_capabilities.prototype;
        
        var child = new Child();
        
        
        this.setAttribute = function(attribute_) {
            child.setAttribute( attribute_ );
        };
        
        
        this.getCapabilities_WMS = function() { 
            return _getCapabilities_WMS( child );
        };
        
        
        this.getServiceMetaData_WMS = function() { 
            return _getServiceMetaData_WMS( child );
        };
        
    };
    
    
    

    
    var _getCapabilities_WMS = function(child_) {
        child_.setServiceType("WMS");
        var response = child_.callAjax();
        var parser = new ol.format.WMSCapabilities();
        var olJson = parser.read( response );
        var xmlJson = _xmlToJson( response );
        var serviceMetaData = _getServiceMetaData_WMS( olJson );
        
        return {
            document : response,
            xmlJson : xmlJson,
            olJson : olJson,
            serviceMetaData : serviceMetaData
        };
    };





    var _getServiceMetaData_WMS = function(olJson_) {
        var json = olJson_;
        
        var service = json['Service']['Name'];
        var version = json['version'];
        var getCapabilitiesFormat = '';
        var getCapabilitiesFormats = json['Capability']['Request']['GetCapabilities']['Format'];
		for(var i in getCapabilitiesFormats) {
			getCapabilitiesFormat += ( getCapabilitiesFormats[i] +( (getCapabilitiesFormats.length-1) == i ? '' : ', ' ) );
		}
		var getMapFormat = '';
		var getMapFormats = json['Capability']['Request']['GetMap']['Format'];
		for(var i in getMapFormats) {
			getMapFormat += ( getMapFormats[i] +( (getMapFormats.length-1) == i ? '' : ', ' ) );
		}
		var getFeatureInfoFormat = '';
		var getFeatureInfoFormats = json['Capability']['Request']['GetFeatureInfo']['Format'];
		for(var i in getFeatureInfoFormats) {
			getFeatureInfoFormat += ( getFeatureInfoFormats[i] +( (getFeatureInfoFormats.length-1) == i ? '' : ', ' ) );
		}
		var exceptionFormat = '';
		var exceptionFormats = json['Capability']['Exception'];
		for(var i in exceptionFormats) {
			exceptionFormat += ( exceptionFormats[i] +( (exceptionFormats.length-1) == i ? '' : ', ' ) );
		}
        var WGS84 = json['Capability']['Layer']['EX_GeographicBoundingBox'];
        var maxExtent = json['Capability']['Layer']['BoundingBox'][0]['extent'];
		var crs = json['Capability']['Layer']['BoundingBox'][0]['crs'];		
		var title = json['Service']['Title'];
		var onlineResource = json['Service']['OnlineResource'];
        var abstract = json['Service']['Abstract'];
        var fees = json['Service']['Fees'];
        var accessConstraints = json['Service']['AccessConstraints'];
        var contactPerson;
        var contactOrganization;
        
        if ( json['Service']['ContactInformation'] !== undefined ) {
            contactPerson = json['Service']['ContactInformation']['ContactPersonPrimary']['ContactPerson'];
            contactOrganization = json['Service']['ContactInformation']['ContactPersonPrimary']['ContactOrganization'];
        }
        
        var keywordList = json['Service']['KeywordList'];
        
        
        if ( crs === "CRS:84" || crs === "EPSG:4326" ) {
            //maxExtent = [ maxExtent[1], maxExtent[0], maxExtent[3], maxExtent[2] ];
            maxExtent = [-185.8007812499999, -46.07323062540835, 472.67578125000006, 65.94647177615741];
        }
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            WGS84 : WGS84,
            service : service,
            version : version,
            keywordList : keywordList,
            abstract : abstract,
            maxExtent : maxExtent,
            getMapFormat : getMapFormat,
            contactPerson : contactPerson,
            onlineResource : onlineResource,                        
            exceptionFormat : exceptionFormat,
            accessConstraints : accessConstraints,
            contactOrganization : contactOrganization,
            getFeatureInfoFormat : getFeatureInfoFormat,
            getCapabilitiesFormat : getCapabilitiesFormat
        };
        
        return metaData;
    };






    /*
    var _getServiceMetaData_WMS = function(xmlJson_) {
        var xmlJson = xmlJson_;
        
        var service = xmlJson["Service"]["Name"];
        var version = xmlJson["@version"];
        var getCapabilitiesFormat = '';
        var getCapabilitiesFormats = xmlJson["Capability"]["Request"]["GetCapabilities"]["Format"];
        if ( Array.isArray( getCapabilitiesFormats ) ) { 
            for(var i in getCapabilitiesFormats) {
                getCapabilitiesFormat += ( getCapabilitiesFormats[i] +( (getCapabilitiesFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            getCapabilitiesFormat = getCapabilitiesFormats;
        }
		var getMapFormat = '';
		var getMapFormats = xmlJson["Capability"]["Request"]["GetMap"]["Format"];
        if ( Array.isArray( getMapFormats ) ) { 
            for(var i in getMapFormats) {
                getMapFormat += ( getMapFormats[i] +( (getMapFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            getMapFormat = getMapFormats;
        }
		var getFeatureInfoFormat = '';
		var getFeatureInfoFormats = xmlJson["Capability"]["Request"]["GetFeatureInfo"]["Format"];
        if ( Array.isArray( getFeatureInfoFormats ) ) { 
            for(var i in getFeatureInfoFormats) {
                getFeatureInfoFormat += ( getFeatureInfoFormats[i] +( (getFeatureInfoFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            getFeatureInfoFormat = getFeatureInfoFormats;
        }
		var exceptionFormat = '';
		var exceptionFormats = xmlJson["Capability"]["Exception"]["Format"];
        if ( Array.isArray( exceptionFormats ) ) { 
            for(var i in exceptionFormats) {
                exceptionFormat += ( exceptionFormats[i] +( (exceptionFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            exceptionFormat = exceptionFormats;
        }
        var BBOX = xmlJson["Capability"]["Layer"]["EX_GeographicBoundingBox"];
        var WGS84 = [];
        WGS84[0] = BBOX["westBoundLongitude"];
        WGS84[1] = BBOX["southBoundLatitude"];
        WGS84[2] = BBOX["eastBoundLongitude"];
        WGS84[3] = BBOX["northBoundLatitude"];
        
        BBOX = xmlJson["Capability"]["Layer"]["BoundingBox"];
        var maxExtent = [];
        maxExtent[0] = parseFloat( BBOX["@minx"] );
        maxExtent[1] = parseFloat( BBOX["@miny"] );
        maxExtent[2] = parseFloat( BBOX["@maxx"] );
        maxExtent[3] = parseFloat( BBOX["@maxy"] );
		var crs = xmlJson["Capability"]["Layer"]["BoundingBox"]["@CRS"];		
		var title = xmlJson["Service"]["Title"];
		var onlineResource = xmlJson["Service"]["OnlineResource"]["@xlink:href"];
        var abstract = xmlJson["Service"]["Abstract"];
        var fees = xmlJson["Service"]["Fees"];
        var accessConstraints = xmlJson["Service"]["AccessConstraints"];
        var contactPerson = xmlJson["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactPerson"];
        var contactOrganization = xmlJson["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactOrganization"];
        var keywordList = xmlJson["Service"]["KeywordList"]["Keyword"];
        
        
        if ( crs === "CRS:84" || crs === "EPSG:4326" ) {
            //maxExtent = [ maxExtent[1], maxExtent[0], maxExtent[3], maxExtent[2] ];
            maxExtent = [-185.8007812499999, -46.07323062540835, 472.67578125000006, 65.94647177615741];
        }
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            WGS84 : WGS84,
            service : service,
            version : version,
            keywordList : keywordList,
            abstract : abstract,
            maxExtent : maxExtent,
            getMapFormat : getMapFormat,
            contactPerson : contactPerson,
            onlineResource : onlineResource,                        
            exceptionFormat : exceptionFormat,
            accessConstraints : accessConstraints,
            contactOrganization : contactOrganization,
            getFeatureInfoFormat : getFeatureInfoFormat,
            getCapabilitiesFormat : getCapabilitiesFormat
        };
        
        return metaData;
    };
    */

    



    /*
    var _getServiceMetaData_WMS = function(child_) {
        child_.setServiceType("WMS");
        var response = child_.callAjax();
        var json = _xmlToJson( response );
        
        var service = json['WMS_Capabilities']['Service']['Name']['#text'];
        var version = json['WMS_Capabilities']['@attributes']['version'];
        
        
        var getCapabilitiesFormat = '';
        var getCapabilitiesFormats = json['WMS_Capabilities']['Capability']['Request']['GetCapabilities']['Format'];
        
        if ( Array.isArray( getCapabilitiesFormats ) ) { 
            for(var i in getCapabilitiesFormats) {
                getCapabilitiesFormat += ( getCapabilitiesFormats[i]['#text'] +( (getCapabilitiesFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            getCapabilitiesFormat = getCapabilitiesFormats['#text'];
        }
		
        
		var getMapFormat = '';
		var getMapFormats = json['WMS_Capabilities']['Capability']['Request']['GetMap']['Format'];
        
        if ( Array.isArray( getMapFormats ) ) { 
            for(var i in getMapFormats) {
                getMapFormat += ( getMapFormats[i]['#text'] +( (getMapFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            getCapabilitiesFormat = getMapFormats['#text'];
        }
        
        
		var getFeatureInfoFormat = '';
		var getFeatureInfoFormats = json['WMS_Capabilities']['Capability']['Request']['GetFeatureInfo']['Format'];
        if ( Array.isArray( getFeatureInfoFormats ) ) { 
            for(var i in getFeatureInfoFormats) {
                getFeatureInfoFormat += ( getFeatureInfoFormats[i]['#text'] +( (getFeatureInfoFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            getFeatureInfoFormat = getFeatureInfoFormats['#text'];
        }
        
        
		var exceptionFormat = '';
		var exceptionFormats = json['WMS_Capabilities']['Capability']['Exception']['Format'];
        if ( Array.isArray( exceptionFormats ) ) { 
            for(var i in exceptionFormats) {
                exceptionFormat += ( exceptionFormats[i]['#text'] +( (exceptionFormats.length-1) == i ? '' : ', ' ) );
            }
        } else {
            exceptionFormat = exceptionFormats['#text'];
        }

        
        var WGS84 = [];
        WGS84[0] = json['WMS_Capabilities']['Capability']['Layer']['EX_GeographicBoundingBox']['westBoundLongitude']['#text'];
        WGS84[1] = json['WMS_Capabilities']['Capability']['Layer']['EX_GeographicBoundingBox']['southBoundLatitude']['#text'];
        WGS84[2] = json['WMS_Capabilities']['Capability']['Layer']['EX_GeographicBoundingBox']['eastBoundLongitude']['#text'];
        WGS84[3] = json['WMS_Capabilities']['Capability']['Layer']['EX_GeographicBoundingBox']['northBoundLatitude']['#text'];
        
		//var maxExtent = json['Capability']['Layer']['Layer'][0]['BoundingBox'][0]['extent'];
        var maxExtent = [];
        maxExtent[0] = json['WMS_Capabilities']['Capability']['Layer']['BoundingBox']['@attributes']['minx'];
        maxExtent[1] = json['WMS_Capabilities']['Capability']['Layer']['BoundingBox']['@attributes']['miny'];
        maxExtent[2] = json['WMS_Capabilities']['Capability']['Layer']['BoundingBox']['@attributes']['maxx'];
        maxExtent[3] = json['WMS_Capabilities']['Capability']['Layer']['BoundingBox']['@attributes']['maxy'];
        
		var crs = json['WMS_Capabilities']['Capability']['Layer']['BoundingBox']['@attributes']['CRS'];
		var title = json['WMS_Capabilities']['Service']['Title']['#text'];
		var onlineResource = json['WMS_Capabilities']['Service']['OnlineResource']['@attributes']['xlink:href'];
        var abstract = json['WMS_Capabilities']['Service']['Abstract']['#text'];
        var fees = json['WMS_Capabilities']['Service']['Fees']['#text'];
        var accessConstraints = json['WMS_Capabilities']['Service']['AccessConstraints']['#text'];
        var contactPerson = '';
        
        if ( json['WMS_Capabilities']['Service']['ContactPerson'] !== undefined ) {
            contactPerson = json['WMS_Capabilities']['Service']['ContactPerson']['#text'];
        }
        
        var contactOraganization = '';
        
        if ( json['WMS_Capabilities']['Service']['ContactOraganization'] !== undefined ) {
            contactOraganization = json['WMS_Capabilities']['Service']['ContactOraganization']['#text'];
        }
        
        var keywords = '';
        
        if ( json['WMS_Capabilities']['Service']['Keywords'] !== undefined ) {
            keywords = json['WMS_Capabilities']['Service']['Keywords']['#text'];
        }
        
        
        if ( crs === "CRS:84" || crs === "EPSG:4326" ) {
            //maxExtent = [ maxExtent[1], maxExtent[0], maxExtent[3], maxExtent[2] ];
            maxExtent = [-185.8007812499999, -46.07323062540835, 472.67578125000006, 65.94647177615741];
        }
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            WGS84 : WGS84,
            service : service,
            version : version,
            keywords : keywords,
            abstract : abstract,
            maxExtent : maxExtent,
            getMapFormat : getMapFormat,
            contactPerson : contactPerson,
            onlineResource : onlineResource,                        
            exceptionFormat : exceptionFormat,
            accessConstraints : accessConstraints,
            contactOraganization : contactOraganization,
            getFeatureInfoFormat : getFeatureInfoFormat,
            getCapabilitiesFormat : getCapabilitiesFormat
        };
        
        return metaData;
    };
    */


    var capabilities_WFS = function() {
        
        var Child = function() {
            default_capabilities.apply( this, arguments );
        };
        Child.prototype = default_capabilities.prototype;
        
        var child = new Child();
        
        
        this.setAttribute = function(attribute_) {
            child.setAttribute( attribute_ );
        };
        
        
        this.getCapabilities_WFS = function() { 
            return _getCapabilities_WFS( child );
        };
        
        
        this.getServiceMetaData_WFS = function() { 
            return _getServiceMetaData_WFS( child );
        };
        
    }



    var _getCapabilities_WFS = function(child_) {
        child_.setServiceType("WFS");
        var response = child_.callAjax();
        var xmlJson = _xmlToJson( response );
        var serviceMetaData = _getServiceMetaData_WFS( xmlJson );
        
        return {
            document : response,
            xmlJson : xmlJson,
            olJson : undefined,
            serviceMetaData : serviceMetaData
        };
    };


    
    
    var _getServiceMetaData_WFS = function(xmlJson_) {
        var json = xmlJson_;
        
        var title = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Title"]["#text"];
		var abstract = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"]["#text"];
		var fees = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Fees"]["#text"];
		var accessconstraints = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"]["#text"];
        var crs = 'EPSG:4326';
        var keywordList = [];
        var keywords = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"]["ows:Keyword"];
        for(var i in keywords) {
            keywordList.push( keywords[i]["#text"] );
        }
        
        var providerName = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        var providerSite = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        
        if ( providerName !== undefined ) {
            providerName = providerName["#text"];
        }
        if ( providerSite !== undefined ) {
            providerSite = providerSite["#text"];
        }
        //var serviceContact = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];

        var featureType = json["wfs:WFS_Capabilities"]["FeatureTypeList"]["FeatureType"];
        
        var layers = [];
		if ( Array.isArray( featureType ) ) {
			crs = featureType[0]["DefaultSRS"]["#text"];
            
            for (var i in featureType) {
                var temp = {
                    Title : featureType[i]["Title"]["#text"],
                    Name : featureType[i]["Name"]["#text"]
                }
                layers.push( temp );
            }
            
		} else {
			crs = featureType["DefaultSRS"]["#text"];
            
            var temp = {
                Title : featureType["Title"]["#text"],
                Name : featureType["Name"]["#text"]
            }
            layers.push( temp );
		}
                
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            providerName : providerName,
            providerSite : providerSite,
            //serviceContact : serviceContact,
            accessconstraints : accessconstraints,
            
            layers : layers
        };
        
        return metaData;
    };
    










    var capabilities_WMTS = function() {
        
        var Child = function() {
            default_capabilities.apply( this, arguments );
        };
        Child.prototype = default_capabilities.prototype;
        
        var child = new Child();
        
        
        this.setAttribute = function(attribute_) {
            child.setAttribute( attribute_ );
        };
        
        
        this.getCapabilities_WMTS = function() { 
            return _getCapabilities_WMTS( child );
        };
        
        
        this.getServiceMetaData_WMTS = function() { 
            return _getServiceMetaData_WMTS( child );
        };
        
    };

    
    var _getCapabilities_WMTS = function(child_) {
        child_.setServiceType("WMTS");
        var response = child_.callAjax();
        var parser = new ol.format.WMTSCapabilities();        
        var olJson = parser.read( response ); 
        var xmlJson = _xmlToJson( response );
        var serviceMetaData = _getServiceMetaData_WMTS( olJson );        
        
        var legendURL = xmlJson["Capabilities"]["Contents"]["Layer"]["Style"]["ows:LegendURL"];
        if ( legendURL !== undefined ) {
            legendURL = legendURL["ows:OnlineResource"]["@attributes"]["xlink:href"];
            serviceMetaData["legendURL"] = legendURL;
        }
        
        var extra_serviceIdentification = xmlJson["Capabilities"]["ows:ServiceIdentification"];
        
        
        if(extra_serviceIdentification  !== undefined ) {
        	        	
        	if(extra_serviceIdentification["ows:Abstract"] !== undefined ){
        		serviceMetaData["abstract"] = extra_serviceIdentification["ows:Abstract"]["#text"];
        	}
        	
        	if(extra_serviceIdentification["ows:AccessConstraints"] !== undefined ) {
        		serviceMetaData["accessconstraints"] = extra_serviceIdentification["ows:AccessConstraints"]["#text"];
        	}
        	
        	if(extra_serviceIdentification["ows:Fees"] !== undefined ) {
        		serviceMetaData["fees"] = extra_serviceIdentification["ows:Fees"]["#text"];    
        	}   
        	
        	if(extra_serviceIdentification["ows:Keywords"] !== undefined ) {
        		var keywords = extra_serviceIdentification["ows:Keywords"]["ows:Keyword"];
            	var keywordList = [];        	
            	
            	if ( keywords !== undefined ) {
                    if ( Array.isArray( keywords ) ) {            
                        for(var i in keywords) {
                            keywordList.push( keywords[i]["#text"]);
                        }
                    } else {
                        keywordList.push( keywords["#text"] );
                    }
                }        	
            	serviceMetaData["keywords"] = keywordList; 
        	}        	
        }
        
        return {
            document : response,
            xmlJson : xmlJson,
            olJson : olJson,
            serviceMetaData : serviceMetaData
        };
    };




    var _getServiceMetaData_WMTS = function(xmlJson_) {
        var json = xmlJson_;  
        
        var crs = json["Contents"]["TileMatrixSet"];
        if ( Array.isArray( crs ) ) {
            crs = crs[0]["SupportedCRS"];
        } else {
            crs = crs["SupportedCRS"];
        }
        
        var title = json["ServiceIdentification"]["Title"];
		var abstract = json["ServiceIdentification"]["Abstract"];
		var fees = json["ServiceIdentification"]["Fees"];
		var accessconstraints = json["ServiceIdentification"]["AccessConstraints"];
        
        var keywordList = [];
        var keywords = json["ServiceIdentification"]["Keywords"];
        if ( keywords !== undefined ) {
            if ( Array.isArray( keywords ) ) {            
                for(var i in keywords) {
                    keywordList.push( keywords[i]["Keyword"] );
                }
            } else {
                keywordList.push( keywords["Keyword"] );
            }
        }

        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            accessconstraints : accessconstraints
        };
        
        return metaData;
    };



    
    /*
    var _getServiceMetaData_WMTS = function(xmlJson_) {
        var json = xmlJson_;
        
        var crs = json["Capabilities"]["Contents"]["TileMatrixSet"]["ows:SupportedCRS"]["#text"];
        var title = json["Capabilities"]["ows:ServiceIdentification"]["ows:Title"]["#text"];
		var abstract = json["Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"]["#text"];
		var fees = json["Capabilities"]["ows:ServiceIdentification"]["ows:Fees"]["#text"];
		var accessconstraints = json["Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"]["#text"];
        
        var keywordList = [];
        var keywords = json["Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"]["ows:Keyword"];
        if ( Array.isArray( keywords ) ) { 
            for(var i in keywords) {
                keywordList.push( keywords[i]["#text"] );
            }
        } else {
            keywordList.push( keywords['#text'] );
        }

        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            accessconstraints : accessconstraints
        };
        
        return metaData;
    };
    */








    var capabilities_WCS = function() {
        
        var Child = function() {
            default_capabilities.apply( this, arguments );
        };
        Child.prototype = default_capabilities.prototype;
        
        var child = new Child();
        
        
        this.setAttribute = function(attribute_) {
            child.setAttribute( attribute_ );
        };
        
        
        this.getCapabilities_WCS = function() { 
            return _getCapabilities_WCS( child );
        };
        
        
        this.getServiceMetaData_WCS = function() { 
            return _getServiceMetaData_WCS( child );
        };
        
    };



    var _getCapabilities_WCS = function(child_) {
        child_.setServiceType("WCS");
        var response = child_.callAjax();
        var xmlJson = _xmlToJson( response );
        var serviceMetaData = _getServiceMetaData_WCS( xmlJson );
        
        return {
            document : response,
            xmlJson : xmlJson,
            olJson : undefined,
            serviceMetaData : serviceMetaData
        };
    };


    
    
    var _getServiceMetaData_WCS = function(xmlJson_) {
        var json = xmlJson_;
        
        var title = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Title"]["#text"];
		var abstract = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"]["#text"];
		var fees = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Fees"]["#text"];
		var accessconstraints = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"]["#text"];
        var crs = 'EPSG:4326';
		
        var keywordList = [];
        var keywords = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"]["ows:Keyword"];
        for(var i in keywords) {
            keywordList.push( keywords[i]["#text"] );
        }
        
        var providerName = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"]["#text"];
        var providerSite = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"]["#text"];
        //var serviceContact = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];
        
        var tempSupportedFormat = json["wcs:Capabilities"]["wcs:Contents"]["wcs:SupportedFormat"];
        
        var supportedFormats = [];
        for(var i in tempSupportedFormat) {
            supportedFormats.push( tempSupportedFormat[i]["#text"] );
        }
        
        var tempCoverageSummary = json["wcs:Capabilities"]["wcs:Contents"]["wcs:CoverageSummary"];
        
        if ( !Array.isArray( tempCoverageSummary ) ) {
            tempCoverageSummary = [ tempCoverageSummary ];
        }
        
        var coverages = [];
        for(var i in tempCoverageSummary) {
            var lowerCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"]["ows:LowerCorner"]["#text"];
            var upperCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"]["ows:UpperCorner"]["#text"];
            
            var extent = [];
            extent[0] = parseFloat( ( lowerCorner.split(' ') )[0] );
            extent[1] = parseFloat( ( lowerCorner.split(' ') )[1] );
            extent[2] = parseFloat( ( upperCorner.split(' ') )[0] );
            extent[3] = parseFloat( ( upperCorner.split(' ') )[1] );
            
            coverages.push( {
                Identifier : tempCoverageSummary[i]["wcs:Identifier"]["#text"],
                BBOX : extent
            } );
        }
        
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            providerName : providerName,
            providerSite : providerSite,
            accessconstraints : accessconstraints,
            supportedFormats : supportedFormats,
            coverages : coverages
        };
        
        return metaData;
    };








    
    var _xmlToJson = function xmlToJson(xml_) {
		
		// Create the return object
		var obj = {};

		if (xml_.nodeType == 1) { // element
			// do attributes
			if (xml_.attributes.length > 0) {
			obj["@attributes"] = {};
				for (var j = 0; j < xml_.attributes.length; j++) {
					var attribute = xml_.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml_.nodeType == 3) { // text
			obj = xml_.nodeValue;
		}

		// do children
		if (xml_.hasChildNodes()) {
			for(var i = 0; i < xml_.childNodes.length; i++) {
				var item = xml_.childNodes.item(i);
				var nodeName = item.nodeName;
				if (typeof(obj[nodeName]) == "undefined") {
					obj[nodeName] = _xmlToJson( item );
				} else {
					if (typeof(obj[nodeName].push) == "undefined") {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push( _xmlToJson( item ) );
				}
			}
		}
		return obj;
	};



    
    var _getParamsURL = function(params_) {
        var toParams = '';

        for (key in params_) {
            if (params_.hasOwnProperty(key)) {
                toParams += ('&' + key + '=' + params_[key]);
            }
        }

        return '?' + toParams;	
    }
    
    var refresh = function (){    	
    	var _view = _olMap.getView();
    	_view.setCenter( [_view.getCenter()[0]+5, _view.getCenter()[1] ] );
    	_view.setCenter( [_view.getCenter()[0]-5, _view.getCenter()[1] ] );
    	_olMap.updateSize();
    }
    
    return {
        OBJ_Map : OBJ_Map,
        layer_WMS : layer_WMS,
        layer_WCS : layer_WCS,
        layer_WFS : layer_WFS,
        layer_WMTS : layer_WMTS,
        capabilities_WMS : capabilities_WMS,
        capabilities_WCS : capabilities_WCS,
        capabilities_WFS : capabilities_WFS,
        capabilities_WMTS : capabilities_WMTS,
        refresh : refresh
    }
    
    
};