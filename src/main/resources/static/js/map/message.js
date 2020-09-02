/**
 * 
 */
(function ($) {
	if (!window.naji) {
		window.naji = {};
	}
	
	var _naji = window.naji || {};
	
	var bigbox = function (option) {
		$.bigBox(option, function () {
			option.callback && option.callback(); 
		});
	};
	
	_naji.notification = (function () {
		function success (option) {
			bigbox($.extend({}, option, {
				color: '#739E73',
				icon: 'fa fa-check',
				timeout : option.timeout || 4000
			}));
		};
		
		function error (option) {
			bigbox($.extend({}, option, {
				color : '#C46A69',
				icon : 'fa fa-warning',
				timeout : option.timeout || 4000
			}));
		};
		
		return {
			error: error,
			success: success
		}
	})();
	
})(jQuery);