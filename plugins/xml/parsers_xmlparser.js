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

var xmldom = require("../xmldom");

var XmlParser = function(type,text,options) {
	var doc = xmldom.getDocumentForText("text/xml", text);
	var templateValue = xmldom.getProcessingInstructions(doc).template;
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

exports["text/xml"] = XmlParser;

})();
