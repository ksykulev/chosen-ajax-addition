describe('chosen.ajaxaddition', function(){
	var select = $('#test-select'),
			multiSelect = $('#test-multi-select'),
			space = $('#test-space'),
			emptySelect = $('#empty-select');

	beforeEach(function(){
		space.append(select.clone());
	});
	afterEach(function(){
		space.html('');
	});

	it("should initial chosen", function(){
		var mock = sinon.mock($.fn);
		mock.expects('chosen').once();
		$('select', space).ajaxChosen({},{});
		expect(mock.verify()).to.be.true;
	});
	it("should not add an extra empty option if one is present", function(){
		expect($('select option', space)).to.have.length(1);
		$('select', space).ajaxChosen({},{});
		expect($('select option', space)).to.have.length(1);
	});
	it("should proxy chosen options", function(){
		var mock = sinon.mock($.fn),
				args = {no_results_text: "No results matched"};
		mock.expects('chosen').once().withExactArgs(args);
		$('select', space).ajaxChosen({},{},args);
		expect(mock.verify()).to.be.true;
	});
	it("should not fire of ajax for non-essential keys", function(){
		var keyCodes = [9,13,16,17,18,19,20,27,33,34,35,36,37,38,39,40,44,45,144,145,91,93,224,112,113,114,115,116,117,118,119,120,121,122,123],
				key,
				chosen,
				input,
				server = sinon.fakeServer.create(),
				clock = sinon.useFakeTimers();

		server.respondWith(
			'/search',
			[200, { 'Content-Type': 'application/json' }, '{ q: "", results: []}']
		);

		chosen = $('select', space).ajaxChosen({
			dataType: 'json',
			type: 'POST',
			url:'/search'
		},{}).next();
		chosen.trigger('click');
		input = $('input', chosen).val('word');

		for(var i=0, len=keyCodes.length; i < len; i++){
			key = $.Event('keyup');
			key.which = keyCodes[i];
			input.trigger(key);
		};
		clock.tick(750);

		server.restore();
		clock.restore();
		expect(server.requests).to.have.length(0);
	});
	describe('options', function(){
		beforeEach(function(){
			this.server = sinon.fakeServer.create();
			this.clock = sinon.useFakeTimers();
			this.response = { q: "banana", complex: { results: [{id:1, text:"Chiquita"},{id:2, text:"Dole"}] }};
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				JSON.stringify(this.response)]
			);
		});
		afterEach(function(){
			this.server.restore();
			this.clock.restore();
		});
		it('should initial chosen with empty options', function(){
			var mock = sinon.mock($.fn);
			mock.expects('chosen').once();
			$('select', space).ajaxChosen({});
			expect(mock.verify()).to.be.true;
		});
		it('should use loadingImg while processing', function(){
			var chosen,
					input,
					key;
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url:'/search'
			},{
				loadingImg: 'img/l04der.gif'
			}).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');

			expect(input.css('background-image')).to.match(/chosen-sprite\.png/i);
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			expect(input.css('background-image')).to.match(/l04der\.gif/i);
		});
		it('should apply the processItems function to response data', function(){
			var chosen,
					input,
					key,
					ajaxChosenOptions = {
						processItems: function(data){ return data.complex.results; }
					};
			sinon.spy(ajaxChosenOptions, "processItems");
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url:'/search'
			},ajaxChosenOptions).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();

			expect(ajaxChosenOptions.processItems.calledWithExactly(this.response)).to.be.true;
			expect($('select option', space)).to.have.length(3);
		});
		it('should use return value of useAjax to determine if ajax should be fired after keyups', function(){
			var chosen,
					input,
					key,
					ajaxChosenOptions = {
						useAjax: function(e){ return false; }
					};
			sinon.spy(ajaxChosenOptions, "useAjax");
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url:'/search'
			},ajaxChosenOptions).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);

			expect(ajaxChosenOptions.useAjax.calledWithExactly(key)).to.be.true;
			expect(this.server.requests).to.have.length(0);
		});
		it("should use generateUrl to create dynmic url", function(){
			var chosen,
					input,
					key,
					ajaxChosenOptions = {
						generateUrl: function(q){ return '/search'; }
					};
			sinon.spy(ajaxChosenOptions, "generateUrl");
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url:'/abc123'
			},ajaxChosenOptions).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);

			expect(ajaxChosenOptions.generateUrl.calledOnce).to.be.true;
			expect(ajaxChosenOptions.generateUrl.calledWithExactly('banan')).to.be.true;
			expect(this.server.requests).to.have.length(1);
		});
	});
	describe('ajaxOptions', function(){
		beforeEach(function(){
			this.server = sinon.fakeServer.create();
			this.clock = sinon.useFakeTimers();
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				'{ "q": "banana", "results": []}']
			);
		});
		afterEach(function(){
			this.server.restore();
			this.clock.restore();
		});
		it('should fire ajax options callback on completion', function(){
			var chosen,
					input,
					key,
					successFn = sinon.mock();
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search',
				success: successFn
			},{}).next();

			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();

			successFn.once().withArgs({ q: "", results: []});
			expect(successFn.verify()).to.be.true;
		});
		it('should handle and preserve ajax.data in hash format', function(){
			var chosen,
					input,
					key,
					aData,
					expectedData;
			sinon.spy(jQuery, "ajax");
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search',
				data: {'somekey':'somevalue'}
			},{}).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banana');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);

			expect(jQuery.ajax.calledOnce).to.be.true;
			aData = jQuery.ajax.getCall(0).args[0].data;
			expectedData = {'somekey':'somevalue', 'data' : { 'q': 'banana' }};
			expect(aData.somekey).to.equal(expectedData.somekey);
			expect(aData.data.q).to.equal(expectedData.data.q);
			jQuery.ajax.restore();
		});
		it('should handle and preserve ajax.data in array format', function(){
			var chosen,
					input,
					key,
					aData,
					expectedData;
			sinon.spy(jQuery, "ajax");
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search',
				data: [{'name':'keyboard', 'value':'cat'}]
			},{}).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banana');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);

			expect(jQuery.ajax.calledOnce).to.be.true;
			aData = jQuery.ajax.getCall(0).args[0].data;
			expectedData = [{'name':'keyboard', 'value':'cat'},{'name':'q', 'value':'banana'}]
			$.each(aData, function(i, v){
				expect(expectedData[i].name).to.equal(v.name);
				expect(expectedData[i].value).to.equal(v.value);
			})
			jQuery.ajax.restore();
		});
		//in array format it shouldn't re-add/duplicate the q - value pair in the array
	});
	describe('results element', function(){
		beforeEach(function(){
			this.server = sinon.fakeServer.create();
			this.clock = sinon.useFakeTimers();
		});
		afterEach(function(){
			this.server.restore();
			this.clock.restore();
		});
		it('should show no results if response has no items', function(){
			var chosen,
					input,
					key;
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				'{ "q": "banana", "results": []}']
			);
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();
			expect($('.no-results', chosen).is(':visible')).to.be.true;
		});
		it('should hide no results if response has at least 1 item', function(){
			var chosen,
					input,
					key;
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				'{ "q": "banana", "results": [{"id":1, "text":"Chiquita"}]}']
			);
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();
			expect($('.no-results', chosen).is(':visible')).to.be.false;
		});
		it('should display error if no processItems option is supplied and there is no results key in data returned', function(){
			var chosen,
					input,
					key;
			sinon.spy(console, "log");
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				'{ "q": "banana", "dataz": [{"id":1, "text":"Chiquita"}]}']
			);
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');
			input = $('input', chosen).val('banan');
			key = $.Event('keyup');
			key.which = 65;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();

			expect(console.log.calledOnce).to.be.true;
			console.log.restore();
		});
	});
	it('should not fire off ajax if trim(q) is of 0 length', function(){
		var chosen,
				input,
				key;
		this.server = sinon.fakeServer.create();
		this.clock = sinon.useFakeTimers();
		chosen = $('select', space).ajaxChosen({
			dataType: 'json',
			type: 'POST',
			url: '/search'
		},{}).next();

		chosen.trigger('click');
		input = $('input', chosen).val('');
		key = $.Event('keyup');
		key.which = 32;
		input.trigger(key);
		this.clock.tick(750);
		this.server.respond();

		expect(this.server.requests).to.have.length(0);

		this.server.restore();
		this.clock.restore();
	});
	it('should not trim the space at the end of a users input - it might be what they actually meant', function(){
		var chosen,
				input,
				key;

		this.server = sinon.fakeServer.create();
		this.clock = sinon.useFakeTimers();
		this.server.respondWith(
			'/search',
			[200, { 'Content-Type': 'application/json' },
			'{ "q": "Trailing Spaces are cool yo ", "results": [{"id":1, "text":"I hate trailing spaces"}]}']
		);
		chosen = $('select', space).ajaxChosen({
			dataType: 'json',
			type: 'POST',
			url: '/search'
		},{}).next();

		chosen.trigger('click');
		input = $('input', chosen).val('Trailing Spaces are cool yo ');
		key = $.Event('keyup');
		key.which = 32;
		input.trigger(key);
		this.clock.tick(750);
		this.server.respond();

		expect(this.server.requests[0].requestBody).to.equal("data%5Bq%5D=Trailing+Spaces+are+cool+yo+");
	});
	it("should reselect option on single select when chosen input is blurred", function(){
		var clock = sinon.useFakeTimers(),
				xhr = sinon.useFakeXMLHttpRequest(),
				chosen,
				input,
				key,
				requests = [];

		xhr.onCreate = function (xhr) { requests.push(xhr) };

		chosen = $('select', space).ajaxChosen({
			dataType: 'json',
			type: 'POST',
			url: '/search'
		},{}).next();
		chosen.trigger('click').width('135px');

		//first request
		input = $('input', chosen).val('monkey');
		key = $.Event('keyup');
		key.which = 32;
		input.trigger(key);
		clock.tick(750);

		//return response
		var selectedId = "1",
				selectedText = "first monkey";
		requests[0].respond(200, { "Content-Type": "application/json" }, '{ "q": "monkey", "results": [{"id":'+selectedId+', "text":"'+selectedText+'"}]}');
		//select the item that is returned
		$('.active-result', chosen).trigger('mouseup');
		expect($('select', space).val()).to.equal(selectedId);
		expect($('> a.chosen-single', chosen).text()).to.equal(selectedText);

		//go for the second request..
		chosen.trigger('click');
		input = $('input', chosen).val('banana');
		key = $.Event('keyup');
		key.which = 32;
		input.trigger(key);
		clock.tick(750);
		expect(input.val()).to.equal('banana');
		requests[1].respond(200, { "Content-Type": "application/json" }, '{ "q": "banana", "results": [{"id":2, "text":"banana tree"}]}');

		//hit the escape key to trigger input blur
		key = $.Event('keyup');
		key.which = 27; //esc key
		input.trigger(key);

		//ensure what was selected, stays selected
		expect($('select', space).val()).to.equal(selectedId);
		expect($('> a.chosen-single', chosen).text()).to.equal(selectedText);

		clock.restore();
		xhr.restore();
	});
	describe('duplication', function(){
		beforeEach(function(){
			this.server = sinon.fakeServer.create();
			this.clock = sinon.useFakeTimers();
		});
		afterEach(function(){
			this.server.restore();
			this.clock.restore();
		});
		describe('single select', function(){
			it('should not duplicate pre-selected result', function(){
				var chosen,
						input,
						key,
						selectedId;
				this.server.respondWith(
					'/search',
					[200, { 'Content-Type': 'application/json' },
					'{ "q": "monkeys", "results": [{"id":"bananas", "text":"monkeys eat"}]}']
				);
				selectedId = 'bananas';
				$('select', space).append('<option value="bananas">monkeys eat</option>').val(selectedId);
				chosen = $('select', space).ajaxChosen({
					dataType: 'json',
					type: 'POST',
					url: '/search'
				},{}).next();

				expect($('select option', space)).to.have.length(2);

				chosen.trigger('click');
				input = $('input', chosen).val('monkey');
				key = $.Event('keyup');
				key.which = 83;
				input.trigger(key);
				this.clock.tick(750);
				this.server.respond();

				expect($('select option', space)).to.have.length(2);//empty + pre-selected result (not duplicate)
				expect($('select option', space).eq(1).text()).to.equal('monkeys eat');
				//check option to make sure it has monkeys eat option

				//have the monkeys eat result once
				expect($('.chosen-results li', chosen)).to.have.length(1);
				expect($('.chosen-results li', chosen).text()).to.equal('monkeys eat');

				//pre-selected result should still be selected
				expect($('.chosen-results li.result-selected', chosen).text()).to.equal('monkeys eat');
				expect($('select', space).val()).to.equal(selectedId);
			});
		});
		describe('multi-select', function(){
			beforeEach(function(){
				space.html('');
				space.append(multiSelect.clone());
			});
			it('should not duplicate pre-selected single result', function(){
				var select,
						chosen,
						input,
						key,
						selectedIds;
				this.server.respondWith(
					'/search',
					[200, { 'Content-Type': 'application/json' },
					'{ "q": "toyota", "results": [{"id":"1", "text":"toyota tundra"},{"id":"2", "text":"toyota camery"}]}']
				);
				selectedIds = ['1'];
				select = $('select', space);
				select.append('<option value="1">toyota tundra</option><option value="2">toyota camery</option>').val(selectedIds);
				chosen = select.ajaxChosen({
					dataType: 'json',
					type: 'POST',
					url: '/search'
				},{}).next();

				expect($('option', select)).to.have.length(3);

				chosen.trigger('click');
				input = $('input', chosen).val('toyot');
				key = $.Event('keyup');
				key.which = 32;
				input.trigger(key);
				this.clock.tick(750);
				this.server.respond();

				expect($('option', select)).to.have.length(3);
				expect($('.chosen-results li', chosen)).to.have.length(2);

				expect($('option', select).eq(1).text()).to.equal('toyota tundra');
				expect($('option', select).eq(2).text()).to.equal('toyota camery');

				expect($('.chosen-results li', chosen).eq(0).text()).to.equal('toyota tundra');
				expect($('.chosen-results li', chosen).eq(1).text()).to.equal('toyota camery');

				expect($('.chosen-choices li.search-choice',chosen)).to.have.length(1);
				expect($('.chosen-choices li.search-choice',chosen).text()).to.equal('toyota tundra');
				//weird how chai doesn't make ['1'] === ['1']
				expect(select.val()[0]).to.have.equal(selectedIds[0]);
			});
			it('should not duplicate pre-selected results', function(){
				var select,
						chosen,
						input,
						key,
						selectedIds;
				this.server.respondWith(
					'/search',
					[200, { 'Content-Type': 'application/json' },
					'{ "q": "toyota", "results": [{"id":"1", "text":"toyota tundra"},{"id":"2", "text":"toyota camery"}]}']
				);
				selectedIds = ['1','2'];
				select = $('select', space);
				select.append('<option value="1">toyota tundra</option><option value="2">toyota camery</option>').val(selectedIds);
				chosen = select.ajaxChosen({
					dataType: 'json',
					type: 'POST',
					url: '/search'
				},{}).next();

				expect($('option', select)).to.have.length(3);

				chosen.trigger('click');
				input = $('input', chosen).val('toyot');
				key = $.Event('keyup');
				key.which = 32;
				input.trigger(key);
				this.clock.tick(750);
				this.server.respond();

				expect($('option', select)).to.have.length(3);
				expect($('.chosen-results li', chosen).not('.no-results')).to.have.length(2);

				expect($('option', select).eq(1).text()).to.equal('toyota tundra');
				expect($('option', select).eq(2).text()).to.equal('toyota camery');

				expect($('.chosen-results li', chosen).not('.no-results').eq(0).text()).to.equal('toyota tundra');
				expect($('.chosen-results li', chosen).not('.no-results').eq(1).text()).to.equal('toyota camery');

				expect($('.chosen-choices li.search-choice',chosen)).to.have.length(2);
				expect($('.chosen-choices li.search-choice',chosen).eq(0).text()).to.equal('toyota tundra');
				expect($('.chosen-choices li.search-choice',chosen).eq(1).text()).to.equal('toyota camery');

				//weird how chai doesn't make ['1','2'] === ['1','2']
				expect(select.val()[0]).to.have.equal(selectedIds[0]);
				expect(select.val()[1]).to.have.equal(selectedIds[1]);
			});
		});
	});
	describe('multi-select', function(){
		beforeEach(function(){
			space.html('');
			space.append(multiSelect.clone());
		});
		it('should bind the keyup event to the input', function(){
			var chosen,
					input;
			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');

			input = $('input', chosen).val('');
			expect($._data( input[0], "events" )['keyup']).to.have.length(2);
		});
		it('should keep the options previously selected', function(){
			var select,
					chosen,
					input,
					key;
			this.server = sinon.fakeServer.create();
			this.clock = sinon.useFakeTimers();
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				'{ "q": "Ala", "results": [{"id":1, "text":"Alabama"}]}']
			);
			select = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{});
			chosen = select.next();

			chosen.trigger('click');
			input = $('input', chosen).val('Al');
			key = $.Event('keyup');
			key.which = 97;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();

			expect($('option',select)).to.have.length(2);//empty + 1 result
			//not results in selected
			expect($('.chosen-choices li.search-choice',chosen)).to.have.length(0);
			//have the chiquita result
			expect($('.chosen-results li', chosen).not('.no-results')).to.have.length(1);
			expect($('.chosen-results li', chosen).not('.no-results').text()).to.equal('Alabama');
			//click on result to add to selected items
			$('.chosen-results li',chosen).not('.no-results').eq(0).addClass('active-result');
			$('.chosen-results li',chosen).not('.no-results').eq(0).trigger('mouseup');
			//verify that it has been added to the selected list
			expect($('option:selected',select)).to.have.length(1);
			expect($('option:selected',select).text()).to.equal('Alabama');
			expect($('.chosen-choices li.search-field',chosen)).to.have.length(1);
			expect($('.chosen-choices li.search-choice',chosen).text()).to.equal('Alabama');

			this.server.responses.length = 0;
			this.server.respondWith(
				'/search',
				[200, { 'Content-Type': 'application/json' },
				'{ "q": "ala", "results": [{"id":2, "text":"Alaska"}]}']
			);
			chosen.trigger('click');
			input = $('input', chosen).val('al');
			key = $.Event('keyup');
			key.which = 97;
			input.trigger(key);
			this.clock.tick(750);
			this.server.respond();

			//select box still has chiquita selected
			expect($('option:selected',select)).to.have.length(1);
			expect($('option:selected',select).text()).to.equal('Alabama');
			//have the original result
			expect($('.chosen-choices li.search-choice',chosen)).to.have.length(1);
			expect($('.chosen-choices li.search-choice',chosen).text()).to.equal('Alabama');
			//notice how we have two results and one is 'active-result' and the other is 'result-selected'
			expect($('.chosen-results li.result-selected', chosen)).to.have.length(1);
			expect($('.chosen-results li.result-selected', chosen).text()).to.equal('Alabama');
			expect($('.chosen-results li.active-result', chosen).not('.no-results')).to.have.length(1);
			expect($('.chosen-results li.active-result', chosen).not('.no-results').text()).to.equal('Alaska');
			//click on result to add to selected items
			$('.chosen-results li.active-result', chosen).not('.no-results').eq(0).addClass('active-result');
			$('.chosen-results li.active-result', chosen).not('.no-results').eq(0).trigger('mouseup');

			//verify selected results
			expect($('option:selected',select)).to.have.length(2);
			expect($('.chosen-choices li.search-choice',chosen)).to.have.length(2);
			var expectedResults = ['Alabama', 'Alaska'];
			$('.chosen-choices li.search-choice', chosen).each(function(i, elem){
				expect($(elem).text()).to.equal(expectedResults[i]);
			});
			$('option:selected',select).each(function(i, elem){
				expect($(elem).text()).to.equal(expectedResults[i]);
			});
		});
	});
	describe('empty-select', function(){
		beforeEach(function(){
			space.html('');
			space.append(emptySelect.clone());
		});
		it("should append an empty option if one is not present", function(){
			expect($('select option', space)).to.have.length(0);
			$('select', space).ajaxChosen({},{});
			expect($('select option', space)).to.have.length(1);
		});
		it("should not have the nosearch class", function(){
			var select, chosen;
			select = $('select', space).ajaxChosen({},{});
			chosen = select.next();
			expect(chosen.hasClass('chzn-container-single-nosearch')).to.be.false;
		});
	});
	describe('a request queue to ensure the user only sees the last response', function(){
		beforeEach(function(){
			this.clock = sinon.useFakeTimers();
			this.xhr = sinon.useFakeXMLHttpRequest();
			var requests = this.requests = [];
			this.xhr.onCreate = function (xhr) { requests.push(xhr) };
		});
		afterEach(function(){
			this.clock.restore();
			this.xhr.restore();
		});
		it('during typing', function(){
			var chosen,
					input,
					key;

			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');

			//first request
			input = $('input', chosen).val('monkey');
			key = $.Event('keyup');
			key.which = 32;
			input.trigger(key);
			this.clock.tick(750);
			//server begins processing request 1
			expect(input.val()).to.equal('monkey');
			expect(this.requests).to.have.length(1);

			//second request
			input.val('banana');
			key = $.Event('keyup');
			key.which = 32;
			input.trigger(key);
			this.clock.tick(350);//not enough time to start processing the request
			expect(input.val()).to.equal('banana');
			expect(this.requests).to.have.length(1);//see still one request

			//request 1 comes back while we're still typing! Dam the server is fast
			this.requests[0].respond(200, { "Content-Type": "application/json" }, '{ "q": "monkey", "results": [{"id":1, "text":"first monkey"}]}');

			//discard first response keep newly typed word and ajax chosen should still look like it's still processing
			expect(input.val()).to.equal('banana');
			expect(input.prop('style')['background']).to.match(/loading\.gif/i);
			//the rest of the clock ticks down so we should now fire off the second request
			this.clock.tick(400);
			expect(this.requests).to.have.length(2);
			expect(input.val()).to.equal('banana');
			//yup still waiting for the server to respond
			expect(input.prop('style')['background']).to.match(/loading\.gif/i);

			//response 2 comes back and banana is selected
			this.requests[1].respond(200, { "Content-Type": "application/json" }, '{ "q": "banana", "results": [{"id":1, "text":"banana bunch"}]}');
			expect(input.val()).to.equal('banana');
			expect(input.prop('style')['background']).to.not.match(/loading\.gif/i);
		});
		it('in order', function(){
			var chosen,
					input,
					key;

			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');

			//first request
			input = $('input', chosen).val('monkey');
			key = $.Event('keyup');
			key.which = 32;
			input.trigger(key);
			this.clock.tick(750);
			//server begins processing request 1
			expect(input.val()).to.equal('monkey');
			expect(this.requests).to.have.length(1);

			//second request
			input.val('banana');
			key = $.Event('keyup');
			key.which = 32;
			input.trigger(key);
			this.clock.tick(750);
			//server begins processing request 2
			expect(input.val()).to.equal('banana');
			expect(this.requests).to.have.length(2);

			//response 1 comes back
			this.requests[0].respond(200, { "Content-Type": "application/json" }, '{ "q": "monkey", "results": [{"id":1, "text":"first monkey"}]}');

			//discard first response keep newly typed word and ajax chosen should still look like it's still processing
			expect(input.val()).to.equal('banana');
			expect(input.prop('style')['background']).to.match(/loading\.gif/i);

			//response 2 comes back and banana is selected
			this.requests[1].respond(200, { "Content-Type": "application/json" }, '{ "q": "banana", "results": [{"id":1, "text":"banana bunch"}]}');
			expect(input.val()).to.equal('banana');
			expect(input.prop('style')['background']).to.not.match(/loading\.gif/i);
		});
		it('out of order', function(){
			var chosen,
					input,
					key;

			chosen = $('select', space).ajaxChosen({
				dataType: 'json',
				type: 'POST',
				url: '/search'
			},{}).next();
			chosen.trigger('click');

			//first request
			input = $('input', chosen).val('monkey');
			key = $.Event('keyup');
			key.which = 32;
			input.trigger(key);
			this.clock.tick(750);
			//server begins processing request 1
			expect(input.val()).to.equal('monkey');
			expect(this.requests).to.have.length(1);

			//second request
			input.val('banana');
			key = $.Event('keyup');
			key.which = 32;
			input.trigger(key);
			this.clock.tick(750);
			//server begins processing request 2
			expect(input.val()).to.equal('banana');
			expect(this.requests).to.have.length(2);

			//response 2 comes back first and banana is selected
			this.requests[1].respond(200, { "Content-Type": "application/json" }, '{ "q": "banana", "results": [{"id":1, "text":"banana bunch"}]}');
			expect(input.val()).to.equal('banana');
			expect(input.css('background-image')).to.not.match(/loading\.gif/i);

			//response 1 comes back out of order
			this.requests[0].respond(200, { "Content-Type": "application/json" }, '{ "q": "monkey", "results": [{"id":1, "text":"first monkey"}]}');
			//discard first response keep newly typed word and result set
			expect(input.val()).to.equal('banana');
			expect(input.css('background-image')).to.not.match(/loading\.gif/i);
		});
	});
});
