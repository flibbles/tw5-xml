/*\

Tests the xpath widget

\*/

describe("XPath widget", function() {

const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';

function transform(xml, template, options) {
	options = options || {};
	var render = options.render || "{{xml||tmplt}}";
	var wiki = options.wiki || new $tw.Wiki();
	var type = options.type || "text/xml";
	wiki.addTiddler({title: "xml", type: type, text: xml})
	wiki.addTiddler({title: "tmplt", text: template});
	return wiki.renderText("text/html", "text/vnd.tiddlywiki", render);
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
	var text = transform("<dogs/>", "<$xpath for-each='/dogs/$@#$' />");
	expect(text).toBe('<p><span class="tc-error">Invalid XPath expression: /dogs/$@#$</span></p>');

	// uses blocks when appropriate
	text = transform("<dogs/>", "<$xpath for-each='/dogs/$@#$' />\n");
	expect(text).toBe('<span class="tc-error">Invalid XPath expression: /dogs/$@#$</span>');

	// namespace error
	text = transform("<dogs/>", "<$xpath value-of='/bad:dogs' />");
	expect(text).toBe('<p><span class="tc-error">Could not resolve namespaces in XPath expression "/bad:dogs" for tiddler "xml"</span></p>');
});

it('deals with malformed XML gracefully', function() {
	var text = transform("<$dogs>B</$dogs>", "<$xpath for-each='/' />\n");
	expect(text).toBe('<span class="tc-error">Unable to parse XML in tiddler "xml"</span>');
});

it('deals with missing or illegal-type currentTiddler gracefully', function() {
	var template = "<$xpath for-each='//*' />";
	var text = transform("", template, {render: "={{none||tmplt}}="});
	expect(text).toBe("<p>==</p>");
	// Make sure it deals with wrong-type targets too
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "notxml", text: "This is just some content"});
	text = transform("", template, {wiki: wiki, render: "={{notxml||tmplt}}="});
	expect(text).toBe("<p>==</p>");
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

it("can for-each loop with template", function() {
	var xml = "<dogs><dog>Roofus</dog><dog>Casey</dog></dogs>";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "each", text: "-<<currentNode>>-"});
	var output = transform(xml, "<$xpath template='each' for-each='/dogs/dog' />", {wiki: wiki});
	expect(output).toBe("<p>-Roofus--Casey-</p>");
	output = transform(xml, "<$xpath template='each' for-each='/dogs/dog' />\n", {wiki: wiki});
	expect(output).toBe("-Roofus--Casey-");
});

it("can value-of with template", function() {
	var xml = "<dogs><dog>Roofus</dog></dogs>";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "each", text: "-<<currentNode>>-"});
	var output = transform(xml, "<$xpath template='each' value-of='/dogs' />", {wiki: wiki});
	expect(output).toBe("<p>-Roofus-</p>");
	output = transform(xml, "<$xpath template='each' value-of='/dogs' />\n", {wiki: wiki});
	expect(output).toBe("-Roofus-");
});

it("can nest for-each loops", function() {
	var test = transform("<dogs><dog><trick name='A'/><trick name='B'/></dog><dog><trick name='C'/></dog></dogs>",
		"<$xpath for-each='/dogs/dog'>\n\n<$xpath variable='trick' for-each='./trick/@name'>\n<<trick>></$xpath></$xpath>");
	expect(test).toBe("<p>\nA\nB</p><p>\nC</p>");
});

it("can nest for-each on document type", function() {
	var test = transform("<tricks><trick name='A'/><trick name='B'/></tricks>",
		"<$xpath for-each='/'>\n\n<$xpath variable='trick' for-each='./tricks/trick/@name'>\n<<trick>></$xpath></$xpath>");
	expect(test).toBe("<p>\nA\nB</p>");
});

it('can get value of', function() {
	var text = transform("<dogs><dog>Roofus</dog><dog>Skippy</dog></dogs>",
		"<$xpath value-of='/dogs/dog' />");
	expect(text).toBe("<p>Roofus</p>");
});

it('can both for-each and value-of', function() {
	// This confirms that for-each sets context. Not value-of
	var text = transform("<dogs><dog name='Roofus'><trick>Backflip</trick></dog><dog name='Skippy'><trick>Shake</trick><trick>Play dead</trick></dog></dogs>",
		"<$xpath for-each='/dogs/dog' value-of='./@name'variable='name'>\n\n''<<name>>''\n\n<ul><$xpath for-each='./trick' variable='trick'><li><<trick>></li></$xpath></ul></$xpath>");
	expect(text).toBe("<p><strong>Roofus</strong></p><p><ul><li>Backflip</li></ul></p><p><strong>Skippy</strong></p><p><ul><li>Shake</li><li>Play dead</li></ul></p>");
});

it('can both for-each and value-of when value-of returns nothing', function() {
	var text = transform("<dogs><dog name='Roofus' /><dog/></dogs>",
		"<$xpath for-each='/dogs/dog' value-of='./@name'variable='name'>-<<name>>-</$xpath>");
	expect(text).toBe("<p>-Roofus---</p>");
});

it('escapes and does not escape with for-each when appropriate', function() {
	// Honestly, some of these seem so random to me, but I think it's
	// best that <$xpath for-each> behave as much like <$list filter>
	// as possible.
	var text = "<html><body><p><strong>Title</strong></p><p>body<ul><li>list</li></ul></p></body></html>",
		output;
	// Rendering variable from for-each: unescaped, delimiting <p>
	output = transform(text,
		"<$xpath variable='b' for-each='/html/body/p'>\n\n<<b>>\n\n</$xpath>");
	expect(output).toBe("<p><strong>Title</strong></p><p>body<ul><li>list</li></ul></p>");

	// Rendering variable from for-each as inline: unescaped, no delimiting <p>
	output = transform(text,
		"<$xpath variable='b' for-each='/html/body/p'><<b>></$xpath>");
	expect(output).toBe("<p><strong>Title</strong>body<ul><li>list</li></ul></p>");

	// Rendering direct from for-each as block: escaped, delimiting <div>
	output = transform(text,
		"<$xpath for-each='/html/body/p' />\n");
	expect(output).toBe("<div>&lt;strong&gt;Title&lt;/strong&gt;</div><div>body&lt;ul&gt;&lt;li&gt;list&lt;/li&gt;&lt;/ul&gt;</div>");

	// Rendering direct from for-each as inline: escaped, delimiting <span>
	output = transform(text,
		"<$xpath for-each='/html/body/p' />");
	expect(output).toBe("<p><span>&lt;strong&gt;Title&lt;/strong&gt;</span><span>body&lt;ul&gt;&lt;li&gt;list&lt;/li&gt;&lt;/ul&gt;</span></p>");
});

it('escapes and does not escape with value-of when appropriate', function() {
	// Value-of behaves like <$set> when possible, or <$view> if the
	// widget is self-terminating. Always returns escaped strings. With no
	// nested elements. textContent only.
	var text = "<html><body><div><h1>Title</h1></div></body></html>",
		output;

	// Rendering variable as block, wrapped in <p>, for some reason
	output = transform(text, "<$xpath value-of='/html/body' variable='title'>\n\nXX<<title>>XX\n\n</$xpath>");
	expect(output).toBe("<p>XXTitleXX</p>");

	// Rendering variable as inline, wrapped in <p>
	output = transform(text, "<$xpath value-of='/html/body' variable='title'>XX<<title>>XX</$xpath>");
	expect(output).toBe("<p>XXTitleXX</p>");

	// Rendering direct as block: raw as possible
	output = transform(text, "<$xpath value-of='/html/body' />\n");
	expect(output).toBe("Title");

	// Rendering direct as inline: wrapped in <p>
	output = transform(text, "<$xpath value-of='/html/body' />");
	expect(output).toBe("<p>Title</p>");
});

it('escapes and does not with both attributes when appropriate', function() {
	// This behaves pretty much like with just for-each, but the value
	// will be different.
	var text = "<dogs><dog><name><strong>Roofus</strong></name></dog><dog><name><em>Tricky</em></name></dog></dogs>",
		output;
	// Rendering variable block from both: textContent, delimiting <p>
	output = transform(text,
		"<$xpath variable='name' for-each='/dogs/dog' value-of='./name'>\n\n-<<name>>-\n\n</$xpath>");
	expect(output).toBe("<p>-Roofus-</p><p>-Tricky-</p>");

	// Rendering variable inline from both: textContent, surrounding <p>
	output = transform(text,
		"<$xpath variable='name' for-each='/dogs/dog' value-of='./name'>-<<name>>-</$xpath>");
	expect(output).toBe("<p>-Roofus--Tricky-</p>");

	// Rendering direct block from both: textContent, delimiting <div>
	output = transform(text,
		"<$xpath for-each='/dogs/dog' value-of='./name' />\n");
	expect(output).toBe("<div>Roofus</div><div>Tricky</div>");

	// Rendering direct inline from both: textContent, surrounding <span>
	output = transform(text,
		"<$xpath for-each='/dogs/dog' value-of='./name' />");
	expect(output).toBe("<p><span>Roofus</span><span>Tricky</span></p>");
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
	var rtn = transform(text, "<$xpath for-each='/dg:dogs/dg:dog'>\n\n<$xpath value-of='./dg:name' /></$xpath>");
	expect(rtn).toBe("<p>Roofus</p><p>Barkley</p>");
});

it("uses innermost definitions for namespaces", function() {
	var text = "<y:dogs xmlns:y='http://dognet.com'><y:dog><y:name>Rex</y:name></y:dog><cats xmlns:y='http://catnet.com'><y:cat><y:name>Kitty</y:name></y:cat></cats></y:dogs>";
	// First, we can use outer dognet
	var rtn = transform(text, "<$xpath for-each='//y:name'/>\n");
	expect(rtn).toBe("<div>Rex</div>");
	// Now for the tricky one
	rtn = transform(text, "<$xpath for-each='/y:dogs/cats'>\n\n<$xpath for-each='//y:name' />\n\n</$xpath>");
	expect(rtn).toBe("<div>Kitty</div>");
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

it('handles all node types', function() {
	function testType(innerXml, attribute, expectedForeach, expectedValueof) {
		var output, xml = "<types>"+innerXml+"</types>";
		output = transform(xml, "<$xpath for-each='"+attribute+"' />\n");
		expect(output).toBe(expectedForeach);
		output = transform(xml, "<$xpath value-of='"+attribute+"' />\n");
		expect(output).toBe(expectedValueof);
	}
	testType("<elem attr='love'/>", "/types/elem/@attr",
		"<div>love</div>", "love");
	testType("<!--A comment-->", "/types/comment()",
		"<div>A comment</div>", "A comment");
	testType("Root node", "/",
		"<div>&lt;types&gt;Root node&lt;/types&gt;</div>", "Root node");
	testType("<![CDATA[my content]]>", "/types/text()",
		"<div>my content</div>", "my content");
	testType("<?key process?>", "/types/processing-instruction()", "<div>process</div>", "process");
	testType("<?key process?>", "/types/processing-instruction(\"key\")", "<div>process</div>", "process");
	testType("&amp;", "/types/text()", "<div>&amp;</div>", "&amp;");
	// Empty node (to make sure it doesn't crash)
	testType("", "/types", "<div></div>", "");
	// Empty text. Won't actually find anything
	testType("", "/types/text()", "", "");
});

it('handles DOCTYPE', function() {
	var output = transform(prolog + '<!DOCTYPE sample [\n<!NOTATION vrml PUBLIC "VMRL 1.0">\n<!ENTITY dotto "Dottoro">\n]>\n<dogs><dog>Woofer</dog></dogs>', "<$xpath value-of='/dogs/dog' />\n");
	expect(output).toBe("Woofer");
});

it('handles SVG', function() {
	var svg = prolog + '<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100"><circle cx="50" cy="50" r="40" stroke="black" fill="red" /><desc>This is a circle</desc></svg>';
	var options = {type: "image/svg+xml"};
	var output = transform(svg, '<$xpath xmlns:svg="http://www.w3.org/2000/svg" value-of="svg:svg/svg:circle/@fill" />\n', options);
	expect(output).toBe("red");
	var output = transform(svg, '<$xselect value-of="svg > desc" />\n', options);
	expect(output).toBe("This is a circle");
});

describe("refreshes", function() {

function testChange(template, Atext, Btext, Aexpected, Bexpected, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var refType = options.refType || "text/vnd.tiddlywiki";
	wiki.addTiddler({title: "ref", text: Atext, type: refType});
	wiki.addTiddler({title: "xml", type: "text/xml", text: options.xml || "<dog a='wrong' b='right' />"});
	wiki.addTiddler({title: "template", text: template});
	var parser = wiki.parseText("text/vnd.tiddlywiki", "{{xml||template}}");
	var widgetNode = wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container, null);
	expect(container.innerHTML).toBe(Aexpected);
	wiki.addTiddler({title: "ref", text: Btext, type: refType});
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
	wiki.addTiddler({title: "otherxml", type: "text/xml", text: "<dog a='other' />"});
	testChange("<$xpath tiddler={{ref}} for-each='/dog/@a' />\n",
		"xml", "otherxml", "<div>wrong</div>", "<div>other</div>", {wiki:wiki});
});

it("when underlying xml changes", function() {
	testChange("<$xpath tiddler='ref' for-each='//div/@id' />\n",
		"<div xmlns='' id='one'>", "<div xmlns='' id='two'/>", "<div>one</div>", "<div>two</div>", {refType: "text/html"});
});

it("when template changes", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", text: "no-<<b>>"},
		{title: "B", text: "yes-<<b>>"}]);
	testChange("<$xpath variable='b' template={{ref}} for-each='/dog/@b' />\n",
		"A", "B", "no-right", "yes-right", {wiki:wiki});
});

it("when underlying template changes", function() {
	testChange("<$xpath variable='b' template='ref' for-each='/dog/@b' />\n",
		"no-<<b>>", "yes-<<b>>", "no-right", "yes-right");
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
