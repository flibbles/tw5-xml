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

});
