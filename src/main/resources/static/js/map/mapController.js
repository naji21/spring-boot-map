var MapControllers = function() {
		 
	var njMap, olMap;
	var njMap3d;
	var njMapManager;
	var layer_controller, book_controller, measure_controller, legend_controller, info_controller, base_controller, vwsearch_controller, capture_controller, drawFeature_controller, roadView_controller, kakaosearch_controller, print_controller, directions_controller, attechment_controller;
	var pointDrawController, lineDrawController, polygonDrawController, circleDrawController, squareDrawController, textDrawController;
	var lengthMeasure, areaMeasure;
	var geocoder;
	var legend_element;
	var line_element, polygon_element, clear_element;
	var info_controller_btn, book_controller_btn, layer_controller_btn, base_controller_btn, vwsearch_controller_btn, capture_controller_btn, roadView_controller_btn, kakaosearch_controller_btn, print_controller_btn, drawFeature_controller_btn, directions_controller_btn, attechment_controller_btn;
	var base_url;
	var baseMapItems;
	
	var snapInteraction, selectInteraction, modifyInteraction, drawInteraction, transformInteraction;
	
	var layer = {			
		flag : false	
		,data : undefined
		,mode : undefined
		,setMode : function(v){
			this.mode = v;
		}
		,setEnabled : function(v) {
			this.flag = v;	
			if(v){
	    		olMap.addControl(layer_controller);
	    	}else{
	    		olMap.removeControl(layer_controller);
	    		$(layer_controller_btn).removeClass('active');	
	    	}
			
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		},setData : function (data){
			this.data = data;
			$(layer_controller_btn).removeClass('active');
		},refresh : function(){
			layerDraw();
		},initialize : function(){
			$(layer_controller_btn).removeClass('active');
			
	    	if( selectInteraction ) olMap.removeInteraction(selectInteraction);
	    	if( snapInteraction ) olMap.removeInteraction(snapInteraction);
	    	if( transformInteraction ) olMap.removeInteraction(transformInteraction);
	    	if( modifyInteraction ) olMap.removeInteraction(modifyInteraction);
	    	if( drawInteraction ) olMap.removeInteraction(drawInteraction);
	    	
	    	$(layer_controller_btn).parent().find('.layer-list').each(function(){
	    		this.style.display = "none";
	    	})
	    	$(layer_controller_btn).parent().find('.smart-form').each(function(){
	    		this.style.display = "none";
	    	})
		}
	};
	
	var drawFeature = {
		flag : false,
		isEnabled : function(){
			return this.flag;
		},
		setEnabled : function(v) {
			this.flag = v;	
			if(v){
	    		olMap.addControl(drawFeature_controller);
	    	}else{
	    		olMap.removeControl(drawFeature_controller);
	    		$(drawFeature_controller_btn).removeClass('active');	
	    	}
			
			btn_ordering();
		},
		init : function(drawType) {
			/*
			if(drawFeature_controller)drawFeature_controller.destroy();
			
			drawFeature_controller = new naji.control.njMapDrawFeature( {
				njMap : njMap,
				useSnap : true,
				useDragPan : true,
				drawType : drawType || 'Poygon',
				cursorCssName : 'cursor-polygon',
				useDrawEndDisplay : true,
				activeChangeListener : function(state_) {
					console.log( "njMapDrawFeature : " + state_ );
				},
				featureStyle : new ol.style.Style( {
					fill : new ol.style.Fill( {
						color : "rgba(255, 255, 255, 0.2)"
					} ),
					stroke : new ol.style.Stroke( {
						color : "#ffcc33",
						width : 3
					} ),
					image : new ol.style.Circle( {
						radius : 7,
						fill : new ol.style.Fill( {
							color : "#ffcc33"
						} )
					} )
				} ),
				drawingStyle : new ol.style.Style( {
					fill : new ol.style.Fill( {
						color : "rgba(255, 255, 255, 0.2)"
					} ),
					stroke : new ol.style.Stroke( {
						color : "rgba(0, 0, 0, 0.5)",
						lineDash : [ 10, 10 ],
						width : 2
					} )
				} )
			} );
			*/
		},
		clear : function() {
			drawFeature_controller.getLayer().getSource().clear();
		},
		getFeatures : function() {
			
			var features = drawFeature_controller.getFeatures();
			
			if(features.length > 0){
				return features;	
			}else{				
				console.log("Draw a shape. No geometry.");
				return null;
			}
		},
		setFeatures : function(features) {
			var source = drawFeature_controller.getLayer().getSource();
			/*test*/
			//data = '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[14308715.35618921,4422586.169461845],[14308299.72984791,4422461.959290882],[14308701.024246408,4422070.21952092],[14309049.768187959,4422461.959290882],[14309188.310301725,4422624.387975988],[14308715.35618921,4422586.169461845]]]},"properties":null}';
			//data = JSON.parse(data);
			
			source.addFeatures(features);
			
			njMap.setExtent(drawFeature_controller.getLayer().getSource().getExtent());	
		},
		initialize : function(){
			
		}
	};
	
	var measure = {
		flag : false,
		clear : function() {
			$(line_element).removeClass('active');
	    	$(polygon_element).removeClass('active');		    	
	    	areaMeasure.clear();
	    	lengthMeasure.clear();
	    	areaMeasure.setActive( false );
	    	lengthMeasure.setActive( false );
		},
		setVisible : function(v){
			if(v){
				$(line_element).show();
				$(polygon_element).show();
			}else{
				$(line_element).hide();
				$(polygon_element).hide();
			}
		},
		isEnabled : function() {
			return this.flag;
		},
		setEnabled : function(flag) {
			this.flag = flag;
			if(flag){
				measure_controller.forEach(function( v, i ){
	    			olMap.addControl(v);
	    		});
	    	}else{
	    		measure_controller.forEach(function( v, i ){
	    			olMap.removeControl(v);
	    			$(line_element).removeClass('active');
	    	    	$(polygon_element).removeClass('active');		    	    	
	    	    	areaMeasure.clear();
	    	    	lengthMeasure.clear();
	    	    	areaMeasure.setActive( false );
	    	    	lengthMeasure.setActive( false );
	    		});	
	    	}
		},
		getDrawFeatures : function() {		
			var DrawFeatures = areaMeasure.getFeatures();
			
			if(DrawFeatures.length > 0){
				/*var writer = new ol.format.GeoJSON();
			    var jsonFeatures = writer.writeFeatures(areaMeasure.getDrawFeatures());*/
				
				return DrawFeatures;	
			}else{				
				console.log("Draw a shape. No geometry.");
				return null;
			}
		},
		initialize : function(){
			$(line_element).removeClass('active');
	    	$(polygon_element).removeClass('active');	
	    	lengthMeasure.setActive( false );
			areaMeasure.setActive( false );
		}
	};
	
	var info = {			
		flag : false
		,idx : 0
		,data : null
		,event : undefined
		,setEnabled : function(v) {				
			this.flag = v;
			if(v){
	    		olMap.addControl(info_controller);
	    	}else{
	    		olMap.removeControl(info_controller);
	    		$(info_controller_btn).removeClass('active');	
				if(this.event)olMap.un('singleclick', this.event);
	    	}
			btn_ordering();
		}			
		,isEnabled : function(){
			return this.flag;
		},setEvent :function(event){
			this.event = event;
		},setData :function(o){
			this.idx = 0;
			this.data = o;
		},getData :function(){
			return this.data;
		},getPrevData :function(){
			if( this.idx > 0 ) this.idx -= 1;
			else this.idx = this.data.length - 1;
			return this.data[this.idx];
		},getNextData :function(){
			if( this.idx < this.data.length - 1 ) this.idx += 1;
			else this.idx = 0;
			return this.data[this.idx];
		},
		initialize : function(){
			$(info_controller_btn).removeClass('active');
			if(this.event) olMap.un('singleclick', this.event);
		}
	};
	
	var book = {
		flag : false
		,data : undefined
		,setEnabled : function(v) {			
			this.flag = v;
			if(v){
	    		olMap.addControl(book_controller);
	    	}else{
	    		olMap.removeControl(book_controller);
	    		$(book_controller_btn).removeClass('active');	
	    	}
			
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		},setData : function (data){
			this.data = data;
			$(book_controller_btn).removeClass('active');
		},
		initialize : function(){
			$(book_controller_btn).removeClass('active');
			$(book_controller_btn).parent().find('.control-contents-box').remove();
		}
	};
	
	var vwsearch = {
		flag : false
		,data : undefined
		,event : undefined
		,setEnabled : function(v) {			
			this.flag = v;
			if(v){
	    		olMap.addControl(vwsearch_controller);
	    	}else{
	    		olMap.removeControl(vwsearch_controller);
	    		$(vwsearch_controller_btn).removeClass('active');	
	    	}
			
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		},setData : function (data){
			this.data = data;
			$(vwsearch_controller_btn).removeClass('active');
		},setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(vwsearch_controller_btn).removeClass('active');
			$(vwsearch_controller_btn).parent().find('.control-contents-box1').hide();
		}
	};
	
	var kakaosearch = {
		flag : false
		,data : undefined
		,event : undefined
		,setEnabled : function(v) {			
			this.flag = v;
			if(v){
	    		olMap.addControl(kakaosearch_controller);
	    	}else{
	    		olMap.removeControl(kakaosearch_controller);
	    		$(kakaosearch_controller_btn).removeClass('active');	
	    	}
			
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		},setData : function (data){
			this.data = data;
			$(kakaosearch_controller_btn).removeClass('active');
		},setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(kakaosearch_controller_btn).removeClass('active');
			$(kakaosearch_controller_btn).parent().find('.control-contents-box1').hide();
		}
	};
	
	var search  = {			
		flag : false
		,provider : 'osm'
		,setEnabled : function(v) {	
			
			this.flag = v;
			if(v){
	    		olMap.addControl(geocoder);
	    	}else{
	    		olMap.removeControl(geocoder);
	    	}	
			
			btn_ordering();
		},
		isEnabled : function(){
			return this.flag;
		},setPovider :  function(v) {	
			this.provider = v;				
			/*geocoder = new Geocoder( 'nominatim', {
				provider : v,	
	    		key: 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94' ,
				lang : 'ko',
				placeholder : 'Search for ...',
				limit : 10,
				debug : false,
				autoComplete : true,
				keepOpen : true
			} );*/
		},
		initialize : function(){
			
		}
	};
	
	var base = {
		flag : false
		,data : undefined
		,setVisible : function(v){
			if(v) $(base_controller_btn).show();
			else $(base_controller_btn).hide();
		}
		,setEnabled : function(v) {			
			this.flag = v;
			if(v){
	    		olMap.addControl(base_controller);
	    	}else{
	    		olMap.removeControl(base_controller);
	    		$(base_controller_btn).removeClass('active');	
	    	}
			
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		},setData : function (data){
			this.data = data;
			$(base_controller_btn).removeClass('active');
		},setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(base_controller_btn).removeClass('active');
			$(base_controller_btn).parent().find('.control-contents-box').remove();
		}
	};
	
	var legend = {
		data : undefined	
		,setEnabled : function(v) {			
			if(v){
	    		olMap.addControl(legend_controller);
	    	}else{
	    		olMap.removeControl(legend_controller);
	    	}
			
		},setData : function (data){					
			
			this.data = data;
			
			var _ul = $(legend_element).find('ul');
			
			_ul.empty();
			
			var uuid = new Date().getTime();
			
			if(data.length == 0){
				var li = document.createElement('li');	
				li.innerHTML = 'Please set the legend.';
				_ul.append(li);	
			}else{
				data.forEach(function(v,i){
					var shape_type = v.geotype;
					var li = document.createElement('li');
					
					var hexToRgb = function(hexType, opacity){
						var hex = hexType.replace( "#", "" ); 
				        var value = hex.match( /[a-f\d]/gi ); 


				        // 헥사값이 세자리일 경우, 여섯자리로. 
				        if ( value.length == 3 ) hex = value[0] + value[0] + value[1] + value[1] + value[2] + value[2]; 


				        value = hex.match( /[a-f\d]{2}/gi ); 

				        var r = parseInt( value[0], 16 ); 
				        var g = parseInt( value[1], 16 ); 
				        var b = parseInt( value[2], 16 ); 

				        if( !opacity ) opacity = 1;
				        
				        return "rgb(" + r + ", " + g + ", " + b + ", " + opacity + ")";
					}
					
					if(v.type == 'WMS'){
						li.innerHTML = '<div style="height=21px"><i class="fa fa-fw fa-list"></i>'+v.title+'<div>';
						li.innerHTML += '<div style="width:21px;height:21px;background-color:rgba( 0, 0, 255, 0.5 );border:1px solid #0000ff;"><div>';
                    }else if(v.type == 'wfs_vector'){
                    	if(shape_type.indexOf('POINT') > -1 ){
                    		li.innerHTML = '<img src="'+'/images/legend/point.png'+'">' +v.title;
    						li.innerHTML += '<div><img src="'+v.style.image.icon.src+'"></div>';
    					}else if(shape_type.indexOf('LINE') > -1 || shape_type.indexOf('Curve') > -1){
    						li.innerHTML = '<img src="'+'/images/legend/line.png'+'">' +v.title;
    						li.innerHTML += '<div style="width:21px;height:21px;"><div style="margin-top: 10px;width:100%;height:'+ v.style.stroke.width +'px;background-color:' + hexToRgb( v.style.stroke.color, v.opacity ) + ';"></div></div>';
    					}else if(shape_type.indexOf('POLYGON') > -1 || shape_type.indexOf('Surface') > -1){
    						li.innerHTML = '<img src="'+'/images/legend/polygon.png'+'">' +v.title;
    						li.innerHTML += '<div style="width:21px;height:21px;background-color:' + hexToRgb( v.style.fill.color ) + ';opacity:'+ v.opacity +';border:'+ v.style.stroke.width +'px solid '+ v.style.stroke.color +';"><div>';
    					}else{
    						li.innerHTML = '[No image.]' +v.legendtitle;
    					}
                    }
					
					_ul.append(li);
				});
			}
			
			
//			data.forEach(function(v,i){
//				
//				var _img = '<img src="'+base_url+'uwms?KEY='+v.userid+'&time='+uuid+'&amp;VERSION=1.3.0&amp;REQUEST=GetLegendGraphic&amp;LAYER='+v.title+'&amp;FORMAT=image/png&amp;style='+v.sldUserNm+':'+v.sldTitle+'">';			
//				
//				var li = document.createElement('li');
//				
//				if(v.sldType == "identity"  || v.sldType == 'ClassesBreak' ){
//					li.innerHTML = '<div style="height=21px"><i class="fa fa-fw fa-list"></i>'+v.legendtitle+'<div>';
//					
//					li.innerHTML +=  '<img class="indent" src="'+base_url+'uwms?KEY='+v.userid+'&time='+uuid+'&amp;VERSION=1.3.0&amp;REQUEST=GetLegendGraphic&amp;LAYER='+v.title+'&amp;FORMAT=image/png&amp;style='+v.sldUserNm+':'+v.sldTitle+'">';
//				}else if(v.type == "ANALYSIS"){
//					
//					//var _layer = v.sourceurl.split('/').slice(-1)[0].split('.').slice(0)[0];
//					
//					
//					var url = new URL(v.sourceurl);
//					var _layer_name = url.searchParams.get("name");			
//
//					/* If there is no name entry, the last value is retrieved. */
//					if(!_layer_name){
//						_layer_name = v.sourceurl.split('/').slice(-1)[0];
//					}									
//					
//					var param = "&column=JOIN_COUNT&color="+v.style.colorpicker+"&breakscount="+v.style.breakscount+"&LAYER="+_layer_name;
//					
//					li.innerHTML = '<div style="height=21px"><i class="fa fa-fw fa-list"></i>'+v.legendtitle+'<div>';
//					
//					li.innerHTML += '<img class="indent" src="'+base_url+'pwms?KEY=null&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&time='+uuid+param+'">';					
//				
//				}else if(v.type == 'WMS'){					
//				 	$.ajax({
//						url: base_url+'/wms',
//						method: 'post',
//						async: false,
//						data: {
//							KEY : v.dtsourceid,
//							SERVICE : 'WMS',
//							VERSION : '1.1.0',
//							REQUEST : 'GetCapabilities',
//						},
//						dataType: 'jsonp',
//						jsonp: "callback",
//						success: function (result) {
//							var list = $(result).find('Layer > Layer');
//							var html = '';
//							
//							list.each(function(l_i , l_item ) {
//								
//								var image_url = $(l_item).find('LegendURL OnlineResource').attr('xlink:href');
//								var label = $($(l_item).find('Name').get(0)).text();
//								
//								var img = $('<img />').attr('src', image_url);								
//															
//								img.bind('load', function() {									
//									if(this.width == 16){										
//										$(this).next().show();
//									}
//								});								
//								
//								var span = $('<span />').attr('class', 'legend_label').html(label).hide();	
//								var br = $('<br>');	
//								
//								img.appendTo(li);
//								span.appendTo(li);
//								br.appendTo(li);																	
//							});									
//						},
//						error: function (jqXHR, textStatus, errorThrown) {
//							
//						}
//					});
//				}else if(v.type == 'WFS'){	
//					
//					$.ajax({
//						url: base_url+'/wfs',
//						method: 'post',
//						async: false,
//						data: {
//							KEY : v.dtsourceid,
//							SERVICE : 'WFS',
//							VERSION : '1.1.0',
//							REQUEST : 'DescribeFeatureType',
//							typename : v.layername,
//						},
//						dataType: 'xml',
//						success: function (result) {												
//							var cols = $(result).find('xsd\\:complexContent xsd\\:element');
//							
//							var shape_type;
//							
//							cols.each(function(l_i, l_col) {
//								if($(l_col).attr('name') == 'SHAPE'){
//									shape_type = $(l_col).attr('type');
//								}		
//							});	
//							
//							if(shape_type){
//								if(shape_type.indexOf('Point') > -1 ){
//									li.innerHTML = '<img src="'+'/images/legend/point.png'+'">' +v.legendtitle;
//								}else if(shape_type.indexOf('Line') > -1 || shape_type.indexOf('Curve') > -1){
//									li.innerHTML = '<img src="'+'/images/legend/line.png'+'">' +v.legendtitle;
//								}else if(shape_type.indexOf('Polygon') > -1 || shape_type.indexOf('Surface') > -1){
//									li.innerHTML = '<img src="'+'/images/legend/polygon.png'+'">' +v.legendtitle;
//								}else{
//									li.innerHTML = '[No image.]' +v.legendtitle;
//								}
//							}else{
//								li.innerHTML = '[No image.]' +v.legendtitle;
//							}						
//							
//						},
//						error: function (jqXHR, textStatus, errorThrown) {
//							
//						}
//					});
//				}else{
//					li.innerHTML = _img +v.legendtitle;
//				}
//				
//				_ul.append(li);				
//								
//			});
		},
		initialize : function(){
	    	$(legend_controller_btn).removeClass('active');
	    	$(legend_controller_btn).parent().find('.control-contents-box').remove();
		}
	};
	
	var capture = {
		flag : false
		,mode : "2d"
		,element : null
		,event : function(){
	    	if(!njMap3d || ( njMap3d && !njMap3d.getMap().getEnabled()) ){
	    		this.mode = "2d";
	    	}else{
	    		this.mode = "3d";
	    	}
	    	
	    	document.getElementsByClassName("ol-overlaycontainer-stopevent")[1].style.visibility = "hidden";
	    	
	    	if(this.mode == "2d"){
	    		this.element = $(olMap.getViewport()).parent().parent()[0];
	    	}else{
	    		njMap3d.getMap().getCesiumScene().render();
	    		this.element = njMap3d.getMap().getCesiumScene().canvas;
	    	}
			
			html2canvas( this.element, {
				useCORS : false,
				logging : false,
				proxy : naji.njMapConfig.getProxy().replace("?url=", "")
			} ).then( function(canvas) {
				if ( navigator.msSaveBlob ) {
					navigator.msSaveBlob( canvas.msToBlob(), 'map.png' );
				} else {
					canvas.toBlob( function(blob) {
						saveAs( blob, 'map.png' );                                
					} );
				}
				
				document.getElementsByClassName("ol-overlaycontainer-stopevent")[1].style.visibility = "visible";
			} );
		}
		,setMap : function(v){
			this.map = v;
		}
		,setVisible : function(v) {
			if(v) $(capture_controller_btn).show();
			else $(capture_controller_btn).hide();
		}
		,setEnabled : function(v) {				
			this.flag = v;
			if(v){
	    		olMap.addControl(capture_controller);
	    	}else{
	    		olMap.removeControl(capture_controller);
	    		$(capture_controller_btn).removeClass('active');	
				if(this.event)olMap.un('singleclick', this.event);
	    	}
			
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		}
		,setEvent :function(event){
			this.event = event;
		}
		,setElement :function(el){
			this.element = el;
		},
		initialize : function(){
			
		}
	};
	
	var roadView = {
		map : null
		,flag : false
		,data : undefined
		,event : undefined
		,changeEvent : function(e){
			var lonlat = ol.proj.transform(e.target.getView().getCenter(), njMap.getCRS(), 'EPSG:4326');
			
			//if (olMap.getView().getCenter() != e.target.getView().getCenter()) {
			roadView.map.setPosition( new naver.maps.LatLng(lonlat[1], lonlat[0]) );
			//}
		}
		,setVisible : function(v) {
			if(v) $(roadView_controller_btn).show();
			else $(roadView_controller_btn).hide();
		}
		,setEnabled : function(v) {
			this.flag = v;
			if(v){
	    		olMap.addControl(roadView_controller);
	    	}else{
	    		olMap.removeControl(roadView_controller);
	    		$(roadView_controller_btn).removeClass('active');	
	    	}
			btn_ordering();
		}
		,isEnabled : function(){
			return this.flag;
		},setMap : function (m){
			this.map = m;
		},getMap : function (){
			return this.map;
		},setData : function (data){
			this.data = data;
			$(roadView_controller_btn).removeClass('active');
		},setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(roadView_controller_btn).removeClass('active');
			
			//$("#pano").css("display", "none");
			$("#"+$(olMap.getViewport()).parent()[0].id.replace("_map", "")+"_pano").css("display", "none");
			
    		_roadView = null;
    		olMap.un("moveend", this.changeEvent);
		}
	};
	
	var modeSwitch = {			
		mode : "2d"
		,flag : false
		,event : undefined
		,isEnabled : function(){
			return this.flag;
		}
		,setEnabled: function(v){
			this.flag = v;
			if(v){
	    		olMap.addControl(modeSwitch_controller);
	    	}else{
	    		olMap.removeControl(modeSwitch_controller);
	    		$(modeSwitch_controller_btn).removeClass('active');	
	    	}
			btn_ordering();
		}
		,setMode : function(v) {
			if(v == undefined) v = "2d";
			this.mode = v;
		}
		,getMode : function(){
			return this.mode;
		},setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(modeSwitch_controller_btn).removeClass('active');
		}
	};
	
	var directions = {
		start : null,
		goal : null,
		via : [],
		flag : false
		,event : undefined
		,vectorLayer : new ol.layer.Vector( {
			zIndex : 9999,
			source : new ol.source.Vector( {
				wrapX : false
			} ),
			style : new ol.style.Style( {
				fill: new ol.style.Fill({
				    color: 'rgba(0,255,0,0.5)',
				}),
				stroke : new ol.style.Stroke( {
					color : "#ff0000",
					width : 3
				})
			})
		} )
		,draw : function(features){
			this.vectorLayer.getSource().addFeature( features );
			njMap.getMap().addLayer( this.vectorLayer );
			njMap.getMap().getView().fit(this.vectorLayer.getSource().getExtent(), njMap.getMap().getSize());
		}
		,clear : function(){
			njMap.getMap().removeLayer( this.vectorLayer );
			this.vectorLayer.getSource().clear();
		}
		,isEnabled : function(){
			return this.flag;
		}
		,setEnabled: function(v){
			this.flag = v;
			if(v){
	    		olMap.addControl(directions_controller);
	    	}else{
	    		olMap.removeControl(directions_controller);
	    		$(directions_controller_btn).removeClass('active');	
	    	}
			btn_ordering();
		},
		setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(directions_controller_btn).removeClass('active');
		}
	};
	
	var attechment = {
		flag : false
		,event : undefined
		,layers : []
		,vectorLayer : new ol.layer.Vector( {
			zIndex : 9999,
			source : new ol.source.Vector( {
				wrapX : false
			} ),
			style : new ol.style.Style( {
				fill: new ol.style.Fill({
				    color: 'rgba(0,255,0,0.5)',
				}),
				stroke : new ol.style.Stroke( {
					color : "#ff0000",
					width : 3
				})
			})
		} )
		,draw : function(features){
			this.vectorLayer.getSource().addFeature( features );
			njMap.getMap().addLayer( this.vectorLayer );
			njMap.getMap().getView().fit(this.vectorLayer.getSource().getExtent(), njMap.getMap().getSize());
		}
		,clear : function(){
			njMap.getMap().removeLayer( this.vectorLayer );
			this.vectorLayer.getSource().clear();
		}
		,isEnabled : function(){
			return this.flag;
		}
		,setEnabled: function(v){
			this.flag = v;
			if(v){
	    		olMap.addControl(attechment_controller);
	    	}else{
	    		olMap.removeControl(attechment_controller);
	    		$(attechment_controller_btn).removeClass('active');	
	    	}
			btn_ordering();
		},
		setEvent :function(event){
			this.event = event;
		},
		initialize : function(){
			$(attechment_controller_btn).removeClass('active');
		}
	};
	
	var btn_ordering = function(){
		lt_btn_ordering();
		rt_btn_ordering();
	}
	
	var lt_btn_ordering = function(){
		
		var current_p = 10;
		var inc = 37;
		
		if(search.isEnabled()){					
			$(geocoder.element).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(vwsearch.isEnabled()){					
			$(vwsearch_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(kakaosearch.isEnabled()){					
			$(kakaosearch_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(directions.isEnabled()){					
			$(directions_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(attechment.isEnabled()){					
			$(attechment_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(layer.isEnabled()){					
			$(layer_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(base.isEnabled()){					
			$(base_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(book.isEnabled()){					
			$(book_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(roadView.isEnabled()){					
			$(roadView_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		/*if(info.isEnabled()){					
			$(info_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}*/
		
	};
	
	var rt_btn_ordering = function(){
		
		var current_p = 170;
		var inc = 35;

		if(modeSwitch.isEnabled()){					
			$(modeSwitch_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(info.isEnabled()){					
			$(info_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(measure.isEnabled()){					
			$(line_element).css('top',current_p+'px');
			current_p = current_p+inc;	
			$(polygon_element).css('top',current_p+'px');
			current_p = current_p+inc;	
			$(clear_element).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(drawFeature.isEnabled()){					
			$(drawFeature_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
		
		if(capture.isEnabled()){					
			$(capture_controller_btn).css('top',current_p+'px');
			current_p = current_p+inc;	
		}
	};
		    
    var controllers = {
	     init : function(attr) {
	    	njMapManager =attr.njMapManager;	    	 
	    	njMap = attr.njMap;
	    	njMap3d = attr.njMap3d;
	    	olMap = attr.njMap.getMap();	   
	    	base_url = attr.base_url;
	    	createSearch_controller(attr.search);
	    	createBookmarkController(attr.book);
	    	createVwsearchController(attr.vwsearch);
	    	createKakaosearchController(attr.kakaosearch);
	    	createBaseController(attr.base, attr.baseItems);
	    	createLayerController(attr.layer);
	    	createLegendController(attr.legend);
	    	createMeasureController(attr.measure);
	    	createDrawFeatureController(attr.drawFeature);
	    	createInfoController(attr.info);
	    	createCaptureController(attr.capture);
	    	createRoadViewController(attr.roadView);
	    	createModeSwitchController(attr.modeSwitch);
	    	createDirectionsController(attr.directions);
	    	createAttechmentController(attr.attechment);
	    }		   
    };    
    		    
    var createControlElement = function(data){	
    	var button = document.createElement('button');
    	button.title = data.title || ''; 
		button.innerHTML = data.html;
		var element = document.createElement('div');
		element.className = data.css + ' ol-unselectable ol-control';
		element.appendChild(button);
		
		if(data.contents){
			$(element).append(data.contents);
		}
		
		return element;
    };
		    
    /*var activeCssHandler = function(e) {		
		changeActiveClass($(this));
	}*/
   
    var changeActiveClass = function(obj){    	
    	if(obj.hasClass('active')){		    		
    		obj.removeClass('active');
		}else{						
			obj.addClass('active');	
		}		    	
    };
    
    var infoHandler = function(e) {
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
    	changeActiveClass($(this));    	
    	
    	if($(this).hasClass('active')){	    	
    		if(info.event){
    			olMap.on('singleclick', info.event);
    		}
    	}else{
    		if(info.event){
    			olMap.un('singleclick', info.event);
    		}
    	}    	
	};
    
    var layerDraw = function(){
    	
    	var _this = $(layer_controller_btn).find('button[title=Layer]').parent();
    	
    	if( _this.find('.layer-list')[0] ){
    		_this.find('.layer-list')[0].style.display = "block";
    		return;
    	}
    		
    	_this.find('.layer-list').remove();		
		
		if(!layer.mode || layer.mode !='view'){			
			$(layer_controller_btn).append('<div class="layer-list ol_control_msgbox">It is not supported in edit mode. This is a view mode function.</div>');
			return;
		}
		
		var _div = $('<div class="dd layer-list" style="width:300px; background-color: #f5f6f6; border: solid 1px #dcd2c8; padding: 5px 7px 5px 7px;"><ol class="dd-list"></ol></div>');
		var _list = _div.find('.dd-list');
		
		var tag = 
			'<div class="dd-handle dd3-handle">&nbsp;</div>'+			
			'<div class="dd3-content" style="font-size: 12px; font-weight: bold;" >'+
				'<div class="pull-right" style="display: flex;">'+	
					'<button data-toggle="tooltip" title="move" name="move" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
						'<i class="fa fa-fw fa-arrows-alt"></i>'+							
					'</button>'+
					'<button data-toggle="tooltip" title="view" name="view" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
						'<i class="fa fa-fw"></i>'+							
					'</button>'+
					'<button data-toggle="tooltip" title="remove" name="remove" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
						'<i class="fa fa-fw fa-trash-o"></i>'+							
					'</button>'+
					'<button data-toggle="tooltip" title="option" name="btn_more" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
						'<i class="fa-fw glyphicon glyphicon-option-vertical"></i>'+
					'</button>'+								
					'<button data-toggle="tooltip" title="modify" name="btn_feature-edit" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
						'<i class="fa fa-edit"></i>'+
					'</button>'+
					'<button data-toggle="tooltip" title="add" name="btn_feature-add" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
						'<i class="fa fa-plus"></i>'+
					'</button>'+
				'</div>'+
				'<div style="padding-bottom:10px;display: flex; word-break: break-all;" name="layer_title"></div>'+						
				'<div class="smart-form" style="display:none;border: 1px solid rgb(170, 170, 170); background-color: transparent; padding: 6px 10px 6px 6px;margin-top:3px;" >'+
					'<section>'+
						'<label class="text-left" style="font-size:13px">opacity</label><hr/>'+	
					'</section>'+								
					'<section>'+
						'<input name="opacity" value="100" type="text">'+
					'</section>'+
					
					'<section>'+
						'<label class="text-left" style="font-size:13px">style</label><hr/>'+	
					'</section>'+								
					'<section>'+
//						'<div name="div_symbolType">'+
//							'<label>Symbol Type </label>'+
//							'<button style="margin-bottom: 4px;" data="circle" class="btn btn-default btn-sm active"><i class="fa fa-circle-o" /></button>'+
//							'<button style="margin-bottom: 4px;" data="square" class="btn btn-default btn-sm"><i class="fa fa-square-o" /></button>'+
//							'<button style="margin-bottom: 4px;" data="triangle" class="btn btn-default btn-sm"><i class="fa fa-play fa-rotate-270" /></button>'+
//							'<button style="margin-bottom: 4px;" data="x" class="btn btn-default btn-sm">X</button>'+
//							'<button style="margin-bottom: 4px;" data="cross" class="btn btn-default btn-sm"><i class="fa fa-plus" /></button>'+
//							'<button style="margin-bottom: 4px;" data="star" class="btn btn-default btn-sm "><i class="fa fa-star-o" /></button>'+
//						'</div>'+
//						'<div name="div_symbolImage">'+
//							'<label>Symbol Image </label>'+
//							'<button data="add_img" class=""><span class="icon-new" /></button>'+
//						'</div>'+
//						'<div name="div_symbolSize">'+
//							'<label>Symbol Size </label><input name="symbolSize" type="text" class="style_input" value="6">'+
//						'</div>'+
//						'<div name="div_symbolTransparent">'+
//							'<label>Symbol Transparent </label><input name="symbolTransparent" type="text" class="style_input" value="0">'+
//						'</div>'+
						'<div name="div_strokeWidth"><label>Stroke width </label><input name="strokeWidth" value="0" type="text"></div>'+
						'<div name="div_strokeColor"><label>Stroke color </label><input name="strokeColor" class="color-picker-input style-input" type="text" value="#000000"></div>'+
						//'<div name="div_strokeOpacity"><label>Stroke opacity </label><input name="strokeOpacity" class="style_input" type="text" value="0"></div>'+
						//'<div><label>Stroke color </label><div name="strokeColor"></div></div>'+
						//'<div><label>Stroke style </label><input name="strokeStyle" value="1" type="text"></div>'+
						'<div name="div_fillColor"><label>Fill color </label><input name="fillColor" class="color-picker-input style-input" type="text" value="#000000"></div>'+
						//'<div><label>Fill color </label><div name="fillColor"></div></div>'+
					'</section>'+
				'</div>'+							
			'</div>';
		layer.data.sort(function(a, b){
			return a.index - b.index; // 1, 2, 3, 4, 10, 11
		});
		
		layer.data.forEach(function(v,i){			
			
			if(njMapManager.get(v.layerid)){
				var checked = '';
				
				if(njMapManager.get(v.layerid).njMapLayer.getLayerVisible()){
					checked = 'checked="checked"';
				}
				
				var data_type_class = '';
				
				if(v.geotype){
					data_type_class = 'layer-'+v.geotype;
				}else{
					data_type_class = 'layer-img';
				}
				
				var _li = $('<li class="dd-item dd3-item"></li>');
				_li.addClass(data_type_class);	
				
				_li.append(tag);
				
				var view = _li.find('[name=view] i');
				_li.find('[name=layer_title]').html(v.user_title || v.title);
				
				if(v.is_ext){
					_li.find('[name=btn_more]').hide();
				}else{
					_li.find('[name=remove]').hide();
				}
				
				if(!checked){
					view.addClass('fa-eye-slash');
				}else{				
					view.addClass('fa-eye');
				}
				
				if( !v.geotype ){
					_li.find('[name=btn_feature-edit]').hide();
					_li.find('[name=btn_feature-add]').hide();
				}
				
				//geometry type
				switch( v.geotype ){
					case "MULTIPOLYGON" :
						break;
					case "POLYGON" :
						break;
					case "MULTILINESTRING" :
						_li.find("[name=div_fillColor]").hide();
						break;
					case "LINESTRING" :
						_li.find("[name=div_fillColor]").hide();
						break;
					case "MULTIPOINT" :
						_li.find("[name=div_strokeWidth]").hide();
						_li.find("[name=div_strokeColor]").hide();
						
						_li.find("[name=div_fillColor]").hide();
						break;
					case "POINT" :
						_li.find("[name=div_strokeWidth]").hide();
						_li.find("[name=div_strokeColor]").hide();
						
						_li.find("[name=div_fillColor]").hide();
						break;
					default :
						_li.find("[name=div_strokeWidth]").hide();
						_li.find("[name=div_strokeColor]").hide();
						
						_li.find("[name=div_fillColor]").hide();
						break;
				}
				
				_li.data(v);
				_list.append(_li);
			}
		});	
		
		//layer.data.reverse();
		

		$(layer_controller_btn).append(_div);
		
		_div.nestable({	
			onDragFinished: function(e){
				$(layer_controller_btn).find("li").each(function(i, item) {
					var data = $(item).data();					
					if(njMapManager.get(data.layerid)){
						njMapManager.get(data.layerid).njMapLayer.getOlLayer().setZIndex(1050 - i);						
					}
				});
			}
		});
		
		$(layer_controller_btn).find("[name=opacity]").each(function(i, item) {
			var li = $(item).closest("li");	
			var data = li.data();

			$(this).val( data.opacity ? (data.opacity * 100) : 100 );
			
			$(item).ionRangeSlider({
				min: 0,
		        from: $(this).val(),
		        max: 100,
		        type: 'single',
		        step: 1,
		        postfix: '%',
		        prettify: false,
		        grid: false,
		        inputValuesSeparator: ';'
		    });
		});
		
		$(layer_controller_btn).find("[name=strokeColor]").each(function(i, item) {
			var li = $(item).closest("li");	
			var data = li.data();
			/*
			$(item).ColorPicker({
				color: '#0000ff',
				onShow: function (colpkr) {
					$(colpkr).fadeIn(500);
					return false;
				},
				onHide: function (colpkr) {
					$(colpkr).fadeOut(500);
					return false;
				},
				onChange: function (hsb, hex, rgb) {
					debugger;
//					//$('#colorSelector div').css('backgroundColor', '#' + hex);
				}
			});
			*/
			$(this).val( data.style && data.style.stroke ? data.style.stroke.color : "#000000" );
			$(this).colorpicker({
				showOn: 'both', 
				hideButton: false,
				displayIndicator: true,
				transparentColor: false,
				history: false,
				defaultPalette: 'web', 
				strings: 'Theme Colors,Standard Colors,Web Colors,Theme Colors,Back to Palette,History,No history yet.'
			});
			//$(item).colorpicker({ inline: true, container: true, popover: false });
		});
		
		$(layer_controller_btn).find("[name=fillColor]").each(function(i, item) {
			var li = $(item).closest("li");	
			var data = li.data();
			
			/*
			$(item).ColorPicker({
				color: '#0000ff',
				onShow: function (colpkr) {
					$(colpkr).fadeIn(500);
					return false;
				},
				onHide: function (colpkr) {
					$(colpkr).fadeOut(500);
					return false;
				},
				onChange: function (hsb, hex, rgb) {
					debugger;
					//$('#colorSelector div').css('backgroundColor', '#' + hex);
				}
			});
			*/
			$(this).val( data.style && data.style.fill ? data.style.fill.color : "#000000" );
			$(this).colorpicker({
				showOn: 'both', 
				hideButton: false,
				displayIndicator: true,
				transparentColor: false,
				history: false,
				defaultPalette: 'web', 
				strings: 'Theme Colors,Standard Colors,Web Colors,Theme Colors,Back to Palette,History,No history yet.'
			});
			/*
			{
		        //popover: false,
		        //inline: true,
		        //container: layer_controller_btn
		    }
		    */
		});
		
		$(layer_controller_btn).find("[name=strokeWidth]").each(function(i, item) {
			var li = $(item).closest("li");	
			var data = li.data();
			
			$(this).val( data.style && data.style.stroke ? data.style.stroke.width : 1 );
			
			$(item).ionRangeSlider({
				min: 0,
		        from: $(this).val(),
		        max: 10,
		        type: 'single',
		        step: 0.1,
		        postfix: 'px',
		        prettify: false,
		        grid: false,
		        inputValuesSeparator: ';'
		    });
		});	
		
		/*$(layer_controller_btn).on('click', 'button[name="btn_more"]', function (e) {
			e.stopPropagation();			
			var li = $(e.target).closest("li");			
			var $more = li.find('.smart-form');			
			if($more.css('display') === 'none') {
				$more.show();
			} else {
				$more.hide();
			}
		});	
		
		$(layer_controller_btn).on('click', 'button[name="move"]', function (e) {
			e.stopPropagation();			
			var li = $(e.target).closest("li");		
			var data = $(li).data();
			
			var extent = data.pos.map(Number);
			var book_proj = "EPSG:3857";			
			
			//좌표계가 서로 다를 경우
			var cur_proj =  olMap.getView().getProjection().getCode();
			
			extent = ol.proj.transformExtent(extent,book_proj,cur_proj);
			olMap.getView().fit(extent, olMap.getSize());
			
		});	
		
		$(layer_controller_btn).on('click', 'button[name="remove"]', function (e) {
			e.stopPropagation();			
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			
			if(njMapManager.get(data.layerid)){
				njMapManager.remove(data.layerid);
			}			
			
			layerDraw();
			
		});	
		
		$(layer_controller_btn).on('change', '[name="opacity"]', function (e) {	
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			njMapManager.get(data.layerid).njMapLayer.getOlLayer().setOpacity(v);			
		});*/
    	
    	
    };
    
    var layerHandler = function(e) {
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	measure.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
		
    	var _this = $(layer_controller_btn).find('button[title=Layer]').parent();

    	if(_this.hasClass('active')){
    		changeActiveClass(_this);
    		_this.find('.layer-list')[0].style.display = "none";
    		_this.find('.smart-form')[0].style.display = "none";
			return;
		}
    	
    	changeActiveClass(_this);     	
    	layerDraw();
	}
    
    var layerVisibleHandler = function(e) {	
    	    	
    	console.log('layerVisibleHandler');
    	
    	var icon_tag = $(this).find('i');
    	
    	var checked = icon_tag.hasClass('fa-eye-slash'); 	
    	
    	if(checked){
    		icon_tag.removeClass('fa-eye-slash');
    		icon_tag.addClass('fa-eye');
    	}else{
    		icon_tag.removeClass('fa-eye');
    		icon_tag.addClass('fa-eye-slash');        	
    	}
    	
    	var data = $(e.target).closest("li").data();
    	
    	njMapManager.get(data.layerid).njMapLayer.setLayerVisible(checked);		
    }
    
    var layerFeatureEditHandler = function(e) {	
    	
    	console.log('layerFeatureEditHandler');
    	olMap.removeInteraction(selectInteraction);
    	olMap.removeInteraction(snapInteraction);
    	olMap.removeInteraction(transformInteraction);
    	olMap.removeInteraction(modifyInteraction);
    	olMap.removeInteraction(drawInteraction);
    	
    	var icon_tag = $(this).find('i');
    	
    	var checked = icon_tag.hasClass('far fa-edit'); 	
    	/*
    	if(checked){
    		icon_tag.removeClass('fa-eye-slash');
    		icon_tag.addClass('fa-eye');
    	}else{
    		icon_tag.removeClass('fa-eye');
    		icon_tag.addClass('fa-eye-slash');        	
    	}
    	*/
    	var data = $(e.target).closest("li").data();
    	
    	var _style = {};
    	
    	if( data.style.fill ){
			_style.fill = new ol.style.Fill( {
				color: data.style.fill.color
			} );
		}
		
		if( data.style.stroke ){
			_style.stroke = new ol.style.Stroke( {
				color: data.style.stroke.color,
				width: data.style.stroke.width,
			} );
		}
		
		if( data.style.circle ){
			_style.image = new ol.style.Circle( {
				fill: data.style.circle.fill,
				stroke: data.style.circle.stroke,
				radius: ( data.style.circle.radius ? data.style.circle.radius : 0 ) 
			} );
		}
		
		if( data.style.image ){
			_style.image = new ol.style.Icon( {
				src: data.style.image.icon.src
			} );
		}
		
		if( data.style.text ){
			_style.text = new ol.style.Text( {
				text: data.style.text.text,
				font: data.style.text.font,
				fill: new ol.style.Fill({
					color: data.style.text.fill.color
				})
			} );
		}

    	selectInteraction = new ol.interaction.Select({
    		layers: function(layer){
    			return layer == njMapManager.get(data.layerid).njMapLayer.getOlLayer();
    		},
    		//style: new ol.style.Style( _style ),
    		//condition: ol.events.condition.pointerMove,
    		condition: ol.events.condition.singleClick,
    		wrapX: false
		});
    	olMap.addInteraction(selectInteraction);
    	
    	snapInteraction = new ol.interaction.Snap({
    		source: njMapManager.get(data.layerid).njMapLayer.getOlLayer().getSource()
		});
    	olMap.addInteraction(snapInteraction);
    			
    	debugger;
    	
        // Set cursor style
        ol.interaction.Transform.prototype.Cursors['rotate'] = 'url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAXAgMAAACdRDwzAAAAAXNSR0IArs4c6QAAAAlQTFRF////////AAAAjvTD7AAAAAF0Uk5TAEDm2GYAAAABYktHRACIBR1IAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH2wwSEgUFmXJDjQAAAEZJREFUCNdjYMAOuCCk6goQpbp0GpRSAFKcqdNmQKgIILUoNAxIMUWFhoKosNDQBKDgVAilCqcaQBogFFNoGNjsqSgUTgAAM3ES8k912EAAAAAASUVORK5CYII=\') 5 5, auto';
        ol.interaction.Transform.prototype.Cursors['rotate0'] = 'url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/sl0p8zAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAZUlEQVR42sSTQQrAMAgEHcn/v7w9tYgNNsGW7kkI2TgbRZJ15NbU+waAAFV11MiXz0yq2sxMEiVCDDcHLeky8nQAUDJnM88IuyGOGf/n3wjcQ1zhf+xgxSS+PkXY7aQ9yvy+jccAMs9AI/bwo38AAAAASUVORK5CYII=\') 5 5, auto';
//    	
//    	transformInteraction = new ol.interaction.Transform({
//    		layers: njMapManager.get(data.layerid).njMapLayer.getOlLayer(),
//    		enableRotatedTransform: false,
//	      /* Limit interaction inside bbox * /
//	      condition: function(e, features) {
//	        return ol.extent.containsXY([-465960, 5536486, 1001630, 6514880], e.coordinate[0], e.coordinate[1]);
//	      },
//	      /* */
//	      addCondition: ol.events.condition.shiftKeyOnly,
//	      // filter: function(f,l) { return f.getGeometry().getType()==='Polygon'; },
//	      // layers: [vector],
//	      hitTolerance: 2,
//	      translateFeature: true,
//	      scale: true,
//	      rotate: true,
//	      keepAspectRatio: ol.events.condition.always,
//	      translate: true,
//	      stretch: true
//		});
//    	
//    	olMap.addInteraction(transformInteraction);
//
//    	// Style the rotate handle
//        var circle = new ol.style.RegularShape({
//          fill: new ol.style.Fill({color:[255,255,255,0.01]}),
//          stroke: new ol.style.Stroke({width:1, color:[0,0,0,0.01]}),
//          radius: 8,
//          points: 10
//        });
//        transformInteraction.setStyle ('rotate',
//          new ol.style.Style({
//            text: new ol.style.Text ({
//              text:'\uf0e2', 
//              font:"16px Fontawesome",
//              textAlign: "left",
//              fill:new ol.style.Fill({color:'red'})
//            }),
//            image: circle
//          }));
//        // Center of rotation
//        transformInteraction.setStyle ('rotate0',
//          new ol.style.Style({
//            text: new ol.style.Text ({
//              text:'\uf0e2', 
//              font:"20px Fontawesome",
//              fill: new ol.style.Fill({ color:[255,255,255,0.8] }),
//              stroke: new ol.style.Stroke({ width:2, color:'red' })
//            }),
//          }));
//        // Style the move handle
//        transformInteraction.setStyle('translate',
//          new ol.style.Style({
//            text: new ol.style.Text ({
//              text:'\uf047', 
//              font:"20px Fontawesome", 
//              fill: new ol.style.Fill({ color:[255,255,255,0.8] }),
//              stroke: new ol.style.Stroke({ width:2, color:'red' })
//            })
//          }));
//    	
//        
//        transformInteraction.on (['select'], function(e) {
//        	transformInteraction.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
//          });
//
//        transformInteraction.on (['rotatestart','translatestart'], function(e){
//            // Rotation
//            startangle = e.feature.get('angle')||0;
//            // Translation
//            d=[0,0];
//          });
//        transformInteraction.on('rotating', function (e){
//            $('#info').text("rotate: "+((e.angle*180/Math.PI -180)%360+180).toFixed(2)); 
//            // Set angle attribute to be used on style !
//            e.feature.set('angle', startangle - e.angle);
//          });
//        transformInteraction.on('translating', function (e){
//            d[0]+=e.delta[0];
//            d[1]+=e.delta[1];
//            $('#info').text("translate: "+d[0].toFixed(2)+","+d[1].toFixed(2)); 
//            if (firstPoint) {
//            	transformInteraction.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
//            }
//          });
//        transformInteraction.on('scaling', function (e){
//            $('#info').text("scale: "+e.scale[0].toFixed(2)+","+e.scale[1].toFixed(2)); 
//            if (firstPoint) {
//            	transformInteraction.setCenter(e.features.getArray()[0].getGeometry().getFirstCoordinate());
//            }
//          });
//        transformInteraction.on(['rotateend', 'translateend', 'scaleend'], function (e) {
//            $('#info').text(""); 
//          });
        
    	//*/
        
    	modifyInteraction = new ol.interaction.Modify({ 
    		//source: njMapManager.get(data.layerid).njMapLayer.getOlLayer().getSource()
    		features: selectInteraction.getFeatures()
    	});
    	olMap.addInteraction(modifyInteraction);
    	//*/
    	var dirty = {};
    	
    	selectInteraction.on("select", function(evt){
    		if(evt.selected[0]){	    		
	    		debugger;
	    		
	    		var service_url = base_url;
	    		
	    		var featureRequest = new ol.format.WFS().writeGetFeature( {
					srsName : njMap.getCRS(),
					featureTypes : [ "yesco:"+evt.selected[0].getId().split(".")[0] ],
					maxFeatures : 1,
					outputFormat : 'GML3',
					url : service_url+'/wfs?',
					featureId : evt.selected[0].getProperties()["id"]
				} );

				return $.ajax({
					type : "POST",
					contentType : "text/xml",
					dataType : "",
		            url : service_url+'/wfs',
		            data : new XMLSerializer().serializeToString( featureRequest )
		            ,success:function(result){
		            	
		            	var feature = new ol.format.WFS( {} ).readFeatures( result );
		            	
		            	var _div = $('<div class="dd feature-info" style="position: absolute;right: 60px;bottom: 50px;z-index: 5;width:300px; background-color: #f5f6f6; border: solid 1px #dcd2c8; padding: 5px 7px 5px 7px;"><div>속성정보</div><ol class="dd-list" style="overflow:auto;overflow-x:hidden;height:800px;"></ol><div><button>저장</button><button>취소</button></div></div>');
			    		var _list = _div.find('.dd-list');
			    		for( var i=0;i<feature[0].getKeys().length;i++ ){
			    			
			    			var name = feature[0].getKeys()[i];
			    			var value = feature[0].getProperties()[name];
			    			
			    			if( typeof value == 'object' ) continue;
				    		var _li = '<li class="dd-item dd3-item"><div class="dd3-content" style="font-size: 12px; font-weight: bold;">'+ name + ':' + value +'</div></li>';
				    		_list.append(_li);
			    		}
			    		_list.data(feature[0].getProperties());
			    		$(document.body).append(_div);
		            }
				});
	    		
    		}
    	});

    	selectInteraction.on('add', function(evt) {
    		debugger;
            var feature = evt.element;
            var fid = feature.getId();
            feature.on('change', function(evt) {
            	dirty[evt.target.getId()] = true;
            });
        });

    	selectInteraction.on('remove', function(evt) {
    		debugger;
            var feature = evt.element;
            var fid = feature.getId();
            if (dirty[fid]) {
            	console.log('changed');
            }
        });

    	selectInteraction.on('change:active', function(evt) {
    		debugger;
        });
    };
    
    var layerFeatureAddHandler = function(e) {	
    	
    	console.log('layerFeatureAddHandler');
    	
    	olMap.removeInteraction(selectInteraction);
    	olMap.removeInteraction(snapInteraction);
    	olMap.removeInteraction(modifyInteraction);
    	olMap.removeInteraction(drawInteraction);
    	
    	var icon_tag = $(this).find('i');
    	
    	var checked = icon_tag.hasClass('fa-eye-slash'); 	
    	/*
    	if(checked){
    		icon_tag.removeClass('fa-eye-slash');
    		icon_tag.addClass('fa-eye');
    	}else{
    		icon_tag.removeClass('fa-eye');
    		icon_tag.addClass('fa-eye-slash');        	
    	}
    	*/
    	var data = $(e.target).closest("li").data();
    	
    	snapInteraction = new ol.interaction.Snap({
    		source: njMapManager.get(data.layerid).njMapLayer.getOlLayer().getSource()
		});
    	olMap.addInteraction(snapInteraction);
    	
    	var _drawType; 
    	switch( data.geotype ){
    		case "MULTIPOLYGON" :
    			_drawType = "MultiPolygon";
    			break;
    		case "MULTILINESTRING" :
    			_drawType = "MultiLineString";
    			break;
    		case "MULTIPOINT" :
    			_drawType = "MultiPoint";
    			break;
    		default :
    			break;
    	} 
    	
    	var _style = {};
    	
    	if( data.style.fill ){
			_style.fill = new ol.style.Fill( {
				color: data.style.fill.color
			} );
		}
		
		if( data.style.stroke ){
			_style.stroke = new ol.style.Stroke( {
				color: data.style.stroke.color,
				width: data.style.stroke.width,
			} );
		}
		
		if( data.style.circle ){
			_style.image = new ol.style.Circle( {
				fill: data.style.circle.fill,
				stroke: data.style.circle.stroke,
				radius: ( data.style.circle.radius ? data.style.circle.radius : 0 ) 
			} );
		}
		
		if( data.style.image ){
			_style.image = new ol.style.Icon( {
				src: data.style.image.icon.src
			} );
		}
		
		if( data.style.text ){
			_style.text = new ol.style.Text( {
				text: data.style.text.text,
				font: data.style.text.font,
				fill: new ol.style.Fill({
					color: data.style.text.fill.color
				})
			} );
		}
    	
    	drawInteraction = new ol.interaction.Draw({
    		source: njMapManager.get(data.layerid).njMapLayer.getOlLayer().getSource()
    		, type: _drawType
    		, style: new ol.style.Style( _style )
    	});
    	olMap.addInteraction(drawInteraction);
    };
    
    var pointDrawFeatureHandler = function(e) {
    	e.stopPropagation();
    	
    	var _this = $(this);
    	changeActiveClass(_this);
    	
    	_this.parent().find("button").each(function(i, v){
    		if(_this[0] != v && $(v).hasClass("active")){
    			$(v).removeClass("active");
    		}
    	});
    	
    	pointDrawController.setActive(false);
    	lineDrawController.setActive(false);
    	polygonDrawController.setActive(false);
    	circleDrawController.setActive(false);
    	squareDrawController.setActive(false);
    	textDrawController.setActive(false);
    	
    	if($(this).hasClass("active")){
    		pointDrawController.setActive(true);
    	}
	};
	
	var lineDrawFeatureHandler = function(e) {
		e.stopPropagation();
    	
		var _this = $(this);
    	changeActiveClass(_this);
    	
    	_this.parent().find("button").each(function(i, v){
    		if(_this[0] != v && $(v).hasClass("active")){
    			$(v).removeClass("active");
    		}
    	});
		
		pointDrawController.setActive(false);
    	lineDrawController.setActive(false);
    	polygonDrawController.setActive(false);
    	circleDrawController.setActive(false);
    	squareDrawController.setActive(false);
    	textDrawController.setActive(false);
    	
    	if(_this.hasClass("active")){
    		lineDrawController.setActive(true);
    	}
	};
	
	
	var polygonDrawFeatureHandler = function(e) {
		e.stopPropagation();
    	
		var _this = $(this);
    	changeActiveClass(_this);
    	
    	_this.parent().find("button").each(function(i, v){
    		if(_this[0] != v && $(v).hasClass("active")){
    			$(v).removeClass("active");
    		}
    	});
    	
		pointDrawController.setActive(false);
    	lineDrawController.setActive(false);
    	polygonDrawController.setActive(false);
    	circleDrawController.setActive(false);
    	squareDrawController.setActive(false);
    	textDrawController.setActive(false);
    	
		if(_this.hasClass("active")){
			polygonDrawController.setActive(true);
    	}
	};
    
	
	var circleDrawFeatureHandler = function(e) {
		e.stopPropagation();
    	
		var _this = $(this);
    	changeActiveClass(_this);
    	
    	_this.parent().find("button").each(function(i, v){
    		if(_this[0] != v && $(v).hasClass("active")){
    			$(v).removeClass("active");
    		}
    	});
    	
		pointDrawController.setActive(false);
    	lineDrawController.setActive(false);
    	polygonDrawController.setActive(false);
    	circleDrawController.setActive(false);
    	squareDrawController.setActive(false);
    	textDrawController.setActive(false);
    	
		if(_this.hasClass("active")){
			circleDrawController.setActive(true);
    	}
	};
	
	var squareDrawFeatureHandler = function(e) {
		e.stopPropagation();
    	
		var _this = $(this);
    	changeActiveClass(_this);
    	
    	_this.parent().find("button").each(function(i, v){
    		if(_this[0] != v && $(v).hasClass("active")){
    			$(v).removeClass("active");
    		}
    	});
    	
		pointDrawController.setActive(false);
    	lineDrawController.setActive(false);
    	polygonDrawController.setActive(false);
    	circleDrawController.setActive(false);
    	squareDrawController.setActive(false);
    	textDrawController.setActive(false);
    	
		if(_this.hasClass("active")){
			squareDrawController.setActive(true);
    	}
	};
	
	var textDrawFeatureHandler = function(e) {
		e.stopPropagation();
    	
		var _this = $(this);
    	changeActiveClass(_this);
    	
    	_this.parent().find("button").each(function(i, v){
    		if(_this[0] != v && $(v).hasClass("active")){
    			$(v).removeClass("active");
    		}
    	});
    	
		pointDrawController.setActive(false);
    	lineDrawController.setActive(false);
    	polygonDrawController.setActive(false);
    	circleDrawController.setActive(false);
    	squareDrawController.setActive(false);
    	textDrawController.setActive(false);
    	
		if(_this.hasClass("active")){
			textDrawController.setActive(true);
    	}
	};
	
    var createVwsearchTotalTag = function(response, max_count){    	
    		
    	var list = $('<div class="search_items"/>');
    	
    	for(var k in response.result.items) {
    		
    		if(k < max_count){
    			
    			var item = response.result.items[k];  
    			
    			var row = $('<div class="search_item" ></div>');  
    			
    			if(item.title){
    				row.append('<div class="title">'+item.title+'</div>');
    			}
    			if(item.category){
    				row.append('<div class="category" >'+item.category+'</div>');
    			}
    			
    			if(item.address){
    				if(item.address.parcel){
    					row.append('<div class="address" ><span class="label label-primary">지번</span>'+item.address.parcel+'</div>');
    				}
    				
    				if(item.address.road){
    					row.append('<div class="address" ><span class="label label-warning">도로명</span>'+item.address.road+'</div>');
    				}
    			}
    			
    			row.data(item);
    			
    			list.append(row);
    		}
		}
    	
    	return list;
    }
    
    var createVwsearchRoadTag = function(response, max_count){   
    	var list = $('<div class="search_items"/>');
    	
    	for(var k in response.result.items) {
    		
    		if(k < max_count){
    			
    			var item = response.result.items[k];   
    			
    			var row = $('<div class="search_item" ></div>');  
    			row.append('<div class="title">'+'('+item.address.zipcode+')'+item.address.road+'</div>');
    			
    			row.data(item);
    			
    			list.append(row);
    		}
		}
    	
    	return list;
       
    }
    
    var createVwsearchNumTag = function(response, max_count){     	
    	
    	var list = $('<div class="search_items"/>');
    	
    	for(var k in response.result.items) {
    		
    		if(k < max_count){
    			
    			var item = response.result.items[k];  
    			
    			var row = $('<div class="search_item" ></div>');  
    			row.append('<div class="title">'+item.address.parcel+'</div>');
    			
    			row.data(item);
    			
    			list.append(row);
    		}
		}
    	
    	return list;
        	
    }
    
    var createKakaosearchTotalTag = function(response, max_count){    	
		
    	var list = $('<div class="search_items" style="height:350px;overflow:auto;overflow-x:hidden;overflow-y:scroll" />');
    	
    	for(var k in response) {
    		
    		if(k < max_count){
    			
    			var item = response[k];  
    			
    			var row = $('<div class="search_item"></div>');  
    			
    			if(item.place_name){
    				row.append('<div class="title">'+item.place_name+'</div>');
    			}
    			if(item.category_name){
    				row.append('<div class="category" >'+item.category_name+'</div>');
    			}
    			
				if(item.address_name){
					row.append('<div class="address" ><span class="label label-primary">지번</span>'+item.address_name+'</div>');
				}
				
				if(item.road_address_name){
					row.append('<div class="address" ><span class="label label-warning">도로명</span>'+item.road_address_name+'</div>');
				}
    			
    			row.data(item);
    			
    			list.append(row);
    		}
		}
    	
    	return list;
    }
    
    
    var vwsearchCallHandler = function(e) {
    	
    	 if(e.which == 13 || $(this).attr('name') == "vw_search_refresh") {    		 
    		 $('#vw_search_total .name .search_items').empty();
			 $('#vw_search_name .search_items').empty();
			 $('#vw_search_total .road .search_items').empty();
			 $('#vw_search_road .search_items').empty();
			 $('#vw_search_total .num .search_items').empty();
			 $('#vw_search_num .search_items').empty();
	    	
	    	var vw_link_url = 'http://api.vworld.kr/req/search';    	
	    	
	    	$.ajax({
				url: vw_link_url,
				method: 'get',
				crossDomain: true,
			    dataType: 'jsonp',
				data: {
					key : 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94',
					query : $(".control-contents-box1 input").val(),
					request : 'search',
					size : 5,
					page : 1,
					type : 'PLACE',
				},
			})
			.done(function (result) {
				
				if(result.response.status !="NOT_FOUND" && result.response){
					$('#vw_search_total .name .count').text(result.response.record.total.replace(/\B(?=(\d{3})+(?!\d))/g, ","));	
					$('#vw_search_name .count').text(result.response.record.total.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
					$('#vw_search_total .name .search_items').append(createVwsearchTotalTag(result.response,3));
					$('#vw_search_name .search_items').append(createVwsearchTotalTag(result.response,5));
					
					console.log( result.response.page);
					
					$('#vw_search_name [name=paginatior]').show();
					$('#vw_search_name [name=paginatior]').bootpag({			         
			            total: Math.ceil(Number(result.response.record.total) / 5),          	            
			            maxVisible: 3,     // visible pagination
			            page  : 1,
			            leaps: true,
			            href: "javascript:void(0)",
			            firstLastUse : true,		           
			        }).on("page", function(event, /* page number here */ num){
			        	$.ajax({
							url: vw_link_url,
							method: 'get',
							crossDomain: true,
						    dataType: 'jsonp',
							data: {
								key : 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94',
								query : $('.control-contents-box1 input').val(),
								request : 'search',
								size : 5,
								page : num,
								type : 'PLACE',
							},
						})
						.done(function (result) {							
							$('#vw_search_name .search_items').empty();
							$('#vw_search_name .search_items').append(createVwsearchTotalTag(result.response,5));
							
						});
			        });
					
				}else{
					$('#vw_search_name .search_items').empty();
					$('#vw_search_total .name .count').text('0');
					$('#vw_search_name .count').text('0');
					$('#vw_search_total .name .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>');  
					$('#vw_search_name .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>'); 
					$('#vw_search_name [name=paginatior]').hide();
				}
			});
	    	
	    	$.ajax({
				url: vw_link_url,
				method: 'get',
				crossDomain: true,
			    dataType: 'jsonp',
				data: {
					key : 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94',
					query : $(".control-contents-box1 input").val(),
					request : 'search',
					size : 5,
					page : 1,
					type : 'ADDRESS',
					category : 'ROAD',
				},
			})
			.done(function (result) {				
				if(result.response.status !="NOT_FOUND" && result.response.result.items){
					$('#vw_search_total .road .count').text(result.response.record.total.replace(/\B(?=(\d{3})+(?!\d))/g, ","));	
					$('#vw_search_road .count').text(result.response.record.total.replace(/\B(?=(\d{3})+(?!\d))/g, ","));					
					$('#vw_search_total .road .search_items').append(createVwsearchTotalTag(result.response,3));
					$('#vw_search_road .search_items').append(createVwsearchTotalTag(result.response,5));
					
					$('#vw_search_road [name=paginatior]').show();
					$('#vw_search_road [name=paginatior]').bootpag({			         
					 	total: Math.ceil(Number(result.response.record.total) / 5),          	            
						maxVisible: 3,     // visible pagination
						page  : 1,
						leaps: true,
						href: "javascript:void(0)",
						firstLastUse : true,		     
			        }).on("page", function(event, /* page number here */ num){

				    	$.ajax({
							url: vw_link_url,
							method: 'get',
							crossDomain: true,
						    dataType: 'jsonp',
							data: {
								key : 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94',
								query : $('.control-contents-box1 input').val(),
								request : 'search',
								size : 5,
								page : num,
								type : 'ADDRESS',
								category : 'ROAD',
							},
						})
						.done(function (result) {	
							$('#vw_search_road .search_items').empty();
							$('#vw_search_road .search_items').append(createVwsearchTotalTag(result.response,5));
						});
			        });
					
				}else{
					$('#vw_search_road .search_items').empty();
					$('#vw_search_total .road .count').text('0');
					$('#vw_search_road .count').text('0');
					$('#vw_search_total .road .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>'); 
					$('#vw_search_road .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>'); 
					
					$('#vw_search_road [name=paginatior]').hide();
				}
				
			});
	    	
	    	$.ajax({
				url: vw_link_url,
				method: 'get',
				crossDomain: true,
			    dataType: 'jsonp',
				data: {
					key : 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94',
					query : $(".control-contents-box1 input").val(),
					request : 'search',
					size : 5,
					page : 1,
					type : 'ADDRESS',
					category : 'PARCEL',					
				},
			})
			.done(function (result) {
				
				
				if(result.response.status !="NOT_FOUND" &&  result.response.result.items){
					$('#vw_search_total .num .count').text(result.response.record.total.replace(/\B(?=(\d{3})+(?!\d))/g, ","));	
					$('#vw_search_num .count').text(result.response.record.total.replace(/\B(?=(\d{3})+(?!\d))/g, ","));					
					$('#vw_search_total .num .search_items').append(createVwsearchTotalTag(result.response,3));
					$('#vw_search_num .search_items').append(createVwsearchTotalTag(result.response,5));
					$('#vw_search_num [name=paginatior]').show();
					$('#vw_search_num [name=paginatior]').bootpag({			         
						total: Math.ceil(Number(result.response.record.total) / 5),          	            
						maxVisible: 3,     // visible pagination
						page  : 1,
						leaps: true,
						href: "javascript:void(0)",
						firstLastUse : true,		
			        }).on("page", function(event, /* page number here */ num){
			        	$.ajax({
							url: vw_link_url,
							method: 'get',
							crossDomain: true,
						    dataType: 'jsonp',
							data: {
								key : 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94',
								query : $('.control-contents-box1 input').val(),
								request : 'search',
								size : 5,
								page : num,
								type : 'ADDRESS',
								category : 'PARCEL',					
							},
						})
						.done(function (result) {							
							$('#vw_search_num .search_items').empty();
							$('#vw_search_num .search_items').append(createVwsearchTotalTag(result.response,5));
							
						});
			        });
					
				}else{
					$('#vw_search_num .search_items').empty();
					$('#vw_search_total .num .count').text('0');
					$('#vw_search_num .count').text('0');
					$('#vw_search_total .num .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>'); 
					$('#vw_search_num .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>'); 
					
					$('#vw_search_num [name=paginatior]').hide();
				}
				
			});
	    	
	    	/*var vw_link_load = 	'http://api.vworld.kr/req/search?key=A782B1B4-5C6A-3D0A-A322-A3E4EE190B94&query=%EC%82%BC%EC%84%B1%EC%97%AD&request=search&size=10&type=ADDRESS&category=ROAD';
	    	var vw_link_num = 	'http://api.vworld.kr/req/search?key=A782B1B4-5C6A-3D0A-A322-A3E4EE190B94&query=74-1&request=search&size=10&type=ADDRESS&category=PARCEL';
	    	
	    	
	    	var name_data = [{"id" : "AA0002138355", "title" : "삼성역", "category" : "교통시설 > 철도/지하철 > 일반철도", "address" : {"road" : "경상북도 경산시 삼성역길 64-23", "parcel" : "경상북도 경산시 남천면 삼성리 531"}, "point" : {"x" : "128.722849750381", "y" : "35.7630455805992"}}, {"id" : "AA0003172622", "title" : "삼성역", "category" : "교통시설 > 철도/지하철 > 지하철", "address" : {"road" : "서울특별시 강남구 테헤란로 538", "parcel" : "서울특별시 강남구 삼성동 172-66"}, "point" : {"x" : "127.063596201247", "y" : "37.5090695013223"}}, {"id" : "AA0002341545", "title" : "삼성역", "category" : "도로시설 > 차량용도로시설 > 교차로", "address" : {"road" : "서울특별시 강남구", "parcel" : "서울특별시 강남구 삼성동 172-66"}, "point" : {"x" : "127.063213485444", "y" : "37.5088192847586"}}, {"id" : "AA0000555402", "title" : "국민은행삼성역지점", "category" : "서비스산업 > 금융/보험업 > 일반은행", "address" : {"road" : "서울특별시 강남구 테헤란로 518", "parcel" : "서울특별시 강남구 대치동 944-31"}, "point" : {"x" : "127.060579380623", "y" : "37.5075911180913"}}, {"id" : "AA0000556204", "title" : "KEB하나은행삼성역지점(구.외환)", "category" : "서비스산업 > 금융/보험업 > 일반은행", "address" : {"road" : "서울특별시 강남구 테헤란로 534", "parcel" : "서울특별시 강남구 대치동 946-1"}, "point" : {"x" : "127.062795653313", "y" : "37.5080381512671"}}, {"id" : "AA0003172829", "title" : "빌리엔젤케이크(BILLYANGELCAKECO.)삼성역오토웨이점", "category" : "음식점 > 디저트 > 빵집/베이커리", "address" : {"road" : "서울특별시 강남구 영동대로 417", "parcel" : "서울특별시 강남구 대치동 948번지"}, "point" : {"x" : "127.063310999681", "y" : "37.5065100002665"}}, {"id" : "AA0000554465", "title" : "기업은행삼성역지점", "category" : "서비스산업 > 금융/보험업 > 일반은행", "address" : {"road" : "서울특별시 강남구 테헤란로 625", "parcel" : "서울특별시 강남구 삼성동 170-9"}, "point" : {"x" : "127.066048988717", "y" : "37.510150373808"}}, {"id" : "AA0002179594", "title" : "삼성역(무역센터)", "category" : "교통시설 > 철도/지하철 > 지하철", "address" : {"road" : "서울특별시 강남구 테헤란로 538", "parcel" : "서울특별시 강남구 삼성동 172-66"}, "point" : {"x" : "127.063022113471", "y" : "37.5088321369866"}}, {"id" : "AA0002669124", "title" : "삼성역길", "category" : "선형교통 > 선형도로 > 미분류", "address" : {"road" : "경상북도 경산시", "parcel" : "경상북도 경산시"}, "point" : {"x" : "128.721009331536", "y" : "35.7544608429766"}}, {"id" : "AA0002830221", "title" : "삼성역길", "category" : "선형교통 > 선형도로 > 미분류", "address" : {"road" : "경상북도 경산시", "parcel" : "경상북도 경산시"}, "point" : {"x" : "128.727727185089", "y" : "35.7658010441871"}}];
			
			var load_data = [{"id" : "4729037026105310000", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 64-23", "parcel" : "남천면 531", "bldnm" : "삼성역"}, "point" : {"x" : "128.722683703", "y" : "35.763189142"}}, {"id" : "1168010500101720066", "address" : {"zipcode" : "06181", "category" : "ROAD", "road" : "서울특별시 강남구 테헤란로 538 (삼성동)", "parcel" : "삼성동 172-66", "bldnm" : "삼성역"}, "point" : {"x" : "127.063070036", "y" : "37.508861914"}}, {"id" : "1168010500101580004", "address" : {"zipcode" : "06169", "category" : "ROAD", "road" : "서울특별시 강남구 테헤란로83길 14 (삼성동)", "parcel" : "삼성동 158-4", "bldnm" : "삼성역 두산위브센티움"}, "point" : {"x" : "127.057822279", "y" : "37.508470238"}}, {"id" : "4729037026102240001", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 10", "parcel" : "남천면 224-1", "bldnm" : ""}, "point" : {"x" : "128.726788354", "y" : "35.765524127"}}, {"id" : "4729037026107000000", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 108", "parcel" : "남천면 700", "bldnm" : ""}, "point" : {"x" : "128.724142576", "y" : "35.758786662"}}, {"id" : "4729037026107000001", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 112", "parcel" : "남천면 700-1", "bldnm" : ""}, "point" : {"x" : "128.723727768", "y" : "35.757810319"}}, {"id" : "4729037026107000001", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 112", "parcel" : "남천면 700-1", "bldnm" : ""}, "point" : {"x" : "128.723784459", "y" : "35.757939701"}}, {"id" : "4729037026107000001", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 112", "parcel" : "남천면 700-1", "bldnm" : ""}, "point" : {"x" : "128.723703978", "y" : "35.757709363"}}, {"id" : "4729037026106990002", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 117", "parcel" : "남천면 699-2", "bldnm" : ""}, "point" : {"x" : "128.724047793", "y" : "35.757859279"}}, {"id" : "4729037026106990002", "address" : {"zipcode" : "38695", "category" : "ROAD", "road" : "경상북도 경산시 남천면 삼성역길 117", "parcel" : "남천면 699-2", "bldnm" : ""}, "point" : {"x" : "128.723875177", "y" : "35.757602594"}}];
			
			var num_data = [{"id" : "4215034030200740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 강동면 산성우리 산 74-1"}, "point" : {"x" : "129.016709826324", "y" : "37.6472139506037"}}, {"id" : "4215034021100740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 강동면 상시동리 74-1"}, "point" : {"x" : "128.951203212745", "y" : "37.7219271338597"}}, {"id" : "4215034021200740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 강동면 상시동리 산 74-1"}, "point" : {"x" : "128.958791812883", "y" : "37.7270217290649"}}, {"id" : "4215034024100740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 강동면 안인진리 74-1"}, "point" : {"x" : "128.987005980797", "y" : "37.7355165505951"}}, {"id" : "4215034028100740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 강동면 정동진리 74-1"}, "point" : {"x" : "129.025721123651", "y" : "37.6815160733615"}}, {"id" : "4215011500100740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 견소동 74-1"}, "point" : {"x" : "128.947610617218", "y" : "37.7711456881165"}}, {"id" : "4215033023200740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 구정면 구정리 산 74-1"}, "point" : {"x" : "128.871993589686", "y" : "37.7022166075659"}}, {"id" : "4215033026100740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 구정면 덕현리 74-1"}, "point" : {"x" : "128.933509437969", "y" : "37.7150197517945"}}, {"id" : "4215033026200740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 구정면 덕현리 산 74-1"}, "point" : {"x" : "128.934336562792", "y" : "37.7177431031664"}}, {"id" : "4215033027100740001", "address" : {"zipcode" : "", "category" : "PARCEL", "road" : "", "parcel" : "강원도 강릉시 구정면 제비리 74-1"}, "point" : {"x" : "128.859009585656", "y" : "37.7296267401005"}}];
			*/
    	 }
    };
    
    var kakaosearchCallHandler = function(e) {
    	
    	if(e.which == 13 || $(this).attr('name') == "kakao_search_refresh") {    		 
    		$('#kakao_search_total .name .search_items').empty();
   		 
   		 	var kakao_link_url = 'https://dapi.kakao.com/v2/local/search/keyword.json';
   		 	
	   		 $.ajax({
	   			url : kakao_link_url,
	   			headers : { 'Authorization' : 'KakaoAK ' + window.kakaoRestKey },
	   			type: 'GET',
	   			crossDomain: true,
	   			data : { query : $(".control-contents-box1 input").val(), size: 15, page: 1 }
	   		}).done(function(result){
	   			if(result.documents.length != 0 ){ // 값이 있으면
	   				$('#kakao_search_total .name .count').text(result.meta.total_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
					$('#kakao_search_total .name .search_items').append(createKakaosearchTotalTag(result.documents,15));
					console.log( result.meta );
					
					$('#kakao_search_total [name=paginatior]').show();
					$('#kakao_search_total [name=paginatior]').bootpag({			         
			            total: Math.ceil(result.meta.total_count / 15),     	            
			            maxVisible: 3,     // visible pagination
			            page  : 1,
			            leaps: true,
			            href: "javascript:void(0)",
			            firstLastUse : true,		           
			        }).on("page", function(event, num){
			        	$.ajax({
			        		url : kakao_link_url,
				   			headers : { 'Authorization' : 'KakaoAK 7e17129ea66c697bed390e22832349d8' },
				   			type: 'GET',
							crossDomain: true,
							data: {
								query : $('.control-contents-box1 input').val(),
								size : 15,
								page : num
							},
						})
						.done(function (result) {							
							$('#kakao_search_total .name .search_items').empty();
							$('#kakao_search_total .name .search_items').append(createKakaosearchTotalTag(result.documents,15));
						});
			        });
	   			}else{
					$('#kakao_search_total .name .search_items').empty();
					$('#kakao_search_total .name .count').text('0');
					$('#kakao_search_total .name .search_items').append('<div class="search_item" ><div class="address_link">데이터가 없습니다.</div></div>');   
					$('#kakao_search_total [name=paginatior]').hide();
				}
	   			
	   		});
   	 	}
   };
    
    var vwsearchHandler = function(e) {	
    	
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
		var _this = $(this).parent();
	
		changeActiveClass(_this);		
		
		_this.find('.control-contents-box1').toggle();		
	} 
    
    var kakaosearchHandler = function(e) {	
    	
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
		var _this = $(this).parent();
	
		changeActiveClass(_this);		
		
		_this.find('.control-contents-box1').toggle();		
	}
    
    var bookHandler = function(e) {	
    	
    	info.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
		var _this = $(this).parent();
	
		changeActiveClass(_this); 
		_this.find('.control-contents-box').remove();
    	
		var _div = $('<div class="control-contents-box book-list"/>');
		var _ul = $('<ul/>');
		
		book.data.forEach(function(v,i){
			
			var _li = $('<li/>');			
			var contents = '<label class="label text-left">';
			contents += v.title;
			contents += '</label>';
			
			_li.append(contents);
			
			_li.data(v);
			
			_ul.append(_li);
		});				
		
		_div.append(_ul);		 	

		$(book_controller_btn).append(_div);
	} 
    
    var bookMoveHandler = function(e) {	
    	var item_data =$(this).data();				
		var extent = item_data.extent.split(',').map(Number);	
		var book_proj = item_data.proj;			
		
		//좌표계가 서로 다를 경우
		var cur_proj =  olMap.getView().getProjection().getCode();
		
		if(cur_proj !==book_proj){
			extent = ol.proj.transformExtent(extent,book_proj,cur_proj);			
		}	
		
		olMap.getView().fit(extent, olMap.getSize());	
		
    };
    
    var vworldMoveHandler = function(e) {	
    	var item_data =$(this).data().point;
    	
    	if(item_data){
    		var point = [Number(item_data.x) , Number(item_data.y)];
    		
    		//좌표계가 서로 다를 경우
    		var cur_proj =  olMap.getView().getProjection().getCode();
    		
    		if(cur_proj !=='EPSG:4326'){			
    			point = ol.proj.transform(point, 'EPSG:4326',cur_proj);		
    		}	
    		
    		if(vwsearch.event && point){
    			vwsearch.event(point,$(this).data());
    		}		
    	}		
    };
    
    var kakaoMoveHandler = function(e) {
    	var item_data =$(this).data();
    	
    	if(item_data){
    		var point = [Number(item_data.x) , Number(item_data.y)];
    		
    		//좌표계가 서로 다를 경우
    		var cur_proj =  olMap.getView().getProjection().getCode();
    		
    		if(cur_proj !=='EPSG:4326'){			
    			point = ol.proj.transform(point, 'EPSG:4326',cur_proj);		
    		}	

    		if(kakaosearch.event && point){
    			kakaosearch.event(point,$(this).data());
    		}		
    	}		
    };
    
    var directionsHandler = function(e) {
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
    	changeActiveClass($(this));    	
    	
    	$(this).parent().find('div:first').toggle(); 	
	};
	
	var directionsFocusHandler = function(e){
		console.log(e)
		
		if(e.type === "focusin"){
			
		}else if(e.type === "focusout"){
			if(e.relatedTarget == null) $(e.target.parentElement.parentElement.parentElement.children[1]).hide();
		}
	};
	
	var directionsSearchCallHandler = function(e){
		//var url = "https://map.naver.com/v5/api/instantSearch?lang=ko&caller=pcweb&types=place,address&coords=37.487424611962794,126.93125009536743&query=%EA%B2%BD%EA%B8%B0%EB%8F%84";
		
		if( e.target.value === "" ){
			$(e.target.labels[0]).show();

			return;
		}else{
			$(e.target.labels[0]).hide();
		}
		
		if ( e.keyCode == 27 || e.which == 27 ) {
			$(".control-directions").find(".directions-search-box-instant-search").hide();
	        return;
	    }
		
		var search_url = "https://map.naver.com/v5/api/instantSearch?lang=ko";
		
		var coords = olMap.getView().getCenter();
		
		var search_coords = ol.proj.transform(coords, njMap.getCRS(), "EPSG:4326");
		
		$.ajax({
			url: naji.njMapConfig.getProxy() + search_url,
			method: 'get',
			//crossDomain: true,
		    //dataType: 'jsonp',
			data: {
				caller : 'pcweb',
				types : 'place,address',
				coords : search_coords.reverse().join(","),
				query : e.target.value 
			}
		})
		.done(function (result) {
			var list = result.place;
			
			var searchResultEl = e.target.parentElement.parentElement.parentElement.children[1];
			
			$(".control-directions").find("ul.list_place").html("");
			$(".control-directions").find(".directions-search-box-instant-search").css("display", "none");
			
			for(var i=0;i<list.length;i++){
				var place = list[i];
				
				var li = "<li class=\"item_place ng-star-inserted\" style=\"list-style: none;\">" +
					"<a href=\"#\" preventdefault=\"\" class=\"link_place\" style=\"padding-left: 10px;display: block;padding: 7px 20px;\">" +
						"<span class=\"icon_box place\" style=\"float: left;margin: -2px 4px 0 0;margin-right: 4px;\">" +
							"<span class=\"blind ng-star-inserted\" style=\"position: absolute;width: 1px;height: 1px;overflow: hidden;clip: rect(0 0 0 0);font-size: 1px;color: transparent;\">장소</span>" +
						"</span>" +
						"<div class=\"place_box\" style=\"overflow: hidden;\">" +
							"<div class=\"place_text_box ng-star-inserted\" style=\"overflow: hidden;padding: 4px 0;text-overflow: ellipsis;white-space: nowrap;font-size: 12px;letter-spacing: -.4px;line-height: 13px;color: #767676;\">" +
								//"<span class=\"place_category ng-star-inserted\">원목가구</span>" +
								"<span class=\"place_text\" style=\"font-size: 14px;color: #333;vertical-align: top;white-space: nowrap;font-size: 12px;letter-spacing: -.4px;\">"+place.title+"</span>" +
							"</div>" +
							"<div class=\"place_text_box sub ng-star-inserted\" style=\"padding: 4px 0 0;overflow: hidden;padding: 4px 0;text-overflow: ellipsis;white-space: nowrap;font-size: 12px;letter-spacing: -.4px;line-height: 13px;color: #767676;\">" +
								"<span class=\"place_text sub\" style=\"font-size: 14px;color: #333;vertical-align: top;white-space: nowrap;font-size: 12px;letter-spacing: -.4px;\">"+place.jibunAddress+"</span>" +
							"</div>" +
						"</div>" +
					"</a>" +
					"<button type=\"button\" class=\"btn_delete\">삭제 </button>" +
				"</li>";
				
				$(searchResultEl).find("ul").append(li);
				
				$($(searchResultEl).find("ul")[0].children[i]).data("info", place);
			}
			
			if(list.length > 0){
				searchResultEl.style.display = "block";
				
				$($(searchResultEl).find("ul")[0].children).on("click", function(e){
					e.preventDefault();
					
					var info = $(e.currentTarget).data("info");
					
					var el = e.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement; 
					
					$(el).data("info", info);
					
					$(el).find("div:first input")[0].value = info.title;
					
					$(el.children[1]).hide();
					
					if( el.className.replace("search_inner ", "") === "start" ) directions.start = info;
					else if( el.className.replace("search_inner ", "") === "end" ) directions.goal = info;
					else directions.via.push(info);
				});
			}
		});
	};
    
    var directionsCallHandler = function(e) {
    	//https://map.naver.com/v5/api/dir/findcar?start=126.9707021,37.554073&goal=129.0422136,35.1152199&output=json&crs=EPSG:4326&rptype=4&cartype=1&fueltype=1&mileage=10.5&mainoption=traoptimal,avoidhipassonly&lang=ko
   	 	var find_url = "https://map.naver.com/v5/api/dir/findcar?lang=ko";
   	 	
   	 	if(directions.start == null || directions.goal == null) return;
   	 	
   	 	var findData = {
   	 		start: directions.start.x + "," + directions.start.y,
   	 		goal: directions.goal.x + "," + directions.goal.y,
   	 		output: "json",
   	 		crs: "EPSG:4326",
   	 		rptype: 4,
   	 		cartype: 1,
   	 		fueltype: 1,
   	 		mileage: 10.5,
   	 		mainoption: "traoptimal,avoidhipassonly"
   	 	};
   	 	
   	 	directions.clear();
   	 	
   	 	$(".control-directions").find(".search-box.result").html("");
   	 	$(".control-directions").find(".search-box.result").hide();
   	 	
   	 	if(directions.via.length > 0){
   	 		for(var i=0;i<directions.via.length;i++){
   	 			if(directions.via[i].x != undefined && directions.via[i].y != undefined){
		   	 		if( findData.via == undefined ){
		   	 			findData.via = directions.via[i].x + "," + directions.via[i].y
		   	 		}else{
		   	 			findData.via += ":" + directions.via[i].x + "," + directions.via[i].y
		   	 		}
   	 			}
   	 		}
   	 	}
   	 	
   	 	$.ajax({
			url: naji.njMapConfig.getProxy() + find_url,
			method: 'get',
			//crossDomain: true,
		    //dataType: 'jsonp',
			data: findData
		})
		.done(function (result) {

			var data = JSON.parse(result);
			
			for(var i in data.route){
				var routeData = data.route[i][0];

				var path = [];
				for(var j=0;j<routeData.path.length;j++){
					path.push(ol.proj.transform(routeData.path[j], "EPSG:4326", njMap.getCRS()));
				}
				var feature = new ol.Feature({
			        geometry: new ol.geom.LineString(path)
			    });
				
				var startFeature = new ol.Feature({
			        geometry: new ol.geom.Point(ol.proj.transform([parseFloat(directions.start.x), parseFloat(directions.start.y)], "EPSG:4326", njMap.getCRS()))
			    });
				
				startFeature.setStyle(
					new ol.style.Style({
						image: new ol.style.Icon({
							size : [30, 40],
							offset : [0, 0],
							scale : 1,
							opacity : 0.8,
							src : '/images/directions_icon.png'
						})
					})
				);
				
				directions.vectorLayer.getSource().addFeature(startFeature);
				
				var endFeature = new ol.Feature({
			        geometry: new ol.geom.Point(ol.proj.transform([parseFloat(directions.goal.x), parseFloat(directions.goal.y)], "EPSG:4326", njMap.getCRS()))
			    });
				
				endFeature.setStyle(
					new ol.style.Style({
						image: new ol.style.Icon({
							size : [30, 40],
							offset : [30, 0],
							scale : 1,
							opacity : 0.8,
							src : '/images/directions_icon.png'
						})
					})
				);
				
				directions.vectorLayer.getSource().addFeature(endFeature);
				
				var n = 0;
				for(var k=0;k<directions.via.length;k++){
					if(directions.via[k].x != undefined && directions.via[k].y != undefined){
						var viaFeature = new ol.Feature({
					        geometry: new ol.geom.Point(ol.proj.transform([parseFloat(directions.via[k].x), parseFloat(directions.via[k].y)], "EPSG:4326", njMap.getCRS()))
					    });
						
						viaFeature.setStyle(
							new ol.style.Style({
								image: new ol.style.Icon({
									size : [30, 40],
									offset : [(2+n) * 30, 0],
									scale : 1,
									opacity : 0.8,
									src : '/images/directions_icon.png'
								})
							})
						);
						 
						directions.vectorLayer.getSource().addFeature(viaFeature);
						
						n++;
					}
				}
				console.log(routeData);
				directions.draw(feature);
				
				var msToTime = function(duration) {
					var resultTime = "";
					var milliseconds = parseInt((duration % 1000) / 100),
						seconds = Math.floor((duration / 1000) % 60),
						minutes = Math.floor((duration / (1000 * 60)) % 60),
						hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
				
					hours = (hours < 10) ? "0" + hours : hours;
					minutes = (minutes < 10) ? "0" + minutes : minutes;
					seconds = (seconds < 10) ? "0" + seconds : seconds;
				
					if( hours != "00" ) resultTime += hours + "시간 ";
					if( minutes != "00" ) resultTime += minutes + "분";
					
					if( hours == "00" && minutes == "00" ) resultTime += "01분";
					
					return resultTime;
				};
				
				var distanceToLength = function(distance) {
					var resultLength = "";
					var kilometer = parseFloat(distance / 1000).toFixed(1);
				
					if( kilometer > 1 ) resultLength += kilometer + "km";
					else resultLength += distance + "m";
					
					return resultLength;
				};
				
				var resultHTML = "<div class=\"scroll_inner\" style=\"position: relative;width: 100%;height: 100%;overflow-y: auto;overflow-x: hidden;border-top: 1px solid #ddd;background:#fff;\">" +
					"<div class=\"summary_area type_car\" style=\"position: relative;padding: 22px 20px 20px 12px;font-size: 13px;color: #767676;line-height: 16px;overflow: visible;\">" +
						"<strong class=\"summary_duration\" style=\"margin-right: 6px;font-size: 24px;font-weight: 600;color: #111;letter-spacing: -1px;line-height: 1;\">" + msToTime(routeData.summary.duration) + "</strong>" +
						//"<span class=\"summary_option\" style=\"font-weight: 500;font-size: 13px;color: #767676;line-height: 16px;\">추천</span>" +
						"<span class=\"summary_distance\" style=\"margin-top: 10px;\">" + distanceToLength(routeData.summary.distance) + "</span>" +
						"<div class=\"route_box\" style=\"padding-top: 5px\">" +
							"<ul class=\"list_fee\" style=\"list-style: none;display: flex;padding: 0px;\">" +
								"<li class=\"item_fee ng-star-inserted\" style=\"padding-right: 10px\"> 통행료 <span class=\"value\">" + routeData.summary.tollFare.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원 </span></li>" +
								"<li class=\"item_fee ng-star-inserted\" style=\"padding-right: 10px\"> 주유비 <span class=\"value\">" + routeData.summary.fuelPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원 </span></li>" +
								"<li class=\"item_fee ng-star-inserted\" style=\"padding-right: 10px\"> 택시비 <span class=\"value\">" + routeData.summary.taxiFare.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원 </span></li>" +
							"</ul>" +
							/*
							"<div class=\"help_box\">" +
								"<button type=\"button\" class=\"btn_help\"> DIRECTIONS.TITLE.HELP_TOOLTIP </button>" +
							"</div>" +
							"<ul class=\"list_route ng-star-inserted\">" +
								"<li class=\"item_route ng-star-inserted\">" +
									"<span class=\"icon level3\"> 정체 </span> 서부로2126번길 <span class=\"route_distance\">755m</span>" +
								"</li>" +
								"<li class=\"item_route ng-star-inserted\">" +
									"<span class=\"icon level3\"> 정체 </span> 서부로 <span class=\"route_distance\">270m</span>" +
								"</li>" +
								"<li class=\"item_route ng-star-inserted\">" +
									"<span class=\"icon level2\"> 서행 </span> 덕영대로 <span class=\"route_distance\"></span>" +
								"</li>" +
							"</ul>" +
							*/
						"</div>" +
					"</div>" +
					"<div class=\"unpublic_result_area ng-star-inserted\" style=\"position: relative;padding: 11px 20px 0 10px;border-top: 1px solid #ddd;\">" +
						"<div class=\"path_area ng-star-inserted\">" +
							"<ul class=\"list_path\" style=\"list-style: none;padding-left:10px;\">" +
							"</ul>"+
						"</div>" +
					"</div>" +
				"</div>";
				
				$(".control-directions").find(".search-box.result").append(resultHTML);
				
				for(var k=0;k<routeData.guide.length;k++){
					if(routeData.guide[k].congestion == 0) continue;
					
					var imgHTML = "";
					
					if( routeData.guide[k].lookAt != undefined ) imgHTML = "<img src=\"https://map.naver.com/v5/api/v2/panorama/thumbnail/"+routeData.guide[k].viewPoint.join("/")+"/3?width=70&amp;height=54&amp;lookAt="+routeData.guide[k].lookAt.join(",")+"\" width=\"70\" height=\"54\" alt=\"파노라마 보기\">";
					
					var guideHTML = "<li class=\"item_path ng-star-inserted\" style=\"list-style: none;\">" +
						"<div class=\"unpublic_path_area\">" +
//							"<div class=\"path_guide_box ng-star-inserted\" style=\"position: relative;font-size: 0;top: 6px;left: 0;right: 0;height: 1px;background-color: #f2f2f2;opacity: .85;content: \"\";\">" +
//								"<span class=\"path_guide\" style=\"position: relative;top: -6px;display: inline-block;background-color: #fff;padding: 0 10px 0 10px;font-size: 11px;line-height: 13px;color: #777;\">66m</span>" +
//							"</div>" +
							"<div class=\"path_box type_start ng-star-inserted\" style=\"display: flex;align-items: center;min-height: 54px;margin: 10px 0;\">" +
								"<div class=\"path_inner\" style=\"display: flex;flex: 1;position: relative;margin-right: 5px;\">" +
									"<strong style=\"letter-spacing: -.2px;line-height: 16px;color: #333;word-break: break-all;text-align: left;font-weight: 600;font-size: 14px;\">" + routeData.guide[k].instructions + "</strong>" +
								"</div>" +
								imgHTML +
							"</div>" +
						"</div>" +
					"</li>";
					
					$(".control-directions").find(".search-box.result .list_path").append(guideHTML);
				}
				
				$(".control-directions").find(".search-box.result").show();
			}
		});
   	 
    };
    
    var directionsAddRouteHandler = function(e) {
    	var el = "<div class=\"search_inner via\" style=\"position: relative;min-height: 40px;border-top: 1px solid rgba(0,0,0,.1);\">" + //box-shadow: 0 0 0 3px rgba(4,117,244,.2), 0 1px 3px 0 rgba(0,0,0,.05);border-color: #0475f4;border-radius: 4px;
			"<div class=\"input_area\" style=\"position: relative;padding-right: 26px;\">" +
				"<span class=\"icon_route end ng-star-inserted\"></span>" +
				"<button type=\"button\" class=\"btn_via_delete ng-star-inserted\" style=\"overflow: hidden;display: inline-block;width: 30px;height: 30px;font-size: 0;color: transparent;vertical-align: top;float: right;margin-top: 5px;\"> 경유지 삭제 </button>" +
				"<div class=\"input_box\" style=\"overflow: hidden;position: relative;margin-right: 8px;\">" +
					"<label class=\"input_label\" for=\"directionGoal1\" style=\"position: absolute;top: 0;right: 0;bottom: 0;left: 0;background: transparent;color: rgba(51,51,51,.2);line-height: 40px;font-size: 16px;padding-left: 16px;letter-spacing: -.5px;height: 38px;\">경유지 입력</label>" +
					"<input type=\"text\" autocomplete=\"off\" class=\"directions-search-input-el input_search ng-pristine ng-valid ng-touched\" id=\"directionGoal1\" style=\"position: relative;width: 100%;color: #333;box-sizing: border-box;background: transparent;font-size: 16px;padding-left: 16px;letter-spacing: -.5px;height: 38px;border: none\">" +
				"</div>" +
				"<div class=\"tooltip ng-star-inserted\" style=\"display: none;position: absolute;top: 50%;right: 32px;z-index: 100;margin-top: -10px;padding: 5px 5px 4px;border-radius: 2px;background-color: #333;font-weight: 500;font-size: 11px;color: #fff;line-height: 1;white-space: nowrap;box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 2px 0 #fff;\">끌어서 이동</div>" +
			"</div>" +
			
			//검색
			"<div class=\"directions-search-box-instant-search ng-star-inserted\" style=\"position:absolute;width:100%;background:#fff;border-top: 1px solid rgba(0,0,0,.15);border-radius: 0 0 3px 3px;background-color: #fff;box-shadow: 0 -1px 0 #fff;z-index:50;display: none;\">" +
				"<div class=\"scroll_area ng-star-inserted\" style=\"max-height: 75vh;padding: 4px 0 10px;overflow-x: hidden;overflow-y: hidden;\">" +
					"<div class=\"scroll_box\" style=\"max-height: 937px;padding-bottom: 10px;width: 338px;\">" +
						"<div class=\"instant_box\" style=\"position: relative;\">" +
							"<ul class=\"list_place\" style=\"list-style: none;margin: 0;padding: 0;\">" +
							"</ul>" +
						"</div>" +
					"</div>" +
				"</div>" +
			"</div>" +
		"</div>";
    	
    	$(".control-directions").find(".search_box > div:last").before(el);
    	
    	$(".control-directions").find(".search_box .btn_via_delete:last").on("click", function(e){
    		$(e.target.parentElement.parentElement).remove();
    		
    		directions.via.pop($(e.target.parentElement.parentElement).data("info"));
    		
    		if( $(".control-directions").find(".search_box .via").length >= 5 ) $(".control-directions").find(".btn_route").css("display", "none");
    		else $(".control-directions").find(".btn_route").css("display", "inline-block");
    	});
    	
    	if( $(".control-directions").find(".search_box .via").length >= 5 ) $(".control-directions").find(".btn_route").css("display", "none");
    };
    
    var directionsRefreshHandler = function(e) {
    	directions.clear();
    	
    	directions.start = null;
    	directions.goal = null;
    	directions.via = [];
    	
    	$(".control-directions").find(".search_box .via").remove();
    	
    	$(".control-directions").find(".search_box input[type=text]").val("");
    	
    	$(".control-directions").find(".search-box.result").html("");
    	
   	 	$(".control-directions").find(".search-box.result").hide();
    };
    
    var attechmentHandler = function(e) {
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
    	changeActiveClass($(this));    	
    	
    	$(this).parent().find('div:first').toggle(); 	
	};
    
    var baseHandler = function(e) {	
    	
    	info.initialize();
    	book.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	
		var _this = $(this).parent();
	
		changeActiveClass(_this); 
		_this.find('.control-contents-box').remove();
		var _div = $('<div class="control-contents-box base-list"/>');
		baseMapItems.forEach(function(item, i) {			
			var contents =  '<img title="'+item.text+'" data="'+item.data+'" class="img-thumbnail" src="'+item.img+'"></img>';
			_div.append(contents);
		});	 
		$(base_controller_btn).append(_div);
	} 
    
    var baseChangeHandler = function(e) {	    	
    	if(base.event)base.event($(this).attr('data'));
    }
    
    var measureClearHandler = function(e) {
    	
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
    	
	}
    
    var measureLineHandler = function(e) { 
    	
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
    	
    	$(polygon_element).removeClass('active');
    	//$(info_controller_btn).removeClass('active');
    	changeActiveClass($(this));    	
    	   	
    	if($(this).hasClass('active')){
    		areaMeasure.setActive( false );
    		lengthMeasure.setActive( true );
    	}else{
    		lengthMeasure.setActive( false );
    	}
	};
    
    var measurePolygonHandler = function(e) {
    	
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
    	
    	//$(info_controller_btn).removeClass('active');
    	changeActiveClass($(this));
    	
    	if($(this).hasClass('active')){
    		lengthMeasure.setActive( false );
    		areaMeasure.setActive( true );

    	}else{
    		areaMeasure.setActive( false );
    	}
	};
   
    var captureHandler = function( e ){
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
    	
    	capture.event();
    };
    
    var roadViewHandler = function( e ){
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	vwsearch.initialize();
		
		changeActiveClass($(this));
		
		if($(this).hasClass('active')){
			//$("#pano").css("display", "block");
			$("#"+$(olMap.getViewport()).parent()[0].id.replace("_map", "")+"_pano").css("display", "block");
			
			console.log($(olMap.getViewport()).parent()[0].id.replace("_map", "")+"_pano");
			new naver.maps.Panorama($(olMap.getViewport()).parent()[0].id.replace("_map", "")+"_pano", {
		        position: new naver.maps.LatLng(37.3599605, 127.1058814),
		        pov: {
		            pan: -133,
		            tilt: 0,
		            fov: 100
		        }
		    });
			
			roadView.event();
    	}else{
    		//$("#pano").css("display", "none");
    		$("#"+$(olMap.getViewport()).parent()[0].id.replace("_map", "")+"_pano").css("display", "none");
    		_roadView = null;
    		olMap.un("moveend", roadView.changeEvent);
    	}
    };
    
    var modeSwitchHandler = function(e) {
    	info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
    	
    	changeActiveClass($(this));    	
    	
    	if($(this).hasClass('active')){
    		base.setVisible(false);
    		measure.setVisible(false);
    		roadView.setVisible(false);
    		
    		modeSwitch.event( "3d" );
    	}else{
    		base.setVisible(true);
    		measure.setVisible(true);
    		roadView.setVisible(true);
    		
    		modeSwitch.event( "2d" );
    	}    	
	};
	
	var drawFeatureHandler = function(e) {
		
		info.initialize();
    	book.initialize();
    	base.initialize();
    	layer.initialize();
    	measure.initialize();
    	roadView.initialize();
    	vwsearch.initialize();
    	
    	var _this = $(this).parent();
    	
		changeActiveClass(_this);
		
		_this.find('.control-contents-box2').remove();
    	
		var _div = $('<div class="control-contents-box2 drawFeature-list"/>');
		
		var point_button = document.createElement('button');
		point_button.title = 'point';
		point_button.innerHTML = '<i class="icon-map-point"/>';
		
		var line_button = document.createElement('button');
		line_button.title = 'line';
		line_button.innerHTML = '<i class="icon-map-line"/>';
		
		var polygon_button = document.createElement('button');
		polygon_button.title = 'area';
		polygon_button.innerHTML = '<i class="icon-map-rect"/>';
		
		var circle_button = document.createElement('button');
		circle_button.title = 'circle';
		circle_button.innerHTML = '<i class="icon-map-rect"/>';
		
		var square_button = document.createElement('button');
		square_button.title = 'square';
		square_button.innerHTML = '<i class="icon-map-rect"/>';
		
		var text_button = document.createElement('button');
		text_button.title = 'text';
		text_button.innerHTML = '<i class="fa fa-font"/>';
		
		_div.append(point_button);
		_div.append(line_button);
		_div.append(polygon_button);
		_div.append(circle_button);
		_div.append(square_button);
		_div.append(text_button);
		
		$(point_button).on('click', pointDrawFeatureHandler);
		$(line_button).on('click', lineDrawFeatureHandler);
		$(polygon_button).on('click', polygonDrawFeatureHandler);
		$(circle_button).on('click', circleDrawFeatureHandler);
		$(square_button).on('click', squareDrawFeatureHandler);
		$(text_button).on('click', textDrawFeatureHandler);
		
		$(drawFeature_controller_btn).append(_div);
		
		if(_this.hasClass('active')){
			_div.css("display", "block");
		}else{
			_div.css("display", "");
			
			pointDrawController.setActive(false);
	    	lineDrawController.setActive(false);
	    	polygonDrawController.setActive(false);
	    	circleDrawController.setActive(false);
	    	squareDrawController.setActive(false);
	    	textDrawController.setActive(false);
		}
    };
    
    var createSearch_controller = function(flag) {
    	geocoder = new Geocoder( 'nominatim', {
			provider : 'osm',		
    		/*provider: 'vworld',*/
    		key: 'A782B1B4-5C6A-3D0A-A322-A3E4EE190B94' ,
			lang : 'ko',
			placeholder : 'Search for ...',
			limit : 10,
			debug : false,
			autoComplete : true,
			keepOpen : true
		} );
    	
    	//$(geocoder.element).css('top','200px');
    	
    	if(flag){
    		olMap.addControl(geocoder);
    	}
    };
    
	var createInfoController = function(flag) {
				
		info_controller_btn = createControlElement({
	    	html:'<i class="icon-map-info"></i>',
	    	css : 'control-info',
	    	title : 'Info'
	    });	
		
		info_controller = new ol.control.Control({
			element: info_controller_btn
		});				
		
		info_controller_btn.addEventListener('click', infoHandler, false);
		
		if(flag){
			olMap.addControl(info_controller);
		}
    };
	
	var createLayerController = function(flag) {   
    	
    	layer_controller_btn = createControlElement({
	    	html:'<i class="fa fa-list-ul"></i>',
	    	css : 'control-layer',
	    	title : 'Layer'
	    });
    	
		layer_controller = new ol.control.Control({
		    element: layer_controller_btn					
			
		});
		
	
		$(layer_controller_btn).on('click','button[title=Layer]',layerHandler);
		$(layer_controller_btn).on('click','button[name=view]',layerVisibleHandler);
		
		$(layer_controller_btn).on('click', 'button[name="btn_more"]', function (e) {
			e.stopPropagation();			
			var li = $(e.target).closest("li");			
			var $more = li.find('.smart-form');
			
			$(e.target).parents().find(".dd-item").each(function(){
				 if( li[0] != this ){
					 $(this).find('.smart-form').hide();
				 }
			});
			
			if($more.css('display') === 'none') {
				$more.show();
			} else {
				$more.hide();
			}
		});
		
		$(layer_controller_btn).on('click','button[name=btn_feature-edit]',layerFeatureEditHandler);
		$(layer_controller_btn).on('click','button[name=btn_feature-add]',layerFeatureAddHandler);
		
		$(layer_controller_btn).on('click', 'button[name="move"]', function (e) {
			e.stopPropagation();			
			var li = $(e.target).closest("li");		
			var data = $(li).data();
			
			if( data.pos ){
				var extent = data.pos.map(Number);
				var book_proj = "EPSG:3857";			
				
				//좌표계가 서로 다를 경우
				var cur_proj =  olMap.getView().getProjection().getCode();
				
				extent = ol.proj.transformExtent(extent,book_proj,cur_proj);
				olMap.getView().fit(extent, olMap.getSize());
			}else{
				
				var extent = njMapManager.get(data.layerid).njMapLayer.getOlLayer().getSource().getExtent().map(Number);
				var book_proj = "EPSG:3857";			
				
				//좌표계가 서로 다를 경우
				var cur_proj =  olMap.getView().getProjection().getCode();
				
				extent = ol.proj.transformExtent(extent,book_proj,cur_proj);
				olMap.getView().fit(extent, olMap.getSize());
			}
			
		});	
		
		$(layer_controller_btn).on('click', 'button[name="remove"]', function (e) {
			e.stopPropagation();			
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			
			if(njMapManager.get(data.layerid)){
				njMapManager.remove(data.layerid);
			}			
			
			layerDraw();
			
		});	
		
		$(layer_controller_btn).on('change', '[name="opacity"]', function (e) {	
			var li = $(e.target).closest("li");	
			var data = li.data();
			var v = $(e.target).val();
			
			data.opacity = (v / 100);
			
			njMapManager.get(data.layerid).njMapLayer.getOlLayer().setOpacity(data.opacity);
			
			legend.setData(layer.data);
		});
		
		$(layer_controller_btn).on('change', '[name="strokeWidth"]', function (e) {	
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			
			if( data.geotype ){
				var _style = njMapManager.get(data.layerid).njMapLayer.getOlLayer().getStyle();
				
				if( _style && data.style.stroke ){
					data.style.stroke.width = v;
					
					_style.getStroke().setWidth(v);
					
					njMapManager.get(data.layerid).njMapLayer.getOlLayer().setStyle( _style );
					
					legend.setData(layer.data);
				}
			}
		});
		
		$(layer_controller_btn).on('change', '[name="strokeColor"]', function (e) {	
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			
			if( data.geotype ){
				var _style = njMapManager.get(data.layerid).njMapLayer.getOlLayer().getStyle();
				
				if( _style && data.style.stroke ){
					data.style.stroke.color = v;
					_style.getStroke().setColor(v);
				
					njMapManager.get(data.layerid).njMapLayer.getOlLayer().setStyle( _style );
					
					legend.setData(layer.data);
				}
			}
		});
		/*
		$(layer_controller_btn).on('change', '[name="strokeStyle"]', function (e) {	
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			njMapManager.get(data.layerid).njMapLayer.getOlLayer().setOpacity(v/100);			
		});
		*/
		$(layer_controller_btn).on('change', '[name="fillColor"]', function (e) {	
			var li = $(e.target).closest("li");	
			var data = li.data();		
			var v = $(e.target).val();
			
			if( data.geotype ){
				var _style = njMapManager.get(data.layerid).njMapLayer.getOlLayer().getStyle();
				
				if( _style && data.style.fill ){
					data.style.fill.color = v;
					
					_style.getFill().setColor(v);
					
					njMapManager.get(data.layerid).njMapLayer.getOlLayer().setStyle( _style );
					
					legend.setData(layer.data);
				}
			}
		});
		
		if(flag){
			olMap.addControl(layer_controller);
		}
    };
	
	var createBookmarkController = function(flag,data) {		
		
		book_controller_btn = createControlElement({
			html:'<i class="fa fa-paperclip"></i>',
	    	css : 'control-book',
	    	title : 'book',
	    });	
		
		book_controller = new ol.control.Control({
		    element: book_controller_btn
		});
		
		$(book_controller_btn).on('click','button',bookHandler);
		$(book_controller_btn).on('click','li',bookMoveHandler);
		
		if(flag){
			olMap.addControl(book_controller);
		}
    };
	
	var createVwsearchController = function(flag,data) {		
		
		vwsearch_controller_btn = createControlElement({
			html:'<i class="fa fa-search"></i>',
	    	css : 'control-vwsearch',
	    	title : 'vwsearch',
	    });	
		
		vwsearch_controller = new ol.control.Control({
		    element: vwsearch_controller_btn
		});
		
		var _div = $('<div class="control-contents-box1" style="display:none;"/>');
		
		var search_text = '<input type="text" value=""  placeholder="Search for ..."/>';

		_div.append(search_text);	
		
		var tab_tag = 	'<ul id="vw_search_tabs" class="white nav nav-tabs" style="font-size: 5px; ">'+
							'<li class="active">'+
							'	<a href="#vw_search_total" data-toggle="tab">전체</a>'+
							'</li>'+
							'<li>'+
							'	<a name ="name" href="#vw_search_name" data-toggle="tab">명칭</a>'+
							'</li>'+
							'<li>'+
							'	<a name ="road" href="#vw_search_road" data-toggle="tab">도로명</a>'+
							'</li>'+
							'<li>'+
							'	<a name ="num" href="#vw_search_num" data-toggle="tab">지번</a>'+
							'</li>'+
						'</ul>'+
						'<i name="vw_search_refresh" class="fa fa-refresh" style="float: right;margin-top: -25px; margin-right: 10px; cursor: pointer;" />';

		_div.append(tab_tag);	
		$(vwsearch_controller_btn).append(_div);
		
		var tab_contents = ' <div class="tab-content">'+
								'<div class="tab-pane fade in active" id="vw_search_total">	'+
								'	<div class="vw_list name">'+
			    				'		<div class="search_header" >명칭 <span class="lb_space">|</span>  <span class="count" style="color:#FE4278">0</span>건  <a name="name" style="float: right;font-size: 11px;">more</a></div>'+
			    				'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
		    					'	</div>'+
								'	<div class="vw_list road">'+
								'		<div class="search_header" >도로명 <span class="lb_space">|</span>  <span class="count" style="color:#FE4278">0</span>건  <a name="road" style="float: right;font-size: 11px;">more</a></div>'+			    				
								'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
								'	</div>'+
								'	<div class="vw_list num">'+
								'		<div class="search_header" >지번 <span class="lb_space">|</span> <span class="count" style="color:#FE4278">0</span>건  <a name="num" style="float: right;font-size: 11px;">more</a></div>'+			    				
								'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
								'	</div>'+
								'</div>'+
								'<div class="tab-pane fade " id="vw_search_name">	'+	
								'	<div class="vw_list">'+
			    				'		<div class="search_header" >명칭 <span class="lb_space">|</span>  <span class="count" style="color:#FE4278">0</span>건 </div>'+
			    				'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
		    					'	</div>'+
		    					'   <div name="paginatior" style="font-size: 10px; text-align: center;"></div>'+
								'</div>'+
								'<div class="tab-pane fade " id="vw_search_road">	'+	
								'	<div class="vw_list">'+
								'		<div class="search_header" >도로명 <span class="lb_space">|</span>  <span class="count" style="color:#FE4278">0</span>건</div>'+			    				
								'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
								'	</div>'+
								'   <div name="paginatior" style="font-size: 10px;  text-align: center;"></div>'+
								'</div>'+
								'<div class="tab-pane fade " id="vw_search_num">	'+	
								'	<div class="vw_list">'+
								'		<div class="search_header" >지번 <span class="lb_space">|</span>  <span class="count" style="color:#FE4278">0</span>건</div>'+			    				
								'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
								'	</div>'+
								'   <div name="paginatior" style="font-size: 10px;  text-align: center;"></div>'+
								'</div>'+
							'</div>';							
		
		_div.append($(tab_contents));			
		
		_div.on('click','ul li a', function (e) {			
			 e.preventDefault();
			 $(this).tab('show');
		});	
		
		_div.on('click','.search_header a', function (e) {			
			 e.preventDefault();			 
			 $("#vw_search_tabs").find('a[name='+$(this).attr('name')+']').tab('show');
		});			
		
		
		/*vw_search_refresh*/
		
		$(vwsearch_controller_btn).on('click','[name=vw_search_refresh]',vwsearchCallHandler);		
		$(vwsearch_controller_btn).on('keypress','.control-contents-box1 input',vwsearchCallHandler);
		$(vwsearch_controller_btn).on('click','button',vwsearchHandler);
		$(vwsearch_controller_btn).on('click','.search_item',vworldMoveHandler);
		
		if(flag){
			olMap.addControl(vwsearch_controller);
		}		
    };
    
    var createKakaosearchController = function(flag,data) {		
		
		kakaosearch_controller_btn = createControlElement({
			html:'<i class="fa fa-search"></i>',
	    	css : 'control-kakaosearch',
	    	title : 'kakaosearch',
	    });	
		
		kakaosearch_controller = new ol.control.Control({
		    element: kakaosearch_controller_btn
		});
		
		var _div = $('<div class="control-contents-box1" style="display:none;"/>');
		
		var search_text = '<input type="text" value=""  placeholder="Search for ..."/>';

		_div.append(search_text);	
		
		var tab_tag = '<ul id="kakao_search_tabs" class="white nav nav-tabs" style="font-size: 5px; ">'+
							'<li class="active">'+
							'	<a href="#kakao_search_total" data-toggle="tab">전체</a>'+
							'</li>'+
						'</ul>'+
						'<i name="kakao_search_refresh" class="fa fa-refresh" style="float: right;margin-top: -25px; margin-right: 10px; cursor: pointer;" />';	
		
		_div.append(tab_tag);	
		$(kakaosearch_controller_btn).append(_div);
		
		var tab_contents = ' <div class="tab-content">'+
								'<div class="tab-pane fade in active" id="kakao_search_total">	'+
								'	<div class="kakao_list name">'+
			    				'		<div class="search_header" >명칭 <span class="lb_space">|</span>  <span class="count" style="color:#FE4278">0</span>건  </div>'+
			    				'		<div class="search_items">'+
			    				'			<div class="search_item">검색된 데이터가 없습니다.</div>'+
			    				'		</div>'+
		    					'	</div>'+
		    					'   <div name="paginatior" style="font-size: 10px;  text-align: center;"></div>'+
								'</div>'+
							'</div>';							
		
		_div.append($(tab_contents));			
		
		_div.on('click','ul li a', function (e) {			
			 e.preventDefault();
			 $(this).tab('show');
		});	
		
		_div.on('click','.search_header a', function (e) {			
			 e.preventDefault();			 
			 $("#kakao_search_tabs").find('a[name='+$(this).attr('name')+']').tab('show');
		});			
		
		/*kakao_search_refresh*/
		$(kakaosearch_controller_btn).on('click','[name=kakao_search_refresh]',kakaosearchCallHandler);		
		$(kakaosearch_controller_btn).on('keypress','.control-contents-box1 input',kakaosearchCallHandler);
		$(kakaosearch_controller_btn).on('click','button',kakaosearchHandler);
		$(kakaosearch_controller_btn).on('click','.search_item',kakaoMoveHandler);
		
		if(flag){
			olMap.addControl(kakaosearch_controller);
		}		
    };

	
	var createBaseController = function(flag,data) {		
		
		base_controller_btn = createControlElement({
			html:'<i class="fa fa-map-o"></i>',
	    	css : 'control-base',
	    	title : 'base',
	    });	
		
		base_controller = new ol.control.Control({
		    element: base_controller_btn
		});
		
		$(base_controller_btn).on('click','button',baseHandler);
		$(base_controller_btn).on('click','img',baseChangeHandler);
		
		if(flag){
			olMap.addControl(book_controller);
		}		
		
		baseMapItems = data;
		
    };
	
	var createMeasureController = function(flag) {				
		
		var line_button = document.createElement('button');
		line_button.title = 'line';
		line_button.innerHTML = '<i class="icon-map-line"/>';
		
		var polygon_button = document.createElement('button');
		polygon_button.title = 'area';
		polygon_button.innerHTML = '<i class="icon-map-rect"/>';
		
		var clear_button = document.createElement('button');
		clear_button.title = 'clear';
		clear_button.innerHTML = '<i class="icon-refresh"/>';
		
		line_element = document.createElement('div');
		line_element.className = 'control-measure-length ol-unselectable ol-control';
		line_element.appendChild(line_button);
		
		polygon_element = document.createElement('div');
		polygon_element.className = 'control-measure-area ol-unselectable ol-control';
		polygon_element.appendChild(polygon_button);
		
		clear_element = document.createElement('div');
		clear_element.className = 'control-measure-clear ol-unselectable ol-control';
		clear_element.appendChild(clear_button);
					
		measure_controller = []
		
		measure_controller.push(new ol.control.Control({
		    element: line_element
		}));
		
		measure_controller.push(new ol.control.Control({
		    element: polygon_element
		}));
		
		measure_controller.push(new ol.control.Control({
		    element: clear_element
		}));
		
		lengthMeasure = new naji.control.njMapLengthMeasure( {
			njMap : njMap,
			useModify : true,
			useSnap : true
		} );
		
		areaMeasure = new naji.control.njMapAreaMeasure( {
			njMap : njMap,
			useModify : true,
			useSnap : true
		} );			
		
		line_element.addEventListener('click', measureLineHandler, false);
		polygon_element.addEventListener('click', measurePolygonHandler, false);
		clear_element.addEventListener('click', measureClearHandler, false);
		
		if(flag){
			measure_controller.forEach(function( v, i ){
    			olMap.addControl(v);
    		});	
		}
    };
	
	var createLegendController = function(flag){
				
		var close_div = $('<div style="height: 25px;display: grid;text-align: right;padding-right: 3px;"><span name="close" style="cursor: pointer;"><i class="icon-close"></i></span></div>');
		var legend_btn = $('<div class="legend_btn ol-control" style="bottom:.4em;left:.7em;display:none"><button><i class="icon-legend"></i></button></div>');
		var legend_list = document.createElement('div');
		
		var ul = document.createElement('ul');
		ul.className = 'list-unstyled legend_ul';
		
		legend_element = document.createElement('div');
		legend_element.className = 'control-legend ol-unselectable ol-control';
		
		$(legend_element).append(close_div);		
		legend_element.appendChild(ul);
		
		$(legend_list).append(legend_btn);
		legend_list.appendChild(legend_element);		
		
		legend_controller = new ol.control.Control({
		    element: legend_list				   
		});
		
		if(flag){
			olMap.addControl(legend_controller);
		}
		
		
		$(legend_list).on('click','.legend_btn',function(e){			
			$(legend_list).find('.legend_btn').hide();
			$(legend_list).find('.control-legend').show();
		});
		
		$(legend_list).on('click','[name="close"]',function(e){			
			$(legend_list).find('.legend_btn').show();
			$(legend_list).find('.control-legend').hide();
		});
	};
	
	var createCaptureController = function(flag) {
		capture_controller_btn = createControlElement({
	    	html:'<i class="icon-save"></i>',
	    	css : 'control-capture',
	    	title : 'Capture'
	    });	
		
		capture_controller = new ol.control.Control({
			element: capture_controller_btn
		});				
		
		capture_controller_btn.addEventListener('click', captureHandler, false);
		
		if(flag){
			olMap.addControl(capture_controller);
		}
    };
    
    var createRoadViewController = function(flag, data) {		
		
		roadView_controller_btn = createControlElement({
			html:'<i class="fa fa-street-view"></i>',
	    	css : 'control-roadView',
	    	title : 'roadView',
	    });	
		
		roadView_controller = new ol.control.Control({
		    element: roadView_controller_btn
		});

		var _div = '<div id="'+$(olMap.getViewport()).parent()[0].id.replace("_map", "")+'_pano" style="position: absolute; bottom: 0px; right: 0px; width: 65%;min-width: 400px; height: 400px; display: none;"></div>';
		$( olMap.getViewport().getElementsByClassName("ol-overlaycontainer-stopevent")[1] ).append(_div);
		
		roadView_controller_btn.addEventListener('click',roadViewHandler, false);
	
		if(flag){
			olMap.addControl(roadView_controller);
		}
    };
    
    var createModeSwitchController = function(flag) {
		
    	modeSwitch_controller_btn = createControlElement({
	    	html:'<i class="fa fa-globe"></i>',
	    	css : 'control-mode',
	    	title : 'Mode'
	    });	
		
		modeSwitch_controller = new ol.control.Control({
			element: modeSwitch_controller_btn
		});				
		
		modeSwitch_controller_btn.addEventListener('click', modeSwitchHandler, false);
		
		if(flag){
			olMap.addControl(modeSwitch_controller);
		}
    };
    
    var createDirectionsController = function(flag) {
		
    	directions_controller_btn = createControlElement({
	    	html:'<i class="fa fa-share"></i>',
	    	css : 'control-directions',
	    	title : 'Directions'
	    });	
		
    	directions_controller = new ol.control.Control({
			element: directions_controller_btn
		});
    	
    	var _div = $('<div style="width: 390px;background-color: #f5f6f6; border: solid 1px #dcd2c8; padding: 5px 7px 5px 7px;display: none;"></div>');
    	var search_box_text = "<div class=\"search_box\" style=\"position: relative;margin-top: 14px;font-size: 0;border: 1px solid rgba(0,0,0,.5);border-radius: 4px;background: #fff;\">" +
    		"<div class=\"search_inner start\" style=\"position: relative;min-height: 40px;\">" +
    			"<div class=\"input_area\" style=\"position: relative;padding-right: 26px;\">" +
    				"<span class=\"icon_route start ng-star-inserted\"></span>" +
    				"<div class=\"input_box\" style=\"overflow: hidden;position: relative;margin-right: 8px;\">" +
    					"<label class=\"input_label\" for=\"directionStart0\" style=\"position: absolute;top: 0;right: 0;bottom: 0;left: 0;background: transparent;color: rgba(51,51,51,.2);line-height: 40px;font-size: 16px;padding-left: 16px;letter-spacing: -.5px;height: 38px;\">출발지 입력</label>" +
    					"<input type=\"text\" autocomplete=\"off\" class=\"directions-search-input-el input_search ng-pristine ng-valid ng-touched\" id=\"directionStart0\" style=\"position: relative;width: 100%;color: #333;box-sizing: border-box;background: transparent;font-size: 16px;padding-left: 16px;letter-spacing: -.5px;height: 38px;border: none\">" +
    				"</div>" +
    				"<div class=\"tooltip ng-star-inserted\" style=\"display: none;position: absolute;top: 50%;right: 32px;z-index: 100;margin-top: -10px;padding: 5px 5px 4px;border-radius: 2px;background-color: #333;font-weight: 500;font-size: 11px;color: #fff;line-height: 1;white-space: nowrap;box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 2px 0 #fff;\">끌어서 이동</div>" +
    			"</div>" +
    			//검색
    			"<div class=\"directions-search-box-instant-search ng-star-inserted\" style=\"position:absolute;width:100%;background:#fff;border-top: 1px solid rgba(0,0,0,.15);border-radius: 0 0 3px 3px;background-color: #fff;box-shadow: 0 -1px 0 #fff;z-index:50;display: none;\">" +
    				"<div class=\"scroll_area ng-star-inserted\" style=\"max-height: 75vh;padding: 4px 0 10px;overflow-x: hidden;overflow-y: hidden;\">" +
    					"<div class=\"scroll_box\" style=\"max-height: 937px;padding-bottom: 10px;width: 338px;\">" +
    						"<div class=\"instant_box\" style=\"position: relative;\">" +
	    						"<ul class=\"list_place\" style=\"list-style: none;margin: 0;padding: 0;\">" +
								"</ul>" +
    						"</div>" +
    					"</div>" +
    				"</div>" +
    			"</div>" +
    		"</div>" +
    		"<div class=\"search_inner end\" style=\"position: relative;min-height: 40px;border-top: 1px solid rgba(0,0,0,.1)\">" +
    			"<div class=\"input_area\" style=\"position: relative;padding-right: 26px;\">" +
    				"<span class=\"icon_route end ng-star-inserted\"></span>" +
    				"<div class=\"input_box\" style=\"overflow: hidden;position: relative;margin-right: 8px;\">" +
    					"<label class=\"input_label\" for=\"directionGoal1\" style=\"position: absolute;top: 0;right: 0;bottom: 0;left: 0;background: transparent;color: rgba(51,51,51,.2);line-height: 40px;font-size: 16px;padding-left: 16px;letter-spacing: -.5px;height: 38px;\">도착지 입력</label>" +
    					"<input type=\"text\" autocomplete=\"off\" class=\"directions-search-input-el input_search ng-pristine ng-valid ng-touched\" id=\"directionGoal1\" style=\"position: relative;width: 100%;color: #333;box-sizing: border-box;background: transparent;font-size: 16px;padding-left: 16px;letter-spacing: -.5px;height: 38px;border: none\">" +
    				"</div>" +
    				"<div class=\"tooltip ng-star-inserted\" style=\"display: none;position: absolute;top: 50%;right: 32px;z-index: 100;margin-top: -10px;padding: 5px 5px 4px;border-radius: 2px;background-color: #333;font-weight: 500;font-size: 11px;color: #fff;line-height: 1;white-space: nowrap;box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 2px 0 #fff;\">끌어서 이동</div>" +
    			"</div>" +
    			
    			//검색
    			"<div class=\"directions-search-box-instant-search ng-star-inserted\" style=\"position:absolute;width:100%;background:#fff;border-top: 1px solid rgba(0,0,0,.15);border-radius: 0 0 3px 3px;background-color: #fff;box-shadow: 0 -1px 0 #fff;z-index:50;display: none;\">" +
    				"<div class=\"scroll_area ng-star-inserted\" style=\"max-height: 75vh;padding: 4px 0 10px;overflow-x: hidden;overflow-y: hidden;\">" +
    					"<div class=\"scroll_box\" style=\"max-height: 937px;padding-bottom: 10px;width: 338px;\">" +
    						/*
    						"<div class=\"instant_box\">" +
    							"<ul class=\"list_place\">" +
    								"<li class=\"item_place ng-star-inserted\" style=\"\">" +
    									"<a href=\"\" preventdefault=\"\" class=\"link_place\">" +
    										"<span class=\"icon_box search\">" +
    											"<span class=\"blind ng-star-inserted\">검색어</span>" +
    										"</span>" +
    										"<div class=\"place_box\">" +
    											"<div class=\"place_text_box ng-star-inserted\">" +
    												"<span class=\"place_text\"><strong>dddd</strong></span>" +
    											"</div>" +
    										"</div>" +
    									"</a>" +
    									"<button type=\"button\" class=\"btn_delete\">삭제 </button>" +
    								"</li>" +
    							"</ul>" +
    						"</div>" +
    						*/
    						"<div class=\"instant_box\" style=\"position: relative;\">" +
	    						"<ul class=\"list_place\" style=\"list-style: none;margin: 0;padding: 0;\">" +
								"</ul>" +
    						"</div>" +
    					"</div>" +
    				"</div>" +
    			"</div>" +
    		"</div>" +
    		"<button type=\"button\" class=\"btn_switch ng-star-inserted\" title=\"출발지/도착지 전환\" style=\"display: none;position: absolute;top: 50%;right: 32px;z-index: 100;margin-top: -10px;padding: 5px 5px 4px;border-radius: 2px;background-color: #333;font-weight: 500;font-size: 11px;color: #fff;line-height: 1;white-space: nowrap;box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 2px 0 #fff;\"></button>" +
    	"</div>" +
    	"<div class=\"btn_box\" style=\"margin-top: 10px;\">" +
    		"<button type=\"button\" class=\"btn btn_clear\" style=\"display: inline-block;padding: 0 10px;font-size: 12px;letter-spacing: -.4px;width: auto;\">다시입력 </button>" +
    		"<button type=\"button\" class=\"btn btn_route ng-star-inserted\" style=\"display: inline-block;padding: 0 10px;font-size: 12px;letter-spacing: -.4px;width: auto;\">경유지 </button>" +
    		"<button type=\"button\" class=\"btn btn_direction\" style=\"display: inline-block;padding: 0 10px;font-size: 12px;letter-spacing: -.4px;width: auto;float: right;padding: 0 12px;font-weight: 500;font-size: 14px;\">길찾기 </button>" +
    	"</div>" +
    	"<div class=\"search-box result\" style=\"display: none;height: 500px;padding-top: 15px;\">" +
    	"</div>";
    	 
		_div.append(search_box_text);
		
		$(directions_controller_btn).append(_div);
			
		$(directions_controller_btn).on('focus blur','input[type=text]',directionsFocusHandler);
		$(directions_controller_btn).on('keyup','input[type=text]',directionsSearchCallHandler);
		
		$(directions_controller_btn).on('click', '.btn_clear', directionsRefreshHandler);
		$(directions_controller_btn).on('click', '.btn_route', directionsAddRouteHandler);
		$(directions_controller_btn).on('click', '.btn_direction', directionsCallHandler);
    	
    	$(directions_controller_btn).on('click', 'button[title=Directions]', directionsHandler);
    	
		if(flag){
			olMap.addControl(directions_controller);
		}
    };
    
    var createAttechmentController = function(flag) {
		
    	attechment_controller_btn = createControlElement({
	    	html:'<i class="fa fa-file-o"></i>',
	    	css : 'control-attechment',
	    	title : 'Attechment'
	    });	
		
    	attechment_controller = new ol.control.Control({
			element: attechment_controller_btn
		});
    	
    	var _div = $('<div style="width: 390px;background-color: #f5f6f6; border: solid 1px #dcd2c8; padding: 5px 7px 5px 7px;display: none;"></div>');
    	//*/
    	var fileAttech = "<form id=\"fileupload\" action=\"/file/api/upload\" method=\"POST\" enctype=\"multipart/form-data\">" +
        "<!-- Redirect browsers with JavaScript disabled to the origin page -->" +
        "<noscript><input type=\"hidden\" name=\"redirect\" value=\"https://blueimp.github.io/jQuery-File-Upload/\" /></noscript>" +
        "<!-- The fileupload-buttonbar contains buttons to add/delete files and start/cancel the upload -->" +
        "<div class=\"row fileupload-buttonbar\">" +
          "<div class=\"col-lg-7\">" +
            "<!-- The fileinput-button span is used to style the file input field as button -->" +
            "<span class=\"btn btn-success fileinput-button\">" +   	
              "<i class=\"glyphicon glyphicon-plus\"></i>" +
              "<span>Add files...</span>" +
              "<input type=\"file\" name=\"file\" />" +
            "</span>" +
            "<!-- The global file processing state -->" +
            "<span class=\"fileupload-process\"></span>" +            
          "</div>" +
          "<!-- The global progress state -->" +
          "<div class=\"col-lg-5 fileupload-progress fade\">" +
           	"<!-- The global progress bar -->" +
            "<div class=\"progress progress-striped active\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\">" +
              "<div class=\"progress-bar progress-bar-success\" style=\"width: 0%;\"></div>" +
            "</div>" +
            "<!-- The extended global progress state -->" +
            "<div class=\"progress-extended\">&nbsp;</div>" +
          "</div>" +
        "</div>" +
        "<!-- The table listing the files available for upload/download -->" +
        "<table role=\"presentation\" class=\"table table-striped\" style=\"margin:0px\">" +
          "<tbody class=\"file-list\"></tbody>" +
        "</table>" +
      "</form>" + 
      "<div class=\"dd attechment-list\" style=\"width:100%;\"><ol class=\"dd-list\"></ol></div>";
    	/*/
    	var fileAttech = "<input type=\"file\" name=\"files\" id=\"file_software\" class=\"file-upload\" data-url=\"/file/upload\" data-form-data='{\"extra\": \"software\"}'>" +
    	"<ul class=\"file-list list-unstyled mb-0\"></ul>";
    	//*/
    	_div.append(fileAttech);
		
		$(attechment_controller_btn).append(_div);
		
		$(attechment_controller_btn).on('click', 'button', attechmentHandler);
		/*
		$('#fileupload').fileupload(
		    'option',
		    'redirect',
		    window.location.href.replace(/\/[^/]*$/, '/cors/result.html?%s')
		);
		
		$('#fileupload').addClass('fileupload-processing');
	    $.ajax({
	      // Uncomment the following to send cross-domain cookies:
	      //xhrFields: {withCredentials: true},
	      url: $('#fileupload').fileupload('option', 'url'),
	      dataType: 'json',
	      context: $('#fileupload')[0]
	    })
	      .always(function () {
	        $(this).removeClass('fileupload-processing');
	      })	
	      .done(function (result) {
	        $(this)
	          .fileupload('option', 'done')
	          // eslint-disable-next-line new-cap
	          .call(this, $.Event('done'), { result: result });
	      });
	    */
		
		$(attechment_controller_btn).find("input[type=file]").fileupload({
	        dataType: "xml",
	        maxChunkSize: 9999999999,
	        sequentialUploads: false,
	        add: function(e, data) {
	        	debugger;
	            var maxFileCount = parseInt($(this).data("maxfilecount"));
	            if (isNaN(maxFileCount))
	                maxFileCount = 1;
	            console.log(maxFileCount);
	            var $t = $(this);
	            var $w = $t.closest("div");
	            var $li = $w.find("ul.file-list li");
	            if ($li.length >= maxFileCount) {
	                var txt = $w.find("label").text();
	                alert("업로드된 " + txt + " 파일이 있습니다. 기존 파일을 삭제하신 후 새로 업로드해 주십시오.");
	                return false;
	            }
	            /*/
	            data.context = $('<li class="file my-1 row"></li>')
	                .append(jQuery('<div class="file-name col-md-8 text-muted"></div>').text(data.files[0].name))
	                .append('<div class="progress col-md-3 my-auto px-0"><div class="progress-bar progress-bar-striped bg-info" role="progressbar"></div></div>')
	                .append('<div class="del-button col-md-1"></div>')
	                .appendTo($(this).parents().find(".file-list"));
	            <td>
                  
                  
                      <button class="btn btn-primary start">
                          <i class="glyphicon glyphicon-upload"></i>
                          <span>Start</span>
                      </button>
                  
                  
                      <button class="btn btn-warning cancel">
                          <i class="glyphicon glyphicon-ban-circle"></i>
                          <span>Cancel</span>
                      </button>
                  
              </td>
	            //data.submit();
	            /*/
	            content = "<tr class=\"template-upload fade in\">" + 
	            	"<td>" +
	                  "<span class=\"preview\"></span>" +
	             "</td>" +
	              "<td>" +
	                  "<p class=\"name\">"+ data.files[0].name +"</p>" +
	                  "<strong class=\"error text-danger\"></strong>" +
	              "</td>" +
	              "<td>" +
	                  "<p class=\"size\">" + Math.ceil(data.files[0].size / 1024) + "KB" + "</p>" +
	                  "<div class=\"progress progress-striped active\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"0\"><div class=\"progress-bar progress-bar-success\" style=\"width:0%;\"></div></div>" +
	              "</td>" +
	          "</tr>";
	          data.context = $(content).appendTo($(this).parents().find(".file-list"));
	          data.submit();
	          //*/

	        },
	        progress: function(e, data) {
	            var progress = parseInt((data.loaded / data.total) * 100, 10);
	            data.context.find(".progress-bar").css("width", progress + "%");
	        },
	        success: function (data) {
	            alert("Success!");
	        },
	        done: function(e, data) {
	        	debugger;
	        	$(attechment_controller_btn).find(".file-list").html("");
	        	
	    		var tag = "<li class=\"dd-item dd3-item layer-img\">" + 
	    			'<div class="dd-handle dd3-handle">&nbsp;</div>'+			
	    			'<div class="dd3-content" style="font-size: 12px; font-weight: bold;min-height: 40px;" >'+
	    				'<div class="pull-right" style="display: flex;">'+	
	    					'<button data-toggle="tooltip" title="move" name="move" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
	    						'<i class="fa fa-fw fa-arrows-alt"></i>'+							
	    					'</button>'+
	    					'<button data-toggle="tooltip" title="view" name="view" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
	    						'<i class="fa fa-fw"></i>'+							
	    					'</button>'+
	    					'<button data-toggle="tooltip" title="remove" name="remove" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
	    						'<i class="fa fa-fw fa-trash-o"></i>'+							
	    					'</button>'+
	    					'<button data-toggle="tooltip" title="option" name="btn_more" style="color: #ffffff;margin-right:3px;background-image: none;font-size: 9px;" class="btn btn-default btn-xs btn-icon" type="button">'+
	    						'<i class="fa-fw glyphicon glyphicon-option-vertical"></i>'+
	    					'</button>'+
	    				'</div>'+
	    				'<div style="padding-bottom:10px;display: flex; word-break: break-all;" name="layer_title">' + data.files[0].name + '</div>'+	
	    			'</div>' +
	    		'</li>';
	        	
	    		$(attechment_controller_btn).find(".dd-list")
                .append(tag)
                .end();
	    		
	    		var format = new ol.format.GML2();

	            var xmlDoc = data.result;

	            // Read and parse all features in XML document
	            var features = format.readFeatures(xmlDoc, {
	                featureProjection: 'EPSG:3857',
	                dataProjection: 'EPSG:3857'
	            });
	            
	            debugger;

	            var vector = new ol.layer.Vector({
	                source: new ol.source.Vector({
	                    format: format
	                })
	            });

	            // Add features to the layer's source
	            vector.getSource().addFeatures(features);

	            olMap.addLayer(vector);
	            
	            attechment.layers.push( vector );
	            
                $(attechment_controller_btn).find(".dd-list > li:last").on('click', 'button[name="move"]', function (e) {
        			e.stopPropagation();
        			/*
        			var li = $(e.target).closest("li");		
        			var data = $(li).data();
        			
        			var extent = data.pos.map(Number);
        			var book_proj = "EPSG:3857";			
        			
        			//좌표계가 서로 다를 경우
        			var cur_proj =  olMap.getView().getProjection().getCode();
        			
        			extent = ol.proj.transformExtent(extent,book_proj,cur_proj);
        			*/
        			
        			var extent = vector.getSource().getExtent();
        			olMap.getView().fit(extent, olMap.getSize());
        		});	
                
	        	/*
	            var res = data.result.files[0];
	            var val = res.path;
	            var url = res.deleteUrl;
	            $(this.form)
	                .find("input[type=hidden]:last")
	                .after('<input type="hidden" name="upload[]" value="' + val + '">');
	            data.context
	                .find(".file-name")
	                .removeClass("text-muted")
	                .append(' <span class="badge badge-success"><i class="fas fa-check"></i></span>')
	                .end()
	                .find(".del-button")
	                .append('<button type="button" class="btn btn-sm btn-danger upload-delete" data-val="' + val + '" data-type="DELETE" data-url="' + url + '"><i class="far fa-trash-alt"></i></button>');
	            $(this).blur();
	            */
	        }
		});
		
		if(flag){
			olMap.addControl(attechment_controller);
		}
    };
    
    var createDrawFeatureController = function(flag) {

    	drawFeature_controller_btn = createControlElement({
	    	html:'<i class="fa fa-pencil"></i>',
	    	css : 'control-drawFeature',
	    	title : 'DrawFeature'
	    });
    	
    	drawFeature_controller = new ol.control.Control({
			element: drawFeature_controller_btn
		});				
		  	
    	$(drawFeature_controller_btn).on('click', "button[title='DrawFeature']", drawFeatureHandler);
    	
    	pointDrawController = new naji.control.njMapDrawFeature( {
			title : 'add a Map Point',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Point",
			cursorCssName : 'cursor-point',
			useDrawEndDisplay : true,
			//useModify : true
		} );
		
		lineDrawController = new naji.control.njMapDrawFeature( {
			title : 'add a Map Line',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "LineString",
			cursorCssName : 'cursor-line',
			useDrawEndDisplay : true,
			//useModify : true
		} );
		
		polygonDrawController = new naji.control.njMapDrawFeature( {
			title : 'add a Map Polygon',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Polygon",
			cursorCssName : 'cursor-polygon',
			useDrawEndDisplay : true,
			//useModify : true
		} );
		
		circleDrawController = new naji.control.njMapDrawFeature( {
			title : 'add a Map Circle',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Circle",
			cursorCssName : 'cursor-circle',
			useDrawEndDisplay : true,
			//useModify : true
		} );
		
		squareDrawController = new naji.control.njMapDrawFeature( {
			title : 'add a Map Rectangle',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Box",
			cursorCssName : 'cursor-rectangle',
			useDrawEndDisplay : true,
			//useModify : true
		} );
		
		textDrawController = new naji.control.njMapDrawFeature( {
			title : 'add a Map Text',
			njMap : njMap,
			useSnap : true,
			useDragPan : true,
			drawType : "Text",
			cursorCssName : 'cursor-text',
			useDrawEndDisplay : true,
			//useModify : true
		} );
		
		if(flag){
			olMap.addControl(drawFeature_controller);
			
			olMap.addControl(pointDrawController);
			olMap.addControl(lineDrawController);
			olMap.addControl(polygonDrawController);
			olMap.addControl(circleDrawController);
			olMap.addControl(squareDrawController);
			olMap.addControl(textDrawController);
		}
    };
    	
	return {
		controllers : controllers,
		layer : layer,
		measure : measure,
		info : info,
		book : book,
		vwsearch : vwsearch,
		kakaosearch : kakaosearch,
		base : base,
		legend : legend,
		search : search,
		drawFeature : drawFeature,
		directions : directions,
		attechment : attechment,
		capture : capture,
		roadView : roadView,
		modeSwitch : modeSwitch
	}
		    
};