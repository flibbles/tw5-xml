/*\

Tests the [xselect[]] filter

\*/

describe("XSelect filter", function() {

function test(query, expected, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var type = options.type || "text/html";
	wiki.addTiddler({title: "test.html", type: type, text: options.text || "<body><div id='A'>Sparks</div><div id='B'>Joel</div></body>"});
	var input = options.input || ["test.html"];
	var operator = options.operator || "xselect";
	var output = wiki.filterTiddlers("["+operator+"["+query+"]]", options.widget, input);
	expect(output).toEqual(expected);
};

it("works", function() {
	test("div", ["Sparks", "Joel"]);
});

it("emits helpful output for malformed HTML", function() {
	test("dog", ['Unable to parse XML in tiddler "test.html"'], {text: "<dogs><$dog /></dogs", type: "text/xml"});
});

it("handles selector errors gracefully", function() {
	test("..div", ["Invalid Selector: ..div"]);
});

it("gets textContent, not innerHTML", function() {
	test("body", ["SparksJoel"]);
});

it("has :if suffix support", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", type: "text/html", text: "<body><div class='test'>Amy</div><div class='test'>Beth</div></body>"},
		{title: "B", type: "text/html", text: "<body><div>Carl</div></body>"},
		{title: "C", type: "text/html", text: "<body><div class='test'>Bob</div></body>"}]);
	test(".test", ["Amy", "Beth", "Bob"],
		{input: ["A", "B", "C"], wiki: wiki});
	test(".test", ["A", "C"],
		{input: ["A", "B", "C"], wiki: wiki, operator: "xselect:if"});
	test(".test", ["B"],
		{input: ["A", "B", "C"], wiki: wiki, operator: "!xselect:if"});
});

// This used to fail on Node.js because it would create half-baked Documents
// if there weren't any elements. Any attempt to access by #ID would error.
it("can attempt to parse text-only html", function() {
	test("#test", [], {text: "Text only", operator: "xselect:if"});
});

it(":if treats failed documents as false", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", type: "text/xml", text: "<div id='test'/>"},
		{title: "B", text: "not even pretending"},
		{title: "C", type: "text/xml", text: "<div id='test'/>"},
		{title: "D", type: "text/xml", text: "<div />"},
		{title: "E", type: "text/xml", text: "this is bad <xml"}]);
	test("#test", ["A", "C"],
		{input: ["A", "B", "C", "D", "E"], wiki: wiki, operator: "xselect:if"});
	test("#test", ["B", "D", "E"],
		{input: ["A", "B", "C", "D", "E"], wiki: wiki, operator:"!xselect:if"});
});

});
