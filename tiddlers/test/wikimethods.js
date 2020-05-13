/*\

Tests the wikimethods

\*/

describe("Wikimethods", function() {

function test(fails, xml) {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "test", type: "text/xml", text: xml});
	var doc = wiki.getTiddlerDocument("test");
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
	var doc = wiki.getTiddlerDocument("test");
	expect(doc.error).toBe('Unable to parse XML in tiddler "test"');
});

it('loads html fine', function() {
	var wiki = new $tw.Wiki();
	var html =  "<p>Content<br>Broken up into lines</p>";
	wiki.addTiddler({title: "test.html", type: "text/html", text: html});
	var doc = wiki.getTiddlerDocument("test.html");
	expect(doc.error).toBeFalsy();
	expect(doc.documentElement.textContent).toBe("ContentBroken up into lines");

	// But loading the same document as an XML will fail.
	wiki.addTiddler({title: "test.xml",  type: "text/xml", text:html});
	var doc = wiki.getTiddlerDocument("test.xml");
	expect(doc.error).toBeTruthy();
});

it('loads xml fine', function() {
	var wiki = new $tw.Wiki();
	var html =  "<custom><elem />Content</custom>";
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: html});
	var doc = wiki.getTiddlerDocument("test.xml");
	expect(doc.error).toBeFalsy();
	expect(doc.documentElement.textContent).toBe("Content");

	// But loading the same document as an HTML also works.
	// Because HTML is always lenient.
	wiki.addTiddler({title: "test.html",  type: "text/html", text:html});
	doc = wiki.getTiddlerDocument("test.html");
	expect(doc.error).toBeFalsy();
	expect(doc.documentElement.textContent).toBe("Content");
});

it('emits proper error if non DOM tiddler loaded', function() {
	var wiki = new $tw.Wiki();
	var expected = 'The tiddler "test" does not have a supported DOM type.';
	wiki.addTiddler({title: "test", text: "anything"});
	var doc = wiki.getTiddlerDocument("test");
	expect(doc).toBeUndefined();

	wiki.addTiddler({title: "test", text: "anything", type: "text/plain"});
	doc = wiki.getTiddlerDocument("test");
	expect(doc).toBeUndefined();
});

it('caches documents correctly', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: "<dogs/>"});
	var doc1 = wiki.getTiddlerDocument("test.xml");
	var doc2 = wiki.getTiddlerDocument("test.xml");
	expect(doc1 == doc2).toBeTruthy();
	expect(doc1.documentElement.outerHTML).toBe("<dogs/>");
	wiki.addTiddler({title: "test.xml", type: "text/xml", text: "<cats/>"});
	var doc3 = wiki.getTiddlerDocument("test.xml");
	expect(doc3 == doc2).toBeFalsy();
	expect(doc3.documentElement.outerHTML).toBe("<cats/>");
});

it('supports compareDocumentPosition in all implementations', function() {
	function getDoc(xml) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: "doc", type: "text/xml", text: xml});
		return wiki.getTiddlerDocument("doc");
	};
	function compare(A, B, AtoB, BtoA, mask) {
		mask = mask || 0xFF
		expect(A.compareDocumentPosition(B) & mask).toBe(AtoB);
		expect(B.compareDocumentPosition(A) & mask).toBe(BtoA);
	};
	function test(AtoB, BtoA, xml) {
		var doc = getDoc(xml);
		var A = doc.getElementById('A');
		var B = doc.getElementById('B');
		compare(A, B, AtoB, BtoA);
	};
	function testDoc(docToA, AtoDoc, xml) {
		var doc = getDoc(xml);
		var A = doc.getElementById('A');
		compare(doc, A, docToA, AtoDoc);
	};
	test(20, 10, "<root id='A' ><child id='B' /></root>");
	test(4, 2, "<root><child id='A' /><child id='B' /></root>");
	test(4, 2, "<root><child><grand id='A'/></child><child id='B' /></root>");
	test(4, 2, "<root><child id='A' /><child><grand id='B'/></child></root>");
	testDoc(20, 10, "<root><child id='A' /></root>");
	var docA = getDoc("<A a='txt' b='txt'/>");
	var docB = getDoc("<B />");
	compare(docA, docB, 33, 33, 0x39);
	compare(docA.documentElement, docB, 33, 33, 0x39);
	compare(docA.documentElement, docB.documentElement, 33, 33, 0x39);
});

});
