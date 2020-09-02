/**
 * 
 */
(function () {
	var njUtil = {};
		
	var mapUtil = function () {
		function xmlToString (xml) {
			return (
				xml.replace(/\&/g,'&amp;')
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;')
			);
		}
		
		function fileFormatBytes (bytes,decimals) {
		   if(bytes == 0) return '0 Bytes';
		   var k = 1024,
		       dm = decimals + 1 || 3,
		       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
		       i = Math.floor(Math.log(bytes) / Math.log(k));
		   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
		}
		
		function getExt (file) {
			var fileArr = file.name.split('.');
			return '.' + fileArr[fileArr.length - 1].toLowerCase();
		}
		
		function getBoxAttr (result, param) {
			var box = $(result)
				.find('Layer > Layer > Name:contains("' + param.title + '")')
				.filter(function () {
					return $(this).text() === param.title;
				}) 
				.siblings('BoundingBox');
			
			var boundingBox = {
				crs: '',
				pos: []
			};
	
			var posName = ['maxx', 'maxy', 'minx', 'miny'];
			$.each(box.get(0).attributes, function (i, j) {
				if (j.name === 'CRS') { 
					boundingBox.crs = j.value !== 'unknown' ? j.value : param.defaultCrs;
				} else if (posName.indexOf(j.name) > -1) {
					boundingBox.pos[posName.indexOf(j.name)] = j.value;
				}
			});
			//00008 - 'EPSG:4162'
			
			return boundingBox; 
		}
		
		function readBoundingBox (param) {
			var deferred = $.Deferred();
			 $.ajax({
				url: param.url,
				method: 'post',
				data: param.data,
				dataType: 'xml'
			})
			.done(function (result) {
				var boundingBox = getBoxAttr(result, param);
				deferred.resolve(boundingBox);
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				deferred.reject(jqXHR, textStatus, errorThrown);
			});
			
			return deferred.promise();
		}
		
		function generateUUID() {
		    var d = new Date().getTime();
		    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		        var r = (d + Math.random()*16)%16 | 0;
		        d = Math.floor(d/16);
		        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		    });
		    return uuid;
		}
		
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
		
		return {
			xmlToString: xmlToString,
			file: {
				formatBytes: fileFormatBytes,
				getExt: getExt
			},
			map: {
				readBoundingBox: readBoundingBox
			},
			uuid: {
				generateUUID : generateUUID
			},
			getItemThumbType: getItemThumbType
		};
	
	}
	
	njUtil.mapUtil = new mapUtil();
})(jQuery);