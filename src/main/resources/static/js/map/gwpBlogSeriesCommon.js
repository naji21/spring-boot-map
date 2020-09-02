/**
 * 
 */
(function (global) {
	
	var blogConfigTemplate = function (item) {
		return [
			'<div>',
			'	<table class="table table-bordered">',
			'		<tr>',
			'			<td style="width: 70%;">',
			'				<i class="fa fa-arrows-v" aria-hidden="true"></i> ' + item.title,	
			'			</td>',
			'			<td class="text-center">',
			'				<a href="#" data-action="edit" class="btn-default btn btn-sm">',
			'					<i class="glyphicon glyphicon-info-sign"></i>',
			'				</a>',
			'			</td>',
			'			<td class="text-center">',
			'				<a href="#" data-action="remove" class="btn-default btn btn-sm">',
			'					<i class="glyphicon glyphicon-trash"></i>',
			'				</a>',
			'			</td>',
			'		</tr>',
			'	</table>',
			'</div>'
		].join('');
	};
	
	
	
	global.gwp = global.gwp || {}; 
	
	global.gwp.blogCommonObj = function (option) {
		var onEvent = false;
		var pageCntPerPage = 4;
		var pageListPerPage = 10;
		
		var selectedPageNo = 1;
		var selectedPageListNo = 1;
		var selectedMap = '';
		var openContentstype = '';
		var modalType = 'addModal';
		var addFileType = 'map';
		
		var commonEvent = function () {
			$('#blogCommonAddForm ul.pagination').on('click', 'a', function (e) {
				e.preventDefault();
				var $this = $(this);
				var $parent = $this.parent();
				if ($parent.hasClass('active') || $parent.hasClass('disabled')) {
					return false;
				}
				
				if ($parent.hasClass('number')) {
					selectedPageNo = parseInt($this.data('page')); 
					getWebMapList(selectedPageNo);
				} else {
					if ($this.data('action') === 'prev') {
						selectedPageListNo--;
						getWebMapList((selectedPageListNo * pageListPerPage) + pageListPerPage);
					} else {
						selectedPageListNo++;
						getWebMapList((selectedPageListNo * pageListPerPage) + 1);
					}
				}
			});
			
			$('#blogCommonAddForm .map-type').on('click', '.map-list', function () {
				$('#blogCommonAddForm .map-type .map-list.select').removeClass('select');
				$(this).addClass('select');
			});
			
			$('#blogCommonAddForm .scroll-template').on('click', '.map', function () {
				$('#blogCommonAddForm .scroll-template .map.select').removeClass('select');
				$(this).addClass('select');
			});
			
			$('#blogCommonAddForm .text-template').on('click', '.map', function () {
				$('#blogCommonAddForm .text-template .map.select').removeClass('select');
				$(this).addClass('select');
			});
			
			$('#contentsSummernote').summernote({
			//	height: 150,
				placeholder: '내용을 입력하세요.',
				minHeight: 150,
				maxHeight: null
			});
			
			$('#blogCommonAddForm input[name="attachType"]')
				.on('change', function () {
					addFileType = $('#blogCommonAddForm input[type="radio"]:checked').val();
					changeModalPage();
				});
			
			$('#blogCommonFormSubmit-btn').on('click', function () {
				var d = new Date().getTime();
				var key = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					var r = (d + Math.random() * 16) % 16 | 0;
					d = Math.floor(d / 16);
					return (c=='x' ? r : (r&0x7|0x8)).toString(16);
				});
				var $form = $('#blogCommonAddForm');
				var result = {
					title: $form.find('input[name="contentTitle"]').val(),
					content: $('#contentsSummernote').summernote('code'),
					key: key,
					type: addFileType,
					map: false,
					mapType: false, 
					templateType: $form.find('.scroll-template .map.select').data('type')
				};
				
				if (addFileType === 'map') {
					var mapData = $form.find('.map-type .map-list.select').data('item'); 
					if (mapData) {
						result.map = mapData.contents_id;
						result.mapType = mapData.type;
					}
				} else if (addFileType === 'image') {
					var files = $('#blogCommonAddfile').get(0).files;
					var size = $form.find('.image-type .map-list.select').data('size'); 
					
					if (files.length > 0) {
						var name = files[0].name;  
						var extIdx = name.lastIndexOf('.');
						result.image = {
							file: files[0],
							name: name,
							newName: key + name.substring(extIdx),  
							size: size
						};
					}
				} else {
					result.templateType = $('#blogCommonAddForm .text-template .map.select').data('type');
				}
				if (modalType === 'addModal') {
					addModal.submit(result);
				} else {
					editModal.submit(result);
				}
			});
			
			onEvent = true;
		};
		
		var changeModalPage = function () {
			var $form = $('#blogCommonAddForm');
			
			if (addFileType === 'map') {
				$form.find('.map-type').show();
				$form.find('.text-template').hide();
			} else {
				$form.find('.map-type').hide();
				$form.find('.text-template').show().find('> p').hide();
			}
			
			if (openContentstype === 'scroll') {
				if (addFileType === 'map') {
					$form.find('.scroll-template').show().next().hide();
				} else {
					$form.find('.scroll-template').hide().next().show().find('> p').show();
				}
			}
		};
		
		var webMapList = function (data) {
			return $.ajax({
				url: option.webMapListUrl,
				type: 'get',
				contentType: 'application/json',
				dataType: 'json',
				data: data
			});
		};
		
		var getWebMapList = function (pageNo) {
			var deferred = $.Deferred(); 
			var start = (pageNo - 1) * pageCntPerPage;
			webMapList({
				start: start,
				length: pageCntPerPage,
				draw: pageNo,
				search : {value: ''}
			}).done(function (result) {
				if (result.success) {
					webMapPaging.drawList(result);
					deferred.resolve();
				} else {
					deferred.reject();
				}
			});
			return deferred.promise();
		};
		
		var getItemThumbType = function (type) {
			var returnTag = '<div class="blogIcon"><i class="icon-content-' + type.toLowerCase() + '"></i></div>';
			
			switch (type.toLowerCase()) {
				case 'map' :
					returnTag += '<p class="blogIcon-text">WEB MAP</p>';
					break;
				case 'dash' :
					returnTag += '<p class="blogIcon-text">DASH BOARD</p>';
					break;
				case 'tab' :
					returnTag += '<p class="blogIcon-text">BLOG TAB</p>';
					break;
				case 'page' :
					returnTag += '<p class="blogIcon-text">BLOG PAGE</p>';
					break;
				case 'scroll' :
					returnTag += '<p class="blogIcon-text">BLOG SCROLL</p>';
					break;
				case 'sync' :
					returnTag += '<p class="blogIcon-text">SYNC MAP</p>';
					break;
				case 'tour' :
					returnTag += '<p class="blogIcon-text">TOUR MAP</p>';
					break;
				case 'gallery' :
					returnTag += '<p class="blogIcon-text">GALLERY</p>';
					break;
			}
			return '<div class="blogIcon-wrap">' + returnTag + '</div>';
		};
		
		var webMapPaging = {
			mapTemplate: function (data, idx) {
				var $tag = $([
					'<div class="map-list">',
					'	<div class="content-auth"></div>',
					'	<div class="map"></div>',
					'	<p>' + data.title + '</p>',
					'</div>'
				].join(''));
				
				if (selectedMap !== '' && selectedMap === data.contents_id) {
					$tag.addClass('select');
				} else if (selectedMap === '' && idx === 0) {
					$tag.addClass('select');
				}
				var content = '';
				if (!data.snapshot || data.snapshot === '') {
				//	data.snapshot = 'resources/images/contents/basic_blog.jpg';
					content = getItemThumbType(data.type);
					backgroundImage = 'linear-gradient(90deg, #8e44cf 0%, #605ad8 100%)';
				} else {
					backgroundImage = 'url(' + data.snapshot + ')';
				}
				
				if (data.auth === 'public') {
					var $auth = $('<span class="label label-success">' + data.auth + '</span>');
					$tag.find('.content-auth').append($auth);
				}
				
				return $tag
					.find('.map')
					.css({
						'background-image': backgroundImage
					})
					.append(content)
					.end()
					.data('item', data);
			},
			emptyTemplate: function () {
				return [
					'<div style="position: absolute; top: 0; left:0; text-align: center; width: 100%;">등록 된 지도가 없습니다.</div>'
				].join('');
			},
			drawList: function (result) {
				var $list = $('#blogCommonAddForm .map-type .addFormMapList');
				if (result.recordsFiltered === 0) {
					$list.append(webMapPaging.emptyTemplate());
					$('#blogCommonAddForm .map-pagination').remove();
				} else {
					var divs = $list.find('div.col-md-3').empty();
					_.map(result.data, function (item, idx) {
						$(divs[idx]).append(webMapPaging.mapTemplate(item, idx));
					});
					
					webMapPaging.drawPageNo(result.draw, result.recordsFiltered);
				}				
			},
			drawPageNo: function (pageNo, totalCnt) {
				var totalPageListCnt = Math.ceil(totalCnt / (pageListPerPage * pageCntPerPage));
				var totalPageCnt = Math.ceil(totalCnt / pageCntPerPage);
				selectedPageListNo = Math.ceil(pageNo / pageListPerPage);
				var start = (selectedPageListNo - 1) * pageListPerPage + 1;
				var end = Math.min((start + pageListPerPage), totalPageCnt + 1);

				var $lis = [];
				for (var i=start; i<end; i++) {
					var active = (i === pageNo) ? 'active' : '';
					$lis.push([
						'<li class="number ' + active + '">',
						'	<a href="#" data-page="' + i + '">' + i + '</a>',
						'</li>'
					].join(''));
				}
				var $pageWrap = $('#blogCommonAddForm .map-pagination');
				$pageWrap.find('li.number').remove();
				$pageWrap.find('li:last').before($lis);
				
				
				if (selectedPageListNo === 1) {
					$pageWrap.find('li:first').addClass('disabled');
				} else {
					$pageWrap.find('li:first').removeClass('disabled');
				}
				
				if (selectedPageListNo === totalPageListCnt) {
					$pageWrap.find('li:last').addClass('disabled');
				} else {
					$pageWrap.find('li:last').removeClass('disabled');
				}
			}
		};
		
		var init = function () {
			if (!onEvent) {
				commonEvent();
			}
		};
		
		var addModal = (function () {
			var addModalCallback;
			
			var initForm = function () {
				addFileType = 'map';
				var $form = $('#blogCommonAddForm');
				$form.find('input[name="contentTitle"]').val('');
				$form.find('input[value="map"]').prop('checked', 'checked');
				$('#contentsSummernote').summernote('code', '');
				if (openContentstype === 'scroll') {
					$form.find('.scroll-template > div.select, .text-template > div.select')
						.removeClass('select');
					$form.find('.scroll-template > div:first, .text-template > div:first')
						.addClass('select');
				} else {
					$form.find('.scroll-template').hide();
				}
			};
			
			var eventOn = function (_callback) {
				addModalCallback = _callback;
			};
			
			var submit = function (result) {
				addModalCallback.call(this, result);
			};
			
			var open = function (_openContentstype, isEdit) {
				openContentstype = _openContentstype;
				if (!isEdit) {
					selectedMap = '';
					modalType = 'addModal';
					initForm();
					changeModalPage();
				}
				selectedPageNo = 1;
				
				$('#seriesAddFormModal').modal('show');
				return getWebMapList(selectedPageNo);
			};
			
			var close = function () {
				$('#seriesAddFormModal').find('.modal-footer .btn-default').trigger('click');
			};
			
			return {
				open: open,
				close: close,
				eventOn: eventOn,
				submit: submit
			};
		})();
		
		var editModal = (function () {
			var callback;
			var key = '';
			var open = function (data, _openContentstype) {
				var deferred = $.Deferred(); 
				addFileType = data.type;
				selectedMap = '';
				key = data.key;
				if (addFileType === 'map') {
					selectedMap = data.map;
				}
				
				$('#blogCommonAddForm .map-type .map-list.select').removeClass('select');
				addModal.open(_openContentstype, true)
					.done(function () {
						modalType = 'editModal';
						var $form = $('#blogCommonAddForm');
						$form.find('input[name="contentTitle"]').val(data.title);
						$('#contentsSummernote').summernote('code', data.content);
						
						$form.find('input[value="' + data.type + '"]')
							.prop('checked', 'checked');
						changeModalPage();
						$form.find('div.map.' + data.templateType)
							.addClass('select')
							.siblings()
							.removeClass('select');
						deferred.resolve();
					})
					.fail(deferred.reject);
				 
				 return deferred.promise();
			};
			
			var eventOn = function (_callback) {
				callback = _callback;
			};
			
			var submit = function (result) {
				result.key = key;
				callback.call(this, result);
			};
			
			var close = function () {
				$('#seriesAddFormModal').find('.modal-footer .btn-default').trigger('click');
			};
			
			return {
				open: open,
				close: addModal.close,
				eventOn: eventOn,
				submit: submit
			};
		})();
		
		var configModal = (function () {
			var open = function () {
				var deferred = $.Deferred(); 
				$('#remoteLargeModal .modal-content')
					.empty()
					.load('contents/common/blogConfig', function () {
						$('#remoteLargeModal').modal('show');
						deferred.resolve();
					});
				return deferred.promise();
			};
			
			var setData = function (data) {
				var $tags = _.map(data, function (item, idx) {
					return $(blogConfigTemplate(item))
						.data('item', item)
						.data('idx', idx);
				});
				$('#blogConfig-tablelist')
					.append($tags)
					.sortable({
						containment: 'parent',
						axis: 'y'
					});
			};
			
			var eventOn = function (callback) {
				var $form = $('#blogCommonAddForm');
				
				$('#blogConfig-tablelist').on('click', 'a', function (e) {
					e.preventDefault();
					var $this = $(this);
					var action = $this.data('action');
					var $parent = $this.parents('div');
					$('#remoteLargeModal').modal('hide');
					callback[action]($parent.data('idx'), $parent.data('item'));
				});
				
				$('#blogConfig-tablelist')
					.on('sortupdate', function(event, ui) {
						var contents = _.map($(this).find('div'), function (item) {
							return $(item).data('item');
						});
						callback.sort(contents);
					});
			};
			
			var deleteRow = function (targetIdx, contents) {
				$('#blogConfig-tablelist div:eq(' + targetIdx + ')').remove();
				_.remove(contents, function (item, idx) {
					return targetIdx === idx;
				});
				return contents;
			};
			
			return {
				open: open,
				setData: setData,
				eventOn: eventOn,
				deleteRow: deleteRow
			};
		})();
		
		
		var scrollTemplate = (function () {
				
			var template = {
				'type1': [
					'<div class="blogScroll-content type1">',
					'	<p class="title"></p>',
					'	<div class="mapWrap"></div>',
					'	<div class="content" style="padding: 5px;"></div>',
					'</div>'
				],
				'type2': [
					'<div class="blogScroll-content type2">',
					'	<p class="title"></p>',
					'	<div class="content" style="padding: 5px;"></div>',
					'	<div class="mapWrap"></div>',	
					'</div>'
				],
				'type3': [
					'<div class="blogScroll-content type3">',
					'	<div class="mapWrap"></div>',
					'	<p class="title"></p>',
					'	<div class="content" style="padding: 5px;"></div>',	
					'</div>'
				],
				'type4': [
					'<div class="blogScroll-content type4">',
					'	<div>',
					'		<div style="width: 350px; padding: 5px 10px;">',
					'			<p class="title"></p>',	
					'			<div class="content" style="padding: 5px;"></div>',	
					'		</div>',	
					'		<div class="mapWrap"></div>',	
					'	</div>',	
					'</div>'
				],
				'type5': [
					'<div class="blogScroll-content type5">',
					'	<div>',
					'		<div class="mapWrap"></div>	',
					'		<div style="width: 350px; padding: 5px 10px;">',	
					'			<p class="title"></p>',	
					'			<div class="content" style="padding: 5px;"></div>',	
					'		</div>',	
					'	</div>',	
					'</div>'
				],
				'text-type1': [
					'<div class="blogScroll-content text-type1">',
					'	<p class="title"></p>',
					'	<div class="content mapWrap" style="padding: 5px;"></div>',
					'</div>'
				],
				'text-type2': [
					'<div class="blogScroll-content text-type2">',
					'	<div>',
					'		<div style="width: 350px; padding: 5px 10px;">',
					'			<p class="title"></p>',
					'		</div>',
					'		<div class="mapWrap content"></div>',
					'	</div>',
					'</div>'
				],
				'text-type3': [
					'<div class="blogScroll-content text-type3">',
					'	<div>',
					'		<div class="mapWrap content"></div>',
					'		<div style="width: 350px; padding: 5px 10px;">',
					'			<p class="title"></p>',
					'		</div>',
					'	</div>',
					'</div>'
				]
			};
			
			return {
				get: function (type) {
					return $(template[type].join(''));
				}
			};
		})();
		
		return {
			addModal: addModal,
			configModal: configModal,
			editModal: editModal,
			init: init,
			getScrollTemplate: scrollTemplate.get,
			onEvent: function () {
				return onEvent;
			}
		};
		
	};
	
})(window);