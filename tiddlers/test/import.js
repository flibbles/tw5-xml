/*\

Tests the XML deserializer.

\*/

describe("Importer", function() {

const prolog = '<?xml version="1.0" encoding="UTF-8"?>\n';

function importXml(xmlAsText, options) {
	var wiki = new $tw.Wiki();
	var tiddlerFields = { title: "import.xml", type: "text/xml" };
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

it("one", function() {
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
	var rtn = importXml(prolog + `<tiddler>
  <title>T1</title><text><A>Atext</A></text></tiddler>`);
 expect(rtn[0].text).toBe("<A>Atext</A>");

	rtn = importXml(prolog + `<tiddler>
  <title>T1</title><text>text first<p>paragraph</p>Text</text></tiddler>`);
	expect(rtn[0].text).toBe("text first<p>paragraph</p>Text");
});

it("escaped xml", function() {
	var rtn = importXml(prolog + `<tiddler>
  <title>T1</title>
  <text>&lt;A&gt;Text&lt;/A&gt;</text>
 </tiddler>`);
	expect(rtn[0].text).toBe("<A>Text</A>");
});

it("empty fields", function() {
	var rtn = importXml(prolog + `<tiddler>
	<title>MyTitle</title>
	<text></text>
	<something></something>
</tiddler>`);
	expect(rtn[0].title).toBe("MyTitle");
	expect(rtn[0].text).toBe("");
	expect(rtn[0].something).toBe("");
	expect(rtn[0].anything).toBe(undefined);
});

});
