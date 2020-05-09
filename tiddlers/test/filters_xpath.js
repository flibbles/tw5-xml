/*\

Tests the [xpath[]] filter

\*/

describe("XPath Filter", function() {

function test(query, expected, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: options.text || "<dogs><dog>Sparks</dog><dog>Joel</dog></dogs>"});
	var input = options.input || ["test.xml"];
	var operator = options.operator || "xpath";
	var output = wiki.filterTiddlers("["+operator+"["+query+"]]", options.widget, input);
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

it("has :if suffix support", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", type: "text/xml", text: "<test><love>Amy</love><love>Beth</love></test>"},
		{title: "B", type: "text/xml", text: "<test><hate>Carl</hate></test>"},
		{title: "C", type: "text/xml", text: "<test><love>Bob</love></test>"}]);
	test("/test/love", ["Amy", "Beth", "Bob"],
		{input: ["A", "B", "C"], wiki: wiki});
	test("/test/love", ["A", "C"],
		{input: ["A", "B", "C"], wiki: wiki, operator: "xpath:if"});
	test("/test/love", ["B"],
		{input: ["A", "B", "C"], wiki: wiki, operator: "!xpath:if"});
});

it(":if treats failed documents as false", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", text: "<test />"},
		{title: "B", text: "something <not xml"},
		{title: "C", text: "<test />"},
		{title: "D", text: "<ignore />"}]);
	test("/test", ["A", "C"],
		{input: ["A", "B", "C", "D"], wiki: wiki, operator: "xpath:if"});
	test("/test", ["B", "D"],
		{input: ["A", "B", "C", "D"], wiki: wiki, operator: "!xpath:if"});
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
