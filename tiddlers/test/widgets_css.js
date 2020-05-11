/*\

Tests the css widget

\*/

describe("CSS Widget", function() {

function transform(html, template, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var type = options.type || "text/html";
	wiki.addTiddler({title: "html", type: type, text: html})
	wiki.addTiddler({title: "tmplt", text: template});
	return wiki.renderText("text/html", "text/vnd.tiddlywki", "{{html||tmplt}}");
};

it("can for-each loop", function() {
	var text ="<div><p class='dog'>Ruffus</p><p class='b dog'>Muffin</p></div>";
	expect(transform(text, "<$css for-each='.dog'/>")).toBe("<p><span>Ruffus</span><span>Muffin</span></p>");
	expect(transform(text, "<$css for-each='.dog'/>\n")).toBe("<div>Ruffus</div><div>Muffin</div>");
	expect(transform(text, "<$css for-each='.dog'>(<<currentNode>>)</$css>")).toBe("<p>(Ruffus)(Muffin)</p>");
	expect(transform(text, "<$css for-each='.dog'>\n\n(<<currentNode>>)\n\n</$css>")).toBe("<p>(Ruffus)</p><p>(Muffin)</p>");
});

it("sets variable to innerHTML for for-each", function() {
	var text ="<div><p class='dog'><span>Ruffus</span></p></div>";
	var output = transform(text, "<$css for-each='.dog'/>\n");
	// We can't do a full match here, because Node.JS adds stupid xhtml
	// namespace. Browsers do not.
	expect(output).toContain("&gt;Ruffus&lt;/span&gt;</div>");
	output = transform(text, "<$css for-each='.dog'>\n\n<<currentNode>>\n\n</$css>");
	expect(output).toContain(">Ruffus</span></p>");
});

it("can value-of", function() {
	var xml = "<div><p class='dog'><span>Roofus</span></p><p class='dog'>Ignore</p></div>";
	expect(transform(xml, "<$css value-of='.dog' />")).toBe("<p>Roofus</p>");
	expect(transform(xml, "<$css value-of='.dog' />\n")).toBe("Roofus");
	expect(transform(xml, "<$css value-of='.dog'>-<<currentNode>>-</$css>")).toBe("<p>-Roofus-</p>");
	expect(transform(xml, "<$css value-of='.dog'>\n\n-<<currentNode>>-\n\n</$css>")).toBe("<p>-Roofus-</p>");
});

it('deals with illegal queries gracefully', function() {
	var text = transform("<div class='dogs'/>", "<$css for-each='..dogs' />");
	expect(text).toBe('<p><span class="tc-error">Invalid CSS Selector: ..dogs</span></p>');

	// uses blocks when appropriate
	text = transform("<div class='dogs'/>", "<$css for-each='..dogs' />\n");
	expect(text).toBe('<span class="tc-error">Invalid CSS Selector: ..dogs</span>');
});

it('works with xhtml', function() {
	var text = transform('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html PUBLIC "!//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n<html xmlns="http://www.w3.org/1999/xhtml"><body><p id="test">Content</p></body></html>', "<$css value-of='#test'/>", {type: "text/xml"});
	expect(text).toBe("<p>Content</p>");
});

it('works with xml', function() {
	var text = transform('<?xml version="1.0" encoding="UTF-8"?><mydoc><elem id="test">value</elem></mydoc>', "<$css value-of='#test'/>\n");
	expect(text).toBe("value");
});

});
