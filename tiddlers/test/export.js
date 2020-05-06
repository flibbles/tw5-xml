/*\

Tests exporting.

\*/

describe("Exporter", function() {

const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';

function exportXml(fields, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var exporter = $tw.wiki.filterTiddlers("[[$:/tags/Exporter]tagging[]extension[.xml]]")[0];
	wiki.addTiddler($tw.wiki.getTiddler(exporter));
	wiki.addTiddler(fields);
	options.variables = options.variables || { exportFilter: "[["+fields.title+"]]" }
	return wiki.renderTiddler("text/plain", exporter, options);
};

it("simple tiddler", function() {
	var text = exportXml({title: "test", text: "Content"});
	expect(text).toBe(prolog + "<tiddlers><tiddler><title>test</title><text>Content</text></tiddler></tiddlers>");
});

it("content with elements", function() {
	var text = exportXml({title: "test", text: "<A>stuff</A>"});
	expect(text).toContain("<text>&lt;A&gt;stuff&lt;/A&gt;</text>");
});

it("selective", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "other", text: "ignored"});
	var text = exportXml({title: "test", text: "content"}, {wiki: wiki});
	expect(text).toContain("content");
	expect(text.indexOf("ignored")).toBe(-1, "exported tiddlers not included in exportFilter");
});

// No other exporter, when opened directly in TiddlyWiki, prints out literally
// everything. The JSON exporter assumes nothing, which it should, but the
// way it does it is actually flawed.
// My way isn't flawed. I set another value equal to <<exportFilter>>, and then
// use that. That way, if there's not exportFilter, I get emptystring instead
// of null.
// Meahwhile, JSONexporter chokes on titles like this: 'with"""many"""quotes'
it("doesn't output everything if exportFilter undefined", function() {
	var options = {variables: {} };
	var text = exportXml({title: "ignore", text: "ignore"}, options);
	expect(text).toBe(prolog + "<tiddlers></tiddlers>");
});

});
