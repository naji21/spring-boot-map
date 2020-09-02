
var tocModule = function() {
    
    var _olMap;
    var _KEY;
    var _tocDIV;
    var _tocType;
    var _originCRS;
    
 
    var _tocOBJ = {
        WMS : undefined,
        WebWMS : undefined,
        WFS : undefined,
        WCS : undefined,
        WMTS : undefined,
        WebWMTS : undefined
    };
    

    
    var initTOC = function(options_) {
        var tocType = options_["TocType"];
        
        if ( tocType === 'WMS' ) {
            var tocWMS = new toc_WMS();
            tocWMS.init( options_ );
            _tocOBJ["WMS"] = tocWMS;
        } else if ( tocType === 'WebWMS' ) {
            var tocWebWMS = new toc_WebWMS();
            tocWebWMS.init( options_ );
            _tocOBJ["WebWMS"] = tocWMS;
        } else if ( tocType === 'WFS' || tocType === 'WebWFS') {
            var tocWFS = new toc_WFS();
            tocWFS.init( options_ );
            _tocOBJ["WFS"] = tocWFS;
            _tocOBJ["WebWFS"] = tocWFS;
        } else if ( tocType === 'WCS' ) {
            var tocWCS = new toc_WCS();
            tocWCS.init( options_ );
            _tocOBJ["WCS"] = tocWCS;
        } else if ( tocType === 'WMTS' ) {
            var tocWMTS = new toc_WMTS();
            tocWMTS.init( options_ );
            _tocOBJ["WMTS"] = tocWMTS;
        } else if ( tocType === 'WebWMTS' ) {
            var tocWMTS = new toc_WMTS();
            tocWMTS.init( options_ );
            _tocOBJ["WebWMTS"] = tocWMTS;
        }
    };
    
    
    
    
    var _defaultInit = function(options_) {
        _olMap = options_["OlMap"];
        _KEY = options_["KEY"];
        _tocDIV = options_["TocDIV"];
        _tocType = options_["TocType"];
        _originCRS = options_["OriginCRS"];
    };
    

    
    var toc_WMS = function() {
        var _this = this;
        var zTreeLayer;
        var zTreeAttribute;
        var olWMSLayer;
        var showLayerNames;
        
        this.init = function(attribute_) {
            /*
               var options = {
                    OlMap : map,
                    TocDIV : 'TOC_1',
                    TocType : 'WMS',
                    OriginCRS : 'EPSG:5181',
                    KEY : 'DT_ID_Group_Maple',
                    OlWMSLayer : wmsLayer,
                    isWebMap : false,
                    isLoadData : false,
                    LoadData : []
                    CallBacks : {
                        test : function(data) {
                            console.log('CallBack : test');
                            console.log(data);
                        }
                    }
               }
            */
            
            
            /*
             *  tocWMS Init
             */
            _defaultInit( attribute_ );
            
            _olMap.on('change:view', function(e) {
                _addUpdateScaleListener();
            });
            
            _this.olWMSLayer = attribute_["OlWMSLayer"];
            _this.zTreeAttribute = new zTreeAttribute_WMS( this );
            _this.zTreeLayer = OBJ_TOC_WMS["createTOC_WMS"]( attribute_, _this.zTreeAttribute["zTreeSetting_WMS"] );
            _addUpdateScaleListener();
            
            
            console.log('### TOC Init ###');
            console.log('TOC Type : ' + _tocType);
            console.log('Projection : ' + _originCRS);
            console.log('zTreeLayer : ' + _this.zTreeLayer);
            
        };
        
        
        this.layerSetVisible = function(e, treeId, treeNode) {
            //console.log( 'testOnCheck : ' + treeNode.id + ' = ' + treeNode.checked );            
            //console.log( _this.getZtreeLayerData() );            
            _olWMSLayerRefresh();
        };
        
        this.layerOrderChange = function(treeId, treeNodes, targetNode, moveType) {
			var state = false;
            
            if ( treeNodes[0] ) {
                var tocID = treeNodes[0]["tId"].split('_')[1];
                if ( treeId.split('_')[1] !== tocID ) {
                    return false;
                }
            } else {
                return false;
            }
            
		    if ( targetNode["isGroupLayer"] ) {
                state = ( targetNode["drop"] ) ? true : false;
                if ( targetNode["LayerName"] === 'ROOT' && moveType !== 'inner' ) {
                    state = false;
                }
            } else {
                state = ( moveType !== 'inner' ) ? true : false;
            }
		    
			return _layerOrderChange(state);
		}
        
        
        var _layerOrderChange = function(state) {
            if ( state ) {
                _olWMSLayerRefresh();
            }
            return state;
        };
        
        
        
        
        
        this.updateScale = function(layer, scale) {
            if (1) {
                /*if (layer == null) {
                    layer = this.rootLayer;
                }*/
                /*if (scale == null) {
                    scale = parseFloat( this.map.getView().getResolution() * 72 * 39.3701 );
                }*/
                //if (layer.checked !== false) {
                    //layer.checked = true;
                    if (!(layer["MinScale"] == 0 || scale >= layer["MinScale"])) {
                        layer.scaleCheck = 2;
                    } else {
                        layer.scaleCheck = 1;
                    }
                    if (!(layer["MaxScale"] == 0 || scale < layer["MaxScale"])) {
                        layer.scaleCheck = 2;
                    } else {
                        layer.scaleCheck = 1;
                    }
                    if (layer.scaleCheck == 2) {
                        //layer.checkImg.src = getImageLocation("scale_out.gif");
                        layer.chkDisabled = true;
                    } else {
                        //layer.checkImg.src = getImageLocation("check_on.gif");
                        layer.chkDisabled = false;
                    }
                //}
                var children = layer.children;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    //_this.updateScale( child, scale );
                    arguments.callee( child, scale );
                }
            }
        };
        
        var _addUpdateScaleListener = function() {
            _olMap.getView().on('change:resolution', _changeResolution);
            _changeResolution();
        };
        
        
        var _changeResolution = function() {
            var scale = parseFloat( _olMap.getView().getResolution() * 72 * 39.3701 );
            
            //console.log( '_changeResolution : ' + scale );
            
            var layers = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];
            _this.updateScale( layers, scale );
            $.fn.zTree.getZTreeObj( _tocDIV ).refresh();
            _olWMSLayerRefresh();
        }
        
        
        
        
        var _getZtreeLayerData = function(layers, names, type) {
            var layer = [ layers ];
            for (var i in layer) {
                var data = layer[i];

                if ( (type === 'show' && data["checked"] === false) || (type === 'show' && data["chkDisabled"] === true) ) {
                    return;
                }

                if ( data.isGroupLayer ) {
                    var childs = data["children"];
                    for (var j = childs.length; --j >= 0;) {
                        var child = childs[j];
                        //_getZtreeLayerData( child, names, type );
                        arguments.callee( child, names, type );
                    }
                } else {
                    names.push( data["LayerName"] );						
                }
            }
            
            return names;
        };
        
        
        var _olWMSLayerRefresh = function() {
            setTimeout(function() {
                _this.olWMSLayer.getSource().getParams().LAYERS = _this.getZtreeLayerData()
                _this.olWMSLayer.getSource().updateParams( _this.olWMSLayer.getSource().getParams() );
            }, 50);
        };
        
        
        this.getZtreeLayerData = function() {
            var layerNames = [];
            var layers = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];            
            layerNames = _getZtreeLayerData( layers, layerNames, 'show' );
            layerNames = ( typeof layerNames === 'undefined' ) ? '' : layerNames.toString();
            showLayerNames = layerNames;
            return layerNames;
        };
        
        
        this.getShowLayerNames = function() {
            return showLayerNames;
        };
        
    };
    
    
    
    
    
    
    
    
    var _addDIYDom_WFS = function(treeId, treeNode) {
        
        if ( treeNode["parentNode"] && treeNode["parentNode"]["id"] !== 2 ) return;
        
        var aObj = $("#" + treeNode.tId + '_a');
        //var cbx_FeatureInfoID = 'cbx_FID_' + treeNode.id + '_' + treeNode.tId;        
        //var btn_columnID = 'btn_CID_' + treeNode.id + '_' + treeNode.tId;
        
        var cbx_FeatureInfoID = 'cbx_FID_' + treeNode.tId;        
        var btn_columnID = 'btn_CID_' + treeNode.tId;
        
        aObj.css('clear', 'both');
        aObj.css('height', 'auto');

        var checked = (treeNode.UseFeatureInfo) ? 'checked' : '';
        
        var title = '';
        var columnSetting = '';
        
        if ( typeof i18n === 'function' ) {
            title = i18n('WM043');
            columnSetting = i18n('WM044');
        } else {
            title = '정보조회 활성화';
            columnSetting = '컬럼설정';
        }
        
        var editStr1 = 
        '<div name="wfsInfo" style="margin-left: 35px; line-height:15px;" title="' + title + '" onfocus="this.blur();">' + 
            //'<label>' +
                '<input type="checkbox" style="margin-right: 2px;" id="' + cbx_FeatureInfoID + '"' + checked + '/>' + 
                '<label style="font-weight:normal;font-size:12px; vertical-align:top; margin-top:3px" for="' + cbx_FeatureInfoID + '">' + title + '</label>' + 
            //'</label>' + 
        '</div>';



        var editStr2 = 
        /*
        '<div style="margin-left: 35px; line-height:15px;" title="' + columnSetting + '" onfocus="this.blur();>">' + 
            //'<label>' + 
                '<span style="font-size:12px; vertical-align:top;">' + columnSetting + '</span>' + 
                '<span class="button icon02" id="' + btn_columnID + '"></span>' + 
            //'</label>' + 
        '</div>';
        */
        '<div name="wfsInfo" style="margin-left: 35px; line-height:15px;" title="' + columnSetting + '" onfocus="this.blur();>">' + 
            //'<label>' + 
                '<span style="cursor: pointer; "id="' + btn_columnID + '">' + 
                    '<i class="icon-gwp-admin icon-gwp-sm"></i>' + 
                    '<span style="font-size: 12px; vertical-align:top; margin-left: 2px;">' + columnSetting + '</span>' + 
                '</span>' + 
            //'</label>' + 
        '</div>';
        

        aObj.after(editStr2);
        aObj.after(editStr1);
        
        
        
        
        
        var check = $("#" + cbx_FeatureInfoID);
        if ( check ) {
            check.on('change', function() {
                var treeObj = $.fn.zTree.getZTreeObj( _tocDIV );
                treeNode["UseFeatureInfo"] = check.is(":checked");
                treeObj.updateNode( treeNode );
                
                
                _tocOBJ[_tocType].callBacks.setEnableLayer( _tocOBJ[_tocType].olWFSLayer, check.is(":checked") );
                
                
            });
        }
        
        
        

        var btn = $("#" + btn_columnID);
        
        if ( btn ) {
            btn.on('click', function() {
                var treeObj = $.fn.zTree.getZTreeObj( _tocDIV );
     
                //treeNode["UseFeatureInfo"] = !treeNode["UseFeatureInfo"];                
                //treeObj.updateNode( treeNode );
                
                
                /*
                var obj = {
                    originFields : [
                        'col1', 'col2', 'col4'
                    ],
                    userFields : {
                        col1 : 'col1_user',
                        col2 : 'col2_user',
                        col3 : 'col3_user'
                    },
                    commit : function(el1) {
                        console.log( el1 );
                        console.log( treeObj );
                    }
                };
                */
                
                
                var updateData = function(userProperties_) {
                    _tocOBJ[_tocType]["olWFSLayer"].set("UserProperties", userProperties_)
                    treeNode["UserProperties"] = userProperties_;
                    treeObj.updateNode( treeNode );
                };
                
                
                _tocOBJ[_tocType].callBacks.setUserProperties( updateData );
                
                
            });
        }
        
    };
    
    
    
    
    
    
    
    
    
    var _addDIYDom_WMS = function(treeId, treeNode) {
        if ( treeNode["parentNode"] && treeNode["parentNode"]["id"] !== 2 ) return;
        
        var aObj = $("#" + treeNode.tId + '_a');
        if ( treeNode["LegendURL"] !== null && treeNode["LegendURL"] !== undefined ) {
            aObj.css('clear', 'both');
            aObj.css('height', 'auto');
            var editStr = "<br><img src='" + treeNode["LegendURL"] + "'>";
            aObj.append( editStr );

            _setLegendExpand( aObj );

        }
    };

    var _setLegendExpand = function(aObj) {
        var level = aObj.attr('class');
        var cl = 'button ' + level + ' swith bottom_';
        var btn = aObj.parent().find('span').eq(0);

        btn.removeClass();

        var OPEN = 'open';
        var CLOSE = 'close';

        btn.addClass(cl + OPEN);
        btn.attr('state', OPEN);

        btn.on('click', function() {
            var state = $(this).attr('state');

            if ( state === 'open' ) {
                aObj.find('img').hide();
                btn.removeClass();
                btn.addClass(cl + CLOSE);
                btn.attr('state', CLOSE);
            } else if ( state === 'close' ) {
                aObj.find('img').show();
                btn.removeClass();
                btn.addClass(cl + OPEN);
                btn.attr('state', OPEN);
            }

        });
    };
    
    
    
    
    var zTreeAttribute_WMS = function(toc_WMS_) {
        var zTreeSetting_WMS = {
            view : {
                selectedMulti : false,
                expandSpeed : 'fast',
                addDiyDom : _addDIYDom_WMS
            },
            check : {
                autoCheckTrigger : true,
                enable : true,
                chkboxType : { "Y" : "", "N" : "" }
            },
            data : {
                simpleData : {
                    enable : true
                }
            },
            edit : {
                enable : true,
                showRemoveBtn : false,
                showRenameBtn : false
            },
            callback : {
                onCheck: toc_WMS_.layerSetVisible,
                beforeDrop : toc_WMS_.layerOrderChange,
				//onCollapse : onCollapse,
				//onExpand : onExpand
            },
            async : {
                enable : true
            }
        };
    
        return {
            zTreeSetting_WMS : zTreeSetting_WMS
        }
    };
    
    
    
    
    var OBJ_TOC_WMS = {
        
        createTOC_WMS : function(attribute_, zTreeSetting_WMS_) {
            var wmsZtreeLayer;
            var originWMSztreeLayer = this.getWMSNodeTozTree( this.getWMSLayerData( attribute_ )["Layers"] );
            
            if ( attribute_["isWebMap"] ) {
                var noneGroupLayers = _getNoneGroupLayers( originWMSztreeLayer, [] );
                originWMSztreeLayer["children"] = noneGroupLayers;
                wmsZtreeLayer = originWMSztreeLayer;
                
                if ( attribute_["isLoadData"] ) {
                    wmsZtreeLayer = this.getLoadData( originWMSztreeLayer, attribute_["LoadData"]["Layers"] );
                }
                
            } else {
                wmsZtreeLayer = originWMSztreeLayer;                
            }
            
            $.fn.zTree.init( $("#" + _tocDIV ), zTreeSetting_WMS_, wmsZtreeLayer );
            
            return wmsZtreeLayer;
        },
        
        getWMSLayerData : function(attribute_) {
            /*
            var attribute = {
                CRS : 'EPSG:3857',
                KEY : 'DT_ID_1',
                BaseMapType : 'daum_normal',
                capabilitiesJSON : {}
            };
            */
            var wmsLayerData = {
                CRS : attribute_["CRS"],
                KEY : attribute_["KEY"],
                BaseMapType : attribute_["BaseMapType"],
                //FullExtent : [0.0, 0.0, 0.0, 0.0],
                ViewExtent : [0.0, 0.0, 0.0, 0.0],
                isViewExtent : false,
                Layers : []
            };

            var capabilitiesJSON = attribute_["CapabilitiesJSON"]["WMS_Capabilities"]["Capability"]["Layer"];
            var layers = this.getWMSCapabilitieLayerData( [ capabilitiesJSON ] );
            wmsLayerData["Layers"].push( layers );

            return wmsLayerData;
        },
        
        getWMSCapabilitieLayerData : function(node_) {
            var layerData = {
                LayerName : layerName,
                Title : title,
                Extent : extent,
                MinScale : minScale,
                MaxScale : maxScale,
                LegendURL : legendURL,
                isGroupLayer : false,
                isVisible : true,
                ChildLayers: []
            };

            for(var i in node_) {
                var title = node_[i]["Title"]["#text"];
                var layerName = node_[i]["Name"]["#text"];
                var extent = node_[i]["BoundingBox"]["@attributes"];
                    extent = [
                        parseFloat(extent["minx"]),
                        parseFloat(extent["miny"]),
                        parseFloat(extent["maxx"]),
                        parseFloat(extent["maxy"])
                    ];
                var minScale = node_[i]["MinScaleDenominator"]["#text"];
                    minScale = parseFloat( minScale );
                var maxScale = node_[i]["MaxScaleDenominator"];
                if ( typeof maxScale !== 'undefined' ) {
                    maxScale = parseFloat( maxScale["#text"] );
                }
                var style = node_[i]["Style"];
                var legendURL;
                if ( typeof style !== 'undefined' ) {
                	if ( typeof style["LegendURL"] !== 'undefined' ) {
                		legendURL = style["LegendURL"]["OnlineResource"]["@attributes"]["xlink:href"];
                	}                    
                }

                var childLayer = node_[i]["Layer"];
                
                if ( !Array.isArray( childLayer ) && typeof childLayer !== 'undefined') {
                    childLayer = [ childLayer ];
                }

                if ( Array.isArray( childLayer ) ) {
                    layerData["isGroupLayer"] = true;
                    for (var j=childLayer.length; --j >= 0;) {
                        //layerData["ChildLayers"].push( this.getWMSCapabilitieLayerData( [ childLayer[j] ] ) );
                        layerData["ChildLayers"].push( arguments.callee( [ childLayer[j] ] ) );
                    }
                }
                
                layerData["LayerName"] = layerName;
                layerData["Title"] = title;
                layerData["Extent"] = extent;
                layerData["MinScale"] = minScale;
                layerData["MaxScale"] = maxScale;
                layerData["LegendURL"] = legendURL;
                
            }

            return layerData;
        },
        
        getWMSNodeTozTree : function(node_) {
            
            var layer = {
                id : null,
                name : null,
                //title : null,
                children : [],   
                open : false,
                drop : true,
                //inner : true,
                checked : true,                
                LayerName : null,
                isGroupLayer : false,
                LegendURL : null,
                MinScale : 0,
                MaxScale : 0,
                Extent : null,
                scaleCheck : 1,
                chkDisabled : false,
                //isAddedLayer : false,
                //isDeletedLayer : false
            };

            for(var i in node_) {
                /*
                var node = {
                    LayerName : layerName,
                    Title : title,
                    Extent : extent,
                    MinScale : minScale,
                    MaxScale : maxScale,
                    LegendURL : legendURL,
                    isGroupLayer : false,
                    isVisible : true,
                    Opacity : 1.0,
                    ChildLayers: []
                };
                */

                layer["name"] = node_[i]["Title"];
                layer["id"] = node_[i]["LayerName"];
                layer["LayerName"] = node_[i]["LayerName"];

                if ( layer["id"] === 'ROOT' ) {
                    layer["open"] = true;
                }

                layer["LegendURL"] = node_[i]["LegendURL"];

                var minScale = node_[i]["MinScale"];
                if ( typeof minScale !== 'undefined' ) {
                    layer["MinScale"] = minScale;
                }

                var maxScale = node_[i]["MaxScale"];
                if ( typeof maxScale !== 'undefined' ) {
                    layer["MaxScale"] = maxScale;
                }

                layer["Extent"] = node_[i]["Extent"];
                layer["isGroupLayer"] = node_[i]["isGroupLayer"];
                
                var childLayers = node_[i]["ChildLayers"];
                if ( childLayers.length > 0 ) {
                    //for (var j=child.length; --j >= 0;) {
                    for(var j=0; j<childLayers.length; j++) {
                        //layer["children"].push( this.getWMSNodeTozTree( [ childLayers[j] ] ) );
                        layer["children"].push( arguments.callee( [ childLayers[j] ] ) );
                        
                    }
                } else {
                    //layer["inner"] = false;
                    layer["drop"] = false;
                }

            }

            return layer;
        },
        
        
        getLoadData : function(originWMSztreeLayer_, loadData_) {
            var reLoadData = [];
            var noneGroupLayers_origin = [];
            noneGroupLayers_origin = _getNoneGroupLayers( originWMSztreeLayer_, noneGroupLayers_origin );
            /*
            for(var i in noneGroupLayers_origin) {
                var originLayer = noneGroupLayers_origin[i];
                for(var j in loadData_) {
                    var loadLayer = loadData_[j];
                    if ( originLayer["LayerName"] === loadLayer["LayerName"] ) {
                        originLayer["checked"] = loadLayer["checked"];
                    }
                }
            }
            */
            var temp = [];
            for(var i in loadData_) {
                var loadLayer = loadData_[i];
                for(var j in noneGroupLayers_origin) {
                    var originLayer = noneGroupLayers_origin[j];
                    if ( originLayer["LayerName"] === loadLayer["LayerName"] ) {
                        originLayer["checked"] = loadLayer["checked"];
                        temp.push( noneGroupLayers_origin.slice( j, j+1 )[0] );
                        noneGroupLayers_origin.splice( j, 1 );
                    }
                }
            }
            
            reLoadData = noneGroupLayers_origin.concat( temp );
            
            originWMSztreeLayer_["children"] = reLoadData;
            
            return originWMSztreeLayer_;
        }
        
    };










    var toc_WFS = function() {
        var _this = this;
        var zTreeLayer;
        var zTreeAttribute;
        var olWFSLayer;
        var callBacks;
        
        this.init = function(attribute_) {
            /*
               var options = {
                    OlMap : map,
                    TocDIV : 'TOC_1',
                    TocType : 'WFS',
                    OriginCRS : 'EPSG:5181',
                    KEY : 'DT_ID_Group_Maple',
                    OlWFSLayer : wfsLayer,
                    LayerName : 'LV14_SCCO_EMD',
                    LayerTitle : 'LV14_SCCO_EMD-Title',
                    authority : false, // toc 컨트롤 권한
                    isWebMap : false,
                    isLoadData : false,
                    LoadData : {
                        Checked : false,
                        UserProperties
                        Style : {
                            LineColor : '',
                            LineWidth : 10
                            // To do - 스타일
                        }
                    },
                    CallBacks : {
                        test : function(data) {
                            console.log('CallBack : test');
                            console.log(data);
                        }
                    }
               }
            */
            
            
            /*
             *  tocWFS Init
             */
            _defaultInit( attribute_ );
            _this.olWFSLayer = attribute_["OlWFSLayer"];
            _this.callBacks = attribute_["CallBacks"];
            _this.zTreeAttribute = new zTreeAttribute_WFS( this );
            _this.zTreeLayer = OBJ_TOC_WFS["createTOC_WFS"]( attribute_, _this.zTreeAttribute["zTreeSetting_WFS"] );            
            
            _olWFSLayerRefresh();
            
            console.log('### TOC Init ###');
            console.log('TOC Type : ' + _tocType);
            console.log('Projection : ' + _originCRS);
            console.log('zTreeLayer : ' + _this.zTreeLayer);
        };
        
        
        this.layerSetVisible = function(e, treeId, treeNode) {
            _this.olWFSLayer.setVisible( !(_this.olWFSLayer.getVisible()) );
        };
        

        
        var _olWFSLayerRefresh = function() {
            _this.olWFSLayer.setVisible( _this.getZtreeLayerWFSchecked() );
        };
        
        
        this.getZtreeLayerWFSchecked = function() {
            var layer = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];            
            return layer["checked"];
        };

    };
    









    var zTreeAttribute_WFS = function(toc_WFS_) {
        var zTreeSetting_WFS = {
            view : {
                selectedMulti : false,
                expandSpeed : 'fast',
                addDiyDom : _addDIYDom_WFS
            },
            check : {
                enable : true,
                chkboxType : { "Y" : "", "N" : "" }
            },
            data : {
                simpleData : {
                    enable : true
                }
            },
            edit : {
                enable : true,
                showRemoveBtn : false,
                showRenameBtn : false
            },
            callback : {
                onCheck: toc_WFS_.layerSetVisible
            },
            async : {
                enable : true
            }
        };
    
        return {
            zTreeSetting_WFS : zTreeSetting_WFS
        }
    };



    var OBJ_TOC_WFS = {
        
        createTOC_WFS : function(attribute_, zTreeSetting_WFS_) {
            var wfsZtreeLayer;
            var originWFSztreeLayer = this.getWFSNodeTozTree( this.getWFSLayerData( attribute_ ) );
            
            if ( attribute_["isWebMap"] ) {
                wfsZtreeLayer = originWFSztreeLayer;
                
                if ( attribute_["isLoadData"] ) {
                    wfsZtreeLayer = this.getLoadData( originWFSztreeLayer, attribute_["LoadData"] );
                }
                
            } else {
                wfsZtreeLayer = originWFSztreeLayer;                
            }
            
            $.fn.zTree.init( $("#" + _tocDIV ), zTreeSetting_WFS_, wfsZtreeLayer );
            
            return wfsZtreeLayer;
        },
        
        getWFSLayerData : function(attribute_) {
            /*
            var attribute = {
                CRS : 'EPSG:3857',
                KEY : 'DT_ID_1',
                //BaseMapType : 'daum_normal',
                LayerName : 'LV14_SCCO_EMD'
            };
            */
            var wfsLayerData = {
                CRS : attribute_["CRS"],
                KEY : attribute_["KEY"],
                LayerName : attribute_["LayerName"],
                LayerTitle : attribute_["LayerTitle"]
            };

            return wfsLayerData;
        },
        
        getWFSNodeTozTree : function(attribute_) {
            
            var layer = {
                id : attribute_["LayerName"],
                name : attribute_["LayerTitle"],
                //title : null,
                children : [],
                open : true,
                drop : false,
                inner : false,
                checked : true,
                LayerName : attribute_["LayerName"],
                isGroupLayer : false,
                LegendURL : null,
                Extent : null,
                chkDisabled : false,
                UseFeatureInfo : true,
                UserProperties : {
                    UseYN : false,
                    Properties : {
                        
                    }
                }
            };

            return layer;
        },
        
        
        getLoadData : function(originWFSztreeLayer_, loadData_) {
            var loadztreeLayer;
            
            originWFSztreeLayer_["checked"] = loadData_["Layers"][0]["checked"];
            originWFSztreeLayer_["UseFeatureInfo"] = loadData_["UseFeatureInfo"];
            originWFSztreeLayer_["UserProperties"] = loadData_["UserProperties"];
            
            // To do - 스타일
            
            
            loadztreeLayer = originWFSztreeLayer_;
            
            return loadztreeLayer;
        }
        
    };











    var toc_WCS = function() {
        var _this = this;
        var zTreeLayer;
        var zTreeAttribute;
        var olWCSLayer;
        var callBacks;
        
        this.init = function(attribute_) {
            /*
               var options = {
                    OlMap : map,
                    TocDIV : 'TOC_1',
                    TocType : 'WCS',
                    OriginCRS : 'EPSG:5181',
                    KEY : 'DT_ID_Group_Maple',
                    OlWCSLayer : wcsLayer,
                    Coverage : 'LV14_SCCO_EMD.jpg',
                    isWebMap : false,
                    isLoadData : false,
                    LoadData : {
                        Checked : false
                    },
                    CallBacks : {
                        test : function(data) {
                            console.log('CallBack : test');
                            console.log(data);
                        }
                    }
               }
            */
            
            
            /*
             *  tocWCS Init
             */
            _defaultInit( attribute_ );
            _this.olWCSLayer = attribute_["OlWCSLayer"];
            _this.callBacks = attribute_["CallBacks"];
            _this.zTreeAttribute = new zTreeAttribute_WCS( this );
            _this.zTreeLayer = OBJ_TOC_WCS["createTOC_WCS"]( attribute_, _this.zTreeAttribute["zTreeSetting_WCS"] );            
            
            _olWCSLayerRefresh();
            
            console.log('### TOC Init ###');
            console.log('TOC Type : ' + _tocType);
            console.log('Projection : ' + _originCRS);
            console.log('zTreeLayer : ' + _this.zTreeLayer);
        };
        
        
        this.layerSetVisible = function(e, treeId, treeNode) {
            _this.olWCSLayer.setVisible( !(_this.olWCSLayer.getVisible()) );
        };
        

        
        var _olWCSLayerRefresh = function() {
            _this.olWCSLayer.setVisible( _this.getZtreeLayerWCSchecked() );
        };
        
        
        this.getZtreeLayerWCSchecked = function() {
            var layer = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];            
            return layer["checked"];
        };

    };
    









    var zTreeAttribute_WCS = function(toc_WCS_) {
        var zTreeSetting_WCS = {
            view : {
                selectedMulti : false,
                expandSpeed : 'fast',
                addDiyDom : _addDIYDom_WMS
            },
            check : {
                enable : true,
                chkboxType : { "Y" : "", "N" : "" }
            },
            data : {
                simpleData : {
                    enable : true
                }
            },
            edit : {
                enable : true,
                showRemoveBtn : false,
                showRenameBtn : false
            },
            callback : {
                onCheck: toc_WCS_.layerSetVisible
            },
            async : {
                enable : true
            }
        };
    
        return {
            zTreeSetting_WCS : zTreeSetting_WCS
        }
    };



    var OBJ_TOC_WCS = {
        
        createTOC_WCS : function(attribute_, zTreeSetting_WCS_) {
            var wcsZtreeLayer;
            var originWCSztreeLayer = this.getWCSNodeTozTree( this.getWCSLayerData( attribute_ ) );
            
            if ( attribute_["isWebMap"] ) {
                wcsZtreeLayer = originWCSztreeLayer;
                
                if ( attribute_["isLoadData"] ) {
                    wcsZtreeLayer = this.getLoadData( originWCSztreeLayer, attribute_["LoadData"] );
                }
                
            } else {
                wcsZtreeLayer = originWCSztreeLayer;
            }
            
            $.fn.zTree.init( $("#" + _tocDIV ), zTreeSetting_WCS_, wcsZtreeLayer );
            
            return wcsZtreeLayer;
        },
        
        getWCSLayerData : function(attribute_) {
            /*
            var attribute = {
                CRS : 'EPSG:3857',
                KEY : 'DT_ID_1',
                //BaseMapType : 'daum_normal',
                Coverage : 'LV14_SCCO_EMD.jpg'
            };
            */
            var wcsLayerData = {
                CRS : attribute_["CRS"],
                KEY : attribute_["KEY"],
                Coverage : attribute_["Coverage"]
            };

            return wcsLayerData;
        },
        
        getWCSNodeTozTree : function(attribute_) {
            
            var layer = {
                id : attribute_["Coverage"],
                name : attribute_["Coverage"],
                //title : null,
                children : [],
                open : true,
                drop : false,
                inner : false,
                checked : true,
                Coverage : attribute_["Coverage"],
                isGroupLayer : false,
                LegendURL : null,
                Extent : null,
                chkDisabled : false
            };

            return layer;
        },
        
        
        getLoadData : function(originWCSztreeLayer_, loadData_) {
            var loadztreeLayer;
            
            originWCSztreeLayer_["checked"] = loadData_["Layers"][0]["checked"];            
            
            loadztreeLayer = originWCSztreeLayer_;
            
            return loadztreeLayer;
        }
        
    };
    









    var toc_WebWMS = function() {
        var _this = this;
        var zTreeLayer;
        var zTreeAttribute;
        var olWMSLayer;
        
        this.init = function(attribute_) {
            /*
               var options = {
                    OlMap : map,
                    TocDIV : 'TOC_1',
                    TocType : 'WebWMS',
                    OriginCRS : 'EPSG:5181',
                    KEY : 'http://geonuris?wms',
                    OlWMSLayer : wmsLayer,
                    isWebMap : false,
                    isLoadData : false,
                    LoadData : []
                    CallBacks : {
                        test : function(data) {
                            console.log('CallBack : test');
                            console.log(data);
                        }
                    }
               }
            */
            
            
            /*
             *  tocWebWMS Init
             */
            _defaultInit( attribute_ );
            
            _olMap.on('change:view', function(e) {
                _addUpdateScaleListener();
            });
            
            _this.olWMSLayer = attribute_["OlWMSLayer"];
            _this.zTreeAttribute = new zTreeAttribute_WebWMS( this );
            _this.zTreeLayer = OBJ_TOC_WebWMS["createTOC_WebWMS"]( attribute_, _this.zTreeAttribute["zTreeSetting_WebWMS"] );
            _addUpdateScaleListener();
            
            
            console.log('### TOC Init ###');
            console.log('TOC Type : ' + _tocType);
            console.log('Projection : ' + _originCRS);
            console.log('zTreeLayer : ' + _this.zTreeLayer);
            
        };
        
        
        this.layerSetVisible = function(e, treeId, treeNode) {
            //console.log( 'testOnCheck : ' + treeNode.id + ' = ' + treeNode.checked );            
            //console.log( _this.getZtreeLayerData() );            
            _olWMSLayerRefresh();
        };
        
        this.layerOrderChange = function(treeId, treeNodes, targetNode, moveType) {
			var state = false;
            
            if ( treeNodes[0] ) {
                var tocID = treeNodes[0]["tId"].split('_')[1];
                if ( treeId.split('_')[1] !== tocID ) {
                    return false;
                }
            } else {
                return false;
            }
            
		    if ( targetNode["isGroupLayer"] ) {
                state = ( targetNode["drop"] ) ? true : false;
                if ( targetNode["LayerName"] === 'ROOT' && moveType !== 'inner' ) {
                    state = false;
                }
            } else {
                state = ( moveType !== 'inner' ) ? true : false;
            }
		    
			return _layerOrderChange(state);
		}
        
        
        var _layerOrderChange = function(state) {
            if ( state ) {
                _olWMSLayerRefresh();
            }
            return state;
        };
        
        
        
        
        
        this.updateScale = function(layer, scale) {
            if (1) {
                /*if (layer == null) {
                    layer = this.rootLayer;
                }*/
                /*if (scale == null) {
                    scale = parseFloat( this.map.getView().getResolution() * 72 * 39.3701 );
                }*/
                //if (layer.checked !== false) {
                    //layer.checked = true;
                    if (!(layer["MinScale"] == 0 || scale >= layer["MinScale"])) {
                        layer.scaleCheck = 2;
                    } else {
                        layer.scaleCheck = 1;
                    }
                    if (!(layer["MaxScale"] == 0 || scale < layer["MaxScale"])) {
                        layer.scaleCheck = 2;
                    } else {
                        layer.scaleCheck = 1;
                    }
                    if (layer.scaleCheck == 2) {
                        //layer.checkImg.src = getImageLocation("scale_out.gif");
                        layer.chkDisabled = true;
                    } else {
                        //layer.checkImg.src = getImageLocation("check_on.gif");
                        layer.chkDisabled = false;
                    }
                //}
                var children = layer.children;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    //_this.updateScale( child, scale );
                    arguments.callee( child, scale );
                }
            }
        };
        
        var _addUpdateScaleListener = function() {
            _olMap.getView().on('change:resolution', _changeResolution);
            _changeResolution();
        };
        
        
        var _changeResolution = function() {
            var scale = parseFloat( _olMap.getView().getResolution() * 72 * 39.3701 );
            
            c//onsole.log( '_changeResolution : ' + scale );
            
            var layers = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];
            _this.updateScale( layers, scale );
            $.fn.zTree.getZTreeObj( _tocDIV ).refresh();
            _olWMSLayerRefresh();
        }
        
        
        
        
        var _getZtreeLayerData = function(layers, names, type) {
            var layer = [ layers ];
            for (var i in layer) {
                var data = layer[i];

                if ( (type === 'show' && data["checked"] === false) || (type === 'show' && data["chkDisabled"] === true) ) {
                    return;
                }

                if ( data.isGroupLayer ) {
                    var childs = data["children"];
                    for (var j = childs.length; --j >= 0;) {
                        var child = childs[j];
                        //_getZtreeLayerData( child, names, type );
                        arguments.callee( child, names, type );
                    }
                } else {
                    names.push( data["LayerName"] );						
                }
            }
            
            return names;
        };
        
        
        var _olWMSLayerRefresh = function() {
            setTimeout(function() {
                _this.olWMSLayer.getSource().getParams().LAYERS = _this.getZtreeLayerData()
                _this.olWMSLayer.getSource().updateParams( _this.olWMSLayer.getSource().getParams() );
                
                if ( _this.olWMSLayer.getSource().getParams().LAYERS === '' ) {
                    _this.olWMSLayer.setVisible("false");
                } else {
                    if ( !(_this.olWMSLayer.getVisible()) ) {
                        _this.olWMSLayer.setVisible("true");
                    }
                }
                
            }, 50);
        };
        
        
        this.getZtreeLayerData = function() {
            var layerNames = [];
            var layers = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];            
            layerNames = _getZtreeLayerData( layers, layerNames, 'show' );
            
            return ( typeof layerNames === 'undefined' ) ? '' : layerNames.toString();
        };
        
    };






    var zTreeAttribute_WebWMS = function(toc_WebWMS_) {
        var zTreeSetting_WebWMS = {
            view : {
                selectedMulti : false,
                expandSpeed : 'fast',
                addDiyDom : _addDIYDom_WMS
            },
            check : {
                //autoCheckTrigger : true,
                enable : true,
                chkboxType : { "Y" : "", "N" : "" }
            },
            data : {
                simpleData : {
                    enable : true
                }
            },
            edit : {
                enable : true,
                showRemoveBtn : false,
                showRenameBtn : false
            },
            callback : {
                onCheck: toc_WebWMS_.layerSetVisible,
                beforeDrop : toc_WebWMS_.layerOrderChange,
				//onCollapse : onCollapse,
				//onExpand : onExpand
            },
            async : {
                enable : true
            }
        };
    
        return {
            zTreeSetting_WebWMS : zTreeSetting_WebWMS
        }
    };
    
    
    
    
    var OBJ_TOC_WebWMS = {
        
        createTOC_WebWMS : function(attribute_, zTreeSetting_WebWMS_) {
            var webWMSZtreeLayer;
            var originWebWMSztreeLayer = this.getWebWMSNodeTozTree( this.getWebWMSLayerData( attribute_ )["Layers"] );
            
            if ( attribute_["isWebMap"] ) {
                var noneGroupLayers = _getNoneGroupLayers( originWebWMSztreeLayer, [] );
                originWebWMSztreeLayer["children"] = noneGroupLayers;
                webWMSZtreeLayer = originWebWMSztreeLayer;
                
                if ( attribute_["isLoadData"] ) {
                    var layerNames = [];
                    for(var i in attribute_["LoadData"]["Layers"]) {
                        layerNames.push( attribute_["LoadData"]["Layers"][i]["LayerName"] );
                    }
                    
                    webWMSZtreeLayer = this.getSelectLayers( webWMSZtreeLayer, layerNames );
                    
                    webWMSZtreeLayer = this.getLoadData( webWMSZtreeLayer, attribute_["LoadData"]["Layers"] );
                }
                
            } else {
                webWMSZtreeLayer = originWebWMSztreeLayer;
            }
            
            if ( attribute_["SelectLayers"] !== undefined ) {
                webWMSZtreeLayer = this.getSelectLayers( webWMSZtreeLayer, attribute_["SelectLayers"] );
            }
            
            $.fn.zTree.init( $("#" + _tocDIV ), zTreeSetting_WebWMS_, webWMSZtreeLayer );
            
            return webWMSZtreeLayer;
        },
        
        getWebWMSLayerData : function(attribute_) {
            /*
            var attribute = {
                CRS : 'EPSG:3857',
                KEY : 'DT_ID_1',
                BaseMapType : 'daum_normal',
                capabilitiesJSON : {}
            };
            */
            var webWMSLayerData = {
                CRS : attribute_["CRS"],
                //KEY : attribute_["KEY"],
                BaseMapType : attribute_["BaseMapType"],
                //FullExtent : [0.0, 0.0, 0.0, 0.0],
                ViewExtent : [0.0, 0.0, 0.0, 0.0],
                isViewExtent : false,
                Layers : []
            };

            var capabilitiesJSON = attribute_["CapabilitiesJSON"]["WMS_Capabilities"]["Capability"]["Layer"];
            var layers = this.getWebWMSCapabilitieLayerData( [ capabilitiesJSON ] );
            webWMSLayerData["Layers"].push( layers );

            return webWMSLayerData;
        },
        
        getWebWMSCapabilitieLayerData : function(node_) {
            var layerData = {
                LayerName : layerName,
                Title : title,
                Extent : extent,
                MinScale : minScale,
                MaxScale : maxScale,
                LegendURL : legendURL,
                isGroupLayer : false,
                isVisible : true,
                ChildLayers: []
            };
//debugger;
            for(var i in node_) {
                var title = node_[i]["Title"];
                if ( typeof title !== 'undefined' ) {
                    title = title["#text"];
                }
                var layerName = node_[i]["Name"];
                if ( typeof layerName !== 'undefined' ) {
                    layerName = layerName["#text"];
                }
                var extent = node_[i]["BoundingBox"];
                if ( typeof extent !== 'undefined' ) {
                    if ( Array.isArray( extent ) ) {
                        extent = extent[0];
                    }
                    extent = extent["@attributes"];
                    extent = [
                        parseFloat(extent["minx"]),
                        parseFloat(extent["miny"]),
                        parseFloat(extent["maxx"]),
                        parseFloat(extent["maxy"])
                    ];
                }
                var minScale = node_[i]["MinScaleDenominator"];
                if ( typeof minScale !== 'undefined' ) {
                    minScale = parseFloat( minScale["#text"] );
                }
                var maxScale = node_[i]["MaxScaleDenominator"];
                if ( typeof maxScale !== 'undefined' ) {
                    maxScale = parseFloat( maxScale["#text"] );
                }
                var style = node_[i]["Style"];
                var legendURL;
                if ( typeof style !== 'undefined' ) {
                    
                    if ( Array.isArray( style ) ) {
                        style = style[0];
                    }
                    
                    if ( typeof style["LegendURL"] !== 'undefined' ) {
                    	legendURL = style["LegendURL"]["OnlineResource"]["@attributes"]["xlink:href"];
                    }
                }

                var childLayer = node_[i]["Layer"];
                
                if ( !Array.isArray( childLayer ) && typeof childLayer !== 'undefined' ) {
                    childLayer = [ childLayer ];
                }

                if ( Array.isArray( childLayer ) ) {
                    layerData["isGroupLayer"] = true;
                    for (var j=childLayer.length; --j >= 0;) {
                        //layerData["ChildLayers"].push( this.getWMSCapabilitieLayerData( [ childLayer[j] ] ) );
                        layerData["ChildLayers"].push( arguments.callee( [ childLayer[j] ] ) );
                    }
                }
                
                layerData["LayerName"] = layerName;
                layerData["Title"] = title;
                layerData["Extent"] = extent;
                layerData["MinScale"] = minScale;
                layerData["MaxScale"] = maxScale;
                layerData["LegendURL"] = legendURL;
                
            }

            return layerData;
        },
        
        getWebWMSNodeTozTree : function(node_) {
            
            var layer = {
                id : null,
                name : null,
                //title : null,
                children : [],   
                open : false,
                drop : true,
                //inner : true,
                checked : true,                
                LayerName : null,
                isGroupLayer : false,
                LegendURL : null,
                MinScale : 0,
                MaxScale : 0,
                Extent : null,
                scaleCheck : 1,
                chkDisabled : false,
                //isAddedLayer : false,
                //isDeletedLayer : false
            };
            var cnt = 0;
            
            for(var i in node_) {
                ++cnt;
                /*
                var node = {
                    LayerName : layerName,
                    Title : title,
                    Extent : extent,
                    MinScale : minScale,
                    MaxScale : maxScale,
                    LegendURL : legendURL,
                    isGroupLayer : false,
                    isVisible : true,
                    Opacity : 1.0,
                    ChildLayers: []
                };
                */

                layer["name"] = node_[i]["Title"];
                layer["id"] = node_[i]["LayerName"];
                layer["LayerName"] = node_[i]["LayerName"];

                if ( layer["id"] === 'ROOT' || cnt == 1 ) {
                    layer["open"] = true;
                }

                layer["LegendURL"] = node_[i]["LegendURL"];

                var minScale = node_[i]["MinScale"];
                if ( typeof minScale !== 'undefined' ) {
                    layer["MinScale"] = minScale;
                }

                var maxScale = node_[i]["MaxScale"];
                if ( typeof maxScale !== 'undefined' ) {
                    layer["MaxScale"] = maxScale;
                }

                layer["Extent"] = node_[i]["Extent"];
                layer["isGroupLayer"] = node_[i]["isGroupLayer"];
                
                var childLayers = node_[i]["ChildLayers"];
                if ( childLayers.length > 0 ) {
                    //for (var j=child.length; --j >= 0;) {
                    for(var j=0; j<childLayers.length; j++) {
                        //layer["children"].push( this.getWMSNodeTozTree( [ childLayers[j] ] ) );
                        layer["children"].push( arguments.callee( [ childLayers[j] ] ) );
                        
                    }
                } else {
                    //layer["inner"] = false;
                    layer["drop"] = false;
                }

            }

            return layer;
        },
        
        
        getSelectLayers : function(originWebWMSztreeLayer_, selectLayers_) {
            var reLoadData = [];
            var noneGroupLayers_origin = [];
            noneGroupLayers_origin = _getNoneGroupLayers( originWebWMSztreeLayer_, noneGroupLayers_origin );
            
            var temp = [];
            for(var i in selectLayers_) {
                var selectLayerName = selectLayers_[i];
                for(var j in noneGroupLayers_origin) {
                    var originLayer = noneGroupLayers_origin[j];
                    if ( originLayer["LayerName"] === selectLayerName ) {
                        //originLayer["checked"] = false;
                        temp.push( noneGroupLayers_origin.slice( j, j+1 )[0] );
                        noneGroupLayers_origin.splice( j, 1 );
                    }
                }
            }
            
            //reLoadData = noneGroupLayers_origin.concat( temp );
            reLoadData = temp;
            
            originWebWMSztreeLayer_["children"] = reLoadData;
            
            return originWebWMSztreeLayer_;
        },
        
        
        getLoadData : function(originWebWMSztreeLayer_, loadData_) {
            var reLoadData = [];
            var noneGroupLayers_origin = [];
            noneGroupLayers_origin = _getNoneGroupLayers( originWebWMSztreeLayer_, noneGroupLayers_origin );
            /*
            for(var i in noneGroupLayers_origin) {
                var originLayer = noneGroupLayers_origin[i];
                for(var j in loadData_) {
                    var loadLayer = loadData_[j];
                    if ( originLayer["LayerName"] === loadLayer["LayerName"] ) {
                        originLayer["checked"] = loadLayer["checked"];
                    }
                }
            }
            */
            var temp = [];
            for(var i in loadData_) {
                var loadLayer = loadData_[i];
                for(var j in noneGroupLayers_origin) {
                    var originLayer = noneGroupLayers_origin[j];
                    if ( originLayer["LayerName"] === loadLayer["LayerName"] ) {
                        originLayer["checked"] = loadLayer["checked"];
                        temp.push( noneGroupLayers_origin.slice( j, j+1 )[0] );
                        noneGroupLayers_origin.splice( j, 1 );
                    }
                }
            }
            
            reLoadData = noneGroupLayers_origin.concat( temp );
            
            originWebWMSztreeLayer_["children"] = reLoadData;
            
            return originWebWMSztreeLayer_;
        }
        
    };























    var toc_WMTS = function() {
        var _this = this;
        var zTreeLayer;
        var zTreeAttribute;
        var olWMTSLayer;
        
        this.init = function(attribute_) {
            /*
               var options = {
                    OlMap : map,
                    TocDIV : 'TOC_1',
                    TocType : 'WMTS',
                    OriginCRS : 'EPSG:3857',
                    KEY : 'DT_ID_WMTS',
                    olWMTSLayer : wmtsLayer,
                    LayerName : '$STATIC',
                    LayerTitle : '$STATIC-Title',
                    MatrixSet :'',
                    isWebMap : false,
                    isLoadData : false,
                    LoadData : {
                        Checked : false,
                        Style : {
                            LineColor : '',
                            LineWidth : 10
                            // To do - 스타일
                        }
                    },
                    CallBacks : {
                        test : function(data) {
                            console.log('CallBack : test');
                            console.log(data);
                        }
                    }
               }
            */
            
            
            /*
             *  tocWMTS Init
             */
            _defaultInit( attribute_ );
            _this.olWMTSLayer = attribute_["OlWMTSLayer"];
            _this.zTreeAttribute = new zTreeAttribute_WMTS( this );
            _this.zTreeLayer = OBJ_TOC_WMTS["createTOC_WMTS"]( attribute_, _this.zTreeAttribute["zTreeSetting_WMTS"] );            
            
            _olWMTSLayerRefresh();
            
            console.log('### TOC Init ###');
            console.log('TOC Type : ' + _tocType);
            console.log('Projection : ' + _originCRS);
            console.log('zTreeLayer : ' + _this.zTreeLayer);
        };
        
        
        this.layerSetVisible = function(e, treeId, treeNode) {
            _this.olWMTSLayer.setVisible( !(_this.olWMTSLayer.getVisible()) );
        };        

        
        var _olWMTSLayerRefresh = function() {
            _this.olWMTSLayer.setVisible( _this.getZtreeLayerWMTSchecked() );
        };
        
        
        this.getZtreeLayerWMTSchecked = function() {
            var layer = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];            
            return layer["checked"];
        };
        
    };
    









    var zTreeAttribute_WMTS = function(toc_WMTS_) {
        var zTreeSetting_WMTS = {
            view : {
                selectedMulti : false,
                expandSpeed : 'fast',
                addDiyDom : _addDIYDom_WMS
            },
            check : {
                enable : true,
                chkboxType : { "Y" : "", "N" : "" }
            },
            data : {
                simpleData : {
                    enable : true
                }
            },
            edit : {
                enable : true,
                showRemoveBtn : false,
                showRenameBtn : false
            },
            callback : {
                onCheck: toc_WMTS_.layerSetVisible
            },
            async : {
                enable : true
            }
        };
    
        return {
            zTreeSetting_WMTS : zTreeSetting_WMTS
        }
    };



    var OBJ_TOC_WMTS = {
        
        createTOC_WMTS : function(attribute_, zTreeSetting_WMTS_) {
            var wmtsZtreeLayer;
            var originWMTSztreeLayer = this.getWMTSNodeTozTree( this.getWMTSLayerData( attribute_ ) );
            
            if ( attribute_["isWebMap"] ) {
                wmtsZtreeLayer = originWMTSztreeLayer;
                
                if ( attribute_["isLoadData"] ) {
                    wmtsZtreeLayer = this.getLoadData( originWMTSztreeLayer, attribute_["LoadData"]["Layers"][0] );
                }
                
            } else {
                wmtsZtreeLayer = originWMTSztreeLayer;
            }
            
            $.fn.zTree.init( $("#" + _tocDIV ), zTreeSetting_WMTS_, wmtsZtreeLayer );
            
            return wmtsZtreeLayer;
        },
        
        getWMTSLayerData : function(attribute_) {
            /*
            var attribute = {
                CRS : 'EPSG:3857',
                KEY : 'DT_ID_1',
                //BaseMapType : 'daum_normal',
                LayerName : 'LV14_SCCO_EMD'
            };
            */
            var wmtsLayerData = {
                //CRS : attribute_["CRS"],
                KEY : attribute_["KEY"],
                LayerName : attribute_["LayerName"],
                LayerTitle : attribute_["LayerTitle"],
                MatrixSet : attribute_["MatrixSet"],
                LegendURL : attribute_["LegendURL"]
            };

            return wmtsLayerData;
        },
        
        getWMTSNodeTozTree : function(attribute_) {
            
            var layer = {
                id : attribute_["LayerName"],
                name : attribute_["LayerTitle"],
                //title : null,
                children : [],
                open : true,
                drop : false,
                //inner : true,
                checked : true,
                LayerName : attribute_["LayerName"],
                MatrixSet : attribute_["MatrixSet"],
                isGroupLayer : false,
                LegendURL : null,
                Extent : null,
                chkDisabled : false,
                LegendURL : attribute_["LegendURL"]
            };

            return layer;
        },
        
        
        getLoadData : function(originWMTSztreeLayer_, loadData_) {
            var loadztreeLayer;
            
            originWMTSztreeLayer_["checked"] = loadData_["checked"];
            
            loadztreeLayer = originWMTSztreeLayer_;
            
            return loadztreeLayer;
        }
        
    };





















    var _getNoneGroupLayers = function(layers_, noneGroupLayers_) {
        layers_ = [layers_];
        for (var i in layers_) {
            var layer = layers_[i];

            if ( layer.isGroupLayer ) {
            //if ( layer["children"].length > 0 ) {
                var childs = layer["children"];
                for (var j in childs) {
                    var child = childs[j];
                    arguments.callee( child, noneGroupLayers_ );
                }
            } else {            
                noneGroupLayers_.push( layer );
            }
        }

        return noneGroupLayers_;
    };




    var _clone = function(obj) {
        if ( obj === null || typeof(obj) !== 'object' ) {
            return obj;
        }

        var copy = obj.constructor();

        for(var attr in obj) {
            if ( obj.hasOwnProperty(attr) ) {
                copy[attr] = _clone(obj[attr]);
            }
        }

        return copy;
    };


    var destroy = function() {
        
    };


    var getSaveOptions = function() {
        var options = {
            KEY : _KEY,
            TocType : _tocType,            
            //ViewExtent : _olMap.getView().calculateExtent( _olMap.getSize() )
        };

        
        options["Layers"] = _getTocLayers( _tocType );
        
        
        if ( _tocType === 'WFS' || _tocType === 'WebWFS') {
            var tocLayer = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];
            
            options["UseFeatureInfo"] = tocLayer.UseFeatureInfo
            options["UserProperties"] = tocLayer.UserProperties;
            
        }
        
        return options;
    };
    

    var _getTocLayers = function(tocType_) {
        var tocLayers = $.fn.zTree.getZTreeObj( _tocDIV ).getNodes()[0];
        
        if ( tocType_ === 'WMS' ) {
            tocLayers = _setSaveLayers_WMS( tocLayers );
        } else if ( tocType_ === 'WebWMS' ) {
            tocLayers = _setSaveLayers_WebWMS( tocLayers );
        } else if ( tocType_ === 'WFS' ) {
            tocLayers = _setSaveLayers_WFS( tocLayers );
        } else if ( tocType_ === 'WCS' ) {
            tocLayers = _setSaveLayers_WCS( tocLayers );
        } else if ( tocType_ === 'WebWFS' ) {
            tocLayers = _setSaveLayers_WFS( tocLayers );
        } else if ( tocType_ === 'WMTS' ) {
            tocLayers = _setSaveLayers_WMTS( tocLayers );
        } else if ( tocType_ === 'WebWMTS' ) {
            tocLayers = _setSaveLayers_WMTS( tocLayers );
        }

        return tocLayers;
    };


    var _setSaveLayers_WMS = function(tocLayers_) {
        var saveLayers = [];
        
        var layers = _getNoneGroupLayers( tocLayers_, [] );
        
        for(var i in layers) {
            var layerAttribute = {
                LayerName : '',
                checked : ''
            };
            layerAttribute["LayerName"] = layers[i]["LayerName"];
            layerAttribute["checked"] = layers[i]["checked"];
            saveLayers.push( layerAttribute );
        }
        
        return saveLayers;
    };


    var _setSaveLayers_WebWMS = function(tocLayers_) {
        var saveLayers = [];
        
        var layers = _getNoneGroupLayers( tocLayers_, [] );
        
        for(var i in layers) {
            var layerAttribute = {
                LayerName : '',
                checked : ''
            };
            layerAttribute["LayerName"] = layers[i]["LayerName"];
            layerAttribute["checked"] = layers[i]["checked"];
            saveLayers.push( layerAttribute );
        }
        
        return saveLayers;
    };


    var _setSaveLayers_WFS = function(tocLayers_) {
        var saveLayers = [];
    
        var layerAttribute = {
            LayerName : tocLayers_["LayerName"],
            checked : tocLayers_["checked"]
        };
        
        saveLayers.push( layerAttribute );
        
        return saveLayers;
    };


    var _setSaveLayers_WCS = function(tocLayers_) {
        var saveLayers = [];
    
        var layerAttribute = {
            Coverage : tocLayers_["Coverage"],
            checked : tocLayers_["checked"]
        };
        
        saveLayers.push( layerAttribute );
        
        return saveLayers;
    };


    var _setSaveLayers_WMTS = function(tocLayers_) {
        var saveLayers = [];
    
        var layerAttribute = {
            LayerName : tocLayers_["LayerName"],
            MatrixSet : tocLayers_["MatrixSet"],
            checked : tocLayers_["checked"]
        };
        
        saveLayers.push( layerAttribute );
        
        return saveLayers;
    };



    var getShowLayerNames = function() {
        var showLayerNames;
        if ( _tocType === 'WMS' ) {
            showLayerNames = _tocOBJ[_tocType].getShowLayerNames();
        }
        return showLayerNames;
    };
    
    
    return {
        initTOC : initTOC,
        getSaveOptions : function() { return getSaveOptions(); },
        getShowLayerNames : function() { return getShowLayerNames(); }
    }
    
};