/**
 * 
 */
var gwp = {};
(function () {
	
	var currUrl = '';
	var prevUrl = '';
	var subUrl = '';
	var isIntro = true;
	
	var changeTopMenu = function () {
		var $body = $('body');
		var $menuWrap = $('.menu-wrap > div');
		var $footer = $('.footer');
	
		if (isIntro) {
			$menuWrap
				.removeClass('container-fluid common')
				.addClass('container intro')
				.parent();
			$body
				.addClass('intro')
				.removeClass('mapStudio');
			$footer.show();
		} else if(!$menuWrap.hasClass('container-fluid')) {
			$menuWrap
				.removeClass('container intro')
				.addClass('container-fluid common')
				.parent()
				.removeClass('fixed-top');
			$body
				.removeClass('intro')
				.addClass('mapStudio');
			$footer.hide();
		}
	};
	
	var selectViewMenu = function (url) {
		$('.menu-wrap .gwp-btn.select').removeClass('select');
		$('.menu-wrap .sub-menu').hide();
		if (url !== '') {
			var currUrlArr = url.split('/');
			$('.menu-wrap .gwp-btn.' + currUrlArr[0])
				.addClass('select')
				.next()
				.show()
				.find('a[href="#' + url + '"]')
				.addClass('select');
		}
	};
	
	var loadBeforeCheck = function (url, isSubPage) {
		var gwpTimer = window.gwpCommonTimer || '';
		// page이동 시 gss/gwp log view에서 사용 된 타이머 해제..
		if (gwpTimer && gwpTimer !== '') { 
			clearTimeout(gwpTimer);
			gwpTimer = '';
		}
		
		
		if (isSubPage) {
			subUrl = url;
			prevUrl = currUrl;
		} else {
			currUrl = url;
		}
		
		if(window.isMobile) {
			$('.menu-wrap').hide();
		}
		
		if (!isIntro && session_user_id === '') {
			document.location.href = contextPath;
			return false;
		}
	};
	
	var loadPage = function (url, isSubPage, callback) {
		var $mainContent = $('#mapStudio-main-content');
		var $subContent = $('#mapStudio-sub-content').empty();
		$('div.ui-helper-hidden-accessible').remove();
		$('[data-toggle="popover"]').popover('hide');
		
		isIntro = url.indexOf('intro') > -1;
		loadBeforeCheck(url, isSubPage);	
		if (!isSubPage) {
			$(window).off('.blog');
			if (subUrl !== '') {
				$mainContent.fadeIn();
				$subContent.hide();
			}
			if (prevUrl !== currUrl) {
				$mainContent
					.empty()
					.load(url, function (response, status, xhr) {
						if(xhr.status === 401) {
							document.location.href = contextPath;
						}
						callback && callback.call(this);
					});
				selectViewMenu(currUrl.split('?')[0]);
			}
			prevUrl = '';
		} else {
			
			$mainContent.hide();
			$subContent.fadeIn();
			$subContent
				.load(url, function (response, status, xhr) {
					
					callback && callback.call(this);
				});
		}
		changeTopMenu();
	};
	
	var router = function () {
		var hash = location.hash.replace('#', '');
		var isSub = hash.split('/').length > 2;
		loadPage(hash, isSub);
	};
	
	var addHashChangeEvent = function () {
		window.addEventListener('hashchange', router, false);
	};
	
	var bindEvent = function () {
		addHashChangeEvent();
		
		$('.side-left-menu-btn, .side-right-menu-btn').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			var left = $(this).hasClass('side-left-menu-btn');
			var $target = left ? $('.menu-btn-wrap') : $('.user-info-btn-wrap');
			if($(this).hasClass('open')) {
				$('.menu-wrap').show();
				$target.effect('slide', {direction: left ? 'left' : 'right'});
			} else {
				$('.menu-wrap, .menu-btn-wrap, .user-info-btn-wrap').hide();
			}
		});
						
		$(window).resize(function () {
			window.isMobile = $('.side-left-menu-btn').css('display') === 'block';
			if (window.isMobile) {
				$('.menu-wrap .container > div').removeAttr('style');
			}
		}).resize();
		
		$('.menu-wrap').on('click', function () {
			if (window.isMobile) {
				$('.menu-wrap, .menu-btn-wrap, .user-info-btn-wrap').hide();
			}
		});
		
		$('body')
			.on('drop dragover', function (e) {
				e.preventDefault();
				e.stopPropagation();
			})
			.on('hidden.bs.modal', '.modal', function () {
				var $this = $(this);
				$this.removeData('bs.modal');
				if (!$this.hasClass('always') && !$this.parents('.note-editor')) {
					$this.find('.modal-content').empty();
				}
					
			});
		
		if (!isIntro) {
			$(window).off('.intro');
		}
		
		$('body').removeClass('init');
	};
		
	var setAjaxOption = function () {
		var token = $("meta[name='_csrf']").attr("content");
		var header = $("meta[name='_csrf_header']").attr("content");
		
		$(document)
			.ajaxSend(function(e, xhr) {
				xhr.setRequestHeader(header, token);
				xhr.setRequestHeader("X-gwp-ajax", "mapstudio");
			});
	};
	
	var initPageLoad = function (hash, isSub) {
		loadPage(hash, isSub, function () {
			bindEvent();
			if (isSub) {
				var parent = $('#mapStudio-sub-content > div').data('parent');
				if (parent) {
					selectViewMenu(parent);
				}
			}				
		});
	};
	
	$(document).ready(function () {
//		setAjaxOption();
		var hash = location.hash.replace('#', '');
		if (hash !== '') {
			var urlArr = hash.split('/');
			var isSub = urlArr.length > 2;
			
			if (isSub && urlArr[0] === 'contents') {
				loadPage('contents/list', false, function () {
					initPageLoad(hash, isSub);
				});
			} else {
				initPageLoad(hash, isSub);
			}			
		} else {
			initPageLoad('home/intro', false);
		}
	});
})();  

(function () {
	
	gwp.menu = {
		fullScreen: function () {
			var $body = $('body');
			var element = document.documentElement;
			if (!$body.hasClass("full-screen")) {
				
				$body.addClass("full-screen");
		
				if (element.requestFullscreen) {
					element.requestFullscreen();
				} else if (element.mozRequestFullScreen) {
					element.mozRequestFullScreen();
				} else if (element.webkitRequestFullscreen) {
					element.webkitRequestFullscreen();
				} else if (element.msRequestFullscreen) {
					element.msRequestFullscreen();
				}
		
			} else {
				
				$body.removeClass("full-screen");
				
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
		
			}
		}
	};
})();