
var styleModule = function() {
	
	var _defaultStyle; //데이터 없을때 기본	
	var _style_type; //점, 선, 면	
	var _style;	 //기본 스타일 데이터
	var _target;
	var _static_column; //고정 데이터 컬럼
	
	var _ol3_style; //ol3 스타일 데이터
	var _ol3_text; //ol3 스타일 텍스트
	var _ol3_image; //ol3 스타일 이미지		
	
	var _renderer; //단일 , 고유값, 클러스터
	var _label_use; //라벨 사용 
	
	var styleMap ; //오픈레이어스 맵 
	var layerSource; //레이어 소스
	var vectorLayer; // 백터 레이어
	var clusterVectorLayer; // 백터 레이어
	var maxFeatureCount; // 총 피처 갯수
	var clusterSource; //
	
	//test
	var vectorTestSource;

	var _sample_layer; //샘플 레이어 정보
	var identyLevelArr; // 고유값 기준 리스트
	
	var index = 0;
	var loopIndex = 0;
	
	var ch_resolution;
	var ch_map_extent;
	
	var lb_gm_list =  [];
	
	var styleCache = {};
	
	var najiStyle = {
		        
		init: function(attr) {
			
			_style_type = attr["style_type"] || 'point';
			_renderer = attr["renderer"] || 'single';
			_style = attr["style_data"];
			_target = attr["target"];
			_sample_layer = attr["sample_layer"];
			_static_column = attr["static_column"];
			
			if(_style){
				map_init();
			}
			
		},
		getStyle : function() {
	        return _style;
	    },
	    setStyle : function(style) {
	    	_style  =  style;	    	
	    	styleToOl3Style();	    	
	    },	   
	    refresh : function() {
	    	lb_gm_list = [];	
	    		    	
	    	if (_style.renderer =='cluster' ) {		    		
	    		 clusterVectorLayer.getSource().setDistance(Number(_style.distance));
	    		 console.log(_style.symbol.fill_color);
	    		 
	    		 styleCache = {};
	    		 clusterVectorLayer.setStyle(
	    				 function(feature) {				
	    						
	    						if(feature.get('features')){
	    							var size = feature.get('features').length;
	    				            var style = styleCache[size];
	    				            if (!style) {
	    				              style = new ol.style.Style({
	    				                image: new ol.style.Circle({
	    				                  radius: 15,
	    				                  stroke: new ol.style.Stroke({
	    				                    color: '#fff'
	    				                  }),
	    				                  fill: new ol.style.Fill({
	    				                	  color: _style.symbol.fill_color
	    				                  })
	    				                }),
	    				                text: new ol.style.Text({
	    				                  text: size.toString(),
	    				                  fill: new ol.style.Fill({
	    				                    color: '#fff'
	    				                  })
	    				                })
	    				              });
	    				              styleCache[size] = style;
	    				            }
	    				            return style;
	    						}
	    						
	    				       return null;     
	    				     }
	    		 );
	    		 
	    		 
	    		 
	    		 vectorLayer.setVisible(false);
	    		 clusterVectorLayer.setVisible(true);
	    		 vectorLayer.setStyle(getOl3Style);
	    	}else{
	    		 vectorLayer.setVisible(true);
	    		 clusterVectorLayer.setVisible(false);
	    		 vectorLayer.setStyle(getOl3Style);
	    	}
	    	
	    },
	    getMap : function() {
	    	return styleMap;
	    },
	    setVisible : function(value) {
	    	vectorLayer.setVisible(value);
	    },	    
	    getOl3Style : function() {
	    	return getOl3Style;
	    },
	    getPointTypeStyle : function(v){
	    	return  getPointTypeStyle(v);
	    },
	    setLoopIndex : function(value) {	    	
	    	loopIndex = value;
	    	styleToOl3Style();
	    }
	};
	
	var map_init =  function() {	
		
		var button = document.createElement('button');
    	button.title = 'Zoom Lv' || ''; 
		button.innerHTML = '5';
		var element = document.createElement('div');
		element.className = 'zoomLv' + ' ol-unselectable ol-control';
		element.appendChild(button);
		
		styleMap = new ol.Map({
	        layers: [],
	        target: _target,
	        controls: ol.control.defaults().extend([
                    new ol.control.ScaleLine(),
                    new ol.control.Control({
            		    	element: element
            			})
                  ]),
	        view: new ol.View({
	          center: [14500000, 4500000],
	          zoom: 5
	        })
	      });
		
		styleMap.on("moveend", function() {
	            var zoom = styleMap.getView().getZoom(); 
	            $(".zoomLv > button").html(zoom);
	        });	
		
		var b_layer = new ol.layer.Tile({
		    source:  new ol.source.XYZ( {
				url : 'http://{a-c}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png'
			} )		 
		}) 
		
		//베이스 지도 셋팅
		styleMap.addLayer(b_layer);
		
		
		//타입별 기본 지도 셋팅
		layerSource = new ol.source.Vector({
	  	        url: _sample_layer,
		        format: new ol.format.GeoJSON()
		      });	
		 
		clusterSource = new ol.source.Cluster({
			distance: _style.distance || 80,
			source: new ol.source.Vector({
	  	        url: './resources/map/data/world_airports.geojson', 
		        format: new ol.format.GeoJSON( { 
	        		defaultDataProjection : "EPSG:4326",
						featureProjection : "EPSG:3857",
						useFade : false
				} )
		      })
		});
			
		vectorLayer = new ol.layer.Vector({
			source: layerSource,
	      }); 			
		
		clusterVectorLayer = new ol.layer.Vector({
			source: clusterSource,
			style: function(feature) {				
				if(feature.get('features')){
					var size = feature.get('features').length;
		            var style = styleCache[size];
		            if (!style) {
		              style = new ol.style.Style({
		                image: new ol.style.Circle({
		                  radius: 15,
		                  stroke: new ol.style.Stroke({
		                    color: '#fff'
		                  }),
		                  fill: new ol.style.Fill({
		                	  color: _style.symbol.fill_color || [255, 153, 0]
		                  })
		                }),
		                text: new ol.style.Text({
		                  text: size.toString(),
		                  fill: new ol.style.Fill({
		                    color: '#fff'
		                  })
		                })
		              });
		              styleCache[size] = style;
		            }
		            return style;
				}
				
		       return null;     
		     }
	      }); 
		
		styleMap.addLayer(vectorLayer);
		styleMap.addLayer(clusterVectorLayer);
		
		//Ol3 스타일 생성
		styleToOl3Style();		
		vectorLayer.setStyle(getOl3Style);
		
		
		
		
		if (_style.renderer =='cluster' ) {		    		
   		 	vectorLayer.setVisible(false);
   		 	clusterVectorLayer.setVisible(true);
	   		vectorLayer.setStyle(getOl3Style);
	   	}else{
	   		vectorLayer.setVisible(true);
	   		clusterVectorLayer.setVisible(false);
	   		vectorLayer.setStyle(getOl3Style);
	   	}		
		
		$( window ).resize(function() {
			styleMap.updateSize();
		});
		
	}
	
	var styleToOl3Style = function() {
		
		_ol3_style = {};
		_ol3_text = undefined;
		_ol3_image = undefined;
				
    	if(_style_type == 'point'){
    		setOl3PointStyle();    	
    	}else if(_style_type == 'polygon'){
    		getOl3PolygonStyle();
    	}else if(_style_type == 'linestring'){
    		getOl3LineStyle();
    	}else {
    		//console.log("styleToOl3Style:" + false);
    		return false;
    	}	    	
	};
	
	var setLabel = function(txt) {	
		_ol3_text.setText(txt || '');
	}
	
	
	var setOl3PointStyle = function() {		
		
		//기본 셋팅
		_ol3_style.renderer = _style.renderer;
		_ol3_style.symbol_type = _style.symbol.symbol_type;
		_ol3_style.symbol_inline_content = _style.symbol.inline_content;
		_ol3_style.symbol_radius = _style.symbol.symbol_size;	
		_ol3_style.symbol_fill_color = _style.symbol.fill_color;	
		_ol3_style.symbol_stroke_color = _style.symbol.stroke_color;
		_ol3_style.symbol_stroke_width = _style.symbol.stroke_width;
		
		if(_style.renderer == 'cluster'){
			//clusterSource.setDistance(_style.distance);
		}
		
		
		if(_style.renderer == 'identity'){				
			_ol3_style.symbol_identity_color  = _style.symbol.identity_color;
			_ol3_style.symbol_identity_column = _style.symbol.identity_column;
		}			
		
		//ol3 스타일로 변환
		_ol3_style.symbol_opacity = opacityToTransparent(_style.symbol.opacity);
		_ol3_style.symbol_stroke_opacity = opacityToTransparent(_style.symbol.stroke_opacity);
		_ol3_style.symbol_stroke_dasharray = _style.symbol.stroke_dasharray;
		//_ol3_style = 
		_ol3_style = getPointTypeStyle(_ol3_style);			
		
		if(_ol3_style.symbol_stroke_width>0){
			_ol3_style.symbol_stroke = new ol.style.Stroke({
				color: hexToRGB(_ol3_style.symbol_stroke_color,_ol3_style.symbol_stroke_opacity),
				width:_ol3_style.symbol_stroke_width
				, lineDash : [_ol3_style.symbol_stroke_dasharray,_ol3_style.symbol_stroke_dasharray]	
		   });	
		}else{
			_ol3_style.symbol_stroke = undefined;
		}
		
		

		_ol3_style.symbol_fill = new ol.style.Fill({
			color: hexToRGB(_ol3_style.symbol_fill_color,_ol3_style.symbol_opacity)
		});
		
		if(_ol3_style.symbol_type == 'image'){
			_ol3_image =  new ol.style.Icon({
		           			anchor: [0.5, 0.5],
		           			opacity: 1, 
		           			src: _ol3_style.symbol_inline_content,
				       	});
		}else{
			_ol3_image = new ol.style.RegularShape({
	            fill: _ol3_style.symbol_fill,
	            stroke: _ol3_style.symbol_stroke,
	            points: _ol3_style.symbol_points,
	            radius: _ol3_style.symbol_radius/2,
	            radius2: _ol3_style.symbol_radius2,
	            angle: _ol3_style.symbol_angle,
	          });	
		}
		
		if(_style.label_use){
			
			_ol3_style.label_fill_color = _style.label.fill_color;
			_ol3_style.label_stroke_color = _style.label.stroke_color;
			_ol3_style.label_stroke_width = _style.label.stroke_width;
			_ol3_style.label_font = _style.label.font;
			_ol3_style.label_font_weight = _style.label.font_weight;
			_ol3_style.label_font_size = _style.label.font_size;
			_ol3_style.label_offsetY = _style.label.offsetY;
			_ol3_style.label_offsetX = _style.label.offsetX;
			_ol3_style.label_text = _style.label.text;
			_ol3_style.label_opacity = _style.label.opacity;	
			_ol3_style.label_overlap = _style.label.hide_overlap;
			
			_ol3_style.label_opacity = opacityToTransparent(_ol3_style.label_opacity);
			_ol3_style.lb_font = _ol3_style.label_font_weight + ' ' + _ol3_style.label_font_size+'pt'+' '+_ol3_style.label_font;
			
			if(_ol3_style.label_stroke_width>0){
				_ol3_style.label_stroke = new ol.style.Stroke({color: hexToRGB(_ol3_style.label_stroke_color,_ol3_style.label_opacity), width: _ol3_style.label_stroke_width});				
			}else{
				_ol3_style.label_stroke = undefined;				
			}			
			
			_ol3_style.label_fill_color = new ol.style.Fill({  color: hexToRGB(_ol3_style.label_fill_color,_ol3_style.label_opacity) });
			
			_ol3_text = new ol.style.Text({
		          text: _ol3_style.label_text,
		          offsetY: _ol3_style.label_offsetY *-1,
		          offsetX: _ol3_style.label_offsetX,
		          font: _ol3_style.lb_font,
		          fill: _ol3_style.label_fill_color,
		          stroke: _ol3_style.label_stroke,				          			         
		        });
		}		
		
		_ol3_style.style = new ol.style.Style({
			          image: _ol3_image
					  ,text: _ol3_text
			       });
		
		
		
		
		
	};
	
	/*var setOl3PointClusterStyle = function() {	
		
	};
	
	var setOl3PointIdentityStyle = function() {
		
	};*/
	
	
	
	
	
	var getOl3Style = function(feature, resolution) { 
		
		 if (_style.renderer =='cluster' ) {		      	
		     //calculateClusterInfo(resolution);
			 //setPointCluster(feature.get('features').length,maxFeatureCount);
			 return _ol3_style.style;
		 }
		 
		 if (_style.renderer =='identity' ) {				
				
			
			identyLevelArr = new Array();
			
			
			/*if(_static_column){
				
				 if(_style_type=='point'){
					 calculateIdentyLevel(resolution,'type');	
					_value = feature.get('type');
				 }else{
					 calculateIdentyLevel(resolution,'name');	
					_value = feature.get('name');
				 }
				 
				
			}else{
				calculateIdentyLevel(resolution,_style.symbol.identity_column);	
				_value = feature.get(_style.symbol.identity_column);
			}*/
			
			if(_style_type=='point'){
				 calculateIdentyLevel(resolution,'type');	
				_value = feature.get('type');
			 }else{
				 calculateIdentyLevel(resolution,'name');	
				_value = feature.get('name');
			 }
			
			
			setIdentity($.inArray(_value,identyLevelArr));			
		 }
		 
		 if(_style.label_use){	
			 
			 if(ch_resolution != resolution){
				 lb_gm_list = [];	
				 ch_resolution = resolution;
				 //vectorTestSource.clear();
			 }
			 
			 if(ch_map_extent != styleMap.getView().getCenter()){
				 lb_gm_list = [];
				 ch_map_extent = styleMap.getView().getCenter();
				 //vectorTestSource.clear();
			 }			 
			 
			 var lb_text;
			 
			 if(_style_type=='point'){
				 lb_text = feature.get('type');
			 }else{
				 lb_text = feature.get('name');
			 }	
			 
			 setLabel(lb_text);
			 
			 //console.log(_style.label_overlap);
			 
			 if(_style.label.hide_overlap){
				 
				 			 
					// 라벨 길이 구하기	
					var c = $('#' + styleMap.getTarget()).find(".ol-unselectable")[0];
					var context = c.getContext( "2d" );
					context = c.getContext( "2d" );			
					context.font =  _style.label.font_weight + " " + _style.label.font_size + "px " +_style.label.font;
					  
					var d = {};
				  
					//console.log(context.measureText(lb_text).width);
					
					d.lb_w = context.measureText(lb_text).width;
					d.lb_h = context.measureText("M").width;
					d.lb = lb_text;
				  
				  	//라벨 지오메트리 구하기			  	
					var geometry = feature.getGeometry();
					var coordinate = ol.extent.getCenter(geometry.getExtent());;
					var pixel = styleMap.getPixelFromCoordinate(coordinate);						
					
					var minx = pixel[0]-d.lb_w/2;
					var miny = pixel[1]-d.lb_h/2;
					var maxx = pixel[0]+d.lb_w/2;
					var maxy = pixel[1]+d.lb_h/2;
					
					var t1 = styleMap.getCoordinateFromPixel([minx,miny]);
					var t2 = styleMap.getCoordinateFromPixel([maxx,miny]);
					var t3 = styleMap.getCoordinateFromPixel([maxx,maxy]);
					var t4 = styleMap.getCoordinateFromPixel([minx,maxy]);				
					
					
	               var featurething = new ol.Feature({
	                   geometry: new ol.geom.Polygon( [[t1,t2,t3,t4 ]])
	               });
	               
	               var ch_find = false;
	               
	               if(lb_gm_list.length == 0 ){
	            	  
	               }else{
	            	   lb_gm_list.forEach( function(v , i){
	            		   //if(v.name == lb_text){ 
	            			   
	            			  if( ol.extent.intersects(v.gm.getExtent(), featurething.getGeometry().getExtent())){
	            				  ch_find = true;
	            			  }
	            			 
	            		   //}
	            	   });
	               }
	               
	               if(ch_find){
	            	   
	            	   //console.log("find!!!!!!!");
	            	   
	            	   setLabel(''); 
	               }else{
	            	   setLabel(lb_text); 
	            	   lb_gm_list.push({
	             		  //'name': lb_text,
	             		  'gm' : featurething.getGeometry()
	             	   });
	               }
	               
	               //test
	               //vectorTestSource.addFeature( featurething ); 
				 
				 
			 }
				 				
				
		}
		 
		
		 return _ol3_style.style;
	}
	
	//고유값 계산
	var  calculateIdentyLevel = function(resolution,column) { 
		
		  var features = vectorLayer.getSource().getFeatures();
		 
		  for (var i = features.length - 1; i >= 0; --i) {
			    feature = features[i];	
			    
			    var columnData  = feature.get(column);
			    
			    if($.inArray(columnData,identyLevelArr) === -1){
			    	identyLevelArr.push(columnData);
			    }
			  }	
		  
		  //debugger
		  
		}
	
	//클러스터 계산
	var calculateClusterInfo = function(resolution) {
		  maxFeatureCount = 0;		 
		  var features = vectorLayer.getSource().getFeatures();
		  var feature, radius;
		  for (var i = features.length - 1; i >= 0; --i) {
		    feature = features[i];
		    var originalFeatures = feature.get('features');
		    var extent = ol.extent.createEmpty();
		    var j, jj;
		    for (j = 0, jj = originalFeatures.length; j < jj; ++j) {
		      ol.extent.extend(extent, originalFeatures[j].getGeometry().getExtent());
		    }
		    maxFeatureCount = Math.max(maxFeatureCount, jj);			   
		    radius = 0.25 * (ol.extent.getWidth(extent) + ol.extent.getHeight(extent)) /
		        resolution;
		  }		  
	}
	
	//클러스터 계산
	var setPointCluster = function(size,maxFeatureCount) {		
		_rate = size/maxFeatureCount;		
		_extra_radius = parseInt(_rate*10)/3;
		
		if(_style.label_use){
			 
			_ol3_image = new ol.style.Circle({
	              radius: _ol3_style.symbol_radius*(1+_extra_radius),
	              fill: new ol.style.Fill({
	                color: hexToRGB(_style.symbol.fill_color,Math.min(0.8, 0.4 + (_rate)))
	              }),	              
	            });
			
			_ol3_text = new ol.style.Text({
			              text: size.toString(),
			              font: _ol3_style.lb_font,
			              fill: new ol.style.Fill({  color: hexToRGB(_style.label.fill_color) })
			            });
			
			
		}else{
			_ol3_image = new ol.style.Circle({
	              radius: _ol3_style.symbol_radius*(1+_extra_radius),
	              fill: new ol.style.Fill({
	                color: hexToRGB(_style.symbol.fill_color,Math.min(0.8, 0.4 + (_rate)))
	              }),	              
	            });
			
			_ol3_text = undefined;
		}
		
		
		_ol3_style.style = new ol.style.Style({
						  image: _ol3_image
						  ,text: _ol3_text
			          });	
		
	};
	
	var setIdentity = function(index) {
		
		//debugger;
						
		if(index == -1){
			_color_index = 0;
		}else{
			_color_index = index%_ol3_style.symbol_identity_color.length;
		}

		_color = hexToRGB(_ol3_style.symbol_identity_color[_color_index],_ol3_style.symbol_opacity);
		_stroke_color = hexToRGB(_ol3_style.symbol_identity_color[_color_index],_ol3_style.symbol_stroke_opacity);
		
		_ol3_style.symbol_fill = new ol.style.Fill({			
			color: _color
		});
		
		if(_style_type == 'point'){
			
			_ol3_style.symbol_fill = new ol.style.Fill({			
				color: _color
			});
			
			if(_style.symbol.symbol_type =='cross' || _style.symbol.symbol_type =='x'){
				_ol3_style.symbol_stroke = new ol.style.Stroke({
					color: _stroke_color,
					width:_ol3_style.symbol_stroke_width
					,lineDash : [_style.symbol.stroke_dasharray,_style.symbol.stroke_dasharray]
			   });
			}		
			
			_ol3_image = new ol.style.RegularShape({
	            fill: _ol3_style.symbol_fill,
	            stroke: _ol3_style.symbol_stroke,
	            points: _ol3_style.symbol_points,
	            radius: _ol3_style.symbol_radius/2,
	            radius2: _ol3_style.symbol_radius2,
	            angle: _ol3_style.symbol_angle,
	          });
			
			_ol3_style.style = new ol.style.Style({
				  image: _ol3_image,
				  text: _ol3_text
	        });
		}else if(_style_type == 'polygon'){
			
			if(_ol3_style.style_fill_type == 0){
				_ol3_style.symbol_fill = new ol.style.Fill({
					color: _color
				});
			}else{
				_ol3_style.symbol_fill = new ol.style.Fill({				
					color: makePattern(_ol3_style.style_fill_type,hexToRGB(_ol3_style.style_hatch_color),_color)
				});
			}
			
			_ol3_style.style = new ol.style.Style({
				fill: _ol3_style.symbol_fill,
	            stroke: _ol3_style.symbol_stroke,
	            text: _ol3_text
	        });
		}else if(_style_type == 'linestring'){
			
			_ol3_style.symbol_stroke = new ol.style.Stroke({
				color: _stroke_color,
				width: _ol3_style.symbol_stroke_width
				,lineDash : [_style.symbol.stroke_dasharray,_style.symbol.stroke_dasharray]
		   });
			
			_ol3_style.style = new ol.style.Style({				
	            stroke: _ol3_style.symbol_stroke,
	            text: _ol3_text
	        });
		}			
		
	};
	
	
	var getOl3PolygonStyle = function(style) {
		//기본 셋팅
		_ol3_style.renderer = _style.renderer;
		_ol3_style.symbol_type = _style.symbol.symbol_type;
		/*_ol3_style.symbol_radius = _style.symbol_radius;*/				
		//_ol3_style.symbol_opacity = _style.symbol_opacity;
		_ol3_style.symbol_fill_color = _style.symbol.fill_color;	
		_ol3_style.symbol_stroke_color = _style.symbol.stroke_color;
		_ol3_style.style_hatch_color = _style.symbol.hatch_color;
		
		_ol3_style.style_fill_type = _style.symbol.hatch_type;
		_ol3_style.symbol_stroke_width = _style.symbol.stroke_width;
		
		
		if(_style.renderer == 'identity'){				
			_ol3_style.symbol_identity_color  = _style.symbol.identity_color;
			_ol3_style.symbol_identity_column = _style.symbol.identity_column;
		}			
		
		//ol3 스타일로 변환
		_ol3_style.symbol_opacity = opacityToTransparent(_style.symbol.opacity);
		_ol3_style.symbol_stroke_opacity = opacityToTransparent(_style.symbol.stroke_opacity);
		_ol3_style.symbol_hatch_opacity = opacityToTransparent(_style.symbol.hatch_opacity);
		/*_ol3_style = getPointTypeStyle(_ol3_style);	*/	
		_ol3_style.symbol_stroke_dasharray = _style.symbol.stroke_dasharray
		
		if(_ol3_style.symbol_stroke_width>0){
			_ol3_style.symbol_stroke = new ol.style.Stroke({
				color: hexToRGB(_ol3_style.symbol_stroke_color,_ol3_style.symbol_stroke_opacity),
				width: _ol3_style.symbol_stroke_width,
				lineDash :[_ol3_style.symbol_stroke_dasharray,_ol3_style.symbol_stroke_dasharray]
		   });		
		}else{
			_ol3_style.symbol_stroke = undefined;
		}
		
		/*if(_style_type != 'polygon' ||  _ol3_style.style_fill_type == 0){*/
		if(_ol3_style.style_fill_type == 0){
			_ol3_style.symbol_fill = new ol.style.Fill({
				color: hexToRGB(_ol3_style.symbol_fill_color,_ol3_style.symbol_opacity)
			});
		}else{
			_ol3_style.symbol_fill = new ol.style.Fill({				
				color: makePattern(_ol3_style.style_fill_type,hexToRGB(_ol3_style.style_hatch_color,_ol3_style.symbol_hatch_opacity),hexToRGB(_ol3_style.symbol_fill_color,_ol3_style.symbol_opacity))
			});
		}
		
		if(_style.label_use){
			
			_ol3_style.label_fill_color = _style.label.fill_color;
			_ol3_style.label_stroke_color = _style.label.stroke_color;
			_ol3_style.label_stroke_width = _style.label.stroke_width;
			_ol3_style.label_font = _style.label.font;
			_ol3_style.label_font_weight = _style.label.font_weight;
			_ol3_style.label_font_size = _style.label.font_size;
			_ol3_style.label_offsetY = _style.label.offsetY;
			_ol3_style.label_offsetX = _style.label.offsetX;
			_ol3_style.label_text = _style.label.text;
			_ol3_style.label_opacity = _style.label.opacity;	
			
			_ol3_style.label_opacity = opacityToTransparent(_ol3_style.label_opacity);
			_ol3_style.lb_font = _ol3_style.label_font_weight + ' ' + _ol3_style.label_font_size+'px'+' '+_ol3_style.label_font;
			
			if(_ol3_style.label_stroke_width>0){
				_ol3_style.label_stroke = new ol.style.Stroke({color: hexToRGB(_ol3_style.label_stroke_color,_ol3_style.label_opacity), width: _ol3_style.label_stroke_width});
			}else{
				_ol3_style.label_stroke = undefined;				
			}	
			
			
			_ol3_style.label_fill_color = new ol.style.Fill({  color: hexToRGB(_ol3_style.label_fill_color,_ol3_style.label_opacity) });
			
			_ol3_text = new ol.style.Text({
		          text: _ol3_style.label_text,
		          offsetY: _ol3_style.label_offsetY *-1,
		          offsetX: _ol3_style.label_offsetX,
		          font: _ol3_style.lb_font,
		          fill: _ol3_style.label_fill_color,
		          stroke: _ol3_style.label_stroke,				          			         
		        });
		}
		
		_ol3_style.style = new ol.style.Style({
			 			fill: _ol3_style.symbol_fill,
			 			stroke: _ol3_style.symbol_stroke, 
			 			text: _ol3_text
			       });
	};
	
	
	
	var getOl3LineStyle = function(style) {
		
		//debugger 
		//기본 셋팅
		_ol3_style.renderer = _style.renderer;
		_ol3_style.symbol_type = _style.symbol.symbol_type;
		_ol3_style.symbol_fill_color = _style.symbol.fill_color;	
		_ol3_style.symbol_stroke_color = _style.symbol.stroke_color;
		_ol3_style.symbol_stroke_width = _style.symbol.stroke_width;
		
		
		if(_style.renderer == 'identity'){				
			_ol3_style.symbol_identity_color  = _style.symbol.identity_color;
			_ol3_style.symbol_identity_column = _style.symbol.identity_column;
		}			
		
		//ol3 스타일로 변환
		_ol3_style.symbol_opacity = opacityToTransparent(_style.symbol.opacity);
		_ol3_style.symbol_stroke_opacity = opacityToTransparent(_style.symbol.stroke_opacity);
		/*_ol3_style = getPointTypeStyle(_ol3_style);	*/	
		
		if(_ol3_style.symbol_stroke_width>0){
			_ol3_style.symbol_stroke = new ol.style.Stroke({
				color: hexToRGB(_ol3_style.symbol_stroke_color,_ol3_style.symbol_stroke_opacity),
				width:_ol3_style.symbol_stroke_width
				,lineDash : [_style.symbol.stroke_dasharray,_style.symbol.stroke_dasharray]
				,lineDashOffset : loopIndex
		   });	
		}else{
			_ol3_style.symbol_stroke = undefined;
		}
		
		

		/*_ol3_style.symbol_fill = new ol.style.Fill({
			color: hexToRGB(_ol3_style.symbol_fill_color,_ol3_style.symbol_opacity)
		});*/
		
		
		if(_style.label_use){
			
			_ol3_style.label_fill_color = _style.label.fill_color;
			_ol3_style.label_stroke_color = _style.label.stroke_color;
			_ol3_style.label_stroke_width = _style.label.stroke_width;
			_ol3_style.label_font = _style.label.font;
			_ol3_style.label_font_weight = _style.label.font_weight;
			_ol3_style.label_font_size = _style.label.font_size;
			_ol3_style.label_offsetY = _style.label.offsetY;
			_ol3_style.label_offsetX = _style.label.offsetX;
			_ol3_style.label_text = _style.label.text;
			_ol3_style.label_opacity = _style.label.opacity;	
			
			_ol3_style.label_opacity = opacityToTransparent(_ol3_style.label_opacity);
			_ol3_style.lb_font = _ol3_style.label_font_weight + ' ' + _ol3_style.label_font_size+'px'+' '+_ol3_style.label_font;
			
			if(_ol3_style.label_stroke_width>0){
				_ol3_style.label_stroke = new ol.style.Stroke({color: hexToRGB(_ol3_style.label_stroke_color,_ol3_style.label_opacity), width: _ol3_style.label_stroke_width});
			}else{
				_ol3_style.label_stroke = undefined;				
			}	
			
			_ol3_style.label_fill_color = new ol.style.Fill({  color: hexToRGB(_ol3_style.label_fill_color,_ol3_style.label_opacity) });
			
			_ol3_text = new ol.style.Text({
		          text: _ol3_style.label_text,
		          offsetY: _ol3_style.label_offsetY *-1,
		          offsetX: _ol3_style.label_offsetX,
		          font: _ol3_style.lb_font,
		          fill: _ol3_style.label_fill_color,
		          stroke: _ol3_style.label_stroke,				          			         
		        });
		}
		
		_ol3_style.style = new ol.style.Style({
			 			/*fill: _ol3_style.symbol_fill,*/
			 			stroke: _ol3_style.symbol_stroke, 
			 			text: _ol3_text
			       });
	};
	
	var getPointTypeStyle = function(style) {
		
		switch( style.symbol_type) {
		 case "star":				 
			 style.symbol_points = 5;
			 style.symbol_radius2 = _ol3_style.symbol_radius/2*0.4;
		 	break;
		 case "circle":				 
			 style.symbol_points = 360;
		 	break;
		 case "cross":
			 style.symbol_points= 4;
			 style.symbol_radius2= 0;
			 style.symbol_angle= 0;
			 break;	
		 case "square":					
			 style.symbol_points= 4;
			 style.symbol_angle= Math.PI / 4;
			break;	
		 case "triangle":
			 style.symbol_points =  3;
			break;
		 case "x":			
			 style.symbol_points =  4;
			 style.symbol_radius2 = 0;
			 style.symbol_angle =  Math.PI / 4;
		}
		
		return style;			
	};
	
	var hexToRGB = function(hex, alpha) {
		
		//console.log("hex : " + hex);
		
		if(!hex) return false;
		
	    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

	    if (alpha) {
	        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
	    } else {
	        return "rgb(" + r + ", " + g + ", " + b + ")";
	    }
	};
	
	var makePattern = function(option , hc_color , fill_color) {
		  var cnv = document.createElement('canvas');
		  var ctx = cnv.getContext('2d');
		  
		  var size = 10;		  
		  cnv.width = size;
		  cnv.height = size;
		  
		  if(fill_color){
			  ctx.fillStyle = fill_color;
			  ctx.fillRect(0, 0, size, size);
		  }
		  
		  ctx.fillStyle = hc_color;
		  
		  //option =  option || 6;
		  
		  if(option == 4){
			  for(var i = 0; i < size; ++i) {
			  	ctx.fillRect(i, i, 1, 1);
			  }
		  }else  if(option == 5){
			  for(var i = 0; i < size; ++i) {
			  	ctx.fillRect(size-1-i, i, 1, 1);
			  }
		  }else  if(option == 6){
			  for(var i = 0; i < size; ++i) {
				  ctx.fillRect(i, i, 1, 1);
				  ctx.fillRect(size-1-i, i, 1, 1);
			  }
		  }else  if(option == 2){
			  for(var i = 0; i < size; ++i) {
			  	ctx.fillRect(size/2, i, 1, 1);
			  }
		  }else  if(option == 1){
			  for(var i = 0; i < size; ++i) {
			  	ctx.fillRect(i, size/2, 1, 1);
			  }
		  }else  if(option == 3){
			  for(var i = 0; i < size; ++i) {
				  ctx.fillRect(size/2, i, 1, 1);
				  ctx.fillRect(i, size/2, 1, 1);
			  }
		  }
		  
		  return ctx.createPattern(cnv, 'repeat');
		};
	
	
	var opacityToTransparent = function(opacity) {
		opacity = 1 - opacity/100;
		return opacity==0?0.01:opacity;
	};
	
	 return {
		 najiStyle : najiStyle		 
	 }
};