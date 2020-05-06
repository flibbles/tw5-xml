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

function nsWidget(wiki, namespaces) {
	var parser = {tree: [{type: "widget"}]};
	var widget = wiki.makeWidget(parser, {variables: namespaces});
	widget.render();
	while (widget.children.length > 0) {
		widget = widget.children[0];
	}
	return widget;
};

it("works", function() {
	test("/dogs/dog", ["Sparks", "Joel"]);
});

it("emits helpful output for malformed XML", function() {
	test("/dogs/dog", ['Unable to parse XML in tiddler "test.xml"'], {text: "<dogs><$dog /></dogs"});
});

it("handles explicit namespaces", function() {
	var wiki = new $tw.Wiki();
	var widget = nsWidget(wiki, {"xmlns:x": "http://dognet.com"});
	var text = "<dogs xmlns='http://dognet.com'><dog>Buddy</dog></dogs>";
	test("/x:dogs/x:dog", ["Buddy"], {text: text, wiki: wiki, widget: widget});
});

it("handles implicit namespaces without widget", function() {
	var text = "<d:dogs xmlns:d='http://dognet.com'><d:dog>Johnson</d:dog></d:dogs>";
	test("/d:dogs/d:dog", ["Johnson"], {text: text});
});

it("handles implicit namespaces with widget", function() {
	// pass it a widget it doesn't use. Because handling with and without a
	// widget is slightly different.
	var wiki = new $tw.Wiki();
	var widget = nsWidget(wiki, {});
	var text = "<d:dogs xmlns:d='http://dognet.com'><d:dog>Johnson</d:dog></d:dogs>";
	test("/d:dogs/d:dog", ["Johnson"], {text: text, wiki: wiki, widget: widget});
});

it("handles xpath errors gracefully", function() {
	test("/dogs/dog[", ["Invalid XPath expression: /dogs/dog["]);
	test("/z:dogs/z:dog", ["Could not resolve namespaces in XPath expression: /z:dogs/z:dog"]);
});

it("gets textContent, not innerHTML", function() {
	test("/type", ["love"], {text: "<type><stuff>love</stuff></type>"});
});

it("handles all node types", function() {
	test("/type/@attr", ["love"], {text: "<type attr='love' />"});
	test("/type/comment()", ["my comment"], {text: "<type><!--my comment--></type>"});
	test("/", ["root"], {text: "<type><stuff>root</stuff></type>"});
	test("/type/text()", ["my cdata"], {text: "<type><![CDATA[my cdata]]></type>"});
	test("/type/processing-instruction()", ["my instruction"], {text: "<type><?key my instruction?></type>"});
	test("/type/text()", ["&"], {text: "<type>&amp;</type>"});
	// Empty node
	test("/type", [""], {text: "<type></type>"});
	test("/type/text()", [], {text: "<type></type>"});
});

});
