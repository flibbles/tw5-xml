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
	var DOMParser = require("./xmldom").DOMParser;
	var parser = new DOMParser();
	var doc = parser.parseFromString(text, "text/xml");
	var elem = doc.documentElement;
	var results = [];
	if (elem.tagName === "tiddlers") {
		for (var i = 0; i < elem.childNodes.length; i++) {
			var incomingFields = elem.childNodes[i];
			if (incomingFields.tagName === "tiddler") {
				results.push(deserializeTiddler(incomingFields));
			}
		}
	} else if (elem.tagName === "tiddler") {
		results.push(deserializeTiddler(elem));
	}
	return results;
};

function deserializeTiddler(domNode) {
	var fields = Object.create(null);
	var node = domNode.firstChild;
	while (node) {
		if (node.tagName !== undefined) {
			if (node.childNodes.length > 1 || node.firstChild.nodeType == node.nodeType) {
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
