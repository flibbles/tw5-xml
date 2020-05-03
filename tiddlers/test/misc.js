/*\

Tests for tw5-xml which don't fit a category.

\*/

describe("Misc", function() {

it("supports IE11", function() {
	// Also, backticks aren't allowed, but there isn't an easy way
	// to test for that.
	var info = $tw.wiki.getPluginInfo("$:/plugins/flibbles/xml");
	for (var title in info.tiddlers) {
		var tiddler = info.tiddlers[title];
		if (tiddler.type !== "application/javascript") {
			continue;
		}
		var text = tiddler.text;
		expect(text.indexOf(".startsWith")).toEqual(-1);
		expect(text.indexOf(".endsWith")).toEqual(-1);
		expect(text.indexOf(".assign")).toEqual(-1);
	}
});

});
