/*\

Tests the wikimethods

\*/

describe("Wikimethods", function() {

var xmldom = require("$:/plugins/flibbles/xml/xmldom.js");

function test(fails, xml) {
	var doc = xmldom.getTextDocument(xml);
	if (fails) {
		expect(doc.error).toBeTruthy();
	} else {
		expect(doc.error).toBeFalsy();
	}
};

it('deals with malformed XML gracefully', function() {
	test(true, "<dogs><dog>Honey</dog><$dog>Backster</$dog></dogs>");
	test(true, "<   dogs><dog>Honey</dog></dogs>");
	test(true, "<dogs><dog>Honey</dog><dog>Backster</cat></dogs>");
	test(true, "<dogs xmlns='http://anything.com'><dog>Honey</dog><dog>Backster</cat></dogs>");
	test(true, "<dogs xmlns:x='http://anything.com'><x:dog>Honey</x:dog><x:dog>Backster</x:cat></x:dogs>");
});

it("doesn't emit false positives for errors", function() {
	// These cases might occur if the target XML document literally contains a
	// <parsererror> element.
	test(false, "<log><parsererror>Bad stuff</parsererror></log>");
	test(false, "<log xmlns:x='http://errorTypes.com'><x:parsererror>other stuff</x:parsererror></log>");
	test(false, "<log xmlns='http://errorTypes.com'><parsererror>namespace stuff</parsererror></log>");
});

it('describes tiddler when fails getting tiddler doc', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "test", type: "text/xml", text: "<$dogs/>"});
	var doc = xmldom.getTiddlerDocument(wiki, "test");
	expect(doc.error).toBe('Unable to parse XML in tiddler "test"');
});

it('caches documents correctly', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: "<dogs/>"});
	var doc1 = xmldom.getTiddlerDocument(wiki, "test.xml");
	var doc2 = xmldom.getTiddlerDocument(wiki, "test.xml");
	expect(doc1 == doc2).toBeTruthy();
	expect(doc1.documentElement.outerHTML).toBe("<dogs/>");
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: "<cats/>"});
	var doc3 = xmldom.getTiddlerDocument(wiki, "test.xml");
	expect(doc3 == doc2).toBeFalsy();
	expect(doc3.documentElement.outerHTML).toBe("<cats/>");
});

function testInstructions(xml) {
	var doc = xmldom.getTextDocument("<?tiddlywiki template='myFile'?>" + xml);
	var attributes = xmldom.getProcessingInstructions(doc);
	expect(attributes.template.type).toBe("string");
	expect(attributes.template.value).toBe("myFile");
};
it('detects processing instruction', function() {
	testInstructions("<doc/>");
});

it('gets processing instructions from malformed xml', function() {
	testInstructions("<doc><$badElem /></doc>");
	testInstructions("<doc><elem>content</doc>");
	testInstructions("<doc><elem><name>name</elem><elem><name>2</name></elem></doc>");
});

it('supports compareDocumentPosition in all implementations', function() {
	function compare(A, B, AtoB, BtoA, mask) {
		mask = mask || 0xFF
		expect(A.compareDocumentPosition(B) & mask).toBe(AtoB);
		expect(B.compareDocumentPosition(A) & mask).toBe(BtoA);
	};
	function test(AtoB, BtoA, xml) {
		var doc = xmldom.getTextDocument(xml);
		var A = doc.getElementById('A');
		var B = doc.getElementById('B');
		compare(A, B, AtoB, BtoA);
	};
	function testDoc(docToA, AtoDoc, xml) {
		var doc = xmldom.getTextDocument(xml);
		var A = doc.getElementById('A');
		compare(doc, A, docToA, AtoDoc);
	};
	test(20, 10, "<root id='A' ><child id='B' /></root>");
	test(4, 2, "<root><child id='A' /><child id='B' /></root>");
	test(4, 2, "<root><child><grand id='A'/></child><child id='B' /></root>");
	test(4, 2, "<root><child id='A' /><child><grand id='B'/></child></root>");
	testDoc(20, 10, "<root><child id='A' /></root>");
	var docA = xmldom.getTextDocument("<Astuff a='txt' b='txt'/>");
	var docB = xmldom.getTextDocument("<Bstuff />");
	compare(docA, docB, 33, 33, 0x39);
	compare(docA.documentElement, docB, 33, 33, 0x39);
	compare(docA.documentElement, docB.documentElement, 33, 33, 0x39);
});

});
