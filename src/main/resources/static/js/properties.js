( function() {
	'use strict';

	var NJMAP_PROP = NJMAP_PROP || {};

	var root = '';
	var hostIndex = location.href.indexOf( location.host ) + location.host.length;
	var contextPath = location.href.substring( hostIndex, location.href.indexOf( '/', hostIndex + 1 ) );
	root = contextPath + root;

	var imagesPath = 'resources/images/';

	NJMAP_PROP.OBJECT = {
		CONFIG : {
			name : 'njMapConfig',
			link_api : root + '/apidoc/njMap.njMapConfig.html',
			object : 'njMap.njMapConfig'
		},
		HTTP : {
			name : 'njMapHttp',
			link_api : root + '/apidoc/njMap.njMapHttp.html',
			object : 'njMap.njMapHttp'
		},
		MAP : {
			name : 'njMap',
			link_api : root + '/apidoc/njMap.njMap.html',
			object : 'njMap.njMap'
		},
		POPUP : {
			name : 'njMapPopup',
			link_api : root + '/apidoc/njMap.njMapPopup.html',
			object : 'njMap.njMapPopup'
		},
		CAPTURE : {
			name : 'njMapCapture',
			link_api : root + '/apidoc/njMap.njMapCapture.html',
			object : 'njMap.njMapCapture'
		},

		SERVICE : {
			CAPABILITIES : {
				DEFAULT : {
					name : 'njMapGetCapabilitiesDefault',
					link_api : root + '/apidoc/njMap.service.njMapGetCapabilitiesDefault.html',
					object : 'njMap.service.njMapGetCapabilitiesDefault'
				},
				WMS : {
					name : 'njMapGetCapabilitiesWMS',
					link_api : root + '/apidoc/njMap.service.njMapGetCapabilitiesWMS.html',
					object : 'njMap.service.njMapGetCapabilitiesWMS'
				},
				WFS : {
					name : 'njMapGetCapabilitiesWFS',
					link_api : root + '/apidoc/njMap.service.njMapGetCapabilitiesWFS.html',
					object : 'njMap.service.njMapGetCapabilitiesWFS'
				},
				WCS : {
					name : 'njMapGetCapabilitiesWCS',
					link_api : root + '/apidoc/njMap.service.njMapGetCapabilitiesWCS.html',
					object : 'njMap.service.njMapGetCapabilitiesWCS'
				},
				WMTS : {
					name : 'njMapGetCapabilitiesWMTS',
					link_api : root + '/apidoc/njMap.service.njMapGetCapabilitiesWMTS.html',
					object : 'njMap.service.njMapGetCapabilitiesWMTS'
				},
			},
			DESCRIBEFEATURETYPE : {
				name : 'njMapDescribeFeatureType',
				link_api : root + '/apidoc/njMap.service.njMapDescribeFeatureType.html',
				object : 'njMap.service.njMapDescribeFeatureType'
			},
			GETFEATURE : {
				name : 'njMapGetFeature',
				link_api : root + '/apidoc/njMap.service.njMapGetFeature.html',
				object : 'njMap.service.njMapGetFeature'
			}
		},

		LAYER : {
			DEFAULT : {
				name : 'njMapLayerDefault',
				link_api : root + '/apidoc/njMap.layer.njMapLayerDefault.html',
				object : 'njMap.layer.njMapLayerDefault'
			},
			WMS : {
				name : 'njMapWMSLayer',
				link_api : root + '/apidoc/njMap.layer.njMapWMSLayer.html',
				object : 'njMap.layer.njMapWMSLayer'
			},
			WFS : {
				name : 'njMapWFSLayer',
				link_api : root + '/apidoc/njMap.layer.njMapWFSLayer.html',
				object : 'njMap.layer.njMapWFSLayer'
			},
			WCS : {
				name : 'njMapWCSLayer',
				link_api : root + '/apidoc/njMap.layer.njMapWCSLayer.html',
				object : 'njMap.layer.njMapWCSLayer'
			},
			WMTS : {
				name : 'njMapWMTSLayer',
				link_api : root + '/apidoc/njMap.layer.njMapWMTSLayer.html',
				object : 'njMap.layer.njMapWMTSLayer'
			},
			VECTOR : {
				name : 'njMapVectorLayer',
				link_api : root + '/apidoc/njMap.layer.njMapVectorLayer.html',
				object : 'njMap.layer.njMapVectorLayer'
			},
			CLUSTER : {
				name : 'njMapClusterLayer',
				link_api : root + '/apidoc/njMap.layer.njMapClusterLayer.html',
				object : 'njMap.layer.njMapClusterLayer'
			},
			VECTOR3D : {
				name : 'njMapVector3DLayer',
				link_api : root + '/apidoc/njMap.layer.njMapVector3DLayer.html',
				object : 'njMap.layer.njMapVector3DLayer'
			},
		},

		TOC : {
			DEFAULT : {
				name : 'njMapTocDefault',
				link_api : root + '/apidoc/njMap.toc.njMapTocDefault.html',
				object : 'njMap.toc.njMapTocDefault'
			},
			WMS : {
				name : 'njMapWMSToc',
				link_api : root + '/apidoc/njMap.toc.njMapWMSToc.html',
				object : 'njMap.toc.njMapWMSToc'
			},
			WEBWMS : {
				name : 'njMapWebWMSToc',
				link_api : root + '/apidoc/njMap.toc.njMapWebWMSToc.html',
				object : 'njMap.toc.njMapWebWMSToc'
			},
			WFS : {
				name : 'njMapWFSToc',
				link_api : root + '/apidoc/njMap.toc.njMapWFSToc.html',
				object : 'njMap.toc.njMapWFSToc'
			},
			WMTS : {
				name : 'njMapWMTSToc',
				link_api : root + '/apidoc/njMap.toc.njMapWMTSToc.html',
				object : 'njMap.toc.njMapWMTSToc'
			}
		},

		BASEMAP : {
			DEFAULT : {
				name : 'njMapBaseMapDefault',
				link_api : root + '/apidoc/njMap.baseMap.njMapBaseMapDefault.html',
				object : 'njMap.baseMap.njMapBaseMapDefault'
			},
			BASEMAP : {
				name : 'njMapBaseMap',
				link_api : root + '/apidoc/njMap.baseMap.njMapBaseMap.html',
				object : 'njMap.baseMap.njMapBaseMap'
			},
			CUSTOM : {
				name : 'njMapBaseMapCustom',
				link_api : root + '/apidoc/njMap.baseMap.njMapBaseMapCustom.html',
				object : 'njMap.baseMap.njMapBaseMapCustom'
			},
			TMS_VWORLD : {
				name : 'njMapBaseMapTMS_vWorld',
				link_api : root + '/apidoc/njMap.baseMap.njMapBaseMapTMS_vWorld.html',
				object : 'njMap.baseMap.njMapBaseMapTMS_vWorld'
			}
		},

		CONTROL : {
			DEFAULT : {
				name : 'njMapControlDefault',
				link_api : root + '/apidoc/njMap.control.njMapControlDefault.html',
				object : 'njMap.control.njMapControlDefault'
			},
			DRAGPAN : {
				name : 'njMapDragPan',
				link_api : root + '/apidoc/njMap.control.njMapDragPan.html',
				object : 'njMap.control.njMapDragPan'
			},
			ZOOMIN : {
				name : 'njMapDragZoomIn',
				link_api : root + '/apidoc/njMap.control.njMapDragZoomIn.html',
				object : 'njMap.control.njMapDragZoomIn'
			},
			ZOOMOUT : {
				name : 'njMapDragZoomOut',
				link_api : root + '/apidoc/njMap.control.njMapDragZoomOut.html',
				object : 'njMap.control.njMapDragZoomOut'
			},
			DRAWFEATURE : {
				name : 'njMapDrawFeature',
				link_api : root + '/apidoc/njMap.control.njMapDrawFeature.html',
				object : 'njMap.control.njMapDrawFeature'
			},
			MEASURE_DEFAULT : {
				name : 'njMapMeasureDefault',
				link_api : root + '/apidoc/njMap.control.njMapMeasureDefault.html',
				object : 'njMap.control.njMapMeasureDefault'
			},
			LENGTH : {
				name : 'njMapLengthMeasure',
				link_api : root + '/apidoc/njMap.control.njMapLengthMeasure.html',
				object : 'njMap.control.njMapLengthMeasure'
			},
			AREA : {
				name : 'njMapAreaMeasure',
				link_api : root + '/apidoc/njMap.control.njMapAreaMeasure.html',
				object : 'njMap.control.njMapAreaMeasure'
			},
			MEASURE_CIRCLE : {
				name : 'njMapCircleMeasure',
				link_api : root + '/apidoc/njMap.control.njMapCircleMeasure.html',
				object : 'njMap.control.njMapCircleMeasure'
			}
		},

		MANAGER : {
			CONTROL : {
				name : 'njMapControlManager',
				link_api : root + '/apidoc/njMap.manager.njMapControlManager.html',
				object : 'njMap.manager.njMapControlManager'
			},

			LAYER : {
				name : 'njMapLayerManager',
				link_api : root + '/apidoc/njMap.manager.njMapLayerManager.html',
				object : 'njMap.manager.njMapLayerManager'
			}
		},

		ANIMATION : {
			DEFAULT : {
				name : 'featureAnimationDefault',
				link_api : root + '/apidoc/njMap.animation.featureAnimationDefault.html',
				object : 'njMap.animation.featureAnimationDefault'
			},
			BOUNCE : {
				name : 'bounceAnimation',
				link_api : root + '/apidoc/njMap.animation.bounceAnimation.html',
				object : 'njMap.animation.bounceAnimation'
			},
			DROP : {
				name : 'dropAnimation',
				link_api : root + '/apidoc/njMap.animation.dropAnimation.html',
				object : 'njMap.animation.dropAnimation'
			},
			SHOW : {
				name : 'showAnimation',
				link_api : root + '/apidoc/njMap.animation.showAnimation.html',
				object : 'njMap.animation.showAnimation'
			},
			TELEPORT : {
				name : 'teleportAnimation',
				link_api : root + '/apidoc/njMap.animation.teleportAnimation.html',
				object : 'njMap.animation.teleportAnimation'
			},
			ZOOMIN : {
				name : 'zoomInAnimation',
				link_api : root + '/apidoc/njMap.animation.zoomInAnimation.html',
				object : 'njMap.animation.zoomInAnimation'
			},
			ZOOMOUT : {
				name : 'zoomOutAnimation',
				link_api : root + '/apidoc/njMap.animation.zoomOutAnimation.html',
				object : 'njMap.animation.zoomOutAnimation'
			},
			LINEDASH : {
				name : 'lineDashMoveAnimation',
				link_api : root + '/apidoc/njMap.animation.lineDashMoveAnimation.html',
				object : 'njMap.animation.lineDashMoveAnimation'
			},
			LINEGRADIENT : {
				name : 'lineGradientAnimation',
				link_api : root + '/apidoc/njMap.animation.lineGradientAnimation.html',
				object : 'njMap.animation.lineGradientAnimation'
			},
			njMapLINEGRADIENT : {
				name : 'njMapLineGradientAnimation',
				link_api : root + '/apidoc/njMap.animation.njMapLineGradientAnimation.html',
				object : 'njMap.animation.njMapLineGradientAnimation'
			},
			SHAPE_DEFAULT : {
				name : 'njMapShapeAnimationDefault',
				link_api : root + '/apidoc/njMap.animation.njMapShapeAnimationDefault.html',
				object : 'njMap.animation.njMapShapeAnimationDefault'
			},
			CIRCLE : {
				name : 'njMapCircleAnimation',
				link_api : root + '/apidoc/njMap.animation.njMapCircleAnimation.html',
				object : 'njMap.animation.njMapCircleAnimation'
			},
			LINE : {
				name : 'njMapLineAnimation',
				link_api : root + '/apidoc/njMap.animation.njMapLineAnimation.html',
				object : 'njMap.animation.njMapLineAnimation'
			},
			POLYGON : {
				name : 'njMapPolygonAnimation',
				link_api : root + '/apidoc/njMap.animation.njMapPolygonAnimation.html',
				object : 'njMap.animation.njMapPolygonAnimation'
			},
			REGULAR : {
				name : 'njMapRegularShapeAnimation',
				link_api : root + '/apidoc/njMap.animation.njMapRegularShapeAnimation.html',
				object : 'njMap.animation.njMapRegularShapeAnimation'
			},
		},

		UTIL : {
			UTIL : {
				name : 'njMapUtil',
				link_api : root + '/apidoc/njMap.util.njMapUtil.html',
				object : 'njMap.util.njMapUtil'
			},
			GEOUTIL : {
				name : 'njMapGeoSpatialUtil',
				link_api : root + '/apidoc/njMap.util.njMapGeoSpatialUtil.html',
				object : 'njMap.util.njMapGeoSpatialUtil'
			}
		},

		ETC : {
			HISTORY : {
				name : 'njMapNavigationHistory',
				link_api : root + '/apidoc/njMap.etc.njMapNavigationHistory.html',
				object : 'njMap.etc.njMapNavigationHistory'
			}
		}
	};

	var PO = NJMAP_PROP.OBJECT;

	NJMAP_PROP.EXAMPLE = {
		BASIC : {
			HTTP : {
				name : 'HTTP',
				title : 'njMapHttp - HTTP 통신',
				desc : 'HTTP 통신(ajax)',
				link_code : root + '/examples/basic/njMapHttp.html',
				link_view : root + '/examples/basic/njMapHttp_view.html',
				img : imagesPath + 'basic/njMapHttp.jpg',
				requires : [ PO.HTTP ]
			},
			MAP : {
				name : 'MAP',
				title : 'njMap - 지도',
				desc : '지도를 생성한다.',
				link_code : root + '/examples/basic/njMap.html',
				link_view : root + '/examples/basic/njMap_view.html',
				img : imagesPath + 'basic/njMap.jpg',
				requires : [ PO.CONFIG, PO.MAP ]
			},
			POPUP : {
				name : 'POPUP',
				title : 'njMapPopup - 팝업',
				desc : '팝업을 생성하고 지도에 표현한다.',
				link_code : root + '/examples/basic/njMapPopup.html',
				link_view : root + '/examples/basic/njMapPopup_view.html',
				img : imagesPath + 'basic/njMapPopup.jpg',
				requires : [ PO.CONFIG, PO.MAP, PO.POPUP ]
			},
			WHEELZOOM : {
				name : 'WHEELZOOM',
				title : 'MouseWheelZoom AltKeyOnly',
				desc : '마우스 휠로 지도 줌 레벨 조절 시 AltKey 조합을 설정한다.',
				link_code : root + '/examples/basic/wheelZoomAltKeyOnly.html',
				link_view : root + '/examples/basic/wheelZoomAltKeyOnly_view.html',
				img : imagesPath + 'basic/scroll.gif',
				requires : [ PO.CONFIG, PO.MAP ]
			},
			HISTORY : {
				name : 'HISTORY',
				title : 'njMapNavigationHistory - 이전/이후 보기',
				desc : '지도 이동 및 영역 변경 시 이력을 기록하고 이전/이후 영역으로 이동한다.',
				link_code : root + '/examples/basic/njMapNavigationHistory.html',
				link_view : root + '/examples/basic/njMapNavigationHistory_view.html',
				img : imagesPath + 'basic/njMapNavigationHistory.jpg',
				requires : [ PO.CONFIG, PO.MAP, PO.ETC.HISTORY ]
			}
		},

		SERVICE : {
			CAPABILITIES : {
				WMS : {
					name : 'CAPABILITIES_WMS',
					title : 'njMapGetCapabilitiesWMS - WMS GetCapabilities 서비스',
					desc : 'WMS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWMS.html',
					link_view : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWMS_view.html',
					img : imagesPath + 'basic/njMapHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WMS ]
				},
				WFS : {
					name : 'CAPABILITIES_WFS',
					title : 'njMapGetCapabilitiesWFS - WFS GetCapabilities 서비스',
					desc : 'WFS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWFS.html',
					link_view : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWFS_view.html',
					img : imagesPath + 'basic/njMapHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WFS ]
				},
				WCS : {
					name : 'CAPABILITIES_WCS',
					title : 'njMapGetCapabilitiesWCS - WCS GetCapabilities 서비스',
					desc : 'WCS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWCS.html',
					link_view : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWCS_view.html',
					img : imagesPath + 'basic/njMapHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WCS ]
				},
				WMTS : {
					name : 'CAPABILITIES_WMTS',
					title : 'njMapGetCapabilitiesWMTS - WMTS GetCapabilities 서비스',
					desc : 'WMTS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWMTS.html',
					link_view : root + '/examples/service/getCapabilities/njMapGetCapabilitiesWMTS_view.html',
					img : imagesPath + 'basic/njMapHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WMTS ]
				},
			},
			DESCRIBEFEATURETYPE : {
				name : 'DESCRIBEFEATURETYPE',
				title : 'njMapDescribeFeatureType - DescribeFeatureType 서비스',
				desc : 'WFS njMapDescribeFeatureType 서비스를 요청한다.',
				link_code : root + '/examples/service/njMapDescribeFeatureType.html',
				link_view : root + '/examples/service/njMapDescribeFeatureType_view.html',
				img : imagesPath + 'basic/njMapHttp.jpg',
				requires : [ PO.SERVICE.DESCRIBEFEATURETYPE ]
			},
			GETFEATURE : {
				name : 'GETFEATURE',
				title : 'njMapGetFeature - njMapGetFeature 서비스',
				desc : 'WFS GetFeature 서비스를 요청한다.',
				link_code : root + '/examples/service/njMapGetFeature.html',
				link_view : root + '/examples/service/njMapGetFeature_view.html',
				img : imagesPath + 'basic/njMapGetFeature.jpg',
				requires : [ PO.SERVICE.GETFEATURE ]
			}
		},

		LAYER : {
			WMS : {
				name : 'WMS',
				title : 'njMapWMSLayer - WMS 레이어',
				desc : 'WMS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapWMSLayer.html',
				link_view : root + '/examples/layer/njMapWMSLayer_view.html',
				img : imagesPath + 'layer/njMapWMSLayer.jpg',
				requires : [ PO.LAYER.WMS ]
			},
			WFS : {
				name : 'WFS',
				title : 'njMapWFSLayer - WFS 레이어',
				desc : 'WFS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapWFSLayer.html',
				link_view : root + '/examples/layer/njMapWFSLayer_view.html',
				img : imagesPath + 'layer/njMapWFSLayer.jpg',
				requires : [ PO.LAYER.WFS ]
			},
			WCS : {
				name : 'WCS',
				title : 'njMapWCSLayer - WCS 레이어',
				desc : 'WCS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapWCSLayer.html',
				link_view : root + '/examples/layer/njMapWCSLayer_view.html',
				img : imagesPath + 'layer/njMapWCSLayer.jpg',
				requires : [ PO.LAYER.WCS ]
			},
			WMTS : {
				name : 'WMTS',
				title : 'njMapWMTSLayer - WMTS 레이어',
				desc : 'WMTS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapWMTSLayer.html',
				link_view : root + '/examples/layer/njMapWMTSLayer_view.html',
				img : imagesPath + 'layer/njMapWMTSLayer.jpg',
				requires : [ PO.LAYER.WMTS ]
			},
			VECTOR : {
				name : 'VECTOR',
				title : 'njMapVectorLayer - Vector 레이어',
				desc : 'Vector 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapVectorLayer.html',
				link_view : root + '/examples/layer/njMapVectorLayer_view.html',
				img : imagesPath + 'layer/njMapVectorLayer.jpg',
				requires : [ PO.LAYER.VECTOR ]
			},
			CLUSTER : {
				name : 'CLUSTER',
				title : 'njMapClusterLayer - Cluster 레이어',
				desc : 'Cluster 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapClusterLayer.html',
				link_view : root + '/examples/layer/njMapClusterLayer_view.html',
				img : imagesPath + 'layer/njMapClusterLayer.gif',
				requires : [ PO.LAYER.CLUSTER ]
			},
			VECTOR3D : {
				name : 'VECTOR3D',
				title : 'njMapVector3DLayer - Vector3D 레이어',
				desc : 'Vector 3D 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/njMapVector3DLayer.html',
				link_view : root + '/examples/layer/njMapVector3DLayer_view.html',
				img : imagesPath + 'layer/njMapVector3DLayer.gif',
				requires : [ PO.LAYER.VECTOR3D ]
			}
		},

		TOC : {
			WMS : {
				name : 'WMS',
				title : 'njMapWMSToc - WMS TOC',
				desc : 'WMS TOC를 생성한다.',
				link_code : root + '/examples/toc/njMapWMSToc.html',
				link_view : root + '/examples/toc/njMapWMSToc_view.html',
				img : imagesPath + 'toc/njMapWMSToc.jpg',
				requires : [ PO.TOC.WMS ]
			},
			WEBWMS : {
				name : 'WEBWMS',
				title : 'njMapWebWMSToc - Web WMS TOC',
				desc : 'Web WMS TOC를 생성한다.',
				link_code : root + '/examples/toc/njMapWebWMSToc.html',
				link_view : root + '/examples/toc/njMapWebWMSToc_view.html',
				img : imagesPath + 'toc/njMapWebWMSToc.jpg',
				requires : [ PO.TOC.WEBWMS ]
			},
			WFS : {
				name : 'WFS',
				title : 'njMapWFSToc - WFS TOC',
				desc : 'WFS TOC를 생성한다.',
				link_code : root + '/examples/toc/njMapWFSToc.html',
				link_view : root + '/examples/toc/njMapWFSToc_view.html',
				img : imagesPath + 'toc/njMapWFSToc.jpg',
				requires : [ PO.LAYER.WFS, PO.TOC.WFS ]
			},
			WMTS : {
				name : 'WMTS',
				title : 'njMapWMTSToc - WMTS TOC',
				desc : 'WMTS TOC를 생성한다.',
				link_code : root + '/examples/toc/njMapWMTSToc.html',
				link_view : root + '/examples/toc/njMapWMTSToc_view.html',
				img : imagesPath + 'toc/njMapWMTSToc.jpg',
				requires : [ PO.LAYER.WMTS, PO.TOC.WMTS ]
			}
		},

		BASEMAP : {
			BASEMAP : {
				name : 'BASEMAP',
				title : 'njMapBaseMap - 배경지도',
				desc : '배경지도를 생성한다.',
				link_code : root + '/examples/baseMap/njMapBaseMap.html',
				link_view : root + '/examples/baseMap/njMapBaseMap_view.html',
				img : imagesPath + 'baseMap/njMapBaseMap.jpg',
				requires : [ PO.MAP, PO.BASEMAP.BASEMAP ]
			},
			CUSTOM : {
				name : 'CUSTOM',
				title : 'njMapBaseMapCustom - 사용자 정의 배경지도(WMTS)',
				desc : 'WMTS 레이어를 배경지도로 생성한다.',
				link_code : root + '/examples/baseMap/njMapBaseMapCustom.html',
				link_view : root + '/examples/baseMap/njMapBaseMapCustom_view.html',
				img : imagesPath + 'baseMap/njMapBaseMapCustom.jpg',
				requires : [ PO.MAP, PO.SERVICE.CAPABILITIES.WMTS, PO.LAYER.WMTS, PO.BASEMAP.BASEMAP, PO.BASEMAP.CUSTOM ]
			},
			TMS_VWORLD : {
				name : 'TMS_VWORLD',
				title : 'njMapBaseMapTMS_vWorld - TMS_vWorld 배경지도',
				desc : 'vWorld 배경지도를 특정 좌표계로 설정하여 TMS 배경지도로 사용할 수 있다.',
				link_code : root + '/examples/baseMap/njMapBaseMapTMS_vWorld.html',
				link_view : root + '/examples/baseMap/njMapBaseMapTMS_vWorld_view.html',
				img : imagesPath + 'baseMap/njMapBaseMapTMS_vWorld.jpg',
				requires : [ PO.MAP, PO.BASEMAP.BASEMAP, PO.BASEMAP.TMS_VWORLD ]
			}			
		},

		CONTROL : {
			DRAGPAN : {
				name : 'DRAGPAN',
				title : 'njMapDragPan - 드래그 패닝',
				desc : '마우스 드래깅으로 지도 이동을 한다.',
				link_code : root + '/examples/control/njMapDragPan.html',
				link_view : root + '/examples/control/njMapDragPan_view.html',
				img : imagesPath + 'control/njMapDragPan.gif',
				requires : [ PO.MAP, PO.CONTROL.DRAGPAN ]
			},
			ZOOMIN : {
				name : 'DRAGZOOMIN',
				title : 'njMapDragZoomIn - 드래그 줌인',
				desc : '마우스 드래깅으로 해당 영역으로 확대한다.',
				link_code : root + '/examples/control/njMapDragZoomIn.html',
				link_view : root + '/examples/control/njMapDragZoomIn_view.html',
				img : imagesPath + 'control/njMapDragZoomIn.gif',
				requires : [ PO.MAP, PO.CONTROL.ZOOMIN ]
			},
			ZOOMOUT : {
				name : 'DRAGZOOMOUT',
				title : 'njMapDragZoomOut - 드래그 줌아웃',
				desc : '마우스 드래깅으로 해당 영역으로 축소한다.',
				link_code : root + '/examples/control/njMapDragZoomOut.html',
				link_view : root + '/examples/control/njMapDragZoomOut_view.html',
				img : imagesPath + 'control/njMapDragZoomOut.gif',
				requires : [ PO.MAP, PO.CONTROL.ZOOMOUT ]
			},
			DRAWFEATURE : {
				name : 'DRAWFEATURE',
				title : 'njMapDrawFeature - 도형 그리기',
				desc : '다양한 도형을 그린다.',
				link_code : root + '/examples/control/njMapDrawFeature.html',
				link_view : root + '/examples/control/njMapDrawFeature_view.html',
				img : imagesPath + 'control/njMapDrawFeature.gif',
				requires : [ PO.MAP, PO.CONTROL.DRAWFEATURE ]
			},
			LENGTH : {
				name : 'LENGTH',
				title : 'njMapLengthMeasure - 거리 측정',
				desc : '거리를 측정한다.',
				link_code : root + '/examples/control/njMapLengthMeasure.html',
				link_view : root + '/examples/control/njMapLengthMeasure_view.html',
				img : imagesPath + 'control/njMapLengthMeasure.gif',
				requires : [ PO.MAP, PO.CONTROL.LENGTH ]
			},
			AREA : {
				name : 'AREA',
				title : 'njMapAreaMeasure - 면적 측정',
				desc : '면적을 측정한다.',
				link_code : root + '/examples/control/njMapAreaMeasure.html',
				link_view : root + '/examples/control/njMapAreaMeasure_view.html',
				img : imagesPath + 'control/njMapAreaMeasure.gif',
				requires : [ PO.MAP, PO.CONTROL.AREA ]
			},
			MEASURE_CIRCLE : {
				name : 'MEASURE_CIRCLE',
				title : 'njMapCircleMeasure - 원 면적 측정',
				desc : '원의 면적을 측정한다.',
				link_code : root + '/examples/control/njMapCircleMeasure.html',
				link_view : root + '/examples/control/njMapCircleMeasure_view.html',
				img : imagesPath + 'control/njMapCircleMeasure.gif',
				requires : [ PO.MAP, PO.CONTROL.MEASURE_CIRCLE ]
			}
		},

		MANAGER : {
			CONTROL : {
				name : 'CONTROL',
				title : 'njMapControlManager - 등록된 컨트롤을 관리한다.',
				desc : '등록된 컨트롤들을 관리한다.',
				link_code : root + '/examples/manager/njMapControlManager.html',
				link_view : root + '/examples/manager/njMapControlManager_view.html',
				img : imagesPath + 'manager/njMapControlManager.jpg',
				requires : [ PO.MAP, PO.MANAGER.CONTROL ]
			},
			LAYER : {
				name : 'LAYER',
				title : 'njMapLayerManager - 등록된 레이어와 TOC를 관리한다.',
				desc : '등록된 레이어와 TOC를 관리하고, 레이어별 최소,최대 줌레벨을 설정할 수 있다.',
				link_code : root + '/examples/manager/njMapLayerManager.html',
				link_view : root + '/examples/manager/njMapLayerManager_view.html',
				img : imagesPath + 'manager/njMapLayerManager.jpg',
				requires : [ PO.MAP, PO.MANAGER.LAYER ]
			},
		},

		ANIMATION : {
			BOUNCE : {
				name : 'BOUNCE',
				title : 'bounceAnimation - 바운스 애니메이션',
				desc : '상,하로 튕기는 효과 애니메이션.',
				link_code : root + '/examples/animation/bounceAnimation.html',
				link_view : root + '/examples/animation/bounceAnimation_view.html',
				img : imagesPath + 'animation/bounceAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.BOUNCE ]
			},
			DROP : {
				name : 'DROP',
				title : 'dropAnimation - 드롭 애니메이션',
				desc : '위 에서 아래로 또는 아래에서 위로 떨어지는 효과 애니메이션.',
				link_code : root + '/examples/animation/dropAnimation.html',
				link_view : root + '/examples/animation/dropAnimation_view.html',
				img : imagesPath + 'animation/dropAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.DROP ]
			},
			SHOW : {
				name : 'SHOW',
				title : 'showAnimation - 쇼 애니메이션',
				desc : '나타내는 효과 애니메이션',
				link_code : root + '/examples/animation/showAnimation.html',
				link_view : root + '/examples/animation/showAnimation_view.html',
				img : imagesPath + 'animation/showAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.SHOW ]
			},
			TELEPORT : {
				name : 'TELEPORT',
				title : 'teleportAnimation - 텔레포트 애니메이션',
				desc : '순간 이동하는 것처럼 나타내는 효과 애니메이션.',
				link_code : root + '/examples/animation/teleportAnimation.html',
				link_view : root + '/examples/animation/teleportAnimation_view.html',
				img : imagesPath + 'animation/teleportAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.TELEPORT ]
			},
			ZOOMIN : {
				name : 'ZOOMIN',
				title : 'zoomInAnimation - 줌 인 애니메이션',
				desc : '확대 효과 애니메이션.',
				link_code : root + '/examples/animation/zoomInAnimation.html',
				link_view : root + '/examples/animation/zoomInAnimation_view.html',
				img : imagesPath + 'animation/zoomInAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.ZOOMIN ]
			},
			ZOOMOUT : {
				name : 'ZOOMOUT',
				title : 'zoomOutAnimation - 줌 아웃 애니메이션',
				desc : '축소 효과 애니메이션.',
				link_code : root + '/examples/animation/zoomOutAnimation.html',
				link_view : root + '/examples/animation/zoomOutAnimation_view.html',
				img : imagesPath + 'animation/zoomOutAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.ZOOMOUT ]
			},
			LINEDASH : {
				name : 'LINEDASH',
				title : 'lineDashMoveAnimation - 라인 대시 애니메이션',
				desc : '라인 대시 효과 애니메이션.',
				link_code : root + '/examples/animation/lineDashMoveAnimation.html',
				link_view : root + '/examples/animation/lineDashMoveAnimation_view.html',
				img : imagesPath + 'animation/lineDashMoveAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.LINE, PO.ANIMATION.LINEDASH ]
			},
			LINEGRADIENT : {
				name : 'LINEGRADIENT',
				title : 'lineGradientAnimation - 라인 그라데이션 애니메이션',
				desc : '그라데이션 효과 애니메이션.',
				link_code : root + '/examples/animation/lineGradientAnimation.html',
				link_view : root + '/examples/animation/lineGradientAnimation_view.html',
				img : imagesPath + 'animation/lineGradientAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.LINEGRADIENT, PO.ANIMATION.njMapLINEGRADIENT ]
			},
			LINETOARCGRADIEN : {
				name : 'LINETOARCGRADIEN',
				title : 'lineToArcGradienAnimation - 호 형태 라인 그라데이션 애니메이션',
				desc : '일반 라인을 호 형태로 나타내는 그라데이션 효과 애니메이션.',
				link_code : root + '/examples/animation/lineToArcGradienAnimation.html',
				link_view : root + '/examples/animation/lineToArcGradienAnimation_view.html',
				img : imagesPath + 'animation/lineToArcGradienAnimation.gif',
				requires : [ PO.UTIL.UTIL, PO.UTIL.GEOUTIL, PO.ANIMATION.LINEGRADIENT, PO.ANIMATION.njMapLINEGRADIENT ]
			},
			CIRCLE : {
				name : 'CIRCLE',
				title : 'njMapCircleAnimation - 원 애니메이션',
				desc : 'Circle(원) 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/njMapCircleAnimation.html',
				link_view : root + '/examples/animation/njMapCircleAnimation_view.html',
				img : imagesPath + 'animation/njMapCircleAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE ]
			},
			LINE : {
				name : 'LINE',
				title : 'njMapLineAnimation - 라인 애니메이션',
				desc : 'Line(선) 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/njMapLineAnimation.html',
				link_view : root + '/examples/animation/njMapLineAnimation_view.html',
				img : imagesPath + 'animation/njMapLineAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.LINE ]
			},
			POLYGON : {
				name : 'POLYGON',
				title : 'njMapPolygonAnimation - 폴리곤 애니메이션',
				desc : 'Polygon(폴리곤) 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/njMapPolygonAnimation.html',
				link_view : root + '/examples/animation/njMapPolygonAnimation_view.html',
				img : imagesPath + 'animation/njMapPolygonAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.POLYGON ]
			},
			REGULAR : {
				name : 'REGULAR',
				title : 'njMapRegularShapeAnimation - 레귤러 애니메이션',
				desc : 'Regular Shape 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/njMapRegularShapeAnimation.html',
				link_view : root + '/examples/animation/njMapRegularShapeAnimation_view.html',
				img : imagesPath + 'animation/njMapRegularShapeAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.REGULAR ]
			}
		},

		ETC : {
			CAPTURE : {
				name : 'CAPTURE',
				title : 'njMapCapture - 배경지도 및 njMap 캡쳐',
				desc : '배경지도 및 njMap에 등록된 레이어를 캡쳐할 수 있다.',
				link_code : root + '/examples/etc/njMapCapture.html',
				link_view : root + '/examples/etc/njMapCapture_view.html',
				img : imagesPath + 'etc/njMapCapture.jpg',
				requires : [ PO.MAP, PO.CAPTURE ]
			}
		}
	};

	var PE = NJMAP_PROP.EXAMPLE;

	NJMAP_PROP.EXAMPLE_GROUP = [
			{
				name : 'Basic',
				examples : [ PE.BASIC.CONFIG, PE.BASIC.HTTP, PE.BASIC.MAP, PE.BASIC.POPUP, PE.BASIC.WHEELZOOM, PE.BASIC.HISTORY ]
			},
			{
				name : 'Service',
				examples : [ PE.SERVICE.CAPABILITIES.WMS, PE.SERVICE.CAPABILITIES.WFS, PE.SERVICE.CAPABILITIES.WCS, PE.SERVICE.CAPABILITIES.WMTS,
						PE.SERVICE.DESCRIBEFEATURETYPE, PE.SERVICE.GETFEATURE ]
			},
			{
				name : 'Layer',
				examples : [ PE.LAYER.WMS, PE.LAYER.WFS, PE.LAYER.WCS, PE.LAYER.WMTS, PE.LAYER.VECTOR, PE.LAYER.VECTOR3D, PE.LAYER.CLUSTER ]
			},
			{
				name : 'TOC',
				examples : [ PE.TOC.WMS, PE.TOC.WEBWMS, PE.TOC.WFS, PE.TOC.WMTS ]
			},
			{
				name : 'BaseMap',
				examples : [ PE.BASEMAP.BASEMAP, PE.BASEMAP.CUSTOM, PE.BASEMAP.TMS_VWORLD ]
			},
			{
				name : 'Control',
				examples : [ PE.CONTROL.DRAGPAN, PE.CONTROL.ZOOMIN, PE.CONTROL.ZOOMOUT, PE.CONTROL.DRAWFEATURE, PE.CONTROL.LENGTH, PE.CONTROL.AREA, PE.CONTROL.MEASURE_CIRCLE]
			},
			{
				name : 'Manager',
				examples : [ PE.MANAGER.CONTROL, PE.MANAGER.LAYER ]
			},
			{
				name : 'Animation',
				examples : [ PE.ANIMATION.BOUNCE, PE.ANIMATION.DROP, PE.ANIMATION.SHOW, PE.ANIMATION.TELEPORT, PE.ANIMATION.ZOOMIN, PE.ANIMATION.ZOOMOUT,
						PE.ANIMATION.LINEDASH, PE.ANIMATION.LINEGRADIENT, PE.ANIMATION.LINETOARCGRADIEN, PE.ANIMATION.CIRCLE, PE.ANIMATION.LINE,
						PE.ANIMATION.POLYGON, PE.ANIMATION.REGULAR ]
			},
			{
				name : 'Etc',
				examples : [ PE.ETC.CAPTURE ]
			} ];


	window.NJMAP_PROP = NJMAP_PROP;

} )();
