Chosen ajax addition
====================
We use [chosen](https://github.com/harvesthq/chosen) at work.
Works great, but one day we needed it to do some server side calls.
So I quickly wrapped the plugin with some jQuery magic and chosen ajax addition was born.
Although it doesn't fit with the progressive enhancement ideals of chosen.. it was born quickly and it does what we need it to do for the time being.
It now supports the single and multi-select versions of chosen.

Warning
-------
Known issues:

* This plugin is known to do double work. If the user types a few letters, pauses, ajax fires off and returns results. Then the user types more, the chosen plugin will filter the results via JS as well as the server from the ajax call. 
* ~~User types, ajax 1 fires, users deletes, ajax 1 finishes and ajax 2 fires off. This sometimes leaves the input in an inconsistent state.~~ (fixed as of df3feae49)
* ~~On multi-select duplicate results may not be filter. Ex: If the user types 'United States' and selects United States, then types Japan and selects Japan. Typing United States again usually will have it filter from the result set, however it will appear in the result set.~~ (fixed as of e5ddd9fb2)

Critical Todos:

* Make the .ajaxChosen support an array of select elements (oops!)

Some More Todos:

* Add option to customize throttle timeout
* Move q to higher scope the server doesn't have to pass it back in request
* ~~Add check for ajaxChosenOptions being undefined~~

Branches
--------
Master will attempt to keep up with the latest version of chosen

lt-1_0 - this branch is for people who haven't updated to chosen version 1.0 yet. I will attempt to port all the changes made in master to this branch as well.


Example Usage
-------------
```javascript
<script src="/js/vendor/jquery-1.7.1.min.js"></script>
<script src="/js/vendor/chosen.jquery-0.9.5.js"></script>
<script src="/js/chosen.ajaxaddition.jquery.js"></script>
<script>
	$('select').ajaxChosen(ajaxOptions, ajaxChosenOptions, chosenOptions);
</script>
```
The method signature is:

ajaxOptions - options for $.ajax

ajaxChosenOptions - options for the ajax chosen plugin

chosenOptions - options to be proxied to the chosen plugin. ex: {no_results_text: 'shit out of luck'}

```javascript
<script src="/js/vendor/jquery-1.7.1.min.js"></script>
<script src="/js/vendor/chosen.jquery-0.9.5.js"></script>
<script src="/js/chosen.ajaxaddition.jquery.js"></script>
<script>
$('select').ajaxChosen({
	dataType: 'json',
	type: 'POST',
	url:'/search',
	data: {'keyboard':'cat'}, //Or can be [{'name':'keyboard', 'value':'cat'}]. chose your favorite, it handles both.
	success: function(data, textStatus, jqXHR){ doSomething(); }
},{
	processItems: function(data){ return data.complex.results; },
	useAjax: function(e){ return someCheckboxIsChecked(); },
	generateUrl: function(q){ return '/search_page/'+somethingDynamical(); },
	loadingImg: '../vendor/loading.gif',
	minLength: 2
});
</script>
```

What do these options mean:

__processItems__ -> this function gets called on the data that gets returned from the server, so you can format your results before ajax chosen outputs the select options. It is expected to return an array of key-value pairs or a hash of key value pairs. See below for details.
__default__: nothing

__useAjax__ -> this function will be executed on key up to determine whether to use the ajax functionality or not. It must return true or false.
__default__: true

__generateUrl__ -> this function will get executed right before the ajax call is fired. It receives the query the user typed as a parameter. It will use the return value of this function as the url option for the ajax call.
__default__: nothing, uses the url specified in the ajax parameters

__loadingImg__ -> path to the image you wish to show when the ajax call is processing
__default__: '/img/loading.gif'

__minLength__ -> The minimum number of characters required until ajax calls will be fired off to the server
__default__: 1

Expected Data Formats
---------------------
Ajax chosen requires the server return data to be in a somewhat specific format for it to output the select options.

It can be an array of kv pairs:
```
	[{id:'', text:''}...]
```

It can be a hash of kv pairs
```
	{'id':'text'...}
```

Another thing it expects is the query to be passed back in the result set. For instance:

```javascript
	{q:'banana', results:[{id:'', text:''}]}
```


Which brings me to my next point. If no processItems function is specified, ajax chosen will search for a results key in the data hash. If it is not found it will give you an error.
So some example formats that will work without a processItems function:

```javascript
	{q:'banana', results:[{id:'', text:''}]}
	{q:'banana', results:{id:text,id:text...}}
```


Running the tests
-----------------
Just load up runner.html in your browser.

Vendor
------
[jquery](http://jquery.com/)

[chosen](https://github.com/harvesthq/chosen) - base plugin

[mocha](http://visionmedia.github.com/mocha/) - test framework

[chai](http://chaijs.com/) - browser expectations for mocha

[sinon](http://sinonjs.org/) - spies, stubs, and mocks

[json2](https://github.com/douglascrockford/JSON-js) - JSON.stringify

Special Thanks
--------------

* [lowski](https://github.com/lowski)


Contributing
------------
Please submit all bugs and feature requests as an issue. Pull requests are always welcome, however please ensure the proper tests are added. I would like to keep this project as well tested as possible.


License
-------
Standard MIT

Copyright (c) 2012 Konstantin Sykulev

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ksykulev/chosen-ajax-addition/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

