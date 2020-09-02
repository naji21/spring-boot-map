/**
 * 
 */
(function (global) {
	
	var printViewTag = function (printKey, baseMapType) {		
		var type = baseMapType.split('_')[0];
		var disabled = '';
		var title = '';

		if (['daum', 'naver', 'google', 'vWorld'].indexOf(type) > -1) {
			disabled = 'disabled';
		}
		return [
			'<div class="print-webmap-background no-print">',
			'	<div class="print-loading"><i class="fa fa-spinner fa-spin fa-5x fa-fw"></i></div>',
			'</div>',
			'<div class="print-webmap-container">',
			'	<div class="print-image-wrap">',
			'		<div class="print-map-left">',
			'			<div class="print-basemap" id="' + printKey + '-base"></div>',
			'			<div class="print-map" id="' + printKey + '-map"></div>',
			'		</div>',
			'		<div class="print-map-right"></div>',
			'	</div>',
			'	<div class="print-webmap-button no-print">',
			'		<a class="btn btn-primary print-webmap-btn">',
			'			<i class="fa fa-print fa-2x"></i>',
			'		</a>',
			'		<a class="btn btn-warning print-webmap-btn ' + disabled + '" data-action="saveFile">', 
			'			<i class="icon-download fa-2x" aria-hidden="true"></i>',
			'		</a>',
			'		<a class="btn btn-default close-webmap-btn">',
			'			<i class="glyphicon glyphicon-remove fa-2x" aria-hidden="true"></i>',
			'		</a>',
			'	</div>',
			'</div>'
		].join('');
	};
	
	var service_url = {
		wms: '',
		wfs: '',
		wmts: '',
		gss_wmts: '',
		setUrl: function (url) {
			$.each(['wms', 'wfs', 'wmts', 'gss_wmts'], function (idx, type) {
				service_url[type] = url + type;
			});
		}
	};	
	
	var hexToRGB = function(hex, alpha) {		
		
		//console.log("hex : " + hex);
		
		if(!hex) return false;
		
	    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

	    if (alpha) {
	        return "rgba(" + r + ", " + g + ", " + b + ", " + opacityToTransparent(alpha) + ")";
	    } else {
	        return "rgb(" + r + ", " + g + ", " + b + ")";
	    }
	};
	
	var addData = {
		layer: function (njMap, data) {
			var $def = $.Deferred();
			data.filter = data.filter || '';
			
			var wmsLayer = new naji.layer.njMapWMSLayer({				
				useProxy : false,
				singleTile : false,
				serviceURL : service_url.wms,// + '?KEY=' + data.owner,
				//wfsServiceURL : ,
				ogcParams : {
					KEY : data.userid,
			        LAYERS : data.title,
			        CRS : njMap.getCRS(),
			        STYLES : data.sldUserNm + ':' + data.sldTitle,
			        FORMAT : 'image/png',
			        BGCOLOR : '0xffffff', 
			        EXCEPTIONS : 'BLANK',
			        LABEL : 'HIDE_OVERLAP',
			        GRAPHIC_BUFFER : '128',
			        ANTI : 'true',
			        TEXT_ANTI : 'true',
			        VERSION : '1.3.0',
			        cql_filter : data.filter
			    }
			});
			
			njMap.addWMSLayer( {
				layer : wmsLayer,
				useExtent : false,
				extent : null,
				resolution : null
			}).then(function () {
				$def.resolve(wmsLayer);
			});
			
			return $def.promise();
		},
		wms: function (njMap, data) {
			var $def = $.Deferred();
		//	data.dtsource_id = data.dtsourceid;
			
//			var url = service_url.wms + '?KEY=' + data.dtsourceid;		
			var url = service_url.wms;
			
			var wmsR = new naji.service.njMapGetCapabilitiesWMS( {
				useProxy : true,
        		version : "1.3.0",
        		serviceURL : url,
        		dataViewId : njMap.getDataViewId()
			} );

			wmsR.then( function() {
				
				var wmsLayer = new naji.layer.njMapWMSLayer( {
					useProxy : false,
					singleTile : false,
					serviceURL : url,
					//wfsServiceURL : ,
					ogcParams : {
						LAYERS : 'ROOT',
						CRS : njMap.getCRS(),
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
				} );
				
				njMap.addWMSLayer( {
					layer : wmsLayer,
					useExtent : true,
					extent : null,
					resolution : null
				}).then(function () {
					$def.resolve(wmsLayer);
				});
			});
			return $def.promise();
		},
		wfs: function (njMap, data) {
			var $def = $.Deferred();
			
//			var url =  service_url.wfs + '?KEY=' + data.dtsourceid;
			var url =  service_url.wfs;
			
			var wfsR = new naji.service.njMapGetCapabilitiesWFS( {
    			useProxy : true,
    			version : "1.1.0",
    			serviceURL : url,
    			dataViewId : njMap.getDataViewId()
    		} );
			
			wfsR.then( function() {
				var wfsLayer = new naji.layer.njMapWFSLayer( {
					useProxy : false,
					serviceURL : url,
					layerName : data.layername,
					srsName : njMap.getCRS(),
					dataViewId : njMap.getDataViewId()
				} );
							
				njMap.addWFSLayer( {
					layer : wfsLayer,
					useExtent : true
				} ).then(function () {
					$def.resolve(wfsLayer);
				});
				
			});
			return $def.promise();
		},
		wmts: function (njMap, data) {
			var $def = $.Deferred();
//			var url = service_url.wmts + '?KEY=' + data.dtsourceid;
			var url = service_url.wmts;
			
			var wmtsR = new naji.service.njMapGetCapabilitiesWMTS( {
    			useProxy : true,
    		    version : "1.0.0",
    		    serviceURL : url,
    		    dataViewId : njMap.getDataViewId()
    		} );


			wmtsR.then( function() {
				var bbox = [];
				var layer = data.title; //타이틀
				var matrixSet = layer + '_MATRIXSET';

				var layers = wmtsR.data.olJson.Contents.Layer;

				for ( var i in layers) {
					if ( layers[i]['Identifier'] === layer ) {
						bbox = layers[i]['WGS84BoundingBox'];
						break;
					}
				}

				var wmtsLayer = new naji.layer.njMapWMTSLayer( {
					useProxy : false,
					serviceURL : url,
					layer : layer,
					matrixSet : matrixSet,
					projection : njMap.getCRS(),
					version : '1.0.0',
					wmtsCapabilities : wmtsR.data,
					originExtent : bbox
				} );
				
				njMap.addWMTSLayer({
					layer : wmtsLayer,
					useExtent : true,
					extent : null
				}).then(function () {
					$def.resolve(wmtsLayer);
				});
			});
			return $def.promise();
		},
		gss_wmts: function (njMap, data) {
			var $def = $.Deferred();

	//		var url = data.url + "?KEY=" + data.dtsourceid;
			var url = service_url.gss_wmts;
			//debugger
	
			wmsR = new naji.service.njMapGetCapabilitiesWMS( {
			    useProxy : true,
			    version : "1.3.0",
			    serviceURL : url,
			    dataViewId : njMap.getDataViewId()
			} );
	
			//debugger
			wmsR.then( function() {
				var gssWmtsLayer = new naji.layer.njMapGSSWMTSLayer({	
					useProxy : true,
					serviceURL : data.url,
					layer : data.list,
					minZoom: data.minZoom,
					maxZoom: data.maxZoom,
					matrixSet : data.matrixSet,
					projection : njMap.getCRS(),
					matrixIds: njMap.getMatrixIds(),
					resolutions: njMap.getResolutions( data.tileSize ),
					tileSize: [data.tileSize, data.tileSize],
					version : '1.0.0',
					zoomOffset: data.zoomOffset,
					origin: ol.extent.getTopLeft(ol.proj.get(njMap.getCRS()).getExtent()),
					format: 'image/png'
				});
				
				// njMapLayerManager에 관리할 레이어 추가
				njMapManager.add( {
					njMapLayer : gssWmtsLayer,
					njMapToc : ""
				} );
				
				var uuid = gssWmtsLayer.getLayerKey();
				//addGDXItem(data,uuid);
	
				data.layerid = uuid;
				
				setContentsInfo( data );
				
				_mapLayerList.push(data);
	
				// njMap에 WMS 레이어 추가
				wmts = njMap.addGSSWMTSLayer({
					layer : gssWmtsLayer,
					useExtent : false,
					extent : null,
					resolution : null
				});
				
				wmts.then( function() {
					//console.log( r );
					if(data.minzoom){
						gssWmtsLayer.setMinZoom( data.minzoom );
						gssWmtsLayer.setMaxZoom( data.maxzoom );
						njMapManager.scaleVisibleRefresh();
					}
					updateLayerList();
				});
			});
		},
		wms_ogc: function (njMap, data) {
			var $def = $.Deferred();
			
			var ogcLayerData = {};
						
			ogcLayerData.title = data.list.toString() || 'undfined';
			ogcLayerData.url = data.url;
			ogcLayerData.minzoom = data.minzoom || 0;
			ogcLayerData.maxzoom = data.maxzoom || 21;	
			ogcLayerData.type = data.type;			
			ogcLayerData.list = data.list;						
					
			var uWmsLayer = new naji.layer.njMapWMSLayer( {
				useProxy : true,
				singleTile : false,
				serviceURL : ogcLayerData.url,
				ogcParams : {					
					LAYERS:ogcLayerData.list
				}
			} );
					
			var uWMS = njMap.addWMSLayer( {
				uWMSLayer : uWmsLayer,
				useExtent : false,
				extent : null,
				resolution : null
			});
			
			return $def.promise();
		},
		wfs_ogc: function (njMap, data) {
			var $def = $.Deferred();
			
			var ogcLayerData = {};
						
			ogcLayerData.title = data.list.toString() || 'undfined';
			ogcLayerData.url = data.url;
			ogcLayerData.minzoom = data.minzoom || 0;
			ogcLayerData.maxzoom = data.maxzoom || 21;	
			ogcLayerData.type = data.type;			
			ogcLayerData.list = data.list;	
			
			var layer_id;				
			
			var url = naji.util.njMapUtil.appendParams(ogcLayerData.url, {
			    SERVICE : "WFS",
			    REQUEST : "GetFeature",
			    TYPENAME : ogcLayerData.list
			});
					
			var wfsLayer = new naji.layer.njMapWFSLayer( {					
				useProxy : true,
				serviceURL : url,
				layerName : ogcLayerData.list,
				srsName : njMap.getCRS(),
				dataViewId : njMap.getDataViewId(),
				maxFeatures : 3000
			} );
			
			
			njMapManager.add({
				njMapLayer : wfsLayer,
				njMapToc : "" 
			});						
			
			var uWFS = njMap.addWFSLayer( {
				layer : wfsLayer,
				useExtent : true
			} );
				
			return $def.promise();
		},
		wmts_ogc: function (njMap, data) {			
			
			var $def = $.Deferred();
			
			var ogcLayerData = {};
						
			ogcLayerData.title = data.list.toString() || 'undfined';
			ogcLayerData.url = data.url;
			ogcLayerData.minzoom = data.minzoom || 0;
			ogcLayerData.maxzoom = data.maxzoom || 21;	
			ogcLayerData.type = data.type;			
			ogcLayerData.list = data.list;	
								
			var wmtsR = new naji.service.njMapGetCapabilitiesWMTS( {
			    useProxy : true,
			    version : "1.0.0",
			    serviceURL : ogcLayerData.url,
			    dataViewId : njMap.getDataViewId()
			} );

			wmtsR.then( function() {
				var bbox = [];
				var layer = ogcLayerData.title; //타이틀
				var matrixSet = layer + '_MATRIXSET';

				var layers = wmtsR.data.olJson.Contents.Layer;

				for ( var i in layers) {
					if ( layers[ i ][ "Identifier" ] === layer ) {
						bbox = layers[ i ][ "WGS84BoundingBox" ];
						break;
					}
				}

				var wmtsLayer = new naji.layer.njMapWMTSLayer( {
					useProxy : true,
					singleTile : false,
					serviceURL : ogcLayerData.url,
					layer : ogcLayerData.list,
					matrixSet : matrixSet,
					projection : njMap.getCRS(),
					version : '1.0.0',
					wmtsCapabilities : wmtsR.data,
					originExtent : bbox
				} );				
				
				njMap.addWMTSLayer({
					layer : wmtsLayer,
					useExtent : true,
					extent : null
				}).then(function () {
					$def.resolve(wmtsLayer);
				});
			});
			return $def.promise();
		}
	};
	
	var naji = global.naji;
	
	naji.webMapPrint = function (option) {
		var printViewId = 'najiMapPrintWrap';
		var $printView;
		var printViewKey;
		
		var mapKey;
		var baseMapKey;
		
		var baseMapType;
		var baseMapObj;
		
		var njMapManager;
		
		var requestData;
		
		var makePrintView = function (printViewId, printViewKey, _type) {
			var $div = $('<div></div>')
				.attr('id', printViewId)
				.data('key', printViewKey)
				.append(printViewTag(printViewKey, _type))
				.appendTo('body');
			
			$div.find('.print-webmap-button').on('click', 'a', function (e) {
				e.preventDefault();
				if($(this).hasClass('btn-primary')) {
					var browserName = $.ua.browser.name.toLowerCase();
										
					if (['ie', 'edge'].indexOf(browserName) < 0) {
						window.print();
						$printView.remove();
					} else {
						// ie인 경우 이미지로 변경 후 프린트. div로 출력 시 페이지가 넘어가는 현상발생.
						// 프린트 시 세로로 출력되므로 이미지를 회전 후 출력함.
						$('#' + printViewId)
							.addClass('no-print')
							.find('.print-webmap-background')
							.css('z-index', '11');
						
						var type = baseMapType.split('_')[0];
						if (['daum', 'naver', 'google', 'vWorld'].indexOf(type) > -1) {
							var $baseMap = $('#' + baseMapKey).css('background', 'none');
							var imgs = $baseMap.find('img');
							_.map(imgs, function (img) {
								var $img = $(img);
								var src = $img.attr('src');
								if (src.indexOf('StaticMapService') > -1) {
									$img.remove();
								}
							});
						}
						mapToImage.toImagePrint(true);
					} 
				} else if ($(this).hasClass('btn-warning') && !$(this).hasClass('disabled')) {
					var action = $(this).data('action');
					mapToImage[action]($('#' + printViewId + ' .print-image-wrap').get(0))
						.done(function () {
							$printView.remove();
						})
						.fail(function () {});
				} else {
					$printView.remove();
				}
			});
			
			return $div;
		};
		
		var getTargetWrap = function () {
			var $targetWrap = $('#' + printViewId + ' .print-temp-image-wrap').show();
			
			return $targetWrap;
		};
		
		var baseLayerToImage
		
		var mapToImage = {			
			getRotateImage: function (canvas) {
				var $def = $.Deferred();
				var width = canvas.height;
				var height = canvas.width;
				var image = new Image();
				image.onload = function () {
					$(canvas).remove();
					var tempCanvas = document.createElement('canvas');
					tempCanvas.width = width;
					tempCanvas.height = height;
					
					var ctx = tempCanvas.getContext('2d'); 
			        ctx.translate(width / 2, height / 2);
			        ctx.rotate(90*Math.PI/180);
			        ctx.drawImage(image, -image.width/2, -image.height/2);
			        $def.resolve(tempCanvas.toDataURL());
				};
				image.src = canvas.toDataURL();
				return $def.promise();
			},
			toImagePrint: function (rotate) {
				html2canvas($('.print-image-wrap').get(0), {
						proxy: location.href.split('#')[0] + 'proxy',
						logging: true
					}).then(function(canvas) {
						if (rotate) {
							mapToImage.getRotateImage(canvas)
								.then(function (image) {
									printJS(image, 'image');
							        $printView.remove();
								});
						} else {
							printJS(canvas.toDataURL(), 'image');
							$(canvas).remove();
							$printView.remove();
						}
					});
			},
			canvas: function () {
				mapToImage.saveFile($('#' + printViewId + ' .print-image-wrap').get(0))
					.done(function () {
						$printView.remove();
					})
					.fail(function () {});
			},
			
			saveFile: function (target) {
				var $def = $.Deferred();
				var browserName = $.ua.browser.name.toLowerCase();
				
				if (['ie', 'edge'].indexOf(browserName) < 0) {
					domtoimage.toBlob(target)
						.then(function (blob) {
							saveAs(blob, $('.title_label span').text() + '.png');
							$def.resolve();
					    })
					    .catch(function (error) {
					        console.error('oops, something went wrong!', error);
					        $def.reject();
					    });
				} else {
					html2canvas($('.print-image-wrap').get(0))
						.then(function(canvas) {							
							var dataurl = canvas.toDataURL();
							var arr = dataurl.split(',');
							var mime = arr[0].match(/:(.*?);/)[1];
							var bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
							while(n--){
						        u8arr[n] = bstr.charCodeAt(n);
						    }
							saveAs(new Blob([u8arr], {type:mime}), $('.title_label span').text() + '.png');
							$def.resolve();
						});
				}				
				return $def.promise();
			},
			legendDraw: function () {
				var control8 = $('#' + option.map).find('.control-legend');
				
				if (control8.length > 0) {
					var clone = control8.clone();
					clone
						.removeClass('ol-control')
						.css({
							'max-height': 'none',
							'height': '100%',
							'border-radius': '0px',
							'border': 'none'
						});
					$('#' + printViewId + ' .print-map-right').show().append(clone);
				}
			},
			mapOverlayDraw: function (olMap, marker) {
				var mapOverlay = new naji.MapOverlay.init({  
					map: olMap,
					viewMode :true						
				});	
				
				mapOverlay.importItems(marker);
				
				$('#' + printViewId + ' .naji-mapOverlay-text-background').each(function () {
					var color = $(this).css('background-color');
					this.style.setProperty('background-color', color, 'important');
				});
				
				$('#' + printViewId + ' .naji-mapOverlay-text font').each(function () {
					var color = $(this).attr('color');
					this.style.setProperty('color', color, 'important');
				});
			}
		};
		
		var addAllData = function (_njMap, list) {
			if (list.length > 0) {
				var data = list.shift();
				if(data.geotype){
					data.type = 'layer';
				}
				addData[data.type.toLowerCase()](_njMap, data)
					.then(function (layer) {
						njMapManager.add({
							njMapLayer : layer,
							njMapToc : "" 
						});
						
						layer.setMinZoom( data.minzoom );
						layer.setMaxZoom( data.maxzoom );
						njMapManager.scaleVisibleRefresh();
						
						addAllData(_njMap, list);
					});
			}
		};
		
		var createUserBaseMap = function(data, _njMap, baseM, group, select){
			var key =  data.key;
			var url = data.url + '?KEY=' + data.dtsourceid;
			var layer = data.title; //타이틀
			
			var wmtsR = new naji.service.njMapGetCapabilitiesWMTS( {
    			useProxy : true,
    		    version : "1.0.0",
    		    serviceURL : url,
    		    dataViewId : njMap.getDataViewId()
    		} );

			wmtsR.then( function() {
				var bbox = [];
				
				var matrixSet = layer + '_MATRIXSET';

				var layers = wmtsR.data.olJson.Contents.Layer;

				for ( var i in layers) {
					if ( layers[i]['Identifier'] === layer ) {
						bbox = layers[i]['WGS84BoundingBox'];
						break;
					}
				}

				var wmtsLayer = new naji.layer.njMapWMTSLayer( {
					useProxy : false,
					serviceURL : url,
					layer : layer,
					matrixSet : matrixSet,
					projection : _njMap.getCRS(),
					version : '1.0.0',
					wmtsCapabilities : null,
					originExtent : []
				} );
				
				baseM.addBaseMapType( key, new naji.baseMap.njMapBaseMapCustom( {
					baseMapKey : key,
					layer : wmtsLayer,
					capabilities : wmtsR.data
				} ) );		
				
				baseM.changeBaseMap(select.type);	
			});
		};
		
		var createBaseMap = function (_njMap, contents) {
			var group = contents.baseMap.basic.group;
				
			if (group === 'user' || group === 'system') {
				var baseM = new naji.baseMap.njMapBaseMap( {
					target : baseMapKey,
					njMap : _njMap,
					baseMapKey : 'osm_none' 
				} );
				
				contents.baseMap[group + 'Map'].forEach(function(item,i){
					var v = item.o_data;
					if(v.key == contents.baseMap.basic.type){
						createUserBaseMap({
							name: v.name,
							dtsource_id : v.dtsource_id,
							title : v.title,
							url : v.url,
							key : v.key,
						}, _njMap, baseM, contents.baseMap.basic.group, contents.baseMap.basic);
					}
				});	
				
			} else {
				return new naji.baseMap.njMapBaseMap( {
					target: baseMapKey,
					njMap: _njMap,
					baseMapKey: contents.baseMap.basic.type || 'osm_none'
				});
			}
		};
		
		var init = function (_type) {
			$('#' + printViewId).remove();
			
			printViewKey = naji.util.njMapUtil.generateUUID();
			$printView = makePrintView(printViewId, printViewKey, _type);  
			
			service_url.setUrl(option.serviceUrl);
			mapKey = printViewKey + '-map';
			baseMapKey = printViewKey + '-base';
			
			$printView.show();
		};
		
		var draw = function (data, info) {
			mapToImage.legendDraw();
			
			naji.njMapConfig.init( {
				proxy : option.proxy,
				loadingImg : null,
				useLoding : true,
	        	alert_Error : function(msg_) {
					return naji.notification.error({
						title: 'ERROR',
						content: msg_,
						timeout: 10000
					});
				}
			});
			
			var printMap = new naji.njMap( {
				target : mapKey,
				crs : 'EPSG:3857',
				center : [ 0, 0 ],
				useMaxExtent : true,
				useAltKeyOnly : false
			});
			
			var baseM = createBaseMap(printMap, data.contentData);
					
			njMapManager = new naji.manager.njMapLayerManager( {
				njMap : printMap,
				/*njMapBaseMap : baseM,*/
				useMinMaxZoom : true
			});	
			
			$('#' + mapKey + ' .ol-overlaycontainer-stopevent').hide();

			printMap.setExtent(info.extent);
			printMap.getMap().getView().setZoom(info.zoom);
		
			addAllData(printMap, data.mapData.slice(0));
			
			
			mapToImage.mapOverlayDraw(printMap.getMap(), data.contentData.marker);
		};
		
		var open = function (data, info) {
			init(data.contentData.baseMap.basic.type || 'osm_none');
		//	printInfo = info;
			draw(data, info);
		};
		
		return {
			open: open
		};
	};
	
})(window);