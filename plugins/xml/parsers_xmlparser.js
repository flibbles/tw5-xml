/*\
title: $:/plugins/flibbles/xml/parsers/xmlparser.js
type: application/javascript
module-type: parser

The XML parser displays itself as xml.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var XmlParser = function(type,text,options) {
	var templateValue = getTemplate(text);
	if (templateValue) {
		this.tree = [{
			type: "transclude",
			attributes: {
				tiddler: templateValue
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
	var DOMParser = require("../xmldom").DOMParser;
	var parser = new DOMParser();
	var doc = parser.parseFromString(text, "text/xml");
	var node = doc.firstChild;
	while (node) {
		if (node.target === "tiddlywiki") {
			var attr = $tw.utils.parseAttribute(node.data, 0);
			if (attr && attr.name === "template") {
				return attr;
			}
		}
		node = node.nextSibling;
	}
	return undefined;
};

exports["text/xml"] = XmlParser;

})();
