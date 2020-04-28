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
	options.variables = { exportFilter: "[["+fields.title+"]]" }
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

});
