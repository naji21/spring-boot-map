
var baseMapModule = function() {
    
    var _map;
    var _view;
    var _targetDIV;
    var _baseMapType;
    
    
    var _baseMapOBJ = {
        daum : undefined,
        naver : undefined,
        osm : undefined,
        naturalEarth : undefined,
        google : undefined,
    };
    
    
    var _baseMapTypes = {
        daum_normal : {
            //id : daum.maps.MapTypeId['NORMAL'],
            id : 1,
            minZoom : 1,
            maxZoom : 14,
            projection : 'EPSG:5181',
            createMapOBJ : function() {
                var mapContainer = document.getElementById(_targetDIV);
                var daumMapOptions = {
                    center : new daum.maps.LatLng(33.450701, 126.570667),
                    level : 3
                };

                _baseMapOBJ["daum"] = new daum.maps.Map(mapContainer, daumMapOptions);
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var daumCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var daumLevel = (16 - syncData["zoom"] - 1);

                _baseMapOBJ["daum"].setLevel( daumLevel );
                _baseMapOBJ["daum"].setCenter(new daum.maps.LatLng(daumCenter[1], daumCenter[0]));
                
                _baseMapOBJ["daum"].relayout();
            },
            setMapType : function() {
                _baseMapOBJ["daum"].setMapTypeId( daum.maps.MapTypeId['NORMAL'] );
            }
        },
        daum_hybrid : {
            //id : daum.maps.MapTypeId['HYBRID'],
            id : 3,
            minZoom : 1,
            maxZoom : 13,
            projection : 'EPSG:5181',
            createMapOBJ : function() {
                var mapContainer = document.getElementById(_targetDIV);
                var daumMapOptions = {
                    center : new daum.maps.LatLng(33.450701, 126.570667),
                    level : 3
                };

                _baseMapOBJ["daum"] = new daum.maps.Map(mapContainer, daumMapOptions);
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var daumCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var daumLevel = (16 - syncData["zoom"] - 1);

                _baseMapOBJ["daum"].setLevel( daumLevel );
                _baseMapOBJ["daum"].setCenter(new daum.maps.LatLng(daumCenter[1], daumCenter[0]));
                
                _baseMapOBJ["daum"].relayout();
            },
            setMapType : function() {
                _baseMapOBJ["daum"].setMapTypeId( daum.maps.MapTypeId['HYBRID'] );
            }
        },
        naver_normal : {
            //id : naver.maps.MapTypeId['NORMAL'],
            id : 'normal',
            projection : 'EPSG:5181',
            minZoom : 1,
            maxZoom : 14,
            createMapOBJ : function() {
                var naverMapOptions = {
                    center: new naver.maps.LatLng(37.3595704, 127.105399),
                    zoom: 10
                };

                _baseMapOBJ["naver"] = new naver.maps.Map(_targetDIV, naverMapOptions);
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var naverCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var naverLevel = ( syncData["zoom"] );

                _baseMapOBJ["naver"].setZoom( naverLevel, true );
                _baseMapOBJ["naver"].setCenter(new naver.maps.LatLng(naverCenter[1], naverCenter[0]));
            },
            setMapType : function() {
                _baseMapOBJ["naver"].setMapTypeId( naver.maps.MapTypeId['NORMAL'] );
            }
        },
        naver_hybrid : {
            //id : naver.maps.MapTypeId['HYBRID'],
            id : 'hybrid',
            projection : 'EPSG:5181',
            minZoom : 0,
            maxZoom : 13,
            createMapOBJ : function() {
                var naverMapOptions = {
                    center: new naver.maps.LatLng(37.3595704, 127.105399),
                    zoom: 10
                };

                _baseMapOBJ["naver"] = new naver.maps.Map(_targetDIV, naverMapOptions);
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var naverCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var naverLevel = ( syncData["zoom"] );

                _baseMapOBJ["naver"].setZoom( naverLevel, true );
                _baseMapOBJ["naver"].setCenter(new naver.maps.LatLng(naverCenter[1], naverCenter[0]));
            },
            setMapType : function() {
                _baseMapOBJ["naver"].setMapTypeId( naver.maps.MapTypeId['HYBRID'] );
            }
        },
        osm_normal : {
            projection : 'EPSG:3857',
            minZoom : 0,
            maxZoom : 21,
            createMapOBJ : function() {
                var osmMap = new ol.Map({
                    layers : [
                        new ol.layer.Tile({
                            source: new ol.source.OSM()
                        })
                    ],
                    controls : [],
                    interactions : [],
                    target : _targetDIV,
                    view : new ol.View({
                        center : [0, 0],
                        zoom : 2
                    })
                });

                _baseMapOBJ["osm"] = osmMap;
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var osmCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:3857");
                var osmLevel = ( syncData["zoom"] );

                _baseMapOBJ["osm"].getView().setZoom( osmLevel );
                _baseMapOBJ["osm"].getView().setCenter( osmCenter );
                
                _baseMapOBJ["osm"].updateSize();
            },
            setMapType : function() {
                console.log('setMapType None OSM');
            }
        },
        naturalEarth_normal : {
            projection : 'EPSG:4326',
            createMapOBJ : function() {
                var naturalEarthMap = new ol.Map({
                    layers : [
                        new ol.layer.Tile({
                            source : new ol.source.TileWMS({
                                url : 'http://demo.boundlessgeo.com/geoserver/wms',
                                params : {
                                    'LAYERS': 'ne:ne'
                                }
                            })
                        })
                    ],
                    controls : [],
                    interactions : [],
                    target : _targetDIV,
                    view : new ol.View({
                        projection : 'EPSG:4326',
                        center : [0, 0],
                        zoom : 2
                    })
                });

                _baseMapOBJ["naturalEarth"] = naturalEarthMap;
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var naturalEarthCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var naturalEarthLevel = ( syncData["zoom"] );

                _baseMapOBJ["naturalEarth"].getView().setZoom( naturalEarthLevel );
                _baseMapOBJ["naturalEarth"].getView().setCenter( naturalEarthCenter );
            },
            setMapType : function() {
                console.log('setMapType None naturalEarth');
            }
        },
        google_normal : {
            //id : google.maps.MapTypeId.ROADMAP,
            id : 'roadmap',
            minZoom : 0,
            maxZoom : 21,
            projection : 'EPSG:900913',
            createMapOBJ : function() {
                var mapOptions = {
                    zoom : 4,
                    center : {lat: -33, lng: 151},
                    disableDefaultUI : true
                }
                
                _baseMapOBJ["google"] = new google.maps.Map(document.getElementById(_targetDIV), mapOptions);
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var googleCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var googleLevel = ( syncData["zoom"] );

                _baseMapOBJ["google"].setZoom( googleLevel );
                _baseMapOBJ["google"].setCenter( {lat: googleCenter[1], lng: googleCenter[0]} );
                
                google.maps.event.trigger(_baseMapOBJ["google"], "resize");
            },
            setMapType : function() {
                _baseMapOBJ["google"].setMapTypeId( google.maps.MapTypeId.ROADMAP );
            }
        },
        google_hybrid : {
            //id : google.maps.MapTypeId.HYBRID,
            id : 'hybrid',
            minZoom : 0,
            maxZoom : 21,
            projection : 'EPSG:900913',
            createMapOBJ : function() {
                var mapOptions = {
                    zoom : 4,
                    center : {lat: -33, lng: 151},
                    disableDefaultUI : true
                }
                
                _baseMapOBJ["google"] = new google.maps.Map(document.getElementById(_targetDIV), mapOptions);
            },
            syncMapFunc : function(evt_) {
                var syncData = _syncMapData(evt_);

                var googleCenter = ol.proj.transform(syncData["center"], syncData["projection"], "EPSG:4326");
                var googleLevel = ( syncData["zoom"] );

                _baseMapOBJ["google"].setZoom( googleLevel );
                _baseMapOBJ["google"].setCenter( {lat: googleCenter[1], lng: googleCenter[0]} );
            },
            setMapType : function() {
                _baseMapOBJ["google"].setMapTypeId( google.maps.MapTypeId.HYBRID );
            }
        },
    };
    
    
    
    
    var _init = function(attribute_) {
        _baseMapType = attribute_["baseMapType"];
        _targetDIV = attribute_["targetDIV"];
        _map = attribute_["map"];
        //_view = _createView( _baseMapTypes[_baseMapType]["projection"] );
        _view = _createView( _baseMapTypes[_baseMapType] );
        
        
        
        if ( _baseMapType.indexOf('daum') > -1 || _baseMapType.indexOf('naver') > -1 ) {
            _view.setZoom( _view.getZoom()-5 );
        } else if ( _baseMapType.indexOf('osm') > -1 || _baseMapType.indexOf('naturalEarth') > -1 ) {
            _view.setZoom( _view.getZoom()+5 );
        }

        console.log('### BaseMap Init ###');
        console.log('BaseMapType : ' + _baseMapType);
        console.log('openLayers View : ' + _view);
        
        _baseMapTypes[_baseMapType]["createMapOBJ"]();
        _baseMapTypes[_baseMapType]["setMapType"]();
        
        var syncMapFun = _baseMapTypes[_baseMapType]["syncMapFunc"];
        _view.on('change:resolution', syncMapFun);
        _view.on('change:center', syncMapFun);
        
        if ( _baseMapType.indexOf('naturalEarth') > -1 ) {
            _transfromLayerProjection( _map.getView().getProjection().getCode(), 'EPSG:4326' );
        } else {
            _transfromLayerProjection( _map.getView().getProjection().getCode(), _baseMapTypes[_baseMapType]["projection"] );
        }
        
        _view.setCenter( [_view.getCenter()[0]+5, _view.getCenter()[1] ] );
        _view.setCenter( [_view.getCenter()[0]-5, _view.getCenter()[1] ] );
        
        _map.setView( _view );
    };
    
    
        
    var _createView = function(baseMap_) {
        var oldView = _map.getView();
        var newProjection = baseMap_["projection"];
        var minZoom = baseMap_["minZoom"];
        var maxZoom = baseMap_["maxZoom"];
        
        return new ol.View({
            projection : newProjection,
            center : ol.proj.transform(oldView.getCenter(), oldView.getProjection(), newProjection),
            zoom : oldView.getZoom(),
            minZoom : minZoom,
            maxZoom : maxZoom
        });
    };    
    
    
    
    var _syncMapData = function(evt_) {
        var view = evt_.target;
        
        var data = {
            view : view,
            resolution : view.getResolution(),
            center : view.getCenter(),
            zoom : view.getZoom(),
            projection : view.getProjection()
        }
        
        return data;
    };    
    
    
    
    var _changeBaseMap = function(baseMapType_) {
        
        var beforeBMType1 = _baseMapType.split('_')[0];
        var beforeBMType2 = _baseMapType.split('_')[1];
        var afterBMType1 = baseMapType_.split('_')[0];
        var afterBMType2 = baseMapType_.split('_')[1];
        
        if ( baseMapType_ === _baseMapType ) {
            return false;
        }
        
        /*
        *  daum, naver type
        */
        if ( ( afterBMType1 === beforeBMType1 ) && ( afterBMType2 !== beforeBMType2 ) ) {
            
            _baseMapTypes[baseMapType_]["setMapType"]();
            _view.setCenter( [_view.getCenter()[0]+5, _view.getCenter()[1] ] );
            _view.setCenter( [_view.getCenter()[0]-5, _view.getCenter()[1] ] );
            
        } else {
            document.getElementById(_targetDIV).innerHTML = "";
            
            _baseMapTypes[baseMapType_]["createMapOBJ"]();
            _baseMapTypes[baseMapType_]["setMapType"]();
            
            var syncMapFun = _baseMapTypes[baseMapType_]["syncMapFunc"];
            //_view = _createView( _baseMapTypes[baseMapType_]["projection"] );
            _view = _createView( _baseMapTypes[baseMapType_] );
            _view.on('change:resolution', syncMapFun);
            _view.on('change:center', syncMapFun);

            _view.setCenter( [_view.getCenter()[0]+5, _view.getCenter()[1] ] );
            _view.setCenter( [_view.getCenter()[0]-5, _view.getCenter()[1] ] );

            
            if ( _baseMapType.indexOf('daum') > -1 || _baseMapType.indexOf('naver') > -1 ) {
                if ( baseMapType_.indexOf('osm') > -1 || baseMapType_.indexOf('naturalEarth') > -1 || baseMapType_.indexOf('google') > -1 ) {
                    _view.setZoom( _view.getZoom()+5 );
                }
            } else if ( _baseMapType.indexOf('osm') > -1 || _baseMapType.indexOf('naturalEarth') > -1 || _baseMapType.indexOf('google') > -1 ) {
                if ( baseMapType_.indexOf('daum') > -1 || baseMapType_.indexOf('naver') > -1 ) {
                    //_view.setZoom( _view.getZoom()-5 );
                    
                    // To do - 세계 지도에서 국내 지도 변경 시 처리
                    _view.fit( ol.proj.get("EPSG:5181").getExtent(), _map.getSize() );
                    
                    
                }
            }
            
            
            var beforeProjection = _baseMapTypes[_baseMapType]["projection"];
            var afterProjection = _baseMapTypes[baseMapType_]["projection"]
            
            if ( beforeProjection !== afterProjection ) {
                _transfromLayerProjection( beforeProjection, afterProjection );
            }
            
            _map.setView( _view );
            
        }
        
        _baseMapType = baseMapType_;
        
        console.log('### changeBaseMap ###');
        console.log('baseMapType : ' + _baseMapType);
        console.log('view : ' + _view);
        
    };
    
    
    
    
    
    var _transfromLayerProjection = function(source_, destination_) {
        var layers = _map.getLayers().getArray();
        for(var idx_layer in layers) {
            var source = layers[idx_layer].getSource();
            if ( source instanceof ol.source.TileWMS ) {
            //if ( source instanceof ol.source.ImageWMS ) {
                if ( destination_ === 'EPSG:4326' ) {
                    //source.getParams().CRS = 'EPSG:4326';
                    source.getParams().VERSION = '1.1.0';
                    source.updateParams( source.getParams() );
                }
            } else if ( source instanceof ol.source.Vector ) {
                var features = source.getFeatures();
                for(var idx_feature in features) {
                    features[idx_feature] = features[idx_feature].getGeometry().transform(source_, destination_);
                }
            }
        }
    };
    
  
    
    return {
        init : _init,
        changeBaseMap : _changeBaseMap,
        view : _view,
        map : function() {return _map},
        baseMapType : function() {return _baseMapType},
        baseMapOBJ : function() {return _baseMapOBJ}
    }
    
    
};