/*jshint forin:true, noarg:true, noempty:true, eqeqeq:false, bitwise:true, strict:true, undef:true, curly:true, browser:true, indent:4, maxerr:50, onevar:false, nomen:false, regexp:false, plusplus:false, newcap:true */
(function ($) {
	"use strict";
	$.fn.ajaxChosen = function (ajaxOptions, options, chosenOptions) {
		var select = $(this),
				chosen,
				throttle = false,
				keyRight,
				input,
				inputBG,
				callback,
				loadingImg = '/img/loading.gif';

		if ($('option', select).length === 0) {
			//adding empty option so you don't have to, and chosen can perform search correctly
			select.append('<option value=""></option>');
		}
		if (chosenOptions) {
			select.chosen(chosenOptions);
		} else {
			select.chosen();
		}
		chosen = select.next();
		input = $('input', chosen);
		inputBG = input.css('background');
		//copy out success callback
		if ('success' in ajaxOptions && $.isFunction(ajaxOptions.success)) {
			callback = ajaxOptions.success;
		}
		//replace with our success callback
		ajaxOptions.success = function (data, textStatus, jqXHR) {
			var items = data,
					selected;
			//if additional processing needs to occur on the returned json
			if ('processItems' in options && $.isFunction(options.processItems)) {
				items = options.processItems(data);
			} else if ('results' in items) {
				//default behavior if process items isn't defined
				//expects there to be a results key in data returned that has the results of the search
				items = items.results;
			} else {
				console.log('Expected results key in data, but was not found. Options could not be built');
				return false;
			}
			//.chzn-choices is only present with multi-selects
			selected = $('option:selected', select).not(':empty').clone().attr('selected', true);
			$('option', select).remove();

			$('<option value=""/>').appendTo(select);
			if (chosen.hasClass('chzn-container-multi')) {
				selected.appendTo(select);
			}
			if ($.isArray(items)) {
				//array of kv pairs [{id:'', text:''}...]
				$.each(items, function (i, opt) {
					$('<option value="' + opt.id + '">' + opt.text + '</option>').appendTo(select);
				});
			} else {
				//hash of kv pairs {'id':'text'...}
				$.each(items, function (value, text) {
					$('<option value="' + value + '">' + text + '</option>').appendTo(select);
				});
			}
			//update chosen
			select.trigger("liszt:updated");
			//right key, for highlight options after ajax is performed
			keyRight = $.Event('keyup');
			keyRight.which = 39;
			//highlight
			input.val(data.q).trigger(keyRight).css({background: inputBG});
			$('> a span', chosen).text(select.attr('placeholder') || '');

			if (items.length > 0) {
				$('.no-results', chosen).hide();
			} else {
				$('.no-results', chosen).show();
			}

			//fire original success
			if (callback) {
				callback(data, textStatus, jqXHR);
			}
		};
		//set loading image
		if ('loadingImg' in options) {
			loadingImg = options.loadingImg;
		}

		$('.chzn-search > input, .chzn-choices .search-field input', chosen).bind('keyup', function (e) {
			var field = $(this),
					q = $.trim(field.val());

			//don't fire ajax if...
			if (
				(e.which ===  9)  ||//Tab
				(e.which === 13)  ||//Enter
				(e.which === 16)  ||//Shift
				(e.which === 17)  ||//Ctrl
				(e.which === 18)  ||//Alt
				(e.which === 19)  ||//Pause, Break
				(e.which === 20)  ||//CapsLock
				(e.which === 27)  ||//Esc
				(e.which === 33)  ||//Page Up
				(e.which === 34)  ||//Page Down
				(e.which === 35)  ||//End
				(e.which === 36)  ||//Home
				(e.which === 37)  ||//Left arrow
				(e.which === 38)  ||//Up arrow
				(e.which === 39)  ||//Right arrow
				(e.which === 40)  ||//Down arrow
				(e.which === 44)  ||//PrntScrn
				(e.which === 45)  ||//Insert
				(e.which === 144) ||//NumLock
				(e.which === 145) ||//ScrollLock
				(e.which === 91)  ||//WIN Key (Start)
				(e.which === 93)  ||//WIN Menu
				(e.which === 224) ||//command key
				(e.which >= 112 && e.which <= 123)//F1 to F12
			) { return false; }
			//backout of ajax dynamically
			if ('useAjax' in options && $.isFunction(options.useAjax)) {
				if (!options.useAjax(e)) { return false; }
			}
			//backout if nothing is in input box
			if (q.length === 0) {
				return false;
			}

			//hide no results
			$('.no-results', chosen).hide();
			//add query to data
			if ($.isArray(ajaxOptions.data)) {
				//array
				if (ajaxOptions.data[ajaxOptions.data.length - 1].name === 'q') {
					ajaxOptions.data.pop();
				}
				ajaxOptions.data = ajaxOptions.data.concat({ name: 'q', value: q});
			} else {
				//hash
				if (!('data' in ajaxOptions)) {
					ajaxOptions.data = {};
				}
				$.extend(ajaxOptions.data, { data: {q: q} });
			}
			//dynamically generate url
			if ('generateUrl' in options && $.isFunction(options.generateUrl)) {
				ajaxOptions.url = options.generateUrl(q);
			}

			//show loading
			input.css({background: 'transparent url("' + loadingImg + '") no-repeat right 3px'});
			//throttle that bitch, so we don't kill the server
			if (throttle) { clearTimeout(throttle); }
			throttle = setTimeout(function () {
				$.ajax(ajaxOptions);
			}, 700);
		});

		return select;
	};
})(jQuery);