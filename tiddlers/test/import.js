/*\

Tests the XML deserializer.

\*/

var utils = require("test/utils");

describe("Importer", function() {

const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';

function importXml(xmlAsText, fields) {
	var wiki = new $tw.Wiki();
	var tiddlerFields = Object.assign({ title: "import.xml", type: "text/xml" }, fields);
	var options = { deserializer: undefined };
	return wiki.deserializeTiddlers("text/xml",xmlAsText,tiddlerFields,options);
};

it("many", function() {
	var rtn = importXml(`<?xml version="1.0" encoding="ISO-8859-1"?>
<tiddlers>
 <tiddler>
  <title>T1</title>
  <text>Body1</text>
 </tiddler>
 <tiddler>
  <title>T2</title>
  <text>Body2</text>
 </tiddler>
</tiddlers>`);
	expect(rtn.length).toBe(2);
	expect(Object.keys(rtn[0]).length).toBe(2);
	expect(rtn[0].title).toBe("T1");
	expect(rtn[0].text).toBe("Body1");
	expect(Object.keys(rtn[1]).length).toBe(2);
	expect(rtn[1].title).toBe("T2");
	expect(rtn[1].text).toBe("Body2");
});

it("single tiddler", function() {
	var rtn = importXml(`<?xml version="1.0" encoding="ISO-8859-1"?>
<tiddler>
 <title>Title</title>
 <text>Body</text>
</tiddler>`);
	expect(rtn.length).toBe(1);
	expect(Object.keys(rtn[0]).length).toBe(2);
	expect(rtn[0].title).toBe("Title");
	expect(rtn[0].text).toBe("Body");
});

it("unescaped xml", function() {
	var rtn = importXml(prolog + `<tiddlers>
 <tiddler><title>T1</title><text><A>Atext</A></text></tiddler>
</tiddlers>`);
 expect(rtn[0].text).toBe("<A>Atext</A>");

	rtn = importXml(prolog + `<tiddler>
  <title>T1</title><text>text first<p>paragraph</p>Text</text></tiddler>`);
	expect(rtn[0].text).toBe("text first<p>paragraph</p>Text");
});

it("escaped xml", function() {
	var rtn = importXml(prolog + `<tiddlers>
 <tiddler>
  <title>T1</title>
  <text>&lt;A&gt;Text&lt;/A&gt;</text>
 </tiddler>
</tiddlers>`);
	expect(rtn[0].text).toBe("<A>Text</A>");
});

it("empty fields", function() {
	var rtn = importXml(prolog + `<tiddlers>
	<tiddler>
		<title>MyTitle</title>
		<text></text>
		<something></something>
	</tiddler>
</tiddlers>`);
	expect(rtn[0].title).toBe("MyTitle");
	expect(rtn[0].text).toBe("");
	expect(rtn[0].something).toBe("");
	expect(rtn[0].anything).toBe(undefined);
});

it("unrelated xml file", function() {
	var text = prolog + "<dogs><dog>Roofus</dog></dogs>";
	var rtn = importXml(text, {title: "myDogs.xml", other: "value"});
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("myDogs.xml");
	expect(rtn[0].text).toBe(text);
	expect(rtn[0].type).toBe("text/xml");
	expect(rtn[0].other).toBe("value");
});

it("malformed xml file", function() {
	var text = "<dogs>Roofus</wrong",
		rtn = importXml(text, {title: "myDogs.xml"});
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("myDogs.xml");
	expect(rtn[0].text).toBe(text);
	expect(rtn[0].type).toBe("text/xml");
});

it("malformed tiddler document", function() {
	var text = "<tiddlers><tiddler><title>MyTitle</title><text><div>Stuff</span></text></tiddler></tiddlers>";
		rtn = importXml(text, {title: "myFile.xml"});
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("myFile.xml");
	expect(rtn[0].text).toBe(text);
	expect(rtn[0].type).toBe("text/xml");
});

it("can include processing instructions", function() {
	var text = "<tiddlers><tiddler><title>My Dogs</title><text><?tiddlywiki template='test'?><dog>Roofus</dog></text></tiddler></tiddlers>";
	var rtn = importXml(text);
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("My Dogs");
	expect(rtn[0].text).toBe("<?tiddlywiki template='test'?><dog>Roofus</dog>");
});

});
