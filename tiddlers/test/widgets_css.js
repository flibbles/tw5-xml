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
	var text ="<div><p class='dog'>Ruffus</p><p class='b dog'>Muffin</p></div>";
	var output = transform(text,
		"<$css for-each='.dog'>(<<currentNode>>)</$css>");
	expect(output).toBe("<p>(Ruffus)(Muffin)</p>");

	output = transform(text,
		"<$css variable='name' for-each='.dog'><<name>> </$css>");
	expect(output).toBe("<p>Ruffus Muffin </p>");
});

});
