/*\

Tests the widget transformer

\*/

describe("Transformer", function() {

const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';

function transform(xml, template, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddler({title: "xml", type: "text/xml", text: xml})
	wiki.addTiddler({title: "tmplt", text: template});
	return wiki.renderText("text/html", "text/vnd.tiddlywki", "{{xml||tmplt}}");
};

it("works with or without prolog", function() {
	var template = "<$xpath for-each='dogs/dog/@name'><<currentNode>></$xpath>";
	var text = transform("<dogs><dog name='Dots'/></dogs>", template);
	expect(text).toBe("<p>Dots</p>");
	text = transform(prolog + "<dogs><dog name='Dots'/></dogs>", template);
	expect(text).toBe("<p>Dots</p>");
});

it('starts at root element', function() {
	var xml = "<dogs><dog name='Dots'/></dogs>";
	var text;
	text = transform(xml,"<$xpath for-each='/dogs/dog/@name'><<currentNode>></$xpath>");
	expect(text).toBe("<p>Dots</p>");
	text = transform(xml, "<$xpath for-each='dogs/dog/@name'><<currentNode>></$xpath>");
	expect(text).toBe("<p>Dots</p>");
});

it('deals with illegal xpath gracefully', function() {
	var text = transform("<dogs/>", "<$xpath for-each='/dogs/' />");
	expect(text).toBe('<p><span class="tc-error">Invalid XPath expression: /dogs/</span></p>');

	// uses blocks when appropriate
	text = transform("<dogs/>", "<$xpath for-each='/dogs/' />\n");
	expect(text).toBe('<span class="tc-error">Invalid XPath expression: /dogs/</span>');

	// namespace error
	text = transform("<dogs/>", "<$xpath value-of='/bad:dogs' />");
	expect(text).toBe('<p><span class="tc-error">Could not resolve namespaces in XPath expression: /bad:dogs</span></p>');
});

it("block vs inline", function() {
	var xml = "<root><elem>A</elem><elem>B</elem><elem>C</elem></root>";
	var template = "<$xpath for-each='/root/elem'><<currentNode>></$xpath>";
	var text;
	text = transform(xml, "<$xpath for-each='/root/elem'>\n<<currentNode>></$xpath>");
	expect(text).toBe("<p>\nA\nB\nC</p>");
	text = transform(xml, "<$xpath for-each='/root/elem'>\n\n<<currentNode>></$xpath>");
	expect(text).toBe("<p>A</p><p>B</p><p>C</p>");
});

it("can for-each loop", function() {
	var text = transform(
		prolog + "<dogs><dog>Ruffus</dog><dog>Skippy</dog></dogs>",
		"<$xpath for-each='/dogs/dog'>(<<currentNode>>)</$xpath>");
	expect(text).toBe("<p>(Ruffus)(Skippy)</p>");

	text = transform(
		"<dogs><dog name='Ruffus' /><dog name='Marley' /></dogs>",
		"<$xpath variable='name' for-each='/dogs/dog/@name'><<name>> </$xpath>");
	expect(text).toBe("<p>Ruffus Marley </p>");
});

it("can for-each loop without body", function() {
	var output, text = "<dogs><dog breed='hot dog'>Ruffus</dog><dog breed='small'>Skippy</dog></dogs>";
	// inline
	output = transform(text, "<$xpath for-each='/dogs/dog' />");
	expect(output).toBe("<p><span>Ruffus</span><span>Skippy</span></p>");
	// block
	output = transform(text, "<$xpath for-each='/dogs/dog' />\n");
	expect(output).toBe("<div>Ruffus</div><div>Skippy</div>");
	// direct text reference
	output = transform(text, "<$xpath for-each='/dogs/dog/text()' />\n");
	expect(output).toBe("<div>Ruffus</div><div>Skippy</div>");
	// attribute
	output = transform(text, "<$xpath for-each='/dogs/dog/@breed' />\n");
	expect(output).toBe("<div>hot dog</div><div>small</div>");
});

it('can get value of', function() {
	var text = transform("<dogs><dog>Roofus</dog><dog>Skippy</dog></dogs>",
		"<$xpath value-of='/dogs/dog' />");
	expect(text).toBe("<p>Roofus</p>");
});

it("can nest for-each loops", function() {
	var test = transform("<dogs><dog><trick name='A'/><trick name='B'/></dog><dog><trick name='C'/></dog></dogs>",
		"<$xpath for-each='/dogs/dog'>\n\n<$xpath variable='trick' for-each='./trick/@name'>\n<<trick>></$xpath></$xpath>");
	expect(test).toBe("<p>\nA\nB</p><p>\nC</p>");
});

it("can infer specified namespaces", function() {
	var text = "<dogs xmlns:dg='http://dognet.com'><dg:dog>Roofus</dg:dog></dogs>";
	var rtn = transform(text, "<$xpath value-of='//dg:dog' />");
	expect(rtn).toBe("<p>Roofus</p>");
});

it("inherits namespace settings", function() {
	var text = "<dg:dogs xmlns:dg='http://dognet.com'><dg:dog>Roofus</dg:dog></dg:dogs>";
	var rtn = transform(text, "\\define xmlns:dg() http://dognet.com\n<$xpath value-of='/dg:dogs/dg:dog' />");
	expect(rtn).toBe("<p>Roofus</p>");
});

it("can infer namespaces in root node from nested context", function() {
	var text = "<dg:dogs xmlns:dg='http://dognet.com'><dg:dog><dg:name>Roofus</dg:name></dg:dog><dg:dog><dg:name>Barkley</dg:name></dg:dog></dg:dogs>";
	//var text = "<dogs><dg:dog xmlns:dg='http://dognet.com'>Roofus</dg:dog></dogs>";
	var rtn = transform(text, "<$xpath for-each='/dg:dogs/dg:dog'>\n\n<$xpath value-of='./dg:name' /></$xpath>");
	expect(rtn).toBe("<p>Roofus</p><p>Barkley</p>");
});

it("can infer nested namespace from nested context", function() {
	var text = "<root><dg:dogs xmlns:dg='http://dognet.com'><dg:dog><dg:name>Roofus</dg:name></dg:dog><dg:dog><dg:name>Barkley</dg:name></dg:dog></dg:dogs></root>";
	var rtn = transform(text, "<$xpath for-each='/root/*'>\n\n<$xpath for-each='./dg:dog/dg:name' />\n\n</$xpath>");
	expect(rtn).toBe("<div>Roofus</div><div>Barkley</div>");
});

it("can handle alternative prefixes for namespaces", function() {
	var text = "<dogs xmlns:dg='http://dognet.com'><dg:dog>Roofus</dg:dog></dogs>";
	var rtn = transform(text, "<$xpath xmlns:x='http://dognet.com' value-of='//x:dog' />");
	expect(rtn).toBe("<p>Roofus</p>");
});

it("can handle default namespaces", function() {
	var text = "<dogs xmlns='http://dognet.com'><dog>Roofus</dog></dogs>";
	var rtn = transform(text, "<$xpath xmlns:ns='http://dognet.com' value-of='/ns:dogs/ns:dog' />");
	expect(rtn).toBe("<p>Roofus</p>");
});

it("can nest across different contexts", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", type: "text/xml",
		 text: "<subdocs><subdoc attr='vA1' /><subdoc attr='vA2' /></subdocs>"},
		{title: "B", type: "text/xml",
		 text: "<subdocs><subdoc attr='vB' /></subdocs>"}]);
	var text = transform("<docs><doc>A</doc><doc>B</doc></docs>",
		"<$xpath for-each='/docs/doc'>\n\n<$tiddler tiddler=<<currentNode>>><$xpath for-each='subdocs/subdoc/@attr'>\n<<currentNode>></$xpath></$tiddler></$xpath>",
		{wiki: wiki});
	expect(text).toBe("<p>\nvA1\nvA2</p><p>\nvB</p>");
});

describe("refreshes", function() {

function testChange(template, Atext, Btext, Aexpected, Bexpected, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddler({title: "ref", text: Atext});
	wiki.addTiddler({title: "xml", text: options.xml || "<dog a='wrong' b='right' />"});
	wiki.addTiddler({title: "template", text: template});
	var parser = wiki.parseText("text/vnd.tiddlywiki", "{{xml||template}}");
	var widgetNode = wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container, null);
	expect(container.innerHTML).toBe(Aexpected);
	wiki.addTiddler({title: "ref", text: Btext});
	widgetNode.refresh({"ref": {modified: true}});
	expect(container.innerHTML).toBe(Bexpected);
};

it("when for-each changes", function() {
	testChange("<$xpath for-each={{ref}} />\n",
		"/dog/@a", "/dog/@b", "<div>wrong</div>", "<div>right</div>");
});

it("when value-of changes", function() {
	testChange("<$xpath value-of={{ref}} />\n",
		"/dog/@a", "/dog/@b", "wrong", "right");
});

it("when variable changes", function() {
	testChange("<$xpath variable={{ref}} for-each='/dog/@a'><<first>>-<<second>></$xpath>",
		"first", "second", "<p>wrong-</p>", "<p>-wrong</p>");
});

it("when tiddler changes", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "otherxml", text: "<dog a='other' />"});
	testChange("<$xpath tiddler={{ref}} for-each='/dog/@a' />\n",
		"xml", "otherxml", "<div>wrong</div>", "<div>other</div>", {wiki:wiki});
});

it("when underlying xml changes", function() {
	testChange("<$xpath tiddler='ref' for-each='/dog/@a' />\n",
		"<dog a='one'/>", "<dog a='two'/>", "<div>one</div>", "<div>two</div>");
});

it("when children change", function() {
	testChange("<$xpath for-each='/dog/@a'>{{ref}}</$xpath>",
		"one", "two", "<p>one</p>", "<p>two</p>");
});

it("when a locally-defined namespace def changes", function() {
	var options = {xml: "<root xmlns:a='http://A.com' xmlns:b='http://B.com'><a:dog>DogA</a:dog><b:dog>DogB</b:dog></root>"};
	testChange("<$xpath xmlns:x={{ref}} for-each='//x:dog' />\n",
		"http://A.com", "http://B.com",
		"<div>DogA</div>", "<div>DogB</div>", options);
});

it("when an inherited namespace def changes", function() {
	var options = {xml: "<root xmlns:a='http://A.com' xmlns:b='http://B.com'><a:dog>DogA</a:dog><b:dog>DogB</b:dog></root>"};
	testChange("<$set name='xmlns:x' value={{ref}}>\n\n<$xpath for-each='//x:dog' />\n\n</$set>",
		"http://A.com", "http://B.com",
		"<div>DogA</div>", "<div>DogB</div>", options);
});

});

});
