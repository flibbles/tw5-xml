/*\

Tests the [xpath[]] filter

\*/

describe("XPath Filter", function() {

function test(query, expected, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: options.text || "<dogs><dog>Sparks</dog><dog>Joel</dog></dogs>"});
	var input = options.input || ["test.xml"];
	var output = wiki.filterTiddlers("[xpath["+query+"]]", options.widget, input);
	expect(output).toEqual(expected);
};

it("works", function() {
	test("/dogs/dog", ["Sparks", "Joel"]);
});

it("emits helpful output for malformed XML", function() {
	test("/dogs/dog", ['Unable to parse XML in tiddler "test.xml"'], {text: "<dogs><$dog /></dogs"});
});

/*
it("handles explicit namespaces", function() {
	var wiki = new $tw.Wiki();
	var widget = wiki.makeWidget(null, {variables: {"xmlns:x": "http://dognet.com"}});
	var text = "<x:dogs><x:dog>Buddy</x:dog></x:dogs>";
	test("/x:dogs/x:dog", ["Buddy"], {text: text, wiki: wiki, widget: widget});

});
*/

});
