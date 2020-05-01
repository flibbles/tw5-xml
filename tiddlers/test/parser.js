/*\

Tests the xmlparser

\*/

describe("Parser", function() {

it('render xml tiddlers', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "test", type: "text/xml", text: '<dogs><dog name="Roofus">Good dog</dog></dogs>'});
	var output = wiki.renderTiddler("text/vnd.tiddlywiki", "test");
	expect(output).toContain("Good dog");
	expect(output).toContain('<dog name="Roofus">');
});

it('renders xml with tiddler template declaration', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "test", type: "text/xml", text: '<?xml version="1.0" encoding="UTF-8"?>\n<?tiddlywiki template="myTemplate"?>\n<dogs><dog name="Roofus">Good dog</dog></dogs>'});
	wiki.addTiddler({title: "myTemplate", text: '!!A template file\n\n<ul><$xsl for-each="/dogs/dog/@name"><li><<xmlNode>></li></$xsl></ul>'});
	var options = {variables: {currentTiddler: "test"}};
	var output = wiki.renderTiddler("text/html", "test", options);
	expect(output).toContain("A template file");
	expect(output).toContain("Roofus");
	// This will only show up if its rendering as a block, as expected.
	expect(output).toContain("</h2>");
});

});
