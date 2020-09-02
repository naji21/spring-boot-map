(function () {
	'use strict';
	
    var gridDefaultOption = { 
        cellHeight: 10,
        verticalMargin: 5,
        animate: false
    };

    var itemMovable = function ($el, opt, flag) {
        opt.widget.editMode(!flag);
        opt.grid.movable($el.get(0), flag);
    };

    function topMenuAction (opt) {
        var action = $(this).data('action');
        if (!action) {
            return false;
        }
        
        var $item = $(this).parents('.grid-stack-item');
        
        switch (action) {
	        case 'enableEdit' :
	        	$(this).next().show().siblings().hide();
	            itemMovable($item, opt, true);
	            break;
	        case 'disableEdit':
	        	$(this).hide().siblings().show();
	            itemMovable($item, opt, false);
	            break;
	        case 'addFile':
	        	$item.find('input[type="file"]').trigger('click');
	        	break;
	        case 'edit':
	        	opt.widget.edit();
	        	break;
	        case 'addLinkFile':
	        	$item.find('button.link-popover-btn').popover('toggle');
	        	break;
	        case 'removeItem':
	        	opt.items.removeItem(opt.key);
	            opt.grid.removeWidget($item.get(0));
	            break;
	        case 'chartModal':
	        	var _modal = opt.orgOpt.option.chart.modal;
	        	$(_modal.target + ' .modal-content').load(_modal.url, function () {
	        		$(_modal.target).modal('show');
	        	});
	        	$('body').on('gwpChartData', function (e, result) {
	        		opt.widget.addData(result);
	        	});
	        	break;
	        case 'mapModal':
	        	var _modal = opt.orgOpt.option.map.modal;
	        	$(_modal.target + ' .modal-content').load(_modal.url,  _modal.param, function () {
	        		$(_modal.target).modal('show');
	        	});
	        	
	        	$('body').on('gwpMapData', function (e, result, type) {
	        		$('body').off('gwpMapData');
	        		$(_modal.target).modal('hide');
	        		opt.widget.addMap(result, type);
	        	});
	        	break;
	        case 'swapAxis':
	        	opt.widget.swapAxis();
	        	break;
        }
        /*
        if (action === 'enableEdit') {
            $(this).next().show().siblings().hide();
            itemMovable($item, opt, true);
            
        } else if (action === 'disableEdit') {
            $(this).hide().siblings().show();
            itemMovable($item, opt, false);
            
        } else if (action === 'addFile') {
             $item.find('input[type="file"]').trigger('click');
             
        } else if (action === 'edit') {
            opt.widget.edit();
            
        } else if (action === 'addLinkFile') {
            $item.find('button.link-popover-btn').popover('toggle');
            
        } else if (action === 'removeItem') {
            opt.items.removeItem(opt.key);
            opt.grid.removeWidget($item.get(0));
            
        } else if (action === 'chartModal') {
        	var _modal = opt.orgOpt.option.chart.modal;
        	$(_modal.target + ' .modal-content').load(_modal.url, function () {
        		$(_modal.target).modal('show');
        	});
        	$('body').on('gwpChartData', function (e, result) {
        		opt.widget.addData(result);
        	});
        	
        } else if (action === 'mapModal') {
        	var _modal = opt.orgOpt.option.map.modal;
        	$(_modal.target + ' .modal-content').load(_modal.url,  _modal.param, function () {
        		$(_modal.target).modal('show');
        	});
        	
        	$('body').on('gwpMapData', function (e, result, type) {
        		$('body').off('gwpMapData');
        		$(_modal.target).modal('hide');
        		opt.widget.addMap(result, type);
        	});
        	
        } else if (action === 'swapAxis') {
        	opt.widget.swapAxis();
        }
        */
    }

    var popOverAction = {
        image: {
            fit: function (imageObj, mode) {
                var modes = ['origin', 'width', 'height', 'screen'];
                imageObj.fit(modes.indexOf(mode));
            },
            zoom: function (imageObj, mode) {
                if (mode === 'in') {
                    imageObj.zoomIn()
                } else {
                    imageObj.zoomOut();
                }
            },
            rotate: function (imageObj, mode) {
                imageObj.rotate(mode === 'left' ? -90 : 90);
            }
        },
        charts: {
        	theme: function (chartObj, mode) {
        		chartObj.changeTheme(mode);
        	},
        	chartType: function (chartObj, mode) {
        		chartObj.changeType(mode);
        	}
        }
    };

    /**
     * grid item 관리
     */
    function GridItems () {
        var items = {};

        this.addItem = function (item) {
            items[item.key] = item;
        };

        this.getItem = function (key) {
            return items[key];
        };

        this.removeItem = function (key) {
            delete items[key];
        };
        
        this.getAllItem = function () {
        	return _.map(items, function (item) {
        		return item;
        	});
        };
    }

    function emptyWidget (key, type) {
        var widgetTag = [
            gwp.widget.buttons.topButton[type],
            '<div class="grid-stack-item-content edit-mode '+ type + '" id="' + key + '"></div>'
        ];

        if (type === 'image' || type === 'video') {
            widgetTag.push(
            	'<input type="file" class="editor-' + type + '-file" accept="' + type + '/*">'
            );
        }
        
        return [
            '<div class="grid-stack-item" data-key="' + key + '">',
            widgetTag.join(''),
            '</div>'
        ].join('');
    }

    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid.split('-').join('');
    }

    /**
     * item 로딩 이미지
     */
    var loadingSpin = (function () {
        var spin = [
            '<div class="spin" style="position: absolute; z-index: 20;">',
            '   <i class="fa fa-refresh fa-spin fa-3x fa-fw"></i>',
            '</div>'
        ];
        var spinWidth = 54;
        var spinHeight = 42;

        return {
            show: function ($el) {
                $(spin.join(''))
                    .css({
                        top: ($el.height() / 2) - (spinHeight / 2),
                        left: ($el.width() / 2) - (spinWidth / 2)
                    })
                    .appendTo($el);
            },
            hide: function ($el) {
                $el.find('div.spin').remove();
            }
        };
    })();

    /**
     * item 생성
     * @param {} option 
     */
    function getWidgetObject (option) {
    	if (option.type === 'empty') {
    		return {
    			resize: function () {},
                editMode: function (mode) {},
    			exportData: function () {
    				return {
    					type: 'empty'
    				};
    			},
    			importData: function () {},
    			checkData: function () {
    				return true;
    			}
    		};
    	}
        var target = option.type + 'Widget';
        return new gwp.widget[target](option);
    }

    var gridEditor = function (option) {
        var $gridContainer = $(option.selector);
        var backgroundStyle = option.style || {};
        var gridItem = new GridItems();
        var _this = this;
        
        var lang = 'en-US';
        
        if (option.lang === 'ko') {
        	lang = 'ko-KR';
        	$.getScript('resources/js/gwpBlogEditor/lang/summernote-ko-KR.js');
        } else if (option.lang === 'vn') {
        	lang = 'vi-VN';
        	$.getScript('resources/js/gwpBlogEditor/lang/summernote-vi-VN.js');
        }
        
        $gridContainer
            .addClass('grid-stack')
            .css(backgroundStyle)
            .width(option.width)
            .gridstack(_.assignIn(option.option, gridDefaultOption || {}));

        if (option.width === '100%') {
        	$(window)
        		.off('resize.blogeditor')
        		.on('resize.blogeditor', _.debounce(function () {
	        		var items = gridItem.getAllItem();
	        		_.map(items, function (item) {
	        			item.obj.resize && item.obj.resize();
	        		});
        		}, 300));
        }
        
        this.grid = $gridContainer.data('gridstack');

        var openImageFile = function (url, isLocal) {
            var $item = $(this).parents('.grid-stack-item');
            var imageObj = gridItem.getItem($item.data('key')).obj;
            loadingSpin.show($item);
            $item.find('button.link-popover-btn').popover('hide');
            
            imageObj[isLocal? 'addLocalImage': 'addImage'](url)
                .then(function () {
                    $item.data('insert', 'Y');
                    loadingSpin.hide($item);
                }, function () {
                    loadingSpin.hide($item);
                });
        };

        var openVideoFile = function (url, isLocal) {
            var $item = $(this).parents('.grid-stack-item');
            var videoObj = gridItem.getItem($item.data('key')).obj;
            loadingSpin.show($item);
            $item.find('button.link-popover-btn').popover('hide');
            videoObj[isLocal? 'addLocalFile': 'addFile'](url);
            loadingSpin.hide($item);
        };
        
        var openLinkPage = function (url) {
        	if (!url || url === '') {
        		return false;
        	}
            var $item = $(this).parents('.grid-stack-item');
            var linkObj = gridItem.getItem($item.data('key')).obj;
            loadingSpin.show($item);
            linkObj.url(url, function () {
                loadingSpin.hide($item);
                $item.find('button.link-popover-btn').popover('toggle');
            });
        };

        $gridContainer
            .on('gsresizestop', function (e, el) {
                var key = $(el).data('key');
                gridItem.getItem(key).obj.resize();
            })
            // 상단 버튼 이벤트
            .on('click', '.grid-stack-item-menu button', function (e) {
                var _key = $(this).parent().siblings('.grid-stack-item-content').attr('id');
                if(_key) {
                    var widgetObj = gridItem.getItem(_key).obj;
                    topMenuAction.call(this, {
                        grid: _this.grid,
                        items: gridItem,
                        widget: widgetObj,
                        key: _key,
                        orgOpt: option
                    });
                }
            })
            // 파일 선택
            .on('change', 'input[type="file"]', function (e) {
                if (e.target.files.length === 0) {
                    return false;
                }
                if ($(this).hasClass('editor-image-file')) {
                    openImageFile.call(this, e.target.files[0], true);
                } else if ($(this).hasClass('editor-video-file')) {
                    openVideoFile.call(this, e.target.files[0], true);
                }        
            });

        
        $('.grid-stack')
            // dropdown 버튼 이벤트
            .on('click', '.dropdown-menu li a', function (e) {  // popover 버튼 이벤트
                e.preventDefault();
                var $li = $(this).parent();
                var action = $li.data('action');
                var mode = $li.data('mode');
                var key = $li.parents('.grid-stack-item').data('key');
                var item = gridItem.getItem(key);

                if (action !== 'close') {
                    popOverAction[item.type][action](item.obj, mode);
                }
                $('.gwp-editor-top-menu-popover-wrap').remove();
            })
            // popover 버튼 이벤트
            .on('click', 'button.link-btn', function () {
                var $content = $(this).parents('.grid-stack-item-menu').next(); 
                var url = $(this).parent().prev().val();
                if ($content.hasClass('image')) {
                    openImageFile.call(this, url);
                } else if ($content.hasClass('video')) {
                    openVideoFile.call(this, url);
                } else if ($content.hasClass('link')) {
                	openLinkPage.call(this, url);
                }
                
            });

        this.addWidget = function (type) {
            var widgetObj;
            var key = generateUUID();
            var $widget = $(emptyWidget(key, type));
            
            this.grid.addWidget($widget.get(0), 0, 0, 12, 17, true);

            if (type === 'image' || type === 'video' || type === 'link') {
                $widget.find('button.link-popover-btn').popover({
                    html: true,
                    title: 'Link',
                    trigger: 'manual',
                    placement: 'left',
                    content: gwp.widget.buttons.popOver.link
                });
            }

            widgetObj = getWidgetObject({
                type: type, 
                container_id: key,
                height: $widget.height(),
                width: $widget.width(),
                lang: lang,
                opt: option.option[type] || {}
            });

            gridItem.addItem({
                key: key,
                type: type,
                obj: widgetObj
            });

            this.grid.movable($widget.get(0), false);
            return this;
        };
        
        this.insertWidget = function (widget) {
        	var item = widget.item;
        	var widgetObj;
            var key = generateUUID();
            var $widget = $(emptyWidget(key, item.type));
            
            this.grid.addWidget($widget.get(0), widget.x, widget.y, widget.width, widget.height, false);

            if (item.type === 'image' || item.type === 'video' || item.type === 'link') {
                $widget.find('button.link-popover-btn').popover({
                    html: true,
                    title: 'Link',
                    trigger: 'manual',
                    placement: 'bottom',
                    content: gwp.widget.buttons.popOver.link
                });
            }

            widgetObj = getWidgetObject({
                type: item.type, 
                container_id: key,
                height: $widget.height(),
                width: $widget.width(),
                lang: lang,
                opt: option.option[item.type] || {}
            });
            
            var _item = {
        		key: key,
                type: item.type,
                obj: widgetObj	
            };

            gridItem.addItem(_item);

            this.grid.movable($widget.get(0), false);
        //    this.grid.resizable($widget.get(0), false);
            return _item;
        };

        /*
        this.preview = function (target_id, callback) {
            var $preview = $gridContainer.clone();
            var $contents = $preview.find('div.grid-stack-item-content');
            $contents
                .removeClass('edit-mode')
                .siblings().remove();
            
            $('#' + target_id).html($preview);
            
            $contents.filter('.image').each(function () {
                var key = $(this).attr('id');
                var imgSrc = gridItem.getItem(key).obj.toDataURL();
                var img = new Image();
                img.onload = function () {
                    $preview.find('#' + key)
                        .empty()
                        .append(img);
                };
                img.src = imgSrc;
            });
            
            $contents.filter('.charts').each(function (idx) {
                var key = $(this).attr('id');
                var expData = gridItem.getItem(key).obj.exportData();
                $(this)
                	.attr('id', key + idx)
                	.removeAttr('_echarts_instance_')
                	.empty();
                var _widget = new gwp.widget.chartsWidget({
                	container_id: key + idx
                });
                _widget.importData(expData);
            });
            
            $contents.filter('.map').each(function (idx) {
            	var key = $(this).attr('id');
            	var obj = gridItem.getItem(key).obj;
            	var expData = obj.getData();
            	var $taget = $preview.find('#' + key);
            	$taget.empty();
            	obj.loadMap(expData, $taget);
            });
            
            callback && callback();
        };
        */
        
        this.exportItem = function () {
        	var checkedFalseObj = _.filter($('.grid-stack > .grid-stack-item'), function(el) {
        		var key = $(el).find('.grid-stack-item-content').attr('id');
        		return !gridItem.getItem(key).obj.checkData();
        	});
        	
        	if (checkedFalseObj.length > 0) {
        		return false;
        	}
        	
        	var rtn = {
        		blogWidth: option.width,
        		style: backgroundStyle
        	};
        	
        	rtn.items = _.map($('.grid-stack > .grid-stack-item'), function(el) {
        		var $el = $(el);
        		var key = $el.find('.grid-stack-item-content').attr('id');
        		var node = $el.data('_gridstack_node');
        		var expData = gridItem.getItem(key).obj.exportData();
        		return {
        			x: node.x,
        			y: node.y,
        			width: node.width,
        			height: node.height,
        			item: expData
        		};
        	});
        	rtn.items = GridStackUI.Utils.sort(rtn.items);
        	return rtn;
        };
        
        this.importItem = function (items) {
        	var _this = this;
        	$.each(items, function (idx, widget) {
        		var iItem = _this.insertWidget(widget);
        		iItem.obj.importData(widget.item);
        	});
        };
        
        this.getUploadFile = function () {
        	return _.chain($('.grid-stack .grid-stack-item-content.image'))
	        	.map(function(el) {
	        		var key = $(el).attr('id');
	        		return gridItem.getItem(key).obj.getFile();
	        	})
	        	.filter(function (file) {
	        		return !file.link && !file.importData
	        	})
	        	.value();
        };
        
        this.style = function (_style) {
        	if (_style) {
        		backgroundStyle = $.extend({}, backgroundStyle, _style);
        	} else {
        		return backgroundStyle;
        	}
        	
        };
    };

    window.gwp = window.gwp || {};
    if (!window.gwp.widget) {
        window.gwp.widget = {};
    }
    window.gwp.GridEditor = gridEditor;
})();
(function () {
	'use strict';
	
	function chartWidget (option) {
        var $container = $('#' + option.container_id);
        var theme = 'shine';
        var chartType = 'line';
        var chartObj;
        var chartOption;
        var reverse = false;
        var chartData;
                
        return {
            resize: function () {
            	if (chartObj) {
            		chartObj.resize();
            	}            	
            },
            editMode: function () {},
            addData: function (data) {
            	chartData = data;
            	chartOption = $.extend({}, data, {
    				container: option.container_id,
    				type: chartType,
    				theme: theme,
    				reverse: reverse
    			});
            	chartObj = new gwp.chart(chartOption);
            },
            changeTheme: function (selectedTheme) {
            	theme = selectedTheme;
            	chartObj.changeTheme(selectedTheme);
            },
            getTheme: function () {
            	return theme;
            },
            checkData: function () {
            	return !!chartObj;
            },
            exportData: function () {
            	if (!chartObj) {
            		return false;
            	}
                return {
                	type: 'charts',
                	data: {
	                	data: chartData,
	                	theme: theme,
	                	reverse: reverse,
	                	type: chartType
                	}
                };
            },
            importData: function (_opt) {
            	var opt = _opt.data;
            	chartType = opt.type;
            	theme = opt.theme;
            	reverse = opt.reverse;
            	chartData = opt.data;
            	
            	chartOption = $.extend({}, chartData, {
            		container: option.container_id,
    				theme: opt.theme,
    				reverse: opt.reverse,
    				type: opt.type
    			});
            	chartObj = new gwp.chart(chartOption);
            	chartObj.resize();
            },
            swapAxis: function () {
            	reverse = !reverse;
            	chartObj.swapAxis();
    		},
    		changeType: function (type) {
    			chartOption.type = chartType = type;
    			chartOption.reverse = reverse;
    			chartOption.theme = theme;
    			chartObj = new gwp.chart(chartOption);
    		}
        };
    };

    window.gwp = window.gwp || {};
    if (!window.gwp.widget) {
    	window.gwp.widget = {};
    }
    window.gwp.widget.chartsWidget = chartWidget;

})();
(function () {
	'use strict';
	

	function clone(obj) {
		if (obj === null || typeof(obj) !== 'object')
			return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) {
				copy[attr] = clone(obj[attr]);
			}
		}
		return copy;
	}

	var newPosition = function newPosition(paramPos) {
	    var offset = this.mainImage.getOffset();
	    var pos = paramPos || this.stage.position();
	    var imgW = void 0;
	    var imgH = void 0;
	    var newPos = pos,
	        offsetX = void 0,
	        offsetY = void 0,
	        gapX = void 0,
	        gapY = void 0;
	    var scale = this.scale;

	    if (this.isRotate90()) {
	        imgW = this.mainImage.getWidth() * scale.y;
	        imgH = this.mainImage.getHeight() * scale.x;
	        offsetX = offset.y * scale.x;
	        offsetY = offset.x * scale.y;
	        gapX = imgH - this.stage.width();
	        gapY = imgW - this.stage.height();
	    } else {
	        imgW = this.mainImage.getWidth() * scale.x;
	        imgH = this.mainImage.getHeight() * scale.y;
	        offsetX = offset.x * scale.x;
	        offsetY = offset.y * scale.y;
	        gapX = imgW - this.stage.width();
	        gapY = imgH - this.stage.height();
	    }

	    if (gapX < 0) {
	        newPos.x = offsetX - gapX / 2;
	    } else if (offsetX - pos.x < 0) {
	        newPos.x = offsetX;
	    } else if (offsetX - pos.x > gapX) {
	        newPos.x = offsetX - gapX;
	    }

	    if (gapY < 0) {
	        newPos.y = offsetY - gapY / 2;
	    } else if (offsetY - pos.y < 0) {
	        newPos.y = offsetY;
	    } else if (offsetY - pos.y > gapY) {
	        newPos.y = offsetY - gapY;
	    }

	    return newPos;
	};

	// export module
	var imageWidget = function imageWidget(opt) {
	    var _this2 = this;

	    this.isLoaded = false;
	    this.mainImage = undefined;
	    this.scale = {
	        x: 1,
	        y: 1
	    };
	    this.rotation = 0;

	    var container = document.getElementById(opt.container_id);
	    var init = function init() {
	        createStage(opt);
	        _this2.resize();
	    };

	    this.importData = false;
	    this.file = undefined;
	    this.url = undefined;
	    this.link = false;

	    var createStage = function createStage(opt) {
	        var _this = _this2;

	        _this2.stage = new Konva.Stage({
	            container: opt.container_id,
	            width: opt.width || container.width,
	            height: opt.height || container.height,
	            dragBoundFunc: function dragBoundFunc(pos) {
	                return newPosition.call(_this, pos);
	            }
	        });
	        _this2.stage.add(new Konva.Layer());
	    };

	    var viewImage = function viewImage(src) {
	        if (_this2.mainImage) {
	            _this2.scale = { x: 1, y: 1 };
	            _this2.stage.scale(_this2.scale);
	            if (_this2.rotation !== 0) {
	                _this2.rotation = 0;
	                _this2.stage.rotation(_this2.rotation);
	            }
	        }
	        return new Promise(function (resolve, reject) {
	            var imgObj = new Image();
	            imgObj.onload = function () {
	                var offset = {
	                    x: imgObj.width / 2,
	                    y: imgObj.height / 2
	                };
	                _this2.isLoaded = true;
	                _this2.mainImage = new Konva.Image({
	                    x: 0,
	                    y: 0,
	                    offset: offset,
	                    image: imgObj,
	                    width: imgObj.width,
	                    height: imgObj.height
	                });
	                _this2.stage.getLayers()[0].add(_this2.mainImage);
	                _this2.stage.draggable(true);
	                _this2.stage.position(offset).draw();
	                if (imgObj.width > _this2.stage.width() || imgObj.height > _this2.stage.height()) {
	                    if (imgObj.width > imgObj.height) {
	                        fitWidth();
	                    } else {
	                        fitHeight();
	                    }
	                }

	                var pos = newPosition.call(_this2);
	                _this2.stage.position(pos).draw();
	                resolve(imgObj);
	            };
	            imgObj.onerror = function () {
	                reject();
	            };
	            imgObj.src = src;
	        });
	    };

	    var setScale = function setScale(scale) {
	        _this2.scale = scale;
	        _this2.stage.scale(scale);
	        var pos = newPosition.call(_this2);
	        _this2.stage.position(pos).draw();
	    };

	    var setWidthHeightScale = function setWidthHeightScale(type, imgType) {
	        return _this2.stage[type]() / _this2.mainImage[imgType || type]();
	    };

	    var fitWidth = function fitWidth() {
	        var scale = 1;
	        if (_this2.isRotate90()) {
	            scale = setWidthHeightScale.call(_this2, 'width', 'height');
	        } else {
	            scale = setWidthHeightScale.call(_this2, 'width');
	        }

	        setScale({ x: scale, y: scale });
	        return _this2;
	    };

	    var fitHeight = function fitHeight() {
	        var scale = 1;
	        if (_this2.isRotate90()) {
	            scale = setWidthHeightScale.call(_this2, 'height', 'width');
	        } else {
	            scale = setWidthHeightScale.call(_this2, 'height');
	        }
	        setScale({ x: scale, y: scale });
	        return _this2;
	    };

	    var fitScreen = function fitScreen() {
	        var scale = {};
	        if (_this2.isRotate90()) {
	            scale.x = setWidthHeightScale.call(_this2, 'height', 'width');
	            scale.y = setWidthHeightScale.call(_this2, 'width', 'height');
	        } else {
	            scale.x = setWidthHeightScale.call(_this2, 'width');
	            scale.y = setWidthHeightScale.call(_this2, 'height');
	        }
	        setScale(scale);
	        return _this2;
	    };

	    /*
	     *  public api~~
	     */

	    this.addImage = function (src) {
	        _this2.url = src;
	        _this2.importData = false;
	        _this2.link = true;
	        _this2.file = undefined;
	        _this2.mainImage && _this2.mainImage.destroy();
	        src = opt.opt.proxy + '?' + opt.opt.param + '=' + encodeURI(src);
	        return viewImage(src);
	    };

	    this.addLocalImage = function (file) {
	        var fileArr = file.name.split('.');
	        _this2.importData = false;
	        _this2.file = file;
	        _this2.url = opt.container_id + '.' + fileArr[fileArr.length - 1].toLowerCase();
	        _this2.link = false;
	        return new Promise(function (resolve, reject) {
	            var reader = new FileReader();
	            reader.addEventListener("load", function () {
	                _this2.mainImage && _this2.mainImage.destroy();
	                viewImage(reader.result).then(function (result) {
	                    resolve(result);
	                }, reject);
	            }, false);
	            reader.readAsDataURL(file);
	        });
	    };

	    this.fit = function (mode) {
	        if (mode === 0) {
	            setScale({
	                x: 1, y: 1
	            });
	        } else if (mode === 1) {
	            fitWidth();
	        } else if (mode === 2) {
	            fitHeight();
	        } else if (mode === 3) {
	            fitScreen();
	        }
	        var pos = newPosition.call(_this2);
	        _this2.stage.position(pos).draw();
	        return _this2;
	    };

	    this.zoomIn = function () {
	        var scale = clone(_this2.scale);
	        scale.x += 0.2;
	        scale.y += 0.2;
	        if (Math.max(scale.x, scale.y) < 4) {
	            setScale(scale);
	        }
	    };

	    this.zoomOut = function () {
	        var scale = clone(_this2.scale);
	        scale.x -= 0.2;
	        scale.y -= 0.2;
	        if (Math.min(scale.x, scale.y) > 0.2) {
	            setScale(scale);
	        }
	    };

	    this.rotate = function (deg) {
	        _this2.rotation += deg;
	        _this2.rotation = _this2.rotation % 360;
	        _this2.stage.rotation(_this2.rotation);
	        var pos = newPosition.call(_this2);
	        _this2.stage.position(pos).draw();
	    };

	    this.isRotate90 = function () {
	        var deg = Math.abs(_this2.rotation);
	        return deg / 90 % 2 === 1;
	    };

	    this.resize = function () {
	        setTimeout(function () {
	            _this2.stage.width(container.offsetWidth);
	            _this2.stage.height(container.offsetHeight);
	            if (_this2.mainImage) {
	                var pos = newPosition.call(_this2);
	                _this2.stage.position(pos).draw();
	            }
	        }, 300);
	    };

	    this.editMode = function (flag) {
	        _this2.stage.draggable(flag);
	    };

	    this.toDataURL = function () {
	        return _this2.stage.toDataURL();
	    };

	    this.exportData = function () {
	        if (!_this2.isLoaded) {
	            return false;
	        }
	        return {
	            type: 'image',
	            pos: _this2.stage.position(),
	            scale: _this2.scale,
	            rotation: _this2.rotation,
	            link: _this2.link,
	            url: _this2.url,
	            viewImage: _this2.toDataURL()
	        };
	    };

	    this.checkData = function () {
	        return _this2.isLoaded;
	    };

	    this.importData = function (data) {
	        var imageUrl;
	        _this2.url = data.url;
	        _this2.link = data.link;
	        if (data.link) {
	            imageUrl = opt.opt.proxy + '?' + opt.opt.param + '=' + encodeURI(data.url);
	        } else {
	            imageUrl = 'blog/dash/' + data.url;
	        }
	        _this2.importData = true;

	        viewImage(imageUrl).then(function () {
	            setScale(data.scale);
	            _this2.rotate(data.rotation);
	            _this2.stage.position(data.pos).draw();
	        });
	    };

	    this.getFile = function () {
	        return {
	            file: _this2.file,
	            url: _this2.url,
	            id: opt.container_id,
	            link: _this2.link,
	            importData: _this2.importData
	        };
	    };

	    init();
	};
	
	window.gwp.widget.imageWidget = imageWidget;
})();

(function () {
	'use strict';
	
    var linkWidget = function (option) {
        var $container = $('#' + option.container_id);
        var $iframe = $('<iframe class="gwpLinkFrame" width="100%" height="100%" frameborder="0"></iframe>');
        var loadCallback;
        $container.append($iframe);

        $iframe.on('load', function () {
            if (loadCallback) {
                loadCallback();
            }
        });

        $iframe.on('error', function () {
            console.log('error');
        });

        var currentUrl;

        var loadPage = function (targetUrl) {
            currentUrl = targetUrl;
            $iframe.attr('src', currentUrl);
        };

        var url = function (targetUrl, callback) {
            if (!targetUrl) {
                return currentUrl
            }            
            loadCallback = callback;
            loadPage(targetUrl);
        };
        
        var checkData = function () {
        	return !!currentUrl;
        };
        
        var exportData = function () {
        	if (!currentUrl) {
        		return false;
        	}
        	return {
        		type: 'link',
        		url: currentUrl
        	};
        };
        
        var importData = function (data) {
        	url(data.url);
        };

        return {
            resize: function () {},
            editMode: function (mode) {
            	if (mode) {
            		$container.find('div.overlay').remove();
            	} else {
            		$('<div class="overlay"></div>')
            			.appendTo($container);
            	}
            },
            exportData: exportData,
            importData: importData,
            url: url,
            checkData: checkData
        };
    };

    window.gwp = window.gwp || { widget: {}};
    window.gwp.widget.linkWidget = linkWidget;
})();
(function () {
	
    var mapWidget = function (option) {
        var $container = $('#' + option.container_id);
        var baseURL = option.opt.baseURL;
        var map;
        var olMap;
 //       var uGisManager;
        var type;
        var mapData;
        var mapDataType;
        
        var url_uwms = baseURL + 'uwms';
    	var url_wms = baseURL + 'wms';
    	var url_wfs = baseURL + 'wfs';
    	var url_wmts = baseURL + 'wmts';
    	
        uGisMapPlatForm.uGisConfig.init({
        	proxy : proxy,
        	loadingImg : dataLoadingImg,
        	useLoding : true,
        	alert_Error : function(msg_) {
				return gwp.notification.error({
					title: 'ERROR',
					content: msg_,
					timeout: 10000
				});
			}
		});	
        
        var loadError = function () {
        	$container.empty();
        	$('<div></div>')
        		.addClass('map-load-error')
        		.append('<i class="fa fa-2x fa-ban" aria-hidden="true"></i> Error')
        		.appendTo($container);
        };
        
        var createMap = function (id) {
        	//$container.append('<div id="loadingDIV"></div>');
        	map = new uGisMapPlatForm.uGisMap( {
    			target : id,
    			crs : 'EPSG:3857',
    			center : [ 0, 0 ],
    			useMaxExtent : true,
    			useAltKeyOnly : true
    		});
        	olMap = map.getMap();

        	var button = document.createElement('button');
	    	button.title = 'Zoom Lv' || ''; 
			button.innerHTML = olMap.getView().getZoom();
			var element = document.createElement('div');
			element.className = 'zoomLv' + ' ol-unselectable ol-control';
			element.appendChild(button);	
			olMap.addControl( new ol.control.Control({
			    element: element
			}));
		      
	      	olMap.on("moveend", function() {
	            var zoom = olMap.getView().getZoom(); 
	            $("#" + id + " .zoomLv > button").html(zoom);
	        });
        	/*
        	var baseM = new uGisMapPlatForm.baseMap.uGisBaseMap( {
    			target : "mapDIV_Base",
    			uGisMap : map,
    			baseMapKey : 'osm_none' 
    		} );
        	
        	uGisManager = new uGisMapPlatForm.uGisManager( {
    			uGisMap : map,
    			uGisBaseMap : baseM,
    			useMinMaxZoom : true
    		});	
        	*/
        	return map;
        };
        
        var loadWms = function(data, extent, id){
        	var url = url_wms + "?KEY=" + (data.dtsourceid || data.dtsource_ID);	
        	var wmsR = new uGisMapPlatForm.service.uGisGetCapabilitiesWMS( {
        		useProxy : true,
        		version : "1.3.0",
        		serviceURL : url,
        		dataViewId : map.getDataViewId()
    		} );

    		wmsR.then( function() {

    			map.addWMSLayer( {
    				uWMSLayer : new uGisMapPlatForm.layer.uGisWMSLayer( {
        				useProxy : false,
        				singleTile : false,
        				serviceURL : url,
        				ogcParams : {
        					LAYERS : 'ROOT',
        					CRS : map.getCRS(),
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
        			}),
    				useExtent : extent,
    				extent : null,
    				resolution : null
    			});
    			mapData = data;
    		});	
    	};
    	
    	var loadWfs = window.blogMapWidgetWfs = function(data, extent){		
    		
    		var url =  url_wfs + "?KEY=" + (data.dtsourceid || data.dtsource_ID);
    		
    		var wfsR = new uGisMapPlatForm.service.uGisGetCapabilitiesWFS( {
    			useProxy : true,
    			version : "1.1.0",
    			serviceURL : url,
    			dataViewId : map.getDataViewId()
    		} );
    		
    		wfsR.then( function() {
    			
    			var serviceMetaData = wfsR.data[ "serviceMetaData" ];
    			var wfsLayerList = serviceMetaData[ "layers" ];
    			
    			wfsLayerList = ( Array.isArray( wfsLayerList ) ) ? wfsLayerList : [ wfsLayerList ];	
    			
    			if(wfsLayerList.length==1){
    				data.layername = wfsLayerList[0]["Name"];				
    			}			
    			
    			if(!data.layername){	
    				var param = {
    					layers : JSON.stringify(wfsLayerList),
    					data : JSON.stringify(data),
    					callbackfn : 'blogMapWidgetWfs'
    				}
    				
    				$('#remoteSmallModal').modal().find('.modal-content').load("contents/map/selectLayer", param);
    			}else{    				
    				map.addWFSLayer( {
    					uWFSLayer : new uGisMapPlatForm.layer.uGisWFSLayer({
        					useProxy : false,
        					serviceURL : url,
        					layerName : data.layername,
        					srsName : map.getCRS(),
        					dataViewId : map.getDataViewId()
        				}),
    					useExtent : extent
    				});
    				mapData = data;
    			}
    		});
    	};
    	
    	var loadWmts = function(data, extent){
    		var url = url_wmts + "?KEY=" + (data.dtsourceid || data.dtsource_ID);
    		
    		var wmtsR = new uGisMapPlatForm.service.uGisGetCapabilitiesWMTS( {
    			useProxy : true,
    		    version : "1.0.0",
    		    serviceURL : url,
    		    dataViewId : map.getDataViewId()
    		} );


    		wmtsR.then( function() {
    			var bbox = [];
    			var layer = data.title || 'undfined'; //타이틀
    			var matrixSet = layer + '_MATRIXSET';

    			var layers = wmtsR.data.olJson.Contents.Layer;

    			for ( var i in layers) {
    				if ( layers[ i ][ "Identifier" ] === layer ) {
    					bbox = layers[ i ][ "WGS84BoundingBox" ];
    					break;
    				}
    			}

    			var uWmtsLayer = new uGisMapPlatForm.layer.uGisWMTSLayer( {
    				useProxy : false,
    				serviceURL : url,
    				layer : layer,
    				matrixSet : matrixSet,
    				projection : map.getCRS(),
    				version : '1.0.0',
    				wmtsCapabilities : wmtsR.data,
    				originExtent : bbox
    			});
    			
    			map.addWMTSLayer( {
    				uWMTSLayer : uWmtsLayer,
    				useExtent : extent,
    				extent : null
    			});
    			mapData = data;
    		});
    	};
    	
    	var loadLayer = function(data, extent, id){    	
    		
    		data.title = data.title || data.layer_TITLE;
    		data.sldtitle = data.sldtitle || 'default';
    		data.layerFilter = data.layerFilter || '';
    		
    		
    		var ogcParams = {
				KEY : data.userid || data.user_ID,
		        LAYERS: data.title,
		        CRS: map.getCRS(),
		        STYLES: (data.sldUserNm || data.owner) + ':' + data.sldTitle, 
		        FORMAT: 'image/png',
		        BGCOLOR: '0xffffff', 
		        EXCEPTIONS: 'BLANK',
		        LABEL: 'HIDE_OVERLAP',
		        GRAPHIC_BUFFER: '128',
		        ANTI: 'true',
		        TEXT_ANTI: 'true',
		        VERSION: '1.3.0',
		        cql_filter: data.layerFilter	
    		};
    		
    		var uWMSLayer = new uGisMapPlatForm.layer.uGisWMSLayer({
    			useProxy: false,
    			singleTile: true,
    			serviceURL: url_uwms,
    			ogcParams: ogcParams
    		});
    		
    		gwp.util.map.readBoundingBox({
				url: url_uwms,
				data: { 
					'KEY' : session_user_id,
					'REQUEST' : 'GetCapabilities'
				},
				title : data.title,
				defaultCrs : "EPSG:3857"
			})
			.done( function(boundingBox) {
				var transExtent = ol.proj.transformExtent(boundingBox.pos, boundingBox.crs, 'EPSG:3857');
				
				map.addWMSLayer({
	    			uWMSLayer: uWMSLayer,
	    			useExtent: true,
	    			extent: transExtent,
	    			resolution: null
	    		}).then(function () {
	    		});
			} )
			.fail(function () {
				
			});
    		
    		mapData = data;
    	};
    	
    	var loadBlogMap = function (data, id) {
    		$container.load('embedded/view/map/' + data.contents_id, function () {
    			map = 'blogMap';
    			$container.find('.center-container, .right-container').css('min-height', 0);
    		//	mapResize();
    		});
    		mapData = data;
    	};
        
        var loadMap = function (data, type, id, callback, extent) {
        	
        	switch (type) {
	  			case 'layer': 
	  				createMap(id);
	  				loadLayer(data, extent, id);
	  				break;
	  			case 'wms': 
	  				createMap(id);
	  				loadWms(data, extent, id);
	  				break;
	  			case 'wfs': 
	  				createMap(id);
	  				loadWfs(data, extent, id);
	  				break;
	  			case 'wmts': 
	  				createMap(id);
	  				loadWmts(data, extent, id);
	  				break;
	  			case 'blogmap': 
	  				loadBlogMap(data, id);
	  				break;
	  			default : 
	  				break;
	  		}   
        	
        };
        
        var mapResize = function () {
        	if (map && mapDataType !== 'blogmap') {
        		olMap.updateSize();
        	} else if (mapDataType === 'blogmap') {
        		$container.find('> div').css('padding', '0px');
        		/*
        		var height = $container.height();
        		if (height > 0) {
        			$container.find('.center-container, .right-container').height(height);
        		}
        		*/
        	}
        };
        
        var getData = function () {
        	return mapData;
        };
        
        var checkData = function () {
        	return !!map;
        };
        
        var exportData = function () {
        	if (!map) {
        		return false;
        	}
        	var data = {
        		type: 'map',
    			data: mapData,
    			dataType: mapDataType
        	};
        	if (mapDataType !== 'blogmap') {
        		var view = olMap.getView();
        		data.resolution = view.getResolution();
        		data.center = view.getCenter();
        	}
        	return data;
        };
        
        var importData = function (data) {
        	mapData = data.data;
        	mapDataType = data.dataType;
        	$container.empty();
        	loadMap(mapData, mapDataType, option.container_id, false, false);
        	
        	if (mapDataType !== 'blogmap') {
        		var view = olMap.getView();
            	view.setResolution(data.resolution);
            	view.setCenter(data.center);
        	}
        };
        
        return {
            resize: function () {
            	if(!map) {
            		return;
            	}
            	mapResize();
            },
            editMode: function (mode) {
            	if (mode) {
            		$container.find('div.overlay').remove();
            	} else {
            		$('<div class="overlay"></div>')
            			.appendTo($container);
            	}
            },
            addMap: function (_data, type, callback) {
            	mapDataType = type;
            	$container.empty();
            	/*
            	type = data.ins_type;
            	loadMap[data.ins_type] && loadMap[data.ins_type](data);
            	*/
            	
            	loadMap(_data, mapDataType, option.container_id, callback, true);
            },
            checkData: checkData,
            loadMap: loadMap,
            getData: getData,
            exportData: exportData,
            importData: importData
        };
    };

    window.gwp = window.gwp || { widget: {}};
    window.gwp.widget.mapWidget = mapWidget;

})();
(function (gwp) {
	'use strict';
	
    var editorModal = function (id) {
    	var $target = $('#' + id);
        var tpl = [
            '<div class="modal fade always" id="' + id + '_modal" tabindex="-1" role="dialog">',
            '   <div class="modal-dialog modal-lg" role="document">',
            '       <div class="modal-content">',
            '       <div class="modal-body" id="' + id + 'Editor">',
            '       </div>',
            '       <div class="modal-footer">',
            '           <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>',
            '           <button type="button" class="btn btn-primary">Save</button>',
            '       </div>',
            '       </div>',
            '   </div>',
            '</div>'
        ].join('');
        
        var $modal = $(tpl).appendTo($target.parents('.grid-stack').parent());

        return {
            $modal: $modal,
            show: function () {
                $modal.modal('show');
            },
            hide: function () {
                $modal.modal('hide');
            }
        }
    };

    var createEditor = function ($target) {
        $target.summernote({
            height: 300,                 // set editor height
            minHeight: null,             // set minimum height of editor
            maxHeight: null,             // set maximum height of editor
            focus: true,                  // set focus to editable area after initializing summe
            dialogsInBody: true,
            dialogsFade: true,
            lang: 'ko-KR'
        });
    };

    var textWidget = function (option) {
        var $container = $('#' + option.container_id);
        var modal = new editorModal(option.container_id);
        var $summernote = modal.$modal.find('.modal-body');
        createEditor($summernote);
        modal.$modal.find('.modal-footer .btn-primary').on('click', function () {
            var markUp = $('#' + option.container_id + 'Editor').summernote('code');
            $container.html(markUp);
            $(this).prev().trigger('click');
        });

        return {
            resize: function () {},
            editMode: function () {},
            edit: function () {
                $summernote
                    .empty()
                    .summernote('code', $container.html());
                modal.show();
            },
            save: function () {
                var markUp = $summernote.summernote('code');
                $container.html(markUp);
            },
            exportData: function () {
            	return {
            		type: 'text',
            		text: $container.html()
            	};
            },
            checkData: function () {
            	return true; // 텍스트는 빈 값이면 그냥 빈값으로 등록..
            },
            importData: function (data) {
            	$container.html(data.text);
            }
        };
    };

    window.gwp = window.gwp || { widget: {}};
    window.gwp.widget.textWidget = textWidget;

})();
(function (gwp) {
    var resize = function ($target) {
        $target.find('video')
            .css({
                width: $target.width(),
                height: $target.height()
            });
    };

    var createVideo = function ($target) {
        var $video = $('<video controls/>');
        $target
            .empty()
            .append($video);
        resize($target);
        return $video.get(0);
    };

    var videoWidget = function (option) {
        var $container = $('#' + option.container_id);
        var fileURL;
        return {
            resize: function () {
                resize($container);
            },
            editMode: function () {},
            addLocalFile: function (file) {
                var videoNode = createVideo($container);
                if (fileURL) {
                    window.URL.revokeObjectURL(fileURL);
                    fileURL = undefined;
                }
                if (videoNode.canPlayType(file.type) === '') {
                    $(videoNode).remove();
                    $container.append('<p>can not play..</p>');
                    return;
                }
                var fileURL = URL.createObjectURL(file)
                videoNode.src = fileURL;
            },
            addFile: function (url) {
                var videoNode = createVideo($container);
                if (fileURL) {
                    window.URL.revokeObjectURL(fileURL);
                }
                videoNode.src = url;
            }
        };
    };

    window.gwp = window.gwp || { widget: {}};
    window.gwp.widget.videoWidget = videoWidget;

})();
(function () {

    var popOver = {
        link: [ 
            '<div class="input-group">',
            '	<input type="text" style="width: 300px;" class="form-control" placeholder="http://">',
            '	<span class="input-group-btn">',
            '		<button class="btn btn-primary link-btn">',
            ' 			<i class="fa fa-check" aria-hidden="true"></i>&nbsp;',
            '		</button>',
            '	</span>',
            '</div>'
        ].join('')
    };

    var dropDown = {
        image: (function () {
        	var type = [{
    			action: 'fit', mode: 'width', icon: 'glyphicon glyphicon-resize-horizontal', name: '가로맞춤'
    		}, {
    			action: 'fit', mode: 'height', icon: 'glyphicon glyphicon-resize-vertical', name: '세로맞춤'
    		}, {
    			action: 'fit', mode: 'screen', icon: 'glyphicon glyphicon-fullscreen', name: '화면맞춤'
    		}, {
    			action: 'fit', mode: 'origin', text: '1:1', name: '원본크기'
    		}, {
    			action: 'zoom', mode: 'in', icon: 'glyphicon glyphicon-zoom-in', name: '확대'
    		}, {
    			action: 'zoom', mode: 'out', icon: 'glyphicon glyphicon-zoom-out', name: '축소'
    		}, {
    			action: 'rotate', mode: 'left', icon: 'fa fa-undo', name: '왼쪽 회전'
    		}, {
    			action: 'rotate', mode: 'right', icon: 'fa fa-repeat', name: '오른쪽 회전'
    		}];
        	
        	var liTag = _.map(type, function (item) {
        		var text;
        		if (item.icon) {
        			text = '<i class="' + item.icon + '"></i> &nbsp;&nbsp;' + item.name; 
        		} else {
        			text = '<small>' + item.text + '</small> &nbsp;' + item.name; 
        		}
        		return [
        			'<li data-action="' + item.action + '" data-mode="' + item.mode + '">',
                	'	<a href="#">' + text + '</a>',
                	'</li>'
                ].join('');
        	});    
        	return '<ul class="dropdown-menu">' + liTag.join('') + '</ul>';
        })(),
        chartType: (function () {
        	var type = [{
        			mode: 'line-basic', name: 'line(basic)'
        		}, {
        			mode: 'line-area', name: 'line(area)'
        		}, {
        			mode: 'bar-basic', name: 'bar(basic)'
        		}, {
        			mode: 'bar-stack', name: 'bar(stack)'
        		}, {
        			mode: 'pie-basic', name: 'pie(basic)'
        		}, {
        			mode: 'pie-doughnut', name: 'pie(doughnut)'
        		}, {
        			mode: 'pie-rose', name: 'pie(rose)'
        		}, {
        			mode: 'treemap-basic', name: 'treeMap'
        		}, {
        			mode: 'wordCloud-basic', name: 'Word cloud'
        		}];
        	var liTag = _.map(type, function (item) {
        		return [
        			'<li data-action="chartType" data-mode="' + item.mode + '">',
                	'	<a href="#">' + item.name + '</a>',
                	'</li>'
                ].join('');
        	});     
        	return '<ul class="dropdown-menu">' + liTag.join('') + '</ul>';
        })(),
        theme: (function () {
        	var liTag = _.map([
                		'default', 'macarons', 'infographic', 'shine', 'dark', 'blue', 'green', 
                		'red', 'gray', 'helianthus', 'roma', 'mint', 'macarons2', 'sakura'
                	], function (name) {
        		return '<li data-action="theme" data-mode="' + name + '"><a href="#">' + name + '</a></li>';
        	});
        	return '<ul class="dropdown-menu">' + liTag.join('') + '</ul>';
        })()
    };

    var topButtonCommon = [
        '<button class="btn btn-default btn-lg" data-action="enableEdit" >',
        '   <i class="icon-unlock" aria-hidden="true"></i>',
        '</button>',
        '<button class="btn btn-default btn-lg" data-action="disableEdit" style="display: none">',
        '   <i class="icon-lock" aria-hidden="true"></i>',
        '</button>',
        '<button class="btn btn-default btn-lg" data-action="removeItem" title="삭제">',
        '	<i class="icon-remove" aria-hidden="true"></i>',
        '</button>',
    ].join('');

    var topButton = {
    	empty: [
    		'<div class="grid-stack-item-menu">',
            topButtonCommon,
            '</div>'
    	].join(''),
        text: [
            '<div class="grid-stack-item-menu">',
            topButtonCommon,
            '   <button type="button" class="btn btn-default btn-lg" data-action="edit" title="수정">',
            '	     <i class="fa fa-pencil-square-o" aria-hidden="true"></i>',
            '   </button>',
            '</div>'
        ].join(''),
        image: [
            '<div class="grid-stack-item-menu">',
            topButtonCommon,
            '   <button class="btn btn-default btn-lg" data-action="addFile" title="파일찾기">',
            '       <i class="icon-folder-open" aria-hidden="true"></i>',
            '   </button>',
            '   <button class="btn btn-default btn-lg link-popover-btn" data-action="addLinkFile" title="링크">',
            '       <i class="icon-link" aria-hidden="true"></i>',
            '   </button>',
            '   <div class="btn-group">',
            '       <button type="button" class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown">',
            '	        <i class="glyphicon glyphicon-cog" aria-hidden="true"></i>',
            '       </button>',
            dropDown.image,
            '   </div>',
            '</div>'
        ].join(''),
        video: [
            '<div class="grid-stack-item-menu">',
            topButtonCommon,
            '   <button class="btn btn-default btn-lg" data-action="addFile">',
            '       <i class="icon-folder-open" aria-hidden="true"></i>',
            '   </button>',
            '   <button class="btn btn-default btn-lg link-popover-btn" data-action="addLinkFile">',
            '       <i class="icon-link" aria-hidden="true"></i>',
            '   </button>',
            '</div>'
        ].join(''),
        charts: [
        	'<div class="grid-stack-item-menu">',
            topButtonCommon,
            '   <div class="btn-group">',
            '   	<button type="button" class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown" title="차트타입">',
            '       	<i class="icon-chart" aria-hidden="true"></i>',
            '   	</button>',
            dropDown.chartType,
            '   </div>',
            '   <div class="btn-group">',
            '   	<button type="button" class="btn btn-default btn-lg dropdown-toggle" data-toggle="dropdown" title="테마">',
            '       	<i class="fa fa-paint-brush" aria-hidden="true"></i>',
            '   	</button>',
            dropDown.theme,
            '   </div>',
            '   <button class="btn btn-default btn-lg" data-action="swapAxis" title="축변경">',
            '       <i class="fa fa-exchange" aria-hidden="true"></i>',
            '   </button>',
            '   <button class="btn btn-default btn-lg" data-action="chartModal" title="엑셀열기">',
            '       <i class="icon-folder-open" aria-hidden="true"></i>',
            '   </button>',
            '</div>'
        ].join(''),
        map: [
        	'<div class="grid-stack-item-menu">',
            topButtonCommon,
            '   <button class="btn btn-default btn-lg" data-action="mapModal" title="맵찾기">',
            '       <i class="icon-folder-open" aria-hidden="true"></i>',
            '   </button>',
            '</div>'
        ].join(''),
        link: [
            '<div class="grid-stack-item-menu">',
            topButtonCommon,
            '   <button class="btn btn-default btn-lg link-popover-btn" data-action="addLinkFile">',
            '       <i class="icon-link" aria-hidden="true"></i>',
            '   </button>',
            '</div>'
        ].join('')
    };
   
    window.gwp = window.gwp || { widget: {}};
    window.gwp.widget.buttons = {
        popOver: popOver,
        dropDown: dropDown,
        topButton: topButton
    };
})();