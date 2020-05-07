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

});
