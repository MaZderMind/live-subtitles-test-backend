$(function() {
	'use strict';
	var socket = io(window.location.protocol+'//'+window.location.host);

	$.fn.autoScale = function() {
		if(!this.data('autoScaleOriginal')) {
			this.data('autoScaleOriginal', parseInt(this.css('font-size')));
		}

		var maxSize = this.data('autoScaleOriginal');
		var maxH = this.parent().innerHeight();
		var thisH = this.css('font-size', maxSize).outerHeight();

		while(thisH > maxH && maxSize > 0) {
			thisH = this.css('font-size', --maxSize).outerHeight();
		}

		return this;
	};

	// join & rejoin
	socket.on('connect', function() {
		socket.emit('join', 'Saal 1');
	});

	// display a line
	socket.on('line', function(stamp, line, duration) {
		pushLine(stamp, line, duration);
	});


	// presentation specific
	var hideTimeout;
	function pushLine(stamp, line, duration) {
		$('h1').animate({opacity: 0}, 200, function() {
			var $el = $(this);
			$el
				.text(line)
				.autoScale()
				.animate({opacity: 1}, 200);

			if(hideTimeout) {
				clearTimeout(hideTimeout);
			}
			hideTimeout = setTimeout(function() {
				$el.animate({opacity: 0}, 200);
				clearTimeout(hideTimeout);
				hideTimeout = null;
			}, duration*1000);

		});
	}
});
/* vim: ts=4:sw=4:noet
 */
