var MapWidget = function() {

	var map;
	var mapManager;
	var div;
	var div_time;
	var items;
	var view_flag;
	var interval_obj;
	var base_url;

	var init = function(attr) {
		this.map = attr.map;	
		this.mapManager = attr.mapManager;
		this.div = attr.div;
		this.div_time = attr.div_time;
		this.items = attr.items || new Array();
		this.view_flag = attr.view || false;
		this.base_url = attr.base_url || 'http://gwp.uitgis.com:8080/GWBase/';
		
		var element = document.createElement('div');		
		element.style.overflowX = 'hidden';
		element.style.overflowY = 'auto';
		element.style.height = '100%';				
		element.setAttribute("name",'widget_contents');	
		
		//debugger
		
		this.div.append(element);
	};
	
	
	var setMapManager = function(obj) {	
		
		this.mapManager = obj;
	}

	var exportItems = function(items) {
		//console.log(items);
	};

	var importItems = function(items) {
		//console.log(items);
		this.items = items;
		this.refresh();
	};
	var addItem = function() {
	};
	var removeItem = function() {
	};
	var getItem = function() {
	};
	
	var loop = function(instance,_this){
		//console.log('from : '+instance.result.from);
		//console.log('max : '+instance.result.max);
		
		if(instance.result.from == instance.result.max){
			console.log('clearInterval');
			clearInterval(_this.interval_obj);
			
			if(_this.div_time.find('.play').html() ==  'Pause'){
				_this.div_time.find('.play').html('Play');
			}			
			
		}else{			
			var value = instance.result.from +1;
			
			instance.update({
		        from: value
		    });
			instance.update({
		        from: value
		    });
		}
	}
	
	var updateLayerByWidget = function(instance , _this , speed) {
		
		speed = speed || 1000;
		
		if(instance.result.from == instance.result.max){
			instance.update({
		        from: 1
		    });
		}
		
		console.log('updateLayerByWidget');	
		
		if(_this.interval_obj){
			clearInterval(_this.interval_obj);			
		}
				
		_this.interval_obj = setInterval(this.loop, speed,instance,_this);
	};
	
	var drawGroupBar = function(result,item,item_div){
		
		var total = 0;
		
		result.sort(function(a, b) {
			  if(Number(a.value) == Number(b.value)){ return 0} return  Number(a.value) < Number(b.value) ? 1 : -1;
		});							
		
		//썸값 구하기
		result.forEach(function(v, i) {
			total += Number(v.value);
		});	
		
		var etc_sum = 0;	
		
		result.forEach(function(v, i) {
//			'		<label style="font-size:smaller">'+eval('v.'+item.field) +' - '+ v.value+'</label>		'+
			if(i<5){
				var rate =    Number(v.value)/total*100;				
				
				var tag =   '	<div style="padding-top:3px">			'+
							'		<label style="font-size:smaller">'+eval('v.'+item.field.toLowerCase()) +' - '+ Math.floor(v.value * 100)/100+'</label>		'+
						    '		<label class="pull-right" style="font-size:smaller">'+Math.floor(rate * 10)/10+'%</label>		'+	
							'		<div style="width:'+rate+'%;   height:5px">&nbsp;</div>			'+
							'	</div>';
				
				item_div.find(".display").append(tag);
			}else{
				etc_sum +=  Number(v.value);
			}
			
		});	
			
		if(result.length > 4){
			
			var rate =    Number(etc_sum)/total*100;
			var tag =   '	<div style="padding-top:3px">			'+
					    '		<label style="font-size:smaller">'+'etc' +' - '+  Math.floor(etc_sum * 100)/100 +'</label>		'+
					    '		<label class="pull-right" style="font-size:smaller">'+Math.floor(rate * 10)/10+'%</label>		'+	
						'		<div style="width:'+rate+'%;   height:5px">&nbsp;</div>			'+
						'	</div>';
			
			item_div.find(".display").append(tag);
		}else{
			
			for(var i = 0; i < (6 -result.length) ; i ++){
				
				var tag =   '	<div style="padding-top:3px;">			'+
			    '		<label> - </label>		'+
			    '		<label class="pull-right" style="font-size:smaller">-%</label>		'+	
				'		<div style="width:0%; background-color:#eee;  height:5px">&nbsp;</div>			'+
				'	</div>';
	
				item_div.find(".display").append(tag);								
			}							
		}
	}
	
	var drawGroupPie = function(result,item,item_div){		
		
		var myChart = echarts.init(document.getElementById(item.id+'d'));
		 
		 var result_custom = [];
		 var result_legend = [];
		 
		 if(result.length ==0){
			 return;
		 }
		 
		result.sort(function(a, b) {
			  if(Number(a.value) == Number(b.value)){ return 0} return  Number(a.value) < Number(b.value) ? 1 : -1;
		});	
		
		result.forEach(function(v, i) {
			var data =  {
                   name:  eval('v.'+item.field.toLowerCase()),
					/*name:  v.field,*/
                   value: Number(v.value)
               }
			
			result_custom.push(data);
			result_legend.push(eval('v.'+item.field.toLowerCase()));
			/*result_legend.push(v.field)*/
		});		 
        var option = {
			   tooltip : {
			        trigger: 'item',
			        formatter: "{b} : {c} ({d}%)"
			    },
			    toolbox: {
			        show : false,			       
			    },
			    calculable : true,
			    series : [
			        {
			            name:' ',
			            type:'pie',
			            //radius : ['50%', '70%'],
			            itemStyle : {
			                normal : {
			                    label : {
			                        show : false
			                    },
			                    labelLine : {
			                        show : false
			                    }
			                },
			            },
			            data:result_custom
			        }
			    ]
			};
        
        myChart.setOption(option);
	}
	
	var drawGroupTreeMap = function(result,item,item_div){	
		
		 var myChart = echarts.init(document.getElementById(item.id+'d'));
		 
		 var result_custom = [];
		 
		 if(result.length ==0){
			 return;
		 }
		 
		result.sort(function(a, b) {
			  if(Number(a.value) == Number(b.value)){ return 0} return  Number(a.value) < Number(b.value) ? 1 : -1;
		});	
		
		result.forEach(function(v, i) {
			var data =  {
                    name: eval('v.'+item.field.toLowerCase()),
					/*name: v.field,*/
                    value: Number(v.value)
                }
			
			result_custom.push(data);
		});		 
         var option = {
        		 
        		    title : {        		      
        		    },
        		    tooltip : {
        		        trigger: 'item',
        		        formatter: "{b}: {c}"
        		    },
        		    toolbox: {
        		        show : false,        		        
        		    },
        		    calculable : false,
        		    series : [
        		        {
        		            name:' ',
        		            type:'treemap',
        		            itemStyle: {
        		                normal: {
        		                    label: {
        		                        show: true,
        		                        formatter: "{b}"
        		                    },
        		                    borderWidth: 1
        		                },
        		                emphasis: {
        		                    label: {
        		                        show: false
        		                    }
        		                }
        		            },
        		            data:result_custom
        		        }
        		    ]
        		};
         
         myChart.setOption(option);
		
	}
	
	var update = function(mode) {
		console.log("update");
		
		//루프 돌고 있는 객체가 있다면 클리어 한다.		
		if(this.interval_obj){			
			console.log('clearInterval');
			clearInterval(this.interval_obj);
			this.div_time.find('.play').html('Play');
		}
		
		var crs = this.map.getView().getProjection().code_;
		var extent = this.map.getView().calculateExtent(this.map.getSize());
		var _this = this;
				
		$(this.items).each(function(i,item){
			
			item = _this.items[i];	
			
			item.mapsync = item.mapsync || false;	
			
			var bbox = '';
			if(item.mapsync == true){
				bbox = '&bbox='+extent;
			}	
			
			var item_div = $("[name="+item.id+"]");			
			
			if( (mode == 'sync' && item.mapsync == true) || mode == undefined){	
				
				item_div.find(".display").text('Loading...');
				item_div.find(".display").addClass("blink_me");
				
				if(item.type=='group'){
					var column = item.column || item.field;					
					var url = _this.base_url + 'info';			
					url += '?Request=Category';
					url += '&type='+item.option;
					url += '&user='+item.userid;
					url += '&layer='+item.layer;
					url += '&column='+column;
					url += '&crs='+crs;
					url += bbox;
					url += '&aggregate='+item.field;
					
					$.getJSON(url, function (result) {
						
											
						item_div.find(".display").removeClass("blink_me");						
						item_div.find(".display").empty();		
						
						item.display = item.display || 'bar';
													
						if(item.display == 'bar'){
							drawGroupBar(result,item,item_div);	
						}else if(item.display == 'pie'){
							drawGroupPie(result,item,item_div);						
						}else if(item.display == 'treeMap'){	
							drawGroupTreeMap(result,item,item_div);	
						}
						
						item_div.find(".option").text(item.option);
						item_div.find(".title").text(item.title);		 		
					}); 
					
				}else if(item.type=='formula'){
					var url = _this.base_url + 'info';			
					url += '?Request=formula';
					url += '&type='+item.option;
					url += '&user='+item.userid;
					url += '&layer='+item.layer;
					url += '&column='+item.field;
					url += '&crs='+crs;
					url += bbox;
										
					var prev = item.prev || '';
					var next = item.next || '';
									
					$.getJSON(url, function (result) {	
							item_div.find(".display").removeClass("blink_me");
							var result = result[0].value; 
							result = result.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
							
							item_div.find(".display").text(prev + result + next);
							item_div.find(".option").text(item.option);
							item_div.find(".title").text(item.title);					
					}); 
					
				}else if(item.type=='histogram'){
					
					console.log('update histogram');
				
					var url = _this.base_url + 'info';			
					url += '?Request=Histogram';
					url += '&bucket='+item.bucket;
					url += '&user='+item.userid;
					url += '&layer='+item.layer;
					url += '&column='+item.field;
					url += '&crs='+crs;
					url += bbox;
									
					$.getJSON(url, function (result) {	
							
						//초기화 및 기본 셋팅
						item_div.find(".display").removeClass("blink_me");	
						item_div.find(".display").empty();	
						item_div.find(".title").text(item.title);					
						var tag = '';
						var controller_tag = '';
						
						//Max 값 구하기
						var max = 0;						
						var range_min = 0;
						var range_max = 0;
						
						if(result ==null || result.length == 0){return}
						
						//그래프 그리기
						result.forEach(function(data,i){							
							if(max < Number(data.cnt)){
								max = Number(data.cnt);
							}
							
							if(range_max < Number(data.pend)){
								range_max = Number(data.pend);
							}
							
							if(range_min > Number(data.pstart)){
								range_min = Number(data.pstart);
							}
						});
						
						item_div.find(".option").text(range_min+' ~ '+range_max);
												
						result.forEach(function(data,i){
							
							var h = parseInt(50*Number(data.cnt)/max);
							
							if(h < 3 && Number(data.cnt)>0){
								h=3;
							}
							
							var w = 100/result.length //100/Number(item.bucket);
							
							var	style	=	'height:'+h+'px;';
								style	+=	'width:'+w+'%;';
								style	+=	'margin-top:'+(50-h)+'px;';
							
								if(h>0){
									style	+=	'background-color:#ff846f;';
									style 	+= 	'border: 1px solid #dcdcdc;';
								}else{
									style	+=	'background-color:transparent;';
									/*style 	+= 	'border: 1px solid #dcdcdc;';*/
								}
								
							var tooltip = 'CNT:'+data.cnt +'\n'+
							              'S:'+data.pstart+'\n'+
							              'E:'+data.pend;
							
							var controller_style = 'border: 1px solid #dcdcdc;'+
							'height:10px;'+
							'width:'+w+'%;';
										
							tag += '<div class="bar" data-cnt="'+data.cnt+'" data-start="'+data.pstart+'"  data-end="'+data.pend+'" title="'+tooltip+'" style = "'+style+'"></div>';
							
							controller_tag += '<div style = "'+controller_style+'"></div>';
							
						});
						
						item_div.find(".display").append(tag);
						
						//컨트롤러 그리기
						
						var slider = item_div.find(".controller").data("ionRangeSlider");	
						if(slider){
							
						}else{
							var whiteSpace = item_div.find(".controller").width()/result.length;
							item_div.find(".controller").parent().css('padding-left',(whiteSpace/2-2)+'px');
							item_div.find(".controller").parent().css('padding-right',(whiteSpace/2-2)+'px');						
							item_div.find(".controller").ionRangeSlider({
								min:  1,
								from: 1,
							    to: result.length,		        
						        max: result.length,
						        type: 'double',
						        step: 1,
						        postfix: 'Lv',
						        prettify: false,
						        grid: false,
						        inputValuesSeparator: ';',
						        hide_min_max: true,
						        onUpdate :function(v){
						        	console.log('onUpdate');
						        	
						        	var div = v.input;
						        	
						        	var selectLv = div.val().split(';');							
									var chart = div.parent().siblings().find(".bar");	
																	
									var range_min = chart.eq(Number(selectLv[0])-1).data().start;
									var range_max = chart.eq(Number(selectLv[1])-1).data().end;								
								
									var ulayers = _this.mapManager.getAll();	
									
									ulayers.forEach(function(v,i){
										
										if(v.ogcParams.LAYERS == item.layer){
											
											
											var source = v.getOlLayer().getSource();
											source.updateParams({
												cql_filter: item.field+" >="+range_min +" AND " +item.field +" <= " + range_max
											});
										}
									});
						        },
						        onFinish:function(v){
						        	console.log('onFinish');
						        	
						        	var div = v.input;					        	
						        	var selectLv = div.val().split(';');							
									var chart = div.parent().siblings().find(".bar");	
																	
									var range_min = chart.eq(Number(selectLv[0])-1).data().start;
									var range_max = chart.eq(Number(selectLv[1])-1).data().end;						
								
									var ulayers = _this.mapManager.getAll();									
									ulayers.forEach(function(v,i){									
										if(v.ogcParams.LAYERS == item.layer){
											var source = v.getOlLayer().getSource();
											source.updateParams({
												cql_filter: item.field+" >="+range_min +" AND " +item.field +" <= " + range_max
											});
										}
									});	
						        },
						        onChange:function(v){	
						        	
						        	console.log('onChange');
						        	var div = v.input;					        	
						        	var selectLv = div.val().split(';');							
									var chart = div.parent().siblings().find(".bar");							
									chart.each(function(i){										
										if($(this).data().cnt > 0){
											if(i+1<selectLv[0]){
												$(this).css('background-color','#dcdcdc');
											}else if(i+1>selectLv[1]){
												$(this).css('background-color','#dcdcdc');
											}else{
												$(this).css('background-color','#ff846f');
											}	
										}
										
										var range_min = chart.eq(Number(selectLv[0])-1).data().start;
										var range_max = chart.eq(Number(selectLv[1])-1).data().end;
										
										range_min = range_min.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
										range_max = range_max.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
										
										div.parent().parent().find(".option").text(range_min+' ~ '+range_max);
									});								
						        },
							});
							
						}				    
					});
				}else if(item.type=='time'){
					
					
					console.log('update time');
					
					var url = _this.base_url + 'info';			
					url += '?Request=Histogram';
					url += '&bucket='+item.bucket;
					url += '&user='+item.userid;
					url += '&layer='+item.layer;
					url += '&column='+item.field;
					url += '&crs='+crs;
					url += bbox;
									
					$.getJSON(url, function (result) {	
						
						//초기화 및 기본 셋팅
						item_div.find(".display").removeClass("blink_me");	
						item_div.find(".display").empty();
						item_div.find(".title").text(item.title);					
						var tag = '';
						var controller_tag = '';
						
						//Max 값 구하기
						var max = 0;						
						var range_min = 0;
						var range_max = 0;
						
						if(result ==null || result.length == 0){return}
						
						//그래프 그리기
						result.forEach(function(data,i){							
							if(i==0 || max < Number(data.cnt)){
								max = Number(data.cnt);
							}
							
							if(i==0 || range_max < Number(data.pend)){
								range_max = Number(data.pend);
							}
							
							if(i==0 || range_min > Number(data.pstart)){
								range_min = Number(data.pstart);
							}
						});
						
						item_div.find(".option").text(new Date(range_min).toISOString()+' ~ '+new Date(range_max).toISOString());
												
						result.forEach(function(data,i){
							
							var h = parseInt(50*Number(data.cnt)/max);
							
							if(h < 3 && Number(data.cnt)>0){
								h=3;
							}
							
							var w = 100/result.length; //100/Number(item.bucket);
							
							var	style	=	'height:'+h+'px;';
								style	+=	'width:'+w+'%;';
								style	+=	'margin-top:'+(50-h)+'px;';
							
								if(h>0){
									style	+=	'background-color:#dcdcdc;';
									style 	+= 	'border: 1px solid white';
								}else{
									style	+=	'background-color:transparent;';
									/*style 	+= 	'border: 1px solid white;';*/
								}
								
							var tooltip = 'CNT:'+data.cnt +'\n'+
							              'S:'+new Date(data.pstart).toISOString()+'\n'+
							              'E:'+new Date(data.pend).toISOString();
							
							var controller_style = 'border: 1px solid #dcdcdc;'+
							'height:10px;'+
							'width:'+w+'%;';
										
							tag += '<div class="bar" data-cnt="'+data.cnt+'" data-start="'+data.pstart+'"  data-end="'+data.pend+'" title="'+tooltip+'" style = "'+style+'"></div>';
							
							controller_tag += '<div style = "'+controller_style+'"></div>';
							
						});
						
						item_div.find(".display").append(tag);
						
						//컨트롤러 그리기
						
						var slider = item_div.find(".controller").data("ionRangeSlider");	
						if(slider){						
							console.log('already created slider');						
						}else{
							var whiteSpace = item_div.find(".controller").width()/result.length;
							item_div.find(".controller").parent().css('padding-left',(whiteSpace/2-2)+'px');
							item_div.find(".controller").parent().css('padding-right',(whiteSpace/2-2)+'px');						
							item_div.find(".controller").ionRangeSlider({
								min:  1,
								from: 1,
							    //to: result.length,		        
						        max: result.length,
						        type: 'single',
						        step: 1,
						        postfix: 'Lv',
						        prettify: false,
						        grid: true,
						        inputValuesSeparator: ';',
						        hide_min_max: true,
						        onUpdate :function(v){
						        	console.log('onUpdate');
						        	
						        	var div = v.input;
						        	
						        	var selectLv = div.val();							
									var chart = div.parent().siblings().find(".bar");	
																	
									chart.each(function(i){										
										if($(this).data().cnt > 0){
											if( (i+1) == selectLv){
												$(this).css('background-color','#ff846f');
											}else{
												$(this).css('background-color','#dcdcdc');
											}	
										}
									});	
									
									var range_min = chart.eq(Number(selectLv)-1).data().start;
									var range_max = chart.eq(Number(selectLv)-1).data().end;
									
									var range_min_d = new Date(range_min).toISOString();
									var range_max_d = new Date(range_max).toISOString();	
									
									div.parent().parent().find(".option").text(range_min_d+' ~ '+range_max_d);
								
									var ulayers = _this.mapManager.getAll();
									ulayers.forEach(function(v,i){
										if(v.ogcParams.LAYERS == item.layer){
											var source = v.getOlLayer().getSource();
											source.updateParams({
												cql_filter: item.field+" >="+range_min +" AND " +item.field +" <= " + range_max,
												STYLES:'system:tempc644eb84-15a6-4940-99d4-ef4b29c5ef26',
											});
										}
									});
						        },
						        onFinish:function(v){
						        	console.log('onFinish');
						        	
						        	var div = v.input;					        	
						        	var selectLv = div.val();							
									var chart = div.parent().siblings().find(".bar");	
																	
									var range_min = chart.eq(Number(selectLv)-1).data().start;
									var range_max = chart.eq(Number(selectLv)-1).data().end;						
								
									var ulayers = _this.mapManager.getAll();									
									ulayers.forEach(function(v,i){									
										if(v.ogcParams.LAYERS == item.layer){
											var source = v.getOlLayer().getSource();
											source.updateParams({
												cql_filter: item.field+" >="+range_min +" AND " +item.field +" <= " + range_max , 
												BBOX : ''
											});
										}
									});	
						        },
						        onChange:function(v){	
						        	
						        	console.log('onChange');
						        	var div = v.input;					        	
						        	var selectLv = div.val();							
									var chart = div.parent().siblings().find(".bar");							
									chart.each(function(i){										
										if($(this).data().cnt > 0){
											if( (i+1) == selectLv){
												$(this).css('background-color','#dcdcdc');
											}else{
												$(this).css('background-color','#e5e5e5');
											}	
										}
										
										var range_min = chart.eq(Number(selectLv)-1).data().start;
										var range_max = chart.eq(Number(selectLv)-1).data().end;
										
										range_min = new Date(range_min).toISOString();
										range_max = new Date(range_max).toISOString();						
										
										
										div.parent().parent().find(".option").text(range_min+' ~ '+range_max);
									});								
						        },
						    }); 
							
							item_div.on('click','.play',function(e){							
								if($(this).html() =='Play'){
									/*$(this).removeClass("fa-play").addClass("fa-pause");*/
									$(this).html('Pause');
									var instance  = item_div.find(".controller").data("ionRangeSlider");
									_this.updateLayerByWidget(instance , _this , $(this).data().speed);
								}else if($(this).html() == 'Pause'){
									/*$(this).removeClass("fa-pause").addClass("fa-play");*/
									$(this).html('Play');
									clearInterval(_this.interval_obj);
								}
							});
							
							item_div.on('click','.reset',function(e){
								if($(this).html() == 'Pause'){
									$(this).html('Play');
/*									$(this).removeClass("fa-pause").addClass("fa-play");*/
									clearInterval(_this.interval_obj);
								}
								_this.update();
								var ulayers = _this.mapManager.getAll();	
								
								ulayers.forEach(function(v,i){
									
									if(v.ogcParams.LAYERS == item.layer){									
										var source = v.getOlLayer().getSource();
										source.updateParams({
											cql_filter: '',	
											STYLES:'system:default',
										});
									}
								});								
							});
						}
					});
				}
			}
		});		
	};	
	
	var get = function() {
	};
	
	var refresh = function() {
		
		var container = this.div.find("[name=widget_contents]");
		
		//debugger
		var time_container = this.div.parent().find(".time-container");
		
		//console.log(time_container);
		
		container.empty();	
		time_container.empty();
		
		var _this = this;
		
		this.items.forEach(function(item,i){
			
			item.id = item.id || guid();
			item.option = item.option || 'count';
			item.bucket = item.bucket || 30;
			
			if(item.type=='group'){
				_this.view(true);
				container.append(createGroupHTML(item));
			}else if(item.type=='formula'){
				_this.view(true);
				container.append(createFormulaHTML(item));
			}else if(item.type=='time'){
				time_container.show();
				time_container.append(createTimeHTML(item));
			}else if(item.type=='histogram'){
				_this.view(true);
				container.append(createHistogramHTML(item));
			}
		});
		
	};
	var view = function(flag) {
		if(flag){
			view_flag = flag;
			this.div.show();
		}else{
			view_flag = flag;
			this.div.hide();
		}
	};
	
	var createFormulaHTML = function(data) {
		
		var content = 	'	<div name="'+data.id+'" class="item-formula itme-widget">	'+
						'		<div class="pull-right ">		'+
						'				<label class="option"></label>	'+
						'			</div>	'+
						'			<div class="text-left">	'+
						'				<label class="title"></label>	'+	
						'			</div>				'+
						'			<div class="text-center">	'+
						'				<label class="display" ></label>	'+
						'			</div>				'+
						'		</div>	';	
		
		return content;
	};
	
	var createGroupHTML = function(data) {
				
		var content = 	'		<div name="'+data.id+'" class="item-group itme-widget">	'+
						'			<div class="pull-right ">		'+
						'				<label class="option"></label>	'+
						'			</div>	'+
						'			<div class="text-left">	'+
						'				<label class="title"></label>	'+	
						'			</div>				'+
						'			<div id ="'+data.id+'d"  class="display" >	'+							
						'			</div>				'+
						'		</div>	';	
		
		return content;
	}
	
	var createHistogramHTML = function(data) {
		var content = 	'		<div name="'+data.id+'" class="item-histogram itme-widget">	'+
						'			<div class="pull-right ">		'+
						'				<label class="option"></label>	'+
						'			</div>	'+
						'			<div class="text-left">	'+
						'				<label class="title"></label>	'+						
						'			</div>				'+
						'			<div class="display" style= " display: flex;  height:52px;" >	'+							
						'			</div>				'+
						'			<div>	'+	
						'				<div class="controller" style="display: flex;"></div>	'+
						'			</div>				'+
						'		</div>	';	
				
						return content;
	}
	
	var createTimeHTML = function(data) {
		var content = 	'		<div name="'+data.id+'" class="item-time itme-widget">	'+
						'			<div class="pull-right ">		'+
						'				<label class="option"></label>	'+
						'			</div>	'+
						'			<div class="text-left">	'+
						'				<label style="padding-right:10px;" class="title">'+data.title+'</label>	'+	
						'				<button data-speed = '+data.speed+' style="height: 20px;" class="btn btn-xs btn-primary play">Play</button>	'+
						'				<button style="height: 20px;" class="btn btn-xs btn-primary reset">Reset</button>	'+
						'			</div>				'+
						'			<div class="display" style= " display: flex;  height:52px;" >	'+						
						'			</div>				'+
						'			<div>	'+							
						'				<div class="controller" style="display: flex;"></div>	'+
						'			</div>				'+
						'		</div>	';	

		return content;
	}
	
	var guid = function() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	};
	
	return {
		exportItems : exportItems,
		importItems : importItems,
		init : init,
		addItem : addItem,
		removeItem : removeItem,
		getItem : getItem,
		update : update,
		get : get,
		refresh : refresh,
		view : view,
		setMapManager : setMapManager,
		updateLayerByWidget : updateLayerByWidget,
		loop:loop,
	}	
	
};