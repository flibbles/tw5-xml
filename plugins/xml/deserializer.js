/*\
module-type: tiddlerdeserializer
title: $:/plugins/flibbles/xml/deserializer.js
type: application/javascript

Deserializes xml files of type:
<tiddlers>
 <tiddler>
  <title>Some title</title>
  <text>body</text>
  <otherfield>field value</otherfield>
  ...
 </tiddler>
 ...
</tiddler>

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["text/xml"] = function(text,fields) {
	var xmldom = require("./xmldom");
	var doc = xmldom.getTextDocument(text);
	var attributes = xmldom.getProcessingInstructions(doc);
	if (!attributes.bundle) {
		return [basicXml(text,fields)];
	} else if (doc.error) {
		// It's malformed. Don't try to parse it.
		//results.push(basicXml(text,fields));
		return [];
	} else {
		return deserializeTiddlers(doc.documentElement);
	}
};

function basicXml(text, fields) {
	var rtn = $tw.utils.extend(Object.create(null), fields);
	rtn.text = text;
	rtn.type = "text/xml";
	return rtn;
};

function deserializeTiddlers(domNode) {
	var results = [];
	if (domNode.tagName === "tiddlers") {
		var incomingFields = domNode.firstChild;
		while (incomingFields) {
			if (incomingFields.tagName === "tiddler") {
				results.push(deserializeTiddler(incomingFields));
			}
			incomingFields = incomingFields.nextSibling;
		}
	} else if (domNode.tagName === "tiddler") {
		results.push(deserializeTiddler(domNode));
	}
	return results;
};

function deserializeTiddler(domNode) {
	var fields = Object.create(null);
	var node = domNode.firstChild;
	while (node) {
		if (node.tagName !== undefined) {
			if (node.childNodes.length != 1 || node.firstChild.nodeType == node.nodeType) {
				// This field appears to be written as unescaped XML.
				// Very well. We'll still take it.
				fields[node.tagName] = node.innerHTML;
			} else {
				fields[node.tagName] = node.textContent;
			}
		}
		node = node.nextSibling;
	}
	return fields;
};

})();
