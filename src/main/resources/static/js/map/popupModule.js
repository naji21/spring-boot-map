

var popupModule = (function() {
    
    var _olMap;
    var _olPopup;
    var _olVectorLayer;
    
    
    var _tagTemplate = 
        '<div class="panel-body" style="padding: 3px;">' + 
            //'<h4 id="popup_title" class="green" style="text-align: center;">' +
            '<h4 id="popup_title" style="text-align: center; color: #de6e68;">' +

            '</h4>' + 
            '<div class="project_detail">' + 
                /*'<p class="title">유형</p>' + */
                '<p id="tag_type">' + 

                '</p>' + 
                /*'<p class="title">내용</p>' + */
                '<p id="tag_contents">' + 

                '</p>' + 
            '</div>' + 
        '</div>';
    
    
    
    this.init = function(options_) {
        _olMap = options_["OlMap"];
        _createVectorLayer();
        _createPopup();
        _setOnClickShowHideListener();        
        
    };
    
    
    
    /*
    *  팝업 벡터 레이어 생성
    */
    var _createVectorLayer = function() {
        var layer = new ol.layer.Vector({
            source : new ol.source.Vector()
        });
        
        layer.set('notSelect', true);
        layer.setZIndex( 99 );
        _olMap.addLayer( layer );
        
        _olVectorLayer = layer;
    };
    
    
    
    /*
    *  팝업 객체 생성
    */
    var _createPopup = function() {
        var popup = new ol.Overlay.Popup;
        // To do - 팝업 위치 조정
        popup.setOffset( [0, -50] );
        _olMap.addOverlay( popup );
        
        _olPopup = popup;
    };
    
    
    
    /*
    *  팝업 클릭 Show & Hide 
    */
    var _setOnClickShowHideListener = function() {
        _olMap.on('click', function(evt) {
            var f = _olMap.forEachFeatureAtPixel(evt.pixel, function(ft, layer){return ft});
            
            if ( f && f.get('type') === 'click' ) {
                var geometry = f.getGeometry();
                var coord = geometry.getCoordinates();
                
                for(var i in coord) {
                    coord[i] = parseFloat( coord[i] );
                }
                
                //var content = '<p>'+f.get('contents')+'</p>';
                var content = f.get('contents');

                _olPopup.show( coord, content );

            } else {
                _olPopup.hide();
            }

        });
    };
    
    
    
    
    /*
    *  팝업 타겟팅 Show & Hide 
    */
    this.targetPopupShowHide = function(data_, callBack_) {
        var feature = _findFeatureForID( data_["contents_tag_id"]);
        if ( feature !== undefined ) {
            var geometry = feature.getGeometry();
            var coord = geometry.getCoordinates();

            for(var i in coord) {
                coord[i] = parseFloat( coord[i] );
            }
            
            //var content = '<p>'+f.get('contents')+'</p>';
            var content = feature.get('contents');

            _olPopup.show( coord, content );
            _olMap.getView().setCenter( coord );
        } else {
            _olPopup.hide();
            callBack_();
        }
    };
    
    
    
    
    var _findFeatureForID = function(id_) {
        var findFeature;
        var features = _olVectorLayer.getSource().getFeatures();
        for (var i in features) {
            if ( features[i].getId() === id_ ) {
                findFeature = features[i];
                break;
            }
        }
        
        return findFeature;
    };
    
    
    
    
    /*
    *  팝업 아이콘 스타일
    *  To do - 피쳐 정보 조회 스타일링 필요.
    */
    var _getIconStyle = function(imgSRC_) {
        var style = [
            new ol.style.Style({
                image: new ol.style.Icon(({
                    scale: 0.7,
                    rotateWithView: false,
                    anchor: [0.5, 1],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 1,
                    src: imgSRC_
                })),
                zIndex: 5
            }),
            new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 3,
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,1)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0,0,0,1)'
                    })
                })
            })

        ];
        
        return style;
    };
    
    
    
    
    /*
    *  팝업 내용
    */
    var _createContents = function(options_) {
        //var _this = this;
        var contents;

        (function() {
            if ( options_["PopupType"] === 'tag' ) {
                //contents = _this.createTagDIV();
                
                
                var data = options_["Data"];
                var tagDIV = $( $.parseHTML( _tagTemplate ) );
                tagDIV.find("#popup_title").text( data["title"] );
                tagDIV.find("#tag_type").text( data["tag_nm"] );
                //tagDIV.find("#tag_contents").text( data["dscr"] );
                
                
                var con = $( $.parseHTML( data["dscr"] ) );
                tagDIV.find("#tag_contents").append( con );
                
                
                contents = tagDIV.html();
                
                //contents = createTagDIV();
            } else if ( options_["PopupType"] === 'info' ) {
                
                // To do - 정보 조회 팝업
                contents = _this.createInfoDIV();                
            }
            
        })();
        
        
        this.createTagDIV = function() {
            var data = options_["Data"];
            var tagDIV = $( $.parseHTML( _tagTemplate ) );
            tagDIV.find("#popup_title").text( data["title"] );
            tagDIV.find("#tag_type").text( data["tag_id"] );
            tagDIV.find("#tag_contents").text( data["dscr"] );
            
            return tagDIV;
        };
        
        
        return contents;
    };
    
    
    
    
    var _reDraw = function() {
        
    };
    
    
    
    
    /*
     *  팝업 생성
     */
     this.createFeature = function(options_) {
         var data = options_["Data"];        
         var point = ol.proj.transform([data["x"], data["y"]], data["crs"], _olMap.getView().getProjection().getCode());
         var contents = _createContents( options_ );
         
         // To do - 사용자 마커 이미지
         var markerIMG = ( data["custom_img"] !== null ) ? data["custom_img"] : data["default_img"];
         //var markerIMG = data["custom_img"];
         
         
         // 임시
         if ( markerIMG === null || markerIMG === undefined || markerIMG === '' ) {
             markerIMG = 'http://download.seaicons.com/icons/icons-land/vista-map-markers/64/Map-Marker-Bubble-Azure-icon.png';
         }
         
         
         var iconStyle = _getIconStyle( markerIMG );
         
         var feature = new ol.Feature({
             type: 'click',
             contents: contents,
             geometry: new ol.geom.Point( point )
         });
         
         feature.setId( data["contents_tag_id"] );
         feature.setStyle( iconStyle );
                 
         _olVectorLayer.getSource().addFeature( feature );
         
         
     };
    
    
     
    
    /*
    *  팝업 수정
    */
    this.updateFeature = function(options_) {
        var data = options_["Data"];
        //var point = ol.proj.transform([data["x"], data["y"]], data["crs"], _olMap.getView().getProjection().getCode());
        var contents = _createContents( options_ );
        
        // To do - 사용자 마커 이미지
        var markerIMG = ( data["custom_img"] !== null ) ? data["custom_img"] : data["default_img"];
        //var markerIMG = data["custom_img"];
        
        
        // 임시
        if ( markerIMG === null || markerIMG === undefined || markerIMG === '' ) {
            markerIMG = 'http://download.seaicons.com/icons/icons-land/vista-map-markers/64/Map-Marker-Bubble-Azure-icon.png';
        }
        
        
        var iconStyle = _getIconStyle( markerIMG );
        
        var feature = _findFeatureForID( data["contents_tag_id"] );
        if ( feature !== undefined ) {
            var geometry = feature.getGeometry();
            var coord = geometry.getCoordinates();

            for(var i in coord) {
                coord[i] = parseFloat( coord[i] );
            }
            
            feature.set('contents', contents);
            feature.setStyle( iconStyle );
            
            _olPopup.show( coord, contents );
        } else {
            _olPopup.hide();
            callBack_();
        }
        
        
    };
    
    
    
    
    /*
    *  팝업 삭제
    */
    this.deleteFeature = function(options_) {
        var data = options_["Data"];
        
        var feature = _findFeatureForID( data["contents_tag_id"]);
        if ( feature !== undefined ) {
            _olVectorLayer.getSource().removeFeature( feature );
            _olPopup.hide();
        } else {
            _olPopup.hide();
            callBack_();
        }
    };
    
    
    
});

