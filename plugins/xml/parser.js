/*\
title: $:/plugins/flibbles/xml/xmlparser.js
type: application/javascript
module-type: parser

The XML parser displays itself as xml.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var XmlParser = function(type,text,options) {
	var template = getTemplate(text);
	if (template) {
		this.tree = [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string", value: template}
			},
			isBlock: true
		}];
	} else {
		this.tree = [{
			type: "codeblock",
			attributes: {
				code: {type: "string", value: text},
				language: {type: "string", value: "xml"}
			}
		}];
	}
};

function getTemplate(text) {
	var DOMParser = require("./xmldom").DOMParser;
	var parser = new DOMParser();
	var doc = parser.parseFromString(text, "text/xml");
	var node = doc.firstChild;
	while (node) {
		if (node.target === "tiddlywiki") {
			// TODO: This needs to be much more robust
			var regexp = /template\s*=\s*['"]([^'"]*)['"]/
			var match = node.data.match(regexp)
			if (match) {
				return match[1];
			}
		}
		node = node.nextSibling;
	}
	return undefined;
};

exports["text/xml"] = XmlParser;

})();
