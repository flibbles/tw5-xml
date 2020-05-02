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
	var template = "<$xpath for-each='dogs/dog/@name'><<xmlNode>></$xpath>";
	var text = transform("<dogs><dog name='Dots'/></dogs>", template);
	expect(text).toBe("<p>Dots</p>");
	text = transform(prolog + "<dogs><dog name='Dots'/></dogs>", template);
	expect(text).toBe("<p>Dots</p>");
});

it('starts at root element', function() {
	var xml = "<dogs><dog name='Dots'/></dogs>";
	var text;
	text = transform(xml,"<$xpath for-each='/dogs/dog/@name'><<xmlNode>></$xpath>");
	expect(text).toBe("<p>Dots</p>");
	text = transform(xml, "<$xpath for-each='dogs/dog/@name'><<xmlNode>></$xpath>");
	expect(text).toBe("<p>Dots</p>");
});

it('deals with illegal xpath gracefully', function() {
	var xml = "<dogs />";
	var wiki = new $tw.Wiki();
	var text = transform("<dogs/>", "<$xpath for-each='/dogs/' />", {wiki: wiki});
	expect(text).toBe('<p><span class="tc-error">Invalid XPath expression: /dogs/</span></p>');
});

it("block vs inline", function() {
	var xml = "<root><elem>A</elem><elem>B</elem><elem>C</elem></root>";
	var template = "<$xpath for-each='/root/elem'><<xmlNode>></$xpath>";
	var text;
	text = transform(xml, "<$xpath for-each='/root/elem'>\n<<xmlNode>></$xpath>");
	expect(text).toBe("<p>\nA\nB\nC</p>");
	text = transform(xml, "<$xpath for-each='/root/elem'>\n\n<<xmlNode>></$xpath>");
	expect(text).toBe("<p>A</p><p>B</p><p>C</p>");
});

it("can for-each loop", function() {
	var text = transform(
		prolog + "<dogs><dog>Ruffus</dog><dog>Skippy</dog></dogs>",
		"<$xpath for-each='/dogs/dog'>(<<xmlNode>>)</$xpath>");
	expect(text).toBe("<p>(Ruffus)(Skippy)</p>");

	text = transform(
		"<dogs><dog name='Ruffus' /><dog name='Marley' /></dogs>",
		"<$xpath variable='name' for-each='/dogs/dog/@name'><<name>> </$xpath>");
	expect(text).toBe("<p>Ruffus Marley </p>");
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

it("can handle specified namespaces", function() {
	var text = "<dogs xmlns:dg='http://dognet.com'><dg:dog>Roofus</dg:dog></dogs>";
	var rtn = transform(text, "<$xpath value-of='//dg:dog' />");
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
		"<$xpath for-each='/docs/doc'>\n\n<$tiddler tiddler=<<xmlNode>>><$xpath for-each='subdocs/subdoc/@attr'>\n<<xmlNode>></$xpath></$tiddler></$xpath>",
		{wiki: wiki});
	expect(text).toBe("<p>\nvA1\nvA2</p><p>\nvB</p>");
});

});
