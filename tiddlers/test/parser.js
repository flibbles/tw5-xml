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

function testInstruction(attrString, template, options) {
	options = options || {};
	var wiki = options.wiki || new $tw.Wiki();
	var text = options.text || '<?xml version="1.0" encoding="UTF-8"?>\n<?tiddlywiki '+attrString+'?>\n<dog name="Roofus" />';
	wiki.addTiddler({title: "test", type: "text/xml", text: text});
	wiki.addTiddler({title: template, text: '!!A template file\n\n<$xpath value-of="/dog/@name" />'});
	options.variables = Object.assign({currentTiddler: "test"}, options.variables);
	var output = wiki.renderTiddler("text/html", "test", options);
	expect(output).toBe('<h2 class="">A template file</h2><p>Roofus</p>');
};

it('renders xml with tiddler template declaration', function() {
	testInstruction('template="myTemplate"', "myTemplate");
	testInstruction("template='myTemplate'", "myTemplate");
	testInstruction('template="Bob\'s Template"', "Bob's Template");
	testInstruction('template=""""Bob\'s" Template"""', "\"Bob's\" Template");
	testInstruction('template=\'My "template"\'', 'My "template"');

	// Whitespace
	testInstruction('template   =  "X"', 'X');
	testInstruction('\n\ttemplate = "X"\n', 'X');
	testInstruction('\n\ttemplate = "X"\n', 'X');

	// HTML Decoding (which I've decided not to support)
	/*
	testInstruction("template='My &quot;template&quot;'", 'My "template"');
	testInstruction('template="This <carrot> bar"', "This <carrot> bar");
	testInstruction('template="This &lt;carrot&gt; bar"', "This <carrot> bar");
	testInstruction('template="Shake & Bake"', 'Shake & Bake');
	testInstruction('template="Shake &amp; Bake"', 'Shake & Bake');
	*/
});

it('renders xml with reference template arg', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "ref", text: 'anything'});
	testInstruction('template={{ref}}', 'anything', {wiki: wiki});
	testInstruction('template = {{ref!!text}}', 'anything', {wiki: wiki});
});

it('renders xml with macro arg', function() {
	var options = {variables: {mymacro: "thing"}};
	testInstruction('template=<<mymacro>>', 'thing', options);
});

it('renders xml with filtered arg', function() {
	testInstruction('template={{{[[my]addsuffix[template]]}}}', 'mytemplate');
});

it('ignores non template attributes', function() {
	var wiki = new $tw.Wiki();
	var text =  "<?tiddlywiki something='template'?>\n<dog>DogData</dog>";
	wiki.addTiddler({title: "test", type: "text/xml", text: text});
	var output = wiki.renderTiddler("text/vnd.tiddlywiki", "test");
	expect(output).toBe(text);

	// But it will still find a template attribute if it exists
	text = "<?tiddlywiki other='arg' X template=file Y?><dog name='Roofus'/>";
	testInstruction(null, "file", {wiki: wiki, text: text});
});

});
