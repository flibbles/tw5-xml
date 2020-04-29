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

});
