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

function testFails(xml) {
	var errors = [];
	utils.monkeyPatch($tw.utils.Logger.prototype, "alert", function(msg) {errors.push(msg);}, function() {
		var rtn = importXml(xml, {title: "myFile.xml"});
		expect(errors).toEqual(["Unable to parse XML tiddler bundle in file: myFile.xml"]);
		expect(rtn.length).toBe(0);
	});
}

it("many", function() {
	var rtn = importXml(`<?xml version="1.0" encoding="ISO-8859-1"?>
<?tiddlywiki bundle?>
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
<?tiddlywiki bundle?>
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
	var rtn = importXml(prolog + `<?tiddlywiki bundle?><tiddlers>
 <tiddler><title>T1</title><text><A>Atext</A></text></tiddler>
</tiddlers>`);
 expect(rtn[0].text).toBe("<A>Atext</A>");

	rtn = importXml(prolog + `<?tiddlywiki bundle?><tiddler>
  <title>T1</title><text>text first<p>paragraph</p>Text</text></tiddler>`);
	expect(rtn[0].text).toBe("text first<p>paragraph</p>Text");
});

it("escaped xml", function() {
	var rtn = importXml(prolog + `<?tiddlywiki bundle?><tiddlers>
 <tiddler>
  <title>T1</title>
  <text>&lt;A&gt;Text&lt;/A&gt;</text>
 </tiddler>
</tiddlers>`);
	expect(rtn[0].text).toBe("<A>Text</A>");
});

it("empty fields", function() {
	var rtn = importXml(prolog + `<?tiddlywiki bundle?><tiddlers>
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

it("comments allowed", function() {
	var rtn = importXml(prolog + `<?tiddlywiki bundle?><!--comment--><tiddlers>
	<!-- 2 -->
	<tiddler>
	  <title>MyTitle</title>
	  <text>content: <!-- allowed --></text>
	  <!-- Below is tricky. One child. It is a comment. Not elem. not text. -->
	  <field><!-- extra --></field>
	</tiddler>
	<!-- 3 -->
	</tiddlers>`);
	expect(rtn.length).toBe(1);
	expect(Object.keys(rtn[0]).length).toBe(3);
	expect(rtn[0].title).toBe("MyTitle");
	expect(rtn[0].text).toBe("content: <!-- allowed -->");
	expect(rtn[0].field).toBe("<!-- extra -->");
});

it("CDATA allowed", function() {
	var rtn = importXml(prolog + `<?tiddlywiki bundle?><tiddlers>
	<tiddler>
		<title>MyTitle</title>
		<text><![CDATA[This is<br>Whatever I want]]></text>
		<field>  <![CDATA[wrapper included]]></field>
	</tiddler></tiddlers>`);
	expect(rtn.length).toBe(1);
	expect(Object.keys(rtn[0]).length).toBe(3);
	expect(rtn[0].title).toBe("MyTitle");
	expect(rtn[0].text).toBe("This is<br>Whatever I want");
	expect(rtn[0].field).toBe("  <![CDATA[wrapper included]]>");
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

it("still imports malformed but generic xml", function() {
	var text = "<anything><text><div>Stuff</span></text></anything>";
		rtn = importXml(text, {title: "myFile.xml"});
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("myFile.xml");
	expect(rtn[0].text).toBe(text);
	expect(rtn[0].type).toBe("text/xml");
});

it("emits error with malformed tiddlywiki bundle", function() {
	function testPasses(text) {
		var rtn = importXml(text, {title: "myFile.xml"});
		expect(rtn.length).toBe(1);
		expect(rtn[0].title).toBe("myFile.xml");
	};
	var xml = "<tiddlers><tiddler><title>MyTitle</title><text><div>Stuff</span></text></tiddler></tiddlers>";
	testFails("<?tiddlywiki bundle?>" + xml);
	// Different tests because FireFox drops the instruction on failure
	// so it's hard to tell that it's supposed to be a bundle.
	// We have to commit the cardinal sin of using regexp on XML.
	testFails("<?tiddlywiki goodies='stuff' bundle?>" + xml);
	testFails("<?tiddlywiki goodies='stuff' bundle?>" + xml);
	testFails("<?tiddlywiki goodies? bundle?>" + xml);
	testFails("<?tiddlywiki goodies='?stu>ff' bundle?>" + xml);
	testFails("<?tiddlywiki\ngoodies='?stu>ff' bundle otherstuff?>" + xml);
	testFails("<?tiddlywiki whatever?><?tiddlywiki bundle?>" + xml);
	testPasses("<?tiddlywikibundle?>" + xml);
	testPasses("<?tiddlywikistuff bundle?>" + xml);
	testPasses("<?tiddlywiki stuffbundle?>" + xml);
	testPasses("<?tiddlywiki bundlex?>" + xml);
	testPasses("<?tiddlywiki ?bundle?>" + xml);
	testPasses("<?tiddlywiki info ?><bundle>" + xml + "</bundle>");
});

it("emits error with well-formed bundle that violates specs", function() {
	testFails("<?tiddlywiki bundle?><tiddlers><title>A</title><text>text</text></tiddlers>");
	testFails("<?tiddlywiki bundle?><title>A</title>");
});

it("can include processing instructions", function() {
	var text = "<?tiddlywiki bundle?><tiddlers><tiddler><title>My Dogs</title><text><?tiddlywiki template='test'?><dog>Roofus</dog></text></tiddler></tiddlers>";
	var rtn = importXml(text);
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("My Dogs");
	expect(rtn[0].text).toBe("<?tiddlywiki template='test'?><dog>Roofus</dog>");
});

it("can load bundles given just the file extension", function() {
	var wiki = new $tw.Wiki();
		tiddlerFields = {title: "import.xml"};
		text = "<?tiddlywiki bundle?><tiddlers><tiddler><title>A</title><text>text</text></tiddler></tiddlers>";
		rtn = wiki.deserializeTiddlers(".xml",text,tiddlerFields);
	expect(rtn.length).toBe(1);
	expect(rtn[0].title).toBe("A");
	expect(rtn[0].text).toBe("text");
});

});
