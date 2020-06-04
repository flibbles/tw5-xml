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

var xmldom = require("./xmldom");

exports["text/xml"] = function(text,fields) {
	var doc = xmldom.getDocumentForText("text/xml", text);
	var attributes = xmldom.getProcessingInstructions(doc);
	if (!doc.error || !probablyBundle(text)) {
		if (!attributes.bundle) {
			return [basicXml(text,fields)];
		} else if (!doc.error) {
			try {
				return deserializeTiddlers(doc.documentElement);
			} catch (e) {
				// proceed to error handling below. Ignore message for now.
			}
		}
	}
	// It's malformed. Don't try to parse it.
	var logger = new $tw.utils.Logger("XML deserializer"),
		error = $tw.language.getString(
			"flibbles/xml/Error/BundleParserError",
			{variables: { file: fields.title } });
	logger.alert(error);
	return [];
};

function probablyBundle(text) {
	return (text.match(/<\?tiddlywiki\s(?:[^\?]|\?[^>])*\bbundle[\s\?]/));
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
			} else if (incomingFields.tagName !== undefined) {
				throw "Expected <tiddler> element. Got <"+incomingFields.tagName+">";
			}
			incomingFields = incomingFields.nextSibling;
		}
	} else if (domNode.tagName === "tiddler") {
		results.push(deserializeTiddler(domNode));
	} else {
		throw "Root element must be <tiddlers> or <tiddler>";
	}
	return results;
};

function deserializeTiddler(domNode) {
	var fields = Object.create(null);
	var node = domNode.firstChild;
	while (node) {
		if (node.tagName !== undefined) {
			if (node.childNodes.length == 1) {
				if (node.firstChild.nodeType == 3 /* text */) {
					fields[node.tagName] = node.firstChild.data;
				} else if (node.firstChild.nodeType == 4 /* CDATA */) {
					fields[node.tagName] = node.textContent;
				} else {
					// Comment? It's a comment, right?
					fields[node.tagName] = node.innerHTML;
				}
			} else {
				// This field appears to be written as unescaped XML.
				// Very well. We'll still take it.
				fields[node.tagName] = node.innerHTML;
			}
		}
		node = node.nextSibling;
	}
	return fields;
};

})();
