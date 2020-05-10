/*\

Tests the xpath widget

\*/

describe("CSS Widget", function() {

function transform(html, template, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddler({title: "html", type: "text/html", text: html})
	wiki.addTiddler({title: "tmplt", text: template});
	return wiki.renderText("text/html", "text/vnd.tiddlywki", "{{html||tmplt}}");
};

it("can for-each loop", function() {
	var text ="<div><p class='dog'><span>Ruffus</span></p><p class='b dog'>Muffin</p></div>";
	expect(transform(text, "<$css for-each='.dog'/>")).toBe("<p><span>&lt;span&gt;Ruffus&lt;/span&gt;</span><span>Muffin</span></p>");
	expect(transform(text, "<$css for-each='.dog'/>\n")).toBe("<div>&lt;span&gt;Ruffus&lt;/span&gt;</div><div>Muffin</div>");
	expect(transform(text, "<$css for-each='.dog'>(<<currentNode>>)</$css>")).toBe("<p>(<span>Ruffus</span>)(Muffin)</p>");
	expect(transform(text, "<$css for-each='.dog'>\n\n(<<currentNode>>)\n\n</$css>")).toBe("<p>(<span>Ruffus</span>)</p><p>(Muffin)</p>");
});

it("can value-of", function() {
	var xml = "<div><p class='dog'><span>Roofus</span></p><p class='dog'>Ignore</p></div>";
	expect(transform(xml, "<$css value-of='.dog' />")).toBe("<p>Roofus</p>");
	expect(transform(xml, "<$css value-of='.dog' />\n")).toBe("Roofus");
	expect(transform(xml, "<$css value-of='.dog'>-<<currentNode>>-</$css>")).toBe("<p>-Roofus-</p>");
	expect(transform(xml, "<$css value-of='.dog'>\n\n-<<currentNode>>-\n\n</$css>")).toBe("<p>-Roofus-</p>");
});


});
