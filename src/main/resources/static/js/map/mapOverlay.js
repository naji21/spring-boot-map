/**
 * 필수 라이브러리 
 * openlayers, lodash, jQuery, 
 * jQueryUI (resizable, draggable 사용), 
 * bootstrap (popover사용)
 */

(function (_export) {
    'use strict';

    var defaultOption = {
        // 기본 이벤트 사용자가 설정하지 않으면 그냥 빈 함수.
        onSelectItem: function () {},
        onDrawEnd: function () {},
        onContextMenu: function () {}
    };

    /**
     * 
     * @param {object} userOption 
     */
    var MapOverlay = function (userOption) {
        // 사용자 옵션 설정.
        var option = _.assignIn(defaultOption, userOption);

        // 노트를 사용할 openlayers map
        var map = userOption.map;

        // 선택된 Item
        var selectedText;

        // openlayers map의 dragPan event를 담고 있는 변수
        var dragPan;

        // 노트 생성 flag
        var dragMode = false;

        // viewMode의 변경 여부. 변경된 적이 있다면 true
        var changeViewMode = false;

        // viewMode
        var _viewMode = !!option.viewMode;

        // 노트 item들을 관리한 manager
        var manager = new naji.MapOverlay.Manager(map);

        var moveInteraction = {
            feature: undefined,
            event: undefined,
            coordinate: undefined,
            drag: false
        };

        // map에서 dragPan event를 찾아 변수에 넣어둔다. 노트의 위치 이동, 크기변경 시 해당 이벤트를 끔.
        map.getInteractions().forEach(function(interaction) {
            if (interaction instanceof ol.interaction.DragPan) {
                dragPan = interaction;
            }
        }, this);

        // 노트 생성 함수
    //  var overlay = new naji.MapOverlay.Note(manager);
        var overlay = new naji.MapOverlay.Overlay(manager);

        // 노트의 이벤트. 이벤트의 시작 시 dragpan이벤트를 사용안하고, 이벤트완료 시 dragpan이벤트를 사용하도록 한다.
        overlay.on('drawend', function (item) { // 노트 및 마커 생성 시 그리기 완료
            dragPan.setActive(true);

            // 완료 후 해당 노트를 선택 된 상태로 변경
            selectedText = item;
            if (selectedText.type === 'note') {
                selectedText.getTemplate().addClass('selected'); 
            }
            option.onDrawEnd(selectedText);
        });
        overlay.on('drawstart', function () { // 노트 및 마커 생성 시 그리기 시작
            dragPan.setActive(false);
        });

        // 노트 왼쪽 상단의 이동 아이콘에 mousedown이벤트 발생 시
        var mapMouseDownMoveIcon = function () {
            var $parent = $(this).parent();

            // 선택 된 노트가 아니면 선택된 노트로 변경
            if (!$parent.hasClass('selected')) {
                selectOverlay($parent);
            }

            // 화면 고정이 아니면 overlay이동이기 때문에 dragpan이벤트 끔.
            if (!selectedText.fixed()) {
                dragMode = true; // dargMode를 true로 변경하여 map의 이벤트를 이용하여 overlay 이동시킴
                dragPan.setActive(false);
            }
            
        };

        // 노트에 mousedown이벤트 발생 시
        var mapMouseDownText = function () {
            if (!$(this).hasClass('selected')) {
                selectOverlay($(this));
            }
        };

        // map에 mousedown이벤트 발생 시
        var mapMouseDown = function (e) {
            if(!$(e.target).hasClass('ui-resizable-handle')) {
                selectOverlay();
            }
            // 선택된 노트가 없도록 모두 선택 해제
                     
        };
        
        /**
         * map에 overlay를 drag(이동)할 수 있는 이벤트 생성.
         * @param {string} mode 
         */
        var viewMode = function (mode) {
            _viewMode = mode;
            map.removeInteraction(moveInteraction.event);
            manager.eventActive(!_viewMode);

            var $tmp = $('.mapOverlay-text-wrap.selected')
                .removeClass('selected');
            
            $('.mapOverlay-popover')
                .popover('hide');
            selectedText = undefined;
            
            if (_viewMode) {
                dragPan.setActive(true);
                $('#' + map.getTarget())
                    .off('.overlay');
                selectOverlay();
                
                moveInteraction.event = new ol.interaction.Pointer({
                    handleDownEvent: function (e) {
                        selectOverlay(); 
                        var feature = e.map.forEachFeatureAtPixel(e.pixel,
                            function(feature) {
                                return feature;
                            });

                        if (feature) {
                            var item = manager.getItem(feature.getId());
                            if (item) {
                                moveInteraction.feature = feature;
                                return !!feature;
                            }
                        }
                        return false;
                    },
                    handleUpEvent: function (e) {
                        var feature = e.map.forEachFeatureAtPixel(e.pixel,
                            function(feature) {
                                return feature;
                        });

                        if (moveInteraction.feature && feature) {
                            var item = manager.getItem(moveInteraction.feature.getId());
                            if (item.type === 'marker') {
                                selectOverlay(item.getTemplate());
                            }
                        }
                        moveInteraction.feature = null;
                        return false;
                    }
                });

                map.addInteraction(moveInteraction.event);
            } else {
                $('#' + map.getTarget())
                    // 마우스 왼쪽 버튼 mousedown
                    .on('click.overlay', '.mapOverlay-text-wrap', function (e) {
                        e.stopPropagation();
                        // 이벤트 처리 함수 호출
                        mapMouseDownText.call(this);
                        e.selectedItem = selectedText;

                        // 사용자 설정 함수 호출
                        option.onSelectItem(e);
                    })
                    // 마우스 오른쪽 버튼 mousedown
                    .on('contextmenu.overlay', '.mapOverlay-text-wrap', function (e) {
                        e.preventDefault();
                        // 이벤트 처리 함수 호출
                        mapMouseDownText.call(this);
                        e.selectedItem = selectedText;

                        // 사용자 설정 함수 호출
                        option.onContextMenu(e);
                    })
                    // map element mousedown
                    .on('mousedown.overlay', mapMouseDown)
                    .on('resizestart.overlay', function () {
                        dragPan.setActive(false);
                    })
                    .on('resizeend.overlay', function () {
                        dragPan.setActive(true);
                    })
                    .on('dragstart.overlay', function (e, id) {
                        selectOverlay(manager.getItem(id).getTemplate());
                        dragPan.setActive(false);
                    })
                    .on('dragend.overlay', function () {
                        dragPan.setActive(true);
                        selectedText.setPositionByPixel();
                    });

                moveInteraction.event = new ol.interaction.Pointer({
                    handleDownEvent: function (e) {
                        var map = e.map;
                        var feature = map.forEachFeatureAtPixel(e.pixel,
                            function(_feature) {
                                return _feature;                         
                        });
                        moveInteraction.feature = undefined;
                        moveInteraction.coordinate = undefined;
                        if (feature) {
                            var item = manager.getItem(feature.getId());
                            if (item) {
                                moveInteraction.feature = feature;
                                moveInteraction.coordinate = e.coordinate;
                                return true;
                            }
                        } else {
                            if (!!selectedText && 
                                selectedText.type === 'note' &&
                                !selectedText.fixed()) {
                                return true;
                            }
                            if($(e.originalEvent.target).hasClass('ui-resizable-handle')) {
                                return true;
                            }
                        }
                        return false;
                    },
                    handleDragEvent: function (e) {
                        if (!_viewMode && selectedText && dragMode) {
                            selectedText.setPosition(e.coordinate);
                        } else if (!!moveInteraction.coordinate) {
                            var deltaX = e.coordinate[0] - moveInteraction.coordinate[0];
                            var deltaY = e.coordinate[1] - moveInteraction.coordinate[1];
                            
                            var geometry = (moveInteraction.feature.getGeometry());
                            geometry.translate(deltaX, deltaY);
                            moveInteraction.coordinate = e.coordinate;
                            moveInteraction.drag = true;
                        }
                    },
                    handleUpEvent: function (e) {
                        if (moveInteraction.feature) {
                            var item = manager.getItem(moveInteraction.feature.getId());
                            if (item) {
                                selectOverlay(item.getTemplate());
                                if (!moveInteraction.drag) {
                                    e.selectedItem = selectedText;
                                    option.onSelectItem(e);
                                }
                            }
                        }

                        moveInteraction.drag = false;
                        if (!_viewMode && selectedText && dragMode) {
                            dragPan.setActive(true);
                            dragMode = false;
                        }
                        moveInteraction.coordinate = null;
                        moveInteraction.feature = null;
                        return false;
                    }
                });

                map.addInteraction(moveInteraction.event);
            }
        };

        // 노트 선택 함수
        var selectOverlay = function (target) {
            var targetId = !target ? '-' : target.attr('id');
            if (!!selectedText &&
                selectedText.id === targetId) {
                    return false;
            }
          
            // 선택되어 있는 노트를 선택안된 상태로 변경.
            var $tmp = $('.mapOverlay-text-wrap.selected')
                .removeClass('selected')
                .resizable('disable');
            
            $('.mapOverlay-popover')
                .popover('hide');
              
            // 선택 대상이 있다면 해당 대상을 선택 노트로 변경.
            if (target) {
                
                selectedText = manager.getItem(target.attr('id'));
                if (selectedText.type === 'note') {
                    target 
                        .addClass('selected')
                        .resizable('enable');
                } else if (!moveInteraction.drag) {
                    setTimeout(selectedText.showPopover, 20);
                }
            } else {
                selectedText = undefined;
            }
        };
        
        var setStyle = function (id, style) {
            if (_viewMode) {
                return false;
            }
            selectedText = manager.getItem(id);
            selectedText.style(style);
        };

        // viewMode 초기화
        viewMode(_viewMode);


        // =======  public api =========== 

        // 노트 그리기
        var addItem = function (type, opt) {
            selectedText = undefined;
            if (_viewMode) {
                return false;
            }
            selectOverlay();
        //    overlay.addOverlay(opt);
            selectedText = overlay.addItem(type, opt);
            return selectedText;
        };

        // 선택된 아이템 반환
        var getSelectedItem = function () {
            return selectedText;
        };

        var getItemById = function (id) {
            if (!id) {
                return undefined;
            }
            return manager.getItem(id);
        };

        // 노트의 기본 스타일 변경.
        var setDefaultStyle = overlay.setDefaultStyle;

        // 노트 데이타 Export
        var exportItems = function () {
            var data = manager.exportData();
            return JSON.stringify(data);
            /*
            data = JSON.stringify(data); 
            return _export.btoa(unescape(encodeURIComponent(data)));
            */
        };

        // 노트 데이타 import
        var importItems = function (data) {
            /*
            var importData = decodeURIComponent(escape(_export.atob(data)));
            manager.importData(JSON.parse(importData), overlay, _viewMode);
            */
            manager.importData(JSON.parse(data), overlay, _viewMode);
        };

        var getAllItem = function () {
            return manager.getAllItem();
        };

        return {
            addItem: addItem,
            viewMode: viewMode,
            getItemById: getItemById,
            getSelectedItem: getSelectedItem,
            setDefaultStyle: setDefaultStyle,
            exportItems: exportItems,
            importItems: importItems,
            getAllItem: getAllItem
        };
    };


    _export.naji = _export.naji || {};

    _export.naji.MapOverlay = {
         init: MapOverlay
     };

})(window);
(function (_export) {
    'use strict';
    
    /**
     * 노트 item 관리
     * @param {openlayers map} map 
     */
    var ItemManager = function (map) {
        // item을 담고 있는 배열
        var arr = [];

        // ============= public api ==============

        // item 추가
        var addItem = function (item) {
            arr.push(item);
            return this;
        };

        // 해당 id를 갖는 item 반환
        var getItem = function (id) {
            return _.filter(arr, function (item) {
                return item.id === id;
            })[0];
        };

        var getAllItem = function () {
            return arr;
        };

        // 마지막으로 등록 된 item 반환
        var getLastItem = function () {
            return arr[arr.length - 1];
        };

        // 해당 id를 갖는 item 삭제
        var removeItem = function (id) {
            var target = _.remove(arr, function (item) {
                return item.id === id;
            });
            target = undefined;
            return this;
        };

        // openlayers map 반환
        var getMap = function () {
            return map;
        };

        // 등록 된 item들의 데이타를 반환
        var exportData = function () {
            return _.map(arr, function (item) {
                // item의 데이타를 가져옴
                return item.exportData();
            });
        };

        // export한 데이타를 이용하여 노트들을 import
        var importData = function (data, overlay, viewMode) {
            _.map(data, function (item) {
                overlay.insertOverlay(item, viewMode);
            });
            return this;
        };

        var eventActive = function (active) {
            _.map(arr, function (item) {
                if (active) {
                    item.eventOn();
                } else {
                    item.eventOff();
                }                
            });

        };        

        return {
            addItem: addItem,
            getItem: getItem,
            getLastItem: getLastItem,
            removeItem: removeItem,
            getMap: getMap,
            exportData: exportData,
            importData: importData,
            getAllItem: getAllItem,
            eventActive: eventActive
        };
    };

    _export.naji.MapOverlay.Manager = ItemManager;

})(window);
(function (_export) {
    'use strict';
    
    var overlayEvent = {
        drawend: function () {},
        drawstart: function () {}
    };

    var Overlay = function (manager) {
        var map = manager.getMap();
        var eventUtil = new naji.MapOverlay.util.Event(map);
        var overlayObj = {
            note: new naji.MapOverlay.Note(manager),
            marker: new naji.MapOverlay.Marker(manager)
        };

        // 노트 및 마커 생성 이벤트 호출.
        var customEvent = {
            event: null,
            type: null,
            targetItem: null,
            handleDownEvent: function (e) {
                if (overlayObj[customEvent.type].event.down) {
                    overlayEvent.drawstart();
                    var id = naji.MapOverlay.util.uuid();
                    customEvent.targetItem = overlayObj[customEvent.type].event.down(e, id);
                }
                return true;
            },
            handleDragEvent: function (e) {
                if (overlayObj[customEvent.type].event.drag) {
                    e.targetItem = customEvent.targetItem;
                    overlayObj[customEvent.type].event.drag(e);
                }
            },
            handleUpEvent: function (e) {
                eventUtil.interaction.off();
                if (overlayObj[customEvent.type].event.up) {
                    e.targetItem = customEvent.targetItem;
                    overlayObj[customEvent.type].event.up(e);
                }
                overlayEvent.drawend(customEvent.targetItem);
            }
        };

        var addItem = function (type, opt) {
            overlayObj[type].add(opt);
            customEvent.type = type;
            var center = map.getView().getCenter();

            // 생성 시 지도 가운데에 자동으로 생성되도록 변경.
            customEvent.handleDownEvent({
                coordinate: center
            }); 
            customEvent.handleUpEvent({});
            return customEvent.targetItem;
            /*
            customEvent.handleUpEvent({});
          
                eventUtil.interaction.on({
                    handleDownEvent: customEvent.handleDownEvent,
                    handleDragEvent: customEvent.handleDragEvent,
                    handleUpEvent: customEvent.handleUpEvent
                });
            }
            */

            
        };

        // 이벤트 바인딩 함수
        var on = function (event, callback) {
            if (overlayEvent[event]) {
                overlayEvent[event] = callback;
            }
        };

        // 기존 노트를 import시 사용하는 함수.
        var insertOverlay = function (data, viewMode) {
            data.manager = manager;

            var item = overlayObj[data.type].insert(data);
            // 기존 노트의 데이터를 이용하여 노트 생성.
            manager.addItem(item);
            if (!viewMode) {
                item.eventOn();
            }
            
            // 생성 후 화면 고정 여부에 따라 resize와 drag이벤트를 생성.
            /*
            var item = manager.getItem(data.id);
            var $tpl = item.getTemplate();
            attachResize($tpl);
            if (item.fixed()) {
                attachDraggable($tpl);
            }
            $tpl.resizable('disable');
            */
        };

        return {
            addItem: addItem,
            insertOverlay: insertOverlay,
            on: on
        };
    };

    _export.naji.MapOverlay.Overlay = Overlay;
})(window);
(function (_export) {
    'use strict';
    
    var noteTemplate = function (id, text) {
        return [
            '<div id="' + id + '" class="mapOverlay-text-wrap">',
            '   <div class="mapOverlay-text">',
            '       <div>' + (text || '') + '</div>',
            '   </div>',
       //     '   <div class="MapNote-image"></div>',
            '   <div class="mapOverlay-text-background"></div>',
       //     '   <div class="-mapOverlay-move-icon top-left"></div>',
            '</div>'
        ].join('');
    };

    var createNote = function (pos, opt) {
        var id = opt.id;
        // 템플릿에서 노트를 가져옴.
        opt.$ = $(noteTemplate(id));
        if (opt.fixed) {
            opt.$.css({
                top: pos.y,
                left: pos.x
            });
        } else {
            opt.overlay = new ol.Overlay({
                position: pos,
                element: opt.$.get(0),
                stopEvent: false
            });
        }
        return opt;
    };

    var insertNote = function (opt) {
        var id = opt.id;
        
        var rtnValue = {
            id: id,
            $: $(noteTemplate(id, opt.text)),
            html: opt.html,
            fixed: opt.fixed,
            manager: opt.manager,
            style: opt.style,
            type: 'note',
            title: opt.title || ''
        };

        rtnValue.$.find('.mapOverlay-text, .mapOverlay-text-background')
            .css(opt.size);

        if (!opt.fixed) {
            // openlayers overlay 생성
            rtnValue.overlay = new ol.Overlay({
                position: opt.position,
                element: rtnValue.$.get(0),
                stopEvent: false
            });
        } else {
            // 태그 위치 설정
            rtnValue.$.css(opt.position);
        }

        return rtnValue;
    };

    var Note = function (manager) {
        var initCoord = {};
        var defaultStyle = {};
        var fixed;
        var html;

        // note 생성 이벤트
        var event = {
            down: function (e, id) {
                var pixel = manager.getMap().getPixelFromCoordinate(e.coordinate);
                initCoord = {
                    x: pixel[0],
                    y: pixel[1]
                };

                var pos = fixed ? initCoord : e.coordinate;
                var noteData = createNote(pos,{ 
                    id: id,
                    fixed: fixed,
                    html: html,
                    style: defaultStyle,
                    manager: manager,
                    type: 'note'
                });
                var noteItem = new naji.MapOverlay.NoteItem(noteData);
                manager.addItem(noteItem);
                return noteItem;
            },
            drag: function (e) {
                e.targetItem.setSize({
                    width: e.originalEvent.offsetX - initCoord.x,
                    height: e.originalEvent.offsetY - initCoord.y
                });
            },
            up: function (e) {
                e.targetItem.eventOn();
            }
        };

        var add = function (_opt) {
            var opt = _opt || {};
            fixed = !!opt.fixed; // 화면 고정여부
            html = !!opt.html; // html 사용여부
        };

        var insert = function (_opt) {
            var data = insertNote(_opt);
            return new naji.MapOverlay.NoteItem(data);
        };

        return {
            add: add,
            insert: insert,
            event: event
        };
    };

    _export.naji.MapOverlay.Note = Note;

})(window);
(function (_export) {
    'use strict';
    
    /**
     * 노트 아이템
     * @param {object} opt 
     */
    var Item = function (opt) {
        var manager = opt.manager;
        var map = manager.getMap();

        // 노트 템플릿
        var $text = opt.$; 

        // openlayers overlay
        var overlay = opt.overlay;

        var _html = !!opt.html;
        
        // 아이템 생성 시 스타일 생성
        var _style = new naji.MapOverlay.NoteStyle($text, opt.style || {}, _html);

        // 노트 ID
        var id = opt.id;

        // 화면 고정여부
        var _fixed = opt.fixed;

        var noteTitle = opt.title || '';

        var eventUtil = new naji.MapOverlay.util.Event(map);

        if (opt.fixed) {
            // 화면 고정인 경우는 map element에 삽입
            $('#' + map.getTarget() + ' > div').prepend($text);
        } else {
            // overlay를 map에 삽입
            map.addOverlay(opt.overlay);
        }

        // 노트 삭제
        var remove = function () {
            if (this.fixed) {
                // element삭제
                $text.remove();
            } else {
                // overlay 삭제
                map.removeOverlay(overlay);
            }
            // manager에서 해당 노트 삭제
            manager.removeItem(this.id);
            return this;
        };

        // text get or set. parameter가 있는 경우 텍스트 설정, 없으면 텍스트 반환
        var text = function (userText) {
            var $target = $text.find(' > .mapOverlay-text > div');
            var func = _html ? 'html' : 'text';
            if (userText) {
                $target[func](userText);
                return this;
            }
            return $target[func]();
        };

        // style get or set. parameter가 있는 경우 스타일 설정, 없으면 스타일 반환
        var style = function (userStyle) {
            if (userStyle) {
                _style.setStyle(userStyle);
                return this;
            }
            return _style.getStyle();
        };

        // 노트의 크기를 지정한다.
        var setSize = function (size) {
            // 텍스트 div와 배경 div를 같이 변경한다.
            $text
                .find('.mapOverlay-text, .mapOverlay-text-background')
                .css(size);
            return this;
        };

        // 노트의 위치를 지정한다.
        var setPosition = function (coord) {
            overlay.setPosition(coord);
            return this;
        };

        var setPositionByPixel = function () {
            if (!_fixed) {
                var pos = $text.position();
                var parentPos = $text.parent().position();
                var coord = map.getCoordinateFromPixel([parentPos.left + pos.left, parentPos.top + pos.top]);
                $text.css({
                    top: 0,
                    left: 0
                });
                setPosition(coord);
            }
            return this;
        };

        // 노트의 위치를 반환한다.
        var getPosition = function () {
            return overlay.getPosition();
        };

        // 노트의 템플릿을 반환한다.
        var getTemplate = function () {
            return $text;
        };

        // 노트의 데이터를 반환한다.
        var exportData = function () {
            var $textTpl = $text.find('.mapOverlay-text');
            return {
                id: id,
                title: noteTitle,
                type: 'note',
                style: _style.getStyle(),
                fixed: _fixed,
                html: _html,
                // 화면고정이면 템플릿의 위치를 지도고정이면 overlay의 좌표값을 설정.
                position: _fixed ? $text.position() : overlay.getPosition(), 
                size: {
                    width: $textTpl.css('width'),
                    height: $textTpl.css('height')
                },
                text: $textTpl.find('> div')[_html ? 'html' : 'text']()
            };
        };

        // 화면 고정여부 반환
        var fixed = function () {
            return _fixed;
        };

        var useHtml = function (value) {
            if (value) {
                _html = value;
                return this;
            }
            return _html;
        };

        var eventOn = function () {
            eventUtil.resize($text, true, {
                resize: setSize
            });

      //      if (_fixed) {
                eventUtil.draggable($text, true);
      //      }
        };

        var eventOff = function () {
            eventUtil.resize($text, false);
    //        if (_fixed) {
                eventUtil.draggable($text, false);
    //        }
        }; 

        var resizeDisable = function () {
            $text.resizable('disable');
        };

        var moveToMap = function () {
            if (!_fixed) {
                return false;
            }
            eventOff();
            var pos = $text.position();
            var coord = map.getCoordinateFromPixel([pos.left, pos.top]);
            
            var clone = $text.clone();
            clone.css({
                top: 0,
                left: 0
            });
            $text.remove();
            $text = clone;
            _style.changeText($text);
            
            _fixed = false;

            overlay = new ol.Overlay({
                position: coord,
                element: clone.get(0),
                stopEvent: false
            });
            map.addOverlay(overlay);
            eventOn();
        };

        var moveToScreen = function () {
            if (_fixed) {
                return false;
            }

            eventOff();
            var mapOffset = $('#' + map.getTarget()).offset();
            var offset = $text.offset();
            var clone = $text.clone();
            clone.offset({
                top: offset.top - mapOffset.top,
                left: offset.left - mapOffset.left
            });
            $('#' + map.getTarget() + ' > div').prepend(clone);
            map.removeOverlay(overlay);
            $text = clone;
            _style.changeText($text);
            overlay = undefined;
            _fixed = true;
            eventOn();
        };

        var getType = function () {
            return 'note';
        };

        var title = function (_title) {
            if (_title) {
                noteTitle = _title;
                return this;
            }
            return noteTitle;
        };

        return {
            getTemplate: getTemplate,
            setPosition: setPosition,
            setPositionByPixel: setPositionByPixel,
            getPosition: getPosition,
            setSize: setSize,
            style: style,
            text: text,
            remove: remove,
            fixed: fixed,
            useHtml: useHtml,
            id: id,
            exportData: exportData,
            eventOn: eventOn,
            eventOff: eventOff,
            moveToMap: moveToMap,
            moveToScreen: moveToScreen,
            type: 'note',
            resizeDisable: resizeDisable,
            title: title
        };
    };

    _export.naji.MapOverlay.NoteItem = Item;
})(window);
(function (_export) {
    'use strict';
    
    // 설정된 스타일을 css값으로 변경.
    var convertToCss = function (_style) {
        return {
            'background-color' : _style.fill,
            'opacity': _style.opacity,
            'border-width':  _style.borderWidth + 'px',
            'border-color': _style.borderColor,
            'border-style': _style.borderStyle || 'solid',
            'border-radius': _style.borderRadius + 'px'
        };
    };

    var convertToTextCss = function (_fontStyle) {

        var shadow = 'none';

        if (_fontStyle.shadow && _fontStyle.shadow !== 'none') {
            shadow = [
                (_fontStyle.shadow.offsetX || 0) + 'px',
                (_fontStyle.shadow.offsetY || 0) + 'px',
                (_fontStyle.shadow.blur || 0) + 'px',
                _fontStyle.shadow.color || '#fff'
            ].join(' ');
        }

        var css = {
            'color': _fontStyle.color,
            'font-size': _fontStyle.size,
            'font-weight': _fontStyle.weight,
            'text-align': _fontStyle.align,
            'text-shadow': shadow
        };

        // text stroke는 IE11이하에서는 지원 안됨.
        if (_fontStyle.stroke && _fontStyle.stroke !== 'none') {
            var stroke = [
                _fontStyle.stroke.width + 'px', 
                _fontStyle.stroke.color
            ].join(' ');

            css['-webkit-text-stroke'] = stroke;
            css['text-stroke'] = stroke;
        }

        return css;
    };

    /**
     * 노트의 스타일
     * @param {jQuery object} template 스타일 적용할 템플릿
     * @param {object} userStyle 사용자 지정 스타일
     */
    var Style = function (template, userStyle, useHtmlValue) {
        var styleTemplate = template;
        var useHtml = useHtmlValue;

        // 노트의 기본 스타일
        var defaultStyle = {

            background: {
                // 배경색
                fill: '#fff',

                // 배경 투명도
                opacity: 1,

                // 테두리 색
                borderColor: '#000',

                // 테두리 굵기
                borderWidth: 1,

                // 모서리 
                borderRadius: 0,

                // 테두리 스타일
                borderStyle: 'solid'
            },
            text: {
                // 글자색
                color: '#000',
                // 글자크기
                size: '14',
                // 정렬
                align: 'left',
                // 글자 굵기
                weight: '400',
                // 그림자
                shadow: 'none',
                // 테두리
                stroke: 'none'
            }
        };


        // 기본스타일에 사용자 지정 스타일을 적용
        var _style = _.assignIn(defaultStyle,  userStyle);
    
        // 사용자 지정 스타일로 변경
        var applyStyle = function (setStyle) {
            _style = setStyle || _style;
            styleTemplate.find('> .mapOverlay-text-background')
                .css(convertToCss(_style.background));
            
            if (!useHtml) {
                _style.text.shadow = _style.text.shadow ? _style.text.shadow : 'none';
                _style.text.stroke = _style.text.stroke ? _style.text.stroke : 'none';
                styleTemplate.find('> .mapOverlay-text > div')
                    .removeAttr('style')
                    .css(convertToTextCss(_style.text));
            }
        };


        // ============= public api =================

        // 현재 노트 스타일 반환
        var getStyle = function () {
            return _style;
        };

        // 사용자 지정 스타일 설정
        var setStyle = function (userStyle) {
            // 기존 스타일에 지정 스타일로 덮어씀.
            var newStyle = _.assignIn(_style,  userStyle);
            applyStyle(newStyle);
        };

        var changeText = function (text) {
            styleTemplate = text;
        };

        var getImage = function () {

        };

        var setImage = function () {

        };

        // 최초 생성 시 스타일 적용
        applyStyle();
        
        return {
            getStyle: getStyle,
            setStyle: setStyle,
            changeText: changeText
        };
    };

    naji.MapOverlay.NoteStyle = Style;

})(window);
(function (_export) {
    'use strict';

    var popoverTemplate = function (id, content) {
        return '<div id="' + id + '" class="mapOverlay-popover"></div>';
    };

    var createMarker = function (coord, opt) {
        var id = opt.id;
        opt.$popover = $(popoverTemplate(id));
        opt.overlay = new ol.Overlay({
            element: opt.$popover.get(0),
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -50]
        });

        opt.feature = new ol.Feature({
            geometry: new ol.geom.Point(coord),
            name: 'mapMarker'
        });
        opt.feature.setId(id);
        //     opt.feature.setStyle(iconStyle());
        return opt;
    };

    var insertMarker = function (opt) {
        var id = opt.id;
        var $popover = $(popoverTemplate(id));
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(opt.position),
            name: 'mapMarker'
        });
        
        feature.setId(id);
        //    feature.setStyle(iconStyle());
        return {
            id: id,
            $popover: $popover,
            overlay: new ol.Overlay({
                element: $popover.get(0),
                positioning: 'bottom-center',
                stopEvent: false,
                offset: [0, -50]
            }),
            feature: feature,
            type: 'marker',
            manager: opt.manager,
            content: opt.text,
            featureImageSrc: opt.featureImageSrc,
            title: opt.title
        };
    };

    var Marker = function (manager) {
        var map = manager.getMap();
        var vectorLayer;

        var makeLayer = function () {
            vectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector()
            });
            //    map.addLayer(vectorLayer);
            vectorLayer.setMap(map);
        };

        var add = function () {
            if (!vectorLayer) {
                makeLayer();
            }
        };

        var insert = function (_opt) {
            var data = insertMarker(_opt);
            if (!vectorLayer) {
                makeLayer();
            }
            data.layer = vectorLayer;
            var item = new naji.MapOverlay.MarkerItem(data);
            item.text(_opt.text);
            return item;
        };

        var event = {
            down: function (e, id) {
                var markerData = createMarker(e.coordinate, {
                    id: id,
                    type: 'marker',
                    manager: manager,
                    layer: vectorLayer
                });

                var markerItem = new naji.MapOverlay.MarkerItem(markerData);
                manager.addItem(markerItem);
                return markerItem;
            },
            up: function (e) {
                e.targetItem.eventOn();
            }
        };

        return {
            add: add,
            insert: insert,
            event: event
        };
    };

    _export.naji.MapOverlay.Marker = Marker;

})(window);
(function (_export) {
    'use strict';
    
    var MarkerItem = function (opt) {
        var manager = opt.manager;
        var map = manager.getMap();

        var id = opt.id;
  //      var featureImageSrc = opt.featureImageSrc;
        var feature = opt.feature;
        var vectorLayer = opt.layer;
        var $popover = opt.$popover;
        var overlay = opt.overlay;
        var content = opt.content || '';
        var style = new naji.MapOverlay.MarkerStyle({
            feature: feature,
            featureImageSrc: opt.featureImageSrc
        });

        var markerTitle = opt.title || '';

        var eventUtil = new naji.MapOverlay.util.Event(map);


   //     setFeatureImage(opt.featureImageSrc);

        vectorLayer.getSource().addFeature(feature);
        map.addOverlay(overlay);

        var remove = function () {
            vectorLayer.getSource().removeFeature(feature);
            map.removeOverlay(overlay);
            manager.removeItem(id);
        };

        var setPopover = function () {
            var $clone = $popover.clone();
            $popover.remove();
            $popover = $clone;
            overlay.setElement($popover.get(0));
            $popover
                .popover({
                    placement: 'top',
                    html: true,
                    content: content
                }).on('inserted.bs.popover', function (e) {
                    var $target = $popover.next();
                    $target.css(style.size());
                });
        };

        var _this = this;

        var text = function (userText) {
            if (userText) {
                content = userText
                if ($popover.data('bs.popover')) {
                    $popover.popover('destroy');
                }
                setPopover();
                return _this;
            } 
            return content;
        };


        var setSize = function (size) {
            if (!size) {
                return false;
            }
            style.size(size);
        };

        var setPosition = function (coord) {
            feature.setGeometry(new ol.geom.Point(coord));
            return _this;
        };

        var showPopover = function () {
            var coordinates = feature.getGeometry().getCoordinates();
            overlay.setPosition(coordinates);
            $popover.popover('toggle');
        };

        var hidePopover = function () {
            $popover.popover('hide');
        };

        var getTemplate = function () {
            return $popover;
        };

        var eventOn = function () {};

        var eventOff = function () {};

        var exportData = function () {
            return {
                id: id,
                title: markerTitle,
                text: content,
                type: 'marker',
                featureImageSrc: style.markerImage(),
                position: feature.getGeometry().getCoordinates()
            };
        };

        var changeMarkerImage = function (src) {
            style.markerImage(src);
        };

        var title = function (_title) {
            if (_title) {
                markerTitle = _title;
                return this;
            }
            return markerTitle;
        };

        return {
            remove: remove,
            getTemplate: getTemplate,
            text: text,
            setPosition: setPosition,
            eventOn: eventOn,
            eventOff: eventOff,
            type: 'marker',
            id: id,
            showPopover: showPopover,
            hidePopover: hidePopover,
            exportData: exportData,
            changeMarkerImage: changeMarkerImage,
            setSize: setSize,
            getSize: style.size,
            title: title
        };

        
    };

    _export.naji.MapOverlay.MarkerItem = MarkerItem;

})(window);
(function (_export) {

    var defaultImage = 'data:image/png;base64,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';

    var iconImage = function (_paramSrc) {
        var deferred = $.Deferred();
        var image = new Image();
        /*
        var src;
        if (_paramSrc) {
            src = _paramSrc;
*/
        image.onload = function () {
            deferred.resolve(image);
        };
        image.src = _paramSrc;
        return deferred;
    };
    
    var iconStyle = function (image) {
        return new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, image.height - 2],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                img: image,
                imgSize: [image.width, image.height]
            }))
        });
    };

    var setFeatureImage = function (paramSrc) {
        var deferred = $.Deferred();
        iconImage(paramSrc)
            .then(
                function (img) {
                    deferred.resolve(iconStyle(img));
                }, 
                deferred.reject
            );
        return deferred;
    };

    var markerStyle = function (opt) {
        var popoverSize = {};
        var imageSrc = opt.featureImageSrc || defaultImage;
        var markerImage = function (src) {
            if (src) {
                imageSrc = src;
                setFeatureImage(imageSrc)
                    .done(function (style) {
                        opt.feature.setStyle(style);
                    });  
            } else {
                return imageSrc;
            }
        };

        var convertToTextCss = function () {

        };

        var size = function (userSize) {
            if (!!userSize) {
                popoverSize = _.assignIn(popoverSize,  userSize);
                return this;
            }

            return {
                width: popoverSize.width,
                height: popoverSize.height
            };
        };

        markerImage(imageSrc);

        return {
            markerImage: markerImage,
            size: size
        };
    };

    naji.MapOverlay.MarkerStyle = markerStyle;

})(window);
(function (_export) {
    'use strict';

    var EventUtil = function (map) {
        var mapInteraction = {
            event: null,
            on: function (param) {
                mapInteraction.event = new ol.interaction.Pointer(param);
                map.addInteraction(mapInteraction.event);
            },
            off: function () {
                map.removeInteraction(mapInteraction.event);
            }
        }

        var draggable = function ($target, flag, opt) {
            if (!flag) {
                $target.draggable('destroy');
                return false;
            }
            $target.draggable({
                //        handle: '.-mapOverlay-move-icon',
                start: function () {
                    document.body.style.cursor = "move";
                    $('#' + map.getTarget()).trigger('dragstart', [$target.attr('id')]);
                },
                stop: function () {
                    $('#' + map.getTarget()).trigger('dragend');
                }
            });
        };

        var resize = function ($target, flag, opt) {
            if (!flag) {
                $target.resizable('destroy');
                return false;
            }
            $target
                .resizable({ //jQuery UI
                    start: function () {
                        $('#' + map.getTarget()).trigger('resizestart');
                    },
                    resize: function () {
                        // 크기 변경 시 노트의 크기를 변경
                        var $_this = $(this);
                        opt.resize({
                            width: $_this.width(),
                            height: $_this.height()
                        });
                    },
                    stop: function () {
                        $('#' + map.getTarget()).trigger('resizeend');
                    }
                });
        };

        return {
            interaction: mapInteraction,
            draggable: draggable,
            resize: resize
        };
    };

    var uuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
            function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    };

    _export.naji.MapOverlay.util = _export.naji.MapOverlay.util || {};

    _export.naji.MapOverlay.util.Event = EventUtil;
    _export.naji.MapOverlay.util.uuid = uuid;

})(window);