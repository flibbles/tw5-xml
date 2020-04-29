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
	var template = "<$xsl for-each='/dogs/dog/@name'><<xmlNode>></$xsl>";
	var text = transform("<dogs><dog name='Dots'/></dogs>", template);
	expect(text).toBe("<p>Dots</p>");
	text = transform(prolog + "<dogs><dog name='Dots'/></dogs>", template);
	expect(text).toBe("<p>Dots</p>");

});

it("block vs inline", function() {
	var xml = "<root><elem>A</elem><elem>B</elem><elem>C</elem></root>";
	var template = "<$xsl for-each='/root/elem'><<xmlNode>></$xsl>";
	var text;
	text = transform(xml, "<$xsl for-each='/root/elem'>\n<<xmlNode>></$xsl>");
	expect(text).toBe("<p>\nA\nB\nC</p>");
	text = transform(xml, "<$xsl for-each='/root/elem'>\n\n<<xmlNode>></$xsl>");
	expect(text).toBe("<p>A</p><p>B</p><p>C</p>");
});

it("can for-each loop", function() {
	var text = transform(
		prolog + "<dogs><dog>Ruffus</dog><dog>Skippy</dog></dogs>",
		"<$xsl for-each='/dogs/dog'>(<<xmlNode>>)</$xsl>");
	expect(text).toBe("<p>(Ruffus)(Skippy)</p>");

	text = transform(
		"<dogs><dog name='Ruffus' /><dog name='Marley' /></dogs>",
		"<$xsl variable='name' for-each='/dogs/dog/@name'><<name>> </$xsl>");
	expect(text).toBe("<p>Ruffus Marley </p>");
});

it("can nest for-each loops", function() {
	var test = transform("<dogs><dog><trick name='A'/><trick name='B'/></dog><dog><trick name='C'/></dog></dogs>",
		"<$xsl for-each='/dogs/dog'>\n\n<$xsl variable='trick' for-each='./trick/@name'>\n<<trick>></$xsl></$xsl>");
	expect(test).toBe("<p>\nA\nB</p><p>\nC</p>");
});

it("can nest across different contexts", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", type: "text/xml",
		 text: "<subdocs><subdoc attr='vA1' /><subdoc attr='vA2' /></subdocs>"},
		{title: "B", type: "text/xml",
		 text: "<subdocs><subdoc attr='vB' /></subdocs>"}]);
	var text = transform("<docs><doc>A</doc><doc>B</doc></docs>",
		"<$xsl for-each='/docs/doc'>\n\n<$tiddler tiddler=<<xmlNode>>><$xsl for-each='./subdoc/@attr'>\n<<xmlNode>></$xsl></$tiddler></$xsl>",
		{wiki: wiki});
	expect(text).toBe("<p>\nvA1\nvA2</p><p>\nvB</p>");
});

});
